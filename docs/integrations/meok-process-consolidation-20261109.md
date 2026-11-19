# MEOK process consolidation: research and acceptance plan

Date: 9 November 2026. Status: research and source candidate. This document
neither establishes a completed product nor changes production authority.

## Working backwards from useful outcomes

The proposed core unit is a task with an explicit acceptance test, not an agent
message. The target sequence is observation -> state revision -> bounded plan
or rehearsal -> authorised execution -> independently checked result -> retained
experience -> controlled improvement -> held-out comparison. Reuse the existing
canonical evidence-event and authority-effect contracts. Keep observed,
reported, inferred, simulated, approved and executed states distinct.

The immediate dependency is a connection, not another foundation model: the
existing private MEOK worker has a Gradio API; the existing Council bridge has
MCP tools and a separate chat-completions provider contract. `hf-situation.mjs`
adds an opt-in single-situation adapter without altering either live runtime or
introducing another ledger. Source tests do not establish live acceptance.

## Existing assets to consolidate

- The current bridge's read-only evidence reader, bounded provider and stdio
  transport can carry a qualified worker without replacing the coordinator.
- The existing private worker already reuses reaction, compact-record, outcome
  and review modules. Temporary session state is not durable training memory.
- `packages/world-rehearsal` on the existing PR #4107 candidate has deterministic
  scenarios, replay, comparisons and canonical evidence export. It is not a
  learned environment or deployed production service. Preserve that lane and
  exact source/fixture pins when developing an environment adapter.
- GSPC's authoritative grader remains
  `harness/gspc-top100/mill_hub_queue.py::read_label()`, with its existing runnable
  harness. Do not call a new overlap score or these transport fixtures GSPC.

## Protocols have different jobs

| Interface | Proposed role | What it does not provide |
|---|---|---|
| MCP | Typed access to tools and evidence/resources | Correctness, identity or automatic permission to execute |
| A2A | Delegate a bounded task to another independently operated agent and receive task/artifact states | Shared memory, reliable execution or a common model |
| AG-UI | Stream agent activity/state to the end-user interface | Authority to execute or train |
| A2UI | Describe UI components as data | Arbitrary trusted code or an approval decision |
| MCP Apps | Present a tool's interactive view in a compatible host | A new source of truth separate from the backing evidence |
| OpenAPI/Arazzo | Declare known API journeys, dependencies, checks and error handling | A learned policy or permission to submit paid jobs |

AX is often used for agent experience, a design concern rather than one extra
required wire protocol. Version-pin each protocol and test its actual host;
passing this existing stdio bridge's tests does not establish conformance to a
newer MCP protocol version. Do not add every protocol where an ordinary function
call already suffices.

