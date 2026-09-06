#!/usr/bin/env python3
"""Walk the GGUF-reachable queue across axes. No Hub lookups at run time.

Three things this works around rather than patching a pinned release mid-run:

1. runpod_gspc_local_mill.py always reads the HEAD of --queue-file, so a loop around it
   re-grades the same models forever. A ledger and explicit --models fixes that.
2. Its pull subprocess gets a REPLACEMENT env -- {"OLLAMA_HOST", "OLLAMA_MODELS"} with no
   PATH and no HOME -- and OLLAMA_MODELS is meaningless anyway, because the store belongs
   to the already-running daemon (OLLAMA_MODELS=/workspace/ollama-models). The pull never
   lands a manifest where the generator looks, so every model fails at CONFIG. Pull here.
3. quant_tag_for() catches EVERY exception and returns None, so an anonymous rate-limit
   reads as "this repo publishes no quantisation". At 06:13Z that marked Qwen/Qwen3-0.6B
   NO_QUANT on all twelve axes three minutes after it graded fine via Q8_0. Tags are now
   resolved once, with backoff, into /workspace/gguf-quants.jsonl, and a lookup that
   failed is UNCHECKABLE there -- absent from this run rather than recorded as done.

jail is excluded: /workspace/gspc-banks/gspc-jail.jsonl has no prompts in it -- its items are
the placeholder strings "jail-000", "jail-001". swarm is excluded: its pod bank has 8
rows, so every card is n<30 unquotable by construction. Both wait on PR #1545.
"""
import hashlib, json, os, re, shutil, subprocess, sys, time
from pathlib import Path

REL = sys.argv[1]
SHARD = int(sys.argv[2]) if len(sys.argv) > 2 else 0
SHARDS = int(sys.argv[3]) if len(sys.argv) > 3 else 1
S = Path(f"/workspace/gspc-worker/releases/{REL}/scripts")
MANIFESTS = "/workspace/ollama-models/manifests"
OLLAMA = "/workspace/ollama-bin/bin/ollama"
LEDGER = Path("/workspace/gguf-mill-done.jsonl")   # shared; single-line appends are atomic
# /opt is the EPHEMERAL overlay on this pod (mount point "/"); /workspace is the
# durable volume. The frozen banks the mill grades against sat on the overlay, so a
# pod restart would have taken every bank a card pins with it. 38 banks copied
# byte-identical to /workspace/gspc-banks 2026-09-06 and the mill now reads those.
LOG = "/workspace/gspc-logs/gguf-mill.log"
AXES = ["safety", "provenance", "continuity", "conformance", "openness",
        "machinery-conformity", "cross-reality", "detector-interop",
        "art5-safeguard", "affect", "care", "governance"]
ENV = dict(os.environ, OLLAMA_HOST="127.0.0.1:11434")

TAGS = {}
for l in open("/workspace/gguf-quants.jsonl"):
    if l.strip():
        r = json.loads(l)
        if r["state"] == "OK" and r.get("quant"):
            TAGS[r["id"]] = f"hf.co/{r['repo']}:{r['quant']}"
ids = [i for i in (json.loads(l)["id"] for l in open("/workspace/gguf-queue.jsonl") if l.strip()) if i in TAGS]
if SHARDS > 1:
    # Stable assignment by digest, not stride slicing: a shard's membership must not
    # change when the queue is reordered or a model is added, or a resumed run would
    # re-grade what another shard already did.
    before = len(ids)
    ids = [i for i in ids
           if int(hashlib.sha256(i.encode()).hexdigest()[:8], 16) % SHARDS == SHARD]
    print(f"shard {SHARD}/{SHARDS}: {len(ids)} of {before} models", flush=True)

# Each shard gets its own jobs and output roots. The worker's instance lock lives at
# CONFIG_DIR/.worker-state, and the mill makes CONFIG_DIR from --jobs-dir plus the model
# slug -- so disjoint jobs roots mean disjoint locks, and the lock keeps doing the one
# job it exists for: stopping two workers sharing one state dir.
JOBS = f"/workspace/gspc-jobs-{SHARD}"
OUT = f"/workspace/gspc-out-{SHARD}"
os.makedirs(JOBS, exist_ok=True)
os.makedirs(OUT, exist_ok=True)


STORE = Path("/workspace/ollama-models")
INUSE = Path("/workspace/inuse")


def claim(tag: str) -> None:
    """Say which model this shard is using, so a sibling never evicts it mid-run."""
    INUSE.mkdir(parents=True, exist_ok=True)
    (INUSE / f"{SHARD}.tag").write_text(tag or "", encoding="utf-8")


