# N-Sites: one lane, on the adapter contract

*Brief — 2026-10-27. Built on the datasets that already exist. Not a rebuild.*

## 1. What this lane is for

The estate has six reachable populations of AI systems and almost none of them measured. This lane
turns a **population** into **measured slots**, and it does so by writing *adapters*, not by
writing a new pipeline. The datasets are already published; the census, the queues, the locks and
the banks are all there. What is missing is the connector that says "these particular rows are
these particular models, graded by this particular grader, on this particular bank".

**One lane, one contract.** Each site gets one adapter. The adapters differ in where they read
from and what they call; they do not differ in what they emit or what they are allowed to claim.

## 2. The adapter contract

An adapter is a converter. It reads a source's records and emits measured slots, and it is
acceptable only if all of the following hold. Each rule already has an enforcement point in the
estate — this is a description of the contract, not a proposal for one.

| # | Rule | Where it is enforced today |
|---|---|---|
| A1 | **One grader.** A slot's number comes from the estate's own `read_label` (or, for a model that answers a closed-label prompt, from the same closed-label matcher). An adapter never invents a scorer and never calls a model to judge a model. | `harness/gspc-top100/mill_hub_queue.py`; the lm-eval port is proven equal to it by `scripts/surface/test_lm_eval_parity.py`. |
| A2 | **The denominator is stated.** An adapter publishes which denominator it used and the count of unparsed items, and publishes the graded-only figure beside it. | The EEE export publishes both and the board rule (every item) and the card rule (unparsed leaves the denominator) are both live; §2.3 of `docs/METHODOLOGY-ARXIV-DRAFT.md`. |
| A3 | **Absent is not zero.** A slot with no run is `UNMEASURED`. A slot with fewer than 30 graded items is held, not quoted. | `harness/bench/run_bench.py`; the EEE export holds 12 cells and names them in the manifest. |
| A4 | **Own models are excluded.** No Council of AI model enters a comparative set. The rule is published, not per-run. | `public/independence/own-model-disclosure.json` (rules R1/R2), applied by `harness/eval-export/eee_export.py`. |
| A5 | **A lock is not a grade.** A population, a lock or a queue row is a *position*, not a measurement. `enters_board_means` is false on HF2200, KAGGLE and SERVED, and must stay false. | The fleet locks' own field. |
| A6 | **Every number is re-derivable.** The slot's items, its answers and its grader are published, so the score can be recomputed by a stranger. | The per-item rows + the `_samples.jsonl` sidecars; `harness/eval-export/test_eee_rows_export.py` proves every published score re-derives. |
| A7 | **Separation is a test, not an order.** A lead is declared only by exact McNemar on the discordant items at p < 0.05; otherwise it is a `TIE` and the board says so. | `scripts/gspc_separation_from_rows` (the board's own `separation_method` text). |
| A8 | **Measurement, never certification.** An adapter emits a number and what it does not establish. It never emits a rank, a grade, a certification or a compliance verdict. | `scripts/claimguard` / the brand- and claim gates. |
| A9 | **No internal codenames on public surfaces, and no published price.** | `scripts/brand-gate.mjs`, `scripts/price-gate.mjs`, `scripts/canary-leak-gate.mjs`. |
| A10 | **The source is pinned.** An adapter records the source's digest, revision and as-of. A source that moved under the adapter is a new source, not a new number. | The rows' `MANIFEST.json` (per-file sha256) and the board's `peritem_file_sha256`. |

## 3. What already exists — do not rebuild it

| Piece | Where | What it already does |
|---|---|---|
| The harvester | `scripts/badger/csoai-t2-atoms.py` | Reads a **keyless, public** model listing and emits `UNMEASURED` measurement-card slots. 6,928 slots today: 5,155 UNMEASURED, 1,685 DISCOVERED, 88 USED. Its `--dry-run` no longer writes to the tracked corpus. |
| The mill | `harness/gspc-top100/mill_hub_queue.py` | The grader, the banks, the per-item evidence writer. |
| The bench runner | `harness/bench/run_bench.py` | Runs a bank against a model with the mill's grader and publishes the per-item ledger. |
| The public suite | `public/bench/**`, `scripts/surface/build-bench-suite.mjs` | 14 axis pages with the bank URL, sha256, label menu, prompt, grader and run command. |
| The lm-eval port | `scripts/surface/build-lm-eval-tasks.mjs` | 12 tasks, 780 items, one per runnable axis, with per-axis label menus; parity with the grader proven. |
| The EEE adapter | `harness/eval-export/eee_export.py`, `eee_rows_export.py` | A full worked adapter: reads a source, verifies it, emits records + sidecars, and publishes a manifest naming every held cell. 66 records, 4,509 items, 66/66 valid upstream. |
| The board | `https://councilof.ai/api/gspc` | 33 slots, 23 measured, 10 unmeasured; 14 model-comparison axes, 0 separated, 7 TIE, 7 UNTESTED. |

**The EEE adapter is the template.** A new site adapter is a sibling of it: same output shape,
same gates, different source.

## 4. The sites, with live populations (checked 2026-10-27)

| Site | Population | Source of truth | as_of | Measured today |
|---|---|---|---|---|
| HF census | 3,032,028 | `census_n` lock | 2026-09-06 | 0 — and the doc says do not mill the census |
| Hub queue | 4,063 rows | `csoai/hub-queue` `queue.jsonl` | live | not a measurement set |
| HF2200 lock | 2,200 locked | `public/fleet/HF2200.lock.json` | 2026-09-06 | `n_measured` 0, `n_practice_probed` 405 |
| FLEET-B | 40 | `https://councilof.ai/fleet/FLEET-B.lock.json` | 2026-08-31 | `enters_board_means` false |
| Kaggle models | 10,000 listed (lock holds 1,120) | `locks/KAGGLE.lock.json` | 2026-09-06 | `n_measured` 0 |
| SERVED lock | 265 | `locks/SERVED.lock.json` | 2026-09-07 | `n_measured` 0 |
| OpenRouter harvest | 6,928 slots | `scripts/badger/_queue/t2/` | live | 88 USED |
| GSPC board | 33 axes (23 measured) | `GET /api/gspc` | 2026-10-26 | 23 |

Counts moved since the 6 September table: the hub queue went 2,773 → 4,063 rows; the Kaggle lock
holds 1,120, not 500; the board is 33 axes, not 22. **A population is not a measurement**, and
`enters_board_means` is false on every lock.

## 5. The lane, in the order it should be run

1. **HF2200 (2,200 locked, 405 practice-probed).** The largest declared population with a pin.
   The practice-probed 405 are the natural first measured slice: they are already reachable, and
   the probe result is the evidence that the model answers a closed-label prompt at all.
   *Adapter:* read `HF2200.lock.json`, take the probed subset, run the 30-item minimum bank, emit
   slots. *Blocker:* a runnable model host per model — the estate's own `sov33-ultimate-sovereign`
   and `qwen2.5:0.5b` are on the M2's Ollama, and the public Ollama library is the reachability
   probe.
2. **FLEET-B (40).** Small, locked, and provider-mixed (the lock has a `providers` file). The
   natural second slice, and the cheapest way to prove the adapter generalises across providers.
3. **Kaggle (1,120 locked).** Same shape, different source. `enters_board_means` stays false.
4. **SERVED (265).** Only after the first three, because a served set is the one most likely to
   be read as a ranking.
5. **Hub queue (4,063 rows).** A work queue, not a population. It should feed the harvester, not
   the adapter.
6. **The HF census (3,032,028).** Explicitly not to be milled. The census is for coverage
   reporting; a census slot that is `UNMEASURED` in the millions is noise, and the 6 September
   note says so.

## 6. What "done" means for this lane

- One adapter per site, each a sibling of the EEE adapter, each with its own test.
- A published manifest per adapter naming: the source and its digest, the slots emitted, the slots
  held and why, and the measured count. Nothing is silent.
- A run of at least 30 graded items per quoted slot; below that, `UNMEASURED`.
- The board's own rule honoured: our models excluded, ties published as ties, no cell invented.
- Every number re-derivable from published bytes, as the EEE sidecars now are.

## 7. The rules that do not bend

- **Absent is not zero.** A slot with no run is `UNMEASURED` and stays visible as a gap.
- **A lock is not a grade.** Populations, locks and queues declare positions. Only a run produces
  a number.
- **Never rank our own models against ourselves** — the own-model register is the rule and the
  exclusion is applied before the comparison, not after.
- **Measurement, never certification.** A card is evidence that a run happened at a time.
- **No internal codenames on public surfaces.** The t2 queue's own model ids are public; the
  estate's internal names are not.

---

*Counts in §4 were read from the live endpoints and the lock files on 2026-10-27; the earlier
figures in `docs/NSITES-COUNTS-2026-09-06.md` are kept as the dated record they are.*
