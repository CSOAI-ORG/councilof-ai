#!/bin/bash
# trust-chain.sh — hourly :45. Keep the two freshness-decaying trust claims true, and leave a
# receipt either way.
#
# WHAT DECAYS, AND WHY A LOOP IS THE ONLY FIX
#
#   1. OTS proofs. A stamp is a promise; the Bitcoin attestation exists only after a calendar
#      commits AND somebody fetches the completed path back. Nothing does that on its own. On
#      2026-09-03 the public root was served as pending for 20+ hours while its commitment was in
#      the chain; on 2026-09-22, 547 of 603 published proofs were served as calendar-pending and
#      543 of them were already attested — the upgrade had simply never run. Left alone it recurs
#      within days of the next stamp.
#   2. The corrections ledger signature. It was signed once on 2026-08-22 and appended 46 times
#      without re-issue, so /api/corrections read STALE for a month. The signature now verifies at
#      request time, so it cannot be faked green — but it also cannot re-issue itself, and nobody
#      notices a flag nobody reads.
#
# THE SCHEDULER OWNS THE STAMP. scheduler.sh calls `stamp trust-chain hour` and runs this with
# --now; with --now this script must NOT stamp again. A script that stamps itself as well finds
# its own stamp already written and exits 0 having done nothing, and a loop that silently no-ops
# leaves no log line to notice.
#
# WHAT THIS NEVER DOES. It never merges, never pushes master, never re-signs anything, and never
# renames a state it did not establish from the bytes. Upgrading an .ots is additive over the same
# commitment — the documented exception to "supersede, never edit signed bytes" — and a proof that
# did not complete is not rewritten and keeps saying pending. The ledger check only MEASURES; a
# robot that re-signed 61 entries nobody had read would be a worse defect than the stale flag.
#
# One clone per purpose: $LANES/trust-chain-repo is this loop's and nothing else's. The shared
# checkouts on this pod get reset --hard under whoever is using them.
#
#   log      $LOGS/trust-chain.log   one RESULT line per run, always, including "nothing changed"
#   outputs  $OUT/trust-chain/       the dated run report, the rebuilt manifest, the ledger check
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp trust-chain hour || exit 0

REPO_DIR="${TRUST_CHAIN_REPO_DIR:-$LANES/trust-chain-repo}"
REMOTE="${TRUST_CHAIN_REMOTE:-/workspace/git/councilof-ai.git}"
BASE_REF="${TRUST_CHAIN_BASE_REF:-origin/master}"
BRANCH="${TRUST_CHAIN_BRANCH:-ots/trust-chain-$(date -u +%Y-%m-%d)}"
PACE="${TRUST_CHAIN_PACE:-0.5}"
PUSH="${TRUST_CHAIN_PUSH:-1}"
HF_REPO="${TRUST_CHAIN_HF_REPO:-csoai/trust-chain-freshness}"
DAY=$(today)
RUN_LOG="$LOGS/trust-chain.run.log"
OUT_DIR="$OUT/trust-chain"
# The cache survives the hourly `checkout -B <branch> origin/master`, which otherwise throws the
# tree's upgraded proofs away and makes this loop re-ask every calendar for work it has already
# done - 1,600 requests an hour. Keyed by the digest of the bytes an upgrade was produced from, so
# it can only ever be applied to byte-identical input.
mkdir -p "$OUT_DIR/cache"
: >"$RUN_LOG"

log trust-chain "START branch=$BRANCH base=$BASE_REF pace=$PACE"

if [ ! -d "$REPO_DIR/.git" ]; then
  git clone --no-checkout "$REMOTE" "$REPO_DIR" >>"$RUN_LOG" 2>&1 || {
    log trust-chain "RESULT rc=1 | clone failed"; exit 1; }
  git -C "$REPO_DIR" sparse-checkout init --cone >>"$RUN_LOG" 2>&1
  git -C "$REPO_DIR" sparse-checkout set public/interop scripts >>"$RUN_LOG" 2>&1
fi
git -C "$REPO_DIR" fetch -q origin >>"$RUN_LOG" 2>&1
# Ten lanes write this repository. Always rebuild from the CURRENT master rather than carrying
# yesterday's branch forward: a proof upgraded on top of a stale tree lands a stale tree with it.
git -C "$REPO_DIR" checkout -q -B "$BRANCH" "$BASE_REF" >>"$RUN_LOG" 2>&1 || {
  log trust-chain "RESULT rc=1 | checkout failed"; exit 1; }

