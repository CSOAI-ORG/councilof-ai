#!/usr/bin/env python3
"""
tab8_oracle_arm_1.py — FREE GPU Connector Tab 8
Sovereign runtime: SOV33_oracle_arm_a (qwen3:0.6b — CPU-optimized)
Host: Oracle Cloud Always-Free ARM A1 — 4 OCPUs / 24GB RAM, NO GPU
Tier: Tier 1 (Free / Cloud CPU) — runs quantized gguf via llama.cpp
Stub mode: SSH into the Oracle ARM VM and run llama.cpp against qwen3 gguf.
"""
import os
import json
import hashlib
import subprocess
import time

TAB_ID = "tab8_oracle_arm_1"
MODEL = "qwen3:0.6b-q4_0"  # CPU-friendly GGUF
ARCH = "ARM A1"
RAM_GB = 24
SSH_HOST = os.environ.get("ORACLE_ARM_1_HOST", "oracle-arm-1.subnet.csoai.vcn")


def _sigil(payload: str) -> str:
    return hashlib.sha256(f"{TAB_ID}|{payload}".encode("utf-8")).hexdigest()


def connect() -> dict:
    """SSH into Oracle ARM VM, check llama.cpp + qwen3 gguf presence."""
    cmd = ["ssh", "-o", "ConnectTimeout=4", "-o", "BatchMode=yes",
           SSH_HOST, "test -x ~/llama.cpp/build/bin/llama-cli && echo HAVE_LLAMA"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        have_llama = "HAVE_LLAMA" in out.stdout
        return {
            "ok": have_llama,
            "tab": TAB_ID,
            "arch": ARCH,
            "ram_gb": RAM_GB,
            "host": SSH_HOST,
            "gpu": "none_cpu_arm",
            "llama_cli": have_llama,
            "stub": not have_llama,
        }
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        return {
            "ok": False, "tab": TAB_ID, "arch": ARCH, "ram_gb": RAM_GB, "host": SSH_HOST, "gpu": "none_cpu_arm",
            "stub": True, "error": str(e),
            "oracle_hint": "Always-Free ARM A1: 4 OCPUs + 24GB RAM. Build llama.cpp on the VM, pull qwen3:0.6b-q4_0 gguf.",
        }


def run_inference(prompt: str, model: str = MODEL) -> dict:
    """Run llama.cpp remotely via SSH. Returns SIGIL-signed stub when unreachable."""
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
                "ok": True, "tab": TAB_ID, "tier": "1_cloud_cpu", "arch": ARCH, "ram_gb": RAM_GB,
                "host": SSH_HOST, "model": model, "prompt": prompt, "response": text,
                "elapsed_ms": elapsed_ms, "sigil": _sigil(f"{prompt}|{text}"),
            }
        return {"ok": False, "tab": TAB_ID, "arch": ARCH, "error": out.stderr[:200], "sigil": _sigil(f"ERROR|{prompt}|ssh")}
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        return {
            "ok": True, "tab": TAB_ID, "tier": "1_cloud_cpu", "arch": ARCH, "ram_gb": RAM_GB,
            "status": "stub_unreachable",
            "model": model, "prompt": prompt,
            "response": f"[STUB-ORACLE-ARM-1] Would SSH into {SSH_HOST} and run llama.cpp qwen3 on prompt: {prompt[:80]}",
            "sigil": _sigil(f"STUB|{prompt}"),
            "oracle_hint": "Always-Free ARM A1 has NO GPU; use quantized gguf via llama.cpp.",
        }


if __name__ == "__main__":
    print(f"=== {TAB_ID} (Oracle {ARCH} stub) ===")
    ping = connect()
    print(json.dumps(ping, indent=2))
    result = run_inference("Test sovereign inference on Oracle ARM A1 slot 1.")
    print("\n--- run_inference ---")
    print(json.dumps(result, indent=2))
