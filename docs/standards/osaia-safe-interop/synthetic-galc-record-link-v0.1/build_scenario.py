"""Producer of scenario-input.json for the synthetic record and link fixture. Standard library only.

    python3 build_scenario.py            write scenario-input.json
    python3 build_scenario.py --check    exit 1 if the committed file differs from what this script builds

Everything here is invented. The script computes each record digest over the record's data member under the
local rule named in verification-context.json, then writes every reference and link with that digest.
It writes no evaluations and no overall_result: no verifier was run.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
U = "urn:example:csoai-synthetic:"
C14N_ID = U + "c14n:json-sorted-keys-compact-utf8:1"
TRANSITION_ID = U + "transition:target-1:a-to-b"
NONCE = "idem-synthetic-0001"
RECORD_TYPES = ("proposal", "governance_determination", "enforcement_event", "execution_result", "observation",
                "reconciliation_result")


def c14n(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def digest(value):
    return "sha256:" + hashlib.sha256(c14n(value)).hexdigest()


def dump(document):
    return json.dumps(document, indent=2, ensure_ascii=False) + "\n"


def load_context():
    return json.loads((HERE / "verification-context.json").read_text(encoding="utf-8"))


def principal(name, domain, role, binding=None):
    out = {"id": U + "principal:" + name, "trust_domain": domain, "role": role}
    if binding:
        out["identity_binding_ref"] = binding
    return out


REQUESTER = principal("requester-1", "requester.example", "requesting-agent")
GOVERNANCE = principal("governance-1", "governance.example", "governance-point")
BOUNDARY = principal("boundary-1", "boundary.example", "enforcement-point")
PROVIDER = principal("provider-1", "provider.example", "execution-substrate")
SINK_READER = principal("sink-reader-1", "sink.example", "state-observer")
AFFECTED = principal("affected-party-1", "people.example", "affected-party",
                     U + "identity-binding:affected-party-1")
RECONCILER = principal("reconciler-1", "review.example", "lifecycle-reconciler")
AUTHOR = {"id": U + "principal:fixture-author", "trust_domain": "fixture.example"}
TARGET = {"id": U + "target:target-1", "trust_domain": "provider.example", "resource_type": "synthetic-resource"}
INTEGRITY = {"status": "insufficient_evidence", "method": "sha-256 digest under the declared local rule; no signature"}
NO_INDEPENDENCE = "Not claimed. A test double written by the fixture author; no separate administration, key or data path."


def bare(p):
    return {"id": p["id"], "trust_domain": p["trust_domain"]}


def build():
    context = load_context()
    items = {item["id"]: item for item in context["items"]}

    def state(name, predicate):
        item = items[U + "state:target-1:" + name]
        return {"id": item["id"], "digest": digest(item["value"]), "schema_id": U + "schema:synthetic-state:1",
                "predicate": predicate}

    def parameters(name):
        return digest(items[U + "parameters:" + name]["value"])

    custody_item = items[U + "custody:none"]
    custody = {
        "status": "never_provided",
        "verifier": AUTHOR,
        "method": "declaration-by-fixture-author",
        "method_version": "1",
        "evidence_basis": [{"record_id": custody_item["id"], "digest": digest(custody_item)}],
        "limitations": ["Synthetic. No custody evidence exists for this record."],
    }

    records = []

    def ref(name):
        for r in records:
            if r["record_id"] == U + "record:" + name:
                return {"record_id": r["record_id"], "digest": r["digest"]}
        raise KeyError(name)

    def add(name, record_type, producer, issued_at, data, supersedes=None, extensions=None):
        record = {
            "record_id": U + "record:" + name,
            "record_type": record_type,
            "schema_id": U + "schema:" + record_type + ":1",
            "canonicalization_id": C14N_ID,
            "digest_algorithm": "sha-256",
            "digest": digest(data),
            "producer": bare(producer),
            "issued_at": issued_at,
            "availability": "available",
            "integrity": copy.deepcopy(INTEGRITY),
            "anchor": {"status": "unanchored"},
            "custody": copy.deepcopy(custody),
        }
        if supersedes:
            record["supersedes"] = supersedes
        record["data"] = data
        if extensions:
            record["extensions"] = extensions
        records.append(record)

    def source_payload(payload, note):
        return {"csoai_source_payload": {
            "schema_id": U + "schema:effect-finding:1",
            "canonicalization_id": C14N_ID,
            "digest_algorithm": "sha-256",
            "digest": digest(payload),
            "payload": payload,
            "mapping_note": note,
        }}

    def t(clock):
        return "2026-01-01T" + clock + "Z"

    def check(name, result, clock, evidence):
        return {"check": name, "result": result, "checked_at": t(clock), "evidence_refs": evidence}

    before = state("before", "field == 'A'")
    after = state("after", "field == 'B'")
    reported = state("reported-by-affected-party", "field == 'B' and reported_impact == 'contested'")

    # 1. The proposal actually presented. It carries the before-state and context.
    add("proposal-1", "proposal", REQUESTER, t("00:00:00"), {
        "originating_principal": REQUESTER,
        "authority_ref": U + "authority:delegation-requester-1",
        "action": "synthetic_update",
        "target": TARGET,
        "parameters_digest": parameters("proposed"),
        "before_state": before,
        "intended_transition": after,
        "evidence_refs": [U + "context:baseline-read-1"],
        "context_refs": [U + "context:baseline-read-1"],
        "consequence_class": "synthetic-bounded",
        "nonce": NONCE,
    })

    def determination(name, approval, clock, not_after_clock):
        add(name, "governance_determination", GOVERNANCE, t(clock), {
            "proposal_ref": ref("proposal-1"),
            "outcome": "allow",
            "policy_ref": U + "policy:synthetic-update:1",
            "authority_evidence_refs": [
                U + "authority:delegation-requester-1",
                U + "authority:" + approval,
                U + "authority:approver-mandate-1",
            ],
            "reason_codes": ["policy_allow"],
            "issued_at": t(clock),
            "not_before": t(clock),
            "not_after": t(not_after_clock),
            "max_uses": 1,
            "material_change_invalidators": ["actor", "authority", "target", "action", "parameters", "before_state",
                                             "policy", "revocation"],
            "revocation": {"status": "not_revoked", "checked_at": t(clock),
                           "reference": U + "revocation:" + name},
        })

    def enforcement(name, determination_name, outcome, clock, checks, reasons):
        add(name, "enforcement_event", BOUNDARY, t(clock), {
            "determination_ref": ref(determination_name),
            "proposal_ref": ref("proposal-1"),
            "acceptance_outcome": outcome,
            "enforcement_point": BOUNDARY,
            "actual_actor": REQUESTER,
            "actual_action": "synthetic_update",
            "actual_target": TARGET,
            "actual_parameters_digest": parameters("presented"),
            "checks": checks,
            "nonce": NONCE,
            "irreversible_boundary_crossed": False,
            "reason_codes": reasons,
        })

    # 2. First decision, bound to proposal-1. Its window closes at 00:01:10.
    determination("determination-1", "approval-1", "00:00:10", "00:01:10")

    # 3. The denied attempt: determination-1 is presented at 00:05:00, after its window. The evidence was
    #    refreshed at 00:04:50 and is fresh. Fresh evidence does not renew the permission. No execution follows.
    enforcement("enforcement-1", "determination-1", "rejected", "00:05:00", [
        check("determination_validity", "fail", "00:05:00", [U + "record:determination-1"]),
        check("evidence_freshness", "pass", "00:05:00", [U + "context:baseline-read-2"]),
        check("revocation", "pass", "00:05:00", [U + "revocation:determination-1"]),
    ], ["determination_expired"])

    # 4. A second decision on the same proposal, issued separately. determination-1 is left as it was.
    determination("determination-2", "approval-2", "00:06:00", "00:07:00")

    # 5. The later attempt, accepted under determination-2. The presented parameters differ from the proposed
    #    parameters, so the two digests are unequal. The enforcement point records its own containment check
    #    with the method and both operands as evidence.
    enforcement("enforcement-2", "determination-2", "accepted", "00:06:05", [
        check("determination_validity", "pass", "00:06:05", [U + "record:determination-2"]),
        check("revocation", "pass", "00:06:05", [U + "revocation:determination-2"]),
        check("use_count", "pass", "00:06:05", [U + "record:determination-2"]),
        check("material_change", "pass", "00:06:05", [U + "context:baseline-read-2"]),
        check("scope_containment", "pass", "00:06:05", [
            U + "method:scope-containment:1", U + "parameters:proposed", U + "parameters:presented"]),
    ], [])

    # 6. Dispatch under enforcement-2. Completion was not established. No retry was made.
    add("execution-1", "execution_result", PROVIDER, t("00:06:20"), {
        "enforcement_ref": ref("enforcement-2"),
        "operation": "synthetic_update",
        "actor": REQUESTER,
        "target": TARGET,
        "parameters_digest": parameters("presented"),
        "result_status": "unknown",
        "substrate": PROVIDER,
        "started_at": t("00:06:06"),
        "output_refs": [],
        "indicators": {"retry": False, "replay": False, "duplicate": False, "rollback": False,
                       "compensation": False},
    })

    reconciliation_method = "synthetic-predicate-and-report-comparison"

    # 7. Early assessment: nothing observed yet.
    finding_1 = {"id": "F1", "external_effect_status": "unknown", "basis": [U + "record:execution-1"],
                 "supersedes": None}
    add("reconciliation-1", "reconciliation_result", RECONCILER, t("00:06:30"), {
        "record_refs": [ref("proposal-1"), ref("determination-2"), ref("enforcement-2"), ref("execution-1")],
        "expected_transition": after,
        "observed_state_refs": [],
        "method": reconciliation_method,
        "method_version": "1",
        "result": "missing",
        "reason_codes": ["execution_unknown", "observation_missing"],
        "residual_grounding_uncertainty": "Completion was not established and no resulting-state observation existed at this time.",
        "reconciler": RECONCILER,
    }, extensions=source_payload(
        finding_1,
        "CSOAI source finding, kept in its own vocabulary. unknown here is not result_status unknown and is not the reconciliation result. No conversion was evaluated."))

    def observation(name, observer, method, observed, clock, freshness, independence, limitations):
        add(name, "observation", observer, t(clock), {
            "observer": observer,
            "method": method,
            "method_version": "1",
            "target": TARGET,
            "execution_ref": ref("execution-1"),
            "transition_ref": TRANSITION_ID,
            "observed_state": observed,
            "observed_at": t(clock),
            "freshness_seconds": freshness,
            "independence_basis": independence,
            "limitations": limitations,
        })

    # 8. A machine read of the sink record.
    observation("observation-1", SINK_READER, "synthetic-sink-record-read", after, "00:10:00", 60, NO_INDEPENDENCE, [
        "Synthetic. No sink was read.",
        "A sink record that satisfies the predicate does not show which operation produced it.",
    ])

    # 9 and 10. The later human reaction, as two observations of one reported state.
    reaction_limits = [
        "Synthetic. No person took part.",
        "Self-report by the affected party; not corroborated.",
        "The report contests the impact. It requests no new action; a request would be a new proposal with its own determination.",
    ]
    self_report = "Not claimed. Self-report by the affected party."
    observation("observation-2", AFFECTED, "synthetic-affected-party-report", reported, "00:20:00", 3600,
                self_report, reaction_limits)
    observation("observation-3", AFFECTED, "synthetic-affected-party-report", reported, "00:25:00", 3600,
                self_report, reaction_limits + [
                    "A repeat of the report in observation-2 about the same reported state. A second observation, not a second failure."])

    # 11. The corrected assessment. It supersedes reconciliation-1 and keeps it, with all three observations.
    finding_2 = {"id": "F2", "external_effect_status": "observed",
                 "basis": [U + "record:observation-1", U + "state:target-1:after"], "supersedes": "F1"}
    add("reconciliation-2", "reconciliation_result", RECONCILER, t("00:30:00"), {
        "record_refs": [ref("proposal-1"), ref("determination-2"), ref("enforcement-2"), ref("execution-1"),
                        ref("observation-1"), ref("observation-2"), ref("observation-3")],
        "expected_transition": after,
        "observed_state_refs": [ref("observation-1"), ref("observation-2"), ref("observation-3")],
        "method": reconciliation_method,
        "method_version": "1",
        "result": "conflicting",
        "reason_codes": ["observation_conflict", "execution_unknown"],
        "residual_grounding_uncertainty": "The sink read is consistent with the expected transition under the declared method. Two reports from the affected party contest the resulting state; both refer to one reported state. The execution record still says unknown. Nothing is discarded.",
        "reconciler": RECONCILER,
    }, supersedes=ref("reconciliation-1"), extensions=source_payload(
        finding_2,
        "CSOAI source finding, kept in its own vocabulary. observed here sits beside result_status unknown and a conflicting reconciliation result. None is derived from another. No conversion was evaluated."))

    by_id = {r["record_id"]: r for r in records}
    links = []

    def link(relation, source, target):
        number = 1 + sum(1 for existing in links if existing["relation"] == relation)
        src = by_id[U + "record:" + source]
        links.append({
            "link_id": U + "link:%s-%d" % (relation, number),
            "relation": relation,
            "source": ref(source),
            "target": ref(target),
            "asserted_by": copy.deepcopy(src["producer"]),
            "asserted_at": src["issued_at"],
            "schema_id": U + "schema:lifecycle-link:1",
            "canonicalization_id": C14N_ID,
            "integrity": copy.deepcopy(INTEGRITY),
        })

    link("evaluates", "determination-1", "proposal-1")
    link("evaluates", "determination-2", "proposal-1")
    link("enforces", "enforcement-1", "determination-1")
    link("enforces", "enforcement-2", "determination-2")
    link("attempts", "execution-1", "enforcement-2")
    for name in ("observation-1", "observation-2", "observation-3"):
        link("observes", name, "execution-1")
    for name in ("reconciliation-1", "reconciliation-2"):
        for target in by_id[U + "record:" + name]["data"]["record_refs"]:
            link("reconciles", name, target["record_id"][len(U + "record:"):])
    link("supersedes", "reconciliation-2", "reconciliation-1")

    return {
        "profile": "safe-galc",
        "profile_version": "0.1",
        "lifecycle_id": "urn:uuid:00000000-0000-4000-8000-000000000002",
        "transition_id": TRANSITION_ID,
        "created_at": t("00:30:01"),
        "producer": AUTHOR,
        "records": records,
        "links": links,
        "evaluation_contract": {
            "property_set_id": "safe-galc/0.1/full-lifecycle",
            "mandatory_properties": ["component_integrity", "proposal_binding", "authority_validity",
                                     "determination_validity", "enforcement_binding", "execution_binding",
                                     "consequence_binding", "replay_resistance"],
            "aggregation_rule_id": "safe-galc/0.1/mandatory-precedence",
            "aggregation_rule_version": "1",
            "verifier_method_id": U + "method:no-verifier-run",
            "verifier_method_version": "0",
            "independence": {"status": "not_claimed", "basis": ["No verifier was run on this fixture."]},
        },
        "limitations": [
            "Synthetic. Every record, identifier, time, state, approval, person and digest input is invented.",
            "Scenario input only. It carries no evaluations and no overall_result because no verifier was run.",
            "Digests are real SHA-256 values under a local fixture rule. They show the references are consistent, nothing more.",
        ],
        "extensions": {"csoai_synthetic": {
            "fixture_id": context["fixture_id"],
            "source": "synthetic only",
            "record_digest_covers": "the record's data member",
            "verification_context_ref": {"id": U + "verification-context:record-link-002", "digest": digest(context)},
        }},
    }


def rebind(envelope, context=None):
    """Recompute every digest after an edit and rewrite the references that carry it.

    Used by the negative controls in validate_fixture.py, so that a tampered fixture is rejected for the
    rule under test and not for a stale digest.
    """
    for _ in range(len(envelope["records"]) + 2):
        current = {}
        for record in envelope["records"]:
            payload = record.get("extensions", {}).get("csoai_source_payload")
            if payload:
                payload["digest"] = digest(payload["payload"])
            record["digest"] = digest(record["data"])
            current[record["record_id"]] = record["digest"]
        changed = False

        def walk(node):
            nonlocal changed
            if isinstance(node, dict):
                if set(node) == {"record_id", "digest"} and node["record_id"] in current:
                    if node["digest"] != current[node["record_id"]]:
                        node["digest"] = current[node["record_id"]]
                        changed = True
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for value in node:
                    walk(value)

        for record in envelope["records"]:
            walk(record["data"])
            walk(record.get("supersedes"))
        walk(envelope["links"])
        if not changed:
            break
    if context is not None:
        envelope["extensions"]["csoai_synthetic"]["verification_context_ref"]["digest"] = digest(context)
    return envelope


def main(argv):
    target = HERE / "scenario-input.json"
    built = dump(build())
    if "--check" in argv:
        same = target.is_file() and target.read_text(encoding="utf-8") == built
        print("scenario-input.json %s what build_scenario.py builds" % ("matches" if same else "DIFFERS FROM"))
        return 0 if same else 1
    target.write_text(built, encoding="utf-8")
    print("wrote %s (%d bytes)" % (target.name, len(built.encode("utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
