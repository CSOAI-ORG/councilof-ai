# DRAFT — HOLD. Not submitted. Owner review required before anything is sent.

Target: Arbitrum Questbook grant programme, evidence-tooling track.
Applicant entity: CSOAI Ltd (GB, Companies House 16939677), 3rd Floor, 86-90
Paul Street, London EC2A 4NE. Contact: nicholas@csoai.org.
Status: draft text only; no form has been opened, no account created, nothing
posted. KYB: the programme requires know-your-business verification of the
applicant entity; the owner completes that step personally (company documents,
director identity). Nothing in this draft pre-empts it.

---

## Title

An open, recomputable evidence archive for tokenised-asset permission state on
Arbitrum

## One paragraph

Tokenised treasuries and money-market funds on Arbitrum (BUIDL, USDY, BENJI,
TBILL, USTBL, bIB01 among them) are contracts whose transferability depends on
permission state — pause flags, owner and admin roles, allow/block registries,
proxy implementations — that can change in one transaction and leave no
dated, independently verifiable record. We publish that record: every hour,
the permission state of each contract is read at one named block from public
RPCs, packaged as a ≤3 KB signed fact card with an EIP-1186 Merkle proof
against the block hash, folded under one signed Merkle root, and witnessed in
the Sigstore Rekor transparency log and OpenTimestamps. The events that change
that state (Paused/Unpaused, OwnershipTransferred, RoleGranted/Revoked,
Upgraded) are indexed incrementally into the same archive. Anyone recomputes
every step from public bytes; nobody has to trust us. The code is Apache-2.0
and the archive is free to read.

## What exists today (facts, 2 Sep 2026)

- Adapter reading 32 (token, chain) pairs across 8 EVM chains, 7 of them on
  Arbitrum (BUIDL, USDY, BENJI, TBILL, USTBL, bIB01 and the BUIDL share class
  where confirmed). Addresses verified by bytes (`name()`/`symbol()`); rows
  that could not be confirmed are listed as UNVERIFIED and never read.
- EIP-1186 `eth_getProof` per pair per hour, bytes committed content-addressed
  beside the card; the card carries the block hash and the proof's SHA-256.
- Event indexer for the seven permission events, incremental, rate-limited,
  cursor committed only after the root that carries its leaves.
- Archive surface `councilof.ai/archive/index.json` and per-subject
  append-only indexes; backfilled from git history.
- Method document: `docs/PROVABLE-ARCHIVE-METHOD.md` (what is read, how signed,
  how witnessed, how a stranger recomputes; eIDAS and RFC 3161 named as
  comparators only — a self-signed card carries no legal presumption).
- Tests with recorded RPC fixtures; vocabulary gate on all prose.

## What the grant would fund (scope, deliverables, budget line-items TBD by owner)

1. **Archive-depth backfill on Arbitrum.** Public `eth_getLogs` is capped at a
   few thousand blocks per call; a full history of each roster contract from
   deployment needs an archive-capable endpoint. Deliverable: complete
   permission-event history for every roster contract on Arbitrum, published
   under the same signed root, with the exact ranges named.
2. **Storage-layout registry for slot-level proofs.** Today the EIP-1186 proof
   covers the account (`codeHash`, `storageHash`) and the two EIP-1967 proxy
   slots. For contracts with verified source we add the storage slot of the
   pause flag and owner so those specific values are Merkle-proven, not just
   consistent with `storageHash`. Deliverable: `KNOWN_SLOTS` entries with the
   source citation for every Arbitrum roster contract where the layout is
   published.
3. **Independent verifier.** A standalone, dependency-light CLI (and a browser
   page) that takes a card URL and checks: payload hash, Ed25519 signature,
   Merkle inclusion, Rekor entry digest, OTS proof, and the EIP-1186 proof
   against a block header fetched from any Arbitrum node the user chooses.
4. **Roster governance.** A documented, public process for adding a contract
   (official address citation + bytes check) so the roster is not ours to
   curate silently.

## What this is not

Not a rate, not a reference value, not a composite or continuous series, not a
grade, not an opinion on any asset, and not for use in or as a financial
instrument. Outputs are discrete point-in-time facts with use restrictions
stated on the archive index.

## Why open

The archive is only worth anything if a stranger can recompute it. Apache-2.0
code, public bytes, public logs, no API key anywhere in the path. The moat is
the accumulated, witnessed history — which is exactly the thing a grant makes
deeper and which nobody can retroactively fabricate.

## Links (live)

- https://councilof.ai/root.json — the one signed root
- https://councilof.ai/interop/root-witness-pointer.json — witness status
- https://councilof.ai/archive/index.json — archive index (after first publish)
- https://github.com/CSOAI-ORG/councilof-ai — source (Apache-2.0)

## Owner decisions before sending

- Budget figures and milestone dates (none typed here).
- Whether to name the counsel gate on use-restriction wording.
- KYB documents (owner-only).
