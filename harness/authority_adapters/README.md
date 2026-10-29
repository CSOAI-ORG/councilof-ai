# Shared authority checks for agent runtimes

Experimental Strands and OpenAI Agents SDK adapters share the host contract used by
the LangChain harness. They are tested repository integrations, not published
packages or deployed human-authority services. The frozen charter, GSPC graders
and generated reader packages remain unchanged.

The workflow is one exact proposal, an authenticated host decision, bounded
execution and independent effect readback. Framework approval UI and model scores
do not replace the host decision.

| Runtime | Exercised scope | Checks |
| --- | --- | ---: |
| Strands 1.62.0 | Actual Agent loop, Before/AfterToolCallEvent, review interrupt/resume and final ExecuteToolStage middleware | 18 |
| OpenAI Agents SDK 0.24.0 | Actual Runner, local FunctionTool approval/rejection, serialized RunState resume and input/output guardrails | 27 |
| LangChain 1.4.7 / LangGraph 1.2.18 | Existing synchronous/asynchronous and batched/per-call review paths, now using the shared core | 43 |

The models and approval registry are synthetic. Tools write to owned temporary
files; tests independently inspect their contents and count writes. Socket
networking is blocked during tests. No provider request, real human credential,
private production record or third-party account is used.

## Run and retain evidence

From the repository root, in a separate Python 3.12 environment:

```sh
python -m pip install -r harness/authority_adapters/requirements-test.txt
python -m pip check
python harness/authority_adapters/retain_checks.py --output /tmp/authority-run-unique
```

Choose a new directory; existing output is never replaced. The retained example
is in `receipts/2026-10-29/`. Its manifest records exact source hashes, installed
SDK versions, observed times, individual JUnit cases and the bypass effect
readbacks. Logs and JUnit records remain beside it.

The runner disables the strict host-result check in a disposable source copy.
Each SDK then creates the forbidden fixture write and its unissued-approval test
fails. Import errors, skipped tests or failure without that write do not count as
successful detection. Original source hashes must remain unchanged. This proves
that the instrument detects this defect, not every possible defect.

The existing `packages/evidence-fabric/event.py` builder and full JSON Schema
validator produce an unsigned `csoai.evidence-event/0.1` record with `value: null`.
Assertion failure, unavailable evidence and a failed discriminating control remain
separate states. The event is not a model score, GSPC board result, real human
authority-effect receipt or independently witnessed observation. No new receipt
schema, signing key or release authority is introduced.

The LangChain suite retains its separate requirements and command:

```sh
python -m pytest -q harness/langchain-authority/test_authority.py
```

Direct dependency pins qualify the tested versions; this is not a complete
hash-locked transitive supply-chain manifest. Keep the repository tree together:
the LangChain module now imports `harness.authority_adapters.core`.

## One trusted host contract

`DispatchGate` takes an immutable `HostBinding`, a synchronous
`verify_and_consume(scope)` and/or asynchronous `averify_and_consume(scope)`.
Only Boolean `True` permits dispatch. Missing state, exceptions, cancellation
and other return values deny it. The verifier is deployment configuration, never
model arguments, checkpoint data or an arbitrary SDK approval object.

The host must authenticate the issuer and authorized principal; bind exact tenant,
audience, resource, action and input; verify policy/runtime versions, current
authority epoch, validity and revocation; and atomically consume authorization
in durable cross-worker storage. SDK/model call IDs must be namespaced by the host
workflow. Changed requests require fresh exact authority. This core supplies no
identity, signature trust, credential enrollment or replay database.

Arguments use RFC 8785 canonical JSON and SHA-256. OpenAI parsing rejects duplicate
keys, nonfinite values and non-object JSON before verification. The host must also
bind injected context, credentials, schema defaults, destinations and runtime
limits used by the tool. Object identity alone does not authenticate implementation
bytes. Revocation can race dispatch, so the downstream executor must enforce its
own current lease/epoch and exact effect scope.

