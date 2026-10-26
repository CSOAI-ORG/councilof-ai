#!/usr/bin/env python3
"""AIBOM for a MEASURED lineage — CycloneDX 1.6 + SPDX 3.0, signed-CAPABLE (J31).

Picks ONE model that already has signed measurement cards in
`public/signed/card_index.json` (default: clan-csoai-plain:latest), VERIFIES every card
it references, and emits:

  1. a CycloneDX 1.6 BOM  (real schema; component type machine-learning-model + modelCard
     whose quantitativeAnalysis carries the MEASURED per-axis accuracy from the signed cards),
  2. an SPDX 3.0 document (JSON-LD, AI profile; software_AIPackage element),
  3. a QUEUED card-v0 (surface aibom.document) that folds `bom_sha256` (and `spdx_sha256`)
     into a card field, referencing the measured card shas.

VERIFICATION (added 2026-10-26 — closes the open qualification on this exporter).
The exporter used to READ the signed-card directory and describe its output as "assembled
from the signed cards" without checking a single signature. That is weaker than the words
suggest: a directory of files called `*.json` is not evidence that anything was signed. It
now, for every card it references:

  1. recomputes the card id from the canonical body bytes (the card's OWN preimage rule),
  2. verifies the Ed25519 signature over those bytes under a PINNED public key,
  3. records one of three verdicts — VALID, INVALID (with a reason) or UNCHECKABLE.

Only cards that reach VALID are used as evidence. A card that does not verify is reported
with its reason, and its axis is carried as unmeasured: never silently dropped, and never
folded into the BOM as a measurement. UNCHECKABLE is never FAIL — "could not check" is a
different claim from "forged", and it is reported as its own state.

The pin is read from `public/signed/verify-card.mjs`, the same published verifier a third
party runs, so this exporter cannot drift from the key our cards are actually pinned to.
A card carrying its OWN key proves only that the file is self-consistent, so a card whose
inline pubkey lies outside the pinned set is INVALID, while a card naming a DID key
reference outside the pinned set is UNCHECKABLE.

Honesty:
  - Only fields that can be filled from the signed bytes are populated. Anything we cannot
    read honestly is left out or listed in `unmeasured[]` — never invented, never zero.
  - The BOM does NOT stamp MEASURED; the MEASURED evidence is the pre-existing signed cards.
  - The card is written QUEUED (sig_ed25519=null); GHA #card-attestation-1 signs. NO_LAPTOP_SIGN.
  - The corpus is named exactly: the SIGNED-CARD INDEX corpus, with its count and its date.
    The public-root leaf corpus and the mill-card corpus are separate corpora, are not used
    here, and are not merged into this one.

Usage:  python3 packages/aibom/emit.py [--model clan-csoai-plain:latest] [--write]
        (--write persists the three files under public/interop/cards/aibom/)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:  # A missing Ed25519 backend is UNCHECKABLE, not a crash.
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
except Exception:  # pragma: no cover
    Ed25519PublicKey = None

    class InvalidSignature(Exception):  # type: ignore[no-redef]
        pass


ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "public" / "signed" / "card_index.json"
CARDS = ROOT / "public" / "signed" / "cards"
VERIFIER = ROOT / "public" / "signed" / "verify-card.mjs"
OUT = ROOT / "public" / "interop" / "cards" / "aibom"
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
BANK = ROOT / "public" / "datasets" / "gspc-axis-v0.1.0" / "gspc-axis.jsonl"

# The preimage rules a card may declare. v1 is the CPython form these cards were signed
# under; v2 is JCS (RFC 8785). An unknown rule is UNCHECKABLE — never a guess.
V1_RULE = "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')"
V2_RULE = "jcs-rfc8785"

PINNED_KEY_DOC = "did:web:csoai.org"


def canonical(obj: object) -> bytes:
    """Our OWN digest preimage (the BOM's own sha256). Not a card preimage."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_file(p: Path) -> str | None:
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None


def card_preimage(body: dict, rule: str) -> bytes | None:
    """The bytes a card was signed over, per the card's OWN preimage rule.

    Returns None when the rule is one we do not implement: an unknown rule is UNCHECKABLE,
    never guessed. CPython reproduces the v1 bytes exactly — that is the rule they were
    signed under — and v2 uses the repo's own JCS implementation.
    """
    if rule == V1_RULE:
        return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
    if rule == V2_RULE:
        try:
            if str(ROOT / "harness" / "arena") not in sys.path:
                sys.path.insert(0, str(ROOT / "harness" / "arena"))
            from jcs import canonicalize  # type: ignore

            return canonicalize(body).encode("utf-8")
        except Exception:
            return None
    return None


def pinned_keys() -> dict[str, str]:
    """The PINNED key set, read from the published verifier (public/signed/verify-card.mjs).

    One source of truth. A second copy of the hex in this file would let the exporter drift
    from the key our cards are pinned to, and a drifted pin is the same failure as no pin.
    Keyed by the DID fragment (e.g. "card-attestation-1"), which is what the index row
    carries in `kid`.
    """
    src = VERIFIER.read_text()
    keys: dict[str, str] = {}
    for m in re.finditer(r'"did:web:csoai\.org#([A-Za-z0-9._-]+)"\s*:\s*"([0-9a-f]{64})"', src):
        keys[m.group(1)] = m.group(2)
    cid = re.search(r'CARD_KEY_ID\s*=\s*"([^"]+)"', src)
    chex = re.search(r'PINNED_PUBKEY_HEX\s*=\s*"([0-9a-f]{64})"', src)
    if cid and chex:
        keys[cid.group(1).split("#")[-1]] = chex.group(1)
    if not keys:
        raise SystemExit(
            "no pinned card key found in public/signed/verify-card.mjs — refuse to verify against an unpinned key"
        )
    return keys


def verify_card(card: dict, row: dict) -> dict:
    """Verify ONE measurement card. Three verdicts, never two.

    VALID       — the id recomputes from the canonical body bytes AND the Ed25519 signature
                  verifies under a PINNED key.
    INVALID     — the card contradicts itself, or carries a key outside the pinned set.
    UNCHECKABLE — the check could not be completed. NOT a failure.
    """
    out: dict = {
        "card": row.get("card"),
        "axis": None,
        "verdict": None,
        "reason": None,
        "key_id": row.get("kid"),
    }
    body = card.get("body")
    if not isinstance(body, dict):
        out["verdict"] = "INVALID"
        out["reason"] = "card carries no body object"
        return out
    out["axis"] = body.get("axis")

    rule = card.get("preimage_rule") or card.get("preimage")
    if not isinstance(rule, str):
        out["verdict"] = "UNCHECKABLE"
        out["reason"] = "card names no preimage rule"
        return out
    preimage = card_preimage(body, rule)
    if preimage is None:
        out["verdict"] = "UNCHECKABLE"
        out["reason"] = f"preimage rule not implemented: {rule!r}"
        return out

    recomputed = hashlib.sha256(preimage).hexdigest()
    if recomputed != card.get("id"):
        out["verdict"] = "INVALID"
        out["reason"] = f"id does not match the canonical body bytes ({recomputed} recomputed)"
        return out

    inline = (card.get("pubkey") or "").lower()
    kid = row.get("kid") or card.get("kid")
    pinned = pinned_keys()
    if kid:
        if kid not in pinned:
            out["verdict"] = "UNCHECKABLE"
            out["reason"] = f"card names key {kid!r}, outside the pinned set"
            return out
        if inline and inline != pinned[kid]:
            out["verdict"] = "INVALID"
            out["reason"] = f"inline pubkey is outside the pinned set for {kid}"
            return out
        key_hex = pinned[kid]
        out["key_id"] = kid
    else:
        matched = [k for k, v in pinned.items() if v == inline]
        if not matched:
            out["verdict"] = "INVALID"
            out["reason"] = "inline pubkey is outside the pinned set"
            return out
        key_hex = inline
        out["key_id"] = matched[0]

    if Ed25519PublicKey is None:
        out["verdict"] = "UNCHECKABLE"
        out["reason"] = "no Ed25519 implementation available in this interpreter"
        return out
    try:
        signature = bytes.fromhex(card.get("signature") or "")
    except Exception:
        out["verdict"] = "UNCHECKABLE"
        out["reason"] = "signature is not hex"
        return out
    try:
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(key_hex)).verify(signature, preimage)
    except InvalidSignature:
        out["verdict"] = "INVALID"
        out["reason"] = "signature does not verify under the pinned key"
        return out
    except Exception as exc:
        out["verdict"] = "UNCHECKABLE"
        out["reason"] = f"signature check could not be completed: {exc}"
        return out

    out["verdict"] = "VALID"
    out["reason"] = "id recomputed from the canonical body bytes; Ed25519 verified under the pinned key"
    return out


