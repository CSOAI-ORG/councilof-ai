# PARTNERS-SHORTLIST — first 10 by evidence density (B07)

> Derived by scripts/badger/generate-partner-offer-docs.py on 2026-09-05T13:20:09Z.
> Query = the code below; rerun after any registry change. Owner sends; no mass-send.

## Banks (census evidence records — query: GET /api/bank-complete, sort by records desc, top 10)

| bank | records | kind | chain |
|---|---|---|---|
| HSBC | 180 | XRPL-direct | Arbitrum, Base |
| StanChart | 180 | XRPL-direct | Arbitrum, Base |
| UOB | 180 | XRPL-direct | Arbitrum, Base |
| SG-FORGE | 160 | XRPL-direct | Arbitrum, Base |
| BNY Mellon | 150 | XRPL-direct | Arbitrum, Base |
| BNP Paribas | 150 | EVM-treasury | Arbitrum, Base |
| Deutsche Bank | 150 | EVM-treasury | Arbitrum, Base |
| UBS | 150 | EVM-treasury | Arbitrum, Base |
| JPMorgan | 150 | permissioned | Arbitrum, Base |
| Goldman Sachs | 150 | permissioned | Arbitrum, Base |

## AI providers (diff-feed churn — query: GET /api/feeds/provider-diff, top by changes)

| provider | surfaces | changes since capture |
|---|---|---|
| Cohere | 5 | 5 |
| Anthropic | 6 | 4 |
| xAI | 5 | 4 |
| Alibaba Cloud / Qwen | 4 | 4 |
| Google | 6 | 3 |
| DeepSeek | 4 | 3 |
| Amazon (AWS Bedrock / Nova) | 5 | 1 |
| Mistral AI | 5 | 1 |
| OpenAI | 6 | 0 |
| Meta | 5 | 0 |

## XRPL issuers (evidence cards — query: /interop/xrpl-issuer-registry.json)

| issuer | evidence cards | holders |
|---|---|---|
| Ripple RLUSD | 9 | 67223 |
| Circle USDC | 9 | 10325 |
| LOVE | 8 | 6802 |
| Société Générale Forge EURCV | 1 | None |
| Quantoz Payments EURQ | 1 | None |
| Schuman Financial EURØP | 1 | None |
| Ondo Finance OUSG | 1 | None |
| Republic of Palau PSC | 1 | None |
| Bitstamp USD | 1 | None |
| GateHub USD | 1 | None |

## Sequence for the owner (draft)
1. Pick one partner from each row set (start with one bank + one AI provider).
2. I hand over the signed diff for their waterline (provider-diff-feed, delta since receipt).
3. No mass send: one recipient, one receipt, one signed delta.