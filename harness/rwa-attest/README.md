# RWA ATTEST — permissionless signed attestation of tokenized real-world assets
Strategy realized (ranked target list, 2026-08-24): publish **unsolicited, Ed25519-signed verdicts**
about tokenized RWAs, referencing their **public** issuing r-address (XRPL) or contract address (EVM),
with **NO issuer consent**. Rails: XRPL Memos (lowest-friction hex) · XRPL XLS-70 Credentials
("provisional until accepted" = honest unsolicited framing) · Ethereum Attestation Service (EAS,
off-chain free/signed/immutable; recipient = token contract, no consent).

## Doctrine (bind)
- Measurement, not certification. Never endorsement / issuer participation / credit rating / investment advice.
- JL.5 — honest: `governance_measurement: UNMEASURED` until a GSPC bank exists; never a fabricated score.
- GX.2 — worker-measurement signature; the estate pod (`did:web:csoai.org#board-attestation-1`) re-signs the public attestation.
- IY Wall 2 — never forecast; verdicts state what is verifiable on-chain (address, asset, stated AUM source).

## Usage
```
python3 rwa_attest.py targets            # list the 23-target registry
python3 rwa_attest.py card <id>          # build + sign + ClaimGuard-verify a verdict card
python3 rwa_attest.py memo <id>          # XRPL Memo hex (ready to submit from our funded account)
python3 rwa_attest.py eas <id>           # EAS off-chain attestation payload (recipient = contract)
python3 rwa_attest.py batch              # gen + ClaimGuard-verify all targets -> rwa-attest-index.json
```
Targets: ousg, rlusd, aviva, dcp, archax, tbill, eurcv, sbi, usdb, bbrl, dxb_re, jmwh, xau, dia,
kyobo, buidl, benji, acred, usyc, ustb, centrifuge, bcspx, scope (verified public addresses in code).
Every target card renders an honest `governance_measurement: UNMEASURED` (no GSPC bank yet) and carries a
worker-measurement Ed25519 signature; the public board card is estate-attested at
`did:web:csoai.org#board-attestation-1` (GX.2). See METHODOLOGY.md for the statistical/measurement canon.

## Execution plan (from the ranked target list)
- **Stage 1 (testnet):** XRPL Devnet Memo + CredentialCreate; EAS off-chain on Sepolia/Base. Reference impls:
  Ondo OUSG (dual-chain), BlackRock BUIDL (max prestige), Justoken JMWH (max demonstrative — the
  represented-vs-distributed gap). Gate: testnet attestations verify cleanly → mainnet.
- **Stage 2 (mainnet unsolicited):** publish signed verdicts vs Top-10; Memos (not Credentials) for XRPL v1
  (no reserve overhead); EAS off-chain for EVM, on-chain for marquee (BUIDL) for easscan.org discoverability.
- **Stage 3 (scale):** enumerate Securitize 130+ tokens + Ondo Stocks 430+ equities + Backed catalog → EAS
  programmatically; sweep XRPScan-verified RWA issuers.

## Legal risk flags (per target type)
- Regulated securities (BUIDL/BENJI/OUSG/ACRED/DCP/Aviva/Archax/SBI/Hamilton/KKR/VanEck): position as
  **compliance/measurement attestation**, NOT a credit rating; obtain securities-law counsel before EU/scale (EU CRA Reg, US NRSRO).
- More open (stablecoins RLUSD/EURCV/USDB, Dubai real estate, commodities) = lower risk.
- Justoken JMWH: powerful demonstrative but ensure factual/sourced; the 19-holder / $0-volume data is on-chain.

## Next (owner/deploy)
Re-verify every r-address (XRPScan) + contract (Etherscan) before each attest; obtain counsel; then push
via the deploy rail (XRPL submit + EAS schema/attest with the estate signing pod).
