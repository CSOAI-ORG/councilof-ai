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
import discover  # noqa: E402
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


def test_erc8004_expanded_chain_not_uncheckable_for_missing_rpc() -> None:
    """Avalanche 43114 was absent from the old 6-chain map; must resolve now."""
    assert 43114 in probe.CHAIN_RPC
    orig = c.http_post_json

    def fake_rpc(url, obj, timeout=15):
        assert "avalanche" in url
        return 200, {"jsonrpc": "2.0", "id": 1, "result": "0x" + "11" * 40}

    c.http_post_json = fake_rpc
    try:
        state, note = probe.probe_erc8004({
            "id": "avax-fixture-agent",
            "kind": "erc8004",
            "status": "DISCOVERED",
            "meta": {
                "chain_id": 43114,
                "contract_address": "0x" + "ab" * 20,
                "token_id": 1,
            },
        })
    finally:
        c.http_post_json = orig
    assert state != "UNCHECKABLE" or "not resolvable" not in note, (state, note)
    assert "not resolvable" not in note, note
    assert state == "LIVE", (state, note)


def test_discover_hf_space_and_npm_from_fixture() -> None:
    """Shipped discover_hf_space / discover_npm emit DISCOVERED rows from a fixture body."""
    orig = c.http_get

    def fake_get(url, timeout=15, headers=None):
        if "huggingface.co/api/spaces" in url:
            return 200, json.dumps([{"id": "org/demo-space", "likes": 1, "sdk": "gradio"}]).encode()
        if "registry.npmjs.org/-/v1/search" in url:
            return 200, json.dumps({
                "objects": [{"package": {"name": "@fixture/mcp-demo", "version": "0.0.1"}}],
            }).encode()
        return -1, None

    c.http_get = fake_get
    try:
        spaces = discover.discover_hf_space(5)
        npms = discover.discover_npm(5)
    finally:
        c.http_get = orig
    assert spaces and spaces[0]["kind"] == "hf-space" and spaces[0]["status"] == "DISCOVERED"
    assert spaces[0]["id"] == "org/demo-space"
    assert npms and npms[0]["kind"] == "npm-registry" and npms[0]["status"] == "DISCOVERED"
    assert npms[0]["id"] == "@fixture/mcp-demo"


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
    test_erc8004_expanded_chain_not_uncheckable_for_missing_rpc()
    test_discover_hf_space_and_npm_from_fixture()
    test_pidfile_lock_in_eat_loop()
    print(
        "selftest OK: staged atom unsigned; ERC-8004 43114 not missing-RPC; "
        "hf-space+npm DISCOVERED from fixture; pidfile lock"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
