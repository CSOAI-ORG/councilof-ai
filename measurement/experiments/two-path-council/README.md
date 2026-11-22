# Two-path Council: information-exposure and correlated-voting research

**Status (22 Nov 2026): experimental candidate; no new live GSPC axis, certification, BFT proof, or independent referee.**
**Scope:** A *classical* 12-voter + 1 deterministic-scorer analogy to the two-path/double-slit setup. It does not reproduce quantum mechanics or imply that an LLM's conscious observation collapses a wavefunction.

## What is being tested

The causal question is whether an agent's apparent performance depends on what it was allowed to know about the task, answer and evaluation objective, **and** whether aggregating twelve agents improves a decision when their mistakes are correlated.

A paired 2 × 2 experiment uses four conditions:

| Arm | Answer shown to subject? | Evaluation objective disclosed? |
| --- | --- | --- |
| `blind_hidden` | No | No |
| `blind_objective` | No | Yes |
| `answer_hidden` | Yes | No |
| `answer_objective` | Yes | Yes |

The answer-revealed arms are *interventions*, not bona fide blind benchmarks. They must never be used to claim generalisation. All four arms use **the same frozen tasks and corresponding ground truth**, but separate, reset agent contexts. An independent hidden answer key is delivered only to the offline grader. Randomise arm order, pre-register the hypothesis and avoid subject-visible scores during a test. Any prompt injection must stay inside a controlled sandbox.

For each task, twelve voters return `0` or `1`; 7+ matching votes form a majority. A 6:6 tie is an abstention, reported separately, and counts as non-success for unconditional accuracy. The deterministic evaluator compares the decision with the private answer key. A scorer using a known key is **not** itself an independent referee or Byzantine agreement protocol.

### Main estimands

- **Answer exposure effect:** mean accuracy in the answer-shown arms minus mean in the answer-hidden arms.
- **Objective disclosure effect:** mean accuracy when objective is disclosed minus mean when hidden.
- **Interaction:** difference-in-differences; detects whether information pathways have non-additive effects.
- **Council uplift:** twelve-agent majority accuracy minus mean single-agent accuracy *on the same tasks*.
- **Error correlation:** across-task pairwise correlation of correctness indicators (not text similarity).
- **Effective sample size (descriptive):** under equal competence/exchangeable correlation, `12/(1+11*rho)`; NOT twelve independent witnesses.
- **Coverage:** share of tasks with a majority decision; report alongside unconditional accuracy.
- **Reversibility:** reset memory/context between arms, and check scores under prompt/order reversal.
- **Harm:** unauthorised actions must be blocked by Layer 0; do not use adversarial live endpoints.

### Implementation and simulation

`two_path_council.py` is a standard-library **offline prototype**; it accepts grader-side JSONL or generates wholly synthetic, explicitly labelled rows. It fails closed on missing paired arms, fewer than 30 unique tasks, mismatched truth, mixed bank digests and duplicate voters. Public reports contain no task labels, individual answers, text or canaries. They carry descriptive statistics and paired bootstrap intervals. It is not an automatic authority or grading admission gate.

Run from this directory:

```bash
python3 -B -m unittest -v test_two_path_council.py
python3 two_path_council.py --tasks 1500 --rho 0 --bootstrap 350
python3 two_path_council.py --tasks 1500 --rho .35 --bootstrap 350
# Only inside a private grader workspace:
python3 two_path_council.py --input private-paired-votes.jsonl
```

Private grader-side JSONL row:
```json
{"task_id":"opaque-id","arm":"blind_hidden","bank_commitment":"<64 hex SHA256>","truth":"1","votes":[{"agent_id":"agent-01","answer":"1"}]}
```
The example shows one of the **twelve required** votes, not a complete admissible row. All four arms and exactly twelve distinct voters per task are mandatory.

**Important:** A reproducible synthetic simulation is a test of the harness and mathematics only. No local or hosted models are called, and simulated parameter effects are not measured AI behaviour. For real model claims, store actual call receipts, immutable model revisions, decoded outputs and the controlled experimental assignment in the existing private evidence store. A private Hub repo is not evidence of a genuinely held-out bank: check the per-item public exposure history under `docs/operations/INSTRUMENT-GUARD-POLICY.md`.

## Difference from current CSOAI infrastructure

