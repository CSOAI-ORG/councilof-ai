#!/usr/bin/env python3
"""Charter Health Report — analyse every charter for completeness, propose improvements.

For each *-charter*.md file in sovereign-charters/:
- Length (chars)
- Number of articles
- Number of framework cross-walks
- Number of Ed25519/BFT/OTS references
- Number of "should have" sections (Article 0, Ed25519, BFT, OTS, charter vs framework)
- Quality score (0-100)
- Improvement recommendations

Output: CHARTER_HEALTH_2026-07-13.json + CHARTER_HEALTH_2026-07-13.md
"""

import hashlib
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')


def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f'\n🏥 CHARTER HEALTH REPORT — {now}\n{"="*60}')

    # Required signals per charter (canonical)
    REQUIRED_SIGNALS = {
        'Article 0 binding': re.compile(r'Article\s+0', re.I),
        'Ed25519': re.compile(r'Ed25519', re.I),
        'BFT ratification': re.compile(r'BFT|byzantine', re.I),
        'OpenTimestamps': re.compile(r'OpenTimestamps|OTS', re.I),
        'Article numbering': re.compile(r'Article\s+[IVXLCDM]+', re.I),
        'Cross-walk language': re.compile(r'cross.?walk|mapping|relationship', re.I),
        'EU AI Act (if AI)': re.compile(r'EU AI Act|Article\s+50', re.I),
        'Risk register': re.compile(r'risk|risk register|threat model', re.I),
        'Care principle': re.compile(r'care|Care Floor', re.I),
        'Sovereignty score': re.compile(r'sovereignty|Sovereignty Index', re.I),
    }

    # Collect charters
    charter_files = sorted([p for p in SC.glob('*-charter*.md') if 'OLD' not in p.name and '.bak' not in p.name])
    print(f'Found {len(charter_files)} charter files\n')

    health_data = []
    for p in charter_files:
        text = p.read_text(errors='ignore')
        size = len(text)

        # Title (first # line)
        title = ''
        for line in text.split('\n')[:20]:
            if line.startswith('# '):
                title = line[2:].strip()
                break

        # Article count (Article I, II, III, IV, etc.)
        articles = re.findall(r'^##\s+Article\s+[IVXLCDM]+', text, re.MULTILINE)
        article_count = len(articles)

        # Section count (any ## heading)
        sections = re.findall(r'^##\s+', text, re.MULTILINE)
        section_count = len(sections)

        # Framework references
        framework_refs = len(re.findall(r'(ISO\s+\d+|NIST\s+[A-Z]+|EU AI Act|GDPR|HIPAA|FedRAMP|CMMC|OWASP|NIS2|DORA|MiCA|FCA|PRA|EASA|UN\s+R\d+|IEC\s+\d+|JSP\s+\d+|DEFSTAN)', text))

        # Required signals
        signals_found = {}
        for name, pat in REQUIRED_SIGNALS.items():
            signals_found[name] = bool(pat.search(text))

        # Count of Ed25519/BFT/OTS mentions
        ed25519_count = len(re.findall(r'Ed25519', text, re.I))
        bft_count = len(re.findall(r'\bBFT\b', text))
        ots_count = len(re.findall(r'OpenTimestamps|\bOTS\b', text))

        # Quality score
        present_signals = sum(1 for v in signals_found.values() if v)
        signal_score = (present_signals / len(REQUIRED_SIGNALS)) * 50
        article_score = min(article_count * 4, 25)
        length_score = min(size / 1000, 25)
        quality_score = round(signal_score + article_score + length_score, 1)

        # Recommendations
        recommendations = []
        if not signals_found['Article 0 binding']:
            recommendations.append('Add Article 0 binding declaration (foundational contract)')
        if not signals_found['Ed25519']:
            recommendations.append('Add Ed25519 signing reference')
        if not signals_found['BFT ratification']:
            recommendations.append('Add BFT council ratification requirement')
        if not signals_found['OpenTimestamps']:
            recommendations.append('Add OpenTimestamps anchoring')
        if article_count < 5:
            recommendations.append(f'Expand article count ({article_count} currently; target ≥5)')
        if size < 3000:
            recommendations.append(f'Charter too short ({size} chars; target ≥5000)')
        if framework_refs < 3:
            recommendations.append(f'Add framework cross-walks ({framework_refs} currently; target ≥3)')

        health_data.append({
            'charter_id': p.stem.replace('-charter', ''),
            'filename': p.name,
            'title': title[:120],
            'size_chars': size,
            'article_count': article_count,
            'section_count': section_count,
            'framework_refs': framework_refs,
            'ed25519_mentions': ed25519_count,
            'bft_mentions': bft_count,
            'ots_mentions': ots_count,
            'signals_found': signals_found,
            'signals_present': present_signals,
            'signals_total': len(REQUIRED_SIGNALS),
            'quality_score': quality_score,
            'recommendations': recommendations,
            'sha256': hashlib.sha256(text.encode()).hexdigest()[:16]
        })

    # Sort by quality (worst first — most need attention)
    health_data.sort(key=lambda x: x['quality_score'])

    # Aggregate
    avg_score = sum(c['quality_score'] for c in health_data) / len(health_data)
    median_score = sorted(c['quality_score'] for c in health_data)[len(health_data) // 2]
    needs_work = [c for c in health_data if c['quality_score'] < 60]
    avg_articles = sum(c['article_count'] for c in health_data) / len(health_data)
    total_frameworks = sum(c['framework_refs'] for c in health_data)

    print(f'Avg quality: {avg_score:.1f}/100')
    print(f'Median quality: {median_score}/100')
    print(f'Charters needing work (<60): {len(needs_work)}')
    print(f'Avg article count: {avg_articles:.1f}')
    print(f'Total framework refs: {total_frameworks:,}')

    print(f'\nBottom 5 charters (most improvement needed):')
    for c in health_data[:5]:
        print(f'  {c["quality_score"]:5.1f}/100  {c["charter_id"]:20s}  {len(c["recommendations"])} recommendations')

    print(f'\nTop 5 charters:')
    for c in health_data[-5:]:
        print(f'  {c["quality_score"]:5.1f}/100  {c["charter_id"]:20s}  {c["article_count"]} articles')

    # Save JSON
    out = {
        'generated_at': now,
        'charters_analysed': len(health_data),
        'aggregate': {
            'avg_quality_score': round(avg_score, 1),
            'median_quality_score': median_score,
            'needs_work_count': len(needs_work),
            'avg_article_count': round(avg_articles, 1),
            'total_framework_refs': total_frameworks,
            'required_signals': list(REQUIRED_SIGNALS.keys())
        },
        'charters': health_data,
        'honest_register': [
            'Quality score is heuristic — measures coverage of canonical patterns.',
            'No content quality judgement (no LLM inference).',
            'Recommendations are automatic; human review required.',
            'Stdlib only.'
        ]
    }

    out_path = SC / 'CHARTER_HEALTH_2026-07-13.json'
    out_path.write_text(json.dumps(out, indent=2))
    print(f'\n✓ Saved: {out_path} ({out_path.stat().st_size:,} bytes)')

    # Markdown report
    md = f'''# Charter Health Report — 2026-07-13

**Generated:** {now}

## Top-line metrics

- **Charters analysed:** {len(health_data)}
- **Avg quality score:** {avg_score:.1f}/100
- **Median quality score:** {median_score}/100
- **Charters needing work (<60):** {len(needs_work)}
- **Avg article count:** {avg_articles:.1f}
- **Total framework cross-walks referenced:** {total_frameworks:,}

## Bottom 10 charters (most improvement needed)

| Charter | Score | Articles | Size | Recommendations |
|---|---|---|---|---|
'''
    for c in health_data[:10]:
        md += f'| {c["charter_id"]} | {c["quality_score"]:.1f}/100 | {c["article_count"]} | {c["size_chars"]:,} | {len(c["recommendations"])} |\n'

    md += '\n## Top 10 charters\n\n| Charter | Score | Articles | Framework refs |\n|---|---|---|---|\n'
    for c in health_data[-10:]:
        md += f'| {c["charter_id"]} | {c["quality_score"]:.1f}/100 | {c["article_count"]} | {c["framework_refs"]} |\n'

    md += '\n## Signal coverage\n\n'
    for name in REQUIRED_SIGNALS:
        present = sum(1 for c in health_data if c['signals_found'][name])
        pct = (present / len(health_data)) * 100
        md += f'- **{name}**: {present}/{len(health_data)} charters ({pct:.0f}%)\n'

    md_path = SC / 'CHARTER_HEALTH_2026-07-13.md'
    md_path.write_text(md)
    print(f'✓ Saved: {md_path} ({md_path.stat().st_size:,} bytes)')

    # SIGIL
    sigil = hashlib.sha256(f'charter-health|{now}|{len(health_data)}'.encode()).hexdigest()[:32]
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|CHARTER-HEALTH. charters={len(health_data)} avg_quality={avg_score:.1f} needs_work={len(needs_work)}\n')

    print(f'\n✓ Master SIGIL: {sigil}')


if __name__ == '__main__':
    main()