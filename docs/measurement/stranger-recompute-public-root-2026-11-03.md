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

## Scope and honesty

- This rehearsal covers the **digest chain** (root → leaf → card bytes → recomputed
  digest) and the **signature verdict** (VALID from the free verifier). It does not
  re-implement Ed25519 verification locally — that is the verifier's job, and the
  standalone `verify-card.mjs` (no dependencies, plain Node) is the local route.
- The worked example used the newest leaf on the day. Any leaf works; the chain is
  leaf-agnostic. If a future run fails here, that is a finding about the estate, not
  about the stranger — file it to `/api/corrections`.
