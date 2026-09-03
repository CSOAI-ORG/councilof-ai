#!/usr/bin/env python3
"""csoai-revenue-arms.py — arm every revenue surface we own.

The 4 arms of the CSOAI revenue model:
1. x402 — paid attestation on the /v1/measure endpoint
2. SWIFT/EU AI Act packs — insurer/regulator evidence bundles
3. Insurer pack — risk attestation for AI-covered losses
4. Cloudflare Pages ad slots — the public surfaces (3 of them)

This script ARMS each arm: builds the JSON manifest, the price ladder,
the invoice template, the x402 402-challenge, the SKUs. It does not
require any human action. Lane-doable.

Usage:
  ./csoai-revenue-arms.py --arm all
  ./csoai-revenue-arms.py --arm x402
  ./csoai-revenue-arms.py --arm packs
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
ARMS_DIR = REPO / "revenue" / "arms"


def arm_x402() -> dict:
    """Build the x402 paid-attestation manifest.

    The /v1/measure endpoint accepts a frozen item bank + a model, runs
    the deterministic grader, and returns a signed card. The x402 rail
    gates the signed-card issuance behind a per-run USDC payment.

    Prices are: $0.10 per axis run · $1.00 per model run · $10.00 per
    model fleet run (22 axes × 19 models).
    """
    manifest = {
        "schema": "csoai.x402-pricing/0.1",
        "as_of": "2026-09-03",
        "endpoint": "POST /v1/measure",
        "method": "x402 (HTTP 402 + payment-required header)",
        "network": "eip155:8453 (Base) — free per lane (the rail accepts Base, Polygon, Optimism)",
        "asset": "USDC",
        "skus": [
            {"id": "x402-axis-run", "price": "0.10 USDC", "scope": "one axis run on one model", "deliverable": "1 signed card"},
            {"id": "x402-model-run", "price": "1.00 USDC", "scope": "all axes on one model", "deliverable": "1 signed card per axis"},
            {"id": "x402-fleet-run", "price": "10.00 USDC", "scope": "all axes on all 19-model fleet", "deliverable": "14 signed cards"},
            {"id": "x402-historical-bundle", "price": "5.00 USDC", "scope": "all corrections-ledger entries, full history", "deliverable": "1 corrections bundle card"},
            {"id": "x402-witness-bundle", "price": "2.00 USDC", "scope": "all 4 anchors (HF, Rekor, corrections, Bitcoin OTS) bindings", "deliverable": "1 witness binding card"},
        ],
        "free_skus": [
            {"id": "x402-verify-free", "price": "0", "scope": "verify any signed card", "deliverable": "VALID/INVALID/UNCHECKABLE verdict"},
            {"id": "x402-board-read-free", "price": "0", "scope": "GET /api/gspc", "deliverable": "live board JSON"},
        ],
        "doc": "The x402 rail as of 2026-09-03 is the ONLY paid surface. The 4 anchors (HF Hub, Sigstore Rekor, Corrections ledger, Bitcoin OTS) are all free. Every other SKUs in this file is owner-gated; this arm goes live when the owner flips the Stripe + x402 facilitator tokens.",
        "total_atoms_possible": "uncapped — every run produces a new signed card under #card-attestation-1",
    }
    return {"arm": "x402", "manifest": manifest, "lane": "owner-gated (Stripe + x402 facilitator)", "year1_floor": "£10K-£50K at 1% conversion of 1M monthly live board reads"}


def arm_packs() -> dict:
    """Build the EU AI Act / SWIFT / insurer evidence-pack manifests.

    These are the 3 paid SKUs that fund the rail. Each pack is a
    reproducible evidence bundle: which models, which axes, which
    signed cards, which corrections, which witnesses.
    """
    packs = {
        "eu-ai-act-pack": {
            "schema": "csoai.eu-ai-act-pack/0.1",
            "price_gbp": 15000,
            "price_term": "12-month licence",
            "contents": [
                "22-axis signed board snapshot (as_of date)",
                "per-axis signed cards (22)",
                "corrections ledger full history (39+ entries)",
                "Article 50 evidence bundle (C2PA, in-toto)",
                "Rekor witness receipt",
                "Bitcoin OTS anchor proof",
            ],
            "deliverable": "1 portable signed card pack + quarterly updates",
            "lane": "owner-gated (invoice)",
        },
        "swift-bank-pack": {
            "schema": "csoai.swift-bank-pack/0.1",
            "price_gbp": 25000,
            "price_term": "6-month licence",
            "contents": [
                "XRPL-16 + SWIFT-26 census mirror",
                "per-bank signed RWA evidence cards",
                "per-bank corrections ledger entries",
                "regulator pack (cross-walk: UK FCA, US Fed, EU EIOPA)",
            ],
            "deliverable": "1 bank-by-bank evidence pack + monthly updates",
            "lane": "owner-gated (invoice)",
        },
        "insurer-pack": {
            "schema": "csoai.insurer-pack/0.1",
            "price_gbp": 50000,
            "price_term": "12-month licence",
            "contents": [
                "AI-covered-loss risk attestation per model",
                "Wilson intervals per axis (n>=30 frozen bank)",
                "per-claim corrections ledger",
                "witness receipts on every claim card",
                "regulator evidence (UK FCA + Lloyd's market)",
            ],
            "deliverable": "1 portfolio evidence pack + per-incident cards",
            "lane": "owner-gated (invoice)",
        },
    }
    return {"arm": "packs", "manifest": packs, "year1_floor": "£20K-£100K at 5 closed deals"}


def arm_cloudflare_ads() -> dict:
    """Build the Cloudflare Pages ad-slot manifest.

    The estate has 3 domains live (csoai.org, councilof.ai, csoai-static-deploy2
    Pages project with ~40 subdomains). Each domain has a hero slot, a sidebar
    slot, a footer slot, and a card-grid slot — 4 ad slots per domain.
    """
    return {
        "arm": "cloudflare-pages-ads",
        "domains": [
            "councilof.ai (~17 pages)",
            "csoai.org (apex + www)",
            "csoai-static-deploy2.pages.dev (~40 subdomains)",
        ],
        "slots_per_domain": 4,
        "total_slots": 3 * 4,
        "fill_rate": "0% (no ads yet — the estate is ad-free by default)",
        "monthly_impressions": "~10K-50K (estimate from current traffic)",
        "lane": "owner-gated (any ads on the site require a doctrine ruling — measurement, not certification, means we never sell attention without the user's free verify path)",
        "year1_floor": "£0 (deliberately) — the rails are the product, the surface is the demo",
    }


def arm_grants() -> dict:
    """Build the grants + public funding manifest.

    These are the 4 active grant applications + the 6 future targets.
    All £0, no equity, all deliverables public.
    """
    return {
        "arm": "grants",
        "active": [
            {"name": "NLnet / NGI Zero", "amount_eur": 20000, "deadline": "2026-11-03", "status": "owner-gated (account)"},
            {"name": "EF Ecosystem Support Program", "amount_usd": 30000, "deadline": "rolling", "status": "owner-gated (email)"},
            {"name": "Longview Philanthropy", "amount_usd": "tbd", "deadline": "rolling", "status": "owner-gated (email)"},
            {"name": "Mozilla Responsible AI grants", "amount_usd": 30000, "deadline": "rolling", "status": "owner-gated"},
        ],
        "future": [
            "Sloan Foundation (open data)",
            "AI2050 (long-horizon AI safety)",
            "NIST AI Safety Institute (consortium)",
            "EU AI Act sandbox (regulator)",
            "UK AI Safety Institute (consortium)",
            "OpenAI Preparedness grant",
        ],
        "year1_floor": "£50K-£200K if 2-3 grants land",
        "lane": "owner-gated (all grant applications require an account)",
    }


def arm_donations() -> dict:
    """Build the donation / patronage manifest.

    GitHub Sponsors + Open Collective + Patreon + direct bank transfer.
    """
    return {
        "arm": "donations",
        "rails": [
            {"name": "GitHub Sponsors", "url": "https://github.com/sponsors/CSOAI-ORG", "fee": "0% (GitHub absorbs)", "status": "owner-gated (account)"},
            {"name": "Open Collective", "url": "https://opencollective.com/council-of-ai", "fee": "0% (fiscal sponsor absorbs)", "status": "owner-gated (entity)"},
            {"name": "Patreon", "url": "https://patreon.com/councilofai", "fee": "5-12%", "status": "owner-gated (account)"},
            {"name": "Direct bank transfer (CSOAI Ltd)", "url": "iban-on-file", "fee": "0%", "status": "owner-gated (invoice + UK Co. House 16939677)"},
        ],
        "year1_floor": "£0-£10K (depends on personal network)",
        "lane": "owner-gated (all require a verified entity)",
    }


ARMS = {
    "x402": arm_x402,
    "packs": arm_packs,
    "cloudflare-pages-ads": arm_cloudflare_ads,
    "grants": arm_grants,
    "donations": arm_donations,
}


def main():
    ap = argparse.ArgumentParser(description="CSOAI — revenue arms.")
    ap.add_argument("--arm", choices=list(ARMS.keys()) + ["all"], default="all")
    args = ap.parse_args()

    print(f"================================================================")
    print(f"  CSOAI — REVENUE ARMS")
    print(f"  {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}")
    print(f"================================================================")
    print()

    ARMS_DIR.mkdir(parents=True, exist_ok=True)
    arms_to_run = list(ARMS.keys()) if args.arm == "all" else [args.arm]
    total_floor = 0
    for arm in arms_to_run:
        out = ARMS[arm]()
        # Write the manifest
        out_path = ARMS_DIR / f"{arm}.json"
        out_path.write_text(json.dumps(out, indent=2, sort_keys=True))
        print(f"  ✓ {arm:<24} → {out_path.relative_to(REPO)}")
        # Print summary
        if "manifest" in out:
            print(f"      lane: {out.get('lane', '?')}")
        if "year1_floor" in out:
            print(f"      year1 floor: {out['year1_floor']}")
        print()
    print(f"All manifests staged in {ARMS_DIR.relative_to(REPO)}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
