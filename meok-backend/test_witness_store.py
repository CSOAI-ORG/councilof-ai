#!/usr/bin/env python3.11
"""test_witness_store.py — 7 tests for the Sovereign Witness store. All must pass."""
import sys
import json
import tempfile
import shutil
from pathlib import Path

sys.path.insert(0, '/Users/nicholas/clawd/meok-backend')
from witness_store import SovereignWitness, init_db, DB_PATH


def _tmp_db():
    """Create a temporary DB for testing."""
    tmp = Path(tempfile.mkdtemp()) / 'witness.db'
    return tmp


def test_1_init():
    """Test 1: Init DB creates schema."""
    tmp = _tmp_db()
    w = SovereignWitness(db_path=tmp)
    stats = w.stats()
    # Just verify the schema is created — counts may be non-zero if DB is persistent
    for key in ['sigil_count', 'audit_count', 'bft_proposal_count', 'oscal_component_count', 'crosswalk_cell_count', 'watchdog_count']:
        assert key in stats, f"missing stats key {key}"
    shutil.rmtree(tmp.parent)
    print('✅ Test 1: Init DB creates schema')


def test_2_append_sigil():
    """Test 2: Append SIGIL builds the chain."""
    w = SovereignWitness()  # uses the persistent DB_PATH
    before = len(w.recent_sigil())
    e1 = w.append_sigil('did:csoai:test-001', 'mcp_invoke', {'tool': 'read_cobol'})
    e2 = w.append_sigil('did:csoai:test-001', 'mcp_invoke', {'tool': 'read_fhir'})
    assert e1['hash'] != e2['hash']
    assert e2['prev_hash'] == e1['hash']
    after = len(w.recent_sigil())
    assert after >= before + 2, f"expected at least {before+2} sigils, got {after}"
    print('✅ Test 2: Append SIGIL builds chain')


def test_3_verify_sigil():
    """Test 3: Verify SIGIL by hash."""
    tmp = _tmp_db()
    w = SovereignWitness(db_path=tmp)
    e = w.append_sigil('did:csoai:test-001', 'mcp_invoke', {'tool': 'read_cobol'})
    result = w.verify_sigil(e['hash'])
    assert result['verified'] is True
    bad = w.verify_sigil('0' * 64)
    assert bad['verified'] is False
    shutil.rmtree(tmp.parent)
    print('✅ Test 3: Verify SIGIL by hash')


def test_4_audit_log():
    """Test 4: Audit log + filtering."""
    tmp = _tmp_db()
    w = SovereignWitness(db_path=tmp)
    w.audit('did:csoai:sarah', 'human', 'mcp_invoke', 'success', {'tool': 'read_cobol'})
    w.audit('did:csoai:agent-001', 'agent', 'bft_vote', 'success', {'proposal_id': 1})
    w.audit('did:csoai:robot-001', 'humanoid', 'watchdog_report', 'success', {})
    assert len(w.recent_audit()) == 3
    humans = w.recent_audit(actor_type='human')
    assert len(humans) == 1
    votes = w.recent_audit(action='bft_vote')
    assert len(votes) == 1
    shutil.rmtree(tmp.parent)
    print('✅ Test 4: Audit log + filtering')


def test_5_bft_proposal_and_vote():
    """Test 5: BFT proposal + 22-of-33 vote auto-approves."""
    tmp = _tmp_db()
    w = SovereignWitness(db_path=tmp)
    p = w.propose_bft('Test proposal', 'did:csoai:test-001', {'action': 'launch'})
    assert p['status'] == 'pending'
    # Cast 22 votes
    for i in range(22):
        w.vote_bft(p['id'], f'queen-{i:02d}', 'for')
    # Should be approved
    proposals = w.bft_proposals()
    approved = [pr for pr in proposals if pr['id'] == p['id']]
    assert approved[0]['status'] == 'approved'
    assert approved[0]['approved'] == 1
    assert approved[0]['votes_for'] == 22
    shutil.rmtree(tmp.parent)
    print('✅ Test 5: BFT proposal + 22-of-33 vote approves')


def test_6_oscal_and_crosswalk():
    """Test 6: Register OSCAL components + crosswalk cells."""
    tmp = _tmp_db()
    w = SovereignWitness(db_path=tmp)
    for i in range(5):
        w.register_oscal(f'sha{i}', f'component-{i}', 'protocol')
    for fw in ['EU AI Act', 'GDPR', 'DORA']:
        for art in ['Art 1', 'Art 2', 'Art 3']:
            w.register_crosswalk(fw, art, 'P1')
    assert len(w.oscal_components()) == 5
    assert len(w.crosswalk_cells()) == 9
    gdpr = w.crosswalk_cells(framework='GDPR')
    assert len(gdpr) == 3
    shutil.rmtree(tmp.parent)
    print('✅ Test 6: Register OSCAL + crosswalk cells')


def test_7_watchdog():
    """Test 7: Watchdog reports."""
    tmp = _tmp_db()
    w = SovereignWitness(db_path=tmp)
    w.log_watchdog(51.5074, -0.1278, 'high', 'noise')
    w.log_watchdog(51.5080, -0.1280, 'critical', 'anomaly')
    assert len(w.watchdogs()) == 2
    shutil.rmtree(tmp.parent)
    print('✅ Test 7: Watchdog reports')


def main():
    test_1_init()
    test_2_append_sigil()
    test_3_verify_sigil()
    test_4_audit_log()
    test_5_bft_proposal_and_vote()
    test_6_oscal_and_crosswalk()
    test_7_watchdog()
    print('\n🎯 ALL 7 WITNESS TESTS PASS')


if __name__ == '__main__':
    main()
