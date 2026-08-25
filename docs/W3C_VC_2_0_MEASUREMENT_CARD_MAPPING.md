# W3C Verifiable Credentials 2.0 — measurement-card mapping draft

**Status:** DRAFT · NEXT_300 #173 · not a shipping profile  
**Doctrine:** Measurement credential ≠ certification ≠ credit rating. Attestation ≠ tokenization.

## Intent

Map CSOAI signed measurement cards (RECEIPT-SPEC / Ed25519) onto [W3C VC Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/) vocabulary so agents and wallets can verify without inventing new trust roots.

## Draft field map

| Measurement card (CSOAI) | VC 2.0 sketch | Notes |
|---|---|---|
| Issuer (CSOAI Ltd · UK 16939677) | `issuer` | DID or HTTPS controller when published |
| Subject (model / system under test) | `credentialSubject.id` | Prefer public artifact URL, not invent |
| Axis / instrument id | `credentialSubject.axis` + `type` | Keep axis vocabulary stable |
| Status MEASURED / UNMEASURED / REPORTED | `credentialSubject.status` | UNMEASURED may omit numeric score |
| `measured_score` / accuracy | `credentialSubject.result` | **null** for UNMEASURED labour/economy indices |
| Ed25519 signature | `proof` (Data Integrity / EdDSA) | Align with existing Layer 0 verify path |
| Bank / harness hash | `credentialSubject.instrumentHash` | Freeze before MEASURED claim |
| `fused_into_gspc: false` | `credentialSubject.firewall` | Required on labour/economy context rows |

## Non-goals (this draft)

- No NRSRO / CRA rating semantics.
- No RWA ownership or tokenization claims via VC type.
- No filling UNMEASURED labour indices to satisfy a VC schema “required number.”

## Next gates

1. Freeze RECEIPT-SPEC ↔ VC `@context` URL under `councilof.ai`.
2. Counsel review before any securities-adjacent subject types.
3. Public verify path remains loginless (`/gspc-verify`).

See also: `docs/SOVOS/RECEIPT-SPEC` (if present), `/receipt-spec`, `compliance/attestation-language-template.md`.
