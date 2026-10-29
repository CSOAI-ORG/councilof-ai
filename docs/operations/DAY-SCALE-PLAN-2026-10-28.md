# Day-scale plan — what the estate still needs, and what it actually costs

*Produced 2026-10-28. Every count below was read from bytes today; every "day" is an estimate for
work that has not been done, and is marked as such.*

## The reframe: the years were a category error

The estate's own grammar is **slots / measured / unmeasured**, and the live board carries **33 slots,
23 measured, 10 declared and empty**. The board's own note says what turns an empty slot into a
measured one:

> *"DECLARED-UNMEASURED slot (2026-10-16). Nothing has been measured: n 0 is the literal truth,
> never a score. Becomes MEASURED only with a frozen sha-pinned bank or method, n_valid >= 30,
> passing the gate."*

Read that carefully: **each open slot is one promotion away, not a programme.** The three conditions
are (1) a frozen, sha-pinned bank or method, (2) n_valid ≥ 30, and (3) the gate passing. And the
estate already collects the data for most of them, at scale, today:

| Census already running | Rows today | Which slot it can close |
|---|---|---|
| `csoai/agent-interop-census` | **191,342** | `interop-conformance`, `measurer-integrity` |
| `csoai/claim-capture-census` (newest re-read wave) | **38,721** across 9 sources | `claim-maintenance` |
| `csoai/gspc-peritem-rows-2026-08-12` | 15,580 | the 13 behavioural axes (already MEASURED) |
| `public/interop/regulator-census.json` | 126 lines | `regulator-transparency` |
| `public/interop/mill-evidence/` | **20,517** rows / 677 cells / 57 models | the behavioural axes (already MEASURED) |

So the honest answer to "how long" is: **the ten open slots are ten promotions of data the estate
already collects. Under two months of one lane's work, and three of the ten are one or two days
each.** What is missing is not a research programme; it is the *promotion machinery* — a frozen
method per slot, the gate, and the board entry.

## The ten slots, in days

The day counts assume one engineer with the repo and the M2. "Promote" means: freeze the method
(sha-pinned), run it, assert n_valid ≥ 30, run the gate, publish, and flip the slot to MEASURED.

| # | Slot | Work to promote it | Days | Blocked by |
|---|---|---|---|---|
| 1 | `claim-maintenance` | Freeze the re-read wave as a method; the 38,721-row newest wave already exceeds n ≥ 30; assert the five outcomes (unchanged / changed with disclosure / changed silently / withdrawn / unreachable) | **1** | nothing |
| 2 | `regulator-transparency` | The census has 126 lines; freeze the 5 check types (guidance, registry, methodology, consultation, contact route) and its body-check rule as the method | **1–2** | nothing |
| 3 | `interop-conformance` | Freeze the contract-parity + remote-census method over the 191,342-row census | **1–2** | nothing |
| 4 | `measurer-integrity` | Needs a census *of evaluation organisations* (who publishes methods, test sets, reproducible results) — the enumeration is the work; the interop census machinery is the template | **3** | nothing |
| 5 | `harness-fidelity` | **Already measurable today:** the same model on the same bank through the mill's `read_label` and through the lm-eval port. The parity test proves the two agree on fixtures; this slot needs the same model run through both on a frozen bank | **2** | a local model host (the M2's Ollama) |
| 6 | `serving-fidelity` | The M2's gateway versus a reference serving on a frozen bank, with the **arm split** published (how many items each arm answered without a model) | **2–3** | the M2's memory (956 MiB) — it OOMs on the client build |
| 7 | `lab-practice` | A census of AI labs: does a lab publish its evaluations, safety framework and incident reports | **3–4** | nothing |
| 8 | `company-practice` | Same shape, for non-lab AI companies | **3–4** | nothing |
| 9 | `interpretability-reproducibility` | What an interpretability group publishes, and whether it can be reproduced | **3–4** | nothing |
| 10 | `humanoid-deployment` | What a humanoid lab has publicly deployed, checked against a public registry. **There may be no such registry** — if the enumeration finds none, the honest end state is that the slot stays declared and empty, and that is the finding | **2–4** | possibly no public registry exists |

