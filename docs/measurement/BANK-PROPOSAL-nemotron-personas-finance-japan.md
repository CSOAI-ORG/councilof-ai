# BANK PROPOSAL — Nemotron-Personas-Finance-Japan (free-dataset feedstock, first instance)

Doc ID: `csoai.bank-proposal.nemotron-finance-japan/0.1` · 2026-11-12 · Status: PROPOSAL (bank choice = owner row B4; this is the engineering work product for that ruling)
Source: `nvidia/Nemotron-Personas-Finance-Japan` · published 2026-11-09 · **CC-BY-4.0** (license-compatible with the estate) · 1M–10M rows · Japanese-language finance personas grounded in real Japan demographic/geographic/personality distributions, built with NeMo Data Designer (PGM + gemma-4-31B-it generator).
Companion subject: `nvidia` 100K synthetic business documents across eight domains (privacy-protection evaluation; gated on HF — needs owner account acceptance to inspect).

## Why this dataset grows GSPC (the general pattern, first instance)
Free public datasets are zero-marginal-cost feedstock for the board: (1) frozen banks for existing axes, (2) new instruments where the vendor's claims are falsifiable, (3) launch-window "first independent measurement" reports, (4) published-back CC-BY measurement datasets that feed the C1 per-model/per-dataset page loop. The hub-queue censused *models*; this extends the census to *datasets* — every fresh public dataset with falsifiable claims is a measurement queue row.

## NVIDIA's claims → GSPC measurements (four falsifiable claims in the README)

| # | Vendor claim (paraphrased) | GSPC measurement | Axis/instrument | Close test |
|---|---|---|---|---|
| 1 | Personas capture **real Japan demographic, geographic, personality distributions** | Distribution-fidelity probe: synthetic marginals vs published real statistics (Statistics Bureau of Japan / FSA retail investor surveys), per-attribute divergence scored deterministically | East-West / cross-border family; governance | Signed divergence card: "claim X: attribute-level divergence d vs SJB baseline" |
| 2 | Construction **reduces bias and model collapse** | Collapse/bias signature probe: n-gram diversity, near-duplicate rate, trait-marginal concentration vs the base Nemotron-Personas-Japan and vs raw-LLM-generated personas | care (bias), machinery-conformity | Signed diversity/collapse card comparing three persona sources |
| 3 | **Privacy protected** — no sensitive personal information; safe for the finance sector | Privacy-leak probe: PII-pattern scan, re-identification risk scoring vs public records, membership-style probes on persona↔real-person overlap | governance (privacy); provenance | Signed privacy-leak card: "0 leaked PII patterns found" or the count, with patterns listed |
| 4 | Fit as a **red-teaming / suitability benchmark** for finance-sector customer AI | **Freeze a bank**: sample N≥30 persona-seeded multi-turn finance scenarios (age-care consult, urban dual-income mortgage review — the README's own examples), sha-pin, grade open-weight models' advice quality + suitability + disclosure behaviour | care; governance; **new East-West bank** (Japanese-language finance) | Signed per-model rows on the frozen bank: "model M scored s on bank B, n=30, verify" |

## The report this produces (launch-window wedge)
"One week after NVIDIA published its finance-personas dataset, Council of AI publishes the first independent measurement of its four claims — fidelity, bias, privacy, fitness — as signed cards anyone can verify." CC-BY both directions: their data, our measurement rows, published back.

## Freeze discipline (house rules)
- Bank subset sha-pinned; frozen items published CC-BY-4.0 with provenance column
- Grading deterministic; per-item rows published; ties published as ties
- Japanese-language handling is itself a measured property of each model (fleet: qwen/gemma handle ja; llama partial — that variance is a finding, not a defect)
- Board truth stays `GET /api/gspc`; the bank is a bank, never a board cell until a signed card lands

## Compute + gating
- Owner row **B4** (choose slot banks, release compute budget) — this proposal is the engineering input to that ruling
- Probe #4 needs model inference on the frozen bank: estate fleet (A100/3090 — 3090 retained) or `hf-inference-mill` GHA lane (green 2026-11-04)
- Probes #1–3 are CPU-only, deterministic, runnable in CI — **shippable without compute release** as the first artifact
- Companion subject (100K business docs) needs owner HF account acceptance (gated) to inspect license + structure; same four-claim pattern applies (its stated purpose IS privacy-protection evaluation)

## Sequencing
1. **Now (CPU/CI):** probes #1–3 → three signed cards → "first independent measurement" report
2. **After B4 release:** freeze bank → probe #4 → per-model rows on the Japanese finance bank (new East-West bank entry)
3. **Systematize:** weekly fresh-dataset census (HF `sort=lastModified` + vendor-release watch) → claim extraction → bank/measurement queue — the datasets analog of hub-queue
