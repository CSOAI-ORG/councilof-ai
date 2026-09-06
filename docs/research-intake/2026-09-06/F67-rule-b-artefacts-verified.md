# F67 — the three Rule B artefacts DO verify. My premise was wrong.

I filed F67 as *"published, signed, and — as far as this sweep can tell — never independently
verified by anything."* **All three verify.** Here is the work, including the three times I nearly
published a false negative about our own files.

## Result

| Artefact | Signer | Verdict |
|---|---|---|
| `arena_scoreboard.json` | `#card-attestation-1` | **VALID** — `content_id` recomputes with `canon.py`; Ed25519 over the content_id as ASCII hex |
| `eat_compliance_board.json` | `#card-attestation-1` | **VALID** — same |
| `gspc-board.signed.json` | `#gspc-board-22axis-2026` | **VERIFIED**, exit 0, by its own published script `scripts/gspc-board-verify.mjs` |

The board's key is `d573a721…`, **3-party MPC** (Coinbase cb-mpc, Ed25519 additive) — confirmed
independently against the DID document, not taken from the file.

## Three near-misses, on one artefact

Each would have been a public claim that our own signed file is unsigned.

1. **"`gspc-board.signed.json` has no signature field."** Its top-level keys carry a prose
   `custody_attestation` and no `signature`. **Wrong** — the signature is nested.
2. **"The custody attestation names a signer and a `content_id` but carries no signature."** I
   walked the object for `sig` / `signature` / `sig_ed25519`. **Wrong** — the field is **`sig_b64`**,
   base64 rather than hex, so a hex-shaped pattern missed it.
3. **"The signature does not verify."** Three preimage guesses failed. **Wrong** — the artefact
   publishes `verify: node scripts/gspc-board-verify.mjs <this file>`, and that script returns
   `VERIFIED`, exit 0. **The file told me how to check it and I guessed instead.**

The lesson is narrower than "be careful": **an artefact that publishes its own verification recipe
should be checked with that recipe before any conclusion is drawn from a hand-rolled one.** That is
E-T5-04 again — a null result is not a finding until the method is shown to work on a known case.

## The real gaps, now that the premise is gone

**Nothing runs `gspc-board-verify.mjs`.** No workflow references it. A verifier exists, is published
on the artefact, works, and is enforced by nobody — the fourth instance today of *real but ungated*,
after the doors index, the EMILIA vector pin and the published bundle.

**`arena_scoreboard` and `eat_compliance_board` publish no verification recipe at all.** No `verify`,
no `sig_input`, no `preimage_rule`. I established their rule by trial: `content_id` is
`sha256(canon.cjson(doc minus signature))`, and the Ed25519 signature is over **the content_id as
ASCII hex** — not over the preimage, and not over the digest bytes. **A reimplementer would not
guess that**, and the two artefacts that document nothing are the two I had to reverse-engineer.
`gspc-board.signed.json`, which documents everything, took one command.

## Rows

| id | Row | PROOF |
|---|---|---|
| F68 | Gate `scripts/gspc-board-verify.mjs` in `pr-gates` — a working published verifier that nothing runs | `grep -rn gspc-board-verify .github/workflows/` → currently empty |
| F69 | Publish the Rule B recipe on `arena_scoreboard` and `eat_compliance_board`: `sig` is Ed25519 over the **ASCII hex** of `content_id`, which is `sha256(canon.cjson(doc − signature))` | each file carries `verify` / `sig_input` |
| F70 | Extend `verify-estate.mjs` to cover Rule B, so one reference verifier covers both families | script verifies 335 cards + root + 3 Rule B artefacts |

_Verified 2026-09-06. Keys taken from the DID document on `csoai.org`, never from the artefact
being checked._
