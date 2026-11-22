#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Public, deterministic JSON-LD projection for frozen historical GSPC cells.

Reuse existing GSPC ontology concepts (Bank, Cell) and PROV-O. Never alter the
frozen source, infer unknown grades, claim cryptographic attestation, or leak
unpublished data. It is a read-only *projection* with separate digest.
"""
from __future__ import annotations

import hashlib
import json

from audit_public_fact_ontology import DEFAULT_REV, analyse, fetch, jsonl

SCHEMA = "csoai.gspc-fact-ontology-projection-research/0.1"
GSPC_NS = "https://councilof.ai/ns/gspc/0.1/"

CONTEXT = {
    "gspc": GSPC_NS,
    "prov": "http://www.w3.org/ns/prov#",
    "dcterms": "http://purl.org/dc/terms/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "n": {"@id": "gspc:n", "@type": "xsd:nonNegativeInteger"},
    "accuracy": {"@id": "gspc:accuracy", "@type": "xsd:decimal"},
    "source": {"@id": "prov:wasDerivedFrom", "@type": "@id"},
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def project(manifest, measurements, items, cells, *, source_bytes_sha256, revision):
    audit = analyse(manifest, measurements, items, cells)
    if audit["errors"]:
        raise ValueError("source audit failed: " + "; ".join(audit["errors"]))
    if (not isinstance(revision, str) or len(revision)!=40
            or any(c not in "0123456789abcdef" for c in revision)):
        raise ValueError("source revision must be a pinned git SHA-1")
    if len(source_bytes_sha256)!=64 or any(c not in "0123456789abcdef" for c in source_bytes_sha256):
        raise ValueError("source digest invalid")
    origin = "urn:sha256:" + source_bytes_sha256
    graph = [
        {"@id": origin, "@type": "prov:Entity",
         "dcterms:identifier": "csoai/gspc-fact-table@git:" + revision + "/gspc_cells.jsonl"}
    ]
    bank_refs = {}
    for c in cells:
        b = c.get("bank_sha256")
        if not isinstance(b,str) or len(b)!=64 or any(k not in "0123456789abcdef" for k in b):
            raise ValueError("invalid bank sha256")
        bank_refs.setdefault(b,c.get("bank_dataset"))
        if bank_refs[b] != c.get("bank_dataset"):
            raise ValueError("bank has conflicting dataset sources")
    for sha, dataset in sorted(bank_refs.items()):
        graph.append({
            "@id":"urn:sha256:"+sha,"@type":"gspc:Bank",
            "dcterms:identifier":dataset if dataset else "UNKNOWN",
            "source":origin,
        })
    seen = set()
    for c in sorted(cells,key=lambda row: row["cell_sha256"]):
        sha = c["cell_sha256"]
        if not isinstance(sha,str) or len(sha)!=64 or any(k not in "0123456789abcdef" for k in sha):
            raise ValueError("invalid cell digest")
        if sha in seen:
            raise ValueError("duplicate cell identity")
        seen.add(sha)
        n = c["n_graded"]
        ok = c["n_ok"]
        if not isinstance(n,int) or not isinstance(ok,int) or not (0 <= ok <= n):
            raise ValueError("invalid cell counts")
        cell = {
            "@id":"urn:sha256:"+sha,
            "@type":"gspc:Cell",
            "dcterms:identifier":c["cell"],
            "dcterms:subject":[str(c.get("axis","UNKNOWN")),str(c.get("model") or "UNATTRIBUTED")],
            "source":"urn:sha256:"+c["bank_sha256"],
            "n":n,
        }
        if n:
            cell["accuracy"]=round(ok/n,12)
        # n=0 stays ungraded rather than silently treated as 0% accuracy.
        graph.append(cell)
    output = {
        "schema":SCHEMA, "evidence_state":"RESEARCH_PROJECTION_NOT_SIGNED",
        "source_revision":revision, "source_sha256":source_bytes_sha256,
        "original_frozen_data_unchanged":True,
        "measurement_state_not_inferred":True,
        "signed_card_not_established":True,
        "not_heldout":True,
        "ontology_namespace":GSPC_NS,
        "graph": {"@context":CONTEXT,"@graph":graph},
        "counts":{"banks":len(bank_refs),"cells":len(seen),
                  "graded_rows":sum(c["n_graded"] for c in cells),
                  "source_rows":len(measurements),
                  "rows_ungraded":audit["rows_ungraded"],
                  "rows_unattributed":audit["rows_unattributed"]},
        "known_limitations":[
            "Projection identity is derived from archived public cell digest; this is not a signature",
            "The publisher's frozen data are not independently verified ground truth",
            "Missing grades and model identifiers remain explicitly missing",
            "No normative MEASURED or VALID state is inferred from row counts",
            "No new ontology namespace or canonical vocabulary state is installed",
        ],
    }
    data=json.dumps(output,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    output["receipt_sha256"]=digest(data)
    return output


def main():
    raw={n:fetch(DEFAULT_REV,n) for n in
         ("MANIFEST.json","gspc_measurements.jsonl","gspc_items.jsonl","gspc_cells.jsonl")}
    report = project(json.loads(raw["MANIFEST.json"]),
                     jsonl(raw["gspc_measurements.jsonl"]),
                     jsonl(raw["gspc_items.jsonl"]),
                     jsonl(raw["gspc_cells.jsonl"]),
                     source_bytes_sha256=digest(raw["gspc_cells.jsonl"]),
                     revision=DEFAULT_REV)
    print(json.dumps(report,sort_keys=True,indent=2))


if __name__=="__main__":
    main()
