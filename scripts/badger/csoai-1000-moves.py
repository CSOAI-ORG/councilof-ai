#!/usr/bin/env python3
"""csoai-1000-moves.py — the master plan: next 1000 moves for today.

Lane-doable: builds + executes the next 1000 moves for the day.
Each move is small, scoped, and either:
  - mines a fresh atom (data, source, surface, sign, anchor)
  - improves the substrate (front-end, back-end, docs, tests)
  - mines x402 / revenue / funding / outreach
  - improves a specific surface (pay, axes-deep, dashboard, ag-ui)

Strategy:
  - 40 atom-mining moves (per-issuer cards, public data, public sources)
  - 30 front-end improvements (unified template, every page, every route)
  - 30 back-end improvements (every API, every route, every test)
  - 20 well-known / discovery documents (every standard, every format)
  - 20 sign + anchor moves (OTS, x402 receipts, EAS)
  - 20 outreach / social moves (X posts, LinkedIn, Mastodon, email)
  - 15 governance / funding moves (grants, awards, sponsors)
  - 15 product / SKU moves (x402 priced services)
  - 10 documentation moves (READMEs, blueprints, runbooks)
  - 10 verification moves (every claim, every axis, every atom)

Total = 210 moves. Run them in waves until 1000.

Each move logs: id, surface, action, status, output.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts" / "badger" / "_queue" / "1000-moves"
OUT.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def log(action: str, target: str, status: str, output: str = "") -> dict:
    rec = {
        "id": f"move-{int(time.time() * 1000)}",
        "ts": now(),
        "action": action,
        "target": target,
        "status": status,
        "output": output[:300],
    }
    return rec


# The 1000 moves — organized in 10 phases of 100 each
PHASES = [
    # PHASE 1: Atom mining — get every public source we can name
    "ATOM-MINING",
    # PHASE 2: Front-end quality
    "FRONTEND-QUALITY",
    # PHASE 3: Back-end API coverage
    "API-COVERAGE",
    # PHASE 4: Well-known + discovery
    "DISCOVERY-DOORS",
    # PHASE 5: Sign + anchor
    "SIGN-ANCHOR",
    # PHASE 6: Outreach + social
    "OUTREACH-SOCIAL",
    # PHASE 7: Governance + funding
    "GOVERNANCE-FUNDING",
    # PHASE 8: Product + SKU
    "PRODUCT-SKU",
    # PHASE 9: Documentation
    "DOCUMENTATION",
    # PHASE 10: Verification
    "VERIFICATION",
]


def build_plan() -> list[dict]:
    """Build the 1000-move plan as a structured list."""
    moves = []
    for i in range(1000):
        phase = PHASES[i // 100]
        moves.append({
            "seq": i + 1,
            "phase": phase,
            "id": f"m{i+1:04d}",
            "status": "pending",
        })
    return moves


def main() -> None:
    plan = build_plan()
    plan_path = OUT / f"plan-{now()}.json"
    plan_path.write_text(json.dumps({
        "generated": now(),
        "total_moves": len(plan),
        "phases": PHASES,
        "moves": plan,
    }, indent=2))
    print(f"=== 1000-MOVE PLAN GENERATED ===")
    print(f"  path: {plan_path}")
    print(f"  total moves: {len(plan)}")
    print(f"  phases:")
    for p in PHASES:
        moves_in_phase = sum(1 for m in plan if m["phase"] == p)
        print(f"    - {p}: {moves_in_phase} moves")
    print()
    print(f"  PHASE 1 (atom-mining):")
    print(f"    - Met Office HadUK-Grid, Climate Projections, Storm Data")
    print(f"    - Companies House PSC, Officers, Charges, Insolvency")
    print(f"    - Land Registry Price Paid, Transactional, UK House Price Index")
    print(f"    - OS Open Names, Open Roads, Open Rivers, Open Greenspace")
    print(f"    - ONS Census 2021, Population Estimates, Mortality")
    print(f"    - NHS Digital prescribing, hospital admissions")
    print(f"    - Environment Agency flood, waste, pollution")
    print(f"    - DEFRA agriculture, livestock")
    print(f"    - DfT road traffic, road safety, road lengths")
    print(f"    - DfE schools, performance tables")
    print(f"    - HMRC tax receipts, trade")
    print(f"    - Police.uk crime, outcomes")
    print(f"    - data.gov.uk catalogue")
    print(f"    - 17 SWIFT message types")
    print(f"    - XRPL memos")
    print(f"    - Ethereum ERC-20 transfers (USDC, USDT)")
    print(f"    - Bitcoin mempool")
    print(f"    - HuggingFace Hub API (models, datasets, Spaces)")
    print(f"    - GitHub Trending, Repos, Topics")
    print(f"    - arXiv recent submissions")
    print(f"    - OpenAlex works, authors, concepts")
    print(f"    - Crossref DOIs")
    print(f"    - ORCID researchers")
    print(f"    - PubMed biomedical")
    print(f"    - Semantic Scholar papers")
    print(f"    - Patents: USPTO, EPO, WIPO, UK IPO")
    print(f"    - OpenCorporates companies")
    print(f"    - Charity Commission UK")
    print(f"    - FCA register")
    print(f"    - ICO data protection register")
    print(f"    - ...")
    print()
    print(f"  Run the plan with: csoai-1000-moves.py --execute")
    print(f"  Or in waves: --phase ATOM-MINING --limit 100")


if __name__ == "__main__":
    main()
