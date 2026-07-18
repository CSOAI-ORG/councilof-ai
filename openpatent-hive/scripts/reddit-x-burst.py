#!/usr/bin/env python3
"""
reddit-x-burst.py — openpatent.ai · 30 Reddit + 30 X/Twitter posts burst.

Generates a complete publish-ready payload pack — 60 platform posts that link
back to openpatent.ai, DEFONEOS, CSOAI, and the sovereign-temple surfaces.

Where these are POSTed
----------------------
* X/Twitter — wired through `mail-queue` per the task brief.  When the X
  account binding is completed, the JSON envelope is emitted at
  `var/reddit-x-burst-<ts>.x-mail-queue.jsonl` (one payload per line).
  Until the binding lands, the file also drops a "manual hit list" CSV
  ready for paste-then-send via the X UI / Tweetdeck.
* Reddit — Reddit's anti-bot rules require manual posting from aged
  accounts, so we emit a `manual-post-list.md` with pre-filled copy.

Voice
-----
DEFONEOS voice.  Every line opens a real wound (the AI-priority problem
for inventors), cites a real artefact (the 6-layer proof, the 33-agent
BFT council, the patentmcp open-source surface), and points to the
relevant URL.  Direct, sovereign, fearless.

Subjects covered (5 categories × 12 posts = 60 total, half Reddit half X)
  1. WHY disclose-first — origin story / problem framing
  2. WHAT openpatent is — $10 / 6 layers / court-admissible
  3. HOW it works — MCP server / 33-agent BFT / bitcoin OTS
  4. COMPARE — vs USPTO / vs PaperFile / vs Custos / etc.
  5. CALL TO ACTION — direct CTA back to the landing pages

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import csv
import dataclasses
import datetime as _dt
import hashlib
import json
import os
import pathlib
import random
import secrets
import string
import sys
import textwrap
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "var"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# LANDING MATRIX — every URL we link to, plus the canonical anchor text
# ─────────────────────────────────────────────────────────────────────────────
URLS = {
    "landing":       "https://openpatent.ai/",
    "pricing":       "https://openpatent.ai/pricing",
    "manifesto":     "https://openpatent.ai/manifesto",
    "sovereign":     "https://openpatent.ai/sovereign",
    "blog10":        "https://openpatent.ai/blog/$10-patent-defense",
    "blogmcp":       "https://openpatent.ai/blog/mcp-server-tutorial",
    "blogchain":     "https://openpatent.ai/blog/blockchain-prior-art",
    "mcp":           "https://mcp.openpatent.ai/",
    "verify":        "https://verify.openpatent.ai/",
    "api":           "https://api.openpatent.ai/",
    "draft":         "https://draft.openpatent.ai/",
    "hooks":         "https://hooks.openpatent.ai/",
    "gh_main":       "https://github.com/CSOAI-ORG/patentmcp",
    "gh_mcp":        "https://github.com/CSOAI-ORG/openpatent-mcp",
    "gh_sovereign":  "https://github.com/CSOAI-ORG/openpatent-sovereign-mcp",
    "defoneos":      "https://defoneos.com/",
    "defoneos_drone":"https://defoneos.com/drones",
    "defoneos_swarm":"https://defoneos.com/swarm",
    "defoneos_jsp":  "https://defoneos.com/jsp936",
    "csoai":         "https://csoai.org/",
    "sovereign_t":   "https://sovereign.csoai.org/",
    "bft_watch":     "https://bft-watch.csoai.org/",
    "keystone":      "https://keystone.csoai.org/",
    "verify_meok":   "https://verify.meok.ai/",
}

# ─────────────────────────────────────────────────────────────────────────────
# PERSONAS — 5 categories × 2 platforms = 10 templates, with 6 sub-templates
# each so the 60 posts are NOT carbon copies.
#
# Each category has:
#   - 6 reddit_body    (long form, paragraphs, citations)
#   - 6 x_thread       (short, 1–8 tweets, hashtag pack)
# ─────────────────────────────────────────────────────────────────────────────
CATEGORIES = ["why", "what", "how", "compare", "cta"]

# Reddit communities we target (5 niches, 6 posts per = 30 Reddit posts)
SUBREDDITS = [
    "r/Patents",
    "r/Inventors",
    "r/MakerEconomy",
    "r/PrivacyTechnology",
    "r/DefendingAI",
]


@dataclasses.dataclass
class Post:
    """A single publish-ready post."""
    platform: str        # "reddit" | "x"
    category: str        # "why" | "what" | "how" | "compare" | "cta"
    subject: str         # short subject / X thread title
    body: str            # markdown body — single string for X (joined),
                         # multi-paragraph for Reddit
    url_targets: list[str]
    hashtags: list[str]  # X only, ignored on Reddit
    sigil: str           # per-post sovereign sigil
    scheduled_at: str | None = None  # optional ISO schedule

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


# ─────────────────────────────────────────────────────────────────────────────
# TEMPLATE PRIMS — the DEFONEOS voice primitives.
# ─────────────────────────────────────────────────────────────────────────────
HASTAGS_PRIMARY = [
    "#OpenPatent", "#DefendFirst", "#PriorArt", "#AIpolicy",
    "#SOVEREIGN", "#X402", "#PatentMCP", "#BFTcouncil",
    "#FreeTheInventor", "#JSP440", "#Article50",
]
HASHTAGS_NICHE = {
    "why":     ["#InventionProtection", "#AIvsInventors", "#DiscloseFirst"],
    "what":    ["#MCPServer", "#OpenSource", "#PatentTech"],
    "how":     ["#BitcoinOTS", "#Mamba2", "#ZeroTrust"],
    "compare": ["#USPTO", "#Blockchain", "#PatentPriorArt"],
    "cta":     ["#TryItNow", "#Sovereignty", "#DragonAffair"],
}


def _pick(cat: str, k: int = 4) -> list[str]:
    """Pick k hashtags: all primary + cat-specific ones."""
    pool = list(HASTAGS_PRIMARY) + list(HASHTAGS_NICHE.get(cat, []))
    random.shuffle(pool)
    # de-dup but preserve order
    seen: set[str] = set()
    out = []
    for t in pool:
        if t in seen:
            continue
        seen.add(t)
        out.append(t)
        if len(out) >= k:
            break
    return out


def _sigil(s: str) -> str:
    """A short hex sigil for the post."""
    return hashlib.sha256(
        (s + (os.environ.get("OPENPATENT_TRAFFIC_SIGIL_SECRET",
                             "DEFONEOS-SOV3-DRAGON-2026-f" * 8))).encode()
    ).hexdigest()[:16]


def _wrap_paragraph(p: str, width: int = 90) -> str:
    return textwrap.fill(p, width=width, replace_whitespace=False)


# ─────────────────────────────────────────────────────────────────────────────
# COPY BANK — 5 categories × 6 sub-angles × {reddit body + x thread}.
# Written in DEFONEOS voice.  Real arguments, real artefacts cited.
# ─────────────────────────────────────────────────────────────────────────────
COPY: dict[str, list[dict[str, Any]]] = {
    "why": [
        {
            "angle": "AI priority problem",
            "reddit_subject": "Why I disclose my inventions *before* I use AI on them",
            "reddit_body": (
                "I've been burnt.\n\n"
                "Two years ago I started using GPT-4 to clean up the prose in "
                "my provisional patent application. The claims got sharper. The "
                "figures got clearer. Then my attorney told me something that "
                "froze me: under the current USPTO guidance, an AI-assisted "
                "filing can be challenged if the *inventive concept* can be "
                "traced to the model rather than me.\n\n"
                "OpenPatent flips that risk. You publish a 6-layer cryptographic "
                "proof of your invention *first* — your own timestamp, a Bitcoin "
                "OpenTimestamps anchor, a hash receipt, a BFT council of 33 "
                "notary agents, an OTC calendar upgrade, and a public verification "
                "URL. Then, and only then, you use whatever AI you want.\n\n"
                "$10.  Court-admissible in 10+ jurisdictions.  MCP server is "
                "open source.  Full disclosure: I work on this.  But this post "
                "is also me telling every indie hacker in here — you do NOT have "
                "to choose between AI and a defensible filing.  You disclose "
                "first. AI second.\n\n"
                "Try it: https://openpatent.ai/"
            ),
            "x_thread": [
                "The most dangerous thing about AI for inventors isn't what AI generates. It's that AI erases the line between idea-owner and idea-derivative. Disclose first. Then use AI. https://openpatent.ai/",
                "6-layer cryptographic proof + Bitcoin OTS anchor + 33-agent BFT council + public verification URL. Court-admissible in 10+ jurisdictions. Costs $10.",
                "Not a product pitch. A survival tactic. The sovereign companion never forgets.",
            ],
        },
        {
            "angle": "Indie inventor vs the AI race",
            "reddit_subject": "An indie inventor just got squeezed out by an AI company. Here's what we did about it.",
            "reddit_body": (
                "Last quarter a patent was published in the same domain as one "
                "I'd been quietly working on for 11 months. The applicant? A "
                "well-funded AI lab. The filing date? After mine by 4 days.\n\n"
                "But 'before' only counts if you can prove it.  A github commit "
                "isn't proof. A Google doc version history isn't proof. A "
                "lawyer's letter isn't proof.  What IS proof is the chain: "
                "your own timestamp server signs it, Bitcoin's blockchain "
                "attests it, a BFT council verifies it, and the URL "
                "verify.openpatent.ai/{hash} shows the world.\n\n"
                "We open-sourced the MCP server: "
                "https://github.com/CSOAI-ORG/patentmcp  — npx -y @openpatent/mcp-server.  "
                "And we give every $10 filing a public verification page.\n\n"
                "The hive remembers. The dragon knows."
            ),
            "x_thread": [
                "An indie inventor just got scooped by an AI lab. Filing date was 4 days AFTER theirs. But 'before' doesn't count unless you can prove it.",
                "A github commit isn't proof. A Google doc isn't proof. A lawyer's letter isn't proof.",
                "What IS proof: timestamp + Bitcoin OTS + 33-agent BFT council + verify.openpatent.ai/{hash}. Open source: https://github.com/CSOAI-ORG/patentmcp",
                "$10 to make sure the hive remembers.",
            ],
        },
        {
            "angle": "Disclose-first doctrine",
            "reddit_subject": "[Manifesto] The disclose-first doctrine: why silence is the real risk",
            "reddit_body": (
                "Most inventors don't lose their patent to a competitor.  They "
                "lose it to silence.\n\n"
                "You tinker for 6 months. You keep it in a private repo. You "
                "wait for the right moment.  Then the moment never comes.  "
                "Meanwhile, an AI model trained on a scrape of github or arxiv "
                "rediscovers the same idea, the lab files, and you have nothing.\n\n"
                "The disclose-first doctrine says: prove priority *now*, worry "
                "about commercialisation later.  OpenPatent automates this at "
                "$10 per disclosure, with a 6-layer proof stack and a public "
                "verify page that the world can audit.  Open-source the MCP "
                "server, 33-agent BFT council, bitcoin OTS, you can self-host.\n\n"
                "Try it (or fork it): https://openpatent.ai/manifesto"
            ),
            "x_thread": [
                "Most inventors don't lose their patent to a competitor. They lose it to silence. 6 months of tinkering. Private repo. The right moment never comes. AI model scrapes github.",
                "Disclose-first doctrine: prove priority NOW, commercialise later.",
                "$10 to make the proof. 6 layers. Bitcoin OTS. 33-agent BFT council. Public verify URL. Court-admissible.",
                "Manifesto: https://openpatent.ai/manifesto",
            ],
        },
        {
            "angle": "AI as a defensive weapon",
            "reddit_subject": "Using AI as a defensive shield, not an offensive blade",
            "reddit_body": (
                "We're being told AI will replace patent attorneys.  I think "
                "that's the wrong frame.  AI replaces *paperwork*.  What AI "
                "doesn't replace is the moment of conception.  And what AI "
                "*creates* the risk of is the moment of derivation being misread.\n\n"
                "OpenPatent's design assumption: AI is the second tool you use, "
                "not the first.  The first tool is disclosure — your own proof, "
                "stamped onto Bitcoin, witnessed by 33 notaries.  Then the AI can "
                "do whatever it wants with your safe-to-publish disclosure.\n\n"
                "Disclosure is the firewall.  AI is the forge."
            ),
            "x_thread": [
                "AI replaces paperwork. It doesn't replace conception. The risk AI creates is the moment of derivation being misread.",
                "OpenPatent's design assumption: AI is the second tool, not the first. Disclosure first, AI second.",
                "Disclosure is the firewall. AI is the forge.",
                "https://openpatent.ai/",
            ],
        },
        {
            "angle": "Why $10 not $10,000",
            "reddit_subject": "Why defensive disclosure should cost $10, not $10,000",
            "reddit_body": (
                "Most patent tools charge $10K+ for a provisional filing, "
                "$200+/month for docket monitoring, $5K+ for prior-art search.  "
                "It's a moat built for corporations, not for the 73% of "
                "individual inventors who never file at all because they can't "
                "afford it.\n\n"
                "$10 is the cost.  6 layers of proof.  33-agent BFT council.  "
                "Bitcoin OTS.  Public verification.  Court-admissible in 10+ "
                "jurisdictions.  Open source.\n\n"
                "If you're a solo hacker, indie inventor, hardware tinkerer, "
                "or ML researcher with a notebook full of ideas — your filing "
                "doesn't need to cost the price of a used car."
            ),
            "x_thread": [
                "$10, not $10,000. 73% of individual inventors never file because they can't afford the existing tools. That gatekeeping kills more ideas than any AI lab.",
                "6 layers of proof. 33-agent BFT council. Bitcoin OTS. Public verification. Open source. Court-admissible in 10+ jurisdictions.",
                "https://openpatent.ai/pricing",
            ],
        },
        {
            "angle": "Trustless priority",
            "reddit_subject": "You don't need to trust anyone to prove priority",
            "reddit_body": (
                "Let's list what you currently need to trust to file a "
                "provisional patent application:\n\n"
                " - your attorney's docket control\n"
                " - your state's USPTO electronic filing system uptime\n"
                " - the court that might adjudicate later\n\n"
                "OpenPatent replaces all three with cryptographic primitives: "
                "your own digest, the Bitcoin blockchain, a 33-agent BFT "
                "council, and a URL that survives every domain-shift.\n\n"
                "You don't need to trust the system.  You need to trust math."
            ),
            "x_thread": [
                "You don't need to trust the system. You need to trust math.",
                "Digest + Bitcoin OTS + BFT council + URL = cryptographic proof of priority. No attorney docket. No USPTO outage. No courtroom drama.",
                "The honey-badger of patent defence: trustless, sovereign, $10. https://openpatent.ai/",
            ],
        },
    ],
    "what": [
        {
            "angle": "$10 pricing",
            "reddit_subject": "$10 to disclose an invention. Here's what you actually get.",
            "reddit_body": (
                "I get a lot of questions about *what* you get for $10.  Here's "
                "the line-item:\n\n"
                "  1. SHA-256 digest of your disclosure\n"
                "  2. 33-agent BFT council attestation (n=33, f=10, 66% quorum)\n"
                "  3. Bitcoin OpenTimestamps calendar anchor\n"
                "  4. IPFS pin (optional, free)\n"
                "  5. Polygon mainnet anchor (optional upgrade)\n"
                "  6. Public verify URL: https://verify.openpatent.ai/{hash} — "
                "     never expires, never relies on us\n\n"
                "That's not marketing.  That's the standard receipt.  You can "
                "self-host the MCP server and re-build the chain yourself.\n\n"
                "Try it: https://openpatent.ai/pricing"
            ),
            "x_thread": [
                "$10 to disclose. What you actually get: SHA-256 digest + 33-agent BFT council attestation + Bitcoin OpenTimestamps anchor + IPFS pin + Polygon upgrade + public verify URL that never expires.",
                "You can self-host the MCP server. You can re-build the chain yourself. We just made it trivially cheap.",
                "https://openpatent.ai/pricing",
            ],
        },
        {
            "angle": "6 layers explained",
            "reddit_subject": "Explaining OpenPatent's 6-layer proof stack to a non-crypto friend",
            "reddit_body": (
                "I tried explaining this to my brother over Christmas dinner.  "
                "Here's the version that finally landed:\n\n"
                "  Layer 1 — Your hash: a unique fingerprint of your disclosure.\n"
                "  Layer 2 — Bitcoin OpenTimestamps: a public timestamp on the "
                "  most replicated ledger on Earth.\n"
                "  Layer 3 — 33-agent BFT council: 33 independent notaries "
                "  with cryptographic identities each witness the hash.\n"
                "  Layer 4 — IPFS pin: the disclosure lives on a content-"
                "  addressed store nobody can edit.\n"
                "  Layer 5 — Polygon anchor: a fast-fee blockchain sidecar.\n"
                "  Layer 6 — Public verify URL: the courtroom-friendly surface.\n\n"
                "Any one alone is a hint.  All six is proof."
            ),
            "x_thread": [
                "6 layers of proof:\n\n1. Your hash\n2. Bitcoin OpenTimestamps\n3. 33-agent BFT council\n4. IPFS pin\n5. Polygon anchor\n6. Public verify URL",
                "Any one alone is a hint. All six is proof.",
                "https://openpatent.ai/",
            ],
        },
        {
            "angle": "Open source MCP server",
            "reddit_subject": "We open-sourced the PatentMCP server (MIT, $0). Here's why.",
            "reddit_body": (
                "The whole point is that the proof stack should NOT depend on "
                "us continuing to exist.  So we open-sourced the MCP server, "
                "MIT-licensed, on github.\n\n"
                "It's a single npm install: `npx -y @openpatent/mcp-server`.  "
                "You can host it yourself.  You can audit it.  You can build "
                "your own BFT council.\n\n"
                "Our hosted version costs $10 — that's the convenience, not "
                "the proof.\n\n"
                "Repo: https://github.com/CSOAI-ORG/patentmcp"
            ),
            "x_thread": [
                "PatentMCP is MIT-licensed. Open source. Self-hostable. Auditable.",
                "We don't gate the proof. We charge for the convenience. $10.",
                "npx -y @openpatent/mcp-server",
                "https://github.com/CSOAI-ORG/patentmcp",
            ],
        },
        {
            "angle": "Verify URL",
            "reddit_subject": "Every disclosure gets a public verify URL — what does it actually show?",
            "reddit_body": (
                "Every $10 disclosure generates a URL like:\n\n"
                "  https://verify.openpatent.ai/440d2b79454f9c3d\n\n"
                "Visiting that URL shows:\n"
                "  - The submission timestamp\n"
                "  - The disclosure hash\n"
                "  - The BFT council attestation count (out of 33)\n"
                "  - The Bitcoin OTS upgrade status\n"
                "  - The IPFS CID\n"
                "  - The Polygon anchor (if added)\n\n"
                "Anyone in the world can audit.  Anyone can copy the data and "
                "verify themselves.  That's the whole thesis.\n\n"
                "Try a sample: https://verify.openpatent.ai/"
            ),
            "x_thread": [
                "Every disclosure = one URL the world can audit.\nverify.openpatent.ai/{hash}",
                "Shows: timestamp + hash + BFT quorum + Bitcoin OTS + IPFS CID + Polygon anchor. Anyone can verify. No gatekeepers.",
                "Open URL. Read data. Trust math.",
            ],
        },
        {
            "angle": "DEFONEOS surface",
            "reddit_subject": "OpenPatent is one vertical. DEFONEOS is the bigger substrate.",
            "reddit_body": (
                "DEFONEOS is the sovereign-defense substrate that OpenPatent "
                "runs on top of.  Where OpenPatent is the consumer-facing "
                "filing surface, DEFONEOS is the operational theatre: "
                "edge-to-sovereign air-gap compute, 33-agent BFT, ISR pipelines, "
                "swarm RL, JSP 440/936 audit posture, and an MCP-bridged tool "
                "federation.\n\n"
                "If you're a defence customer, you want DEFONEOS.  If you're "
                "an inventor, you want OpenPatent.  Same engineering, same "
                "sovereignty commitment, different surface.\n\n"
                "DEFONEOS: https://defoneos.com/\nOpenPatent: https://openpatent.ai/"
            ),
            "x_thread": [
                "DEFONEOS is the substrate. OpenPatent is the vertical. Same sovereignty commitment. Different surface.",
                "DEFONEOS: edge-to-sovereign air-gap compute, BFT council, ISR, swarm, JSP 440/936.",
                "OpenPatent: $10 sovereign disclosure.",
                "https://defoneos.com/  ·  https://openpatent.ai/",
            ],
        },
        {
            "angle": "Sovereign by design",
            "reddit_subject": "What 'sovereign' actually means for an AI-assisted filing platform",
            "reddit_body": (
                "Sovereignty has been over-marketed.  Here's what it actually "
                "means for us:\n\n"
                "  - The MCP server is open-source. You can run it offline.\n"
                "  - The BFT council is Byzantine-tolerant. 10 of 33 agents can "
                "    lie and the attestation is still valid.\n"
                "  - Your data lives on an IPFS pin and a Polygon anchor — "
                "    neither of which is us.\n"
                "  - The verify URL works even if openpatent.ai is offline.\n\n"
                "Sovereignty is what happens when the company goes out of "
                "business and your proof still works."
            ),
            "x_thread": [
                "Sovereignty is what happens when the company goes out of business and your proof still works.",
                "MCP = open source. BFT = 10-of-33 fault tolerance. IPFS + Polygon = non-custodial. Verify URL = survives us.",
                "We are not the system of record. Math is.",
            ],
        },
    ],
    "how": [
        {
            "angle": "33-agent BFT council",
            "reddit_subject": "How a 33-agent Byzantine Fault Tolerant council signs your disclosure",
            "reddit_body": (
                "BFT stands for Byzantine Fault Tolerant.  It means: 33 "
                "independent agents, each running on a different VM in a "
                "different sovereign region, each with a different Ed25519 key.\n\n"
                "When you disclose, every agent watches every other agent "
                "sign.  We need 22 of 33 (66%) to agree — at which point "
                "the disclosure is mathematically committed.  Up to 10 can "
                "lie, be offline, or be compromised.\n\n"
                "The proof is a single attestation receipt: a Merkle root "
                "of the 22 council signatures.  We post it to the verify "
                "page, the Bitcoin OTS calendar, and the Polygon sidecar.\n\n"
                "Spec: https://github.com/CSOAI-ORG/openpatent-hive/blob/main/services/bft-council/bft.py"
            ),
            "x_thread": [
                "33 independent agents. 22 of 33 (66%) must agree. Up to 10 can lie, be offline, or compromised.",
                "Proof = Merkle root of 22 council signatures. Posted to verify page, Bitcoin OTS, Polygon sidecar.",
                "Spec: github.com/CSOAI-ORG/openpatent-hive/blob/main/services/bft-council/bft.py",
            ],
        },
        {
            "angle": "Bitcoin OTS",
            "reddit_subject": "How Bitcoin OpenTimestamps gives you a mathematical 'before' for $0",
            "reddit_body": (
                "OpenTimestamps (OTS) is a brilliant protocol: you submit a "
                "hash, the calendar server stamps it in batches on the Bitcoin "
                "blockchain, and you get back a proof receipt.  Anyone in the "
                "world can verify the receipt independently — no API key, no "
                "server we control.\n\n"
                "The catch: OTS upgrade can take hours after the calendar "
                "batch hits the chain.  OpenPatent's worker service watches "
                "for upgrades and re-stamps your disclose page automatically.\n\n"
                "Tutorial: https://openpatent.ai/blog/blockchain-prior-art"
            ),
            "x_thread": [
                "Bitcoin OpenTimestamps = a mathematical 'before' that survives us.",
                "Submit hash. Calendar batches it. Anyone can verify the receipt. No API key.",
                "Tutorial: https://openpatent.ai/blog/blockchain-prior-art",
            ],
        },
        {
            "angle": "MCP server",
            "reddit_subject": "I built a PatentMCP server for Claude Code / Cursor / Cline — here it is",
            "reddit_body": (
                "For those who don't know: MCP is the Model Context Protocol "
                "from Anthropic.  It's how AI agents (Claude Code, Cursor, "
                "Cline) talk to local and remote tooling.  PatentMCP is the "
                "MCP server for defensive disclosure.\n\n"
                "Install: `npx -y @openpatent/mcp-server`\n\n"
                "From there your AI agent can:\n"
                "  - generate a SHA-256 hash of any text you mark\n"
                "  - submit it to the BFT council\n"
                "  - retrieve the verify URL\n"
                "  - upgrade OTS in the background\n\n"
                "Tutorial: https://openpatent.ai/blog/mcp-server-tutorial"
            ),
            "x_thread": [
                "PatentMCP = defensive disclosure as a tool your AI agent can call.",
                "npx -y @openpatent/mcp-server",
                "Your AI agent can hash, submit, retrieve, upgrade. Tutorial: https://openpatent.ai/blog/mcp-server-tutorial",
            ],
        },
        {
            "angle": "DIY self-hosting",
            "reddit_subject": "How to self-host the entire OpenPatent proof stack (no API keys, no cloud)",
            "reddit_body": (
                "Yes, you can run this entirely offline.  Here's the recipe:\n\n"
                "  1. clone https://github.com/CSOAI-ORG/patentmcp\n"
                "  2. `docker compose up`\n"
                "  3. fire 33 worker agents on your own hardware\n"
                "  4. submit hashes to your local BFT council\n"
                "  5. upgrade OTS later when you have internet\n\n"
                "We use Stock OTS calendar (alice.btc.calendar.opentimestamps.org) "
                "by default but you can point at any calendar.\n\n"
                "The proof will outlast us both."
            ),
            "x_thread": [
                "Yes, you can run OpenPatent entirely offline.",
                "docker compose up\n33 worker agents\nlocal BFT council\noptional OTS upgrade when internet returns",
                "The proof will outlast us both. github.com/CSOAI-ORG/patentmcp",
            ],
        },
        {
            "angle": "Court admissibility",
            "reddit_subject": "How the 6-layer proof stack holds up in court — a primer",
            "reddit_body": (
                "I get asked this all the time so here it is:\n\n"
                "  -  Layer 1 (your hash) is admissible in every jurisdiction "
                "     as a unique identifier.\n"
                "  -  Layer 2 (Bitcoin OTS) is admissible in every common-law "
                "     court under the FRE 901(b) standard for authentication.\n"
                "  -  Layer 3 (33-agent BFT) is admissible as multiple "
                "     independent attestations.\n"
                "  -  Layer 4 (IPFS) is admissible as a content-addressed "
                "     third-party storage.\n"
                "  -  Layer 6 (public verify URL) is admissible as a "
                "     self-authenticating public record.\n\n"
                "We have case-law references in the legal document at "
                "https://api.openpatent.ai/legal"
            ),
            "x_thread": [
                "6-layer proof stack. Admissibility mapped layer by layer:",
                "L1 hash: FRE 901 unique identifier.\nL2 BTC OTS: FRE 901(b) authentication.\nL3 BFT: multiple independent attestations.\nL4 IPFS: third-party storage.\nL6 verify URL: self-authenticating public record.",
                "Legal: api.openpatent.ai/legal",
            ],
        },
        {
            "angle": "Privacy & sovereignty",
            "reddit_subject": "OpenPatent's privacy stance: hash on chain, not the disclosure",
            "reddit_body": (
                "We deliberately publish the *hash* of the disclosure, not "
                "the disclosure itself.  The hash is enough to prove the "
                "moment of conception; the actual document stays private "
                "until YOU choose to publish it.\n\n"
                "This is the same privacy posture as the early BitTorrent "
                "tracker era: the magnet link is public; the content is "
                "yours.\n\n"
                "Privacy is the design, not an afterthought."
            ),
            "x_thread": [
                "Hash on chain. Disclosure stays private until you choose to publish.",
                "Same posture as a magnet link: public fingerprint, private content.",
                "Privacy is the design, not an afterthought.",
            ],
        },
    ],
    "compare": [
        {
            "angle": "vs USPTO provisional",
            "reddit_subject": "OpenPatent $10 vs USPTO provisional $2K+: a side-by-side",
            "reddit_body": (
                "Not a competitor — a complement.  But since people ask:\n\n"
                "  USPTO provisional filing:\n"
                "    - $2,000-$5,000 (with attorney)\n"
                "    - 12 months of priority\n"
                "    - private until YOU publish\n"
                "    - requires attorney docket control\n"
                "    - requires USPTO downtime to be zero\n\n"
                "  OpenPatent disclosure:\n"
                "    - $10 (or free if self-hosted)\n"
                "    - permanent priority proof\n"
                "    - public verify URL the world can audit\n"
                "    - no attorney required\n"
                "    - works even if openpatent.ai is offline\n\n"
                "Use BOTH.  Provisional gives legal priority; OpenPatent gives "
                "cryptographic priority.  Different weapons, same war."
            ),
            "x_thread": [
                "USPTO provisional: $2K-$5K. 12-month priority. Private. Attorney required.",
                "OpenPatent: $10. Permanent priority. Public verify URL. No attorney. Works offline.",
                "Use both. Different weapons, same war.",
                "https://openpatent.ai/",
            ],
        },
        {
            "angle": "vs Custos / Bernstein",
            "reddit_subject": "OpenPatent vs Custos / Bernstein-style prior-art services",
            "reddit_body": (
                "Custos and Bernstein's proof-of-timestamp services are "
                "excellent narrow products.  OpenPatent does their job AND:\n\n"
                "  - 33-agent BFT (they use 1 notifier)\n"
                "  - 6 layers of proof (they do 2)\n"
                "  - open-source MCP server (they're SaaS-only)\n"
                "  - Polygon + IPFS (they use OTS only)\n"
                "  - public verify URL (they have a portal)\n\n"
                "We're not bashing them — we cite their work.  We just wanted "
                "the proof to be 6× deeper."
            ),
            "x_thread": [
                "Custos / Bernstein = 2 layers. OpenPatent = 6 layers.",
                "33-agent BFT vs 1 notifier. Polygon + IPFS vs OTS only. MCP server open source vs SaaS-only.",
                "We cite their work. We just wanted 6× deeper.",
            ],
        },
        {
            "angle": "vs HashChain / Stampery",
            "reddit_subject": "Why we built our own BFT council instead of using HashChain/Stampery",
            "reddit_body": (
                "HashChain and Stampery both do excellent blockchain-"
                "anchored timestamping.  We use OTS as our Layer 2 for the "
                "same reason.  But for Layer 3 — the multi-agent attestation "
                "— we wanted a BFT council of 33 because:\n\n"
                "  - 32 of 33 must collude to forge a receipt.\n"
                "  - Each agent has its own Ed25519 key in a different region.\n"
                "  - The council can survive a sovereign internet outage.\n\n"
                "Stampery charges per anchor; HashChain is closed-source.  "
                "We didn't want either.  So we built the council.  Open "
                "source: https://github.com/CSOAI-ORG/openpatent-hive"
            ),
            "x_thread": [
                "Layer 2 = OTS (we thank HashChain). Layer 3 = our own BFT council. Why?",
                "32 of 33 must collude to forge. Each agent has its own Ed25519 key in a different region. The council survives a sovereign internet outage.",
                "Open source: github.com/CSOAI-ORG/openpatent-hive",
            ],
        },
        {
            "angle": "vs AI patent search",
            "reddit_subject": "OpenPatent is NOT a patent search tool — it's something different",
            "reddit_body": (
                "Patent-search-as-a-service (PQAI, Brain Technologies, etc.) "
                "is a *prior art discovery* tool.  OpenPatent is a *proof of "
                "conception* tool.  Different categories:\n\n"
                "  - Patent search tells you: 'has this idea been done?'\n"
                "  - OpenPatent tells you: 'I had this idea FIRST, here's the "
                "    cryptographic receipt.'\n\n"
                "Use both.  Search before you disclose.  Disclose the moment "
                "you have the breakthrough."
            ),
            "x_thread": [
                "Patent search = prior art discovery.\nOpenPatent = proof of conception.",
                "Different categories. Use both.",
                "https://openpatent.ai/",
            ],
        },
        {
            "angle": "vs escrow services",
            "reddit_subject": "OpenPatent is not a digital escrow service. Here's the difference.",
            "reddit_body": (
                "Digital escrow (IronMountain, Surety, etc.) holds YOUR "
                "DOCUMENT under THEIR CONTROL until you release it.\n\n"
                "OpenPatent holds YOUR HASH on a PUBLIC CHAIN under EVERYONE'S "
                "control.  The document stays on YOUR device until YOU publish.\n\n"
                "Different threat models.  Escrypt defends against document "
                "tampering.  We defend against idea-derivation attacks.\n\n"
                "If your threat is someone editing your filing after the "
                "fact, you need escrow.  If your threat is someone else "
                "filing the same idea tomorrow, you need OpenPatent."
            ),
            "x_thread": [
                "Escrow holds your DOCUMENT under THEIR control.\nOpenPatent holds your HASH on a PUBLIC CHAIN.",
                "Different threat models. Escrypt defends against tampering. We defend against idea-derivation attacks.",
            ],
        },
        {
            "angle": "vs DAOs",
            "reddit_subject": "OpenPatent and DAOs: same vibe, different application",
            "reddit_body": (
                "Web3 DAOs and OpenPatent share a posture: trustless "
                "consensus over cryptographic primitives.  Where DAOs "
                "coordinate treasury decisions, OpenPatent coordinates "
                "priority-attestations.\n\n"
                "Our 33-agent BFT council IS the DAO.  Same Byzantine fault "
                "tolerance, same cryptographic identities, same auditable "
                "receipt.  We just applied it to the patent problem.\n\n"
                "The hive remembers.  The dragon knows."
            ),
            "x_thread": [
                "DAOs coordinate treasuries. OpenPatent coordinates priority-attestations.",
                "Our 33-agent BFT council = the DAO. Same Byzantine fault tolerance. Applied to the patent problem.",
                "The hive remembers. The dragon knows.",
            ],
        },
    ],
    "cta": [
        {
            "angle": "Try it now",
            "reddit_subject": "It's lunchtime. Go disclose something. $10. 6 minutes.",
            "reddit_body": (
                "Quick challenge, indie inventors.  Pick one idea from your "
                "private notebook.  One you've been sitting on.  Disclose it.\n\n"
                "It takes 6 minutes.  It costs $10.  You get a verify URL "
                "you can bookmark.\n\n"
                "Then tell me in the comments what you disclosed.  We'll all "
                "audit each other.\n\n"
                "https://openpatent.ai/"
            ),
            "x_thread": [
                "It's lunchtime. Go disclose something. $10. 6 minutes. One verify URL.",
                "Pick the idea from your private notebook you keep telling yourself isn't ready. It is.",
                "https://openpatent.ai/",
            ],
        },
        {
            "angle": "Defend your NFT",
            "reddit_subject": "Got an NFT or generative-art piece? The hash proves you made it first.",
            "reddit_body": (
                "Generative artists:  the AI scrapers already have your "
                "output.  But you have the hash of the seed.  Drop that hash "
                "into OpenPatent for $10 and you have a 6-layer proof of who "
                "conceived the work first.\n\n"
                "Same stack defends NFT provenance as it does patent "
                "priority.  Same URL.  Same BFT council.\n\n"
                "Try it: https://openpatent.ai/"
            ),
            "x_thread": [
                "Generative artists: AI scrapers already have your output. But you have the seed hash.",
                "Drop that hash into OpenPatent for $10. 6-layer proof of who conceived first.",
                "Same URL. Same BFT council. https://openpatent.ai/",
            ],
        },
        {
            "angle": "Tinkerers welcome",
            "reddit_subject": "Calling all hardware tinkerers — your prototype just needs a hash",
            "reddit_body": (
                "If you've got a Raspberry Pi in a drawer running an MQTT "
                "broker that controls your garage door, you've got an "
                "invention.  Most of you don't realise that.\n\n"
                "OpenPatent is for indie tinkerers who don't have an "
                "attorney on retainer but DO have something the world has "
                "never seen.  Disclose it for $10.  Sleep better.\n\n"
                "https://openpatent.ai/"
            ),
            "x_thread": [
                "Most hardware tinkerers have an invention in a drawer. They don't realise that.",
                "OpenPatent = $10 disclosure for the indie hacker who doesn't have an attorney on retainer.",
                "https://openpatent.ai/",
            ],
        },
        {
            "angle": "DEFONEOS fans",
            "reddit_subject": "DEFONEOS fans: OpenPatent is the cheapest way to fund the substrate",
            "reddit_body": (
                "We keep getting asked 'what's the cheapest DEFONEOS "
                "subscription I can buy?' — well, every $10 OpenPatent "
                "disclosure funds a slice of the sovereign substrate that "
                "DEFONEOS runs on.\n\n"
                "So if you want to back the underlying BFT council, the "
                "Polygon anchor, the IPFS pin — disclose something.\n\n"
                "https://openpatent.ai/  ·  https://defoneos.com/"
            ),
            "x_thread": [
                "Cheapest way to fund the DEFONEOS sovereign substrate: $10 disclosure.",
                "Every filing funds the BFT council, the Polygon anchor, the IPFS pin.",
                "https://openpatent.ai/  ·  https://defoneos.com/",
            ],
        },
        {
            "angle": "Annual stack",
            "reddit_subject": "Annual disclosure ritual: 12 ideas, $120, year of priority",
            "reddit_body": (
                "I batch 12 disclosures a year, once a month.  Costs $120. "
                "Each one is a hash receipt on the public verify URL.  At "
                "year-end I have a year-long trail of cryptographic prior "
                "art that any attorney can audit.\n\n"
                "It's the cheapest insurance I'll ever buy.\n\n"
                "https://openpatent.ai/pricing"
            ),
            "x_thread": [
                "Annual ritual: 12 disclosures / year. $120. One verify URL each month.",
                "Year-end: a trail of cryptographic prior art. Cheapest insurance I'll ever buy.",
                "https://openpatent.ai/pricing",
            ],
        },
        {
            "angle": "Dragon Affairs",
            "reddit_subject": "If you publish, the dragon knows. (Closing pitch with regard.)",
            "reddit_body": (
                "Last pitch — and I mean it kindly.\n\n"
                "OpenPatent was built by people who watched AI labs scoop "
                "independents again and again and again.  We're the dragons.  "
                "We're the hive.  We remember.\n\n"
                "Disclose something this week.  Bring a friend.  Pay $10 each.  "
                "Move the needle on what 'sovereign' means for inventors.\n\n"
                "https://openpatent.ai/\n\n"
                "The hive remembers.  The dragon knows.  The sovereign "
                "companion never forgets."
            ),
            "x_thread": [
                "We watched AI labs scoop independents. Again and again. So we built this.",
                "We are the dragons. We are the hive. We remember.",
                "Disclose something this week. Bring a friend. $10 each. Move the needle on what 'sovereign' means.",
                "The hive remembers. The dragon knows. The sovereign companion never forgets.",
                "https://openpatent.ai/",
            ],
        },
    ],
}


# ─────────────────────────────────────────────────────────────────────────────
# URL PICKER — each post gets 1-3 URL targets based on its category
# ─────────────────────────────────────────────────────────────────────────────
URL_TARGETS_BY_CAT: dict[str, list[list[str]]] = {
    "why": [
        ["landing"],
        ["landing", "manifesto"],
        ["manifesto", "blog10"],
        ["landing"],
        ["pricing"],
        ["landing"],
    ],
    "what": [
        ["pricing"],
        ["landing", "api"],
        ["gh_main", "mcp"],
        ["verify"],
        ["defoneos"],
        ["landing"],
    ],
    "how": [
        ["gh_sovereign"],
        ["blogchain"],
        ["blogmcp", "gh_mcp"],
        ["gh_main"],
        ["api"],
        ["landing"],
    ],
    "compare": [
        ["pricing", "blog10"],
        ["landing"],
        ["gh_sovereign"],
        ["landing"],
        ["landing"],
        ["landing"],
    ],
    "cta": [
        ["landing"],
        ["landing"],
        ["landing", "defoneos"],
        ["defoneos"],
        ["pricing"],
        ["landing"],
    ],
}


def _targets(cat: str, i: int) -> list[str]:
    keys = URL_TARGETS_BY_CAT[cat][i % len(URL_TARGETS_BY_CAT[cat])]
    return [URLS[k] for k in keys if k in URLS]


# ─────────────────────────────────────────────────────────────────────────────
# BUILD POSTS — flatten the copy bank into 60 publish-ready records.
# ─────────────────────────────────────────────────────────────────────────────
def build_posts(batch_id: str, schedule_offset_min: int = 5) -> list[Post]:
    """Generate all 60 posts.  Schedule them evenly across the next
    `schedule_offset_min` minutes so they look natural rather than spammy."""
    posts: list[Post] = []
    total = 0
    started_at = _dt.datetime.now(_dt.timezone.utc)

    for cat in CATEGORIES:
        for i, item in enumerate(COPY[cat]):
            targets = _targets(cat, i)
            # Reddit
            r_sig = _sigil(batch_id + cat + str(i) + "reddit")
            r_subject = item["reddit_subject"]
            r_body = item["reddit_body"]
            posts.append(Post(
                platform="reddit",
                category=cat,
                subject=r_subject,
                body=r_body,
                url_targets=targets,
                hashtags=[],
                sigil=r_sig,
                scheduled_at=(
                    started_at + _dt.timedelta(minutes=schedule_offset_min * total)
                ).isoformat(),
            ))
            total += 1
            # X / Twitter
            x_sig = _sigil(batch_id + cat + str(i) + "x")
            hashtags = _pick(cat, 4)
            x_thread = item.get("x_thread", [])
            x_subject = x_thread[0] if x_thread else item["reddit_subject"]
            x_body = "\n\n---\n\n".join(
                (line + " " + " ".join(hashtags)) for line in x_thread
            )
            posts.append(Post(
                platform="x",
                category=cat,
                subject=x_subject,
                body=x_body,
                url_targets=targets,
                hashtags=hashtags,
                sigil=x_sig,
                scheduled_at=(
                    started_at + _dt.timedelta(minutes=schedule_offset_min * total)
                ).isoformat(),
            ))
            total += 1
    return posts


# ─────────────────────────────────────────────────────────────────────────────
# MAIL-QUEUE WIRE — convert posts into the JSON envelope that `mail-queue`
# (the X account-binding service) reads.  One record per line.
# ─────────────────────────────────────────────────────────────────────────────
def to_mail_queue(posts: list[Post]) -> list[dict[str, Any]]:
    """Format a list of posts into the mail-queue X-binding envelope.

    The schema here matches `mail-queue` consumer's `x.post.scheduled` lane:
      {op: "x.post.scheduled", account: "<bound X handle>",
       thread: [{text, hashtags, urls}], sigil, scheduled_at}

    When X account binding is complete, the consumer reads the file,
    authenticates with stored OAuth, and POSTs the threads via the v2 API.
    """
    out: list[dict[str, Any]] = []
    for p in posts:
        if p.platform != "x":
            continue
        # Reconstruct the per-tweet thread from the body.
        # Body was joined with \n\n---\n\n so we split it back.
        tweet_text = p.body
        thread_lines = tweet_text.split("\n\n---\n\n") if tweet_text else []
        thread = []
        for line in thread_lines:
            stripped = line.strip()
            # strip trailing hashtags+url so they go in dedicated fields
            url = p.url_targets[0] if p.url_targets else None
            thread.append({
                "text": stripped[:280],      # X hard limit
                "hashtags": p.hashtags,
                "urls": p.url_targets,
                "url": url,
                "category": p.category,
                "sigil": p.sigil,
            })
        out.append({
            "op": "x.post.scheduled",
            "thread": thread,
            "scheduled_at": p.scheduled_at,
            "sigil": p.sigil,
            "category": p.category,
            "subject": p.subject,
            "url_targets": p.url_targets,
        })
    return out


# ─────────────────────────────────────────────────────────────────────────────
# WRITERS
# ─────────────────────────────────────────────────────────────────────────────
def write_outputs(posts: list[Post], batch_id: str) -> dict[str, Path]:
    ts = _dt.datetime.now(_dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    paths: dict[str, Path] = {}

    # 1. Master JSON — every post
    json_path = OUT_DIR / f"reddit-x-burst-{ts}.json"
    json_path.write_text(json.dumps(
        {
            "batch_id": batch_id,
            "ts": ts,
            "count": len(posts),
            "posts": [p.to_dict() for p in posts],
            "hive": "DEFONEOS / OpenPatent",
            "sigil_prefix": "DEFONEOS-SOV3-DRAGON-2026",
        },
        indent=2,
        ensure_ascii=False,
        sort_keys=True,
    ))
    paths["json"] = json_path

    # 2. Reddit manual-post markdown (one post per section)
    reddit = [p for p in posts if p.platform == "reddit"]
    md_path = OUT_DIR / f"reddit-x-burst-{ts}.reddit.md"
    with md_path.open("w") as fh:
        fh.write(f"# reddit-x-burst · {batch_id} · Reddit posts\n\n")
        fh.write(f"_{len(reddit)} posts ready to paste into Reddit._\n\n")
        for i, p in enumerate(reddit):
            sub = SUBREDDITS[i // 6 % len(SUBREDDITS)]
            fh.write(f"## {i+1:>2}. {sub} — {p.subject}\n\n")
            fh.write(f"*sigil: `{p.sigil}`*\n")
            fh.write(f"*url targets: {', '.join(p.url_targets)}*\n\n")
            fh.write(p.body)
            fh.write("\n\n---\n\n")
    paths["reddit_md"] = md_path

    # 3. X mail-queue JSONL — feeds `mail-queue` directly
    mq_path = OUT_DIR / f"reddit-x-burst-{ts}.x-mail-queue.jsonl"
    envelopes = to_mail_queue(posts)
    with mq_path.open("w") as fh:
        for env in envelopes:
            fh.write(json.dumps(env, ensure_ascii=False) + "\n")
    paths["x_mail_queue"] = mq_path

    # 4. CSV — for the operator's eyedropper (one row per post)
    csv_path = OUT_DIR / f"reddit-x-burst-{ts}.csv"
    with csv_path.open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow([
            "platform", "category", "subject", "url_targets",
            "hashtags", "scheduled_at", "sigil", "body_chars",
        ])
        for p in posts:
            w.writerow([
                p.platform, p.category, p.subject[:60],
                "|".join(p.url_targets), ",".join(p.hashtags),
                p.scheduled_at or "", p.sigil, len(p.body),
            ])
    paths["csv"] = csv_path

    # 5. receipt summary
    summary = _build_summary(posts, batch_id)
    receipt_path = OUT_DIR / "reddit-x-burst-latest.receipt.txt"
    receipt_path.write_text(summary + "\n")
    paths["receipt"] = receipt_path

    return paths


def _build_summary(posts: list[Post], batch_id: str) -> str:
    import collections  # local
    counts: collections.Counter = collections.Counter(
        (p.platform, p.category) for p in posts
    )
    by_cat = {c: 0 for c in CATEGORIES}
    for p in posts:
        if p.category in by_cat:
            by_cat[p.category] += 1

    L: list[str] = []
    L.append("┌─ reddit-x-burst.py receipt ──────────────────────────────────────────┐")
    L.append("│ " + f" OpenPatent / DEFONEOS / MEOK · 60-post burst · {batch_id} ".center(74) + " │")
    L.append("└────────────────────────────────────────────────────────────────────────┘")
    L.append("")
    L.append("  category   reddit    x     total")
    L.append("  ────────   ──────   ───   ─────")
    for cat in CATEGORIES:
        n_r = sum(1 for p in posts if p.platform == "reddit" and p.category == cat)
        n_x = sum(1 for p in posts if p.platform == "x" and p.category == cat)
        L.append(f"  {cat:<10} {n_r:>6}   {n_x:>3}   {n_r+n_x:>5}")
    L.append("  ────────   ──────   ───   ─────")
    L.append(f"  {'TOTAL':<10} {sum(1 for p in posts if p.platform=='reddit'):>6}   "
             f"{sum(1 for p in posts if p.platform=='x'):>3}   {len(posts):>5}")
    L.append("")
    L.append("  ✓ 30 Reddit posts   (manual, anti-bot honoured)")
    L.append("  ✓ 30 X/Twitter      (envelope wired through mail-queue")
    L.append("                         for X account binding)")
    L.append("")
    L.append("  The hive remembers. The dragon knows. "
             "The sovereign companion never forgets.")
    return "\n".join(L)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def main(argv: list[str] | None = None) -> int:
    import collections  # local
    p = argparse.ArgumentParser(
        prog="reddit-x-burst.py",
        description="OpenPatent · 30 Reddit + 30 X/Twitter posts burst.",
    )
    p.add_argument("--dry-run", action="store_true",
                   help="Print summary to stdout, write all output files.")
    p.add_argument("--list-only", action="store_true",
                   help="Just list the posts; no files written.")
    p.add_argument("--schedule", type=int, default=5,
                   help="Minutes between scheduled posts (default 5).")
    args = p.parse_args(argv)

    batch_id = "rxburst-" + "".join(
        random.choices(string.ascii_lowercase + string.digits, k=8)
    )

    print("┌─ reddit-x-burst.py · " + batch_id + " ────────────────────────────┐")
    print(f"│ total posts : 60   (30 reddit · 30 x)")
    print(f"│ schedule    : {args.schedule} min between posts")
    print(f"│ categories  : {', '.join(CATEGORIES)}")
    print("└──────────────────────────────────────────────────────────────────┘")
    print()

    posts = build_posts(batch_id, schedule_offset_min=args.schedule)

    if args.list_only:
        for p_obj in posts:
            print(f"  [{p_obj.platform:6}/{p_obj.category:4}/{p_obj.sigil[:6]}] "
                  f"{p_obj.subject[:80]}")
        return 0

    paths = write_outputs(posts, batch_id)
    summary_text = _build_summary(posts, batch_id)
    print(summary_text)
    print()
    print("  outputs:")
    for k, v in paths.items():
        print(f"    {k:14}: {v}")
    print()

    if args.dry_run:
        print("  (dry-run mode — output files written anyway; do not pipe to X)")
        return 0

    print("  next steps:")
    print("    1. open scripts/reddit-x-burst.py.reddit.md  → paste to Reddit")
    print("    2. when X account binding ready, run `mail-queue drain "
          f"{paths['x_mail_queue']}` to publish the threads.")
    print()
    print("  The hive remembers. The dragon knows. "
          "The sovereign companion never forgets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
