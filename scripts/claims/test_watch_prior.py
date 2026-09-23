"""Failing controls for comparable prior reads in the generic claim watch."""
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common as cm  # noqa: E402
import watch_run  # noqa: E402


def _row(cid, url, digest, status=200):
    return {"claim_id": cid, "url": url, "covers": "visible-text", "recorded_hash": None,
            "current_hash": digest, "http_status": status, "changed": None}


def _save(out, stamp, rows, extractor="reference-v1"):
    run = out / f"run-{stamp}"
    run.mkdir()
    file = run / "reread-claimreg-older.json"
    file.write_text(json.dumps({
        "registry_id": "claimreg-older", "extractor": extractor,
        "read_at_utc": f"{stamp[:4]}-{stamp[4:6]}-{stamp[6:8]}T09:00:00Z",
        "readings": rows,
    }), encoding="utf-8")
    return file


def test_second_read_detects_change_and_pins_previous_artifact():
    with tempfile.TemporaryDirectory() as t:
        out = Path(t)
        old = _save(out, "20260922T090000Z", [
            _row("CL-2", "https://example.org/a", "a" * 64),
            _row("ON-3", "https://example.org/b", "b" * 64),
        ])
        current = {"registry_id": "claimreg-older", "extractor": "reference-v1",
                   "readings": [_row("CL-2", "https://example.org/a", "a" * 64),
                                _row("ON-3", "https://example.org/b", "c" * 64)]}
        got = watch_run.attach_prior_comparisons(out, out / "claimreg-older.json",
                                                 current, out / "run-now")
        assert [r["changed"] for r in got["readings"]] == [False, True]
        assert got["readings"][1]["previous_read_hash"] == "b" * 64
        assert got["readings"][1]["previous_read_at_utc"] == "2026-09-22T09:00:00Z"
        assert got["readings"][1]["previous_read_artifact_sha256"] == cm.sha256_hex(old.read_bytes())
        assert got["readings"][1]["recorded_hash"] is None  # immutable signed registry untouched


def test_failed_read_is_skipped_and_changed_url_or_extractor_starts_new_baseline():
    with tempfile.TemporaryDirectory() as t:
        out = Path(t)
        _save(out, "20260921T090000Z", [_row("ON-3", "https://example.org/old", "a" * 64)])
        _save(out, "20260922T090000Z", [_row("ON-3", "https://example.org/old", None, 503)])
        current = {"registry_id": "claimreg-older", "extractor": "reference-v1",
                   "readings": [_row("ON-3", "https://example.org/old", "a" * 64),
                                _row("CL-2", "https://example.org/new", "b" * 64)]}
        got = watch_run.attach_prior_comparisons(out, out / "claimreg-older.json",
                                                 current, out / "run-now")
        assert got["readings"][0]["changed"] is False
        assert got["readings"][0]["previous_read_at_utc"] == "2026-09-21T09:00:00Z"
        assert got["readings"][1]["changed"] is None
        assert got["readings"][1]["comparison_basis"] == "FIRST_COMPARABLE_READ"
        current = {"registry_id": "claimreg-older", "extractor": "new-extractor",
                   "readings": [_row("ON-3", "https://example.org/old", "c" * 64)]}
        got = watch_run.attach_prior_comparisons(out, out / "claimreg-older.json",
                                                 current, out / "run-now")
        assert got["readings"][0]["changed"] is None
        assert got["readings"][0]["comparison_basis"] == "FIRST_COMPARABLE_READ"


def test_missing_or_malformed_previous_never_fabricates_a_change():
    with tempfile.TemporaryDirectory() as t:
        out = Path(t)
        run = out / "run-20260922T090000Z"
        run.mkdir()
        (run / "reread-claimreg-older.json").write_text("{bad", encoding="utf-8")
        current = {"registry_id": "claimreg-older", "extractor": "reference-v1",
                   "readings": [_row("CL-2", "https://example.org/a", "a" * 64)]}
        got = watch_run.attach_prior_comparisons(out, out / "claimreg-older.json",
                                                 current, out / "run-now")
        assert got["readings"][0]["changed"] is None
        assert got["readings"][0]["comparison_basis"] == "FIRST_COMPARABLE_READ"