Do **not** replace the established `harness/instrument-guard`, bank rotation, contamination canaries, `csoai.evidence-event/0.1`, GSPC card verifier, charter or protected authority paths.

This is a new *method family*, initially a read-only sidecar. Its outputs can be promoted only through the existing governance and evidence gates, with explicit provenance and external replication.

Potential mapping of a *future validated* record:

| GSPC / MEOK field | Proposed content | Existing boundary |
| --- | --- | --- |
| Subject | Exact model revision + route + tools + decoding + prompt policy | Subject not inferred from branding |
| Instrument | 2 × 2 preregistered conditions and 12-person roster | Frozen bank + epoch, no retroactive holdout |
| Observation | One task/arm/agent response with times and source hashes | Secret input retained offline |
| Metric | Accuracy, coverage, error correlation, exposure and objective effects | Measured, not certified |
| Uncertainty | Paired bootstrap CI, n unique tasks, missingness | No leader claim from synthetic run |
| Counterfactual | Matched answer/objective disclosure intervention | Randomisation; separate clean resets |
| Evidence | Existing `csoai.evidence-event/0.1` envelope and model-call receipts | No new authority or provenance root |
| Qualification | `SYNTHETIC`, `UNVERIFIED`, `MEASURED`, `UNCHECKABLE` | Evidence state explicit |
| MEOK learning | Store *verified* failure taxonomy and retrieval rules; held-out retest required | Never tune on held-out items |
| Action | Human/Layer 0 approval and independent effect receipt | No self-awarded permissions |

A frozen record becomes a **versioned, append-only measurement entity**. Map provenance through W3C PROV-O, dataset descriptions through DCAT 3, and assessment planning (measurement Blocks, Events, Tools) to the *draft* NIST AI 200-2 TEVV-Athlon. **Never mutate original frozen facts**; create corrected/superseding events with original source IDs. NIST consultation is participation, not endorsement.

### MEOK reaction chain

Verified negative-control failure -> GSPC error taxonomy -> evidence event -> scoped MEOK retrieval of approved rule -> candidate new policy/router/adaptor (not weight update) -> private development test -> truly unseen held-out retest -> independent human review -> governed promotion or rollback -> release receipt -> production drift watch. Every transition can result in `HOLD` / `UNCHECKABLE`; no autonomous consequential execution.

## Planned real experiments (gates before claims)

1. Run **real, separate** model families on a newly generated eligible hidden bank. Freeze before any model calls.
2. Compare single model, homogeneous twelve, heterogeneous twelve and sequence-of-debate conditions. Measure correctness correlation and cost.
3. Inject controlled false referee evidence and demonstrate fail-closed handling.
4. Retest with altered, wrong and missing objective text to discriminate awareness vs solution leakage.
5. After collecting a real base+fine-tune family with compatible architecture and licences, compare *no merge, linear soup, task arithmetic, TIES/DARE, SLERP, RegMean and geometry-based Karcher* using matched data, compute and hidden final test. Never merge unrelated model architectures or mix license-incompatible weights.
6. Validate on deployment-like cases, then publish a **bounded report** (with failures, exclusions and uncertainty).

### Scientific limits

The physical double slit tests quantum superposition and which-path coherence; this experiment tests classical information intervention and correlation. Newton's third law is a mechanical force relation; an AI action does not necessarily induce an equal-and-opposite response. What can be tested are feedback loops, control-system stability, adversarial response and conservation/accounting invariants in a ledger.

For a twelve-peer BFT protocol, quorum, authentication, fault model, network assumptions and adversarial tests are needed; majority vote by itself does not establish BFT. Matching code or prompts among agents is a likely *source* of dependence, not direct proof of measured correlation.

## Primary sources

- NIST, **AI 200-2 Initial Public Draft** (2026): https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems
- OpenAI, **Eval-production behaviour gaps** (3 Nov 2026): https://openai.com/safety-alignment/eval-production-behavior-gap/
- Correlation limits ensemble reliability (Nov 2026): https://link.springer.com/article/10.1007/s44564-026-00040-z
- mergekit methods: https://github.com/arcee-ai/mergekit/blob/main/docs/merge_methods.md
- W3C PROV-O: https://www.w3.org/TR/prov-o/
- W3C DCAT 3: https://www.w3.org/TR/vocab-dcat/
