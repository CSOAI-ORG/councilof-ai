#!/usr/bin/env python3.11
"""test_sovereign_corpus.py — pytest suite for the sovereign corpus builder.
Tests the real sibling-agent sovereign_corpus.py module."""
import sys
import json
import importlib.util
from pathlib import Path

import pytest

# Load the real module
spec = importlib.util.spec_from_file_location(
    'sovereign_corpus',
    '/Users/nicholas/clawd/meok-backend/sovereign_corpus.py'
)
sc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sc)


def test_1_module_loads():
    """Test 1: Module loads without errors."""
    assert hasattr(sc, 'main')
    assert hasattr(sc, 'build_full_corpus')
    assert hasattr(sc, 'SIGIL_PUBKEY')


def test_2_constants_present():
    """Test 2: All required constants are defined."""
    assert sc.ARCHETYPES is not None
    assert sc.ARCANA is not None
    assert sc.QUEENS is not None
    assert sc.TEMPLES is not None
    assert sc.MATERNAL_COVENANT is not None


def test_3_archetypes_count():
    """Test 3: 7 archetypes defined."""
    assert len(sc.ARCHETYPES) == 7
    # ARCHETYPES is a list of dicts
    names = [a['name'] for a in sc.ARCHETYPES]
    assert 'Sage' in names
    assert 'Healer' in names
    assert 'Builder' in names
    assert 'Guardian' in names


def test_4_arcana_count():
    """Test 4: 22 Major Arcana defined (0-21)."""
    assert len(sc.ARCANA) == 22


def test_5_queens_count():
    """Test 5: 13 queens + 1 king defined."""
    assert len(sc.QUEENS) == 13


def test_6_sigil_sign():
    """Test 6: SIGIL signing produces prefixed hex string."""
    sig = sc.sigil_sign('test_payload')
    # Format: "ed25519:sigil:<64 hex chars>"
    assert sig.startswith('ed25519:sigil:')
    hex_part = sig.split(':')[-1]
    assert len(hex_part) == 64
    assert all(c in '0123456789abcdef' for c in hex_part)


def test_7_hash_determinism():
    """Test 7: SIGIL sign is deterministic."""
    s1 = sc.sigil_sign('test_payload')
    s2 = sc.sigil_sign('test_payload')
    assert s1 == s2


def test_8_build_archetypes():
    """Test 8: build_archetypes returns valid records."""
    result = sc.build_archetypes()
    assert len(result) == 7
    for r in result:
        assert 'category' in r
        assert 'name' in r
        assert r['category'] == 'archetype'


def test_9_build_arcana():
    """Test 9: build_arcana returns 22 records."""
    result = sc.build_arcana()
    assert len(result) == 22


def test_10_build_queens():
    """Test 10: build_queens returns 13 records."""
    result = sc.build_queens()
    assert len(result) == 13


if __name__ == '__main__':
    test_1_module_loads()
    test_2_constants_present()
    test_3_archetypes_count()
    test_4_arcana_count()
    test_5_queens_count()
    test_6_sigil_sign()
    test_7_hash_determinism()
    test_8_build_archetypes()
    test_9_build_arcana()
    test_10_build_queens()
    print('✅ All 10 corpus tests pass')
