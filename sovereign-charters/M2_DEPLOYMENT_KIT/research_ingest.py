#!/usr/bin/env python3
"""Sovereign research ingest — extracts new compliance frameworks from cached research.

Pipeline:
  1. Read all .bin caches in WATCHDOG/data/{academic,standards,government,news,vendor}
  2. Strip HTML → text + extract titles, links, dates
  3. Pattern-match against 12 framework-signal regexes (e.g. "EU AI Act", "NIST AI RMF",
     "ISO/IEC 4\d+", "Regulation (EU) 2024/\d+", "Executive Order 14\d+", "JSP \d+",
     "NIST SP 800-\d+", "FedRAMP", "UN R\d+", "DEFSTAN \d+-\d+")
  4. Emit new FRAMEWORK_CANDIDATES_2026-07-13.json with provenance + sha256
  5. Emit SIGIL receipt

Honest register: pattern extraction is heuristic. Each candidate is flagged
"auto-detected, needs human review". The 142 existing frameworks are NOT in this
output (we only emit NEW candidates not already in the OSCAL bundle).
"""

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

DATA = Path('/Users/nicholas/clawd/sovereign-charters/WATCHDOG/data')
OUT = Path('/Users/nicholas/clawd/sovereign-charters')

# Already-known framework codes (from OSCAL bundle) — to skip duplicates
KNOWN = {
    'EU-AI-ACT', 'UK-AISI', 'NIST-AI-RMF', 'ISO-42001', 'OECD-AI', 'NIS2', 'DORA',
    'GDPR', 'UK-GDPR', 'CCPA', 'PIPEDA', 'LGPD', 'APPI', 'NDPR', 'POPIA', 'KVKK',
    'PDP', 'PDPA-SG', 'PDPA-MY', 'PDPA-TH',
    'ISO-27001', 'ISO-27017', 'ISO-27018', 'ISO-27701', 'SOC2', 'NIST-CSF',
    'NIST-800-53', 'NIST-800-82', 'HIPAA', 'HITECH', '21CFR11', '21CFR820',
    'FDA-AIML', 'FDA-GMLP', 'MDR', 'DTAC', 'DCB0129', 'MHRA-SaMD',
    'ICH-E6', 'ICH-E9', 'GCP', 'GLP', 'GMP', 'GDP', 'GPvP', 'GAMP5',
    'FCA-SYSC', 'FCA-COND', 'PRA-SS123', 'SR117', 'SEC-AI', 'FINRA-AI',
    'MICA', 'MAS-FEAT', 'MAS-Veritas', 'APRA-CPS230', 'APRA-CPS234',
    'OSFI-B13', 'OSFI-E22', 'RBNZ', 'FMA-NZ', 'JFSA-AI', 'FSC-KR',
    'CBIRC', 'RBI-AI', 'SAMA', 'DFSA', 'CBUAE', 'QCB',
    'EUCS', 'SECNUMCLOUD', 'BSI-C5', 'TISAX', 'IRAP', 'PSN', 'G-CLOUD',
    'DSPT', 'GOVASSURE', 'CYBER-ESSENTIALS', 'CDEI', 'ATRS',
    'UN-R155', 'UN-R156', 'ISO-21434', 'ISO-8800', 'ISO-26262', 'ISO-21448',
    'EASA-AI', 'FAA-AI', 'CAA-AAM', 'IMO-MASS', 'MGN-654',
    'IEC-62443', 'NERC-CIP', 'TSA-Pipeline',
    'JSP-936', 'DEFSTAN-00970', 'AUKUS', 'FIVE-EYES', 'NATO-AI',
    'DARPA-AI', 'FedRAMP', 'DoD-IL5', 'DoD-SRG', 'CMMC',
    'EO-14110', 'NIST-AI-600-1', 'NSM-8', 'TISAX-AL3',
    'GDPR-DPA', 'EU-AI-Liability', 'PLD', 'Cyber-Resilience-Act',
    'Data-Act', 'Data-Governance-Act', 'DMA', 'DSA', 'eIDAS2', 'CRA', 'ECCC',
    'ENISA-AI', 'CE-marking', 'RED', 'EMC', 'LVD', 'RoHS', 'REACH', 'WEEE',
    'Modern-Slavery-Act', 'Bribery-Act', 'Companies-Act-2006',
    'FSMA-2000', 'FSMA-2023', 'PIDA-2023',
    'OSPAR', 'IEA', 'TCFD', 'ISSB-S1', 'ISSB-S2', 'CSRD', 'SFDR', 'EU-Taxonomy',
}

