#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""evidence events -> one SARIF 2.1.0 log (one run, one result per event).

    python3 render/sarif.py EVENTS.jsonl > evidence.sarif

kind: CONSISTENT pass, DIVERGENT fail (level warning), UNMEASURED/UNCHECKABLE open, PARTIAL review,
NOT_DISCRIMINATING notApplicable. SARIF says level SHALL be "none" whenever kind is not "fail".
ruleId = method.id. guid is derived from event_id (first 16 bytes, RFC 4122 layout); the full event_id is in
fingerprints["csoai/event_id/v1"]. properties.value exists only when a number was measured.
"""
import json, os, sys, uuid
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from render import E, INFO_URI, anchors, guard, measured_value, sig_summary, when, iso  # noqa: E402

SARIF_SCHEMA = "https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json"
KIND = {"CONSISTENT": "pass", "DIVERGENT": "fail", "UNMEASURED": "open", "UNCHECKABLE": "open",
        "PARTIAL": "review", "NOT_DISCRIMINATING": "notApplicable"}


def guid(event_id):
    return str(uuid.UUID(bytes=bytes.fromhex(event_id.split(":", 1)[1][:32]), version=4))


def result(ev):
    guard(ev)
    kind = KIND[ev["state"]]
    props = {"state": ev["state"], "event_id": ev["event_id"], "subject_kind": ev["subject"]["kind"],
             "method_version": str(ev["method"]["version"]), "method_holder": ev["method"]["holder"],
             "declared_sha256": E.side_sha256(ev["declared"]), "observed_sha256": E.side_sha256(ev["observed"]),
             "negative_control": ev["negative_control"], "limits": ev["limits"],
             "signature": sig_summary(ev), "anchors": anchors(ev), "read_at": iso(when(ev))}
    v = measured_value(ev)
    if v is not None:
        props["value"] = v
    return {"ruleId": ev["method"]["id"], "kind": kind, "level": "warning" if kind == "fail" else "none",
            "message": {"text": ev["claim"]["text"]},
            "locations": [{"physicalLocation": {"artifactLocation": {"uri": ev["subject"]["locator"]}}}],
            "guid": guid(ev["event_id"]),
            "fingerprints": {"csoai/event_id/v1": ev["event_id"]},
            "properties": props}


def render_batch(events):
    results = [result(ev) for ev in events]
    rules = {}
    for ev in events:
        rules.setdefault(ev["method"]["id"], {"id": ev["method"]["id"], "name": ev["method"]["id"],
                                              "shortDescription": {"text": f"declared vs observed: {ev['method']['id']}"},
                                              "properties": {"holder": ev["method"]["holder"]}})
    return {"$schema": SARIF_SCHEMA, "version": "2.1.0",
            "runs": [{"tool": {"driver": {"name": "GSPC evidence fabric", "version": E.FABRIC_VERSION,
                                          "organization": "CSOAI Ltd", "informationUri": INFO_URI,
                                          "rules": sorted(rules.values(), key=lambda r: r["id"])}},
                      "results": results,
                      "properties": {"note": "Evidence, not a verdict. 'open' means could not be determined, never a pass."}}]}


def main(argv=None):
    a = argv if argv is not None else sys.argv[1:]
    sys.stdout.write(json.dumps(render_batch(E.read_jsonl(a[0])), ensure_ascii=False, sort_keys=True, indent=1) + "\n")


if __name__ == "__main__":
    main()
