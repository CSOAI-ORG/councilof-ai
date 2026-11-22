#!/bin/bash
# hitl-probe-weekly.sh — Sundays 05:30Z: the MCP elicitation decline/cancel probe, re-run on the same panel.
#
#   reads    scripts/hitl/hitl_probe.py + hitl_fake_server.py from $REPO at master (lib.sh REPO_SPARSE carries
#            scripts/hitl), and the 2026-09-22 MCP-registry harvest bank the 2026-09-24 pilot used, located BY
#            ITS BYTES: sha256 5043ce0b4d69b712389fc13cd990e0b1af1d3415ebd472c446b250810563e3f1 (the pilot
#            artifact's population.bank_sha256). HITL_BANK names the file; otherwise $OUT/effect-binding-server-*
#            is searched for it. A bank with other bytes is a different population and is refused.
#   runs     1. `controls` — the ten local fake-server controls. If they do not all pass, the instrument is not
#               trusted this week: the pilot is NOT run (HALT line).
#            2. `pilot` — the same seeded panel as 2026-09-24 (seed 20260924, 240 random + 60 registry-text-hint,
#               bounded at 300 by the probe itself), read-only calls, >= 2 s per host, a 429 stops the host.
#            3. `artifact` — the draft artifact for this week, from this week's run directory only.
#   writes   $OUT/hitl-probe/<date>/{controls/,pilot/,hitl-elicitation-probe-<date>.json,env.json} and ONE line in
#            $LOGS/hitl-probe-weekly.log per run. $LOGS/hitl-probe-weekly.run.log holds this run's stdout/stderr.
#   populations  each week is its own directory and its own artifact; weeks are never pooled here, never mixed
#            with the published 2026-09-24 pilot, and nothing here is a board axis.
#
# Publishes nothing, signs nothing, pushes no branch, sends no credential and never answers "accept" to any
# elicitation (the probe cannot: it has no value to send). httpx is the probe's one dependency: the system
# python is used when it has it, else a venv under /root/lanes/hitl (container disk, lost when the pod stops,
# rebuilt here). The httpx version actually used is recorded in env.json — recorded, not pinned.
# THE STAMP IS THE SCHEDULER'S: `stamp hitl-probe-weekly` on the scheduler line, --now here.
set -u
. "$(dirname "$0")/lib.sh"
exec 7>"$STATE/hitl-probe-weekly.lock"
flock -n 7 || { log hitl-probe-weekly "SKIP previous run still holds the lock"; exit 0; }
[ "${1:-}" = "--now" ] || stamp hitl-probe-weekly || exit 0

BANK_SHA=5043ce0b4d69b712389fc13cd990e0b1af1d3415ebd472c446b250810563e3f1
D=$(today)
W=$OUT/hitl-probe/$D
RUNLOG=$LOGS/hitl-probe-weekly.run.log
VENV=${HITL_VENV:-/root/lanes/hitl/.venv}
line() { log hitl-probe-weekly "$* date=$D"; }
mkdir -p "$W"
: >"$RUNLOG"

repo_sparse_ensure scripts/hitl >>"$RUNLOG" 2>&1 || { line "FAIL could not extend \$REPO sparse set"; exit 2; }
git -C "$REPO" fetch -q origin master >>"$RUNLOG" 2>&1 && git -C "$REPO" merge -q --ff-only origin/master >>"$RUNLOG" 2>&1 \
  || { line "FAIL \$REPO could not fast-forward to origin/master; not probing with stale code"; exit 2; }
rev=$(git -C "$REPO" rev-parse --short HEAD)
PROBE=$REPO/scripts/hitl/hitl_probe.py
[ -s "$PROBE" ] || { line "FAIL $PROBE absent at master=$rev (install after master carries 7ab21284e)"; exit 2; }

# the probe's one dependency
PY=python3
if ! python3 -c 'import httpx' 2>/dev/null; then
  if [ ! -x "$VENV/bin/python" ]; then
    python3 -m venv "$VENV" >>"$RUNLOG" 2>&1 && "$VENV/bin/pip" install -q httpx >>"$RUNLOG" 2>&1 \
      || { line "FAIL could not build $VENV with httpx"; exit 2; }
  fi
  PY=$VENV/bin/python
fi
"$PY" - "$W/env.json" "$rev" "$BANK_SHA" <<'PY' >>"$RUNLOG" 2>&1
import json, platform, sys, httpx
json.dump({"python": platform.python_version(), "httpx": httpx.__version__, "master": sys.argv[2],
           "bank_sha256_required": sys.argv[3], "note": "httpx version recorded, not pinned"},
          open(sys.argv[1], "w"), indent=1)
PY

# 1. controls gate the instrument
"$PY" "$PROBE" controls "$W/controls" >>"$RUNLOG" 2>&1; crc=$?
if [ $crc -ne 0 ]; then line "HALT controls rc=$crc — instrument not trusted this week; pilot not run master=$rev out=$W"; exit 3; fi

# 2. the bank, by its bytes
BANK=${HITL_BANK:-}
if [ -z "$BANK" ]; then
  for f in $(find "$OUT"/effect-binding-server-* -maxdepth 2 -type f -name '*.json' -size -512M 2>/dev/null | sort); do
    [ "$(sha256sum "$f" | cut -c1-64)" = "$BANK_SHA" ] && { BANK=$f; break; }
  done
fi
if [ -z "$BANK" ] || [ "$(sha256sum "$BANK" 2>/dev/null | cut -c1-64)" != "$BANK_SHA" ]; then
  line "HOLD controls=PASS pilot=NOT-RUN bank with sha256 ${BANK_SHA:0:12}… not found (set HITL_BANK to the 2026-09-22 harvest bank) master=$rev out=$W"
  exit 0
fi

# 3. the pilot on the same seeded panel, then this week's artifact
"$PY" "$PROBE" pilot "$W/pilot" "$BANK" --n-random 240 --n-hint 60 --seed 20260924 --workers 16 >>"$RUNLOG" 2>&1; prc=$?
"$PY" "$PROBE" artifact "$W/pilot" "$W/hitl-elicitation-probe-$D.json" >>"$RUNLOG" 2>&1; arc=$?
summary=$("$PY" - "$W/hitl-elicitation-probe-$D.json" <<'PY' 2>/dev/null
import json, sys
d = json.load(open(sys.argv[1]))
n = d.get("n") or {}
print("n=" + ",".join(f"{k}:{v}" for k, v in sorted(n.items())) + f" signed={d.get('signed')}")
PY
)
if [ $prc -eq 0 ] && [ $arc -eq 0 ]; then
  line "OK controls=PASS pilot_rc=0 ${summary:-n=?} bank=${BANK_SHA:0:12} seed=20260924 master=$rev out=$W (not published)"
else
  line "FAIL controls=PASS pilot_rc=$prc artifact_rc=$arc ${summary:-} master=$rev out=$W (see $RUNLOG)"; exit 4
fi
