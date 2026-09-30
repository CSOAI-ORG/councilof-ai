#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""eb_census_index.py: same URL rule as functions/_lib/route/census.ts, refuses an unpinned artifact, no names served."""
import hashlib, json, os, sys, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eb_census_index as E  # noqa: E402

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


class T(unittest.TestCase):
    def test_vectors_match_census_ts(self):
        for inp, want in [("https://Example.COM/mcp/", "https://example.com/mcp"),
                          ("https://example.com:443/mcp?key=secret#x", "https://example.com/mcp"),
                          ("https://example.com:8443/a//", "https://example.com:8443/a"),
                          ("https://user:pw@example.com/mcp", "https://example.com/mcp"),
                          ("https://example.com", "https://example.com"),
                          ("local:ollama/mistral:7b", None), ("not a url", None)]:
            self.assertEqual(E.normalise(inp), want, inp)

    def _run(self):
        # the run the committed index names (the latest signed run), read from the repository
        idx = json.load(open(os.path.join(REPO, "public/interop/effect-binding-census-index.json")))
        art = os.path.join(REPO, "public", idx["source"]["artifact"].lstrip("/"))
        sgn = os.path.join(REPO, "public", idx["source"]["signed_companion"].lstrip("/"))
        return open(art, "rb").read(), json.load(open(sgn))

    def test_refuses_unpinned_artifact(self):
        b, s = self._run()
        with self.assertRaises(SystemExit):
            E.build(b + b" ", s)

    def test_committed_index_reproduces_and_serves_no_names(self):
        b, s = self._run()
        doc = E.build(b, s)
        committed = json.load(open(os.path.join(REPO, "public/interop/effect-binding-census-index.json")))
        self.assertEqual(doc, committed)
        art = json.loads(b)
        text = json.dumps(committed)
        for srv in art["third_party"]["servers"][:50]:
            self.assertNotIn(srv["name"], text)
            self.assertNotIn(srv["url"], text)
        self.assertEqual(sum(doc["counts"].values()), len(doc["entries"]))


if __name__ == "__main__":
    unittest.main()
