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
- scanned **28348 of a declared 28348** — complete, which is
  what makes the finding a claim rather than a guess
- ours: **6** listings
- manifest coverage: **6 of 9** doors indexed; **1** current, **5** stale, **3** missing

Stale manifest doors: `https://councilof.ai/api/request-attestation`, `https://councilof.ai/api/eunomia-data`, `https://councilof.ai/api/proof`, `https://councilof.ai/api/rwa/evidence`, `https://councilof.ai/api/receipts/batch`

Missing manifest doors: `https://councilof.ai/api/evidence-bundle`, `https://councilof.ai/api/art50/marking-evidence`, `https://councilof.ai/api/feeds/provider-diff`

| resource | last updated | x402 | serviceName | tags | amount | maxTimeout |
|---|---|---|---|---|---|---|
| `https://councilof.ai/api/eunomia-data` | 2026-09-07T04:58:50.159Z | v2 | — | — | 20000 | 600 **(stale)** |
| `https://councilof.ai/api/free-door` | 2026-09-09T08:26:19.435Z | v2 | — | — | 0 | 300 |
| `https://councilof.ai/api/proof` | 2026-09-07T04:58:52.174Z | v2 | — | — | 20000 | 600 **(stale)** |
| `https://councilof.ai/api/receipts/batch` | 2026-09-07T04:59:01.499Z | v2 | — | — | 100000 | 600 **(stale)** |
| `https://councilof.ai/api/request-attestation` | 2026-09-07T04:58:46.448Z | v2 | — | — | 20000 | 600 **(stale)** |
| `https://councilof.ai/api/rwa/evidence` | 2026-09-07T04:58:54.445Z | v2 | — | — | 20000 | 600 **(stale)** |

## Coinbase CDP

- `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`
- scanned **14567 of a declared 14567** — complete, which is
  what makes the finding a claim rather than a guess
- ours: **0** listings
- manifest coverage: **0 of 9** doors indexed; **0** current, **0** stale, **9** missing

Missing manifest doors: `https://councilof.ai/api/free-door`, `https://councilof.ai/api/request-attestation`, `https://councilof.ai/api/evidence-bundle`, `https://councilof.ai/api/eunomia-data`, `https://councilof.ai/api/proof`, `https://councilof.ai/api/rwa/evidence`, `https://councilof.ai/api/art50/marking-evidence`, `https://councilof.ai/api/feeds/provider-diff`, `https://councilof.ai/api/receipts/batch`

**Not listed.** No resource on councilof.ai or csoai.org appears in this index —
and the scan above is what makes that a measurement.

