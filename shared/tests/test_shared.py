"""tests/test_shared.py — tests for the 5 consolidated shared modules.
EAT MODE: 29,300 LOC consolidated; these tests verify the canonical API.
"""
import pytest
from shared.governance import Governance, GovernanceCheck
from shared.validation import Validation, validate
from shared.ichar import create_ichar, IcharPersona, PARENT_ARCHETYPES
from shared.queens import QUEENS, QUEENS_BY_ID, QUEENS_BY_ARCHETYPE, load_queens
from shared.sigil import emit_sigil, SigilLine, append_sigil, hash_chain, SIGIL_CHAIN


def test_governance_canonical():
    g = Governance(framework="EU_AI_ACT")
    g.add_check("Article 50", True, "watermark present")
    g.add_check("100% UK soil", True, "no foreign API")
    assert g.evaluate() is True
    assert g.summary()["framework"] == "EU_AI_ACT"


def test_validation_canonical():
    v = Validation(name="Test")
    v.check(1 + 1 == 2, "math ok")
    assert v.is_valid() is True
    v.check(False, "oops")
    assert v.is_valid() is False
    assert "oops" in v.result()["errors"]


def test_ichar_canonical():
    p = create_ichar("nick", "sage", "Sir Nick")
    assert p.user_id == "nick"
    assert p.archetype == "sage"
    assert p.name == "Sir Nick"
    assert len(PARENT_ARCHETYPES) == 7


def test_queens_canonical():
    assert len(QUEENS) == 13
    assert "bee" in QUEENS_BY_ID
    assert "sovereign" in QUEENS_BY_ARCHETYPE
    assert sum(len(qs) for qs in QUEENS_BY_ARCHETYPE.values()) == 13


def test_sigil_canonical():
    s = emit_sigil("C|test|T2026-06-29T")
    assert isinstance(s, SigilLine)
    assert len(s.digest) == 16
    assert s.signature.startswith("ed25519-")


def test_sigil_chain():
    SIGIL_CHAIN.clear()
    s1 = append_sigil("C|first")
    s2 = append_sigil("C|second")
    s3 = append_sigil("C|third")
    assert s1.prev_sig == ""
    assert s2.prev_sig == s1.digest
    assert s3.prev_sig == s2.digest


def test_shared_init():
    import shared
    assert shared.__version__ == "1.0.0"
