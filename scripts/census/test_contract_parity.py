#!/usr/bin/env python3
"""Offline tests for contract-parity.py. Fixture servers on 127.0.0.1 only; no internet.

Run: python3 -m unittest scripts/census/test_contract_parity.py -v
     python3 scripts/census/contract-parity.py --self-test   # suite + the must-fail controls

The controls: a comparator that adjudicates versions across undeclared namespaces, an attribution that
credits a gateway's card to every tenant, and an auth rule that calls a declared requirement with an open
discovery boundary a contradiction must each FAIL this suite. A suite a broken rule passes proves nothing.
"""
from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
_SPEC = importlib.util.spec_from_file_location("contract_parity", HERE / "contract-parity.py")
C = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(C)

EP = "https://svc.example/mcp"


def live(**kw):
    d = {"state": "RESPONDED", "tools_list_status": "ok", "tools_complete": True, "server_version": "1.0.0",
         "protocol_version": "2025-11-25", "tool_names": ["a", "b"], "n_tools": 2,
         "tool_names_sha256": C.names_sha(["a", "b"])}
    d.update(kw)
    return d


def doc(surface, body, url=None):
    d = {"surface": surface, "url": url or f"https://svc.example/.well-known/{surface}", "facts": C.extract(body, surface)}
    if surface == "x402":
        d["x402"] = C.extract_x402(body, EP)
    return d


def reg(version="1.0.0", auth=(), payment=(), pp=None, id_="ex.svc/one"):
    return {"id": id_, "version": version, "auth": list(auth), "payment": list(payment), "facts": C.extract(pp or {}, "registry-pp")}


def ctx(live_=None, registry=(), docs=()):
    return {"endpoint": EP, "live": live_ or live(), "registry": list(registry), "docs": list(docs)}


