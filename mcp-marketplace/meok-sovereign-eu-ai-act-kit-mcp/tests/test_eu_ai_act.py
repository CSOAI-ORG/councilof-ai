"""Tests for meok-sovereign-eu-ai-act-kit-mcp."""
import os, tempfile

_TEST_DIR = tempfile.mkdtemp(prefix="sov_eu_test_")
os.environ["SOV_EU_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_eu_ai_act_kit_mcp import (
    sov_eu_act_audit, sov_annex_iv_generate, sov_oscal_policy,
    sov_bias_audit, sov_submit_evidence, ARTICLES, VERSION, PROTOCOL,
)


def test_audit_basic():
    r = sov_eu_act_audit("def main(): audit trail with tamper evident logging")
    assert r["protocol"] == PROTOCOL
    assert r["regulation"] == "EU AI Act (Regulation EU 2024/1689)"
    assert r["deadline"] == "2026-08-02"
    assert "art_9" in r["article_results"]
    assert "art_50" in r["article_results"]
    assert "kid" in r and "sig" in r


def test_audit_with_kill_switch_passes():
    r = sov_eu_act_audit("human in the loop with kill switch and tamper evident audit trail")
    assert r["overall_pass"] is True


def test_audit_without_kill_switch_fails():
    r = sov_eu_act_audit("minimal code without safety features")
    assert r["overall_pass"] is False


def test_annex_iv_generate():
    r = sov_annex_iv_generate("sovereign-globe-mcp", description="Cesium + deck.gl + force graph")
    assert "annex_id" in r
    assert "1_general_description" in r["sections"]
    assert "8_human_oversight" in r["sections"]
    assert r["sections"]["6_record_keeping"].startswith("Per Art. 12")


def test_oscal_policy():
    r = sov_oscal_policy("sovereign-globe-mcp")
    assert r["oscal_version"] == "1.1.2"
    assert len(r["controls"]) == len(ARTICLES)


def test_bias_audit_passes():
    groups = [
        {"name": "group_a", "positive_rate": 0.75},
        {"name": "group_b", "positive_rate": 0.74},
    ]
    r = sov_bias_audit("test-system", dataset_summary={"groups": groups, "base_rate": 0.5})
    assert r["passes_80pct_rule"] is True
    assert r["disparate_impact_ratio"] >= 0.8


def test_bias_audit_fails():
    groups = [
        {"name": "group_a", "positive_rate": 0.9},
        {"name": "group_b", "positive_rate": 0.3},
    ]
    r = sov_bias_audit("biased-system", dataset_summary={"groups": groups})
    assert r["passes_80pct_rule"] is False


def test_bias_audit_no_groups():
    r = sov_bias_audit("test", dataset_summary={})
    assert "error" in r


def test_submit_evidence():
    r = sov_submit_evidence(["audit-1", "audit-2"], authority="EU AI Office (Brussels)")
    assert r["authority"] == "EU AI Office (Brussels)"
    assert "bundle_id" in r
    assert len(r["audit_ids"]) == 2


def test_all_signed():
    r = sov_eu_act_audit("test")
    assert "kid" in r and "sig" in r
    assert r["verify_url"]
