# 🎨 CSOAI Visual / Spacing Fix-Spec — for M2 (councilof-ai) · 2026-07-07

> ⚠️ **CORRECTION (verified in local dev 2026-07-07):** the "only one breakpoint" claim below was a
> CSS-parsing artifact of Tailwind v4 range-media-queries. The site IS responsive (sm:373 / md:652 /
> lg:245 responsive prefixes; nav collapses to a hamburger; mobile renders decently). Real issues found
> by actually emulating mobile: (1) a site-wide **nested-<a> hydration bug** in the Footer — FIXED +
> verified, PR #129; (2) the "New here?" tour popup **overlaps the hero at 375px** (still open);
> (3) `xl:` used only 4× = almost no large-screen optimization. Treat the breakpoint section below as
> superseded; the padding/container-consistency items still stand as polish.


Measured live on csoai.org (desktop, via getComputedStyle). These are real defects, not opinions.
M4 can't emulate mobile from its seat (browser resize doesn't change the live viewport) and won't edit
M2's repo — this is the precise handoff so M2 applies it in `councilof-ai/client`.

## 🔴 Root cause: responsive breakpoints are missing
Live CSS defines only **one** width media query: `(max-width: 600px)`. Everything **601–1024px**
(iPad portrait/landscape, large phones in landscape, small laptops) falls back to the **desktop**
layout crammed into a narrow width. **This is the #1 thing that makes it feel wrong across platforms.**

**Fix:** add the standard scale (Tailwind `sm/md/lg/xl` = 640/768/1024/1280). Every multi-column
section needs to collapse progressively, not jump from desktop → 600px.

## 🔴 Sections have no horizontal padding (`padding-inline: 0`)
Sections rely entirely on inner `max-w-*` containers for side spacing. On narrow screens, any content
not inside a padded container **touches the screen edge**.
**Fix:** put `px-4 sm:px-6 lg:px-8` on the section (or the inner container) universally. Guarantee a
minimum 16px gutter at mobile. Verify hero text, cards, and the announcement bar specifically.

## 🟠 Inconsistent vertical rhythm
Section `padding-y` jumps between **80px** and **96px** with no system.
**Fix:** one scale — e.g. `py-16 md:py-24` (64/96) everywhere, or `py-20 md:py-28`. Pick one, apply to all.

## 🟠 Inconsistent content width
Containers mix **1152px** and **1280px** `max-width`.
**Fix:** one container token (`max-w-6xl` = 1152, or `max-w-7xl` = 1280) site-wide so sections align.

## Checklist for M2 (per breakpoint: 390 / 768 / 1024 / 1440)
- [ ] Add sm/md/lg/xl breakpoints; test each page at all 4 widths (real device or DevTools device mode).
- [ ] `px-4 sm:px-6 lg:px-8` on every section/container — no edge-bleed at 390px.
- [ ] Single `py` scale + single container max-width.
- [ ] Nav: confirm the hamburger swap happens at `md` (768), not only ≤600 (601–767 is currently broken).
- [ ] Hero: font-size clamps (`text-4xl sm:text-6xl lg:text-8xl`) so it doesn't overflow at 390.
- [ ] Cards/grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — verify no 1px overflow (horizontal scroll) at 390.
- [ ] `overflow-x: hidden` guard on body as a safety net.
- [ ] Test the SOV Space experiment panel + the dome/globe at 390 (the two-column layout must stack).

## "Half the visuals better" — highest-leverage (subjective, M2 design call)
- Consistent card style (one border/radius/shadow token) — several sections use different card treatments.
- Consistent accent (the emerald→cyan gradient) applied to section eyebrows + CTAs uniformly.
- Tighten the 96px gaps on mobile (they read as huge empty voids on a phone) — halve them under `sm`.

## What M4 owns (fixing directly, separate from this)
The `os.meok.ai` static surfaces (`sovspace.html`, `character.html`, `hatch-demo.html`, `index.html`)
— M4 will audit + add the same responsive discipline there and deploy.
