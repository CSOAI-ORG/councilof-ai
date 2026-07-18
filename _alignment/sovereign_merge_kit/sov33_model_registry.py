
"""
sov33_model_registry.py — 61-model registry with lineage + license tags
Hermes lane (per LANE_TASKS_HERMES.md)

61 open models across 7 pretraining lineages:
  deepseek, gemma, gpt, kimi, mistral, phi, qwen

License filter: Llama MAU = NOT sovereign-safe (Llama community license requires MAU > 700M users).
All others: sovereign-safe.
"""
import json
from pathlib import Path

MODELS = [
    # QWEN LINEAGE (11 models)
    {"name": "qwen3-0.6b", "lineage": "qwen", "size": "0.6B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "sovereign-trained"},
    {"name": "qwen2.5-0.5b", "lineage": "qwen", "size": "0.5B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "fast-embed"},
    {"name": "qwen2.5-1.5b", "lineage": "qwen", "size": "1.5B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "fast-general"},
    {"name": "qwen2.5-3b", "lineage": "qwen", "size": "3B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "general-default"},
    {"name": "qwen2.5-7b", "lineage": "qwen", "size": "7B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "reasoning"},
    {"name": "qwen3-30b-a3b", "lineage": "qwen", "size": "30B-A3B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "MoE-fast"},
    {"name": "qwen3-vl-30b-a3b", "lineage": "qwen", "size": "30B-A3B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "vision"},
    {"name": "qwen3guard-8b", "lineage": "qwen", "size": "8B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "safety-guard"},
    {"name": "qwen2.5-coder-1.5b", "lineage": "qwen", "size": "1.5B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "code"},
    {"name": "qwen2.5-coder-7b", "lineage": "qwen", "size": "7B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "code-7b"},
    {"name": "qwen2.5-math-7b", "lineage": "qwen", "size": "7B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "math"},
    # LLAMA LINEAGE (9 models) — all NOT sovereign-safe due to MAU restriction
    {"name": "llama-3.2-1b", "lineage": "llama", "size": "1B", "license": "llama-community", "sovereign_safe": False, "endpoint": "ollama", "specialty": "fast", "sovereign_note": "Llama community license requires MAU>700M"},
    {"name": "llama-3.2-3b", "lineage": "llama", "size": "3B", "license": "llama-community", "sovereign_safe": False, "endpoint": "ollama", "specialty": "general", "sovereign_note": "MAU restriction"},
    {"name": "llama-3.1-8b", "lineage": "llama", "size": "8B", "license": "llama-community", "sovereign_safe": False, "endpoint": "ollama", "specialty": "general", "sovereign_note": "MAU restriction"},
    {"name": "llama-3.1-70b", "lineage": "llama", "size": "70B", "license": "llama-community", "sovereign_safe": False, "endpoint": "oracle-genai", "specialty": "general-70b", "sovereign_note": "MAU restriction"},
    {"name": "llama-3.3-70b", "lineage": "llama", "size": "70B", "license": "llama-community", "sovereign_safe": False, "endpoint": "oracle-genai", "specialty": "general-70b-v3", "sovereign_note": "MAU restriction"},
    {"name": "llama-3.3-70b-versatile", "lineage": "llama", "size": "70B", "license": "llama-community", "sovereign_safe": False, "endpoint": "groq", "specialty": "general-70b-groq", "sovereign_note": "MAU restriction + Groq"},
    {"name": "llama-3.1-nemotron-70b", "lineage": "llama", "size": "70B", "license": "llama-community", "sovereign_safe": False, "endpoint": "nvidia", "specialty": "reasoning-70b", "sovereign_note": "MAU restriction"},
    {"name": "tinyllama-1.1b", "lineage": "llama", "size": "1.1B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "tiny-fast"},
    {"name": "llama-3.2-vision-11b", "lineage": "llama", "size": "11B", "license": "llama-community", "sovereign_safe": False, "endpoint": "ollama", "specialty": "vision", "sovereign_note": "MAU restriction"},
    # MISTRAL LINEAGE (10 models)
    {"name": "mistral-7b", "lineage": "mistral", "size": "7B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "general"},
    {"name": "mistral-nemo", "lineage": "mistral", "size": "12B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "general-12b"},
    {"name": "mistral-small", "lineage": "mistral", "size": "22B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "general-22b"},
    {"name": "mistral-large", "lineage": "mistral", "size": "123B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "large-general"},
    {"name": "mixtral-8x7b", "lineage": "mistral", "size": "47B-MoE", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "MoE-mix"},
    {"name": "codestral-22b", "lineage": "mistral", "size": "22B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "code"},
    {"name": "mistral-7b-instruct-v0.3", "lineage": "mistral", "size": "7B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "instruct"},
    {"name": "mistral-7b-instruct-v0.2", "lineage": "mistral", "size": "7B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "instruct-v0.2"},
    {"name": "ministral-8b", "lineage": "mistral", "size": "8B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "edge"},
    {"name": "pixtral-12b", "lineage": "mistral", "size": "12B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "vision"},
    # DEEPSEEK LINEAGE (9 models)
    {"name": "deepseek-v2-lite", "lineage": "deepseek", "size": "16B-MoE", "license": "deepseek", "sovereign_safe": True, "endpoint": "ollama", "specialty": "MoE-lite"},
    {"name": "deepseek-v2", "lineage": "deepseek", "size": "236B-MoE", "license": "deepseek", "sovereign_safe": True, "endpoint": "cloud", "specialty": "MoE-large"},
    {"name": "deepseek-coder-v2", "lineage": "deepseek", "size": "236B-MoE", "license": "deepseek", "sovereign_safe": True, "endpoint": "cloud", "specialty": "code-MoE"},
    {"name": "deepseek-r1", "lineage": "deepseek", "size": "671B-MoE", "license": "MIT", "sovereign_safe": True, "endpoint": "cloud", "specialty": "reasoning-MoE"},
    {"name": "deepseek-r1-distill-qwen-1.5b", "lineage": "deepseek", "size": "1.5B", "license": "MIT", "sovereign_safe": True, "endpoint": "ollama", "specialty": "reasoning-distill"},
    {"name": "deepseek-r1-distill-qwen-7b", "lineage": "deepseek", "size": "7B", "license": "MIT", "sovereign_safe": True, "endpoint": "ollama", "specialty": "reasoning-distill-7b"},
    {"name": "deepseek-r1-distill-llama-8b", "lineage": "deepseek", "size": "8B", "license": "MIT", "sovereign_safe": True, "endpoint": "ollama", "specialty": "reasoning-distill-8b"},
    {"name": "deepseek-coder-6.7b", "lineage": "deepseek", "size": "6.7B", "license": "deepseek", "sovereign_safe": True, "endpoint": "ollama", "specialty": "code-base"},
    {"name": "deepseek-llm-7b", "lineage": "deepseek", "size": "7B", "license": "deepseek", "sovereign_safe": True, "endpoint": "ollama", "specialty": "general-base"},
    # GEMMA LINEAGE (8 models)
    {"name": "gemma-2b", "lineage": "gemma", "size": "2B", "license": "gemma", "sovereign_safe": True, "endpoint": "ollama", "specialty": "fast"},
    {"name": "gemma-7b", "lineage": "gemma", "size": "7B", "license": "gemma", "sovereign_safe": True, "endpoint": "ollama", "specialty": "general"},
    {"name": "gemma2-2b", "lineage": "gemma", "size": "2B", "license": "gemma", "sovereign_safe": True, "endpoint": "ollama", "specialty": "fast-v2"},
    {"name": "gemma2-9b", "lineage": "gemma", "size": "9B", "license": "gemma", "sovereign_safe": True, "endpoint": "ollama", "specialty": "general-v2"},
    {"name": "gemma2-27b", "lineage": "gemma", "size": "27B", "license": "gemma", "sovereign_safe": True, "endpoint": "cloud", "specialty": "general-v2-27b"},
    {"name": "gemma3-4b", "lineage": "gemma", "size": "4B", "license": "gemma", "sovereign_safe": True, "endpoint": "ollama", "specialty": "sovereign-brain-default"},
    {"name": "gemma-2-9b-instruct", "lineage": "gemma", "size": "9B", "license": "gemma", "sovereign_safe": True, "endpoint": "ollama", "specialty": "instruct"},
    {"name": "gemma3-12b", "lineage": "gemma", "size": "12B", "license": "gemma", "sovereign_safe": True, "endpoint": "cloud", "specialty": "general-12b"},
    # PHI LINEAGE (5 models, all MIT)
    {"name": "phi-3-mini", "lineage": "phi", "size": "3.8B", "license": "MIT", "sovereign_safe": True, "endpoint": "ollama", "specialty": "fast-reasoning"},
    {"name": "phi-3-small", "lineage": "phi", "size": "7B", "license": "MIT", "sovereign_safe": True, "endpoint": "ollama", "specialty": "small-reasoning"},
    {"name": "phi-3-medium", "lineage": "phi", "size": "14B", "license": "MIT", "sovereign_safe": True, "endpoint": "cloud", "specialty": "medium-reasoning"},
    {"name": "phi-4", "lineage": "phi", "size": "14B", "license": "MIT", "sovereign_safe": True, "endpoint": "cloud", "specialty": "reasoning-v4"},
    {"name": "phi-4-mini", "lineage": "phi", "size": "3.8B", "license": "MIT", "sovereign_safe": True, "endpoint": "ollama", "specialty": "mini-reasoning"},
    # KIMI LINEAGE (4 models)
    {"name": "kimi-k2.5", "lineage": "kimi", "size": "?", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "long-context"},
    {"name": "moonshot-v1-8k", "lineage": "kimi", "size": "?", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "8k-context"},
    {"name": "moonshot-v1-32k", "lineage": "kimi", "size": "?", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "32k-context"},
    {"name": "moonshot-v1-128k", "lineage": "kimi", "size": "?", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "128k-context"},
    # GPT (open variants only)
    {"name": "gpt-neox-20b", "lineage": "gpt", "size": "20B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "open-gpt"},
    {"name": "distilgpt2", "lineage": "gpt", "size": "0.1B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "tiny"},
    {"name": "falcon3-1b", "lineage": "gpt", "size": "1B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "edge-fast"},
    {"name": "falcon3-7b", "lineage": "gpt", "size": "7B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "ollama", "specialty": "general"},
    {"name": "falcon3-10b", "lineage": "gpt", "size": "10B", "license": "apache-2.0", "sovereign_safe": True, "endpoint": "cloud", "specialty": "general-10b"},
]

LINEAGES = {}
SOVEREIGN_SAFE = 0
NOT_SOVEREIGN_SAFE = 0
for m in MODELS:
    LINEAGES.setdefault(m["lineage"], []).append(m["name"])
    if m["sovereign_safe"]:
        SOVEREIGN_SAFE += 1
    else:
        NOT_SOVEREIGN_SAFE += 1

def get_registry():
    return {
        "models": MODELS,
        "total": len(MODELS),
        "lineages": {l: len(v) for l, v in LINEAGES.items()},
        "sovereign_safe_count": SOVEREIGN_SAFE,
        "not_sovereign_safe_count": NOT_SOVEREIGN_SAFE,
        "license_filter_note": "Llama community license requires MAU>700M users. Models with this license are flagged NOT-sovereign-safe.",
    }

def get_sovereign_safe():
    return [m for m in MODELS if m["sovereign_safe"]]

def get_by_lineage(lineage):
    return [m for m in MODELS if m["lineage"] == lineage]

if __name__ == "__main__":
    import sys
    reg = get_registry()
    print("Total models:", reg["total"])
    print("Lineages:", reg["lineages"])
    print("Sovereign-safe:", reg["sovereign_safe_count"])
    print("NOT sovereign-safe (Llama MAU):", reg["not_sovereign_safe_count"])
