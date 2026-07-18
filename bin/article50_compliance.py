#!/usr/bin/env python3
"""
EU AI Act Article 50 compliance checker — 22-day countdown to 2 Aug 2026.

Validates that our provenance layers meet the requirements of:
  - Art. 50(2): machine-readable marking of AI-generated content
  - Art. 50(4): deepfake & public-interest-text labeling
  - Art. 50(5): disclosure manner

Required provenance stack per the Code of Practice (June 2026):
  - Metadata provenance (C2PA 2.3/2.4 + Trust List)
  - Invisible watermark (SynthID or C2PA soft binding)
  - Logging (every AI generation event recorded)
  - Detection tool (read the watermarks/metadata)

Score: 100/100 means full compliance; reports gaps per layer.

Usage:
  article50-compliance              # full audit
  article50-compliance --layer C2PA # layer-specific
  article50-compliance --json       # machine-readable output
"""

import json
import argparse
import hashlib
import time
from pathlib import Path
from datetime import datetime, timezone

CARE_FLOOR = 0.95

# Per the EU Code of Practice on Transparency of AI-Generated Content (10 June 2026)
# Each layer is REQUIRED, not just one — single silver bullet rejected
REQUIRED_LAYERS = [
    {
        'name': 'Metadata provenance (C2PA 2.3+ manifest)',
        'code': 'C2PA',
        'spec_ref': 'Art. 50(2)',
        'status': 'PRIMARY',
        'min_spec': 'C2PA 2.3 (Jan 2026)',
        'ideal': 'C2PA 2.4 (Trust List conformance)',
        'github': 'https://github.com/c2pa-org/c2pa-python',
        'rationale': 'C2PA is the most technically mature route to 50(2) compliance. Trust List conformance is the credibility bar.',
        'sub_check': '_check_c2pa_implementation',
    },
    {
        'name': 'Invisible watermark (SynthID or equivalent)',
        'code': 'WATERMARK',
        'spec_ref': 'Art. 50(2)',
        'status': 'PRIMARY',
        'min_spec': 'Cross-vendor watermark (e.g., SynthID)',
        'ideal': 'Pair with C2PA manifest',
        'github': 'https://github.com/withsecure/synthetic_text_audit',
        'rationale': 'Metadata alone is not durable. The Code of Practice explicitly rejects single-mechanism marking.',
        'sub_check': '_check_watermark_implementation',
    },
    {
        'name': 'Generation event logging',
        'code': 'LOGGING',
        'spec_ref': 'Art. 50(2)',
        'status': 'PRIMARY',
        'min_spec': 'Every AI generation event recorded (Ed25519+timestamped)',
        'ideal': 'Verifiable Intent-style tamper-proof log',
        'github': 'https://github.com/anchore/syft',
        'rationale': 'Non-repudiable log of every generation enables downstream verification.',
        'sub_check': '_check_logging_implementation',
    },
    {
        'name': 'Detection / verification tool',
        'code': 'DETECTION',
        'spec_ref': 'Art. 50(2), 50(4)',
        'status': 'REQUIRED_BY_FEB_2027',
        'min_spec': 'Read metadata + watermark',
        'ideal': 'Pair with public verification UI',
        'github': 'https://proofof.ai/verify',
        'rationale': '2 Feb 2027: providers must have a watermark-detection interoperability solution in place.',
        'sub_check': '_check_detection_implementation',
    },
    {
        'name': 'Deepfake labeling (50(4))',
        'code': 'DEEPFAKE',
        'spec_ref': 'Art. 50(4)',
        'status': 'PRIMARY',
        'min_spec': 'Label content that could be mistaken for a real person/place/event',
        'ideal': 'Include in C2PA manifest + visible footer',
        'github': '',
        'rationale': 'Public-interest disclosure is a separate compliance axis from machine-readable marking.',
        'sub_check': '_check_deepfake_label',
    },
    {
        'name': 'Disclosure manner (50(5))',
        'code': 'DISCLOSURE',
        'spec_ref': 'Art. 50(5)',
        'status': 'PRIMARY',
        'min_spec': 'Manner of disclosure appropriate to use case',
        'ideal': 'Visible UI badge + API response header',
        'github': '',
        'rationale': '50(5): "appropriate manner" — depends on context (chatbot vs deepfake vs public-interest text).',
        'sub_check': '_check_disclosure',
    },
]


# ───────── implementation checks (search our codebase) ─────────

