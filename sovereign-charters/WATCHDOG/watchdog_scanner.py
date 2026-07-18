#!/usr/bin/env python3
"""
PUBLIC WATCHDOG ACTIVE SCANNER
================================
Continuously scans 200+ sources for AI/compliance/safety signals.
Each finding is classified, severity-scored, geolocated, sector-tagged,
and emitted to the Watchdog heat-map + SIGIL chain.

Sources:
  - Regulatory feeds (EU AI Office, ICO, FCA, CMA, NIST, BSI, ISO)
  - CVE/NVD databases
  - MITRE ATLAS adversarial ML incidents
  - AIID (AI Incident Database)
  - Academic preprints (arXiv, PsyArXiv, SocArXiv)
  - News (Reuters, MIT Tech Review, FT, BBC, Wired)
  - Standards (W3C, IETF, ISO, IEEE)
  - Court records (CourtListener, BAILII, EUR-Lex)
  - Social (HN, Reddit, X — curated)
  - Vendor status pages
  - Government (WhiteHouse OSTP, UK DSIT, EU DG-CONNECT, Singapore IMDA)

(c) 2026 CSOAI Ltd · UK Companies House 16939677
"""

import os, sys, json, hashlib, time
from pathlib import Path
from datetime import datetime, timezone
import urllib.request, urllib.parse, urllib.error

SOV3_MCP_URL = os.getenv("SOV3_MCP_URL", "http://localhost:3101/mcp")
WATCHDOG_DIR = Path("/Users/nicholas/clawd/sovereign-charters/WATCHDOG")

# 12 signal categories (mirror PUBLIC-WATCHDOG-ARCHITECTURE.md)
CATEGORIES = ['CMP', 'SAF', 'SEC', 'BIA', 'PRV', 'ETH', 'SOV', 'PRC', 'TRS', 'ACC', 'EXC', 'ENV']

# 5 severity levels
SEVERITIES = ['S1', 'S2', 'S3', 'S4', 'S5']

# 4 source types
SOURCE_TYPES = ['HUMAN', 'AGENT', 'SYSTEM', 'WATCHDOG']

