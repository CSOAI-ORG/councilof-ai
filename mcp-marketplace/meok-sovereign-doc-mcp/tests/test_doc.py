"""Tests for meok-sovereign-doc-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_doc_")
os.environ["SOV_DOC_KEY"] = _TEST + "/k.pem"
from meok_sovereign_doc_mcp import (
    doc_create, doc_get, doc_search, doc_sign, doc_list,
    DOCS, _DOC_ID_COUNTER,
)


def reset():
    DOCS.clear()
    _DOC_ID_COUNTER[0] = 0


def test_doc_create():
    reset()
    r = doc_create("Test Doc", "Hello world", "alice", ["test"])
    assert r["doc_id"] == "doc-000001"
    assert r["author"] == "alice"
    assert "body_hash" in r


def test_doc_create_default():
    reset()
    r = doc_create("Untitled", "x")
    assert r["author"] == "anon"


def test_doc_get():
    reset()
    r = doc_create("Test", "content", "alice")
    did = r["doc_id"]
    g = doc_get(did)
    assert g["doc"]["title"] == "Test"
    assert g["doc"]["author"] == "alice"


def test_doc_get_unknown():
    reset()
    r = doc_get("doc-999999")
    assert "error" in r


def test_doc_search_by_title():
    reset()
    doc_create("Foo bar", "content", "alice")
    doc_create("Baz qux", "content", "bob")
    r = doc_search("Foo")
    assert r["count"] == 1
    assert r["results"][0]["title"] == "Foo bar"


def test_doc_search_by_tag():
    reset()
    doc_create("A", "x", "alice", ["finance"])
    doc_create("B", "x", "bob", ["defence"])
    r = doc_search(tag="finance")
    assert r["count"] == 1
    assert r["results"][0]["title"] == "A"


def test_doc_search_by_author():
    reset()
    doc_create("A", "x", "alice")
    doc_create("B", "x", "bob")
    r = doc_search(author="alice")
    assert r["count"] == 1


def test_doc_sign_basic():
    reset()
    r = doc_create("X", "x", "alice")
    s = doc_sign(r["doc_id"], "bob")
    assert s["signer"] == "bob"
    assert s["sig_count"] == 1


def test_doc_sign_sensitive_needs_bft():
    reset()
    r = doc_create("X", "x", "alice", sensitive=True)
    s = doc_sign(r["doc_id"], "bob")
    assert "error" in s


def test_doc_sign_sensitive_with_bft():
    reset()
    r = doc_create("X", "x", "alice", sensitive=True)
    votes = [{"voter": "A", "choice": "YES"}, {"voter": "B", "choice": "YES"}, {"voter": "C", "choice": "YES"}]
    s = doc_sign(r["doc_id"], "bob", bft_votes=votes)
    assert s["sig_count"] == 1


def test_doc_sign_sensitive_insufficient_bft():
    reset()
    r = doc_create("X", "x", "alice", sensitive=True)
    votes = [{"voter": "A", "choice": "YES"}, {"voter": "B", "choice": "NO"}]
    s = doc_sign(r["doc_id"], "bob", bft_votes=votes)
    assert "error" in s


def test_doc_sign_unknown():
    reset()
    s = doc_sign("doc-999999", "x")
    assert "error" in s


def test_doc_list():
    reset()
    for i in range(3):
        doc_create(f"Doc {i}", "x", "alice", [f"tag{i}"])
    r = doc_list()
    assert r["count"] == 3
    assert r["total"] == 3


def test_doc_list_filtered():
    reset()
    doc_create("A", "x", "alice", ["finance"])
    doc_create("B", "x", "bob", ["defence"])
    r = doc_list(tag="finance")
    assert r["count"] == 1
    assert r["results"][0]["title"] == "A"


def test_no_external_deps():
    import meok_sovereign_doc_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    for r in [doc_create("X", "x"), doc_list()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Create 3 → search → sign 1 → list."""
    reset()
    doc_create("Charter", "10 Articles", "founder", ["sovereign", "charter"])
    doc_create("DORA Audit", "5 pillars", "founder", ["finance", "dora"])
    doc_create("JARVIS Spec", "humanoid", "founder", ["robotics"])
    s = doc_search("DORA")
    assert s["count"] == 1
    # Sign the Charter
    r = doc_sign("doc-000001", "founder")
    assert r["sig_count"] == 1
    l = doc_list(tag="sovereign")
    assert l["count"] == 1
