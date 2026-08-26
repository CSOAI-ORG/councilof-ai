# The 60-second verify walk

*Council of AI (CSOAI Ltd, UK Companies House 16939677) — measurement, not certification. This walk needs no account, no fee, and no trust in us. It is the payload we attach to every introduction: don't take the claim, run the walk.*

## Step 1 — fetch the live board (10s)

```
curl -s https://councilof.ai/api/gspc
```

You get the GSPC board — its slot count and measured count come from `totals.public_count`, never from this page — with per-axis `n`, leader accuracy, Wilson intervals where the n is honestly independent, and a separation verdict (`SEPARATED` / `TIE` / `UNTESTED`) — ties are stated as ties, never counted as wins. The item count is live in `totals.items`; we never hardcode it anywhere.

## Step 2 — fetch the published keys (10s)

```
curl -s https://csoai.org/.well-known/did.json
```

The did:web trust root. Two Ed25519 verification methods: `#site-release-1` (site releases and cards) and `#estate-chain-1` (measurement chains). Ed25519 today; anything else will be named in the same commit that ships it.

## Step 3 — verify a record in your browser (40s)

Open **https://councilof.ai/gspc-verify** and paste any estate record (a ~3KB measurement card or receipt). Your browser recomputes the `content_id` (sha256 over canonical JSON) and checks the Ed25519 signature against the keys from step 2. A tampered record fails visibly. Nothing you paste leaves your machine.

Or replay the public chain on the same page — one button, client-side, including a deliberate-tamper demonstration.

## What this proves — and what it doesn't

- **Proves:** the number you read is the number that was signed; the signer holds the published key; history can't be silently rewritten (corrections are appended, never edited).
- **Does not prove:** that any model is "safe" or "compliant". Those words are not in the instrument's vocabulary, on purpose. We measure against published, frozen predicates; you recompute.

## If something fails

That's a finding, not an embarrassment — tell us: nicholas@csoai.org. Failures are published to the corrections ledger with the fix. The instrument that catches its owner is the instrument you can rely on.

*Machine-readable everything: https://councilof.ai/llms.txt · board API /api/gspc · feed /api/feed.xml · charter /firewall-charter*
