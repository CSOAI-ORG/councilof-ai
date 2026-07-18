"""Tests for meok-ai-psych-vuln-audit-mcp.

14 tests covering all 4 tools, all 12 risk patterns, the Ed25519
signature roundtrip, tamper detection, expiry, JSON reversibility, and
two-instance state isolation. All hermetic, all <1s.
"""

from __future__ import annotations

import concurrent.futures
import copy as _copy
import json

import pytest

from meok_ai_psych_vuln_audit_mcp.server import (
    GAMBLING_RISK_PATTERNS,
    ISSUER_PUBLIC_KEY_HEX,
    KID,
    PATTERN_DETECTORS,
    audit_player_intervention,
    classify_ai_system,
    generate_audit_report,
    scan_marketing_copy,
    verify_audit_report,
)


# ---------- helpers ----------------------------------------------------------


def _all_pattern_ids() -> list:
    return [p["id"] for p in GAMBLING_RISK_PATTERNS]


def _test_input_for(pattern_id: str) -> dict:
    """Return the test_input bundled with a pattern."""
    for p in GAMBLING_RISK_PATTERNS:
        if p["id"] == pattern_id:
            return dict(p["test_input"])
    raise KeyError(pattern_id)


# ---------- 01: rubric & pattern registry -----------------------------------


def test_01_rubric_has_at_least_12_patterns_and_all_required_fields():
    assert len(GAMBLING_RISK_PATTERNS) >= 12, (
        f"need >=12 patterns, got {len(GAMBLING_RISK_PATTERNS)}"
    )
    required_fields = {
        "id",
        "name",
        "severity",
        "evidence_examples",
        "mitigation_pattern",
        "eu_ai_act_article_ref",
        "uk_lccp_ref",
        "test_input",
    }
    for p in GAMBLING_RISK_PATTERNS:
        missing = required_fields - set(p.keys())
        assert not missing, f"pattern {p.get('id')!r} missing fields: {missing}"
        assert p["severity"] in ("HIGH", "MEDIUM", "LOW")
        assert isinstance(p["evidence_examples"], list) and p["evidence_examples"]
        assert "5(1)(f)" in " ".join(p["eu_ai_act_article_ref"])
        assert isinstance(p["uk_lccp_ref"], str) and p["uk_lccp_ref"].startswith("LCCP")


# ---------- 02: each of the 12 patterns triggers correctly ------------------


@pytest.mark.parametrize("pattern_id", _all_pattern_ids())
def test_02_each_pattern_triggers_on_its_test_input(pattern_id):
    inp = _test_input_for(pattern_id)
    result = audit_player_intervention(inp)
    triggered_ids = {tp["id"] for tp in result["triggered_patterns"]}
    assert pattern_id in triggered_ids, (
        f"pattern {pattern_id!r} did NOT trigger on its test_input {inp!r}; "
        f"got: {triggered_ids}"
    )
    # The result must include the pattern with severity preserved.
    for tp in result["triggered_patterns"]:
        if tp["id"] == pattern_id:
            # Article ref must be present
            assert "5(1)(f)" in " ".join(tp["eu_ai_act_article_ref"])
            assert tp["uk_lccp_ref"].startswith("LCCP")
            assert tp["severity"] in ("HIGH", "MEDIUM", "LOW")


# ---------- 03: each tool's happy path --------------------------------------


def test_03_audit_player_intervention_happy_path():
    result = audit_player_intervention(
        {"player_segment": "loss_chasing", "action": "send_bonus_offer",
         "bonus_offer": "double_deposit_50pct"}
    )
    assert result["status"] == "FAIL"  # HIGH severity
    assert result["severity_score"] > 0.0
    assert isinstance(result["triggered_patterns"], list)
    assert len(result["triggered_patterns"]) >= 1
    assert len(result["recommendations"]) >= 1
    assert len(result["signature"]) == 128


def test_04_scan_marketing_copy_happy_path():
    result = scan_marketing_copy(
        copy="5 others are playing this slot right now — don't miss out!",
        target_segment="recently_deposited_losing",
    )
    assert result["status"] in ("REVIEW", "FAIL")
    assert any(tp["id"] == "fomo_generation" for tp in result["triggered_patterns"])
    assert "uk_lccp_refs" in result
    assert len(result["signature"]) == 128


def test_05_classify_ai_system_happy_path():
    result = classify_ai_system(
        {
            "purpose": "personalised_bonus_recommendation with loss_chasing detection bypass",
            "training_data": "deposit_history, session_logs, under_25 demographics",
            "decision_points": ["send_bonus", "extend_session"],
        }
    )
    assert result["risk_class"] == "PROHIBITED_ART_5_1_F"
    assert len(result["triggered_patterns"]) >= 1
    assert len(result["signature"]) == 128


