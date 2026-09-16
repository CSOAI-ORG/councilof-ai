# The estate, consolidated: one index, one root, one honest set of numbers

16 September 2026. Every artifact CSOAI holds, wherever it lives, is now written down once,
digested, and committed to a single Merkle root. This is the map. The machine-readable form is
`public/interop/master-consolidation-2026-09-16.json`, served at `/interop/master-consolidation-2026-09-16.json`
and rendered at `/estate`.

## The one rule that makes the rest readable

**INDEXED is not MEASURED.** A row in this index says we found the artifact and recorded its
identity. It says nothing whatever about whether anything was measured against it. The board at
`/api/gspc` is the only surface that answers the measurement question, and it answers it with its
own counts, derived and never typed.

## Two kinds of digest, never added together

| Leaf class | What the digest covers | What inclusion proves |
|---|---|---|
| bytes leaf | The artifact's own bytes, which we read | Those exact bytes were in the set when the root was stamped |
| record leaf | Our canonical note about a remote artifact we did not download | We recorded that identity and revision at that time, and nothing about the remote bytes |

A repository on another host can change under us without breaking anything here. That is why the
two classes are reported separately and their sum is never presented as one number.

## What is in the set

| Surface | Entries | Note |
|---|---|---|
| This repository | 5,754 | 4,603 signed, rooted and proof artifacts plus 1,151 written documents, all hashed from their own bytes |
| Hugging Face | 245 | 226 repositories across two owners, plus 19 frozen question banks read end to end |
| GitHub | 400 | CSOAI-ORG repositories, 260 of them public |
| Kaggle | 20 | published datasets |
| Oracle Object Storage | 8 | 14.52 GB in the mac-offload bucket; recorded by identity and the store's own checksum, not downloaded |

Total entries under the root: **6,427**. Of these, 5,773 are bytes leaves and 654 are record leaves.

## The benchmarks, in full

Nineteen frozen question banks were read end to end and hashed, holding 29,285 items between them.
A published result names the bank it was answered against by this digest, so a reader can fetch the
bank, recompute the hash, and confirm the result was scored against the bank it claims.

Seventeen are GSPC banks. The remaining two, the x402 bazaar census and the GovBench item set, are
corpora rather than question banks, and the index labels them by kind rather than folding them in.

## Anchoring

Eighty-five OpenTimestamps proofs sit under `public/`. Every one of them parses as a real detached
proof and still covers the file it names, which a deploy gate now checks on every build. Fifty-six
carry a Bitcoin block attestation and are verifiable today. Twenty-nine are calendar-pending: the
stamp is a request that has not yet been confirmed in a block, and the artifact says so rather than
calling itself anchored.

The master index itself is stamped and pending. It will be re-checked by the upgrade job until a
Bitcoin attestation lands.

## What this root does not do

- **It is not signed.** No key is applied, so the root records when, not who. A reader learns the
  set existed at the anchored time and learns nothing about who assembled it.
- **It is therefore not witnessable in Rekor** the way `public/root.json` is. That witness uploads
  the preimage, the signature and the board public key. There is no signature here to upload.
- **It does not replace the three card corpora.** `public/cards-bundle.json`, `public/root.json` and
  `public/signed/card_index.json` each commit to their own separate corpus with zero identifier
  overlap, and they are never reconciled or substituted. See `council-os/CARD-CORPORA.md`.
- **It proves nothing about quality.** A bank being hashed does not make it a good bank. On
  14 September we withdrew 44 signed results whose banks hashed perfectly and whose graders could
  not mark anything wrong.

## Reproducing the root

Leaf is the sha256 of the entry's bytes. Pairs are hashed in order. An odd node is carried up
unchanged and never duplicated. The rule is restated inside the artifact so a stranger can
recompute it without reading this file.

```bash
python3 scripts/master_consolidation.py --selftest --inputs . --out /dev/null
```

The selftest builds a seven-leaf tree, proves every leaf verifies, and proves a leaf from outside
the set is rejected. A check that cannot fail is not a check.
