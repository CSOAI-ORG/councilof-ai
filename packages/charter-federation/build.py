"""Generate two local prototypes and an inspectable register from pinned inputs."""
import argparse
import collections
import hashlib
import json
from pathlib import Path
from register import canonical, digest, validate

HERE = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(root, groups_path):
    paths = {k: root / v for k, v in {
        'charter': 'public/.well-known/constitutional-harness.json',
        'frozen': 'public/interop/frozen-provision-hashes.json',
        'coverage': 'public/mechanism/coverage.json'}.items()}
    paths['groups'] = groups_path
    docs = {k: json.loads(p.read_text()) for k, p in paths.items()}
    manifest, coverage = docs['frozen'], docs['coverage']
    mapped = {p['provision_id']: p for p in coverage['provisions_touched']}
    instruments = {p['celex']: p for p in coverage['instruments']}
    rows = []
    for ident, frozen_hash in sorted(manifest['anchors'].items()):
        item = mapped.get(ident, {})
        if item and item['provision_sha256'] != frozen_hash:
            raise ValueError('Coverage points to a different frozen provision')
        instrument = instruments[ident.split(':')[0]]
        rows.append({'id': ident, 'sha256': frozen_hash, 'instrument': instrument['name'],
                     'url': instrument['source_url'], 'coverage': item.get('status', 'HASH_ONLY'),
                     'source_bytes': 'UNRESOLVED', 'legal_applicability': 'NOT_DETERMINED',
                     'predicates': item.get('predicates', []), 'related_axes': item.get('related_axes', [])})
    counts = dict(collections.Counter(r['coverage'] for r in rows))
    if counts != coverage['totals']:
        raise ValueError('Derived coverage disagrees with the existing report')
    sources = json.loads((HERE / 'sources.json').read_text())
    data = {'schema': 'council.charter-federation/0.1', 'as_of': '2026-10-30',
            'grants_authority': False, 'charter_sha256': sha(paths['charter']),
            'inputs': {k: {'path': 'candidate:council-os/working-groups.json' if k == 'groups' else str(p.relative_to(root)), 'sha256': sha(p)} for k, p in paths.items()},
            'frozen_corpus': {'root': manifest['corpus_root'], 'count': len(rows), 'source_bytes': 'UNRESOLVED', 'coverage': counts},
            'articles': [{'article': a['article'], 'title': a['title'].replace('SovSpace', 'Dependency graph')} for a in docs['charter']['articles']], 'provisions': rows, 'sources': sources,
            'groups': docs['groups']['groups'], 'group_scope': docs['groups']['note'],
            'limits': ['Not an exhaustive catalogue of law or charters.', 'Source-text recovery, applicability review and adoption remain distinct.',
                       'Working-group roles are forming and unappointed.', 'No production forum, authentication or execution authority is created.']}
    validate(data)
    envelope = {'register': data, 'sha256': digest(data)}
    (HERE / 'register.json').write_text(json.dumps(envelope, indent=2, ensure_ascii=False) + '\n')
    template = (HERE / 'preview.template.html').read_text()
    safe_data = canonical(envelope).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    script = (HERE / 'preview.js').read_text()
    for mode in ('tracker', 'discussion'):
        html = template.replace('@@MODE@@', mode).replace('@@REGISTER@@', safe_data).replace('@@SCRIPT@@', script)
        (HERE / (mode + '.html')).write_text(html)
    receipt = {'schema': 'council.charter-federation-build/0.1', 'register_sha256': envelope['sha256'],
               'sources': len(sources), 'provisions': len(rows), 'articles': len(data['articles']),
               'groups': len(data['groups']), 'coverage': counts,
               'generated': {f: sha(HERE / f) for f in ['register.json', 'tracker.html', 'discussion.html']}}
    (HERE / 'build-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', type=Path, required=True)
    ap.add_argument('--groups', type=Path, required=True)
    args = ap.parse_args()
    build(args.root.resolve(), args.groups.resolve())
