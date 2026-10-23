#!/usr/bin/env python3
"""Continue the existing provider capture on one pending, data-only review branch.

Master supplies all executable code. Branches supply only validated feed bytes.
The capture bundle is uploaded by the workflow before promote is allowed to run.
This helper never signs, merges, closes a PR, deploys, or force-pushes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

import provider_watch as pw

FEED = "public/feeds/provider-diff/"
BRANCH = re.compile(r"automation/provider-watch-(?:\d{4}-\d{2}-\d{2}T\d{4,6}Z|run-\d+)$")
MARKER = "Provider-Watch-Continuity: 1"
SCHEMA = "csoai.provider-watch.promotion/0.1"
MAX_FILE = 16 * 1024 * 1024
MAX_TOTAL = 64 * 1024 * 1024


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp.replace(path)


def allowed(path: str) -> bool:
    return path in (FEED + "state.json", FEED + "index.json") or bool(
        re.fullmatch(re.escape(FEED) + r"leaves/card-[A-Za-z0-9_.-]+-unsigned\.json", path)
    )


def read_directory(directory: Path) -> dict[str, bytes]:
    require(directory.is_dir() and not directory.is_symlink(), "Capture directory is absent or a symlink")
    result: dict[str, bytes] = {}
    for root, dirs, files in os.walk(directory, followlinks=False):
        for name in dirs + files:
            require(not (Path(root) / name).is_symlink(), "Symlink in retained provider data")
        for name in files:
            path = Path(root) / name
            rel = FEED + path.relative_to(directory).as_posix()
            require(allowed(rel) and path.is_file(), f"Unexpected provider output: {rel}")
            require(path.stat().st_size <= MAX_FILE, "Oversize provider data file")
            result[rel] = path.read_bytes()
    require(sum(map(len, result.values())) <= MAX_TOTAL, "Oversize provider capture")
    return result


def materialize(files: dict[str, bytes], directory: Path) -> None:
    require(not directory.exists(), f"Refusing to overwrite retained bundle: {directory}")
    directory.mkdir(parents=True)
    for path, data in files.items():
        require(allowed(path), "Unexpected materialized path")
        dest = directory / path[len(FEED):]
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)


def validate_snapshot(files: dict[str, bytes]) -> dict[str, Any]:
    require(all(allowed(p) for p in files), "Unexpected path in provider snapshot")
    require(FEED + "state.json" in files and FEED + "index.json" in files, "State/index pair is missing")
    state = json.loads(files[FEED + "state.json"])
    pw.validate_state(state)
    index = json.loads(files[FEED + "index.json"])
    require(isinstance(index, dict) and isinstance(index.get("targets"), list), "Invalid provider index")
    targets = []
    for row in index["targets"]:
        require(isinstance(row, dict) and type(row.get("in_target_list")) is bool, "Invalid index target")
        if row["in_target_list"]:
            require(all(isinstance(row.get(k), str) and row[k] for k in ("id", "provider", "surface", "url")), "Incomplete index target")
            targets.append({k: row[k] for k in ("id", "provider", "surface", "url", "provider_name") if k in row})
    require(len({t["id"] for t in targets}) == len(targets), "Duplicate index target")
    require(index == pw.build_index(state, targets), "Index is not the declared state's derived index")
    for path, data in files.items():
        if "/leaves/" not in path:
            continue
        leaf = json.loads(data)
        require(isinstance(leaf, dict) and pw.check_leaf(leaf) is None, f"Invalid provider leaf: {path}")
        require(leaf.get("surface") == pw.SURFACE and leaf.get("sig_ed25519") is None, "Only unsigned provider leaves are accepted")
        require(leaf.get("payload", {}).get("kind") in (pw.LEAF_KIND, pw.DAILY_KIND), "Unexpected provider leaf kind")
        require(leaf.get("sha256") == digest(pw.canonical_bytes(leaf["payload"])), "Provider leaf digest mismatch")
    for run in state["runs"]:
        for name in run["leaves"]:
            require(isinstance(name, str) and FEED + "leaves/" + name in files, "Run references an absent leaf")
    for target in state["targets"].values():
        for event in target["history"]:
            if event.get("leaf"):
                require(FEED + "leaves/" + event["leaf"] in files, "History references an absent leaf")
    return state


def assert_extends(before: dict[str, bytes], after: dict[str, bytes]) -> None:
    old, new = validate_snapshot(before), validate_snapshot(after)
    require(old["created_at"] == new["created_at"], "Provider history origin changed")
    require(new["updated_at"] >= old["updated_at"], "Provider capture moved backwards")
    require(new["runs"][:len(old["runs"])] == old["runs"], "Published/pending runs were rewritten or omitted")
    for tid, previous in old["targets"].items():
        current = new["targets"].get(tid)
        require(isinstance(current, dict), f"Historical target omitted: {tid}")
        require(current["history"][:len(previous["history"])] == previous["history"], f"History changed: {tid}")
        require(current["n_runs"] >= previous["n_runs"] and current.get("n_changed", 0) >= previous.get("n_changed", 0), f"Counters regressed: {tid}")
        if current["n_runs"] == previous["n_runs"]:
            require(current == previous, f"Target changed without a capture: {tid}")
        for key in ("latest", "last_ok"):
            prev = previous.get(key)
            curr = current.get(key)
            if prev:
                require(isinstance(curr, dict) and curr["fetched_at"] >= prev["fetched_at"], f"Capture baseline regressed: {tid}/{key}")
                if curr["fetched_at"] == prev["fetched_at"]:
                    require(curr == prev, f"Existing capture rewritten: {tid}/{key}")
    for path, data in before.items():
        if "/leaves/" in path:
            require(after.get(path) == data, f"Immutable provider leaf changed or disappeared: {path}")


class Repository:
    def __init__(self, root: Path, name: str):
        require(bool(re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", name)), "Invalid repository")
        self.root, self.name = root.resolve(), name

    def command(self, args: list[str], data: bytes | None = None, env: dict[str, str] | None = None) -> bytes:
        p = subprocess.run(args, cwd=self.root, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                           env={**os.environ, **(env or {})}, check=False)
        if p.returncode:
            raise RuntimeError(f"{args[0]} command failed ({p.returncode}): {p.stderr.decode(errors='replace')[-600:]}")
        return p.stdout

    def git(self, *args: str, data: bytes | None = None, env: dict[str, str] | None = None) -> bytes:
        return self.command(["git", *args], data, env)

    def api(self, endpoint: str) -> list[dict[str, Any]]:
        pages = json.loads(self.command(["gh", "api", "--paginate", "--slurp", "repos/" + self.name + "/" + endpoint]))
        require(isinstance(pages, list) and all(isinstance(p, list) for p in pages), "Unexpected GitHub listing")
        rows = [r for page in pages for r in page]
        require(len(rows) <= 2000, "Provider promotion listing exceeds its bounded review")
        return rows

    def check_origin(self) -> None:
        url = self.git("remote", "get-url", "origin").decode().strip()
        require(url in (f"https://github.com/{self.name}.git", f"https://github.com/{self.name}", f"git@github.com:{self.name}.git"), "Origin is not the declared GitHub repository")

    def heads(self) -> dict[str, str]:
        lines = self.git("ls-remote", "--heads", "origin", "refs/heads/automation/provider-watch-*").decode().splitlines()
        require(len(lines) <= 512, "Too many provider branches to qualify")
        return {ref.removeprefix("refs/heads/"): sha for sha, ref in (line.split() for line in lines)}

    def fetch(self, branch: str, expected: str) -> None:
        require(bool(BRANCH.fullmatch(branch)), "Unexpected provider branch")
        self.git("fetch", "--no-tags", "origin", "refs/heads/" + branch)
        require(self.git("rev-parse", "FETCH_HEAD").decode().strip() == expected, "Provider head moved during preparation")

    def snapshot(self, sha: str) -> dict[str, bytes]:
        require(bool(re.fullmatch(r"[0-9a-f]{40}", sha)), "Invalid pinned commit")
        result = {}
        for item in self.git("ls-tree", "-rz", sha, "--", FEED).split(b"\0"):
            if not item:
                continue
            fields, name = item.split(b"\t", 1)
            mode, kind, blob = fields.decode().split()
            path = name.decode()
            require(mode == "100644" and kind == "blob" and allowed(path), f"Unexpected path or mode: {path}")
            require(int(self.git("cat-file", "-s", blob)) <= MAX_FILE, "Oversize provider blob")
            result[path] = self.git("cat-file", "blob", blob)
        require(sum(map(len, result.values())) <= MAX_TOTAL, "Oversize provider tree")
        validate_snapshot(result)
        return result

    def data_only(self, master: str, head: str) -> None:
        base = self.git("merge-base", master, head).decode().strip()
        for item in self.git("diff", "--raw", "--no-renames", "-z", base, head).split(b"\0")[::2]:
            if item:
                fields = item.decode().split()
                require(fields[-1] in ("A", "M") and fields[1] == "100644", "Branch has a deletion or unexpected file mode")
        paths = self.git("diff", "--name-only", "--no-renames", "-z", base, head).decode().split("\0")
        require(all(allowed(p) for p in paths if p), "Pending branch changes executable/unexpected paths")

    def pulls(self, branch: str | None = None) -> list[dict[str, Any]]:
        if branch is None:
            return self.api("pulls?state=open&base=master&per_page=100")
        require(bool(BRANCH.fullmatch(branch)), "Unexpected PR head")
        return self.api(f"pulls?state=all&base=master&head={self.name.split('/')[0]}:{branch}&per_page=100")

    def commit(self, parent: str, files: dict[str, bytes], bundle: Path,
               receipt: dict[str, Any]) -> str:
        # Retained identity/time inputs recreate the exact commit after download.
        run_id, commit_at = receipt.get("run_id"), receipt.get("commit_at")
        require(isinstance(run_id, str) and bool(re.fullmatch(r"\d+", run_id)), "Missing retained run id")
        require(isinstance(commit_at, str) and bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", commit_at)), "Missing retained commit time")
        require(receipt.get("capture_exit") in (0, 2), "Missing retained capture result")
        index = bundle / "git-index"
        index.unlink(missing_ok=True)
        env = {
            "GIT_INDEX_FILE": str(index.resolve()),
            "GIT_AUTHOR_NAME": "csoai-provider-watch",
            "GIT_AUTHOR_EMAIL": "nicholas@csoai.org",
            "GIT_COMMITTER_NAME": "csoai-provider-watch",
            "GIT_COMMITTER_EMAIL": "nicholas@csoai.org",
            "GIT_AUTHOR_DATE": commit_at,
            "GIT_COMMITTER_DATE": commit_at,
        }
        self.git("read-tree", parent, env=env)
        for path, content in sorted(files.items()):
            blob = self.git("hash-object", "-w", "--stdin", data=content).decode().strip()
            self.git("update-index", "--add", "--cacheinfo", f"100644,{blob},{path}", env=env)
        tree = self.git("write-tree", env=env).decode().strip()
        message = (
            "provider-watch: retain successive captures for owner review\n\n"
            f"{MARKER}\n"
            f"Provider-Watch-Run: {run_id}\n"
            f"Provider-Watch-Capture-Exit: {receipt['capture_exit']}\n"
        )
        return self.git("commit-tree", tree, "-p", parent,
                        data=message.encode(), env=env).decode().strip()

    def equivalent_commit(self, actual: str, expected: str, parent: str) -> bool:
        parents = self.git("rev-list", "--parents", "-n", "1", actual).decode().split()
        return (
            parents == [actual, parent]
            and self.git("rev-parse", actual + "^{tree}").strip()
            == self.git("rev-parse", expected + "^{tree}").strip()
            and self.git("log", "-1", "--format=%B", actual)
            == self.git("log", "-1", "--format=%B", expected)
        )

    def ensure_pr(self, branch: str, head: str, bundle: Path) -> int:
        rows = self.pulls(branch)
        opened = [r for r in rows if r["state"] == "open"]
        require(len(opened) <= 1, "Multiple review PRs for provider branch")
        if opened:
            require(opened[0]["head"]["sha"] == head, "PR head changed after promotion")
            return opened[0]["number"]
        require(not rows, "Provider branch was closed or merged; retained capture needs fresh review")
        body = bundle / "pr-body.txt"
        body.write_text("Successive hash-only provider captures retained on one review branch. "
                        "The workflow executes master code; this branch supplies validated data only. "
                        "Existing runs, pending confirmations and leaves are retained. Older separate "
                        "PRs are not imported or closed. Signing remains with public-root.yml. "
                        "Only main Claude M4 merges; no automatic merge. Capture bytes were retained "
                        "as a workflow artifact before publication.\n", encoding="utf-8")
        self.command(["gh", "pr", "create", "--repo", self.name, "--base", "master", "--head", branch,
                      "--title", "provider-watch: successive captures pending owner review", "--body-file", str(body)])
        rows = [r for r in self.pulls(branch) if r["state"] == "open"]
        require(len(rows) == 1 and rows[0]["head"]["sha"] == head, "PR creation could not be read back")
        return rows[0]["number"]


def prepare(repo: Repository, bundle: Path, run_id: str, dry_run: bool = False) -> dict[str, Any]:
    require(bool(re.fullmatch(r"\d+", run_id)), "A numeric workflow run id is required")
    repo.check_origin()
    code = repo.git("rev-parse", "HEAD").decode().strip()
    require(not repo.git("status", "--porcelain", "--untracked-files=no").strip(), "Master checkout has tracked changes")
    repo.git("fetch", "--no-tags", "origin", "master")
    master = repo.git("rev-parse", "FETCH_HEAD").decode().strip()
    require(code == master, "Checkout is not current master; restart with master code")
    published = repo.snapshot(master)
    published_state = validate_snapshot(published)
    heads = repo.heads()
    opened = [p for p in repo.pulls() if BRANCH.fullmatch(p.get("head", {}).get("ref", ""))]
    candidates: list[dict[str, Any]] = []
    notes = []
    seen = set()
    for pull in opened:
        branch = pull["head"]["ref"]
        head_repo = pull["head"].get("repo") or {}
        if head_repo.get("full_name") != repo.name or pull["base"]["ref"] != "master":
            notes.append({"branch": branch, "pr": pull["number"], "state": "FOREIGN_OR_OTHER_BASE_NOT_IMPORTED"})
            continue
        require(branch not in seen, "Duplicate provider review branch")
        seen.add(branch)
        require(heads.get(branch) == pull["head"]["sha"], "Open PR and remote head disagree")
        candidates.append({"branch": branch, "head": pull["head"]["sha"], "pr": pull["number"]})
    # Recover a successful push followed by a failed PR create, even on a later run.
    for branch, sha in heads.items():
        if branch in seen or not re.fullmatch(r"automation/provider-watch-run-\d+", branch):
            continue
        if repo.pulls(branch):
            continue  # never reopen closed or merged work
        repo.fetch(branch, sha)
        message = repo.git("log", "-1", "--format=%B", sha).decode()
        require(MARKER in message.splitlines(), "Unrecognised orphan provider branch")
        exits = re.findall(r"^Provider-Watch-Capture-Exit: ([02])$", message, re.MULTILINE)
        require(len(exits) == 1, "Orphan capture result is not recoverable")
        candidates.append({"branch": branch, "head": sha, "pr": None, "capture_exit": int(exits[0])})
    qualified = []
    for candidate in candidates:
        repo.fetch(candidate["branch"], candidate["head"])
        repo.data_only(master, candidate["head"])
        files = repo.snapshot(candidate["head"])
        state = validate_snapshot(files)
        if state["updated_at"] < published_state["updated_at"]:
            notes.append({**candidate, "state": "OLDER_THAN_PUBLISHED_NOT_IMPORTED"})
            continue
        assert_extends(published, files)
        if files == published:
            notes.append({**candidate, "state": "ALREADY_PUBLISHED"})
            continue
        qualified.append((state["updated_at"], candidate, files))
    qualified.sort(key=lambda row: row[0], reverse=True)
    if len(qualified) > 1 and qualified[0][0] == qualified[1][0]:
        raise ValueError("Ambiguous latest provider capture; no branch selected")
    if qualified:
        _, selected, baseline = qualified[0]
        notes += [{**c, "state": "OLDER_PENDING_NOT_IMPORTED"} for _, c, _ in qualified[1:]]
    else:
        selected = {"branch": f"automation/provider-watch-run-{run_id}", "head": master, "pr": None}
        require(selected["branch"] not in heads, "New provider branch already exists and is not eligible")
        baseline = published
    receipt = {"schema": SCHEMA, "repository": repo.name, "run_id": run_id,
               "code_sha": code, "published_sha": master,
               "baseline_sha": selected["head"], "branch": selected["branch"], "pr_number": selected["pr"],
               "expected_remote_head": heads.get(selected["branch"]), "dry_run": dry_run,
               "not_imported": notes, "state": "PREPARED"}
    if not dry_run and selected["pr"] is None and selected["head"] != master:
        # Recover the existing observation without making or pushing another one.
        receipt.update(
            state="RESUME_PUBLICATION", resume_only=True, commit_sha=selected["head"],
            capture_exit=selected["capture_exit"],
            capture_files={p: {"sha256": digest(b), "bytes": len(b)} for p, b in sorted(baseline.items())},
        )
    materialize(baseline, bundle / "baseline")
    materialize(baseline, bundle / "capture")
    write_json(bundle / "promotion.json", receipt)
    return receipt


def finalize(bundle: Path, capture_exit: int) -> dict[str, Any]:
    receipt = json.loads((bundle / "promotion.json").read_text())
    require(receipt.get("state") == "PREPARED" and not receipt.get("dry_run"),
            "Only a new, non-dry capture can be finalized")
    baseline, captured = read_directory(bundle / "baseline"), read_directory(bundle / "capture")
    # Retention evidence is not permission to publish an incomplete snapshot.
    receipt["capture_exit"] = capture_exit
    receipt["capture_files"] = {p: {"sha256": digest(b), "bytes": len(b)} for p, b in sorted(captured.items())}
    receipt["state"] = "RETAINED_NOT_QUALIFIED"
    write_json(bundle / "promotion.json", receipt)
    require(capture_exit in (0, 2), "Collector did not finish; bytes retained without promotion")
    assert_extends(baseline, captured)
    old, new = validate_snapshot(baseline), validate_snapshot(captured)
    require(len(new["runs"]) == len(old["runs"]) + 1, "Capture did not append exactly one completed run")
    receipt["commit_at"] = new["runs"][-1]["run_at"]
    receipt["state"] = "CAPTURE_QUALIFIED"
    write_json(bundle / "promotion.json", receipt)
    return receipt


def promote(repo: Repository, bundle: Path, artifact_id: str) -> dict[str, Any]:
    receipt = json.loads((bundle / "promotion.json").read_text())
    require(receipt.get("schema") == SCHEMA and receipt.get("repository") == repo.name, "Unknown promotion receipt")
    require(not receipt.get("dry_run") and receipt.get("state") in (
        "CAPTURE_QUALIFIED", "COMMIT_PREPARED", "PUSHED", "REVIEW_PENDING", "RESUME_PUBLICATION",
    ), "Capture is not eligible for promotion")
    require(bool(re.fullmatch(r"\d+", artifact_id)), "Retained workflow artifact id is required before promotion")
    repo.check_origin()
    require(repo.git("rev-parse", "HEAD").decode().strip() == receipt["code_sha"], "Executable checkout changed")
    captured = read_directory(bundle / "capture")
    require({p: {"sha256": digest(b), "bytes": len(b)} for p, b in sorted(captured.items())} == receipt["capture_files"], "Retained capture bytes changed after qualification")
    if receipt.get("resume_only"):
        branch, commit = receipt["branch"], receipt["commit_sha"]
        require(bool(BRANCH.fullmatch(branch)), "Unexpected recovery branch")
        require(repo.snapshot(commit) == captured, "Orphan bytes differ from the retained capture")
        require(repo.heads().get(branch) == commit, "Orphan head moved; recovery refused")
        # No provider request, git fetch, commit, or push on this path.
        receipt["pr_number"] = repo.ensure_pr(branch, commit, bundle)
        receipt.update(state="REVIEW_PENDING", artifact_id=artifact_id)
        write_json(bundle / "promotion.json", receipt)
        return receipt
    repo.git("fetch", "--no-tags", "origin", "master")
    current_master = repo.git("rev-parse", "FETCH_HEAD").decode().strip()
    assert_extends(repo.snapshot(current_master), captured)
    branch = receipt["branch"]
    require(bool(BRANCH.fullmatch(branch)), "Unexpected promotion branch")
    rows = repo.pulls(branch)
    require(not rows or (len(rows) == 1 and rows[0]["state"] == "open"), "Review branch closed or merged during capture; bundle retained")
    commit = receipt.get("commit_sha")
    if commit:
        parents = repo.git("rev-list", "--parents", "-n", "1", commit).decode().split()
        require(parents == [commit, receipt["baseline_sha"]], "Retried commit has the wrong parent")
        require(repo.snapshot(commit) == captured, "Retried commit does not contain retained bytes")
    else:
        commit = repo.commit(receipt["baseline_sha"], captured, bundle, receipt)
        receipt.update(commit_sha=commit, artifact_id=artifact_id, state="COMMIT_PREPARED")
        write_json(bundle / "promotion.json", receipt)
    remote = repo.heads().get(branch)
    if remote not in (commit, receipt["expected_remote_head"]):
        require(remote is not None, "Pending branch disappeared")
        repo.fetch(branch, remote)
        require(repo.equivalent_commit(remote, commit, receipt["baseline_sha"]),
                "Pending head moved; refusing to overwrite it")
        require(repo.snapshot(remote) == captured, "Remote retry bytes differ")
        commit = remote
        receipt.update(commit_sha=commit, state="COMMIT_PREPARED")
        write_json(bundle / "promotion.json", receipt)
    elif remote != commit:
        repo.git("push", "origin", f"{commit}:refs/heads/{branch}")  # ordinary fast-forward only
    require(repo.heads().get(branch) == commit, "Pushed provider commit could not be read back")
    receipt["state"] = "PUSHED"
    write_json(bundle / "promotion.json", receipt)
    receipt["pr_number"] = repo.ensure_pr(branch, commit, bundle)
    receipt["state"] = "REVIEW_PENDING"
    write_json(bundle / "promotion.json", receipt)
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("prepare", "finalize", "promote"))
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--repository", default=os.environ.get("GITHUB_REPOSITORY", "CSOAI-ORG/councilof-ai"))
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID", ""))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--capture-exit", type=int, default=-1)
    parser.add_argument("--artifact-id", default="")
    args = parser.parse_args()
    bundle = args.bundle.resolve()
    bundle.mkdir(parents=True, exist_ok=True)
    try:
        repo = Repository(args.repo, args.repository)
        if args.command == "prepare":
            result = prepare(repo, bundle, args.run_id, args.dry_run)
        elif args.command == "finalize":
            result = finalize(bundle, args.capture_exit)
        else:
            result = promote(repo, bundle, args.artifact_id)
        print(json.dumps({k: result.get(k) for k in ("state", "branch", "baseline_sha", "commit_sha", "pr_number")}, sort_keys=True))
        return 0
    except Exception as exc:
        write_json(bundle / (args.command + "-error.json"), {"schema": SCHEMA, "step": args.command, "error": str(exc)})
        print(f"provider promotion refused: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
