"""Tests for meok-sovereign-training-data-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_data_")
os.environ["SOV_DATA_KEY"] = _TEST + "/k.pem"
from meok_sovereign_training_data_mcp import (
    corpus_create, corpus_add, corpus_query, corpus_export, corpus_stats,
    _CORPORA, _EXAMPLES, SOURCES, LICENSE,
)


def reset():
    _CORPORA.clear()
    _EXAMPLES.clear()


def test_11_sources():
    assert len(SOURCES) == 11


def test_license_is_cc0():
    assert "CC0" in LICENSE
    assert "Public Domain" in LICENSE


def test_corpus_create():
    reset()
    r = corpus_create("Sovereign Q&A", "Test set", "Wikidata (CC0)", "qa")
    assert r["dataset_id"].startswith("ds-")
    assert r["name"] == "Sovereign Q&A"
    assert r["license"] == LICENSE


def test_corpus_create_increments():
    reset()
    corpus_create("A", "x", "Wikidata", "qa")
    corpus_create("B", "y", "Wikipedia", "qa")
    assert len(_CORPORA) == 2


def test_corpus_add():
    reset()
    ds = corpus_create("X", "y")
    r = corpus_add(ds["dataset_id"], [
        {"input": "What is London?", "output": "Capital of UK."},
        {"input": "What is Paris?", "output": "Capital of France."},
    ])
    assert r["added"] == 2
    assert r["total_examples"] == 2


def test_corpus_add_invalid():
    reset()
    ds = corpus_create("X", "y")
    r = corpus_add(ds["dataset_id"], [{"no_input": "bad"}, {"input": "x", "output": "y"}])
    assert r["added"] == 1  # Only the second is valid


def test_corpus_add_unknown_dataset():
    reset()
    r = corpus_add("ds-999999", [{"input": "x", "output": "y"}])
    assert "error" in r


def test_corpus_query_list():
    reset()
    corpus_create("A", "x")
    corpus_create("B", "y")
    r = corpus_query()
    assert r["count"] == 2


def test_corpus_query_specific():
    reset()
    ds = corpus_create("X", "y")
    corpus_add(ds["dataset_id"], [
        {"input": "London?", "output": "Capital of UK."},
        {"input": "Paris?", "output": "Capital of France."},
    ])
    r = corpus_query(ds["dataset_id"], query="London")
    assert r["count"] == 1


def test_corpus_query_with_limit():
    reset()
    ds = corpus_create("X", "y")
    corpus_add(ds["dataset_id"], [{"input": f"q{i}", "output": f"a{i}"} for i in range(10)])
    r = corpus_query(ds["dataset_id"], limit=3)
    assert r["count"] == 3


def test_corpus_query_unknown():
    reset()
    r = corpus_query("ds-999999")
    assert "error" in r


def test_corpus_export_jsonl():
    reset()
    ds = corpus_create("X", "y")
    corpus_add(ds["dataset_id"], [{"input": "q", "output": "a"}])
    r = corpus_export(ds["dataset_id"], format="jsonl")
    assert r["format"] == "jsonl"
    assert "q" in r["content"]


def test_corpus_export_csv():
    reset()
    ds = corpus_create("X", "y")
    corpus_add(ds["dataset_id"], [{"input": "q", "output": "a"}])
    r = corpus_export(ds["dataset_id"], format="csv")
    assert "input,output" in r["content"]


def test_corpus_export_summary():
    reset()
    ds = corpus_create("X", "y")
    r = corpus_export(ds["dataset_id"], format="summary")
    assert r["format"] == "summary"
    assert "sources" in r
    assert len(r["sources"]) == 11


def test_corpus_export_invalid_format():
    reset()
    ds = corpus_create("X", "y")
    r = corpus_export(ds["dataset_id"], format="xml")
    assert "error" in r


def test_corpus_export_unknown():
    reset()
    r = corpus_export("ds-999999")
    assert "error" in r


def test_corpus_stats():
    reset()
    ds = corpus_create("X", "y")
    corpus_add(ds["dataset_id"], [
        {"input": "short", "output": "longer answer"},
        {"input": "longer question here", "output": "x"},
    ])
    r = corpus_stats(ds["dataset_id"])
    assert r["total"] == 2
    assert r["max_input_len"] == len("longer question here")


def test_corpus_stats_empty():
    reset()
    ds = corpus_create("X", "y")
    r = corpus_stats(ds["dataset_id"])
    assert r["total"] == 0


def test_corpus_stats_unknown():
    reset()
    r = corpus_stats("ds-999999")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_training_data_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    for r in [corpus_create("X", "y"), corpus_query()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_workflow():
    """Create dataset → add examples → query → export → stats."""
    reset()
    ds = corpus_create("Sovereign Cities", "30 capitals of the world")
    cities = [
        ("London", "Capital of UK."),
        ("Paris", "Capital of France."),
        ("Berlin", "Capital of Germany."),
        ("Tokyo", "Capital of Japan."),
        ("New York", "Major US city."),
    ]
    corpus_add(ds["dataset_id"], [{"input": f"Capital of {c[0]}?", "output": c[1]} for c in cities])
    r = corpus_query(ds["dataset_id"], limit=10)
    assert r["count"] == 5
    r = corpus_export(ds["dataset_id"], format="jsonl")
    assert r["format"] == "jsonl"
    r = corpus_stats(ds["dataset_id"])
    assert r["total"] == 5


def test_sources_have_licenses():
    for s in SOURCES:
        assert "name" in s
        assert "license" in s
