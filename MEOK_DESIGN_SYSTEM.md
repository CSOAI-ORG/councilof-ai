# 🐉 MEOK Design System
## The Brand Identity for the Sovereign AI OS

**Version:** 1.0.0 · **Date:** 2026-06-29 · **Owner:** MEOK AI Labs (CSOAI LTD)
**Compatible with:** Claude Design (Pro/Max/Team/Enterprise), Figma, Sketch, Adobe XD

---

## 1. THE 5-COLOR SOVEREIGN PALETTE

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--gold` | `#c9a84c` | 201, 168, 76 | Primary CTAs, accents, sovereign character |
| `--gold-bright` | `#d4a853` | 212, 168, 83 | Hover, gradient end |
| `--bg` | `#F5F0E6` | 245, 240, 230 | Page background (warm cream void) |
| `--text` | `#2a1a14` | 42, 26, 20 | Body text (dark warm brown) |
| `--surface` | `#FAF7F0` | 250, 247, 240 | Card / panel background |

## 2. THE 7-ARCHETYPE PALETTE

| Archetype | Token | Hex | Emoji |
|---|---|---|---|
| Sovereign | `--arch-sovereign` | `#6ba8d4` (sky blue) | 🐉 |
| Guardian | `--arch-guardian` | `#1a3a5a` (dark navy) | 🛡 |
| Scout | `--arch-scout` | `#d47a5a` (coral) | 🏹 |
| Strategist | `--arch-strategist` | `#2a5a3a` (dark green) | ♟ |
| Creator | `--arch-creator` | `#d4a55a` (amber) | ✨ |
| Companion | `--arch-companion` | `#5aa89a` (teal) | 💗 |
| Sage | `--arch-sage` | `#d4c45a` (gold) | 🧘 |

## 3. THE 13-QUEEN + KING COUNCIL COLORS

| # | Queen | Token | Color | VETO? |
|---|---|---|---|:---:|
| 0 | Sovereign King | `--q-king` | `#c9a84c` (gold) | — |
| 1 | Aurelian | `--q-strategy` | `#10b981` (emerald) | — |
| 2 | Sophia Care | `--q-care` | `#06b6d4` (cyan) | **✅** |
| 3 | Justitia | `--q-compliance` | `#3b82f6` (blue) | — |
| 4 | Asteria | `--q-finance` | `#fbbf24` (gold) | — |
| 5 | Dominion | `--q-domain` | `#ef4444` (red) | — |
| 6 | Aleph | `--q-arcana` | `#a855f7` (purple) | — |
| 7 | Brain | `--q-brain` | `#3b82f6` (blue) | — |
| 8 | Proactive | `--q-proactive` | `#10b981` (emerald) | — |
| 9 | Bridge | `--q-bridge` | `#ec4899` (pink) | — |
| 10 | Distribution | `--q-distribution` | `#facc15` (yellow) | — |
| 11 | Council | `--q-council` | `#dc2626` (crimson) | — |
| 12 | Watch | `--q-watch` | `#991b1b` (dark red) | **✅** |

## 4. THE 4-TIER CASCADE COLORS

| Tier | Token | Color |
|---|---|---|
| T1 Edge | `--tier-1` | `#10b981` (emerald, fast) |
| T2 Tactical | `--tier-2` | `#3b82f6` (blue, general) |
| T3 Operations | `--tier-3` | `#a855f7` (purple, deep) |
| T4 Strategic | `--tier-4` | `#c9a84c` (gold, audit) |

## 5. TYPOGRAPHY

| Token | Family | Weight | Usage |
|---|---|---|---|
| `--font-display` | Space Grotesk | 600 | H1, H2, hero |
| `--font-body` | Space Grotesk | 400 | Body text |
| `--font-mono` | JetBrains Mono | 500 | Code, numbers, hashes, monospace |
| `--font-script` | Cormorant Garamond | 400 | "Ancient script" for the Sage archetype |

Loaded from: `https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Space+Grotesk&display=swap`

## 6. SPACING (8px grid)

| Token | Pixels | Usage |
|---|---|---|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Inline gaps |
| `--space-3` | 16px | Card padding |
| `--space-4` | 24px | Section padding |
| `--space-5` | 32px | Page padding |
| `--space-6` | 48px | Hero padding |
| `--space-7` | 64px | Major gaps |

## 7. BORDER RADIUS

| Token | Pixels | Usage |
|---|---|---|
| `--radius-sm` | 8px | Buttons, inputs |
| `--radius-md` | 12px | Cards, small panels |
| `--radius-lg` | 16px | Larger cards |
| `--radius-xl` | 24px | Hero boxes |
| `--radius-egg` | 50% 50% 50% 50% / 60% 60% 40% 40% | Translucent eggs (archetypes) |

## 8. SHADOWS

| Token | CSS | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.1)` | Subtle elevation |
| `--shadow-md` | `0 4px 8px rgba(0,0,0,0.15)` | Cards |
| `--shadow-lg` | `0 8px 24px rgba(201,168,76,0.15)` | Hero cards |
| `--shadow-glow` | `0 0 12px rgba(201, 168, 76, 0.4)` | Sovereign character, gold elements |
| `--shadow-glow-veto` | `0 0 12px rgba(153, 27, 27, 0.5)` | VETO queens (Sophia Care, Watch) |

## 9. ANIMATIONS

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--anim-fast` | 0.2s | cubic-bezier(0.4, 0, 0.2, 1) | Buttons, links |
| `--anim-normal` | 0.3s | cubic-bezier(0.4, 0, 0.2, 1) | Cards, modals |
| `--anim-slow` | 0.6s | cubic-bezier(0.4, 0, 0.2, 1) | Page transitions |
| `--anim-eggFloat` | 4s | ease-in-out | Translucent eggs (loop) |
| `--anim-glowPulse` | 3s | ease-in-out | Golden core glow (loop) |
| `--anim-heartbeat` | 2s | ease-in-out | Companion archetype (loop) |
| `--anim-crackOpen` | 1s | ease-out | Egg crack on hover |

