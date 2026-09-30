#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# ots-upgrade-candidate.sh -- the repo-side OTS upgrade loop, revived 30 Sep 2026 (lane evidence-fabric-20260930).
# scripts/ots-upgrade-loop.sh ran from a Mac launchd job and last ran 23 Sep; nothing upgraded the repo's proofs since.
# Runs on the build pod (Oracle cron over ssh, like auto-land-trigger.sh). Uses canon master's own copy of the tools:
#   1. scripts/anchors/ots_upgrade_tree.py over master's .ots blobs (git plumbing, no checkout); the CURRENT root proof
#      is excluded (its witness sidecar moves with it: root pipeline's job);
#   2. rebuilds public/interop/ots/manifest.json from the upgraded tree (scripts/ots_manifest_rebuild.py --apply);
#   3. pushes ONE candidate commit to lane/ots-upgrade-auto on the mirror. It never touches master: landing stays a
#      gated `land:` merge by an integrator. Result line: /workspace/staging/logs/ots-upgrade-candidate.log
set -uo pipefail
M=/workspace/staging/mirror/councilof-ai.git; LOG=/workspace/staging/logs/ots-upgrade-candidate.log
W=/root/ci-local/ots-upgrade; PY=/root/venv/bin/python3; BR=lane/ots-upgrade-auto
say() { echo "$(date -u +%FT%TZ) $*" >> $LOG; echo "$*"; }
free=$(df -Pm /root | awk 'NR==2{print $4}'); [ "${free:-0}" -gt 2048 ] || { say "SKIPPED free=${free}M < 2048M floor"; exit 0; }
exec 9>/tmp/ots-upgrade-candidate.lock; flock -n 9 || { say "SKIPPED another run holds the lock"; exit 0; }
rm -rf $W; mkdir -p $W/pub $W/scripts
BASE=$(git -C $M rev-parse master)
git -C $M show master:scripts/anchors/ots_upgrade_tree.py > $W/scripts/ots_upgrade_tree.py 2>/dev/null || { say "FAILED tool absent on master"; exit 1; }
git -C $M show master:scripts/ots_manifest_rebuild.py > $W/scripts/ots_manifest_rebuild.py || { say "FAILED manifest tool absent"; exit 1; }
R=$(git -C $M show master:public/root.json | sha256sum | cut -c1-8)
$PY $W/scripts/ots_upgrade_tree.py --repo $M --ref master --branch $BR --exclude-glob "public/interop/root-$R.json.ots" \
    --report $W/report.json > $W/summary.json 2> $W/calendars.err || { say "FAILED upgrade rc=$? (coverage refused or tool error)"; exit 1; }
C=$($PY -c 'import json,sys; print(json.load(open(sys.argv[1])).get("commit",""))' $W/report.json)
N=$($PY -c 'import json,sys; d=json.load(open(sys.argv[1])); print(len(d["upgraded"]), len(d["still_pending"]), len(d["pending"]))' $W/report.json)
[ -n "$C" ] || { say "NOTHING base=${BASE:0:9} upgraded/still/pending=$N"; exit 0; }
git -C $M archive $C public/interop | tar -x -C $W/pub && mv $W/pub/public/interop $W/pub/interop
( cd $W && $PY scripts/ots_manifest_rebuild.py --public $W/pub --dir $W/pub/interop --dir $W/pub/interop/ots --out $W/manifest.json --apply > $W/manifest.log 2>&1 ) || { say "FAILED manifest rebuild"; exit 1; }
export GIT_INDEX_FILE=$W/idx
git -C $M read-tree $C && H=$(git -C $M hash-object -w $W/manifest.json) && git -C $M update-index --cacheinfo 100644,$H,public/interop/ots/manifest.json &&
  T=$(git -C $M write-tree) &&
  F=$(git -C $M -c user.name=CSOAI -c user.email=integrator@councilof.ai commit-tree $T -p $C -m "ots: manifest rebuilt over the upgraded proofs ($(grep -o '[0-9]* Bitcoin-attested' $W/manifest.log | head -1))") || { say "FAILED manifest commit"; exit 1; }
unset GIT_INDEX_FILE
git -C $M update-ref refs/heads/$BR $F || { say "FAILED update-ref"; exit 1; }
say "CANDIDATE $BR=${F:0:9} base=${BASE:0:9} upgraded/still/pending=$N  (land with a gated land: merge)"
