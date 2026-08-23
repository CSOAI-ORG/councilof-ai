# Arena Competitive Analysis — OpenRouter vs LMArena vs CSOAI

**Doc ID:** `arena-competitive-analysis` · **Revision:** 2026-08-23
**Surface:** councilof.ai / csoai.org — the signed, per-axis, verifiable leaderboard
**Doctrine:** measurement-not-certification · nobody-ranked-pays · check-never-assume
**Pod-canonical:** engine runs on the A100; signature created on-pod with the estate key.

---

## 0. The thesis (grounded)

Three players, three different games:

| Player | Business | Ranked by | Our edge |
|---|---|---|---|
| **OpenRouter** | API gateway/router + model marketplace | Provider usage, price, architecture | We don't route; we **attest** |
| **LMArena** (LMSYS) | Crowdsourced Elo leaderboard | Pairwise human preference | We're **signed + deterministic + per-domain** |
| **CSOAI (ours)** | Signed measurement + verified rankings | The GSPC axis engine | **Non-gameable, reproducible, auditable** |

**The defensible product:** *"The verified leaderboard. Every Elo, every score, every
axis — signed, reproducible, and independently verifiable."*

---

## 1. OpenRouter — what it actually is (live-verified)

**[empirical, live API]** `GET /api/v1/models` → 200, 690 KB, **422 models**. The 2026
schema has NO top-level `provider[]` on the model. A model carries: `id`, `canonical_slug`,
`name`, `context_length`, `architecture`, `pricing`, `top_provider`, `per_request_limits`,
`supported_parameters`, `benchmarks`, `reasoning`. Context windows are huge in practice:
**262K (66 models), 1,048,576 (48), 1,000,000 (47), 131K (44), 128K (31)**.

**Routing providers are a separate resource**: `GET /api/v1/models/{id}/endpoints` →
`endpoints[]` with `provider_name`, `tag` (azure, openai, anthropic, amazon-bedrock/eu-west-1),
`context_length`, `max_completion_tokens`, `status`, `uptime_last_5m`, per-provider `pricing`.
GPT-4o-mini = 3 providers; Claude Sonnet 4.5 = **7 providers**. Same model, usually same
per-token price; regional surcharges exist (`amazon-bedrock/eu-west-1` bills $0.0000033 vs
base $0.000003).

**Pricing**: per-token `prompt`/`completion`/`input_cache_read`/`input_cache_write`/
`input_cache_write_1h`/`web_search`/`image`/`audio` + **`overrides`** (tiered multiplier,
e.g. Claude Sonnet 4.5 ≥200K prompt tokens → prompt $0.000006, completion $0.0000225).
`web_search` is a flat per-request fee. **No separate gateway markup line-item** — the
margin is baked into the per-provider endpoint price; `discount` is where any applied
discount surfaces.

**Usage-rank**: the models payload carries a **`benchmarks`** block (230/422) with external
ELOs — `design_arena` (per-category elo/win_rate/rank) and `artificial_analysis`
(`intelligence_index`, `coding_index`, `agentic_index`). The engine emits **no own score**.
The site's "top model" order is an **adoption/usage ranking** (recent route volume), NOT
quality. So OpenRouter's headline rank encodes **market usage, not measured capability.**

### What OpenRouter does NOT do (the gap = our lane)
- **No signed provenance/attestation** of any output. You cannot cryptographically verify
  which provider served a token from the response.
- **No per-domain axis measurement.** It validates status/uptime and aggregates third-party
  benchmarks; it does not run its own calibrated capability measurement per domain.
- **No publicly-verifiable score.** Leaderboard ELOs are third-party (Design Arena /
  Artificial Analysis); adoption is opaque. No auditably-verifiable institutional score.
- **No neutral-certification claim** — it is a market intermediary optimizing cost/latency.

> ⚠️ **Keyed auth constraint (this session):** the provider key in `~/.env` returned
> `401 "User not found"` on every authenticated call (and `/models/limits` → 404). So all
> credit/rate-limit/usage-billing specifics remain **untested** this session. Do NOT treat
> any rate-limit or usage-pricing claim here as empirically verified.

---

## 2. LMArena — methodology + reliability (researched)

