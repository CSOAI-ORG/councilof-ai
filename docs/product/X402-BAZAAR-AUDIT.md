# x402 Bazaars — what each index holds for us

DERIVED by `scripts/interop/x402-bazaar-audit.py`. Never hand-edited; regenerate it.

There are two indexes. Presence in one says nothing about the other. A listing proves
distribution only — never settlement, revenue, demand, or certification.

Our current 402 builder declares `maxTimeoutSeconds` as **300**.

## PayAI

- `https://facilitator.payai.network/discovery/resources`
- scanned **6583 of 6583** advertised rows
- ours: **6** listings
- manifest coverage: **6 of 10** doors indexed; **1** current, **5** stale, **4** unseen (absence indeterminate)
- limitation: the index is a mutable offset-paginated view, not a transactional snapshot; multi-page reads cannot prove absence

Stale manifest doors: `https://councilof.ai/api/request-attestation`, `https://councilof.ai/api/eunomia-data`, `https://councilof.ai/api/proof`, `https://councilof.ai/api/rwa/evidence`, `https://councilof.ai/api/receipts/batch`

Unseen in this mutable read (not proof of absence): `https://councilof.ai/api/evidence-bundle`, `https://councilof.ai/api/wrapper`, `https://councilof.ai/api/art50/marking-evidence`, `https://councilof.ai/api/feeds/provider-diff`

| resource | last updated | x402 | serviceName | tags | amount | maxTimeout |
|---|---|---|---|---|---|---|
| `https://councilof.ai/api/eunomia-data` | 2026-09-07T04:58:50.159Z | v2 | — | — | 20000 | 600 **(stale)** |
| `https://councilof.ai/api/free-door` | 2026-09-14T01:40:44.728Z | v2 | — | — | 0 | 300 |
| `https://councilof.ai/api/proof` | 2026-09-07T04:58:52.174Z | v2 | — | — | 20000 | 600 **(stale)** |
| `https://councilof.ai/api/receipts/batch` | 2026-09-07T04:59:01.499Z | v2 | — | — | 100000 | 600 **(stale)** |
| `https://councilof.ai/api/request-attestation` | 2026-09-07T04:58:46.448Z | v2 | — | — | 20000 | 600 **(stale)** |
| `https://councilof.ai/api/rwa/evidence` | 2026-09-07T04:58:54.445Z | v2 | — | — | 20000 | 600 **(stale)** |

## Coinbase CDP

- `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`
- scanned **14892 of 14892** advertised rows
- ours: **0** listings
- manifest coverage: **0 of 10** doors indexed; **0** current, **0** stale, **10** unseen (absence indeterminate)
- limitation: the index is a mutable offset-paginated view, not a transactional snapshot; multi-page reads cannot prove absence

Unseen in this mutable read (not proof of absence): `https://councilof.ai/api/free-door`, `https://councilof.ai/api/request-attestation`, `https://councilof.ai/api/evidence-bundle`, `https://councilof.ai/api/eunomia-data`, `https://councilof.ai/api/proof`, `https://councilof.ai/api/rwa/evidence`, `https://councilof.ai/api/wrapper`, `https://councilof.ai/api/art50/marking-evidence`, `https://councilof.ai/api/feeds/provider-diff`, `https://councilof.ai/api/receipts/batch`

**No matching listing appeared in this read.** For multi-page offset reads, absence is indeterminate.

