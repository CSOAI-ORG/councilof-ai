# Stranger verification — 5 September 2026

The estate's central claim is that anyone can recompute and verify its evidence **for free, without
asking us, using only published bytes**. This is that claim, executed from outside, end to end.

**Result: it holds.** Every check passes.

---

## What was verified

| Check | Scope | Result |
|---|---|---|
| Card body fetches | 335 signed cards | **335 / 335 HTTP 200** |
| `id == sha256(canonical(body))` per each card's **own published `preimage_rule`** | 335 | **335 / 335 OK** |
| Card body agrees with `card_index.json` (`id`, `sig`, `pubkey`) | 335 | **335 / 335 match** |
| **Ed25519 signature verifies** | 335 | **335 / 335 VALID** |
| Card signing key bound to the published DID | — | **BOUND** to `did:web:csoai.org#card-attestation-1` |
| **`root.json` signature verifies** | 1 | **VALID** against `did:web:csoai.org#board-attestation-1` |
| Every URL in `/.well-known/index.json` | 292 | **292 / 292 HTTP 200** |
| Every URL in `/interop/index.json` | 372 | **372 / 372 HTTP 200** |

**No CSOAI service was trusted in any step.** Card bodies came from `councilof.ai`, the keys came
from the DID document on `csoai.org`, and the arithmetic ran locally.

## Reproduce it

```python
import json, urllib.request, hashlib, base64, concurrent.futures as cf
from collections import Counter
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
G = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent':'verify'}), timeout=25)

cards = json.load(G("https://councilof.ai/signed/card_index.json"))["cards"]
def check(c):
    d = json.loads(G("https://councilof.ai" + c["card_url"]).read())
    pre = json.dumps(d["body"], sort_keys=True, separators=(',',':'), ensure_ascii=True).encode()
    ok_id  = hashlib.sha256(pre).hexdigest() == d["id"] == c["card"]
    try:
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(d["pubkey"])).verify(bytes.fromhex(d["signature"]), pre)
        ok_sig = True
    except Exception:
        ok_sig = False
    return ok_id, ok_sig
with cf.ThreadPoolExecutor(max_workers=16) as ex:
    r = list(ex.map(check, cards))
print(len(r), Counter(r))          # -> 335 {(True, True): 335}

# the root, using the rule root.json publishes about itself
root = json.load(G("https://councilof.ai/root.json"))
did  = json.load(G("https://csoai.org/.well-known/did.json"))
b64u = lambda s: base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))
key  = {v["id"].split("#")[-1]: b64u(v["publicKeyJwk"]["x"]) for v in did["verificationMethod"]}
pre  = json.dumps({k: root[k] for k in ["kind","schema","as_of","merkle_root","card_count","did_intended"]},
                  sort_keys=True, separators=(',',':')).encode()
Ed25519PublicKey.from_public_bytes(key["board-attestation-1"]).verify(bytes.fromhex(root["sig_ed25519"]), pre)
print("root signature VALID")
```

`root.json` states its own rule in `sig_preimage`: *"Ed25519 over canonical JSON of {kind, schema,
as_of, merkle_root, card_count, did_intended} only."* Following it verbatim verifies on the first
attempt.

## Two false alarms this audit produced and discarded

Recorded because the near-misses are instructive.

**1. "335/335 hash MISMATCH."** A first pass hashed the *raw served bytes* of each card file against
its filename and reported 335 mismatches. That is not the scheme. The hash is over
`canonical(body)` per the card's own `preimage_rule`, which excludes the signature envelope.
Hashing the wrong thing produced a 100% failure rate on a chain that is 100% valid. **Read the
stated rule before declaring a break.**

**2. "Card key not in the DID document."** A first pass compared the card's hex `pubkey` against the
raw DID JSON and found no match. The DID publishes keys as **JWK base64url `x`**, not hex.
Decoding first shows an exact match. **A format mismatch in the comparison is not a finding about
the data.**

## The honest limits of this result

What was verified is real. What it does **not** establish:

- **One key signs everything.** All 335 cards carry `kid: card-attestation-1`, one `pubkey`, one
  `alg`. The DID publishes five keys; the cards use one and the root uses another. Verifying that
  key proves **custody, not independence** — it shows CSOAI signed these bytes, not that anyone
  else agrees with them.
- **The root is signed and NOT anchored.** No `ots`/`rekor`/`anchor` field. The signature proves
  *who*; nothing here proves *when*. A holder of the key could re-sign a different root with an
  earlier `as_of` and this audit could not tell. That is exactly what an independent timestamp
  would close, and it is why the anchor gap keeps recurring in these findings.
- **No counterparty signature exists anywhere** in the estate. The chain is one-sided.
- **Signature validity is not measurement correctness.** These checks prove the bytes are intact
  and authentically signed. Whether a measurement is *right* is a different question this audit
  does not touch.

## Why this is worth publishing

Most organisations asserting "verifiable" cannot survive somebody actually running the verification.
This one can: **335 signatures, 664 indexed URLs, and a signed root, all checked from outside with
published bytes and no privileged access.** That is a claim competitors in the Tracxn peer set do
not make and, on the evidence gathered this week, do not publish the means to test.

It is also the strongest single input to `docs/company/VALUATION-2026-09-05.md`, whose Berkus
"prototype / technology risk" factor was the only one scored at full value.

_Verified 2026-09-05. 335 cards, 664 URLs, 1 root, 5 DID keys. Two false alarms found in my own
method and discarded before reporting._
