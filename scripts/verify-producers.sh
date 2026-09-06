#!/usr/bin/env bash
# verify-producers.sh — run every deterministic producer, fail if any output moves.
# Reads docs/operations/PRODUCERS.json. Exit 0 = outputs match the producer;
# exit 1 = an output drifted (publisher changed bytes without its producer).
# This is the guard that would have caught the four agent-card breaks at once.
set -euo pipefail
cd "$(dirname "$0")/.."

RUNS=$(
  python3 - <<'PY'
import json, os
d = json.load(open("docs/operations/PRODUCERS.json"))
for p in d["producers"]:
    if not p.get("deterministic", False):
        continue  # live-probe rows are checked by their own lane workflow
    print(f"{p['output']}\t{p['command']}\t{p.get('cwd', '.')}")
PY
)
FAILED=0
while IFS=$'\t' read -r output command cwd; do
  [ -z "$output" ] && continue
  echo "== producer: $command -> $output"
  ( cd "$cwd" && $command ) || { echo "  PRODUCER FAILED: $command"; FAILED=1; continue; }
  if git diff --quiet -- "$output"; then
    echo "  ok: output unchanged"
  else
    echo "  DRIFT: $output changed (re-run producer and commit its output, or fix the producer)"
    FAILED=1
  fi
done <<< "$RUNS"
echo "== verify-producers: $([ $FAILED -eq 0 ] && echo PASS || echo FAIL)"
exit $FAILED
