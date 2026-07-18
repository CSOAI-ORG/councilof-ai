# 👵 Senior-friendly (70-year-old) punch-list — needs the RENDERED pass (browser tool was down)

Found via static CSS audit 2026-07-12. Each is a real legibility/tap-target concern. NOT fixed blind —
they need the visual loop to verify a size bump doesn't break the tuned layouts. One clean pass when the
browser recovers.

## Confirmed fine (no change)
- Primary body text: 16px (browser default, inherited) on the OS · 15px on connect/council/siri/alexa/embed. ✅ readable.
- No dead buttons / dead links anywhere (verified static). ✅
- Contrast: cream bg + near-black ink = high contrast. ✅

## To fix in the rendered pass (ranked)
1. **Dock chips `.sgg`** — `font-size:11px; padding:5px 9px` → bump to ~13px + `padding:8px 12px`. These are PRIMARY nav ("Connect to any AI", "Council", "Workspace"…). 11px + ~24px tap height is small for seniors (aim 44px). **Verify the dock still wraps cleanly on mobile after the bump.**
2. **9px badge label** (`z-index:3;font-size:9px`) → 11px min. Isolated overlay; low risk but verify it doesn't clip.
3. **10px micro-labels** (metric captions, uppercase eyebrows, `.sbh`) → 11–12px. Secondary text; verify no overflow in the metric chips.
4. **Workspace body 14px** → 15px for parity with the other surfaces (denser cockpit, so verify the 3-column grid still fits).
5. **Onboarding flow** — re-verify the Speak/Type → Work/Personal/Play → tour cards are large-tap + legible end-to-end for a first-time senior user (needs click-through).

## Method when browser is back
For each: bump → screenshot desktop + mobile (375px) → confirm no overflow/wrap regression → adjust → commit. Do NOT ship size changes without the before/after render.
