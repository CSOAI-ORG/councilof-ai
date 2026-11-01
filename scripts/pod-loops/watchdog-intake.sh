#!/bin/bash
# watchdog-intake.sh — 09:40Z daily: probe the pinned public watchdogs and incident sources, fold
# the day into the WG-SAFE routing queue, and land it as a dated branch the land job may merge.
# One read, one branch.
#
#   reads    the pinned public sources (CISA KEV, NVD, GHSA, OSV, MITRE CVE, Go vuln DB, deps.dev,
#            Hugging Face, OpenRouter, MITRE ATLAS, OpenSSF Scorecard, OWASP ASVS, OWASP LLM Top 10,
#            SLSA, in-toto, Rekor, WG-SAFE) via scripts/watchdog_intake.py, then the routing queue via
#            scripts/watchdog_charter_feed.py. Both run FROM this loop's own lane clone, not from the
#            shared $REPO sparse clone: the two producers are files at scripts/ root, which the
#            sparse set does not carry, and scripts/ is 133 MB — too much of the pod's volume to pull
#            for one loop. The lane clone is --shared with the bare repo and sparse (--no-cone) to
#            exactly the files and the output directory this loop needs.
#   writes   public/interop/watchdog-intake/<run-id>.json (the run: every source's state and the
#            sha256 of the bytes it read), _index.json (the daily signal index, derived from the
#            latest run), latest.json (the pointer), charter-feed.json (the HUMAN routing queue), and
#            ONE line in $LOGS/watchdog-intake.log per run.
#   branch   watchdog/auto-<date> in /workspace/ci/watchdog-lane, pushed to the bare repo. NEVER
#            pushes master, never merges, signs nothing, submits nothing, spends nothing, sends
#            nothing to any party named.
#   landing  mill-hourly-land.sh (:50) merges a watchdog/auto-* branch only when this log says OK for
#            it AND the net diff only ADDS public/interop/watchdog-intake/<run-id>.json and MODIFIES
#            the three derived views (_index.json, latest.json, charter-feed.json). Any other path,
#            any deletion, or a date that does not match the branch is a HOLD left for a human.
#   signed   the public root signs the day: public-root.yml stages a card-v0 atom from the landed run
#            (scripts/readers/watchdog_intake_reader.py) and signs it into the ONE root, so the day's
#            probe is witnessed by Rekor and OpenTimestamps. This loop does not sign and cannot.
#
# WHY DAILY. These are advisory feeds, catalogs and policy documents. None of them publishes on a
# schedule that a finer tick could see — CISA KEV and NVD move daily at most, ATLAS and the OWASP
# READMEs move by release. A finer tick would multiply the network load and the review load without
# adding one checkable fact.
#
# THE STAMP IS THE SCHEDULER'S: scheduler.sh runs `stamp watchdog-intake` and passes --now; with
# --now this script must not stamp again (a second stamp finds the first and the run exits 0 having
# read nothing).
# Env for exercising it without touching the live namespace: WATCHDOG_PUSH=0, WATCHDOG_CLONE,
# WATCHDOG_BARE.
set -u
. "$(dirname "$0")/lib.sh"
exec 7>"$STATE/watchdog-intake.lock"
flock -n 7 || { log watchdog-intake "SKIP previous run still holds the lock"; exit 0; }
[ "${1:-}" = "--now" ] || stamp watchdog-intake || exit 0

BARE=${WATCHDOG_BARE:-/workspace/git/councilof-ai.git}
LANE=${WATCHDOG_CLONE:-/workspace/ci/watchdog-lane}
PUSH=${WATCHDOG_PUSH:-1}
D=$(today)
BRANCH=watchdog/auto-$D
RUNLOG=$LOGS/watchdog-intake.run.log
PUB=public/interop/watchdog-intake
mkdir -p "$OUT/watchdog-intake"
line() { log watchdog-intake "$* date=$D"; }

# 1. this loop's own clone of the bare repo, sparse to exactly what it needs
if [ ! -d "$LANE/.git" ]; then
  git clone -q --shared --no-checkout "$BARE" "$LANE" >>"$RUNLOG" 2>&1 || { line "FAIL clone of $BARE into $LANE"; exit 4; }
  git -C "$LANE" sparse-checkout set --no-cone \
    '/scripts/watchdog_intake.py' \
    '/scripts/watchdog_charter_feed.py' \
    '/scripts/readers/watchdog_intake_reader.py' \
    '/scripts/adapters/staged_leaves.py' \
    "/$PUB*" >>"$RUNLOG" 2>&1 || { line "FAIL sparse-checkout in $LANE"; exit 4; }
