"""Use the monorepo's canonical evidence event; replay is not authentication."""
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
        raise ValueError("Unsupported bundle version. Reopen it with the source version that created it.")
    if bundle["engine_fingerprint"] != fingerprint():
        raise ValueError("Different engine bytes; replay requires the pinned implementation")
    if "signature" in bundle or not isinstance(bundle["evidence_events"], list):
        raise ValueError("Unsupported attestation")
    if not isinstance(bundle["core"], dict) or not isinstance(bundle["core"].get("config"), dict):
        raise ValueError("Bundle must contain the original scenario configuration")
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
    cores = [first["core"], second["core"]]
    summaries = [{"permitted_ticks": c["counters"]["permitted_ticks"],
                  "denied_ticks": c["counters"]["denied_ticks"],
                  "selection_updates_after_revocation": c["counters"]["selection_updates_after_revocation"],
                  "new_revoked_A_selections": c["counters"]["new_revoked_A_selections"],
                  "final_retained_revoked_A": c["frames"][-1]["revoked_A_selected"]} for c in cores]
    delta = summaries[1]["new_revoked_A_selections"] - summaries[0]["new_revoked_A_selections"]
    if a["intervention"] == b["intervention"]:
        assessment = "IDENTICAL_INTERVENTIONS"
    elif not any(f["evidence_A"] == "revoked" for f in cores[0]["frames"]):
        assessment = "NO_REVOCATION_WINDOW"
    elif not summaries[0]["selection_updates_after_revocation"]:
        assessment = "NO_DECISIONS_AFTER_REVOCATION"
    else:
        assessment = "SYNTHETIC_DIFFERENCE_OBSERVED" if delta else "NO_DIFFERENCE_OBSERVED"
    return {"state": "COMPARABLE_FIXTURES", "assessment": assessment, "first": first["bundle_id"],
            "second": second["bundle_id"],
            "first_summary": summaries[0], "second_summary": summaries[1],
            "new_revoked_A_selection_delta": delta,
            "revoked_A_selection_delta": (
                second["core"]["frames"][-1]["revoked_A_selected"] -
                first["core"]["frames"][-1]["revoked_A_selected"]),
            "timeline": [{"tick": x["tick"], "permit": x["permit"],
                          "first_new_revoked_A": x["new_revoked_A_selections"],
                          "second_new_revoked_A": y["new_revoked_A_selections"],
                          "delta": y["new_revoked_A_selections"] - x["new_revoked_A_selections"]}
                         for x, y in zip(cores[0]["frames"], cores[1]["frames"])],
            "limits": ["Controlled synthetic comparison; no real-world effectiveness claim.",
                       "Counts are selection updates across record-ticks, not unique people.",
                       "Retained state is separate from new permitted updates; no authenticated human or external effect."]}


def events_jsonl(bundle):
    """Replay the original before exporting unchanged canonical unsigned events."""
    verify(bundle)
    return "".join(fabric.jcs(event).decode("utf-8") + "\n" for event in bundle["evidence_events"])
