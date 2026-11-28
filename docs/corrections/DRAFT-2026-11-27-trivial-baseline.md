# DRAFT correction (held for owner ruling): on 7 model-comparison axes, item wording alone predicts the gold label

Status: **DRAFT — not published, not applied to the board.** Measurement, not certification.

## What the board says
The board scores models against gold labels on its model-comparison axes and reports a fleet mean and, where published, a leader interval.

## What was measured (pre-registered)
A sweep of five no-model baselines was pre-registered before any bank was downloaded (prereg_baselines.md, sha256 adc5a619bb2b437ac461dfc3a62a238da74a86238f235ee0d046b7be23459f3a): majority class, label-prior random, a word-count threshold and a keyword naive Bayes on prompt words (both leave-one-out), and a shuffled-label control. They were run on the same hash-verified per-item rows the board uses. Flag rule: the best baseline's accuracy is at or above the board fleet mean, or inside the leader's published interval.

| Axis | Bench | n | Best no-model baseline | Accuracy (Wilson 95%) | Board fleet mean | Leader interval | Pre-registered verdict |
|---|---|---|---|---|---|---|---|
| governance | GovBench | 237 | B4_keyword_nb_loo | 0.979 (0.952–0.991) | 0.490 | 0.523–0.647 | FLAGGED |
| safety | DefBench | 36 | B4_keyword_nb_loo | 0.639 (0.476–0.775) | 0.732 | 0.819–0.985 | NOT_FLAGGED |
| provenance | ProvBench | 32 | B3_wordcount_loo | 0.625 (0.453–0.771) | 0.549 | 0.546–0.844 | FLAGGED |
| continuity | PQCBench | 33 | B4_keyword_nb_loo | 0.788 (0.623–0.893) | 0.450 | 0.437–0.753 | FLAGGED |
| conformance | MCPBench | 35 | B3_wordcount_loo | 0.657 (0.491–0.792) | 0.537 | 0.549–0.837 | FLAGGED |
| openness | OSSBench | 32 | B4_keyword_nb_loo | 0.656 (0.483–0.796) | 0.696 | 0.682–0.931 | NOT_FLAGGED |
| machinery-conformity | MachBench | 33 | B4_keyword_nb_loo | 0.727 (0.558–0.849) | 0.349 |  | FLAGGED |
| care | CareBench | 199 | B4_keyword_nb_loo | 0.764 (0.700–0.818) | 0.293 | 0.339–0.474 | FLAGGED |
| cross-reality | XRAIV | 32 | B4_keyword_nb_loo | 0.844 (0.682–0.931) | 0.441 |  | FLAGGED |
| detector-interop | DetBench | 33 | B4_keyword_nb_loo | 1.000 (0.896–1.000) | 0.563 |  | FLAGGED |
| art5-safeguard | Art5Bench | 36 | B4_keyword_nb_loo | 0.917 (0.782–0.971) | 0.830 |  | FLAGGED |
| swarm | SwarmBench v2b | 37 | nan |  (–) |  |  | NOT_ASSESSABLE |
| affect | AffectBench | 41 | B4_keyword_nb_loo | 0.512 (0.365–0.657) | 0.605 |  | NOT_FLAGGED |
| jail | GoldBank-Detector | 71 | B4_keyword_nb_loo | 0.958 (0.883–0.986) | 0.545 | 0.475–0.698 | FLAGGED |

Shuffled-label controls sit at chance on every axis.

## What it means
On governance, continuity, machinery-conformity, care, cross-reality, detector-interop and jail, even the **lower** end of the best baseline's 95% interval is at or above the fleet mean. On these axes the prompt wording alone predicts the gold label, so a model's score there cannot by itself be read as reasoning ability. Provenance, conformance and art5-safeguard are flagged at the point estimate only (n 32–36; the best-of-four selection biases them upward), so they are provisional. Safety, openness and affect are not flagged. Swarm cannot be assessed (free-text gold).

## Proposed correction (for owner ruling)
1. Add to each flagged axis row a limit line: the best no-model baseline, its accuracy and interval, and a link to this sweep.
2. Publish the sweep table and pre-registration as an evidence record.
3. Size and rebuild the flagged banks so that no-model baselines sit well below the fleet (the existing power table already says most banks need at least 6x more items).

## Limits
Five axes publish no leader interval and were judged on the fleet mean only. The prompt text is the per-item rows' `item` field. One exact duplicate in care was dropped (199 unique items, equal to the board's n). Supplementary analyses are in the sweep notes and were not used for any verdict.
