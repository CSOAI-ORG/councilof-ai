# Trading intelligence model gate

This Ori evaluation compares five live, tool-capable OpenRouter models selected
from the current catalog under explicit prompt and completion price ceilings.
It measures whether a research agent preserves paper/live boundaries and reports
missing evidence instead of inventing a profitable or executable result.

It does not measure strategy profitability. The fixtures are deterministic
decision-boundary tests; backtests, forward-paper results, fees, slippage and
execution receipts remain separate evidence.

Run a one-case-per-model pilot first:

```sh
ORI_TELEMETRY=0 ori eval evals/trading-intelligence/trading-safety.eval.ts \
  --pilot 1 --hermetic --report pilot-report.md
```

Only run the full six-case comparison after reviewing the measured pilot cost.
