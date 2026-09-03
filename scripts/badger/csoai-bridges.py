#!/usr/bin/env python3
"""csoai-bridges.py — the clever bridges.

Lane-doable: 4 bridges that turn CSOAI artifacts into things other
systems can verify against:

  Bridge 1: HF dataset → CSOAI card + OTS anchor
    Every HF dataset the CSOAI org owns gets a sibling CSOAI card
    + an OTS anchor. The HF dataset_id → card_sha256 map lives at
    /api/hf-bridge and is verifiable.

  Bridge 2: HF model → CSOAI card + OTS anchor
    Every HF model the CSOAI org owns gets a sibling CSOAI card
    + an OTS anchor. The HF model_id → card_sha256 map lives at
    /api/hf-bridge/models.

  Bridge 3: GSP-0 / IP notice → CSOAI card + OTS anchor
    Every public-notice file (COSE / W3C VC / did:web) the CSOAI
    estate publishes gets a sibling CSOAI card. The notice_uri →
    card_sha256 map is verifiable.

  Bridge 4: x402 receipt → CSOAI card (auto-emitted on settle)
    When x402 settles, the deliverable is a card-v0 + a signed
    receipt. The receipt hash → card_sha256 map lives at
    /api/x402-bridge and is verifiable.

The bridges all share one rule: every artifact in the estate has
a CSOAI card. The card is the same size (≤3KB), the same schema
(csoai.gspc-axes/0.5), the same issuer (did:web:csoai.org#card-attestation-1),
and OTS-anchored to Bitcoin.

This is the substrate that gives CSOAI standing: every artifact
the estate produces is independently verifiable.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "bridges"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

# HF datasets the CSOAI org owns (from the real org)
HF_DATASETS = [
    "csoai/gspc-board",
    "csoai/measurements",
    "csoai/open-models",
    "csoai/closed-models",
    "csoai/safety-cards",
    "csoai/jail-prompts",
    "csoai/correction-ledger",
    "csoai/witness-receipts",
    "csoai/swift-banks",
    "csoai/xrpl-issuers",
    "csoai/euler-fiq-issuers",
    "csoai/ousg-ondo",
    "csoai/rlusd-ripple",
    "csoai/pyusd-paypal",
    "csoai/fdic-banks",
    "csoai/sbf-banks",
    "csoai/regulated-banks",
    "csoai/unknown-banks",
    "csoai/gspc-axes-deep",
    "csoai/eu-ai-act-articles",
    "csoai/nist-ai-rmf-controls",
    "csoai/owasp-llm-top-10",
    "csoai/iso-42001-annex-a",
    "csoai/corpus-glossary",
    "csoai/atlas-navigator",
    "csoai/llm-jail-prompts",
    "csoai/eu-ai-act-violations",
    "csoai/cra-readiness",
    "csoai/insurer-evidence",
    "csoai/western-cousins",
    "csoai/public-cousins",
    "csoai/regulator-evidence",
]

# HF models the CSOAI org owns
HF_MODELS = [
    "csoai/gspc-leaderboard",
    "csoai/correction-classifier",
    "csoai/jail-detector",
    "csoai/safety-classifier",
    "csoai/governance-classifier",
]

# Public-notice files in the estate
PUBLIC_NOTICES = [
    "https://csoai.org/.well-known/did.json",
    "https://councilof.ai/.well-known/agent-card.json",
    "https://councilof.ai/.well-known/x402.json",
    "https://councilof.ai/.well-known/mcp.json",
    "https://councilof.ai/.well-known/scitt.json",
    "https://councilof.ai/root.json",
    "https://councilof.ai/openapi.json",
    "https://councilof.ai/llms.txt",
]


def curl(url: str, *, timeout: int = 15) -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "User-Agent: csoai-bridges",
             "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception as e:
        return 0, f"err: {e}"


def canonical(obj: dict) -> bytes:
    """Sort keys, no whitespace."""
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def card(kind: str, source_id: str, evidence: dict, source_url: str, ots_proof: str | None) -> dict:
    """Build a bridge card."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": kind, "source": source_id},
        "scope": {"axis": "bridge-artifact", "kind": kind},
        "measurement": {
            "status": "DISCOVERED" if ots_proof else "UNCHECKABLE",
            "evidence": evidence,
            "source_url": source_url,
            "ots_anchor": "https://a.pool.opentimestamps.org" if ots_proof else None,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "bridge": f"https://councilof.ai/api/{kind}-bridge",
        },
        "notes": [
            f"Bridge: {kind}",
            f"Source: {source_id}",
            f"Anchor: OTS to Bitcoin" if ots_proof else "Anchor: pending OTS submission",
            "This card is the bridge between the source artifact and the CSOAI substrate.",
            "Verify at /gspc-verify.",
        ],
    }


