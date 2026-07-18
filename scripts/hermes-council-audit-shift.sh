#!/bin/bash
# hermes-council-audit-shift.sh
# Hermes 6h shift: audit the last 6 hours of Claude's work via the BFT council.
#
# Aggregates commits + Stripe events + deploys + PyPI uploads + meok.ai changes
# over the last 6 hours, then submits the bundle as a single council proposal
# for the 33 native + 4 external voices to review.
#
# Cron schedule: every 6 hours
#   0 */6 * * * /Users/nicholas/clawd/scripts/hermes-council-audit-shift.sh

set -uo pipefail

LOG=/tmp/hermes_council_audit.log
COUNCIL_PY="/Users/nicholas/clawd/sovereign-temple/external_council_voice.py"
COUNCIL_VENV="/Users/nicholas/clawd/sovereign-temple/.venv/bin/python"

# Source API keys from ~/.zshrc (cron context has no env)
if [ -f "$HOME/.zshrc" ]; then
  eval "$(grep -E '^export (STEPFUN|ANTHROPIC|DEEPSEEK|GOOGLE|MISTRAL|XAI|MINIMAX|DASHSCOPE|HUNYUAN)_API_KEY=' "$HOME/.zshrc" 2>/dev/null || true)"
fi

echo "" >> $LOG
echo "═══════════════════════════════════════════════════════════════" >> $LOG
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Hermes council-audit shift starting" >> $LOG

# Council must be reachable
if ! curl -s -m 5 -o /dev/null -w "%{http_code}" http://localhost:3101/health | grep -q "200"; then
  echo "[FAIL] SOV3 council unreachable — exiting" >> $LOG
  exit 1
fi

# ── Gather last 6 hours of activity across all clawd repos ──────────────────

SINCE="6 hours ago"
ACTIVITY_FILE=$(mktemp)

{
  echo "=== Git activity (last 6h across clawd repos) ==="
  for REPO_DIR in /Users/nicholas/clawd/meok /Users/nicholas/clawd/sovereign-temple /Users/nicholas/clawd; do
    if [ -d "$REPO_DIR/.git" ]; then
      cd "$REPO_DIR" 2>/dev/null
      COMMITS=$(git log --since="$SINCE" --oneline 2>/dev/null | head -25)
      if [ -n "$COMMITS" ]; then
        echo ""
        echo "Repo: $(basename $REPO_DIR)"
        echo "$COMMITS"
      fi
    fi
  done

  echo ""
  echo "=== Stripe events (last 6h) ==="
  # If stripe CLI configured, list recent events; otherwise summarize via API
  if [ -n "${STRIPE_SECRET_KEY:-}" ] && command -v stripe >/dev/null 2>&1; then
    stripe events list --limit 10 2>/dev/null | head -30 || echo "(stripe CLI not authed)"
  else
    echo "(stripe CLI not configured — skipping)"
  fi

  echo ""
  echo "=== Vercel deploys (last 6h) ==="
  TOKEN=$(cat ~/Library/Application\ Support/com.vercel.cli/auth.json 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin)['token'])" 2>/dev/null)
  if [ -n "$TOKEN" ]; then
    curl -s "https://api.vercel.com/v6/deployments?teamId=team_4IkNIyYl7TtEOi9aoz17SUO7&limit=10" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null | \
      python3 -c "
import json,sys,datetime
try:
  d=json.load(sys.stdin)
  cutoff=(datetime.datetime.now()-datetime.timedelta(hours=6)).timestamp()*1000
  for dep in d.get('deployments', [])[:10]:
    if dep.get('createdAt',0) > cutoff:
      ts=datetime.datetime.fromtimestamp(dep.get('createdAt',0)/1000).strftime('%H:%M:%S')
      print(f\"  {dep.get('state','?'):10s} {dep.get('url','?'):50s} {ts}\")
except: pass" 2>/dev/null
  fi

  echo ""
  echo "=== PyPI uploads (from queue log) ==="
  tail -20 /tmp/pypi_publish_queue.log 2>/dev/null || echo "(no queue log)"

  echo ""
  echo "=== Commits flagged by post-commit council ==="
  tail -20 /tmp/council_commits.log 2>/dev/null || echo "(no log yet)"

  echo ""
  echo "=== Recent council rejections (need human attention) ==="
  tail -30 /tmp/council_rejects.log 2>/dev/null || echo "(no rejections — all clear)"

} > "$ACTIVITY_FILE"

ACTIVITY=$(cat "$ACTIVITY_FILE")
rm -f "$ACTIVITY_FILE"

# Skip the shift entirely if nothing happened in 6h
if [ -z "$(echo "$ACTIVITY" | grep -E '(Repo:|state.*READY|approve|reject)' )" ]; then
  echo "[skip] no activity in last 6h" >> $LOG
  exit 0
fi

# ── Submit to council ───────────────────────────────────────────────────────

TITLE="Hermes 6h audit — $(date '+%Y-%m-%d %H:%M')"
RESULT=$($COUNCIL_VENV $COUNCIL_PY \
  --title "$TITLE" \
  --description "$ACTIVITY" \
  --action-type "hermes_6h_audit" 2>>$LOG)

echo "$RESULT" >> $LOG

# Parse JSON via a separate script (avoids bash 3.2 quoting issues)
PARSER=/Users/nicholas/clawd/sovereign-temple/scripts/_council_parse.py
SUMMARY=$(printf '%s' "$RESULT" | python3 $PARSER 2>/dev/null || printf "?\n?\n?\n")
MAJORITY=$(printf '%s' "$SUMMARY" | sed -n '1p')
PROP=$(printf '%s' "$SUMMARY" | sed -n '2p')
COUNTS=$(printf '%s' "$SUMMARY" | sed -n '3p')

echo "[$(date '+%H:%M:%S')] shift result: $MAJORITY ($COUNTS) proposal=$PROP" >> $LOG

# Push reject summary to WhatsApp/Slack later (Hermes already has the bridges)
if [ "$MAJORITY" = "reject" ]; then
  echo "[ALERT] council rejected last 6h of work — see $LOG" >> /tmp/council_rejects.log
fi

exit 0
