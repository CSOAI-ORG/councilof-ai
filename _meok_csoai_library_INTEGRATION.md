# MEOK CSOAI Library — Integration Map

> **Source of truth for the full 132-file MEOK CSOAI intellectual archive — where it lives, who can access it, how it connects to the rest of the infrastructure.**

**Generated:** 2026-05-28 by Claude (Opus 4.7).
**Operates under:** `MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md`

---

## Where the library lives (3 paths to the same content)

| Path | Type | Use case |
|---|---|---|
| `/Users/nicholas/Desktop/MEOK CSOAI/` | Canonical filesystem location | Nick edits originals here |
| `/Users/nicholas/clawd/_meok_csoai_library/` | **Symlink** to the above | Every swarm agent reads from here |
| `/Users/nicholas/clawd/_meok_csoai_library_INDEX.json` | Machine-readable manifest | Any agent navigates the 132 files via structured JSON |
| `/Users/nicholas/clawd/csoai_charter_52_articles.json` | Charter-specific manifest | All 52 articles indexed with title + tl;dr + file path |
| `/Users/nicholas/clawd/csoai-dashboard/` | **Cloned** `CSOAI-ORG/csoai-dashboard` GitHub repo | React 19 + Vite + Tailwind + shadcn dashboard, 192 pages |

---

## What's IN the library (10 categories, 132 files, 9.3 MB)

