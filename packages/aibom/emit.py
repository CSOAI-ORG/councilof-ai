#!/usr/bin/env python3
"""AIBOM for a MEASURED lineage — CycloneDX 1.6 + SPDX 3.0, with pinned Ed25519 card verification.

Picks ONE model that already has signed measurement cards in
`public/signed/card_index.json` (default: clan-csoai-plain:latest), verifies every
referenced card's canonical body sha256 and Ed25519 signature under the pinned keys
parsed from `public/signed/verify-card.mjs`, and emits:

  1. a CycloneDX 1.6 BOM  (real schema; component type machine-learning-model + modelCard
     whose quantitativeAnalysis carries the MEASURED per-axis accuracy from the verified cards),
  2. an SPDX 3.0 document (JSON-LD, AI profile; ai_AIPackage element),
  3. a QUEUED card-v0 (surface aibom.document) that folds `bom_sha256` (and `spdx_sha256`)
     into a card field, referencing the verified card shas.

Honesty:
  - Three verdicts, never two: VALID, INVALID (with reason), or UNCHECKABLE.
  - Only cards that verify VALID become measured evidence. Unverified cards are listed in
    `x_csoai.unverified_cards` and their axes are carried in `x_csoai.unmeasured`.
  - If not one card reaches VALID, the exporter fails closed with SystemExit.
  - The card is written QUEUED (sig_ed25519=null); GHA #card-attestation-1 signs. NO_LAPTOP_SIGN.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Tuple

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "public" / "signed" / "card_index.json"
CARDS = ROOT / "public" / "signed" / "cards"
VERIFY_MJS = ROOT / "public" / "signed" / "verify-card.mjs"
OUT = ROOT / "public" / "interop" / "cards" / "aibom"
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
BANK = ROOT / "public" / "datasets" / "gspc-axis-v0.1.0" / "gspc-axis.jsonl"

ACCEPTED_PREIMAGE_RULES = {
    "cpython-v1",
    "json.dumps(body, sort_keys=True, separators=(',', ':'))",
    "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')",
    "json.dumps(body, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode('utf-8')",
}


def load_pinned_keys() -> Tuple[str, str, Dict[str, str]]:
    """Parse pinned Ed25519 keys from public/signed/verify-card.mjs so no second copy drifts."""
    raw = VERIFY_MJS.read_text(encoding="utf-8")
    m_kid = re.search(r'const\s+CARD_KEY_ID\s*=\s*"([^"]+)"', raw)
    m_pub = re.search(r'const\s+PINNED_PUBKEY_HEX\s*=\s*\n?\s*"([0-9a-f]{64})"', raw)
    if not m_kid or not m_pub:
        raise RuntimeError("Could not parse CARD_KEY_ID / PINNED_PUBKEY_HEX from verify-card.mjs")
    card_key_id = m_kid.group(1)
    pinned_pubkey_hex = m_pub.group(1)
    did_keys: Dict[str, str] = {card_key_id: pinned_pubkey_hex}
    for m_did in re.finditer(r'"(did:web:[^"]+)"\s*:\s*"([0-9a-f]{64})"', raw):
        did_keys[m_did.group(1)] = m_did.group(2)
    return card_key_id, pinned_pubkey_hex, did_keys


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def canonical_cpython_v1(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def sha256_file(p: Path) -> str | None:
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None


def verify_card(card: Any) -> Dict[str, Any]:
    """Verify a signed GSPC card with three-state verdict: VALID | INVALID | UNCHECKABLE."""
    if not isinstance(card, dict) or not isinstance(card.get("body"), dict):
        return {"verdict": "UNCHECKABLE", "reason": "not a card: no body"}
    sig_hex = card.get("signature")
    card_id = card.get("id")
    if not isinstance(sig_hex, str) or not sig_hex or not isinstance(card_id, str) or not card_id:
        return {"verdict": "UNCHECKABLE", "reason": "missing signature or id"}

    has_pubkey = isinstance(card.get("pubkey"), str) and bool(card.get("pubkey"))
    has_did = isinstance(card.get("did"), str) and bool(card.get("did"))
    if not has_pubkey and not has_did:
        return {"verdict": "UNCHECKABLE", "reason": "card names neither an inline public key nor a DID key reference"}
    if has_pubkey and has_did:
        return {"verdict": "UNCHECKABLE", "reason": "card names two key authorities; verifier will not guess"}

    card_key_id, pinned_pubkey_hex, pinned_did_keys = load_pinned_keys()
    if has_did:
        did_ref = str(card["did"])
        key_hex = pinned_did_keys.get(did_ref)
        key_id = did_ref
        if not key_hex:
            return {"verdict": "UNCHECKABLE", "reason": f"DID key reference {did_ref} is not pinned by this verifier"}
    else:
        if card["pubkey"] != pinned_pubkey_hex:
            return {"verdict": "INVALID", "reason": "pubkey is not the published card-attestation key"}
        key_hex = pinned_pubkey_hex
        key_id = card_key_id

    rule = card.get("preimage_rule") or card.get("preimage") or card.get("canon") or "cpython-v1"
    if rule in ACCEPTED_PREIMAGE_RULES:
        preimage = canonical_cpython_v1(card["body"])
    elif rule in ("jcs-rfc8785", "sha256(canonical body)"):
        preimage = canonical(card["body"])
    else:
        return {"verdict": "UNCHECKABLE", "reason": f"unimplemented preimage_rule: {rule}"}

    digest = hashlib.sha256(preimage).hexdigest()
    if digest != card_id:
        return {"verdict": "INVALID", "reason": f"id mismatch: body hashes to {digest[:16]}…"}

    try:
        sig_bytes = bytes.fromhex(sig_hex)
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(key_hex))
    except Exception as exc:
        return {"verdict": "UNCHECKABLE", "reason": f"malformed key or signature hex: {exc}"}

    try:
        pub.verify(sig_bytes, preimage)
    except Exception:
        return {"verdict": "INVALID", "reason": "signature does not verify under the pinned key"}

    return {
        "verdict": "VALID",
        "id": card_id,
        "axis": card["body"].get("axis"),
        "model": card["body"].get("model"),
        "key_id": key_id,
    }


def verify_all_indexed_cards() -> Dict[str, Any]:
    """Verify all 335 cards listed in public/signed/card_index.json."""
    idx = json.loads(INDEX.read_text(encoding="utf-8"))
    counts = {"VALID": 0, "INVALID": 0, "UNCHECKABLE": 0}
    non_valid = []
    axes_seen = set()
    models_seen = set()
    for entry in idx.get("cards", []):
        cid = entry["card"]
        cpath = CARDS / f"{cid}.json"
        if not cpath.exists():
            counts["UNCHECKABLE"] += 1
            non_valid.append({"card": cid, "verdict": "UNCHECKABLE", "reason": "card file missing on disk"})
            continue
        card_obj = json.loads(cpath.read_text(encoding="utf-8"))
        res = verify_card(card_obj)
        v = res["verdict"]
        counts[v] = counts.get(v, 0) + 1
        if v == "VALID":
            if res.get("axis"):
                axes_seen.add(res["axis"])
            if res.get("model"):
                models_seen.add(res["model"])
        else:
            non_valid.append({"card": cid, "verdict": v, "reason": res.get("reason")})
    return {
        "schema": "csoai.signed-card-corpus-verification/1.0",
        "verified_at": AS_OF,
        "corpus": "public/signed/card_index.json",
        "index_n_cards": idx.get("n_cards", len(idx.get("cards", []))),
        "index_packaged_at": idx.get("packaged_at"),
        "counts": counts,
        "unique_axes_verified": sorted(axes_seen),
        "unique_models_verified_count": len(models_seen),
        "non_valid_cards": non_valid,
    }


def lineage(model: str, card_overrides: Dict[str, Dict[str, Any]] | None = None) -> dict:
    """Read the signed index; verify every referenced card for `model` under the pinned key."""
    idx = json.loads(INDEX.read_text(encoding="utf-8"))
    rows = []
    unverified = []
    verdict_counts = {"VALID": 0, "INVALID": 0, "UNCHECKABLE": 0}
    for c in idx["cards"]:
        cid = c["card"]
        card_obj = (
            card_overrides[cid]
            if (card_overrides and cid in card_overrides)
            else json.loads((CARDS / f"{cid}.json").read_text(encoding="utf-8"))
        )
        body = card_obj.get("body") or {}
        if body.get("model") != model:
            continue
        ver = verify_card(card_obj)
        v = ver["verdict"]
        verdict_counts[v] = verdict_counts.get(v, 0) + 1
        if v == "VALID":
            rows.append(
                {
                    "axis": body["axis"],
                    "accuracy": body.get("accuracy"),
                    "card_sha256": cid,
                    "created": body.get("created"),
                    "verdict": "VALID",
                }
            )
        else:
            unverified.append(
                {
                    "card_sha256": cid,
                    "axis": body.get("axis"),
                    "verdict": v,
                    "reason": ver.get("reason"),
                }
            )
    if not rows:
        raise SystemExit(f"no VALID signed measurement card for model {model!r} — refuse to invent a lineage")
    return {
        "model": model,
        "measurements": sorted(rows, key=lambda r: r["axis"]),
        "unverified_cards": unverified,
        "verdict_counts": verdict_counts,
        "pubkey": idx.get("pubkey"),
        "index_head": idx.get("head"),
        "index_n_cards": idx.get("n_cards"),
        "index_packaged_at": idx.get("packaged_at"),
    }


def _format_uuid_urn(raw_hex32: str) -> str:
    h = raw_hex32[:32]
    return f"urn:uuid:{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


def cyclonedx(lin: dict) -> dict:
    model = lin["model"]
    bank_hash = sha256_file(BANK)
    metrics = [
        {"type": "accuracy", "value": str(m["accuracy"]), "slice": m["axis"]}
        for m in lin["measurements"]
        if m["accuracy"] is not None
    ]
    unmeasured = [m["axis"] for m in lin["measurements"] if m["accuracy"] is None] + [
        u["axis"] for u in lin.get("unverified_cards", []) if u.get("axis")
    ]
    serial_hex = hashlib.sha256((model + AS_OF).encode()).hexdigest()[:32]
    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": _format_uuid_urn(serial_hex),
        "version": 1,
        "metadata": {
            "timestamp": AS_OF,
            "tools": {"components": [{"type": "application", "name": "csoai-aibom", "version": "0.2.0"}]},
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
                "bom-ref": "harness:csoai-card-pipeline",
                "name": "csoai card_pipeline",
                "description": "deterministic behaviour-class judge; UNMEASURED never 0",
            },
        ],
        "x_csoai": {
            "kind": "csoai.aibom/0.2",
            "writes_board": False,
            "evidence_corpus": {
                "used": "public/signed/card_index.json",
                "n_cards": lin.get("index_n_cards"),
                "packaged_at": lin.get("index_packaged_at"),
                "unused_separate_corpora": [
                    "public/root.json (public-root leaf corpus)",
                    "public/interop/mill-cards-signed/ (mill-card corpus)",
                ],
            },
            "verdict_counts": lin.get("verdict_counts"),
            "measured_evidence": [m["card_sha256"] for m in lin["measurements"]],
            "unverified_cards": lin.get("unverified_cards", []),
            "unmeasured": unmeasured,
            "honesty": "Independently verified against the pinned Ed25519 key in public/signed/verify-card.mjs. Does NOT stamp MEASURED; the evidence is the verified signed cards it references. Not a GSPC score.",
        },
    }
    bom["x_csoai"]["bom_sha256"] = hashlib.sha256(canonical(bom)).hexdigest()
    return bom


def cyclonedx_strict(lin: dict) -> dict:
    """Emit CycloneDX 1.6 strict schema-valid document (using root properties[] instead of x_csoai)."""
    bom = cyclonedx(lin)
    xc = bom.pop("x_csoai")
    props = [
        {"name": "csoai:kind", "value": str(xc["kind"])},
        {"name": "csoai:writes_board", "value": "false" if not xc["writes_board"] else "true"},
        {"name": "csoai:measured_evidence", "value": ",".join(xc["measured_evidence"])},
        {"name": "csoai:unmeasured", "value": ",".join(xc["unmeasured"])},
        {"name": "csoai:honesty", "value": str(xc["honesty"])},
    ]
    bom["properties"] = list(props)
    bom_sha = hashlib.sha256(canonical(bom)).hexdigest()
    bom["properties"].append({"name": "csoai:bom_sha256", "value": bom_sha})
    return bom


def spdx3(lin: dict) -> dict:
    """Schema-valid SPDX 3.0.1 (JSON-LD, Draft 2020-12) AI-profile document."""
    model = lin["model"]
    short_hash = hashlib.sha256(model.encode()).hexdigest()[:8]
    doc = {
        "@context": "https://spdx.org/rdf/3.0.1/spdx-context.jsonld",
        "@graph": [
            {
                "type": "CreationInfo",
                "@id": "_:creationinfo",
                "specVersion": "3.0.1",
                "created": AS_OF,
                "createdBy": ["https://councilof.ai/spdx/agent/csoai"],
            },
            {
                "type": "Agent",
                "spdxId": "https://councilof.ai/spdx/agent/csoai",
                "creationInfo": "_:creationinfo",
                "name": "CSOAI Ltd (UK 16939677)",
            },
            {
                "type": "SpdxDocument",
                "spdxId": f"https://councilof.ai/spdx/doc/{short_hash}",
                "creationInfo": "_:creationinfo",
                "profileConformance": ["core", "software", "ai"],
                "rootElement": [f"https://councilof.ai/spdx/aipackage/{short_hash}"],
            },
            {
                "type": "ai_AIPackage",
                "spdxId": f"https://councilof.ai/spdx/aipackage/{short_hash}",
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
        "unmeasured": [f"{m['axis']} accuracy" for m in lin["measurements"] if m["accuracy"] is None]
        + [f"{u['axis']} (unverified: {u['verdict']})" for u in lin.get("unverified_cards", []) if u.get("axis")],
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
    ap.add_argument("--verify-all", action="store_true")
    args = ap.parse_args()

    if args.verify_all:
        res = verify_all_indexed_cards()
        json.dump(res, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0 if (res["counts"]["INVALID"] == 0 and res["counts"]["UNCHECKABLE"] == 0) else 1

    lin = lineage(args.model)
    bom = cyclonedx(lin)
    spdx = spdx3(lin)
    card = queued_card(lin, bom["x_csoai"]["bom_sha256"], spdx["spdx_sha256"])

    if args.write:
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / "cyclonedx.json").write_text(json.dumps(bom, indent=1) + "\n", encoding="utf-8")
        (OUT / "spdx3.json").write_text(json.dumps(spdx["doc"], indent=1) + "\n", encoding="utf-8")
        raw = json.dumps(card, indent=1, ensure_ascii=False) + "\n"
        if len(raw.encode("utf-8")) > 3072:
            raise SystemExit(f"HALT aibom card {len(raw.encode('utf-8'))}B > 3KB")
        (OUT / "aibom-card.json").write_text(raw, encoding="utf-8")
        print(f"wrote {OUT.relative_to(ROOT)}/ · bom_sha256={bom['x_csoai']['bom_sha256'][:16]} card_sha={card['sha256'][:16]}")
    else:
        json.dump({"bom_sha256": bom["x_csoai"]["bom_sha256"], "spdx_sha256": spdx["spdx_sha256"], "card": card}, sys.stdout, indent=2)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
