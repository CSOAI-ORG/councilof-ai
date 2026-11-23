# HF BFT Council of Referees — original evidence recovered and reviewed
**Inspection:** 22 November 2026 UTC  
**Source:** [csoai/gspc-master/capability-records/meok-bft-council-of-referees.json](https://huggingface.co/datasets/csoai/gspc-master/blob/main/capability-records/meok-bft-council-of-referees.json)  
**Source-evaluation timestamp:** `2026-10-27T02:59:37.008Z`  
**Exact current file SHA-256:** `2b727f6b4051ddae0200aaca924599d53706e2dea01f46c28d5795d6d68859c7`  
**Embedded signer SPKI SHA-256:** `29b7ea31d834532f20468ac53b8b2b48570bf929bad3086ecf8d5c0b8d4aff00`  
**Classification:** signed historical experimental measurement. NOT independently certified, accepted as a charter decision, or a proven fault-tolerant runtime.

## Evidence recovered — do not erase or rebuild

The Hugging Face record explicitly contains the 12-Around-1 specialist council and multi-referee results. The earlier Council-only review missed this external evidence. It is therefore incorrect to say **no BFT/referee experiment exists**. It is also incorrect to say this proves a staffed human working group, independent quorum or Byzantine safety under an asynchronous protocol.

The file contains four declared study results:
- 13 GSPC item corpora: `782/782` reported for 12-Around-1 plus specialist referees versus `484/782` for best single base and `248/782` for a single monolithic referee.
- Injected fault matrix: `237/237` at f_ref=1/f_seats=3 reported for 5-referee + 12-voter setup, with 18 matrix rows.
- Separate 72-item held-out set: `72/72` reported.
- 24-item eight-frontier-model comparison: `24/24` for proposed complete architecture versus `21/24` for the best single model; the stored per-item predictions were recounted locally and the 24/24 arithmetic matches. The report claims 192 requested live inference calls, 185 successful. Provider call logs, failures and original ground-truth provenance were not independently inspected in this review.

The corresponding Hugging Face dataset `csoai/arena-rounds` contains 3,052 deterministic referee arena rounds. That is a separate historical measurement series and must not be added to the 782/237/72/24 denominators.

## What was independently checked here

1. Downloaded the entire 48,642 byte HF JSON record through the connected Hugging Face reader; computed exact SHA-256.
2. Verified the Ed25519 signature using Node crypto on the exact compact JSON encoding of all document properties other than the signature field. Signature verification returned **true** for the public key embedded in the report. The verification module and negative tests now live in `scripts/control-plane/hf-bft-evidence.mjs` and `hf-bft-evidence.node-test.mjs`.
3. Validated the 24 item predictions against 24 included expected labels and re-counted all listed architecture model results. Full architecture: 24/24; best individual openai/gpt-oss-120b: 21/24.
4. Confirmed the two live public DID routes (`councilof.ai` and `csoai.org`) exposed eight verification methods each on 22 November, **none matching** the embedded historical signer's public-key fingerprint. This is not proof the signer was unauthorised in 2026-10-27; a historical trusted key registry/rotation record could resolve it.
5. Examined the 5-referee 3-of-5 statement: the minimum intersection of two 3-of-5 quorums is one replica (`2*3 - 5 = 1`). If one replica is Byzantine, that overlap may be Byzantine. The threshold by itself is **insufficient** to guarantee protocol safety under conflicting quorum decisions. Additional protocol phases/locking, fault model, identity separation and adversarial scheduling evidence would be required. Empirical fault-injection accuracy is valuable but a different result.
6. The report's fault-sweep topology describes 5 referee seats; the frontier architecture description references a 6-domain referee council. Reconcile exact role and replica counts rather than silently treating the labels as equivalent.

## Linkage to Council + MEOK + Human Working Groups

The record is a **source evidence node** in the proposed ontology:
```text
HF signed historical BFT study [source-sha256]
  ├─ has result → 13-corpus deterministic ablation
  ├─ has result → injected fault sweep
  ├─ has result → 72-item held-out set
  ├─ has result → 24-item 8-model frontier comparison
  ├─ challenges → Council registry observation BFT_NOT_DEMONSTRATED (different scope)
  ├─ needs → independently pinned issuer key & source method / raw transcript
  ├─ needs → protocol safety/liveness adversarial cross-host re-run
  └─ review candidate → Evaluation, Provenance and Agent-Control working groups
```
Neither the experiment nor this reference graph grants Council H.I.M. authority. A genuine human sign-off requires enrolled persons, accepted mandates, independent keys, revocation, verified case binding and the existing `csoai.hitl-authority-effect/0.1` execution boundary. No W3C, IETF, LF/OSAA, SAFE or other external working group is automatically tasked.

## Immediate reproducible tasks (new work, not new claims)

1. Preserve/retrieve the **frozen October 27 exact source** including model invocation logs, judge/rubric/expected-label preparation, random seeds, failure handling, fault-injection driver, and original key custody.
2. Distinguish 12 independent role ballots from 12 entries created by one machine. Replay 5-referee conflicting quorum scenarios, correlated failures, equivocation and network partitions; record safety *and* liveness.
3. Replicate the 782, 237, 72 and 24 denominators with the original code and holdout licenses. Use an evaluator not involved in preparing the expected answers, with changed-label negative controls.
4. Review historical signer identity, DID rotation, and public acknowledgement. Do not remint/sign a new historical card to conceal key ambiguity.
5. Map reviewed outcome as a historical evidence link into the existing claim-maintenance ledger/ontology. Keep open limitations and new findings separate from outdated 'no experiment' wording.

## Other evidence strands found

- Existing referee continuation: `docs/operations/referee-followthrough-20261107.md`, pure renderer 56 tested projection cases, not independent BFT acceptance.
- The Council 33-role registry declares 0 verifiable votes in its *separate* observation; this cannot retroactively invalidate or replace the October HF study.
- Earlier 3 October local prototype included 12 voters + referee, 276 verified envelopes on three hosts; three hosts do not independently establish the stated f=3 topology. The historical local directory may be inaccessible under current Desktop Commander scope; do not bypass permissions.

**No legal/charter change, membership representation, external submission, new signed card, token mint, operational authority, production deploy or reviewer appointment is made by this review.**