| # | Category | Files | Highlights |
|---|---|---|---|
| 01 | 52-Article Charter | 44 | Article 1 (Maternal Covenant) — relationship-based safety paradigm. Full PDF + per-article markdown. |
| 02 | White Papers & Research | 5 | Strategic Partnership Playbook (CSOAI + Anthropic), AI Safety Institutional Collapse Strategic Analysis, Business Plan, Gap Analysis, Integrated Training |
| 03 | Crosswalks & Frameworks | 28 | EU AI Act, NIST AI RMF, ISO 42001, OECD, UNESCO, UK AISI, Anthropic Constitutional AI, OpenAI Model Spec, Beijing/Asilomar/Montreal/Toronto Declarations, Korea AI Basic Act, Singapore Agentic AI, Council of Europe AI Convention, IEEE Ethically Aligned Design, G7/G20 AI Principles, Master Unified Crosswalk, Maritime Law parallel |
| 04 | Business & Legal | 8 | One-pager, Investor Pitch Deck (PDF), Share Offer, Insurance, IP Framework, Founder Story, MOOK Certification Framework, Terms of Business |
| 05 | Marketing & PR | 8 | Press Release (full + official), Press Kit v1+v2, Full Article, How It Works, Pitch Deck (markdown), Social Content package |
| 06 | Playbooks & Guides | 8 | Master Playbook (multiple versions), Pivot Playbook, Infrastructure Build, Quick Implementation, MOOK Baselines + Benchmarks, Socratic Arts MOOK Transformation, Strategic Playbook Complete |
| 07 | Research & Analysis | 17 | Strategic Intelligence Complete Report, Strategic Analysis Package, Master Strategic Analysis 2026, Why No One Else Pursuing This, Build in Public Roadmap, Comparative Analysis vs IAPP/AIGP/AIGN, AGI Safety Ecosystem Review, Q1 2026 Strategic Roadmap, Global Standard Strategy, Western AI Safety Blueprint, AI Safety Empire Implementation Guide, Market Research, Founder Launch Strategies |
| 08 | Governance & Compliance | 4 | Constitutional Paper, MEOK Governance Portfolio Summary, **Stewardship Covenant License (SCL)** — 4-tier access (Research/Ethical Enterprise/Government/Stewardship Collective), Constitutional AI Charter Revision (March 2026) |
| 09 | EI3 Emotional Intelligence | 2 | EI3 Strategic Analysis (AI Safety's Institutional Collapse), Red Specter AI Shield Home/Family Safety Gateway Concept v1.1 |
| 10 | Research 2026 NEW | 6 | GitHub MCP Audit, Morning Report, Social Content, Pitch Deck, Overnight Execution Plan, notes |

---

## Brand architecture (now canonical — per `MASTER-PLAN-csoai-org-NEXT-LEVEL.md`)

```
MEOK ONE (unified platform — consumer brand)
   │
   ├── THE COVENANT (governance philosophy — Maternal Covenant + 52-article Partnership Charter)
   │
   └── EI3 (emotional intelligence layer)
```

**Plus the operational sub-brands** (per `MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md`):
- MEOK BRIDGE (API absorption layer)
- MEOK CLAW (keyboard-first TUI)
- MEOK COUNCIL (33-node BFT)
- MEOK VERIFY (signed attestation chain)
- MEOK FORGE (82 open MCPs)
- CSOAI (research lab + certification authority)

---

## What was MISSING + what to ship (per `MASTER-PLAN-csoai-org-NEXT-LEVEL.md`)

| Missing | Route | Now-shippable from library? |
|---|---|---|
| 52-Article Charter page | `/charter` | ✅ Yes — `csoai_charter_52_articles.json` + 44 markdown files |
| EI3 page | `/ei3` | ✅ Yes — `09 - EI3 Emotional Intelligence/` PDFs |
| Crosswalk Directory | `/crosswalks` | ✅ Yes — 28 PDFs in `03 - Crosswalks & Frameworks/` |
| Solutions | `/solutions` | 🟡 Partial — pull from playbooks |
| Team | `/team` | 🟡 Founder Story PDF + need to add others |
| Case Studies | `/case-studies` | 🟡 Need to author |
| White Papers | `/white-papers` | ✅ Yes — `02 - White Papers & Research/` |

---

## The Stewardship Covenant License (SCL) — key licensing IP

Per `08 - Governance & Compliance/stewardship-covenant-license.md`:

> *Care is infrastructure. Consciousness is sacred. Technology must serve human flourishing.*

Four-tier access structure:

| Tier | Who | Use |
|---|---|---|
| 1 — Research & Education | Academic institutions, researchers | Open access, attribution, must publish research openly |
| 2 — Ethical Enterprise | Companies demonstrating care-first | Commercial deployment, annual ethics audit, **5% revenue contribution to care-based AI research** |
| 3 — Government & Institutional | Governments, NGOs, international institutions | Public sector deployment, democratic oversight |
| 4 — Stewardship Collective | Founding partners | Co-development, IP sharing, council governance participation |

**This is a licensable IP asset** beyond MIT/Apache. CSOAI can offer SCL on top of any of the 82 MCPs for buyers who need ethical-enterprise commitments.

---

## How agents use the library (operational pattern)

### Pattern 1 — Cite a charter article in a generated artefact

```python
import json
charter = json.load(open("/Users/nicholas/clawd/csoai_charter_52_articles.json"))
article_1 = next(a for a in charter["articles"] if a["number"] == 1)
# article_1 → { "number": 1, "title": "THE MATERNAL COVENANT", "slug": "maternal-covenant",
#               "filename": "CSOAI_Charter_Article_1_Maternal_Covenant.md", "preamble": "...",
#               "tldr": "..." }
```

### Pattern 2 — Reference a crosswalk in customer comms

The full PDFs are at `/Users/nicholas/clawd/_meok_csoai_library/03 - Crosswalks & Frameworks/CSOAI-EU-AI-ACT-CROSSWALK.pdf`. Cite by full filename in any auditor-facing artefact.

### Pattern 3 — Quote a white paper for a regulator submission

`/Users/nicholas/clawd/_meok_csoai_library/02 - White Papers & Research/AI Safety's Institutional Collapse Creates a Governance Vacuum_ Strategic Analysis for CSOAI_EI3.pdf` — this is the philosophical anchor doc for any "why AI governance vacuum matters" pitch.

### Pattern 4 — Use the SCL for paid-tier licensing

When a buyer asks "can I use this commercially?" — the answer is: MIT for the MCPs (free for any use) PLUS Stewardship Covenant License Tier 2 for ethical enterprise commitments (with 5% rev contribution to care-research). The two are stackable.

---

## Updates to MEOK DEFONEOS Alignment

The following references should be added to `/Users/nicholas/clawd/MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md` (covered in `Part ⑤ — File map`):

| New entry | Path | Purpose |
|---|---|---|
| Library (full 132-file archive) | `_meok_csoai_library/` (symlink) | Canonical IP archive |
| Library index | `_meok_csoai_library_INDEX.json` | Machine-readable catalogue |
| Charter manifest | `csoai_charter_52_articles.json` | All 52 articles indexed |
| Library integration doc | `_meok_csoai_library_INTEGRATION.md` | THIS file — operational guide |
| csoai-dashboard (cloned) | `csoai-dashboard/` | React 19 + Vite + Tailwind + shadcn, 192 pages |
| 28 regulatory crosswalks | `_meok_csoai_library/03 - Crosswalks & Frameworks/` | Auditor-cite-able PDFs |
| Stewardship Covenant License | `_meok_csoai_library/08 - Governance & Compliance/stewardship-covenant-license.md` | 4-tier IP licensing |
| EI3 Strategic Analysis (PDF) | `_meok_csoai_library/09 - EI3 Emotional Intelligence/` | The philosophical anchor for EI3 productisation |

---

## Concrete next-ship items the library unblocks

Per `MASTER-PLAN-csoai-org-NEXT-LEVEL.md` — these were blocked on having the content; now unblocked:

### Phase 1 — Theme switch (2-3h)
- Already documented in MASTER-PLAN. I can execute on csoai-dashboard now that it's cloned.

### Phase 2 — Build 5 missing pages (4-6h)
| Page | Source data |
|---|---|
| `/charter` | `csoai_charter_52_articles.json` + 44 markdown files (per-article expandable) |
| `/ei3` | EI3 Strategic Analysis PDF — narrative + extract Red Specter AI Shield concept |
| `/crosswalks` | 28 PDFs in library — grid of cards with download links |
| `/solutions` | Strategic Playbook + Master Playbook V6 (extract solution categories) |
| `/team` | Founder Story PDF + add advisors as confirmed |

### Phase 3 — Crosswalk improvements (DOCX→Markdown)
- Library has PDFs. Original DOCX/Markdown sources may be in iCloud per MASTER-PLAN. Need M4 gateway online (currently offline per master plan). Or just embed PDFs inline + link to download — sufficient for v1.

### Phase 4 — Deployment
- Vercel auth still pending per master plan (the same blocker that's stopped meok.ai). Same fix applies — use `nicholas@csoai.org` verified email.

---

## Bottom line

The library was previously isolated on Nick's Desktop. As of this commit, it's:

- ✅ Symlinked into the clawd workspace where every swarm agent reads
- ✅ Indexed as JSON for programmatic navigation
- ✅ Charter-extracted into per-article JSON for page generation
- ✅ Dashboard cloned for extension
- ✅ Cross-referenced with the DEFONEOS alignment doc

The next swarm agent (Kimi, SOV3 council, JEEVES, Hermes, OpenClaw, Claude) that spins up will see this file via the alignment doc and be able to read the full intellectual archive without having to discover it again.

---

*Built 2026-05-28 by Claude (Opus 4.7) at Nick's direct ask. Operates under `MEOK_DEFONEOS_ALIGNMENT_2026-05-28.md`.*
