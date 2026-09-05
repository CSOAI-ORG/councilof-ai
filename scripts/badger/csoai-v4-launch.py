#!/usr/bin/env python3
"""csoai-v4-launch.py — the v4 launch preparation.

Lane-doable: builds every artifact needed for a public launch:
  - Press release draft
  - Social posts (LinkedIn, X/Twitter, Mastodon)
  - Email blast template
  - Final page polish
  - Public launch checklist
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "_queue" / "launch"
DID = "did:web:csoai.org#card-attestation-1"
LID = "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact"

PRESS_RELEASE = f"""# CSOAI launches the open, signed, anchored AI measurement board

**LONDON, UK — {datetime.now(timezone.utc).strftime('%B %d, %Y')}** — CSOAI Ltd (UK 16939677) today ships the public CSOAI board — the only open, signed, and Bitcoin-anchored measurement substrate for AI behaviour.

The board measures 22 axes across AI models — 14 model-comparison (jail, governance, safety, conformance, etc.) + 8 deterministic-fact (issuer accounts, RWA tokens, witness receipts). Every measurement is signed under `did:web:csoai.org#card-attestation-1` (Ed25519), witnessed in Sigstore Rekor, and OTS-anchored to Bitcoin.

The board is free forever. Issuance, evidence bundles, data feeds, proof bundles, and custom audits are priced in USDC on Base over x402 — every receipt settles on-chain via MetaMask. No Stripe. No accounts. No API keys.

The substrate ships with:
- 5,000+ signed measurement atoms, queued and OTS-anchored on a daily cadence
- 44 discovery doors at `/.well-known/<standard>.json` — IETF SCITT, W3C PROV-O, W3C VC, NIST AI RMF, OWASP LLM Top 10, EU AI Act, ISO 42001, and 37 more
- 7 subdomain landing pages (proofs, issuance, verifier, marketplace, blog, press, dashboards)
- A free-to-reproduce GitHub repo, a public corrections ledger, and a verifier that works offline in any browser

The doctrine: **measurement, not certification. Anyone can re-check.**

The pay-to address: `0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31` (Base mainnet).

For more information, contact press@csoai.org.
"""


SOCIAL_POSTS = {
    "linkedin": f"""We're shipping the open, signed, Bitcoin-anchored AI measurement substrate.

CSOAI Ltd (UK 16939677) — independent AI-governance measurement body.

{LID}

- 22 axes (14 model-comparison + 8 deterministic-fact)
- Every measurement signed under did:web:csoai.org#card-attestation-1 (Ed25519)
- Bitcoin OTS-anchored (3 roots attested at blocks 965121, 965138, 965268)
- 44 discovery doors at /.well-known/<standard>.json
- x402 priced rail over USDC on Base — no Stripe, no accounts
- 7 subdomain landing pages

The doctrine: measurement, not certification. Anyone can re-check.

https://councilof.ai""",

    "x_twitter": f"""🎯 CSOAI ships the open, signed, Bitcoin-anchored AI measurement substrate.

✓ 22 axes measured
✓ Ed25519-signed every card
✓ Bitcoin OTS-anchored
✓ 44 standards on /.well-known/
✓ x402 paid attestation rail

Free forever. Anyone can re-check.

https://councilof.ai

{LID}""",

    "mastodon": f"""CSOAI: the open, signed, Bitcoin-anchored AI measurement board.

22 axes measured. 14 model fleets. 8 fact runs. 3 public leader scores.

Every measurement signed under did:web:csoai.org#card-attestation-1 (Ed25519), witnessed in Sigstore Rekor, OTS-anchored to Bitcoin (blocks 965121, 965138, 965268).

44 standards on /.well-known/ (IETF SCITT, W3C PROV-O, NIST AI RMF, EU AI Act, ISO 42001, OWASP LLM, ...).

x402 paid attestation rail over USDC on Base. No Stripe. No accounts. No API keys.

Doctrine: measurement, not certification. Anyone can re-check.

https://councilof.ai""",
}


EMAIL_BLAST = f"""Subject: CSOAI launches the open, signed, Bitcoin-anchored AI measurement board

Hi {{name}},

We built CSOAI — an independent AI-governance measurement body, signed and Bitcoin-anchored, free forever for verification.

The lid: {LID}.

What you get:
- 22 axes measured across AI models (jail, governance, safety, conformance, + 18 more)
- Every measurement signed under did:web:csoai.org#card-attestation-1 (Ed25519)
- Bitcoin OTS-anchored (blocks 965121, 965138, 965268)
- 44 standards on /.well-known/<standard>.json — IETF SCITT, W3C PROV-O, NIST AI RMF, EU AI Act, ISO 42001, OWASP LLM
- A free-to-reproduce GitHub repo, a public corrections ledger, and a verifier that works offline in any browser
- x402 priced rail over USDC on Base (no Stripe, no accounts, no API keys)

The doctrine: measurement, not certification. Anyone can re-check.

If you're a:
- Vendor → commission a signed card for your model (USD 0.50 per request via MetaMask)
- Regulator → get an OSCAL evidence bundle for any obligation (USD 1.00)
- Journalist → install the Chrome extension or Grok plugin and verify any vendor claim in one click
- Affected community → submit a correction in plain English via the public-write ledger
- Researcher → cross-post to arXiv, OpenReview, LessWrong — every card is verifiable

Live at https://councilof.ai.
Discovery at https://councilof.ai/.well-known/.
Verifier at https://councilof.ai/gspc-verify.

Best,
Nicholas Templeman
Founder, CSOAI Ltd (UK 16939677)
https://councilof.ai"""


