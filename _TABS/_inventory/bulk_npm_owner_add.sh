#!/usr/bin/env bash
# bulk_npm_owner_add.sh — reclaim the 192 csga_global-squatted npm packages.
#
# What it does:
#   For each squatted package name, runs `npm owner add meok-ai-labs <pkg>` to add
#   the new owner. Once you have admin on the package (either via this command if
#   you already have write access, or after the abuse report is processed), you
#   can then `npm deprecate` the old version + `npm publish` the new one.
#
# REQUIREMENTS:
#   1. Logged in to npm CLI as a user who already has owner access to the packages
#      (i.e. you ran `npm login` against the meok-ai-labs account, OR you have
#      transfer access to the csga_global account).
#   2. jq installed (for the JSONL parse). Or python3 as fallback.
#
# Usage:
#   ./bulk_npm_owner_add.sh                     # dry-run by default
#   ./bulk_npm_owner_add.sh --execute           # actually add owners
#   ./bulk_npm_owner_add.sh --only meok-sdk-ts  # just one package
#   ./bulk_npm_owner_add.sh --user me-username  # use a different npm user
#
# Output:
#   - Per-package result: OK / ALREADY-OWNER / DENIED / NOT-FOUND
#   - Summary at end: claimed=N skipped=M failed=K
#
# IMPORTANT: this script does NOT unpublish. After it runs, you should:
#   1. Run `npm owner ls <pkg>` on the most important ones to verify
#   2. Run `npm deprecate <pkg> 'Use meok-ai-labs version'` (with your message)
#   3. Publish the new version under your new identity

set -uo pipefail

AUDIT_FILE="${AUDIT_FILE:-/Users/nicholas/clawd/_TABS/_inventory/MULTI_REGISTRY_AUDIT.jsonl}"
NEW_OWNER="${NEW_OWNER:-meok-ai-labs}"
EXECUTE=""
ONLY=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) EXECUTE="yes"; shift ;;
    --only) ONLY="$2"; shift 2 ;;
    --user) NEW_OWNER="$2"; shift 2 ;;
    --audit) AUDIT_FILE="$2"; shift 2 ;;
    -h|--help) sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -f "$AUDIT_FILE" ]]; then
  echo "Audit file not found: $AUDIT_FILE" >&2
  echo "Run: python3 /tmp/multi_registry_audit.py" >&2
  exit 1
fi

if [[ -z "$EXECUTE" ]]; then
  echo "============================================================"
  echo "DRY RUN — pass --execute to actually claim packages"
  echo "============================================================"
fi

# Extract csga_global-squatted package names from the audit JSONL
SQUATS=$(python3 -c "
import json, sys
with open('$AUDIT_FILE') as f:
    for line in f:
        d = json.loads(line)
        if d.get('phase') == 'npm' and d.get('csga_publisher'):
            print(d['name'])
" | sort -u)

if [[ -n "$ONLY" ]]; then
  SQUATS=$(echo "$SQUATS" | grep -F "$ONLY" || true)
fi

TOTAL=$(echo "$SQUATS" | wc -l | tr -d ' ')
echo "Will claim $TOTAL squatted packages as '$NEW_OWNER':"
echo ""

OK=0
SKIP=0
FAIL=0
NOT_FOUND=0
i=0
for pkg in $SQUATS; do
  i=$((i + 1))
  printf "[%3d/%d] %-45s " "$i" "$TOTAL" "$pkg"
  if [[ -z "$EXECUTE" ]]; then
    echo "(dry-run)"
    continue
  fi
  # npm owner add is non-destructive — adds you as owner, doesn't remove old.
  # Use --no-color / --json for clean output if supported.
  OUT=$(npm owner add "$NEW_OWNER" "$pkg" 2>&1)
  RC=$?
  if [[ $RC -eq 0 ]]; then
    # npm prints "+meok-ai-labs" or "added 1 user" on success; treat as OK
    echo "OK"
    OK=$((OK + 1))
  elif echo "$OUT" | grep -qiE "already (a )?(maintainer|owner)|already added"; then
    echo "ALREADY-OWNER"
    SKIP=$((SKIP + 1))
  elif echo "$OUT" | grep -qiE "not found|E404"; then
    echo "NOT-FOUND"
    NOT_FOUND=$((NOT_FOUND + 1))
  elif echo "$OUT" | grep -qiE "permission denied|denied|E401|E403"; then
    echo "DENIED (no access to this package from this npm account)"
    FAIL=$((FAIL + 1))
  else
    echo "FAIL: $OUT" | head -c 100
    echo
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "============================================================"
if [[ -z "$EXECUTE" ]]; then
  echo "DRY RUN COMPLETE. Pass --execute to actually claim."
  echo "Total packages that would be claimed: $TOTAL"
else
  echo "BULK OWNER-ADD COMPLETE"
  echo "  claimed:        $OK"
  echo "  already-owner:  $SKIP"
  echo "  not-found:      $NOT_FOUND"
  echo "  denied/failed:  $FAIL"
  echo ""
  if [[ $FAIL -gt 0 ]]; then
    echo "⚠️  $FAIL packages denied — those are the ones where you don't have"
    echo "   access. Two paths:"
    echo "   (a) re-run after transferring ownership via npmjs.com → package settings"
    echo "   (b) file the abuse report (clawd/_TABS/_inventory/NPM_ABUSE_REPORT_csga_global.md)"
    echo "       to force npm to transfer them"
  fi
  if [[ $OK -gt 0 ]]; then
    echo ""
    echo "Next step — deprecate the old versions and publish new ones:"
    echo "   ./bulk_npm_deprecate.sh --execute"
    echo "   # then re-publish meok-sdk-ts@3.2.0 + meok-setup@1.2.0 from the meok-ai-labs account"
  fi
fi
echo "============================================================"
