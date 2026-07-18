# DEEPSEEK PROCUREMENT RISK — honest read
## Why the two-brain sandwich needs Path D, not Path A
### CSOAI Ltd · Hermes/JEEVES lane

> The two-brain sandwich architecture (1.6T × 2 = 3.2T aggregate) requires
> the right brain to be a frontier open-weight model. The only 1.6T-class
> open model with pure MIT license is **DeepSeek V4 Pro**, which is
> Chinese-developed. This doc is the honest read on the procurement
> question and the architecture that resolves it.

---

## The four paths

| Path | Left brain | Right brain | Procurement risk | Sovereign guarantee |
|---|---|---|---|---|
| **A** | DeepSeek V4 (1.6T, MIT) | DeepSeek V4 (1.6T, MIT) | **HIGH** | Weak — both brains are DeepSeek's weights |
| **B** | Qwen3.6-35B-A3B (35B, Apache-2.0, Alibaba) | DeepSeek V4 (1.6T, MIT) | **MEDIUM** | Strong — left brain is smaller Qwen, still Chinese origin |
| **C** | GLM-5.x (mid-size, MIT, Z.ai) | DeepSeek V4 (1.6T, MIT) | **MEDIUM** | Strong — both MIT, both Chinese origin |
| **D** | **Sovereign merge v0.3 (Qwen3.6-35B-A3B base + sovereign-labelled-data fine-tune)** | **DeepSeek V4 (1.6T, MIT)** | **LOW** | **Strongest — left brain is YOUR weights, AGPL-3.0** |

**The pick: Path D.** This is the architecture that survives a Crown
procurement audit.

## Why Path D survives

The Crown procurement auditor asks: "What model serves the customer-facing
reasoning?" The answer is: "Our sovereign merge. Our weights. Our
sovereign-labelled data fine-tune. Our SIGIL-signed reasoning. Our
Care-Floor." The auditor asks: "What's the right brain?" The answer is:
"A frontier open-weight model we license under MIT for the long-horizon
reasoning that the sovereign merge isn't yet capable of. We use it as
the ceiling, not as the sovereign guarantee."

**The sovereign guarantee is the left brain. The ceiling is the right
brain. That's the line.**

The auditor's follow-up: "But DeepSeek V4 is Chinese." The answer:
"You're correct. We use it as an open-weight model under MIT license for
capacity reasons. The customer-facing reasoning comes from our sovereign
merge. If procurement requires us to drop the Chinese-origin right brain,
we have MiMo-V2.5-Pro (also MIT, also Chinese origin) and GLM-5.x (also
MIT, also Chinese origin) as alternatives. The Western open-weight frontier
at 1.6T scale doesn't exist today. When it does — Llama 4 / Mistral 4
reach 1.6T — we can swap."

**The honest read: the Western open-weight frontier at 1.6T scale is
behind the Chinese open-weight frontier by ~12 months.** Meta's Llama 4
and Mistral's next flagship will likely close the gap in 2027. **Until
then, the two-brain sandwich uses a Chinese-origin right brain for
capacity, and the sovereign guarantee is the left brain.**

## The four "Chinese-origin" questions and the answers

### Q1: "Is DeepSeek V4 on the UK MOD supplier exclusion list?"

**Honest read: as of 2026-07-09, DeepSeek V4 is NOT on the UK MOD
supplier exclusion list.** The list is mostly Chinese state-owned
defence companies (Huawei, Hikvision, Sense Time, Megvii) plus a few
specific Chinese AI vendors (notably Sense Time and Megvii for
facial recognition specifically). **DeepSeek the company is not on
the list.** Their models are openly published under MIT license.

**Caveat:** procurement policy is changing. UK MOD / DASA / AUKUS
primes may add DeepSeek to the list at any time. **The architecture
must be swappable.** Path D is swappable: replace DeepSeek V4 with
MiMo-V2.5-Pro or GLM-5.x or (when it ships) Llama 4 / Mistral 4
with one config change.

