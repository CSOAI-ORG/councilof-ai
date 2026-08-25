# Ondo OUSG adapter (XRPL + Ethereum adjacency)

**Posture:** REPORTED / contact-only · **not MEASURED** · no signing in this stub.

## Harden note (#162)

- **Public artifact only** — cite dated XRPScan issuer pages and Ethereum listings; never invent balance or TVL figures as measured_score.
- `fetchFacts()` returns unsigned Stage-2 reference facts from `rwaAttestationTargets`; no live explorer fetch yet.
- Attestation ≠ tokenization ≠ ownership. Do not conflate ONDO governance token with the fund.
- Wilson / signed cards require frozen bank + custody gate — not this adapter.

## Usage

```bash
node adapters/xrpl/ondo-ousg/index.ts
```
