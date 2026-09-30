#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""SAFE re-verification records (safe-reverification/0.1-draft) -> evidence events.

    python3 ingest/safe_in.py out/*.safe-rv.json > events.jsonl

This answers SAFE RFC #41 (stable event identity): each record gets an event_id, the sha256 of the JCS
bytes of its event. The SAFE profile schema is closed (additionalProperties false), so the records are
not edited; the id lives in the event and in the pack's event-ids.json, next to the record's own sha256.
State: PASS -> CONSISTENT, FAIL -> DIVERGENT, PARTIAL -> PARTIAL, UNMEASURED -> UNMEASURED, anything else
-> UNCHECKABLE. value is always null: a SAFE record's n/denominator are counts of what was read, and they
stay in observed, not in value.
"""
import hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402

STATE = {"PASS": "CONSISTENT", "FAIL": "DIVERGENT", "PARTIAL": "PARTIAL", "UNMEASURED": "UNMEASURED"}
KIND = {"huggingface-dataset-revision": "dataset", "csoai-incident-id": "web_page"}


def record_sha256(rec):
    return hashlib.sha256(json.dumps(rec, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def to_event(rec, name=None):
    res, nc, test = rec["result"], rec["negative_control"], rec["test"]
    dep = next((d for d in rec.get("dependencies", []) if d.get("uri")), None)
    exp = {"FAIL": "DIVERGENT", "PASS": "CONSISTENT"}.get(nc.get("expected"))
    got = {"FAIL": "DIVERGENT", "PASS": "CONSISTENT"}.get(nc.get("observed"), "NOT_RUN")
    return E.build(
        subject={"kind": KIND.get(rec["claim"]["subject"]["scheme"], "signed_record"),
                 "locator": rec["claim"]["subject"]["identifier"], "declared_by": rec["record_id"]},
        claim={"text": rec["claim"]["statement"], "source_url": (dep or {}).get("uri"),
               "source_sha256": ((dep or {}).get("digest") or {}).get("value"),
               "read_at": res.get("measured_at") or rec["issued_at"]},
        method={"id": "safe-rv", "version": f"{test['method_id']} | {test['method_version']}", "code_sha256": test.get("procedure_digest"),
                "holder": "csoai"},
        declared={"record_id": rec["record_id"], "record_sha256": record_sha256(rec), "profile": rec["profile"],
                  "claim": rec["claim"], "supersedes": rec.get("supersedes", []),
                  "declared_failure_modes": test.get("declared_failure_modes", []), "noise_floor": test.get("noise_floor")},
        observed={"result": res, "record_file": name},
        state=STATE.get(res["state"], "UNCHECKABLE"), value=None,
        negative_control={"id": nc.get("kind"), "expected": exp, "got": got if exp else ("NOT_RUN" if got == "NOT_RUN" else got)},
        limits=rec["limits"] or ["(record stated no limits)"])


def main(argv=None):
    for p in (argv if argv is not None else sys.argv[1:]):
        ev = to_event(json.load(open(p, encoding="utf-8")), os.path.basename(p))
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
