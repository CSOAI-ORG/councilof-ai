# Layer-0 approval and cancellation contract

This package is a prototype client wrapper. Its tests use owned fixtures, including
a temporary-file effect read back independently of the callback's return value.
They do not establish a live gateway, a human identity service, an isolated executor
or an end-to-end MEOK approval journey.

## Local execution remains held

`governedLocal()` does not dispatch callbacks. An `allow` result from
`localConstitutionalPrecheck()` is an input diagnostic only; otherwise admissible
calls stop with `LOCAL_EXECUTOR_NOT_QUALIFIED`. A supplied approval, escape flag,
host callback or generated/supplied signing key cannot lift that hold. This
candidate does not qualify a local executor or change that implementation.

`verifyLocalReceipt()` verifies covered bytes under the supplied key and reports
`authority_verified: false`. It does not authenticate a human, establish trusted
key custody or independently observe an effect. The remote `governed()` contract
below is separate from this held local path.

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

For compatibility, `attested` and `status: "attested"` describe receipt, not
cryptographic verification. A returned receipt must now have the existing
`csoai.a2a/0.1` envelope shape, match the captured request attribution and input
digest, echo the supported callback-output digest and encoding, and pass its
unkeyed episode-digest comparison. Truthy malformed values no longer count as an
attestation. Legacy transports that omit output binding remain uncheckable until
they support these fields; consumers must review this deliberate tightening.

`attestationCheck.state: "RECEIVED_UNVERIFIED"` explicitly retains
`signatureVerification: "NOT_PERFORMED"`, `issuerTrust: "NOT_ESTABLISHED"`,
`authorityVerified: false` and `independentEffect: "NOT_OBSERVED"`. A
well-shaped but invalid signature can still have that unverified state. No key
supplied by a response is trusted, and no signature check is claimed here.
`verify()` still calls the configured gateway; it is not an offline verifier.

`outputBinding` fingerprints supported plain JSON returned by the callback using
the existing sorted-key canonical form, labelled `L0_CANONICAL_JSON`. This is not
the exact bytes of an external artifact and is not independent effect observation.
Only the digest and encoding are sent, never the callback output itself. Unsupported
values, accessors, sparse arrays, cycles, non-finite numbers, values deeper than 64
levels, more than 100,000 visited values or canonical output above 2,000,000 UTF-8
bytes remain uncheckable. A result changed while receipt retrieval was pending is
marked `OUTPUT_CHANGED_AFTER_CAPTURE`; the earlier digest is not silently relabelled.

Missing, malformed or mismatched evidence leaves `status: "executed_unattested"`
and preserves the obtained result and returned receipt for reconciliation. It does
not re-run the callback, settle a payment, grant authority, create a signing key or
lift `LOCAL_EXECUTOR_NOT_QUALIFIED`. Consumers must durably retain their exact
result and evidence before acting on a later mutable object.

## Acceptance before production

The source candidate reconciles the existing remote-wrapper tests with the
current implementation and adds explicit local-hold regressions. Its read-only
`charter-contract-checks` workflow runs the package suite on Node 22 and 24,
checks this contract's inclusion in a package dry-run, and runs authority-effect
v0.2 with pinned schema and timestamp validators on Python 3.12. It retains logs
including failures and does not publish a package, sign evidence or call a provider.
These checks need the existing protected CI/release owner's acceptance; a workflow
definition does not make itself a required check. Local fixture results are not a
deployment or a real human approval.

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
