# How to verify a Council of AI measurement card

You do not need our code, our permission, or our word for any of this. Everything below runs
against the published bytes.

**Cards published:** 335 · **Algorithm:** Ed25519 · **Distinct signing keys:** 1

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
the same value as **`0`**. Integral-float cards in this set do the same, so a
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
unnecessary; these cards cannot be migrated without invalidating their ids. The 150-row floor previously published is a subset of this 335-card chain, not a second measurement.

### Two number spellings — do not mix them

`Number.prototype.toString` (ES6 / RFC 8785) is a **print algorithm for one IEEE-754
binary64**. After JSON parse there is no memory that a field was a Python float.

| IEEE-754 value | Rule A — published cards (CPython `json.dumps`) | Rule B — JCS / board / catalog (ES6 `ToString`) |
|---|---|---|
| 0 | `0.0` | `0` |
| 1 | `1.0` | `1` |
| 1e-6 | `1e-06` | `0.000001` |
| 1e-7 | `1e-07` | `1e-7` |
| 1e20 | `1e+20` | `100000000000000000000` |
| 1e21 | `1e+21` | `1e+21` |

- **Rule A** is these cards. Keep `0.0` on the float fields named above. Do not
  "canonicalize" a published card with JCS or `JSON.stringify`.
- **Rule B** is the living board stamp (`sig_input` on `/api/gspc`), new catalog
  rows, and any artefact that declares `preimage_rule: "jcs-rfc8785"`. Emit ES6
  `ToString`; no `.0`; Python `repr` is the wrong algorithm (`1e-06` ≠ `0.000001`).
- A Python-only dump of a board payload can still match Rule B **if** those
  fields are JSON ints, not floats.

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

## ⚠ Known blocker: the default Python user-agent is refused (403)

Verification is free forever, but at time of writing our CDN's bot rules
refuse the **stdlib default user-agent**. A no-dependency script is the most
likely way anyone actually checks a card, so this matters:

```
UA=Python-urllib/3.13   -> 403   /api/gspc, /signed/*
UA=python-requests/2.31 -> 200
UA=curl/8.4.0           -> 200
UA=<empty>              -> 200
```

A 403 is **not** an invalid card. If you get one, your verifier must report
**UNCHECKABLE**, never INVALID and never a guessed number. Until the rule is
lifted, set any explicit user-agent:

```python
req = urllib.request.Request(url, headers={"User-Agent": "my-verifier/1.0"})
body = urllib.request.urlopen(req, timeout=30).read()
```

Verified 2026-09-03. This is our defect, not yours — it is tracked and will be
removed. The bytes behind the 403 are unchanged and independently checkable.

## Public-root witnesses — read the current state, do not inherit an old one

The signed-card corpus above and the public-root corpus are separate. The current
`/root.json` envelope is Ed25519-signed under `#board-attestation-1`; its exact bytes
may also have external witnesses. Read each witness state from
`/interop/root-witness-latest.json`. Do not count a signature as a timestamp, do not
invent an RFC-3161 TSA, and do not inherit `CONFIRMED_BITCOIN` from an older root.

| rail | what a completed state establishes | boundary |
|---|---|---|
| Ed25519 root envelope | the six-field root preimage verifies under the pinned board key | integrity/authorship, not time or correctness |
| Sigstore Rekor | the signed preimage has a transparency-log entry | log inclusion, not claim truth |
| OpenTimestamps | `CONFIRMED_BITCOIN` proves the exact root bytes existed no later than the attested block | a pending calendar proof is **not** a Bitcoin anchor |
| EAS / XRPL | only what a non-`NOT_YET` sidecar entry identifies and a verifier can resolve | never infer these rails from plans |

Check the current OTS state and proof dynamically, so this command remains correct
when a successor root is published:

```bash
curl -s https://councilof.ai/root.json -o root.json
curl -s https://councilof.ai/interop/root-witness-latest.json -o root-witness.json
python3 - <<'PY'
import json, pathlib, urllib.request
w = json.load(open("root-witness.json")); ots = w["witnesses"]["ots"]
print("OTS state:", ots["status"])
url = ots.get("url")
if not url:
    raise SystemExit("No detached OTS proof is published for this root")
pathlib.Path("root.json.ots").write_bytes(urllib.request.urlopen(url).read())
PY
ots verify root.json.ots -f root.json
```

`STAMPED_PENDING_BITCOIN` is an honest normal state for a newly published root: a
calendar has accepted the digest, but the detached proof does not yet contain a
Bitcoin block-header attestation. Only proof-derived `CONFIRMED_BITCOIN` may be
described as Bitcoin-anchored. Signing and witnessing prove bytes and time within
their stated scopes; neither proves correctness, completeness, compliance or
certification.

## What this does and does not prove

