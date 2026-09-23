import hashlib
import importlib.util
import io
import json
import zipfile
from pathlib import Path

import pytest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("gspc_parity", HERE / "verify-gspc-parity.py")
assert SPEC and SPEC.loader
parity = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(parity)

SPRAY_SPEC = importlib.util.spec_from_file_location("gspc_spray", HERE / "gspc-spray.py")
assert SPRAY_SPEC and SPRAY_SPEC.loader
spray = importlib.util.module_from_spec(SPRAY_SPEC)
SPRAY_SPEC.loader.exec_module(spray)


def fixture(as_of: str = "2026-09-12T13:27:43Z") -> dict[str, bytes]:
    root = {"as_of": as_of, "card_count": 2,
            "card_sha256": ["00" * 32, "11" * 32], "merkle_root": "22" * 32}
    root_bytes = (json.dumps(root) + "\n").encode()
    snapshot = {"as_of": root["as_of"], "card_count": 2, "merkle_root": root["merkle_root"],
                "root_sha256": hashlib.sha256(root_bytes).hexdigest()}
    files = {name: f"fixture {name}\n".encode() for name in parity.FILES}
    files["root.json"] = root_bytes
    files["SNAPSHOT.json"] = (json.dumps(snapshot) + "\n").encode()
    rows = []
    for name in parity.FILES:
        if name != "manifest.jsonl":
            rows.append(json.dumps({"file": name, "bytes": len(files[name]),
                                    "sha256": hashlib.sha256(files[name]).hexdigest()}))
    files["manifest.jsonl"] = ("\n".join(rows) + "\n").encode()
    return files


def test_the_parity_gate_knows_every_file_the_publisher_pushes():
    """Two tuples, one list. A name the spray pushes but the gate does not know is a file nobody
    compares across the surfaces, and a name the gate demands but the spray never writes is a
    permanent red. Neither shows up anywhere else, so it is pinned here."""
    assert tuple(parity.FILES) == tuple(spray.SNAPSHOT_FILES)


def test_validate_accepts_a_self_consistent_snapshot():
    result = parity.validate("fixture", fixture())
    assert result["card_count"] == 2


def test_validate_rejects_manifest_drift():
    files = fixture()
    files["README.md"] += b"changed"
    try:
        parity.validate("fixture", files)
    except ValueError as error:
        assert "manifest entry" in str(error)
    else:
        raise AssertionError("manifest drift passed")


def test_preflight_refuses_a_newer_hugging_face_snapshot(monkeypatch):
    remote = json.dumps({"as_of": "2026-09-13T00:00:00Z"}).encode()
    monkeypatch.setattr(spray, "fetch_ok", lambda *_args, **_kwargs: remote)
    with pytest.raises(spray.Refused, match="newer as_of"):
        spray.refuse_newer_remote(["hf"], {"as_of": "2026-09-12T13:27:43Z"})


def test_verify_waits_for_a_kaggle_archive_that_is_behind_then_passes(monkeypatch):
    fresh = fixture(as_of="2026-09-13T08:40:49Z")
    stale = fixture(as_of="2026-09-13T06:03:55Z")
    reads = [stale, stale, fresh]
    monkeypatch.setattr(parity, "read_hf", lambda: fresh)
    monkeypatch.setattr(parity, "read_kaggle", lambda: reads.pop(0))
    slept = []
    result = parity.verify(require_live=False, kaggle_wait_seconds=120, poll_seconds=30, sleep=slept.append)
    assert result["state"] == "EXTERNALLY_VERIFIED"
    assert slept == [30, 30]


def test_verify_does_not_wait_on_an_equal_as_of_byte_mismatch(monkeypatch):
    fresh = fixture()
    other = dict(fresh); other["README.md"] = fresh["README.md"] + b"\nedited"
    monkeypatch.setattr(parity, "read_hf", lambda: fresh)
    monkeypatch.setattr(parity, "read_kaggle", lambda: other)
    # validate() would refuse the edited README on its manifest first; this test is about the
    # wait decision, so let both sides through to the byte comparison.
    monkeypatch.setattr(parity, "validate", lambda label, files: ("same",))
    slept = []
    with pytest.raises(ValueError, match="byte mismatches"):
        parity.verify(require_live=False, kaggle_wait_seconds=600, poll_seconds=30, sleep=slept.append)
    assert slept == []


def test_newest_ready_version_ignores_stale_current_pointer_and_pending_version():
    metadata = {
        "currentVersionNumber": 24,
        "versions": [
            {"versionNumber": 27, "status": "Pending"},
            {"versionNumber": 24, "status": "Ready"},
            {"versionNumber": 26, "status": "Ready"},
            {"versionNumber": 25, "status": "Ready"},
        ],
    }
    assert parity.newest_ready_kaggle_version(metadata) == 26
    assert spray.newest_ready_kaggle_version(metadata) == 26


def test_parity_downloads_the_newest_ready_version_explicitly(monkeypatch):
    metadata = {"currentVersionNumber": 24, "versions": [{"versionNumber": 26, "status": "Ready"}]}
    body = io.BytesIO()
    with zipfile.ZipFile(body, "w") as archive:
        for name in parity.FILES:
            archive.writestr(name, name)
    seen = []

    def fake_get(url, timeout=120):
        seen.append(url)
        return json.dumps(metadata).encode() if "/view/" in url else body.getvalue()

    monkeypatch.setattr(parity, "get", fake_get)
    files = parity.read_kaggle()
    assert set(files) == set(parity.FILES)
    assert seen[-1].endswith("?datasetVersionNumber=26")
