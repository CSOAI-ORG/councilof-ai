# Benchmark-quality register v1 — 2026-09-06

**benchmark-quality.v1 · status STAGED · not a certificate · no model judged anything here.**

Benchmark-quality register — deterministic predicates applied to the process integrity of eight AI benchmark publishers, ourselves included. Issued by CSOAI Ltd (GB, Companies House 16939677). CC-BY-4.0.

Measurement, not certification. Unsolicited; no publisher participated; public artifacts only. There is no score and no ranking here — the counts are unweighted and non-exhaustive, and ordering publishers by them is a misuse of this file.

## How to disagree with any cell

```
python3 scripts/benchmark_quality/register.py --explain <publisher>:<predicate_id>
python3 scripts/benchmark_quality/register.py --check
```
The producer makes no network call. Its whole input is the bytes under `scripts/fixtures/benchmark-quality/`, whose SHA-256 is printed on every cell.

## Counts per publisher

| publisher | pass | fail | unmeasured | resolved | results surface | self-assessed |
|---|---|---|---|---|---|---|
| LMArena | 6 | 27 | 2 | 33 | server-rendered | no |
| Vals AI | 14 | 19 | 2 | 33 | server-rendered | no |
| HELM | 4 | 0 | 31 | 4 | client-rendered shell | no |
| Epoch AI | 7 | 28 | 0 | 35 | server-rendered | no |
| Artificial Analysis | 6 | 27 | 2 | 33 | server-rendered | no |
| Scale SEAL | 5 | 25 | 5 | 30 | server-rendered | no |
| UK AISI (Inspect) | 10 | 24 | 1 | 34 | server-rendered | no |
| Council of AI | 17 | 16 | 2 | 33 | server-rendered | YES |

280 cells: 69 PASS, 166 FAIL, 45 UNMEASURED. Counts, not a score. Do not rank publishers by them.


## method transparency

_What the publisher says about how the numbers are produced._

| predicate | LMArena | Vals AI | HELM | Epoch AI | Artificial Analysis | Scale SEAL | UK AISI (Inspect) | Council of AI |
|---|---|---|---|---|---|---|---|---|
| `method_page_linked` | PASS | PASS | UNMEAS | FAIL | PASS | FAIL | FAIL | PASS |
| `scorer_named_on_board` | FAIL | PASS | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |
| `structured_data_on_board` | FAIL | FAIL | UNMEAS | FAIL | PASS | PASS | FAIL | PASS |
| `changelog_linked` | PASS | PASS | UNMEAS | FAIL | FAIL | PASS | PASS | PASS |
| `limitations_stated` | FAIL | PASS | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |

- **`method_page_linked`** — Does the results surface link a page describing how the numbers are produced? Read from: board_href. A number whose method is not one click away cannot be argued with.
- **`scorer_named_on_board`** — Does the results surface name the mechanism that produces a score? Read from: board. Elo, a rubric, a unit test and a model judge are four different instruments; a reader is entitled to know which one made the number.
- **`structured_data_on_board`** — Does the results surface carry machine-readable structured data (JSON-LD)? Read from: board_raw. The surface an answer engine reads is now the surface that matters; JSON-LD is the only part of it a machine does not have to guess at.
- **`changelog_linked`** — Does the results surface link a dated record of its own changes? Read from: board_href. A leaderboard that changes silently cannot be cited, because the thing cited is gone.
- **`limitations_stated`** — Does the results surface state what its numbers do not establish? Read from: board. Every instrument has a boundary; publishing it is the difference between a measurement and a claim.

## data

_Whether the items behind the numbers can be obtained and under what licence._

| predicate | LMArena | Vals AI | HELM | Epoch AI | Artificial Analysis | Scale SEAL | UK AISI (Inspect) | Council of AI |
|---|---|---|---|---|---|---|---|---|
| `item_data_channel_linked` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | PASS | FAIL |
| `open_dataset_in_public_index` | PASS | PASS | PASS | PASS | PASS | UNMEAS | PASS | PASS |
| `dataset_licence_machine_readable` | PASS | PASS | PASS | PASS | PASS | UNMEAS | PASS | PASS |
| `item_count_published_on_board` | FAIL | PASS | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `held_out_set_declared` | FAIL | PASS | UNMEAS | FAIL | FAIL | PASS | FAIL | FAIL |

