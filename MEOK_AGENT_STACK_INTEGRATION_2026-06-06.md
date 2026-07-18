# MEOK Agent-Stack Integration — from compass_agent_stack_2026-06-06
*Honest "what's done / done-now / planned" against the bleeding-edge agent-stack research. "100% dragon" = the truth, sequenced — not a claim that a multi-week, dep-heavy stack got installed in one turn.*

## ✅ Already integrated THIS SESSION (the artifact's recommendations we'd pre-built)
| Artifact recommendation | Our implementation | Status |
|---|---|---|
| Morris-II defense (classifier between RAG ingest + shared store; the #1 risk) | `security/worm_guard.py` — W1/W2a/W4 wired log-only, Mac+VM | ✅ LIVE |
| Multi-agent orchestration (Queen/worker, reviewer-gate) | `multi_agent/swarm_coordinator.py` + swarm_orchestrate/swarm_review tools | ✅ LIVE |
| Verifiable agent trail / provenance | SIGIL Ed25519 (`sigil_bus.py` + `sigil_ed25519.py`) — externally verifiable, Mac+VM | ✅ LIVE |
| Skill-library hygiene (Curator pattern) | `multi_agent/curator.py` + curate_skills; deduped 1264→288 | ✅ LIVE |
| MCP as universal tool protocol (200+ tools = asset) | 115 live tools, 12 flagships in the registry, ~600 CSOAI-ORG servers listed | ✅ LIVE |
| Tool-call reliability | `tool_ops.py` schema-validate + auto-repair | ✅ LIVE |

## ✅ Built + tested NOW (this turn)
- **autoresearch self-improvement loop** → `multi_agent/sov3_autoresearch.py` (6/6 self-test). Karpathy pattern, **no GPU**: one scorable target · fixed budget · propose→score→keep-on-improve/reset · **every accepted step SIGIL-signed** (verifiable self-improvement provenance) · **every candidate worm-guard-scanned before acceptance** (a self-improving loop can NEVER evolve toward a Morris-II payload — the exact line the artifact draws) · **refuses untrusted runs**. Programmatic harness (inject score_fn + propose_fn); used by SOV3 internally, not an MCP tool.

## 📋 PLANNED — needs pip installs / infra (honestly NOT "done", sequenced)
These are the artifact's high-value libs; none are installed (verified). They need deps (+ a graph DB for Graphiti) + eval sets, so they're real builds — do in a **separate venv** to protect the live SOV3, not blasted into it.
| Move | Lib(s) | Why | Effort | Note |
|---|---|---|---|---|
| **GEPA-optimise the top SOV3 prompts** | `dspy` + `gepa` (MIT) | artifact's "highest-ROI"; +10% aggregate over GRPO, needs ~10 examples/20-100 evals | M | needs a scorable eval set first (build the MEOK Article-50 eval set) |
| **Regulatory Knowledge Base** (MEOK/CSOAI product) | `iText2KG` → `Graphiti` (Apache, MCP server) → `LightRAG` (MIT, Ollama-bound) | index EU AI Act + ISO 42001 + NIST RMF → queryable, cited, temporal | L | Graphiti needs FalkorDB/Neo4j; LightRAG is Ollama-friendly. This is a sellable product. |
| **Stateful user/project memory** | `mem0` (Apache) | "remember the user/project" — 91%+ LoCoMo, token-efficient | M | complements (not replaces) #75 pgvector; vendor benchmarks = treat with caution |
| **Temporal memory for compliance** ("what was true on date X") | `Graphiti` bi-temporal KG | audit-correct memory for Article-50 evidence | M | same FalkorDB dependency as the KB |
| autoresearch → real target | (our harness) + an eval set | port the tested loop onto retrieval-F1 on the MEOK eval set | M | harness done ✅; needs the eval set |

## 🔭 STUDY / do-not-run (the artifact agrees)
- **SEAL / Darwin Gödel Machine / ADAS** — self-modifying-code research; **run only in a hard-walled VM, no prod creds** (executes untrusted model-generated code). The artifact + our worm_guard both draw this line.
- **karpathy/autoresearch upstream** — NVIDIA-only; we took the pattern (done), not the code.

## Sequenced adoption (mirrors the artifact's cadence)
- **This week:** ✅ Morris-II/worm_guard, swarm, SIGIL, autoresearch loop (DONE). NEXT: build the **MEOK Article-50 eval set** (the prerequisite for GEPA + the autoresearch real-target).
- **This month:** DSPy+GEPA pass on the top 5 prompts (after the eval set); stand up LightRAG+iText2KG (Ollama) → the Regulatory KB MVP.
- **This quarter:** Graphiti temporal memory (FalkorDB) + Mem0 user memory; ship the **MEOK Regulatory KB** as a paid query product; the autoresearch loop on a live SOV3 metric.

## The honest "100% dragon" line
The *self-improving + provenance + safety* core the artifact centers on is **built, live, and tested** (worm_guard + swarm + Ed25519-SIGIL + autoresearch). The *memory/RAG/optimiser* libs are real, verified, and **sequenced** — they need installs + an eval set, so we do them deliberately (separate venv, eval-set-first) rather than destabilise the live SOV3 by bulk-installing a heavy stack mid-flight.
