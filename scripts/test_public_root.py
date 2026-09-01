#!/usr/bin/env python3
"""Shipped public-root adapters + live GETs. XRPL 16 reader. SWIFT 17 UNMEASURED notices."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from adapters import swift_notices, xrpl  # noqa: E402

UA = {"User-Agent": "csoai-test-public-root/0"}


def _get(url: str) -> tuple[int, dict]:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, json.loads(r.read())


def test_xrpl_locked_16_and_live_reader() -> None:
    assert len(xrpl.LOCKED_16) == 16
    symbols = [row["symbol"] for row in xrpl.LOCKED_16]
    assert len(set(symbols)) == 16
    blob = json.dumps(xrpl.LOCKED_16).lower()
    assert "represented tvl" not in blob
    assert "tvl" not in blob
    st, body = _get("https://councilof.ai/api/xrpl")
    assert st == 200
    assert body.get("kind") == "reader"
    assert body.get("writes_board") is False
    assert body.get("n") == 16
    note = json.dumps(body).lower()
    assert "writes_board" in note
    assert body.get("writes_board") is not True


def test_swift_17_unmeasured_notices() -> None:
    out = swift_notices.collect()
    leaves = out["leaves"]
    assert len(leaves) == 17
    assert len(swift_notices.COHORT_17) == 17
    sidecar = out["sidecar"]
    assert sidecar.get("cohort_are_clients") is False
    assert sidecar.get("gpi_firehose") is False
    assert sidecar.get("settlement_still_off_chain") is True
    banks = []
    for leaf in leaves:
        payload = leaf["payload"]
        assert payload.get("settlement_still_off_chain") is True
        assert payload.get("status") == "UNMEASURED"
        assert payload.get("not_a_client") is True
        assert payload.get("url_sha256") == swift_notices.PRESS_SHA256
        assert swift_notices.SWIFT_PRESS in leaf["source_urls"]
        banks.append(payload.get("bank"))
        text = json.dumps(leaf).lower()
        assert "gpi firehose" not in text or "not a gpi" in text
        assert "client" in text  # "not a client" / TARGETS-not-clients
    assert len(set(banks)) == 17
    assert "ANZ" in banks
    assert "Wells Fargo" in banks
    assert sidecar.get("swift_partnered") is False


def test_envelope_preimage_under_3kb() -> None:
    from publish_public_root import (
        PAYLOAD_CAP,
        canonical_bytes,
        envelope_preimage,
    )

    fake = {
        "kind": "csoai.public-root/v0",
        "schema": "https://councilof.ai/schema/public-root-v0.json",
        "as_of": "2026-09-01T01:48:00Z",
        "merkle_root": "4a9a5036b7e82b682e0908062e6b43043e3b16f02d1e4694b73607ad565ac69c",
        "card_count": 43,
        "did_intended": "did:web:csoai.org#board-attestation-1",
        "card_sha256": ["ab"] * 43,
        "note": "noise not in preimage",
    }
    pre = envelope_preimage(fake)
    raw = canonical_bytes(pre)
    assert set(pre) == {
        "kind",
        "schema",
        "as_of",
        "merkle_root",
        "card_count",
        "did_intended",
    }
    assert "card_sha256" not in pre
    assert len(raw) <= PAYLOAD_CAP
    assert len(raw) < 512


def test_live_root_envelope() -> None:
    st, root = _get("https://councilof.ai/root.json")
    assert st == 200
    assert root.get("did_intended")
    assert root.get("merkle_root")
    assert root.get("card_count")
    sig = root.get("sig_ed25519")
    if sig:
        assert isinstance(sig, str) and len(sig) >= 64
        assert root.get("sig_preimage")
    else:
        note = (root.get("note") or "").lower()
        assert "unsigned" in note or "not ed25519-signed" in note


if __name__ == "__main__":
    test_xrpl_locked_16_and_live_reader()
    test_swift_17_unmeasured_notices()
    test_envelope_preimage_under_3kb()
    test_live_root_envelope()
    print("PASS public-root XRPL16 reader + SWIFT17 UNMEASURED notices + envelope preimage")
