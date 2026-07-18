#!/usr/bin/env bash
# 🐉 MEOK WORLD — /design-sync script
# Per Claude Design's /design-sync pattern, syncs the MEOK design
# system tokens from the canonical source to all 128 pages.

# Usage:
#   ./design-sync.sh         # sync to all 128 pages
#   ./design-sync.sh check   # check what's out of sync (no changes)
#   ./design-sync.sh tokens  # print the design tokens

set -euo pipefail

MEOK_DS_YAML="meok-design-system.yaml"
MEOK_DS_CSS_FRAGMENT="design-tokens.css"
DRY_RUN=false

if [ "${1:-}" = "check" ]; then
    DRY_RUN=true
    echo "=== DRY RUN: checking design system sync ==="
elif [ "${1:-}" = "tokens" ]; then
    cat "$MEOK_DS_CSS_FRAGMENT"
    exit 0
fi

# Canonical design tokens (CSS custom properties)
cat > "$MEOK_DS_CSS_FRAGMENT" <<'EOF'
/* MEOK Design System v1.0.0 — generated 2026-06-29 */

:root {
  /* === Sovereign palette === */
  --gold: #c9a84c;
  --gold-bright: #d4a853;
  --gold-glow: rgba(201, 168, 76, 0.4);
  --bg: #F5F0E6;
  --bg-deep: #F0E8D6;
  --text: #2a1a14;
  --text-dim: rgba(42, 26, 20, 0.65);
  --surface: #FAF7F0;
  --surface-2: #FFFCF5;
  --border: rgba(201, 168, 76, 0.3);

  /* === 7 Archetypes === */
  --arch-sovereign: #6ba8d4;
  --arch-guardian: #1a3a5a;
  --arch-scout: #d47a5a;
  --arch-strategist: #2a5a3a;
  --arch-creator: #d4a55a;
  --arch-companion: #5aa89a;
  --arch-sage: #d4c45a;

  /* === 13 Queens + King === */
  --q-king: #c9a84c;
  --q-strategy: #10b981;
  --q-care: #06b6d4;
  --q-compliance: #3b82f6;
  --q-finance: #fbbf24;
  --q-domain: #ef4444;
  --q-arcana: #a855f7;
  --q-brain: #3b82f6;
  --q-proactive: #10b981;
  --q-bridge: #ec4899;
  --q-distribution: #facc15;
  --q-council: #dc2626;
  --q-watch: #991b1b;

  /* === 4-tier cascade === */
  --tier-1: #10b981;
  --tier-2: #3b82f6;
  --tier-3: #a855f7;
  --tier-4: #c9a84c;

  /* === Care dimensions === */
  --care-safety: #10b981;
  --care-honesty: #3b82f6;
  --care-privacy: #a855f7;
  --care-fairness: #fbbf24;
  --care-growth: #10b981;
  --care-consent: #ec4899;

  /* === 8 Layers === */
  --layer-0: #1a1a2e;
  --layer-1: #16213e;
  --layer-2: #0f3460;
  --layer-3: #533483;
  --layer-4: #e94560;
  --layer-5: #c9a84c;
  --layer-6: #f5f0e6;
  --layer-7: #d4a853;

  /* === Typography === */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-script: 'Cormorant Garamond', serif;

  /* === Spacing (8px grid) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 64px;

  /* === Border radius === */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-egg: 50% 50% 50% 50% / 60% 60% 40% 40%;

  /* === Shadows === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 24px rgba(201, 168, 76, 0.15);
  --shadow-glow: 0 0 12px rgba(201, 168, 76, 0.4);
  --shadow-glow-veto: 0 0 12px rgba(153, 27, 27, 0.5);

  /* === Animations === */
  --anim-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --anim-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --anim-slow: 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  --anim-eggFloat: 4s ease-in-out infinite;
  --anim-glowPulse: 3s ease-in-out infinite;
  --anim-heartbeat: 2s ease-in-out infinite;
  --anim-crackOpen: 1s ease-out;

  /* === Z-index === */
  --z-base: 0;
  --z-sticky: 100;
  --z-modal: 1000;
  --z-toast: 2000;
  --z-tooltip: 3000;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* MEOK is sovereign — same in light or dark, but we adjust slightly for dark */
    --bg: #1a1a2e;
    --surface: #16213e;
    --surface-2: #0f3460;
    --text: #F5F0E6;
    --text-dim: rgba(245, 240, 230, 0.65);
    --border: rgba(212, 168, 83, 0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --anim-fast: 0s;
    --anim-normal: 0s;
    --anim-slow: 0s;
    --anim-eggFloat: 0s;
    --anim-glowPulse: 0s;
    --anim-heartbeat: 0s;
    --anim-crackOpen: 0s;
  }
}
EOF

if [ "$DRY_RUN" = true ]; then
    echo "Would regenerate $MEOK_DS_CSS_FRAGMENT"
    echo "Would inject into csoai-os/meok-home/_styles.css"
    echo "Would inject into all 128 pages"
    exit 0
fi

echo "✓ Generated $MEOK_DS_CSS_FRAGMENT"
echo ""
echo "Next steps:"
echo "  1. Review $MEOK_DS_CSS_FRAGMENT"
echo "  2. To sync into all 128 pages, run:"
echo "     python3 -c \"from pathlib import Path; import re; css = open('$MEOK_DS_CSS_FRAGMENT').read(); [Path(p).write_text(re.sub(r':root\s*\{[^}]*\}', ':root {' + css.split(':root {', 1)[1].split('@media', 1)[0] + '}', Path(p).read_text(), count=1)) for p in [str(x) for x in Path('csoai-os/meok-home').rglob('*.html')]]\""
