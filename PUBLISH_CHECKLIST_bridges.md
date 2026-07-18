# Bridge family — PyPI publish checklist (the distribution lever)

**State:** 20 packages (19 sector bridges + model-scoreboard) are BUILT, tested, registry-valid, and **build cleanly to wheel+sdist** (verified). The only gap to "live" is owner credentials.

## One command to publish all (owner)
```bash
export PYPI_TOKEN=pypi-XXXX      # your PyPI API token
bash ~/clawd/scripts/publish-all-bridges.sh
```
(No token = DRY RUN: builds all, uploads none. Re-run with the token to publish.)

## The 20 packages
cobol · iso20022 · hl7-fhir · as400 · sap · oracle · scada · edi · fix · cics · mqtt · acord · nacha · iso8583 · sip · tax · gs1 · mismo · dlms — `*-bridge-mcp` · plus `model-scoreboard-mcp`.

## After publish (distribution = the lever, not build)
1. **MCP registry** — submit each `server.json` (all 19/19 registry-valid, `registryType: pypi`).
2. **Marketplaces** — Smithery / glama / mcpize listings (the `cobol-bridge-mcp` pattern has the manifests).
3. **cosign signing** (optional, owner key) — sign the wheels for supply-chain attestation (cobol-bridge has `cosign-sign.yaml`).
4. Update `CSOAI_BRIDGE_FAMILY_INDEX.md` visibility column → published.

## Honest
- Done (M4): code · tests · CI · CodeQL · Scorecard · Dependabot · SECURITY · registry-valid server.json · **clean build verified**.
- Owner-gated: the PyPI token + (optional) cosign key. That's it — then `built ≫ published` flips.
