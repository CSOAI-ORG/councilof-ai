import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location('product_cards', Path(__file__).with_name('product_cards.py'))
cards = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cards)


def row(body):
    return dict(kind='dataset', id='csoai/example', sha='a' * 40, private=False,
                files=['README.md', 'items.jsonl'], readme='---\nlicense: cc-by-4.0\nviewer: false\n---\n\n' + body)


def test_cleanup_keeps_unique_content_inventory_citation_and_metadata():
    before = row('# Example\n\nScope: one historical sample.\n<!-- csoai-hubcard-v2 -->\n## The live board is the authority\nRepeated copy.\n## What is in this repository\n`items.jsonl` — two rows.\n## Citation\nOriginal author.\n<!-- /csoai-hubcard-v2 -->\n')
    after, count = cards.render_hf(before)
    assert count == 1
    assert after.startswith('---\nlicense: cc-by-4.0\nviewer: false\n---\n')
    for unique in ['# Example', 'Scope: one historical sample.', '`items.jsonl` — two rows.', 'Original author.']:
        assert unique in after
    assert 'Repeated copy.' not in after
    assert '/blob/' + 'a' * 40 + '/README.md' in after
    assert "revision='" + 'a' * 40 + "'" in after
    assert cards.render_hf({**before, 'readme': after}) == (after, 0)


def test_unmarked_content_is_never_replaced():
    original = row('# Specific research\nAll original words.\n')
    assert cards.render_hf(original) == (original['readme'], 0)


def test_incomplete_marker_requires_review():
    with pytest.raises(ValueError, match='unbalanced'):
        cards.render_hf(row('<!-- csoai-hubcard-v2 -->\nImportant content'))


def test_private_repository_is_refused():
    with pytest.raises(ValueError, match='public'):
        cards.render_hf({**row('example'), 'private': True})


def test_models_without_weights_are_not_presented_as_downloadable_models():
    x = row('<!-- csoai-capability-densify-2026-09-14-tui7 -->old<!-- /csoai-capability-densify-2026-09-14-tui7 -->')
    x.update(kind='model', files=['README.md', 'measurements.json'])
    after, _ = cards.render_hf(x)
    assert 'does not distribute model weights' in after
    assert "repo_type='dataset'" not in after


def test_inventory_selection_uses_an_existing_data_file_not_a_manifest_when_available():
    assert cards.first_artifact(['README.md', 'manifest.jsonl', 'items.jsonl']) == 'items.jsonl'
