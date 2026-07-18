"""Tests for meok-sovereign-receipt-mcp."""
import os, tempfile, hashlib

_TEST_DIR = tempfile.mkdtemp(prefix="sov_rcpt_test_")
os.environ["SOV_RECEIPT_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_receipt_mcp import (
    create_receipt, verify_receipt, verify_chain,
    redact_pii, anchor_bitcoin, VERSION, PROTOCOL,
)


def test_create_receipt_basic():
    r = create_receipt({"event": "ai_decision", "outcome": "permit"})
    assert r["protocol"] == PROTOCOL
    assert r["version"] == VERSION
    assert "receipt_id" in r
    assert "prev_hash" in r
    assert "payload_sha256" in r
    assert "kid" in r and "sig" in r


def test_receipt_signed_with_sov_metadata():
    r = create_receipt({"event": "decision"}, bft_council_id="council-12of1", care_floor_validated=True)
    assert r["bft_council_id"] == "council-12of1"
    assert r["care_floor_validated"] is True


def test_verify_receipt_valid():
    r = create_receipt({"x": 1})
    v = verify_receipt(r)
    assert v["valid"] is True
    assert v["errors"] == []


def test_verify_receipt_tampered():
    r = create_receipt({"x": 1})
    r["payload"]["x"] = 999
    v = verify_receipt(r)
    assert v["valid"] is False


def test_verify_chain_intact():
    r1 = create_receipt({"step": 1})
    r2 = create_receipt({"step": 2}, prev_receipt=r1)
    r3 = create_receipt({"step": 3}, prev_receipt=r2)
    chain = verify_chain([r1, r2, r3])
    assert chain["valid"] is True
    assert chain["length"] == 3


def test_verify_chain_broken():
    r1 = create_receipt({"step": 1})
    r2 = create_receipt({"step": 2}, prev_receipt=r1)
    r2["payload"]["step"] = 999
    chain = verify_chain([r1, r2])
    assert chain["valid"] is False


def test_redact_email():
    r = redact_pii("Email me at john@example.com please")
    assert "<EMAIL>" in r["redacted"]
    assert "john@example.com" not in r["redacted"]


def test_redact_phone():
    r = redact_pii("Call +1 555 123 4567")
    assert "<PHONE>" in r["redacted"]


def test_redact_iban():
    r = redact_pii("Wire to DE89370400440532013000 please")
    assert "<IBAN>" in r["redacted"]


def test_redact_ssn():
    r = redact_pii("My SSN is 123-45-6789")
    assert "<SSN>" in r["redacted"]


def test_redact_jwt():
    r = redact_pii("Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U")
    assert "<JWT>" in r["redacted"]


def test_redact_private_key():
    r = redact_pii("-----BEGIN RSA PRIVATE KEY-----")
    assert "<PRIVATEKEY>" in r["redacted"]


def test_redact_multiple():
    r = redact_pii("Email john@example.com or call 555-123-4567")
    assert "<EMAIL>" in r["redacted"]
    assert "<PHONE>" in r["redacted"]
    assert len(r["kinds"]) == 2


def test_redact_select_kinds():
    r = redact_pii("Email john@example.com SSN 123-45-6789", kinds=["EMAIL"])
    assert "<EMAIL>" in r["redacted"]
    assert "123-45-6789" in r["redacted"]


def test_anchor_bitcoin_no_cli():
    r = create_receipt({"x": 1})
    a = anchor_bitcoin(r)
    assert a["status"] in ("no_ots_cli", "would_anchor")
