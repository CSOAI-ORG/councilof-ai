#!/usr/bin/env python3
"""Assemble a self-contained Kaggle kernel for one GSPC batch shard.

The kit (frozen worker, generator, banks, batch TSV, runner) is embedded as a
base64 tar.gz so `kaggle kernels push` uploads one file and the kernel needs no
token or dataset. The kernel re-verifies every pin before the first prompt.
"""
from __future__ import annotations

import argparse, base64, gzip, hashlib, io, json, os, tarfile

HERE = os.path.dirname(os.path.abspath(__file__))
OLLAMA_VERSION = "0.40.6"

KERNEL = r'''# Auto-built by gpu-offload/kaggle-gspc-batch/build_kernel.py. Do not edit.
# GSPC batch __BATCH__ shard __SHARD__ (__LABEL__). Compute only: unsigned, no board write.
import base64, hashlib, io, json, os, subprocess, sys, tarfile, time, urllib.request
KIT_SHA = "__KIT_SHA__"
KIT_B64 = "__KIT_B64__"
raw = base64.b64decode(KIT_B64)
assert hashlib.sha256(raw).hexdigest() == KIT_SHA, "KIT_SHA_MISMATCH"
os.makedirs("/tmp/kit", exist_ok=True)
tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz").extractall("/tmp/kit")
gpus = subprocess.run("nvidia-smi -L", shell=True, capture_output=True, text=True).stdout
print(gpus, flush=True)
n_t4 = gpus.count("T4")
assert n_t4 == 2, f"GPU_SHAPE_MISMATCH want 2xT4 got: {gpus!r}"  # G3 is locked to one GPU type
subprocess.run("apt-get -qq install -y zstd >/dev/null 2>&1 || pip -q install zstandard", shell=True)
url = "https://github.com/ollama/ollama/releases/download/v__OV__/ollama-linux-amd64.tar.zst"
subprocess.run(f"curl -fsSL -o /tmp/ollama.tar.zst {url}", shell=True, check=True)
ollama_tarball_sha256 = hashlib.sha256(open("/tmp/ollama.tar.zst", "rb").read()).hexdigest()
print(f"ollama_tarball_sha256={ollama_tarball_sha256}", flush=True)
subprocess.run("mkdir -p /tmp/ollama && zstd -d /tmp/ollama.tar.zst -c | tar -x -C /tmp/ollama", shell=True, check=True)
env = {**os.environ, "OLLAMA_MODELS": "/tmp/ollama-models", "OLLAMA_NUM_PARALLEL": "1",
       "OLLAMA_MAX_LOADED_MODELS": "1", "OLLAMA_HOST": "127.0.0.1:11434"}
srv = subprocess.Popen(["/tmp/ollama/bin/ollama", "serve"], env=env, stdout=open("/kaggle/working/ollama.log", "w"), stderr=subprocess.STDOUT)
v = None
for _ in range(60):
    try:
        v = urllib.request.urlopen("http://127.0.0.1:11434/api/version", timeout=2).read().decode(); break
    except Exception:
        time.sleep(2)
assert v is not None, "OLLAMA_UNREACHABLE after 120s"
print("ollama", v, flush=True)
assert '"__OV__"' in v, "OLLAMA_VERSION_MISMATCH"
tags_ready = False
for _ in range(30):
    try:
        t = urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=5).read().decode()
        if "models" in json.loads(t): tags_ready = True; break
    except Exception:
        time.sleep(2)
assert tags_ready, "OLLAMA_TAGS_NOT_READY after 60s"
env.update({"GSPC_KIT": "/tmp/kit", "GSPC_BATCH": "__BATCH__", "GSPC_SHARD": "__SHARD__", "GSPC_SHARDS": "__SHARDS__",
            "GSPC_GPU": "kaggle-2xT4", "GSPC_OUT": "/kaggle/working/out", "GSPC_OLLAMA_BIN": "/tmp/ollama/bin/ollama",
            "GSPC_OLLAMA_TARBALL_SHA256": ollama_tarball_sha256, "GSPC_DIAGNOSTIC": "__DIAG__", "GSPC_ITEM_LIMIT": "__ITEM_LIMIT__"})
rc = subprocess.call([sys.executable, "/tmp/kit/runner.py"], env=env)
srv.terminate()
with tarfile.open("/kaggle/working/intake-bundle.tgz", "w:gz") as t:
    t.add("/kaggle/working/out", arcname="out")
h = hashlib.sha256(open("/kaggle/working/intake-bundle.tgz", "rb").read()).hexdigest()
open("/kaggle/working/intake-bundle.tgz.sha256", "w").write(f"{h}  intake-bundle.tgz\n")
print("BUNDLE", h, "rc", rc, flush=True)
sys.exit(rc)
'''


