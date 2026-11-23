# Historical 3-Around-1 council: signed source and answer-exposure audit

**Date:** 23 November 2026. **Research state:** OWNER-HELD HISTORICAL SOURCE AUDIT. The audit does not run a new AI model, qualify a protected benchmark, deploy a panel or certify subjective consciousness.

## Original artefacts physically inspected on authorised M4

- Historical source: \`meok-backward-3around1.mjs\`, **944 lines**. Source SHA-256 \`106692808e10993dad220db39af623dc39ff836212469acf23ee09a36ad528fd\`.
- Historical signed result: \`meok-backward-3around1.json\`, **17,654 bytes**. Exact raw-file SHA-256 \`fe9c903cf31e88ba05801c5c194260fbcb17ea832172ab9c4c07619fb48659d3\`.
- Original run date: **26 October 2026**, local model \`qwen3:1.7b\`, claimed 20 historical-ledger queries plus 12 local Ollama capsule tasks.
- Signature: **Ed25519 valid under the public key embedded within the original JSON**, checked over \`JSON.stringify(payload)\` excluding \`signature\` according to the original source code. The internal \`evidence_sha256\` recomputed identically: \`5dcd333ecf056a20db4243cd9feca2c2ec57cfcbad1b1ee29eb829ffb73abf54\`.
- **Source signer identity and key custody were not independently authenticated.** The original signed record does not carry an independently authenticated hash commitment of the script that produced the outputs. Verification of the result with an embedded public key is not an external attestation of research truth.

## Historical published result and what it measured

| Original comparison | Reported correct | Specific input limitation |
| --- | ---: | --- |
| Frozen ledger: oldest-first | 6/20 | Earlier source-horizon |
| Frozen ledger: newest-first | 11/20 | Later source-horizon |
| Frozen ledger: structured 3-around-1 | 20/20 | Author-defined source lookup cases and exact expected outputs |
| Ollama model Seat 1: forward | 5/12 | Only the forward 3-capsule window |
| Ollama model Seat 2: backward | 8/12 | Only the backward 3-capsule window |
| Ollama model Seat 3: LLM synthesiser | 9/12 | Combines the two window summaries |
| Deterministic centre referee | 12/12 | **Directly reads metadata containing the correct option** |
| Combined forward / backward / referee | 11/32 / 19/32 / 32/32 | Different source inputs and referee with answer-bearing labels |

The old study may remain useful as a deterministic bidirectional *source-selection functional test*. It cannot demonstrate that an independent model council learned to solve 100% of blind tasks.

## Repeated counterfactual against the ORIGINAL referee source

The source-extracted function \`gspcCenterReferee(item, fLabel, bLabel, synthLabel)\` was evaluated in an isolated Node VM **without running the original top-level program, loading signing secrets or calling Ollama**.

The exact three metadata fields supplying the referee's answer-choice key were:

- \`meta.newest_active_option\` for 4 supersession tasks;
- \`meta.genesis_floor\` for 4 genesis-floor tasks;
- \`meta.synthesized_option\` for 4 bidirectional-drift tasks.

Every one of the twelve fields equals its task's \`gold\` label. With all three seat labels forced to deliberately wrong choices, **12/12 referee choices still equalled gold**. Removing those answer-bearing metadata fields and repeating the all-seats-wrong condition yielded **0/12** correct. This confirms that the 100% historical referee accuracy is fully explainable by knowledge of the answer-choice metadata rather than independent model prediction.

The original raw source and result files were preserved. Only a pure, read-only extraction and counterfactual ran; no actual 2026 local Ollama call was repeated.

Reproducer: \`audit_historical_triad.mjs\` in this directory, accepting an owner-authorised local original script and the matching JSON record as \`--source\` and \`--record\`; the program emits aggregate findings, not source questions/private keys. Embedded-signature tamper tests, source–result mismatch and answer choice removal controls are covered by \`test_audit_historical_triad.mjs\`.

Audit report digest: \`9ee87a14cb295f5bfef726726acd97e94c5baaf908445859c02026f26824c0e9\`.

**7/7 Node test cases passed on each of the two connected Macs.** The original source/result exact-file audit ran on the M4 holding those project artifacts; the M2 independently reproduced synthetic regression controls. Two owner-operated devices do not establish external scientific independence.

## Corrective publication dependency

The public [Hugging Face ORB-III dataset card](https://huggingface.co/datasets/csoai/hitl-academy-orb3) was checked on 23 November and still states “100.0% (32/32, McNemar p=9.54e-7)” without disclosure of the answer-bearing referee metadata.

**Open tracking issue: [#4737 — historical 3-around-1 metric depends on answer labels](https://github.com/CSOAI-ORG/councilof-ai/issues/4737).**

Required safe correction is a dated source-preserving limitation/supersession note: original fixed-rule demonstration yes; independently blinded AI council benchmark no. The exact historical p value is conditional on the implemented oracle-like rule and the constructed cases, and **cannot** be used as evidence that the model council will generalise with 100% accuracy on novel unseen tasks.

Do not silently overwrite the original signed result, self-approve an Academy skill, or claim governance authority based on this audit. The existing protected publication and HITL approval process must handle the final external copy.

## Scientific replacement, measurable test

1. Freeze a genuinely novel bank under a separate custodian before subject-model calls. Keep gold and A/B/C/D answer positions outside the referee and its prompts, tool results and metadata.
2. Supply independent, *externally verifiable* source objects (not \`newest_active_option\`/other gold-equivalent field) with signed ordering, revocation/supersession lineage, keys and policy scope.
3. Compare matched subject conditions on new tasks: forward-only, backward-only, unbiased synthesis and **source-checking referee**. Score the referee only against a separate offline independent grading key.
4. Include 12-agree-but-wrong and 6:6 disagreement controls; verify that source facts override unverified consensus, but cannot create a truth verdict without evidence. Preserve HOLD/UNCHECKABLE.
5. Test adversarial counterfactuals: newest tampered, genesis superseded, missing root, spoofed source signature, unsigned human approval, selection with no answer, wrong policy epoch and wrong-task key leak.
6. Report unconditional correctness, abstention, provenance errors, paired uncertainty, compute cost and hard failures. Require an actually independent reviewer and rights/privacy gate before promotion.

The new **\`evidence_rule_referee.py\`** already demonstrates on the live GSPC public board that unauthenticated 12/12 false votes cannot override derived source counts. It is an intermediate **public-source rule** check, not proof of this stronger prospective blinded benchmark.

## Protected acceptance status

All research remains under draft PR #4730. Dedicated GitHub Action includes Node 22 tests plus the existing Python research suite. A passed unit test is not a merge, external acceptance, new GSPC axis, protected MEOK policy change, or deployment.