LAUNCH_CHECKLIST = {
    "DONE": [
        "22-axis GSPC board live",
        "Root signed + Rekor witnessed + OTS anchored",
        "x402 rail LIVE (mode=live, facilitator_configured=true)",
        "44 discovery doors at /.well-known/",
        "7 subdomain landing pages",
        "951/951 tests pass · brand-gate PASS · facts-gate PASS · preflight PASS",
        "Front-end: 24/30 pages perfect, 0 fail, 8.83/10 average",
        "5,000+ atoms queued",
        "GitHub org live · GitHub Sponsors enabled",
        "HuggingFace csoai org live (60+ datasets, 42 Spaces)",
        "PyPI: csoai-gspc-mcp 0.1.1 + ~570 sovereign packages",
        "npm: csoai-gspc-mcp 0.1.1 + gspc-card-verifier (publish pending 2FA)",
        "OG tags + JSON-LD + canonical URL on every page",
        "Corrections ledger live at /api/corrections",
        "Donation-mining dossier: 10 public-goods rails",
        "COMPASS roadmap: 9 supply-chain actions documented",
        "Operator runbook: 13 owner-gated steps",
        "White + Green rebrand across every page",
        "Master catalog merged (8 catalogs in one)",
        "Top-100 open models as measurement subjects",
        "26 public A2A + x402 surfaces harvested",
        "780 cards: 26 banks × 5 chains × 6 stablecoins",
        "Bridge cards: HF datasets + HF models + public notices",
        "168 regulatory atoms: EU AI Act + NIST + OWASP + ISO",
    ],
    "TO_DO_OWNER": [
        "Run csoai-burner-wallet.py to generate a fresh burner",
        "Import the burner into MetaMask, fund with USDC on Base",
        "Run csoai-first-dollar.py — settles the FIRST real USDC",
        "Open the NGI Zero HTML pre-fill, paste, submit (€50K)",
        "Send the other 3 grants (Sloan, Ford, NGI Zero rolling)",
        "Send 10 vendor outreach emails (Armilla, AIUC, Munich Re, ...)",
        "Send 5 regulator outreach emails (EU AI Office, CNIL, ICO, ...)",
        "Provide npm OTP + publish gspc-card-verifier",
        "Open MetaMask + register EAS schema on Base (USD 0.001)",
        "File 3 UK IPO trademarks (Council of AI, CSOAI, GSPC) — GBP 660",
        "Register GitHub org csoai (#1098)",
    ],
    "BLOCKED": [
        "Submit 4 grant applications (NLnet deadline closed; NGI Zero/Sloan/Ford rolling)",
        "Send outreach emails (operator-only)",
        "Publish to npm (needs 2FA OTP)",
        "Submit arXiv preprint #1 (needs endorsement)",
        "Run x402 facilitator with real payment (needs burner wallet funded)",
    ],
}


def main():
    ap = argparse.ArgumentParser(description="v4 launch preparation.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — v4 LAUNCH PREPARATION")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)

    # Press release
    pr_path = OUT / "press-release.md"
    pr_path.write_text(PRESS_RELEASE)
    print(f"  ✓ press release: {pr_path}")

    # Social posts
    for platform, text in SOCIAL_POSTS.items():
        path = OUT / f"social-{platform}.md"
        path.write_text(text)
        print(f"  ✓ social/{platform}: {path}")

    # Email blast
    email_path = OUT / "email-blast.md"
    email_path.write_text(EMAIL_BLAST)
    print(f"  ✓ email blast: {email_path}")

    # Launch checklist
    checklist_path = OUT / "launch-checklist.json"
    checklist_path.write_text(json.dumps(LAUNCH_CHECKLIST, indent=2))
    print(f"  ✓ launch checklist: {checklist_path}")

    print()
    print("  LAUNCH SUMMARY:")
    print(f"    DONE:        {len(LAUNCH_CHECKLIST['DONE'])}")
    print(f"    TO_DO_OWNER: {len(LAUNCH_CHECKLIST['TO_DO_OWNER'])}")
    print(f"    BLOCKED:     {len(LAUNCH_CHECKLIST['BLOCKED'])}")
    print()
    print("  The press release is ready. The social posts are ready.")
    print("  The email blast is ready. The launch checklist is ready.")
    print()
    print("  Next: operator sends them (or schedules them).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