**Methodology**: anonymous pairwise preference voting → Elo (Bradley-Terry). Two models
answer the same prompt, a blind voter picks which is better (or a tie). The Elo update is
the standard `R_a' = R_a + K(S - E_a)` with `E_a = 1/(1+10^((R_b-R_a)/400))`; draws = 0.5.
Rank is by the Elo point estimate; confidence/position is often reported as a percentile or
bootstrapped band. See [Statistical Extensions of the Bradley-Terry and Elo Models](https://news.lmarena.ai/extended-arena/).

**Style control / de-bias**: the #1 known reliability fix — it corrects for the fact that
voters reward **longer/prettier** responses, so "which is better" is contaminated by
"which is longer". Style control separates the two signals so a verbose answer does not
inflate Elo. This is the exact bias we replicate in `harness/arena/elo.py::length_control()`.

**Specialized arenas**: LMArena runs separate arenas for single capabilities — SWE-bench,
engineering/math (AIME), vision, and more — the analogue of our per-axis approach. Each
measures ONE capability, which is precisely the granularity our GSPC axes target (gov, care,
jail, oss, det, mcp, xr, affect...).

**Reliability criticisms** (the falsifiable flaws we measure):
- **Green-cheek / spam voting** — a motivated party can push a model up by mass voting.
- **Short-answer bias** — voters reward concision regardless of correctness.
- **Style crowding** — a model that "sounds right" beats one that is right.
- **Selection bias** — who votes, and on what topic, skews the pool.
- See [LMArena is a cancer on AI](https://surgehq.ai/blog/lmarena-is-a-plague-on-ai) and
  [Can You Trust an AI Model Leaderboard?](https://clawvard.school/blog/ai-model-leaderboard-trust)
  and the HN discussion [Is LMArena junk now?](https://news.ycombinator.com/item?id=43623182).

### What LMArena does NOT provide
- **No signed provenance per score** — a number is not tied to a verifiable artifact.
- **No per-domain signed measurement** — the general crowd Elo collapses domain capability.
- **No public recompute/verify path** — you cannot independently recompute a posted Elo.

---

## 3. CSOAI — what we build that neither has

**The defensible differentiator, in one line:** *"We publish the verify path; neither
OpenRouter nor LMArena does."*

| Dimension | OpenRouter | LMArena | CSOAI |
|---|---|---|---|
| Rank basis | Adoption/usage | Crowd human preference | Deterministic measurement |
| Domain resolution | None (general) | A few specialized arenas | **Per-GSPC-axis** (14 axes) |
| Provenance | None | None | **content_id + Ed25519 (d4cb0eaa)** |
| Public verify | No | No | **`?verify=1` recompute** |
| Reproducible | No | No | **Frozen probes, seeded** |
| Non-gameable | No (spam) | No (green-cheek/spam) | **Frozen split + signed + anti-Goodhart** |
| Honest thin-n | No | No | **"insufficient to rank", never invented** |

**We already shipped (PR #364):**
- `harness/arena/elo.py` — reference Bradley-Terry Elo + bootstrap CI + style control
  (self-test PASS: A=1265.6 v B=1134.4, CI separates, style weight <1 on over-long answers).
- `harness/arena/axis_arena.py` — per-axis pairwise engine on the **OOWM fleet** (nemotron-30b,
  phi4:14b, gemma3:12b, deepseek-r1:8b, qwen2.5:7b, mistral:7b). Tiny models excluded.
- `harness/arena/arena_scoreboard.py` + `publish_scoreboard.py` — signed per-axis leaderboard
  with CI; `canon.py` for cross-runtime-stable content_id (JS `?verify=1` byte-matches).
- `functions/api/arena/scoreboard.ts` — serves the signed board; `?verify=1` recomputes
  content_id and returns `match: true|false`.
- Pipeline runs pod-canonical on the A100 (`arena-auto-loop.sh`): measure → grade → per-axis
  Elo → content_id + Ed25519 → publish. Verified end-to-end (signature round-trips, cross-
  runtime byte-match confirmed).

**Measured so far (live on the pod):** 15 axes with per-axis pass-rates from the OOWM fleet;
e.g. `care` phi4:14b=1.00; `gov/swarm/affect/jail` currently sparse (need more rounds) —
reported honestly, not invented.

---

## 4. The wedge (marketing)

- **OpenRouter routes; we attest.** It is the strongest distribution layer (422 models, cheap
  regional routing, deep context) but not an independent measurement authority.
- **LMArena is crowd Elo; we are signed per-domain Elo that you can recompute.**
- The shareable unit is the **verify demo** — "prove it yourself" recompute + Ed25519 check —
  which neither competitor can show.

**Named bug class we kill:** style bias (length≠capability), green-cheek/spam voting,
no-verify-path. These are exactly the failures catalogued in §2.

---

## 5. Sources

- OpenRouter API — live `curl` against `openrouter.ai/api/v1` (this session, unauthenticated
  endpoints). Provider routing docs: [Provider Selection](https://openrouter.ai/docs/guides/routing/provider-selection.md#3) ·
  [Provider Routing](https://openrouter.hconeai.com/docs/provider-routing). Rate limits:
  [API Credit & Rate Limits](https://openrouter.ai/docs/api%5Freference/limits#1). Rank
  semantics: [OpenRouter User-Ranking](https://technine.io/en/openrouter-model-usage-ranking-insight).
- LMArena — [Extended Arena (Bradley-Terry/Elo stats)](https://news.lmarena.ai/extended-arena/) ·
  [Is LMArena a cancer on AI?](https://surgehq.ai/blog/lmarena-is-a-plague-on-ai) ·
  [Can You Trust an AI Model Leaderboard?](https://clawvard.school/blog/ai-model-leaderboard-trust) ·
  [LMArena reliability (HN)](https://news.ycombinator.com/item?id=43623182) ·
  [Style-control analysis](https://github.com/simonaszilinskas/style-control-analysis/blob/main/paper_draft.md).
