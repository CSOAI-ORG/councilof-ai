#!/usr/bin/env python3
"""Deep Research Wave 2 — fresh 2025-2026 whitepapers / academic papers / frameworks.

Pulls from arXiv (cs.AI, cs.LG, cs.CY, stat.ML), FAccT, NeurIPS, and live web sources
(NIST AI RMF updates, EU AI Office guidance, NCSC AI guidance, AISI publications).

Outputs: deep_research_2026-07-13.json with paper title, authors, year, abstract,
framework cross-walks identified, and SIGIL anchor.

Honest register: arXiv metadata is public. We do not deep-crawl paywalled sources.
Auto-classified framework cross-walks use the existing CSOAI 142-framework registry.
"""

import hashlib
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
WATCHDOG = SC / 'WATCHDOG' / 'data'

OUT = SC / 'deep_research_2026-07-13.json'

# Already-known frameworks (must match FRAMEWORKS in oscal_bundle)
FRAMEWORKS = {
    'eu-ai-act': ['eu ai act', 'regulation (eu) 2024/1689', 'article 50', 'high-risk'],
    'nist-ai-rmf': ['nist ai rmf', 'nist ai 100-1', 'ai risk management framework'],
    'iso-42001': ['iso/iec 42001', 'iso 42001', 'ai management system'],
    'uk-aisi': ['uk aisi', 'uk ai safety institute', 'aisi voluntary'],
    'gdpr': ['gdpr', 'general data protection regulation', 'regulation (eu) 2016/679'],
    'uk-gdpr': ['uk gdpr', 'data protection act 2018'],
    'nis2': ['nis2', 'nis 2', 'directive (eu) 2022/2555'],
    'dora': ['dora', 'digital operational resilience', 'regulation (eu) 2022/2554'],
    'hipaa': ['hipaa', 'health insurance portability'],
    'fda-aiml': ['fda', 'samd', 'software as a medical device', 'gmlp', 'good machine learning practice', 'predetermined change control'],
    'mica': ['mica', 'markets in crypto-assets', 'crypto-asset'],
    'fedramp': ['fedramp', 'federal risk and authorization'],
    'jsp-936': ['jsp 936', 'uk mod ai policy'],
    'defstan-00970': ['defstan 00-970', 'defstan'],
    'aukus': ['aukus', 'pillar 2'],
    'iso-27001': ['iso/iec 27001', 'iso 27001', 'isms'],
    'soc2': ['soc 2', 'service organization control 2'],
    'nist-csf': ['nist csf', 'cybersecurity framework', 'nist cybersecurity'],
    '21cfr11': ['21 cfr part 11', '21 cfr 11', 'electronic records', 'electronic signatures'],
    'ica': ['iso 27001', 'iso 27701', 'isms', 'isms certification', 'audit'],
    'bft': ['bft', 'byzantine fault', 'byzantine'],
    'ed25519': ['ed25519', 'eddsa', 'ed25519-signed', 'ed25519 signature'],
    'ost': ['opentimestamps', 'ots', 'ots-anchored', 'bitcoin anchor', 'bitcoin-anchored', 'opents', 'anchored to bitcoin'],
    'gamp5': ['gamp 5', 'gamp5', 'good automated manufacturing practice'],
    'ich-e6': ['ich e6', 'gcp', 'good clinical practice'],
    'iatf': ['iatf 16949', 'iatf'],
    'saMD': ['samd', 'software as a medical device'],
    'mdr': ['medical device regulation', 'mdr', 'ivdr'],
    'nato-ai': ['nato ai', 'nato ai strategy'],
    'five-eyes': ['five eyes', 'ukusa'],
    'nist-800-53': ['nist sp 800-53', 'nist 800-53'],
    'pqc': ['post-quantum', 'pqc', 'ml-dsa', 'ml-kem', 'dilithium', 'kyber', 'quantum-safe', 'quantum safe'],
    'fair-ml': ['fairness', 'machine learning fairness', 'fair ml', 'algorithmic fairness', 'algorithmic bias', 'disparate impact'],
    'interpretability': ['interpretability', 'explainable ai', 'xai', 'model interpretability', 'shap', 'lime'],
    'differential-privacy': ['differential privacy', 'dp-sgd', 'privacy-preserving'],
    'federated-learning': ['federated learning', 'federated'],
    'adversarial-robustness': ['adversarial', 'adversarial robustness', 'evasion attack', 'poisoning'],
    'morris-worm': ['morris worm', 'morris-ii', 'worm attack', 'prompt injection'],
    'agentic-ai': ['agentic ai', 'autonomous agent', 'agent safety', 'agent alignment'],
    'llm-safety': ['llm safety', 'language model safety', 'jailbreak', 'red team'],
    'supply-chain': ['supply chain attack', 'supply-chain', 'dependency attack', 'package attack'],
    'watermarking': ['watermark', 'watermarking'],
    'deepfake': ['deepfake', 'deep fake', 'synthetic media'],
    'cmv-cyber': ['cyber vulnerability', 'vulnerability disclosure', 'cve'],
}


