#!/usr/bin/env python3
"""rebuild-interop-file-index.py — rebuild or CHECK public/interop/file-index.json from the COMMITTED tree.

WHY. The builder (scripts/build-interop-file-index.py) walks a local tree, so the corpus has to be on
disk. A working tree of this repository does not fit on the M4, so instead the repository TARBALL is
streamed and only `public/interop/` is extracted from it. Nothing else is written to disk.

The index is a MEASUREMENT of the tree, and a measurement that only one machine can take is not a
measurement the estate can rely on. This script makes the same measurement available to anyone, from
the repository alone, with no checkout.

Usage:
  python3 scripts/rebuild-interop-file-index.py <outdir> [--ref master] [--write] [--install <dir>]
  python3 scripts/rebuild-interop-file-index.py <outdir> --check [--ref master]

  --check       measure the corpus at <ref> and compare it with the index committed at <ref>.
                The committed index is IN the tarball, and the builder excludes it from the
                measurement and compares it against the measurement — so this reports, for the
                ref as it stands, whether the published index still describes the published
                corpus. It is the drift measurement, runnable with no working tree.
  --install <d> copy the rebuilt index to <d>/public/interop/file-index.json, so the DERIVED
                llms.txt / llms-full.txt can be regenerated against it. The index's counts appear in
                those files, so the two must move together or the estate's own --check gate goes red.
  --write       acknowledged for compatibility; this script never writes to the repository. It
                only produces a candidate artefact and, with --install, hands it to the caller.

The builder itself excludes the corpus root's own file-index.json from the measurement, so this
script does not need to delete it first. A measurement must not measure itself: if the index listed
its own previous bytes, its digest would be a function of the file it replaces, the artefact could
never be reproduced from the tree, and every rebuild would change one row for no reason.
"""
import json
import os
import subprocess
import sys
import tarfile
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = "CSOAI-ORG/councilof-ai"
WANT = "public/interop/"


def token():
    t = os.environ.get("GITHUB_TOKEN")
    if t:
        return t.strip()
    return subprocess.check_output(["gh", "auth", "token"], encoding="utf8").strip()


def fetch(url, headers=None):
    """One request, with retries. A dropped connection or a 5xx is a TRANSPORT event — retried,
    not reported as a difference. The tarball is large, so a mid-stream failure is common."""
    h = {"User-Agent": "csoai-index-rebuild/1.0"}
    if headers:
        h.update(headers)
    last = None
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers=h)
            return urllib.request.urlopen(req, timeout=1800)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 404):
                raise
            last = e
        except Exception as e:
            last = e
        print(f"  fetch failed ({last}); retry {i + 1}/6", flush=True)
        time.sleep(3.0 * (i + 1))
    raise last


def main():
    argv = [a for a in sys.argv[1:]]
    outdir = Path(argv[0] if argv and not argv[0].startswith("--") else "index-rebuild")
    argv = argv[1:] if argv and not argv[0].startswith("--") else argv
    ref = "master"
    if "--ref" in argv:
        ref = argv[argv.index("--ref") + 1]
    check = "--check" in argv
    corpus = outdir / "public" / "interop"
    corpus.mkdir(parents=True, exist_ok=True)

    tar_url = f"https://api.github.com/repos/{REPO}/tarball/{ref}"
    print(f"streaming {tar_url} …", flush=True)
    n_files = 0
    n_bytes = 0
    with fetch(tar_url, {"Authorization": f"Bearer {token()}",
                         "Accept": "application/vnd.github+json"}) as resp:
        with tarfile.open(fileobj=resp, mode="r|gz") as tf:
            for m in tf:
                if not m.isfile():
                    continue
                # members are named "<repo>-<sha>/public/interop/..."
                parts = m.name.split("/", 1)
                if len(parts) < 2:
                    continue
                rel = parts[1]
                if not rel.startswith(WANT):
                    continue
                out = corpus / rel[len(WANT):]
                out.parent.mkdir(parents=True, exist_ok=True)
                src = tf.extractfile(m)
                if src is None:
                    continue
                with open(out, "wb") as fh:
                    while True:
                        b = src.read(1 << 20)
                        if not b:
                            break
                        fh.write(b)
                        n_bytes += len(b)
                n_files += 1
                if n_files % 2000 == 0:
                    print(f"  {n_files} files, {n_bytes:,} B", flush=True)
    print(f"extracted {n_files} files, {n_bytes:,} B into {corpus}")

    # the builder needs the exclusion manifest (it decides which paths are mirror-served)
    excl = outdir / "scripts" / "deploy-exclusions.json"
    excl.parent.mkdir(parents=True, exist_ok=True)
    with fetch(f"https://api.github.com/repos/{REPO}/contents/scripts/deploy-exclusions.json?ref={ref}",
               {"Authorization": f"Bearer {token()}",
                "Accept": "application/vnd.github+json"}) as r:
        d = json.load(r)
        import base64
        excl.write_bytes(base64.b64decode(d["content"].replace("\n", "")))

    committed = corpus / "file-index.json"
    src_commit = subprocess.check_output(
        ["gh", "api", f"repos/{REPO}/commits/{ref}", "--jq", ".sha"], encoding="utf8").strip()
    builder = str(Path(__file__).resolve().parent / "build-interop-file-index.py")

    if check:
        # The corpus holds the index committed at <ref>. The builder excludes it from the
        # measurement and compares it against the measurement: that is the drift verdict.
        if not committed.exists():
            print(f"FAIL: no committed index in the corpus at {ref}", file=sys.stderr)
            sys.exit(1)
        cmd = [sys.executable, builder, str(corpus), str(committed), str(excl), "--check"]
        print("running:", " ".join(cmd), flush=True)
        sys.exit(subprocess.run(cmd).returncode)

    out = corpus / "file-index.json.rebuilt"
    cmd = [sys.executable, builder, str(corpus), str(out), str(excl), src_commit]
    print("running:", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)
    print(f"\nrebuilt index: {out}  {out.stat().st_size:,} B")

    # --install <dir>: put the rebuilt index where the generator reads it, so the DERIVED
    # llms.txt / llms-full.txt can be regenerated against it. The index's counts appear in
    # those files, so the two must move together or the estate's own --check gate goes red.
    if "--install" in sys.argv:
        dest = Path(sys.argv[sys.argv.index("--install") + 1]) / "public" / "interop" / "file-index.json"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(out.read_bytes())
        print(f"installed -> {dest}  ({dest.stat().st_size:,} B)")

    print("(this script never writes to the repository — compare, then install)")


if __name__ == "__main__":
    main()
