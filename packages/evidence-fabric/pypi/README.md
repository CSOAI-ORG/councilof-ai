# csoai-evidence-fabric

Apache-2.0 code. The `csoai.evidence-event/0.1` schema and its field mappings are CC0-1.0.

One evidence event says what a public surface **declared**, what was **observed**, which **state** that leaves, and the **limits** of the read. It is evidence, not a verdict. This package renders the same event into the carriers security and observability tools already read, and verifies a signed batch offline.

```sh
pip install csoai-evidence-fabric            # Python >= 3.9; add [validate] for jsonschema checks

csoai-evidence validate EVENTS.jsonl
csoai-evidence render ocsf      EVENTS.jsonl > findings.ocsf.jsonl   # OCSF 1.9.0 Detection Finding (class 2004)
csoai-evidence render otel      EVENTS.jsonl > evaluation.otlp.json  # OTel event gen_ai.evaluation.result
csoai-evidence render sarif     EVENTS.jsonl > evidence.sarif        # SARIF 2.1.0
csoai-evidence render intoto    EVENTS.jsonl > statements.jsonl      # in-toto Statement v1
csoai-evidence render ecs-hec   EVENTS.jsonl > hec.ndjson            # ECS document in HEC NDJSON
csoai-evidence render w3c-acr01 EVENTS.jsonl > report.json           # W3C Agent Conformance Reporting v0.1 (Community Group text)
csoai-evidence ingest sarif REPORT.sarif --read-at <UTC> > events.jsonl   # third-party SARIF as the declared side
csoai-evidence ingest garak REPORT.jsonl ...                              # garak report recount (garak holds the method)
csoai-evidence verify batch.json batch.signed.json events.jsonl --did did.json --tamper-control
```

`did.json` is a saved copy of `https://csoai.org/.well-known/did.json`. Pin it; do not fetch it at verification time.

## States, never grades

- `state` is one of CONSISTENT, DIVERGENT, PARTIAL, UNMEASURED, UNCHECKABLE, NOT_DISCRIMINATING. There is no pass state and no score.
- UNMEASURED and UNCHECKABLE never carry a number. Every renderer refuses an event that breaks this.
- A CONSISTENT event must carry a negative control that was actually run.
- `event_id` = `sha256:` + sha256 of the RFC 8785 (JCS) bytes of the event without `event_id`, `signature` and `anchors`. A correction is a new event whose `supersedes` names the old id.

## Carrier choices

- OCSF: Detection Finding (2004), never Compliance Finding (2003); `severity_id` is always 1 (Informational). A measured value goes under `unmapped`, never `confidence_score` or `risk_score`.
- OTel: `gen_ai.evaluation.score.value` is absent unless a number was measured.
- SARIF: `kind` carries the state (pass / fail / open / review / notApplicable); `level` is `none` unless `kind` is `fail`.
- ECS: `event.category` is `configuration`; UNMEASURED maps to `event.outcome: unknown`; `event.risk_score` is never emitted.
- in-toto: predicate type `https://councilof.ai/spec/evidence-event/v0.1`; the DSSE envelope is emitted unsigned (the batch signature covers the events).

## What a VALID verification shows

`verify` checks the Ed25519 signature of `did:web:csoai.org#board-attestation-1` over the batch record and the sha256 of the events file, and with `--tamper-control` it also proves that three one-byte edits are rejected. VALID reports signature consistency under the supplied key and the covered event bytes. It does not independently authenticate the issuer or show that any claim inside is true.

**Not measured.** Live ingestion into a SIEM, collector or tenant was not run. Each carrier output is checked only against that carrier's published schema or registry, pinned in `vendor/`.

Install notes and the other connectors: https://councilof.ai/connect/

## SAFE freeze signature consumer (version 2)

The version 0.1.1 source adds an external consumer for the retained SAFE pack. It leaves the original 37-file pack unchanged and does not run its bundled verifier.

```sh
csoai-evidence verify-safe-freeze FREEZE.json --signed FREEZE.signed.json --did did.json
```

This command supports the retained `csoai.safe-evidence-pack/0.1` freeze and its `csoai.signed-run/0.1` / `csoai.signed-artifact/0.1` envelope. It binds the supported signer in the signed payload to one full DID verification-method ID, its controller and assertion authorization, then verifies the Ed25519 signature over the payload and exact freeze bytes. Unsupported families and ambiguous methods are rejected.

The JSON result keeps `signature_valid` separate from `issuer_authenticated`, which remains `null`. A positive result is `SELF_CONSISTENT_UNAUTHENTICATED_KEY`: it proves consistency under the supplied public key, not the issuer's identity or the truth of a claim. No network DID resolution occurs. Authenticate or pin the key independently for any stronger trust conclusion.

Exit codes are 0 for supplied-key consistency, 1 for rejected inputs/signatures, 2 for usage or unavailable required inputs, and 3 for absent signature/DID or unavailable cryptography. Missing evidence remains `null`, never a valid signature. This command checks only the freeze signature; it does not check the pack's sums, event schemas, derivations, Bitcoin OTS, admission or certification.
