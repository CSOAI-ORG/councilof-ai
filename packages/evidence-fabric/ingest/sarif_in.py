#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Third-party SARIF 2.1.0 -> evidence events (the DECLARED side only).

    python3 ingest/sarif_in.py REPORT.sarif --read-at 2026-09-30T12:00:00Z [--source-url URL] > events.jsonl
    python3 ingest/sarif_in.py --export-declared events.jsonl > roundtrip.sarif

A scanner's result is a declared finding by that scanner. Until something re-observes it, the event state
is UNMEASURED with value null: we record the claim, we do not endorse or dispute it. method.holder is
third_party:<driver name> because the scanner's method made the finding.
--export-declared rebuilds a SARIF log from the declared sides; the round-trip keeps ruleId, every
location (uri + region) and level byte-for-byte (tests/test_ingest.py).
"""
import argparse, copy, hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402

KEEP = ("ruleId", "ruleIndex", "level", "kind", "message", "locations", "guid", "fingerprints", "partialFingerprints")


def _locator(res, fallback):
    for loc in res.get("locations") or []:
        uri = ((loc.get("physicalLocation") or {}).get("artifactLocation") or {}).get("uri")
        if uri:
            return uri
    return fallback


def ingest(sarif_bytes, *, read_at, source_url=None, locator_fallback="sarif:unlocated"):
    doc = json.loads(sarif_bytes)
    sha = hashlib.sha256(sarif_bytes).hexdigest()
    out = []
    for ri, run in enumerate(doc.get("runs", [])):
        drv = run.get("tool", {}).get("driver", {})
        name, ver = drv.get("name", "unknown-tool"), drv.get("version") or drv.get("semanticVersion") or "unknown"
        for i, res in enumerate(run.get("results", [])):
            declared = {"tool": {"name": name, "version": ver}, "run": ri, "index": i,
                        "result": {k: copy.deepcopy(res[k]) for k in KEEP if k in res}}
            text = ((res.get("message") or {}).get("text")) or f"{res.get('ruleId', 'result')} (no message text)"
            out.append(E.build(
                subject={"kind": "scanner_report", "locator": _locator(res, locator_fallback), "declared_by": f"{name} {ver} SARIF sha256:{sha}"},
                claim={"text": f"{name} reports: {text}", "source_url": source_url, "source_sha256": sha, "read_at": read_at},
                method={"id": "sarif-in", "version": "0.1", "code_sha256": None, "holder": f"third_party:{name}"},
                declared=declared, observed={"re_observed": False},
                state="UNMEASURED", value=None,
                negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
                limits=["Declared side only: the scanner's finding is recorded as the scanner stated it; it has not been re-observed.",
                        "A SARIF level is the scanner's own severity, not ours."]))
    return out


def export_declared(events):
    runs = {}
    for ev in events:
        d = ev["declared"]
        r = runs.setdefault(d["run"], {"tool": {"driver": {"name": d["tool"]["name"], "version": d["tool"]["version"]}}, "results": []})
        r["results"].append((d["index"], copy.deepcopy(d["result"])))
    return {"version": "2.1.0", "$schema": "https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json",
            "runs": [{"tool": runs[k]["tool"], "results": [x for _, x in sorted(runs[k]["results"], key=lambda t: t[0])]} for k in sorted(runs)]}


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("path"); ap.add_argument("--read-at"); ap.add_argument("--source-url")
    ap.add_argument("--export-declared", action="store_true")
    a = ap.parse_args(argv)
    if a.export_declared:
        print(json.dumps(export_declared(E.read_jsonl(a.path)), indent=1, ensure_ascii=False)); return 0
    if not a.read_at:
        ap.error("--read-at is required: the time the report was read is recorded, never invented")
    for ev in ingest(open(a.path, "rb").read(), read_at=a.read_at, source_url=a.source_url):
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
