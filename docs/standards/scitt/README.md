# SCITT — a signed statement over root.json, and no receipt

`GET /interop/scitt-root-signed-statement.json` computes the statement from the committed bytes
of `root.json` **at request time**, so it cannot describe yesterday's root.

It began as a script writing a committed JSON file. That was wrong: `root.json` is republished
often — its leaf count read 152, 153 and 167 within one day of 2026-09-05 — so a committed
statement is a digest of yesterday's bytes claiming to describe today's. The only ways to stop
that are a gate that reddens the estate's deploy whenever another lane regenerates the root, or
deriving it from the same bytes the site serves. One engine, no second copy to reconcile.

## What exists, and what does not

| thing | state | why |
|---|---|---|
| subject, payload digest, protected-header map | **DERIVED at request time** | computed from the exact bytes served at `/root.json` |
| `signature` | **null** | this process holds no signing key, and a body that measures does not sign with keys it does not have |
| `registration` | **null** | nothing has been submitted to any transparency service |
| `receipt` | **null** | **a receipt is issued BY a transparency service on registration.** We run none and are registered with none, so no receipt exists |

`/.well-known/scitt.json` carries `implementation_status: PLANNED` and says in its own words
that door generation "must not invent a measurement, evidence pack, signed statement,
transparency-service receipt, or registration". This script is the half of the work that needs
no key and invents nothing: the exact bytes a holder of the key would sign, and the digest anyone
can recompute.

## Check it yourself

```
curl -s https://councilof.ai/root.json | shasum -a 256
curl -s https://councilof.ai/interop/scitt-root-signed-statement.json | jq '{subject,payload,signature,registration,receipt}'
```

The first command must print the same hex as `payload.digest_hex`. The digest is over the
**exact committed bytes**, not over a re-serialisation — re-serialising JSON changes the bytes
and therefore the digest, which is the whole reason the length is published beside it.

## Scope, stated once and not softened

A proof over these bytes covers **these bytes**. `root.json` commits to its own leaf list and
nothing else: it does not anchor the signed-card index, and it does not anchor GSPC. Those are
separate corpora with zero identifier overlap (`/api/state` → `signed_cards.corpus_relation`).

## The assertion that holds this together

The endpoint digests `JSON.stringify(root, null, 2) + "\n"` and publishes that hex beside the
instruction to run `curl -s https://councilof.ai/root.json | shasum -a 256`. Those two must be the
same bytes. A unit test asserts the re-serialisation is **byte-identical** to the committed file
(14,518 bytes today), so if `root.json` is ever written with a different indent or without its
trailing newline, the test fails here rather than the endpoint publishing a digest that does not
match the file it names. That would be a false claim, not a cosmetic drift.

## To go further — owner-gated

Registering the statement needs (a) the Ed25519 key that `did:web:csoai.org` publishes, held by
CI or the owner, and (b) a transparency service willing to register it. Neither is a repo change.
When both exist, the receipt returned by that service is the artifact to publish — and it should
be published as *its* receipt, naming the service, never as a property of ours.