def in_use_by_others() -> set[str]:
    out = set()
    if INUSE.is_dir():
        for f in INUSE.glob("*.tag"):
            if f.stem != str(SHARD):
                t = f.read_text(encoding="utf-8").strip()
                if t:
                    out.add(t)
    return out


def evict(keep_tags: set[str]) -> tuple[int, int]:
    """Drop every hf.co manifest not in keep_tags, then the blobs nothing references.

    `ollama rm` alone does not do this: it unlinks a manifest and leaves the blobs, and
    when the volume is already full it cannot write at all. Three shards pulling
    concurrently took /workspace to 100% with 48 orphaned blobs holding 68 GiB, which
    killed a shard with ENOSPC and made another fail CONFIG on a model that had been
    evicted out from under it. Manifests AND blobs, and the caller prints the result.
    """
    man, blobs = STORE / "manifests", STORE / "blobs"
    hf = man / "hf.co"
    dropped = 0
    if hf.is_dir():
        for f in list(hf.rglob("*")):
            if not f.is_file():
                continue
            tag = "hf.co/" + str(f.relative_to(hf).parent).replace("\\", "/") + ":" + f.name
            if tag in keep_tags:
                continue
            try:
                f.unlink(); dropped += 1
            except OSError:
                pass
    keep_digests = set()
    for f in man.rglob("*"):
        if not f.is_file():
            continue
        try:
            d = json.loads(f.read_text())
        except Exception:
            continue
        for layer in (d.get("layers") or []) + ([d["config"]] if d.get("config") else []):
            dig = str(layer.get("digest") or "")
            if dig:
                keep_digests.add(dig.replace(":", "-"))
    freed = 0
    for b in blobs.glob("sha256-*"):
        if b.name not in keep_digests:
            try:
                freed += b.stat().st_size; b.unlink()
            except OSError:
                pass
    return dropped, freed


def attribution_ok(mid: str, tag: str, axis: str) -> tuple[bool, str]:
    """The card this run produced must be about the model the queue asked for.

    Card ids are ollama:<tag>@<digest> and queue ids are HF repo names, so string
    equality is the wrong test (see PR #1549). The check that means something is that
    the card's transport IS the tag we pulled for this queue id.
    """
    base = f"/workspace/gspc-24x7-local/{slug(tag)}/{axis}/runs"
    d = Path(base)
    if not d.is_dir():
        return False, "no run dir"
    runs = sorted(d.glob("*/run.json"), key=lambda f: f.stat().st_mtime)
    if not runs:
        return False, "no run.json"
    try:
        r = json.loads(runs[-1].read_text())
    except Exception as e:
        return False, f"unreadable run.json ({type(e).__name__})"
    got = str(r.get("model_transport") or "")
    return (got == tag), f"card transport {got!r} vs pulled {tag!r}"


def slug(value: str) -> str:
    return "".join(c if c.isalnum() or c in "-._" else "-" for c in value)


def log(m):
    with open(LOG, "a") as fh:
        fh.write(m + "\n")
    print(m, flush=True)

def ledger():
    d = {}
    if LEDGER.exists():
        for l in LEDGER.read_text().splitlines():
            if l.strip():
                try:
                    r = json.loads(l); d.setdefault(r["axis"], set()).add(r["id"])
                except Exception:
                    pass
    return d

def free_gb():
    s = os.statvfs("/workspace"); return s.f_bavail * s.f_frsize / 1024**3

