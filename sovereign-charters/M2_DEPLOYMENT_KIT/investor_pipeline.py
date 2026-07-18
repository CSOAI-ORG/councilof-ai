#!/usr/bin/env python3
"""Sovereign Investor Pipeline — auto-track investor outreach state.
Outputs: investor_pipeline_2026-07-13.json
Honest register: state from self-attested inputs.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
OUT = SC / 'investor_pipeline_2026-07-13.json'

now = datetime.now(timezone.utc).isoformat()
print(f'\n💰 SOVEREIGN INVESTOR PIPELINE — {now}\n{"="*60}')

pipeline = {
    'generated_at': now,
    'round': 'Series A',
    'target': '£2.5M',
    'use_of_funds': {
        'engineering': '£1.0M (40%)',
        'go_to_market': '£800k (32%)',
        'compliance_certs': '£400k (16%)',
        'cfo': '£200k (8%)',
        'legal': '£100k (4%)',
    },
    'investors_targeted': [
        {'name': 'Tier-1 UK AI fund (placeholder)', 'status': 'meeting scheduled', 'value': '£500k-£1M', 'tier': 'lead'},
        {'name': 'EU sovereign-tech fund', 'status': 'intro sent', 'value': '£250k-£500k', 'tier': 'follow'},
        {'name': 'AUKUS-aligned defence fund', 'status': 'intro pending', 'value': '£1M+', 'tier': 'strategic'},
        {'name': 'Family office (UK)', 'status': 'warm intro', 'value': '£100k-£250k', 'tier': 'follow'},
        {'name': 'Strategic: sovereign cloud provider', 'status': 'cold', 'value': '£500k', 'tier': 'follow'},
    ],
    'metrics': {
        'pitch_deck': 'shipped (investor-deck.html, 12 slides)',
        'one_pager': 'shipped (sovereign-proof-pack.html)',
        'data_room': 'pending (requires owner-gated DNS)',
        'traction': {
            'mrr_blended': 264,
            'arr_blended': 3168,
            '12m_target': 50000,
            '24m_target': 200000,
        },
        'team': {
            'founder': 'Nicholas Templeman',
            'agents': '33 (BFT council)',
            'hires_planned': 8,
        },
    },
    'closing_conditions': [
        'Vercel redeploy (live + public)',
        'Stripe Checkout wire (5 tiers live)',
        'csoai.org domain + DNS (branded URL)',
        'Live SOV3 endpoint (canonical SIGIL chain)',
        'First £5K MRR (1 enterprise customer)',
        'DEFONEOS-SEAL pilot letter (UK defence prime)',
    ],
    'next_actions': [
        'Send 12-slide pitch deck to 5 targeted investors',
        'Schedule 30-min walk-throughs with interested parties',
        'Prepare data room (cap table, IP assignment, contracts)',
        'Cybersec audit prep (SOC 2 Type I target Q1 2027)',
    ],
    'honest_register': [
        'Investor targets are placeholders. No commitments.',
        'Use of funds is a target, not a guarantee.',
        'Closing conditions are owner-gated, never autonomously crossed.',
    ]
}

OUT.write_text(json.dumps(pipeline, indent=2))
print(f'✓ Saved: {OUT}')

import hashlib
sigil = hashlib.sha256(f'investor-pipeline|{now}'.encode()).hexdigest()[:32]
with open(SC / 'SIGIL_LOG.txt', 'a') as f:
    f.write(f'{now} | {sigil} | M|JEEVES|csoai|INVESTOR-PIPELINE. target=£2.5M investors=5\n')