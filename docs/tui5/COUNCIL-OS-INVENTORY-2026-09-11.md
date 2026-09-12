# Council OS UI Inventory — 11 September 2026

## Existing Board UIs (3 — consolidate, don't rebuild)
1. `spaces/gspc-board/index.html` — standalone HTML (HF Spaces), 50KB
2. `client/src/pages/GspcScoreboard.tsx` — React (40KB, /gspc-scoreboard)
3. `client/src/pages/MeasurementBoard.tsx` — unified 7-set (56KB, /board)

## Shared Components
- `DenseBoard.tsx` (10KB) + `LiveLeaderboard.tsx` (17KB) — reusable board table
- `GspcTerminal.tsx` (21KB) — interactive dashboard centrepiece
- `BoardAttestation.tsx` (20KB) — living attestation tables

## Financial Rails (already built)
- `SwiftReaderRail.tsx` — 26-bank census
- `XrplReaderRail.tsx` — 16 XRPL assets
- `FinancialAxes.tsx` — 8 financial axes
- `rlusd-dashboard.html` — standalone RLUSD cross-chain

## Visualization
- `Globe.tsx` — interactive 3D globe
- `GSPCGapMap.tsx` — 349-provision gap map
- `SpectrumView.tsx` — 8-lens spectrum
- `BranchView.tsx` — simulation divergence

## Badge/Widget System
- Dynamic SVG generator (`/badge/gspc.svg`)
- White-label embed (`embed.js` with shadow DOM)
- Chrome extension with offline verify
- 21 static badge SVGs (frameworks + verify)

## Key Insight
All UI infrastructure exists. TUI 5 = consolidate and wire, not build new.
