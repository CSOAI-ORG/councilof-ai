# Integration reconciliation — 29 October 2026

This is a dated engineering inventory and completion record, not a new charter,
measurement, package release or claim of vendor adoption. Inspected base:
`CSOAI-ORG/councilof-ai@aa1937c698fb4f527c26980b73bc865deb957792`.
Read current public source, retained fixtures, the distribution declaration and
selected open PRs; searched the organisation for the four requested frameworks.
Search absence is not proof of absence across every branch, archive or private host.

## What already exists

| Area | Existing source and evidence | Actual scope | What remains |
| --- | --- | --- | --- |
| LangChain | `distribution/python/langchain-csoai/langchain_csoai/tools.py`; `scripts/harness-x/test_py_adapters.py`; declared in `council-os/distribution.json` | `GSPCBoardTool` and `VerifyCardTool`; PyPI index returned 0.1.3 during this review; seven existing offline adapter tests pass across LangChain, LlamaIndex and CrewAI | Exact reviewed-arguments binding through LangChain HITL interrupt/resume is a separate integration. Existing reader tools do not implement that boundary. |
| LangGraph examples | [mcp-servers example](https://github.com/CSOAI-ORG/mcp-servers/blob/5708bb4c884552627d495eff820bc26987ee9d78/examples/python/langgraph_agent.py) and [meok-ai orchestration source](https://github.com/CSOAI-ORG/meok-ai/blob/628c3cb159e08c524668b8665d8d0c2d15f00718/langgraph/agent_orchestrator.py) surfaced by code search | Earlier example/orchestration code exists outside the canonical generated distribution | These search matches were not exercised here. Reconcile useful logic into the canonical producer; do not create another release authority. |
| Strands | No `BeforeToolCallEvent` implementation found in the bounded organisation code search | Upstream hooks are an opportunity, not a verified local adapter | Bind the final selected tool and arguments, cancellations, retry attempts and observed results. Pin and exercise the actual SDK. |
| OpenAI Agents SDK | Existing OpenAI app/plugin/MCP distribution entries; candidate authority-effect profile | Distribution to a client and approval of a consequential SDK tool are different capabilities | No dedicated `needs_approval` SDK adapter was established by the inspected source. Test supported function tools, resume and guardrails explicitly; do not infer hosted-tool coverage. |
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

1. **Approval causal order:** the v0.2 reference checker previously accepted an
   invocation at 09:25 and an approval at 09:40 when both were within the validity
   window. Added the missing comparison and a regression that failed first. Equality
   at the decision instant, including equivalent timezone offsets, remains accepted.
   The suite now reports 42 checks. This is reference-record checking, not deployment
   of a runtime authorization gateway. Frozen schema/example bytes are unchanged.
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

Validation on the isolated source slice: 79 tests passed across the new handoffs and
existing event/doctrine checks; 42 v0.2 profile checks; 38 v0.1 checks; 11 approval
dependency tests; the discriminating-power script passed. Existing Python adapters:
7 tests passed. OpenShell adapter: 24 passed including Python/JavaScript receipt
agreement. Declared/observed suite: 13 passed, with its one live-prover test skipped
because no prover binary was configured. The historical collector comparison
reproduced all three records and its documented input/readback digests. The existing
OTel golden is byte-identical. These are scoped checks, not a full monorepo audit.
The path-scoped `evidence-handoff-checks` workflow reruns the focused Python checks on
changes to these source areas; it has read-only repository permission and no secrets.

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
| LangChain / LangGraph | [human-review middleware](https://github.com/langchain-ai/langchain/blob/master/libs/langchain_v1/langchain/agents/middleware/human_in_the_loop.py) and resumed tool execution | Reviewed args are the executed args; reject prevents execution; edited args trigger the intended fresh decision; approval cannot be skipped because a predicate changed during resume. Human-supplied responses remain distinct from tool effects. |
| Strands | [BeforeToolCallEvent / AfterToolCallEvent](https://github.com/strands-agents/harness-sdk/blob/main/strands-py/src/strands/hooks/events.py) | Capture the final tool and arguments after mutating hooks; cancellation prevents dispatch; each retry is a separate attempt under current authority; no duplicate external effect after recovery. |
| OpenAI Agents SDK | [FunctionTool approval and guardrail contract](https://github.com/openai/openai-agents-python/blob/main/src/agents/tool.py) | Pause, authenticate the approver, bind exact arguments, revalidate after resume and record effect separately. State supported tool classes and guardrail order; test edited, expired and rejected approvals. |
| OpenShell | Existing local adapter and [upstream policy example](https://github.com/NVIDIA/OpenShell/blob/main/examples/sandbox-policy-quickstart/policy.yaml) | Record both authored and effective installed policy, including provider-added grants; execute one allowed and one denied harmless action with external observation; revoke authority and show subsequent action blocked. |

Upstream links using a branch name identify discovery seams, not install pins. Freeze
the compatible SDK release/commit and its licence in each adapter's acceptance record
before claiming support. No framework adapter is declared complete by this table.

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
3. Implement one framework adapter against a pinned SDK, starting with LangChain's
   existing distribution. Run the approval/argument/expiry/replay controls above.
4. Give one receiver a reproducible evidence pack. Record their actual reproduction
   separately from our fixture checks and any public listing.
5. Extend Strands and OpenAI support only after the shared host contract is demonstrated.

Do not weaken frozen graders, rewrite signed historical evidence, broaden a benchmark
score into authority, or call the whole estate clean on the strength of this bounded
review. No production deploy, package publish, upstream submission, paid run, new
credential or new human approver was performed by this contribution.
