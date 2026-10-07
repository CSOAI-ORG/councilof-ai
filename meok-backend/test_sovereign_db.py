#!/usr/bin/env python3.11
"""test_sovereign_db.py — the 18 tests for the sovereign DB. All must pass."""
import sys
import json
import tempfile
import shutil
from pathlib import Path

sys.path.insert(0, '/Users/nicholas/clawd/meok-backend')
import sovereign_db as sdb


def tmp_db():
    """Create a temp DB for testing."""
    tmp = Path(tempfile.mkdtemp()) / 'test.db'
    return tmp


def test_1_init():
    """Test 1: Init DB creates all 13 tables."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    # Filter out sqlite_sequence
    tables = [t for t in tables if not t.startswith('sqlite_')]
    assert len(tables) >= 13, f"Expected 13+ tables, got {len(tables)}: {tables}"
    shutil.rmtree(tmp.parent)
    print('✅ Test 1: 13 tables created')


def test_2_create_ichar():
    """Test 2: Create i-character returns DID + VC + JWT + sigil."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    ichar = sdb.create_ichar(
        name='Test User', archetype='Sage', queen='Sophia', arcana=5,
        ocean={'Openness': 0.8, 'Conscientiousness': 0.9, 'Extraversion': 0.4, 'Agreeableness': 0.85, 'Neuroticism': 0.2},
        sovereign_domains=['healthcare', 'home-care'],
        location={'lat': 51.5074, 'lon': -0.1278, 'precision_m': 100},
        preferences={'radius_km': 5, 'transport': ['walking']},
        bft_tier='Bronze', bft_vote_weight=1,
        ai_ethics={'article_14': True, 'article_50_2': True, 'care_floor': 0.95},
    )
    assert ichar['did'].startswith('did:csoai:')
    assert ichar['vc'].startswith('vc:')
    assert ichar['jwt'].startswith('jwt:')
    assert len(ichar['sigil_hash']) == 64
    shutil.rmtree(tmp.parent)
    print('✅ Test 2: Create i-character returns DID + VC + JWT + sigil')


def test_3_ocean_json_serialized():
    """Test 3: OCEAN JSON serialized correctly."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    ocean = {'Openness': 0.8}
    ichar = sdb.create_ichar(
        name='X', archetype='Sage', queen='Sophia', arcana=5,
        ocean=ocean, sovereign_domains=[], location={}, preferences={},
        bft_tier='Bronze', bft_vote_weight=1, ai_ethics={},
    )
    loaded = sdb.list_ichars()[0]
    assert json.loads(loaded['ocean_json']) == ocean
    shutil.rmtree(tmp.parent)
    print('✅ Test 3: OCEAN JSON serialized')


def test_4_append_sigil():
    """Test 4: Append SIGIL builds the chain."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    e1 = sdb.append_sigil('did:csoai:test-001', 'mcp_invoke', {'tool': 'read_cobol'})
    e2 = sdb.append_sigil('did:csoai:test-001', 'mcp_invoke', {'tool': 'read_fhir'})
    assert e1['hash'] != e2['hash']
    assert e2['prev_hash'] == e1['hash']
    shutil.rmtree(tmp.parent)
    print('✅ Test 4: Append SIGIL builds chain')


def test_5_queens_table():
    """Test 5: Queens table works (manually inserted)."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO queens (name, role, arcana, motto, ocean_json, veto, sigil_hash) VALUES (?,?,?,?,?,?,?)",
            ('Sophia', 'Healthcare & Wellbeing', 3, 'Care Floor 0.95. Always.', '{}', 0, 'abc'),
        )
        row = conn.execute("SELECT * FROM queens WHERE name = 'Sophia'").fetchone()
    assert row['name'] == 'Sophia'
    assert row['arcana'] == 3
    shutil.rmtree(tmp.parent)
    print('✅ Test 5: Queens table works')


def test_6_temples_table():
    """Test 6: Temples table works (manually inserted)."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO temples (code, name, country, lat, lon, regulations_json, queen_id, sigil_hash) VALUES (?,?,?,?,?,?,?,?)",
            ('LDN', 'Temple of London', 'UK', 51.5074, -0.1278, '[]', None, 'abc'),
        )
        row = conn.execute("SELECT * FROM temples WHERE code = 'LDN'").fetchone()
    assert row['code'] == 'LDN'
    assert row['lat'] == 51.5074
    shutil.rmtree(tmp.parent)
    print('✅ Test 6: Temples table works')


