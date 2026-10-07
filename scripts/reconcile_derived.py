#!/usr/bin/env python3
"""Merge master into an automation PR branch, and regenerate DERIVED files instead of failing on them.

WHY (Lane A repair, 7 Oct 2026). Four automation writers commit proof bytes together with the files
derived from them, on PR streams that merge independently: public-root-candidate-upgrade.yml,
card-root.yml (its branches are kept up by card-root-ots-upgrade.yml), card-root-ots-upgrade.yml and
ots-upgrade.yml. Each rewrites public/interop/ots/manifest.json (its as_of line and counts) and
public/llms.txt / public/llms-full.txt (which quote that as_of and those counts), so whichever PR
merges second conflicts on those lines. Shown on the lanes pod (verifier, 07:4xZ): the public-root
candidate, with its manifest rebuilt, conflicted in all three files once a 3-proof card-root OTS
upgrade had landed on master first. The candidate's reconcile step failed closed on any conflict, so
every tick would have exited 1 until a person merged by hand, and the other writers had no reconcile
step at all.

RULE. These three files are generated from bytes in the tree: the manifest from every .ots in its
scanned directories (scripts/ots_manifest_rebuild.py); the llms files from the manifest, other files
on disk and the live board (scripts/llms-txt.mjs). After a merge neither side's copy is right, because
the merged tree holds both sides' proofs. So a conflict confined to these files is resolved by running
their producers over the merged tree, never by choosing a side. A conflict in any other path (root,
proof, witness, pointer or card bytes) aborts the merge and exits 1, as before: those are content,
and a person decides.

Every run also checks the derived files against the tree with the checks pr-gates runs
(root_ots_manifest_gate.py, llms-txt.mjs --check) and regenerates whichever is stale, even after a
clean merge or none: a clean textual merge can still carry a stale manifest row, and llms --check
reads the live board, which moves on its own. A producer that refuses (an unreachable board), still
fails its check afterwards, or touches any path outside the derived set (the manifest rebuild renames
a served non-proof to .ots.invalid, which is withdrawing evidence: a human decision) undoes everything
and exits 1.

    python3 reconcile_derived.py --onto origin/master          # in the checked-out branch

Workflows run master's copy (git show origin/master:scripts/reconcile_derived.py), because the branch
being reconciled can predate this file; the producers it runs are the merged tree's own.

The working tree must have no tracked changes. Prints one JSON line:
  {"result": UP_TO_DATE | MERGED | DERIVED_REGENERATED | CONFLICT_NOT_DERIVED | REFUSED, ...}
Exit 0 for the first three, 1 otherwise. On exit 1 HEAD, the index and the tracked files are as they
were, and untracked files the run created are removed.
"""
from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys

DERIVED = ("public/interop/ots/manifest.json", "public/llms.txt", "public/llms-full.txt")
PY = shlex.quote(sys.executable)


def git(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} exited {r.returncode}: {r.stderr.strip()}")
    return r


def run(cmd: str) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(shlex.split(cmd), capture_output=True, text=True)
    except OSError as exc:  # e.g. node absent: a check that cannot run is not a pass
        return subprocess.CompletedProcess(cmd, 127, "", f"{type(exc).__name__}: {exc}")


def status_paths() -> set[str]:
    """Every path git reports as changed or untracked (porcelain v1, -z; a rename's source is skipped)."""
    out = git("status", "--porcelain=v1", "-z", "--untracked-files=all").stdout.split("\0")
    paths, i = set(), 0
    while i < len(out):
        entry = out[i]
        i += 1
        if not entry:
            continue
        paths.add(entry[3:])
        if entry[0] in "RC":
            i += 1  # the next field is the original path of a rename or copy
    return paths


def untracked() -> set[str]:
    out = git("ls-files", "-z", "--others", "--exclude-standard").stdout.split("\0")
    return {p for p in out if p}


