#!/usr/bin/env python3
"""Prepare README-only access repairs at fresh public Hub revisions.

Every table recipe is loaded from its original pinned bytes before a preview is
eligible for the guarded publish_product_cards.py publisher. No model calls.
"""
import argparse
import hashlib
import json
from pathlib import Path

from hf_card_metadata import VIEWER_REPAIRS, READ_PATHS, render


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', required=True, type=Path)
    a = ap.parse_args()
    from datasets import load_dataset
    from huggingface_hub import HfApi, hf_hub_download
    api = HfApi(token=False)
    a.out.mkdir(parents=True, exist_ok=True)
    entries = []
    for repo, recipe in VIEWER_REPAIRS.items():
        info = api.repo_info(repo, repo_type='dataset', files_metadata=True)
        if info.private is not False or info.gated:
            raise ValueError(f'{repo}: public, ungated source required')
        def download(path):
            return Path(hf_hub_download(repo, path, repo_type='dataset', revision=info.sha, token=False))
        before = download('README.md').read_bytes()
        checks = []
        for config in recipe.get('configs', []):
            path = config['data_files'][0]['path']
            source = download(path)
            rows = load_dataset('json', data_files=str(source), field=config.get('field'), split='train')
            if not len(rows):
                raise ValueError(f'{repo}: empty table')
            # Exercise the same Arrow -> Parquet boundary as the Hub viewer.
            rows.to_parquet(a.out / (repo.replace('/', '--') + '.parquet'))
            checks.append(dict(path=path, field=config.get('field'), rows=len(rows),
                columns=rows.column_names, sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
        if repo in READ_PATHS:
            path, field = READ_PATHS[repo]
            source = download(path)
            doc = json.loads(source.read_bytes())
            if field and field not in doc:
                raise ValueError(f'{repo}: documented key missing')
            checks.append(dict(path=path, field=field, json_valid=True,
                sha256=hashlib.sha256(source.read_bytes()).hexdigest()))
        proposed = render(repo, before.decode(), recipe, None).encode()
        entry = dict(id=repo, kind='dataset', status='PREVIEW', parent=info.sha,
            before_sha256=hashlib.sha256(before).hexdigest(),
            after_sha256=hashlib.sha256(proposed).hexdigest(), checks=checks,
            access='TABLE' if 'configs' in recipe else 'DOCUMENT_ARCHIVE')
        (a.out / ('dataset--' + repo.replace('/', '--') + '.md')).write_bytes(proposed)
        entries.append(entry)
        (a.out / 'manifest.json').write_text(json.dumps(entries, indent=2)+'\n')
        print(json.dumps(entry), flush=True)


if __name__ == '__main__':
    main()
