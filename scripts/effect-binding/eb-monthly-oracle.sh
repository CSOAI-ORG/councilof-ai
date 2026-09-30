#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# eb-monthly-oracle.sh -- the MONTHLY effect-binding server re-probe (lane live-backlog-20260930). Oracle keeps the
# schedule, the state of record, the signature and the publication; a RunPod pod does the network work.
#
#   1. pod   : the 4090 builder (~/fleet/build2-pod.env) if it answers, else the build pod (~/fleet/build-pod.env).
#              A stopped pod is never started from here. bash /workspace/ci/eb-monthly/bin/eb-monthly-pod.sh DATE:
#              controls first (abort => no public server contacted), then the parent's 600-server frozen slice
#              (seed 20260922, >= 2 s between requests to one host, any 429 stops that host, no credentials), then
#              the artifact through the published eb_publish.py (eb_publish_rerun.py --companion).
#   2. pull  : stage/ -> /evac-bulk/eb-monthly/runs/DATE (floor: 512 MB free on /evac-bulk).
#   3. sign  : eb_sign_run.py (JWT-shaped strings in the raw log redacted and counted first) -> POST /api/board-sign
#              with ~/.secrets/board-sign-pod-token; the signature is verified against the DID and a tamper control.
#   4. publish: HF csoai/councilof-ai-mirror public/interop/ (artifact, log, controls, bank, code, companion) and
#              csoai/councilof-ai-evidence interop/<artifact> (the councilof.ai 302 target); anonymous read-back by sha256.
#   5. index : eb_census_index.py -> runs/DATE/effect-binding-census-index.json for the GSPC Route floor. Putting it on
#              councilof.ai is a land (master accepts only "land:" merges); this job logs INDEX_READY and stops there.
# One line per step to ~/lanes/logs/eb-monthly.log. Idempotent per DATE. The board is never written: slot 23 rests
# on the signed 2026-09-22 parent run.
set -uo pipefail
D=${1:-$(date -u +%F)}
T=${EB_TREE:-$HOME/lanes/eb-monthly-20260930/tree}
R=/evac-bulk/eb-monthly/runs/$D; LOG=$HOME/lanes/logs/eb-monthly.log
N=effect-binding-server-probe-$D
line() { echo "$(date -u +%FT%TZ) $* job=eb-monthly date=$D" >> "$LOG"; }
[ -f "$R/$N.signed.json" ] && { line "ALREADY_DONE $R"; exit 0; }
# one run per month: a signed run in the last 20 days (e.g. the October run made by hand on 2026-09-30) skips this one
RECENT=$(find /evac-bulk/eb-monthly/runs -maxdepth 2 -name 'effect-binding-server-probe-*.signed.json' -mtime -20 2>/dev/null | head -1)
[ -n "$RECENT" ] && [ -z "${EB_FORCE:-}" ] && { line "SKIP_RECENT $RECENT"; exit 0; }
FREE=$(df -Pk /evac-bulk | awk 'NR==2{print int($4/1024)}'); [ "$FREE" -lt 512 ] && { line "FAILED_DISK_FLOOR evac_bulk=${FREE}M"; exit 1; }

