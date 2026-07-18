#!/usr/bin/env python3
"""
tab9_oracle_arm_2.py — FREE GPU Connector Tab 9
Sovereign runtime: SOV33_oracle_arm_b (qwen3:0.6b — CPU-optimized)
Host: Oracle Cloud Always-Free ARM A1 #2 — second 4-OCPU / 24GB VM
Tier: Tier 1 (Free / Cloud CPU) — second free-tier slot for parallel inference
Stub mode: identical pattern to tab8 but for the second Oracle ARM VM.
"""
import os
import json
import hashlib
import subprocess
import time

TAB_ID = "tab9_oracle_arm_2"
MODEL = "qwen3:0.6b-q4_0"
ARCH = "ARM A1"
RAM_GB = 24
SSH_HOST = os.environ.get("ORACLE_ARM_2_HOST", "oracle-arm-2.subnet.csoai.vcn")


def _sigil(payload: str) -> str:
    return hashlib.sha256(f"{TAB_ID}|{payload}".encode("utf-8")).hexdigest()


def connect() -> dict:
    cmd = ["ssh", "-o", "ConnectTimeout=4", "-o", "BatchMode=yes",
           SSH_HOST, "test -x ~/llama.cpp/build/bin/llama-cli && echo HAVE_LLAMA"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        have_llama = "HAVE_LLAMA" in out.stdout
        return {
            "ok": have_llama, "tab": TAB_ID, "arch": ARCH, "ram_gb": RAM_GB, "host": SSH_HOST,
            "gpu": "none_cpu_arm", "llama_cli": have_llama, "stub": not have_llama, "slot": 2,
        }
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        return {
            "ok": False, "tab": TAB_ID, "arch": ARCH, "ram_gb": RAM_GB, "host": SSH_HOST, "gpu": "none_cpu_arm",
            "stub": True, "slot": 2, "error": str(e),
            "oracle_hint": "Second Always-Free ARM A1: 4 OCPUs + 24GB RAM. Use for CPU fan-out.",
        }


def run_inference(prompt: str, model: str = MODEL) -> dict:
    ssh_cmd = [
        "ssh", "-o", "ConnectTimeout=4", "-o", "BatchMode=yes", SSH_HOST,
        f"~/llama.cpp/build/bin/llama-cli -m ~/models/{model}.gguf -p '{prompt}' -n 256 --no-display-prompt"
    ]
    try:
        t0 = time.time()
        out = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=180)
        elapsed_ms = int((time.time() - t0) * 1000)
        if out.returncode == 0:
            text = out.stdout.strip()
            return {
                "ok": True, "tab": TAB_ID, "tier": "1_cloud_cpu", "arch": ARCH, "ram_gb": RAM_GB, "slot": 2,
                "host": SSH_HOST, "model": model, "prompt": prompt, "response": text,
                "elapsed_ms": elapsed_ms, "sigil": _sigil(f"{prompt}|{text}"),
            }
        return {"ok": False, "tab": TAB_ID, "arch": ARCH, "slot": 2, "error": out.stderr[:200], "sigil": _sigil(f"ERROR|{prompt}|ssh")}
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        return {
            "ok": True, "tab": TAB_ID, "tier": "1_cloud_cpu", "arch": ARCH, "ram_gb": RAM_GB, "slot": 2,
            "status": "stub_unreachable", "model": model, "prompt": prompt,
            "response": f"[STUB-ORACLE-ARM-2] Would SSH into {SSH_HOST} and run llama.cpp qwen3 on prompt: {prompt[:80]}",
            "sigil": _sigil(f"STUB|{prompt}"),
            "oracle_hint": "Second Oracle ARM slot for parallel CPU inference.",
        }


if __name__ == "__main__":
    print(f"=== {TAB_ID} (Oracle {ARCH} stub 2) ===")
    ping = connect()
    print(json.dumps(ping, indent=2))
    result = run_inference("Test sovereign inference on Oracle ARM A1 slot 2.")
    print("\n--- run_inference ---")
    print(json.dumps(result, indent=2))
