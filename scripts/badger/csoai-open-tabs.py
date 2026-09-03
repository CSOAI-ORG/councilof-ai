#!/usr/bin/env python3
"""csoai-open-tabs.py — open every browser tab for the operator.

Lane-doable: opens the browser with all the tabs the operator needs
to click through. Each tab is a specific action with the URL + the
fields to fill + the button to click.

Tabs to open:
  1. GitHub Actions — check the latest deploy
  2. GitHub Sponsors activation (CSOAI-ORG) — owner must enable
  3. NLnet propose form (NGI Zero Discovery) — pre-filled in the URL
  4. MetaMask settings — for EAS schema registration
  5. Base EAS scan — verify schema after registration
  6. ENS app.ens.domains — for csoai.eth registration
  7. Octant app — quadratic funding rounds
  8. Giveth — donation platform
  9. GCA AI DPS RM6200 — UK gov AI testing supplier
 10. UK IPO trade marks — apply online
 11. npm package page for csoai-gspc-mcp — npm publish
 12. HuggingFace csoai org — already shows activity from Claude
 13. csoai.org apex — the Layer 0 ceremony
 14. The grants HTML pre-fill page
 15. The operator runbook MD

Each tab is opened by the operator-driven browser session via the
browser_harness + the user's auth.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "_queue" / "browser-tabs"
DID = "did:web:csoai.org#card-attestation-1"

# Each tab has a URL + a description of what to click + the time needed
OPERATOR_TABS = [
    # GitHub + deploy
    {
        "url": "https://github.com/CSOAI-ORG/councilof-ai/actions",
        "title": "GHA deploys",
        "action": "Check the latest deploy status",
        "time_min": 1,
    },
    {
        "url": "https://github.com/organizations/CSOAI-ORG/settings/billing",
        "title": "GH org billing",
        "action": "Verify the org + ensure billing is set up for Sponsors",
        "time_min": 2,
    },
    {
        "url": "https://github.com/sponsors/CSOAI-ORG/sponsorships/new",
        "title": "GH Sponsors enable",
        "action": "Enable GitHub Sponsors for CSOAI-ORG (5 min)",
        "time_min": 5,
    },
    {
        "url": "https://github.com/CSOAI-ORG/councilof-ai/settings/secrets/actions",
        "title": "GH Actions secrets",
        "action": "Set the HF token so the badge becomes visible",
        "time_min": 5,
    },

    # Grants
    {
        "url": "https://nlnet.nl/propose/",
        "title": "NGI Zero Discovery grant",
        "action": "Open the pre-filled HTML + paste into the form + submit (€50K)",
        "time_min": 30,
    },
    {
        "url": "https://nlnet.nl/PET/",
        "title": "NLnet Privacy & Trust",
        "action": "Note: NLnet itself is closed till Nov 3 2026 (we verified)",
        "time_min": 1,
    },
    {
        "url": "https://sloan.org/programs/digital-technology",
        "title": "Sloan Digital Technology",
        "action": "Submit the Sloan draft ($75K)",
        "time_min": 30,
    },
    {
        "url": "https://www.fordfoundation.org/work/our-grants/building-public-interest-tech/",
        "title": "Ford Public Interest Tech",
        "action": "Submit the Ford draft ($100K)",
        "time_min": 30,
    },

    # Crypto / Web3
    {
        "url": "https://base.easscan.org/",
        "title": "Base EAS scan",
        "action": "Connect MetaMask + register the CSOAI schema (USD 0.001)",
        "time_min": 5,
    },
    {
        "url": "https://app.ens.domains/csoai.eth",
        "title": "ENS csoai.eth",
        "action": "Register csoai.eth (one-time USD 5 + USD 5/yr renewal)",
        "time_min": 5,
    },
    {
        "url": "https://commerce.coinbase.com/",
        "title": "Coinbase Commerce",
        "action": "Create a Coinbase Commerce account for USDC donations",
        "time_min": 10,
    },
    {
        "url": "https://passport.gitcoin.co/",
        "title": "Gitcoin Passport",
        "action": "Free sybil-resistant identity (required for GG rounds)",
        "time_min": 10,
    },
    {
        "url": "https://grants.gitcoin.co/",
        "title": "Gitcoin Grants",
        "action": "Apply for the next round (5K-50K USD per round)",
        "time_min": 30,
    },

    # UK public sector
    {
        "url": "https://www.gca.gov.uk/agreements/RM6200",
        "title": "UK GCA AI DPS RM6200",
        "action": "Register CSOAI Ltd as AI testing supplier (free)",
        "time_min": 30,
    },
    {
        "url": "https://www.gca.gov.uk/agreements/RM6148",
        "title": "UK QA & Testing DPS RM6148",
        "action": "Register CSOAI Ltd as QA testing supplier (free)",
        "time_min": 30,
    },

    # Trademarks
    {
        "url": "https://www.gov.uk/apply-register-trademark",
        "title": "UK IPO trademarks",
        "action": "File Council of AI, CSOAI, GSPC × Class 9 + Class 42 (GBP 660)",
        "time_min": 60,
    },

    # npm
    {
        "url": "https://www.npmjs.com/package/csoai-gspc-mcp",
        "title": "npm csoai-gspc-mcp",
        "action": "Verify the package is live + check provenance badge",
        "time_min": 1,
    },
    {
        "url": "https://www.npmjs.com/package/gspc-card-verifier",
        "title": "npm gspc-card-verifier",
        "action": "If 404 — publish (npm publish with OTP)",
        "time_min": 1,
    },

    # HuggingFace
    {
        "url": "https://huggingface.co/csoai",
        "title": "HF csoai org",
        "action": "Verify activity (Claude lane is landing mill cards here)",
        "time_min": 1,
    },
    {
        "url": "https://huggingface.co/csoai/gspc-hub-cards",
        "title": "HF gspc-hub-cards",
        "action": "Verify the hub-cards repo + check the badge",
        "time_min": 1,
    },

    # The substrate
    {
        "url": "https://councilof.ai/",
        "title": "councilof.ai apex",
        "action": "Verify the live site shows WHITE + GREEN + unified nav",
        "time_min": 1,
    },
    {
        "url": "https://councilof.ai/pay",
        "title": "councilof.ai/pay",
        "action": "Verify the MetaMask x402 page",
        "time_min": 1,
    },
    {
        "url": "https://councilof.ai/api/gspc",
        "title": "councilof.ai/api/gspc",
        "action": "Verify the live 22-axis board",
        "time_min": 1,
    },
    {
        "url": "https://councilof.ai/api/x402",
        "title": "councilof.ai/api/x402",
        "action": "Verify x402 mode=live + facilitator_configured=true",
        "time_min": 1,
    },
    {
        "url": "https://councilof.ai/gspc-verify",
        "title": "councilof.ai/gspc-verify",
        "action": "Verify the offline verifier works (paste any signed card)",
        "time_min": 1,
    },
    {
        "url": "https://csoai.org/",
        "title": "csoai.org apex",
        "action": "Verify the DID + Layer 0 ceremony + Apex branding",
        "time_min": 1,
    },

    # Grants HTML (pre-fill)
    {
        "url": "https://councilof.ai/grants/ngi-zero.html",
        "title": "NGI Zero pre-fill HTML",
        "action": "Open the pre-filled form, copy each field into the live NLnet form, submit",
        "time_min": 5,
    },

    # Operator runbook
    {
        "url": "file:///Users/nicholas/clawd/councilof-ai/scripts/badger/_queue/operator-runbook/operator-runbook-20260903T075154Z.md",
        "title": "Operator runbook",
        "action": "Read the full runbook — every step has URL + sequence + outcome",
        "time_min": 5,
    },
]


def main():
    ap = argparse.ArgumentParser(description="Open every operator tab.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — OPEN EVERY OPERATOR TAB")
    print(f"  {len(OPERATOR_TABS)} tabs to open")
    print(f"  Total estimated time: {sum(t['time_min'] for t in OPERATOR_TABS)} min")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    # Emit the tab list as JSON + MD
    payload = {
        "kind": "csoai.operator-tabs",
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "n_tabs": len(OPERATOR_TABS),
        "total_time_min": sum(t["time_min"] for t in OPERATOR_TABS),
        "tabs": OPERATOR_TABS,
    }
    json_path = OUT / f"operator-tabs-{stamp}.json"
    json_path.write_text(json.dumps(payload, indent=2, sort_keys=True))

    md = ["# CSOAI — Operator Tabs\n",
           f"Total tabs: **{len(OPERATOR_TABS)}** · Total time: **{sum(t['time_min'] for t in OPERATOR_TABS)} min**\n",
           "## The tabs\n"]
    for i, t in enumerate(OPERATOR_TABS, 1):
        md.append(f"### {i}. [{t['title']}]({t['url']}) ({t['time_min']} min)")
        md.append(f"  - URL: {t['url']}")
        md.append(f"  - Action: {t['action']}")
        md.append("")
    md.append("\n---\n\nDoctrine: measurement, not certification. Anyone can re-check.\n")
    md_path = OUT / f"operator-tabs-{stamp}.md"
    md_path.write_text("\n".join(md))

    # Print the list
    for i, t in enumerate(OPERATOR_TABS, 1):
        print(f"  {i:>2}. {t['title']:<32} {t['time_min']:>3} min  {t['url'][:60]}")

    print()
    print(f"  JSON: {json_path}")
    print(f"  MD:   {md_path}")
    print()
    print("  Each tab is the EXACT URL + the action + the time. Open them all in the browser.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
