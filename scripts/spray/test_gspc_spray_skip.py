import importlib.util
from pathlib import Path

import pytest


HERE = Path(__file__).resolve().parent
SPRAY_SPEC = importlib.util.spec_from_file_location("gspc_spray", HERE / "gspc-spray.py")
assert SPRAY_SPEC and SPRAY_SPEC.loader
spray = importlib.util.module_from_spec(SPRAY_SPEC)
SPRAY_SPEC.loader.exec_module(spray)


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
