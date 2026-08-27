# How to verify a Council of AI measurement card

You do not need our code, our permission, or our word for any of this. Everything below runs
against the published bytes.

**Cards published:** 313 · **Algorithm:** Ed25519 · **Distinct signing keys:** 1

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
the same value as **`0`**. 116 of our 313 cards contain such a value, so a
naive JavaScript or Go verifier computes a different preimage and reports a **false failure**
on roughly a third of the set.

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
unnecessary; these 150 cannot be migrated without invalidating their ids.

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

```bash
curl -s https://councilof.ai/signed/card_index.json -o index.json
# each entry carries: card (the id), axis, ts, kid, signed, sig, pubkey, card_url
```

Fetch each `card_url`, then run step 4 against every one with the same pinned key.

## 6. Verifying the chain manifest

`/signed/chain.json` is card-shaped: `{body, id, alg, preimage_rule, pubkey, signature}`
where `body` is the full chain manifest — every position head→genesis, including the ones
whose body is withheld. It is signed by the SAME pinned card-attestation key under the SAME
preimage rule as every card, so the published verifier checks it unchanged:

```bash
curl -s https://councilof.ai/signed/chain.json -o chain.json
node verify-card.mjs chain.json
```

Three states, never two — the same contract as any card:

- **VALID** — the manifest body reproduces its `id` and the signature verifies under the
  pinned key. The LIST itself (ordering; nothing silently dropped) is now attested, not
  merely asserted. Then walk `prev` from `body.head` to `body.genesis_prev`.
- **INVALID** — the manifest fails the rule. Do not walk it; a chain read off an unverified
  manifest inherits the manifest's trust, which is now zero.
- **UNCHECKABLE** — the check itself could not complete (no Ed25519 in the runtime, a
  malformed file). "Could not check" is a different claim from "forged" — report it as
  such, never as a pass and never as a failure.

A VALID manifest makes the published set non-repudiable — we cannot later disown it. It
still does not prove the set was not chosen: see `body.what_this_does_not_prove`.

## What this does and does not prove

It proves these exact measurement bodies were signed by the holder of the published
card-attestation key and have not been altered since. **It does not prove the measurement is
correct** — that rests on the published method, the gold labels and the rows, all separately
available. A signature is an integrity claim, not a truth claim.

**It also does not prove the set is complete.** The index declares a chain head that is not
among these 313 cards: they are a prefix of a longer chain. Each card verifies
individually; completeness does not.
