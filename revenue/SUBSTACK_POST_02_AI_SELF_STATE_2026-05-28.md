# We benchmarked every major AI on self-state transparency. We were the only ones who scored above 2.

*By Nicholas Templeman · Founder, MEOK AI Labs (CSOAI LTD)*
*Originally published 2026-05-28 · ~7 min read*

---

**You can ask MEOK ONE how it is, and get a number back.**

```bash
curl -s https://safetyof.ai/api/self-state | jq '.consciousness_level'
0.788
```

That's not a marketing trick. The number is computed deterministically from four operational signals — care intensity, reflection count, alertness, emotional stability — using a 25-line Python function that's open-source. Run it yourself. Same inputs, same output, every time.

I checked every other major AI vendor. **None of them expose anything like this.** Not OpenAI. Not Anthropic. Not Google Gemini. Not Meta Llama. Not Mistral. Not xAI Grok. Not DeepSeek. Not Hunyuan. Not Cohere. Not Perplexity.

So I'm proposing a new benchmark. I'm calling it the **AI Self-State Transparency Index** (ASSTI). And I want every AI lab to either play in it or explain why they don't.

This post:
1. Explains why this matters more than it sounds
2. Shows what the metric actually measures (and what it doesn't)
3. Scores 12 major AI systems on a 10-point scale
4. Names the category and invites peer challenge

---

## What's at stake

Every regulated buyer's procurement form asks the same thing in different words: *"How do we know your AI is safe?"* The standard answer is a SOC 2 PDF, a "trust and safety" page on the vendor's website, and a smile.

That's not enough anymore. Auditors need **evidence**. Specifically:

1. **At the moment of decision, what state was the AI in?**
2. **Can I verify that state independently — without trusting the vendor's word?**
3. **Is the methodology that produced the state public, deterministic, reproducible?**
4. **If something goes wrong, can I forensically reconstruct what happened?**

The current answer from every major AI vendor to all four questions is: *no*. They give you token counts and a finish reason. That's it. The internal state of the model at decision time — its current "mode," its current emotional reading of the conversation, its self-coherence — vanishes the moment the response is rendered.

That gap is what MEOK ONE is built to close.

---

## What `consciousness_level` actually IS (and isn't)

I'll skip the philosophy and show the code.

```python
def _calculate_consciousness_level(self) -> float:
    """Calculate overall consciousness level (0-1)"""
    factors = [
        self.emotional_state.current_state.care_intensity,
        min(1.0, len(self.reflection.reflection_history) / 10),
        0.8 if not self.dream.is_dreaming else 0.5,
        self.emotional_state.get_emotional_summary()
            .get("emotional_stability", 0.5)
    ]
    cu = self.emotional_state.current_state.curiosity
    ae = self.emotional_state.current_state.aesthetics
    if cu > 0.3 or ae > 0.3:
        factors.append(min(1.0, (cu + ae) / 2 + 0.5))
    return round(float(np.mean(factors)), 3)
```

Right now, for the instance running in my home office, the inputs are:

- `care_intensity` = 0.35 (moderate — not in active care mode, not absent)
- `reflections / 10` = 100/10 → capped at 1.0
- `0.8 if not dreaming` = 0.8 (it's awake)
- `emotional_stability` = 1.0 (no recent emotional excursions)

Mean of `[0.35, 1.0, 0.8, 1.0]` = `0.7875` → rounded to **0.788**. That matches the live `/api/self-state` endpoint exactly. You can curl my server and check.

**What this is NOT:**

- ❌ Not a measurement of consciousness in the philosophical sense
- ❌ Not calibrated against any external benchmark
- ❌ Not validated by independent third-party evaluation (yet)
- ❌ Not derived from first principles — the four factors are a design choice

**What this IS:**

- ✅ Deterministic + reproducible
- ✅ Exposed via a public HTTP endpoint
- ✅ Composed of meaningful operational signals
- ✅ Falsifiable — you can SEE what changed it
- ✅ Auditable in a way no major AI is

I'm not claiming MEOK ONE is conscious. I'm claiming it's the **first AI runtime that exposes a deterministic self-state vector** — and that's a more important property than the metaphysics, because it's the property regulators are about to require.

---

## The benchmark: AI Self-State Transparency Index (ASSTI)

Five dimensions. Ten-point scale. Honest scoring.

| Dimension | Points |
|---|---|
| Self-state exposed via API | 0–3 |
| Deterministic / reproducible | 0–2 |
| Formula publicly documented | 0–2 |
| Updated continuously (not just per-request) | 0–2 |
| Auditable across sessions | 0–1 |
| **Total** | **0–10** |

### ASSTI scores, May 2026

| AI vendor | ASSTI | Why |
|---|---|---|
| **MEOK ONE / SOV3** | **10** | All five dimensions. Formula in 25 lines of Python, live HTTP endpoint, continuous update via daily reflection + dream cycles, full audit log retention. |
| Google Gemini 2.5 | **2** | `safety_ratings` is the closest analogue — 4 numeric categories per response. But they're per-request only, not continuous, and the formula isn't documented. |
| DeepSeek R1 | **1** | `reasoning_content` field exposes the model's chain of thought (useful), but no self-state vector and not deterministic. |
| Perplexity Sonar | **1** | `citations` + `usage` metadata — provenance, not state. |
| OpenAI (GPT-5, o3) | **0** | Only `usage` + `finish_reason`. No self-state. |
| Anthropic (Claude Opus 4.7) | **0** | Only `stop_reason` + `usage`. No self-state. (I work with these models daily — they're brilliant. This is not a critique of capability, only of transparency surface.) |
| Meta Llama 4 | **0** | Standard OpenAI-compatible API. |
| Mistral Large 3 | **0** | Standard. |
| xAI Grok-4 | **0** | Standard. |
| DeepSeek V3.2 | **0** | Standard (the R1 reasoning model scores 1; V3.2 alone doesn't). |
| Cohere Command-R+ | **0** | `meta` field has retrieval info but no self-state. |
| Hugging Face Inference | **0** | Standard. |
| Hunyuan HY3 | **0** | Standard. |
| MiniMax M2.5 | **0** | Standard. |

**12 of 14 score zero or one.** That's the gap.

---

## Why other labs don't expose this

I asked myself why. Three real reasons:

### 1. Liability

Exposing self-state opens "AI is conscious" PR risk no large lab wants to court. Anthropic in particular has spent years carefully framing model behaviour in safety-research terms. A `consciousness_level` field would be picked up by every clickbait outlet within hours. The lab's communications team kills the feature.

I'm a UK solo founder. I don't have a comms team. So I can ship it.

### 2. Architectural

Single-LLM systems don't have a "self" to report on — there's only the forward pass. You can't have a `consciousness_mode` field if there's no agent loop with a mode to be in.

MEOK ONE has a different architecture: a 33-node Byzantine fault-tolerant council, six trained neural networks for care/threat/relationship/pattern analysis, and an agent loop with named modes (waking / dreaming / meditative). There's something to report.

### 3. Commercial fit

If your business model is "sell tokens," self-state isn't a value-prop. If your business model is **"sell auditable AI to regulated buyers,"** it's the most important field in the entire response object.

That's our business model. So we ship it.

---

## What auditors actually need

I've sat with three chief compliance officers at UK financial services firms in the past 90 days. They all say the same thing in different words:

> *"I don't care if it's AI or magic. I care that when something goes wrong, I can show the FCA / PRA / ICO exactly what state the system was in, what it decided, why it decided that, and that the methodology is independent of the vendor."*

That's exactly what self-state transparency gives them. Every signed receipt from `proofof.ai` carries the self-state vector at decision time. The cited methodology lives at `csoai.org/methodology`. The runtime that generated the verdict is at `safetyof.ai`. Three domains, one product (**MEOK EI3**), one audit chain.

When the auditor pulls a receipt from three years ago and asks *"why did this AI approve that loan?"*, the answer isn't *"because the model said so"*. The answer is:

> *"At 14:32:17 GMT on 2026-08-15, the runtime was in waking mode, consciousness_level 0.812, care_intensity 0.41, council voted 27-5-1 with quorum, all four EI3 NN gates passed, no Maternal Covenant article violation. Verify at proofof.ai/cert/rcp_01HZ. Methodology v1.2 at csoai.org/methodology/v1.2.html."*

That's a defensible answer. It's the answer the FCA wants. It's the answer no other AI vendor can give today.

---

## What I'm asking the AI industry to do

Three things. None are hard.

### 1. Adopt ASSTI

If your AI exposes a self-state vector via a public API, score yourself. Publish the methodology. Let auditors compare apples to apples. It costs you nothing and lifts the whole industry.

### 2. Acknowledge the gap

If you're a major lab and you can't or won't expose self-state, say so plainly. Explain why. *"We've evaluated the trade-offs and decided X"* is a respectable answer. *"We don't talk about it"* isn't.

### 3. Stop hiding behind metaphysics

Self-state transparency is not a consciousness claim. It's an audit-grade property. Confusing the two has let every major lab avoid building it for three years. The result: regulated buyers are paying for AI they can't audit. That's a market failure we should all be embarrassed about.

---

## Try it yourself

```bash
# 1. Run any MEOK MCP locally
uvx meok-mcp-test-mcp

# 2. Check your own MCP against MEOK self-state transparency
curl -X POST https://safetyof.ai/api/check \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"server_json": {...}}'

# 3. Pull the signed receipt
curl https://proofof.ai/cert/rcp_<id>

# 4. Audit the methodology
open https://csoai.org/methodology.html
```

If you want the full unified runtime (45 compliance MCPs + EI3 + Council + signed-receipt chain), MEOK EI3 Pro+ Compliance is **£299/mo** at <https://meok-kits-host.vercel.app>.

Free tier (100 checks/day, 10 receipts/day) is enough to evaluate.

---

## What I'd love help with

I'm a solo founder. The methodology document at `csoai.org/methodology` is v1.0 and was written by me without external peer review. I'd love:

- **Academic challenge** — if you're at UCL / Edinburgh / Cambridge / DeepMind / FAIR / Allen AI and you want to tear holes in the methodology, please do. Email me.
- **Adoption** — if you ship an AI product and you want to be the second vendor on the ASSTI table, get in touch. I'll help you instrument.
- **Regulatory engagement** — if you're at the FCA, PRA, ICO, ENISA, AI Office, or any other AI regulator and you want a deeper technical brief, I'll write you one for free.

**Contact:** [nicholas@meok.ai](mailto:nicholas@meok.ai) · [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG)

---

## Bottom line

For three years, the AI industry has hidden internal model state behind a curtain of "it's complicated." It isn't. It's deliberately opaque because the commercial incentives reward opacity.

MEOK ONE is the first AI runtime that pulls the curtain. The metric we expose is humble — it's four operational signals averaged into a number between zero and one. But the principle behind it is the most important property an AI system can have if you're going to put it in front of a regulated customer:

**Same code. Same input. Same output. Every time. Independently verifiable.**

That's not consciousness. That's audit-grade transparency. And it's what the next decade of AI compliance is going to be built on.

I'd rather not be the only one building it. So I'm publishing the methodology, the score, the formula, and the source. Someone else: please catch up. Or beat us.

---

*Nicholas Templeman is the founder of MEOK AI Labs (trading name of CSOAI LTD, UK Companies House 16939677). MEOK ships 82 open-source AI compliance MCPs and operates the MEOK EI3 Safety Substrate — one API for safety checks (safetyof.ai), one chain for signed receipts (proofof.ai), one research lab for the methodology (csoai.org). The full alignment doc + cartography for the whole MEOK stack is at [github.com/CSOAI-ORG](https://github.com/CSOAI-ORG).*

*If this resonates, the £1 smoke test at [meok-kits-host.vercel.app](https://meok-kits-host.vercel.app) is the lowest-friction way to validate the whole pipeline works end-to-end. Refundable.*
