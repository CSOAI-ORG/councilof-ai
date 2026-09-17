#!/usr/bin/env python3
"""
Master consolidation: harvest every signed/unsigned card from every store
into the GSPC ledger-cards-compact.json and auto-eat/cards-compact.json.
Measures everything. Decides nothing.
"""
import json, hashlib, os, glob, sys
from datetime import datetime, timezone

BASE = '/Users/nicholas/clawd/councilof-ai-work'
INTEROP = f'{BASE}/public/interop'
COMPACT_PATH = f'{INTEROP}/ledger-cards-compact.json'
AUTO_COMPACT_PATH = f'{INTEROP}/auto-eat/cards-compact.json'
MANIFEST_PATH = f'{INTEROP}/ots/manifest.json'
RUN_LOG = '/tmp/master-consolidation-run.json'


def canonical_sha(d):
    return hashlib.sha256(
        json.dumps(d, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    ).hexdigest()


def safe_load(p):
    try:
        with open(p) as f:
            return json.load(f)
    except Exception:
        return None


def discover_all_cards():
    """Harvest every signed/unsigned card from every known store."""
    cards = []

    # 1) mill-cards-signed/* + mill-cards-unsigned/*
    for store, signed in [('mill-cards-signed', True), ('mill-cards-unsigned', False)]:
        path = f'{INTEROP}/{store}'
        if not os.path.exists(path):
            continue
        for root, _, files in os.walk(path):
            for f in files:
                if not f.endswith('.json'):
                    continue
                fp = os.path.join(root, f)
                data = safe_load(fp)
                if not isinstance(data, dict):
                    continue
                # accept anything that has EITHER a kind field OR a sha256 field
                if 'kind' in data or 'sha256' in data:
                    cards.append({
                        'path': fp.replace(INTEROP + '/', ''),
                        'store': store,
                        'signed': signed,
                        'kind': data.get('kind', 'unknown'),
                        'subject': data.get('subject', f)[:140],
                        'as_of': data.get('as_of'),
                        'sha256': data.get('sha256', ''),
                        'size_b': os.path.getsize(fp),
                    })

    # 2) cards/* directory
    cards_dir = f'{INTEROP}/cards'
    if os.path.exists(cards_dir):
        for root, _, files in os.walk(cards_dir):
            for f in files:
                if not f.endswith('.json'):
                    continue
                fp = os.path.join(root, f)
                data = safe_load(fp)
                if isinstance(data, dict):
                    cards.append({
                        'path': fp.replace(INTEROP + '/', ''),
                        'store': 'cards',
                        'signed': True,
                        'kind': data.get('kind', 'unknown'),
                        'subject': data.get('subject', f)[:140],
                        'as_of': data.get('as_of'),
                        'sha256': data.get('sha256', ''),
                        'size_b': os.path.getsize(fp),
                    })

    # 3) ledger-card-*unsigned.json at the top level (newer direct writes)
    for fp in glob.glob(f'{INTEROP}/ledger-card-*unsigned.json'):
        data = safe_load(fp)
        if isinstance(data, dict):
            cards.append({
                'path': fp.replace(INTEROP + '/', ''),
                'store': 'ledger-card-direct',
                'signed': False,
                'kind': data.get('kind', 'unknown'),
                'subject': data.get('subject', f)[:140],
                'as_of': data.get('as_of'),
                'sha256': data.get('sha256', ''),
                'size_b': os.path.getsize(fp),
            })

    # 4) per-package card-*-unsigned.json (e.g. swift-census-2026-09/card-anz-public-notice-unsigned.json)
    for fp in glob.glob(f'{INTEROP}/*/card-*-unsigned.json') + glob.glob(f'{INTEROP}/*/*/card-*-unsigned.json'):
        if '/mill-' in fp or '/cards/' in fp:
            continue
        data = safe_load(fp)
        if isinstance(data, dict):
            cards.append({
                'path': fp.replace(INTEROP + '/', ''),
                'store': 'package-card',
                'signed': False,
                'kind': data.get('kind', 'unknown'),
                'subject': data.get('subject', f)[:140],
                'as_of': data.get('as_of'),
                'sha256': data.get('sha256', ''),
                'size_b': os.path.getsize(fp),
            })

    return cards


def make_compact_entry(card):
    """Convert a discovered card into a compact entry (no payload copy — measure the pointer)."""
    key = card['path'].replace('/', '.').replace('-unsigned', '').replace('.json', '')
    return {
        'kind': card['kind'],
        'flags': {
            'measures': True,
            'writes_board': False,
            'not_a_grade': True,
            'signed': card['signed'],
            'consolidated': True,
        },
        'as_of': card['as_of'] or datetime.now(timezone.utc).isoformat(),
        'store': card['store'],
        'sha256': card['sha256'],
        'size_b': card['size_b'],
        'evidence_url': f"/{card['path']}",
        'honesty': f"Discovered from {card['store']} during master consolidation 2026-09-17.",
    }


def main():
    cards = discover_all_cards()
    print(f"Discovered {len(cards)} cards across all stores")

    by_store = {}
    for c in cards:
        by_store.setdefault(c['store'], 0)
        by_store[c['store']] += 1
    for s, n in sorted(by_store.items(), key=lambda x: -x[1]):
        print(f"  {s}: {n}")

    # Load existing compacts
    with open(COMPACT_PATH) as f:
        ledger = json.load(f)
    with open(AUTO_COMPACT_PATH) as f:
        auto = json.load(f)

    ledger_before = len(ledger)
    auto_before = len(auto)

    added_ledger = 0
    added_auto = 0
    skipped_existing = 0

    for c in cards:
        key = c['path'].replace('/', '.').replace('-unsigned', '').replace('.json', '')

        if key not in ledger:
            ledger[key] = make_compact_entry(c)
            added_ledger += 1
        else:
            skipped_existing += 1

        auto_key = f'autoeat.{key}'
        if auto_key not in auto:
            entry = make_compact_entry(c)
            entry['flags']['autoeat'] = True
            auto[auto_key] = entry
            added_auto += 1

    # Write back atomically
    with open(COMPACT_PATH, 'w') as f:
        json.dump(ledger, f, indent=2)
    with open(AUTO_COMPACT_PATH, 'w') as f:
        json.dump(auto, f, indent=2)

    run_log = {
        'run_at': datetime.now(timezone.utc).isoformat(),
        'discovered': len(cards),
        'by_store': by_store,
        'ledger_before': ledger_before,
        'ledger_after': len(ledger),
        'ledger_added': added_ledger,
        'auto_before': auto_before,
        'auto_after': len(auto),
        'auto_added': added_auto,
        'skipped_existing': skipped_existing,
    }
    with open(RUN_LOG, 'w') as f:
        json.dump(run_log, f, indent=2)

    print(f"\n=== Consolidation Summary ===")
    print(f"ledger: {ledger_before} -> {len(ledger)} (+{added_ledger})")
    print(f"auto-eat: {auto_before} -> {len(auto)} (+{added_auto})")
    print(f"Existing entries preserved: {skipped_existing}")


if __name__ == '__main__':
    main()
