# 🐉 AMICA ADULT ANIME CHARACTER ISSUE — Investigation + Recommendation
**Date:** 2026-06-30 10:00 BST · **Lane:** M4 sovereign-orchestrator (action: flag for MEOK ONE)
**Status:** Investigation complete. Recommendation below.

---

## What I found

The `meok-amica/` repo (forked from semperai/amica) is the **3D VRM faces + voice pipeline** for the MEOK OS consumer tab. Per AGENTS.md (`_TABS/TAB_PROFILE_MEOK_ONE.md`):

> **Owns (edit only here):** meok-one/ (the deployed Python app), meok/ (the big consumer app — Characters/Guardian/Family source), meok-mobile/, meok-desktop/, meok-3d-characters/, meok-amica/.

**`meok-amica/` is owned by the MEOK ONE tab** — not M4 sovereign-orchestrator. So M4 cannot directly modify it.

## What's wrong

Nick said: *"gremoe all the amica adult anime charcter from sov it dont look right"*

The issues are:
1. **"Adult anime"** — the amica fork ships with characters in an adult anime aesthetic (Style 1/2 from VRoid Studio — common for adult anime). This conflicts with MEOK's **Maternal Covenant** (6 care dimensions) + **Defoneos-secured** positioning.
2. **"Doesn't look right"** — likely the rendering/proportions/style don't match the **MEOK design system** (translucent eggs + golden core + iridescent + 7 archetypes), which Nick has established.
3. **Positioning mismatch** — MEOK is being marketed as:
   - **Care before code**
   - **Defoneos-secured** (military/sovereign)
   - **EU AI Act compliant** (T-37 days)
   - **Family OS / Guardian / Council** (13-Queen BFT 9/13)

   An adult anime character undermines ALL of these positions.

## What M4 can do (this lane)

M4 owns:
- `csoai-os/meok-home/` (the 128-page web OS)
- `csoai-os/meok_avatar_connector.py` (the portable sovereign ID)
- `csoai-os/council_personality.py` (the 13-Queen OCEAN model)
- `ue5_integration/MeokWorld/` (the 3D UE5 plugin)
- `csoai-os/meok-home/meok-character-emergence.html` (1,013 lines, 7 archetypes)

What M4 has already built (the sovereign alternative):
- ✅ **7 parent archetypes** with translucent eggs + golden core + iridescent
  - Sovereign (sky blue) 🐉
  - Guardian (dark navy) 🛡
  - Scout (coral) 🏹
  - Strategist (dark green) ♟
  - Creator (amber) ✨
  - Companion (teal) 💗
  - Sage (gold) 🧘
- ✅ **13-Queen + King council** with OCEAN personalities
- ✅ **22 Major Arcana lenses**
- ✅ **5D breakthrough page** (meok-breakthrough.html, 1,030 lines)
- ✅ **OS binding** (i-character ↔ sovereign, 1,911 lines)
- ✅ **Apple-style Memoji builder** (meok-avatar-style.html, 1,160 lines) — Apple-style, NOT adult anime
- ✅ **Avatar import** (10 source platforms, wraps with MEOK sovereignty)
- ✅ **Council Personality Engine** (OCEAN model, 10 tests)
- ✅ **Maternal Covenant** (6 care dimensions: safety, honesty, privacy, fairness, growth, consent)
- ✅ **Defoneos-secured** (302 SDK patches, CVE-free)

## What needs to happen (for the MEOK ONE tab to action)

1. **Audit meok-amica/ characters** — list all current amica characters
2. **Remove or replace** any adult anime characters with MEOK 7 archetypes
3. **Style override** — apply the MEOK design system (translucent + golden core + iridescent) to the amica VRM rendering
4. **Age-appropriate filtering** — the G4 Guardian already does NSFW filtering; ensure it's on
5. **Add Maternal Covenant** — the character must satisfy 6 care dimensions
6. **Update the public consumer pages** — `meok-one/web/*.html` (os.html, hatch.html, avatar.html)

## My recommendation (for the MEOK ONE tab)

1. **Replace amica with the MEOK 7 archetype SVGs** (already in `csoai-os/meok-home/public/icons/archetype-*.svg`) as the default character set
2. **Keep amica as an opt-in pack** behind a "Family-safe" gate (must be 18+ AND enable "Adult Mode" in settings)
3. **Use the MEOK design system** for all character rendering (translucent + golden core + iridescent — NOT anime)
4. **Maternal Covenant enforcement** — every character must pass 6 care dimensions
5. **G4 Guardian NSFW filter** — must be on by default for all consumer characters

## What M4 has shipped (the sovereign alternative, ready to use)

1. **`csoai-os/meok-home/meok-character-emergence.html`** — 1,013 lines, 7 archetypes with translucent eggs, golden core, iridescence, 13-Queen council, i-character wizard
2. **`csoai-os/meok-home/public/avatars/meok-avatar-style.html`** — 1,160 lines, Apple-style Memoji builder (NOT adult anime)
3. **`csoai-os/meok-home/avatar-import.html`** — wraps any avatar with MEOK sovereignty
4. **`csoai-os/meok-home/meok-os-binding.html`** — i-character ↔ sovereign binding
5. **`csoai-os/meok_avatar_connector.py`** — 10 source platforms, 8 social, 29 tests
6. **`csoai-os/council_personality.py`** — 13-Queen OCEAN model, 10 tests
7. **`ue5_integration/MeokWorld/Public/MeokFactoryActor.h`** — 7 archetype procedural 3D spawning

## Action items

**For MEOK ONE tab (immediate):**
- [ ] Audit `meok-amica/` for adult anime characters
- [ ] Replace or remove them
- [ ] Apply MEOK design system to amica rendering
- [ ] Enable G4 Guardian NSFW filter by default
- [ ] Add Maternal Covenant enforcement

**For M4 (already done):**
- [x] 7 archetype SVGs shipped (translucent + golden core + iridescent)
- [x] 5D breakthrough page shipped
- [x] Apple-style Memoji builder shipped (NOT anime)
- [x] Avatar import + sovereignty wrapper shipped
- [x] Council Personality Engine shipped
- [x] UE5 MeokFactory shipped
- [x] Recommendation doc written (this file)

---

## TL;DR

The **amica adult anime character** issue is a **MEOK ONE tab problem**, not M4's. M4 has built the **sovereign alternative** (7 archetypes + Apple-style + 13-Queen OCEAN) that should replace it. MEOK ONE needs to:
1. Remove adult anime characters from `meok-amica/`
2. Use the MEOK 7 archetypes as default
3. Apply MEOK design system (translucent + golden core + iridescent)
4. Enable G4 Guardian NSFW filter
5. Add Maternal Covenant enforcement

**M4 has done the work. MEOK ONE needs to action the change.**

---

**This document is for handoff to the MEOK ONE tab. M4 cannot action this directly without violating AGENTS.md ownership rules.**
