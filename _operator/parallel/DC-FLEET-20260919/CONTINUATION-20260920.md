# M2/M4 continuation - 20 September 2026

## Completed in this session
M2 and M4 responded through Desktop Commander at 01:08 UTC.
Condor roots on both Macs and the M4 Hummingbot API returned HTTP 200.
M2 market recorder was still producing 11 rows per approximately 30-second batch.
Frozen study files retained their three previously recorded SHA256 values.
On-demand capture at 01:09:33 UTC retained 11,000 observations from the study start.
All 11 observed market/venue pairs had 1,000 observations and no gap over 90 seconds;
ONDO/USDC on Kraken remained unobserved. This is collector-time coverage, not exchange freshness.
M4 replayed the same receipt successfully. It is reproducibility, not independent strategy validation.

## New diagnostic, not a new strategy
paper_diagnostics.py attributes the existing frozen simulator results into price movement,
modeled paid fees, half-spreads, slippage and terminal liquidation cost. No strategy parameters changed.
The accounting identity is checked for each usable case; altered fees/prices/PnL are rejected.
Missing-data families remain unknown, not zero. Fifteen tests passed on each Mac.
Both hosts produced exactly matching diagnostic results on the same saved observations.
Implementation SHA256: 8d866a1f3107675bb2999b7898363b5303b7973b3a9a4b41ba6ffa98e2c2e97f
Test SHA256: ecf353bd3d7be0fb65b3794c284f3a09146f358e7bcfe67bd239c6816a73bd56

## Snapshot results: virtual USD-equivalent, $110 per family
Family | Price component, same fills | Modeled costs | Net P/L | Simulated fills
Cash | 0 | 0 | 0 | 0
Buy/hold | -0.362481 | 0.073778 | -0.436259 | 11
Momentum | -0.037761 | 3.309899 | -3.347660 | 924
Mean reversion | -0.179680 | 3.758953 | -3.938633 | 1057
Costs account for 98.87% and 95.44% of momentum/reversion losses respectively in this model.
Costs are illustrative assumptions, not actual exchange rates or measured on-chain gas.

## Public wallet readback
At finalized Ethereum block 26015269 (00:54:47 UTC), the four checked balances match
the previous baseline exactly: ETH 0.000175984076000215, USDC 6.44,
ONDO 4520.164498377296128097, LINK 149.925308094095608234.
Captured at 01:11:21 UTC from one public RPC provider; block hash rechecked unchanged.
No conclusion about intervening transactions or allowances follows from equal balances.
Receipt wallet-readback-20260920T011121Z.json was copied to M4 with matching SHA256:
3ff63638bb38a272a78652044eed5471abf6b8ea77f4bad9a5f7f4989dc27133.

## Existing dashboard and M4 study
Refreshed Fleet Research Snapshot.html at 01:14:47 UTC using the existing read-only bridge.
M4's separate paper ledger then had 214 settled reported outcomes and a 21.03% positive
cost-adjusted rate; mean reported net return -16.053 bps. These are different markets,
horizons and accounting from M2. They are not dollar portfolio P/L or a matched contest.
Created Paper Cost Diagnostics.html on both hosts and a shortcut on the M2 Desktop.
Opened the M2 diagnostic in Chrome. No new server, scheduler or order process started.

## Next experiment hypothesis - not launched or promised profitable
Test less frequent entries and a modeled cost hurdle, with parameters fixed in advance
and evaluation on a later, unseen interval. Measure missed opportunities as well as
avoided costs. Do not retune the current 24-hour candidate or choose a winner mid-study.
Use actual venue minimum sizes and fee estimates before treating $10 normalization as
an executable account. Keep the M4 baseline comparable before claiming machine superiority.

No wallet approvals, signatures, transfers, swaps, agent execution/risk-setting changes,
production deployment or restart occurred. Current reporting was captured on demand;
this note makes no claim that future scheduled checks have executed.
