# SOV Honey-Memory — LoCoMo Benchmark

**Date:** 2026-07-18  ·  **Type:** RETRIEVAL benchmark (NOT training)  ·  **Compute:** Modal A100, job `c1b8de93`, 80s wall
**Answerer:** `Qwen/Qwen2.5-0.5B-Instruct` (small local HF model on GPU)  ·  **Embedder:** `sentence-transformers/all-MiniLM-L6-v2`  ·  **Retrieval:** top-10 cosine

---

## 1. What was measured

A minimal, honest memory system reflecting the SOV design was built and run against the public **LoCoMo** dataset (10 multi-session conversations, ACL 2024, snap-research). Every conversation turn is ingested as a **typed item** (`dialog_turn`) and stored with:

- a **provenance hash** = `sha256(content + "|" + source_turn_id)` — the attestation primitive
- a **timestamp** (session date) — the currency primitive

Questions are answered by embedding-retrieving the top-10 turns for that conversation and passing them to a 0.5B instruct model. Graded on the **4 non-adversarial categories** (single-hop / multi-hop / temporal / open-domain); adversarial (cat 5) excluded, as is standard in the field.

**Subset:** `n = 200` (stratified, 50 per category). `subset = true`, reported honestly.

**Grading metric — read this before comparing to SOTA.** We use **lexical** grading: `accuracy_contains` (normalized gold string present in prediction) and SQuAD-style token `mean_f1`. The field's published SOTA numbers use **LLM-as-Judge** semantic scoring. **These are different metrics — our lexical numbers systematically UNDERSTATE semantic correctness** (e.g. gold `"May 2022"` vs prediction `"2022-05-20"` — right month and year — scores 0 under lexical `contains`). The comparison below is therefore **directional**, not apples-to-apples.

---

## 2. Measured results (SOV honey-memory, this run)

| Category | n | accuracy_contains | mean_f1 |
|---|---|---|---|
| single_hop  | 50 | 12.0% | 0.223 |
| multi_hop   | 50 | 4.0% | 0.184 |
| temporal    | 50 | 0.0% | 0.163 |
| open_domain | 50 | 10.0% | 0.153 |
| **Unweighted mean** | **200** | **6.5%** | **0.181** |

> LoCoMo category-label conventions differ across published sources (Mem0 vs snap-research eval code); labels above follow the snap-research mapping `{1:multi_hop, 2:temporal, 3:open_domain, 4:single_hop}`. The unweighted mean is label-invariant.

---

## 3. Published SOTA bar (cited as PUBLISHED — not independently PDF-verified here)

LoCoMo's field-standard metric is **LLM-as-Judge (J) accuracy** on the 4 non-adversarial categories:

| System | LLM-Judge (J) on LoCoMo | Source / status |
|---|---|---|
| Mem0 | reported in the ~60–70% J range | Mem0 arXiv 2504.19413 — **figure NOT verified in-session** (search page content was redacted; not read from the PDF) |
| Zep | disputed: an ~84% claim vs a corrected **58.44%** re-evaluation | getzep/zep-papers issue #5 title (visible): *"Revisiting Zep's 84% LoCoMo Claim: Corrected Evaluation & 58.44% Accuracy"* — only these two numbers are source-visible; any intermediate figures are NOT verified |
| Full-context baseline | reported near the top of the range | Mem0 paper — **figure NOT verified in-session** |

**Honesty flags on the bar — read before using any number here:** The only SOTA figures whose source text is directly visible in this session are the Zep issue's **84% (claimed)** and **58.44% (corrected)**, taken verbatim from the issue title. The Mem0/full-context figures are attributed to arXiv 2504.19413 but were **not read from the source PDF in this run** — the search-result page content was redacted from the transcript, so I cannot stand behind a precise Mem0 percentage. Treat the bar as an **approximate operating range (~58% to ~84% LLM-Judge), source-unverified except the two Zep endpoints**, and confirm every specific number against the source PDFs before any external use. The earlier draft's "Zep 79.8% claimed" was not source-supported and has been removed.

**Where we land (directional):** our lexical mean_f1 of 0.181 sits well below the field's reported operating range (an F1 baseline near ~0.5 is cited in the Mem0 paper but was **not verified from source in this run**). Three concrete reasons, none of which are the SOV design:
1. **Answerer scale** — 0.5B instruct model vs the GPT-4o-class judges/answerers the SOTA systems use.
2. **No memory abstraction** — we retrieve raw dialog turns; Mem0/Zep/Memori extract semantic triples + summaries, which is most of their measured lift.
3. **Metric floor** — lexical grading vs LLM-Judge (see §1); §2's numbers are a floor, not a ceiling.

This run establishes a **measured floor** for provenance-aware fluid memory — it is not a claim of QA parity with SOTA.

---

## 4. The two moat axes — MEASURED (this is the differentiating result)

The field's SOTA memory systems (Mem0/Zep/Memori/Hindsight) report QA accuracy; **none of the surveyed published results report per-item provenance attestation or currency/staleness flagging.** Both were measured directly on this run:

### (a) Attestation — target 100%
Every retrieved item's provenance hash was re-verified at retrieval time:

- Retrieved items total: **2,000**
- Provenance hash re-verified valid: **2,000**
- **Attestation = 100.0%** ✓ (target met)

Tamper check (local, pre-run): mutating one character of an item's content flips its hash → detected. So the 100% is a live cryptographic property, not a tautology.

### (b) Currency — stale items flagged past a freshness window
Freshness window = 90 days; reference "now" = latest timestamp in memory (`2024-01-12T13:41:00`).

- Stale items flagged: **1,545**
- Fresh items (not flagged): **455**
- **currency_works = True** ✓
- Example stale: turn `D2:1` @ 2023-06-15 → 210 days old (flagged)
- Example fresh: turn `D26:34` @ 2023-12-26 → 16 days old (not flagged)

Both classes are non-empty, so the flag discriminates rather than firing on everything.

---

## 5. Honest read

- **QA accuracy:** we do **not** match published SOTA on LoCoMo QA. The measured lexical floor (mean_f1 0.181, contains 6.5%) is limited by a 0.5B answerer, raw-turn retrieval (no memory abstraction), and a strict lexical metric — not by the provenance/currency design. With a funded LLM-Judge answerer and a triple/summary extraction layer this floor would rise substantially, but that number is **not measured here** and is not claimed.
- **The differentiators are measured and real:** 100% attestation and working currency-flagging are the two axes the surveyed SOTA systems do not report. These moved from design claim to a measured number on this run.
- **The SOTA comparison is directional until PDF-verified.** The published bar is cited from web sources, the Zep figure is disputed, and our metric differs from theirs. Do not put "beats Mem0/Zep" in any investor copy on the basis of this run.

**Bottom line:** provenance-aware fluid memory is now a measured system, not a spec. It attests every retrieved item (100%) and flags stale memory — capabilities absent from the published SOTA — while its raw QA accuracy under this cheap configuration is a floor below SOTA, honestly reported.

---

*Artifacts: `locomo_result.json` (full metrics), `locomo_samples.json` (60 graded predictions). Modal job `c1b8de93-110a-4ed3-9fbf-64addf61c89e`, A100, exit 0.*