class Refused(Exception):
    pass


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--onto", required=True, help="the ref to merge in, e.g. origin/master")
    ap.add_argument("--manifest-check", default=f"{PY} scripts/pod-loops/root_ots_manifest_gate.py --public-dir public")
    ap.add_argument("--manifest-build", default=f"{PY} scripts/ots_manifest_rebuild.py --apply")
    ap.add_argument("--llms-check", default="node scripts/llms-txt.mjs --check")
    ap.add_argument("--llms-build", default="node scripts/llms-txt.mjs")
    a = ap.parse_args(argv)
    # manifest first: llms quotes it
    steps = [("ots-manifest", a.manifest_check, a.manifest_build, (DERIVED[0],)),
             ("llms", a.llms_check, a.llms_build, DERIVED[1:])]

    report = {"onto": a.onto, "head_before": None, "head_after": None, "conflicts_resolved": [], "regenerated": []}

    def emit(result: str, code: int, **extra) -> int:
        report.update(result=result, **extra)
        print(json.dumps(report))
        return code

    if git("rev-parse", "-q", "--verify", "MERGE_HEAD", check=False).returncode == 0:
        return emit("REFUSED", 1, why="a merge is already in progress")
    if git("diff", "--quiet", check=False).returncode or git("diff", "--cached", "--quiet", check=False).returncode:
        return emit("REFUSED", 1, why="the working tree has tracked changes; reconcile starts from a committed head")
    before = git("rev-parse", "HEAD").stdout.strip()
    onto = git("rev-parse", "--verify", a.onto + "^{commit}").stdout.strip()
    branch = git("rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    report["head_before"] = before
    untracked_before = untracked()

    def undo() -> None:
        # reset --hard also clears MERGE_HEAD; the tree was clean at start, so nothing tracked is lost
        git("reset", "-q", "--hard", before, check=False)
        for p in untracked() - untracked_before:
            git("clean", "-q", "-f", "--", p, check=False)

    merged, conflicted = None, []
    try:
        if git("merge-base", "--is-ancestor", onto, "HEAD", check=False).returncode == 0:
            merged = None  # already contains onto
        elif git("merge-base", "--is-ancestor", "HEAD", onto, check=False).returncode == 0:
            git("merge", "-q", "--ff-only", onto)
            merged = "fast-forward"
        else:
            m = git("merge", "--no-ff", "--no-commit", onto, check=False)
            conflicted = sorted(p for p in git("diff", "--name-only", "--diff-filter=U").stdout.splitlines() if p)
            if m.returncode != 0 and not conflicted:
                raise Refused(f"git merge failed without a content conflict: {m.stderr.strip() or m.stdout.strip()}")
            content = [p for p in conflicted if p not in DERIVED]
            if content:
                undo()
                report["head_after"] = before
                return emit("CONFLICT_NOT_DERIVED", 1, conflicts=conflicted,
                            why=("a conflict outside the derived files is content (root, proof, witness, pointer or card "
                                 "bytes); never resolved automatically. Merge aborted; nothing was committed."))
            for p in conflicted:
                # Any side will do: the producer below rewrites the whole file. The markers must go first,
                # because llms-txt.mjs reads the manifest.
                if git("checkout", "--theirs", "--", p, check=False).returncode != 0 and \
                        git("checkout", "--ours", "--", p, check=False).returncode != 0:
                    raise Refused(f"cannot take either side of {p} as a base to regenerate from")
                git("add", "--", p)
            report["conflicts_resolved"] = conflicted
            merged = "merge"

        changed_before = status_paths()
        for name, check, build, paths in steps:
            if not any(p in conflicted for p in paths) and run(check).returncode == 0:
                continue
            b = run(build)
            if b.returncode != 0:
                raise Refused(f"{name} producer exited {b.returncode}: {(b.stderr or b.stdout).strip()[-600:]}")
            c = run(check)
            if c.returncode != 0:
                raise Refused(f"{name} is still stale after its producer ran: {(c.stderr or c.stdout).strip()[-600:]}")
            report["regenerated"].append(name)
        stray = sorted(p for p in status_paths() - changed_before if p not in DERIVED)
        if stray:
            raise Refused(f"a producer changed paths outside the derived set (review by hand): {stray}")

        present = [p for p in DERIVED if os.path.exists(p) or git("ls-files", "--error-unmatch", "--", p, check=False).returncode == 0]
        if present:
            git("add", "-A", "--", *present)
        if merged == "merge":
            note = (f"; derived files regenerated from the merged bytes ({', '.join(report['regenerated'])})"
                    if report["regenerated"] else "")
            git("commit", "-q", "--no-verify", "-m", f"Merge {a.onto} into {branch}{note}")
        elif git("diff", "--cached", "--quiet", check=False).returncode:
            git("commit", "-q", "--no-verify", "-m",
                f"derived: regenerate {', '.join(report['regenerated'])} from the bytes on {branch}")
    except (Refused, RuntimeError) as exc:
        undo()
        report["head_after"] = before
        return emit("REFUSED", 1, why=str(exc))

    after = git("rev-parse", "HEAD").stdout.strip()
    report["head_after"] = after
    if merged:
        return emit("MERGED", 0, how=merged)
    return emit("DERIVED_REGENERATED" if after != before else "UP_TO_DATE", 0)


if __name__ == "__main__":
    sys.exit(main())
