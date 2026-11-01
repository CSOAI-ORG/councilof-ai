# Layer-0 approval and cancellation contract

This package is a prototype client wrapper. Its tests use owned fixtures, including
a temporary-file effect read back independently of the callback's return value.
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
The signal is captured when the call starts: later replacement or deletion of
`options.signal` cannot detach that cancellation channel. The callback receives
the captured signal. After dispatch, the executor must implement its
own cancellation, lease revocation and effect-boundary check. A returned effect is
retained even if cancellation was requested during execution; the return includes
`cancellationRequested` instead of pretending that the effect was undone.

This is cooperative cancellation, not a durable stop latch, remote-provider shutdown,
cross-worker atomic revocation or rollback. Production needs an authenticated
controller outside the model, persistent authority epochs, acknowledgements and
explicit partial/unknown outcomes. Those capabilities are not implemented here.

If the callback throws or rejects, `governed()` rejects with an exported
`Layer0ExecutionError`: `code: "EXECUTION_OUTCOME_UNKNOWN"`,
`status: "execution_outcome_unknown"`, `callbackStarted: true`, the original
`action` and `inputsHash`, `cancellationRequested`, and the original rejection in
`cause`. This intentionally changes the thrown error's identity; consumers that
inspect executor errors must read `cause`. Callback entry does not prove an external
request was sent. Neither a rejection nor cancellation proves that no effect occurred.
The wrapper cannot distinguish failure before a write from a lost response after
one. It does not retry, refund an approval lease or issue a success attestation for
that rejected callback. These error fields are diagnostic metadata, not signed
evidence or permission to resume.

When the callback returns but attestation fails, its result is retained with
`status: "executed_unattested"`. A returned result still needs independent effect
verification. Attestation failures must not prompt another execution of the action.

The host must retain the attempt ID and unknown state durably, query the executor
or an independent observer for the actual effect, and reconcile it before any new
authorization. This package does not create that store or observation service.
Keep raw exception details private: `cause` may contain sensitive executor context.

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

The focused `charter-contract-checks` workflow runs this package's regression suite
on Node 22 and 24, verifies that this contract is packaged, and runs the unchanged
authority-effect profile and synthetic evidence checks on Python 3.12. It runs for
relevant pull requests and master changes, merge groups and manual requests. Logs
are retained even on failure; no package publication, signing or provider call is
part of the workflow. A workflow definition does not itself make a check required
by branch protection; the release owner must include its results in acceptance.

Run the package tests and the authority-effect profile checks, then test the real
host integration with a forged receipt, wrong tenant, changed arguments, expired
authority, revoked authority, duplicate invocation, resume after revocation and
stop during dispatch. Retain evidence of the effect or its absence. Do not count
client fixture tests as passing those deployment checks.

For one operator acceptance, use the existing case identity and an owned, reversible
operation. Enroll the actual operator through the existing custody process; do not
let an agent create a replacement human identity. Retain the exact proposal and
authenticated approve/reject decision, enforce its scope and one-use grant at the
executor, then let a separate observer read the resulting state. Exercise a lost
response after the effect: recovery must show unknown until readback resolves it
and must not duplicate the action. Reopen the same evidence at the receiver without
executing again. Record observed times and source pins; leave absent authentication,
effect or receiver acceptance unproven. A synthetic approval callback cannot close
this gate.

This contract implements the direction of operational charter articles 2–5, 7,
10, 18–20. It does not amend the frozen charter or claim that all its obligations
are implemented. Production follows the existing protected release lane.