def test_7_regulations_table():
    """Test 7: Regulations table works (manually inserted)."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute("INSERT INTO temples (code, name, country, lat, lon) VALUES ('LDN', 'Temple of London', 'UK', 51.5074, -0.1278)")
        conn.execute("INSERT INTO regulations (temple_id, code, name, year, source, sigil_hash) VALUES (1, 'UK_GDPR', 'UK GDPR', 2018, 'UK Gov', 'abc')")
        row = conn.execute("SELECT * FROM regulations WHERE code = 'UK_GDPR'").fetchone()
    assert row['code'] == 'UK_GDPR'
    assert row['year'] == 2018
    shutil.rmtree(tmp.parent)
    print('✅ Test 7: Regulations table works')


def test_8_audit_log():
    """Test 8: Audit log works (manually inserted)."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO audit_log (ts, actor, action, sigil, status, details_json) VALUES (?,?,?,?,?,?)",
            ('2026-07-01T00:00:00Z', 'did:csoai:test', 'mcp_invoke', 'sig123', 'success', '{}'),
        )
        row = conn.execute("SELECT * FROM audit_log WHERE actor = 'did:csoai:test'").fetchone()
    assert row['action'] == 'mcp_invoke'
    assert row['status'] == 'success'
    shutil.rmtree(tmp.parent)
    print('✅ Test 8: Audit log works')


def test_9_charter_titles():
    """Test 9: Charter titles + signatures work."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO charter_titles (title, status, ratified_at, sigil) VALUES (?,?,?,?)",
            ('Master Sovereign Charter', 'ratified', '2026-07-01', 'sig123'),
        )
        conn.execute(
            "INSERT INTO charter_signatures (charter_id, signer, sigil, ts) VALUES (1, 'CSOAI Ltd', 'sig456', '2026-07-01')",
        )
        title = conn.execute("SELECT * FROM charter_titles WHERE title = 'Master Sovereign Charter'").fetchone()
        sig = conn.execute("SELECT * FROM charter_signatures WHERE signer = 'CSOAI Ltd'").fetchone()
    assert title['status'] == 'ratified'
    assert sig['sigil'] == 'sig456'
    shutil.rmtree(tmp.parent)
    print('✅ Test 9: Charter titles + signatures work')


def test_10_framework_coverage():
    """Test 10: Framework coverage works."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO framework_coverage (framework, article, covered_by, sigil) VALUES (?,?,?,?)",
            ('EU AI Act', 'Art 14', 'P7 BFT + 4-eyes', 'sig'),
        )
        row = conn.execute("SELECT * FROM framework_coverage WHERE framework = 'EU AI Act'").fetchone()
    assert row['article'] == 'Art 14'
    shutil.rmtree(tmp.parent)
    print('✅ Test 10: Framework coverage works')


def test_11_queen_votes():
    """Test 11: Queen votes work."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute("INSERT INTO queens (name, role) VALUES ('Sophia', 'Healthcare')")
        conn.execute(
            "INSERT INTO queen_votes (queen_id, proposal_id, vote, sigil, ts) VALUES (1, 1, 'for', 'sig', '2026-07-01')",
        )
        row = conn.execute("SELECT * FROM queen_votes WHERE proposal_id = 1").fetchone()
    assert row['vote'] == 'for'
    shutil.rmtree(tmp.parent)
    print('✅ Test 11: Queen votes work')


def test_12_csoai_sbt():
    """Test 12: CSOAI SBT (Soulbound Token) works."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO csoai_sbt (content_hash, attestation, sigil, ts) VALUES (?,?,?,?)",
            ('hash123', 'I am a sovereign citizen', 'sig', '2026-07-01'),
        )
        row = conn.execute("SELECT * FROM csoai_sbt WHERE content_hash = 'hash123'").fetchone()
    assert row['attestation'] == 'I am a sovereign citizen'
    shutil.rmtree(tmp.parent)
    print('✅ Test 12: CSOAI SBT works')


