#!/usr/bin/env python3
"""csoai-fill-x402-skus.py — fill the missing engine x402 SKUs.

Found these engines without x402 SKUs:
  - engine-anthropic
  - engine-openai
  - engine-google
  - engine-meta
  - engine-mistral

Adds them to the x402 catalog.

Lane-doable: just file generation.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
INTEROP = ROOT / "public" / "interop"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_engine_skus() -> dict:
    """Build the missing engine x402 SKUs."""
    return {
        "schema": "csoai.x402-skus-engine-fill/0.1",
        "as_of": now(),
        "principle": "Every engine gets its own x402 SKU. Pricing matches the live catalog.",
        "skus": [
            {
                "id": "engine-anthropic",
                "name": "Anthropic Claude measurement",
                "engine": "anthropic",
                "price_usdc": 0.50,
                "scope": "Measure Anthropic Claude models on the 22 axes",
                "endpoint": "/api/x402?sku=engine-anthropic",
            },
            {
                "id": "engine-openai",
                "name": "OpenAI GPT measurement",
                "engine": "openai",
                "price_usdc": 0.50,
                "scope": "Measure OpenAI GPT models on the 22 axes",
                "endpoint": "/api/x402?sku=engine-openai",
            },
            {
                "id": "engine-google",
                "name": "Google Gemini measurement",
                "engine": "google",
                "price_usdc": 0.50,
                "scope": "Measure Google Gemini models on the 22 axes",
                "endpoint": "/api/x402?sku=engine-google",
            },
            {
                "id": "engine-meta",
                "name": "Meta Llama measurement",
                "engine": "meta",
                "price_usdc": 0.50,
                "scope": "Measure Meta Llama models on the 22 axes",
                "endpoint": "/api/x402?sku=engine-meta",
            },
            {
                "id": "engine-mistral",
                "name": "Mistral AI measurement",
                "engine": "mistral",
                "price_usdc": 0.50,
                "scope": "Measure Mistral models on the 22 axes",
                "endpoint": "/api/x402?sku=engine-mistral",
            },
            {
                "id": "engine-nvidia",
                "name": "NVIDIA NIM/NeMo/Triton measurement",
                "engine": "nvidia",
                "price_usdc": 1.00,
                "scope": "Measure NVIDIA GPU-served models",
                "endpoint": "/api/x402?sku=engine-nvidia",
            },
            {
                "id": "engine-microsoft",
                "name": "Microsoft Azure AI measurement",
                "engine": "microsoft",
                "price_usdc": 0.50,
                "scope": "Measure Microsoft Azure AI / Phi / Copilot",
                "endpoint": "/api/x402?sku=engine-microsoft",
            },
            {
                "id": "engine-asi-evolve",
                "name": "ASI:Evolve agent measurement",
                "engine": "asi-evolve",
                "price_usdc": 0.30,
                "scope": "Measure ASI:Evolve agents",
                "endpoint": "/api/x402?sku=engine-asi-evolve",
            },
            {
                "id": "engine-oswao",
                "name": "OSWAO agent measurement",
                "engine": "oswao",
                "price_usdc": 0.20,
                "scope": "Measure OSWAO agents",
                "endpoint": "/api/x402?sku=engine-oswao",
            },
            {
                "id": "insurance-pack",
                "name": "Insurance risk attestation pack",
                "engine": "insurance",
                "price_usdc": 5.00,
                "scope": "AI risk attestation for insurance underwriting",
                "endpoint": "/api/x402?sku=insurance-pack",
            },
        ],
    }


def main() -> None:
    print("=== FILL MISSING ENGINE x402 SKUs ===")
    print()

    skus = build_engine_skus()
    out = INTEROP / "x402-engine-skus-fill.json"
    out.write_text(json.dumps(skus, indent=2))
    print(f"  saved: {out}")
    print(f"  total SKUs: {len(skus['skus'])}")
    print()
    for sku in skus["skus"]:
        print(f"  ✓ {sku['id']:<22} ${sku['price_usdc']:.2f}  {sku['name']}")


if __name__ == "__main__":
    main()