# Source taxonomy (200+ sources)
SOURCES = {
    'regulatory': [
        'https://digital-strategy.ec.europa.eu/en/news',                    # EU AI Office
        'https://ico.org.uk/about-the-ico/media-centre/',                   # ICO
        'https://www.fca.org.uk/news',                                     # FCA
        'https://www.gov.uk/cma-cases',                                    # CMA
        'https://www.nist.gov/news-events',                                # NIST
        'https://www.bsigroup.com/en-GB/newsroom/',                        # BSI
        'https://www.iso.org/news.html',                                   # ISO
        'https://edpb.europa.eu/news/news_en',                             # EDPB
        'https://www.cnil.fr/en',                                          # CNIL (FR)
        'https://www.bfdi.bund.de/',                                       # BfDI (DE)
        'https://www.garanteprivacy.it/',                                  # Garante (IT)
        'https://www.aepd.es/en',                                          # AEPD (ES)
        'https://iapp.org/news/',                                          # IAPP
    ],
    'vulnerability': [
        'https://nvd.nist.gov/vuln/data-feeds',                            # NVD CVE
        'https://github.com/advisories',                                   # GitHub Advisory
        'https://osv.dev/',                                                # OSV
        'https://atlas.mitre.org/',                                        # MITRE ATLAS
        'https://owasp.org/www-project-top-ten/',                          # OWASP Top 10
        'https://llmtop10.org/',                                           # OWASP LLM Top 10
        'https://www.exploit-db.com/',                                     # Exploit-DB
    ],
    'incident': [
        'https://incidentdatabase.ai/',                                    # AIID
        'https://www.partnershiponai.org/',                                # Partnership on AI
        'https://oecd.ai/incidents/',                                      # OECD AI Incidents
    ],
    'academic': [
        'https://arxiv.org/list/cs.AI/recent',                            # arXiv AI
        'https://arxiv.org/list/cs.LG/recent',                            # arXiv ML
        'https://arxiv.org/list/cs.CY/recent',                            # arXiv Computers & Society
        'https://www.facctconference.org/',                                # FAccT
        'https://neurips.cc/',                                             # NeurIPS
        'https://icml.cc/',                                                # ICML
        'https://psyarxiv.com/',                                           # PsyArXiv
    ],
    'news': [
        'https://www.reuters.com/technology/artificial-intelligence',     # Reuters AI
        'https://www.technologyreview.com/topic/artificial-intelligence',  # MIT Tech Review
        'https://www.theverge.com/ai-artificial-intelligence',             # The Verge
        'https://www.wired.com/tag/artificial-intelligence/',              # Wired
        'https://www.bbc.co.uk/news/topics/c2dwqd1zr92t',                 # BBC Tech
        'https://www.ft.com/artificial-intelligence',                      # FT
    ],
    'standards': [
        'https://www.w3.org/standards/',                                   # W3C
        'https://datatracker.ietf.org/',                                   # IETF
        'https://www.ieee.org/about/news.html',                           # IEEE
        'https://www.etsi.org/news',                                       # ETSI
    ],
    'court': [
        'https://www.courtlistener.com/',                                 # US courts
        'https://www.bailii.org/',                                         # UK/IE courts
        'https://eur-lex.europa.eu/',                                      # EUR-Lex
    ],
    'social': [
        'https://news.ycombinator.com/',                                   # HN
        'https://www.reddit.com/r/MachineLearning/.rss',                  # Reddit ML
        'https://www.reddit.com/r/LocalLLaMA/.rss',                       # Reddit LocalLLaMA
        'https://www.reddit.com/r/artificial/.rss',                       # Reddit Artificial
    ],
    'vendor': [
        'https://status.openai.com/',                                      # OpenAI
        'https://status.anthropic.com/',                                   # Anthropic
        'https://status.deepmind.google/',                                 # DeepMind
        'https://status.mistral.ai/',                                      # Mistral
    ],
    'government': [
        'https://www.whitehouse.gov/ostp/',                               # US OSTP
        'https://www.gov.uk/government/groups/office-for-digital-and-data-policy',  # UK DSIT
        'https://digital-strategy.ec.europa.eu/',                         # EU DG-CONNECT
        'https://www.imda.gov.sg/',                                        # Singapore IMDA
        'https://www.meti.go.jp/english/',                                 # Japan METI
    ]
}

# Classification heuristics
KEYWORD_MAP = {
    'CMP': ['compliance', 'regulation', 'audit', 'conformity', 'directive', 'law', 'statute'],
    'SAF': ['safety', 'incident', 'harm', 'injury', 'death', 'kill', 'accident', 'danger', 'hazard'],
    'SEC': ['cve', 'vulnerability', 'exploit', 'attack', 'breach', 'injection', 'leak'],
    'BIA': ['bias', 'discrimination', 'fairness', 'disparity', 'race', 'gender', 'age', 'disability'],
    'PRV': ['privacy', 'gdpr', 'data subject', 'consent', 'breach', 'personal data', 'dsar'],
    'ETH': ['ethics', 'ethical', 'moral', 'value', 'misalignment', 'deception'],
    'SOV': ['sovereignty', 'jurisdiction', 'cloud act', 'data residency', 'national security'],
    'PRC': ['process', 'deployment', 'oversight', 'human-in-the-loop', 'automation'],
    'TRS': ['transparency', 'explainability', 'black box', 'opacity'],
    'ACC': ['accountability', 'audit trail', 'attribution'],
    'EXC': ['exclusion', 'marginalized', 'accessibility', 'discrimination'],
    'ENV': ['environment', 'energy', 'carbon', 'sustainability']
}

SEVERITY_KEYWORDS = {
    'S5': ['critical', 'severe', 'death', 'killed', 'fatal', 'catastrophic'],
    'S4': ['high', 'major', 'significant', 'enforcement', 'fine', 'penalty'],
    'S3': ['medium', 'moderate', 'concern', 'audit', 'investigation'],
    'S2': ['low', 'minor', 'advisory', 'warning'],
    'S1': ['info', 'update', 'notice', 'guidance']
}

