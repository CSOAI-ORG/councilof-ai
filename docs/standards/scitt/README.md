# SCITT — a signed statement over root.json, and no receipt

`node scripts/scitt-statement.mjs` emits
`public/interop/scitt-root-signed-statement.json`. `--check` re-derives it and fails if
`root.json` has moved underneath it.

## What exists, and what does not

| thing | state | why |
|---|---|---|
| subject, payload digest, protected-header map | **DERIVED** | computed from the committed bytes of `root.json` |
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

## To go further — owner-gated

Registering the statement needs (a) the Ed25519 key that `did:web:csoai.org` publishes, held by
CI or the owner, and (b) a transparency service willing to register it. Neither is a repo change.
When both exist, the receipt returned by that service is the artifact to publish — and it should
be published as *its* receipt, naming the service, never as a property of ours.
