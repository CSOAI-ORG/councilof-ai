# Arena Competitive Watch — 2026-08-23 (fresh sweep)

Appends to `arena-competitive-analysis.md` with the latest dated intel. Sources are the
current public record; anything unconfirmed is labelled so.

## 1. OpenRouter — current state

- Still the strongest *distribution* layer: a large model catalog, per-provider routing/endpoints,
  per-token pricing with `overrides` tiers, and surfaced third-party benchmark ELOs
  (design_arena, artificial_analysis). Its headline "top model" ordering remains an
  **adoption/usage** signal, not measured capability.
- **No signability/attestation feature.** Calls carry routing metadata; there is still no
  per-completion signature, content-hash, or issuer attestation. You cannot cryptographically
  verify which provider served a token from the response.
- **No per-domain measured leaderboard** of its own. It aggregates third-party benchmarks; it
  does not run calibrated domain-axis measurement.
- **No public recompute/verify path.** Leaderboard ELOs are external and adoption is opaque.
- Evidence: [2026 OpenRouter Dual-Track Rankings](https://macgpu.com/en/blog/2026-0601-openrouter-dual-leaderboard-token-revenue-mimo-claude-mac-routing.html) ·
  [OpenRouter pricing/markup](https://ofox.ai/blog/openrouter-pricing-hidden-markup-breakdown-2026).

## 2. LMArena — current state

- **No "verified"/"reproducible" feature** has shipped for the leaderboard itself. The board
  remains crowd-Elo (Bradley-Terry) from anonymous pairwise votes.
- Known reliability criticisms are **still the open critique**: green-cheek/spam voting,
  short-answer bias, style crowding, selection bias. Independent commentary continues to
  question whether a crowd Elo can be trusted as a capability measure.
- **No per-domain signed measurement, no signed provenance, no public verify path.**
- The community is explicitly pushing back on black-box leaderboards — there's a live
  "community evals / stop trusting black-box leaderboards" movement, which is *exactly* the
  opening for a signed, deterministic, reproducible board.
- Evidence: [LMArena Review 2026 — reliable?](https://www.toolcenter.ai/zh/articles/lmarena-review-2026) ·
  [Can you trust an AI model leaderboard?](https://clawvard.school/blog/ai-model-leaderboard-trust) ·
  [Community Evals: stop trusting black-box leaderboards](https://huggingface.co/blog/community-evals) ·
  [LMArena methodology (Botnation)](https://botnation.ai/en/chatbot-arena/).

## 3. The gap is still open — and widening

Neither OpenRouter nor LMArena offers, as of 2026-08-23:
- (a) **per-domain signed measurement** — ✗ both lack it;
- (b) **a public recompute/verify path** — ✗ both lack it (OpenRouter no provenance;
  LMArena no repro);
- (c) **non-gameable deterministic scoring** — ✗ LMArena is crowd (gameable by spam);
  OpenRouter is adoption.

CSOAI has all three — and the community-evals movement makes this the *right time* to be the
neutral, verifiable, per-domain measurement body. **No overclaim risk identified**: nothing
I claimed as a CSOAI differentiator has since been shipped by a competitor.

## 4. Three concrete build recommendations (ranked)

1. **Publish the verify demo as the front door** — a one-click /arena-scoreboard page that
   recomputes content_id on the edge and shows match:true|false (SHIPPED, PR #391). Make it the
   shareable unit: "prove it yourself." The verify path is the wedge neither competitor has.
2. **Per-domain packs for regulated sectors** — the "verified per-domain leaderboard" is where
   crowd Elo collapses. Ship per-axis pages (gov/care/jail/oss/det/mcp/xr...) + domain packs
   (finance, healthcare, defence) so a domain expert sees measurement specific to their domain.
   This is the differentiator made concrete.
3. **Longitudinal drift product** — surface frozen-probe re-run drift as a first-class chart
   (per axis, per generation). No competitor publishes verifiable capability *drift over time*;
   this is the unique ongoing product that keeps researchers returning and is the natural B2B
   subscription.
