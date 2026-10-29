# LangChain review-to-dispatch harness

An experimental middleware integration tested against the actual LangChain 1.4.7 /
LangGraph 1.2.18 SDKs on Python 3.12. It connects a resumed tool call to a
deployment-configured host authority check. It is not a published package or a
production human-identity, replay or cancellation service.

The existing generated `langchain-csoai` tools read GSPC boards and verify cards.
They remain useful and unchanged. This harness exercises the separate permission
boundary before a tool creates an effect; a measurement does not grant permission.

## Run the acceptance checks

From the repository root, in a separate Python 3.12 virtual environment:

```sh
python -m pip install -r harness/langchain-authority/requirements-test.txt
python -m pip check
python -m pytest -q harness/langchain-authority/test_authority.py
```

43 checks pass in the local qualification. Tests use `create_agent`, the SDK's
`HumanInTheLoopMiddleware`, `InMemorySaver`, `Command(resume=...)`, a deterministic
fake model, a synthetic host registry and a real temporary-file tool. Both batched
and per-call review work in synchronous and asynchronous runs. Tests block outbound
socket connections. There are no provider calls or real human approval credentials.

Successful cases independently read the file and compare its contents and number
of writes. A tool's returned text is not used as evidence of the effect. Rebuilding
the agent with a fresh checkpoint cannot reuse a consumed fixture approval. The
fixture registry remains in one process; crash durability is not established.

| Control | Evidence exercised |
| --- | --- |
| Pause and approve | No write or authority consumption before the interrupt resumes; exactly one matching write after host verification |
| Reject | No host call or write for an ordinary rejected review, even with an issued fixture lease |
| Edit | Old argument approval fails; a fresh host decision bound to the edited arguments permits exactly those arguments |
| Scope | Unissued, expired, revoked, wrong tenant, audience, workflow, resource, policy epoch or tool version denies dispatch |
| Retry and parallel attempts | Repeated handler invocation and simultaneous attempts cannot consume the same fixture lease twice |
| Mutation | An outer middleware's edit is checked; mutation during authorization denies dispatch |
| Cancellation | Stop before dispatch or while the verifier is pending blocks dispatch; no remote-provider stop claim |
| Failure | Missing async verifier, verifier errors and non-Boolean results fail closed |
| Dynamic review predicate | A changed SDK `when` predicate cannot manufacture host approval; a host-revoked approval stays denied even if the SDK skips a resumed rejection |

## Host integration contract

Configure `HostAuthorityMiddleware` **last** in the middleware list, after the review
middleware and any argument-mutating middleware. LangChain composes the first
wrapper outermost. The gate must be immediately adjacent to the trusted tool
handler; putting a mutator or retry below it invalidates this qualification.

Supply a host-controlled `HostBinding` for each workflow run, an allowlist of the
actual tool instances plus reviewed versions, and `verify_and_consume(scope)`.
For asynchronous execution also supply `averify_and_consume(scope)`. Only Boolean
`True` permits dispatch. Exceptions and unavailable state deny it. No model-supplied
argument, checkpoint data or SDK review response can install the verifier.

`DispatchScope` contains the host binding, selected tool/version, call ID, canonical
argument bytes and their SHA-256 digest. Arguments use RFC 8785 canonical JSON.
The scope is an input to verification, **not an approval receipt**. The SDK/model
call ID is untrusted; the host must namespace it by workflow and enforce one-use
semantics. The adapter sends a copied request to the handler and rejects mutations
detected while approval is pending.

The verifier must authenticate the issuer and authorized principal, compare exact
tenant/audience/resource/action/input scope, check policy and runtime versions,
current authority epoch, validity and revocation, and atomically consume the
invocation authorization in durable storage. Bind any state, credentials, injected
arguments, schema defaults, downstream destinations or runtime settings used by a
tool as well. Tool instances and dependencies must remain under trusted host
control; Python object identity alone does not authenticate implementation bytes.
The executor must enforce those bindings at the eventual effect boundary.