Primary references: [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture),
[A2A specification](https://a2a-protocol.org/latest/specification/),
[A2UI ecosystem](https://a2ui.org/introduction/agent-ui-ecosystem/),
[Arazzo](https://spec.openapis.org/arazzo/latest.html).

## Reuse opportunities with high expected leverage

**Gradio Workflow** already represents Spaces, models, datasets and Python
functions on a typed visual canvas and saves topology as JSON. Qualify a view
or workflow export instead of designing another graph editor. It is a top-level
app, not a component that can simply be nested inside the existing Blocks app.
Its UI can run same-depth nodes concurrently while generated API execution is
currently sequential: UI appearance is not throughput evidence.
[Official Workflow guide](https://gradio.app/guides/workflows).

**Spaces-as-MCP** can expose qualified Gradio functions as tools. Do not enable
all methods or publish private data merely to obtain a discovery badge. A
bucket stores artifacts; a process reads and verifies them through controlled
access. Bucket files are mutable and need retained hashes/versioned releases.
[Spaces MCP](https://huggingface.co/docs/hub/spaces-mcp-servers),
[buckets](https://huggingface.co/docs/hub/storage-buckets).

**OpenEnv** offers reset/step/state environments and a tool interface. A small
adapter over existing deterministic rehearsals can give agents a repeatable
place to learn before physical worlds are introduced. Separate the evaluator's
reset, reward and fixture access from the agent's available actions. Containers
still require a qualified isolation and access policy.
[OpenEnv](https://github.com/openenv/OpenEnv).

**NVIDIA NeMo Agent Toolkit** supplies framework integrations, A2A interfaces,
profiling and evaluation capabilities. Reuse bounded profiling or interoperability
components; do not replace existing MEOK controls just to adopt an entire stack.
[NeMo Agent Toolkit](https://github.com/NVIDIA/NeMo-Agent-Toolkit).

**DSPy/GEPA** can optimise prompts or workflow instructions against feedback;
that is a cheap comparison candidate before changing weights. **Agent Lightning**
separates agent execution traces from training. Neither makes collected logs
correct or grants training rights. The existing runtime, comparator and
accepted examples must be qualified before an optimiser consumes them.
[DSPy](https://dspy.ai/learn/optimization/optimizers/),
[Agent Lightning](https://microsoft.github.io/agent-lightning/latest/).

## A model of processes, rather than a model of network protocols

Proposed representation: a typed capability/workflow graph with exact source,
model and dataset revisions; measured outcomes, runtime/cost observations;
state transitions; required authority; failure and recovery semantics; and
expiry/dependency information. For a repeated task, deterministic replay of a
qualified workflow can replace unnecessary model planning. A learned router may
later choose among workflows using actual outcomes. It must not infer tool
permission from the existence of an edge in that graph.

Start with logical hives using existing processes: observation/state,
reasoning/rehearsal, execution/verification, and learning/evaluation. These are
roles, not a requirement to rent four clusters. Select a small number of
complementary model workers and escalate only where a task needs them. Neither
agreement nor repeated outputs from related models establish independence.

## Compact visual memory and world-model hypothesis

Treat the existing 3 KiB record as a bounded index/manifest pointing to the
larger evidence, not lossless compression of unlimited history. Preserve exact
source objects, hashes, time, dependencies and correction history in an
appropriate persistent backend. Render views from that state: timeline, graph,
scene or globe. Never reconstruct canonical evidence from a screenshot.

For situational awareness, the proposed state view needs entities, relations,
latest observations, uncertainty, freshness, active tasks, permitted actions and
competing hypotheses. A world-model candidate should predict what observations
will change after an action. Retain a prediction before the action, then compare
it with a separate observation. Sixteen scripted branches alone do not prove
sixteen plausible futures or a learned transition model.

Reuse the existing globe/timeline first. Godot is a possible MIT-licensed
renderer; Unreal provides source access under its own licence, not an MIT-style
open-source foundation. A Linux VM/container is an execution environment, not a
reasoning model. Use a headless environment before adding expensive rendering.
[Godot licence](https://docs.godotengine.org/en/stable/about/complying_with_licenses.html),
[Unreal source access](https://www.unrealengine.com/ue-on-github),
[MuJoCo](https://github.com/google-deepmind/mujoco).

## Improvement experiment, not a claim of emergence

Freeze a development set and a genuinely separate evaluation set. Compare the
same tasks under fixed data access, authority and resource limits:

A. Existing model/worker alone.
B. A plus deterministic acceptance checks.
C. B plus relevant verified memory.
D. C plus task-aware model/workflow routing.
E. D plus bounded simulation or counterfactual rehearsal.

Track end-to-end verified success, unsupported claims, cost per accepted result,
latency, duplicate effects, stale-memory errors, and performance on held-out task
families. Run multiple seeds for stochastic components, preserve failures and
report denominators. Ablations locate useful contributions; more nodes,
messages, tokens or self-payments do not demonstrate improvement.

Only export authorised, deduplicated outcome-backed examples. Keep synthetic
hypotheses, independently checked targets and user reports in separate fields.
Do not copy evaluation questions into training. Paid-model outputs require
source/provider-rights checks. Train compatible adapters against a pinned base,
compare with the unchanged base, then promote or reject with rollback.

## Quantum, photonics and representation experiments

PennyLane is a suitable optional small quantum/hybrid research lane, not a
replacement for CUDA inference. Compare tiny routing/scheduling or feature-map
problems against strong classical baselines with the same complete resource
budget; include data preparation, shots/noise and wall-clock time. State-vector
simulation memory grows exponentially with qubits. Do not claim a speedup from
having used a quantum API.
[PennyLane Lightning](https://github.com/PennyLaneAI/pennylane-lightning),
[quantum/classical benchmark suite](https://github.com/XanaduAI/qml-benchmarks).

Keep three separate ideas: visual representation of experience, optical
hardware/interconnects, and quantum computing. Co-packaged optics is not an
agent architecture. GDSFactory and Meep offer a separate optical-design and
electromagnetic-simulation path; a software model call is not a physical
photonic measurement.
[GDSFactory](https://github.com/gdsfactory/gdsfactory),
[Meep](https://meep.readthedocs.io/en/latest/Introduction/),
[NVIDIA silicon photonics](https://www.nvidia.com/en-us/networking/products/silicon-photonics/).

## Activation remains separate

The current adapter is opt-in, text-only, single-turn and source-pinned. It
requires a passing live roundtrip after the raw-output correction before
installation. The observed model judgement failure remains a task-quality
regression. Persistent storage capacity, write/read/hash proof, tenant/session
isolation and verified training export remain separate acceptance work.
No production merge, new paid GPU, trained checkpoint, worldwide coverage or
commercial outcome is established by this research/source change.
