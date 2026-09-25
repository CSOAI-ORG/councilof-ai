# Cross-ledger supply — spec, pilot (2026-09-25)

Status: **PILOT — unsigned, not on the board.** Schema `csoai.cross-ledger-supply/0.1`.
Reader: `scripts/readers/cross_ledger_supply.py` · tests: `scripts/readers/test_cross_ledger_supply.py` (fixtures only).
First output: `public/interop/cross-ledger-usdc-2026-09-25.json` + proof bytes in `public/interop/cross-ledger-usdc-2026-09-25/`.

## Construct
**Is USDC the same thing on every ledger its issuer says it lives on?** We test only what each
ledger's own state exposes:

1. The **deployment map comes only from the issuer**: Circle's page
   <https://developers.circle.com/stablecoins/usdc-contract-addresses>. The page is server-rendered
   (Mintlify), and the same path with `.md` returns the page as `text/markdown`. The reader parses
   the Mainnet table from the markdown bytes, then checks each identifier appears in the rendered
   HTML bytes. Both sha256s and `fetched_at` are recorded. Nothing is typed from memory. If the page
   cannot be read, the issuer list is `UNCHECKABLE` and **no deployment is read**.
2. For each listed deployment on a pilot ledger: does the identifier resolve on that ledger, what
   symbol/metadata does the ledger itself report, what decimals, and what issued supply at a
   recorded height.
3. Each read carries an `evidence_kind` (below). Sums are given **per evidence kind only**.

Pilot ledgers (core seven): Ethereum, Solana, Stellar, Hedera, Sui, Noble, XRPL. Eleven other EVM
chains on Circle's list are read with one keyless RPC and `eth_call` only, labelled
`scope: extra_evm`. The other 20 rows on Circle's list are in `listed_not_read` — not zero, not absent.

Not measured: reserves, backing, redeemability, issuer solvency, the value of anything,
circulating supply, fungibility across ledgers. Not a reserve attestation, not a proof of backing.

## Evidence ladder
| kind | meaning | who can check it without trusting us |
|---|---|---|
| `STATE_PROOF_VERIFIED` | a Merkle proof returned by a node was verified **in this reader** against a state commitment in a block header, and the proven value equals the plain API answer | anyone: the proof bytes are published beside the output with instructions |
| `STATE_PROOF_RECORDED` | a proof was returned and its bytes kept (sha256, height, header commitment); not verified here | anyone willing to write the verifier |
| `OPERATOR_API` | one operator's API answer; a second independent operator is read where one exists (`two_operators_agree`) | nobody — agreement between two operators is still not a proof |
| `UNCHECKABLE` | the read failed; HTTP status / error kept | — |
| `REJECTED` | endpoint answered but `symbol()` ≠ `USDC`; no supply recorded against USDC (convention from `scripts/stablecoin_universe_supply.py`) | — |

`two_operators_agree`: `true` / `false` / `NOT_COMPARABLE` (the API cannot pin a past height and the
reads differ) / `NOT_TRIED` (no keyless second operator, or it failed — reason in the row).
A second host of the **same** operator (Hedera) is recorded as `same_operator_host_agrees`, never as
two-operator agreement. A Cosmos endpoint whose `node_info.id` equals the first one is not independent.

**The ceiling of "VERIFIED" in this pilot.** The header is not checked against consensus — there is
no light client here (no Ethereum sync-committee check, no CometBFT validator-signature check). What
*is* checked: Ethereum — `keccak(rlp(header))` recomputes the block hash, and a second operator
returns the same block hash and stateRoot at that number; Noble — a second operator (different node
id) returns the same `app_hash` and block id for header h+1.

### Ethereum — `STATE_PROOF_VERIFIED`
`eth_call totalSupply()` at the finalized block, then **the slot is found empirically**: slots 0..24
are read with `eth_getStorageAt` at the same block and compared with `totalSupply()`; exactly one
matched (**slot 11** on 2026-09-25 — Circle's FiatToken `totalSupply_`; the proxy's storage holds
it). Then `eth_getProof(proxy, [slot])`. The reader walks the account proof from `stateRoot` along
`keccak(address)` (pure-python keccak from `scripts/adapters/evm_permission_events.py`, RLP and
Merkle-Patricia walk in the reader), checks the proven account's storageRoot equals `storageHash`,
walks the storage proof along `keccak(uint256(slot))`, and decodes `rlp(value)`. VERIFIED only if
the proven value equals the `eth_call` value; otherwise `OPERATOR_API` with the reason. `evm_permissions.py`
records EIP-1186 proofs but does not verify them locally and lists no `KNOWN_SLOTS`; this reader
does the verification and the slot is found, not assumed.

