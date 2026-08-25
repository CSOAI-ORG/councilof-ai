# IETF receipt differentiation vs other formats

Council OS measurement cards are **opinion receipts** — not payment rails, not VC issuance ceremonies, and not generic audit logs.

## How we differ

| Format | Typical use | Our posture |
|--------|-------------|-------------|
| HTTP structured fields / MICE | Transport metadata | We cite public artifacts; transport ≠ attestation |
| SCITT / transparency logs | Supply-chain statements | Adjacent for **method** publication; cards stay measurement-specific |
| W3C VC 2.0 | Credential issuance | Mapping draft only (`docs/W3C_VC_2_0_MEASUREMENT_CARD_MAPPING.md`); provisional until subject accepts |
| EAS / on-chain attest | Marquee discoverability | Off-chain first; hash pointers (XRPL Memo v1) before on-chain churn |
| Payment / invoice receipts | Settlement proof | **Not** our lane — attestation ≠ tokenization ≠ ownership |

## Measurement cards

- Ed25519-signed board evidence for GSPC axes (Wilson on **frozen** banks only).
- RWA Stage 2: unsigned REPORTED facts → testnet pointers; no invented AUM as MEASURED.
- Labour/economy indices: **UNMEASURED** — `measured_score: null` on all catalog APIs.

## INDEX-METHOD firewall (labour indices)

Per `docs/SOVOS/INDEX-METHOD-0.1.md`:

- AI-economy, human-labour, humanoid-labour are **contextual firewall layers**.
- They must **never** fuse into GSPC cell inputs or Ed25519 grading SHA-256.
- REPORTED citations (ILO, AEI, MachBench) are context IDs only until a frozen bank exists.

Measurement, not certification. Scores never sold.
