# UNSIGNED DRAFT — owner signs after public result; dead branches deleted

**Subject:** Circle Arc — public mainnet: claim-side date vs observed chain state
**Surface (on promotion):** `public.notice` · **Engine:** JSON-RPC read against the official Arc mainnet RPC, once one is published · **Corpus:** Arc mainnet chain state at a pinned block · **Drafted:** 2026-09-14T10:40Z
**Framing:** Measurement, not certification. This records whether a public chain answers at the documented endpoint, and what it reports. It is not a view on Arc, Circle, USDC or any validator. If the chain is not live on the announced date, that is recorded as **lag, not an allegation**.

## Premise check

| Premise | Primary source | Retrieved (UTC) | State |
|---|---|---|---|
| Arc public mainnet launch date is 2026-09-16 | Circle pressroom, published **2026-08-05**, "Circle Announces Founding Validator Cohort & Major Integrations for Arc Ahead of September 16 Mainnet Launch": *"on track for a public mainnet launch on September 16, 2026"* — https://www.circle.com/pressroom/circle-announces-founding-validator-cohort-and-major-integrations-for-arc-ahead-of-september-16-mainnet-launch | 2026-09-14T10:34Z | **VERIFIED as a claim-side statement ("on track for").** It is not a launch observation. |
| Chain ID, official RPC URL, native gas token, validator set at launch | The same release does not state them | 2026-09-14T10:34Z | **UNMEASURED.** Take them from official Arc/Circle docs on the day, never from third-party lists. |

## Skeleton (fill only from observation)

```json
{
  "schema": "https://councilof.ai/schema/card-v1.json",
  "surface": "public.notice",
  "subject": "Arc public mainnet — observed state vs announced date 2026-09-16",
  "as_of": "<pinned block timestamp, UTC>",
  "source_urls": [
    "https://www.circle.com/pressroom/circle-announces-founding-validator-cohort-and-major-integrations-for-arc-ahead-of-september-16-mainnet-launch",
    "<official Arc docs page naming the mainnet RPC + chain id>"
  ],
  "payload": {
    "kind": "chain.launch-observation/0.1",
    "claim": {"statement": "on track for a public mainnet launch on September 16, 2026", "publisher": "Circle", "published": "2026-08-05", "state": "ATTRIBUTED"},
    "observation": {
      "rpc_url": "<official>",
      "eth_chainId": "<hex as returned | UNMEASURED>",
      "pinned_block": {"number": "<int>", "hash": "<hex>", "timestamp_utc": "<iso>"},
      "earliest_block_timestamp_utc": "<block 1 timestamp | UNMEASURED>",
      "native_gas_token_documented": "<verbatim from official docs | UNMEASURED>",
      "state": "OBSERVED | UNREACHABLE"
    },
    "lag": {"announced_date": "2026-09-16", "first_observed_live_utc": "<iso | null>", "note": "lag, not allegation"}
  },
  "unmeasured": ["validator set membership as operated (vs announced)", "decentralisation", "USDC reserve state", "app availability claimed 'day-one'"],
  "tags": ["UNSIGNED-DRAFT", "claim-vs-observation"],
  "sha256": null,
  "sig_ed25519": null
}
```

## Branches (keep one after 2026-09-16 23:59 UTC)

- **A: live on the date.** The official RPC answers `eth_chainId` and a block whose timestamp is on or before 2026-09-16T23:59:59Z.
- **B: live later.** Record `first_observed_live_utc` and the lag in hours. No reason is inferred.
- **C: not observed.** `observation.state = "UNREACHABLE"` and every observation field is `UNMEASURED`. This is not "failed launch", only "not observed by this probe at <time>".
