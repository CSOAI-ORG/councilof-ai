# Workflow evidence: integration guide

**Status:** non-normative companion, 29 October 2026. This guide does not amend the charter,
issue a measurement, approve a deployment or claim vendor adoption.

## Choose the outcome

| Your task | Starting point | What you receive |
| --- | --- | --- |
| Read existing evidence in an agent | [Connect](https://councilof.ai/connect/) | Published records through a read-only MCP interface; check the subject and observation date. |
| Show evidence in a product | [Panel demo](https://councilof.ai/panel/) and [panel source](https://github.com/CSOAI-ORG/councilof-ai/tree/master/packages/gspc-panel) | A web component or React wrapper. Verification checks covered bytes; it does not broaden a record's scope. |
| Define a business measurement | [Scope enquiry](https://councilof.ai/contact/?arm=run) | A conversation to agree subject, method, deliverables, limits and acceptance before a run. |
| Enforce an action boundary | Your host's policy and approval controls | A separately tested integration. Reading a GSPC record does not grant authority to execute. |

A useful customer deliverable is a **workflow evidence pack**: exact subject and version,
method and test-bank version, dated observations, failures and unknowns, reproducible
verification instructions, and an agreed acceptance record. This is a packaging proposal,
not an assertion that a new paid SKU or delivery service has been launched.

## Keep four contracts distinct

1. **Organization governance:** who owns the service, maintains methods, resolves disputes,
   releases software and discloses conflicts. Do not imply an independent council exists
   merely because software uses several models.
2. **Runtime authority:** the existing [22-article operational charter](https://councilof.ai/operational-charter/)
   and its [machine-readable version](https://councilof.ai/.well-known/constitutional-harness.json).
   It specifies intended boundaries; it does not prove every host enforces them.
3. **Measurement method:** frozen questions, labels, grader, subject and version.
   The board's grader remains `read_label()` in `harness/gspc-top100/mill_hub_queue.py`.
   A different grader's result must not be presented as the same measurement.
4. **Customer scope:** the particular workflow, exclusions, data handling, price or budget,
   delivery artifacts and acceptance criteria agreed for that engagement.

The [amendment log](https://councilof.ai/.well-known/charter-amendments.json) records charter
versions. Preserve historical bytes and issue a new version for an amendment. A method
can remain reproducible while its source framework changes: retain the snapshot and
publish a separately versioned update and comparability note. Frozen does not mean current.

## Map the existing charter to observable controls

| Articles | Integration responsibility | Evidence needed |
| --- | --- | --- |
| 1, 7, 14 | Separate measurement, research and authority; avoid legal verdicts | Exact claim, scope and limitations visible alongside the result |
| 2–5, 9 | Deny unknown authority; bind identity, tenant, resource, action, scope and expiry; keep credentials bounded | Allow and deny cases, expired and revoked approvals, changed-action rejection |
| 6 | Keep payment separate from permission | A paid request that is still denied when authority is absent |
| 8, 15, 16 | Respect isolation, dependencies and physical-world boundaries | Host policy version, sandbox observations, declared dependencies and explicit physical authority where applicable |
| 10–13 | Record effects; allow independent checking; separate signing and transparency | Retained input/output digests, signer/key version, verification and disclosure of missing observations |
| 17–22 | Preserve corrections, failure stages, roles, reviewed changes and distinct growth states | Append-only corrections, named responsibility, release evidence and separate activity, adoption and revenue measures |

A charter article is a requirement, not a test result. A hash supplied by a client is
a declaration until checked against the retained bytes.

## Place GSPC and human review in the execution path

The following sequence is an acceptance design for an integration, not a claim that
every existing connector implements it.

1. Describe the proposed action: principal, tenant, resource, operation, input digest,
   host version, requested scope, budget and expiry. Give it a stable action identifier.
2. Attach relevant GSPC evidence with subject, method, date, provenance and unknowns.
   Reject a subject mismatch rather than substituting a nearby model's result.
3. Apply the host policy. Route only the cases requiring human judgment to the human.
   Display the actual proposed change and consequence, not just a model's summary.
4. Bind the authenticated human decision to the exact action and scope. Decline,
   cancellation, timeout, expiry and revocation must not become approval.
5. Recheck immediately before the side effect. A resumed run must not repeat a payment,
   message or write. Use host-supported idempotency and reject changed action bytes.
6. Record the observed effect separately from the intended action and approval.
   A successful HTTP response alone is insufficient evidence of a business outcome.
7. Export the retained record, verification material and correction route. Record customer
   acceptance separately from receipt creation, signing, payment and renewal.

**Observed HITL status, 29 October:** the public state endpoint reported an open decision
path, configured storage/token/signing, and two approved records. The record endpoint
returned competency and signature fields. This inspection did not independently verify
those signatures or execute a new approval-to-action journey. A shared operator token
does not establish enterprise identity for each named reviewer, and a competency answer
is not a general professional credential.

## Existing assets to reuse

| Asset | Useful today | Boundary to preserve |
| --- | --- | --- |
| `packages/gspc-panel` | Display published evidence and browser verification inside another product | Preserve evidence attribution, subject, date and limitations; an unsigned list stays unsigned. |
| `packages/nat-csoai-evidence` | NeMo Agent Toolkit function for offline evidence-bundle checks | Package source is not NVIDIA endorsement; verification failure is uncheckable, not a fabricated zero score. |
| `packages/llama-stack-provider-csoai` | Llama Stack provider for offline evidence-state results | Evidence-state counts are not model benchmark scores; hosted stack acceptance remains separate. |
| `packages/otel` | Metadata-based trace/receipt projection | HTTP observations are not tool outcomes; do not export raw prompts by default or treat hashes as anonymisation. |
| `packages/eval-ci` | Detect changes to a locked bank and produce comparison artifacts | An unsigned delta is not a newly issued measurement or a completed paid run. |
| `integrations` | Shared panel wrappers and deployment specifications | OpenShift and CrowdStrike wrappers, Splunk configuration, and Palantir/NVIDIA specifications have different acceptance states. None establishes a vendor partnership. |
| `packages/layer0-js` | Proposed gateway-client API | Its README records a failed availability check. Do not advertise the design example as a working public gateway. |

## Public code attachment points

These are source-reviewed candidates, **not completed integrations**. Pins make the
review reproducible; each host still needs tests against the version actually deployed.
Keep upstream licence and notice obligations when reusing code.

| Host and inspected revision | Source attachment point | Proposed adapter and first acceptance case |
| --- | --- | --- |
| [LangGraph — MIT](https://github.com/langchain-ai/langgraph/blob/ffc3336367e8139668d11e5f0b0e6def57e7c762/libs/langgraph/langgraph/types.py) | `interrupt()` and checkpointed resume | Bind a proposal and decision around the interruption. Resuming restarts the node: prove no pre-approval side effect, expired-approval rejection and no duplicate action. |
| [Inspect AI — MIT](https://github.com/UKGovernmentBEIS/inspect_ai/blob/2f78dcb29eb02830b4536050f61fd1a0f7665523/src/inspect_ai/approval/_apply.py) | Tool approval application | Attach explicit approvers; the no-approver path allows the call. Record original and modified calls. Test reject, modify and missing-policy cases. |
| [smolagents — Apache-2.0](https://github.com/huggingface/smolagents/blob/96f33faaf028479119ec8d34507b47694cf14e34/src/smolagents/agents.py) | Tool/executor boundary and step finalisation | Use an execution wrapper for pre-action policy. Step callbacks run during finalisation, so use them for observations. Prove a denied tool is never invoked. |
| [MCP Python SDK — MIT](https://github.com/modelcontextprotocol/python-sdk/blob/d7845c073a2b9ba5ab2817ecf93d3e45ef24cd14/docs/handlers/elicitation.md) | Elicitation handlers and cancellation outcomes | Collect scoped human input, then enforce it in the tool host. Asking a question is not authority. Test decline and cancel without a side effect. |
| [OpenShell — Apache-2.0](https://github.com/NVIDIA/OpenShell/blob/d4e32263eb4554c46c5bae702acada2f4af03eb0/crates/openshell-core/src/policy.rs) | Typed sandbox policy and [middleware](https://github.com/NVIDIA/OpenShell/blob/d4e32263eb4554c46c5bae702acada2f4af03eb0/crates/openshell-policy/src/middleware.rs) | Record policy digest, denials and observed effects alongside evidence. Preserve the host's isolation boundary. Test a forbidden operation and retain the denial. |
| [OpenTelemetry GenAI — Apache-2.0](https://github.com/open-telemetry/semantic-conventions-genai/tree/3fe84604a581b3d50dd5b4bd29383b462d2a5018) | Agent, workflow and tool span conventions | Map the existing metadata-only exporter to a pinned convention version. The agent conventions moved out of the original semantic-conventions repository and remain in development. Test redaction and unknown outcomes. |

For a single founder, start with the existing panel and one approval adapter rather than
six simultaneous host integrations. LangGraph is a candidate for the first adapter;
Inspect AI supplies a useful explicit approval model for test design. Selection is an
engineering recommendation, not a claim of customer demand.

## Acceptance and operating measures

A first host proof should retain: a baseline run; an approved scoped action; a denied action
with zero side effects; expiry/revocation; changed input; duplicate resume; a tampered
receipt; a wrong subject; a missing dependency; and a reproducible export. Publish results
with exact revisions and failures before expanding the claim.

Track the sequence from useful evidence to durable business activity:

- A reader completes verification of the correct subject.
- A developer integrates and repeats it in their own environment.
- A scoped customer accepts the delivered artifacts.
- The customer pays, returns, and requests a versioned refresh.
- Corrections and new tests improve the reusable method without rewriting past results.

Keep counts distinct. Page views, tool calls, signed records, accepted deliveries, cash
received and renewals are different events. Do not add them together as “growth.”
