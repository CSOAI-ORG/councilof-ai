# x402scan / CSOAI revenue: fresh reconciliation readback

Checked 2026-09-24 19:05 UTC. Read-only; no payment or service request was made.

| Source | Current observed value | Scope |
| --- | --- | --- |
| [x402scan CSOAI server](https://www.x402scan.com/server/9b8bcb34-6c9f-45d6-b881-9a6afe7bf6b5) | 45 `total_transactions`, 390,000 atomic USDC ($0.39), 25 `unique_buyers`, latest indexed block 2026-09-22 13:36:21 UTC | Its embedded `public.stats.overallByOrigin` query explicitly uses `timeframe:30`. These are indexed transfer-event/sender aggregates associated with the origin, not CSOAI service revenue or customer count. |
| [x402scan recipient](https://www.x402scan.com/recipient/0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31) | The same 45 / 390,000 / 25 aggregate | Its embedded `public.stats.overall` query uses `timeframe:0` (all time). All currently counted events also fall in the server's 30-day window. |
| [CSOAI revenue API](https://councilof.ai/api/revenue) | One distinct non-self nonzero payer; one qualifying settlement; 20,000 atomic USDC ($0.02); 22 self settlement records; seven zero-value records; no repeat payer shown | `REVENUE_KV settled:tx:*`, excluding owner-controlled wallets and zero-value records from revenue/payer counts. |

The already-completed independent [chain reconciliation](</Users/nicholas/Documents/Codex/2026-09-23/CSOAI_X402SCAN_REVENUE_RECONCILIATION_2026-09-23.md>) checked successful Base USDC `Transfer` logs, token, recipient, sender, amount, log index and receipt for all 45 cohort events. Its underlying JSON readback has SHA-256 `17d0242eadd033a2015934302148bb3bf2c0d512c332f461189077ffa3d139b4`. Classification: 21 zero-value events from 21 senders; 23 positive owner-controlled events from three wallets, totalling 370,000 atomic USDC; one positive non-self event from one wallet, 20,000 atomic USDC. This adds to the directory's 45 events, 25 sender addresses and 390,000 atomic USDC. The current 24 September counts have not moved, so this cohort reconciliation still matches the public aggregate.

Of the 45 chain events, 30 transaction hashes have settlement KV keys and 15 do not. The 15 are 14 zero-value events and one 20,000-atomic owner-wallet event. No non-self positive event is missing from the KV cohort. Facilitator-settlement receipts for those 15 would be required to establish whether they came through the service or were direct wallet transfers; an on-chain transfer alone does not prove a service purchase. Four additional positive wallet credits outside x402scan's 45-event cohort also lack linked CSOAI service receipts and are not counted as revenue.

Safe public wording: **“x402scan indexes 45 Base transfer events to CSOAI's recipient in its 30-day server view ($0.39 gross from 25 sender addresses). Independent classification finds 21 zero-value transfers and $0.37 of owner-funded transfers; CSOAI's service ledger currently supports one non-self, nonzero settlement of $0.02 from one payer, with no repeat purchase evidenced.”**

Do not call 25 addresses customers or $0.39 earned revenue. A registry listing or gross transfer aggregate does not show delivered proof, retained demand, or product-market fit.
