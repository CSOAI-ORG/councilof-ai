#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Opt-in OpenShell OTLP export retaining the policy input and source-report digests.

    python3 render/openshell_otel.py EVENTS.jsonl > openshell.otlp.json

This extends the existing OTel renderer without changing its frozen output contract.
The input policy digest identifies what the adapter read, not what a sandbox enforced.
No signature, current authority, effective-policy capture or collector delivery is inferred.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402
from render import otel  # noqa: E402

PROFILE = "csoai.openshell-policy-provenance/0.1"
POLICY_REF = re.compile(r"policy sha256:([0-9a-f]{64})")
SHA256 = re.compile(r"[0-9a-f]{64}")


def render_batch(events):
    events = list(events)
    provenance = []
    for ev in events:
        E.check_renderable(ev)
        if ev["method"]["id"] != "openshell-declared-observed" or ev["subject"]["kind"] != "sandbox_run":
            raise ValueError("this export profile accepts OpenShell adapter events only")
        reference = ev["subject"].get("declared_by")
        match = POLICY_REF.fullmatch(reference) if isinstance(reference, str) else None
        if not match:
            raise ValueError("OpenShell event needs a policy sha256 reference from its adapter input")
        source = ev["claim"].get("source_sha256")
        if not isinstance(source, str) or not SHA256.fullmatch(source):
            raise ValueError("OpenShell event needs its source-report sha256")
        provenance.append({
            "csoai.export.profile": PROFILE,
            "csoai.subject.declared_by": reference,
            "csoai.policy.input_sha256": match.group(1),
            "csoai.source.sha256": source,
        })
    # Validate the whole batch before emitting anything. Retained events stay unchanged.
    out = otel.render_batch(events)
    scope = out["resourceLogs"][0]["scopeLogs"][0]
    scope["scope"] = {"name": "csoai.evidence-fabric.openshell-policy-provenance", "version": "0.1.0"}
    for record, extra in zip(scope["logRecords"], provenance):
        record["attributes"].extend({"key": key, "value": {"stringValue": value}}
                                    for key, value in sorted(extra.items()))
        record["attributes"].sort(key=lambda item: item["key"])
    return out


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    if len(args) != 1:
        print("usage: openshell_otel.py EVENTS.jsonl", file=sys.stderr)
        return 2
    try:
        out = render_batch(E.read_jsonl(args[0]))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"OpenShell export rejected: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(out, ensure_ascii=False, sort_keys=True, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
