# CSOAI M2/M4 read-only observer - 19 September 2026

## Ownership and scope
This lane owns observer.py, test_observer.py and receipts in this directory only.
M4 mirror: clawd/councilof-ai-work/_operator/parallel/DC-FLEET-20260919.
The existing M4 producer, Condor, Hummingbot API, Gateway, broker and database stay untouched.
The M2 gspc-shadow-lab recorder stays running; no duplicate recorder or execution stack is started.
Existing CSOAI release, signing, payment, GitHub and independent-review gates remain in force.

## Read-only interface
observer.py services: fixed unauthenticated localhost HTTP checks, not authenticated readiness.
observer.py evidence: fresh M2 public-market snapshot, retained inputs, hashes and replay.
observer.py mcp: fleet_status, shadow_evidence, coordination_handoff; no write tools.
Both directions use existing SSH keys with strict known-host checking; no new ports or secrets.
The adapter runs on demand. It is not a new scheduler or autonomous trading service.

## Evidence limits
Scope is BTC/USDC, ETH/USDC, LINK/USDC, ONDO/USDC across Coinbase, Kraken and OKX.
Configured scope has 12 combinations; missing observations are named, never converted to zero.
120-second collector freshness is a declared diagnostic threshold, not a trading risk limit.
The recorder stamps the batch before fetching; exchange event times and per-request latency are absent.
Fees, slippage, fills, funding, drawdown and strategy profitability are UNMEASURED.
Gross quote differences are observations, not net returns or executable arbitrage claims.
Hash replay is not signature verification, board admission, independent review or certification.
The code cannot place orders, sign, deploy, edit keys or accept arbitrary shell commands.

## Validation
Run: python -B -m unittest -v test_observer
22 unit tests passed on the M2; M4 and real MCP checks are recorded separately in receipts.
