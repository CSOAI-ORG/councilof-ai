# Approval → effect: runnable bounded demonstration

**Status: controlled local reproduction. Not a production approval service, authenticated human decision, SAFE standard, model measurement or independent assessment.**

This extends the candidate [HITL Authority → Effect Profile](../standards/osaia-safe-reverification/HITL-AUTHORITY-EFFECT-PROFILE.md) with a runnable demonstration. It uses real Ed25519 signature verification, an actual append to an **owned temporary file**, and readback by an observer in a **separate local process**. Identities, approvals, authority and requests are synthetic. No production execution, network call, payment, customer data or external model request occurs.

## Reproduce (Node.js 22+)

From the repository root:

```bash
node --test harness/hitl/approval-effect-demo.test.mjs
node harness/hitl/approval-effect-demo.mjs --run-fixtures > approval-effect-trial.json
```

The command exits nonzero if any declared control does not behave as expected. The JSON retains an executable source SHA-256 and explicitly labels `human_approval: SYNTHETIC_KEY_ONLY`, `independent_review: NOT_CONDUCTED`, `production_authority: false`, `trust_anchor: AUTHORITY_RECORD_SHA256_SUPPLIED_BY_CALLER` and `authority_pin_source: TEST_RUNNER_NOT_AN_EXTERNAL_LEDGER`. Retain the source commit and trial hash for third-party replay. No keys are shipped: each fixture generates an ephemeral private key in an owned temporary folder with restricted permissions and deletes it on completion.

## Tested effect chain

1. **Approval simulation:** a locally generated test key signs a short-lived approval bound to the exact request file digest, principal reference, authority epoch, declared action, resource and validity window. This is not proof that a human approved.
2. **Executor process:** receives the SHA-256 of the authority record as an argument from its caller and refuses unless the record in the folder has exactly those bytes. That comparison happens before the record is parsed; a record that fails it is never parsed. It then checks the public key in that record, authority/revocation state, watch state, scope, unchanged request bytes, decision and expiry. Only then can it write one bounded JSONL marker. The digest is never read from the fixture folder. Each fixture file is read once per operation, so the bytes that are hashed are the bytes that are parsed and used.
3. **Observer process:** is given the same authority digest, reopens that file and checks its exact byte hash, sole effect entry, request digest, signature, scope, execution-time window, and that the receipt names the authority record it was given.
4. **Negative controls:** revoked or unknown authority, stale watch state, expiry, future approval, wrong scope, modified request, invalid signature, wrong epoch and explicit denial produce **no effect**. So do three controls on the trust anchor itself: a replaced trusted key with a re-signed approval, a revocation undone by editing the folder, and a run with no authority digest supplied. A further test replaces the authority file with one that answers two reads differently and confirms it is refused. Three more replace it with bytes that are not JSON, with two records back to back, and with an empty file, and confirm each is refused without being parsed. Replay cannot append a second effect; changing an existing effect makes readback fail; an effect does not read back under a different authority digest.

The pass means only **that this controlled local file effect was performed and observed**.

### Correction, 16 November 2026

The first version of this demonstrator said the executor checked a "pinned public key". It did not: the trusted key was read from `authority.json` in the same folder as the approval. Replacing that key and re-signing the approval produced `EXECUTED` and `EFFECT_READBACK_MATCHED`, and none of the eleven scenarios covered it. The authority record is now bound to a digest held by the caller, and the three trust-anchor controls above were added. Review of that change then found it hashed a second read of the record, which a file answering two reads differently could exploit; the record is now read once. The regression test for that was itself timing-dependent: on one CI run the two writes arrived in a single read, the record failed to parse, and the executor exited with an error instead of reporting `DENIED` (no effect was written). The digest is now checked before the record is parsed, so bytes that are not the pinned record are refused the same way whatever they contain. Results recorded before this date were produced by the unpinned version.

## Critical limitations and next upgrade

This is **not an authenticated human-in-the-loop journey**. The principal is synthetic; the demo CLI accepts a test clock; the temporary key is not an external identity credential. The authority digest comes from the test runner's own memory, not from an external authority ledger: it shows that the executor refuses a record it was not told to trust, and nothing about who is entitled to say which record that is. No atomic distributed revocation, separately trusted observer, external authority ledger, cross-system clock bound, policy certification or independently signed effect receipt is established. It creates no GSPC `MEASURED` claim and implies no OSAIA/SAFE endorsement.

**Next pilot acceptance:** authenticate an actual principal and delegation; pin a current external authority record including revocation/expiry; execute a specifically approved sandbox resource; retain an independent observer's effect receipt and immutable source links; repeat the denial/replay/revocation cases under reconnection and in-flight work. Obtain external reproduction before making an independent-verification claim.
