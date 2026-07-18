#!/usr/bin/env python3
"""Charter Auto-Improver — for charters scoring <60 in charter_health report,
generates suggested missing sections by finding similar well-scored charters
in the corpus and proposing structural improvements.

Output: charter_improvements_2026-07-13.json
Honest register: suggestions are templates, not auto-applied. Human review required.
"""

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
HEALTH = SC / 'CHARTER_HEALTH_2026-07-13.json'
OUT = SC / 'charter_improvements_2026-07-13.json'


def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f'\n🛠 CHARTER AUTO-IMPROVER — {now}\n{"="*60}')

    if not HEALTH.exists():
        print('No charter_health file')
        return

    health = json.loads(HEALTH.read_text())
    needing_work = [c for c in health['charters'] if c['quality_score'] < 60]

    print(f'Charters needing work: {len(needing_work)}')

    # Top performing charters
    top = sorted(health['charters'], key=lambda c: -c['quality_score'])[:5]

    improvements = []
    for c in needing_work:
        # Find similar top-performing charter by vertical
        target_signals = set(k for k, v in c['signals_found'].items() if v)
        best_match = None
        best_overlap = 0
        for t in top:
            t_signals = set(k for k, v in t['signals_found'].items() if v)
            overlap = len(target_signals & t_signals)
            if overlap > best_overlap:
                best_overlap = overlap
                best_match = t
        suggestions = []
        if 'Article 0 binding' not in target_signals:
            suggestions.append('Add Charter Article 0 binding: "Every sovereign action is Ed25519-signed and BFT-ratified (quorum 23/33)."')
        if 'Ed25519' not in target_signals:
            suggestions.append('Add Ed25519 signing reference in Article I or II.')
        if 'BFT ratification' not in target_signals:
            suggestions.append('Add BFT Council ratification: "23/33 agents must vote in favour."')
        if 'OpenTimestamps' not in target_signals:
            suggestions.append('Add OpenTimestamps anchoring for court-admissible proof.')
        if c['article_count'] < 3:
            suggestions.append(f'Add 3+ more articles (currently {c["article_count"]}).')
        if c['size_chars'] < 5000:
            suggestions.append(f'Expand to ≥5000 chars (currently {c["size_chars"]:,}).')
        if c['framework_refs'] < 3:
            suggestions.append('Add 3+ framework cross-walks (e.g. EU AI Act, ISO 42001, NIST AI RMF).')
        if 'Risk register' not in target_signals:
            suggestions.append('Add a Risk register section: top 5 sovereign risks + mitigations.')
        if 'Care principle' not in target_signals:
            suggestions.append('Add Care Floor principle: "Does this action pass the Care test before any other test?"')
        if 'Sovereignty score' not in target_signals:
            suggestions.append('Add Sovereignty Index: 0-100 score measuring sovereign-by-construction.')

        improvements.append({
            'charter_id': c['charter_id'],
            'filename': c['filename'],
            'current_score': c['quality_score'],
            'current_articles': c['article_count'],
            'current_size': c['size_chars'],
            'best_match_charter': best_match['charter_id'] if best_match else None,
            'best_match_score': best_match['quality_score'] if best_match else None,
            'missing_signals': [k for k, v in c['signals_found'].items() if not v],
            'suggestions': suggestions,
            'estimated_new_score': min(100, c['quality_score'] + len(suggestions) * 4),
        })

    out = {
        'generated_at': now,
        'charters_evaluated': len(needing_work),
        'charters': improvements,
        'top_performers': [{'charter_id': t['charter_id'], 'score': t['quality_score']} for t in top],
        'honest_register': [
            'Suggestions are templates, NOT auto-applied.',
            'Each suggestion cites a missing canonical pattern.',
            'Human review + manual edit required.',
            'No LLM inference. Stdlib only.'
        ]
    }
    OUT.write_text(json.dumps(out, indent=2))
    print(f'\n✓ Saved: {OUT}')

    for c in improvements[:5]:
        print(f'  {c["charter_id"]:25s} score={c["current_score"]:5.1f} → est {c["estimated_new_score"]}  ({len(c["suggestions"])} suggestions)')

    import hashlib
    sigil = hashlib.sha256(f'charter-improve|{now}|{len(improvements)}'.encode()).hexdigest()[:32]
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|CHARTER-IMPROVE. needing_work={len(needing_work)} suggestions_total={sum(len(c["suggestions"]) for c in improvements)}\n')


if __name__ == '__main__':
    main()