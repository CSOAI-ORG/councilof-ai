# `xdc.document.state` surface — XRP money / XDC documents / one root — 1 Sep 2026

**Status:** Grammar + leftover docs. Additive schema enum already on card-v0. **No live XDC writer from this leftover.**  
**Locks:** Board **22 · 15 · 7**. Never MEASURED board fill. Never certify. One root. No second writer.

---

## Division of labour

| Rail | Role |
|---|---|
| **XRP / XRPL** | Money / asset-state — live `xrpl.asset.state` / `xrpl.basket.root` (reader; `writes_board: false`) |
| **XDC** | **Documents** — document-state evidence leaf `xdc.document.state` |
| **One root** | Same `public/root.json` indexes both (and GSPC / COBOL / OTel / …) |

Do not fuse money TVL and document-state into one sold rank.

---

## Outer envelope (unchanged)

`schema · surface · subject · as_of · source_urls · payload · sha256 · unmeasured[] · sig_ed25519?`

`surface` = `xdc.document.state`.

---

## Payload profile (nest only)

```json
{
  "document_id": null,
  "document_hash": null,
  "venue": "xdc",
  "state": "declared",
  "honesty": {
    "not_a_certification": true,
    "not_a_rating": true,
    "not_advice": true,
    "board": "GET /api/gspc is authority — 22·15·7"
  },
  "note": "Document-state evidence leaf. Not MEASURED board fill."
}
```

Hard cap: **3072** bytes on canonical payload (`ensure_ascii=False`, sorted keys). Gaps → outer `unmeasured[]` by name.

---

## Example (unsigned — not a mint)

```json
{
  "schema": "https://councilof.ai/schema/card-v0.json",
  "surface": "xdc.document.state",
  "subject": "XDC document-state — example unsigned (not a mint)",
  "as_of": "2026-09-01T00:00:00Z",
  "source_urls": ["https://councilof.ai/schema/card-v0.json"],
  "payload": {
    "document_id": null,
    "document_hash": null,
    "venue": "xdc",
    "state": "declared",
    "honesty": {
      "not_a_certification": true,
      "not_a_rating": true,
      "not_advice": true,
      "board": "GET /api/gspc is authority — 22·15·7"
    },
    "note": "Document-state evidence leaf. Not MEASURED board fill."
  },
  "sha256": "<hex of canonical payload>",
  "unmeasured": ["document_id", "document_hash", "sig_ed25519"],
  "sig_ed25519": null
}
```

## Out of scope

- Live XDC adapter / CloudFront billing  
- Stamping MEASURED from a document registry listing  
- Cobalt edits  

*End. One root. Europe/London. 1 Sep 2026.*