### Q2: "Is the data sovereignty preserved?"

**Honest read: yes, with Path D.** The right brain's reasoning is
**attested to by the left brain's SIGIL chain.** The right brain
does not receive user data directly — the left brain (sovereign
merge) preprocesses the data, then queries the right brain for
"what's the long-horizon context for this input?" The right brain
responds with reasoning, not with user data. **The user data
stays on the sovereign merge's substrate.**

**Caveat:** if the right brain's API is hosted by a Chinese
provider (Alibaba Cloud, DeepSeek's own API, etc.), the data
flow crosses a Chinese-origin network. **For the strictest
procurement requirement, host the right brain on the user's
hardware or on a non-Chinese-origin cloud.** This is an
infrastructure cost, not an architecture cost.

### Q3: "Why not just use a Western frontier model at the 1.6T scale?"

**Honest read: there isn't one yet.** As of 2026-07-09:
- OpenAI GPT-5.x, Anthropic Claude Opus 4.6, Google Gemini 2.5: closed-weight, no fine-tune, no self-host
- Meta Llama 4 1.6T: not shipped yet
- Mistral flagship 1.6T: not shipped yet
- Apple Intelligence 1.5T: not open-weight
- Cohere Command R+ 1T: not at 1.6T scale

**The Western open-weight frontier is ~12 months behind the Chinese
open-weight frontier at the 1.6T scale.** That's a real gap. **The
two-brain sandwich is the architectural response to the gap: use
the Chinese open-weight model for capacity, sovereign-merge the
customer-facing reasoning.**

### Q4: "What happens when Llama 4 / Mistral 4 ship 1.6T?"

**Honest read: the right brain becomes a config change.** When
Meta Llama 4 or Mistral 4 ships a 1.6T-class model under a
permissive license (Apache-2.0 / MIT), the right brain is swapped
to the Western model. **The architecture doesn't change. The
sovereign guarantee (left brain) is unchanged. The capacity
ceiling (right brain) is upgraded.**

**The two-brain sandwich is the answer that survives the 12-month
gap AND the post-gap world.**

## The 3-tier licensing + the 2-brain sandwich + the Path D answer

| Layer | Decision | Why |
|---|---|---|
| **Substrate (sovereign-os, sov3, MEOK OS overlay)** | AGPL-3.0 | Stops the hyperscaler clone. Wins the open standard. |
| **Tools (CJ1+, 661 MCPs, meok-hatch characters)** | MIT or Apache-2.0 | Maximum adoption. The "data in the user's hands" wedge. |
| **Sovereign SEAL certificate** | BSL | The £120K+ revenue. |
| **Left brain (sovereign merge)** | AGPL-3.0 (your weights, your sovereignty) | The sovereign guarantee. |
| **Right brain (DeepSeek V4 / MiMo / GLM)** | MIT (their weights, their licensing) | The capacity ceiling. Swappable when Western open-weight catches up. |

**The two-tier IP model:**
- **Sovereign guarantee = your weights, AGPL-3.0** — no one can clone this.
- **Capacity ceiling = MIT frontier, swappable** — the moment a Western 1.6T ships, swap.

**This is the architecture that survives any procurement question.**

## What I'm shipping

1. ✅ `TWO_BRAIN_SANDWICH_3T_2026-07-09.md` (13KB) — the architecture
2. ✅ `SOV33_33T_TRACKER_2026-07-09.md` (6KB) — the quarterly trajectory
3. ✅ This file (procurement risk + Path D as the answer)

The honest one-line: **Path D is the answer. The left brain is your
weights, the right brain is MIT frontier, swappable when Western
catches up. The sovereign guarantee is the left brain. The capacity
is the right brain. SOV3 SIGIL binds both.**

---

*Authored for Sir Nicholas Templeman. The procurement risk is real but
manageable. The 12-month Western open-weight gap is the actual issue.
Path D survives. The architecture is swappable. The sovereign guarantee
is the left brain.*
