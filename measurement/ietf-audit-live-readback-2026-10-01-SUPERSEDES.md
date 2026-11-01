# Correction 2026-10-28: the board and root figures in the 2026-10-01 IETF readback are superseded

**CSOAI — Council for Secure and Open AI. Correction dated 28 October 2026; published
28 October 2026.** Register id GAP-REGISTER-2026-10-26#A19.

**Supersedes, never rewrites:** `measurement/ietf-audit-live-readback-2026-10-01.json` is not edited.
It is a dated live readback — fetched at 2026-10-01T08:10:28Z, with every response's byte count and
sha256 recorded — and it was accurate when it was fetched. A reader who saw it must still be able
to see it. This note stands beside it and names what it corrects; the readback's own boundary
statement stands unchanged.

---

## What the readback said

In `observed`:

```json
{
 "gspc_axes": 23,
 "gspc_measured_axes": 23,
 "public_root_card_count": 319,
 "public_root_merkle_root": "47277a6f2034e80b6279fa969e832180b55837956773ee29339a815b74c2ba2d",
 "public_root_as_of": "2026-09-30T05:05:34Z",
 "corrections_count": 89,
 "corrections_signature_state": "VALID",
 "rekor_log_index": 3012420819,
 "ots_status": "CONFIRMED_BITCOIN",
 "ots_bitcoin_blocks": [969264, 969266, 969288, 969296]
}
```

and in `endpoints.root`, the sha256 and byte count of the root as served that morning:
`f1913eca…`, 25,513 B.

## What is wrong with it now

Every figure above was true on 2026-10-01. The live estate on **2026-10-28** reads differently:

| Field | Readback, 2026-10-01 | Live, 2026-10-28 |
|---|---|---|
| `gspc_axes` | 23 | 33 |
| `gspc_measured_axes` | 23 | 23 |
| `public_root_card_count` | 319 | 325 |
| `public_root_merkle_root` | `47277a6f…` | `a2620ac322c562b64f6b4935b283177d7cb7ada374eee100992f1b68c8539538` |
| `public_root_as_of` | `2026-09-30T05:05:34Z` | `2026-10-27T21:20:49Z` |
| root sha256 / bytes | `f1913eca…` / 25,513 B | `e9fb00e2…` / 25,925 B |
| `corrections_count` | 89 | 93 |
| `rekor_log_index` | 3012420819 | 3526124324 |
| `ots_bitcoin_blocks` | 969264, 969266, 969288, 969296 | 973461 |

Note what did **not** move: `gspc_measured_axes` is still **23**, and `corrections_signature_state`
is still **VALID**. The board grew by 10 *declared slots*, not by 10 measurements — the larger
number counts slots, the smaller counts measurements. The root moved forward by 6 cards. The
Rekor logIndex and the Bitcoin block belong to the *new* root's proof, not the old one: a witness
attests particular bytes, so quoting the old root's logIndex beside the new root's merkle root
would pair a root with a witness that never saw it.

The readback's own `boundary` says it plainly, and it was right to say it:

> "Point-in-time readback only; re-fetch live endpoints before citing changing counts."

## What changes, and what does not

- **Changes:** the `observed` block is superseded as a statement of the estate's current state.
  Read each endpoint live before citing any of these counts.
- **Does not change:** the `endpoints` block. It is the record of *those responses* — URL, HTTP
  status, byte count, sha256 — fetched at 2026-10-01T08:10:28Z, and it remains the evidence that
  the readback really did read the doors it says it read.
- **Does not change:** the `boundary` array, the schema, or any byte of the file.
- **Does not change:** any measurement card, any signature, or any published root.

## The count grammar, restated because this is where it bites

The board's axis count and its measured count are **two different numbers**, and neither is a
verdict. 33 axes are on the board; 23 of them carry a measurement and 10 are declared slots with
no run behind them. **Quote both or quote the smaller.** A published slot is not evidence that
anything has been measured.

TIE is not a win. UNTESTED is not a tie. UNMEASURED is an answer, never a zero.

## How it was checked

On 2026-10-28: `GET https://councilof.ai/api/gspc` → `totals.axes` 33, `totals.measured_axes` 23,
`totals.unmeasured_axes` 10. `GET https://councilof.ai/root.json` → sha256
`e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea`, 25,925 B, `merkle_root`
`a2620ac3…`, `card_count` 325, `as_of` `2026-10-27T21:20:49Z`. `GET
https://councilof.ai/interop/root-witness-latest.json` → Rekor logIndex 3526124324, OTS
CONFIRMED_BITCOIN at block 973461, `artifact.sha256` and `artifact.card_count` matching the live
root. `GET https://councilof.ai/api/corrections` → 93 entries, `signature_state` VALID.

## Pointers

- Superseded document (unchanged): `measurement/ietf-audit-live-readback-2026-10-01.json`.
- This correction: `measurement/ietf-audit-live-readback-2026-10-01-SUPERSEDES.md`.
- Live root: <https://councilof.ai/root.json>. Live board: <https://councilof.ai/api/gspc>.
- Live witness: <https://councilof.ai/interop/root-witness-latest.json>.
- Register: `measurement/consolidation/2026-10/GAP-REGISTER-2026-10-26.md`, gap A19.
- Index of supersessions: `public/corrections/SUPERSESSIONS.md`, which points to this note.

CSOAI measures. This corrects one of our own sentences. It is not a certification, and it grades
nothing.
