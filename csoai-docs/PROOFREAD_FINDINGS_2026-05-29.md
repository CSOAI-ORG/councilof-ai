# Proofread + IPO-Readiness Findings — 2026-05-29

Full read of the white papers + IPO docs + a banned-term/consistency scan across the research corpus. **Nothing was silently edited** — the items below are facts only you can resolve (getting geography or legal-entity wrong in an investor doc is worse than flagging it). Ordered by severity.

---

## 🚨 P0 — Must fix before any IPO/investor/grant use

### 1. Banned terms live in the research archive (NOT in the white papers — but quarantine them)
- **`_TOPOLOGY/RESEARCH/` contains 13 files referencing CSGA / James Castle / Terranova** (old April-2026 audits).
- ✅ **The 3 white papers + both IPO docs are CLEAN** — none of these terms appear there.
- **Action:** the `_TOPOLOGY/RESEARCH/` archive must NEVER be included in an IPO data room or shared corpus. Either purge those 13 files or move them to a clearly-marked `_archive/severed/` that's excluded from everything. (Your memory: these ties are severed — a diligence reviewer finding them would raise questions you don't want to answer.)

### 2. Geographic self-contradiction in the capillary-cooling white paper
- `whitepaper_capillary_cooling.md` §4 states the testbed is at **"latitude approximately 27°S," "Australian summer conditions," peak solar ">1,000 W/m²."**
- **Everything else** — the sovereign-AI-safety paper (MoD/Dstl/DSIT), `EXECUTION_PLAN.md` (Innovate UK, UKRI, CAA SORA, UKAS), and your current base (Lincolnshire, UK ~53°N) — is **firmly UK**.
- **This is the single most damaging inconsistency for IPO/grant diligence:** two of your own documents place the company on different continents.
- **Action (yours — I won't guess):** confirm the testbed location. If UK: change to ~53°N, "UK summer," peak solar ~800–900 W/m², drop "Australian." If genuinely AU: then the UK-grant framing elsewhere needs a story. **Tell me which and I'll correct it consistently across all docs in one pass.**

### 3. Legal-entity name has 3 variants — pick ONE canonical
- Counted across `csoai-docs/`: **"MEOK AI Labs" ×283, "MEOK LABS Ltd" ×75, "CSOAI Ltd" ×1.**
- Per your records the registered entity is **CSOAI LTD (UK Companies House 16939677), trading as MEOK AI Labs.** "MEOK LABS Ltd" is **not** the registered name — in a white paper byline that's a factual error.
- **Action:** standardise. Recommended pattern: byline = *"Nicholas Templeman, CSOAI LTD (trading as MEOK AI Labs)"*; body prose = "MEOK AI Labs." Confirm and I'll sweep all docs.

---

## ✅ What's STRONG (no change needed)

- **`whitepaper_sovereign_ai_safety.md`** — excellent. UK-aligned (AISI, Bletchley, Seoul/Paris, MoD/Dstl/DSIT), real policy argument (cloud-dependent eval → sovereign physical eval facilities → PAEC programme). Grant/IPO-grade. Minor: the "MEOK LABS Ltd / MEOK AI Labs.org" byline needs the entity fix (#3).
- **`IPO_VALUATION_PATH_2026-05-28.md`** — honest and correct. Opens with "CSOAI LTD is not IPO-able today, and that's normal," real 10-20× ARR multiples, MRR-gated staircase, an explicit "what would destroy valuation" section. **This is the un-inflated framing to keep** (contrast the prior Kimi plan your memory flagged as fictional). Leave as-is.
- **`whitepaper_capillary_cooling.md`** — technically credible and well-argued (IEC 61508, ISO 10218-1, capillary vs heat-pipe vs active-loop trade-offs). The *engineering* is sound; only the *geography* (§4) and *byline entity* are wrong.

---

## ⚠️ P1 — IPO-readiness gaps (additive, not errors)

These aren't mistakes in existing docs — they're documents an IPO/data-room expects that don't exist yet:
1. **IP assignment deed** — founder → CSOAI LTD assignment of all code/IP. The IPO doc itself flags this; it's the #1 valuation-protector and it's not on disk.
2. **Cap table** — even at 100% founder ownership, a formal one.
3. **A unified "research index"** — one doc listing every white paper + dataset + claim with provenance, so a reviewer (or SOV3) can navigate the corpus. *I can build this now.*
4. **Claims-provenance check** — the capillary paper cites "field validation data" and "preliminary instrumented testing." For IPO, either back those with real test logs or soften to "proposed validation methodology." Unbacked empirical claims are a diligence risk.

---

## SOV3 access (done this session)
All 3 white papers ingested into SOV3 memory (tagged `whitepaper`, `research`, `ip_corpus`) so the council/agents can reason over them — see the ingestion log. This means SOV3 can now answer questions about your own research, and the Daily Eat keeps the surrounding literature current.

---

## What I need from you (3 decisions unlock a clean sweep)
1. **Testbed location** — UK or AU? (resolves #2)
2. **Canonical entity name** confirmed? (resolves #3 — I'll sweep all docs)
3. **Purge or archive** the `_TOPOLOGY/RESEARCH/` severed-term files? (resolves #1)

Give me those and I'll do a single consistent correction pass across every document, then regenerate the research index. I won't guess on investor-facing facts.
