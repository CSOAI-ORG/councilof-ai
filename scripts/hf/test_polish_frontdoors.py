"""Protect dataset provenance and non-presentation bytes during card maintenance."""
import unittest
from polish_frontdoors import assert_unchanged_files, front_matter, render_card, GSPC_ONE_CONFIG, ROOT, TARGETS


class FrontdoorGuards(unittest.TestCase):
    snapshot = dict(as_of="2026-10-29T11:07:30Z", read_at="2026-10-29T16:24:34Z", board_sha256="a" * 64)

    def card(self):
        return ('---\nlicense: cc-by-4.0\nconfigs:\n- config_name: default\n'
                '  data_files:\n  - split: train\n    path: board.parquet\n---\n\n'
                'The default viewer files (`board.parquet` and `board.jsonl`) project the dated release: '
                + ' '.join(f'`{v}`' for v in self.snapshot.values()) + '.\n\nOld text.\n')

    def test_preserves_metadata_and_snapshot_provenance(self):
        current = self.card()
        new = render_card("dataset", current, self.snapshot)
        self.assertEqual(front_matter(current)[0], front_matter(new)[0])
        provenance = current.split('\n\n')[1]
        self.assertEqual(new.count(provenance), 1)
        self.assertEqual(render_card("dataset", new, self.snapshot), new)

    def test_missing_duplicate_or_mismatched_provenance_refuses(self):
        paragraph = self.card().split('\n\n')[1]
        for value in (self.card().replace(paragraph, ''), self.card() + '\n' + paragraph + '\n\n',
                      self.card().replace(self.snapshot['read_at'], 'wrong')):
            with self.subTest(value=value), self.assertRaises(ValueError):
                render_card("dataset", value, self.snapshot)

    def test_document_change_allowed_but_data_addition_deletion_and_edit_refuse(self):
        before = {'README.md': 'old', 'board.parquet': 'original', 'snapshot/root.json': 'root'}
        assert_unchanged_files(before, dict(before, **{'README.md': 'new'}), {'README.md'})
        for after in ({'README.md': 'new', 'board.parquet': 'original'},
                      dict(before, **{'board.parquet': 'changed'}), dict(before, **{'new.csv': 'extra'})):
            with self.subTest(after=after), self.assertRaises(ValueError):
                assert_unchanged_files(before, after, {'README.md'})

    def test_bundle_viewer_is_disabled_without_changing_other_metadata(self):
        current = self.card()
        new = render_card('benchmark-suite', current)
        self.assertEqual(front_matter(new)[0], front_matter(current)[0] + '\nviewer: false')
        self.assertEqual(render_card('benchmark-suite', new), new)
        self.assertIn('one-row test dataset', new)

    def test_nested_export_selects_rows_and_preserves_licence(self):
        current='---\nlicense: cc-by-4.0\npretty_name: GSPC one (Council of AI)\n---\nOriginal'
        new=render_card('gspc-one',current)
        self.assertEqual(front_matter(new)[0],front_matter(current)[0]+'\n'+GSPC_ONE_CONFIG)
        self.assertEqual(render_card('gspc-one',new),new)
        canonical = (ROOT / TARGETS['gspc-one'][2]).read_text()
        self.assertEqual(render_card('gspc-one', canonical), canonical)
        self.assertEqual(new, canonical)
        with self.assertRaises(ValueError):render_card('gspc-one',self.card())


if __name__ == '__main__':
    unittest.main()
