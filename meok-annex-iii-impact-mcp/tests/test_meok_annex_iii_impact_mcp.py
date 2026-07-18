"""Tests for meok-annex-iii-impact-mcp.

Hermetic, <1s, 12+ tests. Covers each tool's happy path, the 8 Annex III
categories triggering correctly, "not high-risk" classification, FRIA structure,
article compliance PASS/FAIL, Annex IV structure, Ed25519 signature roundtrip,
tamper, determinism, parallel-instance isolation, and JSON reversibility.
"""

from __future__ import annotations

import json
import multiprocessing
import re

import pytest

from meok_annex_iii_impact_mcp.server import (
    ANNEX_III_CATEGORIES,
    check_article_compliance,
    classify_system,
    generate_annex_iv_documentation,
    generate_fria,
)


# ---------------------------------------------------------------------------
# classify_system — happy path + each of the 8 categories
# ---------------------------------------------------------------------------
def test_classify_system_happy_path():
    out = classify_system(
        "AI that scores job candidates and ranks CVs for recruiters.",
        "Recruitment platform deployed to HR teams across the EU.",
    )
    assert out["status"] == "ok"
    assert "signature" in out
    assert isinstance(out["signature"], str) and len(out["signature"]) == 128
    assert out["classification"]["category_id"] == "employment_workers_management"
    assert 14 in out["applicable_articles"]
    assert 27 in out["applicable_articles"]
    assert 0.0 < out["confidence"] <= 0.99


@pytest.mark.parametrize(
    "category_id, description, context",
    [
        ("biometric_identification", "real-time face recognition at airport gates", "airport passenger processing"),
        ("critical_infrastructure", "predictive load balancing on the electricity grid", "national power grid operations"),
        ("education_and_vocational_training", "automated proctoring and exam grading for university students", "online examination platform"),
        ("employment_workers_management", "AI recruiter that screens resumes and schedules interviews", "HR department for a multinational"),
        ("access_to_essential_services", "credit scoring model that decides loan eligibility", "consumer banking"),
        ("law_enforcement", "predictive policing system used by police to forecast crime", "national police deployment"),
        ("migration_asylum_border_control", "automated visa and asylum application review", "border control agency"),
        ("justice_democratic_processes", "AI assisting judges in sentencing and ruling on cases", "national court system"),
    ],
)
def test_classify_system_each_of_8_categories(category_id, description, context):
    out = classify_system(description, context)
    assert out["status"] == "ok"
    assert out["classification"]["category_id"] == category_id, (
        f"Expected {category_id}, got {out['classification']['category_id']} "
        f"with hits {out['classification']['matched_keywords']}"
    )
    assert out["confidence"] > 0.0


def test_classify_system_not_high_risk():
    out = classify_system("a calendar reminder assistant", "internal productivity tool for a small team")
    assert out["classification"]["category_id"] == "not_high_risk"
    assert out["confidence"] == 0.0
    assert out["applicable_articles"] == []


def test_classify_system_invalid_input():
    with pytest.raises(ValueError):
        classify_system("   ", "deployment")
    with pytest.raises(ValueError):
        classify_system("desc", 12345)  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# generate_fria — structure + content
# ---------------------------------------------------------------------------
def test_generate_fria_happy_path():
    cls = classify_system("AI that screens job applicants", "recruitment")
    out = generate_fria("sys-001", cls["classification"])
    assert out["status"] == "ok"
    md = out["draft_document"]
    # 12 sections
    assert out["section_count"] == 12
    for n in range(1, 13):
        assert f"## {n}." in md
    # Article 27 reference and key requirements
    assert "Article 27" in md
    assert "Fundamental Rights" in md
    # Categories of affected persons are listed
    assert "Job applicants" in md or "applicants" in md
    # Ed25519 signature
    assert len(out["signature"]) == 128


def test_generate_fria_not_high_risk():
    cls = classify_system("a reminder bot", "internal tool")
    out = generate_fria("sys-002", cls["classification"])
    assert "Not high-risk" in out["draft_document"] or "DRAFT" in out["draft_document"]
    assert out["section_count"] == 12


def test_generate_fria_invalid_input():
    with pytest.raises(ValueError):
        generate_fria("", {"category_id": "x"})
    with pytest.raises(ValueError):
        generate_fria("ok", "not a dict")  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# check_article_compliance — PASS/FAIL/REVIEW
# ---------------------------------------------------------------------------
def test_check_article_compliance_pass_fail_review():
    system = {
        "risk_management_documented": True,    # Art. 9 -> PASS
        "data_governance_documented": True,     # Art. 10 -> PASS
        "transparency_documented": False,       # Art. 13 -> FAIL
        "human_oversight_documented": None,     # Art. 14 -> REVIEW
        # accuracy_robustness_documented (Art. 15) missing -> REVIEW
        "fria_documented": True,                # Art. 27 -> PASS
    }
    out = check_article_compliance(system, [9, 10, 13, 14, 15, 27])
    assert out["status"] == "ok"
    by_article = {r["article"]: r["status"] for r in out["results"]}
    assert by_article[9] == "PASS"
    assert by_article[10] == "PASS"
    assert by_article[13] == "FAIL"
    assert by_article[14] == "REVIEW"
    assert by_article[15] == "REVIEW"
    assert by_article[27] == "PASS"
    assert out["summary"]["overall"] == "FAIL"
    assert out["summary"]["fail"] == 1
    assert out["summary"]["review"] == 2
    assert out["summary"]["pass"] == 3


