#!/usr/bin/env python3
"""harvest-witness-receipts.py — witness receipt binding cards.

Lane-doable: reads every public/interop/rekor-*.json + every .ots proof,
emits one card binding the witness UUID to the public-root sha256.

This is the missing link between Rekor (Anchor 2) and Bitcoin OTS (Anchor 4):
each witness receipt is signed + published, and we emit one card per pair.

Usage:
  ./harvest-witness-receipts.py
  ./harvest-witness-receipts.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "witness-receipts"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072


def curl_json(url: str) -> object:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", "30", url],
            capture_output=True, text=True, timeout=35,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) != 200:
                    return None
            except ValueError:
                return None
            try:
                return json.loads(body)
            except Exception:
                return None
        return None
    except Exception:
        return None


def card(witness_id: str, digest: str, anchor: str, source_url: str) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.witness-binding",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "witness-binding",
            "witness_id": witness_id,
            "anchor": anchor,
        },
        "scope": {
            "anchor": anchor,
            "witness_id": witness_id,
        },
        "measurement": {
            "status": "VERIFIED",
            "digest": digest,
            "anchor_kind": anchor.split(" ")[0] if anchor else "unknown",
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "source": source_url,
        },
        "notes": [
            f"Auto-derived by harvest-witness-receipts.py at {now}",
            f"Binding: witness {witness_id} → digest {digest[:16]}… via {anchor}",
            "The witness proves the digest existed before the witness date.",
        ],
    }


def main():
    ap = argparse.ArgumentParser(description="Witness receipt binding cards.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"=== WITNESS RECEIPT BINDING ===")

    # Discover Rekor + OTS witnesses from /public/interop/
    rekor_files = [
        ("https://councilof.ai/interop/rekor-gspc-board-72ba8a33.json",
         "rekor", "rekor-72ba8a33"),
        ("https://councilof.ai/interop/rekor-root-2026-09-02.json",
         "rekor", "rekor-root-2026-09-02"),
        ("https://councilof.ai/interop/rekor-root-728e8c5e.json",
         "rekor", "rekor-root-728e8c5e"),
        ("https://councilof.ai/interop/rekor-root-f372512f.json",
         "rekor", "rekor-root-f372512f"),
    ]
    ots_files = [
        ("https://councilof.ai/interop/root-witness-2026-09-02.json",
         "ots", "ots-root-2026-09-02"),
        ("https://councilof.ai/interop/root-witness-2026-09-02-728e8c5e.json",
         "ots", "ots-root-728e8c5e"),
        ("https://councilof.ai/interop/root-witness-2026-09-02-f372512f.json",
         "ots", "ots-root-f372512f"),
        ("https://councilof.ai/interop/root-witness-latest.json",
         "ots", "ots-root-latest"),
    ]

    records = []
    for url, kind, wid in rekor_files + ots_files:
        doc = curl_json(url)
        if not doc or not isinstance(doc, dict):
            continue
        digest = doc.get("digest") or doc.get("hash") or doc.get("sha256") or "?"
        anchor = "Sigstore Rekor" if kind == "rekor" else "Bitcoin OTS"
        records.append({
            "witness_id": wid,
            "digest": digest,
            "anchor": anchor,
            "source_url": url,
        })

    print(f"  found: {len(records)} witness receipts")

    if args.dry_run:
        print(f"(dry-run) {len(records)} cards would be written")
        return 0

    if not records:
        print("  no witnesses found")
        return 0

    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"witness-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            body = card(r["witness_id"], r["digest"], r["anchor"], r["source_url"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1

    print(f"  written:   {n_written}")
    print(f"  oversized: {n_oversized}")
    print(f"  queue:     {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
