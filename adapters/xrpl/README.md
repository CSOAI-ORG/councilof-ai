# XRPL / RWA adapter stubs (clean-play catalog)

**NEXT_300 #161** · Stage 2 prep · **REPORTED / contact-only** · `measured_score: null` · `signing_state: unsigned`

All stubs under `adapters/xrpl/` are **unsigned**. Attestation ≠ tokenization ≠ ownership. Never invent AUM/TVL as MEASURED. Wilson only on frozen banks (`docs/WILSON_FROZEN_BANKS.md`).

| Slug | Dir | Chain | Play | Public id | Notes |
|------|-----|-------|------|-----------|-------|
| Ondo OUSG | `ondo-ousg/` | xrpl | clean | `rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p` | Stage 2 ref · #162 |
| Ripple RLUSD | `rlusd/` | xrpl | clean | `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De` | Cash-leg adjacency · #163 |
| BlackRock BUIDL | `buidl/` | evm | clean | `0x7712c342…aa2aec` | Etherscan · #164 |
| Franklin BENJI | `benji/` | evm | clean | `0x3DDc8494…50dc9` | FOBXX · #165 |
| Aviva USD Liquidity | `aviva/` | xrpl | clean | **TBD** | Issuer TBD · #166 |
| Apollo ACRED | `apollo-acred/` | evm | clean | `0x17418038…06F27B` | Securitize · matrix |
| Archax × abrdn | `archax-abrdn/` | xrpl | clean | `rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q` | XRPL MMF · matrix |

## Matrix rows without dedicated stubs yet

From `docs/RWA_CONTACT_MATRIX.md` (still REPORTED-only):

| Instrument | Play | Why not stubbed here |
|------------|------|----------------------|
| Guggenheim / Zeconomy DCP | caution | Issuer TBD |
| Justoken JMWH | **demo** | Demo-only — never a production MEASURED stub |

Parent catalog: `adapters/README.md` · doctrine: `docs/CONTACT_PUBLIC_ARTIFACT_ONLY.md` · matrix: `docs/RWA_CONTACT_MATRIX.md`.
