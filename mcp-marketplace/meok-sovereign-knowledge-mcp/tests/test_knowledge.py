"""Tests for meok-sovereign-knowledge-mcp (CC0 knowledge graph)."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_know_")
os.environ["SOV_KNOW_KEY"] = _TEST + "/k.pem"
from meok_sovereign_knowledge_mcp import (
    knowledge_add, knowledge_query, knowledge_link, knowledge_traverse, knowledge_export,
    _FACTS, _LINKS, _FACT_COUNTER, LICENSE, LICENSE_URL,
)


def reset():
    _FACTS.clear()
    _LINKS.clear()
    _FACT_COUNTER[0] = 0


def test_license_is_cc0():
    assert "CC0" in LICENSE
    assert "Public Domain" in LICENSE


def test_knowledge_add():
    reset()
    r = knowledge_add("London", "city", "Capital of UK", "Wikipedia (CC BY-SA)", "Wikipedia contributors")
    assert r["fact_id"] == "fact-00000001"
    assert r["entity"] == "London"
    assert r["source"] == "Wikipedia (CC BY-SA)"
    assert r["body_hash"] is not None


def test_knowledge_add_increments():
    reset()
    knowledge_add("A", "x", "1", "s")
    knowledge_add("B", "y", "2", "s")
    assert _FACT_COUNTER[0] == 2


def test_knowledge_query_by_entity():
    reset()
    knowledge_add("London", "city", "Capital of UK", "Wikipedia")
    knowledge_add("Paris", "city", "Capital of France", "Wikipedia")
    r = knowledge_query(entity="London")
    assert r["count"] == 1
    assert r["results"][0]["entity"] == "London"


def test_knowledge_query_by_type():
    reset()
    knowledge_add("London", "city", "Capital of UK", "Wikipedia")
    knowledge_add("Thames", "river", "Flows through London", "Wikipedia")
    r = knowledge_query(type="river")
    assert r["count"] == 1


def test_knowledge_query_full_text():
    reset()
    knowledge_add("London", "city", "Capital of UK", "Wikipedia")
    r = knowledge_query(query="london")
    assert r["count"] == 1


def test_knowledge_query_by_source():
    reset()
    knowledge_add("Earth", "planet", "Third from sun", "NASA")
    knowledge_add("Mars", "planet", "Fourth from sun", "Wikipedia")
    r = knowledge_query(source="NASA")
    assert r["count"] == 1


def test_knowledge_query_limit():
    reset()
    for i in range(5):
        knowledge_add(f"E{i}", "x", str(i), "s")
    r = knowledge_query(limit=3)
    assert r["count"] == 3


def test_knowledge_query_empty():
    reset()
    r = knowledge_query()
    assert r["count"] == 0


def test_knowledge_link():
    reset()
    a = knowledge_add("London", "city", "Capital", "Wiki")
    b = knowledge_add("Thames", "river", "Flows", "Wiki")
    r = knowledge_link(a["fact_id"], b["fact_id"], "geography.flows_through")
    assert r["link"]["relation"] == "geography.flows_through"


def test_knowledge_link_unknown():
    reset()
    r = knowledge_link("fact-9999", "fact-8888", "x")
    assert "error" in r


def test_knowledge_traverse():
    reset()
    a = knowledge_add("London", "city", "Capital", "Wiki")
    b = knowledge_add("Thames", "river", "Flows", "Wiki")
    c = knowledge_add("Tower Bridge", "bridge", "On Thames", "Wiki")
    knowledge_link(a["fact_id"], b["fact_id"], "geography")
    knowledge_link(b["fact_id"], c["fact_id"], "geography")
    r = knowledge_traverse(a["fact_id"], depth=2)
    assert r["count"] >= 2


def test_knowledge_traverse_unknown():
    reset()
    r = knowledge_traverse("fact-9999")
    assert "error" in r


def test_knowledge_export_summary():
    reset()
    knowledge_add("X", "x", "1", "s")
    r = knowledge_export(format="summary")
    assert r["total_facts"] == 1
    assert r["license"] == LICENSE
    assert "Wikidata" in str(r["public_domain_sources"])


def test_knowledge_export_full():
    reset()
    knowledge_add("X", "x", "1", "s")
    r = knowledge_export(format="json")
    assert r["format"] == "json"
    assert "fact-00000001" in r["facts"]


def test_knowledge_export_invalid_format():
    reset()
    r = knowledge_export(format="xml")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_knowledge_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    for r in [knowledge_add("X", "x", "1", "s"), knowledge_query(), knowledge_export("summary")]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_license_in_responses():
    reset()
    r = knowledge_add("X", "x", "1", "s")
    assert r.get("license") == LICENSE


def test_multiple_facts():
    reset()
    knowledge_add("London", "city", "Capital of UK", "Wikipedia")
    knowledge_add("Paris", "city", "Capital of France", "Wikipedia")
    knowledge_add("Berlin", "city", "Capital of Germany", "Wikipedia")
    knowledge_add("Tokyo", "city", "Capital of Japan", "Wikipedia")
    r = knowledge_query()
    assert r["count"] == 4
    assert r["total_facts"] == 4