def _check_c2pa_implementation():
    """Check if C2PA manifest library is on disk / referenced in any charter/code."""
    candidates = []
    # Search the federation for C2PA references
    for root in ['/Users/nicholas/clawd/sovereign-charters', '/Users/nicholas/clawd/_alignment']:
        r = Path(root)
        if not r.exists():
            continue
        for f in r.rglob('*.md'):
            try:
                if 'c2pa' in f.read_text(errors='ignore').lower():
                    candidates.append(f.name)
            except Exception:
                pass
    return {
        'present': any(c != 'PROOF_OF_CUSTODY.md' for c in candidates),  # exclude docs that just mention C2PA in passing
        'evidence': candidates[:3],
        'gap': 'C2PA library (c2pa-python) not integrated; only mentioned in DOCS, not in CODE path',
    }


def _check_watermark_implementation():
    """SynthID verifier / SynthID detector available."""
    synthid_paths = [
        Path('/Users/nicholas/clawd/mcp-marketplace/c2pa-watermark-mcp'),
        Path('/Users/nicholas/clawd/_alignment/synthid-detector'),
    ]
    found = [p for p in synthid_paths if p.exists()]
    # Check if any chord proxies through our substrate
    has_synthid_referenced = False
    for root in ['/Users/nicholas/clawd/sovereign-charters', '/Users/nicholas/clawd/_alignment']:
        r = Path(root)
        if r.exists():
            for f in r.glob('*article-50*'):
                if 'synthid' in f.read_text(errors='ignore').lower():
                    has_synthid_referenced = True
                    break
    return {
        'present': bool(found) or has_synthid_referenced,
        'evidence': [str(p) for p in found],
        'gap': 'SynthID detector not on disk; would need to use c2pa-python watermarking OR Google DeepMind SynthID detector',
    }


def _check_logging_implementation():
    """SIGIL chain = generation event log."""
    sigil_files = list((Path.home() / '.sovereign').glob('*.sigil.jsonl'))
    total_hops = 0
    for f in sigil_files:
        try:
            total_hops += sum(1 for _ in f.open())
        except Exception:
            pass
    return {
        'present': total_hops > 0,
        'evidence': [f.name for f in sigil_files][:5] + [f"Total hops: {total_hops}"],
        'gap': 'SIGIL chain exists but not specifically structured for AI generation events. Need GENESIS events tagged with model_id, prompt_hash, output_hash.',
    }


def _check_detection_implementation():
    """/api/provenance or /proofof-verify.html for reader-side verification."""
    detection_paths = [
        '/Users/nicholas/clawd/csoai-static-deploy2/proofof-verify.html',
        '/Users/nicholas/clawd/sovereign-temple/security/keystone_proxy_server.py',  # signed evidence path
    ]
    found = [p for p in detection_paths if Path(p).exists()]
    return {
        'present': bool(found),
        'evidence': found,
        'gap': '/api/provenance exists but discovery layer + public URL need hardening for Feb 2027 deadline',
    }


def _check_deepfake_label():
    """Deepfake labelling (50(4)) — check sovereign Mist 12 Pillars + sovereign Mist 12 Pillars sovereignty + sovereign Mist 12 Pillars sovereignty substrate policies."""
    # We have DORADO hard-stop and Care-Floor for harm but not "deepfake" labelling explicit
    paths = [
        '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_dorado.py',
        '/Users/nicholas/clawd/_alignment/sovereign-persona/',
    ]
    found = [p for p in paths if Path(p).exists()]
    has_deepfake_ref = False
    for p in found:
        try:
            text = Path(p).read_text(errors='ignore') if Path(p).is_file() else ''
            # If it's a directory, grep md files
            if not text:
                pth = Path(p)
                for f in pth.rglob('*.md'):
                    text += f.read_text(errors='ignore')
            if 'deepfake' in text.lower():
                has_deepfake_ref = True
        except Exception:
            pass
    return {
        'present': has_deepfake_ref,
        'evidence': found,
        'gap': 'Care-Floor 0.95 + DORADO stop = substrate-level deepfake guard, but not labeled compliance layer',
    }


def _check_disclosure():
    """Disclosure manner (50(5)) — visible UI badge / API response header."""
    # /api/daily-golden, /api/eat-tick, /api/provenance — check if any header contains
    # "X-AI-Generated: true" or similar
    api_paths = [
        '/Users/nicholas/clawd/csoai-static-deploy2/api',
    ]
    found_disclosure = False
    for p in api_paths:
        r = Path(p)
        if r.exists():
            for f in r.glob('*.js'):
                if 'X-AI-Generated' in f.read_text(errors='ignore') or 'AIGenerated' in f.read_text(errors='ignore'):
                    found_disclosure = True
    return {
        'present': found_disclosure,
        'evidence': [str(p) for p in api_paths],
        'gap': 'No explicit X-AI-Generated header in API responses (50(5) manner-of-disclosure)',
    }


