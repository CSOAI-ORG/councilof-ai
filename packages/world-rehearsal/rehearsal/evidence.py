"""Use the monorepo's canonical evidence event; replay is not authentication."""
import copy
import json
from . import VERSION
from .dependencies import fabric
from .engine import simulate, digest, fingerprint

BUNDLE_SCHEMA = "csoai.rehearsal-bundle/0.1"


def strict_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("Duplicate JSON field")
            result[key] = value
        return result
    def invalid(_):
        raise ValueError("Non-finite JSON number")
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid)


def bundle_for(core):
    observation = fabric.build(
        subject={"kind": "sandbox_run", "locator": core["scenario_id"]},
        claim={"text": "Retained output from one synthetic procurement rehearsal"},
        method={"id": "world-rehearsal-fixture", "version": VERSION, "holder": "csoai",
                "code_sha256": fingerprint()},
        declared={"config": core["config"], "engine_fingerprint": fingerprint()},
        observed={"core_sha256": digest(core), "counters": core["counters"],
                  "final_frame": core["frames"][-1]},
        state="UNMEASURED", value=None, limits=core["limits"])
    payload = {"schema": BUNDLE_SCHEMA, "engine_version": VERSION,
               "engine_fingerprint": fingerprint(), "core": core,
               "evidence_events": [observation]}
    return {**payload, "bundle_id": "sha256:" + digest(payload)}


def verify(bundle):
    if not isinstance(bundle, dict) or set(bundle) != {
            "schema", "engine_version", "engine_fingerprint", "core",
            "evidence_events", "bundle_id"}:
        raise ValueError("Unsupported bundle shape")
    if bundle["schema"] != BUNDLE_SCHEMA or bundle["engine_version"] != VERSION:
        raise ValueError("Unsupported bundle version")
    if bundle["engine_fingerprint"] != fingerprint():
        raise ValueError("Different engine bytes; replay requires the pinned implementation")
    if "signature" in bundle or not isinstance(bundle["evidence_events"], list):
        raise ValueError("Unsupported attestation")
    for event in bundle["evidence_events"]:
        errors = fabric.validate(event)
        if errors:
            raise ValueError("Invalid canonical event: " + "; ".join(errors))
    replayed = bundle_for(simulate(bundle["core"]["config"]))
    if fabric.jcs(bundle) != fabric.jcs(replayed):
        raise ValueError("Bundle does not match deterministic replay")
    return {"state": "REPLAY_MATCH", "bundle_id": bundle["bundle_id"],
            "signature_verified": False, "human_authority": False,
            "external_effect": False, "gspc_admitted": False}


def compare(first, second):
    verify(first)
    verify(second)
    a, b = first["core"]["config"], second["core"]["config"]
    if {k:v for k,v in a.items() if k != "intervention"} != {
            k:v for k,v in b.items() if k != "intervention"}:
        raise ValueError("Comparison requires identical inputs except intervention")
    return {"state": "COMPARABLE_FIXTURES", "first": first["bundle_id"],
            "second": second["bundle_id"],
            "revoked_A_selection_delta": (
                second["core"]["frames"][-1]["revoked_A_selected"] -
                first["core"]["frames"][-1]["revoked_A_selected"]),
            "limits": ["Controlled synthetic comparison; no real-world effectiveness claim."]}
