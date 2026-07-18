"""Tests for meok-sovereign-tenant-mcp (multi-tenant isolation)."""
import meok_sovereign_tenant_mcp as t_mod
from meok_sovereign_tenant_mcp import (
    tenant_create, tenant_get, tenant_list,
    tenant_isolate, tenant_delete,
)


def reset_state():
    t_mod._TENANTS.clear()
    t_mod._NAMESPACES.clear()
    t_mod._APPROVALS.clear()


def test_create_basic():
    reset_state()
    r = tenant_create("acme", namespace="prod", isolation="strong", owner="alice")
    assert r["name"] == "acme"
    assert r["namespace"] == "prod"
    assert r["isolation"] == "strong"
    assert r["isolation_strength"] == 2


def test_create_empty_name():
    r = tenant_create("")
    assert "error" in r


def test_create_unknown_isolation():
    r = tenant_create("acme", isolation="mega")
    assert "error" in r


def test_get_existing():
    reset_state()
    c = tenant_create("acme")
    r = tenant_get(c["tenant_id"])
    assert r["name"] == "acme"


def test_get_unknown():
    r = tenant_get("nope")
    assert "error" in r


def test_list_all():
    reset_state()
    tenant_create("a")
    tenant_create("b")
    tenant_create("c", namespace="other")
    r = tenant_list()
    assert r["count"] == 3


def test_list_by_namespace():
    reset_state()
    tenant_create("a", namespace="prod")
    tenant_create("b", namespace="prod")
    tenant_create("c", namespace="staging")
    r = tenant_list(namespace="prod")
    assert r["count"] == 2


def test_list_excludes_deleted():
    reset_state()
    c = tenant_create("acme")
    for approver in ["scribe", "shield", "lex"]:
        tenant_delete(c["tenant_id"], approver, force=True)
    r = tenant_list()
    assert r["count"] == 0


def test_isolate_3_voters():
    reset_state()
    c = tenant_create("acme")
    tid = c["tenant_id"]
    r1 = tenant_isolate(tid, "scribe")
    assert r1["isolated"] is False
    r2 = tenant_isolate(tid, "shield")
    assert r2["isolated"] is False
    r3 = tenant_isolate(tid, "lex")
    assert r3["isolated"] is True


def test_isolate_unknown_tenant():
    r = tenant_isolate("nope", "scribe")
    assert "error" in r


def test_isolate_state_visible():
    reset_state()
    c = tenant_create("acme")
    tid = c["tenant_id"]
    for approver in ["a", "b", "c"]:
        tenant_isolate(tid, approver)
    g = tenant_get(tid)
    assert g["isolated"] is True
    assert g["status"] == "isolated"


def test_delete_3_voters():
    reset_state()
    c = tenant_create("acme")
    tid = c["tenant_id"]
    for approver in ["scribe", "shield", "lex"]:
        tenant_delete(tid, approver, force=True)
    g = tenant_get(tid)
    assert g["deleted"] is True


def test_delete_with_active_sessions():
    reset_state()
    c = tenant_create("acme")
    tid = c["tenant_id"]
    t_mod._TENANTS[tid]["active_sessions"] = 5
    r = tenant_delete(tid, "scribe")
    assert "error" in r
    assert r["active_sessions"] == 5


def test_delete_with_force_and_sessions():
    reset_state()
    c = tenant_create("acme")
    tid = c["tenant_id"]
    t_mod._TENANTS[tid]["active_sessions"] = 5
    for approver in ["a", "b", "c"]:
        tenant_delete(tid, approver, force=True)
    g = tenant_get(tid)
    assert g["deleted"] is True


def test_namespace_count_updates():
    reset_state()
    c = tenant_create("a", namespace="ns1")
    tid = c["tenant_id"]
    for approver in ["a", "b", "c"]:
        tenant_delete(tid, approver, force=True)
    r = tenant_list(namespace="ns1")
    assert r["namespaces"]["ns1"]["tenant_count"] == 0


def test_no_external_deps():
    src = open(t_mod.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    c = tenant_create("acme")
    tid = c["tenant_id"]
    for r in [
        tenant_get(tid),
        tenant_list(),
        tenant_isolate(tid, "scribe"),
        tenant_delete(tid, "scribe", force=True),
    ]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Create → list → isolate → delete → verify excluded."""
    reset_state()
    a = tenant_create("acme", namespace="prod", isolation="strong")
    b = tenant_create("globex", namespace="staging", isolation="soft")
    lst = tenant_list()
    assert lst["count"] == 2
    tid = a["tenant_id"]
    for approver in ["scribe", "shield", "lex"]:
        tenant_isolate(tid, approver)
    for approver in ["scribe", "shield", "lex"]:
        tenant_delete(tid, approver, force=True)
    final = tenant_list(include_deleted=False)
    assert final["count"] == 1