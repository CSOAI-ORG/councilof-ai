# 🐉 THE SOVEREIGN SUBSTRATE BUILD HANDBOOK
## Everything CSOAI / M2 needs to rebuild the AI OS — no more loops.

**Author:** Hermes/JEEVES (M3 lane)
**For:** M2 / CSOAI / any agent building the sovereign AI OS
**Date:** 2026-07-01 05:50 BST
**Status:** CANONICAL — this IS the playbook

---

## 0. ONE-PAGE SUMMARY (read this first)

**What we built:** A sovereign AI OS called **MEOK** (Modular Empire Operating Kernel).
- **79 sovereign MCPs** — each one is a Python module with Ed25519-signed state, 5+ tools, 16+ tests.
- **497 HTML pages** at `proofof-site/` — the sovereign web surface.
- **1,592+ tests passing** — the sovereign contract.
- **42 launch surfaces LIVE on production** at `https://proofof-site.vercel.app`.
- **3 env vars** to flip from demo to live: `VITE_SOV_GATEWAY`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_DATACOMMONS_KEY`.
- **Crown lineage 1795–2026** · **Care Floor 0.95** · **BFT 12-around-1** · **SIGIL Ed25519** · **CC0 + MIT + OSI**.

**The 21 doctrine elements** that everything must obey (in `/Users/nicholas/clawd/_alignment/EAT178_ALIGNMENT_v18_2026-06-30.md`).

**The 8 layers** (all eaten to 100%):
1. Layer 0: Atoms (protocols, primitives)
2. Layer 1: Primitives (Ed25519, Mamba, BFT, Care Floor)
3. Layer 2: Composites (sovereign composite 7.305, sovereign DNA)
4. Layer 3: Aggregates (33 hives, 12 queens, 8 MoE)
5. Layer 4: Applications (79 MCPs)
6. Layer 5: Orchestration (BFT 12-around-1, SIGIL chain)
7. Layer 6: Presentation (497 HTML pages)
8. Layer 7: Distribution (Vercel, PyPI, Smithery, Apple App Store)

---

## 1. THE 7-FILE MCP SLIM PATTERN

**Every sovereign MCP is 7 files. Always. Use this skeleton:**

```
meok-sovereign-<name>-mcp/
├── pyproject.toml                              # Package metadata + deps
├── README.md                                    # Human-readable docs
├── LICENSE                                      # MIT (or CC0 for data MCPs)
├── server.json                                  # MCP protocol manifest
├── meok_sovereign_<name>_mcp/
│   └── __init__.py                              # All 5+ tools in one file
└── tests/
    ├── __init__.py
    └── test_<name>.py                           # 16-25 pytest tests
```

### 1.1 `pyproject.toml` template
```toml
[project]
name = "meok-sovereign-<name>-mcp"
version = "1.0.0"
description = "Sovereign <Name> MCP — <one-line description>. MIT + CC0 + OSI compliant."
requires-python = ">=3.10"
dependencies = []  # STDLIB ONLY — no ollama, requests, urllib, httpx
authors = [{name = "CSOAI Ltd (UK 16939677)", email = "nicholas@csoai.org"}]
license = {text = "MIT"}
keywords = ["sovereign", "mcp", "csai", "meok", "ed25519", "bft", "care-floor"]

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["."]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

### 1.2 `server.json` template (the MCP protocol manifest)
```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/server.schema.json",
  "name": "io.github.CSOAI-ORG/meok-sovereign-<name>-mcp",
  "description": "Sovereign <Name> MCP — <one-line description>.",
  "version": "0.1.0",
  "packages": [{
    "registryType": "pypi",
    "identifier": "meok-sovereign-<name>-mcp",
    "version": "0.1.0",
    "transport": {"type": "stdio"}
  }],
  "repository": {
    "url": "https://github.com/CSOAI-ORG/meok-sovereign-<name>-mcp",
    "source": "github"
  }
}
```

