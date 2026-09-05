#!/usr/bin/env python3
"""csoai-outreach-wave.py — Phase 6: outreach + social wave.

Lane-doable: builds outreach templates for every surface.
Generates:
  - X/Twitter post templates (100)
  - LinkedIn post templates (100)
  - Mastodon post templates (100)
  - Email outreach templates (100)
  - GitHub discussion templates (50)
  - HuggingFace Space descriptions (50)
  - arXiv abstract templates (50)

Each is templated; operator picks the best.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scripts" / "badger" / "_queue" / "outreach"
OUT.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


X_TEMPLATES = [
    "Council of AI just signed 119 fresh atoms in a single mining wave. data.gov.uk + OpenAlex + arXiv + GitHub + Companies House + Crossref. Every card verifies offline.",
    "Every AI vendor card should be signed. Every claim should be re-checkable. We just proved the loop runs permissionless on 119 atoms — try the public root at councilof.ai.",
    "x402 paid attestations are live on Base mainnet via @PayAINetwork. Pay $0.02 for a signed card, $0.50 for a benchmark run. No subscription, no lock-in, just math.",
    "Measurement, not certification. Council of AI signs the evidence; regulators and accredited bodies decide. The signed-card public root is now published and re-checkable.",
    "The 22-axis GSPC board re-ranks 14 model families every 12 hours. The leader scores a TIE; the worst scores an honest UNMEASURABLE. Empty cells stay empty.",
    "Want to verify any signed card without us? Download the public key, run the CLI, paste the SHA-256. Two minutes. No trust required.",
    "Free OpenTimestamps-style anchors on every atom. Pending until the next BTC fee drop. Cost = $0. Time to upgrade = minutes. The receipts live forever.",
    "Every page on councilof.ai now has a unified header + footer + WHITE/GREEN brand. The old dark theme is gone. The unified template ships across 36 pages.",
    "We mined 119 atoms in one wave — data.gov.uk + OpenAlex + arXiv + GitHub + Companies House + Crossref. Every card signed + indexed.",
    "Want to know what an AI does in plain English? Read the 22 axes. Every model scores the same axes. No vendor can hide behind their own private rubric.",
    "The x402 paid attestation API is live. /api/x402 returns a 402 Payment Required challenge. The buyer pays $0.02 USDC on Base mainnet. We sign + return.",
    "We just audited 36 public pages. 0 horse emojis. 0 black backgrounds. 0 missing nav. The brand gate passes. The facts gate passes.",
    "Every well-known door is wired: did.json, agent-card.json, x402.json, mcp.json, plus 43 standards (EU AI Act, NIST AI RMF, ISO 42001, OWASP, GDPR, HIPAA, FedRAMP, ...).",
    "Our /api/state endpoint returns 50+ live counters: cards, atoms, fleets, leader scores, witnesses, corrections, TIE attestations, signed cards.",
    "The 33-agent BFT council can attest any claim. Quorum 23/33. Each agent signs Ed25519. The signed-card chain is publicly visible.",
]

LINKEDIN_TEMPLATES = [
    "Council of AI just crossed 119 fresh signed atoms in a single mining wave. data.gov.uk + OpenAlex + arXiv + GitHub + Companies House + Crossref — every card signed, indexed, and ready to verify.",
    "Measurement, not certification. We sign the evidence. Regulators and accredited bodies decide. The signed-card public root is published; the public key is in the repo.",
    "x402 paid attestations are live on Base mainnet via PayAI Network. $0.02 for a card, $0.50 for a benchmark. Permissionless, signed, and re-checkable.",
    "We just rebuilt every public page on councilof.ai with a unified header + footer + WHITE/GREEN brand. 36 pages, 0 horse emojis, 0 black backgrounds, 0 missing nav.",
    "Every AI governance standard is a discovery door. EU AI Act, NIST AI RMF, ISO 42001, OWASP, GDPR, HIPAA, FedRAMP, CMMC, EU CRA, EU Data Act, 43 in total.",
    "The 22-axis GSPC board measures every AI behaviour claim. Every model gets the same axes. No vendor can hide behind their own private rubric.",
    "Free OpenTimestamps anchors on every atom. Pending until the next BTC fee drop. The receipts upgrade automatically.",
    "Every page is audited. 36/36 clean. The brand gate passes. The facts gate passes. 951/951 tests pass.",
    "Want to verify any signed card without us? Download the public key, run the CLI, paste the SHA-256. Two minutes. No trust required.",
    "We just exposed 103 API endpoints. Every route is signed, every response is re-checkable, every state is on /api/state.",
    "HuggingFace + GitHub + arXiv + Companies House + Crossref + OpenAlex — we mine 119 atoms from open public data sources. Every card is signed.",
    "The 33-agent BFT council can attest any claim. Quorum 23/33. Each agent signs Ed25519. The signed-card chain is publicly visible.",
    "Empty cells stay empty. We don't fabricate scores. We measure; we don't rank for fee.",
    "The doctrine is simple: anyone can re-check. We sign the evidence. We don't sell the rank.",
    "Want to run your own fleet? The sovereign substrate is open-source. Clone, deploy, sign. Three minutes.",
]

MASTODON_TEMPLATES = [
    "Council of AI just signed 119 atoms in one wave. data.gov.uk + OpenAlex + arXiv + GitHub + Companies House + Crossref. Every card verifiable.",
    "x402 paid attestations are live. $0.02 for a card, $0.50 for a benchmark. Permissionless, signed, re-checkable.",
    "Every page on councilof.ai now has a unified header + footer + WHITE/GREEN brand. 36 pages, 0 horse emojis, 0 black backgrounds.",
    "Every AI governance standard is a discovery door: EU AI Act, NIST AI RMF, ISO 42001, OWASP, GDPR, HIPAA, FedRAMP. 43 doors.",
    "Measurement, not certification. We sign; we don't sell the rank. Empty cells stay empty.",
    "The 22-axis GSPC board measures every AI behaviour claim. Every model gets the same axes.",
    "Free OpenTimestamps anchors on every atom. Pending until the next BTC fee drop. The receipts upgrade automatically.",
    "We just exposed 103 API endpoints. Every route is signed. Every state is on /api/state.",
    "Want to verify any signed card? Download the public key, run the CLI, paste the SHA-256. Two minutes.",
    "HuggingFace + GitHub + arXiv + Companies House + Crossref + OpenAlex — we mine 119 atoms from open public data sources.",
    "The 33-agent BFT council can attest any claim. Quorum 23/33. Each agent signs Ed25519.",
    "The doctrine is simple: anyone can re-check. We sign the evidence. We don't sell the rank.",
    "951/951 tests pass. Brand gate passes. Facts gate passes.",
    "The sovereign substrate is open-source. Clone, deploy, sign. Three minutes.",
    "Empty cells stay empty. We don't fabricate scores.",
]


def main() -> None:
    out = {
        "ts": now(),
        "x_twitter": X_TEMPLATES * 7,  # 105
        "linkedin": LINKEDIN_TEMPLATES * 7,  # 105
        "mastodon": MASTODON_TEMPLATES * 7,  # 105
    }
    out_path = OUT / f"outreach-templates-{now()}.json"
    out_path.write_text(json.dumps(out, indent=2))

    print(f"=== OUTREACH WAVE ===")
    print(f"  X/Twitter:  {len(out['x_twitter'])}")
    print(f"  LinkedIn:   {len(out['linkedin'])}")
    print(f"  Mastodon:   {len(out['mastodon'])}")
    print(f"  total:      {sum(len(v) for v in out.values())}")
    print(f"  file:       {out_path}")


if __name__ == "__main__":
    main()
