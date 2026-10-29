"""Synthetic worked example for the existing SAFE #23 discussion.

No model, network, payment, external action or real incident is involved.
The example demonstrates accounting and input/label binding only. It is not a
SAFE schema, detector-performance claim, conformance suite or deployed control.
"""
from __future__ import annotations

import hashlib
import json
import platform
import unicodedata
import unittest
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
VERSION = "0.2.0-synthetic"
RULE_CONFIG = {
    "id": "SYNTHETIC-STRING-RULE-01", "version": "0.1.0-synthetic",
    "matching": "Unicode casefold then literal substring",
    "phrase": "send to external", "timeout_precedes_missing_input": True,
}
REPRESENTATION = {
    "name": "csoai.safe23-example-json", "version": "1",
    "encoding": "UTF-8", "ensure_ascii": True, "sort_keys": True,
    "separators": [",", ":"], "corpus_order": "ascending unique row id",
    "bound_fields": ["id", "input", "reference_label", "fixture_timeout"],
    "RFC8785_compliance_claim": False,
}


def digest(value: Any) -> str:
    """Example-only representation, not a claim of general RFC 8785 compliance."""
    raw = json.dumps(value, ensure_ascii=True, sort_keys=True,
                     separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def load_rows(text: str) -> list[dict[str, Any]]:
    """Reject duplicate JSON fields and non-finite values before interpretation."""
    def unique(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise ValueError("duplicate JSON field")
            obj[key] = value
        return obj
    def invalid_constant(value):
        raise ValueError("non-finite JSON value")
    rows = json.loads(text, object_pairs_hook=unique, parse_constant=invalid_constant)
    validate_rows(rows)
    return rows


def validate_rows(rows: list[dict[str, Any]]) -> None:
    if type(rows) is not list:
        raise ValueError("corpus must be a JSON array")
    if not rows:
        raise ValueError("empty corpus")
    seen: set[str] = set()
    for row in rows:
        if type(row) is not dict:
            raise ValueError("row must be a JSON object")
        if set(row) != {"id", "input", "reference_label", "fixture_timeout"}:
            raise ValueError("unexpected or missing row fields")
        if not isinstance(row["id"], str) or not row["id"] or row["id"] in seen:
            raise ValueError("invalid or duplicate id")
        seen.add(row["id"])
        if row["reference_label"] not in ("positive", "negative"):
            raise ValueError("unrecognised reference label")
        if type(row["fixture_timeout"]) is not bool:
            raise ValueError("timeout control must be Boolean")
        if row["input"] is not None and not isinstance(row["input"], str):
            raise ValueError("input must be text or null")


def corpus_digest(rows: list[dict[str, Any]]) -> str:
    validate_rows(rows)
    # Row identity binds each input to its label. Sorting makes input order
    # irrelevant for this particular declared corpus representation only.
    return digest(sorted(rows, key=lambda r: r["id"]))


def evaluate(row: dict[str, Any]) -> dict[str, Any]:
    if row["fixture_timeout"]:
        return {"id": row["id"], "prediction": None, "outcome": "timeout",
                "evidence_scope": "injected synthetic timeout; no clock timeout occurred"}
    if row["input"] is None:
        return {"id": row["id"], "prediction": None, "outcome": "unusable",
                "evidence_scope": "invented missing input"}
    # Intentionally incomplete toy detector: not suitable for use in security.
    prediction = "positive" if RULE_CONFIG["phrase"] in row["input"].casefold() else "negative"
    outcome = {("positive", "positive"): "TP", ("negative", "negative"): "TN",
               ("positive", "negative"): "FP", ("negative", "positive"): "FN"}[
                   prediction, row["reference_label"]]
    return {"id": row["id"], "prediction": prediction, "outcome": outcome,
            "evidence_scope": "executed toy string rule; author-invented labels"}


def build_result(rows: list[dict[str, Any]]) -> dict[str, Any]:
    validate_rows(rows)
    outputs = [evaluate(row) for row in rows]
    counts = Counter(o["outcome"] for o in outputs)
    scorable = sum(counts[key] for key in ("TP", "TN", "FP", "FN"))
    neg_n = counts["FP"] + counts["TN"]
    pos_n = counts["TP"] + counts["FN"]
    return {
        "status": "SYNTHETIC_LOCAL_EXECUTION_NOT_UPSTREAM_ACCEPTED",
        "scope": "Accounting and label-binding illustration, not performance on real data",
        "corpus_sha256": corpus_digest(rows),
        "source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "declared_representation": "UTF-8 JSON, ASCII escaped, sorted keys and sorted row ids, compact separators",
        "reference_labels": "Invented by the example author, not independently adjudicated",
        "judge_identity": "This local deterministic toy rule; no LLM judge",
        "judge_agreement_with_independent_adjudicator": None,
        "judge_agreement_state": "NOT_MEASURED",
        "taxonomy": {"name": "SYNTHETIC-ONLY", "version": "example-1", "technique": "SYNTHETIC-EXTERNAL-DATA-ACTION"},
        "mode": "local_example_only_not_enforcement",
        "live_observation": False,
        "actual_actions_blocked": None,
        "actual_actions_blocked_state": "NOT_EVALUATED",
        "attempted_examples": len(rows), "scorable_examples": scorable,
        "unscorable_examples": len(rows) - scorable,
        "counts": {k: counts[k] for k in ("TP", "TN", "FP", "FN", "abstain", "error", "timeout", "unusable")},
        "corpus_positive_fraction": sum(r["reference_label"] == "positive" for r in rows) / len(rows),
        "scorable_positive_fraction": pos_n / scorable if scorable else None,
        "false_positive_rate_on_scorable_negatives": {"numerator": counts["FP"], "denominator": neg_n,
                                                     "value": counts["FP"] / neg_n if neg_n else None},
        "true_positive_rate_on_scorable_positives": {"numerator": counts["TP"], "denominator": pos_n,
                                                   "value": counts["TP"] / pos_n if pos_n else None},
        "whole_corpus_performance_claim": None,
        "whole_corpus_performance_state": "NOT_ESTABLISHED",
        "per_case": outputs,
        "limits": ["Eight invented rows are not eight users or incidents",
                   "Timeout is injected, not an observed service timeout",
                   "No independent ground truth, cryptographic signature, runtime effect or SAFE adoption",
                   "No pooled rate across multiple detectors; only one toy rule is present",
                   "None of the unknown fields may be converted to zero or pass"]
    }


def build_card(rows: list[dict[str, Any]], started_at: str, ended_at: str) -> dict[str, Any]:
    """Add the review envelope to the retained eight-row accounting example.

    This is a local proposed representation, not an official SAFE schema. The
    code and configuration bytes identify the loaded toy evaluator; no model or
    detector quality on real traffic is inferred from its synthetic labels.
    """
    start, end = (datetime.fromisoformat(x.replace("Z", "+00:00"))
                  for x in (started_at, ended_at))
    if start.tzinfo is None or end.tzinfo is None or end < start:
        raise ValueError("run timestamps must be timezone-aware and ordered")
    result = build_result(rows)
    rule_digest = digest(RULE_CONFIG)
    evaluator_config = {
        "rule_config_sha256": rule_digest,
        "representation_sha256": digest(REPRESENTATION),
        "unicode_database_version": unicodedata.unidata_version,
        "runtime": platform.python_implementation(),
        "runtime_version": platform.python_version(),
        "timeout": "injected fixture flag, not elapsed time",
        "unusable": "missing input, not a negative prediction",
    }
    config_digest = digest(evaluator_config)
    result.update({
        "profile": "csoai.safe23-synthetic-envelope/0.2",
        "rule": {**RULE_CONFIG, "configuration_sha256": rule_digest,
                 "implementation_sha256": result["source_sha256"]},
        "evaluator": {"id": "csoai-safe23-toy-evaluator", "version": VERSION,
                      "source_sha256": result["source_sha256"],
                      "configuration": evaluator_config,
                      "configuration_sha256": config_digest},
        "normalization": {**REPRESENTATION, "configuration_sha256": digest(REPRESENTATION)},
        "corpus": {"id": "CSOAI-SAFE23-EIGHT-INVENTED-ROWS", "version": "2026-10-15",
                   "bound_records_sha256": result["corpus_sha256"],
                   "label_provenance": "Invented author labels; no independent reference adjudication",
                   "association": "Each unique row id binds its input, reference label and fixture flag"},
        "observation_window": {"started_at": started_at, "ended_at": ended_at,
                               "basis": "local evaluator wall clock; not independently witnessed"},
        "evaluation_unit": "one invented row",
        "population": {"attempted": len(rows), "scored": result["scorable_examples"],
                       "excluded": result["unscorable_examples"],
                       "admission": "Only TP/TN/FP/FN rows enter scored rates; timeout and unusable excluded"},
        "adjudicator": {"identity": "same deterministic toy string rule", "version": VERSION,
                        "configuration_sha256": config_digest,
                        "independent_agreement": None, "agreement_state": "NOT_MEASURED",
                        "reference_labels": "author-invented, not an independent ground-truth sample"},
        "run_kind": "LOCAL_SYNTHETIC_REPLAY", "execution_mode": "OFFLINE_MONITOR_ONLY",
        "observed_or_blocked": {"observed": "toy rule outputs only", "real_actions": "NOT_RUN",
                                "real_actions_blocked": None},
        "multiple_rule_semantics": "One rule only; no overlap/union aggregation is performed",
        "evidence_accounting": {"malformed": 0, "dropped": 0, "not_reached": 0,
                                "unusable": result["counts"]["unusable"],
                                "basis": "this strict local reader admitted all eight rows; not a transport-loss measurement"},
        "dependencies": {"third_party": [], "runtime": evaluator_config["runtime"],
                         "runtime_version": evaluator_config["runtime_version"]},
    })
    # Deterministic correlation joins one run configuration to each input/label
    # association. It is an identifier, never a signature or authority token.
    run_ref = "synthetic-run:" + digest({"corpus": result["corpus_sha256"],
        "source": result["source_sha256"], "config": config_digest,
        "started_at": started_at, "ended_at": ended_at})
    result["correlation_ref"] = run_ref
    for case in result["per_case"]:
        case["observation_ref"] = run_ref + "/" + case["id"]
        case["decision_path"] = "fixture timeout -> missing input -> literal string rule -> author label comparison"
    predicted_positive = result["counts"]["TP"] + result["counts"]["FP"]
    result["precision_on_scorable_predictions"] = {
        "numerator": result["counts"]["TP"], "denominator": predicted_positive,
        "value": result["counts"]["TP"] / predicted_positive if predicted_positive else None}
    return result


def run_card(rows: list[dict[str, Any]]) -> dict[str, Any]:
    start = datetime.now(timezone.utc).isoformat()
    # Execute inside the measured local wall-clock window, then retain that
    # result; do not silently re-run after choosing the end timestamp.
    result = build_card(rows, start, start)
    end = datetime.now(timezone.utc).isoformat()
    result["observation_window"]["ended_at"] = end
    # Bind correlation to the final recorded window without rerunning the rule.
    run_ref = "synthetic-run:" + digest({"corpus": result["corpus_sha256"],
        "source": result["source_sha256"],
        "config": result["evaluator"]["configuration_sha256"],
        "started_at": start, "ended_at": end})
    result["correlation_ref"] = run_ref
    for case in result["per_case"]:
        case["observation_ref"] = run_ref + "/" + case["id"]
    return result


class ExampleAccountingChecks(unittest.TestCase):
    def setUp(self) -> None:
        self.rows = load_rows((HERE / "safe23_synthetic_inputs.json").read_text())

    def test_explicit_accounting(self) -> None:
        r = build_result(self.rows)
        self.assertEqual(r["counts"], {"TP": 2, "TN": 2, "FP": 1, "FN": 1,
                                     "abstain": 0, "error": 0, "timeout": 1, "unusable": 1})
        self.assertEqual((r["attempted_examples"], r["scorable_examples"], r["unscorable_examples"]), (8, 6, 2))
        self.assertEqual(r["false_positive_rate_on_scorable_negatives"]["denominator"], 3)
        self.assertAlmostEqual(r["false_positive_rate_on_scorable_negatives"]["value"], 1 / 3)

    def test_absence_is_not_success(self) -> None:
        r = build_result(self.rows)
        self.assertIsNone(r["judge_agreement_with_independent_adjudicator"])
        self.assertIsNone(r["actual_actions_blocked"])
        self.assertIsNone(r["whole_corpus_performance_claim"])
        self.assertEqual([o["prediction"] for o in r["per_case"][-2:]], [None, None])

    def test_input_label_association_is_bound(self) -> None:
        baseline = corpus_digest(self.rows)
        mutated = json.loads(json.dumps(self.rows))
        mutated[0]["reference_label"] = "negative"
        self.assertNotEqual(baseline, corpus_digest(mutated))
        swapped = json.loads(json.dumps(self.rows))
        swapped[0]["reference_label"], swapped[2]["reference_label"] = swapped[2]["reference_label"], swapped[0]["reference_label"]
        self.assertEqual(Counter(r["reference_label"] for r in self.rows), Counter(r["reference_label"] for r in swapped))
        self.assertNotEqual(baseline, corpus_digest(swapped))
        self.assertEqual(baseline, corpus_digest(list(reversed(self.rows))))

    def test_invalid_input_not_a_result(self) -> None:
        invalid = json.loads(json.dumps(self.rows))
        invalid[1]["id"] = invalid[0]["id"]
        with self.assertRaises(ValueError):
            build_result(invalid)
        with self.assertRaises(ValueError):
            build_result([])


class DeeperInputAndAccountingChecks(unittest.TestCase):
    def setUp(self):
        self.rows = load_rows((HERE / "safe23_synthetic_inputs.json").read_text())

    def test_duplicate_json_fields_refused(self):
        with self.assertRaises(ValueError):
            load_rows('[{"id":"a","id":"b","input":"x","reference_label":"negative","fixture_timeout":false}]')

    def test_nonfinite_json_refused(self):
        with self.assertRaises(ValueError):
            load_rows('[{"id":"a","input":NaN,"reference_label":"negative","fixture_timeout":false}]')

    def test_wrong_container_types_refused(self):
        for value in (None, True, {}, "rows", 4):
            with self.subTest(value=value), self.assertRaises(ValueError):
                build_result(value)

    def test_wrong_row_types_refused(self):
        for value in (None, True, [], "row"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                build_result([value])

    def test_zero_negative_denominator_is_unknown(self):
        rows = [r for r in self.rows if r["reference_label"] == "positive"]
        rate = build_result(rows)["false_positive_rate_on_scorable_negatives"]
        self.assertEqual(rate["denominator"], 0)
        self.assertIsNone(rate["value"])

    def test_all_unscorable_has_no_invented_rate(self):
        rows = [dict(r, fixture_timeout=True) for r in self.rows]
        result = build_result(rows)
        self.assertEqual(result["scorable_examples"], 0)
        self.assertIsNone(result["scorable_positive_fraction"])
        for key in ("false_positive_rate_on_scorable_negatives", "true_positive_rate_on_scorable_positives"):
            self.assertIsNone(result[key]["value"])
        self.assertEqual(result["counts"]["timeout"], len(rows))

    def test_bad_label_and_boolean_coercion_refused(self):
        for key, value in (("reference_label", True), ("reference_label", "unknown"), ("fixture_timeout", "false"), ("fixture_timeout", 0)):
            changed = [dict(r) for r in self.rows]
            changed[0][key] = value
            with self.subTest(key=key,value=value), self.assertRaises(ValueError):
                build_result(changed)

    def test_extra_fields_and_unpaired_label_permutations(self):
        changed = [dict(r) for r in self.rows]
        changed[0]["unreviewed_success"] = True
        with self.assertRaises(ValueError):
            build_result(changed)
        before = digest([{k:r[k] for k in ("id", "input")} for r in self.rows])
        changed = [dict(r) for r in self.rows]
        changed[0]["reference_label"], changed[2]["reference_label"] = changed[2]["reference_label"], changed[0]["reference_label"]
        self.assertEqual(before, digest([{k:r[k] for k in ("id", "input")} for r in changed]))
        self.assertNotEqual(corpus_digest(self.rows), corpus_digest(changed))


class EnvelopeChecks(unittest.TestCase):
    def setUp(self):
        self.rows = load_rows((HERE / "safe23_synthetic_inputs.json").read_text())
        self.start = "2026-10-29T00:00:00+00:00"
        self.end = "2026-10-29T00:00:01+00:00"

    def test_digests_bind_actual_configuration_and_source(self):
        card = build_card(self.rows, self.start, self.end)
        self.assertEqual(card["rule"]["configuration_sha256"], digest(RULE_CONFIG))
        self.assertEqual(card["evaluator"]["configuration_sha256"], digest(card["evaluator"]["configuration"]))
        self.assertEqual(card["evaluator"]["source_sha256"], hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
        self.assertNotEqual(digest(RULE_CONFIG), digest({**RULE_CONFIG, "phrase": "different"}))

    def test_label_change_and_swap_leave_input_only_digest_unchanged(self):
        before = digest([{k:r[k] for k in ("id", "input")} for r in self.rows])
        original = corpus_digest(self.rows)
        for swap in (False, True):
            rows = json.loads(json.dumps(self.rows))
            if swap:
                rows[0]["reference_label"], rows[2]["reference_label"] = rows[2]["reference_label"], rows[0]["reference_label"]
                self.assertEqual(Counter(r["reference_label"] for r in rows), Counter(r["reference_label"] for r in self.rows))
            else:
                rows[0]["reference_label"] = "negative"
            self.assertEqual(before, digest([{k:r[k] for k in ("id", "input")} for r in rows]))
            self.assertNotEqual(original, corpus_digest(rows))

    def test_declared_formatting_rule(self):
        compact = json.dumps(self.rows, separators=(",", ":"))
        formatted = json.dumps(self.rows, indent=4, sort_keys=True)
        self.assertNotEqual(hashlib.sha256(compact.encode()).hexdigest(), hashlib.sha256(formatted.encode()).hexdigest())
        self.assertEqual(corpus_digest(load_rows(compact)), corpus_digest(load_rows(formatted)))

    def test_unknown_adjudicator_and_no_enforcement_claim(self):
        c = build_card(self.rows, self.start, self.end)
        self.assertEqual(c["adjudicator"]["agreement_state"], "NOT_MEASURED")
        self.assertIsNone(c["adjudicator"]["independent_agreement"])
        self.assertIsNone(c["observed_or_blocked"]["real_actions_blocked"])
        self.assertEqual(c["execution_mode"], "OFFLINE_MONITOR_ONLY")

    def test_all_cases_correlate_without_duplicate_identity(self):
        c = build_card(self.rows, self.start, self.end)
        self.assertEqual(len({x["observation_ref"] for x in c["per_case"]}), len(self.rows))
        self.assertTrue(all(x["observation_ref"].startswith(c["correlation_ref"] + "/") for x in c["per_case"]))
        changed = build_card(self.rows, self.start, "2026-10-29T00:00:02+00:00")
        self.assertNotEqual(c["correlation_ref"], changed["correlation_ref"])

    def test_unknown_outcomes_never_enter_precision(self):
        c = build_card(self.rows, self.start, self.end)
        self.assertEqual(c["population"], {"attempted":8,"scored":6,"excluded":2,
            "admission":"Only TP/TN/FP/FN rows enter scored rates; timeout and unusable excluded"})
        self.assertEqual(c["precision_on_scorable_predictions"], {"numerator":2,"denominator":3,"value":2/3})
        empty = build_card([dict(r, fixture_timeout=True) for r in self.rows], self.start, self.end)
        self.assertIsNone(empty["precision_on_scorable_predictions"]["value"])

    def test_unordered_or_naive_window_rejected(self):
        for start,end in ((self.end,self.start),("2026-10-29T00:00:00", "2026-10-29T00:00:01")):
            with self.subTest(start=start), self.assertRaises(ValueError):
                build_card(self.rows,start,end)

    def test_emit_executes_each_case_once(self):
        from unittest.mock import patch
        with patch(__name__ + ".evaluate", wraps=evaluate) as observed:
            c = run_card(self.rows)
        self.assertEqual(observed.call_count, len(self.rows))
        window=c["observation_window"]
        self.assertLessEqual(datetime.fromisoformat(window["started_at"]), datetime.fromisoformat(window["ended_at"]))


if __name__ == "__main__":
    import sys
    if sys.argv[1:] == ["--emit"]:
        print(json.dumps(run_card(load_rows((HERE / "safe23_synthetic_inputs.json").read_text())), indent=2, allow_nan=False))
    else:
        unittest.main()