fi
git -C "$LANE" fetch -q origin >>"$RUNLOG" 2>&1 || { line "FAIL fetch in $LANE"; exit 4; }
git -C "$LANE" checkout -q -f -B "$BRANCH" origin/master >>"$RUNLOG" 2>&1 || { line "FAIL checkout $BRANCH in $LANE"; exit 4; }
rev=$(git -C "$LANE" rev-parse --short HEAD)
for f in scripts/watchdog_intake.py scripts/watchdog_charter_feed.py scripts/readers/watchdog_intake_reader.py; do
  [ -s "$LANE/$f" ] || { line "FAIL $f absent from master=$rev"; exit 2; }
done

# 2. the probe. Every source answers 200, or it is recorded as UNCHECKABLE or UNREACHABLE — the
# harness never turns a missing source into a zero. A day where some source is down is still a day
# worth landing: the gap is the fact.
( cd "$LANE" && timeout 1800 python3 scripts/watchdog_intake.py ) >>"$RUNLOG" 2>&1
rc=$?
[ $rc -eq 0 ] || { line "FAIL intake rc=$rc master=$rev (see $RUNLOG)"; exit 3; }

# 3. the routing queue: the rows a human works from, never a decision
( cd "$LANE" && timeout 300 python3 scripts/watchdog_charter_feed.py ) >>"$RUNLOG" 2>&1
rc=$?
[ $rc -eq 0 ] || { line "FAIL charter-feed rc=$rc master=$rev (see $RUNLOG)"; exit 3; }

# 4. the gate. The day may only land when (a) the run artifact and the pointer agree, (b) every
# routing row is HOLD with may_apply false and no challenge opened, and (c) the atom the public
# root would sign passes the PUBLISHER'S OWN admission check — so the estate never lands a day
# that can never be signed into the root.
verdict=$(python3 - "$LANE" <<'PY'
import json, sys
from pathlib import Path

lane = Path(sys.argv[1])
pub = lane / "public" / "interop" / "watchdog-intake"
sys.path.insert(0, str(lane / "scripts"))
sys.path.insert(0, str(lane))
try:
    from scripts.adapters import staged_leaves
    from scripts.readers import watchdog_intake_reader as reader
except Exception as e:
    print(f"BAD import {type(e).__name__}: {e}")
    sys.exit(0)

try:
    latest = json.loads((pub / "latest.json").read_text(encoding="utf-8"))
    run_id = latest["run_id"]
    run = json.loads((pub / f"{run_id}.json").read_text(encoding="utf-8"))
    feed = json.loads((pub / "charter-feed.json").read_text(encoding="utf-8"))
except Exception as e:
    print(f"BAD artifact-unreadable {type(e).__name__}: {e}")
    sys.exit(0)

if run.get("run_id") != run_id:
    print("BAD latest-and-run-disagree")
    sys.exit(0)

rows = feed.get("rows") or []
if not rows:
    print("BAD no routing rows")
    sys.exit(0)
held = [r for r in rows if r.get("human_decision") != "HOLD" or r.get("may_apply") is not False or r.get("challenge_opened") is not False]
if held:
    print(f"BAD {len(held)} routing row(s) are not HOLD/may_apply-false/no-challenge")
    sys.exit(0)

atom = reader.build_atom(run, feed)
reason = staged_leaves._check(atom)
if reason:
    print(f"BAD atom-not-admissible {reason}")
    sys.exit(0)

totals = run.get("totals") or {}
states = {s.get("state") for s in (run.get("sources") or [])}
print(f"READ run={run_id} probed={totals.get('sources_probed')} states={sorted(states)} rows={len(rows)} decision=HOLD atom_bytes={len(reader.canonical_bytes(atom))}")
PY
)
case $verdict in
  READ*) ;;
  *) line "HOLD $verdict master=$rev (kept in \$OUT; no branch)"; exit 0 ;;
esac

# 5. branch: this loop's own clone, never a shared checkout; never master
git -C "$LANE" add -- "$PUB" >>"$RUNLOG" 2>&1
if git -C "$LANE" diff --cached --quiet; then
  line "HOLD nothing to land — the day is byte-identical to master=$rev; no branch"
  exit 0
fi
git -C "$LANE" -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q \
  -m "watchdog/auto-$D: public watchdog intake run and WG-SAFE routing queue ($verdict); every row HOLD, may_apply false, no challenge opened" >>"$RUNLOG" 2>&1 \
  || { line "FAIL commit in $LANE"; exit 4; }
sha=$(git -C "$LANE" rev-parse --short HEAD)
if [ "$PUSH" != "1" ]; then
  line "DRY $verdict branch=$BRANCH commit=$sha master=$rev (WATCHDOG_PUSH=0; committed locally only)"; exit 0
fi
# -f only on this loop's own dated branch (a same-day re-run replaces it before it lands)
git -C "$LANE" push -q -f origin "$BRANCH" >>"$RUNLOG" 2>&1 || { line "FAIL push $BRANCH commit=$sha"; exit 5; }
line "OK $verdict branch=$BRANCH commit=$sha master=$rev"
