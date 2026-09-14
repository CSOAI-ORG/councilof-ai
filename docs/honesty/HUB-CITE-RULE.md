# Hub cite rule (additive honesty — OPP-20260914-10 / OPP-20260914-05)

**LIVE authority only:** `GET https://councilof.ai/api/hub-cards`

Quote `counts.cells` / `counts.measured` / `counts.unmeasured` from the response.
This stamp (example, not frozen): **131 / 131 / 0** · `counts.complete=true` · `indexes_all_read=true`.

## Forbidden
- Typed Hub triples in generators/printers: `1191/1191/0`, `1185/1185/0`, `1182/1182/0`, `1056…`, `900…`
- Fusing Hub with board (`22·22·0`), root `card_count`, or signed `card_index`

## Required printer language
`Hub cards: GET https://councilof.ai/api/hub-cards → quote counts.cells/measured/unmeasured LIVE (no typed Hub triple)`

## Populations (never fuse)
| Population | Authority |
|---|---|
| Board | `GET https://councilof.ai/api/gspc` → `totals.lid` / `totals.public_count` |
| Hub (third-party) | `GET https://councilof.ai/api/hub-cards` → `counts.*` |
| Root | `GET https://councilof.ai/root.json` → `card_count` |
| Signed card_index | living signed index — not Hub |

Measurement, never certification.
