#!/bin/bash
set -e
echo "[wrap] start $(date -u)"
mkdir -p out owned_adapter
# extract adapter -> owned_adapter/sector_adapter/
tar xzf distilled_owned_v2_adapter.tar.gz -C owned_adapter
echo "[wrap] adapter extracted:"; ls -R owned_adapter | head -20
# pre-download base ONCE (cache warm) before harness loads it
python - <<'PY'
import time
from transformers import AutoModelForCausalLM, AutoTokenizer
t0=time.time()
print("[predl] downloading base Qwen/Qwen2.5-0.5B-Instruct ...", flush=True)
AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")
print(f"[predl] base cached in {time.time()-t0:.0f}s", flush=True)
PY
export BASE_MODEL="Qwen/Qwen2.5-0.5B-Instruct"
export SECTOR_CORPUS="distill_corpus_grown.jsonl"
export CHARTER_QA="distill_charter_qa.jsonl"
export OWNED_ADAPTER_DIR="owned_adapter/sector_adapter"
export RESULT_JSON="out/sov33_quality_per_tier_results.json"
echo "[wrap] running harness $(date -u)"
python sov33_quality_per_tier.py
echo "[wrap] done $(date -u)"
ls -la out/
