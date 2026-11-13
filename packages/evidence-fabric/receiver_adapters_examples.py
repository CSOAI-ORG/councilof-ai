#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Generate and transform clearly synthetic native contract examples, offline."""
import argparse
import json
import pathlib

import event as E
import receiver_adapters as A


def build(output):
    output = pathlib.Path(output)
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        raise ValueError("example output must be empty")
    inputs = output / "inputs"
    inputs.mkdir()
    stamp = A.utc_now()
    raw = b'{"synthetic_evidence_file":true}\n'
    (inputs / "turing-evidence.json").write_bytes(raw)
    evidence_id = "1cb47b95-8bf8-3bad-a5a4-0d54d86e10ce"
    evidence_url = "https://example.invalid/retained-evidence"
    source_url = "https://assuranceplatform.azurewebsites.net/api/public/discover/synthetic-contract-fixture"
    def node(identifier, kind, children=None):
        return {"id": identifier, "type": kind, "name": "synthetic contract fixture", "description": "not a real case",
                "inSandbox": False, "children": children or []}
    evidence = {**node(evidence_id, "EVIDENCE"), "url": evidence_url, "assertionStatus": "NEEDS_SUPPORT"}
    claim = node("d0d067fa-dd0f-4df4-8a74-f9a38ae31001", "PROPERTY_CLAIM", [evidence])
    snapshot = {"id": "synthetic-published-record-not-a-real-case", "type": "ASSURANCE_CASE",
                "slug": "synthetic-contract-fixture", "title": "Synthetic Turing TEA contract fixture",
                "publishedAt": stamp, "archivedAt": None, "authors": None, "sector": None,
                "description": None, "featureImageUrl": None,
                "content": {"version": "1.0", "exportedAt": stamp,
                            "case": {"name": "synthetic fixture", "description": "not a real assurance case"},
                            "tree": node("da89e38e-95e7-44ca-aa7d-f3b6b34c7fab", "GOAL", [claim]),
                            "pluginData": {"synthetic": {"opaque": True}}}}
    snapshot_raw = E.jcs(snapshot) + b"\n"
    (inputs / "turing-public-snapshot.json").write_bytes(snapshot_raw)
    capture = {"source_url": source_url, "captured_at": stamp, "snapshot_sha256": A.sha(snapshot_raw),
               "source_kind": "SYNTHETIC_CONTRACT_FIXTURE", "evidence_pins": {
                   evidence_id: {"url_sha256": A.sha(evidence_url.encode()), "content_sha256": A.sha(raw)}}}
    (inputs / "turing-capture.json").write_bytes(E.jcs(capture) + b"\n")
    (inputs / "turing-evidence-map.json").write_bytes(E.jcs({evidence_id: "turing-evidence.json"}) + b"\n")
    result = {"id": "synthetic-contract-fixture-not-a-real-run", "start_time": 1.0, "end_time": 2.0,
              "duration": 1, "status": "COMPLETED", "raw_results": {}, "results": {}, "params": {}}
    result_raw = E.jcs(result) + b"\n"
    (inputs / "moonshot-result.json").write_bytes(result_raw)
    pins = {"result_sha256": A.sha(result_raw), "toolkit_commit": A.MOONSHOT_COMMIT,
            "method_sha256": A.sha(b"synthetic-method-not-a-real-execution"),
            "inputs_sha256": A.sha(b"synthetic-inputs-not-a-real-execution"),
            "subject_ref": "fixture://not-a-real-moonshot-run", "source_kind": "SYNTHETIC_CONTRACT_FIXTURE"}
    (inputs / "moonshot-run-pins.json").write_bytes(E.jcs(pins) + b"\n")
    ev = E.build(subject={"kind": "sandbox_run", "locator": "fixture://categorical-carrier"},
                 claim={"text": "Synthetic carrier fixture; no receiver trace has been observed.", "read_at": stamp},
                 method={"id": "native-carrier-contract-fixture", "version": "1", "holder": "csoai"},
                 declared={}, observed={}, state="UNCHECKABLE", value=None,
                 limits=["Synthetic state and trace-binding fixture only; no receiver import or model execution."])
    E.write_jsonl(str(inputs / "events.jsonl"), [ev])
    (inputs / "langfuse-trace-map.json").write_bytes(E.jcs({ev["event_id"]: {
        "trace_id": "1" * 32, "binding_kind": "SYNTHETIC_CONTRACT_FIXTURE_NOT_OBSERVED_TRACE"}}) + b"\n")
    A.main(["langfuse", "--events", str(inputs / "events.jsonl"), "--trace-map", str(inputs / "langfuse-trace-map.json"),
            "--out", str(output / "langfuse-create-scores.json")])
    A.main(["tea", "--snapshot", str(inputs / "turing-public-snapshot.json"), "--capture", str(inputs / "turing-capture.json"),
            "--evidence-map", str(inputs / "turing-evidence-map.json"), "--evidence-root", str(inputs),
            "--out", str(output / "turing-tea-evidence-events.jsonl")])
    A.main(["moonshot", "--result", str(inputs / "moonshot-result.json"), "--pins", str(inputs / "moonshot-run-pins.json"),
            "--out", str(output / "moonshot-evidence-event.json")])
    receipt = {"status": "SYNTHETIC_CONTRACT_EXAMPLES_ONLY", "read_at": stamp,
               "receiver_acceptance": "NOT_ESTABLISHED", "independent_executor": None,
               "files": {p.relative_to(output).as_posix(): A.sha(p.read_bytes())
                         for p in sorted(output.rglob("*")) if p.is_file()},
               "limits": ["Native contract transformations executed locally; no external receiver or model call.",
                          "Moonshot lifecycle times and Langfuse trace ID are synthetic input fixtures, not captured runtime evidence."]}
    (output / "receipt.json").write_bytes(E.jcs(receipt) + b"\n")
    return receipt


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    print(json.dumps(build(args.out), sort_keys=True))
