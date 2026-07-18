# SOV3 → SOV3³ Release Infrastructure — Alignment Check (2026-07-12)

**Question answered:** what does an AI lab put in place when it ships a model (website, glossary,
FAQ, dev docs, wiki, database, whitepapers) — and does MEOK/CSOAI/SOV3 have all of it, so a real
SOV3 (OWM) release followed by a SOV3³ (OWEM) release is actually ready to go.

**Sequencing check (answered directly):** SOV3 first, SOV3³ second is the right order. SOV3 is the
single sandwich-architecture OWM (open weights + sovereign signed substrate). SOV3³ is that SAME
substrate reconfigured into a governed multi-brain topology (your docs: "4 configs around 1 OOWM",
more recently the 3-around-1 / pyramid shape: 2 small + 1 med + 1 large). You cannot govern a
topology of brains before the base brain exists and is stable. Release SOV3, THEN layer SOV3³ as
the emergent governed-ensemble product on top.

---

## The 14-item checklist, honestly scored

| # | Component | Status | What's really there |
|---|---|---|---|
| 1 | Website / landing page | 🟢 RUNNING | www.csoai.org, claims-e2e 12/0 verified. Covers the governance PRODUCT well — no dedicated SOV3/SOV3³ *model* landing page yet, distinct from the platform pages. |
| 2 | Model card | 🟡 STALE | `SOVEREIGN_1_MODEL_CARD_HUGGINGFACE_READY` (2026-07-09) describes a QLoRA fine-tune whose GATE 2 (real A100 run) was never confirmed complete in any later doc. Don't cite it as current. |
| 3 | System / safety card | 🔴 MISSING | No SOV3/SOV3³-specific safety-eval doc. The 7 governance NNs are a start (3 strong / 4 weak) but they're governance SIGNAL models, not a safety eval of the base OWM. |
| 4 | Technical whitepaper | 🟡 PARTIAL | `GROWTH_BY_ACCRETION_PARADIGM` (2026-07-12) is a strong, honest one-pager — every claim measurable — but not formatted/published as a citable whitepaper (no PDF, no arXiv). |
| 5 | Glossary | 🟢 RUNNING | `Glossary.tsx`, 1,378 lines, live at `/glossary`. Verify it defines OWEM/SIGIL/BFT-33/care-floor specifically, not just AI-Act terms. |
| 6 | FAQ | 🟢 RUNNING | `FAQ.tsx`, 846 lines, live at `/faq`. Same check needed — SOV3-specific questions vs platform-only. |
| 7 | Developer / API docs | 🟢 RUNNING | `ApiDocs.tsx`, 508 lines, live at `/api-docs`; `csoai-governance-mcp@0.1.0` published to npm, working one-liner install. |
| 8 | Model registry / weights | 🔴 MISSING | No confirmed live HuggingFace repo. SOV3's real serving path is a 3-tier cascade (Oracle GenAI llama-3.3-70b → Ollama → offline) — a real, verified INFERENCE endpoint, not a published/downloadable model artifact. |
| 9 | Wiki / knowledge base | 🔴 MISSING (biggest gap) | The `_alignment/` tree (100+ dated docs) genuinely IS a wiki in substance — but it's a private git folder on one Mac, not a browsable site anyone else (investor, hire, partner) can read. |
| 10 | Component database / registry | 🟡 FRAGMENTED | Real registries exist (378-tool MCP catalog, all-frameworks-verified ground-truth, 2,363-lead DB, 70-entry model registry) — but scattered across separate files, no single queryable index. |
| 11 | Benchmark / eval results | 🟡 PARTIAL, HONEST | Governance-topology sweeps are real and measured (20 configs × 60-item battery). Capability vs frontier (GSM8K/MMLU) is explicitly flagged UNMEASURED — still needs the gated GPU run. |
| 12 | License | 🟡 PARTIAL | Component-level license hygiene is genuinely done (Apache-2.0/MIT verified for CesiumJS/Godot/llama.cpp; AGPL trap flagged for the paid tier). No confirmed top-level SOV3/SOV3³ license — the stale Sovereign-1 card's AGPL/MIT/BSL split was never confirmed shipped. |
| 13 | Community / support channel | 🔴 MISSING | No public Discord / GitHub Discussions / forum found for SOV3/CSOAI. |
| 14 | Governance / safety policy | 🟢 STRONG — this IS the product | Charter Article 0, 41 charters / 7-layer federation, care-floor 0.95 hard-gated (measured containment 1.00 across every topology tested). This is the actual differentiator vs a normal model release — most labs don't have this at all. |

**Score: 5 green / 5 yellow / 4 red**, out of 14. The pattern: everything **outward-facing on the
existing CSOAI platform** (website, glossary, FAQ, API docs) is real and live. Everything
**model-specific** (model card, system card, weights registry, wiki, benchmark) is either stale,
partial, or missing. That's the honest gap between "we have a governance platform" (true, shipped)
and "we have a released model" (not yet, several real pieces missing).

---

## What this means practically for SOV3 → SOV3³

### Before SOV3 (the OWM) can be called "released"
1. **Confirm or redo the model-card status.** Either the GATE 2 QLoRA fine-tune actually completed
   (check `~/.sovereign` on the Mac / Vast.ai billing) and the card gets updated with real scores,
   or it didn't and the card needs rewriting around what's ACTUALLY serving today: the Oracle
   GenAI llama-3.3-70b cascade, which is real, live, and independently verified — that's a
   legitimate, honest "SOV3 v1" story even without a from-scratch fine-tune.
2. **Write the safety/system card.** This is the one glaring red flag for anything calling itself
   a model release. Even a short one — red-team results against the care-floor, refusal-rate
   sample, what the 7 governance NNs catch and don't — is standard practice and you're the
   governance company; not having one is the worst possible gap for you specifically.
3. **Publish the whitepaper.** `GROWTH_BY_ACCRETION_PARADIGM` is already the right spine — format
   it as a PDF/arXiv-style doc, it's honest and citable as-is.
4. **Decide + state the license**, top-level, once — not per-component.

### Before SOV3³ (the OWEM) layers on top
5. The governance-topology work (SOV333_SETUP_RECOMMENDATION, decorrelation-law triple-confirmation)
   is genuinely strong and ready to be the SOV3³ pitch — diverse-lineage beats identical, containment
   is topology-independent, SIGIL-rejection is measurably necessary. This is real, differentiated
   research. It just needs the capability benchmark (Kaggle GSM8K/MMLU) to pair with it before
   claiming anything about SOV3³ vs frontier models.
6. **Turn the `_alignment/` wiki into something a hire, investor, or partner could actually read.**
   This is the single highest-leverage fix: publish an internal (or public, redacted) knowledge
   base site from the existing `.md` tree — the content already exists and is unusually honest;
   it just isn't reachable by anyone but you.

### Lowest-effort, highest-value next steps (in order)
1. Resolve the model-card status (confirm GATE 2 or rewrite around the real Oracle cascade) — 1 doc.
2. Write a short, honest SOV3 system/safety card — pairs naturally with the existing SystemCard.tsx
   pattern you already ship for the governance product.
3. Format GROWTH_BY_ACCRETION_PARADIGM as a public whitepaper PDF.
4. Stand up a browsable wiki from `_alignment/` (even a static site generator over the existing
   .md files gets you 90% of the way for very little new writing).
5. State one top-level license and stop deferring it.
