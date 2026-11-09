#!/usr/bin/env python3
"""Sign a landing branch with master's code. The landing branch is data, never code.

Until this file the card signer (.github/workflows/hf-fin-shells-measure.yml, targets mill and
runpod) was dispatched ON the landing branch. That branch's own copy of the workflow and of
scripts/ then asked /api/board-sign for the signature, so whoever could push a branch named
runpod/land-1 chose the code that requested it.

Master mode: the workflow is dispatched on master with the landing branch name as an input.
The workspace is master. This file holds the three steps the signer then needs and the two
the landers need:

  mode      decide master / branch / direct from the dispatch inputs, or refuse
  overlay   mill only: write into the workspace the files the landing branch added under
            public/interop/mill-cards-unsigned and public/interop/mill-evidence. Nothing else
            on the branch is read, and nothing on it is run.
  commit    put the files this signing run changed onto the landing branch tip and push
            there. Master is never a push target.
  dispatch  lander: start the signer on master with land_branch set
  wait      lander: find that run on master by its run-name, wait for it, and if it did not
            succeed start the old branch dispatch once, loudly

Branch mode (dispatch on the landing branch, no land_branch) is unchanged. It stays as the
fallback until /api/board-sign itself accepts only master.

Nothing here signs, holds a key or decides MEASURED. Python 3.8+, standard library only.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import stat
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Tuple

WORKFLOW = "hf-fin-shells-measure.yml"
REMOTE = "origin"
PROTECTED = ("master", "main", "HEAD")
CARD_TARGETS = ("mill", "runpod")
ALL_TARGETS = ("financial", "ledger", "mill", "runpod")

# The three landers name their branches runpod/land-<intake run id> (runpod-land.yml),
# mill/land-<axis>-<run id> (hub-queue-land.yml) and mill/land-hfjobs-<run id>
# (mill-jobs-land.yml). fullmatch, not match: "$" would let a trailing newline through.
RUNPOD_BRANCH = re.compile(r"runpod/land-([1-9][0-9]*)")
MILL_BRANCH = re.compile(r"mill/land-[A-Za-z0-9][A-Za-z0-9._-]*")

# The only two directories read from a landing branch (mill target).
DATA_DIRS = ("public/interop/mill-cards-unsigned", "public/interop/mill-evidence")

# What a signing run may change. These are the `git add` lists of the branch-mode commit step
# in hf-fin-shells-measure.yml; test_sign_land_branch.py fails if the two ever differ.
DERIVED_OUTPUTS = (
    "public/interop/hub-cards-index-*",
    "public/interop/mill-receipt-readiness-*",
    "public/interop/crosswalk/intoto",
    "public/interop/regulatory-inventory-*",
    "functions/api/_regulatory_inventory.ts",
    "public/interop/ots/manifest.json",
    "public/llms.txt",
    "public/llms-full.txt",
)
OUTPUTS = {
    "mill": ("public/interop/mill-cards-signed", "public/interop/mill-cards-unsigned") + DERIVED_OUTPUTS,
    "runpod": ("public/interop/mill-cards-signed",) + DERIVED_OUTPUTS,
}

COMMIT_NAME = "csoai-financial-measure"
COMMIT_EMAIL = "board@csoai.org"
FALLBACK_MARK = "SIGNER FALLBACK"


class Refused(Exception):
    """A rule said no. The message is printed as it is; it never carries a secret."""


# ---------------------------------------------------------------- rules (pure)

def run_title(target: str, land_branch: str) -> str:
    """The run-name of a master-mode signer run. hf-fin-shells-measure.yml builds the same text."""
    return f"sign {target} {land_branch}"


def check_land_branch(target: str, branch: str, intake_run_id: Optional[str] = None) -> str:
    """Return the branch if it is a landing branch this target may write to, else Refused."""
    branch = branch if isinstance(branch, str) else ""
    if branch in PROTECTED:
        raise Refused(f"refused: {branch!r} is not a landing branch; signed output never pushes master directly")
    if target == "runpod":
        m = RUNPOD_BRANCH.fullmatch(branch)
        if not m:
            raise Refused("refused: land_branch for runpod must be runpod/land-<intake run id>")
        if intake_run_id is not None and m.group(1) != str(intake_run_id):
            raise Refused("refused: land_branch must equal runpod/land-<intake_run_id> of this dispatch")
        return branch
    if target == "mill":
        if not MILL_BRANCH.fullmatch(branch) or ".." in branch or branch.endswith((".", ".lock")):
            raise Refused("refused: land_branch for mill must be mill/land-<letters, digits, dot, dash, underscore>")
        return branch
    raise Refused(f"refused: target {target!r} has no landing branch")


def resolve_mode(target: str, dispatch_ref: str, land_branch: str, intake_run_id: str = "") -> str:
    """master: master's code, the landing branch is data and receives the signed files.
    branch: the old form, the workflow was dispatched on the landing branch itself.
    direct: financial and ledger, which have no landing branch (unchanged)."""
    if target not in ALL_TARGETS:
        raise Refused(f"refused: unknown target {target!r}")
    land_branch = land_branch or ""
    if target not in CARD_TARGETS:
        if land_branch:
            raise Refused("refused: land_branch applies only to targets mill and runpod")
        return "direct"
    if land_branch:
        if dispatch_ref != "refs/heads/master":
            raise Refused("refused: land_branch is accepted only on a master dispatch; a branch dispatch takes none")
        check_land_branch(target, land_branch, intake_run_id if target == "runpod" else None)
        return "master"
    if not dispatch_ref.startswith("refs/heads/") or dispatch_ref == "refs/heads/master":
        raise Refused(
            f"refused: {target} signing on master needs land_branch (the branch that receives the signed files); "
            "signed output never pushes master directly"
        )
    return "branch"


def safe_repo_path(path: str, under: Sequence[str] = ()) -> str:
    """A plain relative path with no way out of the tree, or Refused."""
    if not path or path.startswith(("/", "-")) or "\\" in path or any(ord(c) < 32 or ord(c) == 127 for c in path):
        raise Refused(f"refused: unsafe path {path!r}")
    parts = path.split("/")
    if any(p in ("", ".", "..") or p.lower() == ".git" for p in parts):
        raise Refused(f"refused: unsafe path {path!r}")
    if under and not any(path.startswith(d.rstrip("/") + "/") for d in under):
        raise Refused(f"refused: {path!r} is outside {', '.join(under)}")
    return path


# ---------------------------------------------------------------- git plumbing

def git(repo: Path, *args: str, data: Optional[bytes] = None, env: Optional[Dict[str, str]] = None,
        check: bool = True) -> subprocess.CompletedProcess:
    full_env = dict(os.environ)
    full_env.update(env or {})
    r = subprocess.run(["git", *args], cwd=str(repo), input=data, env=full_env,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and r.returncode != 0:
        raise Refused(f"git {' '.join(args[:3])} failed: {r.stderr.decode('utf-8', 'replace').strip()[:400]}")
    return r


def out(repo: Path, *args: str, **kw) -> str:
    return git(repo, *args, **kw).stdout.decode("utf-8", "replace").strip()


def fetch_branch(repo: Path, branch: str, remote: str = REMOTE) -> str:
    """Fetch one branch into a private ref and return its commit. Nothing is checked out."""
    ref = f"refs/sign-land/{branch}"
    git(repo, "fetch", "--quiet", "--no-tags", remote, f"+refs/heads/{branch}:{ref}")
    return out(repo, "rev-parse", "--verify", f"{ref}^{{commit}}")


def ls_tree(repo: Path, rev: str, paths: Sequence[str]) -> Dict[str, Tuple[str, str, str]]:
    raw = git(repo, "ls-tree", "-r", "-z", rev, "--", *paths).stdout
    entries: Dict[str, Tuple[str, str, str]] = {}
    for item in raw.split(b"\0"):
        if not item:
            continue
        meta, _, name = item.partition(b"\t")
        mode, kind, sha = meta.decode().split()
        entries[name.decode("utf-8", "surrogateescape")] = (mode, kind, sha)
    return entries


def read_blobs(repo: Path, shas: Sequence[str]) -> Dict[str, bytes]:
    """One `git cat-file --batch` for every blob: a landing can carry over a thousand files."""
    if not shas:
        return {}
    raw = git(repo, "cat-file", "--batch", data=("\n".join(shas) + "\n").encode()).stdout
    blobs: Dict[str, bytes] = {}
    pos = 0
    for sha in shas:
        end = raw.index(b"\n", pos)
        header = raw[pos:end].decode().split()
        if len(header) != 3 or header[1] != "blob":
            raise Refused(f"refused: {sha[:12]} is not a readable blob")
        size = int(header[2])
        blobs[sha] = raw[end + 1:end + 1 + size]
        pos = end + 1 + size + 1
    return blobs


def no_symlink_on_the_way(repo: Path, rel: str) -> Path:
    """The destination for rel, after checking no part of it is a symlink out of the workspace."""
    cur = repo
    for part in rel.split("/"):
        cur = cur / part
        if cur.is_symlink():
            raise Refused(f"refused: {rel!r} passes through a symlink in the workspace")
    return cur


# ---------------------------------------------------------------- overlay (signer, mill)

def overlay(repo: Path, branch: str, remote: str = REMOTE, dirs: Sequence[str] = DATA_DIRS) -> dict:
    """Apply what the landing branch added under the data directories onto the workspace.

    Only the difference between the branch and the point where it left master is applied, so
    a file master changed after the branch was cut keeps master's bytes. Regular files only.
    Everything is checked before anything is written.
    """
    check_land_branch("mill", branch)
    tip = fetch_branch(repo, branch, remote)
    base = git(repo, "merge-base", "HEAD", tip, check=False)
    if base.returncode != 0 or not base.stdout.strip():
        raise Refused(f"refused: {branch} shares no history with the workspace commit")
    base_sha = base.stdout.decode().strip()
    then, now = ls_tree(repo, base_sha, dirs), ls_tree(repo, tip, dirs)
    writes: List[Tuple[str, str]] = []
    for path, entry in sorted(now.items()):
        if then.get(path) == entry:
            continue
        mode, kind, sha = entry
        safe_repo_path(path, dirs)
        if kind != "blob" or mode not in ("100644", "100755"):
            raise Refused(f"refused: {path!r} on {branch} is not a regular file (mode {mode})")
        writes.append((path, sha))
    removals = sorted(safe_repo_path(p, dirs) for p in then if p not in now)
    blobs = read_blobs(repo, sorted({sha for _, sha in writes}))
    targets = [(no_symlink_on_the_way(repo, path), blobs[sha]) for path, sha in writes]
    gone = [no_symlink_on_the_way(repo, path) for path in removals]
    for dest, content in targets:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(content)
    removed = 0
    for dest in gone:
        if dest.is_file():
            dest.unlink()
            removed += 1
    report = {"branch": branch, "tip": tip, "merge_base": base_sha, "written": len(targets),
              "removed": removed, "dirs": list(dirs)}
    print(f"overlay: {branch} @ {tip[:12]} (left master at {base_sha[:12]}): {len(targets)} file(s) written, "
          f"{removed} removed, under {' and '.join(dirs)}. Nothing else on the branch was read.")
    return report


# ---------------------------------------------------------------- commit (signer, mill and runpod)

def changed_outputs(repo: Path, pathspecs: Sequence[str]) -> List[str]:
    """Output paths that differ from the workspace commit: changed, deleted or new. .gitignore is
    honoured, exactly as the branch-mode `git add` honours it."""
    tracked = git(repo, "diff", "--name-only", "-z", "--no-renames", "HEAD", "--", *pathspecs).stdout
    untracked = git(repo, "ls-files", "-z", "--others", "--exclude-standard", "--", *pathspecs).stdout
    names = {n.decode("utf-8", "surrogateescape") for n in (tracked + untracked).split(b"\0") if n}
    return sorted(safe_repo_path(n) for n in names)


def tree_with(repo: Path, tip: str, changed: Sequence[str]) -> str:
    """The tree of `tip` with each changed path replaced by the workspace file (or removed when
    the workspace no longer has it). Built in a throwaway index: the branch is never checked out."""
    present: List[str] = []
    absent: List[str] = []
    for path in changed:
        full = repo / path
        if full.is_symlink() or (full.exists() and not full.is_file()):
            raise Refused(f"refused: output {path!r} is not a regular file")
        (present if full.is_file() else absent).append(path)
    with tempfile.TemporaryDirectory() as tmp:
        env = {"GIT_INDEX_FILE": os.path.join(tmp, "index")}
        git(repo, "read-tree", tip, env=env)
        lines: List[bytes] = []
        if present:
            shas = out(repo, "hash-object", "-w", "--stdin-paths", data=("\n".join(present) + "\n").encode()).split()
            if len(shas) != len(present):
                raise Refused("refused: could not hash every output file")
            for path, sha in zip(present, shas):
                mode = "100755" if (repo / path).stat().st_mode & stat.S_IXUSR else "100644"
                lines.append(f"{mode} {sha}\t{path}".encode())
        lines += [f"0 {'0' * len(tip)}\t{path}".encode() for path in absent]
        git(repo, "update-index", "-z", "--index-info", data=b"\0".join(lines) + b"\0", env=env)
        return out(repo, "write-tree", env=env)


def commit_onto_branch(repo: Path, target: str, branch: str, message: str, remote: str = REMOTE,
                       intake_run_id: Optional[str] = None,
                       before_push: Optional[Callable[[int], None]] = None) -> dict:
    """Commit this run's changed output files on top of the landing branch and push there.

    The parent is the branch tip as fetched now, so no force is ever needed. If the tip moves
    between the fetch and the push the commit is rebuilt on the new tip once. A tree equal to
    the tip's means there is nothing new and nothing is pushed.
    """
    check_land_branch(target, branch, intake_run_id if target == "runpod" else None)
    changed = changed_outputs(repo, OUTPUTS[target])
    if not changed:
        print("no card change")
        return {"pushed": False, "changed": 0}
    identity = {"GIT_AUTHOR_NAME": COMMIT_NAME, "GIT_AUTHOR_EMAIL": COMMIT_EMAIL,
                "GIT_COMMITTER_NAME": COMMIT_NAME, "GIT_COMMITTER_EMAIL": COMMIT_EMAIL}
    error = ""
    for attempt in (1, 2):
        tip = fetch_branch(repo, branch, remote)
        tree = tree_with(repo, tip, changed)
        if tree == out(repo, "rev-parse", f"{tip}^{{tree}}"):
            print(f"no card change: {branch} @ {tip[:12]} already carries these bytes")
            return {"pushed": False, "changed": len(changed), "tip": tip}
        commit = out(repo, "commit-tree", tree, "-p", tip, "-m", message, env=identity)
        if before_push is not None:
            before_push(attempt)
        pushed = git(repo, "push", "--quiet", remote, f"{commit}:refs/heads/{branch}", check=False)
        if pushed.returncode == 0:
            # Report what the commit holds, not what was compared: for mill most compared paths
            # are inbox cards the branch already carries.
            landed = out(repo, "diff", "--name-status", "--no-renames", tip, commit).splitlines()
            print(f"pushed {commit[:12]} onto {branch} (parent {tip[:12]}): {len(landed)} path(s)")
            for line in landed[:25]:
                print(f"  {line}")
            if len(landed) > 25:
                print(f"  ... and {len(landed) - 25} more")
            return {"pushed": True, "changed": len(landed), "commit": commit, "parent": tip}
        error = pushed.stderr.decode("utf-8", "replace").strip()[:400]
        print(f"push to {branch} was not accepted (attempt {attempt}): {error}", file=sys.stderr)
    raise Refused(f"refused: could not push onto {branch} after two attempts: {error}")


# ---------------------------------------------------------------- landers: dispatch and wait

Runner = Callable[[List[str]], subprocess.CompletedProcess]


def _run(cmd: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)


def newest_run_id(run: Runner) -> int:
    """Id of the newest signer run of any kind, read before a dispatch. Run ids only grow, so the
    run a dispatch starts is the one with a larger id: no clock is compared."""
    for _ in range(3):
        r = run(["gh", "run", "list", "--workflow", WORKFLOW, "-L", "1", "--json", "databaseId"])
        if r.returncode == 0:
            try:
                rows = json.loads(r.stdout or "[]")
                return int(rows[0]["databaseId"]) if rows else 0
            except (ValueError, KeyError, TypeError, IndexError):
                pass
    print("could not read the newest signer run id; any run with the expected title will be taken", file=sys.stderr)
    return 0


def dispatch_command(target: str, land_branch: str, run_value: str, mode: str,
                     supersede_scope: str = "") -> List[str]:
    key = "intake_run_id" if target == "runpod" else "mill_run_id"
    cmd = ["gh", "workflow", "run", WORKFLOW, "--ref", "master" if mode == "master" else land_branch,
           "-f", f"target={target}", "-f", f"{key}={run_value}"]
    if mode == "master":
        cmd += ["-f", f"land_branch={land_branch}"]
    if supersede_scope:
        cmd += ["-f", f"supersede_scope={supersede_scope}"]
    return cmd


def loud(message: str) -> None:
    line = f"{FALLBACK_MARK}: {message}"
    print(f"::warning title={FALLBACK_MARK}::{message}")
    print(line, file=sys.stderr)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        try:
            with open(summary, "a", encoding="utf-8") as fh:
                fh.write(f"\n**{line}**\n")
        except OSError:
            pass


def dispatch(target: str, land_branch: str, run_value: str, run: Runner = _run,
             supersede_scope: str = "") -> dict:
    """Start the signer on master with the landing branch as an input. If the branch name is not
    one master mode takes, or GitHub refuses the master dispatch, start the old branch dispatch
    instead and say so loudly: no landing is lost while master mode is being proven."""
    reason = ""
    try:
        check_land_branch(target, land_branch, run_value if target == "runpod" else None)
    except Refused as error:
        reason = str(error)
    after = newest_run_id(run)
    if not reason:
        r = run(dispatch_command(target, land_branch, run_value, "master", supersede_scope))
        if r.returncode == 0:
            print(f"dispatched {WORKFLOW} on master: target={target} run={run_value} land_branch={land_branch} "
                  f"(master's code signs; the branch is data)")
            return {"signer_mode": "master", "signer_after": after}
        reason = f"GitHub refused the master dispatch: {(r.stderr or '').strip()[:300]}"
    loud(f"{reason}. Dispatching the old branch mode on {land_branch} once.")
    r = run(dispatch_command(target, land_branch, run_value, "branch"))
    if r.returncode != 0:
        raise Refused(f"the branch dispatch failed too: {(r.stderr or '').strip()[:300]}")
    print(f"dispatched {WORKFLOW} on {land_branch}: target={target} run={run_value} (branch mode)")
    return {"signer_mode": "branch", "signer_after": after}


def find_run(run: Runner, mode: str, target: str, land_branch: str, after: int) -> Optional[dict]:
    """The newest signer run started after `after`: on master by run-name, else on the branch."""
    fields = "databaseId,status,conclusion,displayTitle,createdAt"
    if mode == "master":
        cmd = ["gh", "run", "list", "--workflow", WORKFLOW, "--branch", "master", "--event", "workflow_dispatch",
               "-L", "50", "--json", fields]
    else:
        cmd = ["gh", "run", "list", "--workflow", WORKFLOW, "--branch", land_branch, "-L", "20", "--json", fields]
    r = run(cmd)
    if r.returncode != 0:
        print(f"run list failed (will retry): {(r.stderr or '').strip()[:200]}", file=sys.stderr)
        return None
    try:
        rows = json.loads(r.stdout or "[]")
    except ValueError:
        return None
    title = run_title(target, land_branch)
    mine = [row for row in rows if isinstance(row, dict) and int(row.get("databaseId") or 0) > after
            and (mode != "master" or row.get("displayTitle") == title)]
    return max(mine, key=lambda row: int(row["databaseId"])) if mine else None


def wait_for(run: Runner, mode: str, target: str, land_branch: str, after: int, tries: int, interval: float,
             sleep: Callable[[float], None]) -> Optional[dict]:
    found = None
    for attempt in range(tries):
        found = find_run(run, mode, target, land_branch, after) or found
        print(f"signer run={(found or {}).get('databaseId', '?')} status={(found or {}).get('status', '?')} "
              f"conclusion={(found or {}).get('conclusion') or '?'}")
        if found and found.get("status") == "completed":
            return found
        if attempt + 1 < tries:
            sleep(interval)
    return found


def failed_steps(run: Runner, run_id: int) -> str:
    r = run(["gh", "run", "view", str(run_id), "--json", "jobs"])
    if r.returncode != 0:
        return "step unknown"
    try:
        names = [s.get("name") for j in json.loads(r.stdout or "{}").get("jobs") or [] for s in j.get("steps") or []
                 if s.get("conclusion") == "failure"]
    except (ValueError, AttributeError):
        return "step unknown"
    return "; ".join(f"'{n}'" for n in names if n) or "step unknown"


def wait(target: str, land_branch: str, run_value: str, mode: str, after: int, tries: int, interval: float,
         initial_sleep: float, run: Runner = _run, sleep: Callable[[float], None] = time.sleep,
         fallback: bool = True, supersede_scope: str = "") -> dict:
    """Wait for the signer run. A master-mode run that completes without success is followed by
    one branch-mode dispatch. A run that never completes is not: two signers on one branch
    would only race."""
    sleep(initial_sleep)
    found = wait_for(run, mode, target, land_branch, after, tries, interval, sleep)
    final_mode = mode
    done = bool(found) and found.get("status") == "completed"
    if mode == "master" and done and found.get("conclusion") != "success" and fallback:
        where = failed_steps(run, int(found["databaseId"]))
        loud(f"master-mode signer run {found['databaseId']} for {land_branch} ended {found.get('conclusion')} at {where}. "
             f"Dispatching the old branch mode once so the landing is not lost. If it fails at the same step, "
             f"the refusal is about the data, not the mode.")
        mark = max(newest_run_id(run), int(found["databaseId"]))
        r = run(dispatch_command(target, land_branch, run_value, "branch", supersede_scope))
        if r.returncode == 0:
            final_mode = "branch-fallback"
            sleep(initial_sleep)
            found = wait_for(run, "branch", target, land_branch, mark, tries, interval, sleep)
            done = bool(found) and found.get("status") == "completed"
        else:
            print(f"the branch dispatch failed: {(r.stderr or '').strip()[:300]}", file=sys.stderr)
    conclusion = (found.get("conclusion") or "unknown") if done else "unknown"
    if not done:
        print(f"no completed signer run for {land_branch} within the wait "
              f"({'none found' if not found else 'still ' + str(found.get('status'))})", file=sys.stderr)
    return {"conclusion": conclusion, "signer_run_id": (found or {}).get("databaseId", ""),
            "signer_mode": final_mode, "fallback": "true" if final_mode == "branch-fallback" else "false"}


# ---------------------------------------------------------------- command line

def write_outputs(path: Optional[str], values: dict) -> None:
    if not path:
        return
    with open(path, "a", encoding="utf-8") as fh:
        for key, value in values.items():
            fh.write(f"{key}={value}\n")


def provenance(message: str, branch: str) -> str:
    sha, run_id, attempt = (os.environ.get(k, "") for k in ("GITHUB_SHA", "GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT"))
    lines = [message, "", f"Signed by master's code; {branch} was read as data only."]
    if sha:
        lines.append(f"Code: {sha}")
    if run_id:
        lines.append(f"Run: {run_id} attempt {attempt or '1'}")
    return "\n".join(lines)


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd")
    sub.required = True

    p = sub.add_parser("mode", help="decide master / branch / direct, or refuse")
    p.add_argument("--target", required=True)
    p.add_argument("--dispatch-ref", required=True)
    p.add_argument("--land-branch", default="")
    p.add_argument("--intake-run-id", default="")
    p.add_argument("--remote", default="", help="when set, a master-mode branch must exist on this remote")
    p.add_argument("--github-output")

    p = sub.add_parser("overlay", help="mill: read the landing branch's two data directories into the workspace")
    p.add_argument("--land-branch", required=True)
    p.add_argument("--remote", default=REMOTE)

    p = sub.add_parser("commit", help="put this run's changed outputs onto the landing branch and push")
    p.add_argument("--target", required=True, choices=CARD_TARGETS)
    p.add_argument("--land-branch", required=True)
    p.add_argument("--intake-run-id", default="")
    p.add_argument("--message", required=True)
    p.add_argument("--remote", default=REMOTE)
    p.add_argument("--github-output")

    p = sub.add_parser("dispatch", help="lander: start the signer on master for a landing branch")
    p.add_argument("--target", required=True, choices=CARD_TARGETS)
    p.add_argument("--land-branch", required=True)
    p.add_argument("--run-id", required=True, help="intake_run_id (runpod) or mill_run_id (mill)")
    p.add_argument("--supersede-scope", default="", help="forwarded to the signer as supersede_scope")
    p.add_argument("--github-output")

    p = sub.add_parser("wait", help="lander: wait for the signer run; fall back to branch mode once if it failed")
    p.add_argument("--target", required=True, choices=CARD_TARGETS)
    p.add_argument("--land-branch", required=True)
    p.add_argument("--run-id", required=True)
    p.add_argument("--mode", default="master", help="signer_mode from the dispatch step")
    p.add_argument("--after", default="0", help="signer_after from the dispatch step")
    p.add_argument("--tries", type=int, default=40)
    p.add_argument("--interval", type=float, default=15)
    p.add_argument("--initial-sleep", type=float, default=20)
    p.add_argument("--no-fallback", action="store_true")
    p.add_argument("--require-success", action="store_true")
    p.add_argument("--supersede-scope", default="", help="the scope the fallback dispatch must use")
    p.add_argument("--github-output")

    args = parser.parse_args(argv)
    repo = Path.cwd()
    try:
        if args.cmd == "mode":
            mode = resolve_mode(args.target, args.dispatch_ref, args.land_branch, args.intake_run_id)
            if mode == "master" and args.remote:
                found = git(repo, "ls-remote", "--exit-code", "--heads", args.remote,
                            f"refs/heads/{args.land_branch}", check=False)
                if found.returncode != 0:
                    raise Refused(f"refused: {args.land_branch} does not exist on {args.remote}; nothing to sign for")
            print(f"signing mode: {mode}" + (f" (land_branch {args.land_branch})" if mode == "master" else ""))
            write_outputs(args.github_output, {"mode": mode})
        elif args.cmd == "overlay":
            overlay(repo, args.land_branch, args.remote)
        elif args.cmd == "commit":
            result = commit_onto_branch(repo, args.target, args.land_branch,
                                        provenance(args.message, args.land_branch), args.remote,
                                        intake_run_id=args.intake_run_id or None)
            write_outputs(args.github_output, {"pushed": "true" if result["pushed"] else "false"})
        elif args.cmd == "dispatch":
            write_outputs(args.github_output, dispatch(args.target, args.land_branch, args.run_id,
                                                      supersede_scope=args.supersede_scope))
        elif args.cmd == "wait":
            mode = args.mode if args.mode in ("master", "branch") else "master"
            after = int(args.after) if str(args.after).isdigit() else 0
            result = wait(args.target, args.land_branch, args.run_id, mode, after, args.tries, args.interval,
                          args.initial_sleep, fallback=not args.no_fallback, supersede_scope=args.supersede_scope)
            write_outputs(args.github_output, result)
            print(f"signer: {result['conclusion']} (mode {result['signer_mode']}, run {result['signer_run_id'] or '?'})")
            if args.require_success and result["conclusion"] != "success":
                return 1
    except Refused as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
