#!/usr/bin/env python3
"""csoai-master-plan.py — the master execution plan builder.

Lane-doable: reads the current estate state and produces the master
execution plan for the next 90 days, organized into 7 vectors:

  1. n SITES — surface expansion (councilof.ai, csoai.org, proofs, etc.)
  2. TRAFFIC — SEO, AEO, GEO, sitemap, llms.txt, openapi
  3. USERS — the people who land on the sites and what they see
  4. AWARENESS — the signals that say "CSOAI exists"
  5. PR — the press release + the EU AI Office press kit
  6. PRESS — the published works (preprints, papers, posts)
  7. OUTREACH — the emails, the dms, the warm intros

Each vector has:
  - current state (what we have)
  - target state (what we want)
  - concrete moves (the lane-doable pieces)
  - owner gates (what only Nick can do)
  - success metrics (how we know it worked)

The output is a single .md file the dashboard reads + a .json manifest
for the 1000x loop to track.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "master-plan"
DID = "did:web:csoai.org#card-attestation-1"

PLAN = {
    "n_sites": {
        "current": {
            "councilof.ai": "live — 22-axis board + 29 rails",
            "csoai.org": "live — DID + apex + Layer 0",
            "github.com/CSOAI-ORG/councilof-ai": "active — 570 PyPI + npm + 2 GitHub orgs",
            "huggingface.co/csoai": "active — 60+ datasets, 42 Spaces, 3 models",
            "PyPI csoai-gspc-mcp": "live — the MCP server",
            "npm csoai-gspc-mcp": "live — the stdio MCP server",
            "Chrome Web Store": "pending owner",
            "Grok plugin (x-cli host)": "in repo",
            "Hermes skill (council-of-ai)": "live in this terminal",
        },
        "target": {
            "councilof.ai": "the unified console — all rails, all tools, all axes in one place",
            "csoai.org": "the public measurement body — DID, Layer 0, EU AI Act portal",
            "proofs.councilof.ai": "the proof portal — bulk history + inclusion proofs",
            "issuance.councilof.ai": "the issuance portal — pay via MetaMask, get a signed card",
            "verifier.councilof.ai": "the verifier portal — paste any signed card, verify offline",
            "marketplace.councilof.ai": "the packs marketplace — gpai-evidence, cra-readiness, insurers",
            "blog.councilof.ai": "the long-form blog — methodology, findings, doctrine",
        },
        "moves_lane_doable": [
            "Build proofs.councilof.ai — the proof portal (Cloudflare Pages, single repo)",
            "Build issuance.councilof.ai — the issuance portal (MetaMask + x402)",
            "Build verifier.councilof.ai — the verifier portal (offline WebCrypto)",
            "Build marketplace.councilof.ai — the packs marketplace (Stripe-free, MetaMask)",
            "Build blog.councilof.ai — the long-form blog (MDX + RSS)",
            "Wire each subdomain as a CF Pages project (independent deploys)",
            "Each project gets its own discovery doc at /.well-known/<project>.json",
        ],
        "owner_gates": [
            "Add the 6 subdomains to Cloudflare DNS (1 click per subdomain)",
            "Verify each subdomain in Search Console",
            "Submit each sitemap to Bing + Yandex",
        ],
        "metrics": {
            "n_subdomains_live": {"target_d30": 3, "target_d90": 6},
            "n_pages_per_subdomain": {"target_d30": 5, "target_d90": 20},
            "n_discovery_docs": {"target_d30": 50, "target_d90": 80},
        },
    },
    "traffic": {
        "current": {
            "sitemap.xml": "482 entries, 81KB — 481 unique",
            "llms-sitemap.xml": "35 entries",
            "llms.txt": "8KB",
            "llms-full.txt": "20KB (new this session)",
            "openapi.json": "66 paths, 24KB",
            "og tags": "now on every page (8.8/10 average)",
            "JSON-LD": "now on every page (Organization + WebSite)",
            "Brand gate": "PASS — 106 pages/txt scanned",
        },
        "target": {
            "sitemap.xml": "1,000+ entries — every public surface indexed",
            "llms-sitemap.xml": "200+ entries — every axis + every standard",
            "llms.txt": "20KB → 50KB — every public surface described",
            "llms-full.txt": "20KB → 200KB — full corpus dump for AI agents",
            "openapi.json": "100+ paths — every priced + free endpoint",
            "Schema.org": "every page has Organization + WebSite + SoftwareApplication + Dataset",
            "HuggingFace datasets": "100+ (currently 60+)",
            "Cross-post to": "arXiv, OpenReview, LessWrong, EA Forum, AI Alignment Forum",
        },
        "moves_lane_doable": [
            "Cross-post every preprint to arXiv (cs.AI + cs.CY)",
            "Cross-post every blog post to LessWrong + EA Forum + AI Alignment Forum",
            "Submit every dataset to HuggingFace datasets (with DOI)",
            "Submit every model card to HuggingFace models (with DOI)",
            "Submit every preprint to OpenReview (with venue tag)",
            "Wire AEO markers (SpeakableSpecification, ClaimReview) on every page",
            "Wire WebSub (PubSubHubbub) on the blog",
            "Wire IndieAuth on every author page",
        ],
        "owner_gates": [
            "arXiv endorsement for cs.AI submissions",
            "OpenReview profile + venue submissions",
            "HuggingFace dataset namespace `csoai` permissions",
        ],
        "metrics": {
            "organic_traffic_daily": {"target_d30": 100, "target_d90": 1000},
            "n_inbound_links": {"target_d30": 50, "target_d90": 500},
            "n_citations": {"target_d30": 5, "target_d90": 50},
            "llms_crawler_pings_daily": {"target_d30": 50, "target_d90": 500},
        },
    },
    "users": {
        "current": {
            "end_users": "developers, researchers, journalists, regulators, vendors",
            "personas_documented": "5+ (developer, journalist, regulator, vendor, affected person)",
            "persona_walks": "e2e-persona-walk.mjs script in scripts/",
            "verified_walks": "12 of 12 must pass",
        },
        "target": {
            "primary_users": [
                "EU AI Office: Article 5, Article 50, GPAI duties",
                "Member state regulators: ICO, CNIL, BfK, AgID, AEPD, AP",
                "Vendors: Meta, Mistral, Aleph Alpha, OpenAI, Anthropic, Google",
                "Insurers: Lloyd's syndicates, Munich Re, Zurich, Allianz",
                "Journalists: tech journalists covering AI safety",
                "Researchers: AI safety, alignment, governance",
                "Affected communities: anyone who can submit a correction",
            ],
            "persona_dashboard": "/dashboards/<persona>.html — one URL per persona",
            "persona_email": "<persona>@csoai.org — routed to the right human",
        },
        "moves_lane_doable": [
            "Build /dashboards/eu-ai-office.html — the regulator's view",
            "Build /dashboards/vendor.html — the vendor's view",
            "Build /dashboards/insurer.html — the insurer's view",
            "Build /dashboards/journalist.html — the journalist's view",
            "Build /dashboards/affected-person.html — the public's view",
            "Wire persona-aware copy on every page (5 variants per page)",
            "Add persona-aware 404.html (different copy per persona)",
        ],
        "owner_gates": [
            "Set up email routing for <persona>@csoai.org",
            "Set up the chat widget for live support",
            "Set up the booking link for 1:1 demo calls",
        ],
        "metrics": {
            "n_persona_dashboards": {"target_d30": 5, "target_d90": 5},
            "n_paid_users": {"target_d30": 0, "target_d90": 5},
            "n_active_users_daily": {"target_d30": 50, "target_d90": 500},
            "n_corrections_submitted": {"target_d30": 1, "target_d90": 50},
        },
    },
    "awareness": {
        "current": {
            "HF badge": "live — csoai badge in HuggingFace docs",
            "Public Root": "live — signed + Rekor witnessed + OTS anchored",
            "Layer 0 ceremony": "live — 28/29 rails attested",
            "44 discovery docs": "live — every standard we connect to",
            "5x grant drafts": "live — NLnet, NGI Zero, Sloan, Ford + 1 more",
            "Defence-AI public framing": "DEFONEOS / meok-defoneos / csoai-defoneos",
        },
        "target": {
            "arxiv_preprints": "10+ preprints with the CSOAI seal",
            "openreview_submissions": "5+ submissions to AI safety venues",
            "press_kit": "the CSOAI press kit at /press.html",
            "media_list": "100 journalists who cover AI safety",
            "podcast_appearances": "5+ AI safety podcast appearances",
            "conference_talks": "3+ conference talks (NeurIPS, ICML, AIES, FAccT)",
        },
        "moves_lane_doable": [
            "Write 10 arXiv preprints covering each axis family",
            "Write 1 long-form blog post per week (50 over 12 months)",
            "Build /press.html — the press kit (logos, screenshots, FAQ, contacts)",
            "Build /media.html — the media list + reach-out template",
            "Build /talks.html — the conference talk archive",
            "Build /citations.html — every citation of CSOAI work",
            "Wire the corrections ledger to be public-write (anyone can submit)",
        ],
        "owner_gates": [
            "Submit the first arXiv preprint (needs endorsement)",
            "Pitch the first journalist (needs Nick's voice)",
            "Submit the first conference talk (needs travel)",
        ],
        "metrics": {
            "n_arxiv_preprints": {"target_d30": 2, "target_d90": 10},
            "n_blog_posts": {"target_d30": 4, "target_d90": 12},
            "n_press_mentions": {"target_d30": 1, "target_d90": 10},
            "n_podcast_appearances": {"target_d30": 0, "target_d90": 5},
        },
    },
    "pr": {
        "current": {
            "what_is_new_page": "live — /what-is-new.html",
            "war.gov_press_card": "live — the FACT card for the 31 Aug war.gov release",
            "openai_mil_card": "live — UNCHECKABLE (mil requires login)",
            "fedramp_marketplace_card": "live — /api/badge returns the badge",
            "defoneos_alignment": "DEFONEOS / meok-defoneos / csoai-defoneos",
        },
        "target": {
            "press_releases": "1 per month — public, dated, signed",
            "press_release_archive": "/press-releases.html — every release",
            "embargoed_pre_releases": "for journalists under embargo",
            "press_release_distribution": "PR Newswire, Business Wire, EIN Presswire",
        },
        "moves_lane_doable": [
            "Build /press-releases.html — the press release archive",
            "Build /press-releases/<slug>.html — each individual press release",
            "Wire an RSS feed for /press-releases.xml",
            "Wire an Atom feed for /press-releases.atom",
            "Build the press release template (/press-release-template.html)",
            "Wire OpenGraph tags on every press release page",
            "Wire the press release metadata as JSON-LD NewsArticle schema",
        ],
        "owner_gates": [
            "Write the first press release (needs Nick's voice)",
            "Distribute via PR Newswire (needs budget)",
            "Set up the journalist database (needs Nick's network)",
        ],
        "metrics": {
            "n_press_releases": {"target_d30": 1, "target_d90": 3},
            "n_press_pickups": {"target_d30": 0, "target_d90": 10},
            "n_media_inquiries": {"target_d30": 0, "target_d90": 10},
        },
    },
    "press": {
        "current": {
            "arxiv_preprints": "0 (none yet — needs endorsement)",
            "blog_posts": "0 (no blog yet)",
            "openreview_submissions": "0 (none yet)",
            "publications_citing_csoai": "0 (CSOAI is new)",
        },
        "target": {
            "arxiv_preprints": "10 covering each axis family",
            "blog_posts": "1 per week (50 over 12 months)",
            "openreview_submissions": "5+ to AI safety venues (NeurIPS, ICML, AIES)",
            "publications_citing_csoai": "1+ per preprint (organic)",
        },
        "moves_lane_doable": [
            "Write preprint 001: 'The 22-axis GSPC measurement instrument' (cs.AI)",
            "Write preprint 002: 'Ed25519-signed measurement cards for AI governance' (cs.CR)",
            "Write preprint 003: 'The corrections ledger: public-write accountability for AI' (cs.CY)",
            "Write preprint 004: 'Bitcoin OTS anchors for AI measurement' (cs.CR)",
            "Write preprint 005: 'Per-axis jail evaluation: 8B language models' (cs.CL)",
            "Write preprint 006: 'The 26-bank SWIFT census + XRPL' (cs.CE)",
            "Write preprint 007: 'EU AI Act Article 50 marking evidence' (cs.CY)",
            "Write preprint 008: 'OWASP LLM Top 10 as measurement axes' (cs.CR)",
            "Write preprint 009: 'NIST AI RMF crosswalk to GSPC' (cs.CY)",
            "Write preprint 010: 'COSE_Sign1 wrapper for card-v0 attestations' (cs.CR)",
            "Blog 001: 'Why measurement, not certification'",
            "Blog 002: 'The 4-anchor machine: how CSOAI binds every measurement'",
            "Blog 003: 'UNCHECKABLE is honest: what we refuse to claim'",
            "Blog 004: 'The 26-bank honest answer: 5 XRPL, 3 EVM, 18 permissioned'",
        ],
        "owner_gates": [
            "arXiv endorsement for cs.AI submissions (one email)",
            "OpenReview profile + venue submissions (one signup)",
            "Each preprint reviewed by Nick before submission",
        ],
        "metrics": {
            "n_arxiv_preprints": {"target_d30": 2, "target_d90": 10},
            "n_blog_posts": {"target_d30": 4, "target_d90": 12},
            "n_openreview_submissions": {"target_d30": 1, "target_d90": 5},
            "n_citations": {"target_d30": 0, "target_d90": 5},
        },
    },
    "outreach": {
        "current": {
            "email_drafts": "5+ — NLnet, NGI Zero, Sloan, Ford, plus more",
            "linkedin_posts": "0 (none yet)",
            "x_twitter_posts": "0 (none yet)",
            "warm_intros": "0 (no outreach yet)",
        },
        "target": {
            "grants_submitted": "4 (NLnet, NGI Zero, Sloan, Ford)",
            "vendor_outreach": "10 vendor CTOs contacted",
            "regulator_outreach": "5 regulators contacted (ICO, CNIL, BfK, AgID, AEPD)",
            "insurer_outreach": "3 insurers contacted (Lloyd's, Munich Re, Zurich)",
            "journalist_outreach": "10 journalists pitched",
            "researcher_outreach": "10 researchers contacted for collaboration",
        },
        "moves_lane_doable": [
            "Write 10 vendor CTO cold emails (with the EU AI Act pack pitch)",
            "Write 5 regulator outreach emails (with the corrections ledger pitch)",
            "Write 3 insurer outreach emails (with the Lloyd's syndicate pitch)",
            "Write 10 journalist pitches (with the war.gov release as the hook)",
            "Write 10 researcher collaboration emails (with the OWEM pitch)",
            "Build /outreach/<persona>.html — the public outreach playbook",
            "Build /contact.html — the public contact page (one form per persona)",
        ],
        "owner_gates": [
            "Send the 4 grant applications (operator-only)",
            "Send the first 10 vendor outreach emails (operator-only)",
            "Send the first 5 regulator outreach emails (operator-only)",
        ],
        "metrics": {
            "n_grants_submitted": {"target_d30": 1, "target_d90": 4},
            "n_vendor_responses": {"target_d30": 1, "target_d90": 5},
            "n_regulator_responses": {"target_d30": 0, "target_d90": 2},
            "n_journalist_interviews": {"target_d30": 0, "target_d90": 3},
        },
    },
}


def main():
    ap = argparse.ArgumentParser(description="Build the master execution plan.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — MASTER EXECUTION PLAN (n sites · traffic · users ·")
    print("  awareness · PR · press · outreach · growth)")
    print("================================================================")
    print()

    QUEUE.mkdir(parents=True, exist_ok=True)

    # Compute totals
    n_moves = sum(len(v["moves_lane_doable"]) for v in PLAN.values())
    n_gates = sum(len(v["owner_gates"]) for v in PLAN.values())
    n_metrics = sum(len(v["metrics"]) for v in PLAN.values())

    print(f"  7 vectors:")
    for name, v in PLAN.items():
        print(f"    {name:<20} {len(v['moves_lane_doable'])} moves  {len(v['owner_gates'])} gates  {len(v['metrics'])} metrics")
    print()
    print(f"  totals: {n_moves} moves · {n_gates} gates · {n_metrics} metrics")
    print()

    # Emit the JSON manifest
    plan = {
        "kind": "csoai.master-execution-plan",
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "horizon": "90 days",
        "vectors": list(PLAN.keys()),
        "totals": {
            "n_moves": n_moves,
            "n_gates": n_gates,
            "n_metrics": n_metrics,
        },
        "plan": PLAN,
    }
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = QUEUE / f"master-plan-{stamp}.json"
    json_path.write_text(json.dumps(plan, indent=2, sort_keys=True))

    # Emit the Markdown version
    md_lines = [
        "# CSOAI Master Execution Plan",
        "",
        f"Generated: {plan['as_of']}",
        "",
        "## The 7 vectors",
        "",
        "| Vector | Current | Target | Lane-doable moves | Owner gates |",
        "|---|---|---|---|---|",
    ]
    for name, v in PLAN.items():
        md_lines.append(
            f"| **{name}** | "
            f"{len(v['current'])} surfaces | "
            f"{len(v['target'])} targets | "
            f"{len(v['moves_lane_doable'])} | "
            f"{len(v['owner_gates'])} |"
        )
    md_lines.append("")
    md_lines.append(f"**Totals**: {n_moves} moves · {n_gates} gates · {n_metrics} metrics")
    md_lines.append("")

    for name, v in PLAN.items():
        md_lines.append(f"## {name.upper()}")
        md_lines.append("")
        md_lines.append("### Current")
        for k, val in v["current"].items():
            md_lines.append(f"- **{k}**: {val}")
        md_lines.append("")
        md_lines.append("### Target")
        for k, val in v["target"].items():
            md_lines.append(f"- **{k}**: {val}")
        md_lines.append("")
        md_lines.append("### Lane-doable moves")
        for m in v["moves_lane_doable"]:
            md_lines.append(f"- {m}")
        md_lines.append("")
        md_lines.append("### Owner gates")
        for g in v["owner_gates"]:
            md_lines.append(f"- {g}")
        md_lines.append("")
        md_lines.append("### Metrics")
        for k, target in v["metrics"].items():
            md_lines.append(f"- **{k}**: {target}")
        md_lines.append("")

    md_lines.append("---")
    md_lines.append("")
    md_lines.append("## The Doctrine")
    md_lines.append("")
    md_lines.append("**Measurement, not certification. Anyone can re-check.**")
    md_lines.append("")
    md_lines.append("The plan is mine, automate, grow. The 4 LaunchAgents run the loop 24/7.")
    md_lines.append("The operator (Nick) executes the owner gates.")
    md_lines.append("")

    md_path = QUEUE / f"master-plan-{stamp}.md"
    md_path.write_text("\n".join(md_lines))

    print(f"  JSON: {json_path.relative_to(HERE.parent.parent)}")
    print(f"  MD:   {md_path.relative_to(HERE.parent.parent)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
