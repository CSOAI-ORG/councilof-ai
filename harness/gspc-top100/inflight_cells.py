#!/usr/bin/env python3
"""Collect the (model, axis) cells already staged in open landing branches.

WHY. hub-queue-land opens one PR per mill run and a human merge is the only gate. Until that
merge, the cells in the PR are still UNMEASURED on master, so the picker (which reads the public
hub-queue) sees them as the emptiest and grades them again. Observed 2026-09-05: five open
landing PRs, 40 staged cards, 11 distinct — the same cells re-graded up to five times, byte-
identical, one wasted mill run per unmerged hour.

WHAT. For each branch name given, fetch it (depth 1) and read every
public/interop/mill-cards-unsigned/unsigned-*.json on it; emit jsonl rows {id, axis, branch}
where id is the model id in the card body. mill_hub_queue.py --inflight consumes the file.
No branch names → empty file (never a failure; an empty in-flight set only means nothing is
waiting, which is a legal state).

This reads bytes on branches; it does not merge, sign or flip anything.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

UNSIGNED_DIR = "public/interop/mill-cards-unsigned"


def git(*args: str, cwd: Path) -> str:
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


def cells_on_branch(repo: Path, branch: str, remote: str = "origin") -> list[dict]:
    try:
        subprocess.run(["git", "fetch", "--depth=1", "--quiet", remote, branch], cwd=repo, check=True, capture_output=True)
    except subprocess.CalledProcessError as exc:
        print(f"skip {branch}: fetch failed ({exc.stderr.strip()[:120]})", file=sys.stderr)
        return []
    ref = "FETCH_HEAD"
    names = git("ls-tree", "-r", "--name-only", ref, "--", UNSIGNED_DIR, cwd=repo).split()
    out: list[dict] = []
    for name in names:
        if not name.rsplit("/", 1)[-1].startswith("unsigned-") or not name.endswith(".json"):
            continue
        try:
            card = json.loads(git("show", f"{ref}:{name}", cwd=repo))
        except Exception as exc:
            print(f"skip {name}@{branch}: {type(exc).__name__}", file=sys.stderr)
            continue
        body = card.get("body") if isinstance(card.get("body"), dict) else card
        mid, ax = str(body.get("model") or body.get("id") or ""), str(body.get("axis") or "")
        if mid and ax:
            out.append({"id": mid, "axis": ax, "branch": branch, "file": name.rsplit("/", 1)[-1]})
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("branches", nargs="*", help="open landing branch names, e.g. mill/land-swarm-33935896384")
    ap.add_argument("--out", required=True)
    ap.add_argument("--repo", default=".")
    ap.add_argument("--remote", default="origin")
    args = ap.parse_args()
    repo = Path(args.repo).resolve()
    rows: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for br in args.branches:
        for row in cells_on_branch(repo, br, args.remote):
            key = (row["id"], row["axis"])
            if key in seen:
                continue
            seen.add(key)
            rows.append(row)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    print(json.dumps({"branches": len(args.branches), "inflight_cells": len(rows), "out": str(out)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
