#!/usr/bin/env python3
"""repo-metadata.py — plan and apply TRUE descriptions, topics and licences across the
CSOAI-ORG public repositories.

  --plan  OUT.json        derive a plan (reads `gh repo list`, READMEs, manifests); no writes
  --apply PLAN.json       apply a plan with `gh repo edit` / contents API; skips archived repos
  --diff  PLAN.json       print before/after per repo as markdown (for the lane report)
  --replan PLAN.json      recompose from a cached plan (after editing the rules)

Rules, so a reader can audit what happened rather than trust it:

* A description is rewritten as  <emoji> <verb> <outcome>.  The outcome is the repo's
  EXISTING description with the claims below removed, never a new claim invented here.
  Hand-written overrides exist only for the repositories a person actually read
  (`HAND` below) — those are the ones that carry the estate.
* Removed from every description (they are either retracted, unmeasurable, or a price):
    "Part of the CSOAI Layer-0: 8 protocols · 100/100 A+++++ · world-leading."
    "100/100", "A+++++", "world-leading", "world's first/only", "the first/only",
    any £/$/€ amount, "/mo", "vs Big-4", "Stripe-tier", "COAI-certified",
    "EU AI Act Compliant", "production-ready", "BFT"/"Byzantine" (retracted 2026-07-29 —
    replaced by "designed N-of-M council"), "Sovereign" as a brand adjective.
* Third-party code that was copied or forked into the account gets
  "📦 Mirrors <upstream>" and NO licence file from us — the upstream licence applies.
* A LICENSE is added only where: the repo is ours, not a fork, not archived, has no
  licence-like file, and either declares a licence in pyproject/package.json (that text is
  used) or declares none (MIT, matching councilof-ai/LICENSE).
* Topics are added, never removed: ai-governance, measurement, x402, a2a, mcp, scitt,
  ed25519, merkle, eu-ai-act — each only when the name/description/README contains the term.
  GitHub caps topics at 20.

Every plan carries `derived <ISO>`; nothing here is typed by hand except HAND.
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

OWNER = "CSOAI-ORG"
MAX_DESC = 350

MIT_TEXT = """MIT License

Copyright (c) 2026 CSOAI Ltd (Council of AI), UK Companies House 16939677

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

