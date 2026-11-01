# Correction: the witness pointer's DRIFTED verdict was a true observation of the pre-deploy root

**CSOAI — Council for Secure and Open AI. Correction dated 28 October 2026; published
28 October 2026.** Register id GAP-REGISTER-2026-10-26#A11.

**Supersedes, never rewrites:** the `drift` block of
`public/interop/root-witness-pointer.json` as it stood at `as_of 2026-10-27T23:47:31Z`
(`drift.checked_at 2026-10-27T23:47:33Z`, `drift.status DRIFTED`,
`drift.live_root_sha256 3bab85baa5ef…`). The earlier observation is reproduced verbatim
below and is not edited out of the record. What changes is that the pointer now carries a
**recomputed** drift observation, and this note says what the earlier one was.

---

## What the pointer said

From the served `https://councilof.ai/interop/root-witness-pointer.json`, before this
correction:

> `"live_root": { "sha256": "e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea",
> "bytes": 25925, "merkle_root": "a2620ac322c562b64f6b4935b283177d7cb7ada374eee100992f1b68c8539538",
> "card_count": 325, "as_of": "2026-10-27T21:20:49Z" }`
>
> `"drift": { "status": "DRIFTED", "checked_at": "2026-10-27T23:47:33Z",
> "live_root_sha256": "3bab85baa5ef56f7d4ae72a826240a392d609e57ba314115cf0da0f65e0c8847",
> "live_root_merkle_root": "050b199f47958d56c450999aa9d1087fca18b528bad510176f2a8dad1863a4e0",
> "match_sha256": false, "match_merkle_root": false }`

Two blocks of the same file, two seconds apart, two different answers to "which bytes are
live". The pointer's own note says: *"Drift is an observation at checked_at, not a standing
all-clear."* The gap register (A11) was right that this leaves a reader to work out which is
current.

## What is wrong with it

**Nothing about the observation was wrong.** `3bab85baa5ef…` was the live root at
`2026-10-27T23:47:33Z`, and the DRIFTED verdict was correct at that instant. The timeline,
read off this repository's own history, says why:

| when | what | root |
|---|---|---|
| `2026-10-27T20:21:17Z` | master carried the root `3bab85ba…` (`as_of 2026-10-27T16:37:49Z`, merkle `050b199f…`) — commit `3dbe33019`, PR #3543 | `3bab85ba…` |
| `2026-10-27T23:47:31Z` | the publisher witnessed the **next** root `e9fb00e2…` (`as_of 2026-10-27T21:20:49Z`, merkle `a2620ac3…`) and wrote the pointer | pointer names `e9fb00e2…` |
| `2026-10-27T23:47:33Z` | the drift check fetched the live root — still the **previous** one, because the new one had not been committed or deployed yet | live reads `3bab85ba…` |
| `2026-10-27T23:53:31Z` | the new root landed on master — commit `ef2fa5f2e`, PR #3545 | `e9fb00e2…` |

So the file was internally consistent the whole time: the pointer named the bytes it had
**witnessed**, and the drift block named the bytes a reader would **fetch** at that moment.
They were different because the witnessed candidate was six minutes short of being deployed.
The DRIFTED verdict was the honest report of that gap, not a false alarm.

The defect is not a wrong value. It is that **the verdict is an observation and the file
presents it as a standing fact**, and it is only recomputed when the publisher runs again.
Between the moment the root advanced and the moment the pointer was next regenerated, a
reader arriving at the pointer would read `DRIFTED` and could reasonably conclude that the
witnessed bytes were *not* live — which by then they were.

`3bab85baa5ef…` is not a mystery hash. It is the prior public root, and it is still published:
`as_of 2026-10-27T16:37:49Z`, merkle root
`050b199f47958d56c450999aa9d1087fca18b528bad510176f2a8dad1863a4e0`, 325 cards, Rekor
`logIndex 3521443378`, sidecar `public/interop/root-3bab85ba.json.ots`. The archive index
files under `public/archive/` still carry it as `root_sha256`.

## Reproduction

Against the live root, read-only, no signing and no deployment authority:

```bash
curl -sS -A "Mozilla/5.0 (compatible; csoai-check)" https://councilof.ai/root.json -o root.json
shasum -a 256 root.json          # the live root a reader actually gets
python3 scripts/witness_public_root.py --recheck --check-only
```

Output on 28 October 2026:

```
e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea  root.json
drift attempt 1/1: MATCH  witnessed=e9fb00e240b11c1d  live=e9fb00e240b11c1d
conflict: NONE  sidecars=67
```

The witnessed bytes **are** the live bytes. The pointer's `drift` block now says so, with a
`checked_at` of `2026-10-28T11:51:39Z`, `match_sha256: true`, `match_merkle_root: true`.

## What this changes, and what it does not

- **Changes:** the `drift` block of `public/interop/root-witness-pointer.json`, recomputed
  against the live root on 28 October 2026. It now reads `MATCH` with
  `live_root_sha256 e9fb00e2…` and `live_root_merkle_root a2620ac3…`.
- **Does not change:** the `2026-10-27T23:47:33Z` DRIFTED observation, which was true when
  it was made. It is recorded here, in full, rather than deleted.
- **Does not change:** any signed card, any signature, any published root, the Merkle root
  of any corpus, the Rekor entry, or the OpenTimestamps proof. The pointer is a pointer: it
  carries no signature of its own and asserts nothing about the root's contents.
- **Does not claim:** that the root is correct, current, or certified. A `MATCH` says the
  bytes a reader fetches are the bytes that were witnessed. Whether those bytes are *right*
  is a different question and is answered by the measurement behind them, not here.

## How this was caught

The gap register (A11) restated the defect precisely: *"One file, two dated statements
about which bytes are live. Both are visible; a reader is left to work out which is
current."* Re-running the pointer's own drift comparison against the live root — the
operation the publisher already performs, read-only, with no key — returned `MATCH`. The two
statements were not in conflict; one of them was six minutes old.

That is the general shape of this defect, and it is worth naming: **a drift verdict computed
against a hash the pointer has moved past is not a current observation.** The register's own
instruction was to recompute it, and `scripts/witness_public_root.py --recheck` is the
operation that does exactly that.

## Pointers

- Corrected document: `public/interop/root-witness-pointer.json` in the `councilof-ai`
  repository — the `drift` block was recomputed, nothing else was edited.
- This correction: `public/corrections/root-witness-pointer-drift-2026-10-27-SUPERSEDES.md`
  in the same repository, published at `corrections/root-witness-pointer-drift-2026-10-27-SUPERSEDES.md`.
- The prior root: `3bab85baa5ef56f7d4ae72a826240a392d609e57ba314115cf0da0f65e0c8847`,
  Rekor `logIndex 3521443378`, sidecar `public/interop/root-3bab85ba.json.ots`.
- The live root: `https://councilof.ai/root.json`, sha256
  `e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea`, 25,925 bytes,
  `as_of 2026-10-27T21:20:49Z`, 325 cards, merkle
  `a2620ac322c562b64f6b4935b283177d7cb7ada374eee100992f1b68c8539538`.
- Index of supersessions: `corrections/SUPERSESSIONS.md` beside this file.

CSOAI measures. This corrects one of our own observations about our own bytes. It is not a
certification, and it grades nothing.
