# Governance MCP signer: fail-closed source handoff

Observed 2026-09-25 06:00 UTC; patch preserved 06:07 UTC. **Source-only.** No package publish, plugin update, deployment, signing, key access, or security-setting change occurred.

## Exact source

- Baseline commit: `1c3a3e48a9c57fd836411f7828e54a98e08400a3` (`fix: verify governance MCP seals offline and fail closed`). This baseline is itself an isolated source branch; check its integration state before applying the follow-up.
- Follow-up commit: `6c5a0fd4d799225207795cda805e7cf3e6f9a152` on `codex/governance-mcp-unavailable-20260925`.
- Isolated checkout: `/Users/nicholas/clawd/wt-codex-governance-unavailable-20260925` (clean at handoff).
- Portable patch: `/Users/nicholas/clawd/_alignment/CSOAI_GOVERNANCE_MCP_SIGN_UNAVAILABLE_20260925.patch` — 18,348 bytes; SHA-256 `9c833ef66c02b8aa84bf771451b20fc13cb195be9762b310acd67a7cb3d47b3d`.
- Changed paths are confined to `mcp/csoai-governance/`: `index.mjs`, `gateway-sign.mjs`, `gateway-sign.test.mjs`, `package.json`, `README.md`.

## Failure and correction

The old `csoai_sign` tool inferred `POST https://os.meok.ai/api/sign` from the governance/catalog base URL. At readback, that path answered `200 text/html` for HEAD while OPTIONS answered 405; the user's actual signing call also returned 405. There is no matching signing handler in the reviewed source. The default MCP therefore advertised a signer that was not available. It also declared `text/plain` while sending JSON and accepted a gateway-supplied public key without pinning its CSOAI identity.

The patch removes `csoai_sign` from the default tool listing and makes a legacy direct call return explicit `UNAVAILABLE` without contacting the dead route. It does not invent a signer. A future operator can enable signing only by explicitly setting a full HTTPS `CSOAI_SIGN_ENDPOINT` and a pinned 32-byte hex `CSOAI_SIGNER_PUBLIC_KEY`; the tool then requests JSON, rejects HTTP errors and HTML fallbacks, requires the returned key to equal the pin, and verifies the signature on the exact artifact bytes before returning it. A pin verifies the expected key, not board-DID authority or measurement quality.

`https://councilof.ai/api/board-sign` is **not** a replacement endpoint for this arbitrary-text MCP tool: its existing code requires GitHub Actions OIDC from allowlisted workflows and a structured card/root payload. The existing RunPod card signer is also a separate guarded workflow, not a public generic signing API.

## Validation

- `npm test` in `mcp/csoai-governance`: **9/9 pass**, including missing configuration, 405, static HTML 200, pinned-key mismatch, exact-byte mismatch, and existing offline Ed25519 verification.
- `node --check index.mjs`, `node --check gateway-sign.mjs`, `git diff --check`: pass.
- `git apply --reverse --check` against the preserved patch at the follow-up commit: pass.

## Release boundary

This patch is not in the installed npm package or Codex/Claude plugin, and does not make the live gateway sign. Before any package release, review/integrate both the baseline and this follow-up in the controlled package source, run the same tests plus an MCP tool-list/readback, and verify the actual published package bytes. Do not present the root as signed because this MCP patch exists. No arbitrary-text signer is currently evidenced at the default gateway.
