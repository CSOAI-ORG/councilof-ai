# Integration reconciliation — 29 October 2026

This is a dated engineering inventory and completion record, not a new charter,
measurement, package release or claim of vendor adoption. Inspected base:
`CSOAI-ORG/councilof-ai@aa1937c698fb4f527c26980b73bc865deb957792`.
Read current public source, retained fixtures, the distribution declaration and
selected open PRs; searched the organisation for the four requested frameworks.
Search absence is not proof of absence across every branch, archive or private host.
Continuation reconciled the later master `ad350c6d` and open PRs #3596, #3598,
#3602 and #3604. This inventory is scoped source evidence, not a clean bill for
the entire organisation or a statement that pending PRs are deployed.

## What already exists

| Area | Existing source and evidence | Actual scope | What remains |
| --- | --- | --- | --- |
| LangChain | `distribution/python/langchain-csoai/langchain_csoai/tools.py`; `scripts/harness-x/test_py_adapters.py`; declared in `council-os/distribution.json`; new `harness/langchain-authority/` | Existing reader package plus experimental host-authority middleware; 43 checks exercise real SDK interrupt/resume, host verification, a harmless write and independent file readback | Connect real authenticated human authority and durable replay/revocation, then qualify the deployed executor. The generated reader package is unchanged. |
| LangGraph examples | [mcp-servers example](https://github.com/CSOAI-ORG/mcp-servers/blob/5708bb4c884552627d495eff820bc26987ee9d78/examples/python/langgraph_agent.py) and [meok-ai orchestration source](https://github.com/CSOAI-ORG/meok-ai/blob/628c3cb159e08c524668b8665d8d0c2d15f00718/langgraph/agent_orchestrator.py) surfaced by code search | Earlier example/orchestration code exists outside the canonical generated distribution | These search matches were not exercised here. Reconcile useful logic into the canonical producer; do not create another release authority. |
| Strands | New `harness/authority_adapters/strands_adapter.py`; SDK 1.62.0 | 18 real-SDK checks: before/after hooks, review/resume, final middleware gate, mutation, cancellation, retries and independent file readback | Join a real host and durable authority. Hook results can be rewritten; they are not independent effect observations. Background/nested/streaming effects remain unqualified. |
| OpenAI Agents SDK | New `harness/authority_adapters/openai_adapter.py`; SDK 0.24.0 | 27 checks covering local FunctionTool approval/rejection, serialized state replay, guardrails, exact inputs and host authority | Real identity and downstream effect enforcement remain separate. Hosted tools, shell, remote MCP, nested agents and streaming are not covered by these function-tool tests. |
| OpenShell | `harness/openshell-adapter/adapter.py`, `declared_observed.py`, fixtures, retained capture, requalification notes; `packages/evidence-fabric/ingest/openshell_in.py` | Substantial implementation already exists: declared policy vs enforcer vs witness; signed receipts using a published test key by default; v0.1.4 qualification covers input paths only | Fresh effective-policy capture, current-version runtime test, independent witness and authority/revocation binding remain separate acceptance gates. |
| OpenShell to Cedar | `harness/openshell-cedar/translate.py`, `roundtrip.py`, `ocsf_observer.py`, `out/roundtrip-summary.json` | Existing translator and retained generated-request comparison; unsupported elements produce no permit | Historical 3,767-request result compares against our Python policy model, not the running OpenShell enforcer. No Cedar binary rerun in this review. |
| OpenShell to OTel | `packages/evidence-fabric/examples/openshell-otel/` | Retained v0.162.0 collector output; three of three records reproduce as identical | Old export omits policy identity. New opt-in exporter below closes serialization loss; added attributes still need a fresh collector test. |
| OASF / AGNTCY | `packages/evidence-fabric/render/oasf_eval.py`, `oasf/build_record.py`, `scripts/harness-x/sign-oasf.mjs`, `public/oasf/` | Existing evidence renderer, generated records and detached-attestation route | Directory presence, signature/key authentication and a receiving user's successful resolution are separate checks. Do not re-create the renderer. |
| NVIDIA NeMo Agent Toolkit | `packages/nat-csoai-evidence/` | Existing evaluator for offline signed evidence and state words; avoids scoring errors as zero | Published package state and a current tenant/workflow run were not reverified here. |
| Inspect / other evidence | `packages/evidence-fabric/ingest/inspect_native_in.py`, `garak_in.py`, `nemo_guardrails_in.py`, `sarif_in.py` | Existing import paths and tests; carrier conversion does not mint measurements | Preserve method/version and actual run status; don't treat an importer as proof a run occurred. |
| Human review | `functions/api/hitl.ts`, `_hitl.ts`, `HitlConsole.tsx`; this directory's authority-effect profile and binding tests | Source exists. PR #3596 reconciles stale root instructions with observed deployed state | A real authenticated human decision, exact request, current authority, execution and effect readback still need joined end-to-end evidence. |
| Product packaging | Existing 22-article operational charter; [PR #3596](https://github.com/CSOAI-ORG/councilof-ai/pull/3596) | Existing PR maps charter, workflow journeys and prototype limitations | Reuse that work. No competing charter, homepage rewrite or generated-distribution edit in this change. |

The older frozen charter names `openshell_authority_adapter.py` by digest. That name
is not interchangeable with `harness/openshell-adapter/adapter.py`. The former's
source and current call path were not recovered in this bounded public-source pass;
a published digest alone does not make it an installable or exercised integration.

## Changes completed in this contribution

1. **Approval correction consolidated into its existing owner:** the initial
   contribution reproduced invocation before approval and added a 42-check fix.
   [PR #3598](https://github.com/CSOAI-ORG/councilof-ai/pull/3598) independently added
   broader stage-order controls and correct handling of a schema-valid UNKNOWN
   effect. At `0fb6f55`, its checker passes 47 checks in our separate local readback.
   Removed our overlapping edits to the profile and checker; compose that correction
   from #3598. Our unchanged base still reports 39 checks and retains the known gap
   until #3598 lands. Passing that older suite does not close the issue. Frozen
   schema/example bytes remain unchanged.
2. **Policy provenance export:** `render/openshell_otel.py` extends the existing
   renderer with an explicit input-policy hash, source-report hash and export profile.
   It rejects bad/missing binding fields or a tampered event before writing a batch.
   Ten focused checks pass. The original renderer is unchanged because SAFE consumers
   pin its exact bytes; old collector and signed records are not regenerated.
3. **Cisco report handoff:** `ingest/cisco_mcp_in.py` accepts the documented
   `--format raw` envelope at upstream commit `21a87b4b`. Eighteen synthetic-fixture
   checks cover finding retention, tool/prompt/resource records, empty results,
   malformed input and batch rejection. A scanner's `is_safe` flag never becomes our
   measurement or permission. This is an offline importer; no scanner execution,
   paid analyzer, remote tool call or Cisco endorsement is claimed.
4. **Actual LangChain runtime seam:** `harness/langchain-authority/authority.py`
   requires strict host verification and one-use consumption for the exact selected
   tool/version, canonical arguments and host scope immediately before dispatch.
   The 43-check suite uses pinned LangChain 1.4.7 / LangGraph 1.2.18, real checkpoint
   interrupts/resume and an owned file tool. Both review modes and sync/async happy
   paths run; rejection, edits, scope mismatch, expiry, revocation, cancellation,
   changed review predicates, mutation and duplicate attempts are exercised. The
   model and host authority registry are synthetic; effect readback is a real local
   file inspection. No real human credential or production host is implied.
5. **Two additional SDKs and one shared core:** extracted the immutable host scope
   and strict verification into `harness/authority_adapters/core.py`; the existing
   LangChain 43 checks still pass. Strands contributes 18 and OpenAI 27 checks,
   bringing qualified SDK cases to 88. Strands hooks use explicit observation
   priority because after-call callbacks reverse registration order; final
   authority is enforced after mutating hooks at ExecuteToolStage. OpenAI checks
   authority inside the actual function callback after approval and input guardrails.
6. **Reproducible evidence retention:** `retain_checks.py` runs the 45 new SDK
   checks and two deliberate bypass controls. Disabling the strict host-result
   comparison in a disposable copy creates an unauthorized write in each SDK and
   makes both selected tests fail. The runner independently reads those writes,
   retains JUnit/log/source hashes and uses the existing evidence-event builder and
   full schema. `receipts/2026-10-29/` contains the resulting unsigned record,
   with `value: null`. This is SDK-control evidence, not a GSPC model or board score.

Validation on the isolated source slice: 79 tests passed across the new handoffs and
existing event/doctrine checks; 43 new LangChain checks; 38 v0.1 checks; 11 approval
dependency tests; the discriminating-power script passed. Existing Python adapters:
7 tests passed. OpenShell adapter: 24 passed including Python/JavaScript receipt
agreement. Declared/observed suite: 13 passed, with its one live-prover test skipped
because no prover binary was configured. The historical collector comparison
reproduced all three records and its documented input/readback digests. The existing
OTel golden is byte-identical. These are scoped checks, not a full monorepo audit.
The path-scoped `evidence-handoff-checks` workflow reruns the focused Python checks on
changes to these source areas; it has read-only repository permission and no secrets.
It has separate pinned-SDK LangChain and Strands/OpenAI jobs. The latter retains
an artifact with acceptance and deliberately failing bypass results. All hosted
checks for the preceding `80ef085` commit passed before this extension; new-head
CI is assessed separately. The 47-check corrected temporal
suite belongs to #3598; this PR deliberately does not carry a competing implementation.

## What to reuse from the three reference organisations

These are engineering choices inferred from the sources, not claims of partnership.

| Source | Mechanism worth adopting | Concrete CSOAI use | Boundary |
| --- | --- | --- | --- |
| [MLCommons AILuminate](https://mlcommons.org/ailuminate/safety/) and [source](https://github.com/mlcommons/ailuminate) | Explicit use case and hazard taxonomy; separate public practice and private official test sets | Freeze the next GSPC method before evaluation, retain a holdout and publish the test population, exclusions and uncertainty | Do not relabel GSPC as AILuminate or copy their grades. Dataset access/licence and benchmark messaging rules are separate from software reuse. |
| [OpenSSF Scorecard raw results](https://github.com/ossf/scorecard/blob/main/checker/raw_result.go) and [check documentation](https://github.com/ossf/scorecard/blob/main/docs/checks.md) | Retain raw observations before policy/scoring; per-check evidence and remediation | Give each GSPC integration a source revision, observation, failed control, limit and next corrective action | Automated repository hygiene is not runtime agent safety; don't convert a foreign score into a GSPC admission verdict. |
| [Sigstore verification](https://docs.sigstore.dev/cosign/verifying/verify/) and [identity guidance](https://docs.sigstore.dev/quickstart/verification-cheat-sheet/) | Verify artifact bytes plus an expected signer identity and OIDC issuer, with retained bundle material | Extend the existing receipt/batch verifier path with explicit trust inputs and a stranger-runnable verification pack | A self-consistent signature under a supplied key is not independently authenticated identity or a true claim. Logging/anchoring alone does not fix that. |

Additional useful connections:

- **Cedar:** extend the existing translator, rather than introducing another policy
  engine. [Cedar's security guidance](https://github.com/cedar-policy/cedar-docs/blob/main/docs/collections/_other/security.md)
  specifies default deny and forbid-overrides-permit, but also skip-on-error semantics.
  Schema validation and explicit handling of policy diagnostics are needed; the word
  "default-deny" alone does not prove a faulty forbid cannot be bypassed.
- **AGNTCY:** reuse the OASF distribution and the
  [operating-model roles](https://github.com/agntcy/governance/blob/main/OPERATING_MODEL.md).
  Start with named method maintainer, adapter maintainer, release owner and independent
  reproducer. A public member/adopter list is not independent review of our evidence.
- **Cisco:** consume the actual
  [envelope contract](https://github.com/cisco-ai-defense/mcp-scanner/blob/21a87b4bc818c2e279d9af6cf5b20ed386dfc9b5/docs/output-formats.md).
  Requested analyzers and reported findings remain producer declarations. Keep the
  existing SARIF path for tools that actually emit SARIF.

Before copying upstream implementation code, pin the revision and preserve its
licence and notices; review dependencies and data licences separately. The two new
handoffs here are our implementation of public interfaces, not imported vendor code.

## One shared contract for the four runtime integrations

Reuse `hitl-authority-effect-v0.2.schema.json` and the existing evidence event. Do not
invent four unrelated receipt formats. The host must bind the canonical request,
principal, tenant, audience, tool/version, policy revision, authority epoch, expiry
and one-use invocation identity. Authentication, revocation and replay enforcement
belong to the host; GSPC evidence cannot grant permission.

| Seam | Implement at | Acceptance evidence still required |
| --- | --- | --- |
| LangChain / LangGraph | [human-review middleware](https://github.com/langchain-ai/langchain/blob/350568952c4b65d1310081d45a2536b6449712f0/libs/langchain_v1/langchain/agents/middleware/human_in_the_loop.py) and new `harness/langchain-authority/` | SDK wiring and fixture controls now pass. A real host must authenticate and record the latest decision, revoke prior leases before resuming a rejection, atomically consume exact scope, and enforce it at the downstream effect. See the harness README for middleware order and dynamic-predicate limits. |
| Strands | [Hooks](https://github.com/strands-agents/harness-sdk/blob/409cb540d2c9318a2304b379d52a56c9bd48e29a/strands-py/src/strands/hooks/events.py), ExecuteToolStage and new local adapter | Actual hook/middleware loop is now exercised. Real host authentication, durable cross-worker replay/revocation and separately observed downstream effects remain required. Observe after-hook priority explicitly; retain denied attempts even if a later hook rewrites the result. |
| OpenAI Agents SDK | [Official approval/guardrail guidance](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals) and new local FunctionTool adapter | Actual pause/reject/serialized-resume and guardrail paths are exercised. Output rejection cannot undo a completed effect. Join actual human authority and qualify other tool classes separately. |
| OpenShell | Existing local adapter and [upstream policy example](https://github.com/NVIDIA/OpenShell/blob/main/examples/sandbox-policy-quickstart/policy.yaml) | Record both authored and effective installed policy, including provider-added grants; execute one allowed and one denied harmless action with external observation; revoke authority and show subsequent action blocked. |

Upstream links using a branch name identify discovery seams, not install pins. Freeze
the compatible SDK release/commit and its licence in each adapter's acceptance record
before claiming support. LangChain, Strands and OpenAI local function-tool paths
are qualified as bounded experimental harnesses. No framework adapter is declared deployed
or generally complete by this table.

## Package one understandable business workflow

Customer promise: **"See what the agent proposed, who approved it, what actually
happened and which evidence remains current."** This is proposed copy; each part
must link to a demonstrated journey before it becomes a product claim.

Keep five linked layers: the existing charter (commitments), a versioned policy
profile (machine requirements), a maintained adapter (host connection), an evidence
pack (replay and limits), and a correction/expiry process (what changes next).
The customer starts with one task, not a catalogue of every connector and charter.

The first complete pilot should use the existing OpenShell capture path, the policy
provenance exporter, a retained scanner report when relevant, the current GSPC record,
and one human decision. Complete means an outside receiver can inspect and reproduce
the scoped result. An installed package, a listing, a successful signature check and
a paying customer are four different milestones.

The action/reaction idea is useful as a feedback discipline, not a physical law of
adoption: each release records the expected user outcome, an observable signal, a
failure control, an owner and a decision date. Reproduce, correct, withdraw or expand
from observed results. Missing response stays unknown; activity volume is not demand.

## Completion order and release boundaries

1. Land the bounded code corrections through the protected PR path; keep #3596 as the
   existing packaging lane. Do not merge overlapping sitemap or other lane fixes here.
2. Run the new OpenShell export through a current local collector and retain readback;
   capture effective policy with one harmless runtime allow/deny/revoke sequence.
3. The pinned LangChain, Strands and OpenAI SDK harnesses and fixture controls are implemented. Connect
   the actual host authority service and enrolled approver next, retain its deployed
   controls, then propose any package change through the existing generator.
4. Give one receiver a reproducible evidence pack. Record their actual reproduction
   separately from our fixture checks and any public listing.
5. Broaden SDK/tool-class support only after the actual host contract and effect
   boundary are demonstrated. Keep current supported versions and exclusions explicit.

Do not weaken frozen graders, rewrite signed historical evidence, broaden a benchmark
score into authority, or call the whole estate clean on the strength of this bounded
review. No production deploy, package publish, upstream submission, paid run, new
credential or new human approver was performed by this contribution.

## Consolidated ownership and next decisions

| Work | Current owner/source | Completion boundary |
| --- | --- | --- |
| Frozen operational charter | Existing 22-article charter and amendment process | No new competing charter; mappings must identify version and evidence |
| Approval contract and temporal corrections | #3598, inspected at `0fb6f55` | Retain its broader checker/UNKNOWN handling; owner reviews client compatibility change |
| Workflow packaging and entry navigation | #3596 | Browser acceptance and protected release remain separate |
| User evidence capsule save/reopen | #3602 | Preserve that lane's candidate and its existing tests; no duplicate implementation |
| Demand and signing-custody claim corrections | #3604 | Readiness statements need observed evidence, not listings or plans |
| Cisco / OpenShell evidence handoffs and three SDK runtime harnesses | This contribution, #3599 | Hosted focused tests and retained controls, then actual receiver/runtime acceptance |

The immediate deliverable is one reproducible workflow: proposal, authenticated
decision, bounded execution, independently observed effect, attached measurement,
and an explicit correction/expiry condition. Charter commitments, permission,
measurement, signature authenticity and successful customer use remain separately
testable. That separation is how existing work can be composed without inflating
claims or rewriting frozen history.
