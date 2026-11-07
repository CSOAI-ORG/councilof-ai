# Mi-Oak organism and learning-loop audit — 28 September 2026

## Finding

The Hugging Face trail most likely refers to MiroFish: the original project is 666ghj/MiroFish; a Hugging Face Space exists at pjpjq/MiroFish. The indexed Space result said “Paused,” but that observation was several months old, so its current status is unverified. MiroFish describes a seed-document → entity/relationship graph → persona and memory construction → OASIS simulation → report workflow. Its README acknowledges Shanda Group incubation and CAMEL-AI OASIS. These are project descriptions, not evidence of predictive accuracy. The repository identifies AGPL-3.0; do not copy/adapt code into a hosted CSOAI service without a license review.

Primary sources: [MiroFish repository](https://github.com/666ghj/MiroFish) · [MiroFish HF Space](https://huggingface.co/spaces/pjpjq/MiroFish) · [OASIS](https://github.com/camel-ai/oasis) · [license](https://github.com/666ghj/MiroFish/blob/main/LICENSE).

## Curated 30-project comparison

This is a relevance shortlist, not a market-share ranking. It mixes Chinese-founded projects, international open-source frameworks, simulation environments, and evaluation infrastructure. The mechanics below are based on public project documentation/README-level inspection; this is not a source-code security review or reproduction of results.

| # | Project | Useful mechanic | Apply to CSOAI |
|---:|---|---|---|
| 1 | [MiroFish](https://github.com/666ghj/MiroFish) | Seed material → graph → personas/memory → simulation → report | Use graphs/scenarios for hypotheses; label simulated outputs synthetic |
| 2 | [OASIS](https://github.com/camel-ai/oasis) | Explicit action space and evolving environment | Define a small deterministic action/event vocabulary before scaling agents |
| 3 | [CAMEL-AI](https://github.com/camel-ai/camel) | Reusable agent, tool, and memory abstractions | Adapt connectors; keep GSPC authority outside the agent framework |
| 4 | [AgentVerse / OpenBMB](https://github.com/OpenBMB/AgentVerse) | Separate task-solving and simulation settings | Keep operational workflows separate from sandbox simulations |
| 5 | [AgentScope](https://github.com/agentscope-ai/agentscope) | Message-based multi-agent composition, state, evaluation | Make inter-agent messages typed, traceable, and replayable |
| 6 | [AgentScope Runtime](https://github.com/agentscope-ai/agentscope-runtime) | Agent API, persistence, interruption, sandboxing, tracing | Reuse runtime patterns; avoid a second competing state store |
| 7 | [EvoAgentX](https://github.com/EvoAgentX/EvoAgentX) | Generate/evaluate/optimize workflows against benchmarks | Version candidate changes; require untouched holdouts |
| 8 | [MetaGPT](https://github.com/geekan/MetaGPT) | Role outputs follow explicit SOPs and upstream/downstream artifacts | Give each harness a contract, not an unconstrained persona |
| 9 | [ChatDev / DevAll](https://github.com/OpenBMB/ChatDev) | Configurable orchestration evolved from role-based company simulation | Make orchestration visible; retain human review for consequential work |
| 10 | [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) | Model/tool integration and structured execution | Keep model adapters replaceable; capture exact model/config per run |
| 11 | [OpenManus](https://github.com/FoundationAgents/OpenManus) | Open general agent/tool-use workflow | Borrow task decomposition; do not inherit broad permissions |
| 12 | [EvoMaster](https://github.com/sjtu-sai-agents/EvoMaster) | Analyze trajectories, propose run-local skills, rerun with overlays | Treat learned skills as versioned proposals with regression tests |
| 13 | [Yunjue-Agent](https://github.com/YunjueTech/Yunjue-Agent) | Tool synthesis/reuse, released traces, reproducible evaluation | Replay tool changes; measure convergence and failure cases |
| 14 | [A-Evolve](https://github.com/A-EVO-Lab/a-evolve) | Separates evolution algorithms from agents being evolved | Keep optimizer choice pluggable and benchmarked |
| 15 | [Agent2World paper](https://arxiv.org/abs/2512.22336) | Researcher → world-model builder → adaptive test team | Let tests challenge proposed models; do not infer real-world truth |
| 16 | [AgentBench / THUDM](https://github.com/THUDM/AgentBench) | Task environments with defined success measures | Score task outcomes in environments, not narrative confidence |
| 17 | [AgentGym](https://github.com/WooooDyy/AgentGym) | Unified environment API and explicit trajectories | Normalize reset/observe/act/outcome across harnesses |
| 18 | [ToolBench / OpenBMB](https://github.com/OpenBMB/ToolBench) | Tool-use tasks with execution feedback | Track tool coverage; separate tool success from task success |
| 19 | [Generative Agents](https://github.com/joonspk-research/generative_agents) | Memory stream, retrieval, reflection, planning | Preserve raw observations separately from summaries and hypotheses |
| 20 | [Voyager / MineDojo](https://github.com/MineDojo/Voyager) | Skill library grows from execution feedback | Promote skills only after replay/regression checks |
| 21 | [Letta](https://github.com/letta-ai/letta) | Persistent agent state and explicit memory management | Make memory inspectable, scoped, exportable, and removable |
| 22 | [LangGraph](https://github.com/langchain-ai/langgraph) | Durable graph execution, checkpoints, interrupts, human approval | Represent Layer-0 gates as explicit transitions |
| 23 | [Microsoft AutoGen](https://github.com/microsoft/autogen) | Agent conversations and event-driven runtime patterns | Use event interoperability; authorization remains outside messages |
| 24 | [CrewAI](https://github.com/crewAIInc/crewAI) | Role/task orchestration with flows and observability | Use explicit task ownership and visible progress |
| 25 | [OpenHands](https://github.com/All-Hands-AI/OpenHands) | Sandboxed software-development agent runtime | Isolate untrusted code/tool work and retain artifacts |
| 26 | [SWE-agent](https://github.com/SWE-agent/SWE-agent) | Agent interface design affects task performance | Benchmark harness interfaces, not just models |
| 27 | [BrowserGym / ServiceNow](https://github.com/ServiceNow/BrowserGym) | Reusable browser tasks and common evaluation | Dogfood Council OS screens with repeatable user journeys |
| 28 | [WorkArena / ServiceNow](https://github.com/ServiceNow/WorkArena) | Enterprise work decomposed into atomic and compositional tasks | Test dashboard actions as atomic tasks, then joined workflows |
| 29 | [Inspect AI / UK AISI](https://github.com/UKGovernmentBEIS/inspect_ai) | Tasks, solvers, scorers, logs, reproducible evaluation | Export replay cases without changing GSPC authority |
| 30 | [Beagle / Salesforce AI Research](https://github.com/SalesforceAIResearch/Beagle) | Search harness changes with verifier-backed tasks and regression guards | Optimize harness components, not free-form model personalities |

## What we should build

Mi-Oak should be the evidence-aware learning and routing component inside Harness X. It should not become a second benchmark authority or an unrestricted self-modifying agent.

1. Observe each run’s task class, exact versions/config, input/output digests, cost, latency, task outcome, and evidence references.
2. Normalize runs to a shared case ID so harnesses face the same task.
3. Keep run records and corrections immutable; summaries link to records and never replace them.
4. Propose versioned routing, skill, or prompt changes from paired outcomes.
5. Challenge candidates against an untouched holdout and negative controls; retain abstentions and regressions.
6. Require a human to promote a candidate; keep rollback and lineage.
7. Re-measure after promotion and emit a correction when a claim fails.
8. Publish only reviewed, privacy-cleared, provenance-complete evidence. Simulation, candidate proposals, signed bytes, admitted measurements, and external acceptance remain distinct states.

Borrow the loop mechanics, not another swarm: versioned environments → observable actions → outcome-grounded scoring → replay → guarded candidate changes. MiroFish/OASIS is for scenario exploration; EvoAgentX/EvoMaster/Beagle for candidate improvement; AgentScope/LangGraph for runtime state and interruption; AgentBench/AgentGym/WorkArena/Inspect for measurement. None supplies GSPC claim-maintenance, corrections, evidence admission, signatures, and public readback boundaries.

## Work completed in this checkout

- Added condor/scripts/mioak_learning_gate.py, a deterministic review-only paired comparison gate.
- Wired it into condor/scripts/gspc_learning_miner.py as routing_review.
- Added focused tests. **12 passed**, including existing learning-miner tests.
- Ran the integrated miner in memory over **4,507 recorded harness runs**. Five task-class reviews resulted; each had one matched case and was correctly marked INSUFFICIENT_EVIDENCE. No route was promoted; the shared run ledger and generated status files were not rewritten.
- Gate: at least 30 paired outcomes, mean quality gain ≥0.05, deterministic bootstrap 95% lower bound >0, and no average latency or cost regression. It cannot create a GSPC measurement or alter routing.

## RunPod / release status

**Not installed or run on the RunPod mill.** The 28 September RunPod control-plane read from M4 showed two active CPU pods (csoai-lanes-cpu8-20260928 and csoai-build-cpu-20260928); mill fpowppss5ngtkw was absent. The ordinary shell path could not resolve RunPod or SSH hostnames. I did not start, resize, reset, or redirect work to a different pod. The code is locally implemented and tested; the operational RunPod loop remains a deployment gate.

Next release steps: restore the mill’s established connection without changing its state; copy only the two focused code files through the existing source path; run the miner in memory/read-only first; confirm routing_review on the pod; then install through its normal reviewed release path. Require a dated pod receipt, exact file hashes, test output, and fresh state readback before describing it as operational.