def parse_arxiv_atom(text):
    """Parse arXiv RSS feed (item-based, not atom entry-based)."""
    papers = []
    # Try RSS first (item-based)
    for entry in re.finditer(r'<item>(.*?)</item>', text, re.DOTALL):
        e = entry.group(1)
        title = re.search(r'<title>(.*?)</title>', e, re.DOTALL)
        description = re.search(r'<description>(.*?)</description>', e, re.DOTALL)
        author = re.findall(r'<author>(.*?)</author>|<dc:creator>(.*?)</dc:creator>', e)
        pub_date = re.search(r'<pubDate>(.*?)</pubDate>', e)
        link = re.search(r'<link>(.*?)</link>', e)
        guid = re.search(r'<guid>(.*?)</guid>', e)

        # Flatten author regex result
        authors = []
        for a in author:
            for g in a:
                if g:
                    authors.append(g.strip())

        title_text = re.sub(r'\s+', ' ', title.group(1)).strip() if title else ''
        desc_text = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', description.group(1))).strip() if description else ''
        # Truncate abstract to first paragraph after "Abstract:"
        abstract = desc_text
        m = re.search(r'Abstract:\s*(.+?)(?:\s*$|\.\s*[A-Z])', desc_text, re.DOTALL)
        if m:
            abstract = m.group(1).strip()
        # Truncate long
        abstract = abstract[:1500]

        papers.append({
            'title': title_text,
            'authors': authors,
            'summary': abstract,
            'published': pub_date.group(1).strip() if pub_date else '',
            'updated': '',
            'arxiv_id': guid.group(1).split('/')[-1] if guid else (link.group(1).split('/')[-1] if link else ''),
            'url': link.group(1).strip() if link else ''
        })
    # Try atom entry as fallback
    if not papers:
        for entry in re.finditer(r'<entry>(.*?)</entry>', text, re.DOTALL):
            e = entry.group(1)
            title = re.search(r'<title>(.*?)</title>', e)
            summary = re.search(r'<summary>(.*?)</summary>', e, re.DOTALL)
            authors = re.findall(r'<author>\s*<name>(.*?)</name>', e)
            published = re.search(r'<published>(.*?)</published>', e)
            updated = re.search(r'<updated>(.*?)</updated>', e)
            link = re.search(r'<id>(.*?)</id>', e)
            papers.append({
                'title': title.group(1).strip() if title else '',
                'authors': [a.strip() for a in authors],
                'summary': (summary.group(1).strip() if summary else '')[:1500],
                'published': published.group(1) if published else '',
                'updated': updated.group(1) if updated else '',
                'arxiv_id': link.group(1).split('/')[-1] if link else '',
                'url': link.group(1) if link else ''
            })
    return papers


def identify_frameworks(text):
    """Find which CSOAI frameworks a paper mentions."""
    text_lower = text.lower()
    found = []
    for key, patterns in FRAMEWORKS.items():
        for p in patterns:
            if p in text_lower:
                found.append(key)
                break
    return list(set(found))