- **`item_data_channel_linked`** — Does the results surface link a channel from which the underlying items or results can be obtained? Read from: board_href. Without the items, every number on the page is a claim about work nobody else can inspect.
- **`open_dataset_in_public_index`** — Does the publisher appear in a public open-data index with at least one dataset or repository? Read from: machine. Asked of the index rather than of a URL we invented, so an empty answer is about the publisher and not about our guess.
- **`dataset_licence_machine_readable`** — Does at least one indexed record carry a machine-readable licence identifier? Read from: machine. A licence a machine cannot read is a licence a reuse pipeline will ignore.
- **`item_count_published_on_board`** — Does the results surface publish how many items are behind the numbers? Read from: board. A score without an n is not yet a measurement.
- **`held_out_set_declared`** — Does the results surface declare that some portion of the items is withheld? Read from: board. Withholding items is a defensible contamination control and a real limit on reproduction; either way it must be said, not discovered.

## reproducibility

_Whether a stranger has code, a command and data enough to re-run it._

| predicate | LMArena | Vals AI | HELM | Epoch AI | Artificial Analysis | Scale SEAL | UK AISI (Inspect) | Council of AI |
|---|---|---|---|---|---|---|---|---|
| `code_repository_linked` | FAIL | PASS | UNMEAS | PASS | FAIL | FAIL | PASS | PASS |
| `code_licence_machine_readable` | UNMEAS | UNMEAS | PASS | PASS | UNMEAS | UNMEAS | PASS | UNMEAS |
| `run_command_published` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | PASS | FAIL |
| `environment_pinning_stated` | FAIL | PASS | UNMEAS | FAIL | FAIL | FAIL | PASS | FAIL |
| `stranger_recompute_path_complete` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | PASS | FAIL |

- **`code_repository_linked`** — Does the results surface link source code? Read from: board_href. The first thing a reproducer needs is the code that made the number.
- **`code_licence_machine_readable`** — Does an indexed repository or dataset for this publisher carry a machine-readable SPDX licence? Read from: machine. Unlicensed code is code a third party may read and may not run.
- **`run_command_published`** — Does the results surface publish a command a reader could run? Read from: board. A repository link is an invitation; a command is an instruction. Only one of them gets run.
- **`environment_pinning_stated`** — Does the results surface state anything that pins the evaluation environment? Read from: board. Unpinned, a re-run is a different experiment and a disagreement about numbers cannot be settled.
- **`stranger_recompute_path_complete`** — Are data, code and a runnable command all present on the same surface? Read from: board. Each of the three alone is common; all three together is what a stranger actually needs, and it is the composite nobody publishes by accident.

## statistics

_Whether uncertainty, sample size and separation are published beside scores._

| predicate | LMArena | Vals AI | HELM | Epoch AI | Artificial Analysis | Scale SEAL | UK AISI (Inspect) | Council of AI |
|---|---|---|---|---|---|---|---|---|
| `uncertainty_shown_beside_scores` | PASS | PASS | UNMEAS | FAIL | FAIL | PASS | FAIL | FAIL |
| `sample_size_shown_beside_scores` | FAIL | PASS | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |
| `separation_rule_published` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |
| `minimum_n_rule_published` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |
| `repeats_or_variance_disclosed` | FAIL | PASS | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |

- **`uncertainty_shown_beside_scores`** — Is an uncertainty quantity shown on the results surface? Read from: board. A ranking of point estimates is a ranking of noise until the intervals are drawn.
- **`sample_size_shown_beside_scores`** — Is the number of observations behind a figure shown on the results surface? Read from: board. Two scores with the same value and different n are not comparable, and the reader cannot tell without the n.
- **`separation_rule_published`** — Does the results surface publish a rule for when two systems are not separated? Read from: board. Ranks are read as differences; without a separation rule a one-place gap and a ten-point gap look the same.
- **`minimum_n_rule_published`** — Does the results surface publish a threshold below which it refuses to report a figure? Read from: board. The discipline that costs a publisher something is the refusal to publish a thin cell; it is also the one nobody adopts unprompted.
- **`repeats_or_variance_disclosed`** — Does the results surface disclose repeated runs or run-to-run variance? Read from: board. A single sampled run is one draw from a distribution, and nothing on a leaderboard says so unless the publisher says so.

## operations

_Freshness, machine channels, crawl policy, and whether outages are visible._

| predicate | LMArena | Vals AI | HELM | Epoch AI | Artificial Analysis | Scale SEAL | UK AISI (Inspect) | Council of AI |
|---|---|---|---|---|---|---|---|---|
| `as_of_date_on_board` | FAIL | FAIL | UNMEAS | PASS | FAIL | FAIL | FAIL | FAIL |
| `as_of_within_30_days` | UNMEAS | UNMEAS | UNMEAS | PASS | UNMEAS | UNMEAS | UNMEAS | UNMEAS |
| `machine_readable_channel_linked` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `robots_permits_results_surface` | PASS | PASS | PASS | PASS | PASS | UNMEAS | PASS | PASS |
| `status_or_uptime_page_linked` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |

- **`as_of_date_on_board`** — Does the results surface carry a date saying when the numbers were last refreshed? Read from: board. A leaderboard with no as-of date cannot be stale, because it can never be shown to be.
- **`as_of_within_30_days`** — Is that date within 30 days of the register run date? Read from: board. Model releases move weekly; a board more than a month old is describing a different field.
- **`machine_readable_channel_linked`** — Does the results surface link a machine-readable channel of its own? Read from: board_href. If the only way to read the numbers is to render the page, the numbers are not published — they are displayed.
- **`robots_permits_results_surface`** — Does the publisher's robots.txt permit a general-purpose agent to fetch the results surface? Read from: robots. A results page an agent may not fetch is not a public result in the way the web now works. Recorded as a fact about the file, not as criticism: reserving a surface is a legitimate choice.
- **`status_or_uptime_page_linked`** — Does the results surface link a status or uptime page? Read from: board_raw. Everything on this list is a service; a service with no status page has no way to tell you it was down when you read it.

## provenance

_Whether a result can be tied to its publisher by something other than trust._

| predicate | LMArena | Vals AI | HELM | Epoch AI | Artificial Analysis | Scale SEAL | UK AISI (Inspect) | Council of AI |
|---|---|---|---|---|---|---|---|---|
| `results_carry_a_signature` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `verification_key_published` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `transparency_log_or_witness` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `content_hash_published` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `persistent_identifier_published` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |

- **`results_carry_a_signature`** — Is a cryptographic signature over the results present or linked on the results surface? Read from: board_raw. Unsigned, a leaderboard row cannot be distinguished from a screenshot of one, and neither can be quoted back to its publisher.
- **`verification_key_published`** — Is a key or key document published against which such a signature could be checked? Read from: board_raw. A signature with no discoverable key is decoration.
- **`transparency_log_or_witness`** — Is the result committed to an append-only log or a third-party witness? Read from: board_raw. A signature proves who; a log proves when, and stops the signer from quietly changing what was signed.
- **`content_hash_published`** — Is a content hash of any published artifact shown on the results surface? Read from: board_raw. A hash is the cheapest thing that makes 'the file I downloaded' and 'the file you published' the same sentence.
- **`persistent_identifier_published`** — Is a persistent identifier — DOI, Zenodo record or arXiv id — published on the results surface? Read from: board_raw. URLs rot; a benchmark that expects to be cited in five years needs an identifier that does not depend on its own DNS.

## governance

_Corrections, funding, and disclosed commercial interest in the ranked parties._

