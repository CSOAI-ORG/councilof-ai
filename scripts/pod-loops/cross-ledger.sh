#!/bin/bash
# cross-ledger.sh — 04:20Z daily: is USDC the same thing on every ledger its issuer lists? One read, one branch.
#
#   reads    Circle's own "USDC contract addresses" page (the deployment map) and each listed ledger's public
#            endpoint, via scripts/readers/cross_ledger_supply.py run FROM $REPO (the loops' sparse clone of the
#            bare repo; lib.sh's REPO_SPARSE carries scripts/readers + scripts/adapters, which it imports).
#   writes   $OUT/cross-ledger/usdc-<date>.json + $OUT/cross-ledger/usdc-<date>/<ledger>-proof.json (kept, never
#            deleted), $LOGS/cross-ledger.run.log (the reader's own stdout/stderr, this run only), and ONE line in
#            $LOGS/cross-ledger.log per run:  <utc> OK|HOLD|FAIL date=<d> ... branch=<b> commit=<sha> ...
#   branch   only if the reader exited 0 AND all seven core ledgers (ethereum solana stellar hedera sui noble xrpl)
#            came back as a READ (STATE_PROOF_VERIFIED / STATE_PROOF_RECORDED / OPERATOR_API — not UNCHECKABLE,
#            not REJECTED, not missing from the issuer list): the dated artifact + its proof files are committed
#            as public/interop/cross-ledger-usdc-<date>{.json,/} on branch ledger/auto-<date> in this loop's own
#            clone /workspace/ci/ledger-lane (clone --shared of the bare repo, sparse to those paths) and that
#            branch is pushed to the bare repo. NEVER pushes master, never merges. A day that falls short is kept
#            in $OUT with a HOLD line saying which ledgers were not read; UNCHECKABLE stays first-class there.
#   landing  mill-hourly-land.sh (:50) merges a ledger/auto-* branch only when this log says OK for it AND the
#            branch's net diff ADDS files under public/interop/cross-ledger-usdc-<same date>* and nothing else.
#   dated    a dated artifact is never rewritten: if master already carries cross-ledger-usdc-<date>.json the read
#            stays in $OUT and no branch is made (HOLD already-on-master).
#
# Signs nothing, submits nothing, spends nothing, sends nothing to any party. Unsigned PILOT: the artifact
# itself says "PILOT — unsigned, not on the board"; not a reserve attestation, not a proof of backing.
# THE STAMP IS THE SCHEDULER'S: scheduler.sh runs `stamp cross-ledger` and passes --now; with --now this
# script must not stamp again (a second stamp finds the first and the run exits 0 having read nothing).
# Env for exercising it without touching the live namespace: CROSS_LEDGER_PUSH=0, CROSS_LEDGER_CLONE, CROSS_LEDGER_BARE.
set -u
. "$(dirname "$0")/lib.sh"
exec 7>"$STATE/cross-ledger.lock"
flock -n 7 || { log cross-ledger "SKIP previous run still holds the lock"; exit 0; }
[ "${1:-}" = "--now" ] || stamp cross-ledger || exit 0

BARE=${CROSS_LEDGER_BARE:-/workspace/git/councilof-ai.git}
LANE=${CROSS_LEDGER_CLONE:-/workspace/ci/ledger-lane}
PUSH=${CROSS_LEDGER_PUSH:-1}
D=$(today)
DEST=$OUT/cross-ledger
ART=$DEST/usdc-$D.json
PROOFS=$DEST/usdc-$D
PUB=cross-ledger-usdc-$D
BRANCH=ledger/auto-$D
RUNLOG=$LOGS/cross-ledger.run.log
mkdir -p "$DEST"
line() { log cross-ledger "$* date=$D"; }

# 1. the producer, from $REPO at master
repo_sparse_ensure scripts/readers scripts/adapters >"$RUNLOG" 2>&1 || { line "FAIL could not extend \$REPO sparse set (see $RUNLOG)"; exit 2; }
git -C "$REPO" fetch -q origin master >>"$RUNLOG" 2>&1 && git -C "$REPO" merge -q --ff-only origin/master >>"$RUNLOG" 2>&1 \
  || { line "FAIL \$REPO could not fast-forward to origin/master; not reading with stale code (see $RUNLOG)"; exit 2; }
rev=$(git -C "$REPO" rev-parse --short HEAD)
[ -s "$REPO/scripts/readers/cross_ledger_supply.py" ] || { line "FAIL reader absent from \$REPO master=$rev"; exit 2; }

# 2. the read (network only; ~1 min on 2026-09-25). A re-run the same day replaces the day's $OUT copy.
rm -rf "$PROOFS"
( cd "$REPO" && timeout 1800 python3 scripts/readers/cross_ledger_supply.py --out "$ART" --proof-dir "$PROOFS" \
    --proof-url-prefix "/interop/$PUB" ) >>"$RUNLOG" 2>&1
