#!/usr/bin/env python3
"""csoai-product-wave.py — Phase 8: product + SKU wave.

Lane-doable: builds the product/SKU layer for x402 paid attestations.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts" / "badger" / "_queue" / "products"
OUT.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


SKUS = [
    {"id": "card-single", "name": "Single signed card", "price_usdc": 0.02, "endpoint": "/api/x402?sku=card-single", "description": "Sign one atom + return Ed25519-signed card."},
    {"id": "card-batch-10", "name": "10-card batch", "price_usdc": 0.15, "endpoint": "/api/x402?sku=card-batch-10", "description": "Sign 10 atoms in one Merkle root."},
    {"id": "card-batch-100", "name": "100-card batch", "price_usdc": 1.20, "endpoint": "/api/x402?sku=card-batch-100", "description": "Sign 100 atoms in one Merkle root."},
    {"id": "benchmark-single", "name": "Single benchmark", "price_usdc": 0.50, "endpoint": "/api/x402?sku=benchmark-single", "description": "Run one model on one axis."},
    {"id": "benchmark-full", "name": "Full 22-axis benchmark", "price_usdc": 5.00, "endpoint": "/api/x402?sku=benchmark-full", "description": "Run one model on all 22 GSPC axes."},
    {"id": "anchor-daily", "name": "Daily anchor subscription", "price_usdc": 1.00, "endpoint": "/api/x402?sku=anchor-daily", "description": "Subscribe to daily OTS anchors for one year."},
    {"id": "council-vote", "name": "Council vote (1 of 33)", "price_usdc": 0.10, "endpoint": "/api/x402?sku=council-vote", "description": "Cast one vote in the 33-agent BFT council."},
    {"id": "council-quorum", "name": "Full quorum vote", "price_usdc": 3.30, "endpoint": "/api/x402?sku=council-quorum", "description": "Cast a full 23/33 quorum vote."},
    {"id": "verification-public", "name": "Public verification", "price_usdc": 0.00, "endpoint": "/api/verify", "description": "Free. Verify any signed card against the public root."},
    {"id": "verification-bulk", "name": "Bulk verification", "price_usdc": 0.05, "endpoint": "/api/x402?sku=verification-bulk", "description": "Verify 100 cards at once."},
    {"id": "correction", "name": "File a correction", "price_usdc": 1.00, "endpoint": "/api/x402?sku=correction", "description": "File a correction to the public root."},
    {"id": "witness-receipt", "name": "Witness receipt", "price_usdc": 0.05, "endpoint": "/api/x402?sku=witness-receipt", "description": "Get a witness receipt for any claim."},
    {"id": "regwatch-monthly", "name": "Monthly regulation watch", "price_usdc": 50.00, "endpoint": "/api/x402?sku=regwatch-monthly", "description": "Subscribe to monthly regulation-change reports."},
    {"id": "fleet-run", "name": "Fleet run", "price_usdc": 25.00, "endpoint": "/api/x402?sku=fleet-run", "description": "Run your private fleet of N models on all 22 axes."},
    {"id": "subdomain-pro", "name": "Pro subdomain", "price_usdc": 100.00, "endpoint": "/api/x402?sku=subdomain-pro", "description": "Get a branded subdomain on councilof.ai."},
]


def main() -> None:
    out = {
        "ts": now(),
        "skus": SKUS,
        "total_skus": len(SKUS),
        "free_skus": [s for s in SKUS if s["price_usdc"] == 0],
        "paid_skus": [s for s in SKUS if s["price_usdc"] > 0],
    }
    out_path = OUT / f"sku-catalog-{now()}.json"
    out_path.write_text(json.dumps(out, indent=2))

    print(f"=== PRODUCT/SKU WAVE ===")
    print(f"  total: {len(SKUS)}")
    print(f"  free:  {len(out['free_skus'])}")
    print(f"  paid:  {len(out['paid_skus'])}")
    print()
    print(f"  Catalog:")
    for s in SKUS:
        print(f"    {s['id']:<22} ${s['price_usdc']:>6.2f}  {s['name']}")
    print()
    print(f"  file: {out_path}")


if __name__ == "__main__":
    main()
