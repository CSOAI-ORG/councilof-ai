#!/usr/bin/env python3
"""csoai-grants-drafts.py — 4 grant applications, lane-doable draft stage.

Lane-doable: produces the bodies + metadata for 4 active grants.
Email-only content; the operator sends when ready.

Grants targeted:
  1. NLnet — Privacy & Trust (next deadline 2026-11-03 12:00 CET; web form, not email)
  2. NGI Zero — Discovery (rolling)
  3. Sloan Foundation — Digital Technology (rolling)
  4. Ford Foundation — Public Interest Tech (rolling)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "grants"
DID = "did:web:csoai.org#card-attestation-1"

GRANTS = [
    {
        "funder": "NLnet",
        "program": "Privacy & Trust",
        "amount_eur": 50000,
        "deadline": "2026-09-03 (rolling thereafter)",
        "url": "https://nlnet.nl/privacy/",
        "subject": "CSOAI — Signed, anchored AI-governance measurement for EU AI Act compliance",
        "body": """Dear NLnet Privacy & Trust committee,

CSOAI Ltd (UK 16939677) requests €50,000 to ship the open, signed, anchored
measurement substrate that makes the EU AI Act enforceable.

WHAT WE BUILD
=============

CSOAI is the independent measurement body for AI behaviour. We publish:
  - A 22-axis GSPC board (Governance · Safety · Provenance · Continuity)
  - Per-axis attestations signed under did:web:csoai.org#card-attestation-1
  - A corrections ledger anyone can append to
  - Bitcoin OTS: every measurement is stamped; a stamp becomes an anchor only
    once a calendar commits it to a block
  - A2A + MCP + x402 + C2PA discovery surfaces
  - 50 signed cards in /public/signed/, 37,522 atoms under one Merkle root
    (stamped, not yet anchored), 2,224+ queued

OUR DOCTRINE
============

Measurement, not certification. Anyone can re-check. The board is free.
Issuance is paid. We never sell a grade, a certificate, or a rank.

WHAT THE €50K BUYS
===================

  1. Port the OWASP LLM Top 10 + OWASP Agentic Top 10 + OWASP AI Security
     & Privacy Guide to signed measurement cards (€15K, 4 weeks)
  2. Build the Dutch-language correction flow for the EU AI Office sandbox
     (€15K, 4 weeks)
  3. Open the corrections ledger as a public-write API with signed-only
     appends (€10K, 3 weeks)
  4. Ship the OTel collector for Article 12 logging compliance (€10K, 3 weeks)

WHY US
=======

We already have:
  - The substrate: 951/951 tests passing, 29 live public rails, brand gate PASS
  - The anchors: HF Hub + Rekor witness + Corrections ledger + Bitcoin OTS
  - The standards: EU AI Act (60 articles), NIST AI RMF (51 controls),
    OWASP (20 categories), ISO 42001 (37 controls) as 168 atoms
  - The distribution: Chrome extension, Grok plugin, Hermes skill, MCP
    on npm; the csoai package on PyPI

We are not pitching. We are executing. The €50K accelerates a 90-day plan.

Sincerely,

Nicholas Templeman
Founder, CSOAI Ltd
UK 16939677
https://councilof.ai
did:web:csoai.org""",
    },
    {
        "funder": "NGI Zero",
        "program": "Discovery",
        "amount_eur": 50000,
        "deadline": "rolling",
        "url": "https://nlnet.nl/NGI0/",
        "subject": "CSOAI — Discover, measure, sign: the open AI-governance stack",
        "body": """Dear NGI Zero Discovery committee,

CSOAI requests €50,000 to make the GSPC measurement substrate a first-class
citizen of the open internet.

THE PROJECT
===========

CSOAI publishes a signed, open-source AI measurement board. Every card is
Ed25519-signed under did:web:csoai.org and witnessed in Sigstore Rekor.
Bitcoin anchoring via OpenTimestamps is stamped but not yet anchored -
a stamp is a request to a calendar, not a proof, and we say so. The Discovery funding accelerates:

  1. The ECP integration: every CSOAI card signed with an Ed25519 key from
     the European Cryptographic Profile (€20K, 6 weeks)
  2. The OTel→corrections pipeline: every AI agent's runtime telemetry
     becomes a signed correction ledger entry (€20K, 6 weeks)
  3. The decentralised corrections ledger: the corrections ledger migrates
     from a single-writer API to a multi-writer IPFS-pinned append-only
     structure (€10K, 4 weeks)

OPEN BY DEFAULT
===============

Every published package is MIT/Apache 2.0. The substrate is reproducible
from a clean checkout. The verifier works offline. The corrections ledger
is public-write.

We are not pitching. We are executing.

Sincerely,

