# Owner rulings — excerpts for csoai.ruling/0.1 backfill (29 Sep 2026)

Copied byte-for-byte from the lanes owner-rulings log (OWNER-RULINGS-20260928.md) on 2026-09-29.
Where a line is cut, the cut is marked [...]; text naming internal codenames is omitted, never reworded.
These are the sources the backfilled ruling records quote. Records cite this file by commit and sha256.

## E1 end-user-first directive

- 2026-09-28T14:50Z OWNER DIRECTIVE: focus on the PUBLIC END USER and on higher quality and higher results in everything.

## E2 SovX public name

- 2026-09-28T15:30Z OWNER RULING: "SovX" MAY be used publicly as the product name for the wrapper (Venturi) wrapped-asset measurements. Do not strip it. [... two sentences naming internal codenames omitted ...]

## E3 withdraw Paddle

- 2026-09-29T04:00Z OWNER RULING: "withdraw Paddle". Land held commit 88a475f0e from lane/charter-academy-20260928, which withdraws the paid Paddle certificate issuer and retires /api/certificate-schema (410 or withdrawn body; schema csoai.completion-record/0.1), in the next landing. After it deploys, the owner disables the Paddle webhook destination in the Paddle dashboard.

## E4 mint the DOIs

- 2026-09-29T05:20Z LAND (doi-mint-20260929, owner-approved 29 Sep "yes mint all 4 DOIs") [...]

## E5 jail TIE -> UNTESTED

- 2026-09-29T06:40Z OWNER RULING: jail axis moves from TIE to UNTESTED at the next re-sign.
  Basis: the prompt-level recompute on lane/jail-count-fix-20260929 @ 0c9e93d11, where the separation is not established over 27 distinct prompts.
  The next integrator lands that branch, applies the state change through the normal signing path (POST /api/board-sign with the pod caller token), and records C-2026-0929-02 in the signed corrections ledger with old and new values.
  Never hand-edit signed bytes.

## E6 chat-ruled items with no line in the log

- adopt the router winners: the owner words "adopt the winners" are recorded in commit 08d03825f (message and scripts/reg-watch-policy.mjs header).
- publish SovX: listed as an owner ruling in the 29 Sep ruling-records brief. No first-hand record of the owner words was found in the log, the lane notes or the alignment notes; the record says UNRECORDED.
- adopt ruling records: the owner words "adopt the ruling records" (29 Sep 2026), relayed in the ruling-records lane brief.
