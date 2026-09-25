#!/usr/bin/env python3
"""Offline tests for rights_gate.py. No network: every response is a fixture.

Run: python3 -m unittest scripts/census/test_rights_gate.py -v
"""
from __future__ import annotations

import gzip
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
sys.path.insert(0, str(HERE))
_SPEC = importlib.util.spec_from_file_location("rights_gate", HERE / "rights_gate.py")
rg = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(rg)

A, R, U = rg.ALLOWED, rg.RESTRICTED, rg.UNKNOWN


def ok(obj, headers=None):
    return (200, headers or {}, obj if isinstance(obj, bytes) else json.dumps(obj).encode())


class Normalise(unittest.TestCase):
    def test_spdx_ids_and_expressions(self):
        self.assertEqual(rg.normalise("MIT")["spdx"], "MIT")
        self.assertEqual(rg.normalise("apache-2.0")["spdx"], "Apache-2.0")
        f = rg.normalise("MIT OR GPL-3.0-only")
        self.assertEqual(f["category"], rg.PERMISSIVE)  # OR: the licensee may choose
        f = rg.normalise("MIT AND GPL-3.0-only")
        self.assertEqual(f["category"], rg.STRONG)  # AND: every term applies
        self.assertEqual(rg.normalise("(Apache-2.0 OR MIT) AND BSD-3-Clause")["category"], rg.PERMISSIVE)
        self.assertEqual(rg.normalise("GPL-2.0+")["spdx"], "GPL-2.0-or-later")
        self.assertEqual(rg.normalise("GPL-2.0-only WITH Classpath-exception-2.0")["category"], rg.STRONG)

    def test_aliases_and_texts(self):
        self.assertEqual(rg.normalise("Apache License 2.0")["spdx"], "Apache-2.0")
        self.assertEqual(rg.normalise("The MIT License")["spdx"], "MIT")
        mit_text = "MIT License\n\nCopyright (c) 2026 X\n\nPermission is hereby granted, free of charge, to any person"
        f = rg.normalise(mit_text)
        self.assertEqual((f["spdx"], f["status"]), ("MIT", "TEXT"))

    def test_unlicensed_is_not_unlicense(self):
        self.assertEqual(rg.normalise("UNLICENSED")["category"], rg.PROPRIETARY)
        self.assertEqual(rg.normalise("Unlicense")["category"], rg.PUBLIC_DOMAIN)

    def test_missing_unrecognised_seefile(self):
        self.assertEqual(rg.normalise(None)["status"], "MISSING")
        self.assertEqual(rg.normalise("")["status"], "MISSING")
        self.assertEqual(rg.normalise("SEE LICENSE IN LICENSE.md")["status"], "SEE_FILE")
        f = rg.normalise("Custom-Corp-Licence")
        self.assertEqual((f["spdx"], f["status"]), (None, "UNRECOGNISED"))
        # an expression with an unknown leaf under AND cannot be categorised
        self.assertIsNone(rg.normalise("MIT AND Foo-1.0")["category"])

    def test_non_commercial(self):
        for s in ("CC-BY-NC-4.0", "cc-by-nc-sa-4.0", "PolyForm-Noncommercial-1.0.0"):
            self.assertEqual(rg.normalise(s)["category"], rg.NON_COMMERCIAL, s)

    def test_hf_ids(self):
        self.assertEqual(rg.normalise("openrail")["category"], rg.USE_RESTRICTED)
        self.assertEqual(rg.normalise("llama3.1")["category"], rg.USE_RESTRICTED)