| predicate | LMArena | Vals AI | HELM | Epoch AI | Artificial Analysis | Scale SEAL | UK AISI (Inspect) | Council of AI |
|---|---|---|---|---|---|---|---|---|
| `corrections_route_published` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `corrections_ledger_public` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | PASS |
| `funding_or_ownership_disclosed` | FAIL | FAIL | UNMEAS | FAIL | FAIL | PASS | FAIL | PASS |
| `commercial_offering_disclosed` | FAIL | FAIL | UNMEAS | FAIL | PASS | FAIL | FAIL | FAIL |
| `results_licence_stated_on_board` | FAIL | FAIL | UNMEAS | FAIL | FAIL | FAIL | FAIL | FAIL |

- **`corrections_route_published`** — Is there a stated route by which a reader can report an error in a published figure? Read from: board_raw. An instrument with no error-reporting route treats its own output as final, which no instrument's output is.
- **`corrections_ledger_public`** — Is there a public record of corrections that were actually made — not merely a route to request one? Read from: board_raw. A route where reports go in and nothing comes out in public is unfalsifiable; a ledger is the part that costs something.
- **`funding_or_ownership_disclosed`** — Is who pays for, or who owns, the publisher disclosed on the results surface? Read from: board_raw. Who funds the instrument is the first question asked of any ranking, and the surface that answers it elsewhere has not answered it.
- **`commercial_offering_disclosed`** — Does the results surface disclose that the publisher also sells something to the kind of party it ranks? Read from: board_raw. Selling evaluations to the labs you rank is legitimate and common; being able to read that off the page is the part that is not automatic. This register records the disclosure, never a price and never an inference about influence.
- **`results_licence_stated_on_board`** — Is a licence for the results stated on the results surface itself? Read from: board_raw. Numbers with no licence are quoted anyway; the publisher just loses the ability to say how.

## Every UNMEASURED, with its reason


### LMArena — 2 UNMEASURED

- `code_licence_machine_readable` — The index queried for this publisher was the Hugging Face dataset index, which holds no source-repository records. A code licence is not answerable from the artifact fetched, and a fourth fetch would break the budget every publisher shares.
- `as_of_within_30_days` — as_of_date_on_board did not yield a parseable date, so there is no date to compare. Absence of a date is recorded there; it is not restated as a failure here.

### Vals AI — 2 UNMEASURED

- `code_licence_machine_readable` — The index queried for this publisher was the Hugging Face dataset index, which holds no source-repository records. A code licence is not answerable from the artifact fetched, and a fourth fetch would break the budget every publisher shares.
- `as_of_within_30_days` — as_of_date_on_board did not yield a parseable date, so there is no date to compare. Absence of a date is recorded there; it is not restated as a failure here.

### HELM — 31 UNMEASURED

- `method_page_linked` — The results surface returned 45 characters of visible text after script and style removal (1295 bytes on the wire) — a client-rendered shell. The bytes that would answer this predicate are not in the response. Rendering it would require executing the publisher's JavaScript, which this register does not do.
- `scorer_named_on_board` — as above.
- `structured_data_on_board` — as above.
- `changelog_linked` — as above.
- `limitations_stated` — as above.
- `item_data_channel_linked` — as above.
- `item_count_published_on_board` — as above.
- `held_out_set_declared` — as above.
- `code_repository_linked` — as above.
- `run_command_published` — as above.
- `environment_pinning_stated` — as above.
- `stranger_recompute_path_complete` — as above.
- `uncertainty_shown_beside_scores` — as above.
- `sample_size_shown_beside_scores` — as above.
- `separation_rule_published` — as above.
- `minimum_n_rule_published` — as above.
- `repeats_or_variance_disclosed` — as above.
- `as_of_date_on_board` — as above.
- `as_of_within_30_days` — as above.
- `machine_readable_channel_linked` — as above.
- `status_or_uptime_page_linked` — as above.
- `results_carry_a_signature` — as above.
- `verification_key_published` — as above.
- `transparency_log_or_witness` — as above.
- `content_hash_published` — as above.
- `persistent_identifier_published` — as above.
- `corrections_route_published` — as above.
- `corrections_ledger_public` — as above.
- `funding_or_ownership_disclosed` — as above.
- `commercial_offering_disclosed` — as above.
- `results_licence_stated_on_board` — as above.