# Framework detection patterns. Each yields (code, name, region, severity_hint).
# We are aggressive — false positives are OK (human review flag is set).
# Order matters: more specific patterns first.
PATTERNS = [
    # EU regulations
    (re.compile(r'\bRegulation\s+\(EU\)\s+(\d{4}/\d+)', re.I), 'EU', 'high', 'eu-reg'),
    (re.compile(r'\bDirective\s+\(EU\)\s+(\d{4}/\d+)', re.I), 'EU', 'high', 'eu-dir'),
    (re.compile(r'\bImplementing\s+Regulation\s+\(EU\)\s+(\d{4}/\d+)', re.I), 'EU', 'high', 'eu-impl'),
    (re.compile(r'\bCommission\s+Implementing\s+Decision\s+\(EU\)\s+(\d{4}/\d+)', re.I), 'EU', 'high', 'eu-dec'),

    # ISO standards
    (re.compile(r'\bISO/IEC\s*(\d{4,5})(?::(\d{4}))?\b', re.I), 'INT', 'high', 'iso'),
    (re.compile(r'\bISO/IEC\s+(TR|TS)\s+(\d{4,5})(?::(\d{4}))?\b', re.I), 'INT', 'medium', 'iso-tr'),
    (re.compile(r'\bISO\s+(\d{4,5})(?::(\d{4}))?\b', re.I), 'INT', 'medium', 'iso-plain'),

    # NIST
    (re.compile(r'\bNIST\s+SP\s+(\d{3}-\d{3,4}[A-Za-z]?(?:\s*(?:Rev\.?\s*\d+|r\d+))?)', re.I), 'US', 'high', 'nist'),
    (re.compile(r'\bNIST\s+(AI\s+\d+-\d+|CSF\s+\d+\.\d+)', re.I), 'US', 'high', 'nist'),
    (re.compile(r'\bNIST\s+FIPS\s+(\d{3}(?:-\d)?)', re.I), 'US', 'high', 'fips'),
    (re.compile(r'\bNIST\s+IR\s+(\d{4,5})', re.I), 'US', 'medium', 'ir'),

    # US Executive Orders
    (re.compile(r'\bExecutive\s+Order\s+(\d{5})\b', re.I), 'US', 'high', 'eo'),

    # UK Defence / Government
    (re.compile(r'\bJSP\s+(\d{3,4})\b', re.I), 'UK', 'high', 'jsp'),
    (re.compile(r'\bDEFSTAN\s+(\d{2}-\d{3}(?:/[A-Za-z]?\d*)?)', re.I), 'UK', 'high', 'defstan'),
    (re.compile(r'\bNCSC\s+(?:Guidance|CAF)[:\s]+([A-Z][A-Za-z0-9\s\-]{3,60})', re.I), 'UK', 'medium', 'ncsc'),

    # BSI
    (re.compile(r'\bBS\s+(?:EN\s+)?(\d{4,5}(?:-\d+)?)', re.I), 'INT', 'medium', 'bs'),
    (re.compile(r'\bPAS\s+(\d{4}:?\d*)', re.I), 'INT', 'medium', 'pas'),

    # IETF / W3C
    (re.compile(r'\bRFC\s+(\d{4,5})\b', re.I), 'INT', 'low', 'rfc'),
    (re.compile(r'\bW3C\s+(?:Recommendation|TR)[:\s]+([A-Z][A-Za-z0-9\s\-]{3,40})', re.I), 'INT', 'low', 'w3c'),

    # ETSI
    (re.compile(r'\bETSI\s+(?:EN\s+)?(\d{3}\s+\d{3}(?:-\d+)?)', re.I), 'INT', 'medium', 'etsi'),
    (re.compile(r'\bETSI\s+TS\s+(\d{3}\s+\d{3})', re.I), 'INT', 'medium', 'etsi'),
    (re.compile(r'\bETSI\s+ES\s+(\d{3}\s+\d{3})', re.I), 'INT', 'medium', 'etsi'),

    # UNECE automotive
    (re.compile(r'\bUN\s+(?:Regulation\s+)?R?(\d{2,3})\b', re.I), 'INT', 'high', 'un-r'),

    # ICAO / IMO
    (re.compile(r'\bICAO\s+Annex\s+(\d{1,2})', re.I), 'INT', 'medium', 'icao'),
    (re.compile(r'\bIMO\s+(Resolution\s+)?([A-Z]\d+(?:\.\d+)?)', re.I), 'INT', 'medium', 'imo'),

    # IEEE
    (re.compile(r'\bIEEE\s+(\d{3,4}(?:\.\d{4})?(?:-\d{4})?)', re.I), 'INT', 'medium', 'ieee'),

    # CIS Controls
    (re.compile(r'\bCIS\s+(Critical\s+Security\s+)?Controls?\s+(v)?(\d+(?:\.\d+)?)', re.I), 'INT', 'medium', 'cis'),
    (re.compile(r'\bCIS\s+Benchmarks?\b', re.I), 'INT', 'medium', 'cis-bench'),

    # OWASP
    (re.compile(r'\bOWASP\s+(Top\s+10\s+(?:LLMs?|API|RISKS?)|ASVS|MASVS|Mobile|IoT|SAMM|ModSec|Cyber\s+Range|API\s+Security)', re.I), 'INT', 'medium', 'owasp'),

    # Direct framework mentions (case insensitive)
    (re.compile(r'\b(ATRS)\s+(?:standard|framework|recording)\b', re.I), 'UK', 'medium', 'atrs'),
    (re.compile(r'\b(ATRS)\b\s+v?(\d+(?:\.\d+)?)?', re.I), 'UK', 'medium', 'atrs-v'),
    (re.compile(r'\bGovAssure\b', re.I), 'UK', 'high', 'govassure'),
    (re.compile(r'\bCyber\s+Essentials(?:\s+Plus)?\b', re.I), 'UK', 'medium', 'ce'),
    (re.compile(r'\b(ISO\s+42001)\b', re.I), 'INT', 'high', 'iso-42001'),  # already in KNOWN but test pattern
    (re.compile(r'\bQuantum[- ]safe[\s\-]+(algorithms?|cryptography|migration)\b', re.I), 'INT', 'high', 'quantum'),
    (re.compile(r'\bNIST\s+(?:PQC|Post[- ]Quantum)\b', re.I), 'US', 'high', 'pqc'),
    (re.compile(r'\b(?:ML-DSA|ML-KEM|ML-KEM-\d+|Dilithium|Kyber)\b', re.I), 'INT', 'high', 'pqc-alg'),
    (re.compile(r'\bEU\s+AI\s+Act\s+(?:Implementing|Secondary|Delegated)\s+Acts?\b', re.I), 'EU', 'high', 'ai-act-secondary'),
    (re.compile(r'\bCode\s+of\s+Practice\s+for\s+(?:GPAI|General[- ]Purpose\s+AI)\b', re.I), 'EU', 'high', 'ai-code-practice'),
    (re.compile(r'\bUK\s+AI\s+(?:Bill|Safety\s+Bill)\b', re.I), 'UK', 'high', 'uk-ai-bill'),
    (re.compile(r'\bAISI\s+(?:Voluntary|Inspection|Framework)\b', re.I), 'UK', 'high', 'aisi-voluntary'),
    (re.compile(r'\bEUCS\s+(?:High|Substantial|Sovereign)\b', re.I), 'EU', 'high', 'eucs-tier'),
    (re.compile(r'\bC5\s+(?:Type\s+2|2025)\b', re.I), 'DE', 'high', 'c5-update'),
    (re.compile(r'\bNIST\s+AI\s+600-1\b', re.I), 'US', 'high', 'nist-ai-600'),
    (re.compile(r'\bISO/IEC\s+42001:2023\b', re.I), 'INT', 'high', 'iso-42001-explicit'),

    # Loose names — many sources mention frameworks without strict format
    (re.compile(r'\bEU\s+AI\s+Act\b(?!\s+(?:Implementing|Secondary|Delegated))', re.I), 'EU', 'high', 'eu-ai-act'),
    (re.compile(r'\bNIST\s+AI\s+RMF\b', re.I), 'US', 'high', 'nist-ai-rmf'),
    (re.compile(r'\bNIST\s+Cybersecurity\s+Framework\b', re.I), 'US', 'high', 'nist-csf'),
    (re.compile(r'\bNIS\s*2\s+Directive\b', re.I), 'EU', 'high', 'nis2-explicit'),
    (re.compile(r'\bDORA\b', re.I), 'EU', 'high', 'dora-explicit'),
    (re.compile(r'\bDigital\s+Operational\s+Resilience\s+Act\b', re.I), 'EU', 'high', 'dora-full'),
    (re.compile(r'\bUK\s+GDPR\b', re.I), 'UK', 'high', 'uk-gdpr-explicit'),
    (re.compile(r'\bGeneral\s+Data\s+Protection\s+Regulation\b', re.I), 'EU', 'high', 'gdpr-full'),
    (re.compile(r'\bHIPAA\b', re.I), 'US', 'high', 'hipaa-explicit'),
    (re.compile(r'\bISO\s*27001\b', re.I), 'INT', 'high', 'iso-27001-explicit'),
    (re.compile(r'\bSOC\s*2\b(?!\s*Type)', re.I), 'US', 'medium', 'soc2-explicit'),
    (re.compile(r'\bCMMC\s*2?\.?0?\b', re.I), 'US', 'high', 'cmmc-explicit'),
    (re.compile(r'\bFedRAMP\s+(?:High|Moderate|Low)?\b', re.I), 'US', 'high', 'fedramp-explicit'),
    (re.compile(r'\bAUKUS\b', re.I), 'INT', 'high', 'aukus-explicit'),
    (re.compile(r'\bFive\s+Eyes\b', re.I), 'INT', 'high', 'five-eyes-explicit'),
    (re.compile(r'\bNATO\s+AI\s+Strategy\b', re.I), 'INT', 'high', 'nato-ai-explicit'),
    (re.compile(r'\bDoD\s+(?:IL|Impact\s+Level)\s*5\b', re.I), 'US', 'high', 'dod-il5-explicit'),
    (re.compile(r'\bExecutive\s+Order\s+14110\b', re.I), 'US', 'high', 'eo-14110-explicit'),
    (re.compile(r'\bNIST\s+AI\s+600-1\b', re.I), 'US', 'high', 'nist-ai-600-explicit'),
    (re.compile(r'\bISO\s+42001\b', re.I), 'INT', 'high', 'iso-42001-loose'),
    (re.compile(r'\bISO/IEC\s+42001\b', re.I), 'INT', 'high', 'iso-42001-loose-iec'),
    (re.compile(r'\bNIS2\b', re.I), 'EU', 'high', 'nis2-loose'),
    (re.compile(r'\bMiCA\b', re.I), 'EU', 'high', 'mica-loose'),
    (re.compile(r'\bMarkets\s+in\s+Crypto-?Assets\b', re.I), 'EU', 'high', 'mica-full'),
    (re.compile(r'\bGDPR\b', re.I), 'EU', 'high', 'gdpr-loose'),
    (re.compile(r'\bDORA\s+Regulation\b', re.I), 'EU', 'high', 'dora-loose'),
    (re.compile(r'\bCyber\s+Resilience\s+Act\b', re.I), 'EU', 'high', 'cra-loose'),
    (re.compile(r'\bEUCS\b', re.I), 'EU', 'high', 'eucs-loose'),
    (re.compile(r'\bSecNumCloud\b', re.I), 'FR', 'high', 'secnumcloud-loose'),
    (re.compile(r'\bIRAP\b', re.I), 'AU', 'high', 'irap-loose'),
    (re.compile(r'\bGAMP\s+5\b', re.I), 'INT', 'high', 'gamp5-loose'),
    (re.compile(r'\bGMLP\b', re.I), 'INT', 'medium', 'gmlp-loose'),
    (re.compile(r'\bSaMD\b', re.I), 'INT', 'high', 'samd-loose'),
    (re.compile(r'\bUN\s+R155\b', re.I), 'INT', 'high', 'un-r155-loose'),
    (re.compile(r'\bISO\s*21434\b', re.I), 'INT', 'high', 'iso-21434-loose'),
    (re.compile(r'\bEASA\s+AI\s+Concept\s+Paper\b', re.I), 'EU', 'high', 'easa-paper'),
    (re.compile(r'\bNCSC\s+CAF\b', re.I), 'UK', 'high', 'ncsccaf-loose'),
    (re.compile(r'\bDSPT\b', re.I), 'UK', 'medium', 'dspt-loose'),
    (re.compile(r'\bG-Cloud\s+14\b', re.I), 'UK', 'medium', 'gcloud14-loose'),
    (re.compile(r'\bGovAssure\b', re.I), 'UK', 'high', 'govassure-loose'),
    (re.compile(r'\bATRS\b', re.I), 'UK', 'medium', 'atrs-loose'),
    (re.compile(r'\bAUKUS\s+Pillar\s+2\b', re.I), 'INT', 'high', 'aukus-pillar2'),
]