rc=$?
[ $rc -eq 0 ] && [ -s "$ART" ] || { line "FAIL reader rc=$rc master=$rev (see $RUNLOG)"; exit 3; }

# 3. the gate: seven core ledgers READ, or no branch
verdict=$(python3 - "$ART" <<'PY'
import json, sys
CORE = ["ethereum", "solana", "stellar", "hedera", "sui", "noble", "xrpl"]
READ = {"STATE_PROOF_VERIFIED", "STATE_PROOF_RECORDED", "OPERATOR_API"}
try:
    d = json.load(open(sys.argv[1]))
except Exception as e:
    print(f"BAD artifact-not-json {type(e).__name__}"); sys.exit(0)
if d.get("schema") != "csoai.cross-ledger-supply/0.1" or d.get("signed") is not False:
    print("BAD schema-or-signed-flag"); sys.exit(0)
core = {r["ledger"]: r["evidence_kind"] for r in d.get("rows", []) if r.get("scope") == "core"}
kinds = {}
for k in core.values(): kinds[k] = kinds.get(k, 0) + 1
short = [f"{l}={core.get(l, 'ABSENT')}" for l in CORE if core.get(l) not in READ]
issuer = (d.get("issuer_list_evidence") or {}).get("state")
tally = ",".join(f"{k}:{v}" for k, v in sorted(kinds.items()))
extra = sum(1 for r in d.get("rows", []) if r.get("scope") != "core")
if short or d.get("missing_core_ledgers_on_issuer_list"):
    print(f"SHORT issuer={issuer} core_read={7-len(short)}/7 not_read={'+'.join(short) or '-'} missing_on_issuer_list={'+'.join(d.get('missing_core_ledgers_on_issuer_list') or []) or '-'} kinds={tally}")
else:
    print(f"READ issuer={issuer} core_read=7/7 kinds={tally} extra_evm_rows={extra}")
PY
)
case $verdict in
  READ*) ;;
  *) line "HOLD $verdict master=$rev out=$ART (kept in \$OUT; no branch)"; exit 0 ;;
esac

# 4. branch: this loop's own clone, never a shared checkout; never master
if [ ! -d "$LANE/.git" ]; then
  git clone -q --shared --no-checkout "$BARE" "$LANE" >>"$RUNLOG" 2>&1 || { line "FAIL clone of $BARE into $LANE"; exit 4; }
  git -C "$LANE" sparse-checkout set --no-cone '/public/interop/cross-ledger-usdc-*' >>"$RUNLOG" 2>&1 \
    || { line "FAIL sparse-checkout in $LANE"; exit 4; }
fi
git -C "$LANE" fetch -q origin >>"$RUNLOG" 2>&1 || { line "FAIL fetch in $LANE"; exit 4; }
if git -C "$LANE" cat-file -e "origin/master:public/interop/$PUB.json" 2>/dev/null; then
  line "HOLD already-on-master public/interop/$PUB.json exists; a dated artifact is never rewritten; read kept at $ART $verdict"
  exit 0
fi
git -C "$LANE" checkout -q -f -B "$BRANCH" origin/master >>"$RUNLOG" 2>&1 || { line "FAIL checkout $BRANCH in $LANE"; exit 4; }
mkdir -p "$LANE/public/interop/$PUB"
cp "$ART" "$LANE/public/interop/$PUB.json"
for f in "$PROOFS"/*.json; do [ -f "$f" ] && cp "$f" "$LANE/public/interop/$PUB/"; done
rmdir "$LANE/public/interop/$PUB" 2>/dev/null
git -C "$LANE" add -- "public/interop/$PUB.json" "public/interop/$PUB" >>"$RUNLOG" 2>&1
git -C "$LANE" -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q \
  -m "ledger/auto-$D: cross-ledger USDC read ($verdict); unsigned PILOT, not a reserve attestation" >>"$RUNLOG" 2>&1 \
  || { line "FAIL commit in $LANE"; exit 4; }
sha=$(git -C "$LANE" rev-parse --short HEAD)
if [ "$PUSH" != "1" ]; then
  line "DRY $verdict branch=$BRANCH commit=$sha master=$rev (CROSS_LEDGER_PUSH=0; committed locally only)"; exit 0
fi
# -f only on this loop's own dated branch (a same-day re-run replaces it before it lands)
git -C "$LANE" push -q -f origin "$BRANCH" >>"$RUNLOG" 2>&1 || { line "FAIL push $BRANCH commit=$sha"; exit 5; }
line "OK $verdict branch=$BRANCH commit=$sha master=$rev out=$ART"
