"""Local structural checks for the synthetic record and link fixture.

    python3 validate_fixture.py
    GALC_SCHEMA=/path/to/safe-galc-v0.1.schema.json python3 validate_fixture.py    (also runs the schema check)

The checks use the standard library only. One optional check needs the jsonschema package, a date-time format
checker and the candidate schema file; without them it is reported as skipped, NOT_EVALUATED, never as passed.

What is checked: the scenario input carries no verifier output; every record digest is recomputed; every
reference and link carries the digest of the record it names; links have the source and target types of
section 9; the record positions named in record-link-mapping.json exist; every proposed comparison is marked
NOT_EVALUATED. What is not checked: any SAFE-GALC property, any signature, time proof, custody, person or
real system. All records are invented.
"""
import copy
import hashlib
import importlib.util
import json
import os
import re
import unittest
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
U = "urn:example:csoai-synthetic:"
C14N_ID = U + "c14n:json-sorted-keys-compact-utf8:1"
NOT_EVALUATED = "NOT_EVALUATED"
GALC_COMMIT = "b5c12f358fc281fc4beec1528a8db4d125edd879"
GALC_SCHEMA_SHA256 = "cef899e957fd8a62f1538d2aba5cf434e9c6e0dad410bb96d02a8d8c454d08b4"
RECORD_TYPES = {"proposal", "governance_determination", "enforcement_event", "execution_result", "observation",
                "reconciliation_result"}
# Section 9 of the candidate: relation -> (source record types, target record types).
LINK_TYPES = {
    "evaluates": ({"governance_determination"}, {"proposal"}),
    "enforces": ({"enforcement_event"}, {"governance_determination"}),
    "attempts": ({"execution_result"}, {"enforcement_event"}),
    "observes": ({"observation"}, {"execution_result", "proposal"}),
    "reconciles": ({"reconciliation_result"}, RECORD_TYPES),
    "supersedes": (RECORD_TYPES, RECORD_TYPES),
    "transforms": (RECORD_TYPES, RECORD_TYPES),
}
# Identifier prefixes that must resolve to a record or to an item declared in the verification context.
EVIDENCE_PREFIXES = tuple(U + p for p in (
    "record:", "authority:", "policy:", "context:", "revocation:", "state:", "parameters:", "method:", "custody:",
    "identity-binding:"))
SOURCE_PAYLOAD_KEYS = {"id", "external_effect_status", "basis", "supersedes"}


def load(name):
    return json.loads((HERE / name).read_text(encoding="utf-8"))


