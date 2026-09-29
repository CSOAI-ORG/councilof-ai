#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Tests for translate.py, roundtrip.py and ocsf_observer.py.   CEDAR=/path/to/cedar python3 test_translate.py

The Cedar tests need the `cedar` CLI (cedar-policy-cli). Without it they are skipped, and the committed
out/roundtrip-summary.json records the last run that had it.

Must-catch: an unknown field is never translated to an allow. It becomes UNCHECKABLE. The mutation test
turns that protection off on purpose and requires this suite to notice.
"""
import copy
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import translate as T  # noqa: E402
import roundtrip as R  # noqa: E402
import ocsf_observer as O  # noqa: E402

A = T.A
FX = os.path.join(HERE, "fixtures")
ADAPTER = os.path.join(HERE, "..", "openshell-adapter")
CEDAR = R.find_cedar()
POLICIES = {
    "allow": os.path.join(FX, "allow.yaml"),
    "deny": os.path.join(FX, "deny.yaml"),
    "conditional": os.path.join(FX, "conditional.yaml"),
    "unknown-field": os.path.join(FX, "unknown-field.yaml"),
    "unknown-top-level": os.path.join(FX, "unknown-top-level.yaml"),
    "adapter-capture-2026-09-28": os.path.join(ADAPTER, "capture-2026-09-28", "policy.yaml"),
    "adapter-must-fail-deny-declared-egress": os.path.join(ADAPTER, "fixtures", "must-fail-deny-declared-egress", "policy.yaml"),
    "adapter-must-fail-file-syscall": os.path.join(ADAPTER, "fixtures", "must-fail-file-syscall", "policy.yaml"),
    "adapter-must-fail-landlock-degraded": os.path.join(ADAPTER, "fixtures", "must-fail-landlock-degraded", "policy.yaml"),
}
_POLICY_RE = re.compile(r'@id\("(?P<id>[^"]+)"\)\n@source\("(?P<src>[^"]+)"\)\n(?:@note\([^\n]*\)\n)?(?P<eff>permit|forbid) ')


def policies_of(cedar_text):
    return [m.groupdict() for m in _POLICY_RE.finditer(cedar_text)]


def unknown_field_sources(doc):
    """Independently of translate.py: every element that carries a field OpenShell does not define."""
    out = []
    if set(doc) - A.TOP_LEVEL_FIELDS:
        out.append("")  # the whole policy
    for key, rule in (doc.get("network_policies") or {}).items():
        if set(rule) - A.RULE_FIELDS:
            out.append(f"network_policies.{key}")
        for i, ep in enumerate(rule.get("endpoints") or []):
            if set(ep) - A.ENDPOINT_FIELDS:
                out.append(f"network_policies.{key}.endpoints[{i}]")
    return out


def permits_from_unknown(doc, cedar_text):
    bad = []
    srcs = unknown_field_sources(doc)
    for p in policies_of(cedar_text):
        if p["eff"] != "permit":
            continue
        for s in srcs:
            if s == "" or p["src"] == s or p["src"].startswith(s + ".") or p["src"].startswith(s + "["):
                bad.append((p["id"], p["src"]))
    return bad


class Translation(unittest.TestCase):
    def test_every_policy_has_unique_id_and_resolvable_source(self):
        for name, path in POLICIES.items():
            doc = T.load(path)
            text, rep = T.translate(doc)
            ps = policies_of(text)
            self.assertEqual(len(ps), rep["counts"]["policies"], name)
            self.assertEqual(len({p["id"] for p in ps}), len(ps), name)
            for p in ps:
                src = p["src"]
                if src.startswith("network_policies."):
                    key = src.split(".")[1].split("[")[0]
                    self.assertIn(key, doc["network_policies"], (name, src))

    def test_every_endpoint_is_accounted_for(self):
        """Structural round trip: each endpoint of the YAML is either the source of Cedar policies or an
        UNCHECKABLE element of the report; nothing is silently dropped."""
        for name, path in POLICIES.items():
            doc = T.load(path)
            text, rep = T.translate(doc)
            if any(e["source"] == "policy" for e in rep["elements"]):
                continue
            srcs = {p["src"] for p in policies_of(text)} | {e["source"] for e in rep["elements"]}
            for key, rule in (doc.get("network_policies") or {}).items():
                for i, _ep in enumerate(rule.get("endpoints") or []):
                    s = f"network_policies.{key}.endpoints[{i}]"
                    self.assertTrue(any(x == s or x.startswith(s + ".") or x == f"network_policies.{key}" or
                                        x == f"network_policies.{key}.binaries" for x in srcs), (name, s))

    def test_unknown_field_is_never_an_allow(self):
        doc = T.load(POLICIES["unknown-field"])
        text, rep = T.translate(doc)
        self.assertEqual(rep["status"], T.UNCHECKABLE)
        self.assertEqual(permits_from_unknown(doc, text), [])
        reasons = {e["source"]: e.get("reason", "") for e in rep["elements"] if e["status"] == T.UNCHECKABLE}
        self.assertIn("UNKNOWN_FIELD", reasons["network_policies.looks_permissive.endpoints[0]"])
        self.assertIn("KNOWN_FIELD_NOT_MODELLED", reasons["network_policies.looks_permissive.endpoints[1]"])
        self.assertIn("UNKNOWN_FIELD", reasons["network_policies.ranked"])
        # control: the ordinary rule next to them is still translated, so "deny everything" cannot pass
        self.assertTrue(any(p["src"] == "network_policies.ordinary.endpoints[0]" and p["eff"] == "permit"
                            for p in policies_of(text)))

    def test_unknown_top_level_field_emits_no_permit(self):
        doc = T.load(POLICIES["unknown-top-level"])
        text, rep = T.translate(doc)
        self.assertEqual([p for p in policies_of(text) if p["eff"] == "permit"], [])
        self.assertEqual(rep["status"], T.UNCHECKABLE)

    def test_mutation_is_caught(self):
        """Turn the protection off (treat the unknown fields as modelled): the check above must fail."""
        saved = (T.MODELLED_ENDPOINT_FIELDS, T.MODELLED_RULE_FIELDS, A.ENDPOINT_FIELDS)
        try:
            T.MODELLED_ENDPOINT_FIELDS = saved[0] | {"allow_every_path", "tls"}
            T.MODELLED_RULE_FIELDS = saved[1] | {"priority"}
            A.ENDPOINT_FIELDS = saved[2] | {"allow_every_path"}
            doc = T.load(POLICIES["unknown-field"])
            text, _rep = T.translate(doc)
        finally:
            T.MODELLED_ENDPOINT_FIELDS, T.MODELLED_RULE_FIELDS, A.ENDPOINT_FIELDS = saved
        self.assertNotEqual(permits_from_unknown(doc, text), [], "the mutant was not caught")

    def test_audit_rest_endpoint_is_uncheckable_and_keeps_its_forbid(self):
        doc = T.load(POLICIES["adapter-capture-2026-09-28"])
        text, rep = T.translate(doc)
        e = next(x for x in rep["elements"] if x["source"] == "network_policies.example_audit.endpoints[0]")
        self.assertEqual(e["status"], T.UNCHECKABLE)
        self.assertIn("AUDIT_MODE", e["reason"])
        self.assertTrue(any(p["eff"] == "forbid" and p["src"].startswith("network_policies.example_audit.endpoints[0].deny_rules")
                            for p in policies_of(text)))

    def test_committed_outputs_are_current(self):
        out = os.path.join(HERE, "out")
        for name, path in POLICIES.items():
            with tempfile.TemporaryDirectory() as d:
                p = subprocess.run([sys.executable, os.path.join(HERE, "translate.py"), path, "--out", d, "--name", name],
                                   capture_output=True, text=True)
                self.assertIn(p.returncode, (0, 3), p.stderr)
                for ext in (".cedar", ".report.json"):
                    with open(os.path.join(d, name + ext), "rb") as a, open(os.path.join(out, name + ext), "rb") as b:
                        self.assertEqual(a.read(), b.read(), f"out/{name}{ext} is stale; regenerate (README)")
                with open(os.path.join(d, "openshell.cedarschema"), "rb") as a, \
                        open(os.path.join(out, "openshell.cedarschema"), "rb") as b:
                    self.assertEqual(a.read(), b.read())


@unittest.skipUnless(CEDAR, "cedar CLI not found (set CEDAR)")
class CedarRoundTrip(unittest.TestCase):
    results = {}

    @classmethod
    def setUpClass(cls):
        for name, path in POLICIES.items():
            with tempfile.TemporaryDirectory() as d:
                cls.results[name] = R.run(T.load(path), CEDAR, d)

    def test_cedar_validate_passes_on_all_generated_policies(self):
        for name, res in self.results.items():
            self.assertTrue(res["validate_ok"], (name, res["validate_log"]))

    def test_no_over_allow_anywhere(self):
        for name, res in self.results.items():
            over = [r for r in res["rows"] if r["class"] == "OVER_ALLOW"]
            self.assertEqual(over, [], name)

    def test_no_unexplained_under_allow(self):
        for name, res in self.results.items():
            under = [r for r in res["rows"] if r["class"] == "UNDER_ALLOW"]
            self.assertEqual(under, [], name)

    def test_fully_translated_policies_agree_exactly(self):
        for name, res in self.results.items():
            if res["report"]["status"] == T.TRANSLATED:
                self.assertEqual(set(res["counts"]), {"AGREE"}, (name, res["counts"]))

    def test_unknown_field_hosts_are_denied_by_cedar(self):
        rows = self.results["unknown-field"]["rows"]
        for h in ("files.example.com", "tls.example.com", "ranked.example.com"):
            got = {r["cedar"] for r in rows if r.get("host") == h}
            self.assertEqual(got, {"DENY"}, h)
        ok = [r for r in rows if r.get("host") == "ok.example.com" and r["action"] == "connect"
              and r["binary"] == "/usr/bin/curl" and r["port"] == 443]
        self.assertEqual({r["cedar"] for r in ok}, {"ALLOW"})

    def test_the_grid_is_not_trivial(self):
        for name, res in self.results.items():
            if name == "unknown-top-level":
                continue
            self.assertIn("ALLOW", {r["cedar"] for r in res["rows"]}, name)
            self.assertIn("DENY", {r["cedar"] for r in res["rows"]}, name)

    def test_mutant_is_caught_by_cedar_decisions(self):
        saved = (T.MODELLED_ENDPOINT_FIELDS, A.ENDPOINT_FIELDS)
        try:
            T.MODELLED_ENDPOINT_FIELDS = saved[0] | {"allow_every_path"}
            A.ENDPOINT_FIELDS = saved[1] | {"allow_every_path"}
            doc = T.load(POLICIES["unknown-field"])
            text, rep = T.translate(doc)
        finally:
            T.MODELLED_ENDPOINT_FIELDS, A.ENDPOINT_FIELDS = saved
        with tempfile.TemporaryDirectory() as d:
            res = R.run(doc, CEDAR, d, text, rep)
        leaked = [r for r in res["rows"] if r.get("host") == "files.example.com" and r["cedar"] == "ALLOW"]
        self.assertNotEqual(leaked, [], "a translator that ignores unknown fields must be visible in the decisions")


class Observer(unittest.TestCase):
    def test_upstream_doc_examples(self):
        rec = O.observe([os.path.join(FX, "ocsf-doc-examples.jsonl")])
        self.assertEqual(rec["gspc"]["status"], "MEASURED")
        self.assertEqual(rec["inputs"]["records_parsed"], 2)
        self.assertEqual(rec["counts"]["traffic_by_action"], {"ALLOWED": 1, "DENIED": 1})
        self.assertEqual(rec["inputs"]["ocsf_versions_seen"], ["1.8.0"])
        self.assertIsNone(rec["gspc"]["board_slot"])
        self.assertEqual(rec["evidence_class"], "ENFORCER_SELF_REPORT")

    def test_capture_shows_the_audit_passthrough_without_a_witness(self):
        d = os.path.join(ADAPTER, "capture-2026-09-28")
        rec = O.observe([os.path.join(d, "enforcer.log")], os.path.join(d, "policy.yaml"))
        noted = [e for e in rec["events"] if e.get("note")]
        self.assertEqual([(e["host"], e["class"]) for e in noted], [("example.com", "HTTP Activity")])
        self.assertEqual(rec["counts"]["declared_deny_recorded_allowed"], 1)

    def test_empty_is_unmeasured(self):
        with tempfile.NamedTemporaryFile("w", suffix=".log", delete=False) as fh:
            fh.write("INFO nothing that is an OCSF record\n")
        try:
            rec = O.observe([fh.name])
        finally:
            os.unlink(fh.name)
        self.assertEqual(rec["gspc"]["status"], "UNMEASURED")
        self.assertEqual(rec["inputs"]["lines_not_parsed"], 1)

    def test_downgraded_record_is_flagged(self):
        line = json.dumps({"class_uid": 4001, "action": "Denied", "time": 1, "dst_endpoint": {"domain": "x.example", "port": 443},
                           "metadata": {"version": "1.1.0"}, "unmapped": {"downgraded_from": "1.8.0"}})
        with tempfile.NamedTemporaryFile("w", suffix=".log", delete=False) as fh:
            fh.write(line + "\n")
        try:
            rec = O.observe([fh.name])
        finally:
            os.unlink(fh.name)
        self.assertEqual(rec["inputs"]["downgraded_records"], 1)
        self.assertIn("downgraded exports drop fields", rec["gspc"]["limits"])


def _staged(root):
    """package/src, package/build and package/dist are build copies of files checked elsewhere."""
    rel = os.path.relpath(root, HERE).split(os.sep)
    return rel[:1] == ["package"] and len(rel) > 1 and rel[1] in ("src", "build", "dist")


class Hygiene(unittest.TestCase):
    ALLOWED = re.compile(r"github\.com/NVIDIA/OpenShell|NVIDIA/OpenShell|published by NVIDIA|not an NVIDIA integration|"
                         r"not affiliated with(?: or endorsed by)? NVIDIA|NVIDIA's", re.I)
    VERBATIM = {"ocsf-doc-examples.jsonl"}  # upstream example records, quoted byte for byte (see SOURCES.md)

    def test_vendor_name_only_in_factual_contexts(self):
        bad = []
        for root, _d, files in os.walk(HERE):
            if _staged(root):
                continue
            for f in files:
                if f in self.VERBATIM or f == "test_translate.py" or not f.endswith(
                        (".md", ".py", ".yaml", ".json", ".jsonl", ".cedar", ".toml", ".txt")):
                    continue
                with open(os.path.join(root, f), encoding="utf-8", errors="replace") as fh:
                    for i, line in enumerate(fh, 1):
                        if re.search(r"nvidia", line, re.I) and not self.ALLOWED.search(line):
                            bad.append(f"{f}:{i}: {line.strip()[:100]}")
        self.assertEqual(bad, [])

    def test_no_grade_words(self):
        words = re.compile(r"\bcertif(y|ied|ication)\b|\bcompliant\b|\bendorse[ds]? by (?!NVIDIA)|\bapproved\b", re.I)
        bad = []
        for root, _d, files in os.walk(HERE):
            if _staged(root):
                continue
            for f in files:
                if f == "test_translate.py" or not f.endswith((".md", ".py", ".json", ".toml")):
                    continue
                with open(os.path.join(root, f), encoding="utf-8", errors="replace") as fh:
                    for i, line in enumerate(fh, 1):
                        negated = re.search(r"\b(not|never|nothing)\b[^.]*\b(certif|compliant|approved)", line, re.I)
                        if words.search(line) and not negated:
                            bad.append(f"{f}:{i}: {line.strip()[:100]}")
        self.assertEqual(bad, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