def lineage(model: str) -> dict:
    """Read the signed index; VERIFY every card for `model`; keep only what verifies.

    No re-measurement. A card that does not verify is not evidence: its axis is reported
    unmeasured with the reason attached, and it is never folded into the BOM as a
    measurement.
    """
    idx = json.loads(INDEX.read_text())
    verified: list[dict] = []
    unverified: list[dict] = []
    for c in idx["cards"]:
        card = json.loads((CARDS / f"{c['card']}.json").read_text())
        body = card.get("body") or {}
        if body.get("model") != model:
            continue
        row = {
            "axis": body.get("axis"),
            "accuracy": body.get("accuracy"),
            "card_sha256": c["card"],
            "created": body.get("created"),
        }
        row["verification"] = verify_card(card, c)
        (verified if row["verification"]["verdict"] == "VALID" else unverified).append(row)
    if not verified:
        detail = "; ".join(
            f"{u['axis']}: {u['verification']['verdict']} ({u['verification']['reason']})" for u in unverified
        )
        raise SystemExit(
            f"no VERIFIED signed measurement card for model {model!r} — refuse to invent a lineage"
            + (f" | {detail}" if detail else "")
        )
    verified.sort(key=lambda r: r["axis"])
    unverified.sort(key=lambda r: r["axis"])
    return {
        "model": model,
        "measurements": verified,
        "unverified": unverified,
        "pubkey": idx.get("pubkey"),
        "index_head": idx.get("head"),
        "corpus": {
            "name": "signed-card index",
            "source": "public/signed/card_index.json",
            "n_cards": idx.get("n_cards"),
            "packaged_at": idx.get("packaged_at"),
        },
    }