class Extractors(unittest.TestCase):
    def test_npm(self):
        self.assertEqual(rg.npm_licence({"license": "ISC"})["spdx"], "ISC")
        self.assertEqual(rg.npm_licence({"license": {"type": "MIT"}})["spdx"], "MIT")
        f = rg.npm_licence({"licenses": [{"type": "MIT"}, {"type": "Apache-2.0"}]})
        self.assertEqual((f["spdx"], f["category"]), ("Apache-2.0 OR MIT", rg.PERMISSIVE))
        self.assertEqual(rg.npm_licence({})["status"], "MISSING")

    def test_pypi_precedence(self):
        doc = {"info": {"license_expression": "Apache-2.0", "license": "MIT",
                        "classifiers": ["License :: OSI Approved :: BSD License"]}}
        self.assertEqual(rg.pypi_licence(doc)["spdx"], "Apache-2.0")
        doc = {"info": {"license": "", "classifiers": ["License :: OSI Approved :: MIT License"]}}
        f = rg.pypi_licence(doc)
        self.assertEqual((f["spdx"], f["status"]), ("MIT", "CLASSIFIER"))
        doc = {"info": {"license": "Some odd words", "classifiers": ["License :: OSI Approved :: MIT License"]}}
        self.assertEqual(rg.pypi_licence(doc)["spdx"], "MIT")
        self.assertEqual(rg.pypi_licence({"info": {"license": None, "classifiers": []}})["status"], "MISSING")

    def test_nuget_and_crates(self):
        self.assertEqual(rg.nuget_licence('<license type="expression">MIT</license>')["spdx"], "MIT")
        self.assertEqual(rg.nuget_licence("<licenseUrl>https://licenses.nuget.org/Apache-2.0</licenseUrl>")["spdx"],
                         "Apache-2.0")
        self.assertEqual(rg.nuget_licence('<license type="file">LICENSE.txt</license>')["status"], "SEE_FILE")
        doc = {"crate": {"max_stable_version": "1.0.0"}, "versions": [{"num": "1.0.0", "license": "MIT/Apache-2.0"}]}
        self.assertEqual(rg.crates_licence(doc)["category"], rg.PERMISSIVE)

    def test_oci_parse(self):
        self.assertEqual(rg.parse_oci("mcp/sqlite"), ("docker.io", "mcp/sqlite", "latest"))
        self.assertEqual(rg.parse_oci("docker.io/a/b:1.2"), ("docker.io", "a/b", "1.2"))
        self.assertEqual(rg.parse_oci("ghcr.io/Org/img:v1"), ("ghcr.io", "org/img", "v1"))
        self.assertEqual(rg.parse_oci("redis"), ("docker.io", "library/redis", "latest"))
        self.assertEqual(rg.parse_oci("quay.io/x/y@sha256:ab")[2], "sha256:ab")

    def test_github_repo(self):
        self.assertEqual(rg.github_repo("https://github.com/Foo/bar.git"), "foo/bar")
        self.assertEqual(rg.github_repo("https://github.com/foo/bar/tree/main/pkg"), "foo/bar")
        self.assertIsNone(rg.github_repo("https://gitlab.com/foo/bar"))


class Gates(unittest.TestCase):
    def test_unknown_blocks_reuse_vendor_train(self):
        gates, eff = rg.licence_gates([rg.licence_fact(None, "MISSING", None, "npm")])
        for p in ("REUSE_CODE", "VENDOR", "TRAIN"):
            self.assertEqual(gates[p]["state"], U)
            self.assertIn("licence missing", gates[p]["reason"])
        gates, _ = rg.licence_gates([])
        self.assertTrue(all(g["state"] == U for g in gates.values()))

    def test_non_commercial_restricted(self):
        # e.g. a CC-BY-NC dataset/app (Emergence World)
        gates, eff = rg.licence_gates([rg.normalise("CC-BY-NC-4.0", "hf-card")])
        for p in ("REUSE_CODE", "VENDOR", "TRAIN"):
            self.assertEqual(gates[p]["state"], R)
            self.assertIn("non-commercial", gates[p]["reason"])

    def test_permissive_allowed_with_obligation(self):
        gates, eff = rg.licence_gates([rg.normalise("MIT", "npm")])
        self.assertTrue(all(gates[p]["state"] == A for p in ("REUSE_CODE", "VENDOR", "TRAIN")))
        self.assertIn("obligations", gates["VENDOR"])

    def test_conflict_takes_most_restrictive(self):
        gates, eff = rg.licence_gates([rg.normalise("MIT", "npm"), rg.normalise("AGPL-3.0-only", "github")])
        self.assertEqual(eff["category"], rg.NETWORK)
        self.assertTrue(eff["conflict"])
        self.assertEqual(gates["REUSE_CODE"]["state"], R)

    def test_known_beats_unknown(self):
        gates, eff = rg.licence_gates([rg.normalise("MIT", "npm"), rg.licence_fact(None, "NOT_FOUND", None, "pypi")])
        self.assertEqual(gates["VENDOR"]["state"], A)

    def test_measure_public(self):
        pub = [{"canonical": "https://mcp.example.com/mcp", "templated": False, "reject": None}]
        self.assertEqual(rg.measure_gate(pub)["state"], A)
        loop = [{"canonical": "http://127.0.0.1:10000/a2a", "templated": False, "reject": None}]
        self.assertEqual(rg.measure_gate(loop)["state"], R)
        priv = [{"canonical": "http://10.1.2.3/a2a", "templated": False, "reject": None}]
        self.assertEqual(rg.measure_gate(priv)["state"], R)
        self.assertEqual(rg.measure_gate([{"canonical": "http://printer.local/x", "templated": False}])["state"], R)
        tpl = [{"canonical": "https://x.com/{}/mcp", "templated": True, "reject": None}]
        self.assertEqual(rg.measure_gate(tpl)["state"], R)
        self.assertEqual(rg.measure_gate([])["state"], R)
        self.assertEqual(rg.measure_gate(pub, listing_private=True)["state"], R)


