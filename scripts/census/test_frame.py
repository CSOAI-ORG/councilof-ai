#!/usr/bin/env python3
"""Offline tests for frame.py and read_state.py. No network: every response is a fixture.

Run: python3 -m unittest scripts/census/test_frame.py -v
"""
from __future__ import annotations

import gzip
import hashlib
import importlib.util
import io
import json
import os
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
FIX = HERE / "fixtures" / "frame"
sys.path.insert(0, str(HERE))

_SPEC = importlib.util.spec_from_file_location("frame", HERE / "frame.py")
frame = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(frame)
import read_state  # noqa: E402

EXHAUSTED, PARTIAL, FAILED = frame.EXHAUSTED, frame.PARTIAL, frame.FAILED
R = frame.MCP_REGISTRY + "?limit=100&version=latest"


def fx(name):
    return (FIX / name).read_bytes()


def ok(body, headers=None):
    return (200, headers or {}, body)


def fetcher(routes, **kw):
    t = frame.FakeTransport(routes)
    slept = []
    f = frame.Fetcher(transport=t, sleep=slept.append, min_interval=0, **kw)
    return f, t, slept


def docker_tarball(truncate=False):
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tf:
        for d in ("remote-one", "image-two"):
            data = fx(f"docker_{d}.yaml")
            ti = tarfile.TarInfo(f"mcp-registry-0123/servers/{d}/server.yaml")
            ti.size = len(data)
            tf.addfile(ti, io.BytesIO(data))
    b = buf.getvalue()
    return b[: len(b) // 2] if truncate else b


def docker_routes(truncate=False):
    sha = json.loads(fx("docker_commit.json"))["sha"]
    return {frame.DOCKER_API + "/commits/main": [ok(fx("docker_commit.json"))],
            frame.DOCKER_API + "/git/trees/": [ok(fx("docker_tree.json"))],
            frame.DOCKER_CODELOAD + sha: [ok(docker_tarball(truncate))]}


def all_routes():
    r = {R + "&cursor=cur-1": [ok(fx("registry_p2.json"))], R: [ok(fx("registry_p1.json"))],
         frame.HF_SPACES: [ok(fx("hf_p1.json"), {"link": '<https://huggingface.co/api/spaces?c=2>; rel="next"'})],
         "https://huggingface.co/api/spaces?c=2": [ok(fx("hf_p2.json"))],
         frame.A2A_REGISTRY + "?limit=100&offset=0": [ok(fx("a2a_p1.json"))],
         frame.A2A_REGISTRY + "?limit=100&offset=2": [ok(fx("a2a_p2.json"))],
         frame.SMITHERY + "?page=1&": [ok(fx("smithery_p1.json"))],
         frame.SMITHERY + "?page=2&": [ok(fx("smithery_p2.json"))],
         frame.SMITHERY + "?page=3&": [ok(fx("smithery_p3.json"))]}
    r.update(docker_routes())
    return r


def read_gz_jsonl(p):
    with gzip.open(p, "rt") as f:
        return [json.loads(l) for l in f]


class Canonical(unittest.TestCase):
    def test_cases(self):
        c = frame.canonical_endpoint
        self.assertEqual(c("https://MCP.Example.com:443/mcp/")[0], "https://mcp.example.com/mcp")
        self.assertEqual(c("https://mcp.example.com/mcp")[0], "https://mcp.example.com/mcp")
        self.assertEqual(c("http://h.example:8080/")[0], "http://h.example:8080/")
        self.assertEqual(c("https://h.example")[0], "https://h.example/")
        canon, info = c("https://beta.example.org/v2/{project_slug}/sse?key={api_key}")
        self.assertEqual(canon, "https://beta.example.org/v2/{}/sse")
        self.assertTrue(info["templated"] and info["had_query"])
        self.assertEqual(c("https://u:p@h.example/x")[0], "https://h.example/x")  # no userinfo kept
        self.assertEqual(c("https://{tenant}.beta.example.org/mcp")[1]["reject"], "templated host")
        self.assertEqual(c("stdio://x")[1]["reject"], "non-http scheme")
        self.assertIsNone(c(None)[0])


class RegistryWalk(unittest.TestCase):
    def test_exhausted_two_pages(self):
        f, t, _ = fetcher({R + "&cursor=cur-1": [ok(fx("registry_p2.json"))], R: [ok(fx("registry_p1.json"))]})
        with tempfile.TemporaryDirectory() as d:
            s = frame.collect(d, ["mcp-registry"], f)
            src = s["sources"]["mcp-registry"]
            self.assertEqual(src["read_state"], EXHAUSTED)
            self.assertEqual(src["population_total"], 4)
            self.assertEqual(s["union"]["population_total"], s["union"]["endpoints_in_file"])
            digests = [hashlib.sha256(fx(n)).hexdigest() for n in ("registry_p1.json", "registry_p2.json")]
            self.assertEqual(src["page_set_sha256"],
                             hashlib.sha256("".join(h + "\n" for h in digests).encode()).hexdigest())
            with gzip.open(os.path.join(d, "raw", "mcp-registry", "00001.json.gz")) as g:
                self.assertEqual(g.read(), fx("registry_p1.json"))  # raw bytes kept, re-derivable
            self.assertEqual(src["endpoint_rejects"], {"templated host": 1})
        self.assertTrue(all(h["User-Agent"] == frame.UA for _u, h in t.calls))

    def test_truncated_page_yields_null_totals(self):
        self.assertEqual(frame.self_test(), 0)
        cut = fx("registry_p2.json")[:40]
        f, _t, _ = fetcher({R + "&cursor=cur-1": [ok(cut)], R: [ok(fx("registry_p1.json"))]})
        with tempfile.TemporaryDirectory() as d:
            s = frame.collect(d, ["mcp-registry"], f)
        src = s["sources"]["mcp-registry"]
        self.assertEqual(src["read_state"], PARTIAL)
        self.assertIsNone(src["population_total"])
        self.assertIsNone(s["union"]["population_total"])
        self.assertEqual(src["rows_read"], 2)  # what was read is still reported, as a read count
        self.assertIn("not complete JSON", src["reason"])

    def test_error_object_is_not_an_end(self):
        # the 14 Sep defect: JSON without a nextCursor was called "cursor exhausted"
        f, _t, _ = fetcher({R + "&cursor=cur-1": [ok(fx("registry_error.json"))], R: [ok(fx("registry_p1.json"))]})
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["mcp-registry"], f)["sources"]["mcp-registry"]
        self.assertEqual(src["read_state"], PARTIAL)
        self.assertIsNone(src["population_total"])

    def test_http_error_status_is_not_an_end(self):
        f, _t, _ = fetcher({R + "&cursor=cur-1": [(422, {}, fx("registry_error.json"))],
                            R: [ok(fx("registry_p1.json"))]})
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["mcp-registry"], f)["sources"]["mcp-registry"]
        self.assertEqual(src["read_state"], PARTIAL)
        self.assertIn("HTTP 422", src["reason"])

    def test_first_page_failure_is_failed(self):
        f, _t, _ = fetcher({R: [(404, {}, b"{}")]})
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["mcp-registry"], f)["sources"]["mcp-registry"]
        self.assertEqual(src["read_state"], FAILED)
        self.assertIsNone(src["population_total"])

    def test_repeated_cursor_is_partial(self):
        f, _t, _ = fetcher({R + "&cursor=cur-1": [ok(fx("registry_p1.json"))], R: [ok(fx("registry_p1.json"))]})
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["mcp-registry"], f)["sources"]["mcp-registry"]
        self.assertEqual(src["read_state"], PARTIAL)
        self.assertIn("cursor repeated", src["reason"])