def load_builder():
    """Load build_scenario.py by path, so this also runs under python -I."""
    spec = importlib.util.spec_from_file_location("build_scenario", str(HERE / "build_scenario.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def digest(value):
    text = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


def need(condition, code, message):
    if not condition:
        raise AssertionError(code + " " + message)


def resolve(document, pointer, code):
    """Follow a JSON Pointer. A pointer that does not resolve is a rejected fixture, not a crash."""
    need(isinstance(pointer, str) and pointer.startswith("/"), code, "bad pointer %r" % (pointer,))
    node = document
    for part in pointer[1:].split("/"):
        part = part.replace("~1", "/").replace("~0", "~")
        if isinstance(node, list):
            need(part.isdigit() and int(part) < len(node), code, "pointer %s does not resolve" % pointer)
            node = node[int(part)]
        else:
            need(isinstance(node, dict) and part in node, code, "pointer %s does not resolve" % pointer)
            node = node[part]
    return node


def walk(node):
    yield node
    if isinstance(node, dict):
        for value in node.values():
            for inner in walk(value):
                yield inner
    elif isinstance(node, list):
        for value in node:
            for inner in walk(value):
                yield inner


def is_ref(node):
    return isinstance(node, dict) and set(node) == {"record_id", "digest"}


def short(record_id):
    return record_id[len(U + "record:"):]


def check(scenario, context, expected, mapping):
    # ---- E: the envelope is a scenario input, with no verifier output -----------------------------------
    need(scenario.get("profile") == "safe-galc" and scenario.get("profile_version") == "0.1", "E1",
         "profile or version differs")
    for field in ("evaluations", "overall_result"):
        need(field not in scenario, "E2", "scenario input carries verifier output %r" % field)
    for field in ("lifecycle_id", "transition_id", "created_at", "producer", "records", "links",
                  "evaluation_contract", "limitations"):
        need(field in scenario, "E3", "envelope lacks %r" % field)
    need(scenario["evaluation_contract"].get("independence", {}).get("status") == "not_claimed", "E4",
         "independence must stay not_claimed; no verifier was run")
    context_ref = scenario.get("extensions", {}).get("csoai_synthetic", {}).get("verification_context_ref", {})
    need(context_ref.get("digest") == digest(context), "E5", "verification context digest differs")

    items = {item["id"]: item for item in context["items"]}
    need(len(items) == len(context["items"]), "E5", "duplicate id in the verification context")

    # ---- D: records, digests and references ------------------------------------------------------------
    records = {r["record_id"]: r for r in scenario["records"]}
    need(len(records) == len(scenario["records"]), "D1", "duplicate record id")
    types = Counter(r["record_type"] for r in records.values())
    need(set(types) == RECORD_TYPES, "D1", "the six record types are not all present, or an unknown type is")
    for rid, record in records.items():
        need(record.get("canonicalization_id") == C14N_ID and record.get("digest_algorithm") == "sha-256", "D2",
             "%s does not declare the fixture digest rule" % short(rid))
        need(record.get("digest") == digest(record["data"]), "D2",
             "%s digest does not match its data" % short(rid))

    def check_ref(ref, where):
        target = ref["record_id"]
        if target in records:
            need(ref["digest"] == records[target]["digest"], "D3", "%s cites a stale digest for %s" % (where, target))
        elif target in items:
            need(ref["digest"] == digest(items[target]), "D3", "%s cites a stale digest for %s" % (where, target))
        else:
            raise AssertionError("D3 %s refers to an unknown record or context item %s" % (where, target))

    for rid, record in records.items():
        for node in walk([record["data"], record.get("supersedes"), record.get("custody")]):
            if is_ref(node):
                check_ref(node, short(rid))

    # State references and parameter digests must be recomputable from operands kept in the context.
    value_digests = {digest(item["value"]) for item in items.values() if "value" in item}
    for rid, record in records.items():
        for node in walk(record["data"]):
            if not isinstance(node, dict):
                continue
            if "id" in node and "digest" in node and str(node["id"]).startswith(U + "state:"):
                need(node["id"] in items and node["digest"] == digest(items[node["id"]].get("value")), "D4",
                     "%s state reference %s does not match the context" % (short(rid), node["id"]))
            for key, value in node.items():
                if key.endswith("parameters_digest"):
                    need(value in value_digests, "D4",
                         "%s %s has no preserved operand in the context" % (short(rid), key))

    # Every evidence-like identifier resolves to a record or a declared context item.
    for rid, record in records.items():
        payload = record.get("extensions", {}).get("csoai_source_payload", {}).get("payload")
        for node in walk([record["data"], payload]):
            if isinstance(node, str) and node.startswith(EVIDENCE_PREFIXES):
                need(node in records or node in items, "D5", "%s cites %s, which is not declared" % (short(rid), node))

    # ---- K: links ---------------------------------------------------------------------------------------
    links = {link["link_id"]: link for link in scenario["links"]}
    need(len(links) == len(scenario["links"]), "K1", "duplicate link id")
    by_relation = {relation: [] for relation in LINK_TYPES}
    for lid, link in links.items():
        need(link.get("relation") in LINK_TYPES, "K1", "%s has an unknown relation" % lid)
        for end in ("source", "target"):
            ref = link[end]
            need(ref["record_id"] in records, "K1", "%s %s is not a record in this envelope" % (lid, end))
            need(ref["digest"] == records[ref["record_id"]]["digest"], "K1",
                 "%s %s digest does not match the record" % (lid, end))
        source, target = records[link["source"]["record_id"]], records[link["target"]["record_id"]]
        allowed_source, allowed_target = LINK_TYPES[link["relation"]]
        need(source["record_type"] in allowed_source and target["record_type"] in allowed_target, "K2",
             "%s joins %s to %s, which %s does not allow" % (lid, source["record_type"], target["record_type"],
                                                            link["relation"]))
        by_relation[link["relation"]].append((source["record_id"], target["record_id"]))

    def targets(relation, source_id):
        return sorted(t for s, t in by_relation[relation] if s == source_id)

    accounted = 0
    for rid, record in records.items():
        data, kind = record["data"], record["record_type"]
        if kind == "governance_determination":
            need(targets("evaluates", rid) == [data["proposal_ref"]["record_id"]], "K3",
                 "%s needs exactly one evaluates link, to the proposal it binds" % short(rid))
            accounted += 1
        elif kind == "enforcement_event":
            need(targets("enforces", rid) == [data["determination_ref"]["record_id"]], "K3",
                 "%s needs exactly one enforces link, to the determination it binds" % short(rid))
            need(data["proposal_ref"] == records[data["determination_ref"]["record_id"]]["data"]["proposal_ref"],
                 "K3", "%s and its determination bind different proposals" % short(rid))
            accounted += 1
        elif kind == "execution_result":
            need(targets("attempts", rid) == [data["enforcement_ref"]["record_id"]], "K3",
                 "%s needs exactly one attempts link, to the enforcement event it binds" % short(rid))
            accounted += 1
        elif kind == "observation":
            need("execution_ref" in data and targets("observes", rid) == [data["execution_ref"]["record_id"]],
                 "K3", "%s needs exactly one observes link, to the execution result it binds" % short(rid))
            accounted += 1
        elif kind == "reconciliation_result":
            compared = sorted(ref["record_id"] for ref in data["record_refs"])
            need(targets("reconciles", rid) == compared, "K3",
                 "%s reconciles links differ from its record_refs" % short(rid))
            accounted += len(compared)
            for ref in data["observed_state_refs"]:
                need(ref["record_id"] in compared and records[ref["record_id"]]["record_type"] == "observation",
                     "K3", "%s observed_state_refs must be observations it also lists in record_refs" % short(rid))
        superseded = record.get("supersedes")
        if superseded is None:
            need(targets("supersedes", rid) == [], "K3", "%s has a supersedes link but no supersedes member" % short(rid))
        else:
            need(targets("supersedes", rid) == [superseded["record_id"]], "K3",
                 "%s supersedes member and link disagree" % short(rid))
            earlier = records[superseded["record_id"]]
            need(earlier["record_type"] == kind and earlier["issued_at"] < record["issued_at"], "K3",
                 "%s must supersede an earlier record of the same type" % short(rid))
            accounted += 1
    need(accounted == len(links) and not by_relation["transforms"], "K3", "a link is not backed by record data")

    def of_type(kind):
        return {rid: r for rid, r in records.items() if r["record_type"] == kind}

    proposals, determinations = of_type("proposal"), of_type("governance_determination")
    enforcements, executions = of_type("enforcement_event"), of_type("execution_result")
    observations, reconciliations = of_type("observation"), of_type("reconciliation_result")

    # ---- S1: the decision is bound to the proposal actually presented; a later decision is a new record --
    need(len(determinations) >= 2, "S1", "the earlier determination must be kept beside the later one")
    windows = sorted((d["data"]["not_before"], d["data"]["not_after"], rid) for rid, d in determinations.items())
    for (start, end, rid) in windows:
        need(start <= end, "S1", "%s has an inverted validity interval" % short(rid))
    for earlier, later in zip(windows, windows[1:]):
        need(earlier[1] < later[0], "S1",
             "validity intervals of %s and %s overlap; a later decision must not extend an earlier window"
             % (short(earlier[2]), short(later[2])))
    need(len({json.dumps(d["data"]["proposal_ref"], sort_keys=True) for d in determinations.values()}) == 1, "S1",
         "the determinations do not bind one and the same proposal identity and digest")
    authority = [frozenset(d["data"]["authority_evidence_refs"]) for d in determinations.values()]
    need(len(set(authority)) == len(authority), "S1", "two determinations rest on the same authority evidence")

    # ---- S2: a denied attempt stays beside a separately authorised later attempt -------------------------
    outcomes = Counter(e["data"]["acceptance_outcome"] for e in enforcements.values())
    need(dict(outcomes) == expected["enforcement_outcomes"], "S2", "enforcement outcomes differ from expected output")
    need(len({e["data"]["determination_ref"]["record_id"] for e in enforcements.values()}) == len(enforcements),
         "S2", "the denied and the later attempt must rest on different determinations")
    for rid, event in enforcements.items():
        data = event["data"]
        bound = determinations[data["determination_ref"]["record_id"]]["data"]
        results = {c["check"]: c for c in data["checks"]}
        need("determination_validity" in results, "S2", "%s records no validity check" % short(rid))
        checked_at = results["determination_validity"]["checked_at"]
        inside = bound["not_before"] <= checked_at <= bound["not_after"]
        if data["acceptance_outcome"] == "accepted":
            need(inside and all(c["result"] == "pass" for c in data["checks"]) and not data["reason_codes"], "S2",
                 "%s is accepted outside the determination's window or with a check that did not pass" % short(rid))
        else:
            need(data["reason_codes"] and any(c["result"] == "fail" for c in data["checks"]), "S2",
                 "%s is not accepted but gives no reason and no failed check" % short(rid))
            if "determination_expired" in data["reason_codes"]:
                need(checked_at > bound["not_after"] and results["determination_validity"]["result"] == "fail",
                     "S2", "%s says expired but was checked inside the window" % short(rid))

    # ---- S3: no execution record is invented for an attempt that was not accepted -------------------------
    invented = [rid for rid, x in executions.items()
                if enforcements[x["data"]["enforcement_ref"]["record_id"]]["data"]["acceptance_outcome"] != "accepted"]
    need(len(invented) == expected["executions_under_a_rejected_enforcement"] == 0, "S3",
         "an execution result hangs off an enforcement event that was not accepted")

    # ---- S4: accepting, attempting and completing stay apart ---------------------------------------------
    side_by_side = expected["three_vocabularies_side_by_side"]
    need({short(rid): x["data"]["result_status"] for rid, x in executions.items()}
         == side_by_side["execution_result_status"], "S4", "execution result_status differs from expected output")
    for rid, execution in executions.items():
        if execution["data"]["result_status"] != "completed":
            need("completed_at" not in execution["data"], "S4",
                 "%s carries a completion time without a completed status" % short(rid))

    # ---- S5: the later human reaction is an observation with provenance, method and limitations ----------
    reactions = {rid: o for rid, o in observations.items() if o["data"]["observer"].get("role") == "affected-party"}
    need(len(reactions) == expected["reaction_observations"], "S5", "reaction observation count differs from expected output")
    for rid, reaction in reactions.items():
        data = reaction["data"]
        need(data["observer"].get("identity_binding_ref") in items, "S5", "%s has no declared identity binding" % short(rid))
        need(data["method"] and data["method_version"] and data["limitations"] and data["independence_basis"], "S5",
             "%s lacks method, limitations or an independence statement" % short(rid))
    reported = {json.dumps(o["data"]["observed_state"], sort_keys=True) for o in reactions.values()}
    need(len(reported) == expected["distinct_reported_states_in_reaction_observations"], "S5",
         "distinct reported states differ from expected output; repeated reports are not distinct states")
    need(len(proposals) == expected["records_by_type"]["proposal"] == 1, "S5",
         "a reaction that asks for a new action would need its own proposal and determination; none is modelled here")

    # ---- S6: the correction names what it supersedes and keeps it, with every observation ----------------
    superseding = {rid: r for rid, r in reconciliations.items() if "supersedes" in r}
    need(sorted(r["supersedes"]["record_id"] for r in superseding.values()) == sorted(expected["superseded_records_retained"]),
         "S6", "superseded reconciliation records differ from expected output")
    for rid, later in superseding.items():
        earlier = records[later["supersedes"]["record_id"]]
        kept = {ref["record_id"] for ref in later["data"]["record_refs"]}
        need({ref["record_id"] for ref in earlier["data"]["record_refs"]} <= kept, "S6",
             "%s drops evidence that the superseded record compared" % short(rid))
    latest = max(reconciliations.values(), key=lambda r: r["issued_at"])
    need(set(observations) <= {ref["record_id"] for ref in latest["data"]["record_refs"]}, "S6",
         "the latest reconciliation does not reference every observation")

    # ---- S7: external_effect_status stays in its schema-identified source payload ------------------------
    findings = {}
    for rid, record in reconciliations.items():
        source = record.get("extensions", {}).get("csoai_source_payload")
        need(isinstance(source, dict) and source.get("schema_id") and source.get("canonicalization_id") == C14N_ID,
             "S7", "%s lacks a schema-identified source payload" % short(rid))
        payload = source.get("payload")
        need(isinstance(payload, dict) and set(payload) == SOURCE_PAYLOAD_KEYS and source.get("digest") == digest(payload),
             "S7", "%s source payload is altered or its digest is stale" % short(rid))
        findings[rid] = payload
    for record in records.values():
        need(not any(isinstance(node, dict) and "external_effect_status" in node for node in walk(record["data"])),
             "S7", "external_effect_status was copied into a GALC data field")
    for rid, record in reconciliations.items():
        previous = findings[record["supersedes"]["record_id"]]["id"] if "supersedes" in record else None
        need(findings[rid]["supersedes"] == previous, "S7", "%s source payload supersedes differs from the record" % short(rid))
    need({f["id"]: f["external_effect_status"] for f in findings.values()} == side_by_side["source_external_effect_status"],
         "S7", "source external_effect_status differs from expected output")
    need({short(rid): r["data"]["result"] for rid, r in reconciliations.items()} == side_by_side["reconciliation_result"],
         "S7", "reconciliation result differs from expected output")

    # ---- S8: containment has a declared method and both operands; unequal digests are present -------------
    unequal = 0
    for rid, event in enforcements.items():
        data = event["data"]
        proposed = proposals[data["proposal_ref"]["record_id"]]["data"]["parameters_digest"]
        if data["acceptance_outcome"] != "accepted" or data["actual_parameters_digest"] == proposed:
            continue
        unequal += 1
        cited = [ref for c in data["checks"] if c["check"] == "scope_containment" for ref in c.get("evidence_refs", [])]
        methods = [ref for ref in cited if items.get(ref, {}).get("kind") == "declared comparison method"]
        operands = {digest(items[ref]["value"]) for ref in cited if "value" in items.get(ref, {})}
        need(methods and {proposed, data["actual_parameters_digest"]} <= operands, "S8",
             "%s accepts unequal parameter digests without a declared method and both operands" % short(rid))
        need(all(items[m].get("run_on_this_fixture") is False for m in methods), "S8",
             "the containment method must be declared as not run on this fixture")
    need(unequal >= 1, "S8", "no accepted attempt carries unequal parameter digests, so containment has nothing to compare")

    # ---- M: the mapping file and the expected output ------------------------------------------------------
    need(mapping.get("status_vocabulary") == [NOT_EVALUATED], "M1", "the mapping must use NOT_EVALUATED only")
    for node in walk(mapping):
        if isinstance(node, dict) and "status" in node:
            need(node["status"] == NOT_EVALUATED, "M1", "%s is marked %r" % (node.get("id"), node["status"]))

    def check_position(entry, code):
        for field in entry["fields"]:
            if "envelope_pointer" in field:
                resolve(scenario, field["envelope_pointer"], code)
            else:
                need(field.get("record_id") in records, code, "%s names an unknown record" % entry["id"])
                resolve(records[field["record_id"]], field["pointer"], code)
        for lid in entry["links"]:
            need(lid in links, code, "%s names an unknown link %s" % (entry["id"], lid))
        for ref in entry["evidence"]:
            need(ref in items, code, "%s names undeclared evidence %s" % (entry["id"], ref))

    comparisons = mapping["proposed_comparisons"]
    need([c["id"] for c in comparisons] == ["C1", "C2", "C3", "C4", "C5", "C6"], "M2", "the six comparisons are not all present")
    part_ids = []
    for comparison in comparisons:
        need(comparison.get("text") and comparison.get("parts"), "M2", "%s has no text or parts" % comparison["id"])
        for part in comparison["parts"]:
            part_ids.append(part["id"])
            need(part["id"].startswith(comparison["id"]) and isinstance(part.get("instantiated"), bool) and part["fields"],
                 "M2", "%s is malformed" % part["id"])
            need(part["instantiated"] or part["gaps"], "M2",
                 "%s is not instantiated and states no gap" % part["id"])
            check_position(part, "M2")
    need(len(set(part_ids)) == len(part_ids), "M2", "duplicate part id")

    positions = mapping["record_positions"]
    need([p["id"] for p in positions] == ["M1", "M2", "M3", "M4", "M5"], "M3", "the five record positions are not all present")
    for position in positions:
        need(position["records"] and all(rid in records for rid in position["records"]), "M3",
             "%s names an unknown record" % position["id"])
        check_position(position, "M3")

    for field in ("evaluations", "overall_result", "semantic_verifier_output"):
        need(field not in expected, "M4", "expected output carries a verifier result %r" % field)
    need(expected["verifier_outputs"]["evaluations"] == expected["verifier_outputs"]["overall_result"] == NOT_EVALUATED,
         "M4", "verifier outputs must be NOT_EVALUATED")
    need(expected["proposed_comparisons"] == {c["id"]: NOT_EVALUATED for c in comparisons}, "M4",
         "expected output and mapping disagree on the comparisons")

    need(dict(types) == expected["records_by_type"], "M5", "record counts differ from expected output")
    need({relation: len(pairs) for relation, pairs in by_relation.items()} == expected["links_by_relation"], "M5",
         "link counts differ from expected output")
    return True


class Tests(unittest.TestCase):
    def setUp(self):
        self.builder = load_builder()
        self.s = load("scenario-input.json")
        self.c = load("verification-context.json")
        self.e = load("expected-output.json")
        self.m = load("record-link-mapping.json")

    # -- helpers ----------------------------------------------------------------------------------------
    def rejected(self, code, rebind=True):
        if rebind:
            self.builder.rebind(self.s, self.c)
        with self.assertRaisesRegex(AssertionError, "^(%s) " % code):
            check(self.s, self.c, self.e, self.m)

    def record(self, name):
        return next(r for r in self.s["records"] if r["record_id"] == U + "record:" + name)

    def ref(self, name):
        record = self.record(name)
        return {"record_id": record["record_id"], "digest": record["digest"]}

    def link(self, name):
        return next(k for k in self.s["links"] if k["link_id"] == U + "link:" + name)

    def drop_record(self, name):
        rid = U + "record:" + name
        self.s["records"] = [r for r in self.s["records"] if r["record_id"] != rid]
        self.s["links"] = [k for k in self.s["links"] if rid not in (k["source"]["record_id"], k["target"]["record_id"])]

    def part(self, pid):
        return next(p for c in self.m["proposed_comparisons"] for p in c["parts"] if p["id"] == pid)

    # -- the fixture as written ---------------------------------------------------------------------------
    def test_fixture_as_written(self):
        self.assertTrue(check(self.s, self.c, self.e, self.m))

    def test_rebind_leaves_the_untouched_fixture_unchanged(self):
        before = copy.deepcopy(self.s)
        self.assertEqual(self.builder.rebind(self.s, self.c), before)

    def test_scenario_input_is_what_the_builder_writes(self):
        self.assertEqual((HERE / "scenario-input.json").read_text(encoding="utf-8"),
                         self.builder.dump(self.builder.build()))

    def test_manifest_lists_every_file_with_its_hash(self):
        listed = dict(reversed(line.split("  ", 1)) for line in
                      (HERE / "MANIFEST.sha256").read_text(encoding="utf-8").splitlines() if line.strip())
        present = {p.name for p in HERE.iterdir() if p.is_file() and p.name != "MANIFEST.sha256"}
        self.assertEqual(set(listed), present)
        for name, value in listed.items():
            self.assertEqual(hashlib.sha256((HERE / name).read_bytes()).hexdigest(), value, name)

    def test_candidate_schema_objects_only_to_the_two_absent_verifier_outputs(self):
        path = os.environ.get("GALC_SCHEMA")
        if not path:
            self.skipTest("NOT_EVALUATED: set GALC_SCHEMA to safe-galc-v0.1.schema.json at commit " + GALC_COMMIT)
        try:
            from jsonschema import Draft202012Validator, FormatChecker
        except ImportError:
            self.skipTest("NOT_EVALUATED: the jsonschema package is not installed")
        raw = Path(path).read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), GALC_SCHEMA_SHA256,
                         "this is not the schema file at commit " + GALC_COMMIT)
        formats = FormatChecker()
        if "date-time" not in formats.checkers or formats.conforms("not-a-date-time", "date-time"):
            self.skipTest("NOT_EVALUATED: no working date-time format checker (install rfc3339-validator)")
        schema = json.loads(raw.decode("utf-8"))
        Draft202012Validator.check_schema(schema)
        validator = Draft202012Validator(schema, format_checker=formats)

        def objections(document):
            return sorted((list(error.absolute_path), error.validator, error.message)
                          for error in validator.iter_errors(document))

        # The schema is used unmodified. It requires the two verifier outputs; this input has none by design.
        found = objections(self.s)
        self.assertEqual([(path, kind) for path, kind, _ in found], [([], "required"), ([], "required")], found)
        missing = {re.match(r"'([a-z_]+)' is a required property", message).group(1) for _, _, message in found}
        self.assertEqual(missing, {"evaluations", "overall_result"})
        # Controls: the same validator must object to a wrong record type and to a malformed time.
        wrong_type = copy.deepcopy(self.s)
        wrong_type["records"][0]["record_type"] = "decision"
        self.assertGreater(len(objections(wrong_type)), 2)
        wrong_time = copy.deepcopy(self.s)
        wrong_time["created_at"] = "not-a-date-time"
        self.assertEqual(len(objections(wrong_time)), 3)

    # -- negative controls: verifier output must not leak in ----------------------------------------------
    def test_evaluations_added_to_scenario_input(self):
        self.s["evaluations"] = []
        self.rejected("E2")

    def test_overall_result_added_to_scenario_input(self):
        self.s["overall_result"] = "correlated"
        self.rejected("E2")

    def test_overall_result_added_to_expected_output(self):
        self.e["overall_result"] = "correlated"
        self.rejected("M4")

    def test_independence_claimed_with_no_verifier_run(self):
        self.s["evaluation_contract"]["independence"]["status"] = "claimed"
        self.rejected("E4")

    # -- negative controls: digests and references ----------------------------------------------------------
    def test_window_extended_by_editing_the_first_determination(self):
        self.record("determination-1")["data"]["not_after"] = "2026-01-01T00:05:30Z"
        self.rejected("D2", rebind=False)

    def test_reference_carries_a_stale_digest(self):
        event = self.record("enforcement-2")
        event["data"]["determination_ref"]["digest"] = "sha256:" + "0" * 64
        event["digest"] = digest(event["data"])
        self.rejected("D3", rebind=False)

    def test_link_carries_a_stale_digest(self):
        self.link("evaluates-1")["target"]["digest"] = "sha256:" + "0" * 64
        self.rejected("K1", rebind=False)

    def test_context_changed_after_the_fixture_was_built(self):
        self.c["items"][0]["statement"] = "edited"
        self.rejected("E5", rebind=False)

    def test_containment_operand_removed_from_the_context(self):
        self.c["items"] = [i for i in self.c["items"] if i["id"] != U + "parameters:presented"]
        self.rejected("D4|D5")

    def test_authority_evidence_not_declared(self):
        self.record("determination-2")["data"]["authority_evidence_refs"].append(U + "authority:approval-9")
        self.rejected("D5")

    # -- negative controls: links ----------------------------------------------------------------------------
    def test_link_relation_does_not_fit_the_record_types(self):
        self.link("evaluates-1")["relation"] = "enforces"
        self.rejected("K2")

    def test_reconciles_links_differ_from_record_refs(self):
        self.s["links"] = [k for k in self.s["links"] if k["link_id"] != U + "link:reconciles-9"]
        self.rejected("K3")

    def test_supersedes_points_at_a_later_record(self):
        del self.record("reconciliation-2")["supersedes"]
        self.record("reconciliation-1")["supersedes"] = self.ref("reconciliation-2")
        link = self.link("supersedes-1")
        link["source"], link["target"] = link["target"], link["source"]
        self.rejected("K3")

    # -- negative controls: the decision and the two attempts ------------------------------------------------
    def test_first_determination_and_denied_attempt_deleted(self):
        self.drop_record("enforcement-1")
        self.drop_record("determination-1")
        self.rejected("S1")

    def test_later_determination_overlaps_the_first_window(self):
        self.record("determination-1")["data"]["not_after"] = "2026-01-01T00:06:30Z"
        self.rejected("S1")

    def test_later_determination_reuses_the_first_approval(self):
        self.record("determination-2")["data"]["authority_evidence_refs"] = list(
            self.record("determination-1")["data"]["authority_evidence_refs"])
        self.rejected("S1")

    def test_denied_attempt_deleted(self):
        self.drop_record("enforcement-1")
        self.rejected("S2")

    def test_later_attempt_rides_on_the_expired_determination(self):
        self.record("enforcement-2")["data"]["determination_ref"] = self.ref("determination-1")
        self.link("enforces-2")["target"] = self.ref("determination-1")
        self.rejected("S2")

    def test_fresh_evidence_used_to_accept_an_expired_determination(self):
        event = self.record("enforcement-1")["data"]
        event["acceptance_outcome"] = "accepted"
        event["reason_codes"] = []
        for item in event["checks"]:
            item["result"] = "pass"
        self.e["enforcement_outcomes"] = {"accepted": 2}
        self.rejected("S2")

    def test_execution_invented_for_the_denied_attempt(self):
        self.record("execution-1")["data"]["enforcement_ref"] = self.ref("enforcement-1")
        self.link("attempts-1")["target"] = self.ref("enforcement-1")
        self.rejected("S3")

    def test_unknown_execution_given_a_completion_time(self):
        self.record("execution-1")["data"]["completed_at"] = "2026-01-01T00:06:07Z"
        self.rejected("S4")

    def test_unknown_execution_rewritten_as_completed(self):
        self.record("execution-1")["data"]["result_status"] = "completed"
        self.rejected("S4")

    # -- negative controls: the human reaction ---------------------------------------------------------------
    def test_repeat_reaction_deleted(self):
        rid = U + "record:observation-3"
        self.drop_record("observation-3")
        data = self.record("reconciliation-2")["data"]
        for key in ("record_refs", "observed_state_refs"):
            data[key] = [r for r in data[key] if r["record_id"] != rid]
        self.rejected("S5")

    def test_repeat_reaction_counted_as_a_second_reported_state(self):
        self.record("observation-3")["data"]["observed_state"] = copy.deepcopy(
            self.record("observation-1")["data"]["observed_state"])
        self.rejected("S5")

    def test_reaction_without_limitations(self):
        self.record("observation-2")["data"]["limitations"] = []
        self.rejected("S5")

    # -- negative controls: assessment and correction ----------------------------------------------------------
    def test_earlier_reconciliation_deleted(self):
        self.drop_record("reconciliation-1")
        self.rejected("D3")

    def test_correction_no_longer_names_what_it_supersedes(self):
        del self.record("reconciliation-2")["supersedes"]
        self.s["links"] = [k for k in self.s["links"] if k["relation"] != "supersedes"]
        self.rejected("S6")

    def test_correction_drops_evidence_the_earlier_record_compared(self):
        rid = U + "record:execution-1"
        data = self.record("reconciliation-2")["data"]
        data["record_refs"] = [r for r in data["record_refs"] if r["record_id"] != rid]
        self.s["links"] = [k for k in self.s["links"] if k["link_id"] != U + "link:reconciles-8"]
        self.rejected("S6")

    # -- negative controls: external_effect_status stays in its source payload ---------------------------------
    def test_source_payload_removed(self):
        del self.record("reconciliation-2")["extensions"]
        self.rejected("S7")

    def test_external_effect_status_copied_into_a_galc_field(self):
        self.record("observation-1")["data"]["external_effect_status"] = "observed"
        self.rejected("S7")

    def test_source_status_changed_without_changing_expected_output(self):
        self.record("reconciliation-2")["extensions"]["csoai_source_payload"]["payload"]["external_effect_status"] = "completed"
        self.rejected("S7")

    def test_reconciliation_result_rewritten_to_matched(self):
        self.record("reconciliation-2")["data"]["result"] = "matched"
        self.rejected("S7")

    # -- negative controls: containment ------------------------------------------------------------------------
    def test_containment_check_without_its_method(self):
        item = self.record("enforcement-2")["data"]["checks"][4]
        item["evidence_refs"] = [r for r in item["evidence_refs"] if not r.startswith(U + "method:")]
        self.rejected("S8")

    def test_containment_check_without_an_operand(self):
        item = self.record("enforcement-2")["data"]["checks"][4]
        item["evidence_refs"] = [r for r in item["evidence_refs"] if r != U + "parameters:proposed"]
        self.rejected("S8")

    def test_containment_method_marked_as_run(self):
        next(i for i in self.c["items"] if i["id"] == U + "method:scope-containment:1")["run_on_this_fixture"] = True
        self.rejected("S8")

    # -- negative controls: the mapping stays NOT_EVALUATED and points at real positions -------------------------
    def test_comparison_marked_as_evaluated(self):
        self.m["proposed_comparisons"][0]["status"] = "pass"
        self.rejected("M1")

    def test_comparison_part_marked_as_evaluated(self):
        self.part("C6a")["status"] = "insufficient_evidence"
        self.rejected("M1")

    def test_mapping_points_at_a_field_that_does_not_exist(self):
        self.part("C1a")["fields"][0]["pointer"] = "/data/no_such_field"
        self.rejected("M2")

    def test_uninstantiated_part_hides_its_gap(self):
        self.part("C3b")["gaps"] = []
        self.rejected("M2")

    def test_record_position_names_an_unknown_link(self):
        self.m["record_positions"][0]["links"].append(U + "link:evaluates-9")
        self.rejected("M3")

    def test_comparison_removed_from_the_mapping(self):
        self.m["proposed_comparisons"] = self.m["proposed_comparisons"][:5]
        self.rejected("M2")


if __name__ == "__main__":
    unittest.main(verbosity=2)