class Version(unittest.TestCase):
    def test_same_namespace_disagreement_is_inconsistent_and_quotes_both(self):
        v = C.compare_version(ctx(live(server_version="0.1.0"), [reg("2.1.2")]))
        self.assertEqual(v["state"], "INCONSISTENT")
        vals = sorted(c["value"] for c in v["conflict"])
        self.assertEqual(vals, ["0.1.0", "2.1.2"])
        self.assertTrue(all(c["surface"] and c["path"] for c in v["conflict"]))

    def test_card_serverinfo_is_the_same_namespace(self):
        v = C.compare_version(ctx(live(server_version="1.0.0"), [reg("1.0.0")],
                                  [doc("server-card", {"serverInfo": {"name": "x", "version": "1.26.0"}})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        self.assertIn("1.26.0", [c["value"] for c in v["conflict"]])

    def test_other_namespaces_are_recorded_never_adjudicated(self):
        v = C.compare_version(ctx(live(server_version="2.1.2"), [reg("2.1.2")],
                                  [doc("agent-card", {"name": "a", "version": "9.9.9", "protocolVersion": "0.3.0"}),
                                   doc("x402", {"x402Version": 2, "version": "1.0"}),
                                   doc("mcp.json", {"version": "1.0"})]))
        self.assertEqual(v["state"], "CONSISTENT")
        self.assertEqual(sorted(c["value"] for c in v["other_versions"]), ["1.0", "1.0", "2", "9.9.9"])

    def test_restated_registry_version_is_the_same_namespace(self):
        v = C.compare_version(ctx(live(server_version="1.4.2"), [reg("1.4.2")],
                                  [doc("mcp.json", {"registry": {"name": "ex.svc/one", "version": "1.4.0"}})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        self.assertIn("1.4.0", [c["value"] for c in v["conflict"]])

    def test_v_prefix_is_not_a_difference(self):
        self.assertEqual(C.compare_version(ctx(live(server_version="v1.2.0"), [reg("1.2.0")]))["state"], "CONSISTENT")

    def test_single_and_none(self):
        self.assertEqual(C.compare_version(ctx(live(server_version="1.0"), []))["state"], "SINGLE_SURFACE")
        v = C.compare_version(ctx(live(server_version=None), []))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "NO_IMPLEMENTATION_VERSION_STATED"))


class Tools(unittest.TestCase):
    def test_declared_list_equal_to_live(self):
        v = C.compare_tools(ctx(docs=[doc("server-card", {"tools": [{"name": "b"}, {"name": "a"}]})]))
        self.assertEqual(v["state"], "CONSISTENT")

    def test_declared_list_differs(self):
        v = C.compare_tools(ctx(docs=[doc("server-card", {"tools": [{"name": "a"}, {"name": "c"}]})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        self.assertEqual((v["only_declared"], v["only_live"]), (["c"], ["b"]))

    def test_declared_count_differs(self):
        v = C.compare_tools(ctx(docs=[doc("mcp.json", {"measured": {"total_tools": 13}})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        self.assertIn("n=13", v["conflict"][0]["value"])

    def test_incomplete_live_list_is_uncheckable(self):
        v = C.compare_tools(ctx(live(tools_complete=False), docs=[doc("server-card", {"tools": ["a", "b"]})]))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "LIVE_TOOL_LIST_UNAVAILABLE"))

    def test_empty_and_dynamic_lists_are_not_compared(self):
        self.assertEqual(C.compare_tools(ctx(docs=[doc("server-card", {"tools": []})]))["state"], "SINGLE_SURFACE")
        self.assertEqual(C.compare_tools(ctx(docs=[doc("server-card", {"tools": "dynamic"})]))["state"], "SINGLE_SURFACE")

    def test_subset_and_per_item_lists_are_not_the_tool_list(self):
        v = C.compare_tools(ctx(docs=[doc("server-card", {"pricing": {"freeTier": {"tools": ["a"]}},
                                                          "toolsets": [{"name": "x", "tools": ["zz"]}]})]))
        self.assertEqual(v["state"], "SINGLE_SURFACE")

    def test_mcp_capabilities_object_is_not_a_list(self):
        self.assertEqual(C.compare_tools(ctx(docs=[doc("server-card", {"capabilities": {"tools": {"listChanged": True}}})]))["state"],
                         "SINGLE_SURFACE")


class Auth(unittest.TestCase):
    def test_declared_surfaces_disagree(self):
        # 0.1.2: two claims of the SAME kind (card vs card) are one scope and are compared directly
        v = C.compare_auth(ctx(docs=[doc("mcp.json", {"authentication": {"required": True}}),
                                     doc("server-card", {"authentication": {"required": False}})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        self.assertEqual(sorted(c["value"] for c in v["conflict"]), ["false", "true"])

    def test_declared_not_required_but_gated(self):
        v = C.compare_auth(ctx(live(state="AUTH_REQUIRED", http_status=401, tools_list_status=None),
                               docs=[doc("server-card", {"auth_required": False})]))
        self.assertEqual(v["state"], "INCONSISTENT")

    def test_declared_required_with_open_discovery_is_not_a_contradiction(self):
        v = C.compare_auth(ctx(registry=[reg(auth=[("remotes[].headers[Authorization].isRequired", True)])]))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "DECLARED_REQUIRED_SCOPE_UNSTATED"))

    def test_agreement_and_single(self):
        self.assertEqual(C.compare_auth(ctx(docs=[doc("server-card", {"authentication": {"required": False}})]))["state"], "CONSISTENT")
        self.assertEqual(C.compare_auth(ctx())["state"], "SINGLE_SURFACE")

    def test_per_tool_auth_flags_are_not_the_endpoint_boundary(self):
        v = C.compare_auth(ctx(docs=[doc("mcp.json", {"tools": [{"name": "a", "auth_required": True},
                                                                {"name": "b", "auth_required": False}]})]))
        self.assertEqual(v["state"], "SINGLE_SURFACE")

    def test_alternative_headers_and_same_surface_scopes(self):
        v = C.compare_auth(ctx(registry=[reg(auth=[("remotes[].headers[Authorization].isRequired", True),
                                                   ("remotes[].headers[X-API-Key].isRequired", False)])]))
        self.assertEqual(v["reason"], "DECLARED_REQUIRED_SCOPE_UNSTATED")
        v = C.compare_auth(ctx(docs=[doc("mcp.json", {"authentication": {"required": True},
                                                      "publicEndpoint": {"authentication": {"required": False}}})]))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "ONE_SURFACE_DECLARES_BOTH"))

    def test_402_is_payment_not_auth(self):
        v = C.compare_auth(ctx(live(state="AUTH_REQUIRED", http_status=402), docs=[doc("server-card", {"auth_required": False})]))
        self.assertEqual(v["state"], "UNCHECKABLE")

    def test_agent_card_security_is_another_interface(self):
        v = C.compare_auth(ctx(docs=[doc("agent-card", {"security": [{"bearer": []}], "authentication": {"required": True}})]))
        self.assertEqual(v["state"], "SINGLE_SURFACE")


class Payment(unittest.TestCase):
    def test_named_tool_missing_from_live(self):
        v = C.compare_payment(ctx(docs=[doc("x402", {"resources": [{"url": "https://svc.example/api/x"}],
                                                     "mcp": {"paid_tools": ["a", "zz"]}})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        self.assertEqual(v["missing_from_live"], ["zz"])

    def test_named_tools_present(self):
        v = C.compare_payment(ctx(docs=[doc("x402", {"resources": [], "mcp": {"paid_tools": ["a"], "free_tools": ["b"]}})]))
        self.assertEqual(v["state"], "CONSISTENT")

    def test_silence_is_not_a_statement(self):
        v = C.compare_payment(ctx())
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "NO_PAYMENT_SURFACE"))
        v = C.compare_payment(ctx(docs=[doc("x402", {"resources": [{"url": "https://other.example/x"}]})]))
        self.assertEqual(v["state"], "SINGLE_SURFACE")

    def test_registry_payment_header_only(self):
        v = C.compare_payment(ctx(registry=[reg(payment=[("remotes[].headers[Payment-Signature]", "payment header declared")])]))
        self.assertEqual(v["state"], "SINGLE_SURFACE")

    def test_resources_listed_as_url_strings_count(self):
        v = C.compare_payment(ctx(registry=[reg(payment=[("description", "prose mentions x402")])],
                                  docs=[doc("x402", {"resources": ["https://svc.example/api/a", "https://svc.example/api/b"]})]))
        self.assertEqual(v["state"], "CONSISTENT")
        v = C.compare_payment(ctx(registry=[reg(payment=[("description", "prose mentions x402")])],
                                  docs=[doc("x402", {"resources": []})]))
        self.assertEqual(v["state"], "INCONSISTENT")

    def test_endpoint_linked_manifest_with_mcp_statement(self):
        v = C.compare_payment(ctx(registry=[reg(payment=[("description", "prose mentions x402")])],
                                  docs=[doc("x402", {"resources": [{"resource": EP}]})]))
        self.assertEqual(v["state"], "CONSISTENT")


class Protocol(unittest.TestCase):
    def test_scalar_not_requested_is_uncheckable_not_a_contradiction(self):
        v = C.compare_protocol(ctx(docs=[doc("server-card", {"protocolVersion": "2025-06-18"})]))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "DECLARED_VERSION_NOT_REQUESTED"))

    def test_list_omitting_negotiated_is_inconsistent(self):
        v = C.compare_protocol(ctx(docs=[doc("server-card", {"protocolVersions": ["2025-03-26", "2025-06-18"]})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        self.assertEqual(v["conflict"][0]["value"], '["2025-03-26", "2025-06-18"]')

    def test_declares_requested_but_server_declined(self):
        v = C.compare_protocol(ctx(live(protocol_version="2025-06-18"), docs=[doc("mcp.json", {"mcp_version": "2025-11-25"})]))
        self.assertEqual(v["state"], "INCONSISTENT")

    def test_scalar_equal_negotiated(self):
        self.assertEqual(C.compare_protocol(ctx(docs=[doc("mcp.json", {"protocol_version": "2025-11-25"})]))["state"], "CONSISTENT")

    def test_list_contains_negotiated(self):
        v = C.compare_protocol(ctx(docs=[doc("mcp.json", {"protocolVersions": ["2025-06-18", "2025-11-25"]})]))
        self.assertEqual(v["state"], "CONSISTENT")

    def test_agent_card_protocol_is_a2a(self):
        self.assertEqual(C.compare_protocol(ctx(docs=[doc("agent-card", {"protocolVersion": "2025-01-01"})]))["state"], "SINGLE_SURFACE")

    def test_not_responded(self):
        v = C.compare_protocol(ctx(live(state="AUTH_REQUIRED")))
        self.assertEqual(v["state"], "UNCHECKABLE")


class Attribution(unittest.TestCase):
    class Store:
        def __init__(self, docs):
            self.docs = docs

        def get(self, url):
            d = self.docs.get(url)
            return ({"url": url, "state": "PRESENT", "sha256": "x"}, d) if d is not None else ({"url": url, "state": "ABSENT"}, None)

    def row(self, shared, registry=()):
        return {"endpoint": EP, "origin": "https://svc.example", "host": "svc.example", "shared_origin": shared,
                "registry": list(registry), "live": live(), "inclusion": "responded", "in_watch_list": False}

    def test_gateway_card_not_credited_to_tenant(self):
        st = self.Store({"https://svc.example/.well-known/mcp/server-card.json": {"serverInfo": {"version": "9"}}})
        c, surf, _ = C.surface_ctx(self.row(True), st, {"svc.example": {}})
        self.assertEqual(c["docs"], [])
        self.assertFalse(surf["server-card"][0]["attributed"])

    def test_card_naming_the_endpoint_is_credited(self):
        st = self.Store({"https://svc.example/.well-known/mcp/server-card.json": {"url": EP + "/", "serverInfo": {"version": "9"}}})
        c, _, _ = C.surface_ctx(self.row(True), st, {"svc.example": {}})
        self.assertEqual([d["surface"] for d in c["docs"]], ["server-card"])

    def test_doc_describing_a_sibling_endpoint_is_not_credited(self):
        body = {"url": "https://svc.example/other", "tools": ["x"], "trust": {"endpoint": EP}}
        st = self.Store({"https://svc.example/.well-known/mcp.json": body})
        r = self.row(True)
        r["origin_endpoints"] = [EP, "https://svc.example/other"]
        c, surf, _ = C.surface_ctx(r, st, {"svc.example": {}})
        self.assertEqual(c["docs"], [])
        r2 = dict(r, endpoint="https://svc.example/other")
        c2, _, _ = C.surface_ctx(r2, st, {"svc.example": {}})
        self.assertEqual([d["surface"] for d in c2["docs"]], ["mcp.json"])

    def test_single_server_origin_is_credited(self):
        st = self.Store({"https://svc.example/.well-known/mcp.json": {"version": "1"}})
        c, _, _ = C.surface_ctx(self.row(False), st, {"svc.example": {}})
        self.assertEqual([d["surface"] for d in c["docs"]], ["mcp.json"])

    def test_multi_server_manifest_is_narrowed(self):
        body = {"servers": [{"url": "https://svc.example/other", "tools": ["x"]}, {"url": EP, "tools": ["a", "b"]}]}
        scoped, note = C.scope_doc(body, EP)
        self.assertEqual(scoped["tools"], ["a", "b"])
        body = {"servers": [{"url": "https://svc.example/other", "tools": ["x"]}]}
        scoped, note = C.scope_doc(body, EP)
        self.assertNotIn("tools", scoped)

    def test_registry_declared_card_is_credited_even_on_shared_origin(self):
        e = {"id": "ex.svc/one", "version": "1", "auth": [], "payment": [], "pp": {},
             "declared_urls": [("server-card", "https://cards.example/one.json")]}
        st = self.Store({"https://cards.example/one.json": {"serverInfo": {"version": "1"}}})
        c, surf, _ = C.surface_ctx(self.row(True, [e]), st, {"svc.example": {}})
        self.assertEqual([d["url"] for d in c["docs"]], ["https://cards.example/one.json"])


class Correction011(unittest.TestCase):
    """Record 0.1.1. One fixture per row the 26 Sep notice-lane re-check showed 0.1 misread; shapes copied from the
    stored 25 Sep bytes (sha256 in each docstring, unchanged on the 26 Sep re-read)."""
    PUB = ["ic_donate", "ic_news_get", "ic_signal_search"]

    def test_immersivecommons_public_list_is_the_unauthenticated_contract(self):
        """mcp.json ec4372a0...: tools (249, full surface) + public_tools (22) == live unauthenticated tools/list (22), and
        a nested docs_mcp block {url: /api/mcp-docs, tools: [2]} describing the documentation endpoint; server-card
        f518e0f9...: tools (249). 0.1 compared the 249 (and the docs block's 2) exactly: INCONSISTENT."""
        lv = live(tool_names=self.PUB, n_tools=3, tool_names_sha256=C.names_sha(self.PUB))
        full = self.PUB + ["floor10_submit_highlight", "ic_admin_approve_highlight"]
        body = {"url": EP, "tools": full, "public_tools": self.PUB,
                "docs_mcp": {"url": "https://svc.example/api/mcp-docs", "transport": "streamable-http", "tools": ["search_docs", "get_doc"]}}
        st = Attribution.Store({"https://svc.example/.well-known/mcp.json": body,
                                "https://svc.example/.well-known/mcp/server-card.json": {"serverUrl": EP, "tools": [{"name": n} for n in full]}})
        row = {"endpoint": EP, "origin": "https://svc.example", "host": "svc.example", "shared_origin": False,
               "registry": [], "live": lv, "inclusion": "responded", "in_watch_list": False}
        c, surf, _ = C.surface_ctx(row, st, {"svc.example": {}})
        self.assertIn("docs_mcp", surf["mcp.json"][0]["attribution"])
        v = C.compare_tools(c)
        self.assertEqual(v["state"], "CONSISTENT")
        self.assertEqual(len(v["declared"]), 2)
        # the listing may also show EVERY tool (gated ones listed, refused at call time): still consistent
        lv_all = live(tool_names=full, n_tools=5, tool_names_sha256=C.names_sha(full))
        self.assertEqual(C.compare_tools(dict(c, live=lv_all))["state"], "CONSISTENT")
        # but the full list must contain every live tool
        bad = doc("mcp.json", {"tools": ["floor10_submit_highlight"], "public_tools": self.PUB})
        v2 = C.compare_tools(ctx(lv, docs=[bad]))
        self.assertEqual((v2["state"], v2["only_live"]), ("INCONSISTENT", sorted(self.PUB)))
        # a nested block on another host: removed when the document describes its own endpoint (a hosted demo) ...
        pr, paths = C.prune_other_endpoints({"url": EP, "tools": ["a"], "hosted_demo": {"mcp_endpoint": "https://demo.other/sse",
                                                                                      "transport": "sse", "tools_count": 7}}, EP)
        self.assertNotIn("hosted_demo", pr)
        # ... kept when it is the document's only description (it may be this server under another host name)
        pr, paths = C.prune_other_endpoints({"name": "x", "mcp_server": {"endpoint": "https://custom.other/mcp", "tools": ["a"]}}, EP)
        self.assertIn("mcp_server", pr)
        # a public list alone is recorded, not compared
        self.assertEqual(C.compare_tools(ctx(lv_all, docs=[doc("mcp.json", {"publicTools": self.PUB})]))["state"], "SINGLE_SURFACE")
        # without a public-scoped list the 0.1 rule is unchanged: a full list != live is a contradiction
        self.assertEqual(C.compare_tools(ctx(lv, docs=[doc("mcp.json", {"tools": full})]))["state"], "INCONSISTENT")

    def test_augenix_document_naming_another_endpoint_is_not_credited(self):
        """app.augenix.ai/.well-known/mcp.json 5b61c70b...: mcp_endpoint https://app.augenix.ai/api/mcp, server
        augenix-admin, 12 admin tools; the probed (and registry) endpoint is /api/mcp/public. 0.1 credited it because
        the origin serves one server in the frame, and compared its 12 tools with the public endpoint's 3."""
        ep = "https://svc.example/api/mcp/public"
        body = {"mcp_endpoint": "https://svc.example/api/mcp", "server": {"name": "svc-admin", "version": "1.4.0-admin"},
                "authentication": {"type": "oauth2", "scopes": ["admin"]}, "tools": ["list_tasks", "add_task"]}
        st = Attribution.Store({"https://svc.example/.well-known/mcp.json": body})
        row = {"endpoint": ep, "origin": "https://svc.example", "host": "svc.example", "shared_origin": False,
               "registry": [], "live": live(), "inclusion": "responded", "in_watch_list": False}
        c, surf, _ = C.surface_ctx(row, st, {"svc.example": {}})
        self.assertEqual(c["docs"], [])
        self.assertFalse(surf["mcp.json"][0]["attributed"])
        self.assertIn("describes another MCP endpoint on this origin", surf["mcp.json"][0]["attribution"])
        self.assertEqual(C.compare_tools(c)["state"], "SINGLE_SURFACE")
        # the same document IS credited to the endpoint it names, and to another transport path of that server
        for named in ("https://svc.example/api/mcp", "https://svc.example/api/sse", "https://svc.example/mcp/v1"):
            c2, _, _ = C.surface_ctx(dict(row, endpoint=named), st, {"svc.example": {}})
            self.assertEqual([d["surface"] for d in c2["docs"]], ["mcp.json"], named)
        # a document naming the endpoint on ANOTHER host (www/apex, custom domain) is not a second endpoint of this origin
        st3 = Attribution.Store({"https://svc.example/.well-known/mcp.json": dict(body, mcp_endpoint="https://www.svc.example/x/mcp")})
        c3, _, _ = C.surface_ctx(row, st3, {"svc.example": {}})
        self.assertEqual([d["surface"] for d in c3["docs"]], ["mcp.json"])
        # nor is a document that also names this endpoint, nor an x402 manifest's resource "endpoint"s
        st4 = Attribution.Store({"https://svc.example/.well-known/mcp.json": dict(body, links={"public": ep}),
                                 "https://svc.example/.well-known/x402.json": {"resources": [{"endpoint": "https://svc.example/api/pay"}]}})
        c4, _, _ = C.surface_ctx(row, st4, {"svc.example": {}})
        self.assertEqual(sorted(d["surface"] for d in c4["docs"]), ["mcp.json", "x402"])

    def test_klarix_optional_header_vs_card_requirement_is_not_a_contradiction(self):
        """registry ai.klarix/intelligence: Authorization header, isRequired absent (= false), description "Optional.
        Listing tools works without a key; running one needs a paid key"; mcp.json and server-card d948d4b9...:
        authentication.required true; discovery answered without credentials. 0.1: INCONSISTENT."""
        r = reg(auth=[("remotes[].headers[Authorization].isRequired", False)])
        cards = [doc("mcp.json", {"authentication": {"required": True, "schemes": ["bearer"]}}),
                 doc("server-card", {"authentication": {"required": True, "schemes": ["bearer"]}})]
        v = C.compare_auth(ctx(registry=[r], docs=cards))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "DECLARED_SCOPES_DIFFER"))
        # an optional header while discovery itself is refused IS a contradiction (same scope: connecting)
        g = C.compare_auth(ctx(live(state="AUTH_REQUIRED", http_status=401, tools_list_status=None), registry=[r], docs=cards))
        self.assertEqual(g["state"], "INCONSISTENT")
        self.assertEqual(g["conflict"][1]["surface"], "observed discovery boundary")

    def test_transloadit_token_from_a_tool_vs_card_requirement(self):
        """registry io.github.transloadit/mcp-server: Authorization header "obtained via the authenticate tool",
        isRequired absent; server-card a0b7fa81...: authentication.required true; discovery open. 0.1: INCONSISTENT."""
        v = C.compare_auth(ctx(registry=[reg(auth=[("remotes[].headers[Authorization].isRequired", False)])],
                               docs=[doc("server-card", {"authentication": {"required": True, "schemes": ["bearer"]}})]))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "DECLARED_SCOPES_DIFFER"))
        # 0.1.2 (D3-SYM): the mirror pair (header required, card not required) is also of different scope; see Correction012

    def test_toolforte_count_with_a_dispatcher_is_not_compared(self):
        """toolforte.com/.well-known/mcp.json 7fc40fc2...: toolCount 180, resources [toolforte://tools]; live tools/list
        14 names incl. search_tools, describe_tool, run_tool. 0.1: INCONSISTENT (n=180 vs n=14)."""
        names = ["calculate_vat", "describe_tool", "run_tool", "search_tools", "validate_iban"]
        lv = live(tool_names=names, n_tools=5, tool_names_sha256=C.names_sha(names))
        v = C.compare_tools(ctx(lv, docs=[doc("mcp.json", {"toolCount": 180, "resources": ["svc://tools"]})]))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "DECLARED_COUNT_SCOPE_UNSTATED"))
        self.assertEqual(v["live_dispatcher_tools"], ["run_tool"])
        # a count BELOW the live count is still a contradiction, dispatcher or not
        self.assertEqual(C.compare_tools(ctx(lv, docs=[doc("mcp.json", {"toolCount": 3})]))["state"], "INCONSISTENT")
        # a name list is still compared exactly
        self.assertEqual(C.compare_tools(ctx(lv, docs=[doc("mcp.json", {"toolCount": 180, "tools": names})]))["state"], "CONSISTENT")
        self.assertEqual(C.compare_tools(ctx(lv, docs=[doc("mcp.json", {"tools": names[:2]})]))["state"], "INCONSISTENT")


class Correction012(unittest.TestCase):
    """Record 0.1.2. Three rules a maintainer-persona audit (26 Sep 2026) found wrong in 0.1.1; shapes copied from the
    stored 25 Sep bytes (fetch.sqlite sha256 b3fded9a..., unchanged)."""
    HDR_T = ("remotes[].headers[Authorization].isRequired", True)

    def test_html2img_header_required_vs_card_not_required_is_symmetric_d3(self):
        """registry com.html2img/html-to-image: Authorization isRequired true; server-card 502d3b54...:
        authentication.required false; initialize + tools/list answered without credentials. 0.1.1: INCONSISTENT."""
        r = reg(auth=[self.HDR_T])
        card = [doc("server-card", {"authentication": {"required": False}})]
        v = C.compare_auth(ctx(registry=[r], docs=card))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "DECLARED_SCOPES_DIFFER"))
        self.assertIn("header required", v["detail"])
        # the "not required" side IS contradicted when discovery itself was refused without credentials
        g = C.compare_auth(ctx(live(state="AUTH_REQUIRED", http_status=401, tools_list_status=None), registry=[r], docs=card))
        self.assertEqual(g["state"], "INCONSISTENT")
        self.assertEqual([c["surface"] for c in g["conflict"]][1], "observed discovery boundary")
        self.assertEqual(g["conflict"][0]["value"], "false")
        # same kind, different surfaces: still compared directly
        cc = C.compare_auth(ctx(registry=[r], docs=card + [doc("mcp.json", {"auth_required": True})]))
        self.assertEqual(cc["state"], "INCONSISTENT")

    def test_zensched_card_lists_more_tools_than_open_listing_under_declared_auth(self):
        """server-card 31a94f74...: tools n=74, authentication.required true; registry com.zensched/zensched Authorization
        isRequired true; live credential-free tools/list n=11, every one of them in the card. 0.1.1: INCONSISTENT."""
        pub = ["availability_get", "booking_create", "service_list"]
        full = pub + ["account_close", "account_export", "account_get"]
        lv = live(tool_names=pub, n_tools=3, tool_names_sha256=C.names_sha(pub))
        card = {"tools": [{"name": n} for n in full], "authentication": {"required": True}}
        v = C.compare_tools(ctx(lv, registry=[reg(auth=[self.HDR_T])], docs=[doc("server-card", card)]))
        self.assertEqual((v["state"], v["reason"]), ("UNCHECKABLE", "SUBSET_UNDER_AUTH"))
        self.assertTrue(v["declared_required"])
        # the declared-required claim may come from the card alone
        v = C.compare_tools(ctx(lv, docs=[doc("server-card", card)]))
        self.assertEqual(v["reason"], "SUBSET_UNDER_AUTH")
        # a count above live under declared auth: same reading
        v = C.compare_tools(ctx(lv, docs=[doc("server-card", {"toolCount": 74, "authentication": {"required": True}})]))
        self.assertEqual(v["reason"], "SUBSET_UNDER_AUTH")
        # counter-cases that stay INCONSISTENT: no auth declared ...
        noauth = {"tools": [{"name": n} for n in full]}
        self.assertEqual(C.compare_tools(ctx(lv, docs=[doc("server-card", noauth)]))["state"], "INCONSISTENT")
        # ... auth explicitly NOT required ...
        self.assertEqual(C.compare_tools(ctx(lv, docs=[doc("server-card", dict(noauth, authentication={"required": False}))]))["state"],
                         "INCONSISTENT")
        # ... the live list holds a tool the card lacks ...
        lv2 = live(tool_names=pub + ["zz_new"], n_tools=4, tool_names_sha256=C.names_sha(pub + ["zz_new"]))
        v = C.compare_tools(ctx(lv2, docs=[doc("server-card", card)]))
        self.assertEqual((v["state"], v["only_live"]), ("INCONSISTENT", ["zz_new"]))
        # ... a count below live
        v = C.compare_tools(ctx(lv, docs=[doc("server-card", {"toolCount": 2, "authentication": {"required": True}})]))
        self.assertEqual(v["state"], "INCONSISTENT")
        # an equal list under auth stays CONSISTENT
        v = C.compare_tools(ctx(lv, docs=[doc("server-card", {"tools": pub, "authentication": {"required": True}})]))
        self.assertEqual(v["state"], "CONSISTENT")

    class RecStore:
        def __init__(self, recs):
            self.recs = recs

        def get(self, url):
            r = self.recs.get(url)
            if r is None:
                return {"url": url, "state": "ABSENT", "http_status": 404}, None
            return r

    def _row(self):
        return {"endpoint": EP, "origin": "https://svc.example", "host": "svc.example", "shared_origin": False,
                "registry": [{"id": "ex.svc/one", "version": "1.0.0", "auth": [], "payment": [], "pp": {}, "declared_urls": []}],
                "live": live(), "inclusion": "responded", "in_watch_list": False}

    def test_dead_surface_is_not_silence(self):
        """25 Sep: 251 rows had a surface that was ERROR / TIMEOUT / RATE_LIMITED / UNREACHABLE / NOT_FETCHED (104 reads
        'origin failed earlier: HTTP 429: stopped for this run'); 244 of them carried SINGLE_SURFACE. 0.1.1: SINGLE_SURFACE."""
        W = "https://svc.example/.well-known/"
        st = self.RecStore({W + "mcp.json": ({"url": W + "mcp.json", "state": "RATE_LIMITED", "reason": "HTTP 429", "http_status": 429}, None),
                            W + "mcp/server-card.json": ({"url": W + "mcp/server-card.json", "state": "NOT_FETCHED",
                                                          "reason": "origin failed earlier: HTTP 429: stopped for this run"}, None)})
        c, surf, _ = C.surface_ctx(self._row(), st, {"svc.example": {}})
        dims = C.compare_all(c)
        for d in ("TOOLS", "AUTH", "PROTOCOL"):
            self.assertEqual((dims[d]["state"], dims[d].get("reason")), ("UNCHECKABLE", "SURFACE_UNREAD"), d)
        # a verdict that is already UNCHECKABLE keeps its reason (only SINGLE_SURFACE claims silence)
        self.assertEqual(dims["PAYMENT"]["reason"], "NO_PAYMENT_SURFACE")
        self.assertEqual({u["state"] for u in dims["TOOLS"]["unread"]}, {"RATE_LIMITED", "NOT_FETCHED"})
        # an INCONSISTENT or CONSISTENT verdict is not touched (two surfaces did speak); VERSION here is CONSISTENT
        self.assertEqual(dims["VERSION"]["state"], "CONSISTENT")
        # every other dead state counts; a 2xx without JSON (HTTP 204) is an answer, i.e. silence
        for stt, hs in (("ERROR", 500), ("TIMEOUT", None), ("UNREACHABLE", None)):
            st2 = self.RecStore({W + "mcp.json": ({"url": W + "mcp.json", "state": stt, "http_status": hs}, None)})
            c2, _, _ = C.surface_ctx(self._row(), st2, {"svc.example": {}})
            self.assertEqual(C.compare_all(c2)["TOOLS"]["reason"], "SURFACE_UNREAD", stt)
        st3 = self.RecStore({W + "mcp.json": ({"url": W + "mcp.json", "state": "ERROR", "http_status": 204, "reason": "HTTP 204"}, None)})
        c3, _, _ = C.surface_ctx(self._row(), st3, {"svc.example": {}})
        self.assertEqual(C.compare_all(c3)["TOOLS"]["state"], "SINGLE_SURFACE")
        # an agent-card that did not answer speaks to no MCP dimension: unchanged
        st4 = self.RecStore({W + "agent-card.json": ({"url": W + "agent-card.json", "state": "TIMEOUT"}, None)})
        c4, _, _ = C.surface_ctx(self._row(), st4, {"svc.example": {}})
        self.assertEqual(C.compare_all(c4)["TOOLS"]["state"], "SINGLE_SURFACE")
        # an x402 manifest that did not answer makes PAYMENT (only) unread
        st5 = self.RecStore({W + "x402.json": ({"url": W + "x402.json", "state": "TIMEOUT"}, None),
                             W + "mcp.json": ({"url": W + "mcp.json", "state": "PRESENT", "sha256": "x"}, {"x402": {"enabled": True}})})
        c5, _, _ = C.surface_ctx(self._row(), st5, {"svc.example": {}})
        d5 = C.compare_all(c5)
        self.assertEqual((d5["PAYMENT"]["state"], d5["PAYMENT"]["reason"]), ("UNCHECKABLE", "SURFACE_UNREAD"))
        self.assertEqual(d5["TOOLS"]["state"], "SINGLE_SURFACE")

    def test_read_state_is_not_exhausted_when_reads_were_rate_limited(self):
        import gzip, sqlite3, types
        tmp = Path(tempfile.mkdtemp())
        rows = [dict(self._row(), endpoint=f"https://h{i}.example/mcp", origin=f"https://h{i}.example", host=f"h{i}.example")
                for i in range(2)]
        with gzip.open(tmp / "plan.jsonl.gz", "wt") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        st = C.Store(str(tmp / "fetch.sqlite"))
        for r in rows:
            st.host_done(r["host"], {"requests": 5})
            for sname, path in C.WELL_KNOWN:
                st.put(r["origin"] + path, r["host"], sname, {"url": r["origin"] + path, "state": "ABSENT", "http_status": 404})
        st.put("https://h1.example/.well-known/mcp.json", "h1.example", "mcp.json",
               {"url": "https://h1.example/.well-known/mcp.json", "state": "RATE_LIMITED", "reason": "HTTP 429", "http_status": 429})
        st.close()
        a = types.SimpleNamespace(collect_dir=str(tmp), plan_dir=str(tmp), hold=None, out=str(tmp / "cmp"))
        C.compare(a)
        summ = json.loads((tmp / "cmp" / "summary.json").read_text())
        self.assertEqual((summ["n_attempted"], summ["n_planned"]), (2, 2))
        self.assertEqual(summ["read_state"], "PARTIAL")
        self.assertEqual(summ["read_gaps"]["endpoints_with_an_unread_surface"], 1)
        self.assertEqual(summ["read_gaps"]["endpoints_with_a_429_stop"], 1)


class Exclusions(unittest.TestCase):
    """An operator's objection / opt-out: a named endpoint or host is skipped by the next run before any request."""
    def _file(self, entries):
        f = Path(tempfile.mkdtemp()) / "probe-exclusions.json"
        f.write_text(json.dumps({"schema": "csoai.probe-exclusions/0.1", "entries": entries}))
        return str(f)

    def test_named_endpoint_and_host_are_never_probed(self):
        ex = C.P.load_exclusions(self._file([{"id": "obj-1", "match": "endpoint", "value": "https://a.example/mcp/"},
                                             {"id": "obj-2", "match": "host", "value": "B.example"}]))
        self.assertEqual(C.P.excluded("https://a.example/mcp", ex), "obj-1")
        self.assertIsNone(C.P.excluded("https://a.example/other", ex))
        self.assertEqual(C.P.excluded("https://api.b.example/x", ex), "obj-2")
        self.assertIsNone(C.P.excluded("https://notb.example/x", ex))
        # the probe's scheduler skips the row and records it by name; the other row is probed
        rows = [{"rank": 1, "endpoint": "https://a.example/mcp"}, {"rank": 2, "endpoint": "https://c.example/mcp"}]
        r = C.P.Runner(rows, tempfile.mkdtemp(), {"min_interval": 0.0, "budget_s": 5}, exclusions=ex)
        nxt = r._next()
        self.assertEqual(nxt[0]["endpoint"], "https://c.example/mcp")
        self.assertEqual([x["endpoint"] for x in r.skipped], ["https://a.example/mcp"])
        self.assertIn("obj-1", r.skipped[0]["not_attempted"])
        # contract parity never queues a surface of an excluded endpoint or host
        prow = lambda h: {"endpoint": f"https://{h}/mcp", "origin": f"https://{h}", "host": h,
                          "registry": [{"declared_urls": [("server-card", "https://cdn.b.example/card.json")]}]}
        tasks = C.host_tasks([prow("a.example"), prow("c.example")], ex)
        self.assertEqual(sorted(tasks), ["c.example"])
        # fail closed: a malformed file stops the run
        with self.assertRaises(ValueError):
            C.P.load_exclusions(self._file([{"match": "everything", "value": "x"}]))
        # the committed file loads
        self.assertIsInstance(C.P.load_exclusions(), list)


# ------------------------------------------------------------------ network fixture (127.0.0.1)
class Fixture(BaseHTTPRequestHandler):
    log = []
    routes = {}

    def log_message(self, *a):
        pass

    def _any(self):
        port = self.server.server_address[1]
        Fixture.log.append((self.command, port, self.path, time.monotonic()))
        r = Fixture.routes.get((port, self.path))
        if self.command != "GET":
            self.send_response(405)
            self.end_headers()
            return
        if r is None:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        code, ctype, body, extra = r
        b = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(b)

    do_GET = do_POST = do_DELETE = _any


class Network(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srvs = [ThreadingHTTPServer(("127.0.0.1", 0), Fixture) for _ in range(2)]
        for s in cls.srvs:
            threading.Thread(target=s.serve_forever, daemon=True).start()
        p1, p2 = (s.server_address[1] for s in cls.srvs)
        cls.p1, cls.p2 = p1, p2
        J = "application/json"
        Fixture.routes = {
            (p1, "/robots.txt"): (200, "text/plain", b"User-agent: *\nDisallow: /.well-known/x402.json\n", None),
            (p1, "/.well-known/mcp.json"): (200, J, {"serverInfo": {"version": "1.0.0"}, "health": "/health"}, None),
            (p1, "/.well-known/mcp/server-card.json"): (200, J, {"serverInfo": {"version": "1.0.0"}, "tools": ["a"]}, None),
            (p1, "/.well-known/agent-card.json"): (200, "text/html", b"<html>spa</html>", None),
            (p1, "/.well-known/x402.json"): (200, J, {"resources": []}, None),
            (p1, "/health"): (200, J, {"status": "ok", "version": "0.1.0"}, None),
            (p1, "/version"): (200, J, {"version": "0.0.1"}, None),
            (p2, "/.well-known/mcp.json"): (301, J, b"", {"Location": f"http://localhost:{p2}/elsewhere.json"}),
            (p2, "/.well-known/mcp/server-card.json"): (302, J, b"", {"Location": "/card2.json"}),
            (p2, "/card2.json"): (200, J, {"serverInfo": {"version": "2"}}, None),
            (p2, "/health"): (200, J, {"version": "undocumented"}, None),
        }

    @classmethod
    def tearDownClass(cls):
        for s in cls.srvs:
            s.shutdown()

    def run_hosts(self, min_interval=0.2):
        Fixture.log = []
        rows = [{"endpoint": f"http://127.0.0.1:{p}/mcp", "origin": f"http://127.0.0.1:{p}", "host": "127.0.0.1",
                 "registry": []} for p in (self.p1, self.p2)]
        tasks = C.host_tasks(rows)
        starts = self.starts = []

        class Gate(C.P.HostGate):
            def pace(self, host):
                super().pace(host)
                starts.append(time.monotonic())
        gate = Gate(min_interval)
        cfg = {"connect_timeout": 3, "read_timeout": 3, "min_interval": min_interval}
        tmp = tempfile.mkdtemp()
        st = C.Store(os.path.join(tmp, "f.sqlite"))
        for h, o in tasks.items():
            C.run_host(h, o, gate, cfg, st)
        return st

    def test_get_only_robots_documented_health_redirects_and_pacing(self):
        st = self.run_hosts()
        self.assertTrue(Fixture.log)
        self.assertEqual({m for m, *_ in Fixture.log}, {"GET"}, "only GET is ever sent")
        paths1 = [p for m, port, p, _ in Fixture.log if port == self.p1]
        paths2 = [p for m, port, p, _ in Fixture.log if port == self.p2]
        self.assertNotIn("/.well-known/x402.json", paths1, "robots.txt disallow honoured")
        self.assertEqual(st.get(f"http://127.0.0.1:{self.p1}/.well-known/x402.json")[0]["state"], "ROBOTS_DISALLOWED")
        self.assertIn("/health", paths1, "documented health is fetched")
        self.assertNotIn("/version", paths1, "undocumented version is never requested")
        self.assertNotIn("/health", paths2, "undocumented health is never requested")
        self.assertEqual(st.get(f"http://127.0.0.1:{self.p1}/.well-known/agent-card.json")[0]["state"], "NOT_JSON")
        self.assertEqual(st.get(f"http://127.0.0.1:{self.p2}/.well-known/mcp.json")[0]["state"], "REDIRECT_NOT_FOLLOWED")
        r, d = st.get(f"http://127.0.0.1:{self.p2}/.well-known/mcp/server-card.json")
        self.assertEqual((r["state"], d), ("PRESENT", {"serverInfo": {"version": "2"}}))
        self.assertEqual(len(self.starts), len(Fixture.log), "every request passed the per-host gate")
        gaps = [b - a for a, b in zip(self.starts, self.starts[1:])]
        self.assertGreaterEqual(min(gaps), 0.195, "request starts to one host are >= the minimum interval apart")


def self_test():
    loader = unittest.defaultTestLoader
    cases = [v for v in globals().values() if isinstance(v, type) and issubclass(v, unittest.TestCase)]

    def suite_result():
        s = unittest.TestSuite(loader.loadTestsFromTestCase(c) for c in cases)
        with open(os.devnull, "w") as devnull:
            r = unittest.TextTestRunner(verbosity=0, stream=devnull).run(s)
        return r.testsRun, len(r.failures) + len(r.errors)

    n, bad = suite_result()
    print(f"suite: {n} tests, {bad} failed")
    if bad:
        return 1
    ok = True
    orig_v, orig_m, orig_a = C.COMPARATORS["VERSION"], C.mentions, C.compare_auth
    orig_pk, orig_de, orig_dr, orig_pr = C.PUBLIC_TOOL_KEYS, C.declared_endpoints, C.DISPATCH_RE, C.prune_other_endpoints
    orig_ad, orig_ur, orig_iu = C._auth_decl, C.UNREAD_STATES, C.is_unread
    orig_ex = C.P.excluded

    def broken_version(ctx_):  # adjudicates every version string, whatever it versions
        vals = [c for c in orig_v(ctx_).get("claims") or []] + (orig_v(ctx_).get("other_versions") or [])
        if len({C.normv(c["value"]) for c in vals}) > 1:
            return C.verdict("INCONSISTENT", conflict=vals[:2])
        return orig_v(ctx_)

    def broken_auth(ctx_):
        v = orig_a(ctx_)
        return C.verdict("INCONSISTENT", conflict=[{"surface": "x", "path": "y", "value": "z"}]) if v.get("reason") == "DECLARED_REQUIRED_SCOPE_UNSTATED" else v

    def auth_0_1(ctx_):  # the 0.1 rule: an optional registry header vs a card requirement is a contradiction
        v = orig_a(ctx_)
        return C.verdict("INCONSISTENT", conflict=[{"surface": "x", "path": "y", "value": "z"}]) if v.get("reason") == "DECLARED_SCOPES_DIFFER" else v

    def auth_0_1_1(ctx_):  # the 0.1.1 rule: header required vs card not required is a contradiction (asymmetric D3)
        v = orig_a(ctx_)
        if v.get("reason") == "DECLARED_SCOPES_DIFFER" and "header required" in (v.get("detail") or ""):
            return C.verdict("INCONSISTENT", conflict=[{"surface": "x", "path": "y", "value": "z"}])
        return v

    def tools_no_auth_subset(ctx_):  # the 0.1.1 rule: the tools comparator does not see declared auth
        saved = C._auth_decl
        C._auth_decl = lambda c: []
        try:
            return orig_t(ctx_)
        finally:
            C._auth_decl = saved
    orig_t = C.compare_tools

    controls = [("version across undeclared namespaces", lambda: (C.COMPARATORS.__setitem__("VERSION", broken_version),
                                                                  setattr(C, "compare_version", broken_version))),
                ("gateway card credited to every tenant", lambda: setattr(C, "mentions", lambda d, e: True)),
                ("declared-required + open discovery called a contradiction", lambda: setattr(C, "compare_auth", broken_auth)),
                # 0.1.1: each 0.1 misread, restored, must fail the suite
                ("0.1 full tool list compared exactly despite a public-scoped list", lambda: setattr(C, "PUBLIC_TOOL_KEYS", set())),
                ("0.1 origin document credited though it names another endpoint", lambda: setattr(C, "declared_endpoints", lambda d, b: set())),
                ("0.1 nested block describing another endpoint read as this one", lambda: setattr(C, "prune_other_endpoints", lambda d, e: (d, []))),
                ("0.1 optional registry header vs card requirement called a contradiction", lambda: setattr(C, "compare_auth", auth_0_1)),
                ("0.1 bare count compared despite a live dispatcher tool", lambda: setattr(C, "DISPATCH_RE", __import__("re").compile(r"(?!x)x"))),
                # 0.1.2: each 0.1.1 rule, restored, must fail the suite
                ("0.1.1 asymmetric D3: header required vs card not required called a contradiction",
                 lambda: setattr(C, "compare_auth", auth_0_1_1)),
                ("0.1.1 D1 without a public list: card superset under declared auth called a contradiction",
                 lambda: setattr(C, "compare_tools", tools_no_auth_subset)),
                ("0.1.1 dead surface counted as silence (SINGLE_SURFACE)", lambda: setattr(C, "UNREAD_STATES", ())),
                ("0.1.1 read_state from attempts only (EXHAUSTED despite HTTP 429)", lambda: setattr(C, "is_unread", lambda e: False)),
                ("exclusion list ignored (an objector probed again)", lambda: setattr(C.P, "excluded", lambda u, e: None))]
    for name, patch in controls:
        patch()
        try:
            n2, bad2 = suite_result()
        finally:
            C.COMPARATORS["VERSION"] = orig_v
            C.compare_version = orig_v
            C.mentions = orig_m
            C.compare_auth = orig_a
            C.PUBLIC_TOOL_KEYS, C.declared_endpoints, C.DISPATCH_RE, C.prune_other_endpoints = orig_pk, orig_de, orig_dr, orig_pr
            C._auth_decl, C.UNREAD_STATES, C.is_unread, C.compare_tools = orig_ad, orig_ur, orig_iu, orig_t
            C.P.excluded = orig_ex
        held = bad2 > 0
        ok &= held
        print(f"control [{name}]: {bad2} failed -> {'holds (suite rejects it)' if held else 'CONTROL FAILED (suite passes a broken rule)'}")
    return 0 if ok else 2


if __name__ == "__main__":
    unittest.main()
