#!/bin/sh
# Stranger re-run pack. Prints the fields a card must carry for an exact number.
# Does not invent a seed. Does not mill Hub listings.
set -eu
CARD="${1:-}"
if [ -z "$CARD" ]; then
  echo "usage: packages/repro/repro.sh <card.json>" >&2
  exit 2
fi
python3 - "$CARD" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
d = json.loads(p.read_text())
card = d.get("card") or d
need = ["schema", "surface", "as_of", "sha256"]
print("file", p)
for k in need:
    print(k, card.get(k))
print("harness_version", card.get("harness_version") or "UNCHECKABLE")
print("seed", card.get("seed") or "UNCHECKABLE")
print("dataset_hash", card.get("dataset_hash") or card.get("payload", {}).get("dataset_hash") or "UNCHECKABLE")
print("grader_version", card.get("grader_version") or "UNCHECKABLE")
print("honesty: missing fields stay UNCHECKABLE. Do not reverse-engineer a number and call it a re-run.")
PY