## 10. Z-INDEX SCALE

| Token | Value | Usage |
|---|---|---|
| `--z-base` | 0 | Default |
| `--z-sticky` | 100 | Topbar |
| `--z-modal` | 1000 | Modals |
| `--z-toast` | 2000 | Notifications |
| `--z-tooltip` | 3000 | Tooltips |

## 11. THE 6 CARE DIMENSIONS (Maternal Covenant)

| # | Dimension | Color | Icon | Motto |
|---|---|---|---|---|
| 1 | Safety | `#10b981` (emerald) | 🛡 | "No harm" |
| 2 | Honesty | `#3b82f6` (blue) | 📖 | "No lies" |
| 3 | Privacy | `#a855f7` (purple) | 🔒 | "No leaks" |
| 4 | Fairness | `#fbbf24` (gold) | ⚖ | "No bias" |
| 5 | Growth | `#10b981` (emerald) | 🌱 | "No stagnation" |
| 6 | Consent | `#ec4899` (pink) | 🤝 | "No override" |

## 12. THE 8 LAYERS (L0-L7)

| Layer | Token | Color | What |
|---|---|---|---|
| L0 Identity | `--layer-0` | `#1a1a2e` (dark) | Ed25519, i-char ID, OrgKernel |
| L1 Execution | `--layer-1` | `#16213e` (darker) | SIGIL chain, action log |
| L2 Compliance | `--layer-2` | `#0f3460` (deeper) | 12 frameworks, OSCAL |
| L3 Council | `--layer-3` | `#533483` (purple) | 13-Queen + King BFT |
| L4 Distribution | `--layer-4` | `#e94560` (red) | 218 MCPs, PyPI/Smithery/Glama |
| L5 Sovereign Runtime | `--layer-5` | `#c9a84c` (gold) | SOV3, cascade, OLM, Big Braim |
| L6 Surface | `--layer-6` | `#f5f0e6` (cream) | 128 HTML pages, PWA, Next.js |
| L7 Experience | `--layer-7` | `#d4a853` (gold bright) | UE5, 5D Hive, 3D world |

## 13. CLAUDE DESIGN INTEGRATION

```yaml
# meok-design-system.yaml (for Claude Design import)
name: "MEOK Design System"
version: "1.0.0"
tokens:
  colors: { /* all the above */ }
  typography: { /* all the above */ }
  spacing: { /* all the above */ }
  animations: { /* all the above */ }
components:
  - name: "SovereignCard"
    - header: { bg: surface, text: text }
    - body: { padding: space-3 }
    - footer: { border-top: 1px solid border }
  - name: "QueenPill"
    - radius: radius-lg
    - shadow: shadow-md
    - hover: shadow-glow
  - name: "TranslucentEgg"
    - archetype: { /* 7 archetype colors */ }
    - shell: { /* gradient + glow */ }
patterns:
  - "Hero with sovereign character"
  - "Council pill grid (13 queens)"
  - "Temple card (3D globe + regulations)"
  - "i-character wizard (5 steps)"
  - "Status bar (12 live rows)"
prompt_templates:
  - "Build a [page type] for MEOK WORLD with the [queen] voice + [arcana] lens"
  - "Make this page feel like the [archetype] — translucent, sovereign, alive"
  - "Apply the MEOK design system: gold + cream + 7 archetype colors + 13-Queen council"
```

## 14. THE 30-SECOND PROMPT TEMPLATE

For any new MEOK page or component:

> "Build a [X] for MEOK WORLD. Use the gold + cream + 7 archetype palette. Show 13-Queen + King council pills. Add a live status bar (12 rows). Make it translucent + sovereign. Apply the Maternal Covenant (6 care dimensions). Add a CTA to the council chat. Add SIGIL signing. Apply CSP. Add OG + Twitter cards. Add FAQ schema. 6 locales (EN/ES/FR/DE/JA/ZH). PWA installable. The audience is the 8 personas (Developer, Founder, PM, Compliance, Security, Designer, Healthcare, Finance)."

## 15. THE 7-STEP BUILD FLOW (MEOK edition)

1. **Open Claude Design** (claude.ai/design)
2. **Import meok-design-system.yaml** (above)
3. **Add context** (meok-3d-characters/ refs, ichar.py, council_personality.py)
4. **Describe** (use the 30-second prompt template)
5. **Review** (the 3D temple OS, sovereign character, council)
6. **Refine** (chat with queens, inline comments, hover effects)
7. **Export** (Next.js component, React, Vue, Svelte, PWA install)

## 16. THE 5-PRINCIPLE CHECKLIST (every page)

- [ ] **Sovereign** — Defoneos-secured, no palantir, every action signed
- [ ] **Care** — Maternal Covenant, 6 dimensions visible
- [ ] **Live** — status bar polls every 30s
- [ ] **Sovereign character** — visible in LHS or center
- [ ] **CTA** — to council chat or i-character wizard

---

*Generated 2026-06-29 17:00 BST. The dragon flies sovereign. Going beyond. 🐉🔥*

**Compatible with:** Claude Design (Pro/Max/Team/Enterprise), Figma, Sketch, Adobe XD.
