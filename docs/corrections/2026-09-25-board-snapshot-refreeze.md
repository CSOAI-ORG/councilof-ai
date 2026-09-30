# Correction 2026-09-25: the signed board snapshot was stale, and its custody line overstated separation

**Lane:** `board-refreeze-20260925` · **Supersedes, never rewrites:** `public/signed/gspc-board.signed.json` stays byte-for-byte as it is (sha256 `9b892fbe…d34b`, content_id `72ba8a33…cb10`). It still verifies.

## What was stale

`/api/state` → `board.live_derivation_crosscheck` compared the live board with one hard-coded
signed file, `public/signed/gspc-board.signed.json`. That file says **22 axis · 22 measured**
(`as_of` behavioural 2026-08-12 · jail 08-18 · financial 08-25). Live `GET /api/gspc` is
**23 axes · 23 measured · 0 unmeasured**. So `/api/state` published `signed_snapshot_agrees: false`,
claim state `SUPERSEDED_KNOWN_CLAIM_DEFECT`, "do not file". The flagship board had no current
signed snapshot.

## Since when

| Date | What changed | Evidence |
|---|---|---|
| 2026-09-02 | The MPC freeze was signed and landed, 22 · 22, agreeing with the live board of that date | ceremony C-2026-0902-09; commit `3b3f3706d` |
| 2026-09-04 | Reliance withdrawn for two claim defects inside the signed bytes (the financial-run signature overclaim, and historical leader notes shown as current). Counts still agreed | commit `e614ec1cf`; status file `known_claim_defects` |
| 2026-09-16 | Slot 23 (effect-binding) was added as a declared slot. From then on the counts disagreed: 23 live slots against 22 in the file | commit `03fa1aa80` |
| 2026-09-22 | Slot 23 became MEASURED. Live board 23 · 23 | commit `dba6efea6` |
| 2026-09-25 | Superseded by a new dated freeze (this correction) | this lane |

So the counts were stale for 9 days (16 to 25 Sep) and reliance had been withdrawn for 21 days (4 to 25 Sep).

## What supersedes it

`public/signed/gspc-board.2026-09-25.signed.json` is a new file. Nothing was edited.

- **Body:** the output of `scripts/gspc-board-snapshot.mjs`, which runs the real
  `onRequestGet` of `functions/api/gspc.ts` against the committed axis arrays at source commit
  `ac8b636176db9d37b2fe6e976b0ea2fd1d16189a`, with an empty env. The counts come from the same
  code path `/api/gspc` serves. Nothing typed them. The body matches a live fetch of `/api/gspc`
  with `site_attestation` removed, except for `measured_on.living_stamp`. The edge re-signs that
  block with the Pages secret, and the unkeyed snapshot carries the fallback block instead. The
  new status file records this.
- **Signature:** `board_attestation` signs a compact payload, 1,625 bytes. The signer caps
  payloads at 3 KB and the board is about 57 KB. The payload pins the body:
  `snapshot_content_id = sha256(canonical(file minus board_attestation))`
  = `ea7b74992bcb8b83c2dbc75675558df0231228140b29e8ad8b0a321b508f9d78`. It repeats the body's
  totals, and the producer refuses to sign if the two copies differ. The payload sha256 is
  `0156c9f2bb8b35d5427a6a5b38fa598a2d30bc525a30b9b3d65a0293c591f66a`. The signer is
  `did:web:csoai.org#board-attestation-1` via `POST /api/board-sign` (caller: pod token),
  `signed_at` 2026-09-25T11:08:00.927Z.
- **File sha256:** `6fd7aae06499bbd677e10177b5897869223072f37f3ae75dedd0e9d51f0c91ad`.
- **Verified:** on oracle-micro-2 with `node scripts/gspc-board-verify.mjs <file> --did did.json`,
  which anchors the key to the DID document. Verified a second time on the Mac with Python
  `cryptography` and no estate code: the content id matches, the payload hash matches, and
  Ed25519 verifies under the `#board-attestation-1` key in `https://csoai.org/.well-known/did.json`.
- **Tamper controls, all rejected:** payload `measured_axes` − 1, a trailing byte, body
  `measured_axes` − 1 (content id mismatch), body and payload both edited, a payload edit with
  its hash recomputed (signature fails), and the key swapped for the MPC key (DID anchor fails).