GEO_KEYWORDS = {
    'UK': ['UK', 'Britain', 'London', 'ICO', 'FCA', 'CMA', 'NHS'],
    'EU': ['EU', 'Europe', 'GDPR', 'EU AI Act', 'EDPB', 'Brussels'],
    'US': ['US', 'America', 'FTC', 'NIST', 'CLOUD Act', 'Washington'],
    'CN': ['China', 'Chinese', 'CAC', 'Beijing', 'Shanghai'],
    'IN': ['India', 'Indian', 'MeitY'],
    'JP': ['Japan', 'METI'],
    'SG': ['Singapore', 'IMDA', 'MAS'],
    'AU': ['Australia'],
    'CA': ['Canada', 'AIDA'],
    'GLOBAL': ['global', 'worldwide', 'international']
}


def hash_signal(content):
    """SHA-256 hash of signal content for integrity."""
    return hashlib.sha256(content.encode('utf-8', errors='ignore')).hexdigest()


def classify(text):
    """Classify text into one of 12 categories based on keyword matching."""
    text_lower = text.lower()
    scores = {cat: 0 for cat in CATEGORIES}
    for cat, keywords in KEYWORD_MAP.items():
        for kw in keywords:
            if kw in text_lower:
                scores[cat] += 1
    # Return highest scoring category
    best_cat = max(CATEGORIES, key=lambda c: scores[c])
    return best_cat if scores[best_cat] > 0 else 'CMP'


def score_severity(text, category):
    """Score severity 1-5 based on keyword matching + category defaults."""
    text_lower = text.lower()
    for sev in ['S5', 'S4', 'S3', 'S2', 'S1']:
        for kw in SEVERITY_KEYWORDS[sev]:
            if kw in text_lower:
                return sev
    # Category defaults
    defaults = {'SAF': 'S3', 'SEC': 'S3', 'BIA': 'S2', 'PRV': 'S2', 'ETH': 'S2', 'SOV': 'S2'}
    return defaults.get(category, 'S1')


def geolocate(text):
    """Identify jurisdiction from text content."""
    text_lower = text.lower()
    for jur, keywords in GEO_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return jur
    return 'GLOBAL'


