# x402 Bazaars — what each index holds for us

DERIVED by `scripts/interop/x402-bazaar-audit.py`. Never hand-edited; regenerate it.

There are TWO indexes. An agent shopping for a resource reads one of them, and being in
one says nothing about the other. Reading either needs no API key — CDP answers an
anonymous GET — so an absence here is always measurable. A key is needed to be INDEXED,
never to check.

Our own 402 builder (`functions/api/_x402.ts`) sets `maxTimeoutSeconds` to **300**;
a listing that disagrees is serving a buyer a door that no longer has that shape.

## PayAI

- `https://facilitator.payai.network/discovery/resources`
- scanned **28230 of a declared 28230** — complete, which is
  what makes the finding a claim rather than a guess
- ours: **1**

| resource | last updated | x402 | serviceName | tags | amount | maxTimeout |
|---|---|---|---|---|---|---|
| `https://councilof.ai/api/free-door` | 2026-09-05T03:27:26.273Z | v2 | — | — | 0 | 900 **(stale)** |

## Coinbase CDP

- `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`
- scanned **15768 of a declared 15768** — complete, which is
  what makes the finding a claim rather than a guess
- ours: **0**

**Not listed.** No resource on councilof.ai or csoai.org appears in this index —
and the scan above is what makes that a measurement.

