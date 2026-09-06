# F55 — Vals AI's methodology page, read properly

`vals.ai/methodology` is the closest peer artefact to our own method surface, and one of very few
real pages the competitor probe found (its host 404s the control, so the 200 is genuine).

## What they publish, in their words

| | Vals AI |
|---|---|
| Results | accuracy with **error bars**, latency, cost, qualitative insight |
| Validation sets | **public** — sample types are open |
| Infrastructure | **open source** — Valkyrie, the distributed evaluation system, and a model library |
| **Test sets** | **private.** *"This dataset remains private at all times, and is the only dataset that is used for the benchmarks we publish."* |
| Why | *"A major problem with evaluations of AI models is test-set leakage."* · *"Scores are based on our privately held test sets to preserve the integrity and signal of our results."* |
| Cryptographic attestation | none found |
| Corrections / errata record | none found |
| Commercial | the private set is **licensed** to companies for internal validation |

## The comparison I nearly got wrong

The easy write-up is *"they hide their test set, we publish everything."* **That is false, and it
would have been the third framing error of the day.**

**We hold out item banks too.** `docs/ip/IP-REGISTER-2026-09-05.md`: *"Trade secrets — held-out
evaluation item banks (anti-overfit), contents never disclosed."* The verifier corpus even carries
`i004-tampered-heldout.json`. On test-set withholding **our posture is the same as theirs**, for the
same reason, and claiming a transparency advantage there would be straightforwardly wrong.

## Where we actually differ

Both bodies withhold the item bank. The difference is **what happens to the results afterwards.**

| | Vals AI | Council of AI |
|---|---|---|
| Test set withheld | **yes** | **yes** |
| Anti-contamination rationale | stated | stated |
| Results published | yes, with error bars | yes |
| Results **signed** | no | **yes** — Ed25519 under `did:web:csoai.org#card-attestation-1` |
| Result set **recomputable by a stranger** | no mechanism published | **yes** — 335/335, script published |
| **Own errors published** | none found | **46** in `/api/corrections` |
| Infrastructure open-sourced | **yes — Valkyrie** | partially |
| Commercial model | licenses the private set | never sells a grade; assembly priced at the 402 |

**Their integrity mechanism is secrecy: nobody can contaminate what nobody can see.** That is a real
and standard defence, and error bars are a discipline our cards do not carry.

**Ours is attestation: the result is signed and the chain is recomputable, so you need not trust the
issuer's word about what was produced.** It does not solve contamination — the held-out bank does
that, same as theirs.

**Neither mechanism substitutes for the other,** and a body doing both would be stronger than either.

## What they do that we should consider

- **Error bars on published scores.** Their accuracy figures carry them; our cards publish a bare
  `accuracy` float. A measurement without an interval overstates its own precision, and we have 335
  cards doing that.
- **Open-sourcing the evaluation harness itself**, not only the verifier. Valkyrie is public; our
  harness is not.

Both are recorded as rows rather than asserted as gaps — neither has been costed.

## What this does not establish

- Nothing about whether either body's measurements are **correct**.
- Their page is what they *say*; only our own chain was independently executed. This is a reading of
  a published page, not an audit of Vals AI.
- No claim that withholding a test set is worse than signing results. **It answers a different
  question.**

_Read 2026-09-06. Control-verified host. Quotes verbatim from the published page._
