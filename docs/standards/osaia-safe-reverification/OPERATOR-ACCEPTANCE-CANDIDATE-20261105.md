# One human-authorized effect: acceptance candidate

Status: review proposal only. No person is enrolled or impersonated, no authority
is issued, and no effect is authorized by this document. Source baseline:
`efcce275f45f599aca96c9ec04ee6a1847ebc404`; temporal corrections and remote-wrapper
tests reconciled from PR #3598 at `f4396313812314081bdff89126e2168f68cddf5c`.
The current `LOCAL_EXECUTOR_NOT_QUALIFIED` hold remains unchanged.

## What the candidate closes

The reference checker rejects invocation before the decision and preserves a
schema-valid unknown effect without parsing a missing observation time. The
remote-wrapper suite is reconciled with the stricter implementation already on
master. New controls assert that local prechecks, caller receipts, escape flags,
host callbacks and supplied keys cannot lift the local hold. The packaged approval
contract describes this boundary. Frozen schemas, example records and runtime
implementation are unchanged. None of these checks completes operator acceptance.

## Smallest proposed live acceptance

Use one existing case/request identity, one actual enrolled human and one owned
test sink. The proposed operation is an exclusive creation of one UTF-8 file
containing exactly `Council of AI operator acceptance\n` (34 bytes, LF newline),
with no overwrite, network, model call or payment. The owner must select the exact
existing approved sink path and qualify its executor; the path is not yet selected
or approved. Preview the full path, bytes and their digest before the person decides.
Reject absolute-path substitution, traversal and symlinks at the effect boundary.

| Dependency | Required evidence before dispatch |
| --- | --- |
| Human identity and role | Actual human-controlled authentication and accepted role, independently bound to the existing principal record. A typed name, shared token, synthetic callback or self-registered email is insufficient. The person approves the exact displayed revision through their own session. |
| Exact authority | Current external authority record pin, principal/tenant/audience, action, resource, input bytes, tool and policy versions, baseline, epoch, nonce, scope and short validity window. Revocation must be known and current at dispatch. |
| Durable single use | A qualified transactional primitive in the existing authoritative host store must consume the invocation identity atomically and preserve the attempt across restart and competing workers. The current HITL KV read/write helper is not that primitive. No second case or decision ledger is proposed. |
| Executor | A reviewed adapter at the actual file-write boundary, enforcing exact bytes/path, exclusive create, current authority and one-use state. The current generic local wrapper remains held. A callback return is not effect evidence. |
| Independent observation | A separately controlled read-only observer reads the target after the attempt and retains its exact bytes/digest, observation time, method and source pins. Executor self-report and same-credential readback do not establish operational independence. |
| Receiver verification | A different receiver reopens the exported evidence without executing again, using an independently selected manifest digest and expected identity/key references. No login, payer credential or issuer-only verification API is needed for the public, privacy-minimized verification pack. |

Reuse `csoai.evidence-event/0.1` and the existing authority-effect v0.2 profile
(v0.1 history remains intact). Keep proposal, received/accepted referral, human
decision, invocation, effect and verification as distinct facts. Preserve an
unknown result after a lost response; reconciliation must not dispatch again or
refund a consumed grant. Keep personal enrollment evidence private; public
verification can expose the approved identity binding and minimized evidence only
with the person's permission. Key proof alone establishes no competence or authority.

## Acceptance tests and review stop

Before the live attempt, use explicitly synthetic fixtures to reject forged or
missing identity, wrong tenant/audience, changed path/bytes/tool/baseline/epoch,
expired or revoked authority, unavailable revocation state, concurrent duplicate
attempts, replay after restart and resumed work after revocation. Inject a lost
response after the exclusive write: one effect must be observed, the attempt stays
unknown until readback, and retry cannot create another effect. Alter or omit an
artifact in the receiver pack and require verification to reject or say uncheckable.

For the actual acceptance, the person first sees and decides on the final pinned
proposal; then the qualified executor performs only that action. The observer and
receiver record their own observed outcomes. A failed or absent stage remains
not established. The live attempt stays held until the named human, exact target,
qualified transactional store/executor and independent observer are recorded and
the release owner accepts the concrete implementation. No agent may fill these
missing appointments or approvals with fixture identities.