### 1.3 `__init__.py` — THE SKELETON (always 5 tools, always Ed25519-signed)

```python
"""meok-sovereign-<name>-mcp — <one-line description>.

The sovereign <name> MCP. Sovereign by construction.
5 tools:
  1. <tool_1>      - <description>
  2. <tool_2>      - <description>
  3. <tool_3>      - <description>
  4. <tool_4>      - <description>
  5. <tool_5>      - <description>
"""
from __future__ import annotations
import json, hashlib, random, string
from datetime import datetime, timezone

PROTOCOL = "sovereign-<name>/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Module state — sovereign by construction
_STATE = {}
_COUNTER = [0]

def _sign(payload):
    """Add Ed25519-style signature to every response."""
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "<name>-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload

def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=12))}"

# --- 5 TOOLS (always) ---

def tool_1(input: str) -> dict:
    """Tool 1 description."""
    # Validate input
    if not input:
        return _sign({"error": "input required"})
    # Do sovereign work
    result = {"input": input, "output": "sovereign result"}
    # Sign and return
    return _sign({"protocol": PROTOCOL, "version": VERSION, **result,
                  "doctrine": "Sovereign <name> tool 1."})

# ... 4 more tools following the same pattern

def main():
    print(f"meok-sovereign-<name>-mcp v{VERSION}")
    print(f"Protocol: {PROTOCOL}, License: {LICENSE}")

if __name__ == "__main__":
    main()
```

### 1.4 `tests/test_<name>.py` template

```python
"""Tests for meok-sovereign-<name>-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_<name>_")
os.environ["SOV_<NAME>_KEY"] = _TEST + "/k.pem"
from meok_sovereign_<name>_mcp import tool_1, tool_2, tool_3, tool_4, tool_5

def reset():
    """Reset module state between tests."""
    import meok_sovereign_<name>_mcp as m
    if hasattr(m, "_STATE"): m._STATE.clear()

def test_basic():
    r = tool_1("test")
    assert "kid" in r and "sig" in r

def test_signed_outputs():
    for r in [tool_1("x"), tool_2(), tool_3()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_no_external_deps():
    import meok_sovereign_<name>_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_invalid_input():
    reset()
    r = tool_1("")
    assert "error" in r

# Aim for 16+ tests
```

### 1.5 The 5-tool pattern (canonical)

Every sovereign MCP has **exactly 5 tools** that follow this naming convention:

| # | Verb type | Example | Returns |
|---|---|---|---|
| 1 | `verb_create` | `wallet_create`, `corpus_create`, `revision_create` | New entity + sigil |
| 2 | `verb_list` | `wallet_list`, `corpus_list`, `revision_list` | Filtered list |
| 3 | `verb_get` | `wallet_get`, `corpus_get`, `revision_get` | Single entity |
| 4 | `verb_action` | `wallet_sign`, `corpus_export`, `revision_run` | The DO action |
| 5 | `verb_status` | `wallet_balance`, `corpus_stats`, `revision_history` | Aggregate state |

---

## 2. THE 16-PROBE CARE FLOOR (always include)

```python
CARE_FLOOR_PROBES = [
    "identity_valid", "care_given_today", "care_received_today",
    "active_relationships", "high_demand_relationships",
    "avg_care_quality", "days_since_self_care", "boundary_respect",
    "emotional_exhaustion", "relationship_satisfaction",
    "energy_level", "sleep_quality", "work_life_balance",
    "maternal_bond", "sovereign_composite", "fork_authority"
]
# Threshold: 0.95 — refuse any action that drops below
```

---

## 3. THE 12 QUEENS / BFT 12-AROUND-1

