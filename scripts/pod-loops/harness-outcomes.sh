#!/bin/bash
# harness-outcomes.sh — score the pod-measurement harness from the signed cards on master, hourly.
#
# Reads master from the bare repo (never a lane's working checkout): public/interop/mill-cards-signed/
# and scripts/runpod_gspc_bank_allowlist.current.json. Runs the Condor GSPC ingest
# (/workspace/condor-gspc, branch csoai/gspc-harness-fabric-20260924): each attributable card is
# re-checked (id, Ed25519 signature under did:web:csoai.org#board-attestation-1, pinned bank) and
# appended once as a task-matched outcome; the scorecard is refreshed. Outputs, never a claim beyond
# them: /workspace/lanes/out/harness/{pod-measurement-scorecard.json,pod-outcomes-receipt.json}.
# Witnesses per card (Condor gspc_fusion): online and offline (pinned-key) signature, pinned bank,
# root-ceremony inclusion; each component keeps its own verdict and nothing is voted.
# The harness is scored, never the model. Nothing here signs, publishes or spends.
set -uo pipefail
. "$(dirname "$0")/lib.sh"
BARE=/workspace/git/councilof-ai.git
CONDOR=/workspace/condor-gspc
DEST=$OUT/harness
TMP=$(mktemp -d /workspace/ci/harness-cards.XXXXXX)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$DEST" "$CONDOR/data/gspc_ir"
git --git-dir="$BARE" archive master public/interop/mill-cards-signed scripts/runpod_gspc_bank_allowlist.current.json \
    packages/gspc-card-verifier/profile/csoai-gspc-1.json public/interop/card-root-latest.json \
  | tar -x -C "$TMP" || { log harness-outcomes "HALT could not export cards from $BARE master"; exit 2; }
# Witnesses: the verifier package's pinned keys (offline signature) and the dated card root that
# card-root-latest.json points to (root ceremony). Either may be absent; the ingest then says so.
root_rel=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['root_url'].lstrip('/'))" "$TMP/public/interop/card-root-latest.json" 2>/dev/null)
[ -n "$root_rel" ] && git --git-dir="$BARE" archive master "public/$root_rel" | tar -x -C "$TMP" 2>/dev/null
git -C "$CONDOR" pull -q --ff-only 2>/dev/null || log harness-outcomes "WARN condor-gspc could not fast-forward; using $(git -C "$CONDOR" rev-parse --short HEAD)"
rev=$(git --git-dir="$BARE" rev-parse --short master)
res=$(cd "$CONDOR" && python3 scripts/gspc_ingest_pod_outcomes.py \
        --cards "$TMP/public/interop/mill-cards-signed" \
        --allowlist "$TMP/scripts/runpod_gspc_bank_allowlist.current.json" \
        --profile "$TMP/packages/gspc-card-verifier/profile/csoai-gspc-1.json" \
        --card-root "$TMP/public/${root_rel:-none}" 2>&1 | tail -1)
rc=$?
if [ $rc -ne 0 ] || [ ! -s "$CONDOR/data/gspc_ir/harness-scorecard.json" ]; then
  log harness-outcomes "HALT ingest rc=$rc master=$rev: ${res:0:200}"; exit 3
fi
python3 - "$CONDOR/data/gspc_ir/harness-scorecard.json" "$DEST/pod-measurement-scorecard.json" "$rev" <<'PY'
import json, sys
sc = json.load(open(sys.argv[1]))
out = {"schema": "csoai.gspc-harness-scorecard-extract/0.1", "master": sys.argv[3], "observed_at": sc.get("observed_at"),
       "claim": sc.get("claim"), "ranking_authority": sc.get("ranking_authority"), "selection_rule": sc.get("selection_rule"),
       "harness": "pod-measurement", "stats": sc["by_harness"].get("pod-measurement")}
json.dump(out, open(sys.argv[2], "w"), indent=2, sort_keys=True)
PY
cp "$CONDOR/data/gspc_ir/pod-outcomes-receipt.json" "$DEST/pod-outcomes-receipt.json"
fusion=$(python3 -c "import json;f=json.load(open('$DEST/pod-outcomes-receipt.json')).get('fusion_states',{});print(' '.join('%s=%s/%s/%s'%(k,v['CONFIRMED'],v['REFUTED'],v['UNRESOLVED']) for k,v in f.items()))")
summary=$(python3 -c "import json;s=json.load(open('$DEST/pod-measurement-scorecard.json'))['stats'] or {};r=json.load(open('$DEST/pod-outcomes-receipt.json'));print('cohorts=%s mean=%s lb95=%s appended=%s state=%s'%(s.get('unique_measured_cohorts'),s.get('mean_task_outcome_score'),s.get('conservative_outcome_score_95'),r.get('appended'),s.get('performance_state')))")
log harness-outcomes "master=$rev $summary fusion(conf/ref/unres): $fusion"
