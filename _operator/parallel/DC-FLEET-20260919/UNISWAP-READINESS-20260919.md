# Uniswap wallet readiness - 19 September 2026

## Direct observations in this session
The existing M2 Chrome tab is https://app.uniswap.org/swap.
A screenshot shows MetaMask Account 1 connected, address abbreviated 0x21268...8ae31.
The full public address and intended blockchain were not retrieved.
MetaMask shows All networks; a multi-network total is not a single-network gas balance.
Displayed portfolio value: $3,861.88. This is existing wallet value, not bot profit.
Displayed USDC amount: 6.44. No $100 or $200 bot allocation was made by this session.
The existing swap draft sells 1,000 ONDO, displayed at about $436.24, for a preliminary
434.558 USDC quote while Finalizing quote is displayed. Not a confirmed transaction.
The assistant did not enter that draft or change its amount, approve tokens, sign,
submit, fund accounts or activate real-money execution.

## Backend checks
M4 port 15888 did not answer plain-HTTP requests. A normal HTTPS client received
a certificate trust failure; TLS verification was not disabled.
M4 Hummingbot /openapi.json returned HTTP 200 and declares HTTPBasic for wallet reads.
Unauthenticated GET /gateway/status, /gateway/connectors and
/accounts/gateway/wallets each returned HTTP 401. No credentials were read or changed.
Browser wallet connection therefore does not establish authenticated Gateway wallet integration.
Wallet controls were not available from the bounded accessibility read.

## Budget and evidence interpretation
The visible $436 draft exceeds a $100 example allocation and was left untouched.
The previous $100 per Mac proposal would mean $200 total; neither amount was allocated.
The earlier GSPC research flag is not evidence of a verified wallet-execution control.
The existing frozen paper study, schedules, strategies and source files were not modified.

## Next read-only input
Obtain the full PUBLIC wallet address and exact network. Never request a seed phrase,
private key or wallet-signing access. Read-only balance, allowance and cost inspection
can then distinguish existing holdings from funded test capital and bot-attributed results.
No portfolio balance or historical green change is a result of this assistant's bots.
Uniswap quotes, token approvals, signatures and swaps are separate actions.

## Current primary documentation
https://hummingbot.org/exchanges/gateway/uniswap/
https://hummingbot.org/hummingbot-api/routers/
https://github.com/hummingbot/hummingbot-api
https://support.uniswap.org/hc/en-us/articles/8121191796749-How-to-connect-a-wallet-to-the-Uniswap-web-app
https://support.uniswap.org/hc/en-us/articles/8120520483085-What-is-an-approval-transaction
https://support.uniswap.org/hc/en-us/articles/8370337377805-What-is-a-network-cost
https://support.uniswap.org/hc/en-us/articles/8671539602317-What-is-price-impact

Gateway documentation differs by version: the integrated Hummingbot API documents
HTTPS plus mutual certificates; generic older development instructions mention HTTP.
Do not switch this installation to insecure mode to make a read succeed.

## Update: public wallet resolved directly on M2, 19 September 2026
Public address copied from visible MetaMask Account 1, matching the connected mask:
0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31
Ethereum mainnet public RPC chain_id=1; all balances below pinned to block 26013128.
Block timestamp: 2026-09-19T17:43:35Z. Read captured: 2026-09-19T17:44:02Z.
ETH: 0.000175984076000215; USDC: 6.44.
ONDO: 4520.164498377296128097; LINK: 149.925308094095608234.
Contract identities checked against Circle, Ondo Foundation and Chainlink primary documentation.
Receipt: PUBLIC_WALLET_BASELINE_20260919T174402Z.json
Receipt SHA256: d3e1490d24f48353dfbc8e05ee40f0b9784c18f7fa55443d477a5f62dc650ca2
The public address no longer needs to be requested from the user.
The Ethereum holdings match the previously observed Uniswap/MetaMask token amounts.
Other-network ETH shown in MetaMask is not Ethereum-mainnet gas.
The old 1,000-ONDO swap draft now showed zero when re-inspected; this session did not edit its amount.
Condor displayed a completed GSPC Market Judge research delegation about Binance perpetual BTC-USDT.
Condor's DEX browser was filtered to Solana. Changed ONLY its market-display filter to Ethereum;
verified the resulting Uniswap-pool list. No wallet-network switch or execution configuration changed.
These are existing holdings and research outputs, not bot profit or funded test accounts.
No approval, signature, swap, transfer, wallet import, credential access or automated trading activation.
