#!/usr/bin/env python3
"""Bind isolated RunPod signing inputs to verified receipts and a trusted Actions run.

Artifacts contain compact card bodies and verification receipts only. Raw model
outputs remain in private intake. This helper neither signs nor publishes cards.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

from runpod_gspc_bridge_to_mill import canonical, collect

REPOSITORY = "CSOAI-ORG/councilof-ai"
WORKFLOW = ".github/workflows/runpod-intake.yml"
SCHEMA = "csoai.runpod-signing-artifact/0.1"
MAX_ARCHIVE_BYTES = 64 * 1024 * 1024
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


class ArtifactError(Exception):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ArtifactError(message)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def receipt_bytes(receipt: dict) -> bytes:
    return json.dumps(receipt, indent=2, sort_keys=True).encode("utf-8") + b"\n"


def artifact_name(run_id: int, attempt: int) -> str:
    return f"runpod-signing-{run_id}-{attempt}"


def validate_run(run: dict, workflow: dict, run_id: int) -> None:
    require(run.get("id") == run_id, "run ID does not match")
    require(run.get("repository", {}).get("full_name") == REPOSITORY, "foreign repository")
    require(run.get("head_repository", {}).get("full_name") == REPOSITORY, "foreign head repository")
    require(run.get("head_branch") == "master", "intake must run on master")
    require(run.get("path") == WORKFLOW and workflow.get("path") == WORKFLOW
            and run.get("workflow_id") == workflow.get("id"), "foreign intake workflow")
    require(run.get("event") in ("schedule", "workflow_dispatch"), "untrusted intake event")
    require(run.get("status") == "completed" and run.get("conclusion") == "success",
            "intake run has not succeeded")
    require(bool(SHA_RE.fullmatch(str(run.get("head_sha", "")))), "invalid intake head SHA")
    require(type(run.get("run_attempt")) is int and run["run_attempt"] > 0, "invalid run attempt")


def select_artifact(listing: dict, run: dict) -> dict:
    artifacts = listing.get("artifacts", [])
    require(listing.get("total_count") == len(artifacts), "artifact listing is incomplete")
    name = artifact_name(run["id"], run["run_attempt"])
    matches = [item for item in artifacts if item.get("name") == name]
    require(len(matches) == 1, "expected exactly one named intake artifact")
    artifact = matches[0]
    provenance = artifact.get("workflow_run", {})
    require(provenance.get("id") == run["id"]
            and provenance.get("head_sha") == run["head_sha"]
            and provenance.get("head_branch") == "master", "artifact belongs to a different run")
    require(artifact.get("expired") is False, "artifact expired")
    require(type(artifact.get("id")) is int and artifact["id"] > 0, "invalid artifact ID")
    require(type(artifact.get("size_in_bytes")) is int
            and 0 < artifact["size_in_bytes"] <= MAX_ARCHIVE_BYTES, "artifact size is unsafe")
    require(bool(re.fullmatch(r"sha256:[0-9a-f]{64}", str(artifact.get("digest", "")))),
            "artifact lacks a SHA-256 binding")
    return artifact


def validate_directory(directory: Path, run: dict, allowlist: Path) -> dict:
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    require(manifest.get("schema") == SCHEMA, "unknown signing manifest")
    require(manifest.get("repository") == REPOSITORY
            and manifest.get("workflow_path") == WORKFLOW, "foreign manifest producer")
    require(manifest.get("run_id") == run["id"]
            and manifest.get("run_attempt") == run["run_attempt"]
            and manifest.get("head_sha") == run["head_sha"], "manifest run binding does not match")
    require(bool(SHA_RE.fullmatch(str(manifest.get("intake_revision", "")))), "intake revision is not pinned")
    allowlist_hash = digest(allowlist.read_bytes())
    require(manifest.get("bank_allowlist_sha256") == allowlist_hash, "bank allowlist changed since intake")
    entries = manifest.get("files")
    require(isinstance(entries, list) and bool(entries), "manifest has no signing inputs")
    expected = {"manifest.json"}
    for entry in entries:
        name = entry.get("path", "")
        require(bool(re.fullmatch(r"cards/unsigned-[A-Za-z0-9_.-]+\.json", name)), "unsafe card path")
        require(name not in expected, "duplicate card path")
        expected.add(name)
        path = directory / name
        require(not path.is_symlink() and path.is_file(), "card must be a regular file")
        raw = path.read_bytes()
        require(len(raw) <= 16384 and digest(raw) == entry.get("sha256"), "card bytes changed")
        card = json.loads(raw)
        body, source = card.get("body"), card.get("source")
        require(isinstance(body, dict) and isinstance(source, dict), "invalid staged card")
        receipt = entry.get("verification")
        require(isinstance(receipt, dict), "verification receipt missing")
        require(digest(receipt_bytes(receipt)) == entry.get("verification_sha256"), "receipt bytes changed")
        hashes = receipt.get("source_hashes", {})
        run_id = entry.get("source_run_id")
        require(receipt.get("schema") == "csoai.runpod-gspc-intake-verification/0.1"
                and receipt.get("state") == "VERIFIED_QUARANTINE", "run did not pass intake")
        require(run_id == receipt.get("run_id") == body.get("compute_evidence", {}).get("run_id")
                and source == {"run_id": run_id, "origin": "runpod-gspc-24x7"}, "source run binding differs")
        require(hashes.get("card_id") == digest(canonical(body)), "receipt does not bind the body")
        require(hashes.get("bank_allowlist_sha256") == allowlist_hash, "receipt uses another allowlist")
        require(receipt.get("axis") == body.get("axis") and receipt.get("subject") == body.get("model")
                and receipt.get("counts", {}).get("graded_n") == body.get("n")
                and receipt.get("accuracy") == body.get("accuracy"), "receipt measurement differs")
    actual = set()
    for path in directory.rglob("*"):
        require(not path.is_symlink(), "artifact contains a symlink")
        if path.is_file():
            actual.add(path.relative_to(directory).as_posix())
    require(actual == expected, "artifact contains missing or extra files")
    return manifest


def build_manifest(args: argparse.Namespace) -> None:
    cards = args.artifact_dir / "cards"
    require(args.repository == REPOSITORY, "foreign manifest repository")
    require(args.workflow_ref == f"{REPOSITORY}/{WORKFLOW}@refs/heads/master", "intake is not trusted master workflow")
    require(bool(SHA_RE.fullmatch(args.head_sha)), "invalid source SHA")
    require(args.run_id > 0 and args.run_attempt > 0, "invalid intake run identity")
    staged, _, problems = collect(args.quarantine)
    require(not problems and bool(staged), "quarantine has no clean verified set")
    entries = []
    for item in staged:
        path = cards / f"unsigned-{item['cell']}.json"
        raw = path.read_bytes()
        require(json.loads(raw) == {"body": item["body"], "source": {
            "run_id": item["run_id"], "origin": "runpod-gspc-24x7",
        }}, "staged body differs from verified candidate")
        receipt_raw = (Path(item["src"]).parent / "verification.json").read_bytes()
        entries.append({"path": path.relative_to(args.artifact_dir).as_posix(),
                        "sha256": digest(raw), "source_run_id": item["run_id"],
                        "verification_sha256": digest(receipt_raw),
                        "verification": json.loads(receipt_raw)})
    manifest = {"schema": SCHEMA, "repository": REPOSITORY, "workflow_path": WORKFLOW,
                "run_id": args.run_id, "run_attempt": args.run_attempt, "head_sha": args.head_sha,
                "intake_revision": args.intake_revision,
                "bank_allowlist_sha256": digest(args.allowlist.read_bytes()), "files": entries}
    (args.artifact_dir / "manifest.json").write_bytes(receipt_bytes(manifest))
    validate_directory(args.artifact_dir, {"id": args.run_id, "run_attempt": args.run_attempt,
                       "head_sha": args.head_sha}, args.allowlist)
    print(f"BOUND {len(entries)} isolated cards to their verified intake receipts")


def gh_json(path: str) -> dict:
    result = subprocess.run(["gh", "api", path], capture_output=True, check=True)
    return json.loads(result.stdout)


def extract_checked(archive: Path, destination: Path, archive_digest: str) -> None:
    require(digest(archive.read_bytes()) == archive_digest.removeprefix("sha256:"), "artifact archive digest mismatch")
    with zipfile.ZipFile(archive) as zipped:
        entries = zipped.infolist()
        require(sum(item.file_size for item in entries) <= MAX_ARCHIVE_BYTES, "expanded artifact is too large")
        names = set()
        for item in entries:
            name = PurePosixPath(item.filename)
            require(not name.is_absolute() and ".." not in name.parts and "\\" not in item.filename,
                    "unsafe archive member path")
            require(item.filename not in names, "duplicate archive member")
            names.add(item.filename)
            require(not stat.S_ISLNK(item.external_attr >> 16), "archive contains a symlink")
            if item.is_dir():
                require(name.as_posix() == "cards", "unexpected archive directory")
                continue
            require(item.filename == "manifest.json" or bool(re.fullmatch(
                r"cards/unsigned-[A-Za-z0-9_.-]+\.json", item.filename)), "unexpected archive file")
            target = destination / item.filename
            target.parent.mkdir(parents=True, exist_ok=True)
            with zipped.open(item) as source, target.open("xb") as sink:
                shutil.copyfileobj(source, sink)


def prepare(args: argparse.Namespace) -> None:
    require(args.run_id > 0, "invalid run ID")
    run = gh_json(f"repos/{REPOSITORY}/actions/runs/{args.run_id}")
    workflow = gh_json(f"repos/{REPOSITORY}/actions/workflows/runpod-intake.yml")
    validate_run(run, workflow, args.run_id)
    ancestry = subprocess.run(["git", "merge-base", "--is-ancestor", run["head_sha"], "origin/master"],
                              capture_output=True)
    require(ancestry.returncode == 0, "intake head is not in trusted master history")
    listing = gh_json(f"repos/{REPOSITORY}/actions/runs/{args.run_id}/artifacts?per_page=100")
    artifact = select_artifact(listing, run)
    require(not args.out.exists(), "signing output directory must be fresh")
    with tempfile.TemporaryDirectory(prefix="runpod-signing-") as temporary:
        temporary_path = Path(temporary)
        archive = temporary_path / "artifact.zip"
        with archive.open("wb") as sink:
            subprocess.run(["gh", "api", f"repos/{REPOSITORY}/actions/artifacts/{artifact['id']}/zip"],
                           stdout=sink, stderr=subprocess.PIPE, check=True)
        require(archive.stat().st_size <= MAX_ARCHIVE_BYTES, "downloaded archive is too large")
        unpacked = temporary_path / "unpacked"
        unpacked.mkdir()
        extract_checked(archive, unpacked, artifact["digest"])
        manifest = validate_directory(unpacked, run, args.allowlist)
        shutil.copytree(unpacked, args.out)
    print(f"PREPARED {len(manifest['files'])} verified cards from the successful master intake")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    build = commands.add_parser("manifest")
    build.add_argument("--artifact-dir", type=Path, required=True)
    build.add_argument("--quarantine", type=Path, required=True)
    build.add_argument("--intake-revision", required=True)
    build.add_argument("--repository", default=os.environ.get("GITHUB_REPOSITORY", ""))
    build.add_argument("--workflow-ref", default=os.environ.get("GITHUB_WORKFLOW_REF", ""))
    build.add_argument("--head-sha", default=os.environ.get("GITHUB_SHA", ""))
    build.add_argument("--run-id", type=int, default=int(os.environ.get("GITHUB_RUN_ID", "0")))
    build.add_argument("--run-attempt", type=int, default=int(os.environ.get("GITHUB_RUN_ATTEMPT", "0")))
    fetch = commands.add_parser("prepare")
    fetch.add_argument("--run-id", type=int, required=True)
    fetch.add_argument("--out", type=Path, required=True)
    for command in (build, fetch):
        command.add_argument("--allowlist", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        if args.command == "manifest":
            build_manifest(args)
        else:
            prepare(args)
        return 0
    except ArtifactError as error:
        print(f"REFUSED: {error}", file=sys.stderr)
    except Exception:
        print("REFUSED: intake artifact could not be checked; no signing input prepared", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
