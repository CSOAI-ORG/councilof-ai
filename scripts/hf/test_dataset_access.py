"""Prevent general card refreshes from recreating mixed-schema viewers."""
import sys
from pathlib import Path
import yaml

sys.path.insert(0, str(Path(__file__).parent))
from hf_card_metadata import VIEWER_REPAIRS, render, split_card, USAGE_START


def test_recipes_preserve_licence_and_never_merge_proofs():
    original = '---\nlicense: other\nlicense_name: per-file\ngated: manual\ndataset_info:\n  stale: true\nconfigs:\n- config_name: bad\n  data_files: ["**/*.json"]\n---\n\n# Original\n\nUnique limitations and signature instructions.\n'
    for repo, recipe in VIEWER_REPAIRS.items():
        fixed = render(repo, original, recipe, None)
        meta = yaml.safe_load('\n'.join(split_card(fixed)[0]))
        assert meta['license'] == 'other' and meta['license_name'] == 'per-file'
        assert meta['gated'] == 'manual'
        assert 'dataset_info' not in meta
        assert 'Unique limitations and signature instructions.' in fixed
        assert fixed.count(USAGE_START) == 1
        assert render(repo, fixed, recipe, None) == fixed
        if recipe.get('viewer') is False:
            assert 'configs' not in meta
            assert 'structured evidence archive' in fixed
        else:
            assert 'viewer' not in meta
            assert meta['configs'] == recipe['configs']
            assert '**' not in str(meta['configs'])


def test_nested_arrays_are_not_one_row_documents():
    expected = {'fleet-status': 'jobs', 'index-presence': 'results', 'gspc-organism': 'integration_targets'}
    for name, field in expected.items():
        result = render('csoai/'+name, '---\nlicense: cc-by-4.0\n---\n\n# Test\n', VIEWER_REPAIRS['csoai/'+name], None)
        assert yaml.safe_load('\n'.join(split_card(result)[0]))['configs'][0]['field'] == field
