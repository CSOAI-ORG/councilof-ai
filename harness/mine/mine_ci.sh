#!/bin/bash
# HY.2(d) — CI law from mine findings. Fails on: test regression, 16-axis leak,
# canon-coverage < 14/14, signature failure. Runs after every learn.
#
# The PASS banner used to be a hardcoded string — "tests 23/23 · coverage 14/14 · no
# leaks · signatures valid" — printed regardless of the real counts. It was latent only
# because the gate was failing; it would have become a false pass the moment the tests
# were repaired. Every number below is now read out of the run that just happened, and a
# count that could not be read prints as `unknown`, never as a success.
set -uo pipefail
FAIL=0
MINE="${MINE_ROOT:-$HOME/.grokbot/harness/mine}"
REPO_MINE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_OUT=/tmp/mine-ci-tests.out
SIGN_OUT=/tmp/mine-ci-sign.out
: > "$SIGN_OUT"; rm -f /tmp/mine-ci-fail

# 1) tests — counts come from the suite's own RESULT line
if ! python3 "$MINE/test_mine.py" > "$TESTS_OUT" 2>&1; then
  echo "FAIL: mine tests" ; FAIL=1
fi
RESULT_LINE=$(grep -E '^RESULT: ' "$TESTS_OUT" | tail -1)
if [ -z "$RESULT_LINE" ]; then
  # No RESULT line means the suite died before finishing — say so, never guess a count.
  T_PASS="unknown"; T_FAIL="unknown"; T_SKIP="unknown"; T_TOTAL="unknown"
  echo "FAIL: mine tests produced no RESULT line (suite crashed before finishing)"
  echo "  last line: $(tail -1 "$TESTS_OUT")"
  FAIL=1
else
  T_PASS=$(echo "$RESULT_LINE" | sed -n 's/.*RESULT: \([0-9]*\) passed.*/\1/p')
  T_FAIL=$(echo "$RESULT_LINE" | sed -n 's/.*, \([0-9]*\) failed.*/\1/p')
  T_SKIP=$(echo "$RESULT_LINE" | sed -n 's/.*, \([0-9]*\) unmeasurable.*/\1/p')
  T_SKIP=${T_SKIP:-0}
  T_TOTAL=$(( T_PASS + T_FAIL + T_SKIP ))
fi

# 2) 16-axis leak (any public-facing artifact)
if grep -rli "16 axes\|sixteen axes" "$MINE/mine-summary.md" "$MINE/mine-learnt.csv" 2>/dev/null; then
  echo "FAIL: 16-axis leak" ; FAIL=1 ; LEAKS="FOUND"
else
  LEAKS="none"
fi

# 3) canon coverage must be 14/14
COV=$(python3 -c "
import json; d=json.load(open('$MINE/mine-learnt.json'))
cc=d.get('canon_coverage',{}); print(f\"{sum(1 for v in cc.values() if v.get('measured'))}/{len(cc)}\")
" 2>/dev/null)
COV=${COV:-unknown}
if [ "$COV" != "14/14" ]; then echo "FAIL: canon coverage $COV != 14/14"; FAIL=1; fi

# 4) all signed artifacts verify (spot: index + axis17) — count what actually verified
SIGS=$(python3 - <<'PYEOF' 2>>"$SIGN_OUT"
import json, os, sys
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
A17 = os.path.expanduser("~/.grokbot/harness/measure/axis17")
ok = bad = 0
for f in ["csoai-index-v1.json", "axis17-human-baseline.json"]:
    try:
        d = json.load(open(os.path.join(A17, f)))
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(d["pubkey"]))
        if "cells" in d:
            for c in d["cells"]:
                pub.verify(bytes.fromhex(c["signature"]),
                           json.dumps(c["body"], sort_keys=True, separators=(",", ":")).encode())
                ok += 1
        else:
            pub.verify(bytes.fromhex(d["signature"]),
                       json.dumps(d["body"], sort_keys=True, separators=(",", ":")).encode())
            ok += 1
    except Exception as e:
        bad += 1
        print(f"signature failure in {f}: {type(e).__name__}: {e}", file=sys.stderr)
print(f"{ok}/{ok + bad}")
sys.exit(1 if bad else 0)
PYEOF
) || echo "FAIL: signatures" >> /tmp/mine-ci-fail
SIGS=${SIGS:-unknown}
if [ -f /tmp/mine-ci-fail ]; then FAIL=1; cat "$SIGN_OUT"; rm -f /tmp/mine-ci-fail; fi

# 5) the kernel anchor's recorded status must be the status its TSR bytes actually carry.
#    `tsa: {"status": "ok"}` once sat beside 50 bytes of ASN.1 rejection, because the
#    status was decided by "bytes came back" rather than by parsing them.
ANCHOR="$REPO_MINE/cards/kernel-anchor.json"
if [ -f "$ANCHOR" ]; then
  if python3 "$REPO_MINE/tsr_status.py" --anchor "$ANCHOR" > /tmp/mine-ci-anchor.out 2>&1; then
    ANCHOR_STATE=$(python3 -c "import json;d=json.load(open('$ANCHOR'));print(d['tsa']['status'])" 2>/dev/null)
    ANCHOR_STATE="recorded=${ANCHOR_STATE:-unknown} matches bytes"
  else
    echo "FAIL: kernel-anchor status does not match its TSR bytes"; cat /tmp/mine-ci-anchor.out; FAIL=1
    ANCHOR_STATE="MISMATCH"
  fi
else
  ANCHOR_STATE="absent"
fi

SUMMARY="tests ${T_PASS}/${T_TOTAL} passed (${T_FAIL} failed, ${T_SKIP} unmeasurable) · coverage ${COV} · leaks ${LEAKS} · signatures ${SIGS} verified · anchor ${ANCHOR_STATE}"
if [ $FAIL -eq 0 ]; then
  echo "MINE CI: PASS ($SUMMARY)"
  [ "${T_SKIP}" != "0" ] && echo "  NOTE: ${T_SKIP} check(s) were UNMEASURABLE on this machine — a pass with a hole in it, not a clean sheet."
  exit 0
else
  echo "MINE CI: FAIL ($SUMMARY)"
  exit 1
fi
