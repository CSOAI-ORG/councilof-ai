"""Bounded Cosmos3-Nano Reasoner profile for an existing GPU Space.

Run --plan to validate configuration without importing torch, downloading model
weights, starting a server or spending GPU compute. Secrets are never printed.
"""
import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import threading

MODEL = "nvidia/Cosmos3-Nano"
REVISION = "cec9d585b8e12e5aae0d6508aea94b1f25a35b46"
SERVED_MODEL = "meok-cosmos3-nano"


def command(env):
    # This profile pins one known source; model-family changes need their own
    # qualified profile, licence review and task evaluation.
    key = env.get("VLLM_API_KEY", "")
    if (not isinstance(key, str) or not 32 <= len(key) <= 8192
            or any(ord(char) < 33 or ord(char) > 126 for char in key)):
        raise ValueError("Set VLLM_API_KEY as a Space secret of 32..8192 visible ASCII characters")
    return [
        "vllm", "serve", MODEL,
        "--revision", REVISION,
        "--tokenizer-revision", REVISION,
        "--served-model-name", SERVED_MODEL,
        "--host", "127.0.0.1", "--port", "8000",
        "--tensor-parallel-size", "1",
        "--mm-encoder-tp-mode", "data",
        "--async-scheduling",
        "--dtype", "bfloat16",
        "--max-model-len", "8192",
        "--max-num-seqs", "2",
        "--gpu-memory-utilization", "0.85",
        "--language-model-only",
        "--generation-config", "vllm",
        "--no-enable-log-requests",
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", action="store_true")
    args = parser.parse_args()
    try:
        argv = command(os.environ)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2
    plan = {
        "state": "CONFIGURATION_ONLY" if args.plan else "STARTING_UNVERIFIED",
        "model": MODEL,
        "revision": REVISION,
        "served_model": SERVED_MODEL,
        "context_tokens": 8192,
        "maximum_sequences": 2,
        "authentication_required": True,
        "training": False,
        "durable_memory": False,
        "tool_execution": False,
    }
    if args.plan:
        print(json.dumps(plan, indent=2))
        return 0
    import torch
    if not torch.cuda.is_available():
        print("GPU_REQUIRED: this profile requires an NVIDIA CUDA GPU", file=sys.stderr)
        return 3
    major, _ = torch.cuda.get_device_capability(0)
    if major < 8:
        print("GPU_UNSUPPORTED: BF16 profile requires compute capability 8.0+", file=sys.stderr)
        return 3
    memory_gib = torch.cuda.get_device_properties(0).total_memory / 1024**3
    if memory_gib < 40:
        print("GPU_TOO_SMALL: this unquantised profile targets one 48 GB GPU", file=sys.stderr)
        return 3
    print(json.dumps(plan), flush=True)
    # vLLM's own key does not secure every endpoint. Keep it on loopback;
    # only the authenticated allowlist proxy is exposed on Space port 7860.
    # Both processes read the key from the environment, never from argv.
    stopping = threading.Event()
    for signum in (signal.SIGTERM, signal.SIGINT):
        signal.signal(signum, lambda *_: stopping.set())
    processes = []
    exit_code = 0
    try:
        processes.append(subprocess.Popen(argv))
        processes.append(subprocess.Popen([sys.executable, str(Path(__file__).with_name("proxy.py"))]))
        while not stopping.wait(0.5):
            if any(process.poll() is not None for process in processes):
                print("SERVING_PROCESS_EXITED: stopping both serving processes", file=sys.stderr)
                exit_code = 1
                break
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
