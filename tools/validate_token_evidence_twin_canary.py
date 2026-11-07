#!/usr/bin/env python3
"""Validate the bounded ETH/LINK/ONDO evidence-twin register without signing or publishing."""
from __future__ import annotations
import json
from pathlib import Path

path = Path('measurement/registers/2026-09-19/token-evidence-twin-canary.json')
doc = json.loads(path.read_text(encoding='utf-8'))
assert doc['schema'] == 'csoai.token-evidence-twin-canary/0.1'
subjects = {row['subject_id']: row for row in doc['subjects']}
assert set(subjects) == {'token:ethereum', 'token:link', 'token:ondo'}
assert subjects['token:ethereum']['contract_address'] if 'contract_address' in subjects['token:ethereum'] else True
assert subjects['token:link']['contract_address_state'].startswith('PENDING_')
assert subjects['token:ondo']['contract_address'] is None
assert subjects['token:ondo']['contract_address_state'].startswith('UNCHECKABLE_')
for subject in subjects.values():
    assert subject['distribution_state'] == 'LOCAL_DRAFT_ONLY'
    assert all(value in {'PENDING', 'UNCHECKABLE'} for value in subject['proof_state'].values())
print('PASS: three subjects present; no unverified proof or distribution state promoted')
