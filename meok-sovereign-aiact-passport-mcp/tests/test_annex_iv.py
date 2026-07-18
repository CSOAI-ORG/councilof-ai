"""Tests for the EU AI Act Annex IV bundle generator."""

import json
from pathlib import Path

import pytest

from sovereign_aiact_passport.annex_iv import (
    generate_annex_iv,
    load_template,
    ANNEX_IV_TEMPLATE,
)


SAMPLE_PASSPORT = {
    "report_id": "7f54374a9836282a",
    "name": "Acme Hospital Trust",
    "system": "acme-triage-bot",
    "body": {
        "system": "acme-triage-bot",
        "purpose": "patient self-triage",
        "result": {
            "tier": "high_risk",
            "version": "1.2.3",
        },
        "assessed_at": "2026-07-08T04:22:59Z",
    },
}


def test_load_template_succeeds():
    t = load_template()
    assert "_provenance" in t
    assert "items" in t
    assert len(t["items"]) == 9  # Annex IV items 1-9


def test_load_template_uses_default_path():
    t = load_template()
    # Should be the one in docs/
    assert "Annex IV" in t["_provenance"] or "AI Act" in t["_provenance"]


def test_load_template_missing_file_raises():
    with pytest.raises(FileNotFoundError):
        load_template(Path("/nonexistent/path/template.json"))


def test_ANNEX_IV_TEMPLATE_lazy_loaded():
    # After import the alias is set
    from sovereign_aiact_passport.annex_iv import ANNEX_IV_TEMPLATE as t2
    assert t2 is not None
    assert len(t2["items"]) == 9


def test_generate_annex_iv_returns_dict_with_9_items():
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,
        system_id="acme-triage-bot",
    )
    assert isinstance(bundle, dict)
    assert len(bundle["annex_iv_items"]) == 9


def test_generate_annex_iv_uses_system_id_from_passport():
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,
        system_id="override-me",
    )
    assert bundle["system_id"] == "override-me"  # system_id arg wins


def test_generate_annex_iv_captures_passport_id():
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,
        system_id="acme-triage-bot",
    )
    assert bundle["_passport_id"] == "7f54374a9836282a"


def test_generate_annex_iv_captures_provider_name_from_passport():
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,
        system_id="acme-triage-bot",
    )
    assert bundle["provider_name"] == "Acme Hospital Trust"


def test_generate_annex_iv_fills_item_1_from_passport():
    """Item 1 (general description) should pick up fields from passport body."""
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,
        system_id="acme-triage-bot",
    )
    item1 = next(i for i in bundle["annex_iv_items"] if i["item"] == 1)
    filled = {f["name"]: f["value"] for f in item1["fields_filled"]}
    assert filled.get("intended_purpose") == "patient self-triage"
    assert filled.get("system_id") == "acme-triage-bot"
    assert filled.get("provider_name") == "Acme Hospital Trust"
    assert filled.get("version") == "1.2.3"


def test_generate_annex_iv_infers_oversight_from_tier():
    """Item 9 (human oversight) — high_risk tier → human-in-the-loop."""
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,  # tier = high_risk
        system_id="acme-triage-bot",
    )
    item9 = next(i for i in bundle["annex_iv_items"] if i["item"] == 9)
    filled = {f["name"]: f["value"] for f in item9["fields_filled"]}
    assert filled.get("oversight_level") == "human-in-the-loop"
    assert filled.get("kill_switch") is True


def test_generate_annex_iv_limited_risk_default():
    """Item 9 — limited_risk tier → human-on-the-loop."""
    passport = dict(SAMPLE_PASSPORT)
    passport["body"] = dict(SAMPLE_PASSPORT["body"])
    passport["body"]["result"] = {"tier": "limited_risk"}
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=passport,
        system_id="acme-chatbot",
    )
    item9 = next(i for i in bundle["annex_iv_items"] if i["item"] == 9)
    filled = {f["name"]: f["value"] for f in item9["fields_filled"]}
    assert filled.get("oversight_level") == "human-on-the-loop"


def test_generate_annex_iv_marks_required_unfilled_for_missing_data():
    """If a passport has no `purpose`, Item 1 should mark intended_purpose as unfilled."""
    passport = {
        "report_id": "abc123",
        "body": {"result": {"tier": "minimal"}, "system": "minimalbot"},
    }
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=passport,
        system_id="minimalbot",
    )
    item1 = next(i for i in bundle["annex_iv_items"] if i["item"] == 1)
    # intended_purpose should NOT be in filled (because passport had no purpose)
    filled_names = {f["name"] for f in item1["fields_filled"]}
    unfilled_names = {f["name"] for f in item1["fields_unfilled"]}
    assert "intended_purpose" in unfilled_names
    assert "intended_purpose" not in filled_names


def test_generate_annex_iv_serializes_to_json():
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,
        system_id="acme-triage-bot",
    )
    # Should round-trip through JSON
    serialized = json.dumps(bundle, indent=2, sort_keys=False)
    parsed = json.loads(serialized)
    assert parsed["system_id"] == bundle["system_id"]
    assert parsed["_passport_id"] == bundle["_passport_id"]


def test_generate_annex_iv_carries_provenance_metadata():
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=SAMPLE_PASSPORT,
        system_id="acme-triage-bot",
    )
    assert "_template_v" in bundle
    assert "_honesty_register" in bundle
    assert "_generated_at" in bundle


def test_generate_annex_iv_handles_missing_body():
    passport = {"report_id": "abc123"}  # no body
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=passport,
        system_id="bare-minimum",
    )
    assert bundle["system_id"] == "bare-minimum"
    assert bundle["_passport_id"] == "abc123"