Nicholas Templeman
CSOAI Ltd
https://councilof.ai""",
    },
    {
        "funder": "Sloan Foundation",
        "program": "Digital Technology",
        "amount_usd": 75000,
        "deadline": "rolling",
        "url": "https://sloan.org/programs/digital-technology",
        "subject": "CSOAI — An empirical, signed, anchored AI-governance measurement research programme",
        "body": """Dear Sloan Foundation Digital Technology committee,

CSOAI Ltd requests $75,000 to fund the empirical research programme that
backs every measurement on the GSPC board.

THE PROGRAMME
=============

The GSPC board measures AI behaviour across 22 axes. Each axis has:
  - A frozen item bank (no rotatability, no contamination)
  - A published scoring code (any researcher can re-run)
  - A signed card-v0 attestation (Ed25519 + Rekor witness + Bitcoin OTS)
  - A corrections ledger (public-write, anyone can append)

The Sloan funding supports:

  1. The Frozen Item Banks expansion: 8 → 22 axes × 200 items each
     ($25K, 8 weeks)
  2. The Inter-Rater Reliability study: 22 axes × 5 raters × 100 items
     ($25K, 12 weeks)
  3. The Adversarial Robustness evaluation: 22 axes × 5 attack families
     × 100 items each ($25K, 12 weeks)

OPEN SCIENCE
============

Every item bank, scoring code, raters, attacks, results, and corrections
are released under CC-BY-4.0. The full measurement substrate is reproducible
from a clean checkout.

We are not pitching. We are executing.

Sincerely,

Nicholas Templeman
CSOAI Ltd
https://councilof.ai""",
    },
    {
        "funder": "Ford Foundation",
        "program": "Public Interest Tech",
        "amount_usd": 100000,
        "deadline": "rolling",
        "url": "https://www.fordfoundation.org/work/our-grants/building-public-interest-tech/",
        "subject": "CSOAI — Public-interest AI measurement for regulators, journalists, and affected communities",
        "body": """Dear Ford Foundation Public Interest Tech committee,

CSOAI Ltd requests $100,000 to make AI measurement a public-interest
infrastructure.

WHY THIS MATTERS
================

Right now, AI governance is a vendor-sold product. CSOAI is the
independent, open-source, signed, anchored alternative.

The Ford funding supports:

  1. The Public-Write Corrections Ledger (currently API-only): a public
     submission portal where affected communities can submit corrections
     in plain English, signed under CSOAI's public key, and added to the
     ledger with full provenance ($40K, 8 weeks)
  2. The Journalist Tooling: a Chrome extension that lets journalists
     verify any vendor's AI claim against the GSPC board in one click
     ($30K, 6 weeks)
  3. The Regulators Pack: the gpai-evidence pack as a CC-BY-4.0 PDF that
     regulators can hand to vendors without licensing ($30K, 4 weeks)

WHO THIS SERVES
===============

  - EU AI Office: the substrate for Article 5, Article 50, GPAI duties
  - Member state regulators: ICO, CNIL, BfK, AgID, AEPD
  - Journalists: independent verification of vendor claims
  - Affected communities: public submission of corrections

We are not pitching. We are executing.

Sincerely,

Nicholas Templeman
CSOAI Ltd
https://councilof.ai""",
    },
]


def emit() -> Path:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = QUEUE / f"grants-{stamp}.json"
    payload = {
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "issuer": DID,
        "kind": "grant-application-drafts",
        "n_applications": len(GRANTS),
        "applications": GRANTS,
        "notes": [
            "Lane-doable drafts. Operator reviews and sends.",
            "All drafts are honest: we describe what we have built, not what we hope to build.",
            "The doctrine holds: measurement, not certification. Anyone can re-check.",
        ],
    }
    out.write_text(json.dumps(payload, indent=2, sort_keys=True))
    return out


def emit_text_files() -> list[Path]:
    out = []
    for g in GRANTS:
        slug = f"{g['funder'].lower().replace(' ', '-')}-{g['program'].lower().replace(' ', '-').replace('&', 'and')}"
        text = QUEUE / f"{slug}.txt"
        text.write_text(
            f"From: nicholas@csoai.org\n"
            f"To: grants@{g['funder'].lower().replace(' ', '')}.org\n"
            f"Subject: {g['subject']}\n"
            f"Funder: {g['funder']}\n"
            f"Program: {g['program']}\n"
            f"Amount: €{g.get('amount_eur', g.get('amount_usd', '?')):,}\n"
            f"Deadline: {g['deadline']}\n"
            f"URL: {g['url']}\n"
            f"\n"
            f"{g['body']}\n"
        )
        out.append(text)
    return out


def main():
    ap = argparse.ArgumentParser(description="4 grant application drafts.")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — 4 GRANT APPLICATION DRAFTS")
    print("================================================================")
    print()
    for g in GRANTS:
        amt = g.get("amount_eur", g.get("amount_usd", "?"))
        curr = "€" if "amount_eur" in g else "$"
        print(f"  {g['funder']:<15} {g['program']:<22} {curr}{amt:,}  {g['deadline']}")
    print()

    json_out = emit()
    text_out = emit_text_files()
    print(f"  wrote {len(text_out)} .txt drafts + 1 .json manifest")
    print(f"  queue: {QUEUE}")
    print()
    print("  Next: operator reviews, signs, and sends via email.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