- **Timestamp:** `gspc-board.2026-09-25.signed.json.ots` was submitted to four calendars. It is
  **PENDING**, which is a request and not evidence. It becomes a Bitcoin attestation only once
  `scripts/ots-upgrade.py` returns one.

`public/signed/gspc-board.status.json` now says `SUPERSEDED_BY` and points to the new file.
It keeps its `known_claim_defects` list, because those defects are still true of the old
bytes, and adds a history of the state changes.

## The check that stops this recurring silently

`functions/api/_board_snapshot.ts` lists every freeze and picks the **newest by `frozen_at`**,
read from each status document and never from list order. It compares that freeze's totals
with the live derivation. `/api/state` and `/api/counters` both publish this one comparison. A
superseded freeze appears in `history`. `agrees` requires matching counts **and** a status of
`CURRENT`. The next time the axis arrays change, `signed_snapshot_agrees` goes false by itself,
and the fix is a new dated freeze.
`functions/api/_board_snapshot.test.ts` includes a deliberately stale newest snapshot (22 · 22)
that must report disagreement. With the count check disabled, that test fails as it should.

## Custody: what each key actually is

- **`#board-attestation-1` (new freeze):** one Ed25519 key. It is held as the Cloudflare Pages
  secret `BOARD_SIGN_KEY_PKCS8_B64` on project `councilof-ai` and used only inside
  `/api/board-sign`. The key is on no estate machine. Callers authenticate with a bearer token
  (the pod token) or GitHub OIDC. **Anyone holding the pod token can get a signature.** This is
  not MPC and not threshold, and the file says so in its signed payload.
- **`#gspc-board-22axis-2026` (MPC freeze):** the signed bytes say "3-party MPC (Coinbase cb-mpc,
  Ed25519 additive), owner's own Oracle tenancy". Checked read-only on oracle-micro-2 on
  2026-09-25: the custody service is running (`python3 -m custody.service`, loopback
  `127.0.0.1:8731`, up since 2026-09-02, `/health` ok). **All three shares are in one directory
  on one host** (`custody-store/keys/gspc-board-22axis-2026/share_{0,1,2}.blob`) and one process
  uses them. That is one failure domain. The 2-of-3 split in the host's `CEREMONY.md`, with one
  share moved off the host, has not been done: no `board-2of3` store exists. "Multi-party" is a
  property of the signing protocol, not separated custody. That the helper never assembles a
  whole private key is its design claim, and this correction did not audit it. The status file
  now records this as `CUSTODY_SEPARATION_OVERCLAIM`. The producer's custody text
  (`scripts/gspc-board-sign.mjs`) is corrected so that a future MPC freeze cannot repeat it.

## Why not re-sign through the MPC custody

The signer can be reached, but re-signing is a key ceremony, and ceremonies belong to the owner.
Doing it would also put a 23-axis snapshot under a key named `22axis`. This lane signs a new
file under a different key and states that key's custody plainly. Earlier ledger text said the
3 KB board-sign path "cannot carry this snapshot". That was true of signing the whole body. It
does not apply to signing a digest that pins the body, which is what was done here.

## Left for the owner or a landing lane

- **Owner:** decide whether a board freeze under a single-key Pages secret is acceptable as
  the current signed snapshot. The previous policy text said "owner MPC ceremony".
- **Owner:** carry out the MPC share split (CEREMONY.md), or retire the "3-party" wording
  everywhere it still appears in served text: the `/api/corrections` entries C-2026-0902-09 and
  the entry after it, and `llms-full.txt`.
- **Landing lane:** deploy, then run `scripts/ots-upgrade.py` until the proof is Bitcoin-attested.
- **Not changed:** `scripts/regulatory-inventory-gate.mjs` still derives "22 GSPC axes" from the
  2026-09-02 freeze and `public/interop/regulatory-inventory.json` (`gspc_axes: 22`). That count
  is stale in its own right and needs its own lane.
- **Pre-existing, not caused here:** `scripts/council-runtime-truth-gate.mjs` fails on master at
  line 1200 (`functions/api/growth-loops.ts` carries `@openapi-retired`, not
  `@openapi-unavailable`). With that one check skipped, the gate passes, including the new board
  assertions.
