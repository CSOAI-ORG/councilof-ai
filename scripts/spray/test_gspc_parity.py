import hashlib
import importlib.util
import json
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


def fixture() -> dict[str, bytes]:
    root = {"as_of": "2026-09-12T13:27:43Z", "card_count": 2,
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
