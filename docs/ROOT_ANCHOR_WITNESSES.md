# Root-anchor witnesses — Rekor v2 · OTS Bitcoin · XRPL DID / ERC-8325 — 1 Sep 2026

**Status:** DRAFT HOLD. Design / leftover docs. **Witness ≠ certification.**  
**Locks:** Board **22 · 15 · 7**. Chain / log / calendar witnesses the **root hash only**. Ed25519 stays CSOAI authority. No second root writer. No laptop key. No wrangler. No Cloud Agents. Never certify.

---

## Thesis

External rails **witness** that published root bytes existed — they do **not** grade models, fill empty axes, or replace keystone Ed25519.

```
adapters → make_card → merkle(leaf sha256s) → public/root.json
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              Rekor v2 entry           OTS → Bitcoin              XRPL DID/memo
              + inclusion proof        (~16B class commit)        / ERC-8325 evidenceHash
                    │                         │                         │
                    └──────────── witness ROOT HASH ONLY ───────────────┘
```

---

## Witness layers

| Layer | Who / what | Meaning |
|---|---|---|
| Ed25519 leaf / card | CSOAI (`did:web:csoai.org#…` when keystone live) | Measurement authority |
| Merkle root | Publisher GHA → `public/root.json` | Inclusion of leaves |
| **Rekor v2** | Sigstore public log (hashedrekord-class) | Bytes-existed in append-only log |
| **OTS Bitcoin** | OpenTimestamps → Bitcoin headers | Temporal witness; ~**16-byte** class commitment in hourly aggregate path — do not invent a live txid in copy |
| **XRPL DID / memo** | XRPL public state / DID assertion materials | Optional chain pointer at **root digest** |
| **ERC-8325** | Asset Anchor Registry (Review) `evidenceHash` | Token↔off-chain binding may point at card/root digests — we do **not** claim to operate the canonical registry |

**Kill:** "Rekor / Bitcoin / XRPL proves the model is safe."  
**Keep:** "Witnesses bind the published root hash."

SCITT: RFC 9943 architecture exists; CSOAI `/.well-known/scitt.json` stays **planned**. `we_operate_a_ts = false`.

---

## Hard stops

- Witness **root hash only** — never anchor invented leaf grades.  
- No second writer of `root.json`.  
- No paywall on `/root.json`.  
- Pending / anchored / missing are honest states — missing ≠ VALID.  
- GHA path only for enablement later; this file does **not** enable the job.

Companions: fire-playbook `03-rekor-v2-ots-bitcoin.md` · `04-erc-8325-rwa-xrpl.md` · `docs/DENSER_ROOTS_WEDGE_2026-09-01.md`.

*End. Witnesses, not certification. Europe/London. 1 Sep 2026.*