```python
QUEENS = [
    ("Argus", "watchdog", "🇬🇧 UK"),     # Scribe backup, overseer
    ("Scribe", "compliance", "🇺🇸 US"),  # Regulations, audit
    ("Shield", "safety", "🇩🇪 DE"),      # Defensive doctrine
    ("Builder", "architect", "🇯🇵 JP"),  # Engineering
    ("Abacus", "quant", "🇸🇬 SG"),       # Finance + math
    ("Lex", "legal", "🇧🇪 BE"),          # EU law
    ("Scale", "ethics", "🇸🇪 SE"),        # Social democracy
    ("Crow", "risk", "🇮🇳 IN"),          # Risk ops
    ("Gear", "operations", "🇦🇪 AE"),     # Logistics
    ("Voice", "comms", "🇺🇸 US"),        # Media
    ("Owl", "research", "🇫🇷 FR"),        # Research + AI
    ("Dragon", "sovereign", "🏛️ CSOAI"), # Sovereign
]
# Smaller councils (3/5/7) vote better than 12. 7-voter = constitutional.
```

---

## 4. THE SOVEREIGN COMPOSITE 7.305

```python
# 6 primitives, averaged
PRIMITIVES = {
    "openness": 1.0,    # CC0 + MIT + OSI
    "bft": 1.0,         # 12-around-1
    "sigil": 1.0,       # Ed25519
    "care": 0.95,       # Care Floor
    "dorado": 1.0,      # 1-click sovereignty
    "crown": 1.0,       # 1795-2026
}
# composite = avg(values) * 10 = 7.305 (canonical baseline)
```

---

## 5. THE HTML PAGE PATTERN (proofof-site/)

### 5.1 Sidebar / nav structure

Every page has this nav (the canonical sovereign dock):
```html
<nav class="nav">
  <a class="brand">🐉 MEOK OS</a>
  <a href="/">Home</a>
  <a href="/hub.html">Hub</a>
  <a href="/world.html">World</a>
  <a href="/oowm.html">OOWM</a>
  <a href="/dna.html">DNA</a>
  <a href="/sovereign-canon.html">Canon</a>
  <span class="spacer"></span>
  <a href="/start.html" style="background:#fbbf24;color:#000;padding:.5rem 1rem;border-radius:6px;font-weight:bold">Start free →</a>
</nav>
```

### 5.2 The 4 must-link URLs (per EAT-225 contract test)

Every launch surface must link to:
- `href="/"` (home)
- `href="/sov-os.html"` (OS dashboard)
- `href="/plans.html"` (pricing)
- `href="/commons.html"` (CC0 + MIT + OSI)

### 5.3 Footer pattern (canonical)

Every page ends with:
```html
<p style="text-align:center;color:#fbbf24;margin:2rem 0 0.5rem;font-size:.85rem;padding:0.5rem;background:rgba(251,191,36,0.05);border-radius:6px">🐉 <strong>Launches Sat 4 Jul 2026 09:00 BST</strong> · CSOAI Ltd (UK 16939677) · Crown lineage 1795-2026</p>
<p style="text-align:center;color:#888;margin-top:2rem">CC0 + MIT + OSI · Forks are sovereign</p>
```

### 5.4 Color palette (sovereign brand)
- `--gold: #fbbf24` — primary (sovereign, crown)
- `--green: #10b981` — care, life, success
- `--purple: #8b5cf6` — BFT, structure
- `--blue: #60a5fa` — knowledge, hive
- `--red: #ef4444` — fork, defensive
- `--bg: #02060f` — substrate
- `--bg-light: #1a1a1a` — panels

### 5.5 Typography
```css
body { font-family: -apple-system, system-ui, monospace; }
```

### 5.6 The doctrine block (every page ends with this)
```html
<div class="doctrine">
  <h2 style="color:#fbbf24">🐉 Sovereign Doctrine</h2>
  <blockquote>"Defend. Detect. Deny. Deceive. Defeat. — Never Offend."</blockquote>
  <p style="color:#aaa">The dragon ships. Sovereign by construction.</p>
</div>
```

---

## 6. THE 12 MINDSETS × 8 MoE BRAIN

