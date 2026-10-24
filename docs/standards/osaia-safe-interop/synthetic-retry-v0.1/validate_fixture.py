"""Local structural checks for the synthetic retry fixture. Standard library only.

Run:  python3 validate_fixture.py

These checks look at linkage inside three synthetic JSON files. They run no SAFE-GALC verifier, check no
signature, and say nothing about any real system.

Changed on 2026-10-13. The first version of check() accepted a correction (F2) whose basis lacked the
receipt or the sink record, because it only tested basis entries that were already named RCPT1 or SINK1.
A correction to "observed" resting on two observations alone therefore passed. check() now derives the
required effect evidence from the declared context and requires it in the basis, declared available.
"""
import json
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load(name):
    return json.loads((HERE / name).read_text(encoding="utf-8"))


def need(condition, message):
    if not condition:
        raise AssertionError(message)


def by_id(items, what):
    ids = [item.get("id") for item in items]
    need(len(set(ids)) == len(ids) and None not in ids, "duplicate or missing id in " + what)
    return {item["id"]: item for item in items}


def required_effect_evidence(context):
    """Evidence a finding needs before it may say an effect was observed.

    Read from the declared context, never from the finding: for each provider operation, every sink record
    it names in effect_refs, plus every receipt that names that operation and one of those sink records.
    """
    evidence = by_id(context["evidence"], "context evidence")
    required = set()
    for op in context["provider_operations"]:
        sinks = set(op.get("effect_refs", []))
        need(sinks, "provider operation %s declares no effect record" % op.get("id"))
        receipts = {
            item["id"] for item in evidence.values()
            if item.get("operation_id") == op["id"] and item.get("effect_ref") in sinks
        }
        need(receipts, "no receipt in the context names operation %s and its effect record" % op["id"])
        required |= sinks | receipts
    absent = sorted(required - set(evidence))
    need(not absent, "effect record %s is named but not in the context evidence" % ", ".join(absent))
    return required


def check(a, c, e):
    attempts = by_id(a.get("attempts", []), "attempts")
    observations = by_id(a.get("observations", []), "observations")
    findings = by_id(a.get("findings", []), "findings")
    operations = by_id(c.get("provider_operations", []), "provider operations")
    evidence = by_id(c.get("evidence", []), "context evidence")

    # Counts are compared with the separate expected-output file.
    need(len(attempts) == e["attempts"], "attempt count differs from expected output")
    need(len(observations) == e["observations"], "observation count differs from expected output")
    need(len(operations) == e["provider_operations"], "provider operation count differs from expected output")
    need(e["logical_actions"] == 1, "this fixture models one logical action")

    # One logical action; every attempt belongs to it; every observation belongs to a known attempt.
    action = a["logical_action"]
    need(all(t.get("action_id") == action["id"] for t in attempts.values()), "attempt outside the logical action")
    need(all(o.get("attempt_id") in attempts for o in observations.values()), "observation without a known attempt")
    need(all(o.get("evidence_ref") in evidence for o in observations.values()), "observation evidence not in context")

    # Provider operations come from the declared context. An attempt may only name one that is declared there,
    # and a declared operation must carry the logical action's idempotency key.
    named = {t["provider_operation_id"] for t in attempts.values() if t.get("provider_operation_id") is not None}
    named |= {o["provider_operation_id"] for o in observations.values() if o.get("provider_operation_id") is not None}
    need(named <= set(operations), "attempt or observation names an undeclared provider operation")
    need(all(op.get("idempotency_key") == action.get("idempotency_key") for op in operations.values()),
         "provider operation carries a different idempotency key")
    effects = {ref for op in operations.values() for ref in op.get("effect_refs", [])}
    need(len(effects) == e["synthetic_effects"], "effect count differs from expected output")

    # The early finding is kept as it was.
    early = findings.get(e["early_finding"]["id"])
    need(early is not None and e["early_finding"]["retained"] is True, "early finding is not retained")
    need(early.get("external_effect_status") == e["early_finding"]["status"] == "unknown",
         "early finding status was rewritten")
    need(early.get("supersedes") is None, "early finding must not supersede anything")

    # The correction names what it supersedes and matches the expected output.
    correction = findings.get(e["correction"]["id"])
    need(correction is not None, "correction finding is missing")
    need(correction.get("supersedes") == e["correction"]["supersedes"] == early["id"],
         "correction does not name the early finding in supersedes")
    need(correction.get("external_effect_status") == e["correction"]["status"],
         "correction status differs from expected output")

    # Every basis entry must resolve to an observation in the input or an evidence item in the context.
    for finding in findings.values():
        need(isinstance(finding.get("basis"), list), "finding %s has no basis list" % finding["id"])
        for ref in finding["basis"]:
            need(ref in observations or ref in evidence, "finding %s cites unknown basis %s" % (finding["id"], ref))

    # The defect fixed on 2026-10-13: a finding that says "observed" needs the declared effect evidence
    # (receipt and sink record) in its own basis, and that evidence must be declared available.
    # Observations alone are not enough, however many there are.
    required = required_effect_evidence(c)
    for finding in findings.values():
        if finding.get("external_effect_status") != "observed":
            continue
        missing = sorted(required - set(finding["basis"]))
        need(not missing, "finding %s says observed but its basis lacks %s" % (finding["id"], ", ".join(missing)))
        unavailable = sorted(ref for ref in required if evidence[ref].get("availability") != "available")
        need(not unavailable,
             "finding %s says observed but %s is not declared available" % (finding["id"], ", ".join(unavailable)))

    need(c["custody"]["external_effect_not_established_by_custody_alone"] is True,
         "custody availability must not stand in for effect observability")
    return True