class Politeness(unittest.TestCase):
    def test_retry_after_honoured(self):
        f, t, slept = fetcher({R: [(429, {"retry-after": "7"}, b""), ok(fx("registry_p2.json"))]})
        st, _h, _b = f.get(R)
        self.assertEqual(st, 200)
        self.assertIn(7.0, slept)
        self.assertEqual(len(t.calls), 2)

    def test_retry_after_over_cap_raises(self):
        f, _t, _ = fetcher({R: [(429, {"retry-after": "99999"}, b"")]})
        with self.assertRaises(frame.FetchError):
            f.get(R)

    def test_min_interval(self):
        clock = [0.0]
        slept = []

        def sleep(s):
            slept.append(s)
            clock[0] += s
        f = frame.Fetcher(transport=frame.FakeTransport({R: [ok(b"{}")]}), sleep=sleep,
                          clock=lambda: clock[0], min_interval=1.0)
        f.get(R)
        f.get(R)
        self.assertEqual(slept, [1.0])


class OtherSources(unittest.TestCase):
    def test_hf_link_pagination(self):
        r = all_routes()
        f, _t, _ = fetcher(r)
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["hf-spaces"], f)["sources"]["hf-spaces"]
        self.assertEqual(src["read_state"], EXHAUSTED)
        self.assertEqual(src["population_total"], 3)
        self.assertEqual(src["entries_without_endpoint"], 1)

    def test_a2a_exhausted_and_moved_list(self):
        f, _t, _ = fetcher(all_routes())
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["a2aregistry"], f)["sources"]["a2aregistry"]
        self.assertEqual((src["read_state"], src["population_total"]), (EXHAUSTED, 3))
        moved = json.loads(fx("a2a_p2.json"))
        moved["agents"][0] = {"id": "a2", "url": "https://two.example/"}  # list shifted: a duplicate
        r = all_routes()
        r[frame.A2A_REGISTRY + "?limit=100&offset=2"] = [ok(json.dumps(moved).encode())]
        f, _t, _ = fetcher(r)
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["a2aregistry"], f)["sources"]["a2aregistry"]
        self.assertEqual(src["read_state"], PARTIAL)
        self.assertIsNone(src["population_total"])

    def test_smithery_is_partial(self):
        f, _t, _ = fetcher(all_routes())
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["smithery"], f)["sources"]["smithery"]
        self.assertEqual(src["read_state"], PARTIAL)
        self.assertIsNone(src["population_total"])
        self.assertEqual((src["rows_read"], src["distinct_ids"], src["declared_total"]), (4, 3, 17186))
        self.assertIn("API key", src["reason"])

    def test_docker_exhausted_and_truncated(self):
        f, _t, _ = fetcher(docker_routes())
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["docker-mcp-registry"], f)["sources"]["docker-mcp-registry"]
        self.assertEqual((src["read_state"], src["population_total"]), (EXHAUSTED, 2))
        self.assertEqual(src["distinct_endpoints"], 1)
        f, _t, _ = fetcher(docker_routes(truncate=True))
        with tempfile.TemporaryDirectory() as d:
            src = frame.collect(d, ["docker-mcp-registry"], f)["sources"]["docker-mcp-registry"]
        self.assertEqual(src["read_state"], PARTIAL)
        self.assertIsNone(src["population_total"])


