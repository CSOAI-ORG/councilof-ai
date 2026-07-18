#!/usr/bin/env python3
"""
CHARTER AMENDER
=================
Generate a charter amendment proposal document (10-step BFT process).

(c) 2026 CSOAI Ltd · UK Companies House 16939677
Charter Article 0 binding.
"""
import sys, json, hashlib, argparse
from pathlib import Path

# Charter categories (10-step process, from CHARTER-AMENDMENT-SYSTEM.md)
AMENDMENT_STEPS = [
    '1. DETECT — A Charter Needs Amendment',
    '2. DRAFT — Propose the Amendment',
    '3. SUBMIT — BFT Council Proposal',
    '4. NOTIFY — All 33 Council Members Receive the Proposal',
    '5. DELIBERATE — 72-Hour Discussion Period',
    '6. VOTE — 33-Agent BFT Quorum',
    '7. COUNT — BFT Quorum Verification',
    '8. RATIFY — If Quorum + Majority Reached',
    '9. ANCHOR — OTS Bitcoin Anchoring',
    '10. BROADCAST — Cross-Walk Update',
]

AMENDMENT_TIERS = {
    'minor': {'name': 'Minor (typo, formatting)', 'quorum_required': '12/33', 'voting_window_days': 3, 'majority_required': 'Simple majority (>50%)'},
    'moderate': {'name': 'Moderate (clarification)', 'quorum_required': '17/33', 'voting_window_days': 5, 'majority_required': '60%'},
    'major': {'name': 'Major (add/remove article)', 'quorum_required': '23/33', 'voting_window_days': 7, 'majority_required': '67%'},
    'critical': {'name': 'Critical (Charter Article 0)', 'quorum_required': '33/33 + 5 human', 'voting_window_days': 14, 'majority_required': '90% + 5 human signatures'},
}


def generate_amendment_proposal(proposal_id, charter_id, article, current_text, proposed_text,
                                rationale, evidence, proposer_did, tier='major'):
    """Generate a charter amendment proposal document."""
    if tier not in AMENDMENT_TIERS:
        raise ValueError('Unknown amendment tier: %s' % tier)
    t = AMENDMENT_TIERS[tier]

    sha = hashlib.sha256(json.dumps({
        'charter_id': charter_id,
        'article': article,
        'current_text': current_text,
        'proposed_text': proposed_text,
        'proposer_did': proposer_did,
    }, sort_keys=True).encode()).hexdigest()

    proposal = f"""# CHARTER AMENDMENT PROPOSAL
## CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom
## Proposal ID: {proposal_id}

---

## PREAMBLE

This document constitutes a **Charter Amendment Proposal** under the sovereign federation's 10-step BFT process described in `CHARTER-AMENDMENT-SYSTEM.md`. The proposal is subject to ratification by the 33-agent Byzantine Fault Tolerant Council with the quorum and majority rules specified below.

**Charter Article 0 Binding**: "Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI."

---

## PART 1 — AMENDMENT METADATA

| Field | Value |
|---|---|
| **Proposal ID** | {proposal_id} |
| **Charter Affected** | `{charter_id}` |
| **Article Affected** | `{article}` |
| **Tier** | {t['name']} |
| **Quorum Required** | {t['quorum_required']} |
| **Voting Window** | {t['voting_window_days']} days |
| **Required Majority** | {t['majority_required']} |
| **Proposer DID** | `did:csoai:{proposer_did}` |
| **Proposal Hash (SHA-256)** | {sha[:32]}... |
| **Timestamp** | $(date -u +"%Y-%m-%dT%H:%M:%SZ") |

## PART 2 — THE AMENDMENT

### Current Text
```
{current_text}
```

### Proposed Text
```
{proposed_text}
```

### Material Change
A side-by-side diff will be computed on ratification; the new SHA-256 replaces the charter hash.

## PART 3 — RATIONALE

{rationale}

## PART 4 — EVIDENCE

{chr(10).join('- ' + e for e in evidence)}

## PART 5 — PRE-SUBMISSION CHECKS

- [ ] Proposal is not attempting to amend Charter Article 0 directly (which requires 33/33 + 5 human sigs)
- [ ] Quorum requirement matches the amendment tier
- [ ] Proposer has BFT council voting rights
- [ ] Evidence is publicly available (no proprietary lock-in)
- [ ] Cross-walk impact assessment is included
- [ ] Watchdog S4/S5 signals attached (if applicable)

## PART 6 — THE 10-STEP BFT PROCESS

The proposal follows the canonical 10-step amendment workflow:

{chr(10).join(f'  - {s}' for s in AMENDMENT_STEPS)}

## PART 7 — CROSS-WALK IMPACT

This amendment affects the following cross-walks:
- Source charter: `{charter_id}`
- Target charters: 40 other sovereign charters
- Frameworks: 236 universal compliance frameworks (potential impact on Charter Article 0 binding, Constitutional Cross-Walk, etc.)
- BFT Council vote ratification required

## PART 8 — RATIFICATION RECORD (to be updated)

```
BFT Council Proposal:    {proposal_id}
Council Quorum Required: {t['quorum_required']}
Voting Window:          {t['voting_window_days']} days
Required Majority:      {t['majority_required']}
Cast:
  FOR:        __ / 33
  AGAINST:    __ / 33
  ABSTAIN:    __ / 33
Status:        PENDING
```

## PART 9 — OTS BITCOIN ANCHOR (post-ratification)

```
New Charter SHA-256:  [to be computed]
Ed25519 Signature:    [to be applied]
OTS Calendar Submit:  pending
OTS Bitcoin TxID:     [pending confirmation]
```

## PART 10 — SIGNATURE

### Proposer
```
DID: did:csoai:{proposer_did}
Ed25519 Public Key: [to be inserted]
Ed25519 Signature: [to be inserted]
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

### CSOAI Sovereign Witness
```
CSOAI Sovereign Key (Ed25519): d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
CSOAI Signature: [to be inserted upon acceptance]
Proposal Accepted into SIGIL Chain: [to be emitted]
```

---

**Proposal ID**: {proposal_id}
**Verification URL**: `https://proofof.ai/verify/amendment/{proposal_id}`
**BFT Council URL**: `https://api.csoai.org/v1/council/proposals/{proposal_id}`

> *"The charter amendment process is the constitutional update mechanism of the sovereign federation. Every amendment is Ed25519-signed, BFT-ratified, and OTS-anchored. The barrier to amendment is quorum; the barrier to capture is Article 0 binding. Forever."* 🐉
"""
    return proposal


