#!/usr/bin/env python3
"""22/22 READY: schema + rubric + signed coverage skeletons + LIVE board 22 measured / 0 unmeasured."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVAL22 = ROOT / "public" / "fleet" / "eval-gspc-22.yaml"
EVAL7 = ROOT / "public" / "fleet" / "eval-fin7.yaml"
SCHEMA = ROOT / "public" / "schema" / "card-v0.json"
SKEL = ROOT / "public" / "interop" / "fin7-skeletons"
FIN7 = [
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
    "ai-economy-index",
    "human-labour-index",
    "humanoid-labour-index",
]
MEASURED_FIN = [
    "provenance-controls",
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
    "ai-adoption-components",
    "labour-components",
    "humanoid-labour-index",
]
MEASURED15 = [
    "governance",
    "safety",
    "provenance",
    "continuity",
    "conformance",
    "openness",
    "machinery-conformity",
    "care",
    "cross-reality",
    "detector-interop",
    "art5-safeguard",
    "swarm",
    "affect",
    "jail",
    "provenance-controls",
]


def test_eval_yaml_22_ready() -> None:
    text = EVAL22.read_text(encoding="utf-8")
    assert EVAL22.is_file()
    assert EVAL7.is_file()
    assert SCHEMA.is_file()
    for axis in FIN7 + MEASURED15 + MEASURED_FIN:
        assert f"id: {axis}" in text
    assert "art5-safeguard" in text
    assert "not collapsed into governance" in text
    assert "ready_is_not_measured: true" in text
    assert "TIE is not a win" in text
    for axis in FIN7:
        # UNMEASURED block exists; n: 0
        assert axis in text
    assert "compute_composite: false" in text


def test_seven_signed_unmeasured_coverage() -> None:
    for axis in FIN7:
        path = SKEL / f"coverage-{axis}.json"
        card = json.loads(path.read_text(encoding="utf-8"))
        payload = card.get("payload") or {}
        assert payload.get("status") == "UNMEASURED", axis
        assert payload.get("n") == 0, axis
        sig = card.get("sig_ed25519") or ""
        assert len(sig) >= 128, axis
        assert card.get("did") == "did:web:csoai.org#board-attestation-1", axis


def test_live_board_not_rewritten() -> None:
    req = urllib.request.Request("https://councilof.ai/api/gspc", headers={"User-Agent": "csoai-ready"})
    with urllib.request.urlopen(req, timeout=25) as r:
        g = json.loads(r.read())
    axes = {(a.get("axis") or a.get("id")): a for a in (g.get("axes") or [])}
    totals = g.get("totals") or {}
    assert totals.get("axes") == 22
    assert totals.get("measured_axes") == 22
    assert totals.get("unmeasured_axes") == 0
    assert totals.get("public_count") == "22 axis · 22 measured"
    for axis in MEASURED15:
        assert axes[axis]["status"] == "MEASURED", axis
    for axis in MEASURED_FIN:
        assert axes[axis]["status"] == "MEASURED", axis
        assert (axes[axis].get("n") or 0) > 0, axis
    assert "art5-safeguard" in axes
    assert axes["art5-safeguard"]["status"] == "MEASURED"


if __name__ == "__main__":
    test_eval_yaml_22_ready()
    test_seven_signed_unmeasured_coverage()
    test_live_board_not_rewritten()
    print("PASS gspc 22 READY (LIVE 22·22·0; fin7 skeletons stay UNMEASURED coverage; Art.5 not collapsed)")
