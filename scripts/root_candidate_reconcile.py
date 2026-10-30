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

  3. A STAMPED ARTEFACT CONFLICTED WITH MASTER AND FAILED CLOSED. public/interop/
     sbom-councilof-ai.json is STAMPED: it has a sibling public/interop/sbom-councilof-ai.json.ots
     that proves those exact bytes. On 2026-10-29 master re-stamped it (#3614) while the
     candidate was parked holding its own regenerated copy, so the merge died on that ONE path
     and the candidate could not reconcile at all. The rule below resolves it: when master
     carries a proof for a path, master's bytes AND master's proof win, as a pair. The candidate
     cannot hold a valid proof for its own bytes - a proof is minted against the exact bytes it
     proves, and the candidate does not mint proofs. So the candidate's copy of a re-stamped
     artefact is stale, and its copy of the proof is stale with it.

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

# A stamped artefact is a file with a sibling OpenTimestamps proof. For a derived view the
# GENERATOR decides the bytes; for a stamped artefact the PROOF decides them, and the only
# proof that exists for master's bytes is the one that sits beside them on master.
STAMPED_SUFFIX = ".ots"

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


def has_path(repo: Path, ref: str, path: str) -> bool:
    """Whether `path` exists in `ref`'s tree. A path that is not there is False, not an error."""
    return git(repo, "cat-file", "-e", f"{ref}:{path}", check=False).returncode == 0


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

    # Fetch with an EXPLICIT refspec that force-updates the remote-tracking ref. A plain
    # `git fetch origin master` writes FETCH_HEAD only and leaves refs/remotes/origin/master
    # where it was (Git 2.20 removed the opportunistic update), so the merge below would
    # reconcile the candidate against whichever master the checkout happened to see, not
    # against the master this run fetched. That is a silent wrong answer, so the refspec
    # names the destination.
    git(repo, "fetch", remote, f"+refs/heads/{branch}:refs/remotes/{remote}/{branch}")
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
        master_ref = f"{remote}/{branch}"
        # A stamped artefact resolves to MASTER's bytes and MASTER's proof, as a pair.
        #
        # The candidate cannot hold a valid proof for its own bytes: a proof is minted
        # against the exact bytes it proves, and the candidate does not mint proofs. So
        # when master carries a proof for a path, the candidate's copy of that path is
        # stale, and its copy of the proof is stale with it. Measured 2026-10-29: master
        # re-stamped the SBOM while the candidate was parked, and the merge died on
        # public/interop/sbom-councilof-ai.json — one path — with the candidate unable to
        # reconcile at all.
        #
        # This is not "choose a side". For a derived view the generator decides the bytes,
        # so either side will do. For a stamped artefact the proof decides, and the proof
        # that exists is the one beside master's bytes.
        stamped = [p for p in conflicted if has_path(repo, master_ref, p + STAMPED_SUFFIX)]
        real = [p for p in conflicted if not is_derived(p) and p not in stamped]
        if real:
            raise RealConflict(
                "REAL CONFLICT outside the derived views and the stamped artefacts; "
                "failing closed: " + ", ".join(real))
        for path in conflicted:
            if path in stamped:
                checkout = git(repo, "checkout", "--theirs", "--", path, check=False)
                if checkout.returncode != 0:
                    git(repo, "rm", "--quiet", "--", path)
                # The proof comes with the bytes it proves. If the proof itself conflicted,
                # master's proof is the one that matches master's bytes.
                proof = path + STAMPED_SUFFIX
                if proof in conflicted:
                    git(repo, "checkout", "--theirs", "--", proof, check=False)
                    git(repo, "add", "--", proof)
            else:
                # a derived view: the generator decides the bytes, so either side will do
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


def _make_stamped_repo(tmp: Path) -> Path:
    """A candidate repo where MASTER re-stamps an artefact and the CANDIDATE holds a
    different copy of the same artefact, with the OLD proof.

    This is the 2026-10-29 situation exactly: master re-stamped
    public/interop/sbom-councilof-ai.json (#3614) while the candidate was parked with its
    own regenerated copy. The merge must not fail closed on that path, and the tree it
    leaves must carry master's bytes AND master's proof, because a proof is minted against
    the exact bytes it proves.
    """
    repo = tmp / "repo"
    repo.mkdir(parents=True)
    git(repo, "init", "-q")
    git(repo, "config", "user.email", "root@csoai.org")
    git(repo, "config", "user.name", "csoai-public-root")
    empty_hooks = repo / ".no-hooks"
    empty_hooks.mkdir(exist_ok=True)
    git(repo, "config", "core.hooksPath", str(empty_hooks))
    for view in DERIVED_VIEWS:
        _write(repo / view, "base\n")
    _write(repo / "public/interop/stamped.json", "base artefact\n")
    _write(repo / "public/interop/stamped.json.ots", "base proof\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "base")
    git(repo, "branch", "-M", "master")

    # master re-stamps: new bytes AND a new proof beside them
    _write(repo / "public/interop/stamped.json", "master artefact\n")
    _write(repo / "public/interop/stamped.json.ots", "master proof\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "master re-stamps")

    # the candidate holds its own regenerated copy, and the inherited proof
    git(repo, "checkout", "-q", "-b", "candidate", "HEAD~1")
    _write(repo / "public/interop/stamped.json", "candidate artefact\n")
    git(repo, "add", "-A")
    git(repo, "commit", "-q", "-m", "candidate regenerates")

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
    #    for a file neither side derived. The remote's master moves from a SECOND clone, so
    #    this repo's refs/remotes/origin/master is STALE when the reconcile runs. That is the
    #    real situation — another lane pushed to master — and it is exactly what a plain
    #    `git fetch origin master` does not fix, because that writes FETCH_HEAD only and
    #    leaves the tracking ref where it was (Git 2.20 removed the opportunistic update).
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_repo(Path(tmp), master_changes_root=False, candidate_changes_root=False)
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        remote_url = git(repo, "remote", "get-url", "origin").stdout.strip()
        other = Path(tmp) / "other"
        subprocess.run(["git", "clone", "-q", remote_url, str(other)], check=True)
        empty_hooks = other / ".no-hooks"
        empty_hooks.mkdir(exist_ok=True)
        git(other, "config", "core.hooksPath", str(empty_hooks))
        git(other, "config", "user.email", "root@csoai.org")
        git(other, "config", "user.name", "csoai-public-root")
        git(other, "checkout", "-q", "master")
        _write(other / "plain.txt", "from master\n")
        git(other, "add", "-A")
        git(other, "commit", "-q", "-m", "master adds a plain file")
        git(other, "push", "-q", "origin", "master")
        git(repo, "checkout", "-q", "candidate")
        # Narrow the remote's refspec, the way a checkout that tracks one branch has it.
        # With a narrow refspec a plain `git fetch origin master` writes FETCH_HEAD and
        # leaves refs/remotes/origin/master stale, so the merge would reconcile against an
        # OLD master and say so with a clean exit code. The fetch names its destination, so
        # the refspec cannot decide the answer.
        git(repo, "config", "remote.origin.fetch", "+refs/heads/other:refs/remotes/origin/other")
        stale = git(repo, "rev-parse", "refs/remotes/origin/master").stdout.strip()
        reconcile(repo, builder=builder, generator=generator)
        try:
            merged = git(repo, "cat-file", "-p", "HEAD:plain.txt").stdout.strip()
        except Uncheckable:
            merged = "<master's file never arrived>"
        fresh = git(repo, "rev-parse", "refs/remotes/origin/master").stdout.strip()
        ok = merged == "from master" and stale != fresh
        print(f"  {'ok ' if ok else 'BAD'} master moves under a narrow refspec and still comes "
              f"across: {merged!r} | tracking ref {'was stale, now refreshed' if stale != fresh else 'was NOT stale'}")
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

    # 7. A re-stamped artefact: the merge must survive it, and the tree it leaves must carry
    #    MASTER's bytes and MASTER's proof. A candidate that kept its own copy would carry a
    #    proof that no longer proves what sits next to it.
    with tempfile.TemporaryDirectory() as tmp:
        repo = _make_stamped_repo(Path(tmp))
        log = Path(tmp) / "order.log"
        builder, generator = _stubs(repo, log)
        try:
            reconcile(repo, builder=builder, generator=generator)
            artefact = git(repo, "cat-file", "-p", "HEAD:public/interop/stamped.json").stdout.strip()
            proof = git(repo, "cat-file", "-p", "HEAD:public/interop/stamped.json.ots").stdout.strip()
            ok = artefact == "master artefact" and proof == "master proof"
            detail = f"artefact {artefact!r} proof {proof!r}"
        except (RealConflict, Uncheckable) as exc:
            ok = False
            detail = str(exc)[:100]
        print(f"  {'ok ' if ok else 'BAD'} a re-stamped artefact takes master's bytes and master's proof: {detail}")
        failures += not ok

    if failures:
        print(f"root-candidate-reconcile selftest: FAIL ({failures} case(s))", file=sys.stderr)
        return 1
    print("root-candidate-reconcile selftest: PASS (7 cases)")
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
