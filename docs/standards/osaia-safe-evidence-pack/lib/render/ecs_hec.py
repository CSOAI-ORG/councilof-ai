#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""evidence event -> HEC NDJSON carrying an ECS document (for HEC-style ingestion, e.g. an NG-SIEM HEC
connector whose parser normalises to ECS).

    python3 render/ecs_hec.py EVENTS.jsonl > hec.ndjson

event.kind "event"; event.category ["configuration"] (never intrusion_detection: that would imply a
detection verdict); event.type ["info"]; event.outcome CONSISTENT success, DIVERGENT failure, everything else
unknown -- UNMEASURED is never "success". event.risk_score is never emitted: we do not rate risk.
observer.vendor "CSOAI"; rule.id = method.id. Our own fields live under the custom `csoai.*` namespace.
Live ingestion into any tenant is UNMEASURED (no tenant was used).
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from render import E, INFO_URI, anchors, guard, measured_value, sig_summary, when, iso  # noqa: E402

ECS_VERSION = "8.17.0"
OUTCOME = {"CONSISTENT": "success", "DIVERGENT": "failure"}
SOURCETYPE = "csoai:evidence:ecs"


def ecs(ev):
    guard(ev)
    loc = ev["subject"]["locator"]
    doc = {
        "@timestamp": iso(when(ev)),
        "ecs": {"version": ECS_VERSION},
        "message": ev["claim"]["text"],
        "event": {"kind": "event", "category": ["configuration"], "type": ["info"],
                  "outcome": OUTCOME.get(ev["state"], "unknown"), "id": ev["event_id"],
                  "dataset": "csoai.evidence", "module": "csoai", "provider": "gspc-evidence-fabric",
                  "reference": INFO_URI},
        "observer": {"vendor": "CSOAI", "product": "GSPC evidence", "version": E.FABRIC_VERSION},
        "rule": {"id": ev["method"]["id"], "name": ev["method"]["id"], "version": str(ev["method"]["version"]),
                 "ruleset": ev["method"]["holder"]},
        "related": {"hash": [ev["event_id"].split(":", 1)[1]]},
        "labels": {"csoai_state": ev["state"], "csoai_subject_kind": ev["subject"]["kind"]},
        "csoai": {"state": ev["state"], "subject": ev["subject"], "negative_control": ev["negative_control"],
                  "limits": ev["limits"], "declared_sha256": E.side_sha256(ev["declared"]),
                  "observed_sha256": E.side_sha256(ev["observed"]), "signature": sig_summary(ev), "anchors": anchors(ev)},
    }
    if loc.startswith(("http://", "https://")):
        doc["url"] = {"full": loc}
    v = measured_value(ev)
    if v is not None:
        doc["csoai"]["value"] = v
    return doc


def hec(ev):
    doc = ecs(ev)
    return {"time": int(when(ev).timestamp()), "host": "councilof.ai", "source": "csoai:evidence-fabric",
            "sourcetype": SOURCETYPE, "event": doc}


def flat_keys(d, prefix=""):
    out = []
    for k, v in d.items():
        p = prefix + k
        if isinstance(v, dict) and not p.startswith(("csoai", "labels")):
            out += flat_keys(v, p + ".")
        else:
            out.append(p)
    return out


# ECS field -> where it comes from (the CPS/ECS field map shipped with the renderer).
FIELD_MAP = {
    "@timestamp": "claim.read_at", "message": "claim.text", "event.id": "event_id",
    "event.kind": "constant 'event'", "event.category": "constant ['configuration']", "event.type": "constant ['info']",
    "event.outcome": "state: CONSISTENT success, DIVERGENT failure, else unknown",
    "event.dataset": "constant 'csoai.evidence'", "event.module": "constant 'csoai'", "event.provider": "constant",
    "event.reference": "spec URL", "observer.vendor": "constant 'CSOAI'", "observer.product": "constant",
    "observer.version": "fabric version", "rule.id": "method.id", "rule.name": "method.id", "rule.version": "method.version",
    "rule.ruleset": "method.holder", "related.hash": "event_id hex", "url.full": "subject.locator (http(s) only)",
    "labels": "state + subject.kind (keyword labels)", "ecs.version": "constant",
    "csoai.*": "custom namespace: state, subject, negative_control, limits, side digests, signature, anchors, value (measured only)",
}


def main(argv=None):
    a = argv if argv is not None else sys.argv[1:]
    for ev in E.read_jsonl(a[0]):
        sys.stdout.write(json.dumps(hec(ev), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
