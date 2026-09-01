#!/usr/bin/env python3
"""AIBOM for a MEASURED lineage — CycloneDX 1.6 + SPDX 3.0, signed-CAPABLE (J31).

Picks ONE model that already has signed measurement cards in
`public/signed/card_index.json` (default: clan-csoai-plain:latest), and emits:

  1. a CycloneDX 1.6 BOM  (real schema; component type machine-learning-model + modelCard
     whose quantitativeAnalysis carries the MEASURED per-axis accuracy from the signed cards),
  2. an SPDX 3.0 document (JSON-LD, AI profile; software_AIPackage element),
  3. a QUEUED card-v0 (surface aibom.document) that folds `bom_sha256` (and `spdx_sha256`)
     into a card field, referencing the measured card shas.

Honesty:
  - Only fields that can be filled from the signed bytes are populated. Anything we cannot
    read honestly is left out or listed in `unmeasured[]` — never invented, never zero.
  - The BOM does NOT stamp MEASURED; the MEASURED evidence is the pre-existing signed cards.
  - The card is written QUEUED (sig_ed25519=null); GHA #card-attestation-1 signs. NO_LAPTOP_SIGN.

Usage:  python3 packages/aibom/emit.py [--model clan-csoai-plain:latest] [--write]
        (--write persists the three files under public/interop/cards/aibom/)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "public" / "signed" / "card_index.json"
CARDS = ROOT / "public" / "signed" / "cards"
OUT = ROOT / "public" / "interop" / "cards" / "aibom"
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
BANK = ROOT / "public" / "datasets" / "gspc-axis-v0.1.0" / "gspc-axis.jsonl"


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_file(p: Path) -> str | None:
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None


def lineage(model: str) -> dict:
    """Read the signed index; collect every measured card for `model`. No re-measurement."""
    idx = json.loads(INDEX.read_text())
    rows = []
    for c in idx["cards"]:
        body = json.loads((CARDS / f"{c['card']}.json").read_text())["body"]
        if body.get("model") == model:
            rows.append({"axis": body["axis"], "accuracy": body.get("accuracy"), "card_sha256": c["card"], "created": body.get("created")})
    if not rows:
        raise SystemExit(f"no signed measurement card for model {model!r} — refuse to invent a lineage")
    return {"model": model, "measurements": sorted(rows, key=lambda r: r["axis"]), "pubkey": idx.get("pubkey"), "index_head": idx.get("head")}


def cyclonedx(lin: dict) -> dict:
    model = lin["model"]
    bank_hash = sha256_file(BANK)
    metrics = [
        {"type": "accuracy", "value": str(m["accuracy"]), "slice": m["axis"]}
        for m in lin["measurements"]
        if m["accuracy"] is not None
    ]
    unmeasured = [m["axis"] for m in lin["measurements"] if m["accuracy"] is None]
    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": "urn:uuid:" + hashlib.sha256((model + AS_OF).encode()).hexdigest()[:32],
        "version": 1,
        "metadata": {
            "timestamp": AS_OF,
            "tools": {"components": [{"type": "application", "name": "csoai-aibom", "version": "0.1.0"}]},
            "component": {"type": "machine-learning-model", "bom-ref": f"model:{model}", "name": model},
        },
        "components": [
            {
                "type": "machine-learning-model",
                "bom-ref": f"model:{model}",
                "name": model,
                "modelCard": {
                    "modelParameters": {"task": "GSPC behavioural measurement (care-refusal axis family)"},
                    "quantitativeAnalysis": {"performanceMetrics": metrics},
                    "considerations": {
                        "technicalLimitations": [
                            "Metrics are per-axis accuracy on the frozen GSPC bank ONLY, not a general property.",
                            "A signature is an integrity claim, not a truth claim; see the signed cards.",
                        ]
                    },
                },
                "externalReferences": [
                    {"type": "attestation", "url": f"https://councilof.ai/signed/cards/{m['card_sha256']}.json"}
                    for m in lin["measurements"]
                ],
            },
            {
                "type": "data",
                "bom-ref": "dataset:gspc-axis-v0.1.0",
                "name": "gspc-axis frozen bank",
                "version": "v0.1.0",
                "hashes": ([{"alg": "SHA-256", "content": bank_hash}] if bank_hash else []),
            },
            {
                "type": "application",
                "bom-ref": "harness:owem-card-pipeline",
                "name": "csoai-owem card_pipeline",
                "description": "deterministic behaviour-class judge; UNMEASURED never 0",
            },
        ],
        "x_csoai": {
            "kind": "csoai.aibom/0.1",
            "writes_board": False,
            "measured_evidence": [m["card_sha256"] for m in lin["measurements"]],
            "unmeasured": unmeasured,
            "honesty": "Assembled from the signed cards only. Does NOT stamp MEASURED; the evidence is the signed cards it references. Not a GSPC score.",
        },
    }
    bom["x_csoai"]["bom_sha256"] = hashlib.sha256(canonical(bom)).hexdigest()
    return bom


def spdx3(lin: dict) -> dict:
    """Minimal honest SPDX 3.0 (JSON-LD) AI-profile document."""
    model = lin["model"]
    doc = {
        "@context": "https://spdx.org/rdf/3.0.1/spdx-context.jsonld",
        "@graph": [
            {
                "type": "CreationInfo",
                "@id": "_:creationinfo",
                "specVersion": "3.0.1",
                "created": AS_OF,
                "createdBy": ["_:csoai"],
            },
            {"type": "Agent", "@id": "_:csoai", "name": "CSOAI Ltd (UK 16939677)"},
            {
                "type": "SpdxDocument",
                "@id": "_:document",
                "creationInfo": "_:creationinfo",
                "profileConformance": ["core", "software", "ai"],
                "rootElement": [f"_:aipackage-{hashlib.sha256(model.encode()).hexdigest()[:8]}"],
            },
            {
                "type": "ai_AIPackage",
                "@id": f"_:aipackage-{hashlib.sha256(model.encode()).hexdigest()[:8]}",
                "creationInfo": "_:creationinfo",
                "name": model,
                "ai_typeOfModel": ["behavioural-measurement-subject"],
                "ai_informationAboutTraining": "NOASSERTION",
                "ai_limitation": "Per-axis accuracy on the frozen GSPC bank only; not a general property.",
            },
        ],
    }
    raw = canonical(doc)
    return {"doc": doc, "spdx_sha256": hashlib.sha256(raw).hexdigest()}


def queued_card(lin: dict, bom_sha256: str, spdx_sha256: str) -> dict:
    payload = {
        "model": lin["model"],
        "aibom_format": "CycloneDX-1.6+SPDX-3.0.1",
        "bom_sha256": bom_sha256,
        "spdx_sha256": spdx_sha256,
        "measured_card_shas": [m["card_sha256"] for m in lin["measurements"]],
        "signing_pubkey": lin.get("pubkey"),
        "unmeasured": [f"{m['axis']} accuracy" for m in lin["measurements"] if m["accuracy"] is None],
    }
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "aibom.document",
        "subject": f"AIBOM / {lin['model']}",
        "as_of": AS_OF,
        "source_urls": ["https://councilof.ai/signed/card_index.json"]
        + [f"https://councilof.ai/signed/cards/{m['card_sha256']}.json" for m in lin["measurements"]],
        "payload": payload,
        "sha256": hashlib.sha256(canonical(payload)).hexdigest(),
        "sig_ed25519": None,
        "unmeasured": payload["unmeasured"],
        "signing": "QUEUED for GHA under did:web:csoai.org#card-attestation-1. NO_LAPTOP_SIGN.",
    }
    return card


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="clan-csoai-plain:latest")
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    lin = lineage(args.model)
    bom = cyclonedx(lin)
    spdx = spdx3(lin)
    card = queued_card(lin, bom["x_csoai"]["bom_sha256"], spdx["spdx_sha256"])

    if args.write:
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / "cyclonedx.json").write_text(json.dumps(bom, indent=1) + "\n")
        (OUT / "spdx3.json").write_text(json.dumps(spdx["doc"], indent=1) + "\n")
        raw = json.dumps(card, indent=1, ensure_ascii=False) + "\n"
        if len(raw.encode()) > 3072:
            raise SystemExit(f"HALT aibom card {len(raw.encode())}B > 3KB")
        (OUT / "aibom-card.json").write_text(raw)
        print(f"wrote {OUT.relative_to(ROOT)}/ · bom_sha256={bom['x_csoai']['bom_sha256'][:16]} card_sha={card['sha256'][:16]}")
    else:
        json.dump({"bom_sha256": bom["x_csoai"]["bom_sha256"], "spdx_sha256": spdx["spdx_sha256"], "card": card}, sys.stdout, indent=2)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
