# Verification surfaces — check-time key-resolution audit

**The property under audit** (the one we argue on the IETF agentproto list, where this
estate is cited as the reference implementation): *verification must succeed for a party
in possession of the records and the associated verification parameters and nothing
else — no service contact at verification time, including key resolution.*

Retrieval vs verification is the load-bearing distinction. Fetching the RECORD is
retrieval and may touch the network; deciding whether the record is genuine is
verification and may not. A surface whose trust anchor is itself fetched at check time
is doing key resolution at verification time, which fails the property — whatever the
fetch's transport security.

Audited 2026-08-27. Every surface below was read, and the two that failed were fixed in
the same change that adds this file.

| Surface | Trust anchor comes from | Network at check time? | Verdict |
|---|---|---|---|
| `public/signed/verify-card.mjs` | `PINNED_PUBKEY_HEX` literal in source | No. `--all` fetches card **records** (retrieval); the key never travels. | **PASS** — the reference. |
| `public/embed/verify.html` (third-party embed widget) | Was: `fetch("/signed/board_living.json")` at check time — the sole anchor, resolved at the moment of verification. Now: `PINNED_SIGNER_HEX` literal in source (the living-board signer that signs every `/signals/*.signed.json`). | Anchor: no. The `board_living.json` fetch is kept as an **additional cross-check, labelled as such** ("○ Live key cross-check"), and its failure leaves the verdict untouched. | **FIXED** — was key resolution at check time. |
| `/os` verify pane (`LobbyVerifyPane` → `RecordVerifyForm` → `client/src/lib/recordVerify.ts` → `functions/_lib/cardVerify.ts`) | Was: anchors from a live fetch of `/.well-known/did.json`; when that fetch failed the anchor check reported "could not be checked" **without failing the verdict**, so a card signed by an unpublished key could verify while did.json was unreachable. Now: `PINNED_ANCHORS` in `cardVerify.ts` — the four did:web:csoai.org keys, fixed in source — decide; the live did.json fetch feeds a labelled cross-check row only. | Anchor: no. The did.json fetch remains as the "Live anchor cross-check" row (ok: null, never deciding). | **FIXED** — sole anchor was fetched, and its absence was fail-open. |
| `functions/mcp/[[path]].ts` (`verify_card` / `verify` tools) | Same `cardVerify.ts` pinned set. Was: returned UNCHECKABLE when did.json could not be fetched — honest, but it made a network fetch a precondition of verification. Now: the verdict is reached from the pinned set; the response reports `trust_anchor: pinned in the verifier's source` and lists the live did.json ids under `live_did_crosscheck` when reachable. | Anchor: no. Card-by-URL input still fetches the **record** (retrieval). | **FIXED** — verification no longer requires the did.json round-trip. |
| `mcp/gspc-server` (stdio `verify_card`) | Imports and runs `public/signed/verify-card.mjs` — the pinned literal. | No. | **PASS** — unchanged. |
| `/signed/chain.json` (the chain manifest itself) | Card-shaped envelope signed by the pinned card-attestation key (since 2026-08-27); verifiable offline by `verify-card.mjs` unchanged. | No. | **PASS** — new; closes `manifest_signed:false`. |

## Rules this audit enforces

- The **deciding** trust anchor of every verification surface is pinned in that
  surface's source. A live fetch of a published key document may exist only as an
  additional cross-check, labelled as such, whose failure or disagreement never
  changes the verdict.
- Three states, never two: VALID / INVALID / UNCHECKABLE. A cross-check that cannot
  run reports itself unavailable; it is never collapsed into either pass or fail.
- Do not change `verify-card.mjs`'s pinned key. Key rotation means shipping a new
  verifier, not teaching the old one to fetch.
