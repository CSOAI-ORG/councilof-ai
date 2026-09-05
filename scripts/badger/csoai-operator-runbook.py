#!/usr/bin/env python3
"""csoai-operator-runbook.py — the operator click-by-click runbook.

Lane-doable: generates a single operator runbook that walks through
every owner-gated step in the exact click order. Each step has:
  - The URL
  - The exact click sequence
  - The expected outcome
  - The lane-doable check we run after

This is the SHIPPABLE runbook. The operator (Nick) executes it.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "operator-runbook"
DID = "did:web:csoai.org#card-attestation-1"

RUNBOOK = [
    # ===== EAS SCHEMA + MetaMask (the user asked for this) =====
    {
        "id": "eas-01",
        "name": "EAS Schema Registration on Base (via MetaMask)",
        "url": "https://base.easscan.org/",
        "sequence": [
            "1. Open MetaMask → switch to Base Mainnet",
            "2. Open https://base.easscan.org/ → click 'Schema' tab",
            "3. Click 'Register Schema'",
            "4. Schema name: 'CSOAI Measurement Attestation'",
            "5. Schema fields (raw):",
            "   string subject",
            "   string axis",
            "   string measurement",
            "   string sha256",
            "   uint256 timestamp",
            "   string source_url",
            "6. Resolver: (none — schema is irrevocable)",
            "7. Click 'Sign with MetaMask' → approve transaction",
            "8. Wait ~15 sec for the transaction to settle",
            "9. Copy the new schema UID from the explorer",
            "10. Paste it into docs/EAS_SCHEMA_UID.md",
        ],
        "lane_doable_after": "csoai-eas-mirror.py — re-emits every CSOAI card as an off-chain EAS attestation",
        "expected_cost": "~$0.001 (Base gas for schema registration)",
        "outcome": "Schema UID registered; off-chain EAS attestations can now reference this UID",
    },

    # ===== x402 FACILITATOR (the ONE click) =====
    {
        "id": "x402-01",
        "name": "Set X402_FACILITATOR_URL on Cloudflare Pages",
        "url": "https://dash.cloudflare.com/?to=/:account/pages/view/councilof-ai/settings/environment-variables",
        "sequence": [
            "1. Open Cloudflare dashboard",
            "2. Workers & Pages → councilof-ai → Settings → Environment variables → Production",
            "3. Click 'Add variable'",
            "4. Variable name: X402_FACILITATOR_URL",
            "5. Value: https://facilitator.payai.network",
            "6. (Optional) Add X402_PAY_TO if wallet ever rotates",
            "7. Click 'Save'",
            "8. Redeploy (push to master, or run GHA)",
        ],
        "lane_doable_after": "/api/x402 rail.mode flips from 'challenge-only' to 'live'; /api/revenue settled_usdc starts counting",
        "expected_cost": "free",
        "outcome": "x402 facilitator is live; every priced request settles on Base",
    },
    {
        "id": "x402-02",
        "name": "Confirm BOARD_SIGN_KEY_PKCS8_B64 on Pages",
        "url": "https://dash.cloudflare.com/?to=/:account/pages/view/councilof-ai/settings/environment-variables",
        "sequence": [
            "1. Same env variables screen",
            "2. Confirm BOARD_SIGN_KEY_PKCS8_B64 is present",
            "3. If absent: export from local keychain → paste",
        ],
        "lane_doable_after": "Paid cards ship signed under did:web:csoai.org#board-attestation-1",
        "expected_cost": "free",
        "outcome": "Signed paid cards (no more 'sig_ed25519: null')",
    },
    {
        "id": "x402-03",
        "name": "Bind REVENUE_KV (Cloudflare KV namespace)",
        "url": "https://dash.cloudflare.com/?to=/:account/workers/kv",
        "sequence": [
            "1. Cloudflare → Storage & Databases → KV → Create namespace",
            "2. Name: revenue",
            "3. Edit wrangler.jsonc → add kv_namespaces:",
            "   { 'binding': 'REVENUE_KV', 'id': '<new-id>' }",
            "4. Commit + push to master",
            "5. Redeploy",
        ],
        "lane_doable_after": "/api/revenue settled_usdc count moves from null to real",
        "expected_cost": "free",
        "outcome": "Revenue counts work",
    },

    # ===== npm publish + provenance =====
    {
        "id": "npm-01",
        "name": "npm publish gspc-card-verifier",
        "url": "file:///Users/nicholas/clawd/councilof-ai/packages/gspc-card-verifier",
        "sequence": [
            "1. cd packages/gspc-card-verifier",
            "2. npm login (use csoai npm account)",
            "3. npm publish --access public",
            "4. Verify: https://www.npmjs.com/package/gspc-card-verifier",
        ],
        "lane_doable_after": "Third parties can `npm install gspc-card-verifier` to verify cards offline",
        "expected_cost": "free",
        "outcome": "Verifier is on npm",
    },
    {
        "id": "npm-02",
        "name": "npm provenance for csoai-gspc-mcp",
        "url": "https://www.npmjs.com/package/csoai-gspc-mcp",
        "sequence": [
            "1. GH Actions workflow already exists",
            "2. Add to publish step: NPM_CONFIG_PROVENANCE=true",
            "3. Push to trigger Trusted Publishing",
            "4. Verify: npm audit signatures shows green check on npmjs.com",
        ],
        "lane_doable_after": "npmjs.com shows a green check on csoai-gspc-mcp linking to source commit + workflow",
        "expected_cost": "free",
        "outcome": "Provenance attestation shipped",
    },

    # ===== HF DOI =====
    {
        "id": "hf-01",
        "name": "Re-mint stale HF DOI on current commit",
        "url": "https://huggingface.co/csoai",
        "sequence": [
            "1. For each csoai/* dataset: Settings → Generate DOI",
            "2. Click 'Generate new DOI' (the old DOI stays as a pointer)",
            "3. Record the pinned commit SHA",
            "4. Add to public/interop/hf-dois.json",
        ],
        "lane_doable_after": "Every csoai/* dataset has a current DOI",
        "expected_cost": "free (DOI is free on HF)",
        "outcome": "Citation-friendly DOIs that pin the current revision",
    },

    # ===== SWH =====
    {
        "id": "swh-01",
        "name": "SWH archive eval harness",
        "url": "https://archive.softwareheritage.org/save/",
        "sequence": [
            "1. Open https://archive.softwareheritage.org/save/",
            "2. URL: https://github.com/CSOAI-ORG/councilof-ai.git",
            "3. Branch: master",
            "4. Click 'Save'",
            "5. Wait ~1-2 hours for the archive to complete",
            "6. Record the swh:1:rev: SWHID",
        ],
        "lane_doable_after": "Every measurement card can cite the SWHID as intrinsic code identifier",
        "expected_cost": "free",
        "outcome": "Harness has a permanent content ID independent of GitHub",
    },

    # ===== GRANTS =====
    {
        "id": "grants-01",
        "name": "Submit NLnet Privacy & Trust application via nlnet.nl/propose (€50K, deadline 2026-11-03 12:00 CET)",
        "url": "file:///Users/nicholas/Downloads/CSOAI_OWNER_CHECKLIST_02Sep2026.md",
        "sequence": [
            "1. Open drafts/nlnet-privacy-and-trust.txt",
            "2. Open https://nlnet.nl/privacy/",
            "3. Find 'How to apply' / 'Submit a proposal'",
            "4. Paste + personalise the draft",
            "5. Submit",
        ],
        "lane_doable_after": "NLnet receives CSOAI's application",
        "expected_cost": "free",
        "outcome": "€50K grant application submitted",
    },
    {
        "id": "grants-02",
        "name": "Send NGI Zero Discovery application (€50K, rolling)",
        "url": "https://nlnet.nl/NGI0/",
        "sequence": [
            "1. Open drafts/ngi-zero-discovery.txt",
            "2. Open https://nlnet.nl/NGI0/",
            "3. Submit via the NGI0 form",
            "4. Paste + personalise the draft",
        ],
        "lane_doable_after": "NGI Zero receives CSOAI's application",
        "expected_cost": "free",
        "outcome": "€50K grant application submitted",
    },
    {
        "id": "grants-03",
        "name": "Send Sloan Foundation application ($75K, rolling)",
        "url": "https://sloan.org/programs/digital-technology",
        "sequence": [
            "1. Open drafts/sloan-foundation-digital-technology.txt",
            "2. Open https://sloan.org/programs/digital-technology",
            "3. Submit via the Sloan portal",
            "4. Paste + personalise the draft",
        ],
        "lane_doable_after": "Sloan receives CSOAI's application",
        "expected_cost": "free",
        "outcome": "$75K grant application submitted",
    },
    {
        "id": "grants-04",
        "name": "Send Ford Foundation application ($100K, rolling)",
        "url": "https://www.fordfoundation.org/work/our-grants/building-public-interest-tech/",
        "sequence": [
            "1. Open drafts/ford-foundation-public-interest-tech.txt",
            "2. Open the Ford Foundation application form",
            "3. Paste + personalise the draft",
        ],
        "lane_doable_after": "Ford receives CSOAI's application",
        "expected_cost": "free",
        "outcome": "$100K grant application submitted",
    },

    # ===== OUTREACH =====
    {
        "id": "outreach-01",
        "name": "Send 10 vendor CTO outreach emails",
        "url": "file:///Users/nicholas/clawd/councilof-ai/docs/REVENUE-RESEARCH-2026-09-02.md",
        "sequence": [
            "1. Read §2 of REVENUE-RESEARCH (10 demand-side targets)",
            "2. For each target: research the CTO / VP name, find their email",
            "3. Personalise the cold email template",
            "4. Send via email",
        ],
        "lane_doable_after": "10 vendor conversations opened",
        "expected_cost": "free",
        "outcome": "Pipeline of vendor leads",
    },
    {
        "id": "outreach-02",
        "name": "Send 5 regulator outreach emails",
        "url": "file:///Users/nicholas/clawd/councilof-ai/docs/REVENUE-RESEARCH-2026-09-02.md",
        "sequence": [
            "1. Read §2 (regulators: EU AI Office, CNIL, ICO, etc.)",
            "2. For each: personalise + send",
        ],
        "lane_doable_after": "5 regulator conversations opened",
        "expected_cost": "free",
        "outcome": "Regulator visibility",
    },

    # ===== TRADEMARKS =====
    {
        "id": "tm-01",
        "name": "UK IPO trademark filing for Council of AI, CSOAI, GSPC",
        "url": "https://www.gov.uk/apply-register-trademark",
        "sequence": [
            "1. Open https://www.gov.uk/apply-register-trademark",
            "2. For each mark (Council of AI, CSOAI, GSPC):",
            "   - Class 9 (software)",
            "   - Class 42 (SaaS / tech services)",
            "3. Pay £170 first class + £50 per additional class",
            "4. Total budget: 3 × (1 × 170 + 1 × 50) = £660",
        ],
        "lane_doable_after": "Trademarks filed, publication in TM Journal",
        "expected_cost": "£660 (rising to £795 from 1 April 2026)",
        "outcome": "Brand protection",
    },

    # ===== DNS =====
    {
        "id": "dns-01",
        "name": "Add 7 subdomain DNS records (proofs, issuance, verifier, marketplace, blog, press, dashboards)",
        "url": "https://dash.cloudflare.com/?to=/:account/csoai.org/dns",
        "sequence": [
            "1. Cloudflare → csoai.org → DNS → Records",
            "2. For each subdomain:",
            "   - Type: CNAME",
            "   - Name: <slug>",
            "   - Target: csoai-site.pages.dev",
            "3. Save",
            "4. Workers & Pages → csoai-site → Custom domains → Add the 7 subdomains",
        ],
        "lane_doable_after": "7 subdomains resolve + serve their CF Pages project",
        "expected_cost": "free",
        "outcome": "7 subdomain landing pages live on public URLs",
    },
]


def main():
    ap = argparse.ArgumentParser(description="The operator click-by-click runbook.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — OPERATOR RUNBOOK (click-by-click)")
    print("================================================================")
    print()

    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    # Emit as JSON
    runbook = {
        "kind": "csoai.operator-runbook",
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "n_steps": len(RUNBOOK),
        "total_cost": "£660 trademarks + ~$0.001 EAS + everything else free",
        "steps": RUNBOOK,
    }
    json_path = QUEUE / f"operator-runbook-{stamp}.json"
    json_path.write_text(json.dumps(runbook, indent=2, sort_keys=True))

    # Emit as Markdown
    md = []
    md.append("# CSOAI Operator Runbook")
    md.append("")
    md.append(f"Generated: {runbook['as_of']}")
    md.append("")
    md.append(f"Total steps: **{len(RUNBOOK)}**")
    md.append(f"Total cost: **£660 trademarks** + **~$0.001 EAS** + everything else **free**")
    md.append("")
    md.append("## Order of execution")
    md.append("")
    md.append("1. **EAS schema** (MetaMask + Base) — 5 min")
    md.append("2. **x402 facilitator URL** on Pages — 1 min")
    md.append("3. **Confirm signing key** on Pages — 1 min")
    md.append("4. **Bind REVENUE_KV** — 5 min")
    md.append("5. **npm publish gspc-card-verifier** — 5 min")
    md.append("6. **npm provenance** — 5 min")
    md.append("7. **NLnet grant** (deadline 2026-11-03 12:00 CET — web form at nlnet.nl/propose) — 30 min")
    md.append("8. **Re-mint HF DOIs** — 30 min per dataset")
    md.append("9. **SWH archive** — 5 min (waits for archive to complete)")
    md.append("10. **Other 3 grants** (NGI, Sloan, Ford) — 30 min each")
    md.append("11. **10 vendor + 5 regulator outreach emails** — 2 hours")
    md.append("12. **UK IPO trademarks** — 1 hour")
    md.append("13. **7 subdomain DNS records** — 15 min")
    md.append("")
    md.append("**Total time: ~6-8 hours of operator clicks**")
    md.append("")
    md.append("## Each step")
    md.append("")

    for step in RUNBOOK:
        md.append(f"### {step['id']}: {step['name']}")
        md.append("")
        md.append(f"**URL**: [{step['url']}]({step['url']})")
        md.append("")
        md.append(f"**Sequence**:")
        md.append("")
        for s in step["sequence"]:
            md.append(f"  {s}")
        md.append("")
        md.append(f"**Lane-doable after**: {step['lane_doable_after']}")
        md.append("")
        md.append(f"**Expected cost**: {step['expected_cost']}")
        md.append("")
        md.append(f"**Outcome**: {step['outcome']}")
        md.append("")
        md.append("---")
        md.append("")

    md_path = QUEUE / f"operator-runbook-{stamp}.md"
    md_path.write_text("\n".join(md))

    print(f"  JSON: {json_path.relative_to(HERE.parent.parent)}")
    print(f"  MD:   {md_path.relative_to(HERE.parent.parent)}")
    print()
    print(f"  {len(RUNBOOK)} steps, ~6-8 hours of operator clicks")
    print()
    print(f"  HIGHEST-IMPACT FIRST:")
    print(f"    1. NLnet grant (deadline 2026-11-03 12:00 CET — €50K, submit at nlnet.nl/propose)")
    print(f"    2. x402 facilitator URL (the ONE click for first $)")
    print(f"    3. EAS schema on Base (MetaMask)")
    print(f"    4. npm publish gspc-card-verifier")
    print(f"    5. npm provenance")
    print(f"    6. Re-mint HF DOIs")
    print(f"    7. SWH archive harness")
    print(f"    8. Other 3 grants")
    print(f"    9. Outreach emails")
    print(f"   10. Trademarks + subdomains")
    return 0


if __name__ == "__main__":
    sys.exit(main())
