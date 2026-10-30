#!/usr/bin/env python3
"""Apply a hash-bound, explicitly approved Kaggle licence-label correction.

Uses the qualified typed SDK and the canonical spray licence guard. Only the
platform label changes. Historical files/rights declarations remain untouched.
Defaults to preview; records intent before writing and verifies every readback.
"""
import argparse
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import time

from publish_kaggle_cards import settings

_spec = importlib.util.spec_from_file_location(
    'canonical_spray', Path(__file__).resolve().parents[1] / 'spray/gspc-spray.py')
spray = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(spray)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def metadata_sha(value):
    # Same serialization as the retained owner-review proposals.
    return sha256(json.dumps(value, sort_keys=True).encode())


def checked_approval(manifest_bytes, approval):
    entries = json.loads(manifest_bytes)
    if not isinstance(entries, list) or not entries:
        raise ValueError('nonempty reviewed manifest required')
    refs = [row['ref'] for row in entries]
    if len(set(refs)) != len(refs) or any(
        not re.fullmatch(r'[A-Za-z0-9_-]+/[A-Za-z0-9_-]+', ref) for ref in refs
    ):
        raise ValueError('unique safe dataset references required')
    pair = tuple(approval.get('approved_change', []))
    if (approval.get('manifest_sha256') != sha256(manifest_bytes)
            or approval.get('refs') != refs
            or not approval.get('approval_reference')
            or approval.get('scope') != 'platform licence label only'
            or len(pair) != 2 or pair[0] == pair[1]
            or any((row['current'], row['proposed']) != pair for row in entries)):
        raise ValueError('approval must bind the exact manifest, references, pair and scope')
    return entries, pair


def validate_identity(info, ref):
    owner, slug = ref.split('/')
    if (info.get('ownerUser') != owner or info.get('datasetSlug') != slug
            or info.get('isPrivate') is not False):
        raise ValueError('exact owned public dataset required')
    settings(info)  # Missing typed defaults are not invented.


def licence(info):
    declarations = info.get('licenses')
    if not isinstance(declarations, list) or len(declarations) != 1:
        raise ValueError('exactly one known licence required')
    name = spray.KAGGLE_LICENCE_NAMES.get(declarations[0].get('name'))
    # Import the actual conflict/unknown guard; do not duplicate its policy.
    spray.kaggle_licences({'totals': {'license': name}}, info)
    return name


def normalized_settings(info):
    result = deepcopy(settings(info))
    result['licenses'] = [{'name': licence(info)}]
    return result


def propose(info, ref, pair):
    validate_identity(info, ref)
    if licence(info) not in pair:
        raise ValueError('current licence is outside the approved transition')
    result = deepcopy(info)
    result['id'] = ref
    result['licenses'] = spray.kaggle_licences(
        {'totals': {'license': pair[1]}}, info, approved_change=pair)
    # This is a derived read-only alias, not a second licence to write.
    result.pop('licenseName', None)
    return result


def verify(before, after, ref, pair, before_files, after_files):
    validate_identity(before, ref)
    validate_identity(after, ref)
    expected = normalized_settings(propose(before, ref, pair))
    if normalized_settings(after) != expected:
        raise ValueError('metadata readback differs from the licence-only payload')
    if before_files != after_files:
        raise ValueError('file inventory changed during publication')
    for key in ('currentVersionNumber', 'versions'):
        if key in before and after.get(key) != before[key]:
            raise ValueError(f'{key} changed during metadata-only publication')


def checked_review(entry, root):
    folder = root / entry['ref'].split('/')[1]
    before = json.loads((folder / 'before-metadata.json').read_text())
    proposed = json.loads((folder / 'proposed-metadata.json').read_text())
    if (metadata_sha(before) != entry['before_metadata_sha256']
            or metadata_sha(proposed) != entry['proposed_metadata_sha256']):
        raise ValueError('reviewed metadata digest mismatch')
    source = folder / ('README.source.md' if entry.get('source') else 'README.md')
    if sha256(source.read_bytes()) != entry['readme_sha256']:
        raise ValueError('reviewed source declaration digest mismatch')
    expected = propose(before, entry['ref'], (entry['current'], entry['proposed']))
    if normalized_settings(expected) != normalized_settings(proposed):
        raise ValueError('reviewed payload changes more than the licence')
    return before


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')


def event(path, **value):
    value['at'] = datetime.now(timezone.utc).isoformat()
    with path.open('a') as stream:
        stream.write(json.dumps(value) + '\n')
        stream.flush()
    print(json.dumps(value), flush=True)
    return value