def _counts(lin: dict) -> dict:
    c = {"VALID": 0, "INVALID": 0, "UNCHECKABLE": 0}
    for m in lin["measurements"] + lin.get("unverified", []):
        c[m["verification"]["verdict"]] = c.get(m["verification"]["verdict"], 0) + 1
    return c


def _corpus_text(lin: dict) -> str:
    cp = lin["corpus"]
    return (
        f"{cp['name']} ({cp['source']}); {cp['n_cards']} cards catalogued; "
        f"packaged_at {cp['packaged_at']}. The public-root leaf corpus and the mill-card "
        f"corpus are separate corpora; they are not used here and are not merged into this one."
    )


def _unverified_text(lin: dict) -> str:
    return " | ".join(
        f"{m['axis']}={m['verification']['verdict']}: {m['verification']['reason']}"
        for m in lin.get("unverified", [])
    )


def cyclonedx(lin: dict) -> dict:
    model = lin["model"]
    bank_hash = sha256_file(BANK)
    metrics = [
        {"type": "accuracy", "value": str(m["accuracy"]), "slice": m["axis"]}
        for m in lin["measurements"]
        if m["accuracy"] is not None
    ]
    unmeasured = [m["axis"] for m in lin["measurements"] if m["accuracy"] is None]
    unmeasured += [m["axis"] for m in lin.get("unverified", [])]
    counts = _counts(lin)
    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        # RFC 4122 textual form: 8-4-4-4-12. The old value was 32 bare hex characters, which the CycloneDX 1.6
        # schema rejects ('does not match ^urn:uuid:...$').
        "serialNumber": "urn:uuid:" + "-".join(
            (h[:8], h[8:12], h[12:16], h[16:20], h[20:32])
        ) if (h := hashlib.sha256((model + AS_OF).encode()).hexdigest()) else None,
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
                            "Only cards that this exporter re-verified appear as metrics; an unverified "
                            "card would be listed under csoai:unverified_cards, never as a measurement.",
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
        # CycloneDX 1.6 has no root extension point: a sibling "x_csoai" key is rejected
        # ('Additional properties are not allowed'). Namespaced entries in `properties` are the supported place.
        "properties": [
            {"name": "csoai:kind", "value": "csoai.aibom/0.1"},
            {"name": "csoai:writes_board", "value": "false"},
            {"name": "csoai:measured_evidence", "value": ",".join(m["card_sha256"] for m in lin["measurements"])},
            {"name": "csoai:unmeasured", "value": ",".join(str(u) for u in unmeasured)},
            {"name": "csoai:card_verification", "value": "; ".join(f"{k}={v}" for k, v in counts.items())},
            {"name": "csoai:card_verification_method", "value": (
                "Each referenced card id recomputed from its canonical body bytes and its Ed25519 "
                f"signature verified under the pinned key {PINNED_KEY_DOC}#card-attestation-1, read from "
                "public/signed/verify-card.mjs. A card carrying its own key is not authentic; only a "
                "pinned key is."
            )},
            {"name": "csoai:unverified_cards", "value": _unverified_text(lin)},
            {"name": "csoai:evidence_corpus", "value": _corpus_text(lin)},
            {"name": "csoai:honesty", "value": (
                "Assembled from the signed-card index only, and every referenced card was independently "
                "re-verified by this exporter. Does NOT stamp MEASURED; the evidence is the signed cards it "
                "references. A signature is an integrity claim, not a truth claim. Not a GSPC score."
            )},
        ],
    }
    # The digest covers every property except the digest itself, so a reader can recompute it.
    bom["properties"].append({"name": "csoai:bom_sha256", "value": hashlib.sha256(canonical(bom)).hexdigest()})
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
    counts = _counts(lin)
    payload = {
        "model": lin["model"],
        "aibom_format": "CycloneDX-1.6+SPDX-3.0.1",
        "bom_sha256": bom_sha256,
        "spdx_sha256": spdx_sha256,
        "measured_card_shas": [m["card_sha256"] for m in lin["measurements"]],
        "signing_pubkey": lin.get("pubkey"),
        "unmeasured": [f"{m['axis']} accuracy" for m in lin["measurements"] if m["accuracy"] is None],
        "card_verification": {
            "verified": counts["VALID"],
            "invalid": counts["INVALID"],
            "uncheckable": counts["UNCHECKABLE"],
            "key_id": f"{PINNED_KEY_DOC}#card-attestation-1",
            "method": "card id recomputed from the canonical body bytes; Ed25519 verified under the pinned key",
        },
        "unverified_cards": [
            f"{m['axis']}: {m['verification']['verdict']} ({m['verification']['reason']})"
            for m in lin.get("unverified", [])
        ],
        "evidence_corpus": _corpus_text(lin),
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
    props = {p["name"]: p["value"] for p in bom["properties"]}
    card = queued_card(lin, props["csoai:bom_sha256"], spdx["spdx_sha256"])

    counts = _counts(lin)
    # stderr, so the machine-readable JSON on stdout stays parseable.
    print(
        f"verified {counts['VALID']} signed card(s) for {args.model} under "
        f"{PINNED_KEY_DOC}#card-attestation-1 "
        f"(INVALID={counts['INVALID']}, UNCHECKABLE={counts['UNCHECKABLE']})",
        file=sys.stderr,
    )

    if args.write:
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / "cyclonedx.json").write_text(json.dumps(bom, indent=1) + "\n")
        (OUT / "spdx3.json").write_text(json.dumps(spdx["doc"], indent=1) + "\n")
        raw = json.dumps(card, indent=1, ensure_ascii=False) + "\n"
        if len(raw.encode()) > 3072:
            raise SystemExit(f"HALT aibom card {len(raw.encode())}B > 3KB")
        (OUT / "aibom-card.json").write_text(raw)
        print(f"wrote {OUT.relative_to(ROOT)}/ · bom_sha256={props['csoai:bom_sha256'][:16]} card_sha={card['sha256'][:16]}")
    else:
        json.dump({"bom_sha256": props["csoai:bom_sha256"], "spdx_sha256": spdx["spdx_sha256"], "card": card}, sys.stdout, indent=2)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