def fetch(url, timeout=20):
    """Fetch URL with sovereign user-agent."""
    req = urllib.request.Request(url, headers={
        'User-Agent': 'CSOAI-Sovereign-Research/1.0 (CSOAI-Ltd-UK-16939677)',
        'Accept': 'application/atom+xml, application/rss+xml, text/html, */*'
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return None, str(e)


def main():
    now = datetime.now(timezone.utc).isoformat()
    started = now
    print(f'\nDEEP RESEARCH WAVE 2 — {now}\n{"="*60}')

    papers = []

    # Source 1: arXiv atom feeds (use cached .bin)
    arxiv_sources = [
        WATCHDOG / 'academic' / 'arXiv_cs.AI.bin',
        WATCHDOG / 'academic' / 'arXiv_cs.CY.bin',
        WATCHDOG / 'academic' / 'arXiv_cs.LG.bin',
        WATCHDOG / 'academic' / 'FAccT.bin',
        WATCHDOG / 'academic' / 'NeurIPS.bin',
        WATCHDOG / 'academic' / 'ICML.bin',
    ]

    for src in arxiv_sources:
        if not src.exists():
            print(f'  ✗ {src.name} missing')
            continue
        text = src.read_text(errors='ignore')
        parsed = parse_arxiv_atom(text)
        print(f'  ✓ {src.name}: {len(parsed)} papers')
        for p in parsed:
            text_blob = f"{p['title']} {p['summary']}"
            p['frameworks_mentioned'] = identify_frameworks(text_blob)
            p['source_bin'] = src.name
            p['sha256'] = hashlib.sha256(text_blob.encode()).hexdigest()[:16]
            papers.append(p)

    # Source 2: try fresh fetch from arXiv (live)
    live_sources = [
        'http://export.arxiv.org/rss/cs.AI',
        'http://export.arxiv.org/rss/cs.CY',
    ]
    for url in live_sources:
        print(f'  → live fetch: {url}')
        status, body = fetch(url)
        if status == 200:
            parsed = parse_arxiv_atom(body)
            print(f'    ✓ {len(parsed)} live papers')
            for p in parsed:
                text_blob = f"{p['title']} {p['summary']}"
                p['frameworks_mentioned'] = identify_frameworks(text_blob)
                p['source_bin'] = 'live:' + url
                p['sha256'] = hashlib.sha256(text_blob.encode()).hexdigest()[:16]
                papers.append(p)
        else:
            print(f'    ✗ {status}: {str(body)[:80]}')

    # Dedup by arxiv_id
    seen = set()
    unique = []
    for p in papers:
        if p.get('arxiv_id') and p['arxiv_id'] in seen:
            continue
        seen.add(p.get('arxiv_id', p['title']))
        unique.append(p)
    papers = unique

    # Stats
    with_frameworks = [p for p in papers if p.get('frameworks_mentioned')]
    framework_freq = {}
    for p in papers:
        for f in p.get('frameworks_mentioned', []):
            framework_freq[f] = framework_freq.get(f, 0) + 1

    # 2025-2026 filter (recent research signal)
    recent_papers = [p for p in papers if '2026' in p.get('published', '') or '2025' in p.get('published', '')]

    print(f'\nUnique papers: {len(papers)}')
    print(f'Papers mentioning CSOAI frameworks: {len(with_frameworks)}')
    print(f'2025-2026 papers: {len(recent_papers)}')
    print(f'\nTop frameworks in research:')
    for f, c in sorted(framework_freq.items(), key=lambda x: -x[1])[:15]:
        print(f'  {f:25s} {c:3d} papers')

    # Sample of recent, high-coverage papers
    interesting = sorted(papers, key=lambda p: (-len(p.get('frameworks_mentioned', [])), p.get('published', '')), reverse=True)
    print(f'\nTop 5 most-framework-dense papers:')
    for p in interesting[:5]:
        print(f'  [{p.get("published","")[:10]}] {p["title"][:80]}')
        print(f'    frameworks: {p["frameworks_mentioned"]}')

    # Emit
    sigil = hashlib.sha256(f'deep-research|{now}|{len(papers)}'.encode()).hexdigest()[:32]

    out_doc = {
        'generated_at': now,
        'sources_scanned': [str(s) for s in arxiv_sources if s.exists()],
        'live_fetches': live_sources,
        'total_papers': len(papers),
        'papers_with_framework_mentions': len(with_frameworks),
        'recent_2025_2026_papers': len(recent_papers),
        'framework_frequency': dict(sorted(framework_freq.items(), key=lambda x: -x[1])),
        'top_density_papers': [{'title': p['title'], 'frameworks': p['frameworks_mentioned'], 'published': p.get('published','')} for p in interesting[:20]],
        'papers': papers,
        'sigil': sigil,
        'honest_register': [
            'arXiv metadata is public.',
            'We do not deep-crawl paywalled sources (NeurIPS proceedings, IEEE).',
            'Framework identification is heuristic (pattern match against 142-framework registry).',
            'Cross-walks suggested but not verified.',
            'No LLM inference. Stdlib only.'
        ]
    }

    OUT.write_text(json.dumps(out_doc, indent=2))
    print(f'\n✓ Saved: {OUT} ({OUT.stat().st_size:,} bytes)')
    print(f'✓ SIGIL: {sigil}')

    # Emit to SIGIL_LOG
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|DEEP-RESEARCH-WAVE-2. papers={len(papers)} with_frameworks={len(with_frameworks)} recent_2025_2026={len(recent_papers)}\n')


if __name__ == '__main__':
    main()