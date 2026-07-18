# Design System v1 — Move #18

## Goal

Today every page assembles its own card / button / CTA from raw Tailwind. Drift is inevitable.
A formal design system makes the brand consistent across:

- haulage.app (React SPA)
- planthire.ai / grabhire.ai / muckaway.ai (Lovable SaaS sites)
- /docs, /trust, /case-studies, /partners, /onboarding, /legal/*
- Marketing one-pagers
- Slack + Teams + GPT + Copilot icon sets
- iOS + Android Capacitor wraps
- Figma design files for partner co-marketing

## Components in v1 (30 atoms)

### Foundations (5)
- Color palette (8 tokens × 4 themes — light / dark / high-contrast / brand-orange)
- Typography scale (display, body, mono — 5 sizes each)
- Spacing scale (8px grid)
- Radius scale (sm / md / lg / pill)
- Shadow scale (subtle / card / popover / modal)

### Inputs (8)
- Button (hero / outline / ghost / destructive — 3 sizes)
- TextInput
- Textarea
- Select
- Checkbox
- RadioGroup
- Switch
- Slider

### Display (10)
- Card (industrial / soft / elevated)
- Badge (primary / muted / success / warning / danger)
- Alert (info / warning / error / success)
- Tooltip
- Modal
- Drawer
- Skeleton (Move #20 already shipped)
- Avatar
- Logo (size variants)
- Icon wrapper (lucide + custom)

### Layout (7)
- Container (sm / md / lg / xl)
- Stack (vertical, horizontal)
- Grid (auto + responsive)
- Divider
- Section header (eyebrow + title + sub)
- Pricing card (already exists, formalise)
- Comparison row (already exists in /vs)

## Stack

- **Storybook v8** — interactive component browser at https://design.meok.ai
- **Tailwind tokens** — single source of truth in `tailwind.config.ts`
- **Figma Code Connect** — Figma → React component auto-sync
- **VRT** (Visual Regression Testing) via Chromatic — auto-flag UI regressions on every PR

## Implementation order

1. **Move tokens out of Tailwind defaults** → explicit token file
2. **Storybook scaffold** (`npx storybook init` — 30 min)
3. **Wrap existing 5 components** as stories first: Button, Card, Badge, SEO, LoadingSkeleton
4. **Wrap next 10** progressively in sprint #2
5. **Figma library** authored from screenshots of live components
6. **VRT via Chromatic** — free tier covers solo founder use
7. **Publish to design.meok.ai** subdomain via Storybook static export to Vercel
8. **Update internal docs** to reference Storybook stories instead of redoing markup

## Cost envelope

| Item | Monthly |
|---|---|
| Chromatic Free tier (5k snapshots/mo) | £0 |
| Storybook hosting (Vercel) | £0 (within current plan) |
| Figma Pro (already paid? confirm with Nick) | £15 |
| **Total uplift** | **~£15** |

## Time envelope

- v1 of 5 components on Storybook: 2 days
- v1 of 30 components on Storybook + Figma: 2 weeks
- VRT + publishing pipeline: ½ day

## Risk

Storybook + tailwind cohabit fine, but **stories must hydrate i18n** to avoid showing untranslated
strings in component previews. Solution: dummy i18n provider in `.storybook/preview.tsx` that returns
the key (e.g. `t("hero.title")` → `[hero.title]`) so designers can spot missing translations at a glance.

## Decision

**Schedule Move #18 for after #21 WCAG audit lands.** WCAG findings often surface in components first
— easier to fix in 30 isolated stories than 12 pages × 14 locales.
