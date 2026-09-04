#!/usr/bin/env python3
"""Behavioral regression tests for retired witness and atom-root producers."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from contextlib import contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory


ROOT = Path(__file__).resolve().parents[2]
ATOM_SCRIPT = Path(__file__).with_name("atom-root.py")
WITNESS_SCRIPT = Path(__file__).with_name("harvest-witness-receipts.py")
INCIDENT = ROOT / "evidence" / "incidents" / "2026-09-04-witness-receipt-placeholders"

SPEC = importlib.util.spec_from_file_location("atom_root_fail_closed", ATOM_SCRIPT)
assert SPEC and SPEC.loader
ATOM = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ATOM)


@contextmanager
def isolated_atom_environment():
    original = {
        "REPO": ATOM.REPO,
        "QUEUE": ATOM.QUEUE,
        "OUT": ATOM.OUT,
        "CANDIDATE_DIR": ATOM.CANDIDATE_DIR,
        "SOURCE_POLICY_PATH": ATOM.SOURCE_POLICY_PATH,
    }
    with TemporaryDirectory() as directory:
        repo = Path(directory)
        queue = repo / "queue"
        source = queue / "accepted" / "atoms.jsonl"
        source.parent.mkdir(parents=True)
        policy_path = repo / "policy.json"
        policy_path.write_text(
            json.dumps(
                {
                    "default": "deny",
                    "allowed_sources": ["accepted/atoms.jsonl"],
                    "excluded_prefixes": [],
                    "excluded_globs": [],
                }
            ),
            encoding="utf-8",
        )
        ATOM.REPO = repo
        ATOM.QUEUE = queue
        ATOM.OUT = repo / "public" / "interop"
        ATOM.CANDIDATE_DIR = repo / "evidence" / "candidates" / "atom-roots"
        ATOM.SOURCE_POLICY_PATH = policy_path
        try:
            yield repo, source
        finally:
            for name, value in original.items():
                setattr(ATOM, name, value)


def run_atom_main(*args: str) -> int:
    old_argv = sys.argv
    sys.argv = [str(ATOM_SCRIPT), *args]
    try:
        return ATOM.main()
    finally:
        sys.argv = old_argv


def detached_proof_for(digest: bytes) -> bytes:
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.notary import PendingAttestation
    from opentimestamps.core.serialize import BytesSerializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

    context = BytesSerializationContext()
    timestamp = Timestamp(digest)
    timestamp.attestations.add(PendingAttestation("https://calendar.example.test"))
    DetachedTimestampFile(OpSHA256(), timestamp).serialize(context)
    return context.getbytes()


def test_retired_witness_producer_writes_nothing() -> None:
    with TemporaryDirectory() as directory:
        result = subprocess.run(
            [sys.executable, str(WITNESS_SCRIPT), "--dry-run"],
            cwd=directory,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 78
        assert "UNAVAILABLE_FAIL_CLOSED" in result.stdout
        assert "writes: 0" in result.stdout
        assert list(Path(directory).iterdir()) == []

    for operator in ("csoai-1000x.py", "csoai-improve.py"):
        source = Path(__file__).with_name(operator).read_text(encoding="utf-8")
        assert "harvest-witness-receipts.py" not in source


def test_witness_quarantine_inventory_is_exact() -> None:
    manifest = json.loads((INCIDENT / "manifest.json").read_text(encoding="utf-8"))
    items = []
    for path in sorted((INCIDENT / "queue").glob("*.jsonl")):
        blob = path.read_bytes()
        items.append(
            {
                "name": path.name,
                "sha256": hashlib.sha256(blob).hexdigest(),
                "bytes": len(blob),
                "rows": sum(1 for line in blob.decode("utf-8").splitlines() if line.strip()),
            }
        )
    inventory = json.dumps(items, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    assert len(items) == manifest["file_count"] == 48
    assert sum(item["bytes"] for item in items) == manifest["total_bytes"] == 300144
    assert sum(item["rows"] for item in items) == manifest["jsonl_records"] == 384
    assert hashlib.sha256(inventory).hexdigest() == manifest["inventory_sha256"]
    assert not (ROOT / "scripts" / "badger" / "_queue" / "witness-receipts").exists()

    quarantine = json.loads((ROOT / "scripts" / "evidence-quarantine.json").read_text())
    assert quarantine["witness_receipt_incident_manifest"] == str(
        (INCIDENT / "manifest.json").relative_to(ROOT)
    )


def test_atom_collection_rejects_malformed_and_non_object_jsonl() -> None:
    with isolated_atom_environment() as (_, source):
        for payload, expected in (("{\n", "malformed JSONL"), ("[]\n", "non-object JSONL")):
            source.write_text(payload, encoding="utf-8")
            try:
                ATOM.collect()
            except ValueError as exc:
                assert expected in str(exc)
                assert "accepted/atoms.jsonl:1" in str(exc)
            else:
                raise AssertionError(f"collector admitted {payload!r}")


def test_candidate_is_confined_and_exclusive_create() -> None:
    with isolated_atom_environment() as (repo, source):
        source.write_text('{"claim":"observed"}\n', encoding="utf-8")

        outside = repo / "evidence" / "candidates" / "outside.json"
        assert run_atom_main("--build-candidate", str(outside)) == 2
        assert not outside.exists()

        relative = Path("evidence/candidates/atom-roots/candidate.json")
        candidate = repo / relative
        assert run_atom_main("--build-candidate", str(relative)) == 0
        first_bytes = candidate.read_bytes()
        assert first_bytes
        assert run_atom_main("--build-candidate", str(relative)) == 2
        assert candidate.read_bytes() == first_bytes


def test_verify_requires_parseable_exact_digest_proof() -> None:
    with TemporaryDirectory() as directory:
        root_path = Path(directory) / "atom-root.json"
        proof_path = Path(directory) / "atom-root.json.ots"
        leaf = hashlib.sha256(b"one admitted observation").hexdigest()
        root_path.write_text(
            json.dumps({"leaves": [{"leaf": leaf}], "merkle_root": leaf}) + "\n",
            encoding="utf-8",
        )

        assert ATOM.verify_root(root_path, proof_path) == 1

        proof_path.write_bytes(b"not an OpenTimestamps proof")
        assert ATOM.verify_root(root_path, proof_path) == 1

        proof_path.write_bytes(detached_proof_for(hashlib.sha256(b"other bytes").digest()))
        assert ATOM.verify_root(root_path, proof_path) == 1

        exact_digest = hashlib.sha256(root_path.read_bytes()).digest()
        proof_path.write_bytes(detached_proof_for(exact_digest))
        assert ATOM.verify_root(root_path, proof_path) == 0


if __name__ == "__main__":
    test_retired_witness_producer_writes_nothing()
    test_witness_quarantine_inventory_is_exact()
    test_atom_collection_rejects_malformed_and_non_object_jsonl()
    test_candidate_is_confined_and_exclusive_create()
    test_verify_requires_parseable_exact_digest_proof()
    print("evidence producer fail-closed tests: PASS")