def test_check_article_compliance_all_pass():
    system = {
        "risk_management_documented": True,
        "data_governance_documented": True,
        "transparency_documented": True,
        "human_oversight_documented": True,
        "accuracy_robustness_documented": True,
        "fria_documented": True,
    }
    out = check_article_compliance(system, [9, 10, 13, 14, 15, 27])
    assert out["summary"]["overall"] == "PASS"
    assert out["summary"]["pass"] == 6
    assert out["summary"]["fail"] == 0
    assert out["summary"]["review"] == 0


def test_check_article_compliance_invalid_input():
    with pytest.raises(ValueError):
        check_article_compliance("not a dict", [9])  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        check_article_compliance({}, ["9"])  # type: ignore[list-item]


# ---------------------------------------------------------------------------
# generate_annex_iv_documentation
# ---------------------------------------------------------------------------
def test_generate_annex_iv_happy_path():
    system = {
        "name": "ai-credit-1",
        "version": "1.0.0",
        "provider": "ACME Bank N.V.",
        "intended_purpose": "credit eligibility scoring for consumer loans",
        "deployment_context": "EU consumer banking",
    }
    out = generate_annex_iv_documentation(system)
    assert out["status"] == "ok"
    draft = out["draft_document"]
    # All 9 sections present: draft keys are numbered 1_..9_ and `sections`
    # lists the un-prefixed canonical names. Each numbered key must end in one
    # of the canonical names.
    canonical_names = set(out["sections"])
    for i in range(1, 10):
        prefix_keys = [k for k in draft.keys() if k.startswith(f"{i}_")]
        assert prefix_keys, f"missing key prefix {i}_"
        # The single key for index i should end in one of the canonical names.
        for k in prefix_keys:
            assert k.endswith(tuple(canonical_names)), f"unrecognised key {k}"
    assert out["section_count"] == 9
    assert len(canonical_names) == 9
    # Content flows through from input
    assert draft["1_general_description"]["system_name"] == "ai-credit-1"
    assert draft["1_general_description"]["provider"] == "ACME Bank N.V."
    # JSON-reversible
    s = json.dumps(draft, sort_keys=True)
    assert isinstance(json.loads(s), dict)
    assert len(out["signature"]) == 128


def test_generate_annex_iv_invalid_input():
    with pytest.raises(ValueError):
        generate_annex_iv_documentation("not a dict")  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# Ed25519 signature: roundtrip, tamper, determinism
# ---------------------------------------------------------------------------
def test_signature_roundtrip_and_tamper():
    out = classify_system("AI that scores loan applicants", "consumer credit")
    sig = out["signature"]
    assert re.fullmatch(r"[0-9a-f]{128}", sig)
    # Tamper: flip one byte in matched_keywords and the signature should no longer match.
    tampered = dict(out)
    tampered["classification"] = {**out["classification"], "matched_keywords": ["xxxx" * 10]}
    # We re-import _verify locally to keep the test self-contained.
    from meok_annex_iii_impact_mcp.server import _canonical_json, _verify
    assert _verify(out, sig) is True
    assert _verify(tampered, sig) is False


def test_signature_determinism():
    a = classify_system("automated proctoring during university exams", "online education")
    b = classify_system("automated proctoring during university exams", "online education")
    assert a == b
    assert a["signature"] == b["signature"]


# ---------------------------------------------------------------------------
# Parallel instance isolation — no module-level mutable state
# ---------------------------------------------------------------------------
def _worker(returns_dict: dict, key: str, desc: str, ctx: str) -> None:
    """Run classify_system in a fresh interpreter so the result is independent of the parent process."""
    from meok_annex_iii_impact_mcp.server import classify_system
    out = classify_system(desc, ctx)
    # Strip the signature to compare structural equality — signatures are timestamp-agnostic
    # but a child process should be able to compute one independently and verify the same way.
    returns_dict[key] = {
        "category_id": out["classification"]["category_id"],
        "confidence": out["confidence"],
        "signature_ok": len(out["signature"]) == 128,
    }


def test_parallel_instances_no_shared_state():
    ctx = multiprocessing.get_context("spawn")
    with ctx.Manager() as manager:
        results = manager.dict()
        procs = [
            ctx.Process(target=_worker, args=(results, f"k{i}", "AI for predictive policing and crime hotspot mapping", "national police"))
            for i in range(3)
        ]
        for p in procs:
            p.start()
        for p in procs:
            p.join(timeout=10)
            assert p.exitcode == 0
        for i in range(3):
            assert dict(results)[f"k{i}"]["category_id"] == "law_enforcement"
            assert dict(results)[f"k{i}"]["signature_ok"] is True


# ---------------------------------------------------------------------------
# JSON reversibility
# ---------------------------------------------------------------------------
def test_envelope_json_reversible():
    out = classify_system("face recognition in a public square", "city surveillance")
    s = json.dumps(out, sort_keys=True)
    restored = json.loads(s)
    assert restored == out
    # and FRIA
    fria = generate_fria("sys-jr", out["classification"])
    s2 = json.dumps(fria, sort_keys=True)
    assert json.loads(s2) == fria


# ---------------------------------------------------------------------------
# Sanity: 8 categories are present in the catalog
# ---------------------------------------------------------------------------
def test_annex_iii_catalog_has_8_categories():
    assert len(ANNEX_III_CATEGORIES) == 8
    expected_ids = {
        "biometric_identification",
        "critical_infrastructure",
        "education_and_vocational_training",
        "employment_workers_management",
        "access_to_essential_services",
        "law_enforcement",
        "migration_asylum_border_control",
        "justice_democratic_processes",
    }
    assert set(ANNEX_III_CATEGORIES.keys()) == expected_ids
    for cat in ANNEX_III_CATEGORIES.values():
        assert cat["applicable_articles"]
        assert cat["keywords_for_classification"]
        assert cat["key_obligations"]