def kit_bytes(batch: str) -> bytes:
    buf = io.BytesIO()
    gz = gzip.GzipFile(fileobj=buf, mode="wb", mtime=0)
    with tarfile.open(fileobj=gz, mode="w", format=tarfile.PAX_FORMAT) as t:
        for rel in ["runner.py", f"batches/{batch}.tsv", "banks/SHA256SUMS",
                    "code/runpod_gspc_worker_serial.py", "code/generate_runpod_gspc_playlist.py"] + \
                   sorted(f"banks/{n}" for n in os.listdir(f"{HERE}/banks") if n.endswith(".jsonl")):
            info = t.gettarinfo(f"{HERE}/{rel}", arcname=rel)
            info.mtime = 0; info.uid = info.gid = 0; info.uname = info.gname = ""
            with open(f"{HERE}/{rel}", "rb") as f:
                t.addfile(info, f)
    gz.close()
    return buf.getvalue()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", required=True)
    ap.add_argument("--shard", default="a")
    ap.add_argument("--shards", type=int, default=3)
    ap.add_argument("--owner", default="nicktempleman")
    ap.add_argument("--out", required=True)
    ap.add_argument("--diagnostic", action="store_true", help="Diagnostic mode: limit models and items")
    ap.add_argument("--item-limit", type=int, default=2, help="Item limit per axis in diagnostic mode")
    a = ap.parse_args()
    raw = kit_bytes(a.batch)
    os.makedirs(a.out, exist_ok=True)
    slug = f"csoai-gspc-{a.batch.lower()}-{a.shard}"
    if a.diagnostic:
        slug = f"{slug}-diag"
    diag_str = "true" if a.diagnostic else "false"
    item_limit_str = str(a.item_limit) if a.diagnostic else "0"
    src = (KERNEL.replace("__KIT_SHA__", hashlib.sha256(raw).hexdigest())
           .replace("__KIT_B64__", base64.b64encode(raw).decode())
           .replace("__BATCH__", a.batch).replace("__SHARD__", a.shard).replace("__SHARDS__", str(a.shards))
           .replace("__LABEL__", "GSPC-G3-Kaggle").replace("__OV__", OLLAMA_VERSION)
           .replace("__DIAG__", diag_str).replace("__ITEM_LIMIT__", item_limit_str))
    open(f"{a.out}/kernel.py", "w").write(src)
    meta = {"id": f"{a.owner}/{slug}", "title": slug.replace("-", " ").title(), "code_file": "kernel.py",
            "language": "python", "kernel_type": "script", "is_private": True, "enable_gpu": True,
            "enable_tpu": False, "enable_internet": True, "machine_shape": "T4",
            "dataset_sources": [], "competition_sources": [], "kernel_sources": [], "model_sources": []}
    json.dump(meta, open(f"{a.out}/kernel-metadata.json", "w"), indent=2)
    print(f"kernel={meta['id']} kit_sha256={hashlib.sha256(raw).hexdigest()} bytes={len(src)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
