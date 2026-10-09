# GSPC capability fabric: market map and first proof

30 September 2026. Research and product decision, not a deployed integration or claim of market leadership.

## Decision

**GSPC is the product.** Council OS is its human/agent workspace; Plugin X, MCP, API, SDK and A2A are access surfaces; Layer O selects a permitted capability; Harness X tests; GSPC admits measurements; claim maintenance and corrections keep conclusions current; RAS sells scoped work and maintenance. Do not create a second product authority or a second index with an independent verdict.

The useful public sentence is: **“One connection to discover and request capabilities; GSPC shows what was actually tested for this task, why a route was allowed, what happened, and when that conclusion changed.”** “Governed,” “safe,” “compliant” and “cheapest” require a named policy, task, observation and comparator; they are not default adjectives for every route. A catalog listing is not a measurement.

This is a *measured capability fabric*, not a new foundation model or AGI claim. It can make a host AI more useful without moving its user into Council OS. The host still controls its user session and tool permissions. GSPC cannot silently acquire the host's credentials or invoke a vendor's private tenant.

## What the strong adjacent products already do

| Boundary | Current primary-source example | What to adopt or interoperate with | GSPC gap to prove |
| --- | --- | --- | --- |
| Context-light tool discovery | [Anthropic Tool Search](https://www.anthropic.com/engineering/advanced-tool-use) defers large MCP tool definitions and loads relevant ones on demand. Its example has 58 tools using about 55K tokens before search; this is not a universal “50-tool limit.” | Expose few GSPC tools and discover the rest on demand; use tight names and examples. | The discovered tool's suitability must be tested for the *specific* task and control, not inferred from its description. |
| Unified execution/budget gateway | [LiteLLM](https://docs.litellm.ai/docs/proxy/client_setup/overview) already fronts models **and MCP servers** with one client connection, keys, access control, budgets, spend and guardrails; [OpenRouter](https://openrouter.ai/blog/insights/model-routing/) routes models/providers by price and reliability. | Reuse gateway mechanics or accept their traces; avoid rebuilding provider adapters first. | Verify task outcome, provenance, policy and correction across models, tools and agents; compare actual cost against a fixed baseline. |
| Agent and MCP control plane | [Portkey's MCP Gateway](https://portkey.ai/blog/introducing-the-mcp-gateway/) already handles tool-server auth, access policy and traces; its [Agent Gateway](https://portkey.ai/blog/agent-gateway/) adds an agent registry, scoped permissions and observability. [Composio](https://docs.composio.dev/) discovers tools by intent across 1,000+ apps and handles user auth/action execution. | Treat these as strong incumbent infrastructure and potential export/integration surfaces, not as mere model routers. GSPC can consume authorized traces rather than proxying every call itself. | Prove an independently reproducible, task-scoped measurement and a maintained correction history that survives changes in gateway, catalog and agent runtime. Do not claim this gap is exclusive until tested against their current eval and governance offerings. |
| Task-aware model choice | [Not Diamond](https://docs.notdiamond.ai/docs/what-is-model-routing) offers pretrained and custom routers using application eval data, optimizing quality, cost or latency. | Learn from task-specific eval data and shadow comparison. | A classifier suggestion never overrides permissions or GSPC admission. |
| Agent discovery and identity | [AGNTCY ADS](https://docs.agntcy.org/dir/overview/) indexes OASF records and supports distributed discovery; its [quickstart](https://docs.agntcy.org/dir/dir-getting-started/) includes record signing/verification. | Ingest records under terms; preserve record CID, signer, locator, version and skill taxonomy. Do not duplicate its directory or claim that it lacks trust features. | Run controlled task checks and maintain an independent, portable history of outcomes and corrections. |
| Continuous evals | [LangSmith](https://docs.langchain.com/langsmith/evaluation-types) and [Braintrust](https://www.braintrust.dev/articles/how-to-eval) already connect offline evals, production traces and online scoring. | Accept trace/eval exports where authorized; preserve grader version, input scope and uncertainty. | Make cross-runtime results comparable enough for bounded routing, with transparent abstention and signed exact-byte receipts. |

These are competitors in pieces of the workflow and potential input/transport partners. **“Others route models; we route capabilities” is no longer a defensible contrast**: LiteLLM, Portkey and Composio already cover tools, agents or both. None should be described as having adopted GSPC. The narrower distinctiveness hypothesis is portable, independently checkable *task evidence plus correction maintenance* across those surfaces. It stays a hypothesis until a buyer or independent agent uses the full loop and reproduces its result.

## The process to copy at our stage

The successful adjacent products each begin with a **small, repeatable developer action**: one OpenRouter-compatible call, one LiteLLM gateway key, one AGNTCY record, or one eval trace. They then make use and failure observable. GSPC should offer one read-only `request-evidence` operation through the existing MCP and Council OS, backed by the *same* stored job, before multiplying plugins, hives, marketplace listings or pricing tiers. The first useful result is an honest candidate comparison or an explicit abstention with a reason and a way to commission the missing check.

The adoption loop is: discover a capability → inspect its declared contract → request a bounded test → compare with a baseline → share a verifiable receipt or correction → invite a scoped recheck → learn from the outcome. A public demonstration should let a stranger reproduce one result without an account. A private deployment should let its owner withhold traces and apply policy locally. Measure whether an external developer completes that loop and comes back; do not treat views, cards, or a free API call as customer traction.

## The minimum semantics before another catalog is added

1. `CapabilityRecord`: publisher, immutable version/CID, protocol and locator, declared skills, authentication, data region, effect class, terms and observation time. State `LISTED` only.
2. `VerificationRecord`: exact source bytes/digest, identity and signature result (`VALID`, `INVALID`, `UNCHECKABLE`), endpoint health and rights. Verified identity/health still does not establish task quality.
3. `TaskMeasurement`: frozen input domain, same checker/version/configuration across candidates, failure and acceptable controls, sample size, uncertainty, actual latency/cost, known limitations and GSPC admission decision. A task mismatch or stale result means **abstain**.
4. `RouteDecision`: one `gspcjob:` identity, candidate set, required effect/data authority, selected route or abstention, policy and admission references. Jev or another fast model may suggest; deterministic policy decides. Actual execution, payment and signature are separate events.
5. `OutcomeAndCorrection`: observed effect, user feedback, incident/failure, corrected claim, hold/retest state and immutable prior receipt. A failed route does not silently auto-repair a third-party system.
6. `CommercialEvent`: preview, requested scope, accepted scope, delivered bytes, settlement and repeat purchase remain separate. Routing quality and GSPC verdict do not depend on payment.

**Public agent-economy index, if built:** publish separate counts for discovered records, cryptographically verified identities, admitted task measurements, observed invocations, delivered work and independently evidenced settlements. Show denominator, coverage, collection date, sampling/selection bias and unknowns. A public catalog or our own traffic cannot justify a universal “AI economy” claim. Keep private customer traces and pricing out of the public index unless authorized and aggregated safely. The title is not an empty namespace: [SemaCore](https://semacore.ai/) already calls its readiness score an “Agentic Economy Index,” while [DN's Global Agent Economy Index](https://decentralised.news/global-agent-economy-index-2027) describes a different economic-output methodology. Use a GSPC-specific descriptive title until naming is cleared, and state precisely which population and outcomes are actually observed.

## Stage at which CSOAI actually stands

- Existing local source registry covers MCP, A2A cards, x402, Hugging Face and other public sources; the [RAS compounding contract](RAS_COMPOUNDING_OPERATING_LOOP.md) already separates listing, measurement, admission, publication, buyer use and payment.
- The local [GSPC job contract](GSPC_ONE_PRODUCT_JOB_CONTRACT_2026-09-30.md) holds one job identity across nine channel projections; `ras_hive_os.measured_route` is a tested **planner** that abstains without admitted task evidence. These are not deployed adapters or a live routed execution.
- The public [GSPC board](https://councilof.ai/api/gspc) reports 23 measured axes, but those axis measurements do not by themselves compare the route candidates for a new customer task. The current route should therefore abstain rather than borrow an unrelated score.
- The [SAFE five-surface bridge](OSAIA_SAFE_FIVE_SURFACE_BRIDGE_2026-09-30.md) maps public seams for CrowdStrike, NVIDIA, Palantir, Cisco and Red Hat; every one is `DOCUMENTED_NOT_CONNECTED`. Alliance membership does not grant vendor access, endorsement or adoption.
- No RAS subscription is live. Maintain the existing bounded x402 offer until repeat non-self buyer evidence justifies a new commercial tier.

## First falsifiable proof, before scaling the index

Choose **one owned read-only task**, two runnable candidates and a frozen task bank with a designed failure and acceptable control. Preserve the same input, checker and configuration across both. Run the existing fixed route, random route and GSPC proposed route in shadow. Record actual cost, latency, failure rate and completion quality, including all abstentions. Allow no private data, write effects or automatic fallback. Have an independent verifier recheck the exact result bytes and signed receipt if one is issued. Correct a planted stale/failed claim and show the prior record still exists. Only after that should the same job record be exposed through the existing Council OS action and MCP tool, then A2A and agent-UI adapters.

The commercial test is one buyer who requests the exact missing evidence or its ongoing maintenance, receives it, and pays again. More cards or free calls are discovery, not that result.

## Naming

“Router X” is occupied as a descriptive product name: [Deepractice RouterX](https://github.com/Deepractice/RouterX) is already an MIT-licensed universal LLM API router, and [RouterX](https://routerx.exchange/) is used for an on-chain routing product. Search results are not a trademark clearance. Keep **GSPC** as the public product and **Layer O capability routing** as the module name; avoid promoting Router X as a brand until counsel or an official trademark search clears it.
