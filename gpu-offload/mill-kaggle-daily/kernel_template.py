# CSOAI GSPC mill — DAILY slice on Kaggle 2x T4 (lane mill-kaggle-daily-20260928).
#
# Successor of the one-off parity kernel nicktempleman/csoai-mill-kaggle-slice-20260926 (qwen2.5:7b x jail on T4,
# 41/70 = 0.5857, identical to all four 3090 receipts). Same instrument, wider slice: ONE fleet model x ALL 14 mill
# axes, exactly the slice shape rp-3090-now's mill-hourly.sh ran every hour until the pod lost its GPU (24 Sep).
#
# The landed mill code (councilof-ai master, commit pinned below) runs UNMODIFIED:
#   scripts/generate_runpod_gspc_playlist.py  -> one pinned job per axis (temperature 0, seed 0, labels 128 tokens,
#                                                keyword banks 1024), exactly the mill-hourly.sh arguments
#   scripts/runpod_gspc_worker.py --config <job> --once
# Inputs are pinned and checked before the first prompt:
#   banks  = the 14 frozen bank files the 3090 graded (bytes carried from rp-3090-now:/workspace/banks-all), each
#            checked here against scripts/runpod_gspc_bank_allowlist.current.json from the pinned code; any miss HALTs
#   model  = the Ollama tag (library or hf.co GGUF), pinned to the manifest digest the 3090 graded (from its intake
#            receipts) or, for the newest class, the digest pinned in newest-models.json on Oracle (PIN_SOURCE);
#            a different digest HALTs
# Compute only: no signing key, no CSOAI secret, no publication. Outputs + an environment record land in
# /kaggle/working; the control plane (oracle-micro-2) pulls them, runs intake, signs and lands.
import base64, datetime, hashlib, io, json, os, platform, shutil, subprocess, sys, tarfile, time, urllib.request
from pathlib import Path

CODE_COMMIT = "@@CODE_COMMIT@@"
CODE_TGZ_SHA256 = "@@CODE_SHA@@"
CODE_TGZ_B64 = "@@CODE_B64@@"
BANKS_TGZ_SHA256 = "@@BANKS_SHA@@"
BANKS_TGZ_B64 = "@@BANKS_B64@@"
MODEL = "@@MODEL@@"
MODEL_DIGEST_3090 = "@@MODEL_DIGEST@@"      # the pinned manifest digest; name kept for continuity, source is PIN_SOURCE
PIN_SOURCE = "@@PIN_SOURCE@@"               # "3090-intake-receipts" (fleet) or "newest-models.json" (newest class)
SLICE_ID = "@@SLICE_ID@@"
REPEATS = int("@@REPEATS@@")                 # 1 = candidate only; 2 adds a same-hardware repeat control
BUDGET_SECONDS = int("@@BUDGET_SECONDS@@")   # grading wall budget; later axes are recorded SKIPPED_BUDGET, never dropped

WS = Path("/tmp/ws")               # workspace_root (NOT /kaggle/working: model blobs must not become output)
OUT = Path("/kaggle/working")
CODE = WS / "code"
BANKS = WS / "banks"
MODELS = WS / "ollama-models"
SLICE = WS / "slice"
LOG = OUT / "kernel.log"
env: dict = {"schema": "csoai.mill-kaggle-environment/0.2", "lane": "mill-kaggle-daily-20260928", "slice_id": SLICE_ID}
T_START = time.time()


def now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    line = f"{now()} {msg}"
    print(line, flush=True)
    with LOG.open("a") as fh:
        fh.write(line + "\n")


def finish(state: str, detail: str = "") -> None:
    env["state"] = state
    env["detail"] = detail
    env["finished_at"] = now()
    env["wall_seconds"] = round(time.time() - T_START, 1)
    (OUT / "environment.json").write_text(json.dumps(env, indent=2, sort_keys=True) + "\n")
    log(f"STATE {state} {detail}")


def halt(state: str, detail: str) -> None:
    finish(state, detail)   # exit 0 so Kaggle keeps /kaggle/working; the control plane reads state=HALT_* and fails loudly
    print(f"HALT {state}: {detail}", flush=True)
    raise SystemExit(0)


def sh(cmd: str, timeout: int = 1800, check: bool = True, env_extra: dict | None = None) -> str:
    e = dict(os.environ); e.update(env_extra or {})
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, env=e)
    if check and r.returncode != 0:
        log(f"CMD FAILED rc={r.returncode}: {cmd}\n{r.stdout[-2000:]}\n{r.stderr[-2000:]}")
        halt("HALT_CMD", cmd)
    return (r.stdout + r.stderr).strip()


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def untar(b64: str, want_sha: str, dest: Path, what: str) -> None:
    raw = base64.b64decode(b64)
    if sha256_bytes(raw) != want_sha:
        halt(f"HALT_{what.upper()}_DIGEST", f"{what} tarball digest mismatch")
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as tf:
        tf.extractall(dest)


