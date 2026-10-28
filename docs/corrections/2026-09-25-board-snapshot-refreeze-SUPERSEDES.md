# Correction 2026-10-28: the board frame in the 2026-09-25 refreeze note is superseded

**CSOAI — Council for Secure and Open AI. Correction dated 28 October 2026; published
28 October 2026.** Register id GAP-REGISTER-2026-10-26#A19.

**Supersedes, never rewrites:** `docs/corrections/2026-09-25-board-snapshot-refreeze.md` is not
edited. It is dated evidence, it was accurate on its date, and a reader who saw it must still be
able to see it. This note stands beside it and names what it corrects; everything else in the
25 September correction stands.

---

## What the 25 September note said

Under *What was stale*:

> Live `GET /api/gspc` is **23 axes · 23 measured · 0 unmeasured**.

and under *Since when*:

> | 2026-09-25 | Superseded by a new dated freeze (this correction) | this lane |

The correction itself was right: the signed snapshot `public/signed/gspc-board.signed.json` said
22 axis · 22 measured while the live board said 23 · 23, so `/api/state` published
`signed_snapshot_agrees: false` and the flagship board had no current signed snapshot. It named the
signed snapshot as stale and replaced it with a new dated freeze. That finding does not change.

## What is wrong with it now

Only the board frame it quoted, and only as a description of the board *today*.

Live `GET /api/gspc` on **2026-10-28** reports `totals.public_count` = **"33 axes · 23 measured"**:
33 published axes, of which **23** carry a run and **10** are declared slots with no run behind
them. The "0 unmeasured" part is also gone — a declared slot exists precisely so the gap is
visible.

The 25 September note said "23 axes · 23 measured · 0 unmeasured" because on that date the board
carried 23 slots, all 23 measured, and no declared gaps. The note was true when written. Quoting it
now, without its date, tells a reader the estate measures 23 axes across a 33-axis board — a
statement the live board no longer supports in either direction.

This is the third artefact in a set of three that carries the same frame; the others are
`docs/tui4/gap-register-2026-10-07-probe-1108Z.json` and
`measurement/ietf-audit-live-readback-2026-10-01.json`. All three are dated, so all three are
superseded rather than edited.

## What changes, and what does not

- **Changes:** the board frame quoted in the 25 September note is superseded. Read the live board
  at `GET /api/gspc` → `totals.public_count`; do not copy a count out of a dated correction.
- **Does not change:** the refreeze correction itself. `public/signed/gspc-board.signed.json` stays
  byte-for-byte (sha256 `9b892fbe…d34b`, content_id `72ba8a33…cb10`) and still verifies. The new
  signed freeze `public/signed/gspc-board.2026-09-25.signed.json` is still the dated freeze of that
  date. The days-out-of-agreement analysis (16–25 September stale, reliance withdrawn from 4
  September) stands as it was written.
- **Does not change:** any measurement card, any signature, or any published root.

## The count grammar, restated because this is where it bites

The board's axis count and its measured count are **two different numbers**, and neither is a
verdict. 33 axes are on the board; 23 of them carry a measurement and 10 are declared slots with
no run behind them. The larger number counts slots, the smaller counts measurements — **quote both
or quote the smaller**. A published slot is not evidence that anything has been measured. A
measurement is not a separated leader either: separation is a third state, and on 2026-10-28 the
board read "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED".

TIE is not a win. UNTESTED is not a tie. UNMEASURED is an answer, never a zero.

## How it was checked

`GET https://councilof.ai/api/gspc` on 2026-10-28 → `totals.public_count` = "33 axes · 23
measured", `totals.axes` = 33, `totals.measured_axes` = 23, `totals.unmeasured_axes` = 10. The same
figure is served over the SSE door `GET /api/agui/gspc-state`, whose `public_count` reads "33 axes ·
23 measured" with the same count_grammar attached.

## Pointers

- Superseded document (unchanged): `docs/corrections/2026-09-25-board-snapshot-refreeze.md`.
- This correction: `docs/corrections/2026-09-25-board-snapshot-refreeze-SUPERSEDES.md`.
- Live board: <https://councilof.ai/api/gspc>.
- Register: `measurement/consolidation/2026-10/GAP-REGISTER-2026-10-26.md`, gap A19.
- Index of supersessions: `public/corrections/SUPERSESSIONS.md`, which points to this note.

CSOAI measures. This corrects one of our own sentences. It is not a certification, and it grades
nothing.
