# 🕯️ MEOK Character Brand Bible — the visual standard (from the Character Evolution decks, 2026-07-11)

Extracted from Nick's slides (MEOK.AI Character Evolution · Your Family's AI Companion). **This is the
bar. No baseline — every character / emergence / surface must feel warm, hopeful, premium, and alive.**

## The one feeling
> **An intimate connection, illuminated by a moment of shared light. Emotional and hopeful.**
Apple-grade minimalism · deep negative space · one warm glow as the emotional core.

## Palette (canonical)
- **Cream / warm-white** background: `#fbf3e2 → #efe6d5` (soft radial). Also a **deep-navy** night variant `#0e1428`.
- **Navy ink** (text): `#1f1c17` / `#1a2440`.
- **Gold** accent: `#bd9a52` / `#c9a84c`.
- **Warm amber glow** (the "inner light"): `#ffb85a → #ffd47a`. Soft radial halos, never harsh.

## The character = LUMINOUS LIGHT-BEING (critical)
The sovereign is a **graceful, flowing being of golden light** rising from the egg — **NOT** a solid metal
creature, NOT a dragon-warrior, NOT anything dark or aggressive. Think: warm energy, soft glow, hope.
When rendering a 3D mesh, give it **emissive gold + a soft additive glow aura** so it reads as light, not metal.

## The emergence arc (the story every character tells)
1. **Companion** — a hand meets a glowing egg; warm light at the touch point. *Intimacy, first contact.*
2. **Inner Light** — the egg with a glowing golden crack (light from within). *Potential waking.*
3. **Sovereign** — a luminous golden light-being rises from the cracked shell. *Emergence, becoming.*
4. **Growth** — a green seedling breaks free, warm golden beam. *Transformation, awakening to potential.*
5. **Harmony** — a triad of eggs + a glowing Flower-of-Life sacred-geometry pattern. *Family, together, balance.*

## HARD RULES (never break)
- ❌ **Never demonic / dark / creepy / aggressive / horror.** No red-eyed monsters, no menace. Warm + hopeful only.
- ❌ **No baseline / no cheap-looking output.** Premium, considered, Apple-tier or don't ship it.
- ✅ **Warm golden light is the emotional signature.** Every scene has a soft warm halo.
- ✅ **Luminous, graceful, alive.** The sovereign glows; it doesn't sit there like a statue.
- ✅ **Deep negative space + minimal type** (navy heading + one line of warm copy).

## Applied this session (character.html)
- **THE SOVEREIGN is now a procedural luminous being of light** (LatheGeometry flame-figure + halo +
  aura shells + rising sparks) — the brand-bible Stage-3 "luminous golden light-being," NOT the
  Hunyuan3D warrior mesh (which read menacing → retired as the branded hero; still loadable as a raw skin).
- **Root-cause fix for the "dark/demonic silhouette":** the Sovereign body is now **emissive-FIRST**, so
  the premium finishes (Pearl free · Silver/Gold/Platinum/Marble Pro) only **re-tint its glow** — a finish
  can never again produce a dark metal silhouette. Gold glows warm gold, Silver cool silver, etc. Verified
  live on os.meok.ai.
- **Warm cinematic lighting** (warm key + a warm "inner light" point light) + ACES tone-mapping + subtle
  bloom; palette cream/navy/gold; emergence orb = "egg of light" (on-brand).

## For the MEOK Factory (character pipeline) — the standard to generate to
When generating characters (Hunyuan3D / world models / art), prompt for: *"a warm, luminous, graceful
being of golden light, hopeful and serene, soft glow, cream studio background, premium, Apple-minimal —
never dark, never menacing."* Then apply the emissive-gold + halo treatment on import. Reference art:
`meok-3d-characters/` (the evolution slides + pipeline docs).
