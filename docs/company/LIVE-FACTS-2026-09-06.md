# Live facts, and which of them move

**Measured 2026-09-06, ~08:25 local. TUI-5.** Every row has the command that returns it.

The grant and company docs in this estate carry numbers stamped with an `as_of`. That is correct
practice and this file does not overwrite them. It exists because **a stamped number is still a
stale number to whoever pastes it into a form today**, and four of our headline figures moved in
under 24 hours.

## Re-fetch these before sending anything

| Figure | Stamped in docs | Live now | Δ | Command |
|---|---|---|---|---|
| Cards under the signed Merkle root | **168** @ 05 Sep 16:02 · **167** in VALUATION/DATA-ROOM | **166** @ 06 Sep 04:29 | −2 | `curl -s https://councilof.ai/root.json` → `.card_count` |
| Published doors | **292** (VALUATION) | **303** | +11 | `curl -s https://councilof.ai/.well-known/index.json` → `.doors \| length` |
| Public corrections | **46** | **47** | +1 | `curl -s https://councilof.ai/api/corrections` |
| Hub cells / measured | **691 / 761** (VALUATION) | **856 / 856** | +165 cells, ratio 90.8% → **100%** | `curl -s https://councilof.ai/api/hub-cards` → `.counts` |

## Safe to quote as-is

| Figure | Value | Why it is stable |
|---|---|---|
| Board axes | **22 axes · 22 measured · 0 unmeasured** | unchanged across every check this week; `/api/gspc` → `totals` |
| Signed card index | **335 / 335** (`n_cards == n_cells`) | locked by `BOARD-RULING.md`; do not clamp to 150 or 313 |
| MCP registry servers | **330** | third-party registry, changes only when we publish |
| Interchange formats | **372** | `interop/index.json`; all 372 resolve (F65) |

## Which direction is legitimate, and why

This matters more than the digits, because a reader who sees 168 in one document and 166 in
another will assume one of them is wrong. Both were right when stamped.

- **Root card count can go DOWN.** It fell 168 → 166 because cards get *retracted*. Correction
  `C-2026-0905-02` alone retracted 26 cards whose `signature` field held a digest. A falling root
  count is the corrections ledger working, not evidence loss — and it is the number most likely to
  embarrass someone who quotes a stale high value.
- **Corrections only go UP.** 46 → 47. That is the intended direction; the count is a measure of
  how much we have admitted, not of how much is broken.
- **Doors only go up** absent a deliberate removal. 292 → 303 includes 9 doors that existed on
  disk but were missing from the index, plus the removal of a self-referential `index` entry, both
  fixed 2026-09-06.
- **Hub cells go up as more third-party models are read.** Note this is *third-party models on the
  Hub*, explicitly **not** the CSOAI fleet — the endpoint says so in its own `population` field,
  and conflating the two would overstate our own coverage.

## One figure is now understated in our own valuation

`VALUATION-2026-09-05.md` scores "Prototype (technology risk)" — its **strongest** factor, £0.5M —
partly on `/api/hub-cards` → *"761 cells with 691 measured"*. That is now **856 cells with 856
measured, 0 unmeasured**, and `counts.indexes_unread` is empty with `read_so_far == cells`, so it
is a **complete census rather than a page** (the distinction that produced four wrong published
numbers on 2026-09-05, rule R5).

The valuation is **not** revised here. Re-scoring a Berkus factor on one improved input is a
judgement, the range was built from a stated method, and doing it silently in a refresher file is
exactly the kind of unreviewed number-moving this lane is supposed to catch. Flagged for whoever
next revises it, with the measurement attached.

## Provenance

Seven live requests, 2026-09-06 ~08:25 local, inside the ≤20/hour budget: `root.json`,
`signed/card_index.json`, `.well-known/index.json`, `api/gspc`, `api/corrections`,
`api/hub-cards` (×2). No number in this file was copied from another document.
