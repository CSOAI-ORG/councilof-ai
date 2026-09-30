#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""evidence event -> in-toto Statement v1 (one per event).

    python3 render/intoto.py EVENTS.jsonl > statements.jsonl

predicateType is our own: https://councilof.ai/spec/evidence-event/v0.1, and the predicate is the event.
Why not eval-result/v0.1 (in-toto/attestation PR #575, open, head 0c70fc3c, read 30 Sep 2026): that draft
REQUIRES claims[].passed (a threshold verdict), sampleSize and exactly one model and one dataset
identity. A declared-vs-observed record has no threshold, no verdict and usually no model. Filling those
fields would invent a pass mark. The gap is documented in README.md, not papered over.

subject[0].digest.sha256 = the hex of event_id (sha256 over the event's JCS bytes without
event_id/signature/anchors), so a consumer matching on the digest alone finds the event.
The DSSE envelope is emitted UNSIGNED: /api/board-sign signs canonical JSON, not DSSE PAE bytes; the batch
signature (csoai.signed-run/0.1) covers these events through events_file.sha256.
"""
import base64, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from render import E, guard  # noqa: E402

STATEMENT_TYPE = "https://in-toto.io/Statement/v1"
PREDICATE_TYPE = "https://councilof.ai/spec/evidence-event/v0.1"


def assurance(ev):
    h = ev["method"]["holder"]
    return "third_party" if h == "csoai" else "reproduced"


def statement(ev):
    guard(ev)
    pred = {k: v for k, v in ev.items() if k != "event_id"}
    if ev["state"] in E.NO_NUMBER_STATES:
        pred["value"] = None
    pred["assuranceLevel"] = assurance(ev)
    return {"_type": STATEMENT_TYPE,
            "subject": [{"name": ev["event_id"], "digest": {"sha256": ev["event_id"].split(":", 1)[1]}}],
            "predicateType": PREDICATE_TYPE, "predicate": pred}


def dsse_unsigned(stmt):
    return {"payloadType": "application/vnd.in-toto+json",
            "payload": base64.b64encode(json.dumps(stmt, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).decode(),
            "signatures": []}


def main(argv=None):
    a = argv if argv is not None else sys.argv[1:]
    for ev in E.read_jsonl(a[0]):
        sys.stdout.write(json.dumps(statement(ev), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
