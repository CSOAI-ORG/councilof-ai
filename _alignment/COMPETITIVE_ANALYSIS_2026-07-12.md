# 🔭 Competitive analysis + improvement opportunities — MEOK / SOV33 (2026-07-12)
_KNOWLEDGE-BASED (training cutoff ~Jan 2026), NOT fresh-web-verified — the deep-research WebSearch fan-out
hit its weekly quota (resets Jul 13 21:00). Re-run `deep-research` after reset to add live citations.
Flagged claims below with ⚠ where currency matters most._

## The map — who's adjacent, what they do better, what MEOK should do

### (a) Local-first / on-device AI — **integrate, don't compete**
- **Ollama** — the de-facto local runtime. **Adopt:** MEOK already calls it; lean in — position as "the governed layer *over* your Ollama models." The baseline finding (below) proves that value.
- **LM Studio / Jan / GPT4All / Msty** — polished local-model UX + catalogs. Better than MEOK at raw local-model management.
- **MEOK wedge:** none of them have a *character*, *cross-platform portability*, or a *governance gate*. "Runs locally" is table stakes; MEOK's differentiator is governance + character + everywhere.

### (b) AI companions / persistent character / memory — **MEOK's closest emotional competitor**
- **Character.AI** — scale + persona depth, but cloud, repeated **minor-safety scandals**, no portability. **Contrast, don't copy** — MEOK's care-floor is the anti-Character.AI.
- **Replika / Nomi / Kindroid** — companions; Nomi/Kindroid lean *uncensored*. MEOK's governed care-floor is the **opposite, defensible** positioning (safe companion).
- **Inflection/Pi** — great EQ, but ⚠ effectively wound down after the Microsoft acqui-hire; Pi is a cautionary tale (EQ without a moat).
- **MemGPT / Letta** — the serious **memory architecture** (tiered/self-editing memory). **ADOPT their patterns** for MEOK's signed memory — it's the most credible memory design in the space.
- **MEOK wedge:** portable + signed + on-device + governed memory bonded to one user. Nobody else is cross-platform-bonded.

### (c) Portable-agent / MCP / cross-platform — **MEOK's core bet, validated**
- **Claude MCP ecosystem** — the emerging standard; MEOK rides it correctly.
- **OpenAI GPTs/Actions** — walled to ChatGPT (not portable). **Raycast AI** — excellent desktop UX + extension model (**steal the extension UX** for the MCP-card catalog). **Perplexity / Poe** — answer engine / multi-bot, not character-portable.
- **MEOK wedge:** the *character + signed memory* riding MCP, not just tools. That's genuinely uncontested.

### (d) Multi-model routers / councils — **honest: routing is commoditized**
- **OpenRouter** — dominant router (one API, many models). **Martian** — cost/quality routing. **Poe** — multi-bot chat. **Mixture-of-Agents** — the research pattern MEOK's "council" implements.
- **Honest flag:** MEOK's Council is *not novel routing* — OpenRouter/Poe do fan-out. **Adopt:** offer OpenRouter as a council backend (more models, less key-juggling). MEOK's only real wedge here = the **synthesis + care-floor**, and it should say so plainly.

### (e) AI governance / guardrails / eval — **the crowded, funded battleground**
- **NeMo Guardrails** (NVIDIA), **Guardrails AI**, **Lakera** (prompt-injection/security), **Credo AI** (governance/compliance), **Vijil** (agent trust), **Giskard** (LLM red-team/testing), **Robust Intelligence** (⚠ acquired by Cisco).
- These have **real external red-teams** — MEOK's self-authored "1.00" **gets picked apart here** (the governance page already caveats this; good). **ADOPT:** run an **external red-team suite (garak / Giskard)** against the gate and publish *their* number next to ours — that closes the single biggest credibility gap.
- **MEOK wedge:** *signed/attested + on-device + reproducible-published* governance vs their black-box SaaS. And the **baseline finding** (gate makes an unsafe open model safe) is a demo none of them lead with.

### (f) AI-OS / agent-desktop / hardware — **their failures validate MEOK's software approach**
- **Rabbit R1** (panned), **Humane Pin** (⚠ discontinued, HP acqui-hired), **Rewind/Limitless** (memory pendant), **Pi** (wound down). **DON'T build hardware** — the graveyard is clear. MEOK's software-overlay + MCP-everywhere is the validated path.

## Top concrete improvements to build (ranked)
1. **External red-team the gate (garak/Giskard)** → publish their confusion matrix beside ours. Kills the "self-graded" objection. *Highest credibility ROI.*
2. **Prompt-injection filter on `/api/orchestrate` + the embed loop** (Lakera's space) — the agentic PDCA loop is injection-exposed; add a filter before actions.
3. **Adopt Letta/MemGPT tiered-memory patterns** for the signed memory (self-editing, summarization) — most credible memory design.
4. **OpenRouter as a Council backend** — more models, one key, honest about routing.
5. **Lead the "governed layer over YOUR local models" story** — the baseline finding proves it; it's a wedge no guardrail vendor or companion owns.
6. **Raycast-style extension UX** for the 378-tool MCP catalog in the Workspace.

## Where MEOK gets picked apart (fix before big launch)
- ⚠ The **self-authored "1.00"** — mitigated by the external red-team (#1).
- ⚠ **Council ≠ novel** — say so; lead with synthesis+governance, not "routing."
- ⚠ **Capability unproven** — the Kaggle number (pending) is the honest gate.
- ⚠ **Mystical framing** ("13-queen council", "Sephiroth") reads as hype to technical evaluators — the **measured** framing (topology/governance pages) is far stronger; keep the mysticism out of the technical surfaces.

## The honest one-line positioning MEOK can own
**"The governed sovereign layer that makes any model — including your own local, open ones — safe, remembered, and portable across every AI you use."** Proven (baseline finding), portable (MCP everywhere), signed (verify page). That's the wedge no single competitor holds.
