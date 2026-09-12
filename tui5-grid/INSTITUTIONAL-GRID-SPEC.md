# TUI 5 — Institutional Grid Specification

## Rows: Subjects
- 156 model families (Qwen, Llama, DeepSeek, etc.)
- 425 financial assets (stablecoins, tokenized funds)
- Badge per row: INDEXED | MEASURED | SIGNED | ROOTED | ANCHORED | UNCHECKABLE

## Columns: Axes × Evidence State
- 14 behavioral axes: governance, safety, jail, affect, care, openness, provenance, continuity, conformance, cross-reality, detector-interop, machinery-conformity, art5-safeguard, swarm
- 8 financial axes: provenance-controls, reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, ai-adoption-components, labour-components, humanoid-labour-index

## Filters
Model family | Axis | Regulation | Evidence state | Date range | Provider

## Expandable Detail (per cell)
Card ID, accuracy, Wilson CI, model revision, run_id, measured_at, signature state, regulatory provisions, limitations

## Coverage Colors
- Green: MEASURED + SIGNED
- Yellow: MEASURED unsigned
- Orange: INDEXED only
- Gray: UNCHECKABLE

## Financial Rail View
Supply by chain, tokenized fund holdings, XRPL assets, SWIFT targets, x402 activity

## Data Sources
- /api/gspc (board totals)
- /api/cards (living cards)
- /signed/card_index.json (335 historical)
- public/interop/mill-cards-signed/ (1,493 mill cards)
- tui2-catalog/financial-catalog-20260912.json (425 assets)