RUN_JSON="$OUT_DIR/ots-upgrade-$DAY.json"
# The two producers this loop owns run from $LOOPS, the way every other loop here runs its own
# script: the repo clone is the TREE being measured, and a tree that has not merged the producer
# yet must not silently disable the loop that measures it. scripts/ots_trust_upgrade.py and
# scripts/verify_corrections_signature.py in the repository are the reviewable copies of these.
( cd "$REPO_DIR" && python3 "$LOOPS/ots_trust_upgrade.py" \
    --dir public/interop --dir public/interop/ots \
    --report "$RUN_JSON" --pace "$PACE" --cache "$OUT_DIR/cache" ) >>"$RUN_LOG" 2>&1
rc_ots=$?

# The guard that exists because fifteen text stubs were once published with an .ots name. It must
# keep passing; an upgrade can only ever make a proof MORE of a proof, so a failure here means
# something else in the tree is wrong and nothing gets committed.
GUARD=0
( cd "$REPO_DIR" && python3 scripts/ots_guard.py ) >>"$RUN_LOG" 2>&1 || GUARD=1
if [ "$GUARD" -ne 0 ]; then
  log trust-chain "RESULT rc=1 | ots_guard FAILED after upgrade — nothing committed | $(tail -3 "$RUN_LOG" | tr '\n' ' ' | cut -c1-300)"
  exit 1
fi

# The manifest is rebuilt by ITS OWN producer over the bytes on disk, never edited to agree with
# the run above. If the two ever disagree, the producer is right and the run report is the bug.
( cd "$REPO_DIR" && python3 scripts/ots_manifest_rebuild.py --apply ) >>"$RUN_LOG" 2>&1
rc_man=$?
MANIFEST="$REPO_DIR/public/interop/ots/manifest.json"
[ -s "$MANIFEST" ] || { log trust-chain "RESULT rc=1 | manifest not written"; exit 1; }

# The manifest stamps its own as_of, so it differs on every single run even when nothing about
# the proofs did. Committing that pushes an empty change every hour, and "nothing changed" - the
# line that tells a reader this loop ran and found the estate already true - could never print.
# Compare it with the committed copy, as_of removed, and put the committed bytes back when that
# is the only difference. A real change to any count or row still lands.
python3 "$LOOPS/trust_chain_manifest_settle.py" "$REPO_DIR" >>"$RUN_LOG" 2>&1
cp "$MANIFEST" "$OUT_DIR/manifest-$DAY.json" 2>>"$RUN_LOG"

COUNTS=$(python3 - "$MANIFEST" <<'PY'
import json,sys
c=json.load(open(sys.argv[1]))["counts"]
print(f"proofs={c['proofs']} bitcoin={c['bitcoin_attested']} pending={c['calendar_pending']} "
      f"quarantined={c['quarantined_not_proofs']} subject_absent={c['subject_absent']}")
PY
)
FLIPPED=$(python3 - "$RUN_JSON" <<'PY'
import json,sys
try: print(len(json.load(open(sys.argv[1]))["flipped_pending_to_bitcoin"]))
except Exception: print("?")
PY
)

# The corrections ledger, checked from the SERVED bytes — the reader's check, not the publisher's.
# rc is captured from the verifier itself, never from a pipeline's last stage: `$?` after a pipe
# is the exit of `tr`, which is always 0, and a check whose result is always 0 is not a check.
LEDGER_JSON="$OUT_DIR/corrections-signature-$DAY.json"
LEDGER_OUT="$STATE/trust-chain-ledger.out"
python3 "$LOOPS/verify_corrections_signature.py" --out "$LEDGER_JSON" >"$LEDGER_OUT" 2>&1
rc_led=$?
LEDGER_LINE="rc=$rc_led $(head -2 "$LEDGER_OUT" | tr '\n' ' ' | cut -c1-240)"

CHANGED=0
git -C "$REPO_DIR" add -A public/interop >>"$RUN_LOG" 2>&1
if ! git -C "$REPO_DIR" diff --cached --quiet; then
  CHANGED=$(git -C "$REPO_DIR" diff --cached --name-only | wc -l | tr -d ' ')
  git -C "$REPO_DIR" -c user.name=CSOAI -c user.email=nicholas@csoai.org commit -q -m \
"ots: upgrade completed calendar proofs and rebuild the manifest from the bytes

