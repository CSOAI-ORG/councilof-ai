# EU CRA — SBOM path for Option A (Powered-by SKU)

**NEXT_300 #190** · Option A white-label engine (`/powered-by`) · **measurement, not certification**

## Product framing

The Option A licensed engine is a **product with digital elements** under the EU Cyber Resilience Act (CRA), not a grade sale. HO.2 still applies: meter access/licensing; **never** sell GSPC scores or axis placements via the SKU.

## SBOM deliverable path (design — not live until counsel + build freeze)

| Step | Artifact | Owner |
|------|----------|-------|
| 1 | SPDX 2.3 or CycloneDX SBOM from `client` + `functions` build graph | eng |
| 2 | Attach SBOM to Option A partner pack alongside attestation-language template | compliance |
| 3 | Vulnerability reporting workflow aligned to ENISA 24h / 72h / 14d cadence (CRA bite before Sept 2026) | ops |
| 4 | Publish SBOM URL on `/powered-by` only after counsel clears product wording | counsel ⛔ |

## Repo paths (when implemented)

```
compliance/option-a-cra-sbom.md          ← this note
compliance/sbom/                         ← generated SPDX/CycloneDX (gitignored until CI emits)
dist/client/.well-known/                 ← optional public SBOM pointer post-freeze
```

Build hook (planned): `npm run build:client` → `node scripts/emit-option-a-sbom.mjs` → `compliance/sbom/option-a.cdx.json`.

## Cross-references

- Conformance axis + CRA crosswalk: `docs/ESTATE_CROSSWALK.md` (continuity / conformance rows)
- Attestation language (not CRA rating): `compliance/attestation-language-template.md`
- Child keys design: `docs/OPTION_A_CHILD_API_KEYS.md`
- Production surfaces: `docs/PRODUCTION_CHECKLIST.md`

Do not claim CE marking or CRA conformity until counsel and a frozen release artifact exist.