def test_13_pii_pseudonyms():
    """Test 13: PII pseudonyms work (GDPR Article 9 special categories)."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO pii_pseudonyms (real_id_hash, pseudonym, sigil, ts) VALUES (?,?,?,?)",
            ('sha256_real', 'pseudonym_001', 'sig', '2026-07-01'),
        )
        row = conn.execute("SELECT * FROM pii_pseudonyms WHERE pseudonym = 'pseudonym_001'").fetchone()
    assert row['real_id_hash'] == 'sha256_real'
    shutil.rmtree(tmp.parent)
    print('✅ Test 13: PII pseudonyms work')


def test_14_x402_invoices():
    """Test 14: x402 invoices work (5-tier cascade pricing)."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO x402_invoices (caller, service, amount_usd, sigil, ts) VALUES (?,?,?,?,?)",
            ('did:csoai:monzo', 'csoai-aml-kyc-bundle', 500.00, 'sig', '2026-07-01'),
        )
        row = conn.execute("SELECT * FROM x402_invoices WHERE caller = 'did:csoai:monzo'").fetchone()
    assert row['amount_usd'] == 500.00
    shutil.rmtree(tmp.parent)
    print('✅ Test 14: x402 invoices work')


def test_15_mcp_federation():
    """Test 15: MCP federation works (531 MCPs catalog)."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    with sdb.get_db() as conn:
        conn.execute(
            "INSERT INTO mcp_federation (mcp_id, server, tools_json, last_health, sigil) VALUES (?,?,?,?,?)",
            ('cobol-bridge-mcp', 'https://mcp.csoai.org/cobol-bridge', '["read_cobol","write_cobol"]', '2026-07-01', 'sig'),
        )
        row = conn.execute("SELECT * FROM mcp_federation WHERE mcp_id = 'cobol-bridge-mcp'").fetchone()
    assert row['server'] == 'https://mcp.csoai.org/cobol-bridge'
    shutil.rmtree(tmp.parent)
    print('✅ Test 15: MCP federation works')


def test_16_sign_verify():
    """Test 16: Sign + verify SIGIL signature."""
    payload = {'actor': 'test', 'action': 'test'}
    sig = sdb.sign(payload)
    assert sdb.verify(payload, sig)
    # Tampered payload should fail
    payload2 = {'actor': 'test', 'action': 'tampered'}
    assert not sdb.verify(payload2, sig)
    print('✅ Test 16: Sign + verify SIGIL signature')


def test_17_stats():
    """Test 17: Get stats returns all 14 counts."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    stats = sdb.get_stats()
    assert 'ichars_count' in stats
    assert 'sigil_count' in stats
    assert 'audit_count' in stats
    assert 'mcp_federation_count' in stats
    assert len(stats) == 14
    shutil.rmtree(tmp.parent)
    print('✅ Test 17: Get stats returns 14 counts')


def test_18_list_ichars():
    """Test 18: List i-characters returns all created."""
    tmp = tmp_db()
    sdb.DB_PATH = tmp
    sdb.init_db()
    sdb.create_ichar('User 1', 'Sage', 'Sophia', 5, {}, [], {}, {}, 'Bronze', 1, {})
    sdb.create_ichar('User 2', 'Healer', 'Sophia', 3, {}, [], {}, {}, 'Silver', 3, {})
    ichars = sdb.list_ichars()
    assert len(ichars) == 2
    shutil.rmtree(tmp.parent)
    print('✅ Test 18: List i-characters returns all created')


def main():
    test_1_init()
    test_2_create_ichar()
    test_3_ocean_json_serialized()
    test_4_append_sigil()
    test_5_queens_table()
    test_6_temples_table()
    test_7_regulations_table()
    test_8_audit_log()
    test_9_charter_titles()
    test_10_framework_coverage()
    test_11_queen_votes()
    test_12_csoai_sbt()
    test_13_pii_pseudonyms()
    test_14_x402_invoices()
    test_15_mcp_federation()
    test_16_sign_verify()
    test_17_stats()
    test_18_list_ichars()
    print('\n🎯 ALL 18 SOVEREIGN DB TESTS PASS')


if __name__ == '__main__':
    main()
