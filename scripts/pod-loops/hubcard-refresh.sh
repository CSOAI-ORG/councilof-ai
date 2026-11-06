#!/bin/bash
# 05:00Z daily: refresh the 16-point hubcard block on the loop-fed datasets via the repo's own
# scripts/hf/hf-org-card.py --hubcard ... --push. Runs only if the pod holds an HF token; otherwise the
# reason is recorded and nothing is attempted (the script needs HfApi reads even for a dry derive).
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp hubcard-refresh || exit 0
DATASETS="csoai/x402-bazaar-conformance csoai/x402-settlement-census csoai/revenue-history"
if ! hf_token_present; then
  log hubcard-refresh "SKIPPED no HF token on this pod ($LANES/.secrets/hf_token absent, HF_TOKEN empty); hf-org-card.py --hubcard needs HfApi read+write"
  exit 0
fi
cd "$REPO" && git fetch -q origin master && git merge -q --ff-only origin/master 2>/dev/null
log hubcard-refresh "START $(git -C "$REPO" log --oneline -1 | cut -c1-60) targets=$DATASETS"
python3 scripts/hf/hf-org-card.py --hubcard $DATASETS --push --out "$OUT/hubcard" > "$LOGS/hubcard-refresh.run.log" 2>&1
rc=$?
log hubcard-refresh "RESULT rc=$rc | $(grep -E '/100|FAIL|Error|error' "$LOGS/hubcard-refresh.run.log" | tail -3 | tr '\n' ' | ' | cut -c1-400)"
