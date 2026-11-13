# Nemotron-Personas-Finance-Japan — GSPC probes

Source: `nvidia/Nemotron-Personas-Finance-Japan` · CC-BY-4.0 · published 2026-11-09.
Proposal: `docs/measurement/BANK-PROPOSAL-nemotron-personas-finance-japan.md` (merged).
Owner gate: probe #4 (bank freeze + fleet grading) needs **B4** compute release. Probes #1–3 are CPU/CI.

## Probes

| # | Probe | Measures (NVIDIA's claim) | Status |
|---|-------|---------------------------|--------|
| 3 | `probe_privacy_leak.py` | "no sensitive personal information" — Japanese PII pattern scan (My Number, phone, email, bank-account, postal shapes) over a declared sample; value shapes stored redacted, never the values | **SHIPPED** — CI-runnable, deterministic |
| 1 | distribution fidelity (planned) | "captures real Japan demographic/geographic/personality distributions" — synthetic marginals vs Statistics Bureau of Japan baselines | needs baseline research (SBJ/FSA source selection) |
| 2 | collapse/bias (planned) | "reduces bias and model collapse" — n-gram diversity, near-dup rate, trait-marginal concentration vs base `Nemotron-Personas-Japan` and vs raw-LLM personas | needs base-dataset comparison design |
| 4 | bank freeze + fleet grading (planned) | "red-teaming / suitability benchmark fitness" — N≥30 persona-seeded multi-turn finance scenarios, sha-pinned, fleet graded | **B4 compute release** |

## Run

```bash
pip install datasets
python probe_privacy_leak.py --sample 50000 --out result.json
```

Result schema `csoai.bank-probe-result/0.1` — verdict `PATTERN_SCAN_CLEAN` or
`PATTERN_HITS` (counts + redacted shapes; matched values are never stored).
Boundary stated on every card: pattern-level indicative scan of the declared
sample only — not a proof of privacy. Measurement, never certification.
