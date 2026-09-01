#!/usr/bin/env python3
"""Honesty gate: the shipped probe/stage path cannot mark MEASURED.

Drives probe.stage_live_atom (the real stager) and probe.probe_hf (the real
prober) on a DISCOVERED fixture. Asserts the atom has sig_ed25519 null,
state=queued, auto_measured False, and never a MEASURED upgrade.
"""
from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import common as c  # noqa: E402
import probe  # noqa: E402


def _point_feed(tmp: Path) -> None:
    feed = tmp / "public" / "interop" / "auto-eat"
    feed.mkdir(parents=True)
    c.FEED = feed
    c.COMPACT = feed / "cards-compact.json"
    c.QUEUE = feed / "queue.jsonl"
    c.PROBED = feed / "probed.json"
    c.STATUS_JSON = feed / "status.json"


def test_probe_hf_discovered_fixture_then_stage_unsigned() -> None:
    """DISCOVERED hf-model + LIVE HTTP 200 -> unsigned queued atom, not MEASURED."""
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        _point_feed(tmp)

        orig_get = c.http_get

        def fake_get(url, timeout=12, headers=None):
            assert "huggingface.co/api/models/fixture/demo-model" in url
            return 200, b'{"id":"fixture/demo-model"}'

        c.http_get = fake_get
        try:
            state, note = probe.probe_hf({"id": "fixture/demo-model", "kind": "hf-model", "status": "DISCOVERED"})
        finally:
            c.http_get = orig_get

        assert state == "LIVE", state
        assert "fixture/demo-model" in note

        ok, msg = probe.stage_live_atom(
            "hf-model",
            {"n": 1, "LIVE": 1, "PLACEHOLDER": 0, "HELD": 0, "DEAD": 0, "UNCHECKABLE": 0, "UNREACHABLE": 0, "live_examples": [note[:90]]},
        )
        assert ok, msg
        atom_path = c.FEED / "card-autoeat-hf-newmodels-unsigned.json"
        atom = json.loads(atom_path.read_text(encoding="utf-8"))
        assert atom["sig_ed25519"] is None, atom["sig_ed25519"]
        assert atom["state"] == "queued"
        assert atom["payload"]["flags"]["auto_measured"] is False
        assert "MEASURED" not in json.dumps(atom["payload"]["flags"])
        assert "gspc_score" in atom["unmeasured"]
        compact = json.loads(c.COMPACT.read_text(encoding="utf-8"))
        assert compact["autoeat.hf.newmodels"]["flags"]["auto_measured"] is False


def test_write_atom_structurally_unsigned() -> None:
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        _point_feed(tmp)
        ok, msg = c.write_atom(
            surface="autoeat.hf.newmodels",
            subject="fixture",
            source_urls=["https://huggingface.co/api/models"],
            payload={"kind": "csoai.auto-eat-probe/0.1", "flags": {"auto_measured": False}, "as_of": "2026-09-01T00:00:00Z"},
            unmeasured=["gspc_score"],
        )
        assert ok, msg
        atom = json.loads((c.FEED / "card-autoeat-hf-newmodels-unsigned.json").read_text())
        assert atom["sig_ed25519"] is None
        assert atom["state"] == "queued"


def test_pidfile_lock_in_eat_loop() -> None:
    text = (HERE / "eat-loop.sh").read_text(encoding="utf-8")
    assert "EAT_PIDFILE" in text
    assert "kill -0" in text
    assert 'echo $$ > "$PIDFILE"' in text
    # No live pgrep -f (comment may name the trap). Instance check is pidfile + kill -0.
    live = [ln for ln in text.splitlines() if ln.lstrip().startswith("pgrep")]
    assert live == [], live


def main() -> int:
    test_probe_hf_discovered_fixture_then_stage_unsigned()
    test_write_atom_structurally_unsigned()
    test_pidfile_lock_in_eat_loop()
    print("selftest OK: staged atom sig_ed25519=null, state=queued, auto_measured=False; pidfile lock, no pgrep -f")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