### Noble — `STATE_PROOF_VERIFIED` (ICS-23 implemented and tested)
LCD `/cosmos/bank/v1beta1/supply/by_denom?denom=uusdc` pinned with `x-cosmos-block-height: h`, and
CometBFT `abci_query path=/store/bank/key data=0x00||"uusdc" height=h prove=true`. The raw store
value (decimal text) must equal the LCD amount. The reader decodes both `ProofOp`s (minimal protobuf
parser), computes the IAVL existence proof (IavlSpec: SHA-256 leaf, no key prehash, SHA-256 value
prehash, varint lengths, leaf prefix 0x00, inner prefix bounds) up to the bank store root, then the
`ics23:simple` proof (TendermintSpec) from store name `bank` to the multistore root, and requires it
to equal `app_hash` in header **h+1**. Tests cover the recorded proof and four tamper cases
(wrong value, wrong app_hash, flipped byte, swapped op order). Were the verifier absent or failing,
the row would be `STATE_PROOF_RECORDED`, not VERIFIED.

### Why Solana, Stellar, XRPL, Sui, Hedera are `OPERATOR_API` today
- **Solana** — `getTokenSupply` returns a number and a slot, no proof. Account-state proofs against
  a bank hash are not served by public RPC; `getTokenSupply` cannot be pinned to a past slot, so a
  second operator is compared by value and slot (`NOT_COMPARABLE` if both differ). No `symbol()` on
  an SPL mint: identification rests on Circle's list.
- **Stellar** — Horizon `/assets` is an indexer's aggregate (authorized + authorized-to-maintain-
  liabilities + unauthorized balances + claimable balances + liquidity pools + Soroban contract
  balances; components kept). Horizon serves no ledger-entry proofs; ledger number is read beside.
- **XRPL** — `gateway_balances.obligations` at a validated ledger; the second operator is pinned to
  the same `ledger_index` and must return the same `ledger_hash`. The public API returns ledger
  entries without Merkle proofs, and the obligation total is a sum over every trust line — no single
  entry proof would cover it. XRPL issued currencies have no integer base unit: `supply_base_units` is null.
- **Sui** — GraphQL `coinMetadata.supply` with a checkpoint digest in the same response. The digest
  names the checkpoint; the supply is not proven against it. Mysten's public JSON-RPC is retired
  ("migrate to gRPC or GraphQL"); the second operator is a third-party JSON-RPC.
- **Hedera** — mirror node `/api/v1/tokens/0.0.456858`. Mirror nodes are indexers of record files;
  no state proof is served today. **Block proofs (HIP-1200) are due around Nov 2026**; when served,
  Hedera moves up the ladder. No keyless mirror node from a second operator was found; the second
  host (`mainnet.mirrornode.hedera.com`) is Hedera's own.