pick() {
  . "$HOME/fleet/build-pod.env" || return 1; K=${BUILD_POD_KEY:-}   # the fleet key opens both builders
  if . "$HOME/fleet/build2-pod.env" 2>/dev/null && [ -n "${BUILD2_HOST:-}" ] && \
     ssh -o BatchMode=yes -o ConnectTimeout=15 ${K:+-i $K} -p "$BUILD2_PORT" "$BUILD2_HOST" true 2>/dev/null; then
    echo "$BUILD2_PORT $BUILD2_HOST ${K:--}"; return 0; fi
  if ssh -o BatchMode=yes -o ConnectTimeout=15 ${K:+-i $K} -p "$BUILD_POD_PORT" "$BUILD_POD_HOST" true 2>/dev/null; then
    echo "$BUILD_POD_PORT $BUILD_POD_HOST ${K:--}"; return 0; fi
  return 1
}
P=$(pick) || { line "FAILED_NO_POD (a stopped pod is never started from here)"; exit 1; }
set -- $P; KEYOPT=""; [ "$3" != "-" ] && KEYOPT="-i $3"
SSH="ssh -o BatchMode=yes -o ServerAliveInterval=60 $KEYOPT -p $1 $2"
$SSH 'touch /workspace/locks/pod4090-keepalive 2>/dev/null; true'
line "START pod=$2:$1"
OUT=$($SSH "EB_LANE=eb-monthly bash /workspace/ci/eb-monthly/bin/eb-monthly-pod.sh $D 12" 2>&1); RC=$?
line "POD rc=$RC $(echo "$OUT" | tail -1 | cut -c1-200)"
[ $RC -eq 0 ] || exit $RC
mkdir -p "$R" && $SSH "tar -C /root/eb-runs/$D/stage -cf - ." | tar -xf - -C "$R" || { line "FAILED_PULL"; exit 1; }

cd "$R" || exit 1
SIG=$(python3 "$T/scripts/effect-binding/eb_sign_run.py" "$N.json" "$N.log.jsonl" "$HOME/.secrets/board-sign-pod-token" "$N.signed.json" 2>&1) \
  || { line "FAILED_SIGN $(echo "$SIG" | tail -1 | cut -c1-200)"; exit 1; }
line "SIGNED $(echo "$SIG" | tail -1 | cut -c1-300)"

PUB=$(HF_HOME=/evac-bulk/hf-scrub/cache HF_TOKEN=$(cat "$HOME/.secrets/hf_token") python3 - "$N" <<'PY' 2>&1
import glob, hashlib, os, sys, urllib.request
from huggingface_hub import HfApi, CommitOperationAdd
N = sys.argv[1]; api = HfApi()
ops = [CommitOperationAdd(path_in_repo=f"public/interop/{f}", path_or_fileobj=f) for f in sorted(glob.glob(N + "*")) if os.path.isfile(f)]
ops += [CommitOperationAdd(path_in_repo=f"public/interop/{N}.code/{os.path.basename(f)}", path_or_fileobj=f) for f in sorted(glob.glob(N + ".code/*.py"))]
c1 = api.create_commit("csoai/councilof-ai-mirror", ops, repo_type="dataset",
                       commit_message=f"effect-binding server probe {N[-10:]}: monthly re-probe of the 600-server frozen slice, signed companion")
c2 = api.create_commit("csoai/councilof-ai-evidence", [CommitOperationAdd(path_in_repo=f"interop/{N}.json", path_or_fileobj=N + ".json")],
                       repo_type="dataset", commit_message=f"interop: {N}.json (302 target; bytes pinned by the signed companion)")
want = hashlib.sha256(open(N + ".json", "rb").read()).hexdigest()
for u in (f"https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/public/interop/{N}.json",
          f"https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/interop/{N}.json"):
    got = hashlib.sha256(urllib.request.urlopen(u, timeout=60).read()).hexdigest()
    assert got == want, f"read-back mismatch {u}"
print(f"mirror={c1.oid} evidence={c2.oid} readback=ok")
PY
) || { line "FAILED_PUBLISH $(echo "$PUB" | tail -1 | cut -c1-200)"; exit 1; }
line "PUBLISHED $(echo "$PUB" | tail -1)"

python3 "$T/scripts/effect-binding/eb_census_index.py" "$N.json" "$N.signed.json" effect-binding-census-index.json >/dev/null \
  && line "INDEX_READY $R/effect-binding-census-index.json (to serve it on councilof.ai: commit it with $N.signed.json in one land: merge)"
$SSH "rm -rf /root/eb-runs/$D" && line "DONE pod run dir removed"
