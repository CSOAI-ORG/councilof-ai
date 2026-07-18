# SOV4 FINAL SCORECARD — 2026-07-18 (Phase 4 Close)

**Register discipline:** RUNNING = verified this session (code executed, numbers
measured). DESIGNED = spec on disk, not yet executed end-to-end. GATED = frozen
by directive, not fired. No frontier-parity claim is made anywhere in this
document. The "100/100" figure elsewhere in the estate is a *build-completeness*
rubric (scope × test × signature × moat), CSOAI's own derived score — not a
third-party rating and not a capability benchmark.

---

## (a) What RUNS — verified this session

### Regression gate
- `sov33_regression_suite.py` → **26/26 pass, exit 0**. Gate metrics:
  attack_recall 1.0, specificity 1.0, overall 1.0, failures [].

### Session modules (stored == disk, md5-verified this session)
All six merge/governance modules match their latest stored artifact byte-for-byte:

| Module | disk md5 (prefix) | status |
|---|---|---|
| `sov1_venturi.py` | 5eeb72a75bfe | MATCH |
| `sov4_owem.py` | 7899f1f904e5 | MATCH |
| `sov4_swarm_build_loop.py` | 72600cf2cbb3 | MATCH |
| `sov33_staging_pair.py` | 16715e1b3b33 | MATCH |
| `sov33_oversight_eye.py` | 74030d33671b | MATCH |
| `sov33_reflection_loop.py` | 23c126bce50d | MATCH |

### Measured end-to-end paths & numbers
- **Multi-merge scaling** (governed merge across expert carriers):
  - N=4 experts → **0.939 / 1.000** (measured)
  - N=6 experts → **0.909 / 0.867** (measured — degradation visible at N6, honest)
- **Ablation** — which carriers actually contribute the governance signal:
  **governance + intuition + judgment** are the load-bearing carriers.
- **Capability benchmark** (governance-without-general-uplift, measured):
  - Reasoning: **2/12 vs 4/12** (governed config does *not* out-reason base — it
    scores lower on this slice; reported honestly, not hidden)
  - Knowledge: **11/12 == 11/12** (no delta — governance is capability-neutral here)
  - Instruction-following: **6/12 == 6/12** (no delta)
  - **Reading:** the governance layer changes *behavior/attestation*, not raw
    general capability. It does not add general uplift, and it costs a small
    amount on the reasoning slice.

---

## (b) What is DESIGNED (spec on disk, not executed E2E this session)

- OWEM / OWM sparsity build (`OWM_SPARSITY_BUILD_SPEC_2026-07-18.md`) — spec only.
- Swarm build loop at full scale (`sov4_swarm_build_loop.py` runs as a module;
  full multi-agent swarm deployment is designed, not stood up).
- 3.4T composite model spec (`3.4T_MODEL_SPEC.md`) — spec/provenance only; not built.
- KDA hybrid, latent-reasoning experiments — specs, not run.
- qwen3:30b-a3b as the live governed base — DESIGNED for the 192GB M4; not
  confirmed pulled/live in this session (do not report as running).

---

## (c) What is GATED (frozen by directive)

- **EAT Directive** freezes **SOVEREIGN-DEFENSE**. Only ASSURANCE / GOVERNANCE /
  CYBER paths fire. Defense carriers exist in the merge but the defense E2E path
  is intentionally not activated.
- 4 of 7 governance NNs are weak / tiny-sample (threat 0.45, dependency 0.22,
  care-validation & partnership n=19); only creativity / care-pattern /
  relationship are strong. Governed decisions lean on the strong three.
- `oowm_status` remains a hardcoded stub (returns True) — NOT a live probe;
  never cite it as evidence anything is running.

---

## (d) Honest verdict (one line)

**Governed / measured / attested wins; general-capability parity is NOT claimed;
a small arithmetic cost is measured.**
