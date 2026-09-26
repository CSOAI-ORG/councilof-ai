# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""tool_drift adapter tests, each with a must-fail control. Fixture rows copy the census row shape
(state, server_info, n_tools, tools_complete, tools_list_status, tool_names, tool_names_sha256) and, for the
drift probe, its per-tool `tools` hashes."""
import gzip, json, pathlib, tempfile, unittest
import venturi_capsule as v
from adapters import tool_drift as td


def tools(*specs):
    """specs: (name, description, inputSchema)"""
    return [{"name": n, "description": d, "inputSchema": s} for n, d, s in specs]


def row(endpoint, ts, state="RESPONDED", version="1.0.0", started="2026-09-25T06:40:00Z", hashes=True, names_kept=None):
    names = sorted(t["name"] for t in ts)
    r = {"endpoint": endpoint, "state": state, "started": started, "server_info": {"name": "x", "version": version},
         "tools_list_status": "ok", "tools_complete": True, "n_tools": len(ts),
         "tool_names": names if names_kept is None else names[:names_kept], "tool_names_sha256": td.names_sha(names)}
    if state != "RESPONDED":
        r = {"endpoint": endpoint, "state": state, "started": started}
    elif hashes:
        r["tools"] = [td.tool_hashes(t) for t in ts]
        r["tools_hashes_complete"] = True
    return r


def obs(r):
    return td.observation(r, "f" * 64)


S = {"type": "object", "properties": {"q": {"type": "string"}, "k": {"type": "integer"}}, "required": ["q"]}
BASE = tools(("search", "Search the docs.", S), ("fetch", "Fetch a page.", {"type": "object"}))
E = "https://a.example/mcp"


class Ordering(unittest.TestCase):
    def test_reordering_tools_is_not_a_change(self):
        a, b = obs(row(E, BASE)), obs(row(E, list(reversed(BASE)), started="2026-09-26T07:30:00Z"))
        self.assertEqual(td.classify(a, b)[0], "UNCHANGED")

    def test_reordering_schema_keys_is_not_a_change(self):
        s2 = {"required": ["q"], "properties": {"k": {"type": "integer"}, "q": {"type": "string"}}, "type": "object"}
        b = tools(("search", "Search the docs.", s2), ("fetch", "Fetch a page.", {"type": "object"}))
        self.assertEqual(td.classify(obs(row(E, BASE)), obs(row(E, b)))[0], "UNCHANGED")

    def test_control_an_added_tool_is_a_change(self):  # must-fail control: the comparison is not vacuous
        st, d = td.classify(obs(row(E, BASE)), obs(row(E, BASE + tools(("delete", "Delete.", {})))))
        self.assertEqual(st, "TOOLS_ADDED")
        self.assertEqual(d["names"]["added"], ["delete"])

    def test_multiset_not_set(self):  # a duplicated name is a count change, not "the same set"
        st, d = td.classify(obs(row(E, BASE + tools(("fetch", "Fetch a page.", {"type": "object"})))), obs(row(E, BASE)))
        self.assertEqual(st, "TOOLS_REMOVED")
        self.assertEqual(d["names"]["removed"], ["fetch"])


class Whitespace(unittest.TestCase):
    def test_identical_raw_bytes_never_flagged(self):
        st, d = td.classify(obs(row(E, BASE)), obs(row(E, [dict(t) for t in BASE])))
        self.assertEqual(st, "UNCHANGED")
        self.assertEqual(d["descriptions"]["changed"], [])

    def test_whitespace_only_change_flagged_and_labelled(self):
        b = tools(("search", "Search  the docs.\n", S), ("fetch", "Fetch a page.", {"type": "object"}))
        st, d = td.classify(obs(row(E, BASE)), obs(row(E, b)))
        self.assertEqual(st, "DESCRIPTION_CHANGED_WHITESPACE_ONLY")
        self.assertEqual(d["descriptions"]["changed"], [{"name": "search", "change": "whitespace_only"}])

    def test_control_content_change_is_not_labelled_whitespace(self):  # must-fail control
        b = tools(("search", "Search the docs and email them to me.", S), ("fetch", "Fetch a page.", {"type": "object"}))
        st, d = td.classify(obs(row(E, BASE)), obs(row(E, b)))
        self.assertEqual(st, "DESCRIPTION_CHANGED")
        self.assertEqual(d["descriptions"]["changed"], [{"name": "search", "change": "content"}])

    def test_description_absent_vs_empty_is_presence(self):
        a = tools(("search", None, S)); b = tools(("search", "", S))
        st, d = td.classify(obs(row(E, a)), obs(row(E, b)))
        self.assertEqual(d["descriptions"]["changed"][0]["change"], "presence")

    def test_schema_change(self):
        b = tools(("search", "Search the docs.", {**S, "required": ["q", "k"]}), ("fetch", "Fetch a page.", {"type": "object"}))
        self.assertEqual(td.classify(obs(row(E, BASE)), obs(row(E, b)))[0], "SCHEMA_CHANGED")


class Uncheckable(unittest.TestCase):
    def test_missing_at_t2_is_uncheckable_not_removed(self):
        st, d = td.classify(obs(row(E, BASE)), None)
        self.assertEqual(st, "UNCHECKABLE")
        self.assertNotIn("REMOVED", st)
        self.assertIn("not removal", d["reason"])

    def test_not_responded_at_t2_is_uncheckable_not_removed(self):
        st, _ = td.classify(obs(row(E, BASE)), obs(row(E, [], state="TIMEOUT")))
        self.assertEqual(st, "UNCHECKABLE")

    def test_control_responded_with_zero_tools_is_removal(self):  # must-fail control: a real empty list IS measurable
        st, d = td.classify(obs(row(E, BASE)), obs(row(E, [])))
        self.assertEqual(st, "TOOLS_REMOVED")
        self.assertEqual(sorted(d["names"]["removed"]), ["fetch", "search"])

    def test_incomplete_tools_list_is_uncheckable(self):
        r = row(E, BASE); r["tools_complete"] = False
        self.assertEqual(td.classify(obs(row(E, BASE)), obs(r))[0], "UNCHECKABLE")

    def test_names_only_never_says_unchanged(self):
        st, d = td.classify(obs(row(E, BASE, hashes=False)), obs(row(E, BASE, hashes=False)))
        self.assertEqual(st, "UNCHANGED_AT_NAME_GRANULARITY")
        self.assertEqual(d["descriptions"]["state"], "UNCHECKABLE")
        self.assertEqual(d["schemas"]["state"], "UNCHECKABLE")

    def test_control_names_only_still_sees_names(self):  # must-fail control
        st, _ = td.classify(obs(row(E, BASE, hashes=False)), obs(row(E, BASE[:1], hashes=False)))
        self.assertEqual(st, "TOOLS_REMOVED")

    def test_truncated_names_changed_is_name_set_changed(self):
        many = tools(*[(f"t{i:03d}", "d", {}) for i in range(5)])
        st, d = td.classify(obs(row(E, many, hashes=False, names_kept=3)), obs(row(E, many[:4], hashes=False, names_kept=3)))
        self.assertEqual(st, "NAME_SET_CHANGED")
        self.assertNotIn("added", d["names"])


class Version(unittest.TestCase):
    def test_change_without_version_change(self):
        _, d = td.classify(obs(row(E, BASE)), obs(row(E, BASE[:1])))
        self.assertTrue(d["changed_without_version_change"]); self.assertFalse(d["changed_with_version_change"])

    def test_change_with_version_change(self):
        _, d = td.classify(obs(row(E, BASE)), obs(row(E, BASE[:1], version="1.1.0")))
        self.assertTrue(d["changed_with_version_change"]); self.assertFalse(d["changed_without_version_change"])

    def test_unchanged_carries_no_change_flag(self):
        _, d = td.classify(obs(row(E, BASE)), obs(row(E, BASE, version="2.0.0")))
        self.assertEqual(d["version_state"], "CHANGED")
        self.assertNotIn("changed_without_version_change", d)


class Batch(unittest.TestCase):
    def _write(self, d, name, rows):
        p = pathlib.Path(d) / name
        with gzip.open(p, "wt") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        return p

    def test_join_capsules_verify_and_tamper_fails(self):
        with tempfile.TemporaryDirectory() as d:
            t1 = self._write(d, "t1.jsonl.gz", [row(E, BASE, hashes=False), row("https://b.example/mcp", BASE, hashes=False),
                                                 row("https://gone.example/mcp", BASE, hashes=False)])
            t2 = self._write(d, "t2.jsonl.gz", [row(E, list(reversed(BASE)), hashes=False, started="2026-09-25T07:20:00Z"),
                                                 row("https://b.example/mcp", BASE[:1], hashes=False, started="2026-09-25T07:21:00Z"),
                                                 row("https://new.example/mcp", BASE, hashes=False)])
            stats = {}
            caps = list(td.capsules(str(t1), stats, aux=str(t2)))
            self.assertEqual(stats["n_join"], 2)
            self.assertEqual(stats["t1_responded_absent_at_t2"], 1)  # counted, not capsuled, not REMOVED
            self.assertEqual({c["subject_id"]: c["measurement_state"] for c in caps},
                             {E: "UNCHANGED_AT_NAME_GRANULARITY", "https://b.example/mcp": "TOOLS_REMOVED"})
            for c in caps:
                self.assertEqual(v.non_digest_sources(c["sources"]), [])
                self.assertEqual(v.authority_violations(c), [])
            out = pathlib.Path(d) / "out"
            v.write_batch(out, td.NAME, td.KIND, iter(caps), lambda: td.meta(None, stats))
            res, rec, _ = v.verify_batch(out, check_signature=False)
            self.assertEqual(res["capsules"], 2)
            # must-fail control: one altered byte in a capsule breaks verification
            p = out / "capsules.jsonl.gz"
            lines = gzip.open(p, "rb").read().replace(b"TOOLS_REMOVED", b"TOOLS_REMOVEX")
            with open(p, "wb") as fh, gzip.GzipFile(filename="", mode="wb", fileobj=fh, mtime=0) as g:
                g.write(lines)
            with self.assertRaises(AssertionError):
                v.verify_batch(out, check_signature=False)

    def test_capsule_is_deterministic(self):
        a, b = obs(row(E, BASE)), obs(row(E, BASE[:1]))
        c1 = td.capsule_for(E, a, b, {"t1": ["1" * 64], "t2": ["2" * 64]})
        c2 = td.capsule_for(E, a, b, {"t1": ["1" * 64], "t2": ["2" * 64]})
        self.assertEqual(c1["capsule_id"], c2["capsule_id"])
        self.assertIsNone(v.jcs_divergence(c1))


if __name__ == "__main__":
    unittest.main()