$FLIPPED proof(s) gained a Bitcoin block-header attestation the calendars had already
completed. Upgrading is additive over the same commitment: no subject file and no signed
payload is touched, and a proof that did not complete is not rewritten and still says
pending. Manifest regenerated by scripts/ots_manifest_rebuild.py over the tree.

$COUNTS

Automated by scripts/pod-loops/trust-chain.sh. This loop never merges and never pushes master." >>"$RUN_LOG" 2>&1
  if [ "$PUSH" = "1" ]; then
    git -C "$REPO_DIR" push -q -f origin "$BRANCH" >>"$RUN_LOG" 2>&1
    log trust-chain "PUSH rc=$? branch=$BRANCH files=$CHANGED (landing is a separate gated merge; this loop never merges)"
  fi
fi

# Mirror. jsonl only under runs/ so the dataset viewer has one format; the proofs and the manifest
# go beside it as an archive with no config pointing at them.
if hf_token_present; then
  python3 - "$RUN_JSON" "$OUT_DIR/run-$DAY.jsonl" <<'PY'
import json,sys
d=json.load(open(sys.argv[1]))
with open(sys.argv[2],"w") as f:
    for r in d["proofs"]:
        f.write(json.dumps({k:r.get(k) for k in
            ("file","path","before_state","after_state","before_blocks","after_blocks","rewritten","note")})+"\n")
PY
  python3 "$LOOPS/hf_upload.py" --repo "$HF_REPO" --create \
    --file "$OUT_DIR/run-$DAY.jsonl" --path-in-repo "runs/run-$DAY.jsonl" --config-name "run-$DAY" \
    --readme-if-absent "$LOOPS/trust-chain-README.md" \
    >>"$RUN_LOG" 2>&1 || true
  python3 "$LOOPS/hf_upload.py" --repo "$HF_REPO" \
    --file "$OUT_DIR/manifest-$DAY.json" --path-in-repo "manifest/manifest-$DAY.json" >>"$RUN_LOG" 2>&1 || true
  python3 "$LOOPS/hf_upload.py" --repo "$HF_REPO" \
    --file "$LEDGER_JSON" --path-in-repo "corrections-signature-$DAY.json" >>"$RUN_LOG" 2>&1 || true
  if [ "$CHANGED" != "0" ]; then
    # --folder uploads a tree to the repo ROOT, so stage the proofs under ots/ and hand it the
    # parent. Only the proofs: public/interop also holds their subjects, which are published from
    # the site and do not belong in a proof archive.
    # --parents keeps each proof at its own path. A flat copy silently dropped eight of them,
    # because ten proofs are published under the same file name in public/interop and
    # public/interop/ots and the second cp overwrote the first - an archive that quietly holds
    # fewer proofs than it says is the same defect as a count that totals whatever came back.
    STAGE="$OUT_DIR/proofs-mirror"
    rm -rf "$STAGE"; mkdir -p "$STAGE/ots"
    ( cd "$REPO_DIR/public" && find interop -name '*.ots' -exec cp --parents {} "$STAGE/ots/" \; ) 2>>"$RUN_LOG"
    STAGED=$(find "$STAGE/ots" -name '*.ots' | wc -l | tr -d ' ')
    TREE=$(find "$REPO_DIR/public/interop" -name '*.ots' | wc -l | tr -d ' ')
    [ "$STAGED" = "$TREE" ] || log trust-chain "MIRROR staged $STAGED of $TREE proofs - the archive is incomplete"
    python3 "$LOOPS/hf_upload.py" --repo "$HF_REPO" --folder "$STAGE" \
      --commit-message "trust-chain $DAY: $FLIPPED proof(s) upgraded" >>"$RUN_LOG" 2>&1 || true
  fi
  MIRROR="hf=$HF_REPO"
else
  MIRROR="hf=queued(no token)"
fi

if [ "$CHANGED" = "0" ]; then
  log trust-chain "RESULT rc=0 | nothing changed — no proof completed since the last run | $COUNTS | upgrade_rc=$rc_ots manifest_rc=$rc_man | ledger: $LEDGER_LINE | $MIRROR"
else
  log trust-chain "RESULT rc=0 | $FLIPPED proof(s) upgraded, $CHANGED file(s) on $BRANCH | $COUNTS | upgrade_rc=$rc_ots manifest_rc=$rc_man | ledger: $LEDGER_LINE | $MIRROR"
fi
exit 0
