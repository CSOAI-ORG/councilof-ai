#!/usr/bin/env python3
"""Build and verify a minimal recovery bundle for the admitted public root.

Generation is deliberately fail closed: the existing live root/witness release gate
must pass before any bundle is emitted.  The bundle contains public verification
material only.  It never copies credentials, signing keys, environment files, or
the repository itself.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Callable

SCHEMA = "csoai.public-recovery-manifest/v1"
MANIFEST_NAME = "recovery-manifest.json"
HEX64 = re.compile(r"^[0-9a-f]{64}$")
COMMIT = re.compile(r"^[0-9a-f]{40}$")

CONFIG_PATHS = (
    ".github/workflows/deploy.yml",
    "DEPLOY-LOCK.md",
    "ci/hf-jobs/deploy.sh",
    "package-lock.json",
    "package.json",
    "public/_headers",
    "public/_redirects",
    "scripts/root-witness-release-gate.py",
    "wrangler.jsonc",
)

BASE_PUBLIC_ARTIFACTS = {
    "public/root.json": "signed public root",
    "public/.well-known/did.json": "pinned public verification key",
    "public/interop/root-witness-latest.json": "current root witness sidecar",
    "public/interop/root-witness-pointer.json": "admitted production pointer",
    "public/signed/card_index.json": "separate signed-card corpus boundary",
    "public/signed/HOW-TO-VERIFY.md": "public verification guide",
    "public/signed/HOW-TO-VERIFY-ROOT.md": "public root verification guide",
}


class RecoveryError(RuntimeError):
    pass


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_object(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise RecoveryError(f"cannot read JSON {path}: {type(exc).__name__}: {exc}") from exc
    if not isinstance(value, dict):
        raise RecoveryError(f"JSON object required: {path}")
    return value


def safe_repo_path(value: str) -> str:
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or not value.startswith("public/"):
        raise RecoveryError(f"unsafe or non-public artifact path: {value!r}")
    return path.as_posix()


def public_reference(value: Any) -> str:
    if not isinstance(value, str) or not value:
        raise RecoveryError("missing public artifact reference")
    normalized = value.removeprefix("https://councilof.ai/")
    if not normalized.startswith("public/"):
        normalized = "public/" + normalized
    return safe_repo_path(normalized)


def collect_artifacts(repo: Path) -> dict[str, set[str]]:
    root = load_object(repo / "public/root.json")
    sidecar = load_object(repo / "public/interop/root-witness-latest.json")
    pointer = load_object(repo / "public/interop/root-witness-pointer.json")
    paths: dict[str, set[str]] = {path: {role} for path, role in BASE_PUBLIC_ARTIFACTS.items()}

    schema = root.get("schema")
    if not isinstance(schema, str) or not re.fullmatch(r"public-root-v\d+\.json", schema.rsplit("/", 1)[-1]):
        raise RecoveryError("root schema does not name a supported public-root schema")
    paths[f"public/schema/{schema.rsplit('/', 1)[-1]}"] = {"signed public root schema"}

    leaves = root.get("card_sha256")
    if not isinstance(leaves, list) or not leaves or not all(isinstance(v, str) and HEX64.fullmatch(v) for v in leaves):
        raise RecoveryError("root card_sha256 must be a non-empty list of lowercase SHA-256 values")
    if root.get("card_count") != len(leaves) or len(set(leaves)) != len(leaves):
        raise RecoveryError("root card count or uniqueness check failed")
    for leaf in leaves:
        paths[f"public/cards/{leaf[:16]}.json"] = {"root leaf wrapper"}
        paths[f"public/proofs/{leaf[:16]}.json"] = {"root inclusion proof"}

    witness_pointer = pointer.get("witness_sidecar")
    if not isinstance(witness_pointer, dict):
        raise RecoveryError("witness pointer has no witness_sidecar object")
    dated = public_reference(witness_pointer.get("dated_copy"))
    paths.setdefault(dated, set()).add("immutable current witness sidecar")

    witnesses = sidecar.get("witnesses")
    if not isinstance(witnesses, dict):
        raise RecoveryError("current witness sidecar has no witnesses object")
    rekor = witnesses.get("rekor")
    ots = witnesses.get("ots", witnesses.get("opentimestamps"))
    if not isinstance(rekor, dict) or not isinstance(ots, dict):
        raise RecoveryError("current witness sidecar lacks Rekor or OTS metadata")
    rekor_path = public_reference(rekor.get("entry_file"))
    ots_path = public_reference(ots.get("path") or ots.get("proof_path"))
    if not ots_path.endswith(".ots"):
        raise RecoveryError("current OTS reference is not an .ots file")
    paths.setdefault(rekor_path, set()).add("current Rekor entry snapshot")
    paths.setdefault(ots_path, set()).add("current exact-root OpenTimestamps proof")

    eas_log = repo / "public/interop/eas-root-attestations.json"
    if eas_log.is_file():
        paths.setdefault("public/interop/eas-root-attestations.json", set()).add("current optional EAS status log")

    for relative in paths:
        path = repo / relative
        if not path.is_file() or path.is_symlink():
            raise RecoveryError(f"required regular public artifact is missing: {relative}")
    return paths


def git(repo: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(repo), *args], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    if result.returncode:
        raise RecoveryError(f"git {' '.join(args)} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def require_commit_bound_tree(repo: Path, paths: list[str]) -> tuple[str, str]:
    commit = git(repo, "rev-parse", "HEAD")
    tree = git(repo, "rev-parse", "HEAD^{tree}")
    if not COMMIT.fullmatch(commit) or not COMMIT.fullmatch(tree):
        raise RecoveryError("HEAD did not resolve to full commit and tree object IDs")
    tracked = set(git(repo, "ls-files", "--", *paths).splitlines())
    missing = sorted(set(paths) - tracked)
    if missing:
        raise RecoveryError(f"recovery inputs are not tracked by Git: {', '.join(missing)}")
    status = subprocess.run(
        ["git", "-C", str(repo), "status", "--porcelain=v1", "-z", "--untracked-files=all", "--", *paths],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if status.returncode:
        raise RecoveryError(f"git status failed: {status.stderr.decode(errors='replace').strip()}")
    if status.stdout:
        changed = status.stdout.decode(errors="replace").replace("\0", ", ").strip(", ")
        raise RecoveryError(f"recovery inputs differ from commit {commit}: {changed}")
    return commit, tree


def run_live_admission_gate(repo: Path, runner: Callable[..., subprocess.CompletedProcess[str]] = subprocess.run) -> None:
    command = [sys.executable, str(repo / "scripts/root-witness-release-gate.py"), "--phase", "live"]
    result = runner(command, cwd=repo, text=True)
    if result.returncode:
        raise RecoveryError(f"live admission gate failed with exit {result.returncode}; no recovery bundle emitted")


def artifact_record(repo: Path, relative: str, roles: set[str]) -> dict[str, Any]:
    path = repo / relative
    return {
        "path": relative,
        "roles": sorted(roles),
        "bytes": path.stat().st_size,
        "sha256": sha256_path(path),
    }


def create_bundle(repo: Path, output: Path) -> Path:
    repo = repo.resolve()
    output = output.resolve()
    if output.exists() and any(output.iterdir()):
        raise RecoveryError(f"output directory is not empty: {output}")
    output.mkdir(parents=True, exist_ok=True)

    artifact_roles = collect_artifacts(repo)
    all_bound_paths = sorted(set(artifact_roles) | set(CONFIG_PATHS))
    commit, tree = require_commit_bound_tree(repo, all_bound_paths)
    run_live_admission_gate(repo)

    # Re-read and re-check after the networked gate so the admitted bytes and copied bytes
    # cannot silently diverge if a publisher runs concurrently.
    if collect_artifacts(repo) != artifact_roles:
        raise RecoveryError("public recovery artifact set changed during admission verification")
    after_commit, after_tree = require_commit_bound_tree(repo, all_bound_paths)
    if (after_commit, after_tree) != (commit, tree):
        raise RecoveryError("Git HEAD changed during admission verification")

    records = [artifact_record(repo, path, artifact_roles[path]) for path in sorted(artifact_roles)]
    configs = [artifact_record(repo, path, {"restore configuration checksum"}) for path in CONFIG_PATHS]
    root_record = next(record for record in records if record["path"] == "public/root.json")
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    manifest = {
        "schema": SCHEMA,
        "created_at": now,
        "scope": "Canonical admitted public root and the public files required to verify and restore that root.",
        "git": {"commit": commit, "tree": tree},
        "admission": {
            "result": "PASS",
            "verified_at": now,
            "command": "python3 scripts/root-witness-release-gate.py --phase live",
            "live_root": "https://councilof.ai/root.json",
        },
        "public_root": {"sha256": root_record["sha256"], "bytes": root_record["bytes"]},
        "artifacts": records,
        "configuration_checksums": configs,
        "restore_verification": [
            "Check out git.commit from a trusted Git remote or repository mirror.",
            "Run python3 scripts/public_recovery_manifest.py verify --bundle-dir BUNDLE --repo REPO to bind the bundle and configuration to that commit.",
            "Overlay BUNDLE/public/ onto REPO/public/ without deleting other committed public files.",
            "Run python3 scripts/root-witness-release-gate.py --phase candidate --public-dir public for offline structure and cryptographic checks (confirmed Bitcoin proofs still reauthenticate public headers).",
            "Before serving, run python3 scripts/root-witness-release-gate.py --phase live --public-dir public and require PASS against the production URL.",
        ],
        "limitations": [
            "This is a public evidence recovery subset, not a repository or deployable application backup.",
            "It excludes secrets, private keys, tokens, environment files, databases, and non-root public assets.",
            "PASS records the live gate result only at admission. Restore requires a fresh live gate; this manifest is not a standing production-health claim.",
            "The Oracle copy is unverified until this bundle verifier succeeds on the remote host.",
        ],
    }

    try:
        for record in records:
            source = repo / record["path"]
            destination = output / record["path"]
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination, follow_symlinks=False)
            if sha256_path(destination) != record["sha256"]:
                raise RecoveryError(f"copied artifact hash mismatch: {record['path']}")
        manifest_path = output / MANIFEST_NAME
        manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        verify_bundle(output, repo=repo)
        return manifest_path
    except Exception:
        # Output is caller-owned; erase only files this invocation placed inside it.
        shutil.rmtree(output)
        raise


def validate_record(record: Any, *, public_only: bool) -> tuple[str, int, str]:
    if not isinstance(record, dict):
        raise RecoveryError("manifest file record is not an object")
    path = record.get("path")
    size = record.get("bytes")
    digest = record.get("sha256")
    if not isinstance(path, str):
        raise RecoveryError("manifest file record has no path")
    normalized = safe_repo_path(path) if public_only else PurePosixPath(path).as_posix()
    if normalized != path or PurePosixPath(path).is_absolute() or ".." in PurePosixPath(path).parts:
        raise RecoveryError(f"unsafe manifest path: {path!r}")
    if type(size) is not int or size < 0 or not isinstance(digest, str) or not HEX64.fullmatch(digest):
        raise RecoveryError(f"invalid size or SHA-256 for {path}")
    return path, size, digest


def verify_bundle(bundle: Path, repo: Path | None = None) -> dict[str, Any]:
    bundle = bundle.resolve()
    manifest = load_object(bundle / MANIFEST_NAME)
    if manifest.get("schema") != SCHEMA:
        raise RecoveryError("unsupported recovery manifest schema")
    if manifest.get("admission", {}).get("result") != "PASS":
        raise RecoveryError("manifest does not record a passing live admission gate")
    commit = manifest.get("git", {}).get("commit")
    tree = manifest.get("git", {}).get("tree")
    if not isinstance(commit, str) or not COMMIT.fullmatch(commit) or not isinstance(tree, str) or not COMMIT.fullmatch(tree):
        raise RecoveryError("manifest has invalid Git commit or tree IDs")

    records = manifest.get("artifacts")
    if not isinstance(records, list) or not records:
        raise RecoveryError("manifest has no public artifacts")
    expected = {MANIFEST_NAME}
    seen: set[str] = set()
    for record in records:
        path, size, digest = validate_record(record, public_only=True)
        if path in seen:
            raise RecoveryError(f"duplicate artifact path: {path}")
        seen.add(path)
        expected.add(path)
        candidate = bundle / path
        if not candidate.is_file() or candidate.is_symlink():
            raise RecoveryError(f"bundle artifact missing or not a regular file: {path}")
        if candidate.stat().st_size != size or sha256_path(candidate) != digest:
            raise RecoveryError(f"bundle artifact hash or size mismatch: {path}")

    actual = {
        path.relative_to(bundle).as_posix()
        for path in bundle.rglob("*")
        if path.is_file() or path.is_symlink()
    }
    if actual != expected:
        extra = sorted(actual - expected)
        missing = sorted(expected - actual)
        raise RecoveryError(f"bundle file set mismatch; extra={extra}, missing={missing}")

    root = load_object(bundle / "public/root.json")
    sidecar = load_object(bundle / "public/interop/root-witness-latest.json")
    pointer = load_object(bundle / "public/interop/root-witness-pointer.json")
    root_sha = sha256_path(bundle / "public/root.json")
    if manifest.get("public_root", {}).get("sha256") != root_sha:
        raise RecoveryError("manifest public_root does not bind bundled root bytes")
    if sidecar.get("artifact", {}).get("sha256") != root_sha or pointer.get("live_root", {}).get("sha256") != root_sha:
        raise RecoveryError("witness sidecar or production pointer does not bind bundled root bytes")
    if sidecar.get("artifact", {}).get("merkle_root") != root.get("merkle_root"):
        raise RecoveryError("witness sidecar does not bind bundled Merkle root")
    ots = sidecar.get("witnesses", {}).get("ots", sidecar.get("witnesses", {}).get("opentimestamps", {}))
    ots_path = public_reference(ots.get("path") or ots.get("proof_path"))
    if ots_path not in seen or sha256_path(bundle / ots_path) != ots.get("proof_sha256"):
        raise RecoveryError("current OTS metadata does not bind bundled proof bytes")

    configs = manifest.get("configuration_checksums")
    if not isinstance(configs, list) or {record.get("path") for record in configs if isinstance(record, dict)} != set(CONFIG_PATHS):
        raise RecoveryError("configuration checksum set is incomplete")
    for record in configs:
        path, size, digest = validate_record(record, public_only=False)
        if repo is not None:
            candidate = repo.resolve() / path
            if not candidate.is_file() or candidate.is_symlink():
                raise RecoveryError(f"restore configuration missing: {path}")
            if candidate.stat().st_size != size or sha256_path(candidate) != digest:
                raise RecoveryError(f"restore configuration checksum mismatch: {path}")
    if repo is not None:
        if git(repo.resolve(), "rev-parse", "HEAD") != commit or git(repo.resolve(), "rev-parse", "HEAD^{tree}") != tree:
            raise RecoveryError("restore repository is not at the manifest Git commit and tree")
    return manifest


def run_selftest() -> None:
    with tempfile.TemporaryDirectory(prefix="public-recovery-selftest-") as temporary:
        bundle = Path(temporary) / "bundle"
        for relative, data in {
            "public/root.json": b'{"merkle_root":"m"}\n',
            "public/interop/root-witness-latest.json": b'{"artifact":{"sha256":"ROOT","merkle_root":"m"},"witnesses":{"ots":{"path":"public/interop/root.ots","proof_sha256":"OTS"}}}\n',
            "public/interop/root-witness-pointer.json": b'{"live_root":{"sha256":"ROOT"}}\n',
            "public/interop/root.ots": b"proof",
        }.items():
            path = bundle / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        root_sha = sha256_path(bundle / "public/root.json")
        ots_sha = sha256_path(bundle / "public/interop/root.ots")
        sidecar_path = bundle / "public/interop/root-witness-latest.json"
        sidecar_path.write_text(sidecar_path.read_text().replace("ROOT", root_sha).replace("OTS", ots_sha))
        pointer_path = bundle / "public/interop/root-witness-pointer.json"
        pointer_path.write_text(pointer_path.read_text().replace("ROOT", root_sha))
        artifact_paths = sorted(path.relative_to(bundle).as_posix() for path in bundle.rglob("*") if path.is_file())
        artifacts = [
            {"path": path, "roles": ["fixture"], "bytes": (bundle / path).stat().st_size, "sha256": sha256_path(bundle / path)}
            for path in artifact_paths
        ]
        configs = [{"path": path, "roles": ["fixture"], "bytes": 0, "sha256": "0" * 64} for path in CONFIG_PATHS]
        manifest = {
            "schema": SCHEMA,
            "git": {"commit": "1" * 40, "tree": "2" * 40},
            "admission": {"result": "PASS"},
            "public_root": {"sha256": root_sha},
            "artifacts": artifacts,
            "configuration_checksums": configs,
        }
        (bundle / MANIFEST_NAME).write_text(json.dumps(manifest) + "\n")
        verify_bundle(bundle)
        proof = bundle / "public/interop/root.ots"
        proof.write_bytes(b"tampered")
        try:
            verify_bundle(bundle)
        except RecoveryError as exc:
            assert "hash or size mismatch" in str(exc)
        else:
            raise AssertionError("tampered artifact was accepted")

    failed = subprocess.CompletedProcess([], 9)
    try:
        run_live_admission_gate(Path("."), runner=lambda *args, **kwargs: failed)
    except RecoveryError as exc:
        assert "no recovery bundle emitted" in str(exc)
    else:
        raise AssertionError("failed live gate did not fail closed")
    print("public recovery manifest selftest: PASS")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    create = subparsers.add_parser("create")
    create.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    create.add_argument("--output-dir", type=Path, required=True)
    verify = subparsers.add_parser("verify")
    verify.add_argument("--bundle-dir", type=Path, required=True)
    verify.add_argument("--repo", type=Path)
    subparsers.add_parser("selftest")
    args = parser.parse_args()
    try:
        if args.command == "create":
            path = create_bundle(args.repo, args.output_dir)
            print(f"public recovery bundle: PASS {path}")
        elif args.command == "verify":
            manifest = verify_bundle(args.bundle_dir, repo=args.repo)
            print(f"public recovery bundle verify: PASS commit={manifest['git']['commit']}")
        else:
            run_selftest()
        return 0
    except RecoveryError as exc:
        print(f"public recovery bundle: BLOCKED: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
