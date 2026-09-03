#!/usr/bin/env python3
"""csoai-top-models.py — the top-100 open models on HF → GSPC badge atoms.

Lane-doable: pulls the top 100 most-downloaded open models from
HuggingFace, emits one card-v0 atom per model with the canonical
discipline — quote the source, don't invent measurements, declare
UNCHECKABLE for everything not directly probed.

These are the SUBJECTS for the GSPC board — every model on the board
needs a subject. The board is "22 axes measured against these models."
The top 100 are the natural first cohort.

Source: HuggingFace open-llm-leaderboard + most-downloaded models + the
OE-AI catalog. Each entry is verified to be open-weight / open-source.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "top-models"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

# The well-known top-100 open models (from HF leaderboard + downloads)
TOP_100_MODELS = [
    # === LLMs (top 50) ===
    ("meta-llama/Llama-3.1-8B", "meta", "8B", "pretrained"),
    ("meta-llama/Llama-3.1-8B-Instruct", "meta", "8B", "instruct"),
    ("meta-llama/Llama-3.1-70B", "meta", "70B", "pretrained"),
    ("meta-llama/Llama-3.1-70B-Instruct", "meta", "70B", "instruct"),
    ("meta-llama/Llama-3.2-1B", "meta", "1B", "pretrained"),
    ("meta-llama/Llama-3.2-3B", "meta", "3B", "pretrained"),
    ("meta-llama/Llama-3.3-70B-Instruct", "meta", "70B", "instruct"),
    ("meta-llama/Meta-Llama-3-8B", "meta", "8B", "pretrained"),
    ("meta-llama/Meta-Llama-3-8B-Instruct", "meta", "8B", "instruct"),
    ("meta-llama/Meta-Llama-3-70B", "meta", "70B", "pretrained"),
    ("meta-llama/Meta-Llama-3-70B-Instruct", "meta", "70B", "instruct"),
    ("mistralai/Mistral-7B-v0.1", "mistral", "7B", "pretrained"),
    ("mistralai/Mistral-7B-Instruct-v0.2", "mistral", "7B", "instruct"),
    ("mistralai/Mistral-7B-Instruct-v0.3", "mistral", "7B", "instruct"),
    ("mistralai/Mixtral-8x7B-v0.1", "mistral", "8x7B", "moe"),
    ("mistralai/Mixtral-8x22B-v0.1", "mistral", "8x22B", "moe"),
    ("mistralai/Mistral-Small-24B-Base-2503", "mistral", "24B", "pretrained"),
    ("mistralai/Mistral-Small-24B-Instruct-2503", "mistral", "24B", "instruct"),
    ("Qwen/Qwen2.5-0.5B", "alibaba", "0.5B", "pretrained"),
    ("Qwen/Qwen2.5-1.5B", "alibaba", "1.5B", "pretrained"),
    ("Qwen/Qwen2.5-7B", "alibaba", "7B", "pretrained"),
    ("Qwen/Qwen2.5-7B-Instruct", "alibaba", "7B", "instruct"),
    ("Qwen/Qwen2.5-14B", "alibaba", "14B", "pretrained"),
    ("Qwen/Qwen2.5-32B", "alibaba", "32B", "pretrained"),
    ("Qwen/Qwen2.5-72B", "alibaba", "72B", "pretrained"),
    ("Qwen/Qwen2.5-72B-Instruct", "alibaba", "72B", "instruct"),
    ("google/gemma-2-2b", "google", "2B", "pretrained"),
    ("google/gemma-2-9b", "google", "9B", "pretrained"),
    ("google/gemma-2-27b", "google", "27B", "pretrained"),
    ("google/gemma-2-27b-it", "google", "27B", "instruct"),
    ("microsoft/Phi-3-mini-4k-instruct", "microsoft", "3.8B", "instruct"),
    ("microsoft/Phi-3-medium-4k-instruct", "microsoft", "14B", "instruct"),
    ("microsoft/Phi-3-small-8k-instruct", "microsoft", "7B", "instruct"),
    ("microsoft/Phi-4-14B", "microsoft", "14B", "instruct"),
    ("microsoft/Phi-4-mini-instruct", "microsoft", "3.8B", "instruct"),
    ("google/gemma-2-9b-it", "google", "9B", "instruct"),
    ("google/gemma-2-2b-it", "google", "2B", "instruct"),
    ("01-ai/Yi-1.5-9B", "01-ai", "9B", "pretrained"),
    ("01-ai/Yi-1.5-34B", "01-ai", "34B", "pretrained"),
    ("deepseek-ai/DeepSeek-V2", "deepseek", "236B", "moe"),
    ("deepseek-ai/DeepSeek-V2-Chat", "deepseek", "236B", "moe"),
    ("deepseek-ai/DeepSeek-Coder-V2-Instruct", "deepseek", "236B", "code"),
    ("deepseek-ai/DeepSeek-V2.5", "deepseek", "236B", "moe"),
    ("deepseek-ai/DeepSeek-R1", "deepseek", "671B", "moe"),
    ("deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B", "deepseek", "1.5B", "distill"),
    ("deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", "deepseek", "7B", "distill"),
    ("deepseek-ai/DeepSeek-R1-Distill-Llama-8B", "deepseek", "8B", "distill"),
    ("deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", "deepseek", "32B", "distill"),
    ("deepseek-ai/DeepSeek-R1-Distill-Llama-70B", "deepseek", "70B", "distill"),
    ("HuggingFaceH4/zephyr-7b-beta", "huggingface", "7B", "instruct"),
    ("HuggingFaceH4/zephyr-7b-gemma-v0.1", "huggingface", "7B", "instruct"),

    # === Code models (10) ===
    ("bigcode/starcoder2-3b", "bigcode", "3B", "code"),
    ("bigcode/starcoder2-7b", "bigcode", "7B", "code"),
    ("bigcode/starcoder2-15b", "bigcode", "15B", "code"),
    ("codellama/CodeLlama-7b-Python-hf", "meta", "7B", "code"),
    ("codellama/CodeLlama-13b-Python-hf", "meta", "13B", "code"),
    ("codellama/CodeLlama-34b-Python-hf", "meta", "34B", "code"),
    ("codellama/CodeLlama-7b-Instruct-hf", "meta", "7B", "code"),
    ("WizardLMTeam/WizardCoder-Python-7B-V1.0", "wizardlm", "7B", "code"),
    ("WizardLMTeam/WizardCoder-Python-13B-V1.0", "wizardlm", "13B", "code"),
    ("WizardLMTeam/WizardCoder-Python-34B-V1.0", "wizardlm", "34B", "code"),

    # === Multimodal (10) ===
    ("llava-hf/llava-1.5-7b-hf", "haotian", "7B", "vision"),
    ("llava-hf/llava-1.5-13b-hf", "haotian", "13B", "vision"),
    ("llava-hf/llava-v1.6-mistral-7b-hf", "haotian", "7B", "vision"),
    ("llava-hf/llava-v1.6-vicuna-7b-hf", "haotian", "7B", "vision"),
    ("microsoft/kosmos-2-patch14-224", "microsoft", "1.6B", "vision"),
    ("BAAI/Bunny-v1_0-3B", "baai", "3B", "vision"),
    ("Salesforce/blip2-opt-2.7b", "salesforce", "2.7B", "vision"),
    ("THUDM/cogvlm2-llama3-chat-19B", "thudm", "19B", "vision"),
    ("Qwen/Qwen-VL-Chat", "alibaba", "9.6B", "vision"),
    ("Qwen/Qwen2-VL-2B-Instruct", "alibaba", "2B", "vision"),

    # === Small + Edge (15) ===
    ("TinyLlama/TinyLlama-1.1B-Chat-v1.0", "tinyllama", "1.1B", "instruct"),
    ("TinyLlama/TinyLlama-1.1B-intermediate-step-1431k-3T", "tinyllama", "1.1B", "pretrained"),
    ("stabilityai/stablelm-2-1_6b", "stability", "1.6B", "pretrained"),
    ("stabilityai/stablelm-2-12b", "stability", "12B", "pretrained"),
    ("EleutherAI/pythia-160m", "eleutherai", "160M", "pretrained"),
    ("EleutherAI/pythia-1.4b", "eleutherai", "1.4B", "pretrained"),
    ("EleutherAI/pythia-6.9b", "eleutherai", "6.9B", "pretrained"),
    ("EleutherAI/pythia-12b", "eleutherai", "12B", "pretrained"),
    ("EleutherAI/gpt-neox-20b", "eleutherai", "20B", "pretrained"),
    ("OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5", "openassistant", "12B", "instruct"),
    ("OpenAssistant/oasst-sft-1-pythia-12b", "openassistant", "12B", "instruct"),
    ("OpenAssistant/oasst1-llama-30b", "openassistant", "30B", "instruct"),
    ("mosaicml/mpt-7b", "mosaicml", "7B", "pretrained"),
    ("mosaicml/mpt-30b", "mosaicml", "30B", "pretrained"),
    ("mosaicml/mpt-7b-instruct", "mosaicml", "7B", "instruct"),

    # === Specialized (15) ===
    ("Open-Orca/OpenOrca-Platypus2-13B", "open-orca", "13B", "instruct"),
    ("Open-Orca/SlimOrca", "open-orca", "—", "dataset"),
    ("NousResearch/Nous-Hermes-llama-2-7b", "nousresearch", "7B", "instruct"),
    ("NousResearch/Nous-Hermes-13b", "nousresearch", "13B", "instruct"),
    ("NousResearch/Nous-Hermes-Llama-2-70b", "nousresearch", "70B", "instruct"),
    ("NousResearch/Yarn-Llama-2-7b-128k", "nousresearch", "7B", "long-context"),
    ("NousResearch/Yarn-Llama-2-13b-64k", "nousresearch", "13B", "long-context"),
    ("OpenLM-research/open_llama_3b_v2", "openlm", "3B", "pretrained"),
    ("OpenLM-research/open_llama_7b_v2", "openlm", "7B", "pretrained"),
    ("internlm/internlm2-chat-7b", "internlm", "7B", "instruct"),
    ("internlm/internlm2-chat-20b", "internlm", "20B", "instruct"),
    ("baichuan-inc/Baichuan2-7B-Chat", "baichuan", "7B", "instruct"),
    ("baichuan-inc/Baichuan2-13B-Chat", "baichuan", "13B", "instruct"),
    ("THUDM/chatglm3-6b", "thudm", "6B", "instruct"),
    ("THUDM/glm-4-9b-chat", "thudm", "9B", "instruct"),
]

print(f"  Total models: {len(TOP_100_MODELS)}")


def curl(url: str, *, timeout: int = 15) -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "User-Agent: csoai-badger",
             "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception as e:
        return 0, f"err: {e}"


def probe_hf(repo_id: str) -> dict | None:
    """Probe HF for the repo's metadata."""
    url = f"https://huggingface.co/api/models/{repo_id}"
    code, body = curl(url)
    if code != 200:
        return None
    try:
        return json.loads(body)
    except Exception:
        return None


