"""Failure controls for the explicitly approved licence-only publisher."""
from copy import deepcopy
import json

import pytest

import publish_kaggle_licences as pub
from publish_kaggle_cards import SETTINGS

REF = 'owner/dataset'
PAIR = ('CC0-1.0', 'CC-BY-4.0')


def metadata():
    value = {key: '' for key in SETTINGS}
    value.update(title='Original title', description='Original provenance',
                 isPrivate=False, collaborators=[], keywords=['science'], data=[],
                 licenses=[{'name': 'CC0-1.0'}], ownerUser='owner', datasetSlug='dataset',
                 currentVersionNumber=7)
    return value


def approved():
    raw = json.dumps([dict(ref=REF, current=PAIR[0], proposed=PAIR[1])]).encode()
    approval = dict(manifest_sha256=pub.sha256(raw), refs=[REF],
                    approved_change=list(PAIR), approval_reference='owner approval record',
                    scope='platform licence label only')
    return raw, approval


def test_exact_manifest_approval_and_scope_are_required():
    raw, approval = approved()
    assert pub.checked_approval(raw, approval)[1] == PAIR
    for key, value in [('manifest_sha256', '0'*64), ('refs', [REF, 'owner/other']),
                       ('approved_change', list(reversed(PAIR))),
                       ('approval_reference', ''), ('scope', 'all metadata')]:
        with pytest.raises(ValueError):
            pub.checked_approval(raw, dict(approval, **{key: value}))
    with pytest.raises(ValueError):
        pub.checked_approval(raw + b' ', approval)


@pytest.mark.parametrize('ref', ['owner/../dataset', '../dataset', 'owner/dataset/extra'])
def test_path_traversal_and_invalid_references_are_refused(ref):
    raw, approval = approved()
    rows = json.loads(raw); rows[0]['ref'] = ref
    raw = json.dumps(rows).encode()
    approval.update(manifest_sha256=pub.sha256(raw), refs=[ref])
    with pytest.raises(ValueError): pub.checked_approval(raw, approval)


def test_label_only_with_sdk_write_name_and_derived_alias():
    before = metadata(); before['licenseName'] = 'CC0: Public Domain'
    proposed = pub.propose(before, REF, PAIR)
    assert proposed['licenses'] == [{'name': 'CC BY 4.0'}]
    assert 'licenseName' not in proposed
    for key in SETTINGS:
        if key != 'licenses': assert proposed[key] == before[key]
    assert before['licenses'] == [{'name': 'CC0-1.0'}]


@pytest.mark.parametrize('field,value', [
    ('isPrivate', True), ('isPrivate', None), ('ownerUser', 'different'),
    ('datasetSlug', 'different'), ('licenses', [{'name': 'unknown'}]),
    ('licenses', []), ('licenseName', 'CC BY 4.0'),
])
def test_wrong_identity_privacy_or_conflicting_rights_refused(field, value):
    before = metadata(); before[field] = value
    with pytest.raises((ValueError, pub.spray.Refused)):
        pub.propose(before, REF, PAIR)


def test_readback_normalization_and_every_preserved_setting():
    before = metadata(); after = pub.propose(before, REF, PAIR)
    after['licenses'] = [{'name': 'Attribution 4.0 International (CC BY 4.0)'}]
    pub.verify(before, after, REF, PAIR, [], [])
    for key in SETTINGS:
        if key == 'licenses': continue
        altered = dict(after, **{key: 'drift'})
        with pytest.raises(ValueError):
            pub.verify(before, altered, REF, PAIR, [], [])
    for altered, files in [(dict(after, currentVersionNumber=8), []),
                           (after, [dict(name='changed', bytes=1)])]:
        with pytest.raises(ValueError):
            pub.verify(before, altered, REF, PAIR, [], files)


class FakeClient:
    def __init__(self, value=None):
        self.value = value or metadata()
        self.inventory = [dict(name='README.md', bytes=20)]
        self.updates = 0
        self.reads = 0
        self.race = False
        self.fail_after_update = False

    def metadata(self, ref):
        self.reads += 1
        if self.race and self.reads == 2: self.value['description'] = 'concurrent edit'
        return deepcopy(self.value)

    def files(self, ref): return deepcopy(self.inventory)

    def update(self, ref, folder):
        records = (folder.parent / 'publication-receipt.jsonl').read_text()
        assert 'INTENT_RECORDED' in records
        self.updates += 1
        self.value = json.loads((folder / 'dataset-metadata.json').read_text())
        self.value['licenses'] = [{'name': 'Attribution 4.0 International (CC BY 4.0)'}]
        if self.fail_after_update:
            self.fail_after_update = False
            raise TimeoutError('response lost after accepted update')


def test_success_and_resume_after_lost_response_preserve_baseline(tmp_path):
    client = FakeClient(); client.fail_after_update = True
    entry = dict(ref=REF)
    with pytest.raises(TimeoutError):
        pub.publish_one(client, entry, PAIR, metadata(), tmp_path, True)
    baseline = (tmp_path / 'owner__dataset/before.json').read_bytes()
    result = pub.publish_one(client, entry, PAIR, metadata(), tmp_path, True)
    assert result['status'] == 'ALREADY_PRESENT_VERIFIED'
    assert client.updates == 1
    assert (tmp_path / 'owner__dataset/before.json').read_bytes() == baseline


def test_fresh_other_lane_copy_is_kept_then_concurrent_edit_is_refused(tmp_path):
    fresh = metadata(); fresh['description'] = 'Newly published working-group links'
    client = FakeClient(fresh)
    result = pub.publish_one(client, dict(ref=REF), PAIR, metadata(), tmp_path, True)
    assert result['fresh_settings_retained'] == ['description']
    assert client.value['description'] == fresh['description']
    race = FakeClient(); race.race = True
    with pytest.raises(ValueError, match='concurrent'):
        pub.publish_one(race, dict(ref=REF), PAIR, metadata(), tmp_path / 'race', True)
    assert race.updates == 0


def test_preview_does_not_write_and_later_checkpoint_drift_stops(tmp_path):
    client = FakeClient()
    result = pub.publish_one(client, dict(ref=REF), PAIR, metadata(), tmp_path, False)
    assert result['status'] == 'PREVIEW' and client.updates == 0
    client.value['description'] = 'Changed after checkpoint'
    with pytest.raises(ValueError, match='checkpoint drift'):
        pub.publish_one(client, dict(ref=REF), PAIR, metadata(), tmp_path, True)
    assert client.updates == 0


def test_retained_review_and_source_are_hash_bound(tmp_path):
    folder = tmp_path / 'dataset'; folder.mkdir()
    before = metadata(); proposed = pub.propose(before, REF, PAIR)
    source = b'license: cc-by-4.0\n'
    (folder / 'before-metadata.json').write_text(json.dumps(before))
    (folder / 'proposed-metadata.json').write_text(json.dumps(proposed))
    (folder / 'README.source.md').write_bytes(source)
    entry = dict(ref=REF, current=PAIR[0], proposed=PAIR[1], source='org/source',
                 before_metadata_sha256=pub.metadata_sha(before),
                 proposed_metadata_sha256=pub.metadata_sha(proposed),
                 readme_sha256=pub.sha256(source))
    assert pub.checked_review(entry, tmp_path) == before
    (folder / 'README.source.md').write_bytes(b'different declaration')
    with pytest.raises(ValueError, match='source declaration digest'):
        pub.checked_review(entry, tmp_path)
