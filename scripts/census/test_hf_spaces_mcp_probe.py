#!/usr/bin/env python3
"""Offline tests for hf-spaces-mcp-probe.py. A fake Hub API and fake Spaces on 127.0.0.1; no internet.

The property that matters most: a Space whose stage is not RUNNING is never sent a single request,
including when the listing said RUNNING and the fresh /api/spaces/<id> read says otherwise. A
control run with the stage check removed MUST contact the sleeping Space, so the suite is not vacuous.

Run: python3 -m unittest scripts/census/test_hf_spaces_mcp_probe.py -v
"""
from __future__ import annotations

import gzip
import importlib.util
import json
import os
import re
import tempfile
import threading
import unittest
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
_SPEC = importlib.util.spec_from_file_location("hf_spaces_mcp_probe", HERE / "hf-spaces-mcp-probe.py")
H = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(H)

LOCAL_HOST_RE = re.compile(r"^http://127\.0\.0\.1:\d+$")
CFG = {"min_interval": 0.01, "workers": 3, "connect_timeout": 1.0, "read_timeout": 1.0, "budget_s": 60}


class Srv:
    """A 127.0.0.1 server whose handler is a function (handler_self, method) -> None; records requests."""

    def __init__(self, fn):
        reqs, lock = [], threading.Lock()

        class Hd(BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.1"

            def log_message(self, *a):
                pass

            def _any(self, method):
                with lock:
                    reqs.append((method, self.path))
                n = int(self.headers.get("Content-Length") or 0)
                self.body = json.loads(self.rfile.read(n) or b"{}") if n else {}
                fn(self, method)

            def do_GET(self):
                self._any("GET")

            def do_POST(self):
                self._any("POST")

            def do_DELETE(self):
                self._any("DELETE")

        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), Hd)
        self.httpd.daemon_threads = True
        self.httpd.handle_error = lambda *a: None
        self.reqs = reqs
        self.base = f"http://127.0.0.1:{self.httpd.server_address[1]}"
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()


def send(h, code, body=b"", ctype="application/json", headers=None):
    if isinstance(body, (dict, list)):
        body = json.dumps(body).encode()
    h.send_response(code)
    h.send_header("Content-Type", ctype)
    h.send_header("Content-Length", str(len(body)))
    for k, v in (headers or {}).items():
        h.send_header(k, v)
    h.end_headers()
    h.wfile.write(body)


TOOLS = [{"name": "generate_image", "inputSchema": {"type": "object", "properties": {"prompt": {}}}},
         {"name": "upscale", "inputSchema": {"type": "object", "properties": {"image": {}}}}]


def gradio_new(h, method):
    """Gradio >= 5.3x: streamable HTTP at /gradio_api/mcp/, answers with an SSE body."""
    if h.path == "/robots.txt":
        return send(h, 200, b"User-agent: *\nDisallow:\n", "text/plain")
    if h.path == "/gradio_api/mcp/" and method == "POST":
        m = h.body.get("method")
        if m == "initialize":
            res = {"protocolVersion": "2025-11-25", "capabilities": {"tools": {}},
                   "serverInfo": {"name": "fixture-space", "version": "1.30.0"}}
        elif m == "tools/list":
            res = {"tools": TOOLS}
        else:
            return send(h, 202)
        data = json.dumps({"jsonrpc": "2.0", "id": h.body.get("id"), "result": res})
        return send(h, 200, f"event: message\ndata: {data}\n\n".encode(), "text/event-stream")
    return send(h, 404, {"detail": "Not Found"})


def gradio_old(h, method):
    """Gradio 5.28-era: only the legacy SSE endpoint."""
    if h.path == "/robots.txt":
        return send(h, 404, b"", "text/plain")
    if h.path == "/gradio_api/mcp/sse" and method == "GET":
        return send(h, 200, b"event: endpoint\ndata: /gradio_api/mcp/messages/?session_id=abc\n\n", "text/event-stream")
    return send(h, 404, {"detail": "Not Found"})


def any_answer(h, method):
    return gradio_new(h, method)


def space(stage, sdk="gradio", base=None, likes=0):
    d = {"runtime": {"stage": stage, "hardware": {"current": "cpu-basic" if stage == "RUNNING" else None,
                                                   "requested": "cpu-basic"}},
         "sdk": sdk, "likes": likes, "private": False}
    if base:
        d["host"] = base
        d["subdomain"] = "never-used-when-host-given"
    return d