class CrossCatalogue(unittest.TestCase):
    def test_dedupe_and_union_null_when_any_partial(self):
        f, _t, _ = fetcher(all_routes())
        with tempfile.TemporaryDirectory() as d:
            s = frame.collect(d, None, f)
            rows = {r["endpoint"]: r for r in read_gz_jsonl(os.path.join(d, "endpoints.jsonl.gz"))}
        both = rows["https://mcp.example.com/mcp"]
        self.assertEqual(both["catalogues"], ["docker-mcp-registry", "mcp-registry"])
        self.assertEqual(both["n_listings"], 2)
        self.assertEqual(s["overlap"]["endpoint_level"]["pairwise"], {"docker-mcp-registry&mcp-registry": 1})
        # gamma is on the registry at its MCP path and on HF at its base URL: host-level only
        self.assertIn("hf-spaces&mcp-registry", s["overlap"]["host_level"]["pairwise"])
        self.assertIsNone(s["union"]["population_total"])  # smithery is PARTIAL
        self.assertEqual(s["union"]["population_total_null_because"], ["smithery: PARTIAL"])
        self.assertEqual(s["union"]["endpoints_in_file"], len(rows))

    def test_union_total_when_every_source_exhausted(self):
        f, _t, _ = fetcher(all_routes())
        with tempfile.TemporaryDirectory() as d:
            s = frame.collect(d, ["mcp-registry", "docker-mcp-registry"], f)
        self.assertEqual(s["union"]["population_total"], s["union"]["endpoints_in_file"])


