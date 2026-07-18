#!/usr/bin/env python3
"""
tab6_kaggle_t4_b.py — FREE GPU Connector Tab 6
Sovereign runtime: SOV33_kaggle_b (qwen3:30b-a3b)
Host: Kaggle free kernel #2 — parallel T4 fan-out slot
Tier: Tier 2 (Free / Cloud GPU)
Stub mode: provides a second Kaggle-kernel-ready script.
"""
import os
import json
import hashlib

TAB_ID = "tab6_kaggle_t4_b"
MODEL = "qwen3:30b-a3b"
GPU_TYPE = "T4"


def _sigil(payload: str) -> str:
    return hashlib.sha256(f"{TAB_ID}|{payload}".encode("utf-8")).hexdigest()


def connect() -> dict:
    try:
        import torch
        if torch.cuda.is_available():
            return {
                "ok": True, "tab": TAB_ID, "gpu": GPU_TYPE,
                "device": torch.cuda.get_device_name(0),
                "vram_gb": round(torch.cuda.get_device_properties(0).total_mem / 1e9, 1),
                "cuda_version": torch.version.cuda,
                "slot": "B",
            }
        return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "error": "CUDA not available.", "slot": "B"}
    except ImportError:
        return {
            "ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "status": "stub", "host": "Kaggle kernel B",
            "kaggle_hint": "Second Kaggle notebook with GPU T4×1 accelerator.",
        }


def run_inference(prompt: str, model: str = MODEL) -> dict:
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
        if not torch.cuda.is_available():
            return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "error": "no CUDA", "sigil": _sigil(f"ERROR|{prompt}|no_cuda")}
        global _MODEL_CACHE_B
        if "_MODEL_CACHE_B" not in globals():
            tok = AutoTokenizer.from_pretrained(model)
            mdl = AutoModelForCausalLM.from_pretrained(model, torch_dtype=torch.float16, device_map="auto")
            _MODEL_CACHE_B = (tok, mdl)
        tok, mdl = _MODEL_CACHE_B
        inputs = tok(prompt, return_tensors="pt").to("cuda")
        out = mdl.generate(**inputs, max_new_tokens=256, do_sample=True, temperature=0.7)
        text = tok.decode(out[0], skip_special_tokens=True)
        return {
            "ok": True, "tab": TAB_ID, "tier": "2_cloud_gpu", "gpu": GPU_TYPE, "model": model, "slot": "B",
            "prompt": prompt, "response": text, "sigil": _sigil(f"{prompt}|{text}"),
        }
    except ImportError:
        return {
            "ok": True, "tab": TAB_ID, "tier": "2_cloud_gpu", "gpu": GPU_TYPE, "status": "stub_no_kernel", "slot": "B",
            "model": model, "prompt": prompt,
            "response": f"[STUB-KAGGLE-B] Would run '{prompt[:80]}' on Kaggle T4 slot B.",
            "sigil": _sigil(f"STUB|{prompt}"),
            "kaggle_hint": "Run inside Kaggle notebook B with GPU T4×1 enabled.",
        }
    except Exception as e:
        return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "error": str(e), "sigil": _sigil(f"ERROR|{prompt}|{e}")}


if __name__ == "__main__":
    print(f"=== {TAB_ID} (Kaggle {GPU_TYPE} stub B) ===")
    ping = connect()
    print(json.dumps(ping, indent=2))
    result = run_inference("Test sovereign inference on Kaggle T4-B.")
    print("\n--- run_inference ---")
    print(json.dumps(result, indent=2))
