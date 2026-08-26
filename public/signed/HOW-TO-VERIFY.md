# How to verify a Council of AI measurement card

You do not need our code, our permission, or our word for any of this. Everything below runs
against the published bytes.

**Algorithm:** Ed25519 · **Distinct signing keys:** 1

## 0. Two different sets — do not read one as the other

This directory publishes two files that are easy to confuse, and quoting either as the other
is wrong in both directions. They are counted separately and neither count is typed here.

| File | What it is | Read the count from |
|---|---|---|
| `/signed/card_index.json` | **The curated index.** A deliberately frozen SUBSET, held at the verifiable floor described in `BOARD-RULING.md`. Every row resolves to a published body. | its `n_cards` field |
| `/signed/chain.json` | **The chain manifest.** Every position in the card chain, head to genesis, in order — including positions whose body we do not publish (`body_published:false`). | its `links[]`, recounted |

The published card **store** — the bodies actually on disk under `/signed/cards/` — is larger
than the curated index and smaller than the chain. All three numbers, each recounted from the
bytes rather than typed, are published at `/signed/chain-facts.json` and `GET /api/state →
card_chain`. Quoting the index as "cards published" understates the store; quoting the chain's
position count as "cards published" overstates it, because withheld positions have no body.

## 1. Pin the key first — this step is not optional

A card carries its own `pubkey`. Verifying a card against the key it ships with proves only
that the file is *self-consistent*: anyone can alter a body, sign it with a key they generated
a second ago, and it will verify. **That is not authenticity.** Pin against the key published
in our DID document and compare before you trust anything:

```bash
curl -s https://councilof.ai/.well-known/did.json \
  | python3 -c "import sys,json,base64; \
      k=[v for v in json.load(sys.stdin)['verificationMethod'] if v['id'].endswith('#card-attestation-1')][0]; \
      x=k['publicKeyJwk']['x']; \
      print(base64.urlsafe_b64decode(x+'='*(-len(x)%4)).hex())"
# -> d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38
```

Every published card MUST carry that exact `pubkey`. If one does not, stop.

## 2. The rule

    id        == sha256(preimage).hexdigest()
    preimage  == json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
    signature == Ed25519(preimage) under the pinned key

## 3. ⚠ Number representation — read this before implementing outside Python

The preimage was produced by CPython's `json.dumps`, which renders a float of integral value
as **`0.0`**. ECMAScript `JSON.stringify`, Go's `encoding/json`, and RFC 8785 (JCS) all render
the same value as **`0`**. Some published cards contain such a value, so a
naive JavaScript or Go verifier computes a different preimage and reports a **false failure**
on a subset of the set.

This is a property of the bytes that were signed; we cannot change it without re-signing every
card and breaking every id, which are hashes of these exact bytes. So it is specified here
instead. In JavaScript, serialise integral floats with a trailing `.0`:

```js
const canon = (v) => Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
  : v && typeof v === "object" ? "{" + Object.keys(v).sort()
      .map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}"
  : typeof v === "number" && Number.isInteger(v) && !Number.isInteger(Math.fround(v * 1.0000001))
      ? v.toFixed(1) : JSON.stringify(v);
```

**Known limitation, stated rather than hidden:** JavaScript cannot distinguish `0` from `0.0`
at runtime — both are the same IEEE-754 double. A JS verifier therefore needs the schema to
tell it which fields are floats. The fields that are floats in our cards are `accuracy` and
any field ending `_ci_low` / `_ci_high`. A future card format should use JCS so this note is
unnecessary; the signed card ids cannot be migrated without invalidating them.

## 4. Check one card

```bash
curl -s https://councilof.ai/signed/cards/<card-id>.json -o card.json
python3 - <<'EOF'
import json, hashlib
from nacl.signing import VerifyKey
PINNED = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"          # from step 1
c = json.load(open('card.json'))
assert c['pubkey'] == PINNED, 'key is not the published card-attestation key'
pre = json.dumps(c['body'], sort_keys=True, separators=(',',':'), ensure_ascii=True).encode()
assert hashlib.sha256(pre).hexdigest() == c['id'], 'id does not match its body'
VerifyKey(bytes.fromhex(PINNED)).verify(pre, bytes.fromhex(c['signature']))
print('VALID —', c['id'][:16], c['body'].get('axis'))
EOF
```

Alter the body by one character and the hash fails. Substitute a key and step 1 fails. Both
are loud.

## 5. Check every card

To check **the curated index** (the frozen subset):

```bash
curl -s https://councilof.ai/signed/card_index.json -o index.json
# each index entry carries: card (the id), axis, ts, signed, kid
# (the full signed payload — pubkey, signature, preimage — is in the card payload, not the index row)
```

To check **the whole published store**, walk the chain manifest instead — it lists every
position, so a card we withhold shows up as a withheld position rather than as an absence you
cannot distinguish from a card that never existed:

```bash
curl -s https://councilof.ai/signed/chain.json -o chain.json
# walk `prev` from `head` to `genesis_prev`: every id must appear exactly once.
# links with body_published:true carry a card_url you can fetch and check with step 4.
# links with body_published:false have no body — you get the id and the signature, nothing more.
```

Fetch each `card_url`, then run step 4 against every one with the same pinned key.
Empty cells stay empty. Do not invent extras.

## What this does and does not prove

It proves these exact measurement bodies were signed by the holder of the published
card-attestation key and have not been altered since. **It does not prove the measurement is
correct** — that rests on the published method, the gold labels and the rows, all separately
available. A signature is an integrity claim, not a truth claim.

**It also does not prove the set is complete.** Each card verifies individually; completeness is
a separate question, and the honest answer is in the bytes rather than in a number typed here.
`chain.json` lists every position in order, which is what lets you see that nothing was silently
dropped — but **the manifest carries no signature of its own.** Each LINK is signed; the list is
not. So the ordering, and the assertion that no position was removed from it, rest on our word
and not on cryptography. A withheld position is cryptographically attested only when some
PUBLISHED card's signed body names it as `prev` — that count is derived, published, and much
smaller than the number of withheld positions. Both travel together at
`/signed/chain-facts.json`; quoting the withheld count alone would present a disclosure as a proof.
