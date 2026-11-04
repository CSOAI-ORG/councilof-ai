# Stranger recomputation: the public root → a card digest, from published bytes alone

**Doc ID:** `csoai.stranger-recompute.public-root/0.1` · **Executed:** 2026-11-03
**The close test it rehearses** (work plan Y3, BANK-PIN-STRANGER-RECOMPUTABILITY): *a
stranger with no prior context reproduces a signed card end-to-end from published
inputs.* This document IS a rehearsal: every command below was executed, and every
output is pasted from the run. A stranger who follows it reaches the same digest
without asking us anything.

**What "recompute" means here.** The Merkle root's leaves are NOT the sha256 of the
served file. `root.json → leaf_definition` states it:
`sha256(canonical(card minus sha256 and sig_ed25519))` — the digest binds the
canonicalized card body with its own `sha256` and `sig_ed25519` stripped; the card's
`digest_covers` field says the same thing (`"whole-card-except-sha256-and-sig_ed25519"`).

## The chain, executed 2026-11-03

### Step 1 — read the public root, take one leaf

```console
$ curl -s https://councilof.ai/root.json
{"as_of": ..., "card_count": 428, "card_sha256": ["056a1efd...", ..., "6109d9dd03edf688..."],
 "leaf_definition": "sha256(canonical(card minus sha256 and sig_ed25519)) — binds subject, ...", ...}
```

### Step 2 — fetch the card through the canonical door

```console
$ curl -sL https://councilof.ai/cards/6109d9dd03edf688.json > card.json
```

The door 302s to the mirror. The envelope arrives: `{"card": {...}, "proof": {...}}`.

### Step 3 — recompute the leaf digest

```python
import json, hashlib
env = json.load(open("card.json"))
inner = env["card"]                                   # the signed body
stripped = {k: v for k, v in inner.items() if k not in ("sha256", "sig_ed25519")}
canonical = json.dumps(stripped, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
print(hashlib.sha256(canonical.encode()).hexdigest())
```

Executed output:

```
recomputed: 6109d9dd03edf688f511bb106fb5a25ad5b2650c3c04e6116271a01c72d65111
== leaf:    True
```

The recomputed digest equals the root's leaf **and** the card's own `sha256` field.
`root.json` commits to bytes a stranger re-derived from other published bytes: the
close test's core, green.

### Step 4 — the independent verifier judges the same bytes

```console
$ curl -s -X POST https://councilof.ai/api/verify \
    -H "Content-Type: application/json" --data-binary @card.json
{"state": "VALID", "cryptographic_state": "VALID", ...}
```

## The two traps a stranger hits (documented so the next one does not stop here)

1. **Naive hash fails, by design.** `sha256(card.json)` (the served file) does NOT
   equal the leaf — the leaf covers the canonicalized inner body minus the two
   self-describing fields. Nothing is wrong; the grammar is `leaf_definition`.
   A first-time reader who hashes the raw file gets a mismatch and may wrongly
   conclude tampering. This section exists so the mismatch is explainable in one read.
2. **Default Python UAs are 403'd at the edge** (`Python-urllib/3.x` → 403 on
   `root.json` and the verify POST) while curl and browsers pass. Workaround:
   send any browser/curl User-Agent, or use curl. Logged as an owner-side WAF
   exception request — an evidence door should not depend on a UA string.

## Step 5 — prove inclusion WITHOUT trusting anyone (executed 2026-11-03)

The verifier's word is one thing; mathematics is another. `GET /api/proof?sha=<leaf>`
returns the audit path — free, no credentials. For the same leaf: 9 sibling digests,
index 427, claimed root `4e57607854be...e08aa0`.

```python
h = bytes.fromhex(leaf)
idx = index
for sib in proof:                       # 9 sibling digests
    sib = bytes.fromhex(sib)
    h = hashlib.sha256(h + sib).digest() if idx % 2 == 0 else hashlib.sha256(sib + h).digest()
    idx //= 2
print(h.hex() == claimed_root)          # True
```

Executed output: `plain concat: True`. The public root's scheme is plain
`sha256(concat)` with no domain separation (unlike the capsule trees' RFC-6962
prefixes). The root is reproducible from the leaf and the published siblings —
inclusion does not rest on our API's say-so.

## Step 6 — two card corpora, two verifications (a distinction worth its own section)

The estate serves TWO artifact classes and they verify differently:

| corpus | where | what it is | verification |
|---|---|---|---|
| public-root leaves | `/cards/<sha16>.json` | content-addressed leaves of the Merkle root | digest recomputation (step 3) + inclusion proof (step 5) |
| signed measurement cards | `/signed/cards/<sha64>.json` | Ed25519-signed measurement cards (the 335-card signed index) | signature check by `verify-card.mjs` or `/api/verify` |

`verify-card.mjs` (226 lines, MIT, zero dependencies, plain Node) verifies the
**signed-card** corpus — feeding it a public-root leaf answers `UNCHECKABLE: not a
card`, which is correct, not a failure. Executed: `node verify-card.mjs
signed-card.json` → `VALID 1 · INVALID 0 · UNCHECKABLE 0`. Its header documents the
subtlest trap in the estate: CPython renders integral floats as `0.0` while every
JS/Go/JCS canonicalizer writes `0`, so a naive JS verifier false-fails about a third
of the cards — the shipped verifier handles it.

## Scope and honesty

- This rehearsal covers the **digest chain** (root → leaf → card bytes → recomputed
  digest), the **inclusion proof** (audit path → root, recomputed), and the
  **signature verdict** (VALID from the free verifier; the standalone
  `verify-card.mjs` on the signed-card corpus). It does not
  re-implement Ed25519 verification locally — that is the verifier's job, and the
  standalone `verify-card.mjs` (no dependencies, plain Node) is the local route.
- The worked example used the newest leaf on the day. Any leaf works; the chain is
  leaf-agnostic. If a future run fails here, that is a finding about the estate, not
  about the stranger — file it to `/api/corrections`.
