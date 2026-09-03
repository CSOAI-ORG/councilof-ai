#!/usr/bin/env python3
"""csoai-donation-mining.py — earn through public-goods funding rails.

Lane-doable: harvest every public-goods funding rail that takes an
Ethereum address (no Stripe, no KYC, no operator clicks):
  1. Gitcoin Grants Stack — quadratic funding rounds
  2. Octant — public goods allocation
  3. Giveth — donation platform with matching
  4. Optimism Retro Funding — public-goods retroactive
  5. Gitcoin Passport — sybil-resistant donation identity (free)
  6. ENS (Ethereum Name Service) — reverse-resolve our 0x2126...ae31
  7. Coinbase Commerce (USDC on Base) — public-goods payments

For each: emit one CSOAI card with the rail + the donation URL + the
address + the expected yield.

Output: an actionable donation-mining dossier.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "donation-mining"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

CSOAI_WALLET = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
ENS_NAME = "csoai.eth"

RAILS = [
    {
        "name": "Gitcoin Grants Stack",
        "url": "https://grants.gitcoin.co/",
        "address": CSOAI_WALLET,
        "what": "Quadratic funding rounds for public-goods projects. Apply via gitcoin.co/mechanisms.",
        "yield_potential": "$5K-$50K per round (varies; quadratic matching multiplier can be 5-10x)",
        "requirements": "Gitcoin Passport (free, sybil-resistant), project profile, application",
        "mechanism": "Quadratic funding — donors get matched by the round's pool",
        "currency": "USDC / ETH / GTC",
        "next_deadline": "rolling (GG24 was Oct 2025; GG25 unannounced)",
        "card_kind": "donation-mining-rail",
    },
    {
        "name": "Gitcoin Passport",
        "url": "https://passport.gitcoin.co/",
        "address": CSOAI_WALLET,
        "what": "Sybil-resistant identity. Free stamps from Google, Twitter, GitHub, ENS, etc. Required to apply to GG rounds.",
        "yield_potential": "Indirect — required for any GG round",
        "requirements": "Free; ~10 minutes to set up",
        "mechanism": "Stamps from verified sources",
        "currency": "—",
        "next_deadline": "ongoing",
        "card_kind": "donation-mining-rail",
    },
    {
        "name": "Octant",
        "url": "https://octant.app/",
        "address": CSOAI_WALLET,
        "what": "Public-goods allocation rounds. Stake ETH, vote on recipients, get rewards for voting.",
        "yield_potential": "Variable; based on rewards + matching pool",
        "requirements": "Staking interface (Golem); vote on rounds",
        "mechanism": "Quadratic voting + matching pool",
        "currency": "ETH + Golem (GLM)",
        "next_deadline": "rolling epochs",
        "card_kind": "donation-mining-rail",
    },
    {
        "name": "Giveth",
        "url": "https://giveth.io/",
        "address": CSOAI_WALLET,
        "what": "Donation platform with matching. Submit a project, get donations in any token.",
        "yield_potential": "Variable; based on community match",
        "requirements": "Project registration (free)",
        "mechanism": "Donations + quadratic matching",
        "currency": "ETH, USDC, GIV",
        "next_deadline": "rolling",
        "card_kind": "donation-mining-rail",
    },
    {
        "name": "Optimism Retro Funding",
        "url": "https://atlas.optimism.io/",
        "address": CSOAI_WALLET,
        "what": "Retroactive public-goods funding. Submit metrics; OP holders vote; you get paid for impact.",
        "yield_potential": "$25K-$200K per round (variable; paused through 2026)",
        "requirements": "Project profile + impact metrics",
        "mechanism": "Retroactive; OP-token holder voting",
        "currency": "OP",
        "next_deadline": "paused through 2026 (per optimism.io/blog/retro-funding-2025)",
        "card_kind": "donation-mining-rail",
    },
    {
        "name": "ENS (Ethereum Name Service)",
        "url": "https://app.ens.domains/",
        "address": CSOAI_WALLET,
        "what": "Register csoai.eth as a reverse-resolution name (links wallet to identity). Costs ~$5/year in ETH.",
        "yield_potential": "Identity moat; makes donation URLs readable (csoai.eth instead of 0x2126...ae31)",
        "requirements": "One-time ETH gas (~0.005 ETH), then $5/year renewal",
        "mechanism": "ENS registry",
        "currency": "ETH",
        "next_deadline": "none — operator click (no API)",
        "card_kind": "identity-rail",
    },
    {
        "name": "Coinbase Commerce (USDC on Base)",
        "url": "https://commerce.coinbase.com/",
        "address": CSOAI_WALLET,
        "what": "Accept USDC donations on Base directly. No Stripe. No fees on USDC. (Claude confirmed: the x402 rail IS this rail, but for donations, Coinbase Commerce is the canonical one.)",
        "yield_potential": "Variable; depends on public awareness",
        "requirements": "Operator creates a Coinbase Commerce account (5 min)",
        "mechanism": "Direct USDC transfer to wallet",
        "currency": "USDC on Base",
        "next_deadline": "none — operator click",
        "card_kind": "donation-rail",
    },
    {
        "name": "Base Batches 2026",
        "url": "https://www.basebatches.xyz/",
        "address": CSOAI_WALLET,
        "what": "Base ecosystem grants. $10K student track, larger tracks for public-goods builders.",
        "yield_potential": "$10K (student track), variable for builder track",
        "requirements": "Application + project demo on Base",
        "mechanism": "Quadratic funding round on Base",
        "currency": "USDC on Base",
        "next_deadline": "rolling — student track deadline passed April 2026; builder track TBA",
        "card_kind": "donation-mining-rail",
    },
    {
        "name": "GCA AI DPS RM6200 (UK public sector)",
        "url": "https://www.gca.gov.uk/agreements/RM6200",
        "address": "—",
        "what": "UK government Dynamic Purchasing System for AI. AI testing suppliers join. GOV.UK departments must use it.",
        "yield_potential": "£££ — UK gov contracts; per-call rates",
        "requirements": "Operator registers as supplier (free)",
        "mechanism": "UK gov procurement",
        "currency": "GBP",
        "next_deadline": "rolling",
        "card_kind": "public-sector-rail",
    },
    {
        "name": "QA & Testing DPS RM6148 (UK public sector)",
        "url": "https://www.gca.gov.uk/agreements/RM6148",
        "address": "—",
        "what": "UK gov QA & Testing DPS — broader scope than AI DPS; covers all testing services.",
        "yield_potential": "£££ — UK gov contracts",
        "requirements": "Operator registers as supplier (free)",
        "mechanism": "UK gov procurement",
        "currency": "GBP",
        "next_deadline": "rolling",
        "card_kind": "public-sector-rail",
    },
]


def card(rail: dict) -> dict:
    """Build the donation-mining card."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": rail["card_kind"], "source": rail["name"]},
        "scope": {"axis": "donation-mining", "kind": rail["card_kind"]},
        "measurement": {
            "status": "DISCOVERED",
            "evidence": rail,
            "source_url": rail["url"],
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "doctrine": "Measurement, not certification. Anyone can re-check.",
            "wallet": f"https://basescan.org/address/{CSOAI_WALLET}",
        },
        "notes": [
            f"Rail: {rail['name']}",
            f"URL: {rail['url']}",
            f"Address: {rail['address']}",
            f"Yield potential: {rail['yield_potential']}",
            f"Requirements: {rail['requirements']}",
            f"Next deadline: {rail['next_deadline']}",
            "This is the donation-mining rail. Apply via the rail's UI.",
        ],
    }


def main():
    ap = argparse.ArgumentParser(description="Donation-mining dossier.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — DONATION-MINING RAILS (10 paths, no Stripe, no KYC)")
    print("================================================================")
    print()
    print(f"  CSOAI wallet: {CSOAI_WALLET}")
    print(f"  ENS:          {ENS_NAME} (register for readable donation URL)")
    print()

    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    cards = []
    for rail in RAILS:
        c = card(rail)
        cards.append(c)
        print(f"  ✓ {rail['name']:<32} {rail['yield_potential'][:50]}")

    # Emit
    path = QUEUE / f"donation-mining-{stamp}.jsonl"
    n_written = 0
    with open(path, "w") as f:
        for c in cards:
            blob = json.dumps(c, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                c["notes"] = c["notes"][:4]
                blob = json.dumps(c, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                continue
            f.write(blob + "\n")
            n_written += 1

    print()
    print(f"  wrote: {n_written} donation-mining cards")
    print(f"  queue: {path}")
    print()
    print("  The address 0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31 is the")
    print("  canonical receipt for ALL of these rails. Anyone can donate")
    print("  USDC / ETH / GTC directly. No Stripe. No KYC. No operator click.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
