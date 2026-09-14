import importlib.util
import base64
from pathlib import Path

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


HERE = Path(__file__).resolve().parent
SPRAY_SPEC = importlib.util.spec_from_file_location("gspc_spray", HERE / "gspc-spray.py")
assert SPRAY_SPEC and SPRAY_SPEC.loader
spray = importlib.util.module_from_spec(SPRAY_SPEC)
SPRAY_SPEC.loader.exec_module(spray)


def signed_root():
    key = Ed25519PrivateKey.generate()
    leaves = ["00" * 32, "11" * 32]
    root = {
        "kind": "csoai.public-root/v1",
        "schema": "https://councilof.ai/schema/public-root-v1.json",
        "as_of": "2026-09-14T03:12:56Z",
        "merkle_root": spray.merkle_root(leaves),
        "card_count": len(leaves),
        "card_sha256": leaves,
        "did_intended": "did:web:csoai.org#board-attestation-1",
    }
    preimage = {name: root[name] for name in spray.ROOT_PREIMAGE_KEYS}
    root["sig_ed25519"] = key.sign(spray.canonical(preimage)).hex()
    raw_public = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    did = {
        "id": "did:web:csoai.org",
        "verificationMethod": [{
            "id": root["did_intended"],
            "publicKeyJwk": {
                "kty": "OKP", "crv": "Ed25519",
                "x": base64.urlsafe_b64encode(raw_public).decode().rstrip("="),
            },
        }],
    }
    return root, did


def test_public_root_signature_accepts_the_declared_live_did_key():
    root, did = signed_root()
    spray.verify_public_root(root, did)


def test_public_root_signature_fails_closed_on_tampering_or_a_different_live_key():
    root, did = signed_root()
    root["sig_ed25519"] = "00" * 64
    with pytest.raises(ValueError, match="does not verify"):
        spray.verify_public_root(root, did)

    root, _ = signed_root()
    _, different_did = signed_root()
    with pytest.raises(ValueError, match="does not verify"):
        spray.verify_public_root(root, different_did)


def test_public_root_signature_fails_closed_when_the_leaf_list_does_not_bind_the_root():
    root, did = signed_root()
    root["card_sha256"][0] = "22" * 32
    with pytest.raises(ValueError, match="merkle_root does not bind"):
        spray.verify_public_root(root, did)


def test_kaggle_download_uses_the_newest_ready_version(monkeypatch):
    import io
    import json
    import zipfile

    metadata = {"currentVersionNumber": 24, "versions": [{"versionNumber": 26, "status": "Ready"}]}
    body = io.BytesIO()
    with zipfile.ZipFile(body, "w") as archive:
        archive.writestr("SNAPSHOT.json", "{}")
    seen = []

    def fake_fetch(url, timeout=60):
        seen.append(url)
        return json.dumps(metadata).encode() if "/view/" in url else body.getvalue()

    monkeypatch.setattr(spray, "fetch_ok", fake_fetch)
    assert spray.kaggle_public_files()["SNAPSHOT.json"] == b"{}"
    assert seen[-1].endswith("?datasetVersionNumber=26")


def test_byte_parity_exact_match_skips():
    built = {"a.json": b"1", "b.json": b"2"}
    remote = {"a.json": b"1", "b.json": b"2", "dataset-metadata.json": b"{}"}
    assert spray.byte_parity_reason(built, remote) is None


def test_byte_parity_catches_read_at_only_drift():
    """The 2026-09-13 live failure: same root, different build clock — must NOT skip."""
    built = {"SNAPSHOT.json": b'{"as_of":"X","read_at":"10:04"}'}
    remote = {"SNAPSHOT.json": b'{"as_of":"X","read_at":"08:15"}'}
    reason = spray.byte_parity_reason(built, remote)
    assert reason is not None and "bytes differ" in reason


def test_byte_parity_catches_missing_file():
    built = {"a.json": b"1", "b.json": b"2"}
    remote = {"a.json": b"1"}
    reason = spray.byte_parity_reason(built, remote)
    assert reason is not None and "remote lacks" in reason


