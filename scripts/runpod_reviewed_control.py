#!/usr/bin/env python3
"""Refresh the RunPod control checkout from reviewed master, then dispatch once.

This is deliberately a pod-local control command, not a remote administration
backdoor.  It never accepts credentials, never restarts a process, and never
updates from an arbitrary ref.  Dry-run is the default; ``--apply`` is required
to change the checkout or materialize commission jobs.
"""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Sequence


CANONICAL_ORIGINS = {
    "git@github.com:CSOAI-ORG/councilof-ai.git",
    "https://github.com/CSOAI-ORG/councilof-ai",
    "https://github.com/CSOAI-ORG/councilof-ai.git",
}
MASTER_REF = "refs/heads/master"
SHA_RE = re.compile(r"^[0-9a-f]{40,64}$")


class Refusal(RuntimeError):
    """A fail-closed control refusal suitable for an operator."""


def command(args: Sequence[str], *, cwd: Path) -> str:
    result = subprocess.run(
        list(args), cwd=cwd, text=True, capture_output=True, check=False
    )
    if result.returncode:
        # Do not relay subprocess output: remotes and hooks can include secrets.
        raise Refusal(f"command failed ({args[0]} exit {result.returncode})")
    return result.stdout.strip()


def git(repo: Path, *args: str) -> str:
    return command(("git", *args), cwd=repo)


def one_sha(value: str, label: str) -> str:
    rows = [row.split() for row in value.splitlines() if row.strip()]
    if len(rows) != 1 or not rows[0] or not SHA_RE.fullmatch(rows[0][0]):
        raise Refusal(f"{label} did not resolve to exactly one commit")
    return rows[0][0]


def validate_origin(origin: str, allowed: set[str] = CANONICAL_ORIGINS) -> None:
    if origin not in allowed:
        raise Refusal("origin is not the canonical CSOAI repository")


def sanitize_report(report_path: Path, expected_revision: str) -> dict:
    try:
        report = json.loads(report_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise Refusal("dispatcher report is absent or unreadable") from exc

    revision = report.get("source_revision")
    if revision != expected_revision:
        raise Refusal("dispatcher report is not bound to the deployed revision")

    refused = report.get("refused", [])
    reasons = Counter(
        str(item.get("reason", "unspecified"))
        for item in refused
        if isinstance(item, dict)
    )
    # Subjects and commission identifiers are intentionally excluded.
    return {
        "schema": report.get("schema"),
        "source_revision": revision,
        "admitted_count": len(report.get("admitted", [])),
        "refused_count": len(refused),
        "created_count": int(report.get("created", 0)),
        "already_present_count": int(report.get("already_present", 0)),
        "refusal_reason_counts": dict(sorted(reasons.items())),
    }


def run(
    repo: Path,
    *,
    apply: bool,
    report_path: Path,
    lock_path: Path,
    allowed_origins: set[str] = CANONICAL_ORIGINS,
) -> dict:
    repo = repo.resolve()
    if not (repo / ".git").exists():
        raise Refusal("control checkout is not a Git repository")

    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as lock:
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise Refusal("another reviewed-control operation is active") from exc

        origin = git(repo, "remote", "get-url", "origin")
        validate_origin(origin, allowed_origins)
        if git(repo, "status", "--porcelain", "--untracked-files=all"):
            raise Refusal("control checkout is dirty; no files were changed")

        current = one_sha(git(repo, "rev-parse", "HEAD"), "current HEAD")
        remote = one_sha(
            git(repo, "ls-remote", "--exit-code", "origin", MASTER_REF),
            "remote master",
        )
        base = {
            "schema": "csoai.runpod-reviewed-control/0.1",
            "mode": "apply" if apply else "dry-run",
            "current_revision": current,
            "reviewed_revision": remote,
            "checkout_change_required": current != remote,
            "restart_attempted": False,
            "secrets_read": False,
        }
        if not apply:
            return {**base, "state": "DRY_RUN_OK", "dispatch_attempted": False}

        git(repo, "fetch", "--no-tags", "origin", MASTER_REF)
        fetched = one_sha(git(repo, "rev-parse", "FETCH_HEAD"), "fetched master")
        if fetched != remote:
            raise Refusal("master moved during deployment; retry from dry-run")

        # checkout refuses local changes above and does not delete ignored files.
        git(repo, "checkout", "--detach", "--quiet", fetched)
        if git(repo, "rev-parse", "HEAD") != fetched:
            raise Refusal("post-deploy HEAD differs from reviewed master")
        if git(repo, "status", "--porcelain", "--untracked-files=all"):
            raise Refusal("post-deploy checkout is dirty")

        dispatcher = repo / "scripts" / "pod-loops" / "commission-dispatch.sh"
        if not dispatcher.is_file():
            raise Refusal("reviewed dispatcher wrapper is absent")
        dispatch = subprocess.run(
            ("bash", str(dispatcher), "--now"),
            cwd=repo,
            text=True,
            capture_output=True,
            check=False,
            env={
                "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
                "LANG": "C.UTF-8",
                "LC_ALL": "C.UTF-8",
                "CONTROL_REPO": str(repo),
                "CSOAI_REVIEWED_CONTROL_HELD": "1",
            },
        )
        if dispatch.returncode:
            raise Refusal(f"dispatcher failed closed (exit {dispatch.returncode})")
        telemetry = sanitize_report(report_path, fetched)
        return {
            **base,
            "state": "APPLIED_AND_DISPATCHED",
            "deployed_revision": fetched,
            "dispatch_attempted": True,
            "telemetry": telemetry,
        }


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description=__doc__)
    mode = p.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="validate only (default)")
    mode.add_argument("--apply", action="store_true", help="deploy reviewed master and dispatch once")
    p.add_argument("--repo", type=Path, default=Path("/workspace/council-of-ai"))
    p.add_argument(
        "--report",
        type=Path,
        default=Path("/workspace/lanes/out/commission-dispatch-latest.json"),
    )
    p.add_argument(
        "--lock",
        type=Path,
        default=Path("/workspace/lanes/state/runpod-reviewed-control.lock"),
    )
    return p


def main() -> int:
    args = parser().parse_args()
    try:
        result = run(
            args.repo, apply=args.apply, report_path=args.report, lock_path=args.lock
        )
    except Refusal as exc:
        print(json.dumps({"state": "REFUSED", "reason": str(exc)}, sort_keys=True))
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
