#!/usr/bin/env python3
"""Reconcile the rolling public-root candidate with master.

WHY THIS EXISTS (26 Oct 2026). The pending candidate branch `public-root/pending` could not be
reconciled with master, and every run of public-root-candidate-upgrade.yml failed at that step,
so the ONE public root had not advanced for over nine hours. Two faults, both here:

  1. THE MERGE DIED ON A CONTENT CONFLICT in three files: public/interop/ots/manifest.json,
     public/llms.txt and public/llms-full.txt. The first is GENERATED from the .ots files in the
     tree; the other two quote its counts and as_of. All three are derived views, so both sides
     are regenerated from the merged tree below and choosing a side is not choosing content —
     the generation decides it. A conflict anywhere else — root, proof or witness bytes — is a
     real conflict and still fails closed. Nothing is auto-resolved there.

  2. THE VIEWS WERE GENERATED BEFORE THE MANIFEST WAS REBUILT. The manifest is rebuilt when the
     proof bytes change, and the views quote it, so the views were always one cycle stale.
     pr-gates' llms-txt-derived test caught it on the candidate head: the manifest's as_of
     2026-10-26T01:48:57Z appeared 0 times in llms.txt, and the candidate could not pass the
     gate and could not merge. Here the order is manifest first, views second, always.

    python3 scripts/root_candidate_reconcile.py --selftest   # proves each failure goes red
    python3 scripts/root_candidate_reconcile.py               # reconcile the checked-out candidate

Exit 0 = reconciled, 1 = a real conflict (fail closed), 2 = UNCHECKABLE (the tree is not a
candidate, or a generator is missing). Measurement, not certification: this merges two trees
and regenerates two derived views. It does not sign, root, attest or certify anything.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

DERIVED_VIEWS = (
    "public/interop/ots/manifest.json",
    "public/llms.txt",
    "public/llms-full.txt",
)

# The manifest is generated from the .ots files in the tree; the views quote it. This order is
# the whole point of the second fault above, so it is asserted rather than assumed.
MANIFEST_BUILDER = "scripts/ots_manifest_rebuild.py"
VIEW_GENERATOR = "scripts/llms-txt.mjs"


class RealConflict(Exception):
    """A conflict outside the derived views. Fail closed; choose nothing."""


class Uncheckable(Exception):
    """The tree is not a candidate, or a generator is missing. Not the same as a conflict."""


def git(repo: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    if check and result.returncode != 0:
        raise Uncheckable(f"git {' '.join(args)} failed: {result.stderr.strip() or result.stdout.strip()}")
    return result


def unmerged_paths(repo: Path) -> list[str]:
    """The paths git left conflicted, in the order git lists them."""
    out = git(repo, "diff", "--name-only", "--diff-filter=U").stdout
    return [line.strip() for line in out.splitlines() if line.strip()]


def is_derived(path: str) -> bool:
    return path in DERIVED_VIEWS


def rebuild_derived_views(repo: Path, builder: list[str], generator: list[str]) -> list[str]:
    """Rebuild the manifest, then the views that quote it. Returns the commands that ran."""
    ran = []
    for cmd in (builder, generator):
        result = subprocess.run(cmd, cwd=str(repo), capture_output=True, text=True)
        if result.returncode != 0:
            raise Uncheckable(
                f"{cmd[0]} failed in {repo}: {result.stderr.strip() or result.stdout.strip()}")
        ran.append(" ".join(cmd))
    return ran


def reconcile(
    repo: Path,
    *,
    remote: str = "origin",
    branch: str = "master",
    builder: list[str] | None = None,
    generator: list[str] | None = None,
    commit: bool = True,
) -> dict:
    """Merge `remote/branch` into the checked-out candidate, then rebuild the derived views.

    Raises RealConflict when something that is not a derived view conflicts, and Uncheckable
    when the merge failed for a reason that is not a conflict, or a generator is missing.
    """
    builder_supplied = builder is not None
    generator_supplied = generator is not None
    builder = builder or [sys.executable, MANIFEST_BUILDER, "--apply"]
    generator = generator or ["node", VIEW_GENERATOR]
    # A default generator that is not in the tree is UNCHECKABLE, not a silent pass. A caller
    # that supplied its own command is responsible for that command, so nothing is checked.
    if not builder_supplied and not (repo / MANIFEST_BUILDER).is_file():
        raise Uncheckable(f"the candidate tree has no {MANIFEST_BUILDER}")
    if not generator_supplied and not (repo / VIEW_GENERATOR).is_file():
        raise Uncheckable(f"the candidate tree has no {VIEW_GENERATOR}")

    git(repo, "fetch", remote, branch)
    merge = git(repo, "merge", "--no-edit", f"{remote}/{branch}", check=False)
    if merge.returncode != 0:
        # A merge that failed without leaving MERGE_HEAD did not conflict; something else is
        # wrong and this must not be papered over.
        head = git(repo, "rev-parse", "-q", "--verify", "MERGE_HEAD", check=False)
        if head.returncode != 0:
            raise Uncheckable(
                "merge failed without a conflict to resolve: "
                f"{merge.stderr.strip() or merge.stdout.strip()}")
        conflicted = unmerged_paths(repo)
        real = [p for p in conflicted if not is_derived(p)]
        if real:
            raise RealConflict(
                "REAL CONFLICT outside the derived views; failing closed: " + ", ".join(real))
        for path in conflicted:
            checkout = git(repo, "checkout", "--ours", "--", path, check=False)
            if checkout.returncode != 0:
                git(repo, "rm", "--quiet", "--", path)
            git(repo, "add", "--", path)
        git(repo, "commit", "--no-edit")

    ran = rebuild_derived_views(repo, builder, generator)
    git(repo, "add", "--", *DERIVED_VIEWS)
    git(repo, "add", "--", "public/interop/ots")
    if commit:
        staged = git(repo, "diff", "--cached", "--quiet", check=False)
        if staged.returncode != 0:
            git(repo, "commit", "-m",
                "reconcile: rebuild the OTS manifest and the llms views from the merged tree")
    return {"rebuilt": ran, "head": git(repo, "rev-parse", "HEAD").stdout.strip()}



# --------------------------------------------------------------------------------------------- selftest

def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _make_repo(tmp: Path, *, master_changes_root: bool, candidate_changes_root: bool) -> Path:
    """A candidate repo where the three derived views conflict, and optionally root.json too."""
    repo = tmp / "repo"
    repo.mkdir(parents=True)
    git(repo, "init", "-q")
    git(repo, "config", "user.email", "root@csoai.org")
    git(repo, "config", "user.name", "csoai-public-root")
    # The machine's global hooks are the estate's own (a pre-push that refuses any repo without
    # scripts/pre-push-gates.sh). A throwaway fixture is not the estate, so point the hooks path
    # at an empty directory: the fixture must not inherit a gate meant for the real tree.
    empty_hooks = repo / ".no-hooks"
    empty_hooks.mkdir(exist_ok=True)
    git(repo, "config", "core.hooksPath", str(empty_hooks))
    for view in DERIVED_VIEWS:
        _write(repo / view, "base\n")
    _write(repo / "public/root.json", "base root\n")
    _write(repo / "scripts/ots_manifest_rebuild.py", "")
    _write(repo / "scripts/llms-txt.mjs", "")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "base")
    git(repo, "branch", "-M", "master")

    # master moves the derived views, and optionally root.json
    for view in DERIVED_VIEWS:
        _write(repo / view, "master\n")
    if master_changes_root:
        _write(repo / "public/root.json", "master root\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "master")

    # the candidate moves them differently, from the same base
    git(repo, "checkout", "-q", "-b", "candidate", "HEAD~1")
    for view in DERIVED_VIEWS:
        _write(repo / view, "candidate\n")
    if candidate_changes_root:
        _write(repo / "public/root.json", "candidate root\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "candidate")

    # a second remote so the merge has somewhere to come from
    remote = tmp / "remote.git"
    subprocess.run(["git", "clone", "-q", "--bare", str(repo), str(remote)], check=True)
    git(repo, "remote", "add", "origin", str(remote))
    git(repo, "fetch", "-q", "origin")
    git(repo, "checkout", "-q", "candidate")
    return repo


def _stubs(repo: Path, log: Path) -> tuple[list[str], list[str]]:
    """Real, runnable stand-ins for the two generators.

    They record the order they ran in, which is what the second fault was about: the
    manifest is generated from the tree, the views are generated from the manifest, and
    the views must never be generated first.
    """
    _write(repo / "scripts/ots_manifest_rebuild.py",
           f"open({str(log)!r}, 'a').write('manifest\\n')\n")
    _write(repo / "scripts/llms-txt.mjs",
           f"import {{ appendFileSync }} from 'node:fs';\n"
           f"appendFileSync({str(log)!r}, 'views\\n');\n")
    return [sys.executable, "scripts/ots_manifest_rebuild.py"], ["node", "scripts/llms-txt.mjs"]


def run_selftest() -> int:
    failures = 0

    # 1. The three derived views conflict: the merge must survive it.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            ok = True
            detail = "reconciled"
        except (RealConflict, Uncheckable) as exc:
            ok = False
            detail = str(exc)
        print(f"  {'ok ' if ok else 'BAD'} derived-view conflict is reconciled: {detail}")
        failures += not ok

    # 2. root.json conflicts too: that is a REAL conflict and must fail closed.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=True, candidate_changes_root=True)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            ok = False
            detail = "a real conflict was resolved automatically"
        except RealConflict as exc:
            ok = "root.json" in str(exc)
            detail = str(exc)[:100]
        except Uncheckable as exc:
            ok = False
            detail = f"unexpected UNCHECKABLE: {exc}"
        print(f"  {'ok ' if ok else 'BAD'} a real conflict fails closed: {detail}")
        failures += not ok

    # 3. The manifest is rebuilt BEFORE the views that quote it. This is the second fault.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        reconcile(repo, builder=builder, generator=generator)
        order = log.read_text(encoding="utf-8").split()
        ok = order == ["manifest", "views"]
        print(f"  {'ok ' if ok else 'BAD'} the manifest is rebuilt before the views that quote it: "
              f"{order}")
        failures += not ok

    # 4. The candidate tree is reconciled with master and ends up containing master's bytes
    #    for a file neither side derived.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        git(repo, "checkout", "-q", "master")
        _write(repo / "plain.txt", "from master\n")
        git(repo, "add", "-A")
        git(repo, "commit", "-q", "-m", "master adds a plain file")
        git(repo, "push", "-q", "origin", "master")
        git(repo, "checkout", "-q", "candidate")
        reconcile(repo, builder=builder, generator=generator)
        merged = git(repo, "cat-file", "-p", "HEAD:plain.txt").stdout.strip()
        ok = merged == "from master"
        print(f"  {'ok ' if ok else 'BAD'} master's non-derived bytes come across: {merged!r}")
        failures += not ok

    # 5. A missing generator is UNCHECKABLE, not a silent pass.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        (repo / "scripts/llms-txt.mjs").unlink()
        try:
            reconcile(repo)
            ok = False
            detail = "a missing generator was not reported"
        except Uncheckable as exc:
            ok = VIEW_GENERATOR in str(exc)
            detail = str(exc)[:80]
        print(f"  {'ok ' if ok else 'BAD'} a missing generator is UNCHECKABLE: {detail}")
        failures += not ok

    # 6. The tool works when it is NOT in the tree it reconciles. This is not hypothetical:
    # the workflow checks out the rolling candidate branch, which does not have this file
    # until it merges master, so the tool is run from a copy fetched out of master while it
    # works on the candidate's tree. Run it the way the workflow runs it.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        _stubs(repo, log)
        outside = Path(tmp) / "tool" / "root_candidate_reconcile.py"
        outside.parent.mkdir(parents=True, exist_ok=True)
        outside.write_text(Path(__file__).read_text(encoding="utf-8"), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(outside), "--repo", str(repo)],
            capture_output=True, text=True, cwd=str(Path(tmp)))
        order = log.read_text(encoding="utf-8").split() if log.exists() else []
        ok = result.returncode == 0 and order == ["manifest", "views"]
        detail = (result.stdout.strip().splitlines() or [result.stderr.strip()])[-1][:90]
        print(f"  {'ok ' if ok else 'BAD'} the tool works from outside the tree it reconciles: "
              f"{detail} | order {order}")
        failures += not ok

    if failures:
        print(f"root-candidate-reconcile selftest: FAIL ({failures} case(s))", file=sys.stderr)
        return 1
    print("root-candidate-reconcile selftest: PASS (6 cases)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Reconcile the public-root candidate with master")
    parser.add_argument("--repo", default=".", help="the candidate working tree")
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--branch", default="master")
    parser.add_argument("--selftest", action="store_true", help="Prove each failure goes red; no network")
    args = parser.parse_args()

    if args.selftest:
        return run_selftest()

    try:
        result = reconcile(Path(args.repo).resolve(), remote=args.remote, branch=args.branch)
    except RealConflict as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except Uncheckable as exc:
        print(f"UNCHECKABLE: {exc}", file=sys.stderr)
        return 2
    print(json.dumps({"state": "RECONCILED", **result}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
