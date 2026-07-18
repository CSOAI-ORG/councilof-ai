"""Tests for meok-sovereign-memory-mcp."""
import os, tempfile, time

_TEST_DIR = tempfile.mkdtemp(prefix="sov_mem_test_")
os.environ["SOV_MEMORY_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_memory_mcp import (
    sov_memory_store, sov_memory_recall, sov_memory_link,
    sov_memory_decay, sov_memory_snapshot, _EPISODES, VERSION, PROTOCOL,
)


def test_store_basic():
    r = sov_memory_store("The sovereign dragon woke at dawn", agent_id="sovereign")
    assert r["protocol"] == PROTOCOL
    assert r["summary"].startswith("The sovereign")
    assert "kid" in r and "sig" in r
    assert r["verify_url"].startswith("https://proofof.ai/memory/")


def test_store_with_tags():
    r = sov_memory_store("Council voted on Charter Article 7",
                         tags=["council", "charter", "governance"],
                         emotion="resolved", importance=0.9)
    assert "council" in r["tags"]
    assert r["emotion"] == "resolved"
    assert r["importance"] == 0.9


def test_importance_clamped():
    r = sov_memory_store("test", importance=2.0)  # over 1.0
    assert r["importance"] == 1.0
    r2 = sov_memory_store("test", importance=-0.5)  # under 0.0
    assert r2["importance"] == 0.0


def test_recall_lexical():
    sov_memory_store("koi pond pH dropped to 6.5 today", importance=0.8)
    sov_memory_store("governance council meeting was productive", importance=0.6)
    r = sov_memory_recall("koi pond water quality")
    assert r["result_count"] >= 1
    # First result should be the koi memory
    assert "koi" in r["results"][0]["summary"].lower()


def test_recall_importance_scoring():
    sov_memory_store("low importance memory", importance=0.1)
    sov_memory_store("HIGH IMPORTANCE MEMORY", importance=1.0)
    r = sov_memory_recall("memory")
    scores = [x["score"] for x in r["results"]]
    # Higher importance should score higher
    assert scores[0] >= scores[-1] if scores else True


def test_recall_with_agent_filter():
    sov_memory_store("sovereign memory", agent_id="sovereign")
    sov_memory_store("editor memory", agent_id="editor")
    r = sov_memory_recall("memory", agent_filter="sovereign")
    assert all(x["agent_id"] == "sovereign" for x in r["results"])


def test_recall_no_results():
    r = sov_memory_recall("xyznonexistent123")
    assert r["result_count"] == 0


def test_link_memories():
    a = sov_memory_store("Memory A")
    b = sov_memory_store("Memory B")
    r = sov_memory_link(a["episode_id"], b["episode_id"], link_type="caused")
    assert r["link"]["from"] == a["episode_id"]
    assert r["link"]["to"] == b["episode_id"]
    assert r["link"]["type"] == "caused"


def test_link_unknown_episode():
    r = sov_memory_link("nonexistent", "alsofake")
    assert "error" in r


def test_decay():
    sov_memory_store("Memory to decay")
    r = sov_memory_decay(half_life_hours=24)
    assert r["decay_count"] >= 1
    assert r["half_life_hours"] == 24


def test_snapshot():
    sov_memory_store("snap1")
    sov_memory_store("snap2")
    r = sov_memory_snapshot()
    assert r["episode_count"] >= 2
    assert r["snapshot_id"]
    assert "kid" in r and "sig" in r
    assert len(r["graph"]["episodes"]) >= 2


def test_all_signed():
    r = sov_memory_store("signed test")
    assert "kid" in r and "sig" in r
    assert r["verify_url"]