It proves these exact measurement bodies were signed by the holder of the published
card-attestation key and have not been altered since. **It does not prove the measurement is
correct** — that rests on the published method, the gold labels and the rows, all separately
available. A signature is an integrity claim, not a truth claim.

**It also does not prove the set is complete.** Each card verifies individually;
an index can only list what its publisher chose to list. The 150-row floor that
used to ship beside this chain is a subset of these 335 cards, not a second
measurement.

**It does not establish revocation state.** Offline verification establishes
signature validity and key binding *as of the verification parameters held* —
the pinned key you fetched, on the day you fetched it. Whether that key remains
valid is a fact about the present, and a computation over past records cannot
testify about the present. If we ever revoke or rotate the card-attestation key,
that fact will be published in the DID document and noted at `/api/corrections`;
a verifier holding yesterday's parameters will keep saying VALID until its
parameters are refreshed, and nothing in the verdict tells you otherwise. State
your parameter-fetch date beside any verdict you republish. *(Limit stated
2026-09-01, prompted by review on the IETF agentproto list — it was true before
it was stated.)*

## Signed public-root catalogue (`/root.json`)

Estate steps 1–6 above are for **Ed25519-signed** cards against `#card-attestation-1`.
The public-root catalogue is a **different object**.

1. Fetch `https://councilof.ai/root.json`.
2. Note `as_of`, `merkle_root`, `card_count`, and `did_intended` (`did:web:csoai.org#board-attestation-1`).
3. Rebuild the six-field canonical preimage and verify the root's 64-byte `sig_ed25519` under the pinned board key, using `HOW-TO-VERIFY-ROOT.md`.
4. Recompute `merkle_root` from every entry in `card_sha256[]` and require `len(card_sha256) == card_count`.
5. Inclusion is membership of a leaf SHA-256 in `card_sha256[]`. Root-envelope validity does not turn a leaf into an individually signed measurement card.
6. The public-root leaves and `signed/card_index.json` are separate corpora. Read their counts and identifier overlap from the current witness sidecar; the root OTS proof does not anchor the signed-card index.
7. GET `/api/xrpl` is a **reader** of this root (`writes_board` false). Do not stamp MEASURED from the catalogue.

Do not invent keys or witnesses. Do not treat public-root inclusion as estate-card VALID.

## PQC / hybrid — not inside the 3KB envelope ceiling

Cards today are **Ed25519 only**. Current v0.1 signed cards are under 1KB; the 3KB envelope
ceiling is binding. An ML-DSA-65 (FIPS-204) signature is ~3.3KB and **cannot live inside**
that ceiling. There is no PQC field on card-v0 (frozen:
`sig_ed25519` may be a hex string or null). `#board-pqc-1` is **ABSENT** from
`did:web:csoai.org` — no ML-DSA public key is published. Do not generate one here.

- A null `sig_ed25519` is unsigned (`NO_LAPTOP_SIGN`) — **UNCHECKABLE**, never VALID.
- Do not claim a card is PQC-signed. The verify UI has no PQC helper wired; fail-closed.
- Hybrid, when it ships, is a **second receipt** on the ROOT / DID / inclusion bundle
  (or a Falcon/ML-DSA envelope *beside* the card, not inside it). Ed25519 is not replaced.
- OpenTimestamps: when the current sidecar names an `.ots` proof, it is on the ROOT,
  not on a card. Read `witnesses.ots.status`, the detached proof URL, any attested
  Bitcoin block and the corpus counts from `/interop/root-witness-latest.json`; never
  carry those values over from an older root. `STAMPED_PENDING_BITCOIN` is not anchored.
  `CONFIRMED_BITCOIN` proves only that the exact named `root.json` bytes existed no later
  than the proof-derived block. The public-root leaves and the cards in
  `signed/card_index.json` are separate corpora; the OTS proof does **not** anchor that
  signed-card index or any individual card in it. Rekor state is a separate sidecar rail.
- **PQCBench** on the GSPC board is the continuity arena (`csoai/gspc-asi`) — a
  model-comparison task about cryptographic *assumptions*, not a post-quantum
  signature on these cards. Do not conflate.

## What a verifying signature does not establish (revocation)

Verifying a signature establishes that the key named under `alg` / the DID key reference produced the signed bytes and that the bytes have not changed since. It says nothing about the state of that key now. Offline verification is a computation over the verification parameters you hold (the published key, the card bytes); revocation is a property of the present, and this rule defines no revocation mechanism and places no freshness requirement on key material. **A consumer must not treat a signature that verifies as evidence that the signing key is still valid.** Where a decision depends on revocation state, the key-resolution path and the staleness you accept are operational parameters of your deployment and must be stated by it; the card does not carry them. (Stated after the IETF agentproto thread of 31 Aug–2 Sep 2026; recorded as correction C-2026-0902-09.)
