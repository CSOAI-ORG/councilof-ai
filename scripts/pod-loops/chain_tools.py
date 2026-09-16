#!/usr/bin/env python3
"""Small, testable helpers behind the pod chain shells (land.sh, sign.sh, root.sh, ots.sh).

  stage    --quarantine Q --stage S
           The newest VERIFIED pod run per (model, axis) — chosen by
           runpod_gspc_bridge_to_mill.collect(), the same selector the GHA intake used —
           copied byte-for-byte into S/<bundle>/{unsigned-<cell>.json, verification.json,
           items.jsonl}, the layout scripts/land_mill_cards.py --require-evidence admits a
           pod card from. Prints one JSON line: staged / superseded / problems.
  manifest DIR [--glob G] [--recursive]
           "sha256  relative-path" per matching regular file, sorted. A content snapshot.
  new      BEFORE AFTER
           Manifest lines present in AFTER and absent from BEFORE (what a stage produced).
           First line: "<count> <sha256 over those lines>"; then one path per line. The
           digest binds output CONTENT, so two machines that produce identical bytes at
           identical paths log identical digests — the determinism the chain is judged by.

Nothing here signs, verifies, or decides MEASURED. Copies are byte-identical or refused.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent
sys.path.insert(0, str(SCRIPTS))


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def manifest_lines(root: Path, pattern: str, recursive: bool) -> list[str]:
    if not root.is_dir():
        return []
    files = root.rglob(pattern) if recursive else root.glob(pattern)
    out = []
    for f in sorted(files):
        if f.is_symlink() or not f.is_file():
            continue
        out.append(f"{sha256_file(f)}  {f.relative_to(root).as_posix()}")
    return out


def cmd_manifest(args: argparse.Namespace) -> int:
    for line in manifest_lines(Path(args.dir), args.glob, args.recursive):
        print(line)
    return 0


def cmd_new(args: argparse.Namespace) -> int:
    def read(p: str) -> list[str]:
        path = Path(p)
        if not path.is_file():
            return []
        return [l for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]

    before = set(read(args.before))
    new = sorted(l for l in read(args.after) if l not in before)
    digest = hashlib.sha256(("\n".join(new) + ("\n" if new else "")).encode("utf-8")).hexdigest()
    print(f"{len(new)} {digest}")
    for line in new:
        print(line.split("  ", 1)[1])
    return 0


def stage(quarantine: Path, stage_dir: Path) -> dict:
    from runpod_gspc_bridge_to_mill import collect  # noqa: E402 — the GHA intake's selector

    staged, superseded, problems = collect(quarantine)
    copied: list[dict] = []
    for item in staged:
        src = Path(item["src"])
        bundle = src.parent
        dest_dir = stage_dir / bundle.name
        dest_dir.mkdir(parents=True, exist_ok=True)
        pairs = [
            (src, dest_dir / f"unsigned-{item['cell']}.json"),
            (bundle / "verification.json", dest_dir / "verification.json"),
            (bundle / "items.jsonl", dest_dir / "items.jsonl"),
        ]
        ok = True
        for s, d in pairs:
            if s.is_symlink() or not s.is_file():
                problems.append(f"{bundle.name}: {s.name} missing — bundle not staged")
                ok = False
                break
            if d.exists():
                if sha256_file(d) != sha256_file(s):
                    problems.append(f"{bundle.name}: {d.name} already staged with different bytes — refused")
                    ok = False
                    break
                continue
            shutil.copyfile(s, d)
            if sha256_file(d) != sha256_file(s):
                problems.append(f"{bundle.name}: {d.name} copy is not byte-identical — refused")
                d.unlink(missing_ok=True)
                ok = False
                break
        if ok:
            copied.append({"cell": item["cell"], "run_id": item["run_id"], "bundle": bundle.name})
    return {"staged": copied, "superseded": superseded, "problems": problems}


def cmd_stage(args: argparse.Namespace) -> int:
    report = stage(Path(args.quarantine), Path(args.stage))
    print(json.dumps(report, sort_keys=True))
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("stage")
    s.add_argument("--quarantine", required=True)
    s.add_argument("--stage", required=True)
    s.set_defaults(fn=cmd_stage)
    m = sub.add_parser("manifest")
    m.add_argument("dir")
    m.add_argument("--glob", default="*")
    m.add_argument("--recursive", action="store_true")
    m.set_defaults(fn=cmd_manifest)
    n = sub.add_parser("new")
    n.add_argument("before")
    n.add_argument("after")
    n.set_defaults(fn=cmd_new)
    args = ap.parse_args(argv)
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
