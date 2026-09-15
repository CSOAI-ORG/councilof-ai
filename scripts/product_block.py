#!/usr/bin/env python3
"""product_block.py — product tier/SKU/price for the card-v0.1 product block.

G5.1 PRODUCT BLOCK v0.1 (TUI-5 ENGINE). Attaches a product block to every
measurement card so the /feed endpoint, x402 gateway, and pricing surface can
determine tier, price, and field access without parsing the payload.

Doctrine locks:
  * data free / proofs paid
  * THIN never signed (enforced by the publisher, not here)
  * UNMEASURED never zero-filled
  * ≤4KB card cap (product block counts)
  * £0 ARR until first settled charge

Honest limits:
  * The product block is a pricing metadata envelope, not a guarantee of
    content. "paid_fields" names what a buyer GETS; it does not assert the
    fields are correct or complete.
  * Tier "free" means the card's free_fields are publicly served. Tier "proof"
    means the card is gate-held behind x402; paid_fields are disclosed after
    settlement. No card is ever tier "premium" until Nick provisions pricing.
"""
from __future__ import annotations

from typing import Any

# ── SKU registry ──────────────────────────────────────────────────────────
# Each surface/kind maps to a SKU. The SKU determines tier, price, and which
# fields are free vs paid. Add new SKUs here; the publisher reads from this
# table, never from card-level ad-hoc pricing.

SKU_TABLE: dict[str, dict[str, Any]] = {
    # ── FREE tier (always $0) ──
    "xrpl.asset.state": {
        "tier": "free",
        "sku": "xrpl-asset-state",
        "free_fields": ["issuer", "currency", "holders", "supply", "trust_lines"],
        "paid_fields": [],
        "price": None,
    },
    "xrpl.basket.root": {
        "tier": "free",
        "sku": "xrpl-basket-root",
        "free_fields": ["n", "merkle", "leaf_sha256"],
        "paid_fields": [],
        "price": None,
    },
    "public.notice": {
        "tier": "free",
        "sku": "public-notice",
        "free_fields": ["kind", "status", "subject"],
        "paid_fields": [],
        "price": None,
    },
    "benji.onchain.supply": {
        "tier": "free",
        "sku": "benji-supply",
        "free_fields": ["asset_total", "fobxx_total", "platform_total", "delta"],
        "paid_fields": [],
        "price": None,
    },
    "receipts.batch": {
        "tier": "free",
        "sku": "receipts-batch",
        "free_fields": ["count", "total_usd"],
        "paid_fields": [],
        "price": None,
    },
    "receipts.v1": {
        "tier": "free",
        "sku": "receipts-v1",
        "free_fields": ["kind", "status", "amount_usd"],
        "paid_fields": [],
        "price": None,
    },
    "x402.settlement": {
        "tier": "free",
        "sku": "x402-settlement",
        "free_fields": ["status", "amount_usd"],
        "paid_fields": [],
        "price": None,
    },
    "art50.marking-evidence": {
        "tier": "free",
        "sku": "art50-marking",
        "free_fields": ["generator", "c2pa_present", "markings"],
        "paid_fields": [],
        "price": None,
    },
    # ── PROOF tier (paid, post-ceremony pricing) ──
    # These surfaces carry deep measurement that is valuable to buyers.
    # Prices are placeholder $0.01–0.25 per the doctrine. Nick sets real
    # prices after the ceremony anchors the premium tier.
    "gspc.behavioural": {
        "tier": "proof",
        "sku": "gspc-behavioural",
        "free_fields": ["model", "axis", "status"],
        "paid_fields": ["accuracy", "bank_cites", "confidence_interval", "drift_history"],
        "price": {"currency": "USD", "amount": 0.05, "note": "placeholder; owner sets after ceremony"},
    },
    "trace.runtime": {
        "tier": "proof",
        "sku": "trace-runtime",
        "free_fields": ["model", "endpoint", "status"],
        "paid_fields": ["latency_p50", "latency_p99", "error_rate", "token_usage"],
        "price": {"currency": "USD", "amount": 0.01, "note": "placeholder"},
    },
    "swift.notice": {
        "tier": "free",
        "sku": "swift-notice",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "benji.supply": {
        "tier": "free",
        "sku": "benji-supply-legacy",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "rwa.reserve": {
        "tier": "free",
        "sku": "rwa-reserve",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "erc8004.callable": {
        "tier": "free",
        "sku": "erc8004-callable",
        "free_fields": ["kind", "registry"],
        "paid_fields": [],
        "price": None,
    },
    "cobol.legacy": {
        "tier": "free",
        "sku": "cobol-legacy",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "xdc.document.state": {
        "tier": "free",
        "sku": "xdc-doc-state",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "owasp.control": {
        "tier": "free",
        "sku": "owasp-control",
        "free_fields": ["kind", "control_id"],
        "paid_fields": [],
        "price": None,
    },
    "genius.reserve": {
        "tier": "free",
        "sku": "genius-reserve",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "aibom.document": {
        "tier": "free",
        "sku": "aibom-doc",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "redteam.evidence": {
        "tier": "free",
        "sku": "redteam-evidence",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "eval.delta": {
        "tier": "free",
        "sku": "eval-delta",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "cedulon.recon": {
        "tier": "free",
        "sku": "cedulon-recon",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "ras.commission": {
        "tier": "free",
        "sku": "ras-commission",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "evidence.bundle": {
        "tier": "free",
        "sku": "evidence-bundle",
        "free_fields": ["kind", "status"],
        "paid_fields": [],
        "price": None,
    },
    "otel.span": {
        "tier": "proof",
        "sku": "otel-span",
        "free_fields": ["trace_id", "service", "status"],
        "paid_fields": ["duration_ms", "attributes", "events"],
        "price": {"currency": "USD", "amount": 0.01, "note": "placeholder"},
    },
}

# Default for any surface not in the table (safety net: free, generic SKU)
_DEFAULT = {
    "tier": "free",
    "sku": "generic",
    "free_fields": ["kind", "status"],
    "paid_fields": [],
    "price": None,
}


def product_block_for(surface: str, payload: dict | None = None) -> dict:
    """Build the product block for a card's surface.

    The block is additive metadata — it does not change the card's measurement
    content. Tier "free" cards serve all fields publicly. Tier "proof" cards
    gate paid_fields behind x402 settlement.
    """
    entry = SKU_TABLE.get(surface, _DEFAULT)
    block: dict[str, Any] = {
        "sku": entry["sku"],
        "tier": entry["tier"],
        "free_fields": list(entry["free_fields"]),
        "paid_fields": list(entry["paid_fields"]),
    }
    if entry["price"] is not None:
        block["price"] = dict(entry["price"])
    block["anchors"] = {
        "ots": "pending",
        "rekor": "pending",
        "xrpl_memo": "not_yet",
        "evm_base": "not_yet",
    }
    return block


def retro_tag(card: dict) -> dict:
    """Add a product block to an existing card that lacks one.

    Returns the card with a `product` field added. If the card already has one,
    returns it unchanged. Does NOT recompute sha256 — the caller must handle
    that if the card is being re-signed.
    """
    if "product" in card:
        return card
    surface = card.get("surface", "public.notice")
    card["product"] = product_block_for(surface, card.get("payload"))
    return card
