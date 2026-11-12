# Specialist-output compatibility review

10 November 2026. Pure research candidate, not a deployed router, a new canonical evidence schema, or an authority service. No existing source, signed history, production runtime, model provider or scheduler is replaced.

## Why

The retained small-image experiment showed a useful but limited output-mixture result. Reanalysing its exact predictions, the MLP/Fourier hybrid rescued 4, 5 and 6 errors on the three held-out splits, while introducing 2, 1 and 1 errors. The two source specialists also agreed on wrong answers in 3, 7 and 7 cases respectively. The splits overlap; these counts are not independent replications. Correct interface shape and model agreement are not correctness or independence.

Retained prediction file SHA-256: `eedddd528e71f26e6027210d9ec4db5711f1716d65d4f50747b362a4ef8f86e4`. This reanalysis creates no new model outputs or training results and does not select a validated new router.

## Implemented scope

`join_contract.py` validates and combines at most 16 categorical prediction vectors. It requires the same task, exact input digest, ordered label schema, source snapshot and dependency root; explicit complete dependencies; a future result-validity boundary; immutable content-revision digests; finite numeric probabilities; and distinct component/result identities. Weights and abstention thresholds are caller-declared, not selected using hidden test labels.

Outputs remain PREDICTION_NOT_OBSERVED or ABSTAIN, UNSIGNED, replies HELD and authorises_execution=false. Provider authentication, source truth, calibration, real failure-domain independence and current action authority are NOT established. A declared fault-domain string is descriptive, not attestation. Result/source digests bind supplied references but are not signatures or proof that the named bytes were independently inspected. A caller-provided context must be checked by the existing authenticated receiver before operational use.

The SHA-256 `revision` field is a content revision, not a Git commit identifier. This derivative research result is not `csoai.evidence-event/0.1`; it must be referenced through the existing event/authority profiles if an owner later adopts it. Do not feed continuous state-regression outputs into a categorical probability join just because both happen to be vectors.

## Actual Hugging Face execution

Job: https://huggingface.co/jobs/csoai/6af294e89737d9a9e08ee4c5

The connected Jobs API returned COMPLETED, created at `2026-11-10T03:52:08.458Z` and finished at `2026-11-10T03:52:15.831Z`. It used `python:3.12-slim`, cpu-basic and a hard 120-second timeout, with no injected credential, GPU, mounted bucket, publication or schedule.

The job downloaded the three source files at `dc01fb7989603c231ec46d3c3d21cd6c5f7b971d` and checked SHA-256 before execution:

- join_contract.py: `eb776d8654532aff5b8b2e286dc6e282cd626500839aba3eeebbd20d35eeffe8`
- test_join_contract.py: `95bee6e49775aee7e03ad66c9fffdeb394d436d79bf363cf061a40f09ded5445`
- hf_qualification.py: `e48d5b597fade2d309a708097b2d22e3e000da661531cdc35efd046695a36b70`

It passed all **42 contract tests**, then replayed the existing published synthetic process model from #4176 on **560 retained test rows**. Mean absolute error was `0.0028797331109599016`; maximum error was `0.7499076603275624`. All predictions were finite normalized proportions; five invalid-input controls were rejected. A low mean does not remove the large tail error. The exact fixture engine remains the reference; this replay is not new real-world validation or new training.

Model revision: `csoai/meok-process-world-v0@90d6aa6c87629b9f4296142ba2019247b51686c4`.
Dataset revision: `csoai/meok-process-world-transitions-v0@4a522537c9eb1522a3aad1432e9626e72e3a2733`.
Exact predictor/weights/test-byte pins are in `hf_qualification.py`.
Prediction readback SHA-256: `ef9fb271cc616dc2a10d78586c1739be9135c9ff734c4e343198d5245f3d971f`.

This was one paid CPU Job capped at two minutes. No exact billed amount was returned. An initial integer-timeout request failed parameter validation before any job was created; it was corrected to the connector's documented string timeout. No second compute job was launched.

## Additional local qualification

Three temporary-source mutation controls deliberately weaken strict dependency truth, ordered-label checking and the non-authorizing output. Each fails the intended assertion, not an import or syntax error. The combined local suite is **45 tests**; the three later mutation tests must not be relabelled as having run in the earlier 42-test HF job.

Reproduce:

```sh
python3 -B -m unittest discover -s harness/component-join-review -p 'test_join*.py' -v
```

The ordinary `scripts/component-join-review.test.ts` wrapper adds this suite to existing test discovery; it changes no workflow or schedule. Final-head hosted status must be read separately. The original local weight-scaling test exposed a last-bit difference; normalizing coefficients before mixing fixed that candidate before the HF execution. No upstream test was removed.

## Existing-owner coordination

- **#4176 process-model owner:** model, data and original training lane remain unchanged. This pass reuses its exact public artifacts. Regression-state vectors and categorical outputs remain different contracts.
- **Existing dependency-graph owner:** explicit node retirement, evidence-append semantics and incomplete-traversal handling remain their caller-level work. This gate rejects incomplete or mismatched supplied context; it does not silently repair graph state.
- **Referee owner:** qualify actual provider/control-plane identity and error complementarity. Different names or schemas are not independent voters.
- **Existing HF publication owner:** Spaces host apps; Jobs execute finite work; Buckets are mutable non-versioned working storage. This job does not publish a Space. The connected HF repository scope was read-only, so no account/permission changes or credential extraction were attempted.
- **Release and signing owners:** retain protected merge, live endpoint acceptance and signing custody. Source publication and a hosted test do not prove production deployment or end-user acceptance.

The separate 100-candidate adoption review is a derivative working report, not another canonical catalogue. All candidates have proposed role/IO/test boundaries; 67 root package manifests and six selected pinned implementation/test/example slices were read. That is not a complete audit of 100 repositories. Exact code/weights/data/service licences require separate adoption review.

No production merge, endpoint registration, paid GPU, model training, physical photonic test, external reply, signing, customer acceptance or financial-value claim is made.
