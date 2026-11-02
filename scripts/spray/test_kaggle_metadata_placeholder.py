import importlib.util
from pathlib import Path

SPEC=importlib.util.spec_from_file_location("spray_metadata",Path(__file__).with_name("gspc-spray.py"))
SPRAY=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SPRAY)

def fixture():
    return {"as_of":"2026-09-15T07:13:43Z","read_at":"2026-09-17T11:21:28Z","lid":"fixture board","fingerprint":"fixture-digest","board":{"issuer":"Fixture"}}

def test_placeholder_is_plain_text_not_an_unclosed_html_tag():
    _,text=SPRAY.kaggle_page_text(fixture())
    assert "<card_id>" not in text
    assert "verify CARD_ID" in text

def test_verification_limits_and_fingerprint_follow_placeholder():
    _,text=SPRAY.kaggle_page_text(fixture())
    tail=text.split("verify CARD_ID",1)[1]
    assert "Not a certification" in tail
    assert "spray-fingerprint: fixture-digest" in tail

def test_truncated_description_still_fails_the_exact_readback_guard():
    sub,text=SPRAY.kaggle_page_text(fixture())
    assert SPRAY.kaggle_metadata_drift({"subtitle":sub,"description":text.split("verify CARD_ID")[0]},sub,text)
    assert SPRAY.kaggle_metadata_drift({"subtitle":sub,"description":text},sub,text) is None
