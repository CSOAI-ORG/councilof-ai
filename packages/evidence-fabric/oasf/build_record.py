#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Our OASF 1.1.0 record WITH a core/evaluation module (id 102) that points at signed evidence -- a NEW sibling of
the AGNTCY lane's draft, which is read and never edited.

    python3 oasf/build_record.py --draft .../proposals/ai.councilof.gspc.oasf.draft.json --served-version 1.4.3 \
        --created-at <UTC> > ai.councilof.gspc.oasf.evidence.json
    jsonschema -i ai.councilof.gspc.oasf.evidence.json .../proposals/oasf-record-1.1.0.schema.json

The evaluation module uses referred_evaluations[].datasets (pointers + metadata). It carries NO overall_rating and
NO overall_scores: we publish measurements with states, not a grade. --served-version is what /mcp/free
serverInfo.version answers at build time (the draft pinned 1.4.2; the registry isLatest and the live server both
read 1.4.3 on 30 Sep 2026), so the record does not disagree with the server it describes.
"""
import argparse, copy, hashlib, json, sys


def build(draft, served_version, created_at):
    r = copy.deepcopy(draft)
    r["version"] = served_version
    r["created_at"] = created_at
    for m in r.get("modules", []):
        if m.get("name") == "integration/mcp":
            m["data"]["mcp_data"]["version"] = served_version
    r.setdefault("annotations", {})["derived_from"] = "proposals/ai.councilof.gspc.oasf.draft.json (AGNTCY lane, unedited), sha256:" + \
        hashlib.sha256(json.dumps(draft, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:16]
    r["modules"].append({
        "name": "core/evaluation", "id": 102,
        "annotations": {"event_schema": "csoai.evidence-event/0.1",
                        "states": "CONSISTENT DIVERGENT PARTIAL UNMEASURED UNCHECKABLE NOT_DISCRIMINATING",
                        "not_a_grade": "No overall rating or score is given; each record states declared vs observed and its limits."},
        "data": {"referred_evaluations": [{
            "created_at": created_at,
            "publisher": {"name": "CSOAI Ltd (Council of AI)", "version": "evidence-fabric 0.1.0", "url": "https://councilof.ai"},
            "datasets": [
                {"name": "GSPC board (signed, live)", "url": "https://councilof.ai/api/gspc", "version": created_at[:10],
                 "metadata": [{"name": "signature", "value": "Ed25519 did:web:csoai.org#board-attestation-1"},
                              {"name": "unmeasured_rule", "value": "UNMEASURED carries value null; never a number"}]},
                {"name": "Corrections ledger (signed)", "url": "https://councilof.ai/api/corrections", "version": created_at[:10],
                 "metadata": [{"name": "rule", "value": "a correction is a new record naming the replaced one by sha256"}]}]}]}})
    return r


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--draft", required=True); ap.add_argument("--served-version", required=True); ap.add_argument("--created-at", required=True)
    a = ap.parse_args(argv)
    print(json.dumps(build(json.load(open(a.draft)), a.served_version, a.created_at), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
