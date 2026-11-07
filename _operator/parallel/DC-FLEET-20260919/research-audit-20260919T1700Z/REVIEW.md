# CSOAI M2/M4 research-readiness audit - 19 September 2026

## Scope and unchanged controls
Local inspection and synthetic offline tests only. No accounts funded, orders sent,
keys read or copied, risk limits edited, agents started, or production release made.
The user's requested $100 is not allocated. $100 per Mac would total $200; a total
fleet budget is not the same as a per-agent maximum. No interpretation was enacted.
The existing frozen M2 24-hour study remains $10-normalized PAPER research.

## Fresh infrastructure observations
17:00 UTC: M2 Condor returned HTTP 200 through its existing loopback SSH tunnel.
M4 Condor and Hummingbot API roots returned HTTP 200. Gateway, API, EMQX and Postgres
containers were running. No native hummingbot/hummingbot bot container was listed;
bots/instances contained no directories. This does not rule out in-process executors.
Root HTTP checks do not establish authenticated account, order or balance readiness.
Ten M4 strategy.md definitions were found and all declared dry_run defaults.
Examples: BTC/SOL adaptive grids, EMA trend, GSPC opportunity hunt, market making,
Meteora/Solana LP, flow analysis and RLUSD/XRP. Definitions are not active sessions.

## GSPC findings reproduced from current local source
Pure scorer, synthetic asset, no exchange calls: five cases returned allowed=True
with missing risk input, empty evidence, one-year-old observations, mixed 60-second
and 24-hour horizons, or two group labels sharing the same evidence identifier.
The explicit kill-switch control returned allowed=False with kill_switch blocker.
These findings concern the research scorer, not a demonstrated live-order bypass.
They show why a research allowed flag is not sufficient execution authorization.
The market scanner itself returns research_only and execution=disabled.
Its confidence calculation is a heuristic; held-out probability calibration was not verified.

## Scorecard defect and review candidates
The installed paper scorecard returned win_rate=2.0 on a synthetic two-row fixture:
one valid positive return and one positive flag with no numeric return. Numerator
and denominator used different populations. This is not an observed live win rate.
A one-line patch derives wins from the numeric return population. It was exercised
in memory: the same fixture returns 1.0, with the existing promotion requirements
and eligible_for_live_promotion=False retained. Patch is NOT APPLIED.
A broader offline scorecard_candidate.py rejects missing/nonfinite/bool returns,
reports conflicting flags and refuses to label summed basis points as dollar P/L.
All 12 candidate unit tests passed on M4. Further acceptance remains owner-reviewed.
The M4 owner changed paper_scorecard.py during this audit. patch-base-sha256.txt
records the later base; check it before review. No working source was overwritten.

## Current M2 measurement
17:08:02 UTC capture: 407 observations inside the fixed study window; 11 usable
market/venue cases per strategy family, with the missing ONDO/USDC Kraken case
unmeasured. Per-family starting virtual capital is 11 x $10 = $110, NOT $10 total.
Normalized P/L: cash 0; buy/hold +0.010034; momentum -0.145570;
mean reversion -0.072409 virtual quote units, under illustrative costs.
This is about 18 minutes of shared observations, not a 24-hour result or 44 bots.
No live profitability, statistically established winner or learning gain is claimed.
M4's separate gspc-paper-scorecard.json currently reports 0 settled outcomes for
both its m2 and m4 fields. That ledger is not yet the M2 watch receipt pipeline.
M4 scanner defaults use binance_perpetual/USDT; M2 records Coinbase/Kraken/OKX
spot USDC pairs. Comparing their raw totals would not be a matched experiment.

## Important budget and enforcement distinction
Installed RiskLimits differs from examples in current web documentation. The local
class includes position, executor, drawdown, drift and leverage settings; several
guards default to disabled. Configuration names must be checked against this version.
A per-agent cap or controller_id accounting label is not an isolated funded account
or a proven aggregate $100 fleet cap. No runtime account isolation was verified.

## Next research work, without modifying live controls
1. Integrating owner reviews the narrow scorecard fix; retain the failing fixture.
2. Match datasets, horizons, cost models and starting capital before M2/M4 comparison.
3. Reject stale/missing/conflicting evidence before reporting a qualified research verdict.
4. Separate correlated source families; renamed agents are not independent evidence.
5. Validate confidence against unseen, dated outcomes; record calibration error and drift.
6. Add venue minimum sizes, decimal increments, measured fees and fill/latency limits
   to a new paper experiment, leaving the current 24-hour candidate frozen.
7. Attach retained measurements and correction history to the existing CSOAI programme.
   Paper scoring, deployment, signatures and live-trade authorization remain separate.
8. Inventory the existing native backtesting and paper connectors before adding tools.

## Primary sources reviewed today
Condor introduction: https://condor.hummingbot.org/introduction
Condor architecture: https://condor.hummingbot.org/trading-agents/architecture
Condor inventory: https://condor.hummingbot.org/trading-agents/inventory
Condor backtesting: https://condor.hummingbot.org/bots/backtesting
Condor routines: https://condor.hummingbot.org/routines/overview
Hummingbot API: https://hummingbot.org/hummingbot-api/
Native paper trade: https://hummingbot.org/client/global-configs/paper-trade/
Coinbase product metadata: https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/public/get-public-product
Kraken pair metadata: https://docs.kraken.com/api-reference/market-data/get-tradable-asset-pairs
Coinbase portfolios: https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/guides/portfolios

The docs support architecture and interface facts, not profitability or deployment claims.
Exchange metadata fields are documented; actual minima/fees for this account were not read.
The existing 24-check paper-study automation remains enabled; its first scheduled run
had not yet occurred at the time it was inspected. Tool availability is still required.
