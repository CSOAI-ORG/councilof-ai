# OpenRouter — Ground-Truth Learning Notes (for the verified-leaderboard strategy)

**Doc ID:** `openrouter-learning-2026-08-23` · **Revision:** 2026-08-23
**Purpose:** internalise OpenRouter's actual mechanics so our verified-leaderboard strategy is
measured against reality, not assumption. (LMArena methodology notes separately.)

## What OpenRouter actually is

- **A unified API gateway/router** — one OpenAI-compatible endpoint (`/api/v1/chat/completions`)
  that routes to hundreds of models across many providers. We are NOT building this (we don't
  route inference).
- **A model marketplace/aggregator** — the `/api/v1/models` catalog exposes provider-level
  routing, per-token pricing, context windows, and model metadata.

## Verified API facts (public catalog, 2026-08-23)

- **422 models** listed publicly with no auth on `/api/v1/models`.
- Each model record carries: `id`, `canonical_slug`, `hugging_face_id`, `name`, `created`,
  `description`, `context_length`, `architecture`, and a `pricing` object.
- **Pricing fields:** `pricing.prompt` (input/token), `pricing.completion` (output/token),
  `pricing.web_search`, `pricing.input_cache_read` — so a caller can compute route cost precisely.
- **Provider routing:** `providers[]` array per model (which providers serve it, with their own
  price/latency), plus a routing preference (`provider.order`, `.allow`, `.fallback`).

## The business model (what OpenRouter monetises)

OpenRouter's revenue is the **routing margin + marketplace**: it's a *pipe* that takes a slice
for giving you one API to many models with fallback. It offers **no signed provenance, no
per-domain axis measurement, and no publicly re-verifiable ranking** — its "top model" ranking
is **usage/adoption-based**, not a quality measurement.

## The gap we attack (the honest wedge)

| OpenRouter | LMArena | CSOAI |
|---|---|---|
| Routes inference | Ranks by crowd preference (pairwise Elo) | **Attests measurement** |
| Rank = usage/adoption | Rank = human vote + style-control + value-Elo | Rank = **signed deterministic per-domain** |
| No public verify | No public verify | **Public verify path (recompute → content_id → Ed25519 → did:web)** |

**The line:** OpenRouter is a pipe; LMArena is a popularity contest; CSOAI is the **signed
verification layer** — a leaderboard whose numbers a party can independently verify and that
resolves capability per domain. That is the defensible product.

## Actions triggered (from this learning)

1. We do NOT clone OpenRouter's gateway (routing is not our lane).
2. We DO adopt LMArena's strongest methodology pieces (Bradley-Terry Elo + Wilson CI + style
   control + value-based weighting) — implemented in `elo_reference.py` v1, verified against our
   live 3,052-round arena.
3. We publish the **signed per-axis Elo** so a party can recompute it — the piece neither has.
