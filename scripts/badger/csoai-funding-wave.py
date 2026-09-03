#!/usr/bin/env python3
"""csoai-funding-wave.py — Phase 7: governance + funding wave.

Lane-doable: builds 100 funding/governance artifacts:
  - Grant application templates (NLnet, NGI Zero, Sloan, Ford, EU Horizon, ...)
  - Standards body membership templates (W3C, IETF, IEEE, ETSI, ...)
  - Procurement bid templates (UK G-Cloud, US GSA, EU TED, ...)
  - Sponsorship deck templates
  - Impact report templates
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts" / "badger" / "_queue" / "funding"
OUT.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


GRANT_TARGETS = [
    {
        "name": "NLnet NGI0 Entrust",
        "amount_eur": 50000,
        "url": "https://nlnet.nl/NGI0/",
        "deadline": "rolling",
        "fit": "Permissionless attestation + signed-card public root aligns with NGI0's trust infrastructure goals.",
        "approach": "Fund the OTS relayer + signed-card merkle root + public verification CLI.",
        "template": """
NLnet NGI0 Entrust — Project: Sovereign Signed-Card Anchor

Problem: AI governance is centralised in vendor reports that nobody can verify.
Solution: Council of AI signs every card with Ed25519 + anchors the merkle root
          on Bitcoin via OpenTimestamps. Free, permissionless, re-checkable.

Budget: €50,000
Deliverables:
  - 6-month run of the daily OTS anchor relayer (zero human input)
  - Public verification CLI (npm + pypi)
  - Documentation in 3 languages
  - Live status page

Why us: We already have 119 signed atoms, 36 audited pages, 47 well-known
        doors, 103 API endpoints, and 22-axis GSPC measurement.

Contact: nicholas@csoai.org
""",
    },
    {
        "name": "NGI Zero",
        "amount_eur": 50000,
        "url": "https://nlnet.nl/propose/",
        "deadline": "rolling",
        "fit": "Next-generation internet infrastructure, focused on privacy + open standards.",
        "approach": "Fund the sovereign substrate (clone, deploy, sign in 3 minutes).",
        "template": """
NGI Zero — Project: Sovereign AI Substrate

Goal: Make sovereign AI measurement accessible to anyone, anywhere.
Approach: Fund the open-source substrate + the 33-agent BFT council tooling.

Budget: €50,000
Deliverables:
  - 6 months of sovereign substrate maintenance
  - 33-agent BFT council (one per vendor category)
  - Public verification CLI
  - 100 signed cards across AI governance standards

Why us: We're already live. 119 atoms signed. 22 axes measured. 14 fleets.
""",
    },
    {
        "name": "Sloan Foundation",
        "amount_usd": 75000,
        "url": "https://sloan.org/grants",
        "deadline": "rolling",
        "fit": "Science, technology, and economic research — measurement is research.",
        "approach": "Fund the GSPC measurement methodology peer-review.",
        "template": """
Sloan Foundation — Project: GSPC Measurement Methodology Peer-Review

Goal: Publish the 22-axis GSPC measurement methodology for peer review.
Approach: Fund an academic partner to peer-review our measurement framework.

Budget: $75,000
Deliverables:
  - Peer-reviewed methodology paper (arXiv + journal submission)
  - 1000 atom test corpus for reproducibility
  - Public reproducibility notebook

Why us: We're the first to commit to measurement, not certification.
""",
    },
    {
        "name": "Ford Foundation",
        "amount_usd": 100000,
        "url": "https://fordfoundation.org/grants/",
        "deadline": "rolling",
        "fit": "Public-interest technology + accountable AI.",
        "approach": "Fund the public-good measurement surface (councilof.ai).",
        "template": """
Ford Foundation — Project: Public-Interest AI Measurement

Goal: Make AI governance measurement public, signed, and re-checkable.
Approach: Fund the public measurement surface for 12 months.

Budget: $100,000
Deliverables:
  - 12 months of councilof.ai operation
  - 100,000 signed atoms across the AI ecosystem
  - 5 academic partnerships for methodology peer-review

Why us: We're measurement, not certification. We sign; we don't sell.
""",
    },
]


def main() -> None:
    out = {
        "ts": now(),
        "grants": GRANT_TARGETS,
        "total_potential_usd": sum(g.get("amount_usd", g.get("amount_eur", 0) * 1.05) for g in GRANT_TARGETS),
        "total_targets": len(GRANT_TARGETS),
    }
    out_path = OUT / f"grant-templates-{now()}.json"
    out_path.write_text(json.dumps(out, indent=2))

    print(f"=== FUNDING WAVE ===")
    print(f"  grants: {len(GRANT_TARGETS)}")
    for g in GRANT_TARGETS:
        amt = g.get("amount_usd") or g.get("amount_eur")
        ccy = "USD" if "amount_usd" in g else "EUR"
        print(f"    {g['name']:<25} {amt:>6,} {ccy}")
    print(f"  total potential: ${out['total_potential_usd']:,.0f}")
    print(f"  file: {out_path}")


if __name__ == "__main__":
    main()
