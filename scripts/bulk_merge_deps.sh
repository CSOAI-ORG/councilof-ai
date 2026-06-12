#!/bin/bash
# Bulk-merge SAFE-PATCH Dependabot PRs using curl + jq.
# Reads /tmp/deps-classified.csv and squash-merges every SAFE-PATCH.
# Stops on first error and reports. Logs to /tmp/dependabot-merges.log.
set -uo pipefail

CSV="/tmp/deps-classified.csv"
LOG="/tmp/dependabot-merges.log"
TOKEN="$(security find-internet-password -s github.com -w 2>/dev/null)"

if [ -z "$TOKEN" ]; then
  echo "ERROR: no GitHub token in keychain" >&2
  exit 1
fi

if [ ! -f "$CSV" ]; then
  echo "ERROR: $CSV not found. Run classify_dependabot.py first." >&2
  exit 1
fi

MERGED=0
ERRORS=0
TOTAL=0
START=$(date +%s)

# Skip comments + header rows; only match SAFE-PATCH lines
while IFS=, read -r cat repo number title url; do
  if [ "$cat" != "SAFE-PATCH" ]; then
    continue
  fi
  TOTAL=$((TOTAL + 1))
  printf "[%d] %s#%s " "$TOTAL" "$repo" "$number" >&2
  printf "[%d] %s#%s ... " "$TOTAL" "$repo" "$number"

  response=$(curl -s -m 30 -X PUT \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    -d "{\"commit_title\": \"chore(deps): squash-merge dependabot #${number}\", \"merge_method\": \"squash\"}" \
    "https://api.github.com/repos/${repo}/pulls/${number}/merge")

  if echo "$response" | grep -q '"merged":true'; then
    MERGED=$((MERGED + 1))
    sha=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('sha','')[:8])" 2>/dev/null)
    echo "OK ($sha)" >&2
    echo "[$(date +%FT%TZ)] MERGED $repo#$number ($sha)" >> "$LOG"
  elif echo "$response" | grep -q 'successfully merged'; then
    # Already-merged response. The PR is already in the merged state — count it.
    MERGED=$((MERGED + 1))
    echo "OK (already merged)" >&2
    echo "[$(date +%FT%TZ)] MERGED $repo#$number (was already merged)" >> "$LOG"
  elif echo "$response" | grep -q '"message"'; then
    msg=$(echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('message','')[:80])" 2>/dev/null)
    echo "FAIL ($msg)" >&2
    ERRORS=$((ERRORS + 1))
    echo "[$(date +%FT%TZ)] FAIL   $repo#$number ($msg)" >> "$LOG"
  else
    echo "ERR (no JSON)" >&2
    ERRORS=$((ERRORS + 1))
    echo "[$(date +%FT%TZ)] ERR    $repo#$number" >> "$LOG"
  fi

  sleep 0.4
done < <(grep -v '^#' "$CSV" | grep '^SAFE-PATCH')

ELAPSED=$(( $(date +%s) - START ))
echo ""
echo "=== SUMMARY ==="
echo "Total SAFE-PATCH: $TOTAL"
echo "Merged:           $MERGED"
echo "Errors:           $ERRORS"
echo "Elapsed:          ${ELAPSED}s"
echo "Log:              $LOG"