def _tiny_frame(d):
    """A frame with 5 rows: npm pkg (MIT), pypi pkg (no licence), remote-only, HF space (NC), docker image."""
    os.makedirs(os.path.join(d, "raw", "mcp-registry"))
    os.makedirs(os.path.join(d, "raw", "docker-mcp-registry"))
    servers = [
        {"server": {"name": "io.a/npm", "repository": {"url": "https://github.com/a/npm"},
                    "packages": [{"registryType": "npm", "identifier": "@a/npm-mcp"}]}},
        {"server": {"name": "io.b/py", "repository": {"url": "https://github.com/b/py"},
                    "packages": [{"registryType": "pypi", "identifier": "B_Py"}]}},
        {"server": {"name": "io.c/remote", "remotes": [{"type": "streamable-http", "url": "https://c.io/mcp"}]}},
    ]
    with gzip.open(os.path.join(d, "raw", "mcp-registry", "00001.json.gz"), "wt") as fh:
        json.dump({"servers": servers, "metadata": {}}, fh)
    inner = io.BytesIO()
    with tarfile.open(fileobj=inner, mode="w:gz") as tf:
        for name, body in (("reg-1/LICENSE", "MIT License\n\nPermission is hereby granted, free of charge, x"),
                           ("reg-1/servers/Foo/server.yaml",
                            "name: Foo\nimage: mcp/foo\ntype: server\nsource:\n  project: https://github.com/d/foo\n")):
            b = body.encode()
            ti = tarfile.TarInfo(name)
            ti.size = len(b)
            tf.addfile(ti, io.BytesIO(b))
    with gzip.open(os.path.join(d, "raw", "docker-mcp-registry", "00003.tar.gz.gz"), "wb") as fh:
        fh.write(inner.getvalue())
    rows = [
        {"source": "mcp-registry", "id": "io.a/npm", "order": 1, "endpoints": [], "npm": ["@a/npm-mcp"], "meta": {}},
        {"source": "mcp-registry", "id": "io.b/py", "order": 2, "endpoints": [], "npm": [], "meta": {}},
        {"source": "mcp-registry", "id": "io.c/remote", "order": 3, "npm": [], "meta": {},
         "endpoints": [{"canonical": "https://c.io/mcp", "templated": False, "reject": None}]},
        {"source": "hf-spaces", "id": "e/world", "order": 1, "npm": [], "meta": {"private": False},
         "endpoints": [{"canonical": "https://e-world.hf.space/", "templated": False, "reject": None}]},
        {"source": "docker-mcp-registry", "id": "Foo", "order": 1, "npm": [], "endpoints": [],
         "meta": {"dir": "Foo", "image": "mcp/foo"}},
    ]
    with gzip.open(os.path.join(d, "entries.jsonl.gz"), "wt") as fh:
        for r in rows:
            fh.write(json.dumps(r) + "\n")
    with open(os.path.join(d, "summary.json"), "w") as fh:
        json.dump({"run_started": "2026-09-25T00:00:00Z", "files": {},
                   "sources": {"mcp-registry": {"read_state": "EXHAUSTED"}}}, fh)