Reuse the responsibilities in the
[existing Layer-0 contract candidate](https://github.com/CSOAI-ORG/councilof-ai/blob/0fb6f55f18a582f5d562cebe917448c70dd852a2/packages/layer0-js/APPROVAL-CONTRACT.md).
Do not assume canonical hashes equal that JavaScript wrapper's current
`JSON.stringify` hashes, or that service transport credentials are human approval.
The actual host must explicitly qualify these joins.

## Strands: observe hooks, enforce at execution

Create `StrandsAuthorityMiddleware(gate, {tool.tool_name: (tool, version)})` and
call `install(agent)` **last among ExecuteToolStage Wrap handlers**. Earlier Wrap
handlers are outermost. The authority gate then sees argument/tool changes made
by before-call hooks and input middleware. A substituted unpinned instance fails.
Do not put a mutator, alternate executor or retry below this boundary.

`ToolObservations` captures BeforeToolCallEvent/AfterToolCallEvent snapshots. Its
priority 50 follows default-priority hooks: after-call callbacks reverse registration
order within their priority group, so merely registering last is insufficient to
observe a final retry request. Higher-priority callbacks can still change events.
Review the complete chain; observation order is not enforcement.

Boundary attempts record DENIED or AUTHORIZED_FOR_DISPATCH. A requested retry
re-enters host verification and cannot reuse the fixture lease. Hook outputs remain
SDK/tool reports: a tested hook can rewrite a denied result into a success message
without creating a file effect. In-process observations need a separately qualified
retention sink before crash durability can be claimed.

The review hook in these tests is synthetic. The real host must persist the latest
authenticated decision and revoke prior authority before resuming a rejection.
Background tasks, nested agents and streaming partial effects remain unqualified.

## OpenAI: approval and guardrails remain separate

`with_host_authority(function_tool, gate=gate, version=version)` copies the local
function tool, forces `needs_approval=True` and preserves its guardrails. The final
callback checks exact host scope after approval, input guardrails and start hooks.
Context/schema/callback mutation during authorization is rejected before invoking
the captured implementation.

Runner approval, rejection and serialized resume were exercised. An older serialized
state cannot reset the host's consumed-approval registry. The fixture registry is
in memory; durable restart recovery still needs real host acceptance. SDK failures
can wrap `AuthorityDenied` in `UserError`; tests check the cause and file readback.

Input-guardrail rejection consumes no authority and prevents dispatch. Output-
guardrail rejection happens after the file write and cannot undo it. Retain the
effect separately from the response shown to the model. Tests inspect the callback
and returned items directly, not a result-summary field alone.

Only plain local FunctionTool execution is qualified. Hosted tools, shell, computer
use, remote MCP, nested agent tools, handoffs and streaming recovery need separate
acceptance. Argument-edit tests at the direct callback boundary are distinct from
serialized SDK resume tests; no paused-proposal editing UI is claimed.

## Charter, GSPC and release boundary

This follows default deny and exact authority (articles 2–5), separate research and
bounded execution (7–8), bound effects and separate verification (10–11), and explicit
failure/role separation (18–20). The charter remains unchanged. GSPC evidence informs
review; it grants no execution permission. Reuse the existing authority-effect
record for the eventual real proposal/decision/invocation/effect/verification chain.

Production acceptance still needs a real enrolled operator, a qualified host
authority service and executor, durable replay/revocation, least privilege,
post-dispatch cancellation and unknown-outcome handling, retained evidence and a
separate receiver's reproduction. Never automatically refund a consumed lease or
assume a rejected response reversed an effect. Package release remains with the
existing generator and protected release lane.

Sources: installed pinned SDK code; Strands
[hooks](https://github.com/strands-agents/harness-sdk/blob/409cb540d2c9318a2304b379d52a56c9bd48e29a/strands-py/src/strands/hooks/events.py)
and [middleware](https://github.com/strands-agents/harness-sdk/blob/409cb540d2c9318a2304b379d52a56c9bd48e29a/strands-py/src/strands/middleware/README.md);
OpenAI [guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals).
The Strands commit is a discovery snapshot, not an assertion of the exact wheel
build. Adapter code is original; dependency licences and notices remain separate.