def test_built_files_reads_the_snapshot_dir(tmp_path):
    (tmp_path / "x.json").write_bytes(b"xx")
    (tmp_path / "y.json").write_bytes(b"yy")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "ignored.json").write_bytes(b"no")
    built = spray.built_files(tmp_path)
    assert built == {"x.json": b"xx", "y.json": b"yy"}


def test_hf_snapshot_bytes_match_compares_bytes_not_as_of(monkeypatch):
    built = {"SNAPSHOT.json": b'{"as_of":"X","read_at":"10:26"}'}
    monkeypatch.setattr(spray, "fetch_ok", lambda url, timeout=60: built["SNAPSHOT.json"])
    assert spray._hf_snapshot_bytes_match("https://huggingface.co/datasets/x/y", built) is True
    monkeypatch.setattr(spray, "fetch_ok", lambda url, timeout=60: b'{"as_of":"X","read_at":"08:15"}')
    assert spray._hf_snapshot_bytes_match("https://huggingface.co/datasets/x/y", built) is False
    def boom(url, timeout=60):
        raise RuntimeError("net down")
    monkeypatch.setattr(spray, "fetch_ok", boom)
    assert spray._hf_snapshot_bytes_match("https://huggingface.co/datasets/x/y", built) is False


def test_adopt_remote_read_at_reproduces_published_bytes_for_an_unchanged_root():
    tr = {"fingerprint": "f" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "2026-09-13T15:00:00Z"}
    remote = {"fingerprint": "f" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "2026-09-13T06:05:10Z"}
    assert spray.adopt_remote_read_at(tr, remote) is True
    assert tr["read_at"] == "2026-09-13T06:05:10Z"


def test_adopt_remote_read_at_keeps_a_fresh_clock_when_the_root_changed_or_remote_is_absent():
    tr = {"fingerprint": "f" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "2026-09-13T15:00:00Z"}
    assert spray.adopt_remote_read_at(tr, {"fingerprint": "e" * 64, "as_of": "2026-09-13T06:03:55Z", "read_at": "x"}) is False
    assert spray.adopt_remote_read_at(tr, {"fingerprint": "f" * 64, "as_of": "2026-09-12T19:21:56Z", "read_at": "x"}) is False
    assert spray.adopt_remote_read_at(tr, None if False else {}) is False
    assert tr["read_at"] == "2026-09-13T15:00:00Z"


def _truth():
    return {"as_of": "2026-09-14T03:12:56Z", "read_at": "2026-09-14T04:44:14Z", "fingerprint": "9" * 64,
            "lid": "22 axes measured · not a certificate.", "board": {"issuer": "CSOAI Ltd"}}


def test_kaggle_page_text_is_derived_from_the_truth_only():
    subtitle, description = spray.kaggle_page_text(_truth())
    assert "2026-09-14T03:12:56Z" in subtitle
    assert description.startswith("22 axes measured · not a certificate.")
    assert description.endswith("spray-fingerprint: " + "9" * 64)
    assert not spray.BANNED.search(description)


def test_kaggle_metadata_drift_is_none_when_the_page_matches_modulo_whitespace():
    subtitle, description = spray.kaggle_page_text(_truth())
    info = {"subtitle": subtitle, "description": description.replace("\n\n", "\n")}
    assert spray.kaggle_metadata_drift(info, subtitle, description) is None


def test_kaggle_metadata_drift_catches_the_2026_09_14_live_page():
    """Bytes carried 2026-09-14T03:12:56Z; the visible page still said 2026-09-12 and carried a
    hand-typed legacy Hub triple in place of the fingerprint line. UNCHANGED bytes must not hide that."""
    subtitle, description = spray.kaggle_page_text(_truth())
    stale = {
        "subtitle": "Snapshot of GET councilof.ai/api/gspc · as_of 2026-09-12T13:27:43Z · 22·22 · cit",
        "description": description.rsplit("spray-fingerprint:", 1)[0]
        + "Hub cards: GET https://councilof.ai/api/hub-cards → cells/measured/unmeasured = 1191/1191/0",
    }
    reason = spray.kaggle_metadata_drift(stale, subtitle, description)
    assert reason is not None and "subtitle" in reason and "description" in reason
    appended = {"subtitle": subtitle, "description": description + "\nA100 COLD."}
    assert "description" in (spray.kaggle_metadata_drift(appended, subtitle, description) or "")
