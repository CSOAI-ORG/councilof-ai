"""Protect dataset provenance and non-presentation bytes during card maintenance."""
import unittest
from unittest.mock import patch
from polish_frontdoors import (
    assert_unchanged_files, front_matter, render_card, GSPC_ONE_CONFIG, ROOT, TARGETS,
    BRAND_BANNER_URL, OVERVIEW_START, OVERVIEW_END, brand_banner, snapshot_overview,
)


class FrontdoorGuards(unittest.TestCase):
    snapshot = dict(as_of="2026-10-29T11:07:30Z", read_at="2026-10-29T16:24:34Z", board_sha256="a" * 64)
    banner = f'<p align="center">\n  <img src="{BRAND_BANNER_URL}" alt="Council of AI (CSOAI)" width="100%">\n</p>'
    overview = f'{OVERVIEW_START}\n## Snapshot at a glance\n\nDated count: 22 axes; as_of `2026-09-05T09:00:28Z`.\n{OVERVIEW_END}'

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

    def test_dataset_preserves_live_banner_and_dated_overview_exactly(self):
        current = self.card() + '\n' + self.banner + '\n\n' + self.overview + '\n'
        new = render_card('dataset', current, self.snapshot)
        self.assertEqual(brand_banner(new), self.banner)
        self.assertEqual(snapshot_overview(new), self.overview)
        self.assertEqual(new.count(BRAND_BANNER_URL), 1)
        self.assertEqual(new.count(OVERVIEW_START), 1)
        self.assertLess(new.index(OVERVIEW_END), new.index('## Load the dataset'))
        self.assertEqual(front_matter(current)[0], front_matter(new)[0])
        self.assertEqual(render_card('dataset', new, self.snapshot), new)

    def test_organisation_preserves_banner_without_changing_metadata(self):
        current = (ROOT / TARGETS['organisation'][2]).read_text() + '\n' + self.banner + '\n'
        new = render_card('organisation', current)
        self.assertEqual(brand_banner(new), self.banner)
        self.assertEqual(new.count(BRAND_BANNER_URL), 1)
        self.assertEqual(front_matter(current)[0], front_matter(new)[0])
        self.assertEqual(render_card('organisation', new), new)

    def test_template_sections_are_not_duplicated_or_allowed_to_replace_historical_values(self):
        current = self.card() + '\n' + self.banner + '\n\n' + self.overview + '\n'
        template = (ROOT / TARGETS['dataset'][2]).read_text()
        template = self.banner + '\n\n' + template.replace('## Load the dataset',
            self.overview.replace('22 axes', '999 axes') + '\n\n## Load the dataset')
        with patch('polish_frontdoors.Path.read_text', return_value=template):
            new = render_card('dataset', current, self.snapshot)
        self.assertEqual(new.count(BRAND_BANNER_URL), 1)
        self.assertEqual(new.count(OVERVIEW_START), 1)
        self.assertEqual(snapshot_overview(new), self.overview)
        self.assertNotIn('999 axes', new)

    def test_ambiguous_or_unclosed_live_sections_refuse(self):
        invalid = [self.banner + '\n' + self.banner, self.banner.replace('</p>', ''),
                   self.overview.replace(OVERVIEW_END, ''), self.overview.replace(OVERVIEW_START, ''),
                   self.overview + '\n' + self.overview, OVERVIEW_END + '\n' + OVERVIEW_START,
                   self.overview + '\n<!-- gspc-overview:unknown -->']
        for block in invalid:
            with self.subTest(block=block), self.assertRaises(ValueError):
                render_card('dataset', self.card() + '\n' + block + '\n', self.snapshot)

    def test_ambiguous_template_sections_also_refuse(self):
        template = (ROOT / TARGETS['dataset'][2]).read_text()
        for block in (self.banner + '\n' + self.banner, self.overview.replace(OVERVIEW_END, '')):
            with self.subTest(block=block), patch('polish_frontdoors.Path.read_text', return_value=template + '\n' + block), self.assertRaises(ValueError):
                render_card('dataset', self.card(), self.snapshot)

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
