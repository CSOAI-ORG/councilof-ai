# How to verify a Council of AI measurement card

You do not need our code, our permission, or our word for any of this. Everything below runs
against the published bytes.

**Cards published:** 150
**Algorithm:** Ed25519
**Distinct signing keys:** 1

## The rule

    id        == sha256(preimage).hexdigest()
    preimage  == json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
    signature == Ed25519(preimage) under the card's `pubkey`

## Check one card

```bash
curl -s https://councilof.ai/signed/cards/<card-id>.json -o card.json
python3 - <<'PY'
import json, hashlib
from nacl.signing import VerifyKey
c = json.load(open('card.json'))
pre = json.dumps(c['body'], sort_keys=True, separators=(',',':'), ensure_ascii=True).encode()
assert hashlib.sha256(pre).hexdigest() == c['id'], 'id does not match its body'
VerifyKey(bytes.fromhex(c['pubkey'])).verify(pre, bytes.fromhex(c['signature']))
print('VALID —', c['id'][:16], c['body'].get('axis'))
PY
```

If the body were altered by one character the hash would not match, and if the signature were
forged the verify would raise. Both failures are loud.

## Check every card

```bash
curl -s https://councilof.ai/signed/card_index.json -o index.json
# each entry carries `sig`, `pubkey` and `card_url`
```

## What this does and does not prove

It proves these exact measurement bodies were signed by the holder of that key and have not
been altered since. **It does not prove the measurement is correct** — that rests on the
published method, the gold labels and the rows, all of which are separately available. A
signature is an integrity claim, not a truth claim, and we do not want it mistaken for one.
