#!/usr/bin/env python3
"""Publish a reviewed card manifest with parent, content and non-README guards.

README-only commits to existing public repositories. Stops on the first error.
Receipts are checkpointed per repository; reruns verify already-published content.
"""
import argparse
import hashlib
import json
import time
from pathlib import Path

from polish_frontdoors import assert_unchanged_files, file_ids


def digest(data):
    return hashlib.sha256(data).hexdigest()


def validate(entry, before, current, proposed):
    if before.private is not False:
        raise ValueError('public visibility is required')
    if digest(proposed) != entry['after_sha256']:
        raise ValueError('preview bytes differ from reviewed manifest')
    if digest(current) == entry['after_sha256']:
        return False
    if before.sha != entry['parent'] or digest(current) != entry['before_sha256']:
        raise ValueError('repository changed since review; regenerate the preview')
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--preview', type=Path, required=True)
    ap.add_argument('--publish', action='store_true')
    a = ap.parse_args()
    from huggingface_hub import CommitOperationAdd, HfApi, hf_hub_download
    api, public = HfApi(), HfApi(token=False)
    entries = json.loads((a.preview / 'manifest.json').read_text())
    receipt = a.preview / 'publication-receipt.jsonl'
    for entry in entries:
        if entry['status'] != 'PREVIEW':
            continue
        repo, kind = entry['id'], entry['kind']
        proposed = (a.preview / (kind + '--' + repo.replace('/', '--') + '.md')).read_bytes()
        before = api.repo_info(repo, repo_type=kind, files_metadata=True)
        current = Path(hf_hub_download(repo, 'README.md', repo_type=kind, revision=before.sha)).read_bytes()
        changed = validate(entry, before, current, proposed)
        record = dict(id=repo, kind=kind, parent=before.sha, sha256=digest(proposed), status='PREVIEW')
        if a.publish and changed:
            before_ids = file_ids(before)
            commit = api.create_commit(repo, repo_type=kind, parent_commit=before.sha,
                operations=[CommitOperationAdd(path_in_repo='README.md', path_or_fileobj=proposed)],
                commit_message='Clarify reuse and provenance; remove repeated dated notices')
            record.update(commit=commit.oid, status='COMMITTED_PENDING_VERIFICATION')
            with receipt.open('a') as f:
                f.write(json.dumps(record) + '\n')
            after = public.repo_info(repo, repo_type=kind, revision=commit.oid, files_metadata=True)
            assert_unchanged_files(before_ids, file_ids(after), {'README.md'})
            actual = Path(hf_hub_download(repo, 'README.md', repo_type=kind, revision=commit.oid, token=False)).read_bytes()
            if actual != proposed or after.private is not False:
                raise ValueError('anonymous publication readback differs')
            record.update(status='PUBLISHED_VERIFIED', unchanged_other_files=len(before_ids)-1)
        elif a.publish:
            actual = Path(hf_hub_download(repo, 'README.md', repo_type=kind, revision=before.sha, token=False)).read_bytes()
            if actual != proposed:
                raise ValueError('anonymous existing content differs')
            record['status'] = 'ALREADY_PRESENT_VERIFIED'
        with receipt.open('a') as f:
            f.write(json.dumps(record) + '\n')
        print(json.dumps(record), flush=True)
        time.sleep(2)


if __name__ == '__main__':
    main()
