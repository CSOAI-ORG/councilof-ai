# Adapters — clean-play / REPORTED contact stubs

**NEXT_300 #161** · Expand clean-play adapters. All stubs here are **unsigned**, `measured_score: null`.

Full XRPL catalog: **`adapters/xrpl/README.md`**.

| Slug | Path | Chain | Play | Notes |
|------|------|-------|------|-------|
| Ondo OUSG | `xrpl/ondo-ousg` | dual | clean | Harden README #162 |
| Ripple RLUSD | `xrpl/rlusd` | xrpl | clean | Cash leg / DvP adjacency |
| BlackRock BUIDL | `xrpl/buidl` | ethereum | clean | Etherscan public_id |
| Franklin BENJI | `xrpl/benji` | ethereum | clean | FOBXX adjacency |
| Aviva USD Liquidity | `xrpl/aviva` | xrpl | clean | #166 issuer TBD |
| Apollo ACRED | `xrpl/apollo-acred` | ethereum | clean | Securitize feeder |
| Archax × abrdn | `xrpl/archax-abrdn` | xrpl | clean | XRPScan issuer |
| Guggenheim DCP | `xrpl/guggenheim-dcp` | xrpl | caution | issuer TBD |

Matrix-only (demo): JMWH = demo-only — never a production MEASURED stub.

**Stage 3 catalog clusters (#303–308):** `adapters/evm/catalog/` — six REPORTED JSON batches (Ondo Stocks, Securitize, Backed). See `docs/STAGE3_CATALOG_CLUSTERS.md`.

Never invent AUM as MEASURED. Wilson only on frozen banks (`docs/WILSON_FROZEN_BANKS.md`).
