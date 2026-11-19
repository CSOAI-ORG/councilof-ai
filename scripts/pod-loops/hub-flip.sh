#!/bin/bash
# Runs ON THE POD: reproduce hub-queue-flip.yml (lines 54-92) without GitHub — fetch queue + published INDEX,
# run flip_hub_queue.py over master's signed mill cards, upload flip-out/mill-cards to csoai/gspc-hub-cards, read back.
set -u
export PATH=/workspace/tools/node/bin:$PATH
cd /workspace/ci/merge && git fetch -q origin && git checkout -q -B master origin/master
echo "--- recipe (hub-queue-flip.yml 54-92):"; sed -n '54,92p' .github/workflows/hub-queue-flip.yml | grep -E 'python3|hf_hub|upload|download|INDEX|queue|--' | head -20 | cut -c1-170
W=/workspace/lanes/out/hub-flip-$(date -u +%Y%m%dT%H%M%SZ); mkdir -p $W
TOK=$(python3 /workspace/tools/csoai_keys.py --key HF_TOKEN)
python3 - "$W" "$TOK" <<'PY'
import sys, os
from huggingface_hub import hf_hub_download, HfApi
W, tok = sys.argv[1], sys.argv[2]
api = HfApi(token=tok)
q = hf_hub_download("csoai/hub-queue", "queue.jsonl", repo_type="dataset", token=tok, local_dir=W)
print("queue:", q, os.path.getsize(q))
try:
    idx = hf_hub_download("csoai/gspc-hub-cards", "mill-cards/INDEX.jsonl", repo_type="dataset", token=tok, local_dir=W)
    print("prev index:", idx, os.path.getsize(idx))
except Exception as e:
    print("prev index: absent ->", e.__class__.__name__)
PY
curl -s -A "Mozilla/5.0" --max-time 20 https://csoai.org/.well-known/did.json -o $W/did.json && echo "did.json $(wc -c < $W/did.json) bytes"
PREV=$W/mill-cards/INDEX.jsonl; [ -f "$PREV" ] || PREV=""
python3 scripts/flip_hub_queue.py --cards public/interop/mill-cards-signed --queue $W/queue.jsonl --did $W/did.json --out $W/flip-out ${PREV:+--prev-index $PREV} > $W/flip.log 2>&1; rc=$?
echo "flip rc=$rc"; tail -8 $W/flip.log | cut -c1-170
if [ $rc -eq 0 ] && [ -d $W/flip-out/mill-cards ]; then
  echo "flip-out files: $(find $W/flip-out/mill-cards -type f | wc -l); INDEX lines: $(wc -l < $W/flip-out/mill-cards/INDEX.jsonl 2>/dev/null)"
  python3 - "$W" "$TOK" <<'PY'
import sys
from huggingface_hub import HfApi
W, tok = sys.argv[1], sys.argv[2]
api = HfApi(token=tok)
c = api.upload_folder(repo_id="csoai/gspc-hub-cards", repo_type="dataset", folder_path=f"{W}/flip-out/mill-cards", path_in_repo="mill-cards", token=tok,
                      commit_message="hub flip from the pod: mill pass 1 (gemma3:12b × 10 axes, signed with the pod token), 2026-09-22")
print("hub-cards commit:", getattr(c, "oid", str(c))[:12])
PY
  sleep 8; curl -s -A "Mozilla/5.0" --max-time 40 https://councilof.ai/api/hub-cards | python3 -c "import json,sys; d=json.load(sys.stdin); print('/api/hub-cards cells:', d.get('n') or d.get('count') or d.get('total') or len(d.get('cells') or d.get('rows') or []))"
fi
echo "workdir $W"