log(f"=== driver2 shard {SHARD}/{SHARDS} start {time.strftime('%FT%TZ', time.gmtime())} release {REL} | {len(ids)} models x {len(AXES)} axes ===")
skip_this_pass = set()
while True:
    led = ledger()
    # MODEL outer, axis inner: a model is pulled once and graded on all twelve axes
    # before eviction. The other order re-pulls the same weights twelve times -- for a
    # 4 GB quant across 532 models that is ~25 TB of download to do the same work.
    nxt = next((m for m in ids
                if m not in skip_this_pass and any(m not in led.get(a, set()) for a in AXES)), None)
    if nxt is None and skip_this_pass:
        # Everything left this pass failed to pull. Wait, clear the skip set, try again --
        # a transient pull failure must not end the run.
        log(f"  {len(skip_this_pass)} model(s) failed to pull this pass; retrying in 10 min")
        time.sleep(600)
        skip_this_pass.clear()
        continue
    if nxt is None:
        log("=== every axis has attempted every resolvable GGUF model ==="); break
    mid, tag = nxt, TAGS[nxt]
    claim(tag)
    # Evict BEFORE every pull, not only under a threshold. A threshold is checked once
    # and then a 20+ GiB pull runs; with two shards pulling concurrently the volume fell
    # to 4.7 GiB free on a guard set at 25. Keeping only what a shard has claimed bounds
    # the store to what is actually in use, and prints on every model rather than only
    # when it is nearly too late.
    keep = in_use_by_others() | {tag}
    dropped, freed = evict(keep)
    log(f"  EVICTED {dropped} manifest(s), {freed / 1024 ** 3:.1f} GiB of blobs "
        f"(kept {len(keep)} in use) — free {free_gb():.1f}GB")
    if free_gb() < 12:
        log(f"  LOW DISK {free_gb():.1f}GB after eviction — waiting 5 min for a sibling to finish")
        time.sleep(300)
    todo_axes = [a for a in AXES if mid not in led.get(a, set())]
    attributed: dict[bool, int] = {}
    log(f"=== {mid} via {tag} | {len(todo_axes)} axes to do | free {free_gb():.1f}GB")
    try:
        p = subprocess.run([OLLAMA, "pull", tag], env=ENV, capture_output=True, text=True, timeout=3600)
        rc, err = p.returncode, (p.stderr or "")
    except subprocess.TimeoutExpired:
        rc, err = -1, "TIMEOUT"
    if rc != 0:
        # A pull failure is about the TAG or the network, never about the model on any
        # axis -- and writing one row per axis buried twelve cells from a single bad tag.
        # It happened: a case-blind preference picked :fp16 and a split-file suffix became
        # :00002, and 24 of the first 30 ledger rows were PULL_FAILED for two models whose
        # repos publish q4_k_m perfectly well. Record it ONCE, outside the ledger, and
        # leave the model to be retried when the tag table is rebuilt.
        log(f"    pull rc={rc} {err[-160:]}")
        with open("/workspace/gguf-pull-failures.jsonl", "a") as fh:
            fh.write(json.dumps({"id": mid, "tag": tag, "rc": rc,
                                 "at": time.strftime("%FT%TZ", time.gmtime()),
                                 "err": err[-200:]}) + "\n")
        skip_this_pass.add(mid)
        continue
    for ax in todo_axes:
        cmd = [sys.executable, str(S / "runpod_gspc_local_mill.py"), "--axis", ax,
               "--bank-dir", "/workspace/gspc-banks", "--limit", "1",
               "--scratch-root", "/workspace", "--ephemeral-root", MANIFESTS,
               "--jobs-dir", JOBS, "--output-root", OUT,
               "--durable-root", "/workspace/gspc-24x7-local", "--models", mid]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=5400)
            out = (r.stdout or "") + (r.stderr or "")
        except subprocess.TimeoutExpired:
            out = "TIMEOUT"
        graded = bool(re.search(rf"^GRADED {re.escape(mid)} ", out, re.M))
        # A transient failure must not be written to the ledger: the ledger means
        # "do not do this again", and an instance-lock clash or a timeout is a reason
        # to retry, not a verdict on the model. Everything else -- a real HALT, a bad
        # config, a model that cannot be graded -- is recorded so the run advances.
        transient = (not graded) and any(
            m in out for m in ("ALREADY_RUNNING", "TIMEOUT", "Connection refused", "MODEL_NOT_LOCAL")
        )
        verdict = "GRADED" if graded else ("RETRY" if transient else "ATTEMPTED")
        if graded:
            ok, detail = attribution_ok(mid, tag, ax)
            if not ok:
                verdict = "ATTRIBUTION_MISMATCH"
                log(f"    {ax}: ATTRIBUTION MISMATCH — {detail}")
            attributed[ok] = attributed.get(ok, 0) + 1
        log(f"    {ax}: {verdict}")
        if not graded:
            for line in out.strip().splitlines()[-3:]:
                log("      " + line[:180])
        if transient:
            time.sleep(20)
            continue
        with LEDGER.open("a") as fh:
            fh.write(json.dumps({"axis": ax, "id": mid, "outcome": "GRADED" if graded else "ATTEMPTED",
                                 "tag": tag, "at": time.strftime("%FT%TZ", time.gmtime())}) + "\n")
    log(f"  ATTRIBUTION {attributed.get(True, 0)} ok · {attributed.get(False, 0)} mismatched for {mid}")
    claim("")
    dropped, freed = evict(in_use_by_others())
    log(f"  EVICTED {dropped} manifest(s), {freed / 1024 ** 3:.1f} GiB after {mid} — free {free_gb():.1f}GB")