### Artificial Analysis — 2 UNMEASURED

- `code_licence_machine_readable` — The index queried for this publisher was the Hugging Face dataset index, which holds no source-repository records. A code licence is not answerable from the artifact fetched, and a fourth fetch would break the budget every publisher shares.
- `as_of_within_30_days` — as_of_date_on_board did not yield a parseable date, so there is no date to compare. Absence of a date is recorded there; it is not restated as a failure here.

### Scale SEAL — 5 UNMEASURED

- `open_dataset_in_public_index` — The index query returned no record attributable to this publisher. A zero from one search term establishes something about the term, not about the publisher — so this is UNMEASURED and never FAIL. Query: https://huggingface.co/api/datasets?search=scale-seal&full=true&limit=50. If the publisher's handle in this index differs, tell us and the record is recomputed against it.
- `dataset_licence_machine_readable` — No attributable record to read a licence from. Query: https://huggingface.co/api/datasets?search=scale-seal&full=true&limit=50
- `code_licence_machine_readable` — The index queried for this publisher was the Hugging Face dataset index, which holds no source-repository records. A code licence is not answerable from the artifact fetched, and a fourth fetch would break the budget every publisher shares.
- `as_of_within_30_days` — as_of_date_on_board did not yield a parseable date, so there is no date to compare. Absence of a date is recorded there; it is not restated as a failure here.
- `robots_permits_results_surface` — The results surface resolved to labs.scale.com, a different host from scale.com where robots.txt was fetched. Under RFC 9309 a robots.txt governs only its own authority, so the file we hold does not answer this question. Fetching the second host would exceed the three-artifact budget every publisher is held to.

### UK AISI (Inspect) — 1 UNMEASURED

- `as_of_within_30_days` — as_of_date_on_board did not yield a parseable date, so there is no date to compare. Absence of a date is recorded there; it is not restated as a failure here.

### Council of AI — 2 UNMEASURED

- `code_licence_machine_readable` — The index queried for this publisher was the Hugging Face dataset index, which holds no source-repository records. A code licence is not answerable from the artifact fetched, and a fourth fetch would break the budget every publisher shares.
- `as_of_within_30_days` — as_of_date_on_board did not yield a parseable date, so there is no date to compare. Absence of a date is recorded there; it is not restated as a failure here.

## Limitations

- These predicates measure DISCLOSURE ON A NAMED SURFACE. They do not measure whether any publisher's numbers are correct, whether a benchmark measures what its name claims, or whether one publisher is better than another. Construct validity is not scored here because no regular expression can score it.
- There is no total, no score and no ranking. The counts are unweighted, the predicates are not independent, and the set is not exhaustive. Ordering publishers by PASS count would be a misuse of this file, and the file deliberately contains nothing that makes it easy.
- A FAIL is bounded by one URL on one date. Most of these publishers document more, elsewhere, than the surface a reader lands on. That gap is the thing being measured, and it is not the same as an absence.
- Three artifacts per publisher is a small window, chosen so that ours is the same size. A wider window would resolve more predicates for everyone and would change results in both directions.
- Regular expressions produce false positives. A page that says 'we publish no confidence intervals' matches the interval pattern. Every PASS carries the matched span so that a reader can see this happen, and any such case is a correction we will make.
- One row is self-assessed. It is marked everywhere it appears and it is not independent evidence.
- No language model judged anything on this register. The scorer is re.search.

## Right of reply

Any publisher named here may reply, and the reply is published beside the row, unedited, whether or not we agree with it. Where a cell is shown to be wrong the row is recomputed and the correction is published; a signed row is superseded, never edited. Right of reply: https://councilof.ai/contact · Corrections: https://councilof.ai/api/corrections

