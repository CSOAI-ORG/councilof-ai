# CSOAI — CLAIM MATERIALITY ADJUDICATION SHEET · wave 3 (2026-10-28)

**What this is.** Wave 3 re-read the same 77 public claim URLs and compared the extracted visible text
against the wave-2 digest captured on 2026-10-27. For the first time in the estate's history the delta is
**attributable**: wave 1 captured no text digest and is not retro-fittable; wave 2 captured one; wave 3 uses it.

**32 of 77 monitored claims changed their visible text in 24 hours**; 45 were byte-and-text identical. A text change is a *candidate* material
change. Materiality is a human call, and **no third party is named from a delta** — the estate's own rule.

**How to mark it.** For each row write one of `MATERIAL` (the claim itself changed and the change matters),
`CHURN` (the text moved but the claim did not), or `WITHDRAWN` (the page is gone). Add a short note if you
want the reason recorded. Save the marked sheet back beside this file and it becomes the adjudication record.

| # | subject | axis | wave2 text sha256 | wave3 text sha256 | status | your mark | your note |
|---:|---|---|---|---|---|---|---|
| 1 | OpenAI | lab-practice | `796dcb89e5fb` | `9e17b254dc75` | TEXT_CHANGED |  |  |
| 2 | Google DeepMind | lab-practice | `cbcacc9a1e0b` | `53a3b2a437ba` | TEXT_CHANGED |  |  |
| 3 | Microsoft AI | lab-practice | `79471b1bb071` | `d25acb50f222` | TEXT_CHANGED |  |  |
| 4 | xAI | lab-practice | `` | `da221a475c99` | TEXT_CHANGED |  |  |
| 5 | Stability AI | lab-practice | `dbed3c1e2107` | `62ecae5b3442` | TEXT_CHANGED |  |  |
| 6 | Hugging Face | lab-practice | `f4404f417705` | `fcba3cf67e2d` | TEXT_CHANGED |  |  |
| 7 | Cerebras | lab-practice | `ea34d7c5593b` | `87813eabfff5` | TEXT_CHANGED |  |  |
| 8 | Scale AI | lab-practice | `a939a4db7cf1` | `98d1c46d2896` | TEXT_CHANGED |  |  |
| 9 | Fireworks AI | lab-practice | `6544d9e0808c` | `48e4f28aafb6` | TEXT_CHANGED |  |  |
| 10 | Hugging Face Trust | lab-practice | `f4f5e8ee18ee` | `d309b6827a38` | TEXT_CHANGED |  |  |
| 11 | UK CMA | regulator-transparency | `2fe16928f27e` | `f4264a1a09ae` | TEXT_CHANGED |  |  |
| 12 | Ofcom | regulator-transparency | `2f380aa05b3f` | `cda86a51dde0` | TEXT_CHANGED |  |  |
| 13 | MHRA | regulator-transparency | `3ac6210647c7` | `1dcc37fdecdc` | TEXT_CHANGED |  |  |
| 14 | DSIT | regulator-transparency | `a47da623a9c6` | `f611e676bf48` | TEXT_CHANGED |  |  |
| 15 | Bank of England | regulator-transparency | `eddb1dbeeb8a` | `d00ad4dd1b16` | TEXT_CHANGED |  |  |
| 16 | Ofgem | regulator-transparency | `57a293fb97a4` | `84fa4b5e2432` | TEXT_CHANGED |  |  |
| 17 | CQC | regulator-transparency | `5c2110e22d8b` | `1e76876803dd` | TEXT_CHANGED |  |  |
| 18 | IPO | regulator-transparency | `6326b1aed023` | `2b932ec53dc3` | TEXT_CHANGED |  |  |
| 19 | NCSC | regulator-transparency | `59e1ae0d4a9f` | `68d976e4434a` | TEXT_CHANGED |  |  |
| 20 | EDPS | regulator-transparency | `162bf3123ec6` | `c6de29aad57f` | TEXT_CHANGED |  |  |
| 21 | EDPB | regulator-transparency | `0fc0c57262b7` | `c3a181bec11b` | TEXT_CHANGED |  |  |
| 22 | ECB | regulator-transparency | `0e738a69024a` | `92281305398f` | TEXT_CHANGED |  |  |
| 23 | ESMA | regulator-transparency | `516784c60b9d` | `896991b5877a` | TEXT_CHANGED |  |  |
| 24 | US NTIA | regulator-transparency | `910911444ec2` | `d297f980a4a7` | TEXT_CHANGED |  |  |
| 25 | UNESCO AI | regulator-transparency | `668cf7bfe209` | `dd61d26dcf61` | TEXT_CHANGED |  |  |
| 26 | Alibaba Qwen2.5 Repository | lab-practice | `52b5501a687c` | `6b97c2b33937` | TEXT_CHANGED |  |  |
| 27 | Zhipu AI GLM-4 Repository | lab-practice | `391c2faee5e9` | `7ce78d6a1288` | TEXT_CHANGED |  |  |
| 28 | MiniMax-01 Repository | lab-practice | `3cf1c3493db7` | `2c0e03166114` | TEXT_CHANGED |  |  |
| 29 | Shanghai AI Lab OpenCompass | lab-practice | `92c60e76a02a` | `f5bf4b505bae` | TEXT_CHANGED |  |  |
| 30 | BAAI FlagEmbedding | lab-practice | `aad12e6f3bda` | `bee78c5cd8d9` | TEXT_CHANGED |  |  |
| 31 | NVIDIA NeMo Guardrails | lab-practice | `e4dc7d5b22c8` | `a6eaa2bfd8c1` | TEXT_CHANGED |  |  |
| 32 | OSAIA SAFE Spec | lab-practice | `` | `50156d14cda6` | TEXT_CHANGED |  |  |

## Reading the sheet

- `baseline_text_sha256` is the wave-2 digest (2026-10-27) and `observed_text_sha256` is the wave-3 digest
  (2026-10-28). Identical digests would mean no change; these differ, so the extracted visible text differs.
- The digests are the **evidence**: the same text on the same URL at two dates, hashed. Re-running wave 3
  reproduces them. The runner is `wave3.mjs` and the full record is
  `out/claim-maintenance.wave3-20261028.json`.
- The wave-2-to-wave-1 comparison for the same URLs is in the wave-2 record, so each row can be read as a
  two-step history: what changed between 24 and 27 Oct, and what changed between 27 and 28 Oct.

## The two numbers that will be published

| Figure | Value | Status |
|---|---|---|
| Claims monitored | 77 | live URL set, unchanged since 2026-10-24 |
| Reachable and hashed at wave 3 | 77 | every one read live |
| Visible text changed in 24h | 32 | **candidate** material changes, awaiting your mark |
| Text identical | 45 | no adjudication needed |
| Raw bytes changed 24→27 Oct | 62 | the unattributable number; superseded by the text-level figures |

**What may not be published from this sheet until it is marked:** a claim that a named organisation changed a
claim, a materiality verdict, and any count presented as a compliance finding. The count itself — how many
monitored public claims changed their visible text in a day — is a measurement and is publishable once the
marking says which changes were material.

_Generated 2026-10-28T03:25:01.722980Z from wave 3 (2026-10-28T03:18:49.884Z). Baseline: wave 2 (2026-10-27T08:09:16.700Z)._
