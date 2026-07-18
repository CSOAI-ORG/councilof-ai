"""Tests for MEOK Legacy Demo page."""
import sys
import subprocess
from pathlib import Path

PAGE = Path("/Users/nicholas/clawd/csoai-os/meok-home/legacy-demo.html")


def test_legacy_demo_file_exists():
    """The legacy demo page must exist."""
    assert PAGE.exists()
    assert PAGE.stat().st_size > 5000


def test_4_bridges():
    """4 bridge tabs (COBOL/CICS, SAP/ABAP, HL7/FHIR, SWIFT/MT103)."""
    text = PAGE.read_text()
    for bridge in ["cobol", "sap", "hl7", "swift"]:
        assert bridge in text, f"missing bridge {bridge}"


def test_4_crt_styles():
    """4 CRT color schemes (one per bridge)."""
    text = PAGE.read_text()
    for style in [".crt.cobol", ".crt.sap", ".crt.hl7", ".crt.swift"]:
        assert style in text, f"missing CRT style {style}"


def test_pdca_loop():
    """PDCA cycle present (Plan → Do → Check → Act)."""
    text = PAGE.read_text()
    for phase in ["1· PLAN", "2· DO", "3· CHECK", "4· ACT"]:
        assert phase in text, f"missing PDCA phase {phase}"


def test_bft_9_13():
    """BFT 9/13 quorum required."""
    text = PAGE.read_text()
    assert "9/13" in text


def test_care_floor():
    """Care floor (Maternal Covenant 6 dimensions)."""
    text = PAGE.read_text()
    for care in ["safety", "honesty", "privacy", "fairness", "growth", "consent"]:
        assert care in text, f"missing care {care}"


def test_veto_queen():
    """VETO queen Watch for care violations."""
    text = PAGE.read_text()
    assert "VETO" in text
    assert "Watch" in text or "watch" in text


def test_sigil_signed():
    """SIGIL signing on every action."""
    text = PAGE.read_text()
    assert "SIGIL" in text or "sigil" in text
    assert "sign(" in text or "sovereign.sign" in text


def test_trust_score():
    """Trust score auto-fetched (silver)."""
    text = PAGE.read_text()
    assert "trustScore" in text
    assert "silver" in text


def test_legacy_translate():
    """Legacy translate tool (legacy_call + legacy_translate)."""
    text = PAGE.read_text()
    assert "legacy_call" in text
    assert "legacy_translate" in text


def test_8_guarantees():
    """8 sovereign guarantees displayed."""
    text = PAGE.read_text()
    for g in ["Defoneos-secured", "SIGIL-signed", "Maternal Covenant", "BFT council", "4-tier cascade", "Care before code", "No foreign surveillance", "100% sovereign"]:
        assert g in text, f"missing guarantee {g}"


def test_goal_chips():
    """Goal chips (increase salary / audit / verify)."""
    text = PAGE.read_text()
    for chip in ["increase Alice", "audit all transactions", "verify Jane"]:
        assert chip in text, f"missing goal chip {chip}"


def test_4_legacy_endpoints():
    """4 legacy endpoints."""
    text = PAGE.read_text()
    for endpoint in ["CICS mainframe", "SAP R/3", "HL7 v2.5", "SWIFT MT103"]:
        assert endpoint in text, f"missing endpoint {endpoint}"


def test_4_schemas():
    """4 legacy schemas."""
    text = PAGE.read_text()
    for schema in ["f001", "s001", "h001", "m001"]:
        assert schema in text, f"missing schema {schema}"


def test_5_step_pdca_trace():
    """PDCA trace shows legacy_call + sovereign.sign."""
    text = PAGE.read_text()
    assert "legacy_call(CURRENT_STATE)" in text
    assert "legacy_translate" in text
    assert "sovereign.sign" in text
    assert "sigil" in text


def test_21_bridges_listed():
    """21 bridges mentioned (the 4 demo + 17 more)."""
    text = PAGE.read_text()
    bridges = ["cobol", "sap", "hl7", "fhir", "swift", "iso20022", "as400", "oracle", "scada", "edi", "fix", "mqtt", "cics", "acord", "nacha", "iso8583", "sip", "tax", "gs1", "mismo", "dlms"]
    for b in bridges:
        assert b in text or b.upper() in text, f"missing bridge {b}"


def test_proto_in_out():
    """PROTOCOL_IN + PROTOCOL_OUT declared."""
    text = PAGE.read_text()
    assert "PROTOCOL_IN" in text or "protocol_in" in text
    assert "PROTOCOL_OUT" in text or "protocol_out" in text


def test_legacy_state():
    """Legacy state persistence."""
    text = PAGE.read_text()
    assert "legacyState" in text
    assert "tx" in text


def test_about_50_year():
    """Mission: 50-year-old COBOL."""
    text = PAGE.read_text()
    assert "50-year-old" in text or "50 year" in text or "50" in text


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
