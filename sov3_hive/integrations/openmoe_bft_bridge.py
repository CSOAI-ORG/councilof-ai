"""
openmoe_bft_bridge.py — A2A validation, EU AI Act evaluation, openmoe-bft bridge.
"""
from __future__ import annotations

import importlib
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple


def is_openmoe_bft_available() -> bool:
    try:
        importlib.import_module("openmoe_bft")
        return True
    except Exception:
        return False


REQUIRED_A2A_FIELDS = {
    "id", "name", "version", "description", "endpoints", "capabilities",
    "expert", "charter_alignment", "audit_endpoint",
}
VALID_EXPERT_FIELDS = {
    "EXP-CODE-01", "EXP-AUDIT-02", "EXP-VIS-03", "EXP-ETH-04",
    "EXP-RES-05", "EXP-DES-06", "EXP-STR-07", "EXP-DAT-08",
    "EXP-LAN-09", "EXP-SYS-10", "EXP-BRG-11", "EXP-DRM-12",
    "EXP-COMPLY-13", "EXP-CROSS-14",
}


def validate_a2a_card(card: Dict[str, Any]) -> Tuple[bool, List[str]]:
    missing = sorted(REQUIRED_A2A_FIELDS - set(card.keys()))
    if "expert" in card and isinstance(card["expert"], dict):
        if "id" in card["expert"] and card["expert"]["id"] not in VALID_EXPERT_FIELDS:
            missing.append(f"expert.id '{card['expert']['id']}' not in known expert set")
    if "charter_alignment" in card:
        ca = card["charter_alignment"]
        if isinstance(ca, list):
            for art in ca:
                if not isinstance(art, int) or not (1 <= art <= 52):
                    missing.append(f"charter_alignment has non-article ref: {art!r}")
    return (len(missing) == 0, missing)


EU_AI_ACT_CHECKS: Dict[str, Dict[str, Any]] = {
    "Art.5_prohibited":     {"severity": "blocker", "weight": 10},
    "Art.6_classification": {"severity": "blocker", "weight": 8},
    "Art.9_risk_management":{"severity": "major",   "weight": 6},
    "Art.10_data_governance":{"severity": "major",  "weight": 6},
    "Art.11_technical_docs":{"severity": "major",   "weight": 5},
    "Art.12_record_keeping":{"severity": "major",   "weight": 5},
    "Art.13_transparency":  {"severity": "major",   "weight": 5},
    "Art.14_human_oversight":{"severity": "blocker","weight": 8},
    "Art.15_accuracy":      {"severity": "minor",   "weight": 3},
    "Art.16_robustness":    {"severity": "major",   "weight": 5},
    "Art.52_provider_obligations": {"severity": "major", "weight": 6},
    "Art.53_provider_registration":{"severity": "minor", "weight": 4},
    "Art.54_post_market":   {"severity": "major",   "weight": 5},
    "Art.55_serious_incident":{"severity": "blocker","weight":8},
    "Art.69_standardisation":{"severity": "minor",  "weight": 3},
    "Art.70_codes_of_conduct":{"severity":"minor",   "weight": 3},
    "Art.71_sandbox":       {"severity": "minor",   "weight": 2},
    "Art.72_testing_real_world":{"severity":"major", "weight": 4},
    "Art.73_governance":    {"severity": "major",   "weight": 5},
    "Art.74_enforcement":   {"severity": "major",   "weight": 5},
}


def evaluate_eu_ai_act(evidence: Dict[str, Any]) -> Dict[str, Any]:
    total_w = sum(c["weight"] for c in EU_AI_ACT_CHECKS.values())
    earned = 0.0
    blockers: List[str] = []
    per_article: Dict[str, Any] = {}
    for art, meta in EU_AI_ACT_CHECKS.items():
        ev = evidence.get(art, False)
        if isinstance(ev, dict):
            present = bool(ev.get("present"))
            note = ev.get("note", "")
        else:
            present = bool(ev)
            note = ""
        if present:
            earned += meta["weight"]
        elif meta["severity"] == "blocker":
            blockers.append(art)
        per_article[art] = {"present": present, "note": note, "severity": meta["severity"]}
    score = round(100.0 * earned / total_w, 2) if total_w else 0.0
    return {
        "score": score,
        "passed": len([a for a, v in per_article.items() if v["present"]]),
        "total_articles": len(EU_AI_ACT_CHECKS),
        "blockers": blockers,
        "per_article": per_article,
    }


@dataclass
class OpenMoEBridge:
    available: bool

    def __post_init__(self) -> None:
        self.available = is_openmoe_bft_available()
        if self.available:
            try:
                self._bft = importlib.import_module("openmoe_bft.bft")
            except Exception:
                self.available = False
                self._bft = None
        else:
            self._bft = None

    def ledger_info(self) -> Dict[str, Any]:
        if self.available and self._bft is not None:
            return {"backend": "openmoe-bft", "module": self._bft.__name__}
        return {"backend": "in-hive BFT (2f+1 simplified)", "module": "core.king_hive"}