class Tests(unittest.TestCase):
    def setUp(self):
        self.a = load("scenario-input.json")
        self.c = load("verification-context.json")
        self.e = load("expected-output.json")

    def rejected(self, pattern):
        with self.assertRaisesRegex(AssertionError, pattern):
            check(self.a, self.c, self.e)

    def correction(self):
        return next(f for f in self.a["findings"] if f["id"] == "F2")

    def evidence(self, ref):
        return next(x for x in self.c["evidence"] if x["id"] == ref)

    # --- the four checks carried over from the first version ---------------------------------------------
    def test_links_and_correction(self):
        self.assertTrue(check(self.a, self.c, self.e))

    def test_cannot_infer_two_executions(self):
        self.c["provider_operations"].append(dict(self.c["provider_operations"][0], id="OP2"))
        self.rejected("provider operation count")

    def test_missing_effect_receipt(self):
        self.c["evidence"] = [v for v in self.c["evidence"] if v["id"] != "RCPT1"]
        self.rejected("observation evidence not in context|no receipt in the context")

    def test_orphaned_observation(self):
        self.a["observations"][0]["attempt_id"] = "NO-SUCH-ATTEMPT"
        self.rejected("observation without a known attempt")

    # --- controls added on 2026-10-13; the first version accepted every one of these tampered fixtures ----
    def test_correction_on_two_observations_only(self):
        self.correction()["basis"] = ["O1", "O2"]
        self.rejected("basis lacks RCPT1, SINK1")

    def test_correction_basis_without_sink_record(self):
        self.correction()["basis"] = ["O1", "O2", "RCPT1"]
        self.rejected("basis lacks SINK1")

    def test_correction_basis_without_receipt(self):
        self.correction()["basis"] = ["O1", "O2", "SINK1"]
        self.rejected("basis lacks RCPT1")

    def test_correction_with_empty_basis(self):
        self.correction()["basis"] = []
        self.rejected("basis lacks RCPT1, SINK1")

    def test_receipt_declared_unavailable(self):
        self.evidence("RCPT1")["availability"] = "unavailable"
        self.rejected("RCPT1 is not declared available")

    def test_sink_record_declared_unavailable(self):
        self.evidence("SINK1")["availability"] = "unavailable"
        self.rejected("SINK1 is not declared available")

    def test_correction_status_differs_from_expected_output(self):
        self.correction()["external_effect_status"] = "not_observed"
        self.rejected("correction status differs")

    def test_basis_cites_unknown_record(self):
        self.correction()["basis"].append("NO-SUCH-RECORD")
        self.rejected("cites unknown basis")

    # --- controls on keeping the early finding; the first version also rejected these --------------------
    def test_early_finding_rewritten(self):
        self.a["findings"][0]["external_effect_status"] = "observed"
        self.rejected("early finding status was rewritten")

    def test_early_finding_deleted(self):
        self.a["findings"] = [f for f in self.a["findings"] if f["id"] != "F1"]
        self.rejected("early finding is not retained")


if __name__ == "__main__":
    unittest.main(verbosity=2)
