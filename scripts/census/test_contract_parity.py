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
        v = C.compare_auth(ctx(registry=[reg(auth=[("remotes[].headers[Authorization].isRequired", True)])],
                               docs=[doc("server-card", {"authentication": {"required": False}})]))
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

    def broken_version(ctx_):  # adjudicates every version string, whatever it versions
        vals = [c for c in orig_v(ctx_).get("claims") or []] + (orig_v(ctx_).get("other_versions") or [])
        if len({C.normv(c["value"]) for c in vals}) > 1:
            return C.verdict("INCONSISTENT", conflict=vals[:2])
        return orig_v(ctx_)

    def broken_auth(ctx_):
        v = orig_a(ctx_)
        return C.verdict("INCONSISTENT", conflict=[{"surface": "x", "path": "y", "value": "z"}]) if v.get("reason") == "DECLARED_REQUIRED_SCOPE_UNSTATED" else v

    controls = [("version across undeclared namespaces", lambda: (C.COMPARATORS.__setitem__("VERSION", broken_version),
                                                                  setattr(C, "compare_version", broken_version))),
                ("gateway card credited to every tenant", lambda: setattr(C, "mentions", lambda d, e: True)),
                ("declared-required + open discovery called a contradiction", lambda: setattr(C, "compare_auth", broken_auth))]
    for name, patch in controls:
        patch()
        try:
            n2, bad2 = suite_result()
        finally:
            C.COMPARATORS["VERSION"] = orig_v
            C.compare_version = orig_v
            C.mentions = orig_m
            C.compare_auth = orig_a
        held = bad2 > 0
        ok &= held
        print(f"control [{name}]: {bad2} failed -> {'holds (suite rejects it)' if held else 'CONTROL FAILED (suite passes a broken rule)'}")
    return 0 if ok else 2


if __name__ == "__main__":
    unittest.main()
