# M2/M4 combined research readout - 19 September 2026

## Installed and verified
paper_metrics.py contains the tested reporting correction: the win numerator and
numeric-return denominator use the same population. It excludes invalid/nonfinite
returns and nonpaper rows. This is a new read-side module, not an M4 writer edit.
research_bridge.py reads the frozen M2 receipt and M4 paper-outcome ledger through
existing strict-host-verified SSH. It keeps their incompatible experiments separate.
capture_readout.py writes only a retained JSON receipt and Fleet Research Snapshot.html.
The M2 Desktop shortcut opens this snapshot; Chrome title and path were confirmed.
23 reporting, route and snapshot tests passed on M2 and the same 23 passed on M4.
The added capture is included in the existing hourly study task with code-hash pins.
The frozen study code, window, assumptions, budget normalization and schedule are unchanged.

## Actual status
The 17:20 UTC snapshot contains 682 M2 observations and three M4 reported outcomes.
M2 family totals per $110 normalized virtual start: cash 0; buy/hold -0.01651;
momentum -0.27430; reversion -0.13679. These are not funded dollar accounts.
M4 sum is -16.930 basis points across three reported outcomes, NOT dollar portfolio P/L.
Condor still returned HTTP 200 through M2's existing 127.0.0.1:8088 tunnel.
No $100 budget was allocated, no account queried for live balances, no orders submitted.

## Explicit limit
open_research.py write was blocked; that file does not exist. No persistent 8090
viewer was launched. research_server.py is tested source only, not a running service.
Do not recreate the blocked launcher or start it through another route.
Fleet Research Snapshot.html is a saved research output, updated by bounded captures.
M4 producer/risk/config files and the incomplete forward trial remain untouched.
Receipts: receipts/fleet-readout-20260919T172019820057Z.json and
receipts/READOUT_VALIDATION_20260919T1723Z.json. No shared coordination file was edited.
