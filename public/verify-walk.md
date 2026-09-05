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

The did:web trust root currently publishes five verification methods. A verifier must pin the
key id declared for the artifact family; the presence of a key in the DID does not make it the
right key for every record. Ed25519 is live. Post-quantum signing is planned, not live.

## Step 3 — verify a record in your browser (40s)

Open **https://councilof.ai/gspc-verify** and paste a record from a supported, declared family.
The verifier applies that family's exact canonicalisation and signature-preimage rule, then
checks the Ed25519 signature against its pinned key id. Historic families differ; an unsupported
or ambiguous record must return UNCHECKABLE rather than borrowing another family's rule.

Or replay the public chain on the same page — one button, client-side, including a deliberate-tamper demonstration.

## What this proves — and what it doesn't

- **Proves (for a supported valid record):** the verified bytes bind to the stated signer and hash under the declared family rule.
- **Corrections:** corrections are recorded, but the public corrections ledger may explicitly be STALE while an owner re-sign is pending. Do not describe that state as an append-only signed history.
- **Does not prove:** that any model is "safe" or "compliant". Those words are not in the instrument's vocabulary, on purpose. We measure against published, frozen predicates; you recompute.

## If something fails

That's a finding, not an embarrassment — tell us: nicholas@csoai.org. Failures are published to the corrections ledger with the fix. The instrument that catches its owner is the instrument you can rely on.

*Machine-readable everything: https://councilof.ai/llms.txt · board API /api/gspc · feed /api/feed.xml · charter /firewall-charter*