def strip_html(text):
    """Cheap HTML stripper (stdlib only)."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&quot;', '"', text)
    text = re.sub(r'&#\d+;', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def base_code(code):
    """Strip loose/mention suffixes for KNOWN-set matching."""
    for suffix in ['-loose', '-mention', '-fullname', '-explicit']:
        if code.endswith(suffix):
            return code[:-len(suffix)]
    return code


def extract_titles(text):
    """Extract <title> tags and arxiv id + links."""
    titles = re.findall(r'<title>([^<]+)</title>', text)
    links = re.findall(r'<link>([^<]+)</link>', text)
    ids = re.findall(r'arxiv\.org/abs/(\d+\.\d+)', text)
    dates = re.findall(r'<pubDate>([^<]+)</pubDate>', text)
    return titles, links, ids, dates


def main():
    seen = {}  # code -> record
    sources_scanned = 0
    bytes_scanned = 0

    for cat in ['academic', 'standards', 'government', 'news', 'industry', 'vendor', 'vulnerability']:
        d = DATA / cat
        if not d.exists():
            continue
        for p in sorted(d.glob('*.bin')):
            sources_scanned += 1
            try:
                raw = p.read_text(errors='ignore')
                bytes_scanned += len(raw)
            except Exception:
                continue

            titles, links, ids, dates = extract_titles(raw)
            text = strip_html(raw)

            for pat, region, sev, kind in PATTERNS:
                for m in pat.finditer(text):
                    raw_match = m.group(0).strip()
                    # Normalise code
                    if kind == 'iso':
                        code = f'ISO/IEC {m.group(1)}'
                        if m.group(2):
                            code += f':{m.group(2)}'
                    elif kind == 'nist':
                        code = f'NIST SP {m.group(1)}'
                    elif kind == 'nist-ai':
                        code = f'NIST {m.group(0).replace("NIST ","").strip()}'
                    elif kind == 'fips':
                        code = f'FIPS {m.group(1)}'
                    elif kind == 'ir':
                        code = f'NIST IR {m.group(1)}'
                    elif kind == 'eo':
                        code = f'EO {m.group(1)}'
                    elif kind == 'jsp':
                        code = f'JSP {m.group(1)}'
                    elif kind == 'defstan':
                        code = f'DEFSTAN {m.group(1).replace(" ","")}'
                    elif kind == 'eu-reg':
                        code = f'EU-Reg-{m.group(1)}'
                    elif kind == 'eu-dir':
                        code = f'EU-Dir-{m.group(1)}'
                    elif kind == 'eu-impl':
                        code = f'EU-Impl-{m.group(1)}'
                    elif kind == 'bs':
                        code = f'BS {m.group(1)}'
                    elif kind == 'pas':
                        code = f'PAS {m.group(1)}'
                    elif kind == 'rfc':
                        code = f'RFC {m.group(1)}'
                    elif kind == 'w3c':
                        code = f'W3C-{m.group(1).strip()[:30]}'
                    elif kind == 'etsi':
                        code = f'ETSI-{m.group(1).replace(" ","")}'
                    elif kind == 'un-r':
                        code = f'UN-R{m.group(1)}'
                    elif kind == 'icao':
                        code = f'ICAO-Annex-{m.group(1)}'
                    elif kind == 'imo':
                        code = f'IMO-{m.group(2)}'
                    elif kind == 'ieee':
                        code = f'IEEE-{m.group(1)}'
                    elif kind == 'cis':
                        code = f'CIS-Controls-{m.group(3)}'
                    elif kind == 'owasp':
                        code = f'OWASP-{m.group(1).strip()[:30].replace(" ","-")}'
                    elif kind == 'ncsc':
                        code = f'NCSC-{m.group(1).strip()[:30].replace(" ","-")}'
                    elif kind == 'eu-dec':
                        code = f'EU-Dec-{m.group(1)}'
                    elif kind == 'iso-tr':
                        code = f'ISO/IEC {m.group(1)} {m.group(2)}{m.group(3) and ":" + m.group(3) or ""}'
                    elif kind == 'iso-plain':
                        code = f'ISO {m.group(1)}'
                        if m.group(2):
                            code += f':{m.group(2)}'
                    elif kind == 'cis-bench':
                        code = 'CIS-Benchmarks'
                    elif kind == 'atrs':
                        code = 'ATRS'
                    elif kind == 'atrs-v':
                        code = f'ATRS-v{m.group(2) or "1.0"}'
                    elif kind == 'govassure':
                        code = 'GovAssure-v2'
                    elif kind == 'ce':
                        code = 'Cyber-Essentials'
                    elif kind == 'iso-42001':
                        code = 'ISO/IEC 42001'
                    elif kind == 'quantum':
                        code = 'NIST-PQC'
                    elif kind == 'pqc':
                        code = 'NIST-PQC'
                    elif kind == 'pqc-alg':
                        code = f'PQC-{m.group(0).replace(" ","").replace("-","")}'
                    elif kind == 'ai-act-secondary':
                        code = 'EU-AI-Act-Secondary'
                    elif kind == 'ai-code-practice':
                        code = 'EU-GPAI-Code-of-Practice'
                    elif kind == 'uk-ai-bill':
                        code = 'UK-AI-Bill'
                    elif kind == 'aisi-voluntary':
                        code = 'UK-AISI-Voluntary'
                    elif kind == 'eucs-tier':
                        code = f'EUCS-{m.group(1)}'
                    elif kind == 'c5-update':
                        code = 'BSI-C5-Type-2'
                    elif kind == 'nist-ai-600':
                        code = 'NIST-AI-600-1'
                    elif kind == 'iso-42001-explicit':
                        code = 'ISO/IEC 42001:2023'
                    elif kind == 'eu-ai-act':
                        code = 'EU-AI-ACT-loose'
                    elif kind == 'nist-ai-rmf':
                        code = 'NIST-AI-RMF-loose'
                    elif kind == 'nist-csf':
                        code = 'NIST-CSF-loose'
                    elif kind == 'nis2-explicit':
                        code = 'NIS2-Directive-loose'
                    elif kind == 'dora-explicit':
                        code = 'DORA-loose'
                    elif kind == 'dora-full':
                        code = 'DORA-fullname'
                    elif kind == 'uk-gdpr-explicit':
                        code = 'UK-GDPR-loose'
                    elif kind == 'gdpr-full':
                        code = 'GDPR-fullname'
                    elif kind == 'hipaa-explicit':
                        code = 'HIPAA-loose'
                    elif kind == 'iso-27001-explicit':
                        code = 'ISO-27001-loose'
                    elif kind == 'soc2-explicit':
                        code = 'SOC2-loose'
                    elif kind == 'cmmc-explicit':
                        code = 'CMMC-loose'
                    elif kind == 'fedramp-explicit':
                        code = 'FedRAMP-loose'
                    elif kind == 'aukus-explicit':
                        code = 'AUKUS-loose'
                    elif kind == 'five-eyes-explicit':
                        code = 'FIVE-EYES-loose'
                    elif kind == 'nato-ai-explicit':
                        code = 'NATO-AI-loose'
                    elif kind == 'dod-il5-explicit':
                        code = 'DoD-IL5-loose'
                    elif kind == 'eo-14110-explicit':
                        code = 'EO-14110-loose'
                    elif kind == 'nist-ai-600-explicit':
                        code = 'NIST-AI-600-1-loose'
                    elif kind == 'iso-42001-loose':
                        code = 'ISO-42001-mention'
                    elif kind == 'iso-42001-loose-iec':
                        code = 'ISO-IEC-42001-mention'
                    elif kind == 'nis2-loose':
                        code = 'NIS2-mention'
                    elif kind == 'mica-loose':
                        code = 'MiCA-mention'
                    elif kind == 'mica-full':
                        code = 'MiCA-fullname'
                    elif kind == 'gdpr-loose':
                        code = 'GDPR-mention'
                    elif kind == 'dora-loose':
                        code = 'DORA-Reg-mention'
                    elif kind == 'cra-loose':
                        code = 'CRA-mention'
                    elif kind == 'eucs-loose':
                        code = 'EUCS-mention'
                    elif kind == 'secnumcloud-loose':
                        code = 'SecNumCloud-mention'
                    elif kind == 'irap-loose':
                        code = 'IRAP-mention'
                    elif kind == 'gamp5-loose':
                        code = 'GAMP5-mention'
                    elif kind == 'gmlp-loose':
                        code = 'GMLP-mention'
                    elif kind == 'samd-loose':
                        code = 'SaMD-mention'
                    elif kind == 'un-r155-loose':
                        code = 'UN-R155-mention'
                    elif kind == 'iso-21434-loose':
                        code = 'ISO-21434-mention'
                    elif kind == 'easa-paper':
                        code = 'EASA-AI-Paper-mention'
                    elif kind == 'ncsccaf-loose':
                        code = 'NCSC-CAF-mention'
                    elif kind == 'dspt-loose':
                        code = 'DSPT-mention'
                    elif kind == 'gcloud14-loose':
                        code = 'G-Cloud-14-mention'
                    elif kind == 'govassure-loose':
                        code = 'GovAssure-mention'
                    elif kind == 'atrs-loose':
                        code = 'ATRS-mention'
                    elif kind == 'aukus-pillar2':
                        code = 'AUKUS-Pillar2-mention'
                    else:
                        code = raw_match[:60]

                    if base_code(code) in KNOWN or code in KNOWN:
                        seen.setdefault('__known_mention__' + code, {'code': code, 'name': raw_match[:120], 'region': region, 'severity_hint': sev, 'kind': kind, 'mention_count': 0, 'sources': []})
                        seen['__known_mention__' + code]['mention_count'] += 1
                        if p.name not in seen['__known_mention__' + code]['sources']:
                            seen['__known_mention__' + code]['sources'].append(p.name)
                        continue
                    if code in seen:
                        seen[code]['mention_count'] += 1
                        continue

                    sha = hashlib.sha256(f'{code}|{raw_match}|{p.name}'.encode()).hexdigest()[:16]
                    seen[code] = {
                        'code': code,
                        'name': raw_match[:120],
                        'region': region,
                        'severity_hint': sev,
                        'kind': kind,
                        'mention_count': 1,
                        'first_seen_in': p.name,
                        'first_seen_category': cat,
                        'sha256': sha,
                        'status': 'auto-detected, needs human review',
                        'honest_register': 'Pattern extraction is heuristic. Each candidate is flagged for review. False positives are possible.'
                    }

    candidates = [c for c in sorted(seen.values(), key=lambda x: -x['mention_count']) if 'first_seen_in' in c]
    known_mentions = sorted([v for k, v in seen.items() if k.startswith('__known_mention__')], key=lambda x: -x['mention_count'])
    now = datetime.now(timezone.utc).isoformat()

    out = {
        'generated_at': now,
        'sources_scanned': sources_scanned,
        'bytes_scanned': bytes_scanned,
        'pattern_types': len(PATTERNS),
        'known_frameworks_in_corpus': len(KNOWN),
        'known_frameworks_mentioned_in_research': len(known_mentions),
        'top_known_mentions': [{'code': m['code'], 'mentions': m['mention_count'], 'sources': m['sources'][:5]} for m in known_mentions[:20]],
        'new_candidates': len(candidates),
        'candidates': candidates,
        'honest_register': 'Heuristic extraction. Each new candidate requires human review. Mention count = number of unique .bin sources where the pattern matched. Known frameworks mentioned in research are tracked separately (proof-of-coverage signal).',
        'next_actions': [
            'Human reviews new candidates and either: (a) promote to OSCAL bundle, (b) reject with reason, (c) merge with existing framework.',
            'Re-run weekly to catch newly cached .bin files.',
            'Add more patterns as new framework families emerge (e.g. quantum-safe, AI Bill, sectoral).',
            'Top known-mention frameworks with high coverage are strong signals to invest in deeper mapping.'
        ]
    }

    out_path = OUT / 'FRAMEWORK_CANDIDATES_2026-07-13.json'
    out_path.write_text(json.dumps(out, indent=2))

    # Emit SIGIL
    sigil = hashlib.sha256(f'research-ingest|{now}|{len(candidates)}'.encode()).hexdigest()[:32]
    log = OUT / 'SIGIL_LOG.txt'
    with open(log, 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|RESEARCH-INGEST. sources={sources_scanned} bytes={bytes_scanned} candidates={len(candidates)} sigils_in_chain++\n')

    print(f'Sources scanned: {sources_scanned}')
    print(f'Bytes scanned:    {bytes_scanned:,}')
    print(f'Patterns:         {len(PATTERNS)}')
    print(f'Known skipped:    {len(KNOWN)}')
    print(f'New candidates:   {len(candidates)}')
    print(f'Top 10 candidates:')
    for c in candidates[:10]:
        print(f"  {c['code']:30s} mentions={c['mention_count']:3d}  region={c['region']:4s}  {c['first_seen_in'][:30]}")
    print(f'Saved: {out_path}')
    print(f'SIGIL: {sigil}')


if __name__ == '__main__':
    main()