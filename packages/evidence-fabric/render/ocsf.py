#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""evidence event -> OCSF 1.9.0 Detection Finding (class 2004). Never Compliance Finding (2003).

    python3 render/ocsf.py EVENTS.jsonl > findings.ocsf.jsonl

Mapping (docs: ../README.md): finding_info.uid = event_id; state -> status_id (CONSISTENT 4 Resolved,
DIVERGENT 1 New, anything else 99 Other + status_detail = the state word); severity_id is always 1
(Informational) because we do not rate risk; declared/observed -> two evidences[].data items.
OCSF has no field for a measured value: when one exists it goes to unmapped.csoai.value, never to
confidence_score or risk_score (those are the source's confidence and risk, which we do not state).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from render import E, PRODUCT, INFO_URI, anchors, guard, measured_value, sig_summary, when  # noqa: E402

OCSF_VERSION = "1.9.0"
STATUS = {"CONSISTENT": (4, "Resolved"), "DIVERGENT": (1, "New")}


def render(ev):
    guard(ev)
    t = when(ev)
    ms = int(t.timestamp() * 1000)
    sid, sname = STATUS.get(ev["state"], (99, "Other"))
    m = ev["method"]
    out = {
        "activity_id": 1, "activity_name": "Create",
        "category_uid": 2, "category_name": "Findings",
        "class_uid": 2004, "class_name": "Detection Finding",
        "type_uid": 200401, "type_name": "Detection Finding: Create",
        "severity_id": 1, "severity": "Informational",
        "status_id": sid, "status": sname, "status_detail": ev["state"],
        "time": ms,
        "message": f"{m['id']}: {ev['state']} for {ev['subject']['locator']}",
        "metadata": {"version": OCSF_VERSION, "product": dict(PRODUCT), "uid": ev["event_id"],
                     "log_name": "csoai.evidence-event/0.1"},
        "finding_info": {
            "uid": ev["event_id"],
            "title": f"{m['id']} {ev['state']}",
            "desc": ev["claim"]["text"],
            "created_time": ms,
            "analytic": {"name": m["id"], "version": str(m["version"]), "type_id": 99, "type": "Other",
                         **({"uid": m["code_sha256"]} if m.get("code_sha256") else {})},
            "data_sources": [x for x in (ev["subject"].get("declared_by"), ev["claim"].get("source_url")) if x],
            **({"src_url": ev["claim"]["source_url"]} if ev["claim"].get("source_url") else {}),
        },
        "resources": [{"uid": ev["subject"]["locator"], "type": ev["subject"]["kind"]}],
        "evidences": [{"data": {"side": "declared", "content": ev["declared"]}},
                      {"data": {"side": "observed", "content": ev["observed"]}}],
        "unmapped": {"csoai": {
            "schema": ev["schema"], "state": ev["state"], "method_holder": m.get("holder"),
            "negative_control": ev["negative_control"], "limits": ev["limits"], "supersedes": ev.get("supersedes"),
            "signature": sig_summary(ev), "anchors": anchors(ev), "maintenance": ev.get("maintenance"),
            "spec": INFO_URI}},
    }
    v = measured_value(ev)
    if v is not None:
        out["unmapped"]["csoai"]["value"] = v
    return out


def main(argv=None):
    a = argv if argv is not None else sys.argv[1:]
    for ev in E.read_jsonl(a[0]):
        sys.stdout.write(json.dumps(render(ev), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
