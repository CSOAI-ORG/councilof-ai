# Learn from EAS — how attestation explorers present proofs, and what we take

Read 2026-09-02 for the Council OS Attestations pane (`/dashboard?tab=attestations`).
Sources read, never signed up to, never posted to: base.easscan.org (home, `/attestations`,
`/schemas`, one onchain view, one offchain view, one schema view), docs.attest.org (attestations,
onchain-vs-offchain, resolver contracts; the site renders client-side so the GitHub markdown was
read), the EAS MetaMask Snap package page, search.sigstore.dev + the Rekor API entry for our own
root, opentimestamps.org + the `ots` client README.

Our doctrine, restated so the "take" column is honest: **measurement, not certification; verify
is free, forever; a rank is never sold; no token, no credit, no wallet a reader must fund.**

## 1. What EAS presents, end to end

### The explorer home (base.easscan.org)
- Three counters (total attestations, total schemas, unique attesters), two calls to action
  ("Make Attestation", "Make Schema"), a recent-attestations table: **UID · Schema (#n) · From ·
  To · Type (ONCHAIN/OFFCHAIN) · Age**. The footer states the posture in four words: open source,
  permissionless, tokenless, free.
- One search box that accepts a UID, an address, an ENS name, or a schema number. One identifier
  shape (0x + 64 hex) means one box.

### The attestation view (`/attestation/view/<uid>`, `/offchain/attestation/view/<uid>`)
Fields, in order: **UID · Created · Expiration ("Never") · Revoked (Yes/No) · Revocable ·
Schema (#n + name, linked) · From (attester, ENS-resolved) · To (recipient) · Transaction ID
(basescan link; onchain only) · Referenced Attestation (refUID or "No reference") · Referencing
Attestations (count) · Decoded Data (field name, Solidity type, value — one row per schema
field) · Raw Data (hex or JSON)**. Offchain views add **IPFS hash**, **Download** and
**Offline Link** (the whole signed attestation is in the URL, so it verifies with no server), and
a **"Timestamp onchain"** control that anchors the offchain UID's existence-time in a transaction.

### The schema view (`/schema/view/<uid>`)
**#n + name · UID · Creator · Created (+tx link) · Resolver contract · Revocable (Yes/No) ·
counts: onchain N / offchain N · Decoded schema (type name per field) · Raw schema (the
comma-separated string) · "Attest with Schema" (a form generated from the fields) · recent
attestations under this schema**. A custom resolver draws a warning: "Only interact with schemas
you trust and have verified." Big attesters get a logo ("Trusted by Coinbase").

### The model (docs.attest.org)
- An attestation is `{uid, schema, attester, recipient, time, expirationTime, revocable,
  revocationTime, refUID, data}`; the UID is a hash of the whole attestation.
- **Revocation** is the only mutation: bytes are never edited, a revoked flag and time are set.
- **refUID** composes attestations (endorsement, reply, chain); the explorer counts referencing
  attestations both ways.
- **Onchain vs offchain**: onchain costs gas and is readable by contracts; offchain is a signed
  (EIP-712) object stored anywhere — URL, IPFS, private — that costs nothing and can later have
  its UID timestamped onchain. Private data goes in as a merkle root; leaves are disclosed
  selectively with a proof.
- **Resolver contracts** are hooks on attest/revoke: pay-to-attest, gated attesters, mint-on-attest,
  recipient/expiry/revocation rules. EAS states it does not verify, endorse or audit resolvers.
- **SDK**: `attest`, `getAttestation`, `revoke`, `timestamp`, `offchain.signOffchainAttestation`,
  `verifyOffchainAttestationSignature`, `SchemaEncoder` (decode `data` against the schema string).

### The MetaMask Snap
A transaction-insight snap: when a wallet is about to sign an EAS `attest` call it decodes the
calldata, fetches the schema from the EAS GraphQL endpoint, and shows **schema, recipient, refUID,
expiration, revocable, and every data field decoded** before the human clicks. Decode-before-sign,
in the place the decision is made.

## 2. How the other explorers show a proof

### Rekor (search.sigstore.dev, `GET /api/v1/log/entries?logIndex=`)
An entry is `{uuid → {logIndex, integratedTime, logID, body, verification:{signedEntryTimestamp,
inclusionProof:{logIndex, treeSize, rootHash, hashes[], checkpoint}}}}`. The body is a typed
record (`rekord`, `hashedrekord`, `intoto`…) with the artefact hash, the signature and the public
key. The UI searches by email, hash, commit SHA, log index or UUID and prints the decoded body
beside the raw one. The proof is **an inclusion path to a signed checkpoint** — exactly the shape
of our `/api/proof` response, one level up.

Our own root today: logIndex 2684053226, kind `rekord`, integratedTime 1788333210
(2026-09-02T07:13:30Z), a 26-hash inclusion path to a checkpoint of tree size 2 562 352 747.

### OpenTimestamps (opentimestamps.org, `ots`)
A `.ots` proof is a commitment path from the file hash through calendar operations to either a
**pending calendar attestation** or a **Bitcoin block-header attestation** (block height, time).
`ots info` prints the path; `ots upgrade` swaps pending for Bitcoin once a block includes it;
`ots verify` names the block. The site is one drop-zone: drop the file or the `.ots`. It is honest
about **pending**: a pending proof is not yet a timestamp, and it says so.

## 3. What they do well

1. **One identifier, one box.** Everything is a 32-byte hash; the search accepts it in any
   spelling. No "choose a type" step.
2. **States as words, not icons.** `Revoked: No`, `Expiration: Never`, `Type: OFFCHAIN`,
   `pending`. A reader can quote the page.
3. **Decoded beside raw.** The schema drives a typed table; the raw bytes sit under it. Nothing is
   hidden, nothing needs a decoder in your head.
4. **The proof is a link to someone else's record.** Transaction ID → basescan; IPFS hash →
   gateway; OTS → block; Rekor → checkpoint. The explorer never asks to be trusted for the fact
   it is presenting.
5. **Offline link / download.** The signed object travels whole; verification needs no server.
6. **Revocation is append-only.** Edit is impossible; supersession is visible.
7. **Composition is visible.** refUID both directions, with counts.
8. **Decode-before-sign** (the snap): the check happens where the decision is.
9. **Posture stated in the footer**: open source, permissionless, tokenless, free.

## 4. What is basic

- The schema is a comma-separated Solidity string; the explorer cannot say what a field *means*.
  "Verified Account: true" is a bool from a resolver nobody audited — EAS says so itself.
- Trust is a logo. "From: Coinbase" is an ENS name and a badge; there is no independent check
  behind it, and the attester's incentives are not on the page.
- An attestation is a claim, and the explorer treats every claim alike. There is no notion of a
  *measurement* versus an *assertion*, no false-negative rate, no "what this does not establish".
- Nothing catches the attester's own mistakes. There is no ledger of "we were wrong, here is
  how it was caught". Revocation is the only admission, and it carries no reason.
- Onchain writing needs a funded wallet; the "free" half (offchain) is free only until someone
  wants it timestamped.
- Counts are marketing (3.4 M attestations) with no statement of how many are meaningful.

## 5. Exactly what we take — and what we refuse

| Take | Into the pane as |
|---|---|
| One identifier, one box | A single input accepting a sha256 leaf **or** a signed-card id (both 64 hex; `0x`/`sha256:` tolerated). Both checks run. |
| States as words | Witness states printed **verbatim** from `root-witness-latest.json`: `WITNESSED`, `STAMPED_PENDING_BITCOIN`, `NOT_YET`. `NOT_YET` is never a tick (`railTone` → `absent`). |
| Decoded beside raw | Root card: merkle_root · n · as_of · DID, with links to the raw `root.json`, sidecar and pointer. Search: verdict + reason + link to the raw proof/card. |
| A proof is a link to someone else's record | Rekor rail links the API entry **and** search.sigstore.dev by logIndex; OTS rail links the `.ots` file and the drop-zone; EAS rail will link `base.easscan.org/attestation/view/<uid>` when the log names one. |
| Offline verification | `HOW-TO-VERIFY-ROOT.md` / `HOW-TO-VERIFY.md` / `verify-card.mjs` are the "how to verify yourself" list; every check the pane runs is also runnable without us. |
| Decode-before-trust | The root's Ed25519 signature, the sha256 of the bytes, and the merkle path are re-computed **in the reader's browser** under a **pinned** key — the verdict needs no network at check time. |
| Posture in the footer | Existence and time of bytes; not certification, not a rank, not a token. Verify is free. |

| Refuse | Why |
|---|---|
| A wallet, gas, a token, credits | Verify is free forever; the EAS-on-Base rail stays `NOT_YET` until an **owner-funded** hot wallet exists, and the pane says so instead of drawing a chain. |
| Resolver-style gating | We gate nothing on payment; `/api/proof?sha=` is free, one inclusion at a time. |
| "Trusted by" logos | Trust is a pinned key in a DID document and a recomputation, not a badge. |
| Counters as marketing | The pane prints `card_count` from the root and `n_cards` from the index, each named by its source. |
| Treating a claim as a measurement | The pane's verdict sentence says what VALID means and what it does not: the bytes and the signature — never that the measurement is right. |

**Our edge, which EAS has nothing like:** the corrections ledger (`GET /api/corrections`) —
appended, never edited, each entry *what was wrong / how it was caught / the fix*. The pane shows
it inline, including the ledger's own declared `signature_state` (STALE today — it says so itself,
and a stale signature is a published defect, never a silent edit).

## 6. Bytes read on 2026-09-02 (the pane is built on these, not on the doc)

- `GET https://councilof.ai/root.json` → 200, 4948 bytes, sha256 `728e8c5e…b792d3`,
  merkle_root `8025ee10…86909`, card_count 50, signed by `did:web:csoai.org#board-attestation-1`.
- `GET /interop/root-witness-latest.json` → 200: rekor `WITNESSED` (logIndex 2684053226),
  ots `STAMPED_PENDING_BITCOIN`, eas_base `NOT_YET` ("needs a funded wallet (owner)"),
  xrpl_memo `NOT_YET`.
- `GET /interop/root-witness-pointer.json` → 200, drift `MATCH`.
- `GET /interop/eas-root-attestations.json` → **404** — the EAS log is not published yet; the
  pane takes the EAS state from the sidecar and prints "HTTP 404 — state read from the witness
  sidecar".
- `GET /api/proof?sha=<leaf 0>` → 200, kind `inclusion`, 6 siblings; recomputes to merkle_root.
- `GET /signed/card_index.json` → 200, n_cards 335. `GET /api/corrections` → 200, 37 entries,
  `signature_state: STALE`. `GET /signed/HOW-TO-VERIFY-ROOT.md` → 200.
