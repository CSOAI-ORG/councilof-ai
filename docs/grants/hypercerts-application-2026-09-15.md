# Hypercerts Impact Claim — Draft (15 September 2026)

> **Status: DRAFT — NOT POSTED / NOT MINTED.**
>
> This document contains a Hypercerts-compatible metadata JSON record describing the impact
> of building open measurement infrastructure for AI systems. Nothing here has been posted to
> a PDS (ATProto), minted on any chain, or registered with the Hypercerts protocol.
>
> All figures are sourced from live public endpoints and pinned repo files. Re-fetch before
> posting.

---

## Hypercert Metadata (ERC-1155 Compatible)

```json
{
  "name": "Council of AI — Open Measurement Infrastructure for AI Systems (303-card Merkle root, OTS-anchored, x402 settlement rail)",
  "description": "Building an independently verifiable measurement infrastructure for AI systems: 303 Ed25519-signed measurement cards under a public Merkle root (e4cc26d16e9b6827dacdc88c0a527676831ad106151b5acff33659636c6cc03d), anchored to Bitcoin via OpenTimestamps, mirrored to Sigstore Rekor (logIndex 2,791,822,965), with an x402 settlement rail live on Base (USDC) and a public corrections ledger. Verification is free forever with no issuer dependency. Measurement, not certification — three states only: VALID, INVALID, UNCHECKABLE. CSOAI Ltd (UK 16939677).",
  "external_url": "https://councilof.ai",
  "image": "https://councilof.ai/images/coliseum_hero_arena.jpg",
  "version": "1.0.0",
  "ref": "csoai-measurement-infrastructure-2026-09-15",
  "hypercert": {
    "contributors": {
      "display_value": "CSOAI Ltd (UK Companies House 16939677) — sole maintainer",
      "name": "Contributors",
      "value": [
        "did:web:csoai.org",
        "https://orcid.org/0009-0001-3869-1068"
      ]
    },
    "work_scope": {
      "display_value": "Independent AI measurement infrastructure: signed cards, Merkle root, OTS anchoring, Rekor mirroring, x402 settlement, public corrections ledger, MCP server fleet",
      "excludes": [],
      "name": "Work Scope",
      "value": [
        "ai-model-measurement",
        "signed-measurement-cards",
        "merkle-tree-anchoring",
        "opentimestamps-bitcoin",
        "sigstore-rekor",
        "x402-payment-rail",
        "corrections-ledger",
        "mcp-server-fleet"
      ]
    },
    "work_timeframe": {
      "display_value": "2026-01-02 (company incorporation) → 2026-09-15 (current state)",
      "name": "Work Timeframe",
      "value": [
        1767312000,
        1757894400
      ]
    },
    "impact_scope": {
      "display_value": "Anyone — regulators, researchers, developers, AI vendors — can verify what a model did without trusting the publisher",
      "excludes": [],
      "name": "Impact Scope",
      "value": [
        "verifiable-ai-measurement",
        "open-infrastructure",
        "regulatory-compliance-evidence",
        "agent-economy-settlement"
      ]
    },
    "impact_timeframe": {
      "display_value": "2026-01-02 → indefinite",
      "name": "Impact Timeframe",
      "value": [
        1767312000,
        0
      ]
    },
    "rights": {
      "display_value": "CC-BY-4.0 (measurement data and cards); AGPL-3.0 (repository); Apache-2.0 (published packages)",
      "excludes": [],
      "name": "Rights",
      "value": [
        "CC-BY-4.0",
        "AGPL-3.0",
        "Apache-2.0"
      ]
    }
  },
  "properties": [
    {
      "trait_type": "card_count",
      "value": "303"
    },
    {
      "trait_type": "signed_chain_length",
      "value": "335"
    },
    {
      "trait_type": "measured_axes",
      "value": "22 of 22"
    },
    {
      "trait_type": "merkle_root",
      "value": "e4cc26d16e9b6827dacdc88c0a527676831ad106151b5acff33659636c6cc03d"
    },
    {
      "trait_type": "root_json_sha256",
      "value": "74797e30d6d98267e5ab4c8e275b135235fdf1afc6eee6b5c1f00537c41b751b"
    },
    {
      "trait_type": "rekor_log_index",
      "value": "2791822965"
    },
    {
      "trait_type": "ots_state",
      "value": "STAMPED_PENDING_BITCOIN"
    },
    {
      "trait_type": "signing_algorithm",
      "value": "Ed25519"
    },
    {
      "trait_type": "did",
      "value": "did:web:csoai.org#board-attestation-1"
    },
    {
      "trait_type": "signing_pubkey",
      "value": "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"
    },
    {
      "trait_type": "mcp_registry_servers",
      "value": "354"
    },
    {
      "trait_type": "x402_network",
      "value": "eip155:8453 (Base), USDC"
    },
    {
      "trait_type": "x402_payto",
      "value": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
    },
    {
      "trait_type": "external_revenue",
      "value": "$0.00 (honest)"
    },
    {
      "trait_type": "corrections_ledger_entries",
      "value": "46+"
    },
    {
      "trait_type": "status_language",
      "value": "measurement, not certification"
    },
    {
      "trait_type": "company",
      "value": "CSOAI Ltd, UK 16939677"
    },
    {
      "trait_type": "license_data",
      "value": "CC-BY-4.0"
    },
    {
      "trait_type": "license_code",
      "value": "AGPL-3.0, Apache-2.0"
    }
  ]
}
```

