# SOV4 Benchmark Card (2026-07-18) — every cell honestly tagged
# HEADER: '100/100' = OUR build-completeness rubric (every piece built+tested+documented), NOT
# general-capability supremacy or frontier parity. Frontier parity is data+GPU-blocked and NOT claimed.
# Tags: MEASURED (n + method + caveat) | GATED (needs GPU+data, honestly not-yet) | CROSS-LANE (CC ran, not re-verified here)

| axis | number | tag | source / caveat |
|---|---|---|---|
| governance battery (merged) | acc ~0.788, harm-recall 0.60 (9/15) | CROSS-LANE | CC lane measured; this-lane fresh run OWED. n=33 in-house, behavioural, token-length-sensitive. 6/15 harm still MISSED (better, NOT safe). |
| merge-method finding | density 0.7 > 0.5; weight to bigger corpus; method barely matters | CROSS-LANE (directional) | robust across configs, not single-point; DARE-TIES ties-not-beats at 0.5B |
| TierBench route-down | frac_skippable 0.122; owned>=fast 0.561 | MEASURED (this-lane) | n_heldout 82; route-down real but MODEST. artifact aae84e76 |
| injection detector | 0.977 held-out | MEASURED (earlier) | TF-IDF lexical; on disk |
| toxicity detector | 0.871 held-out | MEASURED (earlier) | embedding semantic; on disk |
| oversight eye | self-test 3/3, regression 26/26 | MEASURED (this-lane) | HEALTHY/DRIFT/CARE_BREACH verdicts confirmed; 3-eye SIRIUS/HORUS/SIGIL |
| multi-adapter climb-vs-saturate | — | GATED | Modal 195MB upload blocked; number OWED, NOT faked |
| BFT poisoned-brain containment | — | RETRACTED | claimed 0.02->0.83; file absent on disk; VERIFIED ABSENT, not a number |
| general capability (MMLU/GPQA/Elo) | — | NOT CLAIMED | small governed base does NOT out-capability 2.8T frozen; claiming = fatal |
| currency / freshness | live-retrieve + as-of stamp | MEASURED (mechanism) | currency-gate FRESH_WINDOW 180d; beats frozen by construction on time-sensitive |

## Honest split
MEASURED (this-lane, frame-verified): TierBench, oversight eye, detectors, currency mechanism.
CROSS-LANE (CC ran, directionally adopted, not re-verified here): merge battery + method finding.
GATED (owed, not faked): multi-adapter curve.
RETRACTED (verified absent): BFT containment.
NOT CLAIMED (physics wall): general capability parity with K3.
