#!/usr/bin/env python3
"""Offline tests for reach.py and the multi-signal plan. No network: every response is a fixture.

Run: python3 -m unittest scripts/census/test_reach.py -v
"""
from __future__ import annotations

import gzip
import importlib.util
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
_SPEC = importlib.util.spec_from_file_location("frame", HERE / "frame.py")
frame = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(frame)
import reach  # noqa: E402

R = frame.MCP_REGISTRY + "?limit=100&version=latest"


def ok(obj):
    return (200, {}, json.dumps(obj).encode() if not isinstance(obj, bytes) else obj)


def fetcher(routes):
    t = frame.FakeTransport(routes)
    return frame.Fetcher(transport=t, sleep=lambda s: None, min_interval=0), t


def srv(name, url, packages=(), repo=None):
    s = {"name": name, "version": "1", "remotes": [{"type": "streamable-http", "url": url}],
         "packages": [{"registryType": t, "identifier": i} for t, i in packages]}
    if repo:
        s["repository"] = {"url": repo, "source": "github"}
    return {"server": s, "_meta": {"io.modelcontextprotocol.registry/official": {"status": "active",
                                                                                 "isLatest": True}}}


REGISTRY_PAGE = {"servers": [
    srv("io.a/npm-only", "https://a.example/mcp", [("npm", "a-mcp")], "https://github.com/a/a"),
    srv("io.b/pypi-only", "https://b.example/mcp", [("pypi", "B_Server.MCP")]),
    srv("io.c/oci-hub", "https://c.example/mcp", [("oci", "docker.io/cns/c-mcp:1.2")]),
    srv("io.d/oci-ghcr", "https://d.example/mcp", [("oci", "ghcr.io/dns/d-mcp:0.1")]),
    srv("io.e/smithery", "https://server.smithery.ai/@eowner/e-srv/mcp"),
    srv("io.f/none", "https://f.example/mcp"),
    srv("io.g/pypi-small", "https://g.example/mcp", [("pypi", "g-mcp")]),
], "metadata": {}}
SMITHERY_PAGE = {"servers": [{"qualifiedName": "@eowner/e-srv", "useCount": 42}],
                 "pagination": {"currentPage": 1, "pageSize": 1, "totalPages": 1, "totalCount": 9}}


def pepy_body(per_day):
    return {"id": "x", "total_downloads": 1, "downloads": per_day}


class Units(unittest.TestCase):
    def test_pep503(self):
        self.assertEqual(reach.pep503("B_Server.MCP"), "b-server-mcp")

    def test_dockerhub_repo(self):
        self.assertEqual(reach.dockerhub_repo("docker.io/cns/c-mcp:1.2"), ("cns/c-mcp", "docker.io"))
        self.assertEqual(reach.dockerhub_repo("mcp/github"), ("mcp/github", "docker.io"))
        self.assertEqual(reach.dockerhub_repo("redis:7"), ("library/redis", "docker.io"))
        self.assertEqual(reach.dockerhub_repo("ghcr.io/x/y:1"), (None, "ghcr.io"))
        self.assertEqual(reach.dockerhub_repo("localhost:5000/x/y"), (None, "localhost:5000"))

    def test_smithery_name(self):
        self.assertEqual(reach.smithery_name("https://server.smithery.ai/@o/n/mcp"), "@o/n")
        self.assertIsNone(reach.smithery_name("https://a.example/mcp"))

    def test_reach_pct_ties_and_zero(self):
        p = reach.reach_pct({"a": 100, "b": 100, "c": 5, "d": 0})
        self.assertEqual((p["a"], p["b"], p["c"], p["d"]), (0.0, 0.0, 0.5, 0.75))

    def test_pepy_one_calendar_window_all_versions(self):
        days = {f"2026-09-{d:02d}": {"1.0": 1, "1.1": 2} for d in range(10, 25)}
        sparse = {"2026-07-01": {"1": 50}, "2026-09-19": {"1": 4}}  # 7 latest dates would span months
        f, _t = fetcher({reach.PEPY + "pk": [ok(pepy_body(days))], reach.PEPY + "gone": [(404, {}, b"{}")],
                         reach.PEPY + "sparse": [ok(pepy_body(sparse))]})
        out = reach.pepy_weekly(["pk", "gone", "sparse"], f)
        self.assertEqual(out["pk"]["downloads_7d"], 21)
        self.assertEqual(out["pk"]["window"], ["2026-09-18", "2026-09-24"])
        self.assertEqual(out["sparse"]["window"], ["2026-09-18", "2026-09-24"])
        self.assertEqual((out["sparse"]["downloads_7d"], out["sparse"]["days_present"]), (4, 1))
        self.assertEqual(out["gone"]["status"], "not_found")
        self.assertIsNone(out["gone"]["downloads_7d"])

    def test_dockerhub_non_hub_is_labelled_not_fetched(self):
        f, t = fetcher({reach.DOCKERHUB + "cns/c-mcp/": [ok({"pull_count": 7})]})
        out = reach.dockerhub_pulls(["docker.io/cns/c-mcp:1.2", "ghcr.io/dns/d-mcp:0.1"], f)
        self.assertEqual(out["docker.io/cns/c-mcp:1.2"]["pull_count"], 7)
        self.assertTrue(out["ghcr.io/dns/d-mcp:0.1"]["status"].startswith("not_dockerhub:ghcr.io"))
        self.assertEqual([u for u, _ in t.calls], [reach.DOCKERHUB + "cns/c-mcp/"])


