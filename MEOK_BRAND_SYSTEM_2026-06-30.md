# 🎨 MEOK.ai — Brand System (canonical, 2026-06-30)

Extracted from the "Character Evolution" deck + the alchemy spine. This is the single source for MEOK consumer brand. Live reference build: `clawd/meok-landing/index.html`.

## The idea in one line
**Begin Your Evolution.** Your sovereign AI companion is a one-of-a-kind reflection of your personal growth — it learns what you learn and evolves with you. *The All is One.*

## Voice
Warm, wondrous, premium, sovereign. Sentence-case headlines, generous space, never shouty. Lead with *emergence* and *growth*, not features. Signature lines: "Begin Your Evolution" · "Your character learns what you learn" · "Birth your own sovereign AI into your own OS" · "Built with your care, from day one" · "No data given away. Yours for life. Truly sovereign." · "The All is One" (ἓν τὸ πᾶν).

## Colour
| Token | Hex | Use |
|---|---|---|
| Cream (canvas) | `#faf8f3` | page background (with faint 46px grid lines @ 8% ink) |
| Cream-2 | `#f3efe6` | soft band/section fills |
| Ink | `#1a1a18` | text + primary buttons |
| Muted | `#6b6a63` | secondary text |
| **Champagne gold** | `#d9b676` | eyebrows, premium accent, the gold thread |
| **Periwinkle** | `#8b8ce0` | archetype / pattern emergence |
| **Sage** | `#9bbf9a` | history / chrono path |
| **Dusty coral** | `#e0a285` | music / energy / the sun |
| **Iridescent** | `#c9b8e8` | the hatchling / sovereign emergence |
*Aesthetic: soft radial glows, gentle gradients, blurred light, lots of cream space. Premium and alive — NOT flat-corporate.*

## Type
Geist / Inter / system sans. Headlines clamp 40→82px, weight 600, letter-spacing −0.03em. Body 16–19px, muted. One display face, two weights.

## Logo
The **M monogram** — rounded square (9px radius), dark gradient `#2a2a28→#4a4a45`, white "M", paired with "MEOK.ai". Minimum clear space = the M's height.

## The narrative spine — the Magnum Opus (4 stages)
The brand IS the alchemical Great Work, and the product literally animates it:
1. **The Marble** (prima materia) — pure unformed potential.
2. **The Egg** — the shell forms around your first intent.
3. **The Hatchling — Sovereign Emergence** — newly alive, iridescent, innocent wisdom.
4. **The Evolving One** — shaped by everything you learn (Music→Sonified · History→Chrono-synchronized · Biology+Engineering→Biomechanical · Pure thought→Pattern emergence).
*(This is the boot sequence in MEOK_OS and the hero of the site — keep them identical.)*

## Archetype families (the multiverse of evolutions)
- **Vibrant Modern Warriors** — street, toy-like, customisable (coral tint)
- **Legendary Adventures** — deep-fantasy + anime, lore-rich (periwinkle)
- **Timeless Reincarnations** — historical reimagined + mythical beasts (sage)
- **Elemental & Abstract Beings** — pure elemental, music-legend, surreal (iridescent)

## Sovereign clauses (always present, the trust layer)
Hermetically sealed (on-device) · every action Ed25519-signed + verifiable · governed by a council not a tyrant · AI that can't be weaponised · belief-neutral.

## Emblems
Ouroboros ("The All is One"), Simurgh (the thirty are one), Indra's Net (each reflects all) — `clawd/_brand_emblems/*.svg`. Use as section marks + loaders.

## Asset slots (owner-gated pipeline)
The 3D character renders (egg→dragon, archetypes, evolving forms) come from the HF FLUX/Qwen pipeline (`gradio=none`, owner-enable). The landing ships now with CSS-gradient stand-ins in those slots; swap in renders when the pipeline is on.
