"""Tests for meok-sovereign-prompt-pack-mcp (12 General personalities)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_pp_test_")
os.environ["SOV_PP_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_prompt_pack_mcp import (
    prompt_get, prompt_list, prompt_format, prompt_compare, prompt_status,
    PROMPTS,
)


def test_12_prompts():
    assert len(PROMPTS) == 12


def test_get_dragon():
    r = prompt_get("dragon")
    assert r["general"] == "dragon"
    assert r["role"] == "sovereign"
    assert "sovereign" in r["system"].lower()


def test_get_scribe():
    r = prompt_get("scribe")
    assert r["role"] == "compliance"
    assert "EU AI Act" in r["system"] or "Maternal Covenant" in r["system"]


def test_get_argus():
    r = prompt_get("argus")
    assert r["role"] == "watchdog"
    assert "iOK Farm" in r["system"]


def test_get_unknown():
    r = prompt_get("nonexistent")
    assert "error" in r


def test_list_all_12():
    r = prompt_list()
    assert r["count"] == 12
    roles = [g["role"] for g in r["generals"]]
    assert "sovereign" in roles
    assert "compliance" in roles
    assert "watchdog" in roles


def test_format_with_task():
    r = prompt_format("dragon", "Audit this code", "Python function")
    assert r["task"] == "Audit this code"
    assert "Python function" in r["formatted_prompt"]
    assert "sovereign" in r["formatted_prompt"].lower()


def test_format_no_context():
    r = prompt_format("dragon", "Audit this code")
    assert r["context"] is None
    assert "Audit this code" in r["formatted_prompt"]


def test_format_unknown():
    r = prompt_format("hacker", "test")
    assert "error" in r


def test_compare_different():
    r = prompt_compare("dragon", "scribe")
    assert r["general_a"] == "dragon"
    assert r["general_b"] == "scribe"
    assert r["role_a"] != r["role_b"]


def test_compare_same():
    r = prompt_compare("dragon", "dragon")
    assert r["role_a"] == r["role_b"]


def test_compare_unknown():
    r = prompt_compare("hacker", "dragon")
    assert "error" in r


def test_status():
    r = prompt_status()
    assert r["general_count"] == 12
    assert r["total_prompt_chars"] > 0


def test_no_external_deps():
    import meok_sovereign_prompt_pack_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = prompt_get("dragon")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = prompt_list()
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = prompt_format("dragon", "test")
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = prompt_compare("dragon", "scribe")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = prompt_status()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_all_12_have_unique_roles():
    roles = [p["role"] for p in PROMPTS]
    assert len(roles) == len(set(roles))


def test_all_12_have_unique_general():
    names = [p["general"] for p in PROMPTS]
    assert len(names) == len(set(names))


def test_sovereign_mentions_dragon_doctrine():
    """The Dragon's prompt should mention 'the dragon runs itself'."""
    r = prompt_get("dragon")
    assert "dragon runs itself" in r["system"]


def test_shield_mentions_defensive():
    r = prompt_get("shield")
    assert "Defend" in r["system"] or "Never Offend" in r["system"]


def test_lex_mentions_uk_residency():
    r = prompt_get("lex")
    assert "UK" in r["system"]