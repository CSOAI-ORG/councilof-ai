# SovX wrapped-asset measurements: the ledger keyed by CAIP-19. Method note, v0.1 (2026-09-28)

Wallets and explorers identify a token by chain and contract. This ledger keys each wrapped-asset record
by the standard ids for those two things: CAIP-2 for the chain and CAIP-19 for the asset. A wallet can then
ask about the token it is showing without having to learn our pair names.

## Where the ids come from
- **One table for everything:** `functions/api/wrapper/_caip2.json` maps roster chain names to CAIP-2 ids
  and to the SLIP-44 reference of each chain's native asset. Two readers use it: the public lookup
  (`functions/api/wrapper/_caip19.ts`) and the candidate generator
  (`scripts/readers/wrapper-caip-ledger.mjs`). A test checks that both give the same id for every side.
- **ERC-20:** `eip155:<chainId>/erc20:<address, lower-cased>`. Lookups accept any letter case and
  URL-encoded ids.
- **Native assets:** `<caip2>/slip44:<n>`. Examples: BTC `bip122:000000000019d6689c085ae165831e93/slip44:0`,
  XRP `xrpl:0/slip44:144`, ETH `eip155:1/slip44:60`.
- **No chain at all:** a side that is not on any ledger has **no id**, and the index lists it under
  `unkeyed` with the reason. Examples are fund shares held at a transfer agent and bank deposits. Such a
  side is never dropped and never given an invented id.

## Which pairs are covered
Pairs come only from what this repo already reads and publishes:
1. **The wrapper roster** in `scripts/readers/wrapped-asset-parity-reader.mjs`, imported rather than copied.
   It holds 24 pairs of four kinds:
   - escrow bridges;
   - native issuance;
   - custodial wrappers;
   - a bank deposit token.
2. **The signed per-deployment archives** under `public/archive/evm-<asset>-<chain>/`. Each deployment on a
   chain with a keyless RPC list is paired with the same asset's Ethereum deployment
   (`issuer_multichain`). This gives 10 pairs.

That is 34 pairs in all. A pair is added because it can be read, not because it is popular.

## What is measured, per pair
1. **Block pinning.** For each chain, the first operator in `functions/api/_evm_rpcs.json` that reports a
   block under the `finalized` tag sets the block. A second operator, on a different registrable domain,
   must return the same hash at that height. There is no fallback to `latest`. Finality means "an RPC
   reported it and a second operator matched the hash". It is not independently proven final.
2. **Two-operator reads.** `decimals()`, `totalSupply()` and, for escrow pairs, `balanceOf(<escrow>)` are
   each read at the pinned block from two different operators. A value is kept only when both return the
   same bytes. Each record keeps the sha256 of the raw result and names both operators.
3. **Parity, only where a lock exists.** For an escrow pair, the escrowed canonical balance is compared with
   the deployed supply, scaled to equal decimals. The comparison uses BigInt arithmetic, and the ratio is
   given to six places, truncated.
4. **Disclosure.** The generator fetches the bridge, custodian or issuer page and keeps:
   - one verbatim quote;
   - the URL;
   - the HTTP status;
   - the sha256 of the bytes served.

   "Verbatim" is measured against the page's visible text: scripts and styles removed, tags replaced by a
   space, entities decoded and runs of whitespace collapsed. The generator checks that the quote is a
   substring of that text. If the page refuses the fetch, or renders only in the browser, nothing is
   quoted and the disclosure is `UNMEASURED`.

## States (never collapsed)
| state | when |
|---|---|
| `CONSISTENT` | Escrow pair: both reads are two-operator and at pinned finalized blocks, a **bridge-side** disclosure of the lock-and-mint relation is quoted, and escrowed balance ≥ deployed supply. |
| `INCONSISTENT` | The same, but escrowed balance < deployed supply. The record quotes both sides: the disclosure, and the two values with their blocks and operators. |
| `SINGLE_SURFACE` | Custodial: the counterpart (custodied BTC or XRP, a fund register, bank deposits) is not on a chain read here. Only the supply is read. |
| `UNCHECKABLE` | No per-pair relation exists to check. This covers CCTP burn-and-mint, one USDT0 adapter shared by every chain, and per-chain issuance of one fund. It also covers an escrow pair whose bridge disclosure could not be quoted. Supplies are read; no ratio is claimed. |
| `UNMEASURED` | No block pinned, operators disagreed, fewer than two operators answered, or a read failed. The error is recorded and nothing is inferred. |

Blocks on two chains are never simultaneous. An `INCONSISTENT` state reports a comparison at two heights;
it is not a verdict on the bridge. Native issuance is not "unbacked". A custodial wrapper that no
independent read can reach is `SINGLE_SURFACE`, not suspect.

## What is explicitly not measured
- **Reserve adequacy.** The ledger does not ask whether the canonical asset is itself backed. It does not
  cover USDC reserves, custodied BTC, fund assets or bank deposits.
- **Solvency** of any issuer, custodian, bridge or fund.
- Redemption rights, legal claims, bridge security, smart-contract risk or operational risk.
- Price. No price is read, published or implied.

An escrow ≥ supply comparison is arithmetic on two public ledger numbers, under the mechanism that the
operator's own documentation describes. It is **not** a rate, grade, score or ranking. It is not a
certificate, attestation, audit, proof of reserve or legal evidence, and it confers no statutory
verifier status. A listing is not an endorsement.

## Endpoints (free, read-only, no chain read)
- `GET /api/wrapper/index.json` lists every keyed asset with its lookup URL, the CAIP-2 table, and the
  unkeyed sides with their reasons.
- `GET /api/wrapper/caip19/<CAIP-19 id>` (or `?id=`) lists:
  - every roster pair the asset is a side of;
  - the counterpart's id;
  - the state the pair carries in the **already-published** ledger (`/interop/wrapped-asset-parity-latest.json`);
  - links to the per-deployment archive and to the existing `/api/wrapper` door.

  It returns 404 for a valid id that is not listed and 400 for a string that is not CAIP-19.

A fresh read at pinned blocks is the job of the existing `/api/wrapper` door (preview free); the paid read
stays that door's. These two endpoints add no payment path and no price.

## Publication status
The first batch of 34 candidate records in the five-state vocabulary is staged **unsigned**, marked
`SIGN_PENDING` and publication `HELD`. It is not published, for two reasons:
- **No record kind covers it.** The signer path (`scripts/adapters/staged_leaves.py`) admits only the
  states `PROBED`, `DISCOVERED` and `UNMEASURED`; no existing kind covers these records.
- **Issuer naming needs the owner's OK.** Each record is a new determination that names an issuer.

Until then, the public lookup serves only the states of records that are already public.

## Re-running
```
node scripts/readers/wrapper-caip-ledger.mjs --stage <dir>          # reads, quotes, stages candidates
node scripts/readers/wrapper-caip-ledger.mjs --archive-map functions/api/wrapper/_caip_archive.json
```
The reads are keyless public RPC, paced at 200 ms. Nothing signs and nothing is sent.