class World:
    """Fake Hub + one server per Space. listing: what the list walk says; fresh: what /api/spaces/<id> says."""

    def __init__(self):
        self.spaces = {sid: Srv(fn) for sid, fn in [
            ("u/sleeping", any_answer), ("u/paused", any_answer), ("u/builderr", any_answer),
            ("u/fell-asleep", any_answer), ("u/running", gradio_new), ("u/docker", any_answer),
            ("u/oldgradio", gradio_old), ("u/gone", any_answer), ("u/late", any_answer),
            ("u/tiny", any_answer)]}
        b = {sid: s.base for sid, s in self.spaces.items()}
        self.listing = {
            "u/sleeping": space("SLEEPING", base=b["u/sleeping"], likes=100),
            "u/paused": space("PAUSED", base=b["u/paused"], likes=90),
            "u/builderr": space("BUILD_ERROR", base=b["u/builderr"], likes=80),
            "u/fell-asleep": space("RUNNING", base=b["u/fell-asleep"], likes=70),
            "u/running": space("RUNNING", base=b["u/running"], likes=60),
            "u/docker": space("RUNNING", sdk="docker", base=b["u/docker"], likes=50),
            "u/oldgradio": space("RUNNING", base=b["u/oldgradio"], likes=40),
            "u/late": space("RUNNING", base=b["u/late"], likes=20),
            "u/tiny": space("STOPPED", base=b["u/tiny"], likes=10),
        }  # u/gone is in the frame but no longer listed, and 404s
        self.fresh = {k: dict(v) for k, v in self.listing.items()}
        self.fresh["u/fell-asleep"] = space("SLEEPING", base=b["u/fell-asleep"])
        self.ratelimit_r = 400
        self.per_id_paths = []
        ids = list(self.listing)

        def hub(h, method):
            hdr = {"ratelimit": f'"api";r={self.ratelimit_r};t=7'}
            if h.path.startswith("/api/spaces?"):
                page2 = "page=2" in h.path
                chunk = ids[5:] if page2 else ids[:5]
                body = [{"id": i, **{k: v for k, v in self.listing[i].items() if k != "host"},
                         "subdomain": "x"} for i in chunk]
                if not page2:
                    hdr["Link"] = f'<{self.hub.base}/api/spaces?filter=mcp-server&page=2>; rel="next"'
                return send(h, 200, body, headers=hdr)
            self.per_id_paths.append(h.path) if h.path.startswith("/api/spaces/") else None
            if h.path.startswith("/api/spaces/u/Renamed?"):
                return send(h, 307, b"", headers={**hdr, "Location": "/api/spaces/u/renamed-now?" + h.path.split("?", 1)[1]})
            if h.path.startswith("/api/spaces/u/big?"):
                pass
            m = re.match(r"^/api/spaces/([^?]+)", h.path)
            if m and m.group(1) == "u/renamed-now":
                return send(h, 200, {"id": "u/renamed-now", **space("SLEEPING")}, headers=hdr)
            if m and m.group(1) in self.fresh:
                return send(h, 200, {"id": m.group(1), **self.fresh[m.group(1)]}, headers=hdr)
            return send(h, 404, {"error": "Repository not found"}, headers=hdr)
        self.hub = Srv(hub)
        self.frame_rows = [{"id": i, "likes_frame": (self.listing.get(i) or {"likes": 30})["likes"], "sdk_frame": "gradio"}
                           for i in list(self.listing) + ["u/gone", "u/Renamed"]]
        self.frame_rows.sort(key=lambda r: (-r["likes_frame"], r["id"]))
        for i, r in enumerate(self.frame_rows, 1):
            r["rank"] = i

    def close(self):
        for s in self.spaces.values():
            s.close()
        self.hub.close()


def run_world(w, out, run_cls=None, budget_s=60, sleeps=None):
    slept = sleeps if sleeps is not None else []
    sl = lambda s: slept.append(s)
    api = H.HubAPI(base=w.hub.base, rate=1000, cfg={"connect_timeout": 1.0, "read_timeout": 2.0}, sleep=sl)
    doc, listing = H.walk_listing(api, os.path.join(out, "raw"))
    for i, v in listing.items():  # the list endpoint omits `host`; the fixture Spaces live on 127.0.0.1 ports
        v["host"] = None
    cfg = dict(CFG, budget_s=budget_s)
    run = (run_cls or H.Run)(w.frame_rows, listing, api, out, cfg, top_n=2, host_re=LOCAL_HOST_RE)
    started, finished = run.run()
    api.close()
    s = H.summarise(run, started, finished, doc, len(w.frame_rows), [r["id"] for r in w.frame_rows], api)
    rows = [json.loads(l) for l in gzip.open(os.path.join(out, "results.jsonl.gz"), "rt")]
    return s, {r["id"]: r for r in rows}, doc


