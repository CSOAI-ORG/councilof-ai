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
| Council of AI | 17 | 16 | 2 | 33 | server-rendered | YES |

35 cells: 17 PASS, 16 FAIL, 2 UNMEASURED. Counts, not a score. Do not rank publishers by them.


## method transparency

_What the publisher says about how the numbers are produced._

| predicate | Council of AI |
|---|---|
| `method_page_linked` | PASS |
| `scorer_named_on_board` | FAIL |
| `structured_data_on_board` | PASS |
| `changelog_linked` | PASS |
| `limitations_stated` | FAIL |

- **`method_page_linked`** — Does the results surface link a page describing how the numbers are produced? Read from: board_href. A number whose method is not one click away cannot be argued with.
- **`scorer_named_on_board`** — Does the results surface name the mechanism that produces a score? Read from: board. Elo, a rubric, a unit test and a model judge are four different instruments; a reader is entitled to know which one made the number.
- **`structured_data_on_board`** — Does the results surface carry machine-readable structured data (JSON-LD)? Read from: board_raw. The surface an answer engine reads is now the surface that matters; JSON-LD is the only part of it a machine does not have to guess at.
- **`changelog_linked`** — Does the results surface link a dated record of its own changes? Read from: board_href. A leaderboard that changes silently cannot be cited, because the thing cited is gone.
- **`limitations_stated`** — Does the results surface state what its numbers do not establish? Read from: board. Every instrument has a boundary; publishing it is the difference between a measurement and a claim.

## data

_Whether the items behind the numbers can be obtained and under what licence._

| predicate | Council of AI |
|---|---|
| `item_data_channel_linked` | FAIL |
| `open_dataset_in_public_index` | PASS |
| `dataset_licence_machine_readable` | PASS |
| `item_count_published_on_board` | PASS |
| `held_out_set_declared` | FAIL |

- **`item_data_channel_linked`** — Does the results surface link a channel from which the underlying items or results can be obtained? Read from: board_href. Without the items, every number on the page is a claim about work nobody else can inspect.
- **`open_dataset_in_public_index`** — Does the publisher appear in a public open-data index with at least one dataset or repository? Read from: machine. Asked of the index rather than of a URL we invented, so an empty answer is about the publisher and not about our guess.
- **`dataset_licence_machine_readable`** — Does at least one indexed record carry a machine-readable licence identifier? Read from: machine. A licence a machine cannot read is a licence a reuse pipeline will ignore.
- **`item_count_published_on_board`** — Does the results surface publish how many items are behind the numbers? Read from: board. A score without an n is not yet a measurement.
- **`held_out_set_declared`** — Does the results surface declare that some portion of the items is withheld? Read from: board. Withholding items is a defensible contamination control and a real limit on reproduction; either way it must be said, not discovered.

## reproducibility

_Whether a stranger has code, a command and data enough to re-run it._

| predicate | Council of AI |
|---|---|
| `code_repository_linked` | PASS |
| `code_licence_machine_readable` | UNMEAS |
| `run_command_published` | FAIL |
| `environment_pinning_stated` | FAIL |
| `stranger_recompute_path_complete` | FAIL |

- **`code_repository_linked`** — Does the results surface link source code? Read from: board_href. The first thing a reproducer needs is the code that made the number.
- **`code_licence_machine_readable`** — Does an indexed repository or dataset for this publisher carry a machine-readable SPDX licence? Read from: machine. Unlicensed code is code a third party may read and may not run.
- **`run_command_published`** — Does the results surface publish a command a reader could run? Read from: board. A repository link is an invitation; a command is an instruction. Only one of them gets run.
- **`environment_pinning_stated`** — Does the results surface state anything that pins the evaluation environment? Read from: board. Unpinned, a re-run is a different experiment and a disagreement about numbers cannot be settled.
- **`stranger_recompute_path_complete`** — Are data, code and a runnable command all present on the same surface? Read from: board. Each of the three alone is common; all three together is what a stranger actually needs, and it is the composite nobody publishes by accident.

## statistics

_Whether uncertainty, sample size and separation are published beside scores._

| predicate | Council of AI |
|---|---|
| `uncertainty_shown_beside_scores` | FAIL |
| `sample_size_shown_beside_scores` | FAIL |
| `separation_rule_published` | FAIL |
| `minimum_n_rule_published` | FAIL |
| `repeats_or_variance_disclosed` | FAIL |

