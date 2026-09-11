#!/usr/bin/env python3
"""Freeze and normalize the public DefiLlama stablecoin universe."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import urllib.request
from pathlib import Path

SOURCE = "https://stablecoins.llama.fi/stablecoins?includePrices=true"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw", type=Path, default=Path("raw/defillama-stablecoins.json"))
    parser.add_argument("--output", type=Path, default=Path("derived/stablecoin-index.json"))
    parser.add_argument("--offline", action="store_true", help="Reuse the frozen raw response")
    parser.add_argument("--observed-at", help="Pin the UTC observation timestamp for reproducible rebuilds")
    args = parser.parse_args()

    if not args.offline:
        request = urllib.request.Request(SOURCE, headers={"User-Agent": "CSOAI-GSPC/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
        args.raw.parent.mkdir(parents=True, exist_ok=True)
        args.raw.write_bytes(raw)
    else:
        raw = args.raw.read_bytes()

    document = json.loads(raw)
    assets = document["peggedAssets"]
    chains: set[str] = set()
    deployments = 0
    total_usd = 0.0
    rows = []
    for asset in assets:
        chain_map = asset.get("chainCirculating") or {}
        chains.update(chain_map)
        deployments += len(chain_map)
        circulating = asset.get("circulating") or {}
        value = circulating.get("peggedUSD") if isinstance(circulating, dict) else None
        if isinstance(value, (int, float)):
            total_usd += value
        score = round(((float(value) ** 0.25) if isinstance(value, (int, float)) and value > 0 else 0) + len(chain_map) * 10, 6)
        rows.append(
            {
                "id": asset.get("id"),
                "name": asset.get("name"),
                "symbol": asset.get("symbol"),
                "pegType": asset.get("pegType"),
                "price": asset.get("price"),
                "circulating_usd": value,
                "chains": sorted(chain_map),
                "priority_score": score,
                "evidence_state": "INDEXED",
                "deep_measurement_state": "UNMEASURED",
                "signature_state": "UNSIGNED",
                "root_state": "UNROOTED",
                "anchor_state": "UNANCHORED",
            }
        )
    rows.sort(key=lambda row: (-(row["circulating_usd"] or 0), str(row["id"])))

    normalized = {
        "schema": "csoai.stablecoin-index.v1",
        "observed_at": args.observed_at or dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": SOURCE,
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "asset_count": len(assets),
        "chain_count": len(chains),
        "deployment_count": deployments,
        "circulating_usd_sum_available": total_usd,
        "definition_note": (
            "Sum of upstream circulating.peggedUSD fields when present; "
            "an index observation, not deep on-chain measurement."
        ),
        "assets": rows,
        "deep_measurement_queue": [row["id"] for row in rows[:20]],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")

    print(
        json.dumps(
            {
                "source_sha256": normalized["source_sha256"],
                "asset_count": normalized["asset_count"],
                "chain_count": normalized["chain_count"],
                "deployment_count": normalized["deployment_count"],
                "circulating_usd_sum_available": normalized["circulating_usd_sum_available"],
                "top_10_usd": sum((row["circulating_usd"] or 0) for row in rows[:10]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
