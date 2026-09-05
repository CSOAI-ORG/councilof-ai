# DRAFT — HOLD. Not posted. Owner review required before publication anywhere.

Intended venue: a governance forum post (Arbitrum / Ondo / issuer forums as the
owner decides). Facts only; every figure below is a rendering of a signed
leaf or of the adapter's roster list, each linked. Method:
`docs/PROVABLE-ARCHIVE-METHOD.md`
(https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/PROVABLE-ARCHIVE-METHOD.md).

---

## Permission state of tokenised treasuries, read at one block, with a proof anyone can check

**What we did.** On 2 September 2026 we read the permission state of the
largest tokenised treasury and money-market contracts on Ethereum, Arbitrum,
Optimism, Polygon, Base, BNB Chain, Avalanche and Mantle from keyless public
RPC endpoints at one pinned block per chain, and for each contract requested
an EIP-1186 `eth_getProof` at that same block. Each (token, chain) became one
signed fact card of at most 3 KB carrying: the block number and block hash,
the endpoint that answered, every getter that answered (`checked`), every
getter that did not (`absent`), what a public RPC cannot answer
(`unmeasured`), and the SHA-256 of the Merkle proof whose full bytes are
published beside the card.

**What was read.** `paused()` / `isPaused()`, `owner()`,
`getRoleMemberCount(DEFAULT_ADMIN_ROLE)`, the issuer-specific registry
pointers where the ABI is public (`blocklist()`, `allowlist()`,
`sanctionsList()`, `allowList()`, `accessControl()`, `hook()`,
`kycManager()`, `pauser()`), `totalSupply()`, and the two EIP-1967 proxy
slots. The exact selector list with signatures is in the adapter source.

**What the proof proves.** The account proof ties `codeHash` and
`storageHash` at block N to the block's `stateRoot`; the storage proofs tie
the two EIP-1967 slots to `storageHash`. Getter values obtained by `eth_call`
are consistent with `storageHash` but are not individually slot-proven unless
the contract's storage layout is published; each card says which. Verification
needs a block header from any node and nothing from us.

**Roster (2 Sep 2026, by rwa.xyz market capitalisation; EVM chains with a
verified address).** BUIDL (Ethereum, Arbitrum, Optimism, Polygon; the I-class
on Ethereum), USYC (Ethereum, BNB Chain), USDY (Ethereum, Mantle, Arbitrum),
WTGXX (Ethereum), JTRSY (Ethereum), BENJI (Ethereum, Arbitrum), USTB
(Ethereum), OUSG (Ethereum), TBILL (Ethereum, BNB Chain, Arbitrum), USTBL
(Ethereum, Arbitrum), MONY (Ethereum), mTBILL (Ethereum, Base), VBILL
(Ethereum, BNB Chain); comparators USCC, bIB01 (four chains), ACRED. Chain
facts: BUIDL is Securitize-issued on Ethereum and other EVM chains; BENJI is
Stellar-primary with EVM share tokens; USDY and OUSG are Ondo products on
Ethereum and other chains. None of these is XRPL-native. Rows whose address
could not be confirmed from an official page or explorer (for example iBENJI,
the JPM OnChain Liquidity-Token MMF, the Libeara-issued funds, and BUIDL on
Avalanche/BNB Chain) are listed as UNVERIFIED and were not read.

**Observed at the recording block (Ethereum block 25889186; Arbitrum
500957050; Optimism 156374133; Polygon 93094674; Base 50778847; BNB Chain
119524053; Avalanche 94278771; Mantle 100108365).** Every roster contract
answered `name()`, `symbol()` and `totalSupply()`. Which pause getter, owner
getter and registry pointers answered varies by issuer family and is recorded
per card under `checked` / `absent`; readers should quote the card, not this
paragraph. EIP-1186 proofs were obtained for 15 of the 17 pairs in the
recorded subset; for TBILL on BNB Chain and bIB01 on Base no public endpoint
answered `eth_getProof` at that block, and those cards say so under
`unmeasured`.

**History.** From the first hourly publish onward, the same reads recur every
hour under a new signed root witnessed in Rekor and OpenTimestamps, and an
incremental indexer records `Paused`, `Unpaused`, `OwnershipTransferred`,
`RoleGranted`, `RoleRevoked`, `Upgraded`, `AdminChanged` and `BeaconUpgraded`
events for the same addresses. Public `eth_getLogs` is range-capped, so the
covered range grows run by run and every scan leaf names exactly which blocks
were read. Absence of an event is a statement about a range, never about all
time.

**What this is not.** Not a rate, not a reference value, not a composite or
continuous series, not a grade, and not an opinion on any asset. The outputs
are discrete point-in-time facts with use restrictions stated on the archive
index; they are not for use in or as a financial instrument. A card signed
with our key and witnessed by public logs is recomputable evidence; it carries
no legal presumption under eIDAS or similar regimes.

**How to check one card.** Fetch `/cards/<sha16>.json`, canonicalise
`payload`, compare its SHA-256 with `sha256`, verify `sig_ed25519` against
`https://csoai.org/.well-known/did.json`, fold the inclusion proof to the
root's `merkle_root`, compare the Rekor entry digest with the root bytes, then
fetch the block header for `payload.block_hash` and verify the EIP-1186 proof
at `/archive/proofs/eip1186/<sha16>.json` against `header.stateRoot`.

Links: https://councilof.ai/root.json ·
https://councilof.ai/archive/index.json ·
https://councilof.ai/interop/root-witness-pointer.json ·
source (Apache-2.0): https://github.com/CSOAI-ORG/councilof-ai

---

Owner decisions before posting: venue; whether to include the per-issuer
`checked`/`absent` table (generated from the cards at post time, never typed);
counsel review of the use-restriction sentence.
