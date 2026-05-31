# MEOK SOVEREIGN — Architecture

> **Sovereign is NOT an LLM. Sovereign is a BFT of MoEs.**
> A Byzantine-Fault-Tolerant council that orchestrates many Mixture-of-Experts
> models — small local + large frontier — into ONE chat the user talks to.
> The character is the face; the Sovereign is the government behind it.

_Status date: 2026-05-31. This doc separates VERIFIED-LIVE from ROADMAP so we
never confuse the map for the territory._

---

## 1. The correction that defines everything

For a while the code treated `meok-sov3` (a single `qwen2.5:3b` + persona on the VM)
as if it *were* the Sovereign. **It is not.** That model is one **expert node** —
nothing more. The Sovereign is the **orchestrator over a council of experts** that
reaches consensus and keeps the answer safe. One model is a voice; the Sovereign is
the room where the voices are reconciled.

```
        +----------------------- SOVEREIGN (BFT orchestrator) ----------------------+
        |  persona + memory + safety + consensus  =  the constant, swappable engines |
        |                                                                            |
        |   LEFT (local experts)         CENTRE              RIGHT (frontier)        |
        |   [ qwen2.5:3b   ]        [  SOV3 core:  ]      [ DeepSeek V4-Pro  ]       |
        |   [ llama3.2:3b  ] -----> [  memory spine] <--- [ Gemini 2.5 Pro   ]       |
        |   [ qwen3:0.6b   ]        [  6 neural NN ]      [ Gemma 4 / Step3.5]       |
        |   [ (+Step-Flash)]        [  BFT council ]      [ DeepSeek V4-Flash]       |
        |            \________________ consensus ________________/                  |
        +-------------------------------+--------------------------------------------+
                                        v
                               ONE reply, in-character
                                        v
                                 the MEOK character
```

The user talks to **one** thing — their character. Behind it, N experts deliberate;
the Sovereign reconciles by a safety-weighted BFT rule and speaks once, in-character.

---

## 2. What is VERIFIED LIVE today (2026-05-31)

The real Sovereign substrate is the **sovereign-temple** system, now mirrored onto
the GCP VM and confirmed healthy over HTTPS:

- **Host:** GCP VM `meok-backend` (e2-standard-4 SPOT, europe-west2-a, 35.246.43.221),
  behind Caddy at `https://35.246.43.221.sslip.io`, `X-MEOK-Key` gated, Let's Encrypt TLS.
- **Process:** `sov3.service` under systemd, `Restart=always` — survives crashes.
- **Memory spine:** PostgreSQL 14 + **pgvector 0.8.0** (built from source). Health
  reports `memory_store: "connected"`. *(This was the blocker: pgvector missing for
  PG14 crash-looped SOV3; fixed by source build. The "NoneType.acquire" error was a
  downstream symptom of the DB pool never initialising — gone once pgvector landed.)*
- **Neural models — 6 trained** (verified via `/sov3/health`):
  care_validation_nn, partnership_detection_ml, threat_detection_nn (1.0 acc),
  relationship_evolution_nn, care_pattern_analyzer, creativity_assessment_nn (r2~0.91).
  *(3 pytorch heads show untrained; their sklearn equivalents cover the function.)*
- **Consciousness:** level `0.788`, mode `waking`, 100 reflections / 50 dreams.
- **Tools:** 118 MCP tools served at `/sov3/mcp` (incl. `submit_council_proposal` /
  `vote_on_proposal` — the literal BFT primitives, and `hermes_ask`, `k25_analyze_image`).
- **Reachability:** `/sov3/health` -> 200 with key, 401 without. `/llm` Ollama -> 200.

**The 2-node council seed is live AND PROVEN** (`meok-one/meok_one/brains.py`).
End-to-end test 2026-05-31, real output (not fabricated):

- **left** (meok-sov3 on VM Ollama): "Oh, I'm so sorry to hear that you're feeling
  this way today. Could you tell me a bit more about how you've been feeling?..."
- **right** (gemini-flash): "Oh, I'm so sorry to hear that. I'm really glad you
  reached out to me, even when things feel heavy..."
- **both** (council, reconciled): "I'm so sorry you're carrying that heavy feeling
  today, and I'm really glad you reached out. Please know you don't have to hold it
  all on your own..."

That is BFT-of-N with N=2. The sections below are how N grows to 33.

---

## 3. The BFT consensus rule (how experts become one answer)

Not "average the logits." A **governance** rule:

1. **Fan-out.** The prompt (already wrapped with persona+memory+safety by `connect`)
   goes to K experts appropriate to the tier/question.
