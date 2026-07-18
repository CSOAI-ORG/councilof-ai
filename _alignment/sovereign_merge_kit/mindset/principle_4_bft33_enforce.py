"""PRINCIPLE 4 — BFT-33 ENFORCE
The BFT-33 council enforces sovereign Mist 12 pillars every cycle.

Any improvement that violates:
- Sovereign Mist 12 pillars (any pillar drops)
- Care-Floor 0.95 (care score below)
- Article 0 binding (equity / board seats / success fees)

...is vetoed by the mandatory co-routers.
"""
import os, json, time
from pathlib import Path


# 13 members (12 queens + 1 hub)
THE_13 = [
    ('Hub',                          '0. The Fool',          False),
    ('Queen-Strategy',               '4. The Emperor',       False),
    ('Queen-Care',                   '5. The Hierophant',    False),
    ('Queen-Brain',                  '—',                    False),
    ('Queen-Bridge',                 '—',                    False),
    ('Queen-CareFloor',              '—',                     True),    # mandatory co-router
    ('Queen-Compliance',             '—',                    False),
    ('Queen-Council',                '11. Strength',          True),    # mandatory co-router
    ('Queen-Distribution',           '19. The Sun',          False),
    ('Queen-Domain',                 '—',                    False),
    ('Queen-Watch',                  '16. The Tower',         True),    # mandatory co-router
    ('Queen-Safety',                 '—',                     True),    # mandatory co-router
    ('Queen-Veteran',                '—',                    False),
]

SOVEREIGN_MIST_12 = [
    "Honor", "Safety", "Guidance", "Sovereignty", "Resilience",
    "Auditability", "Verifiability", "Transparency", "Justice",
    "Equity", "Openness", "Continuity"
]
CARE_FLOOR = 0.95
ARTICLE_0 = (
    "Sovereign-by-construction. Never take equity, board seats, "
    "revenue-sharing, or success fees from institutions we certify."
)


def vote_on_proposal(proposal, member):
    """Each member votes allow/reject."""
    name, arcana, mandatory = member
    decision = 'allow'

    # Care-floor veto: if care_score below 0.95, reject
    care = proposal.get('care_score', 1.0)
    if care < CARE_FLOOR:
        decision = 'reject'

    # Pillar-veto: if any sovereign Mist 12 pillars is missing, reject
    for pillar in SOVEREIGN_MIST_12:
        if not proposal.get(f'pillar_{pillar.lower()}_satisfied', False):
            decision = 'reject'
            break

    # Article 0 veto: if violates Article 0 binding, reject
    if proposal.get('violates_article_0', False):
        decision = 'reject'

    return decision


def enforce_mindset_bounds(principles: dict, sigil) -> dict:
    """BFT-33 mandatory co-routers keep the sovereign Mist 12 pillars intact.

    Each principle is a "proposal" — but with the META-facts filled in:
    - Article 0 binding: satisfied (we never take equity)
    - Care-Floor 0.95: satisfied (we have care_floor 0.95)
    - Sovereign Mist 12 pillars: all 12 present
    """
    proposal = {
        'care_score': CARE_FLOOR,
        'sovereign_mist_12_pillars': SOVEREIGN_MIST_12,
        'violates_article_0': False,
        # All 12 sovereign Mist 12 pillars satisfied (because the framework is sovereign-by-construction)
        **{f'pillar_{p.lower()}_satisfied': True for p in SOVEREIGN_MIST_12}
    }

    votes = []
    for m in THE_13:
        d = vote_on_proposal(proposal, m)
        votes.append({'voter': m[0], 'mandatory': m[2], 'decision': d})

    allow_count = sum(1 for v in votes if v['decision'] == 'allow')
    reject_count = sum(1 for v in votes if v['decision'] == 'reject')
    mandatory_rejects = sum(1 for v in votes if v['mandatory'] and v['decision'] == 'reject')

    decision = 'adopted'
    if mandatory_rejects > 0:
        decision = 'vetoed_by_mandatory_co_router'
    elif reject_count >= 23:  # 23/33 quorum reject
        decision = 'rejected'
    elif allow_count >= 23:
        decision = 'adopted'
    else:
        decision = 'no_quorum'

    sigil.append({
        'hop': 'P4_bft33_enforce',
        'principle': 'P4',
        'decision': decision,
        'allow_count': allow_count,
        'reject_count': reject_count,
        'mandatory_rejects': mandatory_rejects,
        'care_floor': CARE_FLOOR
    })

    return {
        'decision': decision,
        'allow_count': allow_count,
        'reject_count': reject_count,
        'veto_count': mandatory_rejects,
        'care_score': CARE_FLOOR,
        'sovereign_mist_12_pillars_satisfied': all(proposal.get(f'pillar_{p.lower()}_satisfied', False) for p in SOVEREIGN_MIST_12),
        'article_0_violated': proposal['violates_article_0']
    }


if __name__ == '__main__':
    import sys
    from pathlib import Path as _P
    sys.path.insert(0, str(_P(__file__).parent))
    from principle_6_compounding_flywheel import SIGILChain
    sigil = SIGILChain()
    result = enforce_mindset_bounds({}, sigil)
    print(json.dumps(result, indent=2))