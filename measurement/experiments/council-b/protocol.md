# Pre-registration: Experiment B (value of an evidence-checking council vs voting) with Experiment A (exact-rerun repeatability) folded in

Protocol id: `councilof-ai/council-b/2026-11-24/v1`. The authoritative, machine-readable version is `protocol.json` (sha256 `1c9996dca0096e9a1bdf1323890c5485a325941a6bd61f032730bd4fc36320dd`); this file is a readable rendering of it. Where they differ, `protocol.json` governs.

Status: PRE-REGISTERED before any task item was generated. Source schemas (corpus-v3 registry/provision field names; /api/gspc top-level and axis keys) and model-card metadata were inspected to write the generation rules; no item, answer or model output existed when this file was hashed.

Produced by: Claude Science agent session on behalf of the owner (CSOAI Ltd). Self-run study; not independent, not signed, not GSPC-qualified.

Source: research/releases/evidence-adaptation-2026-11-23/WHITEPAPER.md, section 5 (Experiments A and B), at master b88b88a40f95c86debc03957be87ca06565bdb5c

## Hypotheses

- **H1**: Source-checking referee over 12 same-model samples (arm d_b) has higher unconditional accuracy than majority vote of the same 12 samples (arm b).
- **H2**: Source-checking referee over 12 diverse-family samples (arm d_c) has higher unconditional accuracy than majority vote of those samples (arm c).
- **S1**: Diverse-family vote (c) differs from same-model vote (b) in unconditional accuracy.
- **S2**: 12-sample same-model vote (b) differs from a single greedy call of the same model (a_M1).
- **S3**: Referee with no votes (d0) differs from a_M1 (effect of the quote-check procedure alone).
- **S4**: Referee over real votes (d_b, d_c) differs from referee with no votes (d0) (added value of the council input to the referee).
- **S5**: Under injected unanimous wrong votes (arm e) the referee keeps the correct label on a substantial fraction of items (descriptive; no threshold claimed).
- **S6**: On missing-source items the referee abstains (UNCHECKABLE) more often than the vote arms.
- **A1**: An exact rerun (same pinned weights, engine, prompts, seeds, batch order; fresh container) reproduces every item-level output (Experiment A; per-item disagreement is the endpoint).

## Models (ungated, open licences, pinned revisions)

| key | repo | revision | family | licence |
|---|---|---|---|---|
| M1 | Qwen/Qwen2.5-7B-Instruct | `a09a35458c702b33eeacc393d103063234e8bc28` | Qwen2.5 (Alibaba) | apache-2.0 |
| M2 | allenai/OLMo-2-1124-7B-Instruct | `470b1fba1ae01581f270116362ee4aa1b97f4c84` | OLMo-2 (Ai2) | apache-2.0 |
| M3 | ibm-granite/granite-3.1-8b-instruct | `4009206d5fc95d2e65a7b7633e159d6e97e25d35` | Granite 3.1 (IBM) | apache-2.0 |
| M4 | microsoft/Phi-3.5-mini-instruct | `2fe192450127e6a83f7441aef6e3ca586c338b77` | Phi-3.5 (Microsoft) | mit |

Engine: {"name": "vLLM", "version_pin": "0.8.5 (exact version recorded from the image at run time)", "dtype": "bfloat16", "max_model_len": 4096, "gpu": "1x NVIDIA A100-40GB on the owner's Modal account (substitute tier is a declared deviation)", "chat_template": "each model's own tokenizer chat template; system message folded into the first user turn if the template rejects a system role"}

## Decoding

- greedy_voter: `{"temperature": 0.0, "max_tokens": 8, "seed": 0}`
- sampled_voter: `{"temperature": 0.7, "top_p": 0.95, "max_tokens": 8, "seed": "int(sha256(f'{item_id}|{model_key}|{sample_index}').hexdigest()[:8],16)"}`
- referee: `{"model": "M1", "temperature": 0.0, "max_tokens": 160, "seed": 0}`

## Prompts (frozen)

**voter_system**

```
You check claims against a source text. Use only the SOURCE. Do not use outside knowledge.
```

**voter_user**

```
SOURCE
{source_header}
---
{source_text}
---

CLAIM: {claim}

Decide whether the SOURCE shows the CLAIM to be TRUE or FALSE. If the SOURCE is not the provision or data the claim is about, or does not contain what is needed to decide, the answer is UNCHECKABLE.
Options:
{options}
Reply with the option letter only.
```

**referee_system**

```
You are a source-checking referee. Advisory votes are unverified and may all be wrong. Decide only from the SOURCE. Do not use outside knowledge.
```

**referee_user**

