#!/usr/bin/env python3
"""Deterministic receipt for the exact static tree handed to a deploy writer."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def sha256_bytes(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def build_receipt(root: Path, source_commit: str, selected: list[str] | None = None) -> dict:
    root = root.resolve()
    if not root.is_dir():
        raise ValueError("root must be a directory")

    files = []
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ValueError(f"symlink refused: {path.relative_to(root)}")
        if path.is_file():
            files.append(path)
    files.sort(key=lambda p: p.relative_to(root).as_posix())

    tree = hashlib.sha256()
    rows = []
    selected_set = set(selected or [])
    selected_rows = {}
    for path in files:
        rel = path.relative_to(root).as_posix()
        body = path.read_bytes()
        digest = sha256_bytes(body)
        line = f"{rel}\t{len(body)}\t{digest}\n".encode("utf-8")
        tree.update(line)
        rows.append({"path": rel, "bytes": len(body), "sha256": digest})
        if rel in selected_set:
            selected_rows[rel] = rows[-1]

    missing = sorted(selected_set - set(selected_rows))
    if missing:
        raise ValueError("selected files missing: " + ", ".join(missing))

    return {
        "schema": "csoai.deploy-tree-receipt/0.1",
        "source_commit": source_commit,
        "algorithm": "sha256(sorted UTF-8 lines: path TAB bytes TAB file_sha256 LF)",
        "file_count": len(rows),
        "tree_digest": tree.hexdigest(),
        "selected": selected_rows,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--source-commit", required=True)
    ap.add_argument("--select", action="append", default=[])
    ap.add_argument("--out")
    args = ap.parse_args()
    receipt = build_receipt(Path(args.root), args.source_commit, args.select)
    text = json.dumps(receipt, indent=2, sort_keys=True) + "\n"
    if args.out:
        Path(args.out).write_text(text)
    print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
