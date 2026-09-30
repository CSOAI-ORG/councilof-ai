#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""evidence event -> OpenTelemetry log record for the event `gen_ai.evaluation.result` (semconv: Development).

    python3 render/otel.py EVENTS.jsonl > evaluation-events.otlp.json      (one OTLP/JSON ExportLogsServiceRequest)

gen_ai.evaluation.name = method.id; gen_ai.evaluation.score.label = the state word;
gen_ai.evaluation.explanation = the quoted claim. gen_ai.evaluation.score.value is ABSENT unless a number
was measured (the semconv makes it conditionally required, "if applicable"; for UNMEASURED it is not).
Everything else rides in csoai.* attributes.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from render import E, anchors, guard, measured_value, sig_summary, when  # noqa: E402

EVENT_NAME = "gen_ai.evaluation.result"
SCOPE = {"name": "csoai.evidence-fabric", "version": E.FABRIC_VERSION}


def _v(x):
    if isinstance(x, bool):
        return {"boolValue": x}
    if isinstance(x, int):
        return {"intValue": str(x)}
    if isinstance(x, float):
        return {"doubleValue": x}
    return {"stringValue": x if isinstance(x, str) else json.dumps(x, sort_keys=True, ensure_ascii=False)}


def attributes(ev):
    """The flat attribute map (key -> python value) before OTLP encoding. Tests read this."""
    guard(ev)
    sig, anc = sig_summary(ev), anchors(ev)
    a = {
        "gen_ai.evaluation.name": ev["method"]["id"],
        "gen_ai.evaluation.score.label": ev["state"],
        "gen_ai.evaluation.explanation": ev["claim"]["text"],
        "csoai.event_id": ev["event_id"],
        "csoai.subject.kind": ev["subject"]["kind"],
        "csoai.subject.locator": ev["subject"]["locator"],
        "csoai.method.version": str(ev["method"]["version"]),
        "csoai.method.holder": ev["method"]["holder"],
        "csoai.declared_sha256": E.side_sha256(ev["declared"]),
        "csoai.observed_sha256": E.side_sha256(ev["observed"]),
        "csoai.negative_control": ev["negative_control"],
        "csoai.limits": ev["limits"],
        "csoai.sig.kid": sig.get("kid") or sig.get("state", "UNSIGNED"),
        "csoai.ots": anc.get("ots") or "none",
    }
    if (anc.get("rekor") or {}).get("log_index") is not None:
        a["csoai.rekor.log_index"] = int(anc["rekor"]["log_index"])
    v = measured_value(ev)
    if v is not None:
        a["gen_ai.evaluation.score.value"] = float(v)
    return a


def log_record(ev):
    a = attributes(ev)
    ns = str(int(when(ev).timestamp()) * 10**9)
    return {"timeUnixNano": ns, "observedTimeUnixNano": ns, "eventName": EVENT_NAME,
            "severityNumber": 9, "severityText": "INFO",
            "attributes": [{"key": k, "value": _v(v if not isinstance(v, (list, dict)) else json.dumps(v, sort_keys=True, ensure_ascii=False))}
                           for k, v in sorted(a.items())]}


def render_batch(events):
    return {"resourceLogs": [{"resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "csoai-evidence-fabric"}}]},
                              "scopeLogs": [{"scope": SCOPE, "logRecords": [log_record(ev) for ev in events]}]}]}


def main(argv=None):
    a = argv if argv is not None else sys.argv[1:]
    sys.stdout.write(json.dumps(render_batch(E.read_jsonl(a[0])), ensure_ascii=False, sort_keys=True, indent=1) + "\n")


if __name__ == "__main__":
    main()