- **`uncertainty_shown_beside_scores`** — Is an uncertainty quantity shown on the results surface? Read from: board. A ranking of point estimates is a ranking of noise until the intervals are drawn.
- **`sample_size_shown_beside_scores`** — Is the number of observations behind a figure shown on the results surface? Read from: board. Two scores with the same value and different n are not comparable, and the reader cannot tell without the n.
- **`separation_rule_published`** — Does the results surface publish a rule for when two systems are not separated? Read from: board. Ranks are read as differences; without a separation rule a one-place gap and a ten-point gap look the same.
- **`minimum_n_rule_published`** — Does the results surface publish a threshold below which it refuses to report a figure? Read from: board. The discipline that costs a publisher something is the refusal to publish a thin cell; it is also the one nobody adopts unprompted.
- **`repeats_or_variance_disclosed`** — Does the results surface disclose repeated runs or run-to-run variance? Read from: board. A single sampled run is one draw from a distribution, and nothing on a leaderboard says so unless the publisher says so.

## operations

_Freshness, machine channels, crawl policy, and whether outages are visible._

| predicate | Council of AI |
|---|---|
| `as_of_date_on_board` | FAIL |
| `as_of_within_30_days` | UNMEAS |
| `machine_readable_channel_linked` | PASS |
| `robots_permits_results_surface` | PASS |
| `status_or_uptime_page_linked` | FAIL |

- **`as_of_date_on_board`** — Does the results surface carry a date saying when the numbers were last refreshed? Read from: board. A leaderboard with no as-of date cannot be stale, because it can never be shown to be.
- **`as_of_within_30_days`** — Is that date within 30 days of the register run date? Read from: board. Model releases move weekly; a board more than a month old is describing a different field.
- **`machine_readable_channel_linked`** — Does the results surface link a machine-readable channel of its own? Read from: board_href. If the only way to read the numbers is to render the page, the numbers are not published — they are displayed.
- **`robots_permits_results_surface`** — Does the publisher's robots.txt permit a general-purpose agent to fetch the results surface? Read from: robots. A results page an agent may not fetch is not a public result in the way the web now works. Recorded as a fact about the file, not as criticism: reserving a surface is a legitimate choice.
- **`status_or_uptime_page_linked`** — Does the results surface link a status or uptime page? Read from: board_raw. Everything on this list is a service; a service with no status page has no way to tell you it was down when you read it.

## provenance

_Whether a result can be tied to its publisher by something other than trust._

| predicate | Council of AI |
|---|---|
| `results_carry_a_signature` | PASS |
| `verification_key_published` | PASS |
| `transparency_log_or_witness` | PASS |
| `content_hash_published` | PASS |
| `persistent_identifier_published` | PASS |

- **`results_carry_a_signature`** — Is a cryptographic signature over the results present or linked on the results surface? Read from: board_raw. Unsigned, a leaderboard row cannot be distinguished from a screenshot of one, and neither can be quoted back to its publisher.
- **`verification_key_published`** — Is a key or key document published against which such a signature could be checked? Read from: board_raw. A signature with no discoverable key is decoration.
- **`transparency_log_or_witness`** — Is the result committed to an append-only log or a third-party witness? Read from: board_raw. A signature proves who; a log proves when, and stops the signer from quietly changing what was signed.
- **`content_hash_published`** — Is a content hash of any published artifact shown on the results surface? Read from: board_raw. A hash is the cheapest thing that makes 'the file I downloaded' and 'the file you published' the same sentence.
- **`persistent_identifier_published`** — Is a persistent identifier — DOI, Zenodo record or arXiv id — published on the results surface? Read from: board_raw. URLs rot; a benchmark that expects to be cited in five years needs an identifier that does not depend on its own DNS.

## governance

_Corrections, funding, and disclosed commercial interest in the ranked parties._

| predicate | Council of AI |
|---|---|
| `corrections_route_published` | PASS |
| `corrections_ledger_public` | PASS |
| `funding_or_ownership_disclosed` | PASS |
| `commercial_offering_disclosed` | FAIL |
| `results_licence_stated_on_board` | FAIL |

- **`corrections_route_published`** — Is there a stated route by which a reader can report an error in a published figure? Read from: board_raw. An instrument with no error-reporting route treats its own output as final, which no instrument's output is.
- **`corrections_ledger_public`** — Is there a public record of corrections that were actually made — not merely a route to request one? Read from: board_raw. A route where reports go in and nothing comes out in public is unfalsifiable; a ledger is the part that costs something.
- **`funding_or_ownership_disclosed`** — Is who pays for, or who owns, the publisher disclosed on the results surface? Read from: board_raw. Who funds the instrument is the first question asked of any ranking, and the surface that answers it elsewhere has not answered it.
- **`commercial_offering_disclosed`** — Does the results surface disclose that the publisher also sells something to the kind of party it ranks? Read from: board_raw. Selling evaluations to the labs you rank is legitimate and common; being able to read that off the page is the part that is not automatic. This register records the disclosure, never a price and never an inference about influence.
- **`results_licence_stated_on_board`** — Is a licence for the results stated on the results surface itself? Read from: board_raw. Numbers with no licence are quoted anyway; the publisher just loses the ability to say how.

## Every UNMEASURED, with its reason


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