The host also owns the latest human decision. Persist an authenticated rejection
and revoke any prior lease **before** resuming. A dynamic SDK `when` predicate can
be re-evaluated on resume and skip the review response. This middleware deliberately
does not infer human intent from that SDK branch: use unconditional review for
consequential tools and keep authority in the host. Merely returning `True` or
trusting `{"type":"approve"}` does not satisfy this contract.

This is the same responsibility split as the Layer-0 contract in
[PR #3598 at 0fb6f55](https://github.com/CSOAI-ORG/councilof-ai/blob/0fb6f55f18a582f5d562cebe917448c70dd852a2/packages/layer0-js/APPROVAL-CONTRACT.md).
The Python callback consumes host state directly; it does not accept an arbitrary
receipt from tool arguments. Its RFC 8785 digest is not byte-compatible by default
with the JavaScript wrapper's current `JSON.stringify` digest. A real host must
declare and verify its digest scheme; do not pass receipts between them by assumption.

## Evidence, charter and GSPC mapping

Reuse `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.2.schema.json`
for authority/effect records and the evidence-fabric event for external observations.
No new receipt schema, signing key, score or release authority is introduced here.

| Existing contract | Runtime connection | Still required in a deployed workflow |
| --- | --- | --- |
| Charter articles 2–5; identity, inputs and temporal authority | Immutable host scope; fresh verify-and-consume at dispatch | Authentic approver, durable authority state and explicit canonicalization |
| Articles 7–8; execution and isolation | Pinned tool instance and copied reviewed arguments | Sandboxed executor, dependency pinning and downstream destination enforcement |
| Articles 10 and 18–20; evidence and role separation | Independently read fixture effect; host owns decisions | Retained decision, invocation, observed effect and independent verifier records with real times |
| GSPC measurement | Attach the applicable existing versioned measurement as supporting evidence | Preserve method, population, uncertainty and expiry; never use its score as authorization |

The table is an implementation crosswalk, not a new interpretation or amendment of
the frozen charter. The harness does not emit a completed authority-effect record:
it cannot invent a real principal's authenticated decision, timestamps or an
independent witness. Tests establish SDK wiring under a synthetic host.

## Remaining acceptance and release boundary

1. Connect a real host authority service and enrolled approver, including persistent
   revocation/replay state across workers, restarts and concurrent resumes.
2. Demonstrate one owned business action through authenticated review, exact
   approval, dispatch and external effect readback. Retain rejected, edited,
   expired, revoked and duplicate controls alongside the successful case.
3. Test cancellation after dispatch and retain partial/unknown outcomes. Consuming
   approval before a failed tool attempt may spend the lease without an effect;
   never refund or retry automatically. Reconcile before issuing new authority.
4. Have a separate receiver reproduce the evidence pack. Only then propose a
   generated-distribution change through `scripts/harness-x/render.mjs` and the
   existing protected release process. Do not hand-edit the generated package.

This adapter is not a sandbox against malicious Python/tool code or a compromised
host. Revocation immediately after verification can race dispatch; actual executors
need their own lease/epoch enforcement. Cancellation is cooperative and cannot
undo completed effects. Tool results alone, signatures, listings and test counts
do not establish deployed safety, human authentication or independent acceptance.

## Sources and qualification

- SDK versions are pinned in `requirements-test.txt`; transitive dependencies beyond
  that list are not a complete hash-locked supply-chain manifest.
- Upstream middleware contract and implementation inspected at
  [35056895](https://github.com/langchain-ai/langchain/blob/350568952c4b65d1310081d45a2536b6449712f0/libs/langchain_v1/langchain/agents/middleware/human_in_the_loop.py)
  and [middleware types](https://github.com/langchain-ai/langchain/blob/350568952c4b65d1310081d45a2536b6449712f0/libs/langchain_v1/langchain/agents/middleware/types.py).
  That source revision is a discovery snapshot, not an assertion that it is the
  exact release build. The executable acceptance above used the installed releases.
- This is original adapter/test code using public SDK interfaces. SDK dependencies
  retain their own licences and notices; no upstream implementation is vendored.
