# Correction 2026-10-28: the board frame in the 2026-10-07 TUI-4 probe is superseded

**CSOAI — Council for Secure and Open AI. Correction dated 28 October 2026; published
28 October 2026.** Register id GAP-REGISTER-2026-10-26#A19.

**Supersedes, never rewrites:** `docs/tui4/gap-register-2026-10-07-probe-1108Z.json` is not edited.
It is a dated run artefact — a seeded run captured at 2026-10-07T11:08:00Z — and it was accurate
when it was captured. A reader who saw it must still be able to see it. This note stands beside it
and names what it corrects; every other observation in that run stands.

---

## What the probe said

In `blocks[0].probes.api_agui_gspc_state`:

```json
{
 "url": "https://councilof.ai/api/agui/gspc-state",
 "http_status": 200,
 "state": "VERIFIED",
 "transport": "SSE STATE_DELTA",
 "public_count": "23 axes · 23 measured"
}
```

The probe was `VERIFIED` and it was correct: the door answered HTTP 200 and served an SSE
`STATE_DELTA`, and the `public_count` in that delta was "23 axes · 23 measured" on 2026-10-07.

## What is wrong with it now

Only the `public_count` string, and only as a description of the board *today*.

Live `GET /api/agui/gspc-state` on **2026-10-28** serves a `STATE_DELTA` whose
`/gspc` value carries `public_count` = **"33 axes · 23 measured"**, with the count grammar
attached: 33 axes are on the board, 23 of them carry a measurement and 10 are declared slots with
no run behind them.

The probe's frame was true on its capture date. Quoted now, without its date, it tells a reader
the board carries 23 axes — when it carries 33 published axes and measures 23 of them. A probe is
the strongest form of dated evidence the estate has: it is a recorded read of a live door. Which
is exactly why it must not be edited into agreement with a later board.

This is one of three artefacts carrying the same frame; the others are
`docs/corrections/2026-09-25-board-snapshot-refreeze.md` and
`measurement/ietf-audit-live-readback-2026-10-01.json`.

## What changes, and what does not

- **Changes:** the `public_count` recorded in that probe run is superseded. Read the door at
  `GET /api/agui/gspc-state`; do not copy a count out of a dated run.
- **Does not change:** the probe's other observations. `well_known_mcp_json`, the npm
  `csoai-gspc-mcp` version baseline, and the registry probes recorded their own answers on
  2026-10-07 and are not affected by the board moving since.
- **Does not change:** the run's timestamp, its branch, its schema, or its byte content. It is a
  dated run and it stays a dated run.

## The count grammar, restated because this is where it bites

The board's axis count and its measured count are **two different numbers**, and neither is a
verdict. 33 axes are on the board; 23 of them carry a measurement and 10 are declared slots with
no run behind them. The larger number counts slots, the smaller counts measurements — **quote both
or quote the smaller**. A published slot is not evidence that anything has been measured.

TIE is not a win. UNTESTED is not a tie. UNMEASURED is an answer, never a zero.

## How it was checked

`GET https://councilof.ai/api/agui/gspc-state` on 2026-10-28 → SSE `STATE_DELTA`, `delta[0].value.public_count`
= "33 axes · 23 measured", with `count_grammar` naming the two numbers as two numbers. The same
figure comes from `GET https://councilof.ai/api/gspc` → `totals.public_count`.

## Pointers

- Superseded document (unchanged): `docs/tui4/gap-register-2026-10-07-probe-1108Z.json`.
- This correction: `docs/tui4/gap-register-2026-10-07-probe-1108Z-SUPERSEDES.md`.
- Live board: <https://councilof.ai/api/gspc>. Live probe door: <https://councilof.ai/api/agui/gspc-state>.
- Register: `measurement/consolidation/2026-10/GAP-REGISTER-2026-10-26.md`, gap A19.
- Index of supersessions: `public/corrections/SUPERSESSIONS.md`, which points to this note.

CSOAI measures. This corrects one of our own sentences. It is not a certification, and it grades
nothing.
