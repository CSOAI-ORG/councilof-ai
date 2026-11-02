# Keep an evaluation useful when you change tools

Changing an evaluation platform can leave you with two similar-looking scores and no way to explain the difference. Start with **one non-sensitive evaluation your team owns**, not the whole warehouse. The aim is to establish which inputs, rules and results survived. It is not to award a new score.

## What to retain

| Evidence | What to record before moving | What to check afterwards |
|---|---|---|
| Cases | Stable case ID, input/reference bytes, labels, rights and exclusions | Did any case disappear, change, duplicate or move to a different split? |
| Grader | Exact rule, version, input-field mapping, thresholds and treatment of missing output | Run an expected match, a deliberate mismatch, and a missing-result case. Preserve the original answers. |
| Run | Subject and version, prompt and parameters, run date, attempted/scored/excluded counts | Compare the same units; distinguish a replay from a fresh model run. Unavailable versions mean comparability is unresolved. |
| Result | Per-case output or a restricted-access reference, not only the aggregate score | Can the receiving reviewer identify the first disagreement? A missing result is unknown, not zero. |
| Handoff | Original and destination artifact identifiers, who is allowed to see them and how long they are kept | Reopen the exact result without creating another run. Record the recipient's correction or decision separately. |

**Example (synthetic):** Both tools report 2 of 3 cases passing. In the original, A and B pass; after migration, A and C pass. The headline is unchanged, but the answer has changed on two cases. Report the disagreement and investigate the case IDs, reference values and grader mapping before attributing it to model behaviour.

## What a reviewer can do now

1. Inspect a published [GSPC board result](https://councilof.ai/dashboard?tab=board) and its dated scope. The board is not an importer for private evaluation runs.
2. For a supported Council measurement card, use [the free verifier](https://councilof.ai/gspc-verify/). A matching signature does not attest to an arbitrary third-party export or prove two grading methods equivalent.
3. To discuss a scoped review, use [Get results in Council OS](https://councilof.ai/dashboard/?tab=home). Start with a description of the migration, not a raw customer log. Agree the data rights, transfer, retention and deliverable before sharing any private material. An enquiry is not an order or a completed measurement.

## Why this is timely

OpenAI's [deprecation notice](https://developers.openai.com/api/docs/deprecations) lists 31 October 2026 for existing hosted Evals to become read-only and 30 November 2026 for the scheduled dashboard/API shutdown. Its [Promptfoo guide](https://developers.openai.com/cookbook/examples/evaluation/moving-from-openai-evals-to-promptfoo) describes manually recreating evaluations; [Langfuse's migration guide](https://langfuse.com/resources/engineering/migrate-from-openai-evals) describes another route. Choose the host for your evaluation needs; retain evidence independently of that choice.

Reviewed 2 November 2026. This is a product-method guide, not a vendor affiliation, turnkey migration service, certification or promise of equivalent scores.
