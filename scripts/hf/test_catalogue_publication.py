from types import SimpleNamespace

import pytest

from kaggle_product_cards import remove_shared_sections, render
from publish_kaggle_cards import SETTINGS, settings, validate as validate_kaggle
from publish_product_cards import digest, validate as validate_hf


def test_kaggle_sections_preserve_specific_content_and_code():
    text = '# Dataset\nUnique scope.\n## The live board is the authority\nold\n### Council of AI — GSPC + Hub printer\nmore old\n## Files\nitems.jsonl\n```python\n## The live board is the authority\nprint(1)\n```\n## Citation\nAuthor\n'
    cleaned = remove_shared_sections(text)
    assert 'old' not in cleaned
    assert 'Unique scope.' in cleaned and 'items.jsonl' in cleaned and 'Author' in cleaned
    assert '```python\n## The live board is the authority\nprint(1)\n```' in cleaned


def test_kaggle_render_keeps_mirror_and_is_idempotent():
    row=dict(ref='owner/example',files_complete=True,files=[dict(name='items.jsonl',bytes=8)],
             metadata=dict(isPrivate=False,description='Mirror at abc123.\n## Files\nA dated sample.\n<!-- note -->\n<https://example.test/data>',title='Sample'))
    result=render(row)
    assert 'Mirror at abc123.' in result and 'A dated sample.' in result
    assert 'datasets download -d owner/example' in result
    assert '<!--' not in result and '<https://' not in result
    assert '[https://example.test/data](https://example.test/data)' in result
    assert render({**row,'metadata':{**row['metadata'],'description':result}})==result


def test_truncated_trailing_announcement_marker_does_not_reach_kaggle():
    row=dict(ref='owner/example',files_complete=True,files=[dict(name='items.jsonl',bytes=8)],
             metadata=dict(isPrivate=False,description='Unique method.\n<!-- csoai-smithery-conn',title='Sample'))
    result=render(row)
    assert 'Unique method.' in result
    assert '<!--' not in result


@pytest.mark.parametrize('field,value',[('isPrivate',True),('isPrivate',None)])
def test_kaggle_private_refused(field,value):
    with pytest.raises(ValueError):
        render(dict(metadata={field:value},files_complete=True))


def metadata():
    result={key:'' for key in SETTINGS}
    result.update(isPrivate=False,collaborators=[],licenses=[{'name':'CC-BY-4.0'}],keywords=['research'],data=[])
    return result


def test_kaggle_guard_preserves_every_setting():
    before=metadata();proposed=dict(before,description='New guide')
    assert validate_kaggle(before,before,proposed)
    assert not validate_kaggle(before,proposed,proposed)
    for key in SETTINGS:
        if key=='description':continue
        with pytest.raises(ValueError):
            validate_kaggle(before,before,{**proposed,key:'different'})
    with pytest.raises(ValueError):validate_kaggle(before,dict(before,description='concurrent edit'),proposed)
    with pytest.raises(ValueError):settings({'description':'incomplete export'})


def test_hf_manifest_content_parent_and_visibility_guards():
    before=SimpleNamespace(private=False,sha='a'*40)
    entry=dict(parent=before.sha,before_sha256=digest(b'old'),after_sha256=digest(b'new'))
    assert validate_hf(entry,before,b'old',b'new')
    assert not validate_hf(entry,before,b'new',b'new')
    with pytest.raises(ValueError):validate_hf(entry,before,b'old',b'tampered')
    with pytest.raises(ValueError):validate_hf(entry,before,b'concurrent edit',b'new')
    with pytest.raises(ValueError):validate_hf(entry,SimpleNamespace(private=False,sha='b'*40),b'old',b'new')
    with pytest.raises(ValueError):validate_hf(entry,SimpleNamespace(private=True,sha=before.sha),b'old',b'new')
