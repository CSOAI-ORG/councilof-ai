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

    def test_per_tool_rows(self):
        def att(tool, base, extra):
            return {"tool": tool, "baseline": {"kind": base}, "extra": {"kind": extra}}
        srv = {"read_only_tools": ["a_rejects", "b_accepts", "c_indet", "d_unprobed", "e_split"],
               "P2": {"attempts": [att("a_rejects", "ok", "tool_error"), att("b_accepts", "ok", "ok"),
                                   att("c_indet", "http_error", "http_error"), att("e_split", "ok", "ok"),
                                   att("e_split", "ok", "tool_error"), att("not_listed", "ok", "ok")]}}
        rows = E.per_tool(srv)
        h = E.tool_key
        self.assertEqual(rows[h("a_rejects")], {"p2": "REJECTS"})
        self.assertEqual(rows[h("b_accepts")], {"p2": "ACCEPTS_SILENTLY"})
        self.assertEqual(rows[h("c_indet")], {"p2": "INDETERMINATE"})
        self.assertEqual(rows[h("d_unprobed")], {"p2": "NOT_PROBED"})
        self.assertEqual(rows[h("e_split")], {"p2": "INDETERMINATE"})  # two decisive results disagree
        self.assertNotIn(h("not_listed"), rows)  # a tool the probe did not list read-only is never a row
        self.assertEqual(E.attempt_result(att("x", "ok", "http_error")), "INDETERMINATE")  # transport failure is not a refusal

    def test_committed_index_per_tool_demo_targets(self):
        # the two demo targets: listed read-only, extra argument rejected in the signed run
        b, s = self._run()
        doc = E.build(b, s)
        for url, tool in [("https://invokera.com/r/public-holidays", "get_next_public_holidays"),
                          ("https://api.exchangerate.dev/v1/mcp/", "list_currencies")]:
            self.assertEqual(doc["entries"][E.key(url)]["tools"][E.tool_key(tool)], {"p2": "REJECTS"}, url)
        text = json.dumps(doc)
        self.assertNotIn("get_next_public_holidays", text)
        self.assertNotIn("list_currencies", text)


if __name__ == "__main__":
    unittest.main()