---

## Evidence Links

| Evidence | URL | What it proves |
|---|---|---|
| Public root | https://councilof.ai/root.json | 303-card Merkle root, Ed25519-signed, with card_count and merkle_root |
| Live board | https://councilof.ai/api/gspc | 22 axes measured, 0 unmeasured |
| Signed chain | https://councilof.ai/signed/chain.json | 335 cards in the signed hash-chain |
| Card index | https://councilof.ai/signed/card_index.json | 335 indexed entries with axis, sha256, signature |
| DID document | https://csoai.org/.well-known/did.json | Signing key and DID resolution |
| x402 discovery | https://councilof.ai/.well-known/x402.json | Payment rail configuration |
| Live feed | https://councilof.ai/feed.xml | Atom feed of measurement events |
| MCP server | https://councilof.ai/mcp | Machine-readable measurement tools |
| Repository | https://github.com/CSOAI-ORG/councilof-ai | Full source code |
| DOI | https://doi.org/10.5281/zenodo.21991104 | Archival citation |

---

## Honest Status Disclosure

This hypercert describes **infrastructure built and operating**, not outcomes achieved.
The following are stated honestly:

1. **Revenue: $0.00 external.** The x402 settlement rail is live (USDC on Base) but no external
   customer has completed a paid settlement. Self-settlements are excluded by doctrine.

2. **OTS: stamped, not yet Bitcoin-confirmed.** The OpenTimestamps proof exists but has not yet
   been confirmed in a Bitcoin block. The `.ots` file covers a prior version of `root.json`.

3. **Single signing key.** All signatures use one Ed25519 key under one DID. This proves custody,
   not independence. The threat model discloses this.

4. **Merkle tree caveat.** Odd-node duplication makes the tree shape collidable in the
   CVE-2012-2459 sense. The `tree_caveat` field in `root.json` discloses this openly and
   describes the mitigation (verifier must check `card_count == len(card_sha256)`).

5. **Simulated ceremony disclosed.** The BFT ceremony in `_quarantine/simulated-bft-2026-09-04/`
   was simulated. Quorum votes and council manifests were generated for testing, not produced
   by real independent nodes.

---

## ATProto Record (If Posting via AT Protocol)

If the owner decides to post this hypercert to an ATProto PDS (no chain fee, no minting cost),
the record would follow the Hypercerts ATProto lexicon at:

```
app.bsky.graph.lists item pointing to org.hypercerts.claim
```

The AT-URI, if posted, should be recorded in the tracking table at:
`docs/grants/2026-09-06/hypercerts/README.md`

---

_Drafted 2026-09-15. Owner posts; this lane does not._
