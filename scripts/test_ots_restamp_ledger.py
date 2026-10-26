#!/usr/bin/env python3
"""ots_restamp_ledger.py: a changed publisher-owned ledger is re-stamped, its old pair kept,
and the release gate that blocked public-root on 5-6 Oct 2026 passes. No network: proofs are
built locally as calendar-pending detached timestamps, the same shape `ots stamp` writes."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest
from opentimestamps.core.notary import PendingAttestation
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import BytesSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp

ROOT = Path(__file__).resolve().parents[1]
LEDGER = "public/interop/eas-root-attestations.json"


def load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / file)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


restamp = load("ots_restamp_ledger", "ots_restamp_ledger.py")


def pending_proof(data: bytes) -> bytes:
    detached = DetachedTimestampFile(OpSHA256(), Timestamp(hashlib.sha256(data).digest()))
    detached.timestamp.attestations.add(PendingAttestation("https://alice.btc.calendar.opentimestamps.org"))
    ctx = BytesSerializationContext()
    detached.serialize(ctx)
    return ctx.getbytes()


def fake_stamp(path: Path) -> bytes:
    return pending_proof(path.read_bytes())


OLD = (json.dumps({"status": "NOT_YET", "reason": "no attester key in GitHub secrets", "attestations": [],
                   "as_of": "2026-09-30T05:05:39.513Z"}, indent=1) + "\n").encode()
NEW = (json.dumps({"status": "ATTESTED", "attestations": [{"sha256": "11" * 32, "uid": "0xabc"}],
                   "as_of": "2026-10-06T12:00:00.000Z"}, indent=1) + "\n").encode()


@pytest.fixture()
def repo(tmp_path: Path) -> Path:
    """A git repo whose HEAD holds the ledger and an exact proof of it, like master today."""
    interop = tmp_path / "public" / "interop"
    interop.mkdir(parents=True)
    (interop / "eas-root-attestations.json").write_bytes(OLD)
    (interop / "eas-root-attestations.json.ots").write_bytes(pending_proof(OLD))
    git = ["git", "-C", str(tmp_path), "-c", "user.name=t", "-c", "user.email=t@example.invalid"]
    subprocess.run(git + ["init", "-q"], check=True)
    subprocess.run(git + ["add", "-A"], check=True)
    subprocess.run(git + ["commit", "-q", "-m", "fixture"], check=True)
    return tmp_path


def gate_errors(repo: Path) -> list[str]:
    gate = load("root_witness_release_gate_under_test", "root-witness-release-gate.py")
    gate.configure_public_dir(repo / "public")
    errors: list[str] = []
    gate.validate_ots(errors)
    return errors


def test_unchanged_ledger_is_current_and_nothing_is_written(repo: Path) -> None:
    before = sorted(p.name for p in (repo / "public" / "interop").iterdir())
    row = restamp.restamp_ledger(repo, LEDGER, "root-0ee7e9ee", stamp=fake_stamp)
    assert row["state"] == "CURRENT"
    assert sorted(p.name for p in (repo / "public" / "interop").iterdir()) == before
    assert gate_errors(repo) == []


def test_changed_ledger_blocks_the_gate_then_restamp_clears_it(repo: Path) -> None:
    (repo / LEDGER).write_bytes(NEW)
    # The failure observed in runs 37376012173 / 37403227482 / 37447955940.
    assert any("public .ots digest mismatch" in e and "eas-root-attestations.json.ots" in e for e in gate_errors(repo))
    assert restamp.restamp_ledger(repo, LEDGER, None, check_only=True, stamp=fake_stamp)["state"] == "STALE"

    row = restamp.restamp_ledger(repo, LEDGER, "root-0ee7e9ee", stamp=fake_stamp)
    interop = repo / "public" / "interop"
    assert row["state"] == "RESTAMPED"
    # old bytes and the old proof kept byte-exact, as a dated pair whose proof still verifies
    assert (interop / "eas-root-attestations.pre-root-0ee7e9ee.json").read_bytes() == OLD
    assert (interop / "eas-root-attestations.pre-root-0ee7e9ee.json.ots").read_bytes() == pending_proof(OLD)
    # the live ledger is untouched and its new proof commits to exactly its bytes
    assert (repo / LEDGER).read_bytes() == NEW
    assert restamp.proof_digest((repo / (LEDGER + ".ots")).read_bytes()) == hashlib.sha256(NEW).hexdigest()
    assert set(row["touched"]) == {
        LEDGER, LEDGER + ".ots",
        "public/interop/eas-root-attestations.pre-root-0ee7e9ee.json",
        "public/interop/eas-root-attestations.pre-root-0ee7e9ee.json.ots",
    }
    assert gate_errors(repo) == []


def test_stamp_failure_rolls_everything_back(repo: Path) -> None:
    (repo / LEDGER).write_bytes(NEW)

    def no_calendar(path: Path) -> bytes:
        raise restamp.RestampError("calendars did not answer")

    with pytest.raises(restamp.RestampError):
        restamp.restamp_ledger(repo, LEDGER, "root-0ee7e9ee", stamp=no_calendar)
    interop = repo / "public" / "interop"
    assert (interop / "eas-root-attestations.json.ots").read_bytes() == pending_proof(OLD)
    assert not list(interop.glob("*.pre-*"))


def test_a_proof_for_other_bytes_is_refused(repo: Path) -> None:
    (repo / LEDGER).write_bytes(NEW)

    with pytest.raises(restamp.RestampError, match="new proof does not commit"):
        restamp.restamp_ledger(repo, LEDGER, "root-0ee7e9ee", stamp=lambda p: pending_proof(b"other"))
    assert not list((repo / "public" / "interop").glob("*.pre-*"))


def test_old_bytes_not_at_head_are_never_invented(repo: Path) -> None:
    # The proof commits to bytes that are not what git HEAD holds: an incident for a human.
    (repo / LEDGER).write_bytes(NEW)
    with pytest.raises(restamp.RestampError, match="refusing to invent"):
        restamp.restamp_ledger(repo, LEDGER, "root-0ee7e9ee", stamp=fake_stamp, head_bytes=lambda r, p: b"something else")
    assert not list((repo / "public" / "interop").glob("*.pre-*"))


def test_scope_and_event_are_bounded(repo: Path) -> None:
    with pytest.raises(restamp.RestampError, match="not a declared publisher-owned mutable ledger"):
        restamp.restamp_ledger(repo, "public/root.json", "root-0ee7e9ee", stamp=fake_stamp)
    (repo / LEDGER).write_bytes(NEW)
    for bad in (None, "", "../x", "Root 1"):
        with pytest.raises(restamp.RestampError, match="--event"):
            restamp.restamp_ledger(repo, LEDGER, bad, stamp=fake_stamp)


def test_cli_check_mode_writes_nothing_and_fails_on_stale(repo: Path, capsys) -> None:
    assert restamp.main(["--check", "--repo", str(repo)]) == 0
    assert json.loads(capsys.readouterr().out)["ledgers"][0]["state"] == "CURRENT"
    (repo / LEDGER).write_bytes(NEW)
    assert restamp.main(["--check", "--repo", str(repo)]) == 1
    report = json.loads(capsys.readouterr().out)
    assert report["status"] == "STALE"
    assert report["ledgers"][0]["bytes_hash_to"] == hashlib.sha256(NEW).hexdigest()
    assert not list((repo / "public" / "interop").glob("*.pre-*"))
    # without --check an event is mandatory
    with pytest.raises(SystemExit):
        restamp.main(["--repo", str(repo)])
