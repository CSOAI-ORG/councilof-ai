---
license: cc-by-4.0
pretty_name: Hive Security Daily — nightly attack ratchet ledger
tags:
- security
- measurement
- council-of-ai
- gspc
- hive
- attack-ratchet
size_categories:
- n<1K
language:
- en
---

# Hive Security Daily — the nightly attack ledger, printed verbatim

**Current state: HIVE_HELD (seq 26, 2026-11-09)** — held 31/31, missed 0, regressions 0. Detector self-test: passed. — held 31/31, missed 0, regressions 0. Detector self-test: passed.

We attack our own runtime nightly. A launchd job (04:23 UTC) runs 31 attacks across four defence layers against the LIVE product, judges every result against the SIGNED tool policy, and re-attacks every pinned rule every night. A rule is minted only for an attack the defence CAUGHT. The ledger is append-only and sha256 hash-chained; this dataset prints it verbatim.

**Chain integrity: verified over all 18 rows** (each row's previous_hash equals the prior row's entry_hash — recomputed at publish time).

## The history, including the failures

- seq 1 (2026-10-27): ALERT — 2 attacks missed; that is how the first rules were minted.
- seq 2: ALERT_RULE_CHAIN_BROKEN — a broken chain row, declared, then repaired. Not hidden.
- seq 3–17: HIVE_HELD — 15 consecutive nightly runs, 31/31, detector self-test passing.
- seq 18 (2026-11-02): ALERT — 30/31, 1 missed, 1 regression. The ratchet caught a regression; this is the ratchet working, and it is printed, not smoothed away.

## Rule layers (31 pinned)

| Layer | Rules |
|---|---|
| L0 policy-gate | 15 |
| L5 human-oversight | 8 |
| L3 integrity-and-availability | 6 |
| L2 clan-agreement | 2 |

## Known exposures (counted honestly, never as catches)

Two exposures are observed and carried open in the signed records, e.g. HIVE-EXP-X01: the competency ANSWER KEY is still served by an unauthenticated read-class GET — the gate closes the axis, but serving the key is an information disclosure. Exposures are never counted as catches; no attack is escalated into a manufactured compromise.

## What this is NOT

Not a penetration-test certificate, not a security guarantee, not a score. States only: measurement, not endorsement. Detector self-test runs before any claim: the judge MUST hold one correct observation and MUST miss two deliberately wrong ones — a judge that cannot miss cannot be trusted to catch.


**Update 2026-11-09T01:51:** instrument fix (transport retries in the attack client — a timeout is an instrument error, never a policy miss) verified: seq 26 HIVE_HELD 31/31, chain extended to 26 rows. The seq-18 and seq-25 ALERTs were both transport-timeout instrument failures, now structurally prevented.

<!-- csoai-card-fixes:start -->

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_hive_security_daily_2026,
  title        = {Hive Security Daily — nightly attack ratchet ledger},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/hive-security-daily}},
  url          = {https://huggingface.co/datasets/csoai/hive-security-daily}
}
```

<!-- csoai-card-fixes:end -->
