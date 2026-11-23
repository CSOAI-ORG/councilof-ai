# New evidence-loop research readback — 22 November 2026

**State:** draft PR #4730 research. No new GSPC axis, no live MEOK policy change, no model training or hidden-bank evaluation, no signed scientific report, no independent third-party adoption.

## Five new instruments executed, reproduced independently on two authorised Macs

| Instrument / file | What was actually done | Exact result |
| --- | --- | --- |
| `temporal_observatory.py` | Two read-only captures of the public GSPC board on each Mac, source-digest comparison | 34 axes; 34 marked MEASURED; 0 model axes with separated leaders. Same content SHA-256 on both Macs; consecutive snapshots unchanged |
| `error_complementarity.py` | Paired previously archived model correctness by identical public axis/item, excluding repeated ambiguous keys | 13 eligible historical axes; aggregate pairwise both-wrong and **oracle-only** ceilings. No implementable referee tested |
| `repeated_observations.py` | Cross-referenced frozen measurements, items and cells, differentiating same metadata vs alternate provider route | 10,982 eligible item keys, 1,823 repeated, 66 differing grade outcomes, 81 differing observed outputs; 52 of 66 same recorded revision/route/bank, 14 alternate route |
| `human_information_factorial.py` | Generated and scored a wholly synthetic 3×2×2 factorial with 1,500 paired tasks (18,000 artificial graded cells) | Verifies information-presence/policy/period decomposition; **no real humans, model changes or outcomes** |
| `him_research_cards.py` | Created four hash-linked, readable research cards from the four aggregate reports | Clear observed / not established / human-review question; no new grade or human authority |

Read-only board source `https://councilof.ai/api/gspc`; observed 22 Nov at approximately 17:50 UTC. Canonical JSON source content hash on both:
`edf0c5e08c157eaedef594e41a338d956f64153460c0695803a706ba1f135f4e`

**Repeated-observation audit** frozen source revision: `csoai/gspc-fact-table@d0605c2495bddae7956fec5c18403d8a49fd81ac`. Result digest reproduced exactly on both Macs:
`a8c433a529426c23e94cde34f837e4fc915dc8dd4c29a44be397ecaa0687534a`.

**Model-pair complementarity** exact repeated hash:
`8839b8e9a1400426e0acf7f72c988410bc8ea0e41c5978e009c00eba9160e17d`.

Historical axis-level **median fraction of paired models both wrong** (separate populations; NOT one comparable ranking):

| Archive axis | Both-wrong median | Either-correct *oracle* ceiling median |
| --- | ---: | ---: |
| governance | 0.46667 | 0.53333 |
| care | 0.43333 | 0.56667 |
| continuity | 0.36667 | 0.63333 |
| cross-reality | 0.36667 | 0.63333 |
| provenance | 0.10000 | 0.90000 |

**Synthetic human information factorial** exact repeated hash:
`25015b242d320290d99154802700d251303c5e92bf1967859f77296f748e6c80`.

`human_relevant_vs_none_frozen_at_t0`=+0.12267, `irrelevant_presence_vs_none_frozen_at_t0`=+0.01000, `policy_update_minus_frozen_at_t1_no_human`=+0.08667, `human_policy_interaction_at_t1`=+0.02200. **These reflect chosen synthetic probabilities; none are empirical causal improvements.**

**H.I.M. research projection:** Four source-bound cards created on both machines. Their composite card digests differ because the two public-board captures have distinct legitimate retrieval times/receipt hashes; underlying board *content* SHA is equal. M4 card digest:
`d419e1f7f9cd0b2e89066cc97b233d452094b449501a658eaf8d9d150ec9bf6a`.
M2 card digest:
`51bed36f105849be98eb6b6b52597e2b389c1b4e54c71888207f6bc0d4e749e8`.

## Regression and boundaries

At this stage both Macs executed full locally available research unit suites with **104/104 passing**; separate focused suites included missing evidence, duplicate IDs, corrupted receipts, false human authority, fake model-weight adaptation, hidden-answer oracle misuse, mixed source revision, timestamp/order errors, known-vs-new measurement conflation and private demographic field rejection.

GitHub `gspc-hybrid-science-tests` checks were passing at the last observation of the preceding commit. Full monorepo status and PR merge admission must be rechecked on the *final* head; a previous green run is not final-head success.

The pinned public table includes 20,517 rows. `repeated_observations.py` excludes 1,290 unattributed rows and 2,182 ungraded rows *after* that exclusion, which is consistent with the original 2,428 total ungraded because some ungraded rows also have no model. No rows were silently assigned grades.

**Hard constraints:**
- The source date is not the observation date, and repeated rows are not chronological proof of drift.
- A "both correct/either correct" oracle is not a real agent, referee, human or verified policy.
- Human interaction simulations do not establish participant consent, identity, competence, model adaptation or realised effects.
- H.I.M. explanatory cards are not neural J-space activations, certification, training evidence or operational permissions.
- The research PR does not deploy Cloudflare, create a production scheduler, transfer private source material, bypass the grader, run paid GPUs or edit signed cards.

## Reproduce in the isolated research directory

```sh
OPENBLAS_NUM_THREADS=1 python3 -B -m unittest discover -s . -p 'test_*.py' -v
python3 -B temporal_observatory.py --capture --observed-at "2026-11-22T17:50:35Z"
python3 -B error_complementarity.py
python3 -B repeated_observations.py
python3 -B human_information_factorial.py --demo --tasks 1500
```

The temporal capture time in the example must be replaced by **the actual UTC observation time** when taking a fresh capture. No existing snapshot may be relabelled as if re-run. Error/repetition modules download only pinned public data in memory; they require public Hugging Face connectivity. `him_research_cards.py` accepts only checked on-disk aggregate research reports, never user interactions.

## Public-source product readback

- `https://proofof.ai/` redirected to Council of AI's homepage on today's GET. Existing owner blueprint `docs/proofof/SANDBOX-V0.md` defines it as a physically isolated experimental twin; **current redirect does not provide that twin**.
- `https://loopfactory.ai/` returned HTTP 200 with an AI workflow/automation waitlist page. Its body still said DNS was not live, an obsolete claim relative to successful resolution.
- `https://openpatent.ai/` returned HTTP 402 to automated inspection; no working research/patent filing service can be verified from this response. Do not interpret 402 as purchase evidence.

These are research/service quality gaps to route through the separate product release owners—not automatic authorisation to rewrite hosting, deploy or contact prospective buyers.

## Provenance and next step

Use canonical GSPC ontology terms and existing `csoai.evidence-event/0.1` when qualified evidence is promoted; neither the new research projection nor a fresh read constitutes a canonical signed event. A prospective real research round must pin a genuinely new hidden test bank, measure model/route/decoder conditions, test referee selection without privileged answers, and obtain independent effect receipts for real users.

**Selected next action:** a blind, prospective reproducibility experiment for the 66 historical conflicting model-item keys, beginning with an independent-held-out eligibility review; not an "auto-fix" or unreviewed training update.