class MultiSignalPlan(unittest.TestCase):
    def test_every_signal_labelled_and_unsignalled_stay_in_listing_order(self):
        routes = {R: [ok(REGISTRY_PAGE)], frame.SMITHERY + "?page=1&": [ok(SMITHERY_PAGE)],
                  frame.SMITHERY + "?page=2&": [ok({"servers": [], "pagination": {}})]}
        f, _t = fetcher(routes)
        week = {f"2026-09-{d:02d}": {"1": 10} for d in range(18, 25)}
        small = {f"2026-09-{d:02d}": {"1": 1} for d in range(18, 25)}
        lookups = {frame.NPM_DOWNLOADS + "a-mcp": [ok({"downloads": 500, "package": "a-mcp"})],
                   reach.PEPY + "b-server-mcp": [ok(pepy_body(week))],
                   reach.PEPY + "g-mcp": [ok(pepy_body(small))],
                   reach.DOCKERHUB + "cns/c-mcp/": [ok({"pull_count": 9000})]}
        pf, pt = fetcher(lookups)
        with tempfile.TemporaryDirectory() as d:
            frame.collect(d, ["mcp-registry", "smithery"], f)
            plan = frame.plan_top20(d, pf, frac=1.0)
            with gzip.open(os.path.join(d, "plan-top20.jsonl.gz"), "rt") as fh:
                rows = [json.loads(l) for l in fh]
        by = {r["endpoint"]: r for r in rows}
        self.assertEqual(by["https://a.example/mcp"]["ranked_by"], "npm_weekly_downloads")
        self.assertEqual(by["https://b.example/mcp"]["ranked_by"], "pypi_downloads_7d")
        self.assertEqual(by["https://b.example/mcp"]["value"], 70)
        self.assertEqual(by["https://c.example/mcp"]["ranked_by"], "dockerhub_pull_count")
        self.assertEqual(by["https://server.smithery.ai/@eowner/e-srv/mcp"]["ranked_by"], "smithery_use_count")
        self.assertEqual(by["https://d.example/mcp"]["ranked_by"], "registry_order:mcp-registry")
        self.assertEqual(by["https://f.example/mcp"]["ranked_by"], "registry_order:mcp-registry")
        # signalled endpoints come first; the ghcr-only and no-package rows keep listing order
        self.assertEqual([r["endpoint"] for r in rows[-2:]], ["https://d.example/mcp", "https://f.example/mcp"])
        self.assertEqual(rows[-2]["value"], 4)
        self.assertEqual(rows[-1]["value"], 6)
        # g (pypi 7/week) sits below b (pypi 70/week) within the pypi population
        self.assertLess(rows.index(by["https://b.example/mcp"]), rows.index(by["https://g.example/mcp"]))
        self.assertEqual(plan["endpoints_with_any_signal"], 5)
        self.assertEqual(plan["github_stars"]["candidates_with_github_repo"], 1)
        self.assertFalse(plan["github_stars"]["used"])
        self.assertEqual(plan["smithery_use_count"]["matched"], 1)
        # only reach counters were contacted, never an endpoint
        self.assertTrue(all(u.startswith((frame.NPM_DOWNLOADS, reach.PEPY, reach.DOCKERHUB))
                            for u, _h in pt.calls))


if __name__ == "__main__":
    unittest.main()
