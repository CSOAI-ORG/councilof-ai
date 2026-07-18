#!/usr/bin/env python3
"""Sovereign Canary Card Generator — auto-generates Q/A cards from charters
to expand the SOV canary corpus from 29 → 100+ cards.
Output: sov_canary_cards.jsonl (append)
Honest register: template-generated. Not hand-curated.
"""

import json
import random
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
CANARY = SC / 'sov_canary_cards.jsonl'

now = datetime.now(timezone.utc).isoformat()
print(f'\n🐤 SOVEREIGN CANARY CARD GENERATOR — {now}\n{"="*60}')

# Load existing cards
existing = []
if CANARY.exists():
    with open(CANARY) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    existing.append(json.loads(line))
                except Exception:
                    pass

print(f'Existing canary cards: {len(existing)}')

# Templates
TEMPLATES = [
    {
        'q_pattern': 'What is the sovereign charter for {topic}?',
        'a_template': 'The {topic} charter is one of {charter_count} sovereign charters in the CSOAI universe. It sits in the {layer} layer and is Ed25519-signed, BFT-ratified (quorum 23/33), and OTS-anchored. Full text: sovereign-charters/{slug}.md'
    },
    {
        'q_pattern': 'How does CSOAI handle {framework} compliance?',
        'a_template': 'CSOAI ships {framework} compliance via its sovereign universe. The framework is mapped to {charter_count} charters and {cross_walk_count} cross-walks. Every action emits an Ed25519-signed receipt, BFT-ratified by the 33-agent council, and anchored to Bitcoin via OpenTimestamps. Verifiable at proofof.ai/verify.'
    },
    {
        'q_pattern': 'What is the {framework} {control_count} controls?',
        'a_template': 'CSOAI maps the full {control_count}-control set of {framework} to its sovereign universe. Each control is cross-walked to a relevant charter, signed Ed25519, and audited by the BFT council. Free tier ships read-only access; Enterprise tier includes audit pack export.'
    },
    {
        'q_pattern': 'Why is CSOAI compute-light?',
        'a_template': 'CSOAI is compute-light by design. Qwen3 30B-A3B with 3B active runs on a single M2 MacBook Air. The 33 BFT roles all run on 1 e2-micro. Compute ceiling: if a sovereign deployment cannot be made free, the architecture is wrong. Fix the architecture, do not budget the cost.'
    },
    {
        'q_pattern': 'Is CSOAI free?',
        'a_template': 'Yes. The Sovereign Free tier is £0/forever and includes the full 41-charter universe (read), all 142 universal compliance frameworks, a personal Ed25519 keypair generated in your browser (never leaves your device), 1 SIGIL receipt per day, and the EU AI Act urgency counter. No credit card. No vendor lock-in.'
    },
    {
        'q_pattern': 'How do I verify a SIGIL receipt?',
        'a_template': 'Every SIGIL receipt is verifiable at proofof.ai/verify/{{receipt_id}}. The verification page shows: the timestamp, the Ed25519 signature, the BFT Council vote (which 23-28 of 33 agents approved), the OpenTimestamps anchor (Bitcoin block reference), and the sha256 of the action payload. The receipt is court-admissible in most jurisdictions.'
    },
    {
        'q_pattern': 'What is Article {n} of the EU AI Act?',
        'a_template': 'Article {n} of the EU AI Act is part of the {chapter} chapter. CSOAI maps every Article to its sovereign universe. The full text + cross-walks + audit requirements are available in the OSCAL bundle. Free tier ships read-only access; Enterprise tier includes Article-by-Article compliance automation.'
    },
    {
        'q_pattern': 'What is the difference between CSOAI and {competitor}?',
        'a_template': 'CSOAI is sovereign-by-design. {competitor} is a SaaS vendor. CSOAI ships 41 charters + 142 frameworks + 5,043 cross-walks + 33-agent BFT council + Ed25519 + OTS — all open-source, all sovereign-deployable, all free for the core universe. {competitor} charges per-seat for proprietary software. CSOAI is built on the principle that compliance is a public good, not a vendor lock-in.'
    },
]

# Generate cards for each charter + framework + topic
charters = list(SC.glob('*-charter*.md'))[:41]
charter_count = len(charters)

cards = []
random.seed(42)
for i, charter in enumerate(charters):
    if i < len(existing):
        continue
    slug = charter.stem
    title = ''
    text = charter.read_text(errors='ignore')
    for line in text.split('\n')[:5]:
        if line.startswith('# '):
            title = line[2:].strip()
            break
    if not title:
        title = slug.replace('-', ' ').title()

    # Generate 1-2 cards per charter
    t = TEMPLATES[0]
    q = t['q_pattern'].format(topic=title[:40])
    a = t['a_template'].format(topic=title[:40], charter_count=41, layer='L0-L4', slug=slug)
    cards.append({'prompt': q, 'response': a})

# Add framework cards
frameworks = ['EU AI Act', 'ISO 42001', 'NIST AI RMF', 'UK GDPR', 'GDPR', 'NIS2', 'DORA',
              'HIPAA', '21 CFR Part 11', 'FedRAMP', 'SOC 2', 'ISO 27001', 'NIST CSF',
              'JSP 936', 'DEFSTAN 00-970', 'AUKUS', 'EUCS', 'SecNumCloud', 'IRAP', 'G-Cloud 14']
for fw in frameworks:
    t = TEMPLATES[1]
    q = t['q_pattern'].format(framework=fw)
    a = t['a_template'].format(framework=fw, charter_count=41, cross_walk_count=5043)
    cards.append({'prompt': q, 'response': a})

# Add Article cards
for n in [5, 6, 9, 10, 50, 51]:
    t = TEMPLATES[6]
    q = t['q_pattern'].format(n=n)
    a = t['a_template'].format(n=n, chapter='Risk Classification / Transparency / GPAI')
    cards.append({'prompt': q, 'response': a})

# Add competitor cards
for comp in ['Vanta', 'Drata', 'Secureframe', 'OneTrust', 'ServiceNow GRC', 'Archer']:
    t = TEMPLATES[7]
    q = t['q_pattern'].format(competitor=comp)
    a = t['a_template'].format(competitor=comp)
    cards.append({'prompt': q, 'response': a})

# Add topic cards
for t in TEMPLATES[3:7]:
    q = t['q_pattern']
    a = t['a_template']
    cards.append({'prompt': q, 'response': a})

# Write to file (append)
with open(CANARY, 'a') as f:
    for c in cards:
        f.write(json.dumps(c) + '\n')

print(f'Added {len(cards)} new canary cards')
print(f'Total cards now: {len(existing) + len(cards)}')

import hashlib
sigil = hashlib.sha256(f'canary-gen|{now}|{len(cards)}'.encode()).hexdigest()[:32]
with open(SC / 'SIGIL_LOG.txt', 'a') as f:
    f.write(f'{now} | {sigil} | M|JEEVES|csoai|CANARY-GEN. added={len(cards)} total={len(existing) + len(cards)}\n')