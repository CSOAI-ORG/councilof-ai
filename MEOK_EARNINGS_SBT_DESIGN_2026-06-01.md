# MEOK earnings + ownership — design (2026-06-01)

_By Claude (Opus 4.8). The "hatch & own an AI forever — and earn from it" layer. This captures
the lookback decisions, the architecture, the **non-crypto-first** path, and the hard boundary._

---

## The boundary (read first)
I (Claude) will build the **gamification + marketplace mechanics + the SBT/chain *design and
scaffolding***. I will **NOT** mint tokens, deploy smart contracts, create wallets, or move
money/assets — those are **Nick-authorized + legal/audit** steps. This is also the safer launch
order: ship the game + the off-chain economy now, switch on the chain once contracts are audited.

---

## What was already decided (lookback — recovered from the repo)
- **Ownership = SBT (soulbound token) on Solana.** You own your hatched AI; it's bound to you.
  17 `.rs` files exist (need devnet verification). `assitti` registry = discoverability + safety grade.
- **Marketplace split = 70/30** (creator keeps 70%). Applies to: custom characters, skins/themes,
  MCP tools, compliance packs.
- **The loop ("Visa of AI characters"):** free hatch → buy pre-made → hatch **custom (paid,
  resellable)** → **resell → keep 70%**.
- **`$MEOK`** = internal name only (not public-facing).
- Subscription: £9/mo Pro; £5 of each sub flows to MCP-tool builders via the split.

## Architecture — three layers, shipped in order

### Layer 1 — OFF-CHAIN economy (build now, no crypto) ✅ safe for me to build
- **Ownership today:** per-user roster (`auth.add_character`) already makes a creation *yours* and
  persistent across devices (SOV3 identity). That IS ownership — just not yet on-chain.
- **`/api/marketplace`** (shipped): the honest economy model — 70/30 split, your owned count, the
  flow, what's sellable, tiers. The Marketplace tab renders live data, not "coming soon".
- **Listing states (design):** `owned` → `listed` (price) → `sold` (70% creator / 30% platform).
  Settled via **Stripe** (already wired elsewhere) — fiat, no chain needed for v1.
- **Gamification that feeds earnings:** bond/level/emergence (shipped) → higher-bond / higher-stage
  characters are more valuable/desirable on the marketplace. "Raise it, then sell it."

### Layer 2 — ON-CHAIN ownership (Nick authorizes) ⛔ I scaffold only
- **SBT mint on hatch:** when you hatch/create, mint a soulbound token = proof of ownership.
- **SIGIL signs** the character's attestation; **Ed25519** (the attestation upgrade already on the
  backlog) is the signing primitive — a clean bridge to on-chain signatures.
- **Transfer-on-resale:** burn-and-remint or marketplace-escrow; 70/30 enforced in the program.
- **Decision Nick must make:** Solana vs. an L2 (gas/UX), custodial vs. self-custody wallets
  (huge UX + compliance implications), and whether v1 launches **off-chain** (recommended) with
  chain as a fast-follow. *I will not pick the chain or deploy — that's yours.*

### Layer 3 — "users make money" (the headline) — honest framing
- **Real, now:** creators earn via the **70/30 marketplace** (Stripe) on characters/skins/tools.
- **Designed:** royalties on resale (you earn each time your character resells), staking/points →
  later, only if Nick wants a token (regulatory weight — UK/EU treat earn-from-token carefully).
- **My recommendation:** lead with the **creator-economy** message (make money by *building*
  great characters/tools — 70% yours), NOT a "buy-the-token-and-earn" message (which is a security/
  regulatory minefield and off-brand for a care-first product). The SBT is *ownership/provenance*,
  not a speculative coin.

## Recommendation for July 4
Ship **Layer 1** (off-chain economy + the marketplace surface + the gamified value) for launch.
Keep **Layer 2** as audited fast-follow. This delivers "own your AI forever + earn 70% as a
creator" truthfully on day one, with zero crypto/legal risk on the critical path.

## Status
- ✅ Off-chain ownership (per-user roster) + ownership badge ("✦ Yours forever · SBT-ready").
- ✅ `/api/marketplace` live economy model.
- ⬜ Listing/resale flow (Stripe) — next off-chain build.
- ⛔ SBT mint / chain — Nick-authorized; scaffold + Ed25519 bridge ready when you say go.
