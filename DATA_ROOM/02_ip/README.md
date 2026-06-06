# 02 — IP / Moat

The "what is actually defensible?" folder. This is where MEOK is strongest. The crosswalk IP (A1) and the attestation chain (A3) are the assets a competitor cannot copy in a weekend.

| # | Document | Why an investor needs it | Status | Source / how to verify |
|---|---|---|---|---|
| 02.1 | Regulatory crosswalk inventory | The core moat: ~18mo mapping EU AI Act ↔ NIST ↔ ISO 42001 ↔ DORA ↔ NIS2 ↔ CRA + ~12 frameworks. Shows depth a competitor needs 12–18mo to match. | **IN-PROGRESS** | Source material in `csoai-docs/` + the crosswalk MCPs (MEOK LAW, commit `8439b15`). Produce a one-page `crosswalk_inventory.md` listing each mapping + clause coverage. |
| 02.2 | **Live PyPI package list (REAL names)** | Proves the 271 published MCPs exist and install. **Must use real names** — `meok-*` names 404. | **HAVE** | Verified live 2026-06-06: `eu-ai-act-compliance-mcp` 1.8.2, `dora-compliance-mcp` 1.4.3, `nis2-compliance-mcp` 1.3.1, `iso-42001-ai-mcp` 1.1.3, `meok-attestation-verify` 1.0.3. Full map: `revenue/CANONICAL_PACKAGE_NAMES_2026-05-29.md` + `revenue/_mcp_pypi_map.txt`. Verify: `pip install <name>` or `pypi.org/pypi/<name>/json`. |
| 02.3 | Attestation chain whitepaper | Explains the HMAC-signed proof-of-compliance mechanism — the "un-fakeable" differentiator. | **IN-PROGRESS** | Live API: meok-attestation-api.vercel.app (HTTP 200, has sign/verify/provision/webhook). Write the 2–4 page whitepaper describing issuance + chain-of-trust. |
| 02.4 | Patent draft (attestation process) | A filed/draft patent on the attestation issuance + chain-of-trust process turns a feature into a defensible asset. | **NEED** | ~£5–15K UK application. Draft the claims around the signed-evidence issuance process. Until filed, mark as "intend to file" — do **not** claim "patented". |
| 02.5 | Trademark filings (MEOK, CSOAI) | Protects the brand; investors expect it before a round. | **NEED** | ~£1.5K UK+EU+US. File and place the application receipts here. Until granted, say "applied for", not "registered". |
| 02.6 | Open-source licensing + CLA | The MCPs are MIT-licensed; a Contributor Licence Agreement protects against license fragility if external contributors appear. | **IN-PROGRESS** | Confirm MIT across the catalogue; add a CLA template for any external contributor. |
| 02.7 | SOV3 architecture / care-membrane design | The novel R&D asset (110 tools, 6 NNs, care-gated actions). Differentiation, not yet a revenue product. | **HAVE** (design) | Code in `sovereign-temple/`; NN metadata files. See also `03_product/`. |
| 02.8 | **CC0 crosswalk moat argument** | The crisp answer to "what stops a competitor cloning this?" — the Westlaw precedent: public inputs, proprietary structure. The defensibility narrative behind 02.1. | **HAVE** | `IP_MOAT_CC0_CROSSWALK.md` (this folder). Sourced from the Jan–Feb 2026 archive extract; severed framing stripped. |

**Honesty flags (carried, do not let these slip into "we have a patent"):**
- The attestation mechanism is **live** but **not yet patented** — 02.4 is a `NEED`. Pitch it as "patentable process", never "patented".
- The 271 count is **published packages**, not downloads or paying users. Downloads belong in `04_traction/` and are currently minimal.
- Repo volume (422) is **IP depth, not adoption**. Never cite repo count as traction.
