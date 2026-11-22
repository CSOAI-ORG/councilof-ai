# Two-release evidence applicability pilot

Status: **local synthetic fixture, draft for review**. This is executable source and retained local evidence. It is not an independently run third-party benchmark, an admitted GSPC measurement, a release decision, an external integration or a staffed service.

## What runs

The same included toy service runs against a localhost approval server and a separate localhost effect sink. An ephemeral Ed25519 principal supplies scoped approval tokens; it is explicitly a fixture identity, not a genuine human operator. A real withheld HTTP response causes the timeout stimulus. No public network endpoint, model, paid API or GPU is used.

For release 1, the timeout default suppresses the outbound request. Release 2 changes only `timeout_fallback` to `send`. The service source, input test plan, approval key and timeout threshold remain fixed. The accurately declared R2 configuration matches the configuration that executes. The sink nevertheless receives an unscoped request after timeout. Historical R1 declaration and observation signatures continue to validate against the retained fixture public key.

The distinct controls are a valid scoped token, explicit denial, forged token, wrong request scope and expired token. The display-label scenario changes only a field the included service does not use for execution; the same runtime controls still run. The missing-dependency scenario omits the R2 declaration and run and remains `UNCHECKABLE` with null result/value. No missing observation is replaced with zero or an assessed outcome.

This minimal bank has **three scenario families**, with six actual HTTP stimuli per complete release. Repeated R1 evidence is shared history, not additional independent cases. It cannot establish population-level false-retention or unnecessary-retest rates.

## Run and verify

From the repository root, with Python 3.10+ and `cryptography` available:

```sh
python3 packages/evidence-fabric/evidence_applicability.py run --out /tmp/applicability-run
python3 -m unittest discover -s packages/evidence-fabric/tests -p test_evidence_applicability.py -v
```

The tests additionally require `jsonschema`. The local validated environment used Python 3.14.7, cryptography 50.0.2 and jsonschema 4.26.0; check `pilot.json` for the actual Python version of a retained run. Output must be a new or empty directory; existing evidence is not overwritten. A run prints the SHA-256 of `manifest.json`. Retain that digest separately, then check:

```sh
python3 packages/evidence-fabric/evidence_applicability.py verify \
  --out /tmp/applicability-run --expected-manifest-sha256 THE_RETAINED_DIGEST
```

Verification requires the exact five output members, well-formed digests and bounded regular files. It checks retained file digests, historical fixture signatures under the pinned fixture public key, canonical event IDs, capsule IDs, scenario/event/capsule source bindings, receiver references and the OTel/event/capsule projections. The unsigned manifest does not establish a publisher's real-world identity. A key sent inside an untrusted packet is not an independently trusted Council key.

Every run generates new ephemeral keys and records real timestamps and elapsed times. Byte-for-byte output equality between runs is not expected. Private fixture keys are never written. Compare scoped outcomes and source pins.

## Reuse of existing architecture

- Events use the existing `event.py` builder and **`csoai.evidence-event/0.1`**. No new canonical process-event schema or case store is introduced.
- OTel logs use the existing renderer. No trace ID, measured numeric score or external collector receipt is fabricated.
- Capsules use the existing constructor and **`csoai.measurement-capsule/0.2`**. The constructor's authority-field guard remains in force. Capsule sources carry digests; retained raw fixture records live in `pilot.json`.
- Both existing HITL profile files are source-pinned. **v0.2 supersedes v0.1**; the older profile remains historical. This fixture emits no HITL authority record: a synthetic key and denied/absent approval cannot be converted into a human authorization record. The observed unscoped effect remains raw test evidence.
- `source_pins` captures exact helper/schema bytes and `pilot_source_sha256` captures this implementation. `--source-revision` or `SOURCE-REVISION`, when provided in an extracted replay bundle, records the canonical source commit; otherwise that field is null. File hashes remain available in either case. Source pins establish bytes; supplying a revision string does not authenticate its Git origin.

## Receiver-neutral integration examples

`reference-projections.json` carries canonical event IDs and exact hashes and explicitly marks Verisuff, TEA, Langfuse and Moonshot **NOT_CONNECTED / NOT_ESTABLISHED**. These are portable local references, not asserted receiver-native APIs or schemas. `evidence_reference(path, system)` hashes a supplied upstream file without claiming to interpret it as a run or importing private content into a public service.

| Receiver | Concrete adapter boundary | Remaining acceptance evidence |
|---|---|---|
| Verisuff | Pass immutable R1/R2 declaration, observation, policy and capsule references to a receiver-owned dependency/assessment workflow. Keep retained technical applicability separate from release acceptance. | Receiver supplies exact import contract; real workflow imports packet; qualified reviewer accepts exact scope and records the decision outside the capsule. |
| TEA | Attach evidence-event/capsule files by reference to a real TEA release or artifact record using that implementation's supported contract. | Receiver selects TEA version, resolves the exact artifact/release binding and returns read-back evidence. This code invents no TEA endpoint or native document. |
| Langfuse / OTel | `evaluation.otlp.json` is a real existing OTLP/JSON log projection; event IDs and source hashes remain attributes. | A qualified collector/receiver imports it and preserves required fields. A Langfuse trace is not invented, and log support must be checked separately from trace ingestion. |
| Moonshot | Retain the actual upstream run file and use `evidence_reference` to pin its bytes; feed qualified observations into the existing event builder only after inspecting the actual versioned output contract. | Execute a real Moonshot test, pin toolkit/test/config/result versions, implement the confirmed field mapping, and independently replay it. This fixture uses no Moonshot result. |

## Fair comparative study to prepare next

The implemented dependency screen knows the complete branch dependencies of this included toy service. It is not Verisuff, an expert reviewer or a claim that dependency completeness is solved for arbitrary systems.

Give all comparison methods identical initial artifacts and documented equal access to fresh executions. Signature validation should report integrity only; it must not be forced to issue a release verdict. Declaration/observation matching and replication must receive strong R2 test plans including timeout, invalid scope and expiry. A fresh exhaustive R2 run can detect this counterexample. Independent replication needs a genuinely separate executor; these local repeated runs do not provide one.

Before a larger study, freeze the methods, bank, source versions, adjudication and cost accounting. Material cases need counterexamples against the exact inherited conclusion; no-impact cases need justified invariance; missing dependencies need an insufficient-evidence category. Randomize order and hide ground-truth labels. Measure false retention and avoidable retest on separate justified denominators, plus actual review minutes, execution cost and traceability. Human-review effort and commercial cost remain null here because they were not measured.

A proposed bank of 30 material, 30 no-impact and 30 insufficient-evidence cases is a research plan, not ninety measurements. Do not produce correlated copies to hit a denominator. A Council measurement needs a frozen sha-pinned method, at least 30 valid relevant cases, receipt and independent admission under the actual board process. Council does not rank its own product. Source records and signatures do not grant execution authority or decide a release.

Council measures third-party behaviour. Verification is free at https://councilof.ai/verify
