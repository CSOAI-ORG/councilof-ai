# 🏛 CSOAI Backend — consolidation master (2026-06-25) · EAT all, no drift

## 1. The fleet — RECONCILED (kills the drift)
`~/clawd/mcp-marketplace`: **347** `*-mcp` dirs · **347 have pyproject** (publishable) · **335 have server.json** (registry-ready).
- ⚠️ Drift killed: old notes said "233 / 294 / 300." Reality: **347 built-publishable, 335 registry-ready.** Gap = **built ≫ published.**
- Canonical (reconciled 2026-06-25 via `_alignment/MCP_19_PUBLISHED_v1.md`): **19 MCPs PUBLISHED (live)** · ~347–371 built in the marketplace (count varies by scan date — don't assert false precision) · 335 registry-ready. So: **"19 published live + ~350 built; distribution is the lever, not build."** built ≫ published remains the truth.

## 2. COBOL Bridge — the enterprise wedge (lead product)
- **cobol-bridge-mcp** — "COBOL Bridge (Legacy Modernization) MCP", `io.github.CSOAI-ORG/cobol-bridge-mcp`, **scorecard 86/100**, PyPI `cobol_bridge_mcp`, full prod kit (server.py/json, cosign-sign, codeql, tests, smithery).
- Product surface: `cobolbridge/`, `-deploy`, `-site`, landing, **sales plan**, press release, brand guidelines, Terranova/CSGA deck.
- Why: banks/insurers/gov run COBOL → a *governed* legacy→AI bridge = enterprise wedge nobody sovereign-grade offers. Pair with DORA/NIS2 + audit/attestation MCPs.

## 2b. Layer-0 Legacy Bridge FAMILY (COBOL Bridge is the first of ~10) — from SOCIAL_LEGACY_COMPLETE.zip
COBOL Bridge isn't a one-off — it's the lead of a **legacy-bridge family** that connects ONE OS to the systems running critical infrastructure (banks/gov/utilities/healthcare/airlines: ~$3T/day, Aadhaar 1.4B identities, UPI 12B+ tx/mo — real industry stats, not hype):
- **Mainframe/COBOL** (✅ cobol-bridge-mcp) · **IBM AS/400 (IBM i / RPG)** · **SAP** · **Oracle** · **Healthcare HL7/FHIR** · **Financial ISO 20022 / SWIFT** · **Industrial SCADA/Modbus/OPC-UA**.
- The win = a **governed** Layer-0 gateway: legacy system → CSOAI attestation/compliance → ONE OS, "without disruption." Nobody sovereign-grade bridges legacy + governs it.
- → Build the next bridges as MCPs in the same pattern as cobol-bridge-mcp; ties to Protocol 0. Spec: SOCIAL_LEGACY `legacy_os_02_layer0_protocol_design`.

## 3. Governance core (the CSOAI moat)
eu-ai-act · gdpr · csoai-governance-crosswalk · bft-governance · agent-audit-logger · ai-self-audit · firmware-attestation · a2a-governance-bridge · dora · dora-nis2-crosswalk · cra · csrd · healthcare-ai · hipaa · cqc · insurance-verification · construction-iso-19650 · haulage-uk · drone-airspace.
→ The backend the OS/SOV3 calls; every governed action (incl. the OS self-modifications, Ed25519-signed) routes here.

## 4. Align (to everything built this session)
OS dock → meok-one bridge + SOV3 /chat → governance MCPs · self-improve loop signs onto a ledger (same moat the fleet sells) · CSOAI Map+Dome gap = embed god-eye + meok-town-view · Revenue = A2A £499/mo + compliance packs + COBOL Bridge enterprise SKU.

## 5. Execute (honest next)
1. Verify live PyPI count → publish the registry-ready long tail (335 ready).
2. COBOL Bridge to market (86/100 + sales plan + site) — lead enterprise push.
3. Wire OS "CSOAI-governed posting" → governance MCPs (signed posts).
4. Embed Map+Dome into csoai-org.
5. Owner-gated: publish keys, DNS, twine, outreach.

## 6. 🔴 CRITICAL INFRA (found 2026-06-25)
**Data volume 100% FULL** — 228Gi, 199Gi used, ~347Mi free (after I truncated a 135MB crash-loop log). Ties to the launchd-sprawl/overheat. Big non-essential hogs: /tmp/chrome-profile-copy 924M, /tmp/roboto_origin 568M, /tmp/keystone-venv 141M (verify before clearing). **Free disk + tame the crash-loop before more backend work** — writes are failing (ENOSPC).
