# Card inventory snapshot — 14 Oct 2026

**Dated snapshot, not a live count.** These figures describe one inventory scan of signed
measurement cards taken on 14 Oct 2026. They are not board totals and will not be updated
in place; the live count is always `/signed/card_index.json` and `/api/cards`.

| Figure (14 Oct 2026) | Value |
|---|---|
| Unique cards found (dedupe key: card id + content sha256) | 11,929 |
| With a VALID Ed25519 signature | 7,994 |
| Live on councilof.ai and verifiable (= `/signed/card_index.json` rows at scan time) | 335 |

## Method

- Scope: 8 of 9 storage locations scanned (live site, this repo, Hugging Face, Kaggle,
  RunPod pod disk, M4, M2, Oracle). RunPod network volumes were **not** scanned.
- Each card file was keyed by card id + content sha256; duplicates across locations count once.
- Each signature was checked against the published board key; rows that are NO_KEY or INVALID
  (many are test fixtures) are kept in the catalogue and flagged, not counted as VALID.
- Cross-check: GSPC `list_cards` reported 335 index rows, equal to the live location.
- Measurement framing only: these are counts of signed measurement records.

## Source summary (verbatim, 14 Oct 2026 14:34 BST)

    # Signed card catalogue — 14 Oct 2026 (8 of 9 locations scanned + GSPC cross-check)
    Dedupe key: card id + content sha256. Full list: catalogue.csv (extra `verify` column).
    
    | Location | Cards (unique) | Signature VALID |
    |---|---|---|
    | live | 335 | 335 |
    | repo | 8,283 | 7,987 |
    | hf | 3,976 | 3,773 |
    | kaggle | 2,453 | 2,413 |
    | runpod | 11,811 | 7,963 |
    | m4 | 11,126 | 7,987 |
    | m2 | 10,607 | 7,623 |
    | oracle | 10,215 | 7,348 |
    | **Unique total** | **11,929** | 7,994 |
    
    Live on site: 335 · VALID but not live: 7,659 · with signed_at: 5,773
    Only in one location: {'hf': 52, 'runpod': 680, 'oracle': 22}
    
    ## GSPC MCP cross-check (14:34 BST)
    list_cards: /signed/card_index.json declares 335 rows = live location 335. /api/cards counts 336 (the extra one is the cross-border East-West card, a different schema). board_totals: 23 axes, 23 measured.
    
    ## Still missing
    - RunPod network volumes: not scanned (no pod started, $0 spent).
    - Non-VALID rows (NO_KEY / INVALID, many are fixtures) are kept and flagged.
