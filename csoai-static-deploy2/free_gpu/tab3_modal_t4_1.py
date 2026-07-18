#!/usr/bin/env python3
"""
tab3_modal_t4_1.py — FREE GPU Connector Tab 3
Sovereign runtime: SOV33_modal_a (qwen3:30b-a3b)
Host: Modal Labs free tier — 1× NVIDIA T4 (16GB VRAM, ~30h/month)
Tier: Tier 2 (Free / Cloud GPU) — Modal `nvidia-t4` modal.GPU()
Stub mode: defines the deployment script. Deploy with `modal deploy tab3_modal_t4_1.py`.
"""
import os
import time
import hashlib
import json
from typing import Optional

try:
    import modal  # pip install modal
    MODAL_AVAILABLE = True
except ImportError:
    MODAL_AVAILABLE = False

TAB_ID = "tab3_modal_t4_1"
MODEL = "qwen3:30b-a3b"
GPU_TYPE = "T4"
ENDPOINT_NAME = "sov33-modal-t4-1"


# ---------- Modal app definition (deployable) ----------
if MODAL_AVAILABLE:
    app = modal.App(ENDPOINT_NAME)

    image = (
        modal.Image.debian_slim(python_version="3.11")
        .pip_install("vllm", "huggingface-hub", "fastapi")
        .env({"HF_HOME": "/cache/hf"})
    )

    @app.function(
        gpu=modal.gpu.T4(),
        image=image,
        timeout=600,
        container_idle_timeout=120,
        secrets=[],
    )
    @modal.web_endpoint(method="POST")
    def generate(req: dict) -> dict:
        from vllm import LLM, SamplingParams
        prompt = req.get("prompt", "Hello, sovereign.")
        model_id = req.get("model", MODEL)
        llm = LLM(model=model_id, dtype="bfloat16", max_model_len=4096)
        params = SamplingParams(temperature=0.7, max_tokens=256)
        out = llm.generate([prompt], params)
        text = out[0].outputs[0].text
        sigil = hashlib.sha256(f"{TAB_ID}|{prompt}|{text}".encode()).hexdigest()
        return {"ok": True, "tab": TAB_ID, "response": text, "sigil": sigil, "gpu": GPU_TYPE}


# ---------- Local connector (stub when modal not running) ----------
def _sigil(payload: str) -> str:
    return hashlib.sha256(f"{TAB_ID}|{payload}".encode("utf-8")).hexdigest()


def connect() -> dict:
    """Ping the Modal deployment. Looks for the deployed webhook URL."""
    endpoint = os.environ.get("MODAL_T4_1_URL", "")
    if not endpoint:
        return {
            "ok": False,
            "tab": TAB_ID,
            "gpu": GPU_TYPE,
            "status": "stub",
            "endpoint_name": ENDPOINT_NAME,
            "deploy_hint": "modal deploy tab3_modal_t4_1.py",
            "note": "Free-tier T4 deploys on demand; not always-on.",
        }
    try:
        import urllib.request
        with urllib.request.urlopen(endpoint, timeout=4) as r:
            return {"ok": True, "tab": TAB_ID, "gpu": GPU_TYPE, "endpoint": endpoint, "version": r.read().decode()}
    except Exception as e:
        return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "endpoint": endpoint, "error": str(e)}


def run_inference(prompt: str, model: str = MODEL) -> dict:
    """Call the Modal T4 endpoint, or return a stub when not deployed."""
    endpoint = os.environ.get("MODAL_T4_1_URL")
    if not endpoint:
        sigil = _sigil(f"STUB|{prompt}")
        return {
            "ok": True,
            "tab": TAB_ID,
            "tier": "2_cloud_gpu",
            "gpu": GPU_TYPE,
            "model": model,
            "status": "stub_undeployed",
            "prompt": prompt,
            "response": f"[STUB] Would dispatch '{prompt[:80]}' to Modal {GPU_TYPE} running {model}.",
            "sigil": sigil,
            "deploy": "modal deploy tab3_modal_t4_1.py",
        }
    try:
        import urllib.request
        body = json.dumps({"prompt": prompt, "model": model}).encode()
        req = urllib.request.Request(
            endpoint,
            data=body,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read().decode())
        return {"ok": True, "tab": TAB_ID, "tier": "2_cloud_gpu", "gpu": GPU_TYPE, **data}
    except Exception as e:
        return {"ok": False, "tab": TAB_ID, "gpu": GPU_TYPE, "error": str(e), "sigil": _sigil(f"ERROR|{prompt}|{e}")}


if __name__ == "__main__":
    print(f"=== {TAB_ID} (Modal {GPU_TYPE} stub) ===")
    print(f"modal_available={MODAL_AVAILABLE}")
    ping = connect()
    print(json.dumps(ping, indent=2))
    result = run_inference("Test sovereign inference on Modal T4 #1.")
    print("\n--- run_inference ---")
    print(json.dumps(result, indent=2))
