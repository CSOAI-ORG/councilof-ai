#!/usr/bin/env python3
"""Ship the pod's finished run dirs to the durable HF intake. Additive, idempotent.

Why this exists
---------------
`runpod-intake.yml` only PULLS (`snapshot_download("csoai/runpod-gspc-intake")`).
The first durability copy was a one-off, so every worker cycle after it produced
runs that stayed on the pod and nowhere else. A pod is one machine, and one
machine is not durability: the v2 run was lost with its pod once already. This
closes the loop by pushing after each cycle.

What it will not do
-------------------
It never deletes, never rewrites a run that is already on the Hub, and never
touches /workspace archives. A run dir is uploaded only if its path is absent
upstream; an existing path is left exactly as published, because a re-upload of
"the same" run with a different byte is how a measurement quietly changes after
it was counted.

A run dir is COMPLETE only with all three of card-unsigned.json, items.jsonl and
run.json. A half-written dir -- the worker was mid-flush -- is skipped this pass
and picked up next time. Uploading a partial run would put a card on the Hub
with no items behind it, which reads as measured and is not.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

REPO = "csoai/runpod-gspc-intake"
REQUIRED = ("card-unsigned.json", "items.jsonl", "run.json")


def complete_runs(root: Path) -> list[Path]:
    """Run dirs holding all three files. Sorted so a partial upload is resumable."""
    out = []
    for card in sorted(root.rglob("card-unsigned.json")):
        d = card.parent
        if all((d / f).is_file() and (d / f).stat().st_size > 0 for f in REQUIRED):
            out.append(d)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="/workspace/gspc-24x7")
    ap.add_argument("--repo", default=REPO)
    ap.add_argument("--dry-run", action="store_true", help="list what would upload; touch nothing")
    args = ap.parse_args()

    root = Path(args.root)
    if not root.is_dir():
        # Not zero runs. The directory being absent is a different fact from it being empty.
        print(f"UNCHECKABLE: {root} is not a directory", file=sys.stderr)
        return 2

    runs = complete_runs(root)
    partial = len(list(root.rglob("card-unsigned.json"))) - len(runs)
    if not runs:
        print(f"nothing complete to push ({partial} partial)")
        return 0

    # There is rarely one token. This machine had HF_TOKEN exported EMPTY, a
    # HUGGINGFACE_TOKEN that 401s on the private dataset, and a working CLI token
    # in the cache -- and "is it set?" says yes to all three. Taking the first
    # non-empty one silently picked the broken one, and the failure surfaced much
    # later as HF's own "Invalid username or password".
    #
    # So: try each source in turn, PROVE it can read the repo, and name the one
    # that worked. An unproven credential is not a credential.
    sources = [
        ("HF_TOKEN", (os.environ.get("HF_TOKEN") or "").strip()),
        ("HUGGINGFACE_TOKEN", (os.environ.get("HUGGINGFACE_TOKEN") or "").strip()),
    ]
    cached = Path.home() / ".cache" / "huggingface" / "token"
    if cached.is_file():
        try:
            sources.append((str(cached), cached.read_text(encoding="utf-8").strip()))
        except OSError:
            pass

    try:
        from huggingface_hub import HfApi
    except ImportError:
        print("UNCHECKABLE: huggingface_hub is not installed", file=sys.stderr)
        return 2

    api = upstream = used = None
    tried = []
    for name, tok in sources:
        if not tok:
            tried.append(f"{name}: empty/unset")
            continue
        try:
            candidate = HfApi(token=tok)
            # An unreadable listing must never be read as "the Hub is empty": that
            # would re-upload everything and rewrite runs already published.
            upstream = set(candidate.list_repo_files(args.repo, repo_type="dataset"))
            api, used = candidate, name
            break
        except Exception as e:  # noqa: BLE001 - reported, never swallowed
            tried.append(f"{name}: {str(e).splitlines()[0][:90]}")
    if api is None:
        print(
            f"UNCHECKABLE: no token could read {args.repo}. Sources tried:", file=sys.stderr
        )
        for t in tried:
            print(f"  - {t}", file=sys.stderr)
        return 2
    print(f"auth: {used} can read {args.repo} ({len(upstream)} files upstream)")

    pushed = skipped = 0
    for d in runs:
        rel = d.relative_to(root.parent)
        missing = [f for f in REQUIRED if f"{rel}/{f}" not in upstream]
        if not missing:
            skipped += 1
            continue
        for f in REQUIRED:
            key = f"{rel}/{f}"
            if key in upstream:
                continue  # already published; leave the bytes alone
            if args.dry_run:
                print(f"WOULD PUSH {key}")
                continue
            api.upload_file(
                path_or_fileobj=str(d / f),
                path_in_repo=key,
                repo_id=args.repo,
                repo_type="dataset",
                commit_message=f"pod intake: {rel}/{f}",
            )
            print(f"PUSHED {key}")
        pushed += 1

    print(
        f"pod-push: complete runs {len(runs)} · pushed {pushed} · already upstream {skipped} · "
        f"partial skipped {partial}" + (" · DRY RUN" if args.dry_run else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