APACHE_TEXT = """Apache License 2.0

Copyright 2026 CSOAI Ltd (Council of AI), UK Companies House 16939677

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

# --------------------------------------------------------------------------- hand-written (read by a person on 2026-09-05)
HAND: dict[str, str] = {
    "councilof-ai": "📏 Measures AI systems on frozen instruments and publishes the live 22-axis GSPC board, Ed25519-signed cards, a signed Merkle root with a Rekor witness, and a public corrections ledger — councilof.ai. Measurement, not certification.",
    "gspc-board": "🪞 Mirrors GET councilof.ai/api/gspc as dated JSON/parquet snapshots — every count derived from the axes array, every card Ed25519-verifiable without an account. CC0 data.",
    "a2a-signed-receipts": "🧾 Extends A2A with signed-receipts/v1 — did:web key-trust for §8.4 AgentCard signing plus Ed25519-signed task-outcome receipts. Evidence of what was claimed, not a certification.",
    "inspect-receipts": "🔏 Signs every Inspect AI eval run with an Ed25519, hash-chained, offline-verifiable measurement receipt. Evidence of what was claimed and when — not certification.",
    "corpus-watch": "👁️ Watches the EU AI Act (CELLAR) and UK statute daily by hash and reports drift; fail-closed — UNKNOWN is never reported as unchanged.",
    "carder": "🗂️ Emits deterministic JSON fact-cards for public datasets and benchmarks — facts with dates, an adjective lint, no LLM judge. Measurement, not certification.",
    "cibola": "🃏 Specifies CIBOLA — a signed AI-governance measurement-card layer over RFC 9943 receipts (RFC 9942). Measurement, never certification.",
    "claimguard": "🛡️ Checks natural-language claims against a signed GSPC board — verifies the Ed25519 site_attestation, payload completeness, and whether each claim is supported. Measurement, not certification.",
    "codabench-gspc": "🏁 Packages GSPC as a Codabench leaderboard bundle — Ed25519 per-submission receipts, deterministic grading, sealed held-out bank (commit-then-reveal).",
    "signed-receipts": "✍️ Provides the one audited Ed25519 signed-receipt primitive for the estate — RFC 8785 canonical JSON, SHA-256 content ids, did:web:csoai.org trust root. Measurement, not certification.",
    "inspect-signed-receipt": "🔗 Chains Ed25519-signed receipts over Inspect (inspect_ai) eval logs — deterministic tamper-evidence, no LLM judge, no certification.",
    "action-verify-attestation": "✅ Verifies Council of AI Ed25519 attestations in GitHub Actions with zero dependencies — any signed artefact under councilof.ai/signed, /signals, /interop.",
    "memory-poisoning-axis": "🧪 Measures memory-poisoning / prompt-injection deterministically — anchored to CVE-2026-24301 (CoSnitch), Inspect scorer, signed receipts. Measurement, not certification.",
    "oversight-measurement": "🧪 Measures whether humans acted on AI warnings — EU AI Act Article 14-aligned deterministic predicates, signed receipts via inspect-signed-receipt. Measurement, not certification.",
    "csoai-hf-flywheel": "🤗 Serves GSPC measurement badges on Hugging Face — one Gradio Space, adapters, firehose bucket. Measurement, never certification.",
    "flywheel-nsite": "🔁 Runs the CSOAI flywheel instrument (flywheel.py + care_battery.py, embedded verbatim) on GitHub Actions runners and mirrors results to huggingface.co/datasets/csoai/csoai-benchmarks. UNMEASURED ≠ fail.",
    "council-of-ai-grok": "🧩 Plugs the Council of AI instrument into Grok Build — skills, slash commands, a read-only auditor subagent, MCP wiring. Does not wrap or rank Grok. Measurement, never certification.",
    ".github": "🏛️ Holds the CSOAI-ORG profile README (re-derived daily from live endpoints), issue templates, CONTRIBUTING, SECURITY and the community-health files. Measurement, not certification.",
    "csoai-org": "👤 Profile README for the CSOAI-ORG account — Council of AI, an independent AI-measurement body. Live counts belong to GET councilof.ai/api/gspc, never to this file. Measurement, not certification.",
    "gspc-harness": "🧪 Runs CSOAI governance benchmarks as self-contained Inspect evals — EU AI Act risk-tier classification and agentic provision lookup; items ship as data, nothing downloaded. Apache-2.0.",
    "csoai-static-deploy2": "🧱 Builds the registry and Worker source behind the GSPC measurement axes — frozen benchmark harnesses, Ed25519-signed and time-anchored measurement credentials, external verifier. Measurement, not certification.",
    "eu-ai-act-compliance-mcp": "📚 Freezes the EU AI Act as a 417-provision measurement corpus (113 Articles, provision-level) with a signed GSPC crosswalk and article-level MCP tools. Measurement, not certification.",
    "proofof-ai-mcp": "🔎 Exposes content-provenance and authenticity checks for AI-generated media over MCP — media forensics, synthetic-media detection, provenance chains. Measurement, never certification.",
    "watermarking-authenticity-mcp": "💧 Exposes EU AI Act Article 50 watermarking and C2PA 2.1 checks over MCP — built for the 2 December 2026 transparency deadline. MIT.",
    "progress-council-mcp": "🛑 Halts agentic loops when a designed 5-voter council sees no real progress — stops tokens bleeding on infinite spins. MIT. A designed majority tally; the consensus-strength claim was retracted 2026-07-29.",
    "meok-bft-verifier": "🗳️ Turns designed 3-of-4 council tallies into Ed25519-signed attestations any agent can verify offline — a designed tally; the consensus-strength claim was retracted 2026-07-29.",
    "sovos-core": "⚙️ Scores AI-governance posture deterministically and locally — a four-axis GSPC score over the 13 principles of ETSI EN 304 223 across 5 lifecycle phases. Apache-2.0.",
    "dora-compliance-mcp": "🏦 Exposes DORA (Regulation EU 2022/2554) tooling for financial entities over MCP — ICT-risk, incident classification, reporting workflows. MIT.",
    "csoai-cra-annex-iv-classifier-mcp": "🔐 Classifies products against the EU Cyber Resilience Act (Reg 2024/2847) Annex III/IV over MCP — 9-category essential-requirements audit with HMAC-signed outputs. MIT.",
    "csoai-governance-engine-mcp": "🧭 Orchestrates 13 regulatory frameworks through one MCP with signed audit receipts. MIT.",
    "csoai-mcp-injection-scan-mcp": "🕵️ Scans MCP servers for injection with 30+ canonical detection rules across 5 severity levels (April 2026 MCP RCE class). MIT.",
    "csoai-watermark-attest-mcp": "💧 Exposes EU AI Act Article 50 watermarking and disclosure checks over MCP — C2PA, content provenance, deepfake disclosure, AI-content labelling. MIT.",
    "OPENMOE": "🧪 Experiments with an EU AI Act compliance MCP server and a consensus router for Mixture-of-Experts routing — a designed tally; the consensus-strength claim was retracted 2026-07-29.",
    "gspc-axis-boards": "📊 Publishes per-axis GSPC board pages as static HTML — read the live numbers from GET councilof.ai/api/gspc, not from this repo.",
    "sovereign-oowm": "🧠 Holds shell scaffolding for the outer-world-model (OWM) lane of the SOV research stack; no README yet.",
    "CSOAI": "📁 Placeholder repository named for the company; the live estate is councilof-ai.",
    "openmore.ai": "📰 Publishes a dated dossier on the open-source AI-governance stack; the repo and package counts inside are as of their own date, not live.",
    "openmoe.ai": "📰 Publishes a dated dossier on the OPENMOE project; counts inside are as of their own date, and its consensus-strength claim was retracted 2026-07-29.",
}

# Third-party code copied or forked into the account. No licence from us; upstream licence applies.
MIRRORS: dict[str, str] = {
    "langfuse": "langfuse/langfuse", "OpenHands": "OpenHands/OpenHands", "agent-zero": "agent0ai/agent-zero",
    "llama.cpp": "ggml-org/llama.cpp", "Genesis": "Genesis-Embodied-AI/Genesis", "opencrane": "menloresearch/opencrane",
    "modular-bearing": "Anthrobotics/modular-bearing", "wolf-actuator": "Anthrobotics/wolf-actuator",
    "Ironless-QDD-Actuator": "Ironless-QDD-Actuator (upstream)", "god-eye": "Vyntral/god-eye",
    "Agentshire": "Agentshire (upstream)", "openclaw-world": "openclaw-world (upstream)",
    "mcp-get": "michaellatman/mcp-get (deprecated upstream)", "scitt-api-emulator": "scitt-community/scitt-api-emulator",
    "ai-sdk": "vercel/ai", "a-evolve": "a-evolve (upstream)", "legion-omega": "legion-omega (upstream)",
}

STRIP = [
    (r"\s*Part of the CSOAI Layer-0:\s*8 protocols\s*·\s*100/100 A\++\s*·\s*world-leading\.?", ""),
    (r"\s*100/100 (?:master stack|A\++)\.?", ""), (r"\s*A\+{3,}", ""),
    (r"\bworld[- ]leading\b,?\s*", ""), (r"\bthe world'?s (?:first|only)\b", "an"), (r"\bThe world'?s (?:first|only)\b", "An"),
    (r"\bThe (?:first|only) (MCP server|AI router)\b", r"An \1"),
    (r"\s*\(?(?:£|\$|€)\s?\d[\d,.]*\s?[KkMmBb]?(?:\s?(?:vs|-|–)\s?(?:Big-4\s?)?(?:£|\$|€)?\s?\d[\d,.]*\s?[KkMmBb]?)?(?:\s?(?:/|per\s)(?:mo|month|yr|year|call|card|hr|hour|seat|user))?(?:\s+special|\s+enterprise wedge|\s+[A-Za-z ]{0,30}market)?\)?\.?", ""),
    (r"\s*and Stripe-tier access", ""), (r"\bStripe-to-MCP tier authentication\b", "payment-status-to-MCP access mapping"),
    (r"\bCOAI-certified\b\s*", ""), (r"\bEU AI Act[- ]Compliant\b", "EU AI Act-aligned"), (r"\bproduction-ready\b\s*", ""),
    (r"\bcertification readiness\b", "readiness checks"), (r"\bsigned certificates?\b", "signed attestations"),
    (r"\bBFT (?:council|Progress Council)\b", "designed council-tally"), (r"\bBFT\b", "designed-tally"), (r"\bByzantine(?:-fault-tolerant)?\b", "designed"),
    (r"\bSovereign AI\b", "local-first AI"), (r"\bsovereign OS\b", "local-first OS"), (r"\bSovereign UK\b", "UK"),
    (r"\bSOV3-enabled sovereign\b", "SOV3-enabled"), (r"\bSovereign\b(?= (?:Temple|Town|Stack|MEOK|Operating))", "SOV"),
    (r"(?<!Self-)(?<!self-)\bsovereign\b(?!-)", "local-first"), (r"\bSovereign\b(?! Identity)", "local-first"),
    (r"\bSOV3 local-first data\b", "SOV3 data"),
    (r"\s*,?\s*\bthe\.$", "."), (r"^[\U0001F300-\U0001FAFF\u2600-\u27BF]\s*", ""),
    (r"\s{2,}", " "), (r"\s+([.,;])", r"\1"), (r"\(\s*\)", ""), (r"\.\s*\.", "."),
]

IMPERATIVE = {"validate","create","generate","check","verify","scan","analyze","analyse","assess","detect","monitor","track",
              "search","extract","convert","compute","calculate","build","run","manage","send","fetch","query","parse","score",
              "classify","summarize","summarise","translate","encode","decode","compress","sign","audit","measure","map","list"}

TOPIC_RULES = [
    ("ai-governance", r"ai.governance|governance|compliance|eu ai act|regulat"),
    ("measurement", r"\bmeasur|gspc|benchmark|eval"),
    ("x402", r"\bx402\b"), ("a2a", r"\ba2a\b|agent-to-agent"), ("mcp", r"\bmcp\b"),
    ("scitt", r"\bscitt\b"), ("ed25519", r"ed25519|signed"), ("merkle", r"\bmerkle\b"),
    ("eu-ai-act", r"eu ai act|eu-ai-act|article 50|art\.? ?50|article 53"),
]


def gh(*args, input_=None):
    p = subprocess.run(["gh", *args], capture_output=True, text=True, input=input_)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip()[:300])
    return p.stdout


def readme_text(name: str) -> str:
    try:
        return base64.b64decode(gh("api", f"repos/{OWNER}/{name}/readme", "--jq", ".content").strip()).decode("utf-8", "replace")
    except Exception:  # noqa: BLE001
        return ""


def first_heading(txt: str) -> str:
    for line in txt.splitlines():
        m = re.match(r"^#\s+(.+)$", line.strip())
        if m:
            return re.sub(r"[*_`]", "", m.group(1)).strip()
    return ""


def clean(desc: str) -> str:
    out = desc.strip()
    for pat, rep in STRIP:
        out = re.sub(pat, rep, out)
    return out.strip(" -—·,")


def verb_for(name: str, desc: str, is_fork: bool) -> tuple[str, str]:
    n, d = name.lower(), desc.lower()
    if name in MIRRORS or is_fork:
        return "📦", "Mirrors"
    if n.startswith("awesome-"):
        return "📚", "Curates"
    if n.endswith("-site") or n.endswith("-deploy") or n.endswith("-hive") or "site" in n.split("-"):
        return "🌐", "Publishes"
    if "bridge" in n:
        return "🌉", "Maps"
    if "mcp" in n:
        return "🔌", "Exposes"
    if any(k in n for k in ("receipt", "attest", "sign", "verif")):
        return "🔏", "Signs"
    if any(k in n for k in ("bench", "harness", "eval", "axis", "flywheel")):
        return "🧪", "Measures"
    if any(k in n for k in ("watch", "monitor", "drift")):
        return "👁️", "Watches"
    if any(k in n for k in ("plugin", "skill", "extension", "app")):
        return "🧩", "Plugs"
    if any(k in n for k in ("dataset", "corpus", "bank")):
        return "🧊", "Freezes"
    if any(k in n for k in ("demo", "proof", "lab", "experiment")):
        return "🧫", "Demonstrates"
    return "🧭", "Provides"


def compose(name: str, desc: str | None, is_fork: bool, readme: str) -> str:
    if name in HAND:
        return HAND[name]
    emoji, verb = verb_for(name, desc or "", is_fork)
    if name in MIRRORS or is_fork:
        up = MIRRORS.get(name) or "its upstream"
        base = clean(desc) if desc else first_heading(readme)
        tail = f" — {base}" if base else ""
        return f"📦 Mirrors {up} into the CSOAI-ORG account for estate experiments; upstream licence applies{tail}."[:MAX_DESC]
    base = clean(desc) if desc else ""
    if not base:
        h = clean(first_heading(readme))
        base = h if h else f"{name} (no README yet)"
    human = re.sub(r"[-_]+", " ", re.sub(r"-?(mcp|ai-mcp|hive|site)$", "", name)).strip()
    # Common estate templates → grammatical verb + outcome
    m = re.match(r"^MEOK AI Labs\s*[—-]\s*(.+?)\s*MCP Server\.?$", base)
    if m:
        return f"🔌 Exposes {m.group(1)} tools over MCP (MEOK AI Labs)."[:MAX_DESC]
    if re.match(r"^MEOK AI Labs MCP Server\.?$", base):
        return f"🔌 Exposes {human} tools over MCP (MEOK AI Labs); see the README for the tool list."[:MAX_DESC]
    m = re.match(r"^MEOK AI Labs\s*[—-]\s*(.+)$", base)
    if m:
        return f"{emoji} {verb} {m.group(1)} (MEOK AI Labs)"[:MAX_DESC]
    m = re.match(r"^(.+?) → AI governance\.\s*(.+)$", base)
    if m:
        return f"🌉 Maps {m.group(1)} records into AI-governance evidence — {m.group(2)}"[:MAX_DESC]
    m = re.match(r"^The MEOK \.AI (.+?) compliance package\.\s*(.+)$", base)
    if m:
        return f"🌐 Publishes the MEOK {m.group(1)} compliance package site — {m.group(2)}"[:MAX_DESC]
    m = re.match(r"^Configuration repository for the (\S+) domain — (.+)$", base)
    if m:
        return f"🌐 Wires the {m.group(1)} hive — {m.group(2)}"[:MAX_DESC]
    m = re.match(r"^(\S+) MCP — (.+)$", base)
    if m and m.group(1).lower() == name.lower():
        return f"🔌 Exposes {human} over MCP — {m.group(2)}"[:MAX_DESC]
    if base.startswith("Part of"):
        return f"🔌 Exposes {human} over MCP — {base}"[:MAX_DESC]
    first = base.split()[0].lower().strip(",.:;")
    if first in IMPERATIVE:
        lead = base[0].lower() + base[1:]
        return (f"🔌 Lets an MCP client {lead}" if "mcp" in n_lower(name) else f"{emoji} Lets you {lead}")[:MAX_DESC]
    m = re.match(r"^(.+?) MCP(?: [Ss]erver)?\b\s*[—:-]?\s*(.*)$", base)
    if m and "mcp" in n_lower(name) and m.group(2):
        return f"🔌 Exposes {m.group(1)} over MCP — {m.group(2)}"[:MAX_DESC]
    return f"{emoji} {verb} {base}"[:MAX_DESC]


def n_lower(name: str) -> str:
    return name.lower()


def tidy(t: str) -> str:
    """Remove artefacts left by stripping a price or a retracted clause."""
    t = re.sub(r"—\s*\.\s*", "— ", t)
    t = re.sub(r"\s*[=:]\s*\.$", ".", t)
    t = re.sub(r"\s*—\s*$", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()


def topics_for(name: str, desc: str, readme: str, existing: list[str]) -> list[str]:
    hay = f"{name} {desc} {readme[:4000]}".lower()
    add = [t for t, pat in TOPIC_RULES if re.search(pat, hay) and t not in existing]
    return (existing + add)[:20]


def licence_for(name: str, ours: bool, is_fork: bool, archived: bool, has_lic: bool, declared: str | None) -> str | None:
    if not ours or is_fork or archived or has_lic or name in MIRRORS:
        return None
    if declared and "apache" in declared.lower():
        return "Apache-2.0"
    if declared and "mit" not in declared.lower():
        return None  # something else declared; a person decides
    return "MIT"


def plan(out: str) -> None:
    repos = json.loads(gh("repo", "list", OWNER, "--limit", "1000", "--visibility", "public", "--json",
                          "name,description,repositoryTopics,isArchived,isFork,licenseInfo,pushedAt"))

    def one(r):
        name = r["name"]
        readme = readme_text(name)
        desc = r.get("description") or ""
        existing = [t["name"] for t in (r.get("repositoryTopics") or [])]
        ours = bool(re.search(r"csoai|meok|council|gspc|sov|hive|coai|openmoe|defoneos", name, re.I)) or \
            bool(re.search(r"CSOAI|MEOK|Council of AI|councilof\.ai|csoai\.org|16939677", desc + readme[:6000], re.I)) or \
            name.endswith(("-site", "-deploy"))
        has_lic = bool(r.get("licenseInfo"))
        declared = None
        if not has_lic and not r["isFork"] and not r["isArchived"]:
            try:
                root = gh("api", f"repos/{OWNER}/{name}/contents/", "--jq", ".[].name").split()
            except Exception:  # noqa: BLE001
                root = []
            has_lic = any(re.match(r"(?i)^(licen[cs]e|copying|unlicense)", t) for t in root)
            for mf, pat in (("pyproject.toml", r'license\s*=\s*(?:\{\s*text\s*=\s*)?"([^"]+)"'), ("package.json", r'"license"\s*:\s*"([^"]+)"')):
                if mf in root and not declared:
                    try:
                        txt = base64.b64decode(gh("api", f"repos/{OWNER}/{name}/contents/{mf}", "--jq", ".content").strip()).decode()
                        m = re.search(pat, txt)
                        declared = m.group(1) if m else None
                    except Exception:  # noqa: BLE001
                        pass
        new_desc = tidy(compose(name, desc, r["isFork"], readme))
        return {
            "name": name, "archived": r["isArchived"], "fork": r["isFork"], "pushed": r["pushedAt"][:10],
            "description_before": desc, "description_after": new_desc, "hand_written": name in HAND,
            "topics_before": existing, "topics_after": topics_for(name, desc + " " + new_desc, readme, existing),
            "licence_before": (r.get("licenseInfo") or {}).get("key"), "licence_add": licence_for(name, ours, r["isFork"], r["isArchived"], has_lic, declared),
            "ours": ours, "declared": declared,
        }

    with ThreadPoolExecutor(6) as ex:
        rows = list(ex.map(one, repos))
    doc = {"derived": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
           "owner": OWNER, "count": len(rows), "repos": rows}
    with open(out, "w") as fh:
        json.dump(doc, fh, indent=1, ensure_ascii=False)
    ch = sum(1 for r in rows if r["description_before"] != r["description_after"] and not r["archived"])
    tp = sum(1 for r in rows if r["topics_before"] != r["topics_after"] and not r["archived"])
    lc = sum(1 for r in rows if r["licence_add"])
    print(f"[repo-metadata] planned: {len(rows)} repos · {ch} descriptions · {tp} topic sets · {lc} licences → {out}")


def replan(path: str) -> None:
    doc = json.load(open(path))
    for r in doc["repos"]:
        readme = readme_text(r["name"]) if not r["description_before"] else ""
        r["description_after"] = tidy(compose(r["name"], r["description_before"], r["fork"], readme))
        r["hand_written"] = r["name"] in HAND
        r["topics_after"] = topics_for(r["name"], r["description_before"] + " " + r["description_after"], readme, r["topics_before"])
    doc["derived"] = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    with open(path, "w") as fh:
        json.dump(doc, fh, indent=1, ensure_ascii=False)
    print(f"[repo-metadata] replanned {len(doc['repos'])} → {path}")


def apply(path: str) -> None:
    doc = json.load(open(path))
    done = {"desc": 0, "topics": 0, "licence": 0, "skipped_archived": 0, "errors": []}
    for r in doc["repos"]:
        name = r["name"]
        if r["archived"]:
            done["skipped_archived"] += 1
            continue
        try:
            args = []
            if r["description_before"] != r["description_after"]:
                args += ["--description", r["description_after"]]
            new_topics = [t for t in r["topics_after"] if t not in r["topics_before"]]
            for t in new_topics:
                args += ["--add-topic", t]
            if args:
                gh("repo", "edit", f"{OWNER}/{name}", *args)
                done["desc"] += int("--description" in args)
                done["topics"] += int(bool(new_topics))
            if r["licence_add"]:
                text = MIT_TEXT if r["licence_add"] == "MIT" else APACHE_TEXT
                body = json.dumps({"message": f"Add {r['licence_add']} LICENSE (CSOAI Ltd) — none was present", "content": base64.b64encode(text.encode()).decode()})
                gh("api", "-X", "PUT", f"repos/{OWNER}/{name}/contents/LICENSE", "--input", "-", input_=body)
                done["licence"] += 1
        except Exception as e:  # noqa: BLE001
            done["errors"].append(f"{name}: {e}")
        print(f"[repo-metadata] {name}: ok", file=sys.stderr)
    print(json.dumps(done, indent=1))


def diff_md(path: str) -> None:
    doc = json.load(open(path))
    print(f"| repo | description before | description after | topics added | licence added |\n|---|---|---|---|---|")
    for r in doc["repos"]:
        if r["archived"]:
            continue
        if r["description_before"] == r["description_after"] and r["topics_before"] == r["topics_after"] and not r["licence_add"]:
            continue
        added = [t for t in r["topics_after"] if t not in r["topics_before"]]
        b = (r["description_before"] or "—").replace("|", "\\|")
        a = r["description_after"].replace("|", "\\|")
        print(f"| `{r['name']}` | {b} | {a} | {', '.join(added) or '—'} | {r['licence_add'] or '—'} |")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--plan", metavar="OUT.json")
    ap.add_argument("--apply", metavar="PLAN.json")
    ap.add_argument("--replan", metavar="PLAN.json", help="recompose descriptions/topics from a cached plan")
    ap.add_argument("--diff", metavar="PLAN.json")
    a = ap.parse_args()
    if a.plan:
        plan(a.plan)
    if a.replan:
        replan(a.replan)
    if a.diff:
        diff_md(a.diff)
    if a.apply:
        apply(a.apply)