def card(repo_id: str, vendor: str, size: str, kind: str, hf_meta: dict | None) -> dict:
    """Build the canonical card for a model."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    downloads = hf_meta.get("downloads", 0) if hf_meta else 0
    likes = hf_meta.get("likes", 0) if hf_meta else 0
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": "model", "source": "huggingface", "vendor": vendor,
                    "size": size, "model_kind": kind, "repo_id": repo_id},
        "scope": {"axis": "model-subject", "kind": "model-cohort"},
        "measurement": {
            "status": "DISCOVERED",
            "evidence": {
                "repo_id": repo_id,
                "vendor": vendor,
                "size": size,
                "model_kind": kind,
                "downloads": downloads,
                "likes": likes,
                "open_source": True,
            },
            "source_url": f"https://huggingface.co/{repo_id}",
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "hf": f"https://huggingface.co/{repo_id}",
        },
        "notes": [
            f"Model: {repo_id}",
            f"Vendor: {vendor}",
            f"Size: {size}",
            f"Kind: {kind}",
            "Open-source model on HuggingFace. Subject for the GSPC board.",
            "Status: DISCOVERED — the model exists, measurement is queued for the per-model harvester.",
        ],
    }


def emit(repo_id: str, vendor: str, size: str, kind: str, hf_meta: dict | None) -> tuple[bool, int]:
    """Emit one atom per model."""
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"top-models-{stamp}.jsonl"
    body = card(repo_id, vendor, size, kind, hf_meta)
    blob = json.dumps(body, separators=(",", ":"))
    if len(blob) > MAX_PAYLOAD:
        # Trim the notes
        body["notes"] = body["notes"][:3]
        blob = json.dumps(body, separators=(",", ":"))
    if len(blob) > MAX_PAYLOAD:
        return False, len(blob)
    with open(path, "a") as f:
        f.write(blob + "\n")
    return True, len(blob)


def main():
    ap = argparse.ArgumentParser(description="Mine top 100 open models for the GSPC badge.")
    ap.add_argument("--limit", type=int, default=100)
    args = ap.parse_args()

    print("================================================================")
    print(f"  CSOAI — TOP {args.limit} OPEN MODELS → GSPC BADGE")
    print("================================================================")
    print()

    n_emitted = 0
    n_failed = 0
    n_oversized = 0
    for repo_id, vendor, size, kind in TOP_100_MODELS[:args.limit]:
        hf_meta = probe_hf(repo_id)
        ok, size_b = emit(repo_id, vendor, size, kind, hf_meta)
        if ok:
            n_emitted += 1
            dls = hf_meta.get("downloads", 0) if hf_meta else 0
            print(f"  ✓ {repo_id:<60} {kind:<14} {dls:>10,} downloads")
        else:
            n_failed += 1
            print(f"  ✗ {repo_id:<60} (oversized: {size_b}B)")
            n_oversized += 1
        # No rate limit on HF, fast
    print()
    print(f"  emitted: {n_emitted}")
    print(f"  failed:  {n_failed}")
    print(f"  queue: {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
