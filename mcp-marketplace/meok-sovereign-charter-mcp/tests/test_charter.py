"""Tests for meok-sovereign-charter-mcp (10-article Constitutional Charter)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_char_test_")
os.environ["SOV_CHAR_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_charter_mcp import (
    charter_get, charter_article, charter_amend, charter_vote, charter_status,
    ARTICLES, _AMENDMENTS,
)


def reset_amendments():
    _AMENDMENTS.clear()


def test_10_articles():
    assert len(ARTICLES) == 10


def test_article_1_maternal_covenant():
    r = charter_article(1)
    assert r["article"]["name"] == "Maternal Covenant"
    assert "16-probe" in r["article"]["doctrine"]
    assert len(r["article"]["probes"]) == 16


def test_article_2_defensive_doctrine():
    r = charter_article(2)
    assert r["article"]["name"] == "Defensive Doctrine"
    assert "Never Offend" in r["article"]["doctrine"]
    assert len(r["article"]["principles"]) == 6


def test_article_3_sigil_mandate():
    r = charter_article(3)
    assert r["article"]["name"] == "Sigil Mandate"
    assert "Ed25519" in r["article"]["doctrine"]


def test_article_4_bft_council():
    r = charter_article(4)
    assert r["article"]["name"] == "BFT Council"
    assert r["article"]["thresholds"]["fast"] == 3
    assert r["article"]["thresholds"]["balanced"] == 5
    assert r["article"]["thresholds"]["secure"] == 7


def test_article_5_generals():
    r = charter_article(5)
    assert r["article"]["generals_count"] == 12
    assert len(r["article"]["dimensions"]) == 5


def test_article_6_ab_uno():
    r = charter_article(6)
    assert r["article"]["name"] == "AB Uno Substrate"
    assert len(r["article"]["traditions"]) == 6


def test_article_7_sephiroth():
    r = charter_article(7)
    assert r["article"]["sephiroth_count"] == 12
    assert r["article"]["canonical"] == 10
    assert r["article"]["auxiliary"] == 2


def test_article_8_5_tasks():
    r = charter_article(8)
    assert r["article"]["name"] == "5 Sovereign Tasks"
    assert len(r["article"]["tasks"]) == 5
    assert "eu_ai_act" in r["article"]["tasks"]
    assert "dora" in r["article"]["tasks"]


def test_article_9_native_runtime():
    r = charter_article(9)
    assert "Ollama" in r["article"]["doctrine"]


def test_article_10_mit():
    r = charter_article(10)
    assert r["article"]["license"] == "MIT"
    assert "UK" in r["article"]["company"]


def test_get_full_charter():
    r = charter_get()
    assert r["article_count"] == 10
    assert r["license"] == "MIT"


def test_article_invalid_id():
    r = charter_article(0)
    assert "error" in r


def test_article_out_of_range():
    r = charter_article(11)
    assert "error" in r


def test_amend_proposal():
    reset_amendments()
    r = charter_amend(2, "Updated defensive doctrine", "dragon")
    assert r["status"] == "PENDING"
    assert r["voters_required"] == 7
    assert r["quorum_required"] == 5


def test_amend_invalid_article():
    reset_amendments()
    r = charter_amend(11, "Test", "dragon")
    assert "error" in r


def test_vote_5_for_ratifies():
    """5 votes for in secure mode (quorum=5) = ratified."""
    reset_amendments()
    a = charter_amend(2, "Updated", "dragon")
    aid = a["amendment_id"]
    for v in ["argus", "scribe", "shield", "builder", "lex"]:
        r = charter_vote(aid, v, "for")
        if r.get("status") == "RATIFIED":
            break
    # After 5 votes for, should be ratified
    r = charter_status()
    assert any(am["status"] == "RATIFIED" for am in r["amendments"])


def test_status_empty():
    reset_amendments()
    r = charter_status()
    assert r["amendment_count"] == 0


def test_no_external_deps():
    import meok_sovereign_charter_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = charter_get()
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = charter_article(1)
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = charter_amend(1, "Test", "dragon")
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = charter_vote(r3["amendment_id"], "scribe", "for")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = charter_status()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_article_ids_1_to_10():
    """Verify article IDs are 1-10."""
    for i in range(10):
        r = charter_article(i + 1)
        assert r["article"]["id"] == i + 1


def test_doctrine_amendment():
    """Verify amendment updates the article doctrine when ratified."""
    reset_amendments()
    a = charter_amend(1, "UPDATED MATERNAL COVENANT DOCTRINE", "dragon")
    aid = a["amendment_id"]
    for v in ["argus", "scribe", "shield", "builder", "lex"]:
        charter_vote(aid, v, "for")
    r = charter_article(1)
    assert "UPDATED" in r["article"]["doctrine"]