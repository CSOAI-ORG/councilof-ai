# GSPC freshness chain: read-only audit

Observed 2026-09-24T17:04–17:09Z. This is an evidence receipt, not an admission or deployment.

| Surface | Observation |
| --- | --- |
| Public `https://councilof.ai/api/gspc` | Two byte-identical anonymous reads, SHA-256 `be45a7ed47dc7f43a0ab83b75d3ce60909f918ecf386af7c11a78c0d5a708cca`. Its `measured_on.living_stamp.gold_run` is `2026-08-18T03:22:16Z`; the human-readable behavioural-axis dates say 2026-08-12 and jail 2026-08-18. Financial facts have a separate `as_of` of 2026-09-07T11:30:35Z. The response describes its roster as that of the deploy, not a live re-fetch. |
| Mill `fpowppss5ngtkw` | Natural hourly run `20260924T16-mistral-nemo-12b` finished at `16:23:14Z`, grading 14 behavioural axes and reporting 14 signed cards. At `16:50`, `mill-hourly-land.sh` merged branch `mill/auto-20260924T16`; commit `095a465fb` is an ancestor of current RunPod master. No expensive run was started for this audit. |
| Exact public card | `https://councilof.ai/interop/mill-cards-signed/signed-governan-094eeb5b0c8d.json` returned 200 with byte SHA-256 `6f9510a8944887f8ca61549d9f0771e212ebe5b7ccff70ea2e31faa7a30ff199`, matching RunPod. Independent Ed25519 verification against the current public DID document returned `VALID`. This proves a signed, served **card**, not board admission, Bitcoin anchoring, or a new fleet comparison. |
| Scheduler | `/workspace/lanes/loops/scheduler.sh` runs `mill-hourly.sh` near :10 and `mill-hourly-land.sh` near :50. The landing script queues guarded deploy and runs `hub-flip.sh`. |
| Hub flip | `/workspace/lanes/out/hub-flip-20260924T165019Z/flip-out/flip-report.json` has `cards=1423`, `flipped_this_run=0`, `cells_before=262`, `cells_after=262`, `writes_board=false`. Its code intentionally excludes `ollama:` models from Hub-queue matching. It indexes cards but does not revise the GSPC board. |

## First actual board gate

`/workspace/ci/councilof-ai/functions/api/gspc.ts` serves `AXES_A`, `AXES_B`, `AXES_C`, and `AXES_FIN` from static TypeScript modules and imports a static `MEASURED_ON`. The scheduled mill lands and publishes per-model cards, while the Hub flip explicitly does **not** write the board. I found no scheduled producer that aggregates the new cards into a reviewed, statistically comparable axis snapshot and updates those modules. Thus a successful mill, card signature, master merge, and site deploy can all occur while `/api/gspc` remains August-dated. This is a missing board projection/admission step, rather than proof of a deployment failure.

There is also an authority gap to resolve before treating these as admitted board evidence: the initial verification receipt for a sample run states `VERIFIED_QUARANTINE` and `authority.admitted=false`; the RunPod path bypasses current Hub admission checks in `sign_mill_cards.py` while signing cards under `did:web:csoai.org#board-attestation-1`. Do not infer admission from the signature or HTTP 200 alone. This needs a reviewed authority transition and key-scope check.

## Smallest safe next action

Have the board/evidence owner define and test a candidate-only projector in an isolated branch: select same-bank, same-fleet signed cards; validate provenance, signature/key scope and admission; recompute per-axis sample counts and uncertainty/separation with own-model exclusion; output a diff against current `AXES_*` and `MEASURED_ON` **without writing production modules or deploying**. Review one axis end to end before broader promotion. A single new model card must never be substituted for a fleet-level board result.

## Time-sequenced reconciliation (added 17:13Z)

The `16:38Z` focused review commit `be2a26e45` correctly described these **same 14 wrappers** as review-only and unserved at that moment. Its source was natural mill commit `095a465fbe2b52d517538eec4d28000d675504f6`, and its governance card ID was `094eeb5b0c8d700747f99a646f9c27e1cb2da43b8e7fa670c7bff181b4e379d5`. At `16:50Z` the hourly lander merged that natural mill branch into RunPod master; by `17:04Z` the governance card was public at the URL above. A second anonymous browser-UA read at ~17:13Z again returned HTTP 200 and SHA-256 `6f9510a8944887f8ca61549d9f0771e212ebe5b7ccff70ea2e31faa7a30ff199`, identical to `095a465f`. Python urllib gets a Cloudflare 403 on the URL, while browser-UA curl gets the card; access method matters. The signed card says `quotable=true`, but its original intake receipt remains `VERIFIED_QUARANTINE`/`admitted=false` with no observed authority-transition receipt. That is a publication/admission inconsistency requiring explicit owner review. It has **not** been projected into the GSPC fleet board.
