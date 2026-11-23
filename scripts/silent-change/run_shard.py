#!/usr/bin/env python3
"""Run one calibration shard: fetch and verify the pinned files, serve one GGUF, run its batches.

    run_shard.py --shard q05-q8-01 --file q05-q8 --batches C0:C0-01,C0:C0-02 --out calibration \\
                 [--work /tmp/silent-change-work] [--platform ubuntu_x64|macos_arm64] [--port 8000] \\
                 [--items-limit 2 --k 3]          (the last two make it a REHEARSAL; rows are never counted)

Downloads go into --work (outside the repository checkout). Each file's sha256 is checked against
calibration-pins.json before it is served; a mismatch stops the shard. Stdlib only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tarfile
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import collect  # noqa: E402
import detector  # noqa: E402
import plan as planmod  # noqa: E402
import watch  # noqa: E402


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(url: str, dest: Path, sha256: str) -> Path:
    """Download if absent or wrong, resuming nothing; verify the sha256 or stop."""
    if dest.exists() and sha256_file(dest) == sha256:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "csoai-silent-change/1"})
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as out:
                while True:
                    chunk = r.read(1 << 20)
                    if not chunk:
                        break
                    out.write(chunk)
            break
        except Exception as e:  # network
            last = e
            time.sleep(5 * (attempt + 1))
    else:
        raise SystemExit("STOP: could not fetch %s: %s" % (url, last))
    got = sha256_file(dest)
    if got != sha256:
        dest.unlink()
        raise SystemExit("STOP: sha256 of %s is %s, the pin says %s" % (dest.name, got, sha256))
    return dest


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--shard", required=True)
    ap.add_argument("--file", required=True, help="file key in calibration-pins.json")
    ap.add_argument("--batches", required=True, help="comma list of CONDITION:TRIAL_ID")
    ap.add_argument("--out", default="calibration")
    ap.add_argument("--work", default="/tmp/silent-change-work")
    ap.add_argument("--platform", default="ubuntu_x64")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--pins", default=str(planmod.PINS_PATH))
    ap.add_argument("--items-limit", type=int, default=0)
    ap.add_argument("--k", type=int, default=0)
    ap.add_argument("--server-extra", default="", help="REHEARSAL only: extra llama-server arguments, e.g. '-ngl 0' to stay on the CPU")
    ap.add_argument("--bin-dir", default="", help="a directory that already holds the verified llama-server (skips the download)")
    a = ap.parse_args(argv)
    pins = json.loads(Path(a.pins).read_text(encoding="utf-8"))
    f = pins["files"][a.file]
    work = Path(a.work)
    t_start = time.time()
    if a.bin_dir:
        server_bin = Path(a.bin_dir) / "llama-server"
    else:
        lc = pins["llama_cpp"][a.platform]
        tgz = fetch(lc["url"], work / lc["asset"], lc["sha256"])
        bdir = work / "llama-cpp"
        bdir.mkdir(parents=True, exist_ok=True)
        with tarfile.open(tgz) as tf:
            tf.extractall(bdir, filter="data")
        found = sorted(bdir.rglob("llama-server"))
        if not found:
            raise SystemExit("STOP: llama-server not in the release archive")
        server_bin = found[0]
    gguf = fetch("https://huggingface.co/%s/resolve/%s/%s" % (f["repo"], f["revision"], f["filename"]),
                 work / f["filename"], f["sha256"])
    t_fetch = time.time() - t_start
    seed = int(hashlib.sha256(a.shard.encode()).hexdigest()[:8], 16)
    log = open(work / ("server-%s.log" % a.shard), "w")
    cmd = [str(server_bin), "-m", str(gguf), "--port", str(a.port), "--seed", str(seed)] + pins["server"]["args"] + a.server_extra.split()
    proc = subprocess.Popen(cmd, stdout=log, stderr=subprocess.STDOUT, cwd=str(server_bin.parent),
                            env=dict(os.environ, LD_LIBRARY_PATH=str(server_bin.parent), DYLD_LIBRARY_PATH=str(server_bin.parent)))
    base_url = "http://127.0.0.1:%d/v1" % a.port
    timings = []
    try:
        for _ in range(120):
            try:
                urllib.request.urlopen(base_url + "/models", timeout=3).read()
                break
            except Exception:
                if proc.poll() is not None:
                    raise SystemExit("STOP: llama-server exited; see the server log")
                time.sleep(2)
        else:
            raise SystemExit("STOP: llama-server did not come up in 4 minutes")
        loaded = collect.load_public_items(detector.load_protocol())
        for spec in a.batches.split(","):
            cond, tid = spec.split(":")
            if pins["conditions"][cond]["file"] != a.file:
                raise SystemExit("STOP: %s is not a %s condition" % (tid, a.file))
            t0 = time.time()
            b = watch.run_trial(pins, cond, tid, base_url, Path(a.out), loaded=loaded, items_limit=a.items_limit, k=a.k)
            timings.append({"trial_id": tid, "seconds": round(time.time() - t0, 1), "state": b["state"],
                            "transport_error_share": b["transport_error_share"]})
            print("done", tid, timings[-1]["seconds"], "s", b["state"], flush=True)
    finally:
        proc.terminate()
        try:
            proc.wait(15)
        except Exception:
            proc.kill()
    (Path(a.out) / ("timing-%s.json" % a.shard)).write_text(json.dumps(
        {"shard": a.shard, "fetch_and_setup_seconds": round(t_fetch, 1), "batches": timings,
         "rehearsal": bool(a.items_limit or a.k)}, sort_keys=True), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
