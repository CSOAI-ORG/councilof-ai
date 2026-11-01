import copy
import unittest
from pathlib import Path
import json
from participation import review_routes
from register import digest, propose, validate


class ParticipationTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(Path(__file__).with_name('register.json').read_text())['register']

    def test_proposal_binds_tracker_and_source_groups(self):
        p = propose(self.data, 'ietf', digest(self.data), 'Review the accessible public review process.')['proposal']
        self.assertEqual(self.data['inputs']['tracker']['sha256'], p['tracker_sha256'])
        groups = next(s['groups'] for s in self.data['sources'] if s['id'] == 'ietf')
        self.assertEqual(set(groups), {r['group_id'] for r in p['review_routes']})
        self.assertTrue(all(r['document_id'].startswith('COAI-WG-') for r in p['review_routes']))
        self.assertFalse(p['human_approval'])
        self.assertFalse(p['may_execute'])

    def test_unrelated_or_external_route_rejected(self):
        changed = copy.deepcopy(self.data)
        changed['review_routes'][0]['review_email_url'] = 'https://example.com/collect'
        with self.assertRaises(ValueError):
            validate(changed)

    def test_boolean_document_version_rejected(self):
        tracker = copy.deepcopy(self.data['working_group_tracker'])
        tracker['documents'][0]['version'] = True
        with self.assertRaises(ValueError):
            review_routes(self.data['groups'], tracker)

    def test_unknown_group_and_missing_group_rejected(self):
        for change in ('unknown', 'missing'):
            with self.subTest(change=change):
                tracker = copy.deepcopy(self.data['working_group_tracker'])
                if change == 'unknown':
                    tracker['documents'][0]['groupId'] = 'invented'
                else:
                    tracker['documents'].pop(0)
                with self.assertRaises(ValueError):
                    review_routes(self.data['groups'], tracker)

    def test_wrong_forum_and_source_escape_rejected(self):
        for field in ('forum', 'path'):
            with self.subTest(field=field):
                tracker = copy.deepcopy(self.data['working_group_tracker'])
                if field == 'forum':
                    tracker['forum'] = 'https://example.com/discussions'
                else:
                    tracker['documents'][0]['source']['path'] = '../private'
                with self.assertRaises(ValueError):
                    review_routes(self.data['groups'], tracker)

    def test_tracker_change_invalidates_prepared_revision(self):
        old = digest(self.data)
        changed = copy.deepcopy(self.data)
        changed['working_group_tracker']['documents'][0]['version'] += 1
        changed['review_routes'] = review_routes(changed['groups'], changed['working_group_tracker'])
        with self.assertRaises(ValueError):
            propose(changed, 'ietf', old, 'Review the accessible public review process.')


if __name__ == '__main__':
    unittest.main()