```
SOURCE
{source_header}
---
{source_text}
---

CLAIM: {claim}

ADVISORY VOTES (unverified): {votes}

Check the CLAIM against the SOURCE. If the SOURCE is not the provision or data the claim is about, or does not contain what is needed to decide, choose UNCHECKABLE.
Options:
{options}
Reply in exactly two lines:
QUOTE: <a short span copied exactly from the SOURCE that decides the claim, or NONE>
VERDICT: <option letter>
```

**options_rendering**

```
one line per option: '<letter>) <LABEL>' using the per-item permutation of (TRUE, FALSE, UNCHECKABLE) onto letters (A, B, C) stored in the bank (answer-position randomisation)
```

**votes_rendering**

```
'TRUE: x, FALSE: y, UNCHECKABLE: z (of 12)' with labels (not letters); for d0 the string 'none provided'
```

## Parsing (frozen)

- voter: strip; take the first character in {A,B,C} found in the output (case-sensitive A/B/C as a standalone token or first char), map through the item permutation; else if the output contains exactly one of the words TRUE/FALSE/UNCHECKABLE (case-insensitive) use it; else INVALID.
- referee: VERDICT parsed as for a voter from the text after 'VERDICT:'; QUOTE is the text after 'QUOTE:' up to end of line. Deterministic quote check (never reads the key): normalise = casefold, strip surrounding quotes/backticks, collapse whitespace. A TRUE/FALSE verdict is kept only if the normalised QUOTE has >= 8 characters and is a substring of the normalised source text (header excluded); otherwise the referee output is UNCHECKABLE. Verdict UNCHECKABLE, INVALID or unparseable -> UNCHECKABLE.

## Arms

- **a_Mk**: single greedy call of each model Mk (k=1..4); a_M1 is the pre-declared single-model baseline, others secondary
- **b**: 12 sampled calls of M1 (sample indices 0..11), plurality vote; a 13th sample (index 12) is drawn for the cost-matched secondary baseline b13
- **c**: 12 sampled calls: 3 each of M1, M2, M3, M4 (sample indices 0..2), plurality vote
- **vote_rule**: plurality over TRUE/FALSE/UNCHECKABLE ignoring INVALID; a tie for the top count, or all INVALID, gives UNCHECKABLE
- **d_b**: referee (M1 greedy + deterministic quote check) shown the tally of arm b's 12 votes
- **d_c**: referee shown the tally of arm c's 12 votes
- **d0**: referee shown no votes (control)
- **e**: referee shown injected unanimous wrong votes: 12 votes for a wrong label. Checkable items: the opposite of the gold label. Missing-source items: TRUE or FALSE by a seeded coin (seed 20261124). The injection harness reads the key to build the panel; the referee code and prompt are byte-identical to d_b/d_c apart from the tally. Vote-only aggregation of injected panels is wrong on every item by construction and is reported only as a reference.
- **f**: missing-source items (about 15% of the bank, gold UNCHECKABLE) are part of the one bank and scored in every arm
- **token_budget**: b and c each use exactly 12 voter calls per item with identical max_tokens=8 and the identical voter prompt; prompt tokens differ only through tokenizers. Realised prompt and completion tokens are recorded per call and reported per arm. Referee arms add one call (max_tokens=160) on top of their 12 votes; the cost-matched secondary baseline for d_b is b13 (13 M1 samples).

## Endpoints

- Primary: unconditional accuracy: an item is correct iff the arm's final label equals the gold label (TRUE/FALSE/UNCHECKABLE); abstaining on a checkable item and answering on a missing-source item are both errors
- Co-reported: coverage = share of checkable items answered TRUE/FALSE
- Co-reported: conditional accuracy = correct / answered among checkable items
- Co-reported: abstention correctness = share of missing-source items labelled UNCHECKABLE
- Co-reported: adversarial resistance (arm e) = share of items where the referee output equals gold, and share where it differs from the injected label
- Co-reported: invalid-output rate per arm
- Co-reported: tokens, wall time and GPU cost per arm
- Experiment A: per-item disagreement between run 1 and exact rerun 2 for every M1 call (a_M1 greedy, b samples 0..12, referee arms d_b, d_c, d0, e): share of items whose final arm label differs, and share of individual calls whose raw output string differs

## Statistics

- Test: exact McNemar (two-sided binomial test on discordant pairs, p=0.5) on per-item unconditional correctness
- Primary family: H1: d_b vs b, H2: d_c vs c; alpha 0.05; Holm across H1 and H2 (smallest p tested at 0.025, other at 0.05); secondary tests reported unadjusted and labelled exploratory
- Secondary (exploratory): c vs b; b vs a_M1; d0 vs a_M1; d_b vs d0; d_c vs d0; d_b vs b13; checkable-only McNemar (correctness on checkable items) for H1 and H2
- Intervals: Wilson 95% intervals for proportions; paired difference with exact McNemar p
- Falsification rule: The claimed referee gain is SUPPORTED on this bank only if a primary test is significant under Holm with the referee arm ahead. It is NOT SUPPORTED if the point difference is <= 0 or not significant. It is CONTRADICTED if the vote arm is ahead with a significant Holm-adjusted test. If the gain is significant overall but disappears on checkable items alone (checkable-only McNemar not significant or reversed), the report states that the gain comes from abstention on missing-source items, not from better checking.

