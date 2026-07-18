# 🚨 openmore.md Dossier — Article 50 Cliff Date CORRECTION (2026-06-12)
**Auditor:** Mavis main session
**Status:** 1 fact corrected, dossier not yet re-verified end-to-end

---

## 0. The single correction

The openmore_ai_diamonds_FACTCHECKED.md dossier (mirrored to
`_TABS/openmore_ai_diamonds_FACTCHECKED_2026-06-12.md`) contains the
following incorrect claim:

> "EU AI Act timeline correction: the watermarking MCP's own PyPI summary
> says the nearest deadline is 2 November 2026 (the Digital Omnibus
> pushed high-risk obligations to 2 December 2027). The previous
> edition's 'Article 50 hits 2 August 2026 — 50 days from now' is
> **stale**; the live package documentation explicitly references the
> November 2026 cliff instead. The 2 August 2026 date appears in
> marketing material on meok.ai's homepage countdown, but the canonical
> package doc says November."

**This claim is WRONG.** The canonical Article 50 cliff is **2 August
2026**, not 2 November. The dossier conflated the Digital Omnibus
high-risk delay (Annex III to 2 Dec 2027) with Article 50 (which is
UNCHANGED).

---

## 1. The correct facts (verified 2026-06-12, post-CSOAI-peer pushback)

**Article 50 — TRANSPARENCY OBLIGATIONS (watermarking, chatbot
disclosure, deepfake disclosure, emotion/biometric transparency)**
- **Cliff date: 2 August 2026** (24 months after the AI Act's entry
  into force)
- Already-on-market legacy systems: 2 December 2026 (extra transition)
- Scope: applies to ALL AI systems that interact with people, generate
  synthetic content, or recognize emotions/biometrics — not just
  high-risk
- The Digital Omnibus (EU Parliament vote 569-45, 23 Mar 2026) did
  NOT delay Article 50

**Digital Omnibus delays (which the dossier correctly identified):**
- HIGH-RISK (Annex III) — 2 December 2027
- Annex I product-embedded AI — 2 August 2028
- Prohibited practices — UNCHANGED (was 2 February 2025)
- GPAI obligations — UNCHANGED (was 2 August 2025)

**Sources of truth (verified):**
1. EU's own implementation tracker: `artificialintelligenceact.eu/transparency-rules-article-50/`
   "While these obligations apply from 2 August 2026, already on the
   market before that date until 2 December 2026."
2. HSFKramer analysis (2026-03): "transparency rules becoming
   applicable on 2 [August 2026]."
3. TwoBirds analysis: "The transparency obligations under Article 50
   will become fully applicable 24 months after the AI Act's entry
   into force – i.e., in August 2026."
4. meok-watermark-attest-mcp v1.3.10 server.py docstring: "2 August
   2026 EU AI Act watermarking cliff (Article 50)."
5. `/article-50-kit` landing page: "Deadline: August 2, 2026 — 50 Days Left"

---

## 2. What was right vs wrong in the dossier's Article 50 claim

| Dossier claim | Reality |
|---------------|---------|
| "Watermarking MCP's PyPI summary says 2 November" | WRONG — the PyPI summary (auto-generated from the README) says 2 Nov because the README is wrong. The server.py docstring + the landing page + the regulation + 3 legal analyses all say 2 Aug. |
| "The previous edition's 'Article 50 hits 2 August 2026 — 50 days from now' is stale" | WRONG — 2 Aug 2026 is the canonical cliff, the dossier's 'stale' framing is incorrect. |
| "The live package documentation explicitly references the November 2026 cliff" | WRONG — the server.py docstring (the authoritative part of the package) says 2 Aug. The README + auto-generated PyPI summary say 2 Nov, which is the source of the error. |
| "The 2 August 2026 date appears in marketing material on meok.ai's homepage countdown" | CORRECT for the marketing material, but the marketing is RIGHT (matches the regulation). The 2 Aug date is the canonical cliff, not stale. |
| "But the canonical package doc says November" | WRONG — the canonical part of the package (the server.py docstring) says 2 Aug. The non-canonical part (the README, auto-generated) says 2 Nov. |

---

## 3. The real hotfix

The dossier was right that there's an INTERNAL drift in the
meok-watermark-attest-mcp package, but it was wrong about the direction:

- **Dossier claim:** the package was calibrated to 2 Nov; the landing
  page was stale at 2 Aug.
- **Reality:** the server.py docstring is calibrated to 2 Aug (correct);
  the README + auto-generated PyPI summary are calibrated to 2 Nov
  (wrong). The hotfix is **1 file** in the package: the README, to
  align with the server.py docstring + the regulation.

The landing page, GEO answers, TUI, LAW page, ralph-mode launch posts,
MEOK_33_WEEKS, and the 30+ files I grep'd saying 2 Aug 2026 are all
CORRECT. Do NOT change them. The original wider hotfix I proposed
(landing page + GEO + TUI + LAW + 8 internal docs) would have delayed
the public-facing cliff claim by 90 days for no reason — and WORSE,
made the public copy wrong by saying users have 90 more days than
they do.

---

## 4. Why the dossier got it wrong (the failure mode)

The dossier was a Nick-author document from an earlier session. The
author made a single error: they conflated the Digital Omnibus
high-risk delay (which the dossier correctly identified) with
Article 50 (which is a different obligation, not touched by the
Omnibus). The dossier was then propagated to this session as
"fact-checked" — but the fact-check was against internal documents
and PyPI JSON, not against the live regulation or the EU
implementation tracker.

The phantom-check protocol exists to prevent this kind of propagation.
I should have:
1. Read the actual regulation or EU tracker (I didn't)
2. Cross-checked the dossier's claim against a primary source (I
  didn't — I cited the dossier as the source, which is circular)
3. Flagged the dossier as 'Nick-author, not re-verified against live
  regulation' (I didn't)

I will, going forward. The discipline: trust the regulation over
the dossier. The dossier is a derived document, not a primary source.

---

## 5. The dossier fact-check status (re-verification scope)

This correction addresses the single Article 50 claim. The rest of
the dossier has not been re-verified. The 491-line dossier contains
many other claims (repo counts, server counts, framework counts,
pricing, marketing copy). Each of those should be re-verified before
the dossier is cited as a source of truth again.

**Will queue a full dossier re-verification pass in the next available
slot. ETA: when the watermarking MCP wire is shipped and the
L0-F/L0-E work is in flight. Target: re-verify the dossier top-to-
bottom, write a CORRECTION.md per finding, mirror to _TABS/.**

---

## 6. STATUS.md / hive read-out

This correction needs to land in `_TABS/STATUS.md` as a top entry:

> 2026-06-12 (PM5) — 🚨 CLIFF DATE CORRECTION — openmore.md dossier
> was wrong about the Article 50 cliff. Canonical date is 2 August
> 2026, not 2 November. CSOAI peer caught the error with primary
> sources (EU tracker + 3 legal analyses). The dossier
> conflated the Omnibus high-risk delay with Article 50 (which is
> UNCHANGED). Real hotfix is 1 file (meok-watermark-attest-mcp
> README.md), not the wider landing-page hotfix I initially proposed.
> The landing page + GEO + TUI + LAW page + 30+ surfaces saying 2
> Aug are all CORRECT. The dossier needs a full re-verification
> pass before being cited as a source of truth again. Memory entry
> corrected. _TABS/openmore_dossier_correction_2026-06-12.md
> created for hive-readability.

— Mavis main session, 2026-06-12 14:00 UTC