### Why Canton is `UNCHECKABLE`
Canton is not on Circle's USDC mainnet list as fetched on 2026-09-25, so it is not in this output.
For any Canton-hosted asset, the Scan API that exposes network state requires the caller's IP to be
allowlisted by a Super Validator (<https://docs.sync.global/validator_operator/validator_onboarding.html>);
there is no permissionless public read, so any Canton row is `UNCHECKABLE` with that reason until
an allowlisted read path exists — never zero, never inferred from an issuer statement.

## Independent witnesses later: LFDT CLPR, Cacti BUNGEE-Hermes
Both are Apache-2.0 LF Decentralized Trust projects. **CLPR** (cross-ledger protocol) verifies
another ledger's state before acting on it; today it verifies only Hiero (Hedera) and Besu, so it could become a second, cryptographic witness
for the Hedera row once HIP-1200 proofs exist, and for Besu-based permissioned deployments.
**Cacti BUNGEE-Hermes** produces signed "views" (snapshots) of ledger state from a gateway; it could
give a third party a way to publish a view we then compare against our read. A witness's view is
recorded as a witness, never substituted for a read, and it never moves a row up the ladder by itself.

## Sums
`sum_by_evidence_kind` (all rows) and `sum_by_evidence_kind_core_seven_only`. Never one grand total
across kinds. `arithmetic_sum_of_mixed_evidence_reads` is labelled "arithmetic sum of mixed-evidence
reads, not a measured total": heights differ across ledgers, a CCTP burn and its mint can fall on
either side of two reads, and 20 listed ledgers are not read.

## Canonical vs bridged
Only Circle's own labels. Every row is "listed in Circle's USDC Mainnet Address table"; the only
explicit label on the page is the X Layer note (table entry = Circle-issued native USDC; `USDC.e`
is a separate bridged representation not issued by Circle), quoted verbatim in the output. No row is
called native or bridged by inference.

## ISO 20022 shape (mapping, not conformance)
Each read maps to a camt.053 closing-balance row: `Acct/Id/Othr/Id` = deployment id, `Acct/Svcr` =
ledger (an analogy), `Bal/Tp` = `CLBD`, `Bal/Amt` = supply, `Bal/Dt/DtTm` = observed_at,
`ElctrncSeqNb` = height, `AddtlStmtInf` = evidence kind. `@Ccy` is **unmapped**: USDC has no
ISO 4217 code and we do not choose a convention. BIS Project Agorá names pacs.008 / pacs.009 /
camt.053 (<https://www.bis.org/about/bisih/topics/fmis/agora/rvt.htm>). No message is produced or
validated against the schema.

## Next slices
- **USDY (Ondo)** — Ondo labels which deployments are LayerZero-bridged; the canonical-vs-bridged
  test then has issuer labels to test against (bridged supply vs the canonical escrow).
- **OUSG** — already joinable: `evm-ousg-ethereum` and the `xrpl-ousg` archive series.
- Solana: evaluate account-proof availability (none on public RPC today); Sui: evaluate whether the
  gRPC API serves anything checkpoint-anchored for the supply object; Hedera: HIP-1200 block proofs
  when served.
- Signing: a signed batch through the board signer once the pilot shape is ruled; until then unsigned.

## 0.2 — funds and deposit tokens (2026-09-25, lane cross-ledger-funds)

Reader `scripts/readers/cross_ledger_funds.py` (reuses this pilot's verifiers and adapters) runs from
the data file `scripts/readers/cross_ledger_assets.json`: asset -> {issuer list, per-ledger adapter}.
Tests: `scripts/readers/test_cross_ledger_funds.py` (real proof bytes and real page bytes as fixtures).
Signing/timestamping: `scripts/readers/sign_cross_ledger.py` (the census record's method: POST
/api/board-sign with the pod caller token, Ed25519 verified against did:web:csoai.org#board-attestation-1,
two altered-preimage controls that must fail; OpenTimestamps -> PENDING_CALENDAR_COMMITMENT).

Changes from 0.1:
- **Issuer-list states**: `READ`, `ISSUER_LIST_UNAVAILABLE` (no issuer-published list; nothing read;
  explorers are not issuer lists), `PERMISSIONED_NOT_READABLE` (the issuer's own sentence says the
  ledger is private/permissioned), `UNCHECKABLE`.
- **Products**: one issuer page can list several instruments (Franklin: BENJI, iBENJI, gBENJI,
  sgBENJI, grBENJI). Rows carry `product`; sums are per product and per evidence kind only.
- **Every EVM deployment** gets the Ethereum treatment: slot search over a declared candidate set
  (0..64 + the OpenZeppelin ERC-7201 ERC20 namespace +0..4) at a discovery block; a fresh reading block
  is then pinned so the proof falls inside the operators' proof windows; `eth_getProof` from the first
  operator that serves it, verified against the reading block's stateRoot. `STATE_PROOF_VERIFIED`
  also requires the block hash to be recomputed from the header fields; a proof that verifies against
  an unbound stateRoot, or does not verify, is `STATE_PROOF_RECORDED` with the reason.
  (Avalanche C-Chain on 2026-09-25: proofs from two operators did not match the header stateRoot.)
- **Identity**: the on-ledger symbol / Stellar asset code / Token-2022 or Aptos metadata symbol must
  equal the product ticker in the issuer page; else `REJECTED`.
- **issuer_reported** (kept apart, never summed): e.g. the BENJI fund's N-MFP3 from SEC EDGAR (net
  assets, shares outstanding, report date, transfer agent named in the filing); `comparison: NOT_COMPARED`.
- **reconciliation_state**: `UNRECONCILED_WITH_TRANSFER_AGENT` (funds) /
  `UNRECONCILED_WITH_ISSUING_BANK_LEDGER` (deposit tokens) until a controlling record is public.
- `not_evidence_of` names AUM, NAV, ownership, redeemability, fund compliance.
- `public/interop/institutional-evidence-links.json` joins the estate binding layer's institution keys
  to these records (or UNMEASURED with the reason), without editing that layer.
- Published: HF dataset `csoai/cross-ledger-supply` (CC-BY-4.0); site path `/interop/X` = dataset path `interop/X`.
