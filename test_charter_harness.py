#!/usr/bin/env python3.11
"""test_charter_harness.py — the 5 tests for the charter harness. All must pass."""
import sys
import json
from pathlib import Path

sys.path.insert(0, '/Users/nicholas/clawd')
from charter_harness import STEERING_COMMITTEE, consult, _deliberate, _rationale, _sigil


def test_1_committee_has_5_members():
    """Test 1: 5 steering committee members defined."""
    assert len(STEERING_COMMITTEE) == 5, f"Expected 5 members, got {len(STEERING_COMMITTEE)}"
    expected = {'citizen', 'developer', 'government', 'defence', 'witness'}
    assert set(STEERING_COMMITTEE.keys()) == expected
    print('✅ Test 1: 5 committee members defined (citizen, developer, government, defence, witness)')


def test_2_vote_weights_correct():
    """Test 2: Vote weights are correct (citizen=1, developer=10, government=30, defence=100, witness=None)."""
    assert STEERING_COMMITTEE['citizen']['vote_weight'] == 1
    assert STEERING_COMMITTEE['developer']['vote_weight'] == 10
    assert STEERING_COMMITTEE['government']['vote_weight'] == 30
    assert STEERING_COMMITTEE['defence']['vote_weight'] == 100
    assert STEERING_COMMITTEE['witness']['vote_weight'] is None
    print('✅ Test 2: Vote weights correct (1, 10, 30, 100, None)')


def test_3_care_decisions_unanimous():
    """Test 3: Care decisions get unanimous approval (all vote for)."""
    for d in ['care', 'safety', 'consent', 'audit']:
        result = consult(f'Should we {d}?')
        assert result['result'] == 'approved', f"Care decision '{d}' was not approved"
        for c in result['consultations']:
            assert c['vote'] == 1.0, f"Member {c['member']} did not vote for {d}"
    print('✅ Test 3: Care decisions get unanimous approval')


def test_4_kinetic_decisions_rejected_or_abstained():
    """Test 4: Kinetic decisions rejected or abstained (defence + government abstain)."""
    for d in ['kinetic', 'weapon', 'strike', 'lethal']:
        result = consult(f'Should we deploy a {d} robot?')
        # defence and government should abstain (0.5) or be lower
        for c in result['consultations']:
            if c['member'] in ('defence', 'government'):
                # These should abstain (0.5) for kinetic decisions
                assert c['vote'] <= 0.5, f"Member {c['member']} did not abstain from {d}"
    print('✅ Test 4: Kinetic decisions rejected or abstained (defence + government)')


def test_5_sigil_signed():
    """Test 5: Every consultation is SIGIL-signed."""
    for d in ['ship the release', 'audit the chain', 'open-source the SIGIL']:
        result = consult(d)
        assert 'sigil' in result
        assert len(result['sigil']) == 64
        # Verify it's a valid sha256
        int(result['sigil'], 16)
    print('✅ Test 5: Every consultation is SIGIL-signed (64-char hex)')


def main():
    test_1_committee_has_5_members()
    test_2_vote_weights_correct()
    test_3_care_decisions_unanimous()
    test_4_kinetic_decisions_rejected_or_abstained()
    test_5_sigil_signed()
    print('\n🎯 ALL 5 CHARTER HARNESS TESTS PASS')


if __name__ == '__main__':
    main()
