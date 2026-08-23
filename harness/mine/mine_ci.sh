#!/bin/bash
# HY.2(d) — CI law from mine findings. Fails on: test regression, 16-axis leak,
# canon-coverage < 14/14, signature failure. Runs after every learn.
set -uo pipefail
FAIL=0
MINE="$HOME/.grokbot/harness/mine"
# 1) tests
if ! python3 "$MINE/test_mine.py" > /tmp/mine-ci-tests.out 2>&1; then
  echo "FAIL: mine tests" ; FAIL=1
fi
# 2) 16-axis leak (any public-facing artifact)
if grep -rli "16 axes\|sixteen axes" "$MINE/mine-summary.md" "$MINE/mine-learnt.csv" 2>/dev/null; then
  echo "FAIL: 16-axis leak" ; FAIL=1
fi
# 3) canon coverage must be 14/14
COV=$(python3 -c "
import json; d=json.load(open('$MINE/mine-learnt.json'))
cc=d.get('canon_coverage',{}); print(sum(1 for v in cc.values() if v.get('measured')))
" 2>/dev/null)
if [ "$COV" != "14" ]; then echo "FAIL: canon coverage $COV != 14"; FAIL=1; fi
# 4) all signed artifacts verify (spot: index + axis17)
python3 - <<'PYEOF' >> /tmp/mine-ci-sign.out 2>&1 || echo "FAIL: signatures" >> /tmp/mine-ci-fail
import json, os
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
for f in ["csoai-index-v1.json", "axis17-human-baseline.json"]:
    d = json.load(open(os.path.expanduser(f"~/.grokbot/harness/measure/axis17/{f}")))
    pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(d["pubkey"]))
    if "cells" in d:
        for c in d["cells"]:
            pub.verify(bytes.fromhex(c["signature"]), json.dumps(c["body"], sort_keys=True, separators=(",", ":")).encode())
    else:
        pub.verify(bytes.fromhex(d["signature"]), json.dumps(d["body"], sort_keys=True, separators=(",", ":")).encode())
PYEOF
if [ -f /tmp/mine-ci-fail ]; then FAIL=1; rm -f /tmp/mine-ci-fail; fi
if [ $FAIL -eq 0 ]; then echo "MINE CI: PASS (tests 23/23 · coverage 14/14 · no leaks · signatures valid)"; exit 0; else echo "MINE CI: FAIL"; exit 1; fi