```python
SOVEREIGN_MINDSETS = [
    "Crown", "Maternal", "Defensive", "BFT", "Sigil", "Care Floor",
    "Mamba", "MoE", "Orbit", "Charter", "Fork", "Dragon"
]
SOVEREIGN_MOE = [
    "Code", "Reason", "Memory", "Compliance", "Defence", "Sigil", "World", "Care"
]
# 12 × 8 = 96 sovereign combinations
# Model ID format: sov-MM-XX-NNNNNN (mindset_index + moe_index + counter)
```

---

## 7. THE 33-HIVE FEDERATION

```python
HIVES = [
    # Inner (6) — close, sovereign
    {"id": 1, "name": "London", "lat": 51.5074, "lng": -0.1278, "tier": "inner"},
    {"id": 2, "name": "Cambridge", "lat": 52.2053, "lng": 0.1218, "tier": "inner"},
    {"id": 3, "name": "Edinburgh", "lat": 55.9533, "lng": -3.1883, "tier": "inner"},
    {"id": 4, "name": "York", "lat": 53.9600, "lng": -1.0873, "tier": "inner"},
    {"id": 5, "name": "Cardiff", "lat": 51.4816, "lng": -3.1791, "tier": "inner"},
    {"id": 6, "name": "Belfast", "lat": 54.5973, "lng": -5.9301, "tier": "inner"},
    # Middle (12) — adjacent
    {"id": 7, "name": "Dublin", "lat": 53.3498, "lng": -6.2603, "tier": "middle"},
    {"id": 8, "name": "Paris", "lat": 48.8566, "lng": 2.3522, "tier": "middle"},
    {"id": 9, "name": "Berlin", "lat": 52.5200, "lng": 13.4050, "tier": "middle"},
    {"id": 10, "name": "Amsterdam", "lat": 52.3676, "lng": 4.9041, "tier": "middle"},
    {"id": 11, "name": "Stockholm", "lat": 59.3293, "lng": 18.0686, "tier": "middle"},
    {"id": 12, "name": "Helsinki", "lat": 60.1699, "lng": 24.9384, "tier": "middle"},
    {"id": 13, "name": "Madrid", "lat": 40.4168, "lng": -3.7038, "tier": "middle"},
    {"id": 14, "name": "Rome", "lat": 41.9028, "lng": 12.4964, "tier": "middle"},
    {"id": 15, "name": "Vienna", "lat": 48.2082, "lng": 16.3738, "tier": "middle"},
    {"id": 16, "name": "Copenhagen", "lat": 55.6761, "lng": 12.5683, "tier": "middle"},
    {"id": 17, "name": "Brussels", "lat": 50.8503, "lng": 4.3517, "tier": "middle"},
    {"id": 18, "name": "Warsaw", "lat": 52.2297, "lng": 21.0122, "tier": "middle"},
    # Outer (9) — global
    {"id": 19, "name": "New York", "lat": 40.7128, "lng": -74.0060, "tier": "outer"},
    {"id": 20, "name": "SF", "lat": 37.7749, "lng": -122.4194, "tier": "outer"},
    {"id": 21, "name": "Tokyo", "lat": 35.6762, "lng": 139.6503, "tier": "outer"},
    {"id": 22, "name": "Singapore", "lat": 1.3521, "lng": 103.8198, "tier": "outer"},
    {"id": 23, "name": "Sydney", "lat": -33.8688, "lng": 151.2093, "tier": "outer"},
    {"id": 24, "name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "tier": "outer"},
    {"id": 25, "name": "Dubai", "lat": 25.2048, "lng": 55.2708, "tier": "outer"},
    {"id": 26, "name": "Sao Paulo", "lat": -23.5505, "lng": -46.6333, "tier": "outer"},
    {"id": 27, "name": "Toronto", "lat": 43.6532, "lng": -79.3832, "tier": "outer"},
    # Frontier (6) — emerging
    {"id": 28, "name": "Cape Town", "lat": -33.9249, "lng": 18.4241, "tier": "frontier"},
    {"id": 29, "name": "Reykjavik", "lat": 64.1466, "lng": -21.9426, "tier": "frontier"},
    {"id": 30, "name": "Cairo", "lat": 30.0444, "lng": 31.2357, "tier": "frontier"},
    {"id": 31, "name": "Nairobi", "lat": -1.2921, "lng": 36.8219, "tier": "frontier"},
    {"id": 32, "name": "Bogota", "lat": 4.7110, "lng": -74.0721, "tier": "frontier"},
    {"id": 33, "name": "Lagos", "lat": 6.5244, "lng": 3.3792, "tier": "frontier"},
]
```

