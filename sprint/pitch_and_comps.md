This is a writing task, not a code task. The CLAUDE.md instructions about reading LLM/Anthropic provider files don't apply here — there's no file to read, and the "Fable" reference in my task is an export-control news event, not the Anthropic codename. Let me produce the deliverable directly.

# CSOAI — Investor Narrative + Comps & Sizing
**Seed / early-A · 2026**

---

## 1 · The Problem — single-model and single-vendor dependency is now a *proven*, *priced* risk

Enterprises and governments are wiring critical workflows to a single model behind a single vendor. That is now a demonstrated continuity risk, not a hypothetical:

- **The Fable export-control suspension** showed that a model you depend on can become unavailable overnight for reasons entirely outside your control — policy, export licensing, geopolitics — with no portability and no recourse. *(Source quality: news/event-level. Cite the specific dated report in the data room; do not paraphrase the mechanism beyond "access was suspended.")*
- The compliance frameworks that are **actually in force today** already demand operational resilience and third-party-verifiable controls:
  - **DORA** — in force **17 Jan 2025** (ICT third-party / concentration risk). *(Verified, dated.)*
  - **NIS2** — in force. *(Verified.)*
  - **EU AI Act Article 50** transparency obligations — live **2 Aug 2026**. *(Verified, dated.)*
  - Note for honesty: EU AI Act **high-risk** obligations are **postponed to 2 Dec 2027 / 2 Aug 2028**. We do **not** run an "Aug 2026 high-risk countdown." *(Verified — explicitly correcting a common pitch error.)*

The gap: today's AI-governance tooling asks the buyer — and the buyer's regulator — to *trust the vendor's word* that a control fired. Symmetric/server-side attestation can be replayed, forged, or simply re-asserted by whoever holds the key.

---

## 2 · The Wedge — sovereign, offline-verifiable, third-party-verifiable attested governance

The one thing a regulator or investor can check **without trusting us**.

- Verdicts from a governed multi-agent run are signed with **local Ed25519 asymmetric keys**, batched into a **Merkle tree**, and anchored to **Bitcoin via OpenTimestamps** (the "SIGIL chain"). *(Built — `sigil_anchor.py`. In-simulation scope.)*
- **Asymmetric + local** means a third party verifies a signature and a timestamp **offline**, with no call back to us, no shared secret, and **no single-vendor dependency**.

| | CSOAI | Microsoft Agent Governance Toolkit | Asqav |
|---|---|---|---|
| Signing | **Local Ed25519 (asymmetric)** | Symmetric HMAC | Cloud / server-side |
| Third-party verifiable without trusting issuer | **Yes** | No (shared secret) | No (vendor holds signing) |
| Offline verifiable | **Yes** | No | No |
| Single-vendor dependency | **None** | Microsoft | Asqav cloud |

*Honesty note: this comparison is on the verifiability property, which is architectural and demonstrable. It is not a claim of feature parity across every governance surface those products cover.*

---

## 3 · The Proof — the Policy Lab

The product is not a chatbot and not a "town." It is a **policy laboratory**: each simulated town is a **control-vs-treatment compliance experiment** — governed cohort vs ungoverned cohort, same task, same models.

- A **King hive** runs A/B model competitions on **local Ollama** (llama3.1:8b vs gemma3:4b, judged by falcon3:7b). Only **decisive, parsed verdicts** are recorded as `attestable=true`; ties are re-judged and recorded as `winner="TIE"`. *(Built; in-simulation scope.)*
- Every attestable verdict is signed and anchored. A proven policy can then be **auto-scaled** across towns, with the proof of *why it was adopted* cryptographically preserved.

**Scope discipline:** every metric here is **in-simulation**. No production-traffic claims, no efficacy numbers presented as field results. Sovereign inference = **local Ollama**, not pooled/free APIs.

---

## 4 · The Comps & Sizing

### Verified comparables (use ONLY these)

| Company | Round | Amount / valuation | Date | Source quality |
|---|---|---|---|---|
| **Vijil** | Seed | **$17M** | **Nov 2025** | Verified, dated — **lead with this** (closest, most recent AI-trust comp) |
| **Braintrust** | A → B | **$36M A → $80M B @ $800M post** | — | Verified |
| **Credo AI** | Series A | **$12.8M** | **2022** | Verified, dated (older — discount for vintage) |

> **Excluded — trap comp:** **Axiom Quant $1.6B** is deliberately **NOT** used for sizing. It is a category/stage mismatch that inflates expectations; citing it damages credibility. *(Explicit exclusion per honesty register.)*

### Round envelope (Carta / CRV reference data)

| Parameter | Figure | Source quality |
|---|---|---|
| Seed size | **~$4M** | Benchmark envelope (Carta/CRV-style) — *directional, not a guarantee* |
| Seed dilution | **19–20%** | Same |
| Series A size | **$5–15M** | Same |
| Series A dilution | **~18%** | Same |
| Series A ARR baseline | **$1–2M ARR** | Same |
| AI Series-A valuation premium | **+38%** | Benchmark observation — *applies to valuation, not a promise of terms* |

### TAM

> **TAM: UNSOURCED.** Any total-addressable-market figure in this deck is **not independently sourced** and is labelled as such. We do not lead with a TAM number, and we do not present one as verified. *(Per honesty register: no inflated TAM.)*

---

## 5 · The Ask & the Milestone

**Raising ~$4M seed (≈19–20%)** to convert the built SIGIL/Policy-Lab stack into a production deployment with a regulated design partner.

**What actually de-risks this raise — and what we are explicitly *not* claiming:**

- The fundable milestone is a **design partner using this in production who will take a reference call** — **not a demo**, not a video.
- **Video / short-form is top-of-funnel awareness only.** We do **not** claim it converts for B2B (no audited evidence it does); we measure **first-party signal — waitlist, demo requests, inbound — via UTM only.**

**Use of funds:** harden local-signing + anchoring for production; stand up the first design-partner deployment to reference-call stage; close DORA/NIS2/Article-50 mapping so the attested ledger is audit-ready.

---

### Source-quality legend
- **Verified, dated** — confirmed fact with a date (DORA, Article 50, Vijil, Credo).
- **Verified** — confirmed, date not load-bearing (Braintrust, NIS2).
- **Benchmark/envelope** — directional market reference (Carta/CRV figures, +38% premium); not a term guarantee.
- **News/event-level** — Fable export-control suspension; cite the specific dated report in the data room.
- **Unsourced** — TAM. Labelled, not relied upon.
- **In-simulation** — all King-hive / Policy-Lab / SIGIL metrics are simulation-scope, not field results.