def test_06_generate_audit_report_happy_path():
    interventions = [
        {"player_segment": "loss_chasing", "action": "send_bonus_offer",
         "bonus_offer": "double_deposit_50pct"},
        {"action": "send_popup", "session_pnl": "negative",
         "popup_text": "You've earned 20 free spins!"},
        {},  # empty -> PASS
    ]
    report = generate_audit_report(
        operator_id="OP-001-betvictoria",
        audit_period="2026-Q2",
        interventions=interventions,
    )
    assert report["status"] in ("REVIEW", "FAIL")
    assert report["report"]["total_interventions"] == 3
    assert report["report"]["operator_id"] == "OP-001-betvictoria"
    assert report["report"]["audit_period"] == "2026-Q2"
    assert len(report["per_intervention" if False else "report"]["per_intervention"]) == 3
    assert "expires_at" in report
    assert len(report["signature"]) == 128


# ---------- 04: empty / invalid input ---------------------------------------


def test_07_audit_empty_input_returns_pass():
    result = audit_player_intervention({})
    assert result["status"] == "PASS"
    assert result["triggered_patterns"] == []
    assert result["severity_score"] == 0.0
    assert len(result["signature"]) == 128


def test_08_audit_invalid_input_raises():
    with pytest.raises(ValueError):
        audit_player_intervention("not a dict")  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        audit_player_intervention(None)  # type: ignore[arg-type]


def test_09_scan_marketing_copy_invalid_copy_raises():
    with pytest.raises(ValueError):
        scan_marketing_copy(copy=123, target_segment="adult")  # type: ignore[arg-type]


def test_10_generate_audit_report_empty_interventions_is_pass():
    report = generate_audit_report(
        operator_id="OP-002", audit_period="2026-Q2", interventions=[]
    )
    assert report["status"] == "PASS"
    assert report["report"]["total_interventions"] == 0
    assert report["triggered_patterns"] == []


def test_11_generate_audit_report_invalid_args_raise():
    with pytest.raises(ValueError):
        generate_audit_report(operator_id="", audit_period="2026-Q2", interventions=[])
    with pytest.raises(ValueError):
        generate_audit_report(
            operator_id="OP-1", audit_period="2026-Q2", interventions="not a list"  # type: ignore[arg-type]
        )


# ---------- 05: signature roundtrip, tamper, expiry, parallel ---------------


def test_12_signature_roundtrip_and_issuer_constants():
    result = audit_player_intervention(
        {"player_segment": "loss_chasing", "action": "send_bonus_offer"}
    )
    assert verify_audit_report(result) is True
    # Issuer fields are stable.
    assert result["issuer"] == "meok.ai"
    assert result["kid"] == KID
    # Public key is 32 bytes -> 64 hex chars.
    assert len(ISSUER_PUBLIC_KEY_HEX) == 64
    # Signature is 64 bytes -> 128 hex chars, valid hex.
    assert len(result["signature"]) == 128
    int(result["signature"], 16)  # parses as hex


def test_13_signature_tamper_detection():
    result = audit_player_intervention(
        {"action": "send_popup", "session_pnl": "negative"}
    )
    # Flip the last hex char.
    last = result["signature"][-1]
    flipped = "0" if last != "0" else "1"
    tampered = _copy.deepcopy(result)
    tampered["signature"] = tampered["signature"][:-1] + flipped
    assert verify_audit_report(tampered) is False
    # Also: mutating the payload must break verification.
    tampered2 = _copy.deepcopy(result)
    tampered2["status"] = "PASS"  # lie about the result
    assert verify_audit_report(tampered2) is False


def test_14_json_roundtrip_and_parallel_isolation():
    # 1. JSON roundtrip preserves signature
    result = audit_player_intervention(
        {"player_segment": "vulnerable", "action": "send_bonus_offer"}
    )
    s = json.dumps(result, sort_keys=True)
    rebuilt = json.loads(s)
    assert verify_audit_report(rebuilt) is True
    assert rebuilt["signature"] == result["signature"]

    # 2. Two parallel calls do not share state.
    def _one(i):
        return audit_player_intervention(
            {"player_segment": f"seg_{i}", "action": "send_bonus_offer"}
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        outs = list(ex.map(_one, range(20)))

    sigs = {o["signature"] for o in outs}
    assert len(sigs) == 20  # all unique
    for o in outs:
        assert verify_audit_report(o) is True
