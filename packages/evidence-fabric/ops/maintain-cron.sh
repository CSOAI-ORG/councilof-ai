#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# maintain-cron.sh -- day 7/30/90 re-reads of the stack-evidence receipts (lane evidence-fabric-20260930).
# Runs on Oracle (cron), split-host like every board signature: the pod re-reads and batches; Oracle signs with the pod caller
# token (never leaves Oracle); the pod logs the signature in Rekor, verifies it with tamper controls, and uploads the new dir to the
# PRIVATE dataset csoai/stack-evidence-bridges (refuses if the dataset is not private). One line per run in $LOG.
set -uo pipefail
. $HOME/fleet/build-pod.env || { echo "$(date -u +%FT%TZ) FAILED build-pod.env" >> $HOME/lanes/logs/stack-evidence-maintain.log; exit 1; }
LOG=$HOME/lanes/logs/stack-evidence-maintain.log; mkdir -p $(dirname $LOG) $HOME/lanes/evidence-fabric/maint
POD="ssh -o BatchMode=yes -o ConnectTimeout=20 -i $BUILD_POD_KEY -p $BUILD_POD_PORT $BUILD_POD_HOST"
ROOT=/workspace/lanes/stack-evidence-bridges
FAB=/workspace/staging/maintain-fabric   # canon master's copy of packages/evidence-fabric + scripts/census, refreshed each run
TODAY=$(date -u +%F)
say() { echo "$(date -u +%FT%TZ) $*" >> $LOG; }
free=$(df -Pm $HOME | awk 'NR==2{print $4}'); [ "${free:-0}" -gt 2048 ] || { say "SKIPPED oracle free=${free}M < 2048M"; exit 0; }
OUT=$($POD "set -e; M=/workspace/staging/mirror/councilof-ai.git; rm -rf $FAB; mkdir -p $FAB; git -C \$M archive master packages/evidence-fabric scripts/census | tar -x -C $FAB; \
  /root/venv/bin/python3 $FAB/packages/evidence-fabric/maintain.py run $ROOT --today $TODAY --census-dir $FAB/scripts/census") || { say "FAILED pod re-read"; exit 1; }
DIRS=$(echo "$OUT" | python3 -c 'import json,sys; print(" ".join(r["out"] for r in json.load(sys.stdin) if r.get("out")))')
[ -n "$DIRS" ] || { say "NOTHING due $TODAY"; exit 0; }
for d in $DIRS; do
  W=$HOME/lanes/evidence-fabric/maint/${d//\//_}; mkdir -p $W
  $POD "cat $ROOT/$d/batch.json" > $W/batch.json || { say "FAILED fetch $d"; continue; }
  printf '{"what":"claim-maintenance re-read (see batch.json maintenance_of)","member_dir":"%s","publication":"PRIVATE until a per-company owner OK"}\n' "$d" > $W/extra.json
  (cd $W && python3 $HOME/lanes/measurement-signing/sign_record.py batch.json --artifact-path hf:csoai/stack-evidence-bridges/$d/batch.json --extra extra.json > sign.out 2>&1) || { say "FAILED sign $d"; continue; }
  for f in batch.signed.json batch.json.ots batch.ots.json; do $POD "cat > $ROOT/$d/$f" < $W/$f; done
  V=$($POD "cd $ROOT/$d && curl -sS -A 'Mozilla/5.0 csoai-evidence' -o did.json https://csoai.org/.well-known/did.json && \
      /root/venv/bin/python3 $FAB/packages/evidence-fabric/anchor.py rekor batch.signed.json --did did.json --out batch.rekor.json >/dev/null; \
      /root/venv/bin/python3 $FAB/packages/evidence-fabric/verify.py batch.json batch.signed.json events.jsonl --did did.json --tamper-control > verify.json; \
      python3 -c 'import json; a=json.load(open(\"verify.json\")); b=json.load(open(\"batch.rekor.json\")); print(a[\"result\"], b.get(\"status\"), b.get(\"logIndex\"))'")
  cat $HOME/.secrets/hf_token | $POD "IFS= read -r T; /root/venv/bin/python3 -c \"
import sys
from huggingface_hub import HfApi
a=HfApi(token=sys.argv[1]); assert a.repo_info('csoai/stack-evidence-bridges', repo_type='dataset').private is True
a.upload_folder(folder_path='$ROOT/$d', path_in_repo='$d', repo_id='csoai/stack-evidence-bridges', repo_type='dataset', commit_message='maintenance re-read $d')
\" \"\$T\"" >/dev/null 2>&1 && up=UPLOADED || up=UPLOAD_FAILED
  say "RE-READ $d verify/rekor=[$V] $up"
done
# OTS: upgrade every pending receipt proof in place (additive), then re-upload the dirs whose proofs changed.
UP=$($POD "cd $ROOT && /root/venv/bin/python3 $FAB/packages/evidence-fabric/anchor.py ots-upgrade \$(find . -name '*.ots' | sort)") || UP='{}'
say "OTS $(echo "$UP" | python3 -c 'import json,sys; d=json.load(sys.stdin); import collections; print(dict(collections.Counter(v.split(":")[0] for v in d.values())))')"
