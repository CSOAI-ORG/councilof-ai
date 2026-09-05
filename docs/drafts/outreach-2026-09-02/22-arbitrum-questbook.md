# 22 — Arbitrum D.A.O. Grant Program (Questbook) / Arbitrum Foundation grants (FORM, not email)

segment: B — provable archive of tokenised-treasury permission state on Arbitrum
status: DRAFT — HOLD until endpoint 200 · season status UNVERIFIED · nothing submitted

**Door:** https://arbitrum.questbook.app/ (read 2026-09-02) lists "Arbitrum DDA 3.0", "DDA 2.0", "DDA 1.0", "Stylus Sprint" with zero proposals and zero allocation shown — whether DDA 3.0 is accepting is UNVERIFIED. Season 3 thread https://forum.arbitrum.foundation/t/arbitrum-d-a-o-grant-program-season-3-official-thread/28753 (read 2026-09-02): five domains (New Protocols and Ideas; Education, Community Growth and Events; Gaming; Dev Tooling on One and Stylus; Orbit Chains); smaller grants reviewed by one Domain Allocator, larger by two (ceilings as published in the thread); "approved through March 2026 or until funds deplete"; KYC via Questbook wallet; milestones with KPIs; final report. Fallback that IS open: Arbitrum Foundation grants, rolling, categories dApps and Infrastructure & Tools, form https://arbitrumfoundation.notion.site/Grant-Application-Form-de318b3dfaea409abbf424c958b3724b (https://arbitrum.foundation/grants read 2026-09-02).
**Owner gates:** KYC/KYB for two team members (owner + ?) — the owner decides; grant in USDC/ARB = trading income at sterling value (accountant); counsel only if holding/voting a token is a condition.

## Form answers (drafted — Questbook "New Protocols and Ideas" or "Dev Tooling"; Foundation "Infrastructure & Tools")

- **Project:** Provable archive of permission state for tokenised-treasury contracts on Arbitrum One
- **Problem:** BUIDL, USDY, BENJI, TBILL, USTBL and bIB01 all have Arbitrum deployments (addresses confirmed by bytes in our roster, https://councilof.ai/archive/index.json once deployed). Their permission state — pause/freeze, allow-lists, role grants, proxy implementation, admin keys — changes over time, and nobody records that history in a signed, third-party-witnessed form. A DeFi venue accepting one as collateral, a DAO treasury holding one, or an auditor reconstructing an incident has only a current RPC read.
- **What we build:** an hourly recorder (open source, Apache-2.0) that reads each roster contract's permission state at a named block on Arbitrum, the events that changed it, and an EIP-1186 proof against the block hash; signs each reading (Ed25519, did:web:csoai.org); witnesses the hourly root in Sigstore Rekor and OpenTimestamps; and publishes the live state and the latest leaf free with a recompute recipe. History slices are the sold artefact; the live read is free forever.
- **Milestones / KPIs:** M1 recorder live for the Arbitrum roster (≥6 contracts), first witnessed root; M2 event indexing back to each contract's deployment block (backfill) with per-reading proofs; M3 `/archive/<subject>/index.json` slices, MCP tool, method DOI, one independent recompute by a third party published as a notice.
- **Not:** a rate, a reference value, a risk score, a rating, an oracle, or anything for use in valuing or settling a financial instrument (UK BMR disclaimer travels with every reading). Issuers are subjects, never charged.
- **Team / traction:** CSOAI LTD (UK 16939677); XRPL archive hourly since 31 Aug 2026; 22-axis signed board.
- **Budget:** entered by the owner on the form; no amount in this draft.
