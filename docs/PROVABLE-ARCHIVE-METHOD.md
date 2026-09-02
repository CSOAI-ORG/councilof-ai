# Provable archive — method

**What this is.** An hourly, signed, third-party-witnessed history of discrete
on-chain facts about tokenised real-world-asset contracts: the permission
state of each contract at one named block, the events that changed that
state, and a Merkle proof (EIP-1186) tying the state to the block hash so a
stranger can recompute it without trusting this writer.

**What this is not.** Not a rate, not a reference value, not a composite or
continuous series, not a grade, not an opinion on any asset, not a certificate.
Every output is a point-in-time fact with the block it was read at. See
[Use restrictions](#use-restrictions).

Surface: `https://councilof.ai/archive/index.json` and
`/archive/<subject>/index.json`. Method owner: CSOAI Ltd
(nicholas@csoai.org).

---

## 1. What is read

### 1.1 Roster

The roster is the largest tokenised treasury / money-market products by
market capitalisation as listed on rwa.xyz (`app.rwa.xyz/treasuries`, read
2 Sep 2026), restricted to the EVM chains where a full contract address was
confirmed from an official page or a block explorer and then checked by bytes
(`name()` / `symbol()` answered from the named chain's public RPC with the
expected product name). Rows whose address could not be confirmed are listed
in `UNVERIFIED` in `scripts/adapters/evm_permissions.py` and are never read.

Chain facts that bind the roster (owner brief, 2 Sep 2026): BUIDL is issued
by Securitize on Ethereum and other EVM chains; BENJI/FOBXX is Stellar-primary
with EVM share tokens; USDY and OUSG are Ondo products on Ethereum and other
chains. None of these is an XRPL-native issuance; the XRPL reader is a
separate adapter (`scripts/adapters/xrpl.py`).

| Symbol | Chain | Address | Source |
|---|---|---|---|
| BUIDL | ethereum | `0x7712c34205737192402172409a8f7ccef8aa2aec` | etherscan token page |
| BUIDL-I | ethereum | `0x6a9da2d710bb9b700acde7cb81f10f1ff8c89041` | etherscan token page |
| BUIDL | arbitrum / optimism / polygon | see roster | arbiscan / optimistic.etherscan / polygonscan |
| USYC | ethereum / bsc | `0x136471a34f6ef19fe571effc1ca711fdb8e49f2b` / `0x8d0fa28f221eb5735bc71d3a0da67ee5bc821311` | usyc.docs.hashnote.com |
| USDY | ethereum / mantle / arbitrum | `0x96f6ef951840721adbf46ac996b59e0235cb985c` / `0x5be26527e817998a7206475496fde1e68957c5a6` / `0x35e050d3c0ec2d29d269a8ecea763a183bdf9a9d` | etherscan; docs.ondo.finance; arbiscan |
| WTGXX | ethereum | `0x1fecf3d9d4fee7f2c02917a66028a48c6706c179` | etherscan |
| JTRSY | ethereum | `0x8c213ee79581ff4984583c6a801e5263418c4b86` | etherscan |
| BENJI | ethereum / arbitrum | `0x3ddc84940ab509c11b20b76b466933f40b750dc9` / `0xb9e4765bce2609bc1949592059b17ea72fee6c6a` | etherscan; arbiscan |
| USTB | ethereum | `0x43415eb6ff9db7e26a15b704e7a3edce97d31c4e` | docs.superstate.com |
| OUSG | ethereum | `0x1b19c19393e2d034d8ff31ff34c81252fcbbee92` | etherscan |
| TBILL | ethereum / bsc / arbitrum | `0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a` / `0x5b4681f0d7a01b817675f25892d3ad73572fd1d9` / `0xf84d28a8d28292842dd73d1c5f99476a80b6666a` | docs.openeden.com |
| USTBL | ethereum / arbitrum | `0xe4880249745eac5f1ed9d8f7df844792d560e750` / `0x021289588cd81dc1ac87ea91e91607eef68303f5` | etherscan; arbiscan |
| MONY | ethereum | `0x6a7c6aa2b8b8a6a891de552bdeffa87c3f53bd46` | am.jpmorgan.com press release |
| mTBILL | ethereum / base | `0xdd629e5241cbc5919847783e6c96b2de4754e438` (both) | etherscan |
| VBILL | ethereum / bsc | `0x2255718832bc9fd3be1caf75084f4803da14ff01` / `0x14d72634328c4d03bba184a48081df65f1911279` | etherscan; bscscan |
| USCC | ethereum | `0x14d60e7fdc0d71d8611742720e4c50e7a974020c` | docs.superstate.com |
| bIB01 | ethereum / arbitrum / base / avalanche | `0xca30c93b02514f86d5c86a6e375e3a330b435fb5` (all) | explorers |
| ACRED | ethereum | `0x17418038ecf73ba4026c4f428547bf099706f27b` | etherscan |

The full table with issuer, product name, market-cap rank and the exact
source URL is the `ROSTER` list in the adapter; that list is the authority,
this table is a rendering of it.

### 1.2 Permission state (hourly, `csoai.evm.permission-state/0.1`)

For each (token, chain) one batched JSON-RPC request at one pinned block:

- ERC-20 metadata: `name()`, `symbol()`, `decimals()`, `totalSupply()`
- Pause flag: `paused()` (OpenZeppelin Pausable) and `isPaused()` (Securitize DSToken)
- Ownership / roles: `owner()` (Ownable), `getRoleMemberCount(DEFAULT_ADMIN_ROLE)` (AccessControlEnumerable)
- Registry pointers where the ABI is public: `blocklist()`, `allowlist()`,
  `sanctionsList()` (Ondo), `allowList()` / `allowListV2()` (Superstate),
  `accessControl()` (Midas), `hook()` (Centrifuge tranche), `kycManager()`
  (OpenEden), `pauser()` / `terms()` (Backed)
- EIP-1967 proxy slots via `eth_getStorageAt`: implementation and admin

A selector that answers is decoded under `checked`; one that reverts or
returns empty goes under `absent`, meaning only "did not answer at block N".
Things a public RPC cannot answer (allowlist membership of a holder, off-chain
registry contents, NAV/AUM, source verification) are listed under
`unmeasured` on every leaf. Each selector's signature is kept beside its
4-byte id in `PROBES`.

### 1.3 Permission events (hourly, incremental, `csoai.evm.permission-event/0.1`)

`eth_getLogs` on the same addresses for `Paused`, `Unpaused`,
`OwnershipTransferred`, `RoleGranted`, `RoleRevoked`, `Upgraded`,
`AdminChanged`, `BeaconUpgraded`. Topic ids are pinned constants re-derived
from the signatures by a Keccak-256 implementation in the test suite.

Public endpoints cap the block range per call (on 2 Sep 2026: dRPC answered
~5,000 blocks, 1rpc 50, publicnode refused the method). The indexer therefore
scans forward in chunks, halving the chunk on a range error, at most three
chunks per contract and eighty log requests per run, and persists its cursor
in `public/archive/evm-events/state.json` **only after** the root that carries
the run's leaves is written. A first run starts about one day back
(`scanned_from`); older history stays `unmeasured` until an archive-capable
endpoint is pointed at it. That backfill — and the continuously extended range
— is the part of this archive that is not free to reproduce.

Each run also emits one `csoai.evm.permission-scan/0.1` leaf per chain naming
the exact range read for every contract, so "no events" is a dated statement
about a range, never a claim about all time.

### 1.4 The proof (EIP-1186)

Beside the reads, one `eth_getProof(address, [slots], block)` at the same
block returns the account's Merkle-Patricia proof (nonce, balance,
`codeHash`, `storageHash`) and a storage proof for each requested slot — the
two EIP-1967 slots always, plus any slot listed in `KNOWN_SLOTS` for
contracts whose storage layout is published (none on 2 Sep 2026, and the leaf
says so).