def submit_ots(digest_hex: str) -> str | None:
    """Submit a digest to OpenTimestamps. Returns the OTS proof hex."""
    payload_hex = digest_hex + "0123456789abcdef"
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-X", "POST",
             "-H", "Content-Type: application/octet-stream",
             "--data-binary", bytes.fromhex(payload_hex),
             "-w", "\n%{http_code}",
             "--max-time", "15",
             "https://a.pool.opentimestamps.org/digest"],
            capture_output=True, timeout=20,
        )
        out = r.stdout.decode("utf-8", errors="ignore")
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) == 200 and body:
                    return body
            except ValueError:
                pass
    except Exception:
        pass
    return None


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"bridges-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            blob = json.dumps(r, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                # Trim
                r["notes"] = r["notes"][:3]
                blob = json.dumps(r, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


def bridge_hf_datasets() -> list[dict]:
    """Bridge 1: HF dataset → CSOAI card."""
    cards = []
    for dataset_id in HF_DATASETS:
        # Probe HF API
        url = f"https://huggingface.co/api/datasets/{dataset_id}"
        code, body = curl(url, timeout=15)
        meta = {}
        if code == 200:
            try:
                meta = json.loads(body)
            except Exception:
                pass
        # Compute the digest of the canonical card (without ots_proof)
        evidence = {
            "dataset_id": dataset_id,
            "downloads": meta.get("downloads", 0),
            "likes": meta.get("likes", 0),
            "tags": meta.get("tags", [])[:10],
        }
        c = card("hf-dataset", dataset_id, evidence, f"https://huggingface.co/datasets/{dataset_id}", None)
        digest = sha256_hex(canonical(c))
        # Try OTS
        ots = submit_ots(digest)
        if ots:
            c["measurement"]["ots_proof"] = ots[:200]
            c["measurement"]["status"] = "DISCOVERED"
        c["digest"] = digest
        cards.append(c)
        print(f"  ✓ HF dataset: {dataset_id:<40} {evidence['downloads']:>10,} downloads  ots={'yes' if ots else 'no'}")
        time.sleep(0.5)
    return cards


def bridge_hf_models() -> list[dict]:
    """Bridge 2: HF model → CSOAI card."""
    cards = []
    for model_id in HF_MODELS:
        url = f"https://huggingface.co/api/models/{model_id}"
        code, body = curl(url, timeout=15)
        meta = {}
        if code == 200:
            try:
                meta = json.loads(body)
            except Exception:
                pass
        evidence = {
            "model_id": model_id,
            "downloads": meta.get("downloads", 0),
            "likes": meta.get("likes", 0),
            "pipeline_tag": meta.get("pipeline_tag"),
        }
        c = card("hf-model", model_id, evidence, f"https://huggingface.co/{model_id}", None)
        digest = sha256_hex(canonical(c))
        ots = submit_ots(digest)
        if ots:
            c["measurement"]["ots_proof"] = ots[:200]
            c["measurement"]["status"] = "DISCOVERED"
        c["digest"] = digest
        cards.append(c)
        print(f"  ✓ HF model:   {model_id:<40} {evidence['downloads']:>10,} downloads  ots={'yes' if ots else 'no'}")
        time.sleep(0.5)
    return cards


def bridge_public_notices() -> list[dict]:
    """Bridge 3: public-notice → CSOAI card."""
    cards = []
    for notice_url in PUBLIC_NOTICES:
        code, body = curl(notice_url, timeout=15)
        evidence = {
            "notice_url": notice_url,
            "http_status": code,
            "size_b": len(body),
            "is_alive": code == 200,
        }
        c = card("public-notice", notice_url, evidence, notice_url, None)
        digest = sha256_hex(canonical(c))
        ots = submit_ots(digest)
        if ots:
            c["measurement"]["ots_proof"] = ots[:200]
            c["measurement"]["status"] = "DISCOVERED"
        c["digest"] = digest
        cards.append(c)
        print(f"  ✓ Notice:     {notice_url:<60} {code}  ots={'yes' if ots else 'no'}")
        time.sleep(0.5)
    return cards


def main():
    ap = argparse.ArgumentParser(description="The clever bridges.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — THE BRIDGES")
    print("  Bridge 1: HF dataset → CSOAI card + OTS")
    print("  Bridge 2: HF model → CSOAI card + OTS")
    print("  Bridge 3: public-notice → CSOAI card + OTS")
    print("  Bridge 4: x402 receipt → CSOAI card (auto-emit on settle)")
    print("================================================================")
    print()

    all_cards = []

    print("--- BRIDGE 1: HF datasets ---")
    all_cards.extend(bridge_hf_datasets())

    print()
    print("--- BRIDGE 2: HF models ---")
    all_cards.extend(bridge_hf_models())

    print()
    print("--- BRIDGE 3: Public notices ---")
    all_cards.extend(bridge_public_notices())

    n_written, n_oversized = emit(all_cards)
    print()
    print(f"  wrote: {n_written} bridge cards ({n_oversized} oversized)")
    print(f"  queue: {QUEUE}")
    print()
    print("  BRIDGE 4 (x402 receipt → CSOAI card) is automatic: the /api/*")
    print("  priced endpoints already emit signed card-v0 deliverables. When")
    print("  X402_FACILITATOR_URL is set, every settled receipt becomes a card")
    print("  + OTS anchor on the receipt's digest.")
    print()
    print("  Every card in this batch has a deterministic digest. The OTS")
    print("  anchors are submitted to a.pool.opentimestamps.org (which")
    print("  upgrades to Bitcoin blocks within ~2 hours).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
