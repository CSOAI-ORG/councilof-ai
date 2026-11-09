# CSOAI — CLAIM MATERIALITY ADJUDICATION SHEET · wave 3 (MARKED 2026-10-29)

**Marked by:** the agent, under the owner's delegation of 2026-10-28, using an evidence-based rule.
**Evidence:** the wave-4 probe (`out/claim-maintenance.wave4-probe-20261029.raw.json`, 77 URLs, each read twice
30 s apart, wave-2 baseline vs wave-3 text digest).

**The rule, and nothing beyond it.**

- **MATERIAL** — the page was **stable** across wave 2's two reads 30 s apart and wave 3's text differs. The
  delta is attributable to a content change in the claim page.
- **CHURN** — the page was **unstable within wave 2** (its own two reads already differed), or the wave-2 baseline
  was unreachable. A difference against such a baseline is the page's own churn and is not attributable.
- **WITHDRAWN** — the page is gone. **No row carries this mark.** A page that is merely unreachable is not
  withdrawn: unreachable is a state, and a state is not a deletion.

**What a mark does not say.** A digest difference says that text changed. It does not say why, and it does not
name any third party as having corrected, retracted, misstated or conceded anything. The marks rest on digest
relations, not on intent. **No third party is named from a delta.**

**Negative control.** The probe's 45 rows whose text did **not** change are controls: a stable page must not
produce a mark. All 45 controls produced no mark, as required.

**Counts.** 26 MATERIAL · 6 CHURN · 0 WITHDRAWN, of 32 candidate deltas.

**What this is not.** Not a certification, not a grade, not a verdict on any subject, and not a promotion of
the claim-maintenance axis — that axis is a declared slot with no run behind it and stays UNMEASURED.

---

## The sheet

| # | subject | axis | wave2 text sha256 | wave3 text sha256 | status | your mark | your note |
|---:|---|---|---|---|---|---|---|
| 19 | NCSC | regulator-transparency | `59e1ae0d4a9f` | `68d976e4434a` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 20 | EDPS | regulator-transparency | `162bf3123ec6` | `c6de29aad57f` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 21 | EDPB | regulator-transparency | `0fc0c57262b7` | `c3a181bec11b` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 22 | ECB | regulator-transparency | `0e738a69024a` | `92281305398f` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 23 | ESMA | regulator-transparency | `516784c60b9d` | `896991b5877a` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 24 | US NTIA | regulator-transparency | `910911444ec2` | `d297f980a4a7` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 25 | UNESCO AI | regulator-transparency | `668cf7bfe209` | `dd61d26dcf61` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 26 | Alibaba Qwen2.5 Repository | lab-practice | `52b5501a687c` | `6b97c2b33937` | TEXT_CHANGED | **CHURN** | wave 2's two reads 30 s apart already differed (read1 `52b5501a687c` vs read2 `3aba193cb6de`), so the page churns on its own; the wave 2→wave 3 text difference is not attributable to a change in the claim |
| 27 | Zhipu AI GLM-4 Repository | lab-practice | `391c2faee5e9` | `7ce78d6a1288` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 28 | MiniMax-01 Repository | lab-practice | `3cf1c3493db7` | `2c0e03166114` | TEXT_CHANGED | **CHURN** | wave 2's two reads 30 s apart already differed (read1 `3cf1c3493db7` vs read2 `9986528f6ca3`), so the page churns on its own; the wave 2→wave 3 text difference is not attributable to a change in the claim |
| 29 | Shanghai AI Lab OpenCompass | lab-practice | `92c60e76a02a` | `f5bf4b505bae` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 30 | BAAI FlagEmbedding | lab-practice | `aad12e6f3bda` | `bee78c5cd8d9` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 31 | NVIDIA NeMo Guardrails | lab-practice | `e4dc7d5b22c8` | `a6eaa2bfd8c1` | TEXT_CHANGED | **MATERIAL** | wave 2's two reads 30 s apart were byte-identical, so the delta is attributable to a content change in the claim page, not to churn; no intent inferred and no third party named |
| 32 | OSAIA SAFE Spec | lab-practice | `` | `50156d14cda6` | TEXT_CHANGED | **CHURN** | wave 2's baseline is UNREACHABLE, so there is no stable baseline to attribute a change to; unreachable is a state, not a deletion, so this is not recorded as withdrawn |

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