**Total: 21–30 working days** for all ten, on one lane. Not years. The two that can carry a run to
MEASURED this week are #1 and #2.

## The measurement backlog behind the measured axes

The 23 measured axes are not finished either. From the fact table (677 cells, 20,517 rows, 57
models, 13 axes, built today):

| Gap | Count | What it costs |
|---|---|---|
| Rows with **no grade** | **2,428** | Re-run those cells. The estate has the routes and the models; a transport error is not a missing measurement |
| Rows with **no model** | **1,290** | Their cell is knowable only by opening the file — the schema variant that carries no model. Re-run, or attribute from the cell index |
| Models held in the repo but **not in the published projection** | **57 − 19 = 38** | The published rows dataset is a frozen 2026-08-12 subset of 19 models. The fact table now carries all 57 |
| Cells per axis | 13 axes, 22–200 cells each | governance 179, safety 200, swarm 44 — the fleet is uneven, and an axis with 200 cells is not comparable to one with 22 |

## The surfaces

| Surface | State | Days to close |
|---|---|---|
| Live board | LIVE | — |
| HF dataset + Space | LIVE, `as_of 2026-10-27T21:20:49Z` | — |
| Kaggle | LIVE, CC BY 4.0, byte-identical to HF (`EXTERNALLY_VERIFIED`) | — |
| GitHub mirror, PyPI | LIVE at the same `as_of` | — |
| Zenodo | **403, account blocked** | owner appeal; no engineering |
| npm | **WebAuthn account**, `npm publish --otp=` can never work | owner mints a granular token with Bypass 2FA |
| CI mirror push | `GSPC_BOARD_TOKEN` secret is dead | owner mints a fine-grained PAT with `contents: write` on `CSOAI-ORG/gspc-board` |
| EEE datastore | PR #241 open, 132 files | reviewer merge |

## The tranche plan

**Day 1 — today.** The fact table: built, gated, declared in `PRODUCERS.json`, 9 parity tests
passing, and published as a queryable dataset so the corpus is one table a stranger can read.
Alongside it: the HF twin, Kaggle, GitHub and PyPI republished at the advanced root
(`2026-10-27T21:20:49Z`) with byte-parity verified.

**Days 2–3.** Promote `claim-maintenance` and `regulator-transparency`: freeze the method, assert
n ≥ 30, gate, publish, flip two slots from UNMEASURED to MEASURED. This is the first time the
board's measured count moves because of new work rather than a new root.

**Days 4–7.** `interop-conformance` and `measurer-integrity`; then re-run the 2,428 ungraded rows
and attribute or re-run the 1,290 model-less rows.

**Week 2.** `harness-fidelity` and `serving-fidelity` — the two slots that need a model host, with
the arm split published.

**Weeks 3–4.** The four census slots (`lab-practice`, `company-practice`,
`interpretability-reproducibility`, `humanoid-deployment`).

**Throughout.** The public projection (`csoai/gspc-peritem-rows-2026-08-12`) is replaced by the
fact table, so the published corpus stops being a lossy 19-model subset of a 57-model corpus.

## What would make this plan wrong

- If a slot's method cannot be frozen (e.g. `humanoid-deployment` has no public registry to check
  against), the slot stays declared and empty, and that is the finding — not a failure to close.
- If promoting a slot requires an owner-only act (an activation signature, a licence decision),
  that act is a day, not a year, and it is the only thing on the critical path.
- The day counts assume the M2 can host model runs. Its 956 MiB of RAM is the one place where the
  estate's own infrastructure, not the science, is the binding constraint.

## The two things that are not days

- **A frontier comparison against a closed model** (GPT-6.1 Terra, Claude Opus 5.5, Gemini 4
  Argon) needs a funded frontier credential. The harness exists and has already been run against
  Kimi K3.1 Pro (24/24 vs MEOK's 9/24, paired exact McNemar p = 6.10 × 10⁻⁵). The only missing
  thing is a balance: the OpenRouter key authenticates, lists `openai/gpt-6.1-terra` among 464
  models, and then answers chat completions with HTTP 402.
- **A doctrine that a slot's absence is a result, not a gap** is already in place and is why the
  board can say "10 declared, 0 measured" and mean it.