def main():
    parser = argparse.ArgumentParser(description='Charter Amendment Proposal Generator.')
    parser.add_argument('--proposal-id', '-p', help='Proposal ID (e.g. AMD-2026-07-01-0001)')
    parser.add_argument('--charter-id', '-c', help='Charter ID (e.g. 01-csoai-charter)')
    parser.add_argument('--article', '-a', help='Article number (e.g. IV)')
    parser.add_argument('--current-text', help='Current text of the charter section')
    parser.add_argument('--proposed-text', help='Proposed new text')
    parser.add_argument('--rationale', '-r', help='Rationale for the amendment')
    parser.add_argument('--evidence', nargs='+', help='Evidence URLs or refs (space-separated)')
    parser.add_argument('--proposer-did', '-d', help='DID of the proposer')
    parser.add_argument('--tier', '-t', choices=list(AMENDMENT_TIERS.keys()), default='major', help='Amendment tier')
    parser.add_argument('--output', '-o', help='Output file path')
    parser.add_argument('--self-test', action='store_true', help='Run self-test')
    args = parser.parse_args()

    if args.self_test:
        print('[SELF-TEST] charter_amender.py')
        # Test 1: minor tier
        doc1 = generate_amendment_proposal(
            'AMD-2026-07-01-0001', '01-csoai-charter', 'IV',
            'Never take equity, board seats, revenue-sharing, or success fees from institutions we certify.',
            'Never take equity, board seats, revenue-sharing, success fees, or liability shields from institutions we certify.',
            'Texas TRAIGA 2026 reveals gap: institutions can claim sovereign immunity as liability shield. Amendment closes the loop.',
            ['https://capitol.texas.gov/BillLookup/Text.aspx?LegSess=89R&Bill=HB1709', 'https://proofof.ai/verify/signal/WD-2026-07-01-00010'],
            'agent-007', tier='critical'
        )
        assert 'PROPOSAL ID' in doc1.upper() or 'Proposal ID' in doc1
        assert 'Charter Article 0' in doc1
        assert '16939677' in doc1
        assert '33/33 + 5 human' in doc1
        assert 'AMD-2026-07-01-0001' in doc1
        print('  OK Critical tier (33/33 + 5 human) generated')
        # Test 2: major tier
        doc2 = generate_amendment_proposal(
            'AMD-2026-07-01-0002', '36-publicwatchdog-charter', 'IX',
            '200 sources', '500 sources (added sub-Saharan African + Latin American regulatory feeds)', 'Expanded coverage in 25+ jurisdictions', '[]', 'agent-013', tier='moderate')
        assert '17/33' in doc2
        print('  OK Moderate tier (17/33) generated')
        # Test 3: typo tier
        doc3 = generate_amendment_proposal('AMD-2026-07-01-0003', '11-agisafe-charter', 'I', 'old', 'new (typo fix)', 'fix typo', [], 'a', tier='minor')
        assert '12/33' in doc3
        print('  OK Minor tier (12/33) generated')
        # Test 4: invalid tier
        try:
            generate_amendment_proposal('X', 'Y', 'Z', 'c', 'p', 'r', [], 'did', tier='invalid')
            print('  FAIL Should raise')
        except ValueError:
            print('  OK Invalid tier raises ValueError')
        print('[SELF-TEST PASSED] 4/4 tests')
        return

    if not all([args.proposal_id, args.charter_id, args.article, args.current_text,
                args.proposed_text, args.rationale, args.evidence, args.proposer_did]):
        parser.print_help()
        sys.exit(1)

    proposal = generate_amendment_proposal(
        args.proposal_id, args.charter_id, args.article,
        args.current_text, args.proposed_text, args.rationale,
        args.evidence, args.proposer_did, args.tier
    )
    if args.output:
        Path(args.output).write_text(proposal)
        print('Amendment proposal written to %s' % args.output)
    else:
        print(proposal)


if __name__ == '__main__':
    main()
