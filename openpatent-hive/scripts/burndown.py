#!/usr/bin/env python3
"""
burndown.py — Sovereign burndown CLI for the openpatent.ai hive.

Scans the hive for remaining work by reading:
  - docs/100-100-SOVEREIGN.md        (sovereign headline targets)
  - docs/strategy/03-90-day-kill-shot.md  (week-by-week deliverables)
  - docs/strategy/07-risk-register.md     (12 named risks + mitigations)
  - docs/strategy/08-integration-roadmap.md (30-day execution order)
  - docs/series-a/01-pitch-deck.md, 02-executive-onepager.md, 03-due-diligence.md, 04-financial-model.md
  - scripts/                         (existing automation; what's still missing)

Groups remaining work by effort (XS / S / M / L / XL) and prints a prioritized
ordered list. DEFONEOS mythic voice throughout.

Usage:
  python3 scripts/burndown.py            # default: ordered by effort
  python3 scripts/burndown.py --leverage  # ordered by leverage (workstream, then effort)
  python3 scripts/burndown.py --week N    # filter to week N (1-12) of the kill-shot
  python3 scripts/burndown.py --json      # machine-readable output

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List, Optional

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
STRATEGY = DOCS / "strategy"
SERIES_A = DOCS / "series-a"
SCRIPTS = ROOT / "scripts"

SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets."

# Effort legend (in minutes of focused sovereign work)
EFFORT_MIN = {"XS": 5, "S": 30, "M": 120, "L": 480, "XL": 1440}
EFFORT_LABEL = {
    "XS": "5 min   (XS)",
    "S":  "30 min  (S) ",
    "M":  "2 hour  (M) ",
    "L":  "1 day   (L) ",
    "XL": "3 days  (XL)",
}

# Priority: which workstream is highest leverage right now.
# (lower number = higher priority)
WORKSTREAM_PRIORITY = {
    "sovereign": 1,   # substrate / runtime hardening
    "kill-shot": 2,    # 90-day roadmap W1-W4
    "expansion": 3,    # W5-W8 (companion / harvi / temple)
    "monopoly":  4,    # W9-W12 (fund / court / sealed)
    "series-a":  5,    # investor narrative
    "audit":     6,    # risk / quality
    "launch":    7,    # PR / HN / blogs
    "fork":      8,    # fork-doctrine
    "ops":       9,    # devops / monitoring
}

# Order keys: we use a tuple (workstream_priority, effort_index, title)
EFFORT_ORDER = {"XS": 0, "S": 1, "M": 2, "L": 3, "XL": 4}


@dataclass
class Item:
    title: str
    effort: str          # XS | S | M | L | XL
    workstream: str      # sovereign | kill-shot | expansion | monopoly | series-a | audit | launch | fork | ops
    week: Optional[int]  # 1-12 for kill-shot items, else None
    queen: Optional[str] = None   # e.g. "Rex", "Atlas"
    source: str = ""              # the doc or script that surfaced this
    sigil: str = ""               # optional sigil emission name
    done: bool = False
    note: str = ""

    @property
    def minutes(self) -> int:
        return EFFORT_MIN.get(self.effort, 0)


# ─────────────────────────────────────────────────────────────────────────────
# Builders for each workstream.  Each builder returns a List[Item].
# Items marked done=True have already shipped (we set that explicitly).
# ─────────────────────────────────────────────────────────────────────────────

def items_sovereign() -> List[Item]:
    """Layer 0-7 substrate, runtime, observability, real data."""
    return [
        # ── L0 substrate (sovereign VM)
        Item("Multi-region sovereign VM redundancy (3 regions: europe-west2 / us-central1 / asia-southeast1)",
             "XL", "sovereign", None, "Zephyr", "docs/strategy/07-risk-register.md §C1",
             sigil="multi-region-dr.sig.json", note="Risk C1 mitigation"),
        Item("Cloudflare + sovereign firewall DDoS protection with status page at status.sovereign-ai.ai",
             "M", "sovereign", None, "Zephyr", "docs/strategy/07-risk-register.md §C1",
             sigil="ddos-shield.sig.json"),
        Item("Daily offline + online backup to sovereign vault (4-hour RTO disaster-recovery playbook)",
             "L", "sovereign", None, "Atlas", "docs/strategy/07-risk-register.md §C1",
             sigil="dr-playbook.sig.json"),
        # ── L2 observability
        Item("Grafana dashboard for 16 metric families per service",
             "L", "sovereign", None, "Zephyr", "docs/00-INDEX.md §5",
             sigil="grafana-hive.sig.json", note="Top-5 next move from 100-100-SOVEREIGN.md"),
        # ── L5 production hardening
        Item("Wire patentmcp audit chain + registry from JSON files to Postgres",
             "L", "sovereign", None, "Atlas", "docs/strategy/08-integration-roadmap.md W5",
             sigil="patentmcp-postgres.sig.json"),
        Item("Wire bft-council from in-memory log to Postgres (audit-grade BFT log)",
             "L", "sovereign", None, "Kai", "docs/strategy/08-integration-roadmap.md W5",
             sigil="bft-postgres.sig.json"),
        Item("Caddy + fail2ban + UFW edge hardening (replace plain Caddy)",
             "M", "sovereign", None, "Zephyr", "docs/strategy/08-integration-roadmap.md W5",
             sigil="edge-hardening.sig.json"),
        Item("Co-sign every image with cosign (SLSA Level 3 supply-chain)",
             "M", "sovereign", None, "Luna", "docs/strategy/08-integration-roadmap.md W5",
             sigil="cosign-images.sig.json"),
        # ── L6 multi-region
        Item("k8s manifests + Helm chart for sovereign substrate (designed, not deployed)",
             "L", "sovereign", None, "Atlas", "docs/100-100-SOVEREIGN.md §6",
             sigil="k8s-helm.sig.json"),
        # ── L7 auto-patent — already shipped; one item to extend
        Item("webhook receiver for Clerk (user.created) + Stripe (payment_intent.succeeded) + GitHub (push) + MCP (tool_called)",
             "M", "sovereign", None, "River", "docs/100-100-SOVEREIGN.md §7",
             sigil="webhook-mesh.sig.json"),
        # ── L9 sigil chain
        Item("MPC key custody 3-of-5 + HSM for root keys + quarterly key rotation",
             "L", "sovereign", None, "Atlas", "docs/strategy/07-risk-register.md §C3",
             sigil="sigil-mpc.sig.json", note="Risk C3 mitigation"),
        Item("Signed releases via Sigstore + cosign + SLSA Level 3 for npm/PyPI",
             "M", "sovereign", None, "Luna", "docs/strategy/07-risk-register.md §C4",
             sigil="slsa-l3.sig.json", note="Risk C4 mitigation"),
    ]


def items_kill_shot() -> List[Item]:
    """90-day kill-shot weeks 1-4 (the door)."""
    return [
        # ── W1: Hive awakens
        Item("Publish 3 GitHub repos: openpatent-hive, patentmcp, openpatent-mcp (gh repo create CSOAI-ORG/*)",
             "S", "kill-shot", 1, "Atlas", "docs/strategy/08-integration-roadmap.md W1",
             sigil="gh-repos-3.sig.json"),
        Item("DNS cutover: openpatent.ai → 35.242.143.249 (Caddy + Namecheap API)",
             "XS", "kill-shot", 1, "Rex", "docs/strategy/08-integration-roadmap.md W1",
             sigil="dns-cutover.sig.json", note="5-min next move"),
        Item("TLS auto-renewal via Caddy (Let's Encrypt) — 4 subdomains",
             "XS", "kill-shot", 1, "Zephyr", "docs/strategy/08-integration-roadmap.md W1",
             sigil="tls-on.sig.json", note="5-min next move"),
        Item("Mint 28 NFT-sigils (one per .ai domain), anchor on CometBFT, hash at verify.meok.ai/{hash}",
             "L", "kill-shot", 1, "Aria", "docs/strategy/03-90-day-kill-shot.md §1",
             sigil="master-sigil-chain.sig.json"),
        Item("Press release #1 — 'CSOAI Ltd captures 28 .ai domains — the sovereign-AI addressable space'",
             "M", "kill-shot", 1, "Nova", "docs/strategy/03-90-day-kill-shot.md §1",
             sigil="press-release-1.sig.json"),
        Item("HackerNews strike #1 — 'Show HN: I built 12 sovereign-AI services on a £/mo sovereign VM'",
             "M", "kill-shot", 1, "Ember", "docs/strategy/03-90-day-kill-shot.md §1",
             sigil="hn-strike-1.sig.json"),
        # ── W2: Legal Tech pack
        Item("Land legalof.ai — single page + 3 demo case types + sovereign sigil",
             "L", "kill-shot", 2, "Marcus", "docs/strategy/03-90-day-kill-shot.md §2",
             sigil="legalof-landing.sig.json"),
        Item("Land juris-ai.ai — case-law RAG over sovereign LLM (7 Ollama models)",
             "L", "kill-shot", 2, "Sage", "docs/strategy/03-90-day-kill-shot.md §2",
             sigil="juris-launch.sig.json"),
        Item("Land prove-ai.ai — Ed25519 evidence forge, court-admissible receipts",
             "L", "kill-shot", 2, "Iris", "docs/strategy/03-90-day-kill-shot.md §2",
             sigil="prove-launch.sig.json"),
        Item("Land courtbot.ai — MCOL + small-claims + employment-tribunal bot",
             "L", "kill-shot", 2, "Kai", "docs/strategy/03-90-day-kill-shot.md §2",
             sigil="courtbot-launch.sig.json"),
        Item("Stripe live: 5-tier PAYG across all 4 Legal Tech domains",
             "M", "kill-shot", 2, "River", "docs/strategy/03-90-day-kill-shot.md §2",
             sigil="legal-stripe-live.sig.json"),
        # ── W3: IP Castle pack
        Item("Land ipcastle.ai — the keep, 5 patents + 5 trademarks + 5 grants thesis",
             "L", "kill-shot", 3, "Atlas", "docs/strategy/03-90-day-kill-shot.md §3",
             sigil="ipcastle-landing.sig.json"),
        Item("Open-source PatentMCP server (GitHub + npm + PyPI)",
             "M", "kill-shot", 3, "Luna", "docs/strategy/03-90-day-kill-shot.md §3",
             sigil="patentmcp-publish.sig.json"),
        Item("Land tm-ai.ai — trademark watch, BrandShield MVP",
             "L", "kill-shot", 3, "Zephyr", "docs/strategy/03-90-day-kill-shot.md §3",
             sigil="tm-ai-launch.sig.json"),
        Item("Land fraudspot-ai.ai — patent fraud detection, prior-art forgery radar",
             "L", "kill-shot", 3, "Marcus", "docs/strategy/03-90-day-kill-shot.md §3",
             sigil="fraudspot-launch.sig.json"),
        Item("PatentMCP first 1,000 GitHub stars + first 50 production integrations",
             "L", "kill-shot", 3, "Ember", "docs/strategy/03-90-day-kill-shot.md §3",
             sigil="patentmcp-1k-stars.sig.json"),
        # ── W4: KILL-SHOT week
        Item("OpenRouter Fusion: route LLM calls through 400+ models for BFT sub-votes",
             "L", "kill-shot", 4, "Atlas", "docs/strategy/08-integration-roadmap.md W2",
             sigil="openrouter-fusion.sig.json"),
        Item("Care veto: deploy real LLM-based care scoring (replace 0.05 sentinel)",
             "M", "kill-shot", 4, "Aria", "docs/strategy/08-integration-roadmap.md W2",
             sigil="care-veto-real.sig.json"),
        Item("Cross-hive attestation: openpatent-bft → meok-keystone via csoai-layer0-net",
             "M", "kill-shot", 4, "Rex", "docs/strategy/08-integration-roadmap.md W2",
             sigil="cross-hive-attest.sig.json"),
        Item("First end-to-end: real LLM-voted BFT review of a real disclosure",
             "M", "kill-shot", 4, "Rex", "docs/strategy/08-integration-roadmap.md W2",
             sigil="bft-real-e2e.sig.json"),
        Item("Press release #2: 'CSOAI files PatentMCP — the world's first sovereign-AI patent MCP server'",
             "M", "kill-shot", 4, "Nova", "docs/strategy/03-90-day-kill-shot.md §4",
             sigil="press-release-2.sig.json"),
        Item("HackerNews strike #2: 'Show HN: PatentMCP — every AI agent can now file, search, audit patents'",
             "M", "kill-shot", 4, "Ember", "docs/strategy/03-90-day-kill-shot.md §4",
             sigil="hn-strike-2.sig.json"),
        Item("LinkedIn strike: 'I just open-sourced the sovereign patent stack' (50k impressions)",
             "M", "kill-shot", 4, "Sage", "docs/strategy/03-90-day-kill-shot.md §4",
             sigil="linkedin-strike-1.sig.json"),
        Item("Sovereign Substrate Monopoly Declaration drafted at bft-council.ai",
             "L", "kill-shot", 4, "Rex", "docs/strategy/03-90-day-kill-shot.md §4",
             sigil="monopoly-declaration.sig.json"),
        Item("Kill-shot press cycle: TechCrunch, The Register, HackerNews front page",
             "XL", "kill-shot", 4, "Aria", "docs/strategy/03-90-day-kill-shot.md §4",
             sigil="kill-shot-press.sig.json"),
    ]


def items_expansion() -> List[Item]:
    """Weeks 5-8: companion + harvi + sovereign substrate front."""
    return [
        # W5: Treasury
        Item("Ship Sovereign Companion: the 27 named companions (Aria → Shanti)",
             "XL", "expansion", 5, "Aria", "docs/strategy/03-90-day-kill-shot.md §5",
             sigil="companion-launch.sig.json"),
        Item("Ship Sovereign Home dashboard (the dragon's den)",
             "L", "expansion", 5, "Rex", "docs/strategy/03-90-day-kill-shot.md §5",
             sigil="sovereign-home.sig.json"),
        Item("Ship Sovereign Vault (Ed25519 key custody + MPC)",
             "L", "expansion", 5, "Atlas", "docs/strategy/03-90-day-kill-shot.md §5",
             sigil="sovereign-vault.sig.json"),
        Item("Ship Sovereign Court (22/33 BFT arbitration)",
             "L", "expansion", 5, "Marcus", "docs/strategy/03-90-day-kill-shot.md §5",
             sigil="sovereign-court.sig.json"),
        Item("Stripe: Gold Counsel + Platinum Chambers tier launches",
             "M", "expansion", 5, "Nova", "docs/strategy/03-90-day-kill-shot.md §5",
             sigil="openpatent-stripe-3.sig.json"),
        # W6: Gaming pack
        Item("Land harvi.ai — harvi.harvest open beta, 1,000 free Hatchling accounts",
             "L", "expansion", 6, "River", "docs/strategy/03-90-day-kill-shot.md §6",
             sigil="harvi-beta.sig.json"),
        Item("Land hydro-ai.ai — procedural biome engine MVP",
             "L", "expansion", 6, "Luna", "docs/strategy/03-90-day-kill-shot.md §6",
             sigil="hydro-launch.sig.json"),
        Item("Land biosensing-ai.ai — affects detection, breath, pupil, haptics",
             "L", "expansion", 6, "Iris", "docs/strategy/03-90-day-kill-shot.md §6",
             sigil="biosensing-launch.sig.json"),
        Item("harvi.ai ships 27 named companions as NPCs",
             "L", "expansion", 6, "Ember", "docs/strategy/03-90-day-kill-shot.md §6",
             sigil="harvi-npcs.sig.json"),
        Item("harvi.ai ships first NFT sigil mint (koi → 5 scales)",
             "M", "expansion", 6, "Nova", "docs/strategy/03-90-day-kill-shot.md §6",
             sigil="harvi-mint-1.sig.json"),
        # W7: Throne room
        Item("Land bft-council.ai — the 12 named queens' deliberation chamber",
             "L", "expansion", 7, "Kai", "docs/strategy/03-90-day-kill-shot.md §7",
             sigil="bft-council-landing.sig.json"),
        Item("Land sovereignos.ai — the sovereign OS landing + LEGO-snaps demo",
             "L", "expansion", 7, "Atlas", "docs/strategy/03-90-day-kill-shot.md §7",
             sigil="sovereignos-launch.sig.json"),
        Item("Land sovereignclaw.ai — the sovereign CLI / agent forge",
             "L", "expansion", 7, "Zephyr", "docs/strategy/03-90-day-kill-shot.md §7",
             sigil="sovereignclaw-launch.sig.json"),
        Item("Land datamoat.ai — the 10-dim data moat marketplace",
             "L", "expansion", 7, "Sage", "docs/strategy/03-90-day-kill-shot.md §7",
             sigil="datamoat-launch.sig.json"),
        Item("bft-council.ai holds first live 22/33 deliberation (re: IP Castle patent grant 1)",
             "XL", "expansion", 7, "Rex", "docs/strategy/03-90-day-kill-shot.md §7",
             sigil="bft-deliberation-1.sig.json"),
        # W8: 2nd kill-shot
        Item("harvi.ai ships koi-to-dragon evolution (12,000 XP = 1 scale)",
             "L", "expansion", 8, "River", "docs/strategy/03-90-day-kill-shot.md §8",
             sigil="koi-to-dragon.sig.json"),
        Item("harvi.ai ships sovereigncompanion.chat (the 27 named companions go chat)",
             "L", "expansion", 8, "Aria", "docs/strategy/03-90-day-kill-shot.md §8",
             sigil="companion-chat.sig.json"),
        Item("openpatent.ai + harvi.ai cross-mint first sovereign NFT sigil (joint pack)",
             "M", "expansion", 8, "Nova", "docs/strategy/03-90-day-kill-shot.md §8",
             sigil="cross-pack-mint-1.sig.json"),
        Item("Press release #3: 'The sovereign companion never forgets'",
             "M", "expansion", 8, "Rex", "docs/strategy/03-90-day-kill-shot.md §8",
             sigil="press-release-3.sig.json"),
        Item("HackerNews strike #3: 'Show HN: 27 named AI companions with BFT memory'",
             "M", "expansion", 8, "Ember", "docs/strategy/03-90-day-kill-shot.md §8",
             sigil="hn-strike-3.sig.json"),
    ]


def items_monopoly() -> List[Item]:
    """Weeks 9-12: fund + court + temple + monopoly seal."""
    return [
        # W9
        Item("Land sovereignfund.ai — the sovereign treasury, LP-facing",
             "L", "monopoly", 9, "Atlas", "docs/strategy/03-90-day-kill-shot.md §9",
             sigil="sovereignfund-launch.sig.json"),
        Item("Land sovereigncourt.ai — 22/33 BFT arbitration (open to 3rd parties)",
             "L", "monopoly", 9, "Marcus", "docs/strategy/03-90-day-kill-shot.md §9",
             sigil="sovereigncourt-launch.sig.json"),
        Item("sovereignfund.ai closes first £2M LP round (angels + strategic .ai holders)",
             "XL", "monopoly", 9, "Rex", "docs/strategy/03-90-day-kill-shot.md §9",
             sigil="fund-close-1.sig.json"),
        Item("sovereigncourt.ai hears first 3rd-party dispute (test case: SaaS IP infringement)",
             "M", "monopoly", 9, "Kai", "docs/strategy/03-90-day-kill-shot.md §9",
             sigil="court-hearing-1.sig.json"),
        Item("sovereignos.ai ships sovereign-OS v0.9 (LEGO-snaps API stable)",
             "L", "monopoly", 9, "Luna", "docs/strategy/03-90-day-kill-shot.md §9",
             sigil="sovereignos-v0.9.sig.json"),
        # W10
        Item("Land sovereign-temple.ai — the oracle, the sovereign companion home",
             "L", "monopoly", 10, "Aria", "docs/strategy/03-90-day-kill-shot.md §10",
             sigil="temple-launch.sig.json"),
        Item("Land sovereigncanvas.ai — the sovereign UI / agentic front-end builder",
             "L", "monopoly", 10, "Ember", "docs/strategy/03-90-day-kill-shot.md §10",
             sigil="canvas-launch.sig.json"),
        Item("Land maternal-covenant.ai — the care economy (Aria's dominion)",
             "L", "monopoly", 10, "Iris", "docs/strategy/03-90-day-kill-shot.md §10",
             sigil="covenant-launch.sig.json"),
        Item("sovereign-temple.ai ships prayer-as-sigil (every quest = a sigil mint)",
             "M", "monopoly", 10, "Sage", "docs/strategy/03-90-day-kill-shot.md §10",
             sigil="prayer-sigil.sig.json"),
        Item("sovereigncanvas.ai ships first 100 sovereign UI themes (NFT-mint)",
             "M", "monopoly", 10, "Nova", "docs/strategy/03-90-day-kill-shot.md §10",
             sigil="canvas-100-themes.sig.json"),
        # W11
        Item("Land emergence-ai.ai — the frontier, Luna's dominion",
             "L", "monopoly", 11, "Luna", "docs/strategy/03-90-day-kill-shot.md §11",
             sigil="emergence-launch.sig.json"),
        Item("Land substrate-ai.ai — the OS that snaps together like LEGO",
             "L", "monopoly", 11, "Atlas", "docs/strategy/03-90-day-kill-shot.md §11",
             sigil="substrate-launch.sig.json"),
        Item("Land ethisphere.ai — the ethics sphere, Marcus's dominion",
             "L", "monopoly", 11, "Marcus", "docs/strategy/03-90-day-kill-shot.md §11",
             sigil="ethisphere-launch.sig.json"),
        Item("Land sovereignvault.ai — sovereign key custody, MPC + Ed25519",
             "L", "monopoly", 11, "Zephyr", "docs/strategy/03-90-day-kill-shot.md §11",
             sigil="vault-launch.sig.json"),
        Item("Land sovereign-ai.ai — the umbrella, the search-engine anchor",
             "L", "monopoly", 11, "Rex", "docs/strategy/03-90-day-kill-shot.md §11",
             sigil="sovereign-ai-launch.sig.json"),
        # W12
        Item("Press release #4: 'CSOAI declares the Sovereign Substrate Monopoly'",
             "M", "monopoly", 12, "Nova", "docs/strategy/03-90-day-kill-shot.md §12",
             sigil="press-release-4.sig.json"),
        Item("HackerNews strike #4: 'Show HN: I built the sovereign-AI substrate in 90 days'",
             "M", "monopoly", 12, "Ember", "docs/strategy/03-90-day-kill-shot.md §12",
             sigil="hn-strike-4.sig.json"),
        Item("LinkedIn strike #2: '90 days, 28 domains, 12 queens, 1 monopoly'",
             "M", "monopoly", 12, "Sage", "docs/strategy/03-90-day-kill-shot.md §12",
             sigil="linkedin-strike-2.sig.json"),
        Item("22/33 BFT quorum deliberates: 'Shall the substrate be sealed?' — unanimous yes",
             "XL", "monopoly", 12, "Rex", "docs/strategy/03-90-day-kill-shot.md §12",
             sigil="monopoly-vote.sig.json"),
        Item("Monopoly declaration live at bft-council.ai/monopoly",
             "M", "monopoly", 12, "Aria", "docs/strategy/03-90-day-kill-shot.md §12",
             sigil="monopoly-declaration-final.sig.json"),
    ]


def items_series_a() -> List[Item]:
    """Series A narrative + due diligence + financial model."""
    return [
        Item("Convert pitch deck to PDF + distribute to 50 Tier-1 VC partners (a16z / Sequoia / Index / Accel / Benchmark / GV / Lightspeed / Founders Fund / Atomico / Balderton)",
             "XL", "series-a", None, "Nova", "docs/series-a/02-executive-onepager.md §NEXT",
             sigil="vc-distribution.sig.json"),
        Item("Schedule 25 first-meetings with Tier-1 VCs (warm intro + cold email blend)",
             "L", "series-a", None, "Rex", "docs/series-a/02-executive-onepager.md §NEXT",
             sigil="vc-meetings-25.sig.json"),
        Item("Build 18-slide Series A pitch deck (assembled from 06-return-scenarios.md)",
             "L", "series-a", None, "Nova", "docs/strategy/08-integration-roadmap.md W11",
             sigil="pitch-deck-18.sig.json"),
        Item("Founder story: solo UK founder → £174M empire (mythic voice narrative)",
             "M", "series-a", None, "Rex", "docs/strategy/08-integration-roadmap.md W11",
             sigil="founder-story.sig.json"),
        Item("100+ design partner case studies (Risk D3 mitigation: <10k users by Y2)",
             "XL", "series-a", None, "Ember", "docs/strategy/08-integration-roadmap.md W10",
             sigil="case-studies-100.sig.json"),
        Item("Trademark filings: US/EU/UK/CN for openpatent / sovereign / harvi / ipcastle / datamoat",
             "L", "series-a", None, "Marcus", "docs/strategy/08-integration-roadmap.md W10",
             sigil="tm-5-jurisdictions.sig.json"),
        Item("3 LOIs from named-queen IP law firms (LOCK 1 + LOCK 5 defence)",
             "L", "series-a", None, "Marcus", "docs/strategy/08-integration-roadmap.md W10",
             sigil="loi-ip-firms.sig.json"),
        Item("Open-source BFT council spec → sovereign-temple-bft-v3 arXiv paper",
             "L", "series-a", None, "Luna", "docs/strategy/08-integration-roadmap.md W9",
             sigil="arxiv-sovereign-temple.sig.json"),
        Item("Run 1,000 disclosures through full BFT council (latency / approval / care-veto metrics)",
             "L", "series-a", None, "Kai", "docs/strategy/08-integration-roadmap.md W9",
             sigil="bft-1k-disclosures.sig.json"),
        Item("C2PA COSE_Sign1 manifests — replace dict-based mock",
             "M", "series-a", None, "Luna", "docs/strategy/08-integration-roadmap.md W6",
             sigil="c2pa-cose-sign1.sig.json"),
        Item("Live opentimestamps submission (open VM egress + retry queue) — real alice.btc.calendar",
             "M", "series-a", None, "Luna", "docs/strategy/08-integration-roadmap.md W6",
             sigil="ots-live.sig.json"),
    ]


def items_audit() -> List[Item]:
    """Risk-register mitigations + audit-grade proof."""
    return [
        Item("Anguilla TLD-loss playbook: 30/90/180-day pivot to .sovereign-ai.xyz / .sovereign-ai.eth (ENS)",
             "L", "audit", None, "Rex", "docs/strategy/07-risk-register.md §A1",
             sigil="tld-pivot-playbook.sig.json", note="Risk A1 mitigation"),
        Item("UK FCDO + Anguilla Governor's Office relationship management (annual review)",
             "M", "audit", None, "Rex", "docs/strategy/07-risk-register.md §A1",
             sigil="fcdo-relationship.sig.json"),
        Item("5-year forward renewal reserve £50k for 28 .ai domains",
             "M", "audit", None, "Atlas", "docs/strategy/07-risk-register.md §A1",
             sigil="renewal-reserve.sig.json"),
        Item("Monthly WHOIS audit + >12-month expiry horizon for all 28 domains",
             "S", "audit", None, "Atlas", "docs/strategy/07-risk-register.md §A2",
             sigil="whois-audit.sig.json"),
        Item("Backup registrar relationship (Gandi + Namecheap) for emergency transfer",
             "S", "audit", None, "Atlas", "docs/strategy/07-risk-register.md §A2",
             sigil="backup-registrar.sig.json"),
        Item("Annual trademark search + UDRP defence playbook (£50k/dispute budget)",
             "M", "audit", None, "Marcus", "docs/strategy/07-risk-register.md §A3",
             sigil="tm-search-annual.sig.json"),
        Item("UK GDPR + EU GDPR dual-compliant DPA on every sovereign subscription tier",
             "M", "audit", None, "Aria", "docs/strategy/07-risk-register.md §B2",
             sigil="dpa-tier.sig.json"),
        Item("ICO (UK) + CNIL (EU) pre-engagement (compliance posture letter)",
             "S", "audit", None, "Aria", "docs/strategy/07-risk-register.md §B2",
             sigil="ico-cnil-letter.sig.json"),
        Item("Cyber insurance: £5M policy + £10M crypto-key policy (C3 + B2 mitigations)",
             "M", "audit", None, "Atlas", "docs/strategy/07-risk-register.md §B2/C3",
             sigil="cyber-insurance.sig.json"),
        Item("Multi-jurisdictional nameserver redundancy (3+ jurisdictions for 28 domains)",
             "L", "audit", None, "Rex", "docs/strategy/07-risk-register.md §B3",
             sigil="ns-redundancy.sig.json"),
        Item("Quarterly regulatory horizon scan + UK AI Safety Institute / EU AI Office engagement",
             "M", "audit", None, "Aria", "docs/strategy/07-risk-register.md §B1",
             sigil="regulatory-scan.sig.json"),
        Item("Hot-standby BFT agents in 3 regions (Risk C2 quorum hardening)",
             "XL", "audit", None, "Kai", "docs/strategy/07-risk-register.md §C2",
             sigil="bft-standby.sig.json"),
        Item("Weekly BFT dry-runs with deliberate failure injection (Risk C2 kill-criterion <2%)",
             "L", "audit", None, "Kai", "docs/strategy/07-risk-register.md §C2",
             sigil="bft-failure-injection.sig.json"),
        Item("Emergency single-agent mode with auto-promotion of 22nd agent (degraded but functional)",
             "M", "audit", None, "Kai", "docs/strategy/07-risk-register.md §C2",
             sigil="bft-single-agent.sig.json"),
        Item("2-of-3 maintainer review for all PatentMCP releases (Risk C4)",
             "M", "audit", None, "Luna", "docs/strategy/07-risk-register.md §C4",
             sigil="2of3-review.sig.json"),
        Item("Dependabot + automated security patches (Snyk / npm audit / pip-audit on every CI run)",
             "M", "audit", None, "Luna", "docs/strategy/07-risk-register.md §C4",
             sigil="dependabot.sig.json"),
        Item("24-hour disclosure + 7-day patch SLA incident-response playbook (Risk C4)",
             "M", "audit", None, "Luna", "docs/strategy/07-risk-register.md §C4",
             sigil="incident-playbook.sig.json"),
    ]


def items_fork() -> List[Item]:
    """Fork-doctrine: absorb OSS repos into the sovereign substrate."""
    return [
        Item("ASI-Evolve fork — self-improving AI, +18 MMLU, COAI wrap + BFT gate + open-patent",
             "XL", "fork", None, "Luna", "docs/fork-doctrine/01-asi-evolve-fork.md",
             sigil="fork-asi-evolve.sig.json"),
        Item("sia fork — scaffold + weight updates, 70.1% LawBench, sovereign alignment",
             "XL", "fork", None, "Luna", "docs/fork-doctrine/02-sia-fork.md",
             sigil="fork-sia.sig.json"),
        Item("hermes-agent fork — persistent memory agent (NousResearch/hermes-agent), COAI-wrap",
             "L", "fork", None, "Iris", "docs/fork-doctrine/03-hermes-agent-fork.md",
             sigil="fork-hermes.sig.json"),
        Item("openclaw fork — WhatsApp/Telegram/Discord agent (openclaw/openclaw), sovereign-grade",
             "L", "fork", None, "Zephyr", "docs/fork-doctrine/04-openclaw-fork.md",
             sigil="fork-openclaw.sig.json"),
    ]


def items_launch() -> List[Item]:
    """PR / HN / blog launch surface."""
    return [
        Item("5 press releases + submission script (PRLog + OpenPR free tier)",
             "M", "launch", 4, "Nova", "docs/strategy/08-integration-roadmap.md W4",
             sigil="pr-5-fired.sig.json"),
        Item("3 Dev.to blog posts (3K + 1.5K + 800 words: patentmcp build, mcp server tutorial, blockchain prior art)",
             "L", "launch", 4, "Sage", "docs/strategy/08-integration-roadmap.md W4",
             sigil="devto-3-posts.sig.json"),
        Item("7-tweet viral thread launch (Mon/Wed/Fri 10:00 UTC)",
             "M", "launch", 4, "Ember", "docs/strategy/08-integration-roadmap.md W4",
             sigil="tweet-thread-7.sig.json"),
        Item("Email outreach to 50 enterprise design partners (templated from launch docs)",
             "L", "launch", 4, "Aria", "docs/strategy/08-integration-roadmap.md W4",
             sigil="outreach-50.sig.json"),
    ]


def items_ops() -> List[Item]:
    """Day-to-day ops / devops that are not in any kill-shot week but still need doing."""
    return [
        Item("scripts/burndown.py — this file (sovereign burndown CLI)",
             "S", "ops", None, "Aria", "scripts/burndown.py",
             done=True, sigil="burndown-cli.sig.json", note="shipped in this sprint"),
        Item("scripts/parallel-dispatch.sh — fan out N parallel workstreams across connected providers",
             "S", "ops", None, "Aria", "scripts/parallel-dispatch.sh",
             done=True, sigil="parallel-dispatch.sig.json", note="shipped in this sprint"),
        Item("scripts/quality-gate.py — final 100/100 quality gate (E2E + metrics + audit + sigil + live + BFT + MCP)",
             "S", "ops", None, "Aria", "scripts/quality-gate.py",
             done=True, sigil="quality-gate-100.sig.json", note="shipped in this sprint"),
        Item("docs/EXECUTION-LOG.md — rolling execution log (auto-records each sprint)",
             "S", "ops", None, "Aria", "docs/EXECUTION-LOG.md",
             done=True, sigil="exec-log.sig.json", note="shipped in this sprint"),
        Item("scripts/disclose-on-export.sh — fs/inotify watcher daemon (cron-driven disclose-on-export)",
             "M", "ops", None, "River", "scripts/disclose-on-export.sh",
             sigil="export-watcher.sig.json", note="already shipped; consider audit pass"),
    ]


# ─────────────────────────────────────────────────────────────────────────────
# Existing-shipped detection (best-effort grep against scripts/)
# ─────────────────────────────────────────────────────────────────────────────

SHIPPED_PATTERNS = {
    # title_substring: regex
    "openpatent-mcp": r"openpatent-mcp",
    "sovereign-temple-bft-mcp": r"sovereign-temple-bft-mcp",
    "PatentMCP": r"patentmcp",
    "auto-disclose": r"auto-disclose",
    "cron-daemon": r"cron-daemon",
    "hive-bridge": r"hive-bridge",
    "audit": r"^audit\.py$",
}


def mark_shipped(items: List[Item]) -> List[Item]:
    """Best-effort: mark items as done if a script already implements them."""
    if not SCRIPTS.exists():
        return items
    existing = {p.name for p in SCRIPTS.iterdir() if p.is_file()}
    for item in items:
        title_lc = item.title.lower()
        # If title mentions a script we know is shipped, mark done
        for needle, script_match in SHIPPED_PATTERNS.items():
            if needle.lower() in title_lc:
                if isinstance(script_match, str) and script_match.startswith("^"):
                    if any(re.search(script_match, f) for f in existing):
                        item.done = True
                elif needle in " ".join(existing) or any(needle in f for f in existing):
                    item.done = True
    return items


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def collect_all() -> List[Item]:
    items: List[Item] = []
    items += items_sovereign()
    items += items_kill_shot()
    items += items_expansion()
    items += items_monopoly()
    items += items_series_a()
    items += items_audit()
    items += items_fork()
    items += items_launch()
    items += items_ops()
    return mark_shipped(items)


def sort_items(items: List[Item], by_leverage: bool) -> List[Item]:
    if by_leverage:
        return sorted(items, key=lambda i: (
            WORKSTREAM_PRIORITY.get(i.workstream, 99),
            EFFORT_ORDER.get(i.effort, 99),
            i.week if i.week is not None else 99,
            i.title.lower(),
        ))
    # Default: by effort (XS first), then workstream, then week
    return sorted(items, key=lambda i: (
        EFFECT_ORDER_KEY := EFFORT_ORDER.get(i.effort, 99),
        i.week if i.week is not None else 99,
        WORKSTREAM_PRIORITY.get(i.workstream, 99),
        i.title.lower(),
    ))


def format_table(items: List[Item]) -> str:
    lines = []
    lines.append("━" * 92)
    lines.append("  openpatent.ai hive — sovereign burndown")
    lines.append("  the 5 LOCKs · 33-agent BFT · 28 .ai domains · 12-week kill-shot")
    lines.append("━" * 92)
    lines.append("")
    # Group header
    lines.append(f"  {'#':<4}{'effort':<14}{'week':<6}{'workstream':<12}{'queen':<8} title")
    lines.append("  " + "─" * 88)

    counts = {"XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0}
    done_counts = {"XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0}
    total_min = 0
    done_min = 0

    for i, it in enumerate(items, 1):
        counts[it.effort] = counts.get(it.effort, 0) + 1
        total_min += it.minutes
        if it.done:
            done_counts[it.effort] = done_counts.get(it.effort, 0) + 1
            done_min += it.minutes
            marker = "✓"
        else:
            marker = " "
        week_str = f"W{it.week}" if it.week is not None else "  "
        queen = it.queen or "—"
        # Truncate title for the table
        title = it.title
        if len(title) > 70:
            title = title[:67] + "…"
        lines.append(f"  {i:<4}{marker}{EFFORT_LABEL[it.effort]:<13}{week_str:<6}{it.workstream:<12}{queen:<8} {title}")

    lines.append("  " + "─" * 88)
    lines.append("")
    lines.append("  BURNDOWN SUMMARY")
    lines.append(f"    total items:     {len(items)}")
    lines.append(f"    done:            {sum(done_counts.values())}")
    lines.append(f"    remaining:       {len(items) - sum(done_counts.values())}")
    lines.append("")
    lines.append("    by effort (remaining):")
    for e in ("XS", "S", "M", "L", "XL"):
        rem = counts[e] - done_counts[e]
        if counts[e]:
            lines.append(f"      {EFFORT_LABEL[e]}  {counts[e]:>3} total  ·  {done_counts[e]:>3} done  ·  {rem:>3} remaining")
    rem_min = total_min - done_min
    lines.append("")
    lines.append(f"    remaining effort: ~{rem_min // 60}h {rem_min % 60}m of focused sovereign work")
    lines.append("")
    lines.append("  " + SIG)
    lines.append("━" * 92)
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(
        prog="burndown.py",
        description="Sovereign burndown CLI for the openpatent.ai hive.",
    )
    ap.add_argument("--leverage", action="store_true",
                    help="Order by workstream leverage (sovereign → kill-shot → expansion → monopoly → series-a → audit → launch → fork → ops)")
    ap.add_argument("--week", type=int, default=None,
                    help="Filter to a single week (1-12) of the 90-day kill-shot")
    ap.add_argument("--workstream", type=str, default=None,
                    help="Filter to a workstream (sovereign | kill-shot | expansion | monopoly | series-a | audit | fork | launch | ops)")
    ap.add_argument("--remaining", action="store_true",
                    help="Show only not-done items")
    ap.add_argument("--done", action="store_true",
                    help="Show only done items")
    ap.add_argument("--json", action="store_true",
                    help="Machine-readable JSON output")
    args = ap.parse_args()

    items = collect_all()

    if args.week is not None:
        items = [i for i in items if i.week == args.week]
    if args.workstream:
        items = [i for i in items if i.workstream == args.workstream]
    if args.remaining:
        items = [i for i in items if not i.done]
    elif args.done:
        items = [i for i in items if i.done]

    items = sort_items(items, by_leverage=args.leverage)

    if args.json:
        print(json.dumps([asdict(i) for i in items], indent=2))
    else:
        print(format_table(items))

    return 0


if __name__ == "__main__":
    sys.exit(main())
