#!/usr/bin/env python3
"""
tab5_kaggle_t4_a.py — FREE GPU Connector Tab 5
Sovereign runtime: SOV33_kaggle_a (qwen3:30b-a3b)
Host: Kaggle free kernel — 1× NVIDIA T4 (16GB VRAM, 30h/week)
Tier: Tier 2 (Free / Cloud GPU)
Stub mode: provides a Kaggle-kernel-ready script.
Run inside a Kaggle notebook: enable GPU T4×1, paste this file.
"""
import os
import json
import hashlib

TAB_ID = "tab5_kaggle_t4_a"
MODEL = "qwen3:30b-a3b"
GPU_TYPE = "T4"


def _sigil(payload: str) -> str:
    return hashlib.sha256(f"{TAB_ID}|{payload}".encode("utf-8")).hexdigest()


def connect() -> dict:
    """Detect GPU via torch.cuda when running inside Kaggle kernel."""
    try:
        import torch
        if torch.cuda.is_available():
            return {
                "ok": True,
                "tab": TAB_ID,
                "gpu": GPU_TYPE,
                "device": torch.cuda.get_device_name(0),
                "vram_gb": round(torch.cuda.get_device_properties(0).total_mem / 1e9, 1),
                "cuda_version": torch.version.cuda,
            }
        return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "error": "CUDA not available (kernel needs GPU T4 accelerator)."}
    except ImportError:
        return {
            "ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "status": "stub",
            "host": "Kaggle kernel",
            "kaggle_hint": "Add this file as a Kaggle utility script; enable GPU T4×1 accelerator.",
        }


def run_inference(prompt: str, model: str = MODEL) -> dict:
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
        if not torch.cuda.is_available():
            return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "error": "no CUDA", "sigil": _sigil(f"ERROR|{prompt}|no_cuda")}
        # Lazy-load model on first call to keep kernel cold-start fast
        global _MODEL_CACHE
        if "_MODEL_CACHE" not in globals():
            tok = AutoTokenizer.from_pretrained(model)
            mdl = AutoModelForCausalLM.from_pretrained(model, torch_dtype=torch.float16, device_map="auto")
            _MODEL_CACHE = (tok, mdl)
        tok, mdl = _MODEL_CACHE
        inputs = tok(prompt, return_tensors="pt").to("cuda")
        out = mdl.generate(**inputs, max_new_tokens=256, do_sample=True, temperature=0.7)
        text = tok.decode(out[0], skip_special_tokens=True)
        return {
            "ok": True, "tab": TAB_ID, "tier": "2_cloud_gpu", "gpu": GPU_TYPE, "model": model,
            "prompt": prompt, "response": text, "sigil": _sigil(f"{prompt}|{text}"),
        }
    except ImportError as e:
        return {
            "ok": True, "tab": TAB_ID, "tier": "2_cloud_gpu", "gpu": GPU_TYPE, "status": "stub_no_kernel",
            "model": model, "prompt": prompt,
            "response": f"[STUB-KAGGLE-A] Would run '{prompt[:80]}' on Kaggle T4 with {model}.",
            "sigil": _sigil(f"STUB|{prompt}"),
            "kaggle_hint": "Run inside a Kaggle notebook with GPU T4×1 enabled.",
        }
    except Exception as e:
        return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "error": str(e), "sigil": _sigil(f"ERROR|{prompt}|{e}")}


if __name__ == "__main__":
    print(f"=== {TAB_ID} (Kaggle {GPU_TYPE} stub) ===")
    ping = connect()
    print(json.dumps(ping, indent=2))
    result = run_inference("Test sovereign inference on Kaggle T4-A.")
    print("\n--- run_inference ---")
    print(json.dumps(result, indent=2))