ROUTES = {
    rg.NPM + "@a/npm-mcp/latest": [ok({"name": "@a/npm-mcp", "license": "MIT"})],
    rg.PYPI + "b-py/json": [ok({"info": {"license": None, "classifiers": []}})],
    "https://huggingface.co/api/spaces": [ok([{"id": "e/world", "cardData": {"license": "cc-by-nc-4.0"}}])],
    rg.GITHUB_API: [ok({"license": {"spdx_id": "MIT"}}, {"x-ratelimit-remaining": "55"})],
}


class EndToEnd(unittest.TestCase):
    def _run(self, routes=ROUTES, github_n=5):
        import frame as fr  # the census frame module, for FakeTransport
        t = fr.FakeTransport(routes)
        with tempfile.TemporaryDirectory() as d:
            fd, out = os.path.join(d, "frame"), os.path.join(d, "out")
            os.makedirs(fd)
            _tiny_frame(fd)
            s = rg.run(fd, out, github_n=github_n, oci_n=0, transport=t, log=lambda m: None)
            with gzip.open(os.path.join(out, "decisions.jsonl.gz"), "rt") as fh:
                rows = {(r["source"], r["id"]): r for r in map(json.loads, fh)}
            return s, rows, t

    def test_decisions(self):
        s, rows, t = self._run()
        self.assertEqual(s["n_subjects"], 5)
        for p in rg.PURPOSES:
            self.assertEqual(sum(s["decisions"][p].values()), 5, p)
        g = lambda k, p: rows[k]["gates"][p]["state"]  # noqa: E731
        self.assertEqual(g(("mcp-registry", "io.a/npm"), "VENDOR"), A)
        self.assertEqual(g(("mcp-registry", "io.a/npm"), "MEASURE_PUBLIC"), R)  # package only: nothing to probe
        self.assertEqual(g(("mcp-registry", "io.c/remote"), "MEASURE_PUBLIC"), A)
        self.assertEqual(g(("mcp-registry", "io.c/remote"), "REUSE_CODE"), U)  # licence unknown -> blocked
        self.assertEqual(g(("hf-spaces", "e/world"), "TRAIN"), R)  # CC-BY-NC
        self.assertEqual(g(("hf-spaces", "e/world"), "MEASURE_PUBLIC"), A)  # licence-independent
        self.assertEqual(s["catalogue_terms"]["docker-mcp-registry"]["repository_licence"], "MIT")
        self.assertIsNone(s["population_total"])
        share = s["unknown_share"]["REUSE_CODE"]
        self.assertEqual(share["n"], 5)
        self.assertAlmostEqual(share["share"], share["unknown"] / 5, places=4)

    def test_github_sample_is_capped_and_used(self):
        s, rows, t = self._run(github_n=2)
        gh_calls = [u for u, _h in t.calls if u.startswith(rg.GITHUB_API)]
        self.assertLessEqual(len(gh_calls), 2)
        self.assertEqual(s["github_sample"]["picked"], 2)

    def test_github_rate_limit_is_partial(self):
        routes = dict(ROUTES)
        routes[rg.GITHUB_API] = [(403, {"x-ratelimit-remaining": "0"}, b"{}")]
        s, rows, t = self._run(routes=routes)
        self.assertTrue(s["github_sample"]["read_state"].startswith("PARTIAL"))

    def test_deterministic(self):
        s1, r1, _ = self._run()
        s2, r2, _ = self._run()
        self.assertEqual(r1, r2)
        self.assertEqual(s1["decisions"], s2["decisions"])


if __name__ == "__main__":
    unittest.main()