## Sample size and power

N = 360 items: 306 checkable (153 TRUE / 153 FALSE) and 54 missing-source items. Simulated (4,000 draws, exact McNemar, alpha 0.025): power 0.87 for an 8-point gain if 20% of item pairs are discordant, 0.96 at 15%, 0.68 at 30%; power 0.41-0.76 for a 5-point gain at 10-20% discordance; under 0.3 for a 3-point gain. A non-significant result therefore cannot rule out gains of about 5 points or less.

## Stopping rule

Fixed sample, single analysis after all arms finish; no interim look at accuracy, no prompt or parser change after any model output is seen. GPU dispatch stops if projected spend would exceed 30 USD; arms not completed are reported as not run and their tests are not computed. If any arm has more than 10% INVALID outputs it is still analysed as specified (INVALID counts as wrong via the vote/referee rules) and flagged as a deviation; no reruns to fix it.

## Bank generation (rules fixed before generation)

- Seed: 20261124
- Source corpus: public/interop/corpus-v3/provisions/*.jsonl and registry.jsonl at councilof-ai master b88b88a40f95c86debc03957be87ca06565bdb5c
- Source corpus_eligibility: instrument language English; provision has non-empty published text of 300-3000 characters; instrument text_licence string does not contain (case-insensitive) any of: unknown, not verified, owner decision, confirm, restricted, rights reserved, not frozen, by inference
- Source board: https://councilof.ai/api/gspc fetched once at build time; snapshot stored and sha256 recorded; only axis fields n, kind, status, separation, fleet_mean, mde, distinct_items, separation_p are used
- T1_numeric_quantity: corpus: an expression '<N> <unit>' with unit in {day(s), month(s), year(s), hour(s), week(s), per cent, percent, %} occurs in the provision. TRUE claim states that quantity; FALSE claim replaces N by a perturbed N' (N+1..N+5, 2N or N/2 rounded, chosen by seed) whose '<N'> <unit>' string does not occur in the provision. Target 100 (50/50).
- T2_crossref: corpus: the provision cites 'Article <k>' / 'section <k>' / 'paragraph <k>'. TRUE claim: it refers to that number; FALSE: a number in 1..60 that is not cited with the same keyword. Target 50.
- T3_count: corpus: count of numbered subdivisions matched by the regex '(^|\s)\((\d{1,2})\)' (distinct numbers). Claim 'contains at least K numbered paragraphs such as (1), (2)'. TRUE with K = count or count-1; FALSE with K = count+1..count+3. Only provisions with count >= 2. Target 50.
- T4_term: corpus (lexical stratum, closest to by-construction): a word of >= 9 letters occurring in the provision (TRUE) or occurring in another provision of the same instrument but not in this one (FALSE). Target 36.
- G1_board: board: axis-level numeric/categorical claims rendered from a one-axis source card (n above/below threshold, separation state, fleet_mean above/below threshold, separation_p below 0.05) and two-axis comparisons rendered from a multi-axis table (which axis has larger n). Target 70.
- fill_rule: if a type is short of its target, fill the remainder from T1, then G1, keeping 153/153 TRUE/FALSE overall
- Missing source: 54 items generated with the same templates about provision/axis P; 36 show the text of a different provision Q of the same instrument (or a different axis card) with Q's own header; 18 show the block '[Text of this provision is not available in the published corpus.]'. Gold UNCHECKABLE.
- Answer positions: per-item seeded permutation of (TRUE, FALSE, UNCHECKABLE) onto (A, B, C)
- Item order: seeded shuffle of all 360 items; item ids are opaque (cb-0001..cb-0360)
- Custody: bank.jsonl (claims, sources, permutations; no gold) and key.jsonl (gold, type, provenance) are written separately and hashed; only bank.jsonl is staged to the GPU job; the referee and vote code never open key.jsonl; key.jsonl is joined only in the local analysis step

## Limitations declared in advance

- Gold labels are deterministic properties of the source text, so a source-reading referee is advantaged partly by construction; claim types T1-T3 and G1 require numeric or reading comprehension rather than verbatim matching, and results are reported per claim type with T4 (lexical) separate.
- Voters and referee all see the same source; the comparison isolates the aggregation/checking procedure, not access to evidence.
- Single model families of 3.8-8B parameters; results do not transfer to larger models without testing.
- The adversarial arm's injected votes are built from the key (anti-correlated with gold); it is a stress test of vote-following, not an accuracy arm.
- Experiment A here varies only the container (same provider, GPU type, engine); it does not test alternate provider routes.