class Plan(unittest.TestCase):
    def test_top20_signal_labels(self):
        f, _t, _ = fetcher(all_routes())
        with tempfile.TemporaryDirectory() as d:
            frame.collect(d, None, f)
            npm = {frame.NPM_DOWNLOADS + "alpha-mcp": [ok(b'{"downloads":1234,"package":"alpha-mcp"}')],
                   frame.NPM_DOWNLOADS + "@example/gamma": [(404, {}, b'{"error":"not found"}')]}
            pf, pt, _ = fetcher(npm)
            plan = frame.plan_top20(d, pf, frac=0.2)
            top = read_gz_jsonl(os.path.join(d, "plan-top20.jsonl.gz"))
        # candidates: alpha (npm 1234), gamma (npm not found -> registry order); beta is templated
        self.assertEqual(plan["candidates"], 2)
        self.assertEqual(plan["top_n"], 1)
        self.assertEqual(top[0]["endpoint"], "https://mcp.example.com/mcp")
        self.assertEqual(top[0]["signal"], "npm_weekly_downloads")
        self.assertEqual(plan["signal_mix_all"], {"npm_weekly_downloads": 1, "registry_order:mcp-registry": 1})
        self.assertEqual(plan["npm_lookup_status"], {"ok": 1, "not_found": 1})
        self.assertTrue(any("templated" in k for k in plan["excluded"]))
        self.assertTrue(all(u.startswith(frame.NPM_DOWNLOADS) for u, _h in pt.calls))  # no endpoint contacted


class CensusReadState(unittest.TestCase):
    """The producer of the 14 Sep enumeration_complete: true now fails closed."""

    def test_published_legacy_doc_is_partial(self):
        doc = {"pages": 2, "stop_reason": "cursor exhausted — clean end of registry",
               "unique_entries": 100, "rows": [{}] * 100}
        self.assertEqual(read_state.walk_read_state(doc, "/tmp/mcp_census_full.json"), PARTIAL)
        self.assertIsNone(read_state.population_total(doc, "unique_entries"))

    def test_bounded_file_never_complete(self):
        doc = {"pages": 2, "pages_valid": 2, "read_state": "EXHAUSTED", "unique_entries": 100, "rows": [{}]}
        self.assertEqual(read_state.walk_read_state(doc, "/tmp/b.json", ("/tmp/b.json",)), PARTIAL)

    def test_exhausted_needs_every_page_valid(self):
        doc = {"pages": 3, "pages_valid": 2, "read_state": "EXHAUSTED", "unique_entries": 200, "rows": [{}]}
        self.assertEqual(read_state.walk_read_state(doc), PARTIAL)
        doc["pages_valid"] = 3
        self.assertEqual(read_state.walk_read_state(doc), EXHAUSTED)
        self.assertEqual(read_state.population_total(doc, "unique_entries"), 200)

    def test_nothing_read_is_failed(self):
        self.assertEqual(read_state.walk_read_state({"pages": 1, "rows": []}), FAILED)
        self.assertEqual(read_state.walk_read_state(None), FAILED)


if __name__ == "__main__":
    unittest.main()