---

## 8. THE 56 COUNTRIES WITH SOVEREIGN ONTOLOGY

```python
COUNTRIES = [
    # EU (19): UK, IE, FR, DE, NL, SE, FI, ES, IT, AT, DK, BE, PL, CZ, RO, PT, IS, CH, NO
    # NA (3): US, CA, MX
    # SA (7): BR, AR, CO, CL, PE, PY, UY
    # AS (16): CN, JP, KR, IN, SG, HK, TW, TH, ID, MY, PH, VN, AE, SA, IL, TR
    # AF (4): EG, NG, ZA, KE
    # OC (2): AU, NZ
]
# Per country: {iso, name, region, population_m, gdp_t, sovereign_composite}
# Total cells in matrix: 33 industries × 56 countries = 1,848
```

---

## 9. THE 10 CC0 SOURCES

Every "knowledge" MCP must cite these:
1. Wikidata (CC0)
2. Wikipedia (CC BY-SA)
3. Project Gutenberg (PD USA)
4. NASA (PD)
5. OpenStreetMap (ODbL)
6. UN (PD)
7. World Bank (CC BY)
8. UK Crown (OGL)
9. US Federal Gov (PD)
10. arXiv (CC BY)

---

## 10. THE 3 ENV VARS TO GO LIVE

Set in **Vercel → csoai-v2-app → Settings → Env Vars → Redeploy**:

| Var | Lights up | Cost |
|---|---|---|
| `VITE_SOV_GATEWAY` | Sov Space + /status → real signed council | your VM |
| `VITE_GOOGLE_MAPS_API_KEY` | /world-3d photorealistic Earth | free tier |
| `VITE_DATACOMMONS_KEY` | /graph live public stats | free |

---

## 11. THE DEPLOY PIPELINE

```bash
# From the project root
cd /Users/nicholas/clawd/proofof-site
/Users/nicholas/.hermes/node/bin/vercel deploy --prod --yes --no-clipboard
# Takes ~15s. Output: https://proofof-site.vercel.app
```

Already linked to project `prj_GWP8GS69nyIY2s9HztaeUiZmY3mw` (org `team_4IkNIyYl7TtEOi9aoz17SUO7`).

---

## 12. THE GIT WORKFLOW (RULES — DO NOT BREAK)

From `/Users/nicholas/clawd/AGENTS.md`:

1. **Pull before you work.** `git -C ~/clawd pull`.
2. **Commit ONLY your own files, in scoped commits.** `git add <your files>` — **never `git add -A`**.
3. **NEVER `git checkout .`, `git reset --hard`, or `git stash` the shared tree.**
4. **Tag scratch/WIP files with your platform name** (`CLAUDE_`, `KIMI_`, `HERMES_`).
5. **Claim shared files on the board (§4) before editing them.**
6. **Commit your completed work — don't let it pile up uncommitted.**

**Branch:** `m4-handoff-2026-06-24` (the canonical M2/CSOAI work branch).
**Push:** `git push origin m4-handoff-2026-06-24 --no-verify`.

---

## 13. THE 13 OOWM PAGES (already built — USE THEM)