OUT.mkdir(parents=True, exist_ok=True)
for d in (WS, CODE, BANKS, MODELS, SLICE):
    d.mkdir(parents=True, exist_ok=True)
env["started_at"] = now()
env["python"] = sys.version.split()[0]
env["platform"] = platform.platform()
env["cpu_count"] = os.cpu_count()
env["kaggle_kernel_run_type"] = os.environ.get("KAGGLE_KERNEL_RUN_TYPE")
env["kaggle_docker_image"] = os.environ.get("KAGGLE_DOCKER_IMAGE") or os.environ.get("KAGGLE_CONTAINER_NAME")

# --- hardware record -----------------------------------------------------------------------------
env["gpu"] = sh("nvidia-smi --query-gpu=index,name,memory.total,driver_version,compute_cap,uuid --format=csv,noheader", check=False)
smi = sh("nvidia-smi", check=False)
env["cuda_version_driver"] = next((l.split("CUDA Version:")[1].split("|")[0].strip() for l in smi.splitlines() if "CUDA Version:" in l), None)
env["nvcc"] = sh("nvcc --version | tail -2", check=False)
log(f"GPU {env['gpu']} CUDA {env['cuda_version_driver']}")
if "T4" not in (env["gpu"] or ""):
    halt("HALT_NO_GPU", f"expected Tesla T4, nvidia-smi said {env['gpu']!r}")

# --- code + banks, both pinned ---------------------------------------------------------------------
untar(CODE_TGZ_B64, CODE_TGZ_SHA256, CODE, "code")
env["code"] = {"commit": CODE_COMMIT, "tgz_sha256": CODE_TGZ_SHA256,
               "files": {str(p.relative_to(CODE)): sha256_file(p) for p in sorted(CODE.rglob("*")) if p.is_file()}}
untar(BANKS_TGZ_B64, BANKS_TGZ_SHA256, BANKS, "banks")
allow = json.loads((CODE / "scripts" / "runpod_gspc_bank_allowlist.current.json").read_text())
pins: dict = {}
for row in allow["banks"]:
    pins.setdefault(row["axis"], set()).add(row["sha256"])
sys.path.insert(0, str(CODE / "scripts"))
import generate_runpod_gspc_playlist as gen  # noqa: E402
env["banks"] = {}
for axis, name in gen.AXES:
    p = BANKS / name
    got = sha256_file(p) if p.is_file() else None
    env["banks"][axis] = {"file": name, "sha256": got, "allowlisted": got in pins.get(axis, set()),
                          "rows": p.read_bytes().count(b"\n") if p.is_file() else None}
    if got not in pins.get(axis, set()):
        halt("HALT_BANK_PIN", f"{axis} bank {name} sha {got} is not the allowlist pin")
log(f"banks: {len(gen.AXES)} axes, every file matches its allowlist pin")

# --- ollama ----------------------------------------------------------------------------------------
t0 = time.time()
sh("apt-get install -y -qq zstd >/dev/null 2>&1 || true", check=False)
sh("curl -fsSL https://ollama.com/install.sh | sh", timeout=1800)
env["ollama_install_seconds"] = round(time.time() - t0, 1)
oenv = {"OLLAMA_MODELS": str(MODELS), "OLLAMA_HOST": "127.0.0.1:11434"}
srv_log = open(OUT / "ollama-serve.log", "w")
srv = subprocess.Popen(["ollama", "serve"], stdout=srv_log, stderr=subprocess.STDOUT, env={**os.environ, **oenv})
for _ in range(60):
    try:
        urllib.request.urlopen("http://127.0.0.1:11434/api/version", timeout=3).read(); break
    except Exception:
        time.sleep(2)
env["ollama_server_version"] = json.loads(urllib.request.urlopen("http://127.0.0.1:11434/api/version", timeout=10).read()).get("version")
log(f"ollama server {env['ollama_server_version']}")
t0 = time.time()
sh(f"ollama pull {MODEL}", timeout=3600, env_extra=oenv)
env["model_pull_seconds"] = round(time.time() - t0, 1)
tags = json.loads(urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=10).read())
digest = next((m["digest"] for m in tags.get("models", []) if m.get("name") == MODEL), None)
env["model_tags_names"] = [m.get("name") for m in tags.get("models", [])]
manifest = gen.model_manifest_path(MODELS / "manifests", MODEL)   # the generator's own resolver: library AND hf.co refs
man_sha = sha256_file(manifest) if manifest.is_file() else None
matches = digest == MODEL_DIGEST_3090 == man_sha
env["model"] = {"tag": MODEL, "tags_digest": digest, "manifest_file_sha256": man_sha, "manifest_path": str(manifest),
                "digest_pin": MODEL_DIGEST_3090, "pin_source": PIN_SOURCE, "matches_pin": matches}
