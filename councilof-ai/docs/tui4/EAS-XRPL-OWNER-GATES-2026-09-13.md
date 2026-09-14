# Owner Gates — EAS Attestation, XRPL Memo, npm 2FA

## Date: 2026-09-13T18:00Z

### DONE (Pushed Through)

1. **EAS Schema Registered on Base** — tx 0xd698c821... block 51277985
   - Schema UID: `0x95e43817917d20af52de97ebabb0d639ad173101aa29a8e0a1c2c9374c58e62b`
   - URL: https://base.easscan.org/schema/details/0x95e43817917d20af52de97ebabb0d639ad173101aa29a8e0a1c2c9374c58e62b

2. **MCP Registry Published** — `io.github.CSOAI-ORG/gspc` v0.2.2 ACTIVE
   - Verified via: https://registry.modelcontextprotocol.io/v0.1/servers?search=gspc

3. **npm v0.2.2 Published** — `csoai-gspc-mcp@0.2.2` on registry.npmjs.org

4. **GitHub Pins Updated** — councilof-ai + gspc-board now pinned on profile

### EAS Attestation — BLOCKED

The AttestationStation pre-deploy contract at `0x420...0020` on Base rejects our attest() calls with "awaiting_internal_transactions". 

**Cause:** The Base pre-deploy contracts use a minimal ABI that differs from the mainnet EAS contracts. Our `attest(address,bytes32,uint64,bytes32,bytes)` calls don't match the pre-deploy's expected interface.

**What would unblock:** Full EAS deployment on Base (which the EAS Hub project supports, but requires owner-initiated deployment). Or use the EAS SDK which wraps the pre-deploy correctly.

**Attempted tx hashes (all reverted):**
- 0x86a5509740eb9afe5e8b46e6d338a7f60375593d5e372d62ef7c8ea3ee05ae0d
- 0x8a1fbe29f47f94b175afb64ff2eb4c3de193a751aaed282908a4318ce6542978
- 0x7294dcf6198c4b84c09a4b89b594b04e100e9b43ef3cf8ecc4afa58245bc153e

### XRPL Memo — BLOCKED

MetaMask does NOT support XRPL. The user has a separate XRPL wallet (Xaman/Crossmark) that is not accessible via the browser automation.

**RLUSD issuer `rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh`** has 567.75 XRP available, but we have no seed to sign with.

**x402 payment wallet on XRPL:** Memory indicates this was done via a different mechanism (the prior x402 payment tx was on Base, not XRPL).

**What would unblock:** Owner needs to:
1. Export XRPL seed from Xaman/Crossmark, OR
2. Sign the memo transaction manually via Xaman and provide the signed blob

### npm 2FA — BLOCKED

Cannot publish `csoai-gspc-mcp@0.2.3` with corrected `mcpName` field. The npm token in `~/.npmrc` requires a one-time password from the authenticator.

**What would unblock:** Owner runs `npm login && npm publish` from `mcp/gspc-server/` with the corrected `mcpName: "io.github.CSOAI-ORG/csoai-gspc-mcp"`.

### HF Dataset — BLOCKED

Token `REDACTED-GH-PUSH-PROTECTION-20261113` returns 401 Unauthorized. Token is expired.

**What would unblock:** Owner runs `hf auth login` and provides fresh token.

### NIST Submission — BLOCKED

Comment prepared at `docs/tui3/NIST-COMMENT-2026-09-16.md`. Requires owner's signature/digital certificate.

**Deadline:** Sep 16, 2026

**What would unblock:** Owner signs and submits via datatracker.
