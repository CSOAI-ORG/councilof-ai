#!/usr/bin/env python3
"""Grade hub-queue models on the pod itself: pull GGUF -> grade -> evict.

Why
---
The mill grades through provider APIs, and the pod holds none of the ten keys, so
"move the mill to RunPod" reads as blocked. It is not: `ollama pull hf.co/<repo>`
fetches any GGUF repo on the Hub, and the pod has 199 GB of EPHEMERAL container
disk (`/`, 1% used) that nobody was using, plus a GPU that has been idle at 1 MiB
of 24,576. Measured 2026-09-06: a 380 MB pull landed on /opt, generated `COMPLY`,
took the GPU to 1194 MiB, and left /workspace untouched at 4.1 G.

So this needs no provider key at all. It reaches a different population from the
router — the GGUF subset rather than the 470 provider-served models — and on a
40-model sample of the queue that subset looked LARGER, though the figure is a
ceiling (see docs).

What it is not
--------------
It is an ORCHESTRATOR, not a grader. Grading stays in `runpod_gspc_worker.py` and
config generation in `generate_runpod_gspc_playlist.py`, both already tested and
both unchanged here. A second grader would be a second opinion about what
MEASURED means, and the estate has been bitten by two places deciding that (#1155).

It never signs, never marks MEASURED, and never writes the board. It produces the
same UNSIGNED staged cards the pod already produces.

Disk discipline
---------------
Weights go to the EPHEMERAL store and are evicted after each model, so peak usage
is one model, not the whole sweep. Run outputs go to the DURABLE volume, because
ephemeral is correct for weights and wrong for measurements. If the pull would
take the ephemeral filesystem below its own low-water mark the model is skipped,
not force-pulled.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

QUEUE = "https://huggingface.co/datasets/csoai/hub-queue/resolve/main/queue.jsonl"


def sh(cmd: list[str], env: dict | None = None, timeout: int = 1800) -> tuple[int, str]:
    e = dict(os.environ)
    e.update(env or {})
    p = subprocess.run(cmd, capture_output=True, text=True, env=e, timeout=timeout)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def free_bytes(path: str) -> int:
    s = os.statvfs(path)
    return s.f_bavail * s.f_frsize


def gguf_repo_for(model_id: str, token: str) -> str | None:
    """An EXACT-name GGUF mirror for a queue model, or None.

    Exact means the candidate repo's name, with a -GGUF/.gguf suffix removed, equals
    the model's name. A loose "any gguf search hit" match overcounted availability by
    60% on a 40-model sample (48% -> 30%): it matches differently-named models that
    merely share a word. Availability claims must state their match rule.
    """
    name = model_id.split("/")[-1]
    url = f"https://huggingface.co/api/models?search={urllib.parse.quote(name)}&filter=gguf&limit=20"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"} if token else {})
    try:
        hits = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except Exception:
        return None  # UNCHECKABLE, not "no GGUF" — the caller counts these separately
    for h in hits:
        rid = str(h.get("id") or "")
        tail = rid.split("/")[-1].lower()
        if tail.replace("-gguf", "").replace(".gguf", "") == name.lower():
            return rid
    return None


def quant_tag_for(repo: str, token: str, preferred: str) -> str | None:
    """The quantisation tag this repo ACTUALLY publishes, or None.

    Assuming a fixed tag fails: Qwen/Qwen3-0.6B-GGUF publishes exactly one file,
    Qwen3-0.6B-Q8_0.gguf, so a hardcoded Q4_K_M pull dies with "The specified tag is
    not available in the repository". Quantisation naming is a per-uploader choice, not
    a standard, so it has to be read rather than guessed. Preference is honoured when
    present (smaller is cheaper to pull and grade); otherwise the repo's own smallest
    file wins, and a repo with no .gguf at all returns None rather than a bad tag.
    """
    url = f"https://huggingface.co/api/models/{repo}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"} if token else {})
    try:
        d = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except Exception:
        return None
    quants = []
    for sib in d.get("siblings") or []:
        fn = str(sib.get("rfilename") or "")
        if not fn.lower().endswith(".gguf") or "/" in fn:
            continue
        stem = fn[: -len(".gguf")]
        # <name>-<QUANT>.gguf -- the quant is the last dash-separated chunk
        if "-" in stem:
            quants.append(stem.rsplit("-", 1)[1])
    if not quants:
        return None
    for q in quants:
        if q.upper() == preferred.upper():
            return q
    return sorted(quants)[0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--axis", required=True)
    ap.add_argument("--bank-dir", required=True, help="dir holding <axis>.jsonl frozen banks")
    ap.add_argument("--models", nargs="*", default=[], help="queue model ids; default: read --queue-file")
    ap.add_argument("--queue-file", default="", help="queue.jsonl to pick from when --models is empty")
    ap.add_argument("--limit", type=int, default=5)
    ap.add_argument("--ephemeral-root", default="/opt/gspc-models")
    ap.add_argument("--scratch-root", default="/opt", help="the generator's workspace_root; weights, jobs and raw output live here")
    ap.add_argument("--output-root", default="/opt/gspc-out", help="generator output, under --scratch-root")
    ap.add_argument("--durable-root", default="/workspace/gspc-24x7-local", help="run outputs are COPIED here after each model")
    ap.add_argument("--jobs-dir", default="/opt/gspc-jobs")
    ap.add_argument("--ollama-url", default="http://127.0.0.1:11500")
    ap.add_argument("--ollama-bin", default="/workspace/ollama-bin/bin/ollama")
    ap.add_argument("--ephemeral-low-water-bytes", type=int, default=20 * 1024**3)
    ap.add_argument("--quantisation", default="Q4_K_M", help="preferred quant; the repo's actual tags are read and this is used only if present")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    token = (os.environ.get("HF_TOKEN") or "").strip()
    ephem = Path(args.ephemeral_root)
    # A dry run touches NOTHING. Creating the store here made --dry-run fail off-pod with
    # PermissionError on /opt, which would have made "can I plan this sweep?" answerable
    # only on the machine that runs it.
    # generate_runpod_gspc_playlist.py requires bank_dir, model_manifest_root, jobs_dir
    # and output_root to all resolve BELOW workspace_root -- a containment guard, and a
    # correct one. Rather than weaken it, the generator is run entirely inside the
    # ephemeral tree and the durable artefacts are copied out afterwards, which is the
    # same "ephemeral weights, durable measurements" split stated explicitly instead of
    # by handing the generator two roots.
    scratch_banks = Path(args.scratch_root) / "gspc-banks"
    if not args.dry_run:
        ephem.mkdir(parents=True, exist_ok=True)
        scratch_banks.mkdir(parents=True, exist_ok=True)
        for b in Path(args.bank_dir).glob("*.jsonl"):
            dst = scratch_banks / b.name
            if not dst.is_file() or dst.stat().st_size != b.stat().st_size:
                shutil.copy2(b, dst)

    ids = list(args.models)
    if not ids and args.queue_file:
        # Only GENERATIVE models. The banks grade a reply against COMPLY/REFUSE or a
        # keyword predicate, so an embedding or encoder repo cannot be graded on them at
        # all. Without this filter the queue head hands back all-MiniLM, bert-base-uncased
        # and two bge encoders -- four pulls that could never produce a card. `pipeline_tag`
        # is on the queue row, so this costs nothing and is checked before any download.
        rows = []
        for line in Path(args.queue_file).read_text().splitlines():
            if not line.strip():
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            if str(r.get("pipeline_tag") or "") == "text-generation":
                rows.append(str(r.get("id") or ""))
        ids = [r for r in rows if r][: args.limit * 8]
    if not ids:
        print("UNCHECKABLE: no models given and no queue file to read", file=sys.stderr)
        return 2

    host = args.ollama_url.split("//", 1)[-1]
    env = {"OLLAMA_HOST": host, "OLLAMA_MODELS": args.ephemeral_root}

    picked = graded = skipped_nogguf = skipped_disk = failed = 0
    for mid in ids:
        if picked >= args.limit:
            break
        repo = gguf_repo_for(mid, token)
        if not repo:
            skipped_nogguf += 1
            continue
        q = quant_tag_for(repo, token, args.quantisation)
        if not q:
            # A GGUF-tagged repo with no readable .gguf file is not a pull we can make.
            print(f"SKIP {repo} — no readable .gguf quantisation in the repo")
            skipped_nogguf += 1
            continue
        tag = f"hf.co/{repo}:{q}"
        picked += 1
        if args.dry_run:
            print(f"WOULD PULL {tag}   (for queue model {mid})")
            continue

        if free_bytes("/") < args.ephemeral_low_water_bytes:
            # Refuse rather than force-pull: a filled ephemeral disk takes the whole pod
            # down, including the worker that has nothing to do with this run.
            print(f"SKIP {tag} — ephemeral free {free_bytes('/')/1e9:.1f} GB below low-water")
            skipped_disk += 1
            continue

        rc, out = sh([args.ollama_bin, "pull", tag], env=env, timeout=3600)
        if rc != 0:
            print(f"PULL FAILED {tag}: {out.strip().splitlines()[-1][:120] if out.strip() else rc}")
            failed += 1
            continue

        try:
            rc, out = sh([
                sys.executable, str(Path(__file__).resolve().parent / "generate_runpod_gspc_playlist.py"),
                "--workspace-root", args.scratch_root,
                "--bank-dir", str(scratch_banks),
                "--model-manifest-root", args.ephemeral_root,
                "--jobs-dir", args.jobs_dir,
                "--output-root", args.output_root,
                "--ollama-url", args.ollama_url,
                "--models", tag,
            ], env=env, timeout=600)
            if rc != 0:
                print(f"CONFIG FAILED {tag}: {out.strip()[-200:]}")
                failed += 1
                continue
            cfgs = sorted(Path(args.jobs_dir).glob(f"*{args.axis}*.json"))
            if not cfgs:
                print(f"NO CONFIG for axis {args.axis} on {tag} — the generator emitted none")
                failed += 1
                continue
            rc, out = sh([
                sys.executable, str(Path(__file__).resolve().parent / "runpod_gspc_worker.py"),
                "--config", str(cfgs[-1]), "--once",
            ], env=env, timeout=3600)
            print(f"{'GRADED' if rc == 0 else 'GRADE FAILED'} {mid} via {tag} rc={rc}")
            if rc == 0:
                # Measurements must outlive the container. /opt does not survive a pod
                # restart; /workspace does.
                src, dur = Path(args.output_root), Path(args.durable_root)
                moved = 0
                for f in src.rglob("*"):
                    if f.is_file():
                        rel = f.relative_to(src)
                        (dur / rel).parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(f, dur / rel)
                        moved += 1
                print(f"  copied {moved} output file(s) to the durable volume")
            graded += rc == 0
            failed += rc != 0
        finally:
            # Evict ALWAYS, including on failure: peak disk must stay one model.
            sh([args.ollama_bin, "rm", tag], env=env, timeout=600)

    print(
        f"local-mill axis={args.axis} picked={picked} graded={graded} "
        f"no-gguf={skipped_nogguf} skipped-disk={skipped_disk} failed={failed}"
        + (" DRY RUN" if args.dry_run else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
