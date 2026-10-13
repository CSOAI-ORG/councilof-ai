#!/usr/bin/env python3
"""Validate the ONDO evidence-intake pack (measurement/registers/2026-09-20/).

Checks, with no signing, publishing, network, wallet, or transaction use:
  1. Manifest raw files re-hash to their recorded sha256.
  2. Every frozen-input row references an existing manifest source, and the
     row sha256/retrieved_at/source_url agree with the manifest.
  3. Every row excerpt appears in the source's raw bytes after a documented
     normalization (strip HTML tags, unescape entities, collapse whitespace).
  4. claim_class, category, and evidence_state are in their declared enums.
  5. gspc_axes only names axes on the live 23-slot board (no invented axes).
  6. No certification/endorsement language in claim text.
Exits non-zero and prints FAIL lines on any violation.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import subprocess
import sys
from pathlib import Path

REGISTER = Path('measurement/registers/2026-09-20')
MANIFEST = REGISTER / 'ondo-source-manifest.json'
ATTESTATION_MANIFEST = REGISTER / 'ondo-attestation-manifest.json'
INVENTORY = REGISTER / 'ondo-attestation-inventory.json'
FROZEN = REGISTER / 'ondo-frozen-inputs.jsonl'

# Live 23-slot board as of 2026-09-20 (functions/api/_gspc_axes_{a,b,c,fin}.ts).
BOARD_AXES = {
    'governance', 'safety', 'provenance', 'continuity', 'conformance', 'openness',
    'machinery-conformity', 'care', 'cross-reality', 'detector-interop',
    'art5-safeguard', 'swarm', 'affect', 'jail', 'effect-binding',
    'provenance-controls', 'reserve-attestation', 'regulatory-framework',
    'distribution-integrity', 'custody-disclosure', 'ai-adoption-components',
    'labour-components', 'humanoid-labour-index',
}
CLAIM_CLASSES = {'ISSUER_ASSERTION', 'ONCHAIN_OBSERVATION', 'THIRD_PARTY_ATTESTATION'}
CATEGORIES = {'tokenized-assets', 'reserves', 'custody', 'redemption', 'oracle-inputs',
              'supported-chains', 'contracts', 'governance', 'incident-handling',
              'correction-history'}
STATES = {'OBSERVED_NOT_YET_ACCEPTED', 'UNCHECKABLE', 'REJECTED'}
FORBIDDEN = re.compile(r'\b(certif(y|ied|ication)|endors(e|ed|ement)|guarantee(d)?|'
                       r'compliant|compliance-pass|rating|grade [A-F]|approved by csoai)\b', re.I)


def normalize(raw: bytes) -> str:
    text = html.unescape(re.sub(r'<[^>]+>', ' ', raw.decode('utf-8', errors='replace')))
    return re.sub(r'\s+', ' ', text)


def main() -> int:
    failures: list[str] = []
    sources: dict = {}
    manifests = []
    for mpath in sorted(REGISTER.glob('ondo-*manifest.json')):
        manifest = json.loads(mpath.read_text(encoding='utf-8'))
        manifests.append(manifest)
        overlap = set(sources) & {s['source_id'] for s in manifest['sources']}
        if overlap:
            failures.append(f'source_id collision across manifests: {sorted(overlap)}')
        sources.update({s['source_id']: s for s in manifest['sources']})
    if INVENTORY.exists():
        inv_bytes = INVENTORY.read_bytes()
        inv = json.loads(inv_bytes)
        inv_sha = hashlib.sha256(inv_bytes).hexdigest()
        sources['inventory:attestation'] = {
            'source_id': 'inventory:attestation', 'sha256': inv_sha,
            'raw_path': str(INVENTORY), 'bytes': len(inv_bytes),
            'locator': 'local://ondo-attestation-inventory.json',
            'retrieved_at': inv['source']['fetched_at'],
            'state': 'OBSERVED_NOT_YET_ACCEPTED',
        }
        # pinned document samples become verifiable sources
        for label, rows in inv['files'].items():
            for row in rows:
                if 'pinned_raw_path' not in row:
                    continue
                raw = Path(row['pinned_raw_path']).read_bytes()
                if hashlib.sha256(raw).hexdigest() != row['sha256']:
                    failures.append(f'inventory:{row["zip_member"]} pinned sample hash mismatch')
                sid = f'doc:{label}:{row.get("report_date") or row.get("report_month")}'
                sources[sid] = {
                    'source_id': sid, 'sha256': row['sha256'], 'raw_path': row['pinned_raw_path'],
                    'bytes': row['bytes'],
                    'locator': f"{inv['source'][label + '_folder_zip']['locator']}#/{row['zip_member']}",
                    'retrieved_at': inv['source']['fetched_at'],
                    'state': 'OBSERVED_NOT_YET_ACCEPTED',
                }
    norm_cache: dict[str, str] = {}
    pdf_cache: dict[str, str] = {}

    # 1. re-hash raw files
    for s in sources.values():
        if s['state'] != 'OBSERVED_NOT_YET_ACCEPTED':
            continue
        raw = Path(s['raw_path']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != s['sha256']:
            failures.append(f"manifest:{s['source_id']} sha256 mismatch")
        if len(raw) != s['bytes']:
            failures.append(f"manifest:{s['source_id']} byte count mismatch")
        norm_cache[s['source_id']] = normalize(raw)

    # 2-6. frozen rows
    rows = [json.loads(line) for line in FROZEN.read_text(encoding='utf-8').splitlines() if line.strip()]
    seen_ids: set[str] = set()
    for r in rows:
        cid = r.get('claim_id', '?')
        if cid in seen_ids:
            failures.append(f'{cid} duplicate claim_id')
        seen_ids.add(cid)
        if r.get('schema') != 'csoai.ondo-frozen-input/0.1':
            failures.append(f'{cid} bad schema')
        if r.get('claim_class') not in CLAIM_CLASSES:
            failures.append(f'{cid} bad claim_class {r.get("claim_class")}')
        if r.get('category') not in CATEGORIES:
            failures.append(f'{cid} bad category {r.get("category")}')
        if r.get('evidence_state') not in STATES:
            failures.append(f'{cid} bad evidence_state {r.get("evidence_state")}')
        if not isinstance(r.get('independently_checkable'), bool):
            failures.append(f'{cid} independently_checkable not boolean')
        axes = set(r.get('gspc_axes', []))
        if not axes <= BOARD_AXES:
            failures.append(f'{cid} unknown axes {sorted(axes - BOARD_AXES)}')
        src = sources.get(r.get('source_id', ''))
        if src is None:
            failures.append(f'{cid} unknown source_id {r.get("source_id")}')
            continue
        for field, mfield in (('sha256', 'sha256'), ('retrieved_at', 'retrieved_at'), ('source_url', 'locator')):
            if r.get(field) != src.get(mfield):
                failures.append(f'{cid} {field} disagrees with manifest')
        needle = re.sub(r'\s+', ' ', r.get('excerpt', '')).strip()
        if r.get('excerpt_source') == 'pdftotext-layout':
            sid = src['source_id']
            if sid not in pdf_cache:
                out = subprocess.run(['pdftotext', '-layout', src['raw_path'], '-'],
                                     capture_output=True, text=True)
                if out.returncode != 0:
                    failures.append(f'{cid} pdftotext failed on {sid}')
                    pdf_cache[sid] = ''
                else:
                    pdf_cache[sid] = re.sub(r'\s+', ' ', out.stdout)
            if needle and needle not in pdf_cache[sid]:
                failures.append(f'{cid} excerpt not found in pdftotext output of {sid}')
        elif needle and needle not in norm_cache.get(src['source_id'], ''):
            failures.append(f'{cid} excerpt not found in raw bytes of {src["source_id"]}')
        if FORBIDDEN.search(r.get('claim', '')):
            failures.append(f'{cid} forbidden certification/endorsement language in claim')

    cats = {r['category'] for r in rows}
    missing = CATEGORIES - cats
    if missing:
        failures.append(f'categories with no rows: {sorted(missing)}')

    if failures:
        for f in failures:
            print('FAIL:', f)
        return 1
    print(f'PASS: {len(sources)} sources re-hashed across {len(manifests)} manifests; '
          f'{len(rows)} frozen rows reconcile; all excerpts found in raw bytes; '
          f'all {len(CATEGORIES)} categories covered; no invented axes; no certification language')
    return 0


if __name__ == '__main__':
    sys.exit(main())
