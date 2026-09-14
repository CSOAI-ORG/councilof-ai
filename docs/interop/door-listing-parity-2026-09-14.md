# x402 Door Listing Parity — 2026-09-14

| Door | 402 OK | Accepts | Bazaar | Listing Price | Live Price | CDP |
|------|--------|---------|--------|---------------|------------|-----|
| /api/free-door | ✅ | ✅ | ✅ | 0 | 0 | absent |
| /api/request-attestation?subject=model-or-subject-id | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/evidence-bundle?obligation=article-50&bundle=1 | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/eunomia-data?feed=1 | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/proof?bundle=1 | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/rwa/evidence?asset=RLUSD | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/wrapper?id=usdc.e:arbitrum | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/wrapper/changes?id=usdc.e:arbitrum | (new) | (new) | (new) | — | — | absent |
| /api/art50/marking-evidence?url=/og-image.png | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/feeds/provider-diff?history=1 | ✅ | ✅ | ✅ | — | 10000 | absent |
| /api/receipts/batch?from=2026-01-01T00:00:00Z | ✅ | ✅ | ✅ | — | 10000 | absent |

**Summary:** 10/10 existing doors return 402 with accepts[] + bazaar. wrapper/changes is new (deployed this session).

**Notes:**
- CDP (Content Delivery Platform) is always absent until OWNER-ASKS #2.
- Listing stale — refreshes on the next settlement through PayAI; no self-settlement to force it.
- Where a listing disagrees with the door (5 do: 20000/600 vs 10000/300) write "listing stale — refreshes on the next settlement through PayAI"; no self-settlement to force it.