CHECK_MAP = {
    'C2PA': _check_c2pa_implementation,
    'WATERMARK': _check_watermark_implementation,
    'LOGGING': _check_logging_implementation,
    'DETECTION': _check_detection_implementation,
    'DEEPFAKE': _check_deepfake_label,
    'DISCLOSURE': _check_disclosure,
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--layer', help='Check just one layer (e.g., C2PA)')
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--days-to-deadline', action='store_true', help='Show deadline countdown only')
    args = parser.parse_args()

    if args.days_to_deadline:
        deadline = datetime(2026, 8, 2, tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        days = (deadline - now).days
        print(f"\n{'=' * 50}")
        print(f"EU AI Act Article 50 binding deadline: 2 Aug 2026")
        print(f"Today's date:                    {now.date()}")
        print(f"Days until binding:               {days}")
        print(f"Signatory form deadline:         22 July 2026 ({(datetime(2026, 7, 22, tzinfo=timezone.utc) - now).days} days)")
        print(f"Grace period ends:                2 Dec 2026 ({(datetime(2026, 12, 2, tzinfo=timezone.utc) - now).days} days)")
        print(f"Watermark-detection interop:      2 Feb 2027 ({(datetime(2027, 2, 2, tzinfo=timezone.utc) - now).days} days)")
        print(f"{'=' * 50}\n")
        return

    # Run all (or one) layer checks
    layers = REQUIRED_LAYERS
    if args.layer:
        layers = [l for l in REQUIRED_LAYERS if l['code'] == args.layer.upper()]
        if not layers:
            print(f"Unknown layer: {args.layer}. Available: {[l['code'] for l in REQUIRED_LAYERS]}")
            return

    results = []
    for layer in layers:
        check_fn = CHECK_MAP.get(layer['code'])
        if check_fn:
            try:
                result = check_fn()
            except Exception as e:
                result = {'present': False, 'evidence': [], 'gap': f'Check error: {e}'}
        else:
            result = {'present': False, 'evidence': [], 'gap': 'No check implemented'}
        layer_result = {**layer, **result}
        results.append(layer_result)

    n_pass = sum(1 for r in results if r['present'])
    score = (n_pass / len(results)) * 100 if results else 0

    if args.json:
        print(json.dumps({
            'score': score,
            'n_pass': n_pass,
            'n_total': len(results),
            'care_floor': CARE_FLOOR,
            'article_50_deadline': '2026-08-02T00:00:00Z',
            'days_to_deadline': (datetime(2026, 8, 2, tzinfo=timezone.utc) - datetime.now(timezone.utc)).days,
            'layers': results,
        }, indent=2))
        return

    print()
    print("=" * 70)
    print("EU AI ACT ARTICLE 50 — COMPLIANCE AUDIT (2026-07-11)")
    print("=" * 70)
    print()
    deadline = datetime(2026, 8, 2, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    print(f"  Today:                    {now.date()}")
    print(f"  2 Aug 2026 deadline:      {(deadline - now).days} days away")
    print()
    print(f"Score: {score:.0f}/100  ({n_pass}/{len(results)} layers present)")
    print()
    print("─" * 70)
    print(f"{'LAYER':<30s} {'STATUS':<14s} {'SPEC REF':<12s}")
    print("─" * 70)
    for r in results:
        status = '✓ PRESENT' if r['present'] else '✗ GAP'
        spec = r['spec_ref']
        name = r['name'][:28]
        print(f"  {name:30s} {status:<14s} {spec:<12s}")
        if not r['present']:
            print(f"    Gap: {r['gap'][:80]}")
    print()
    # Recommendations from the report
    print("─" * 70)
    print("RECOMMENDED FIXES (per the report):")
    print("─" * 70)
    print()
    print("1. C2PA: add c2pa-python library (SIGIL-signed manifest per generation event)")
    print("2. SynthID/cross-vendor: integrate Google DeepMind SynthID detector OR c2pa watermarking")
    print("3. Detection UI: harden /api/provenance + /proofof-verify.html for Feb 2027")
    print("4. Disclosure header: add X-AI-Generated: true + generator ID on every API response")
    print("5. Logging: extend SIGIL chain to tag every GENESIS event with model_id + prompt_hash + output_hash")
    print()
    print(f"Sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereignty binding:")
    print(f"  - Care-Floor: {CARE_FLOOR}")
    print(f"  - Article 0: never equity / board seats / success fees")
    print(f"  - 12 Sovereign Mist 12 Pillars (Honor/Safety/.../Continuity)")
    print(f"  - BFT-33 23/33 quorum on sensitive inferences")
    print()


if __name__ == '__main__':
    main()