The leaf carries `block_hash`, the proof's `sha256`, its byte length, a
summary (`codeHash`, `storageHash`, per-slot values and node counts) and a
URL. The full bytes are written content-addressed to
`/archive/proofs/eip1186/<sha16>.json` in the same commit.

The `storageHash` commits to the contract's entire storage at block N; getter
values obtained by `eth_call` are consistent with it but are individually
slot-proven only when their slot is in `KNOWN_SLOTS`. The leaf's `unmeasured`
names this gap.

---

## 2. How it is signed

Every leaf is a card-v0 payload, canonicalised (sorted keys, compact
separators, UTF-8), capped at 3,072 bytes, hashed with SHA-256 (the hash is
the card id), and Ed25519-signed under
`did:web:csoai.org#board-attestation-1` by the ONE writer
(`scripts/publish_public_root.py`) running in GitHub Actions. There is no
local signing path: a new leaf is signed there or the run halts
(`HALT-ON-UNSIGNED-LEAF`). The leaves are folded into a Merkle tree; the root
envelope (`public/root.json`) is signed over `{kind, schema, as_of,
merkle_root, card_count, did_intended}`; each card ships with its inclusion
path under `/cards/<sha16>.json` and `/proofs/<sha16>.json`.

The public key is served at `https://csoai.org/.well-known/did.json`.

---

## 3. How it is witnessed

After the root is written, `scripts/witness_public_root.py` submits the
root's SHA-256 to two independent, public transparency mechanisms and records
what came back **verbatim** in `public/interop/root-witness-<date>-<sha8>.json`:

- **Rekor** (Sigstore transparency log): a `rekord` entry; the sidecar keeps
  the `logIndex`, entry UUID and query URL. Anyone fetches the entry from
  `rekor.sigstore.dev` and compares the digest.
- **OpenTimestamps**: a `.ots` file for the root bytes, committed beside them;
  status is `STAMPED_PENDING_BITCOIN` until the calendar aggregates into a
  Bitcoin block, then upgradeable by any OTS client.

An EAS-on-Base attestation step exists in the workflow and reports honestly
when it did not attest (no key). None of these is a signature by us; they are
third parties recording that these bytes existed at that time.

---

## 4. How the archive is built and recomputed

`scripts/build_archive_index.py` runs after the witness step, reads the
committed tree (and, with `--backfill`, every commit of `public/root.json`
in git) and appends one entry per series leaf per root to
`public/archive/<subject>/index.json`:

```
{as_of, block, block_hash, block_time, range, n_events, sha256, card_url,
 proof_index, proof_len, eip1186_proof_sha256, eip1186_proof_url,
 root_merkle, root_sha256, root_signed, rekor_logIndex, rekor_url,
 ots_path, commit}
```

The dedupe key is `(as_of, sha256)`. Entries are only ever appended; the
script never rewrites or drops one. The full bytes of each entry (card,
inclusion proof, root fields, witness refs) are appended to
`<subject>/<YYYY-MM>.jsonl`. `public/archive/index.json` lists every subject
with counts and its latest entry.

No key and no network are used by the indexer. It is bytes-only.

**Recomputation by a stranger, without trusting this writer:**

1. Fetch `/cards/<sha16>.json`; canonicalise `card.payload`; check
   `sha256 == card.sha256`; verify `sig_ed25519` against the DID key.
2. Fold `sha256` up `proof` to `root_merkle`; fetch `/root.json` (or the
   commit named in the entry) and compare `merkle_root`; verify the envelope
   signature.
3. Fetch the Rekor entry by `logIndex` and compare its digest to
   `sha256(root.json bytes)` (`root_sha256`); optionally upgrade and verify the
   `.ots`.
4. For a permission-state leaf: fetch `/archive/proofs/eip1186/<sha16>.json`,
   check `sha256(canonical(result)) == payload.proof.sha256`, fetch the block
   header for `payload.block_hash` from any node, and verify the account and
   storage proofs against `header.stateRoot` (EIP-1186 / Merkle-Patricia).
5. Optionally re-issue the same `eth_call`s at `payload.block` against any
   archive node and compare `checked`.

Steps 1–3 need the DID key and the public logs. Step 4 needs only a block
header. Nothing needs us.

---

## 5. Comparators (named, not claimed)

- **eIDAS** (EU Regulation 910/2014 as amended): qualified electronic
  signatures and qualified electronic time stamps from a qualified trust
  service provider carry a legal presumption of integrity and time accuracy.
- **RFC 3161**: the time-stamp protocol under which a Time Stamping Authority
  signs a hash with a trusted time.

**The honesty line.** A card signed with our own Ed25519 key and witnessed by
Rekor and OpenTimestamps is evidence of existence and integrity that anyone
can recompute; it carries **no legal presumption** under eIDAS or any similar
regime. Adding an RFC 3161 timestamp from a qualified trust service provider
is the partner step that would attach such a presumption to the same bytes;
it is not done today, and nothing in this archive should be read as if it
were.

---

## 6. Vocabulary

Outputs use descriptive words only — what was read, at which block, from
which endpoint, and what could not be read — and never a judgement word about
an asset, its issuer or its holders; they never carry MEASURED. The banned
list is held in `scripts/provable-archive-vocab.test.ts`, which gates this
document, the drafts and the adapter sources. Absence of an event is stated
only for the range that was scanned.

---

## Use restrictions

These outputs are discrete, point-in-time facts published for public
verification. They are not for use in or as a financial instrument, not for
the valuation of any financial instrument, and no composite, index, or
continuous reference series is published or implied. Reuse is under the
repository licence; attribution should name the leaf `sha256` and the
`as_of` of the root that carried it.

---

## Files

- `scripts/adapters/evm_permissions.py` — state reader + EIP-1186 proof
- `scripts/adapters/evm_permission_events.py` — event indexer (incremental)
- `scripts/build_archive_index.py` — archive surface (append-only)
- `scripts/publish_public_root.py` — the ONE writer
- `scripts/witness_public_root.py` — Rekor + OpenTimestamps
- `.github/workflows/public-root.yml` — hourly, GHA on master only
- `scripts/adapters/test_evm_permissions.py`, `scripts/archive-index.test.ts`,
  `scripts/provable-archive-vocab.test.ts` — tests with recorded RPC fixtures
