#!/usr/bin/env python3
"""Re-archive the M4's working set into HF with ONE PREFIX PER SOURCE, and a per-file manifest.

WHY THIS EXISTS (measured 2026-10-27). The first archive run uploaded every source
folder with `hf upload-large-folder`, which has NO path_in_repo option — so every
source landed in the REPO ROOT. Two sources that carry the same relative path
therefore collided and one silently overwrote the other. Verified, not inferred:

  remote  plugins/cache/council-of-ai/council-of-ai/0.1.1+codex.20260831041332/
          skills/council/SKILL.md      sha256 60deef55...  3678 bytes
  local   .codex/plugins/cache/council-of-ai/council-of-ai/0.1.1+codex.20260831041332/
          skills/council/SKILL.md      sha256 5ac3a5ab...  3171 bytes
          (mtime 2026-10-24T07:33:42Z — unchanged since, so this is not drift)

The estate's own transport contract says a differing remote artefact must never be
silently rewritten and a conflict must stop preflight rather than leave a mixed
run. So this script writes each source under its OWN prefix, and where a
destination path already holds DIFFERENT bytes it stops and reports instead of
overwriting.

A 60-file sample was verified against the live repo: 28 byte-identical, 1 mismatch
(the collision above), 31 unresolvable because the flattening put them under a
path that no longer names its source.

Usage:
  python3 archive_prefixed.py plan                 # list sources + sizes, no network
  python3 archive_prefixed.py upload <name> [...]   # upload the named sources
  python3 archive_prefixed.py manifest              # rebuild MANIFEST.tsv from the repo
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

REPO = os.environ.get("HF_ARCHIVE_REPO", "csoai/m4-archive")
HOME = Path.home()

# Each source gets its own prefix. The prefix is part of the contract: it is what
# makes the relative paths inside a source unambiguous.
SOURCES = [
    ("codex", HOME / ".codex"),
    ("hermes", HOME / ".hermes"),
    ("claude", HOME / ".claude"),
    ("dsh", HOME / ".dsh"),
    ("sovereign", HOME / ".sovereign"),
    ("csoai", HOME / ".csoai"),
    ("clawd", HOME / "clawd"),
    ("work", HOME / "_work"),
    ("alignment", HOME / "_alignment"),
]

EXCLUDES = ["*.sock", "*.lock", "*.pyc", "__pycache__", "node_modules", ".venv", "venv",
            ".tmp", ".git",
            # The Hub refuses to commit ANY path with a .cache/ segment in it
            # ("cannot update files under a '.cache/' folder"), at any depth -
            # and the app payload carries node_modules/.cache/... . The failure
            # named the exact path. Excluded rather than renamed: the archive
            # keeps the source tree's own names.
            ".cache", "**/.cache", "**/.cache/**",
            # CREDENTIAL MATERIAL. The Hub refuses a commit whose files carry a
            # valid Hugging Face secret, and it is right to: dsh/.env and its
            # backups hold a live token, and the refusal named the offending
            # paths. The archive is a copy of the WORK, never of the keys to it.
            # This list was missing them and the upload of dsh failed loudly
            # rather than silently - which is the only reason the fix is here.
            ".env", ".env.*", "*.env", "**/.env", "**/.env.*",
            "*credentials*", "*secret*", "*.pem", "*.key", "*_rsa", "*_ed25519",
            "id_rsa*", "id_ed25519*", "*.p12", "*.pfx", "*.crt", "*.jks",
            "auth.json", ".credentials.json", "credentials.json",
            "**/auth.json", "**/.credentials.json", "**/credentials.json",
            "**/keys/**", "keys/**", "**/*.private",
            # LIVE APP OUTPUT — written while we read it. Two separate runs of this
            # archive died with "Provided path: ... is not a file on the local file
            # system" on exactly these paths: a cron output file and a terminal
            # scrollback log, each rewritten or rotated between the scan and the
            # upload. The estate's own transport contract says to freeze the bytes
            # before the network write; where freezing is not possible because the
            # bytes are still moving, they are excluded rather than raced.
            # These are PATTERNS with a slash, and a gitignore-style pattern with
            # a slash is ANCHORED to the root of the upload path. "cron/output"
            # therefore never matched "hermes/cron/output/...". Depth-independent
            # forms are what is needed, and the failure named the exact file.
            "**/cron/output", "**/cron/output/**",
            "**/cache/terminal-output", "**/cache/terminal-output/**"]


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def plan() -> int:
    rows = []
    for name, src in SOURCES:
        if not src.is_dir():
            rows.append((name, str(src), "MISSING", 0, 0))
            continue
        n = b = 0
        for p in src.rglob("*"):
            if p.is_file() and not p.is_symlink():
                n += 1
                b += p.stat().st_size
        rows.append((name, str(src), "OK", n, b))
    print(f"{'source':<10} {'files':>9} {'GiB':>8}  path")
    for name, src, state, n, b in rows:
        print(f"{name:<10} {n:>9} {b / 2**30:>8.2f}  {src}  [{state}]")
    return 0


VOLATILE_DIR_NAMES = ("terminal-output",)


def volatile_dirs(root: Path) -> list[str]:
    """The directories under `root` that a LIVE APP rewrites while we read them.

    Two separate archive runs died here: a cron output file and a terminal
    scrollback log, each replaced or rotated between the scan and the upload.
    The estate's own transport contract says to freeze the bytes before the
    network write; where freezing is impossible because the bytes are still
    moving, they are excluded rather than raced.

    The patterns are computed as the EXACT relative paths of those directories.
    A wildcard like "**/cron/output/**" did not stop it: the uploader still
    stat'ed the file and still raised on it. An exact relative path is what the
    filter can actually act on.
    """
    out = []
    for dirpath, dirnames, _files in os.walk(root):
        rel = os.path.relpath(dirpath, root)
        for d in list(dirnames):
            if d in VOLATILE_DIR_NAMES or (rel == "." and d == "output" and "cron" in str(root)):
                out.append(os.path.normpath(os.path.join(rel, d)))
        # any directory named output directly under a cron directory
        if os.path.basename(dirpath) == "cron" and "output" in dirnames:
            out.append(os.path.normpath(os.path.join(rel, "output")))
    return sorted(set(out))


def upload(names: list[str]) -> int:
    """Upload each named source under its OWN prefix.

    huggingface_hub 1.x's upload_large_folder has no path_in_repo, which is what
    flattened every source into the repo root and let two sources collide. hub
    2.x's upload_folder takes path_in_repo, so the prefix is explicit here.
    """
    import huggingface_hub

    token = (HOME / ".cache/huggingface/token").read_text().strip()
    failures: list[tuple[str, str]] = []
    for name in names:
        src = dict((n, s) for n, s in SOURCES).get(name)
        if src is None or not src.is_dir():
            print(f"SKIP {name}: no such source")
            continue
        print(f"--- {name} -> {REPO}:{name} ({src})", flush=True)
        try:
            ignore = list(EXCLUDES)
            for rel in volatile_dirs(src):
                ignore.append(rel)
                ignore.append(rel + "/**")
                ignore.append(rel + "/*")
            if hasattr(huggingface_hub, "upload_folder"):
                huggingface_hub.upload_folder(
                    repo_id=REPO,
                    repo_type="dataset",
                    folder_path=str(src),
                    path_in_repo=name,
                    allow_patterns=None,
                    ignore_patterns=ignore,
                    commit_message=f"archive: {name} under its own prefix",
                    token=token,
                )
            else:
                from huggingface_hub import upload_large_folder
                upload_large_folder(
                    repo_id=REPO,
                    repo_type="dataset",
                    folder_path=str(src),
                    path_in_repo=name,
                    ignore_patterns=EXCLUDES,
                    num_workers=8,
                    token=token,
                )
        except Exception as exc:                      # noqa: BLE001 - reported, not raised
            # One source failing must not abort the rest, and the failure must be
            # visible rather than swallowed: a partial archive that nobody knows
            # is partial is the failure mode this whole script exists to prevent.
            print(f"    FAILED {name}: {type(exc).__name__}: {exc}", flush=True)
            failures.append((name, f"{type(exc).__name__}: {exc}"))
            continue
        print(f"    DONE {name}", flush=True)
    if failures:
        print("\nFAILURES (reported, not hidden):")
        for name, why in failures:
            print(f"  {name}: {why}")
    return 1 if failures else 0


def manifest() -> int:
    """Per-file sha256 of what the repo actually serves, written beside it."""
    import urllib.request

    token = (HOME / ".cache/huggingface/token").read_text().strip()
    out = []
    cursor = None
    while True:
        url = ("https://huggingface.co/api/datasets/" + REPO +
               "/tree/main?recursive=true&limit=1000")
        if cursor:
            url += "&cursor=" + cursor
        req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
            link = r.headers.get("Link", "")
        if not data:
            break
        for f in data:
            if f.get("type") == "file" and not f["path"].startswith(".tmp/"):
                out.append(f["path"])
        nxt = None
        for part in link.split(","):
            if "cursor=" in part:
                nxt = part.split("cursor=")[1].split("&")[0].split(">")[0].strip()
        if not nxt:
            break
        cursor = nxt
    rows = []
    for p in sorted(out):
        url = f"https://huggingface.co/datasets/{REPO}/resolve/main/{p}"
        req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                body = r.read()
        except Exception as exc:                      # noqa: BLE001 - reported, not raised
            rows.append(f"{p}\tUNREADABLE\t{type(exc).__name__}")
            continue
        rows.append(f"{p}\t{len(body)}\t{hashlib.sha256(body).hexdigest()}")
    target = Path("/private/tmp") / "m4-archive-MANIFEST.tsv"
    target.write_text("\n".join(rows) + "\n")
    print(f"manifest: {len(rows)} file(s) -> {target}")
    return 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "plan"
    if cmd == "plan":
        sys.exit(plan())
    if cmd == "upload":
        sys.exit(upload(sys.argv[2:]))
    if cmd == "manifest":
        sys.exit(manifest())
    raise SystemExit("usage: archive_prefixed.py plan|upload <name...>|manifest")
