# M2 24-hour measurement watch

Status: first capture and exact M4 replay completed; hourly checks scheduled in ChatGPT.
Window: 19 September 2026 17:49:32 BST to 20 September 2026 17:49:32 BST.
First scheduled check: 19 September 18:50 BST. Last: 20 September 17:50 BST.
24 hourly checks are scheduled; no unlimited process or live trading engine was installed.
The scheduled checks depend on the Macs being online and Desktop Commander access/approval.

This is READ-ONLY PAPER RESEARCH, not the blocked unfinished forward-trading implementation.
The separate virtual-10usd-24h-20260919/trial.py remains disabled and untouched.
No order API, exchange login, key transfer, funds, live promotion or production deployment.

## What is measured
Frozen existing simulator; 4 strategy families x 4 symbols x 3 venues = 48 scenarios.
12 scenarios are cash controls. Missing markets/data remain insufficient, not zero returns.
Results use the existing $1,000 simulator and are normalized to $10 virtual-equivalent per scenario.
No $10 wallets exist. Minimum order sizes, actual venue fees and market impact are unmodeled.
Quoted markets are USDC; normalization assumes one USDC equals one USD.
Hourly reports replay all observed data within the fixed window; not independent trials.
M4 reproduces the M2 calculation, not a distinct competing strategy or independent evaluator.

## Verified
14 new reporting tests passed on both Macs. First receipt has 77 observations and exact M4 replay.
Frozen source/manifest SHA256 checks gate scheduled execution; mismatches must stop the run.
Each capture retains input rows, assumptions, results and digest for reproducibility.
Open dashboard.html for the most recent report; it updates when a capture completes.
Use `python -B watch.py capture` on M2 or `python -B watch.py verify RECEIPT.json` on M4.
The 24-hour report is exploratory evidence, never proof of future profit or a live-trading decision.
