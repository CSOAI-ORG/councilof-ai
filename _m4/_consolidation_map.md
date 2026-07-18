# CSOAI csoai-os/ Consolidation Map (2026-06-29)

> **The 6 entry-points + 141 static pages live here.** This map clarifies what
> each one does + which is canonical + what's obsolete. Avoid duplicate work.
> When M2 MacBook receives the bundle, they only need to DEPLOY these 6 —
> the other 135 pages are SEO/answer-engine entry-points that all link
> back to them.

## The 6 entry-points (canonical surfaces)

| # | Surface | File | What | Who |
|---|---|---|---|---|
| 1 | **The Catapult** (conversion) | `catapult.html` | The high-conversion design-partner landing page. **The entry-point at csoai.org/** | All visitors |
| 2 | **The CSOAI OS** (the master) | `index.html` | The 41-app sovereign console. The A+++++ hub | All visitors |
| 3 | **Layer-1 Hub** (the apps) | `layer-1.html` | Lists the 10 Layer-1 consumer apps (one per protocol + extras) | Engineering visitors |
| 4 | **MEOK WORLD** (the master OS) | `meok-world.html` | The unified PWA wrapper (i-character wizard + sovereign chat + 11 temples) | Power users |
| 5 | **v2 Temple OS** (the dharma) | `v2-temple-os.html` | The 11-temple dharma interface | Faithful visitors |
| 6 | **v2 Signup Wizard** (the onboarding) | `v2-signup-wizard.html` | The i-character creation wizard (5 steps) | New users |

## The 10 Layer-1 consumer apps (P1-P8 + 2 meta)

| # | App | File | Protocol | Layer-1 hub link |
|---|---|---|---|---|
| 1 | OSCAL Verifier | `oscal-verifier.html` | **P6** | `layer-1.html` |
| 2 | Layer-0 Explorer | `layer0-explorer.html` | all 8 | `layer-1.html` |
| 3 | Council View | `council-view.html` | **P7** | `layer-1.html` |
| 4 | SIGIL Stream | `sigil-stream.html` | **P5** | `layer-1.html` |
| 5 | A2A Substrate | `a2a-substrate.html` | **P3** | `layer-1.html` |
| 6 | Bridge Inspector | `bridge-inspector.html` | **P2** | `layer-1.html` |
| 7 | Cliff Tracker | `cliff-tracker.html` | **P6+** | `layer-1.html` |
| 8 | MCP Explorer | `mcp-explorer.html` | **P1** | `layer-1.html` |
| 9 | x402 Payments | `x402-flow.html` | **P4** | `layer-1.html` |
| 10 | Compliance Passport | `compliance-passport.html` | **P8** | `layer-1.html` |

## The 3 special conversion/launch surfaces

| # | App | File | What |
|---|---|---|---|
| 1 | Quote Builder | `quote-builder.html` | Pickers generate a bespoke £-priced quote with mailto-handoff |
| 2 | PR Tracker | `pr-tracker.html` | Live dashboard for the 5 upstream PRs |
| 3 | MEOK World wrapper | `meok-world.html` | The A+++++ master OS — wraps v2-temple-os + ichar.py + i-character wizard |

## The 90 micro-landing-pages (10x layer-1)

`csoai-os/micro/{app}-for-{vertical}.html`:
- 9 Layer-1 apps × 10 verticals = **90 pages**
- Each = vertical-specific entry-point + tier-1 SEO keywords
- Examples: `oscal-verifier-for-banking.html`, `council-view-for-healthcare.html`
- All link back to the catapult + quote-builder

## The 33 per-MCP pages (10x packages)

`csoai-os/per-mcp/{slug}.html`:
- 23 flagship bridges + 9 crown-jewels + 1 solvency-ii = **33 pages**
- Each = package-specific landing with tier-1 keywords + install + canonical use case
- Examples: `cobol-bridge-mcp.html`, `solvency-ii-mcp.html`
- All link back to the catapult + GitHub repo

## The 141 HTML touchpoints

```
  6 entry-points  (catapult, index, layer-1, meok-world, v2-temple-os, v2-signup-wizard)
 + 10 Layer-1 apps (oscal-verifier, layer0-explorer, council-view, sigil-stream, a2a-substrate, bridge-inspector, cliff-tracker, mcp-explorer, x402-flow, compliance-passport)
 +  3 special surfaces (quote-builder, pr-tracker, MEOK bundled in meok-world)
 + 90 micro-pages = 9 apps × 10 verticals
 + 33 per-MCP pages = 23 flagships + 9 crown-jewels + 1 solvency
---
141 distinct SEO + answer-engine entry points
```

## The "what's canonical" rule

- **First-time visitor** → lands at **catapult.html** (the conversion surface)
- **Returning visitor** → clicks through to **layer-1.html** (the apps hub)
- **Engineer** → drills into a **per-mcp/{name}.html** (the package landing)
- **Vertical-specific** search → finds **micro/{app}-for-{vertical}.html**
- **Power user** → **meok-world.html** (the unified PWA)
- **New user** → **v2-signup-wizard.html** (the i-character creation)

## Which is OBSOLETE (do NOT maintain)

| File | Why obsolete |
|---|---|
| (nothing right now) | All 141 are live + branded A+++++ |

## Which is RUN via a build script

| File | Built by |
|---|---|
| `meok-world.html` | `python3 build_meok_world.py` + `python3 _m4/_inject_layer0_banner.py` |
| `micro/*.html` | `python3 _m4/_build_micro_pages.py` (regeneratable) |
| `per-mcp/*.html` | `python3 _m4/_build_per_mcp_pages.py` (regeneratable) |

## The 1 owner move (unchanged)

`bash scripts/ship-everything.sh` after PYPI_TOKEN + NPM_TOKEN + VERCEL_TOKEN + mcp-publisher login github.

After that, Vercel pulls the bundle → csoai.org/ serves all 141 surfaces from this static tree.

## Sister-agent rule

- **Adding a new protocol?** Add a new app to `layer-1.html` + write a new per-mcp landing for any MCP that ships in that protocol.
- **Adding a new vertical?** Update `_m4/_build_micro_pages.py` VERTICALS list.
- **Adding a new flagship MCP?** Update `_m4/_build_per_mcp_pages.py` MCPS list.
- **Don't write the same surface twice.** Use one of these 6 entry-points as canonical and update it.

## Honest register

- 141 surfaces today; ~500 surfaces when siblings add their respective surfaces (Hermes has its own ~58, M2 has its own ~40, Hive has 33 cities).
- Some are PWA-wrappers (meok-world.html); most are static HTML.
- The build scripts are regeneratable.
- Bundle is 1.0 MB → still well under Vercel's free tier.

## The next surface to ship (per the C5DL)

- 3 demo videos (cobol, BFT, OSCAL verifier) — embed as `<video>` in the catapult's "wedge demo" section.
- That's the only M4 missing piece for the 5-day runway.

— M4
