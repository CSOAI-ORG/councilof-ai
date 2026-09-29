#!/usr/bin/env bash
# Runs run.sh twice from scratch and records whether results.jsonl is byte-identical.
set -euo pipefail
LANE="$(cd "$(dirname "$0")" && pwd)"; cd "$LANE"
bash run.sh > work_run1.log 2>&1; h1=$(sha256sum results.jsonl | cut -d' ' -f1)
bash run.sh > work_run2.log 2>&1; h2=$(sha256sum results.jsonl | cut -d' ' -f1)
{ echo "run 1 results.jsonl sha256 $h1"; echo "run 2 results.jsonl sha256 $h2";
  [ "$h1" = "$h2" ] && echo "byte-identical: yes" || echo "byte-identical: NO"; } > determinism.log
rm -f work_run1.log work_run2.log
tools/venv/bin/python make_report.py "$LANE" >/dev/null
cat determinism.log
