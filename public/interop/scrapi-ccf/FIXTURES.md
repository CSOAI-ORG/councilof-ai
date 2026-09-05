# Offline fixture notes — pinned public vectors

Pinned **2026-09-02** from public GitHub contents. Digests are content SHA-256
of the fetched bytes. We do **not** re-host binary `.cose` blobs in-tree; pins
+ `source_urls` are enough for an honest denser-root leaf.

## Binding rule (always)

```
proof.leaf.data-hash == HASH(candidate)
```

If that equality fails, the receipt does not cover the candidate. Status of a
live check on this estate: **UNCHECKABLE** (we are not a TS; no live keys).

---

## A. action-state-group/scitt-cose (Iman LC cite)

Repo commit: `7bbfaffd9730969ffbb49259980741b7bac1d83e`

### A1. `interop/ccf/shared-vector.json`

| Field | Value |
| --- | --- |
| sha256 | `1034697d531aba43a9a115bb599ec7542b2997cf16f4510c812e45d16a1aaa6d` |
| size | 11735 bytes |
| url | https://raw.githubusercontent.com/action-state-group/scitt-cose/7bbfaffd9730969ffbb49259980741b7bac1d83e/interop/ccf/shared-vector.json |

IETF 126 cross-TS interop vector: ASG RFC9162 receipt + Amaury/Microsoft CCF
dev-node receipt (`vds=2`, txid `2.15`). **Dev node — not production.**

### A2. `test-vectors/v1/valid-ccf-vds2`

Happy path: real pyscitt `did:x509` statement + real CCF `ccf.v1` receipt from
`scitt-ccf-ledger` v7.0.6 (VIRTUAL node, 2026-06-26). Digests match upstream
`test-vectors/SHA256SUMS`:

| File | sha256 |
| --- | --- |
| `statement.cose` | `cdd87929ead61eca8f5a30a743eca3a625a287b85b9b8c85ae497c68899644f8` |
| `receipt.cose` | `c958efd5944b049d162194593cd87a8a83e8d40085a0cf1a5b1aa06ae1407c1a` |
| `payload.bin` | `04935e9a37f6d7c6e12724a69c9c31599c1d3fe9c08232c15fa37a671f8747b9` |
| `issuer-key.pub` | `07c630cdcf81b73cc40477d5af03dad67eb8ac279ffdbb85cd077d2249a6a5f1` |
| `log-key.pub` | `e2beb44155a0fab01dcd719715c5b1f5d4a276b18d1fe08c309a7fc4d18653d3` |
| `expected.json` | `e484e717249b770c4d025c1d54f3b41bd51b62750a2f2196cf84f8f6afd9ddc6` |

Expected (upstream): `result=VALID`, `leaf_entry=cdd87929…`,
`reconstructed_root=1cb9bf81…`, receipt `vds=2`.

Tree: https://github.com/action-state-group/scitt-cose/tree/7bbfaffd9730969ffbb49259980741b7bac1d83e/test-vectors/v1/valid-ccf-vds2

---

## B. microsoft/scitt-ccf-ledger

Repo commit: `83062aac2b453cec7e98e4b5c335deba8f4cfc32`

Public **signed-statement** fixtures under `test/payloads` (receipts are minted
inside their local test ledger — we pin statements only):

| Path | sha256 | size |
| --- | --- | --- |
| `test/payloads/manifest.spdx.json.sha384.digest.cose` | `feed68f19b4b8a5278fa1a79096caa8c9cd604eecccb71dea7a3e44112eccc90` | 4296 |
| `test/payloads/cts-hashv-cwtclaims-b64url.cose` | `213105fdc0da9022c20e8f49195d0bb621cedf87fdee29aad80e2e605af94c87` | 5624 |
| `test/payloads/cosesign1tool-scitt-a3be7e5.cose` | `c61c91d522c0f14c5f2f389ae78ddf132bb2665e754b2f3dbd3a8047a1afb0cc` | 11509 |

Also noted (not content-hashed in this eat): `test/transparent_statements/`
(`uvm_0.2.10.cose`, `esrp-cts-db.json`) and additional `css-attested-*.cose`
payloads — see upstream tree.

---

## C. What we deliberately do **not** ship

- No `/.well-known/scitt-keys` artifact
- No TS private keys, no minted CSOAI receipts
- No claim that councilof.ai registered any of these statements
- No binary vendoring of `.cose` (pins + URLs only)

If a future re-fetch fails or digests drift, mark the pin **UNCHECKABLE** and
keep `source_urls` — do not invent a green check.

---

## D. Re-runner's warning: check out in binary mode

Raised by Emek Can Doğru (VERAX Teknoloji / Conarium) while independently recomputing the
tag vector on 2026-09-03, and caught the right way — by parsing rather than by hashing.

**A text-mode checkout changes a fixture's file hash without changing the vector.** If git
translates line endings on your platform, `sha256(file)` moves while the CBOR item inside is
byte-identical. Re-runners then see a digest mismatch and reasonably conclude the fixtures
have been tampered with, when nothing has.

This is not hypothetical for this repository: the published preimages are byte-exact and the
whole point of the exercise is that one byte moves the whole hash.

    # before re-running anything here
    git config core.autocrlf false
    git config core.eol lf

If a digest still disagrees, decode the CBOR and compare the *item*, not the file. A vector
that parses to the same COSE_Sign1 with a different file hash is a checkout artefact, not a
tampered fixture — and that distinction is exactly the VALID / INVALID / UNCHECKABLE call
these fixtures exist to teach.