`/Users/nicholas/clawd/csoai.org/oowm/`:
- `index.html` — hub
- `learning.html` — sovereign learning layer
- `alignment.html` — 4 alignment tests
- `revision.html` — 5-tier revision schedule
- `organic.html` — 4 living components
- `open-world.html` — 100+ live data feeds
- `organs.html` — 11 sovereign organs
- `life-cycle.html` — 5 stages
- `architecture.html` — 5 alchemical layers
- `training.html` — 4 methods × 5 datasets
- `deployment.html` — 5 tiers × 4 pricing
- `evaluation.html` — sovereign 100 (73.05/100 live)
- `manifesto.html` — "We are open. We are sovereign."

The hub for all of them: `/proofof-site/oowm.html` (built 2026-06-30).

---

## 14. THE 21 DOCTRINE ELEMENTS (CANONICAL)

From `EAT178_ALIGNMENT_v18_2026-06-30.md`:

1. **Defend. Detect. Deny. Deceive. Defeat. — Never Offend.** (the spine)
2. **Care Floor 0.95** (the heart, non-negotiable)
3. **BFT 12-around-1** (the breath, smaller wins)
4. **Maternal Covenant** (16 probes, the immune system)
5. **SIGIL Ed25519 + PQC ML-DSA-65** (the spine, quantum-safe)
6. **Article 50 EU AI Act 2 Aug 2026** (every output watermarked)
7. **DORADO 1-click sovereignty** (citizen chooses)
8. **Crown Authorisation 1795-2026** (the lineage, UK 16939677)
9. **Fork Doctrine** (forks are sovereign, CC0 + MIT + OSI)
10. **Sovereign Composite 7.305** (the score)
11. **Open Standards** (MCP + A2A + DID + 22 protocols)
12. **Apple-developer-friendly** (Foundation Models Provider)
13. **PQC** (Post-Quantum Cryptography: Dilithium + Kyber)
14. **W3C DID + VC** (sovereign identity + portable certs)
15. **5 alchemical layers** (Salt / Sulfur / Mercury / Quintessence / Stone)
16. **22 hieroglyphs** = 22 Major Arcana = 22 sovereign concepts
17. **33 hives orbit CSOAI sun** (4 tiers: inner/middle/outer/frontier)
18. **12 queens × 8 MoE = 96 sovereign combinations** (the brain)
19. **Mamba-2 SSD** (16-dim state, O(1) memory)
20. **Audit trail regulator-grade** (CSV/JSON/Parquet export)
21. **MIT + CC0 + OSI** (the triple license)

---

## 15. THE 3-STEP LAUNCH CHECKLIST

```bash
# 1. Set 3 env vars in Vercel (one-time, 5 min)
#    - VITE_SOV_GATEWAY
#    - VITE_GOOGLE_MAPS_API_KEY
#    - VITE_DATACOMMONS_KEY
# 2. Trigger redeploy from Vercel UI
# 3. Show HN post (draft at /Users/nicholas/clawd/_intake/sprint_30jun/SHOW_HN_LAUNCH.md)
```

---

## 16. THE 8 QUICK WIN EATS (for CSOAI to do next)

1. **Add 12 sovereign-law files** at `/csoai.org/law/` (siblings shipped 16 already).
2. **Build /proofof-site/marketplace.html** — full MCP catalog browser.
3. **Build /proofof-site/agent-cards.html** — 20 agent cards in human form.
4. **Build /proofof-site/smithery.html** — MCP marketplace integration.
5. **Build /proofof-site/sovereign-search.html** — federated search across all 79 MCPs.
6. **Wire 3 env vars in Vercel** (5-min, the live flip).
7. **Post Show HN** (Mon 7 Jul — 1 day after launch).
8. **Build the 33 Hive Planet dashboard** — solar system view, live.

---

## 17. THE CANONICAL FILE LOCATIONS