class NeverWake(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.w = World()
        cls.tmp = tempfile.mkdtemp()
        cls.s, cls.rows, cls.doc = run_world(cls.w, cls.tmp)

    @classmethod
    def tearDownClass(cls):
        cls.w.close()

    def test_sleeping_space_is_never_requested(self):
        self.assertEqual(self.w.spaces["u/sleeping"].reqs, [])
        self.assertEqual(self.rows["u/sleeping"]["state"], "SLEEPING")
        self.assertFalse(self.rows["u/sleeping"]["hf_space_requested"])

    def test_paused_build_error_stopped_never_requested(self):
        for sid, st in (("u/paused", "PAUSED"), ("u/builderr", "BUILD_ERROR"), ("u/tiny", "STOPPED")):
            self.assertEqual(self.w.spaces[sid].reqs, [], sid)
            self.assertEqual(self.rows[sid]["state"], st)
            self.assertEqual(self.rows[sid]["stage_source"], "listing")

    def test_listed_running_but_fresh_read_sleeping_is_never_requested(self):
        self.assertEqual(self.w.spaces["u/fell-asleep"].reqs, [])
        r = self.rows["u/fell-asleep"]
        self.assertEqual((r["state"], r["stage_listing"], r["stage_source"]), ("SLEEPING", "RUNNING", "space_api"))

    def test_running_non_gradio_not_contacted(self):
        self.assertEqual(self.w.spaces["u/docker"].reqs, [])
        self.assertEqual(self.rows["u/docker"]["state"], "RUNNING_NOT_GRADIO")

    def test_renamed_space_redirect_followed_on_the_hub_only(self):
        r = self.rows["u/Renamed"]
        self.assertEqual((r["state"], r["stage_source"]), ("SLEEPING", "space_api"))
        self.assertGreaterEqual(self.s["requests"]["hub_api_redirects_followed"], 1)

    def test_per_id_reads_ask_for_bounded_fields(self):
        per_id = [p for p in self.w.per_id_paths if not p.startswith("/api/spaces?")]
        self.assertTrue(per_id)
        self.assertTrue(all("expand[]=runtime" in urllib.parse.unquote(p) for p in per_id), per_id)

    def test_gone_space(self):
        self.assertEqual(self.rows["u/gone"]["state"], "SPACE_NOT_FOUND")
        self.assertEqual(self.w.spaces["u/gone"].reqs, [])

    def test_running_gradio_responds_with_tools(self):
        r = self.rows["u/running"]
        self.assertEqual(r["state"], "RESPONDED")
        self.assertEqual(r["n_tools"], 2)
        self.assertTrue(r["tools_complete"])
        self.assertEqual(r["endpoint_path"], "/gradio_api/mcp/")
        self.assertEqual(r["stage_at_request"], "RUNNING")
        paths = {p for _m, p in self.w.spaces["u/running"].reqs}
        self.assertEqual(paths, {"/robots.txt", "/gradio_api/mcp/"})  # nothing else: no /call, no /run

    def test_old_gradio_falls_back_to_legacy_sse(self):
        r = self.rows["u/oldgradio"]
        self.assertEqual(r["state"], "SSE_ENDPOINT_ONLY")
        self.assertEqual([a["endpoint_path"] for a in r["attempts"]], ["/gradio_api/mcp/", "/gradio_api/mcp/sse"])

    def test_summary_invariant_and_tiers(self):
        self.assertEqual(self.s["never_woke_invariant"]["spaces_contacted_whose_last_stage_read_was_not_RUNNING"], 0)
        self.assertEqual(self.s["n_contacted"], 3)  # running, oldgradio, late
        self.assertEqual(self.s["read_state"], "EXHAUSTED")
        self.assertEqual(self.s["n_reached"], 11)
        self.assertEqual(self.s["responded"]["tools_per_responding_space_complete_lists"]["median"], 2)
        self.assertEqual(self.s["states_by_tier"]["top20"], {"SLEEPING": 1, "PAUSED": 1})
        self.assertEqual(self.doc["read_state"], "EXHAUSTED")
        self.assertEqual(self.doc["pages"], 2)

    def test_hub_api_ratelimit_header_obeyed(self):
        w = World()
        w.ratelimit_r = 3
        slept = []
        try:
            run_world(w, tempfile.mkdtemp(), sleeps=slept)
        finally:
            w.close()
        self.assertIn(8, slept)  # t=7 -> wait t+1


class Budget(unittest.TestCase):
    def test_budget_spent_contacts_nothing_but_keeps_listing_stages(self):
        w = World()
        try:
            s, rows, _ = run_world(w, tempfile.mkdtemp(), budget_s=0)
        finally:
            w.close()
        self.assertTrue(all(not srv.reqs for srv in w.spaces.values()))
        self.assertEqual(rows["u/sleeping"]["state"], "SLEEPING")
        self.assertNotIn("u/running", rows)
        self.assertEqual(s["read_state"], "PARTIAL")
        self.assertGreater(s["n_not_attempted"], 0)


class BrokenRun(H.Run):
    """CONTROL ONLY: trusts nothing about stage - probes every gradio Space. The suite must catch it."""

    def produce(self):
        try:
            for row in self.rows:
                info = self.listing.get(row["id"]) or {}
                fresh = dict(info, stage="RUNNING", sdk="gradio")
                rec = self._stage_row(row, fresh, "listing")
                base = (self.w_bases or {}).get(row["id"])
                if base is None:
                    continue
                rec.update({"space_base": base, "host_source": "control", "_t_stage": H.time.monotonic(), "_row": row})
                self.q.put(rec)
        finally:
            for _ in range(self.cfg["workers"]):
                self.q.put(None)


class Control(unittest.TestCase):
    def test_a_prober_without_the_stage_check_wakes_the_sleeping_space(self):
        w = World()
        try:
            bases = {sid: s.base for sid, s in w.spaces.items()}
            cls = type("B", (BrokenRun,), {"w_bases": bases})
            run_world(w, tempfile.mkdtemp(), run_cls=cls)
            self.assertNotEqual(w.spaces["u/sleeping"].reqs, [], "the control did not contact the sleeping Space: "
                                "the never-wake assertions above would pass vacuously")
        finally:
            w.close()


class Merge(unittest.TestCase):
    def test_reread_replaces_rows_and_keeps_run1(self):
        w = World()
        try:
            main, rr = tempfile.mkdtemp(), tempfile.mkdtemp()
            s1, rows1, doc = run_world(w, main)
            with open(os.path.join(main, "summary.json"), "w") as fh:
                json.dump(s1, fh)
            w.fresh["u/sleeping"] = space("PAUSED")
            keep = w.frame_rows
            w.frame_rows = [r for r in keep if r["id"] == "u/gone"]
            w.fresh["u/gone"] = space("SLEEPING")
            s2, _r, _d = run_world(w, rr)
            with open(os.path.join(rr, "summary.json"), "w") as fh:
                json.dump(s2, fh)
            s = H.merge_reread(main, rr, "test re-read")
        finally:
            w.close()
        self.assertEqual(s["n_reached"], s1["n_reached"])
        self.assertEqual(s["states"].get("SPACE_NOT_FOUND", 0), 0)
        self.assertEqual(s["corrections"][0]["transitions"], {"SPACE_NOT_FOUND -> SLEEPING": 1})
        self.assertTrue(os.path.exists(os.path.join(main, "results.run1.jsonl.gz")))


class Frame(unittest.TestCase):
    def test_load_frame_ranks_by_likes_then_id(self):
        d = tempfile.mkdtemp()
        with gzip.open(os.path.join(d, "entries.jsonl.gz"), "wt") as fh:
            for sid, likes in (("b/x", 5), ("a/x", 5), ("c/x", 9)):
                fh.write(json.dumps({"source": "hf-spaces", "id": sid, "meta": {"likes": likes, "sdk": "gradio"}}) + "\n")
            fh.write(json.dumps({"source": "mcp-registry", "id": "hf-spaces-lookalike"}) + "\n")
        rows = H.load_frame_spaces(d)
        self.assertEqual([(r["id"], r["rank"]) for r in rows], [("c/x", 1), ("a/x", 2), ("b/x", 3)])

    def test_space_base_uses_api_fields_never_the_id(self):
        self.assertEqual(H.space_base({"host": "https://abc-def.hf.space", "subdomain": "zzz"}),
                         ("https://abc-def.hf.space", "api.host"))
        self.assertEqual(H.space_base({"host": None, "subdomain": "abc-def"}), ("https://abc-def.hf.space", "api.subdomain"))
        self.assertEqual(H.space_base({"host": "https://evil.example", "subdomain": None}), (None, None))


if __name__ == "__main__":
    unittest.main()
