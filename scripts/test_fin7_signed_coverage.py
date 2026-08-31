#!/usr/bin/env python3
"""Shipped FIN7 coverage cards must be UNMEASURED and Ed25519-signed via OIDC.

Reads public/interop/fin7-skeletons/coverage-*.json (the files Pages/Hub
mirrors). Never invents MEASURED. Never treats MetaMask as signer.
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SKEL = ROOT / "public" / "interop" / "fin7-skeletons"
EVAL = ROOT / "public" / "fleet" / "eval-fin7.yaml"

AXES = [
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
    "ai-economy-index",
    "human-labour-index",
    "humanoid-labour-index",
]
DID = "did:web:csoai.org#board-attestation-1"
ANTHROPIC_REV = "2ea58ff75e4247d26810c37f10c179edc2466cac"


def test_signed_unmeasured_coverage_cards() -> None:
    for axis in AXES:
        path = SKEL / f"coverage-{axis}.json"
        assert path.is_file(), f"missing {path}"
        card = json.loads(path.read_text(encoding="utf-8"))
        payload = card.get("payload") or {}
        sig = card.get("sig_ed25519") or ""
        assert payload.get("status") == "UNMEASURED", axis
        assert payload.get("n") == 0, axis
        assert payload.get("do_not_invent_percentage") is True, axis
        assert payload.get("metamask_is_signer") is False, axis
        assert card.get("did") == DID, axis
        assert isinstance(sig, str) and len(sig) >= 128, f"{axis} missing Ed25519"
        assert payload.get("axis") == axis, axis
        sk = SKEL / (
            {
                "reserve-attestation": "reserve-attestation.skeleton.json",
                "regulatory-framework": "regulatory-framework.skeleton.json",
                "distribution-integrity": "distribution-integrity.skeleton.json",
                "custody-disclosure": "custody-disclosure.skeleton.json",
                "ai-economy-index": "ai-economy-index.partial.json",
                "human-labour-index": "human-labour-index.partial.json",
                "humanoid-labour-index": "humanoid-labour-index.empty.json",
            }[axis]
        )
        assert sk.is_file(), f"missing skeleton {sk}"
        schema = ROOT / "public" / "fleet" / "input-schema.json"
        assert schema.is_file()


def test_anthropic_cadences_pin() -> None:
    text = EVAL.read_text(encoding="utf-8")
    assert ANTHROPIC_REV in text
    assert "release_2026_06_26" in text
    assert "compute_composite: false" in text
    assert "cited_component_unmeasured_until_pinned_release" not in text


if __name__ == "__main__":
    test_signed_unmeasured_coverage_cards()
    test_anthropic_cadences_pin()
    print("PASS fin7 signed UNMEASURED coverage + Anthropic Cadences pin")
