# Layer-0 approval and cancellation contract

This package is a prototype client wrapper. Its tests use owned, in-process fixtures.
They do not establish a live gateway, a human identity service, an isolated executor
or an end-to-end MEOK approval journey.

## Host responsibilities

Only an explicit `allow` decision or a host-verified `escalate` decision may reach
the callback. Unknown and malformed gate responses fail closed. A supplied receipt
object is not authentication. For escalations, the host must configure
`new Layer0({ verifyApproval })`; a per-call function cannot substitute for it.

`verifyApproval(receipt, context)` must return the Boolean `true` only after checking:

- the authentic issuer and authorized human or service principal;
- subject, tenant, action, resource, exact input digest and downstream destination;
- the approved policy and runtime versions, current authority epoch and limits;
- validity time, current revocation and any one-use or replay restriction;
- changes to the reviewed proposal, including edits made while resuming a task.

`context` supplies `action`, `inputsHash`, `identity`, `endpoint` and `decision`.
The trusted host must supply any additional tenant, policy, destination or authority
records required by its deployment. The wrapper does not invent or authenticate them.
Errors and non-Boolean verifier results deny dispatch. Installing `() => true` does
not meet this contract. The verifier must be controlled by the deployment owner,
outside model-generated arguments and code.

The legacy `allowUnapprovedEscalation` escape no longer permits execution. This is
a deliberate compatibility change requiring review by the package/release owner.
Research that does not have execution authority belongs in a separately isolated
fixture; it must not pass through this protected path as approved work.

## Cancellation and evidence

Pass an `AbortSignal` through `options.signal`. A pre-existing cancellation, or one
received while awaiting the gate or approval verifier, prevents callback dispatch.
The callback receives the signal. After dispatch, the executor must implement its
own cancellation, lease revocation and effect-boundary check. A returned effect is
retained even if cancellation was requested during execution; the return includes
`cancellationRequested` instead of pretending that the effect was undone.

This is cooperative cancellation, not a durable stop latch, remote-provider shutdown,
cross-worker atomic revocation or rollback. Production needs an authenticated
controller outside the model, persistent authority epochs, acknowledgements and
explicit partial/unknown outcomes. Those capabilities are not implemented here.

The input digest is captured before authorization. A change while authorization is
pending rejects dispatch. The attestation request retains that original digest even
if the callback later mutates the input object. Arbitrary callback code can still
perform a different operation: effect binding must be enforced at the actual tool
or gateway boundary and independently checked afterwards.

For compatibility, `attested` and `status: "attested"` mean a gateway attestation
was returned. They do not mean this client verified its signature, authenticity or
claim. Missing evidence is `executed_unattested`. `verify()` calls the configured
gateway and therefore is not a standalone offline verifier.

## Acceptance before production

Run the package tests and the authority-effect profile checks, then test the real
host integration with a forged receipt, wrong tenant, changed arguments, expired
authority, revoked authority, duplicate invocation, resume after revocation and
stop during dispatch. Retain evidence of the effect or its absence. Do not count
client fixture tests as passing those deployment checks.

This contract implements the direction of operational charter articles 2–5, 7,
10, 18–20. It does not amend the frozen charter or claim that all its obligations
are implemented. Production follows the existing protected release lane.