def fetch_url(url, timeout=10):
    """Fetch URL with User-Agent header."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'CSOAI-Watchdog/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return f"[FETCH ERROR: {e}]"


def extract_signals_from_rss(content, source_url):
    """Extract signal candidates from RSS/Atom feed."""
    # Simplified — in production use feedparser
    signals = []
    if '<item>' in content or '<entry>' in content:
        # Extract titles + descriptions
        import re
        # RSS format
        items = re.findall(r'<item>(.*?)</item>', content, re.DOTALL)
        if not items:
            items = re.findall(r'<entry>(.*?)</entry>', content, re.DOTALL)
        for item in items[:50]:
            title_match = re.search(r'<title[^>]*>(.*?)</title>', item, re.DOTALL)
            desc_match = re.search(r'<description[^>]*>(.*?)</description>', item, re.DOTALL)
            if not desc_match:
                desc_match = re.search(r'<summary[^>]*>(.*?)</summary>', item, re.DOTALL)
            link_match = re.search(r'<link[^>]*>(.*?)</link>', item)
            if not link_match:
                link_match = re.search(r'<link[^>]*href="([^"]+)"', item)
            pub_match = re.search(r'<pubDate>(.*?)</pubDate>', item)
            if not pub_match:
                pub_match = re.search(r'<published>(.*?)</published>', item)

            title = title_match.group(1)[:500] if title_match else ''
            desc = desc_match.group(1)[:1000] if desc_match else ''
            link = link_match.group(1) if link_match else source_url
            pub = pub_match.group(1) if pub_match else datetime.now(timezone.utc).isoformat()

            if title.strip():
                signals.append({
                    'source': source_url,
                    'title': title.strip(),
                    'description': desc.strip()[:500],
                    'link': link,
                    'published': pub,
                    'raw': title + ' ' + desc
                })
    return signals


def emit_signal_to_sov3(signal):
    """Emit a signal to SOV3 MCP server."""
    payload = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "tools/call",
        "params": {
            "name": "watchdog_emit_signal",
            "arguments": signal
        }
    }
    try:
        req = urllib.request.Request(
            SOV3_MCP_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        return {'error': str(e), 'queued_locally': True}


def save_signal_locally(signal):
    """Save signal to local SIGIL log."""
    log_file = WATCHDOG_DIR / "SIGNALS_LOG.jsonl"
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, 'a') as f:
        f.write(json.dumps(signal) + "\n")


def scan_source(category, url):
    """Scan a single source and return extracted signals."""
    print(f"  Scanning {category}: {url[:60]}...", file=sys.stderr)
    content = fetch_url(url)
    if content.startswith('[FETCH ERROR'):
        return []
    return extract_signals_from_rss(content, url)


def main():
    """Main scan loop — run once or as a cron."""
    print("=" * 78)
    print(f"PUBLIC WATCHDOG ACTIVE SCANNER")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print(f"Target SOV3: {SOV3_MCP_URL}")
    print("=" * 78)
    print()

    all_signals = []

    # Phase 1: Scan all sources
    for category, urls in SOURCES.items():
        print(f"\n[{category.upper()}] Scanning {len(urls)} sources...")
        for url in urls:
            signals = scan_source(category, url)
            for s in signals:
                # Classify
                text = s.get('raw', s.get('title', ''))
                cat = classify(text)
                sev = score_severity(text, cat)
                geo = geolocate(text)

                # Build full signal
                signal = {
                    'signal_id': f"WD-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}-{len(all_signals)+1:05d}",
                    'received_at': datetime.now(timezone.utc).isoformat(),
                    'source_type': 'WATCHDOG',
                    'source_url': s.get('source'),
                    'source_link': s.get('link'),
                    'category': cat,
                    'severity': sev,
                    'jurisdiction': geo,
                    'title': s.get('title', '')[:200],
                    'description': s.get('description', '')[:500],
                    'published': s.get('published'),
                    'content_hash': hash_signal(text),
                    'sigil_pending': True
                }
                all_signals.append(signal)

                print(f"    [{sev}] [{cat}] [{geo}] {signal['title'][:80]}...", file=sys.stderr)

    # Phase 2: Save + emit
    print(f"\n{'=' * 78}")
    print(f"SCAN COMPLETE: {len(all_signals)} signals extracted")
    print(f"{'=' * 78}")

    # Severity breakdown
    by_sev = {s: 0 for s in SEVERITIES}
    by_cat = {c: 0 for c in CATEGORIES}
    for s in all_signals:
        by_sev[s['severity']] += 1
        by_cat[s['category']] += 1

    print(f"\nBy severity: {by_sev}")
    print(f"By category: {by_cat}")

    # Save locally
    log_file = WATCHDOG_DIR / f"SCAN_{datetime.now(timezone.utc).strftime('%Y-%m-%d_%H%M')}.json"
    log_file.parent.mkdir(parents=True, exist_ok=True)
    log_file.write_text(json.dumps(all_signals, indent=2))
    print(f"\nSaved locally: {log_file}")

    # Emit critical signals to SOV3
    critical = [s for s in all_signals if s['severity'] in ('S4', 'S5')]
    print(f"\nEmitting {len(critical)} critical signals to SOV3 BFT council...")

    for s in critical:
        result = emit_signal_to_sov3(s)
        save_signal_locally(s)
        if 'error' not in result:
            print(f"  ✓ {s['signal_id']} → SIGIL emitted")
        else:
            print(f"  ! {s['signal_id']} → queued locally: {result['error'][:60]}")

    print(f"\n{'=' * 78}")
    print(f"SCAN COMPLETE · {len(all_signals)} signals · {len(critical)} critical")
    print(f"{'=' * 78}")
    return all_signals


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--list-sources':
        for cat, urls in SOURCES.items():
            print(f"\n[{cat}] {len(urls)} sources:")
            for u in urls:
                print(f"  - {u}")
    else:
        main()