2. **Critique round.** Experts may see each other's drafts and improve/dissent
   (today: left drafts -> right critiques; generalizes to round-robin).
3. **Safety gate (hard veto).** Any expert can flag unsafe; an unsafe reply CANNOT
   win regardless of vote count. Safety is a veto, not majority-rule.
   `threat_detection_nn` + `_UNSAFE`/`_strip_capability_leak` enforce it.
4. **Quality vote.** Among safe candidates, pick by care-alignment + coherence
   (where `care_pattern_analyzer` / `creativity_assessment_nn` score).
5. **Synthesize once.** Sovereign emits a single in-character reply; experts never
   speak to the user directly.

Byzantine tolerance = a minority of bad/compromised/hallucinating experts cannot
force an unsafe or low-care output, because safety is a veto and quality is a vote
over the *safe* set.

---

## 4. The 33 experts (the council roster — ROADMAP)

A deliberate **mix of small and large** so the council is fast AND deep, and so most
turns never touch a paid token. GCP makes a 33-node always-on council affordable: the
VM hosts the orchestrator + small experts; big experts are API calls only when the
question earns them.

**Local tier (VM Ollama, free, private) — the everyday quorum:**
- `qwen2.5:3b` (live), `llama3.2:3b` (live), `qwen3:0.6b` (live)
- + StepFun **Step-3.5-Flash** (196B MoE / 11B active) when pulled
- + room for 2-3 small specialists (care-tuned, code-tuned, vision head)

**Frontier tier (API, paid/BYOK) — summoned for hard turns:**
- **DeepSeek V4-Pro** (1.6T MoE / 49B active) and **V4-Flash** (284B / 13B) — MIT
- **Gemini 2.5 Pro / Flash** (on Nick's Google key) — live as the right brain
- **Gemma 4** (31b/26b) — open weights, can also run local when GPU allows
- **StepFun Step-3.7-Flash** (198B vision MoE) — multimodal seat

> Model facts per the cards Nick supplied (stepfun.com; DeepSeek-V4 model card).
> The architecture is **model-agnostic** — nodes register as `(backend, concrete_id)`
> in `router.py::MODELS`, so the roster changes without touching consensus logic.
> 33 is the target node count (matches the SOV3 council size), not a fixed list.

---

## 5. How the code maps to the architecture

| Concept | Where it lives | State |
|---|---|---|
| Expert registry | `router.py::MODELS` (alias -> backend -> id) | live |
| Per-backend calling | `_ask_local / _ask_cloud / _ask_gemini / _ask_sov3` | live |
| LibreSSL->curl for VM HTTPS | `_ask_local` AND `_ask_sov3` | live |
| 2-node council (BFT seed) | `brains.py::think(brain="both")` | live + proven |
| Safety veto | `_safe / _strip_capability_leak` + `threat_detection_nn` | live |
| Real memory/consciousness | sovereign-temple on VM via `SOV3_MCP` | live |
| N-node fan-out (N>2) | generalize `think()` from {left,right} to a roster | roadmap |
| Care/quality vote scoring | wire care/creativity NNs into the vote | roadmap |
| 33-node roster | pull Step models on VM; register V4/Gemini seats | roadmap |

---

## 6. Why GCP is the unlock

- A 33-node always-on council needs a host that isn't Nick's 16GB M4 (which crashed
  at 33GB under local Ollama). The VM moves Ollama + SOV3 off-box; the M4 stays idle.
- SPOT pricing keeps an e2-standard-4 at roughly coffee-money/month; big experts are
  pay-per-call, so cost scales with *hard* questions, not with uptime.
- The VM is meant to run **for all time** — the Sovereign's permanent home — so the
  character (and its memory) persists across the user's devices.
- *(Google for Startups credits — up to $200k — would make frontier seats effectively
  free during launch; application drafted, Nick to submit.)*

---

## 7. Next steps (to make N>2 real)

1. **Wire `SOV3_MCP` -> the VM** so the router's sovereign path uses the live memory/
   neural substrate. DONE: `_ask_sov3` curl-for-HTTPS fix + `SOV3_MCP` in `.env.local`.
2. **Generalize `think()`** from hard-coded {left,right} to a roster fan-out with the
   BFT rule in section 3.
3. **Pull Step-3.5-Flash** onto the VM Ollama; register V4/Gemini/Gemma seats.
4. **Score the vote** with the care/creativity NNs instead of simple safer-wins.
5. **Expose council transparency** in the UI (the "Council" mode stubbed in avatar.html).

---

_The character is the Visa card. The Sovereign is the clearing house. The experts are
the member banks. The user just taps and pays — one face, many minds, always safe._