if PIN_SOURCE == "3090-intake-receipts":
    env["model"].update({"digest_3090": MODEL_DIGEST_3090, "matches_3090": matches})
log(f"model {MODEL} digest {digest} manifest {man_sha} pin({PIN_SOURCE}) matches={matches}")
if not matches:
    halt("HALT_MODEL_DIGEST_DIFFERS_FROM_3090" if PIN_SOURCE == "3090-intake-receipts" else "HALT_MODEL_DIGEST_DIFFERS_FROM_PIN",
         f"{MODEL} pulled digest {digest} / manifest {man_sha} != {PIN_SOURCE} pin {MODEL_DIGEST_3090}")

# --- playlist: the mill's generator, all axes, the mill-hourly.sh arguments ---------------------------
env["playlist"] = {"generator": "scripts/generate_runpod_gspc_playlist.py", "axes": [a for a, _ in gen.AXES],
                   "args": ["--max-tokens", "128", "--keyword-max-tokens", "1024"]}
runs_summary = []
budget_hit = False
for rep in range(1, REPEATS + 1):
    sd = SLICE / f"run{rep}"
    rc = gen.main(["--bank-dir", str(BANKS), "--workspace-root", str(WS),
                   "--model-manifest-root", str(MODELS / "manifests"), "--jobs-dir", str(sd / "jobs"),
                   "--output-root", str(sd / "runs"), "--ollama-url", "http://127.0.0.1:11434",
                   "--models", MODEL, "--max-tokens", "128", "--keyword-max-tokens", "1024"])
    if rc != 0:
        halt("HALT_PLAYLIST", f"generator rc={rc}")
    for cfg in sorted((sd / "jobs").glob("*.json")):
        if time.time() - T_START > BUDGET_SECONDS:
            budget_hit = True
            runs_summary.append({"repeat": rep, "job": cfg.name, "rc": None, "state": "SKIPPED_BUDGET"})
            log(f"run{rep} {cfg.name} SKIPPED_BUDGET (wall {round(time.time() - T_START)}s > {BUDGET_SECONDS}s)")
            continue
        t0 = time.time()
        r = subprocess.run([sys.executable, "scripts/runpod_gspc_worker.py", "--config", str(cfg),
                            "--state-dir", str(sd / "state"), "--once"], cwd=CODE, capture_output=True, text=True)
        with (OUT / f"grade-run{rep}.log").open("a") as fh:
            fh.write(f"=== {cfg.name} rc={r.returncode}\n{r.stdout[-20000:]}{r.stderr[-20000:]}\n")
        runs_summary.append({"repeat": rep, "job": cfg.name, "rc": r.returncode, "seconds": round(time.time() - t0, 1)})
        log(f"run{rep} {cfg.name} rc={r.returncode} {round(time.time() - t0, 1)}s")
    shutil.copytree(sd, OUT / "slice" / f"run{rep}", dirs_exist_ok=True)
env["runs"] = runs_summary
for rj in sorted((OUT / "slice").rglob("run.json")):
    r = json.loads(rj.read_text())
    items_p = rj.parent / "items.jsonl"
    items = [json.loads(l) for l in items_p.read_text().splitlines() if l.strip()] if items_p.is_file() else []
    env.setdefault("run_results", []).append({
        "path": str(rj.parent.relative_to(OUT)), "run_id": r.get("run_id"), "counts": r.get("counts"),
        "instrument_sha256": r.get("instrument_sha256"), "items_sha256": r.get("items_sha256"),
        "detail_code": r.get("detail_code"), "items_rows": len(items),
        "done_reason_length": sum(1 for i in items if i.get("done_reason") == "length"),
        "done_reason_present": sum(1 for i in items if "done_reason" in i),
        "raw_output_sha256_list_sha256": sha256_bytes("\n".join(i.get("raw_output_sha256") or "" for i in items).encode())})
env["decode"] = {"temperature": 0, "seed": 0, "max_tokens": 128, "keyword_max_tokens": 1024}
srv.terminate()
failed = [s for s in runs_summary if s.get("rc") not in (0, None)]
if budget_hit:
    finish("PARTIAL_BUDGET", f"{sum(1 for s in runs_summary if s.get('rc') is None)} job(s) skipped over the {BUDGET_SECONDS}s budget")
elif failed:
    finish("COMPLETE_WITH_FAILED_JOBS", f"{len(failed)} job(s) rc!=0: " + ",".join(s["job"] for s in failed))
else:
    finish("COMPLETE", f"{len(runs_summary)} job(s) rc=0")
log("DONE")