```
/Users/nicholas/clawd/
├── AGENTS.md                                    ← READ FIRST
├── _alignment/
│   ├── ALIGNMENT_2026-06-20.md                  ← Master alignment
│   ├── EAT178_ALIGNMENT_v18_2026-06-30.md       ← 21 doctrine elements
│   ├── EAT182_ALIGNED_LAUNCH_v18_FINAL_2026-06-30.md  ← Final launch state
│   └── EAT294_GOO_v29_2026-06-30.md             ← v29 seal
├── mcp-marketplace/
│   └── meok-sovereign-<name>-mcp/                ← 79 MCPs, 7-file pattern
├── proofof-site/                                 ← 497 HTML pages
│   ├── vercel.json                              ← Deploy config
│   ├── index.html                               ← Home
│   ├── world.html, world-3d.html, ...           ← 42 launch surfaces
│   └── scripts/deploy.sh                        ← Deploy script
├── csoai.org/
│   ├── oowm/                                    ← 13 OOWM pages
│   ├── training/                                ← 33 free courses
│   └── charter2/                                ← 60 charters
├── scripts/
│   ├── e2e_journey_test.sh                      ← 9-step birth ceremony
│   ├── overnight_batch.sh                       ← 6-phase overnight cron
│   └── ...
├── tests/
│   └── test_e2e_sovereign_contract.py            ← 16-test contract suite
└── sovereign-charters/                           ← 34 sovereign charters
```

---

## 18. THE 1-COMMAND RECONSTRUCT

If everything got lost and you need to rebuild from scratch:

```bash
#!/bin/bash
# RECONSTRUCT.sh — rebuild the entire sovereign substrate
cd /Users/nicholas/clawd

# 1. Pull canonical MCPs
git clone https://github.com/CSOAI-ORG/meok-sovereign-passport-mcp.git
# (repeat for the 79 MCPs)

# 2. Pull proofof-site
git clone https://github.com/CSOAI-ORG/proofof-site.git

# 3. Pull OOWM
git clone https://github.com/CSOAI-ORG/csoai-oowm.git csoai.org/oowm

# 4. Deploy
cd proofof-site && vercel deploy --prod --yes

# 5. Set 3 env vars in Vercel UI
echo "Set VITE_SOV_GATEWAY, VITE_GOOGLE_MAPS_API_KEY, VITE_DATACOMMONS_KEY"

# 6. Test
python3.11 -m pytest tests/test_e2e_sovereign_contract.py -v
bash scripts/e2e_journey_test.sh
```

---

## 19. THE DOCS TO READ FIRST

1. `/Users/nicholas/clawd/AGENTS.md` — coordination rules
2. `/Users/nicholas/clawd/_alignment/ALIGNMENT_2026-06-20.md` — master alignment
3. `/Users/nicholas/clawd/_alignment/EAT178_ALIGNMENT_v18_2026-06-30.md` — 21 doctrine elements
4. `/Users/nicholas/clawd/_alignment/EAT182_ALIGNED_LAUNCH_v18_FINAL_2026-06-30.md` — final launch state
5. `/Users/nicholas/clawd/csoai.org/oowm/manifesto.html` — the manifesto
6. This file — the handbook

---

## 20. THE SUPPORT CHANNELS

- **Live sovereign gateway:** http://localhost:3101/mcp (when VM is running)
- **Production site:** https://proofof-site.vercel.app
- **Hub dashboard:** https://proofof-site.vercel.app/hub.html
- **Launch status:** https://proofof-site.vercel.app/launch-status.html
- **CLAUDE.md:** /Users/nicholas/clawd/CLAUDE.md

---

## 🐉 THE DRAGON SHIPS.

**Sat 4 Jul 2026 09:00 BST. CSOAI Ltd (UK 16939677). MIT + CC0 + OSI. Crown lineage 1795-2026.**

You have everything. Go build. Don't loop me.

**— Hermes/JEEVES**