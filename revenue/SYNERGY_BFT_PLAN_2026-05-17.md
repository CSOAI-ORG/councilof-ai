# Synergy Plan: Claude + Step 3.5 + Hermes + SOV3 BFT + Vast → 100/100

## What you already have running (verified just now)

| Layer | What | Status | Endpoint |
|---|---|---|---|
| **SOV3 brain** | gunicorn × 2 workers, 110+ MCP tools, neural nets loaded | ✅ healthy | `localhost:3101/mcp` + `sovereign.templeman-opticians.com/mcp` |
| **33-node BFT council** | `submit_council_proposal` + `vote_on_proposal` MCP tools live | ✅ exposed | call via sov3 MCP |
| **132 expertise nodes** (11 domains) | inside SOV3 | ✅ | feeds council votes |
| **55 bridge nodes** | inside SOV3 | ✅ | cross-domain reasoning |
| **Liquid-NN + KAN router + QAOA Quantum council** | `liquid_kan_council.py` | ✅ | adapts routing |
| **Hermes** | 4 cron shifts + WhatsApp bridge + gateway | ✅ running | LaunchAgent `ai.hermes.gateway` |
| **OpenClaw node** | Claude-compatible executor | ✅ running | LaunchAgent `ai.openclaw.node` |
| **Ollama** | gemma4 model | ✅ | `localhost:11434` |
| **n8n** | 6 workflows imported (Stripe welcome etc.) | ✅ running | `localhost:5678` |
| **Postgres** | sovereign_memory DB | ✅ | `localhost:5432` |
| **Redis** | cache | ✅ | `localhost:6379` |
| **Cloudflare tunnel** | exposes SOV3 publicly | ✅ | `sovereign.templeman-opticians.com` |
| **Vast.ai GPU** | RTX 4070S × 11GB, $0.083/hr ($60/mo) | ✅ running 663hr | `ssh2.vast.ai:10794` — running **MuJoCo robotics**, NOT LLM |
| **StepFun 阶跃AI** | desktop app + StepClaw agent, OpenAI-compatible API | ⚠ needs login | `api.stepfun.com/v1/chat/completions` model `step-3.5-flash` |

This is already a **rich autonomous substrate**. The work is connecting it, not building it.

---

## The synergy design — 4 layers, BFT-enforced

### Layer 1 — External LLMs as "council voices"

Today the 33-node council votes internally. Add **4 external LLM voices** as registered agents (37 nodes total, BFT quorum = 25):

| Voice | Role | Cost | Latency |
|---|---|---|---|
| **Claude Opus** (via Anthropic API) | Architectural / long-context review | $$ | 3-8s |
| **Step 3.5 Flash** | High-speed sanity check + Chinese-market POV | $ | 0.5-2s |
| **Ollama gemma4** (local) | Free fast vote, privacy-preserving | free | 0.3s |
| **Anthropic Haiku** | Fast cheap diversity vote | ¢ | 0.5s |

Each LLM gets a prompt like:
> *"Proposal: <description>. Should we approve? Reply JSON: `{vote: approve|reject|abstain, reasoning: ..., confidence: 0-1}`"*

Their votes go into the same BFT consensus algorithm via the existing `cast_vote` tool. **Byzantine fault tolerance survives up to 12 malicious / mistaken votes out of 37.**

### Layer 2 — Audit loop ("did Claude do the work correctly?")

Every meaningful action I (Claude) take auto-submits a proposal:

```
submit_council_proposal(
  title="Claude shipped care-home-cqc-mcp + Stripe £29 + landing page",
  description="<full diff + verification steps + Stripe IDs>",
  proposed_by="claude-opus",
  action_type="ship_mcp",
  action_params={"slug": "care-home-cqc", "stripe_product": "prod_UX0YDEYlxTIxHT"}
)
```

The 4 external LLMs + 33 internal nodes vote. If <25 approve, the action is flagged for review (or auto-reverted). **This is the "vote audit if work is done correctly" you asked for.**

### Layer 3 — MoE swarm with KAN routing

The existing `liquid_kan_council.py` already has a KAN router. Extend it to route queries to a pool of "domain experts":

- Compliance queries → eu-ai-act-compliance-mcp + uk-ai-bill-compliance-mcp expertise
- Care queries → care-home-cqc-mcp + care_validation_nn
- Code queries → openclaw-node + claw_code_adapter
- Strategy queries → Step 3.5 Flash (fast) + Claude Opus (deep)

KAN learns the **shape** of which queries route best to which expert. Outputs blend in council vote.

### Layer 4 — Deep research / reverse engineering cron

A new Hermes shift (every 6h):

```bash
hermes-research-shift.sh:
  1. Pick top unresolved revenue question from queue
  2. Dispatch in parallel to: 
     - Claude with web search
     - Step 3.5 Flash with their browsing
     - Ollama + curl scraping (privacy path)
     - GitHub code search for reverse-engineering patterns
  3. Aggregate into a synthesis memo
  4. Submit memo as council proposal
  5. On approval → write code, ship via openclaw, deploy
```

---

## What this needs from you (3 keys, 3 minutes)

1. **StepFun API key** — Sign up at `platform.stepfun.com` → API Keys → New. Paste it back to me and I'll wire it as the first external council voice within 10 minutes. (Or skip — we already have Claude + Ollama + Haiku.)

2. **Anthropic API key** for the council-vote Claude (separate from the Claude Code session running this conversation — needs its own key so council Claude votes independently). One-line `ANTHROPIC_API_KEY=sk-ant-...` either in env or `~/.zshrc`.

3. **Confirm OK to keep Vast running as robotics** (currently MuJoCo at $60/mo). If you'd rather it run LLM inference for the council instead, I'll re-deploy it with vLLM + Qwen-7B (free vote, no API cost) — say the word.

---

## MVP I can build right now without any of the keys

Even with zero new keys I can wire **Ollama gemma4 (local) + the 33-node SOV3 council** into a **34-node BFT audit loop** today. Every commit, every Stripe action, every deploy gets voted on by gemma4 plus the 33 nodes. That alone gives you the "did Claude do this right?" check.

After you give me StepFun + Anthropic keys it expands to **37 nodes** with Chinese-market + premium-Claude diversity.

Say the word and I'll start building the `external_council_voice.py` adapter right now.

— Claude, 2026-05-17