def publish_one(client, entry, pair, reviewed, output, publish):
    ref = entry['ref']
    folder = output / ref.replace('/', '__')
    folder.mkdir(parents=True, exist_ok=True)
    receipt = output / 'publication-receipt.jsonl'
    current = client.metadata(ref)
    proposed = propose(current, ref, pair)
    current_files = client.files(ref)
    baseline_path = folder / 'before.json'
    if baseline_path.exists():
        baseline = json.loads(baseline_path.read_text())
        # Resume only this same approved operation, preserving the original proof.
        if baseline['pair'] != list(pair):
            raise ValueError('existing checkpoint belongs to a different transition')
        original = normalized_settings(baseline['metadata'])
        now = normalized_settings(current)
        if ({k:v for k,v in original.items() if k != 'licenses'}
                != {k:v for k,v in now.items() if k != 'licenses'}
                or baseline['files'] != current_files):
            raise ValueError('checkpoint drift; reconcile before continuing')
    else:
        baseline = dict(metadata=current, files=current_files, pair=list(pair))
        save(baseline_path, baseline)
    save(folder / 'dataset-metadata.json', proposed)
    changed = licence(current) != pair[1]
    rebased = [key for key in settings(reviewed)
               if key != 'licenses' and reviewed[key] != current[key]]
    if not publish:
        return event(receipt, ref=ref, status='PREVIEW', changed=changed,
                     fresh_settings_retained=rebased)
    if changed:
        # Read again immediately before mutation; never overwrite a concurrent edit.
        immediate = client.metadata(ref)
        validate_identity(immediate, ref)
        if normalized_settings(immediate) != normalized_settings(current):
            raise ValueError('concurrent metadata change before write')
        event(receipt, ref=ref, status='INTENT_RECORDED',
              before_sha256=metadata_sha(current), payload_sha256=metadata_sha(proposed),
              fresh_settings_retained=rebased)
        client.update(ref, folder)
    after = client.metadata(ref)
    after_files = client.files(ref)
    save(folder / 'after.json', dict(metadata=after, files=after_files))
    verify(baseline['metadata'], after, ref, pair, baseline['files'], after_files)
    return event(receipt, ref=ref,
                 status='PUBLISHED_VERIFIED' if changed else 'ALREADY_PRESENT_VERIFIED',
                 licence=licence(after), unchanged_files=len(after_files),
                 before_sha256=metadata_sha(baseline['metadata']),
                 after_sha256=metadata_sha(after), fresh_settings_retained=rebased,
                 operation='dataset_metadata_update; no file upload or version creation')


class KaggleClient:
    def __init__(self):
        from importlib.metadata import version
        if (version('kaggle'), version('kagglesdk')) != spray.KAGGLE_TYPED_READ_VERSIONS:
            raise ValueError('existing Kaggle SDK versions need qualification')
        from kaggle.api.kaggle_api_extended import KaggleApi
        self.api = KaggleApi()
        self.api.authenticate()

    def metadata(self, ref):
        from kagglesdk.datasets.types.dataset_api_service import ApiGetDatasetMetadataRequest
        time.sleep(2)
        request = ApiGetDatasetMetadataRequest()
        request.owner_slug, request.dataset_slug = ref.split('/')
        with self.api.build_kaggle_client() as client:
            response = client.datasets.dataset_api_client.get_dataset_metadata(request)
        if response.error_message:
            raise ValueError(response.error_message)
        info = json.loads(response.to_json(ignore_defaults=False))['info']
        validate_identity(info, ref)
        return info

    def files(self, ref):
        result, token = [], None
        while True:
            time.sleep(2)
            page = self.api.dataset_list_files(ref, page_token=token, page_size=200)
            result.extend(dict(name=f.name, bytes=f.total_bytes) for f in page.files)
            token = page.next_page_token
            if not token:
                return sorted(result, key=lambda f: f['name'])

    def update(self, ref, folder):
        response = self.api.dataset_metadata_update(ref, str(folder))
        if getattr(response, 'error_message', None):
            raise ValueError(response.error_message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--approval', type=Path, required=True)
    parser.add_argument('--review-root', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--only', help='Canary reference; must occur in the approved manifest')
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    entries, pair = checked_approval(args.manifest.read_bytes(), json.loads(args.approval.read_text()))
    if args.only and args.only not in [entry['ref'] for entry in entries]:
        parser.error('--only is outside the approved manifest')
    # Validate all retained review evidence before authenticating or mutating anything.
    reviews = {entry['ref']: checked_review(entry, args.review_root) for entry in entries}
    args.out.mkdir(parents=True, exist_ok=True)
    client = KaggleClient()
    for entry in entries:
        if args.only and args.only != entry['ref']:
            continue
        try:
            publish_one(client, entry, pair, reviews[entry['ref']], args.out, args.publish)
        except (Exception, spray.Refused) as exc:
            event(args.out / 'publication-receipt.jsonl', ref=entry['ref'],
                  status='STOPPED_REQUIRES_RECONCILIATION', reason=str(exc))
            raise


if __name__ == '__main__':
    main()
