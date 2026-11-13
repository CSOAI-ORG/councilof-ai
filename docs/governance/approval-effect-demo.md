# Approval → effect: runnable bounded demonstration

**Status: controlled local reproduction. Not a production approval service, authenticated human decision, SAFE standard, model measurement or independent assessment.**

This extends the candidate [HITL Authority → Effect Profile](../standards/osaia-safe-reverification/HITL-AUTHORITY-EFFECT-PROFILE.md) with a runnable demonstration. It uses real Ed25519 signature verification, an actual append to an **owned temporary file**, and readback by an observer in a **separate local process**. Identities, approvals, authority and requests are synthetic. No production execution, network call, payment, customer data or external model request occurs.

## Reproduce (Node.js 22+)

From the repository root:

```bash
node --test harness/hitl/approval-effect-demo.test.mjs
node harness/hitl/approval-effect-demo.mjs --run-fixtures > approval-effect-trial.json
```

The command exits nonzero if any declared control does not behave as expected. The JSON retains an executable source SHA-256 and explicitly labels `human_approval: SYNTHETIC_KEY_ONLY`, `independent_review: NOT_CONDUCTED` and `production_authority: false`. Retain the source commit and trial hash for third-party replay. No keys are shipped: each fixture generates an ephemeral private key in an owned temporary folder with restricted permissions and deletes it on completion.

## Tested effect chain

1. **Approval simulation:** a locally generated test key signs a short-lived approval bound to the exact request file digest, principal reference, authority epoch, declared action, resource and validity window. This is not proof that a human approved.
2. **Executor process:** checks the pinned public key, authority/revocation state, watch state, scope, unchanged request bytes, decision and expiry. Only then can it write one bounded JSONL marker.
3. **Observer process:** reopens that file and checks its exact byte hash, sole effect entry, request digest, signature, scope and execution-time window.
4. **Negative controls:** revoked or unknown authority, stale watch state, expiry, future approval, wrong scope, modified request, invalid signature, wrong epoch and explicit denial produce **no effect**. Replay cannot append a second effect; changing an existing effect makes readback fail.

The pass means only **that this controlled local file effect was performed and observed**.

## Critical limitations and next upgrade

This is **not an authenticated human-in-the-loop journey**. The principal is synthetic; the demo CLI accepts a test clock; the temporary key is not an external identity credential. No atomic distributed revocation, separately trusted observer, external authority ledger, cross-system clock bound, policy certification or independently signed effect receipt is established. It creates no GSPC `MEASURED` claim and implies no OSAIA/SAFE endorsement.

**Next pilot acceptance:** authenticate an actual principal and delegation; pin a current external authority record including revocation/expiry; execute a specifically approved sandbox resource; retain an independent observer's effect receipt and immutable source links; repeat the denial/replay/revocation cases under reconnection and in-flight work. Obtain external reproduction before making an independent-verification claim.
