# GSPC adapter status — 2026-09-28

This is a status map for the current GSPC integration slice. It records implementation states, not partner endorsement or production acceptance.

## Runtime adapters

- OpenShell: a local read-only MCP policy/probe candidate exists at `integrations/openshell-gspc`.
- Current anonymous MCP readback: 13 tool definitions; 9 are allowlisted only when their descriptions do not declare PAID; 4 explicitly PAID tools are denied by default.
- The probe calls only `board_totals`; no paid operation, credential provider, signature, or settlement is invoked.
- The package verifier checks the live tool list and the container build now includes both `probe.mjs` and its required `toolset.json`.
- OpenShell v0.1.1 accepted the earlier policy in an isolated gateway check. Full sandbox enforcement (allowed read, paid denial, and all other egress denial) remains NOT RUN.
- OpenBMC: `integrations/openbmc-gspc` is a read-only Redfish CLI candidate. It uses HTTPS by default, bounded GETs, no redirects, response hashes and selected non-secret fields.
- Its nine local tests pass. No production BMC, firmware update, hardware attestation, or OpenBMC project acceptance was tested.
- LFX: LFX is a suite of services, not one generic API. PCC documentation says access is restricted; the service describes API-driven administration, but this review has no authorized PCC/API credentials.
- First LFX seam: record public documentation or an owner-authorized, read-only security-report export as a versioned source; classify inaccessible project reports AUTH_REQUIRED. Do not install bots or request repository write scopes.
- SAFE: the public RFC repository describes community review/contribution; it is a proposal, not a live incident exchange. Reuse its public requirements as a schema crosswalk only.

## Shared product contract

Layer O carries the requested action, actor/tenant, authority reference, target, source/version digests, purpose and idempotency key. Harness X runs bounded positive and rejecting fixtures. GSPC records only observed evidence and explicit UNMEASURED/UNCHECKABLE states. The Constitutional Harness gates consequential effects. Each adapter returns an effect receipt; signing, anchoring, payment and release remain separate authorized stages.

Current result: two adapter candidates are locally testable; there is no single-install package, shared identity login, production LFX connector, OpenBMC hardware read, or completed OpenShell sandbox proof yet. Do not describe the platform as fully integrated or operational end to end.
