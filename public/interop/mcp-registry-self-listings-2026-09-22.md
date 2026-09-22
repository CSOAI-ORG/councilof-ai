# Our listings on the official MCP registry — self-check, 2026-09-22

**Unsigned. Measured, not certified.** Companion: `mcp-registry-self-listings-2026-09-22.json` (schema `csoai.registry-self-listings/0.1`).

> Self-published listings show distribution, not adoption.

## Population

- Source: `GET https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG&limit=100`, cursor-paginated to the end (14 pages, ended 2026-09-22T08:21:34Z).
- **1342 versions** across **354 distinct names**, all in namespace `io.github.CSOAI-ORG`, all `status: active`.
- Unit of classification: one row per name, judged on its `isLatest: true` version. The other 988 versions are counted, not checked.

## Totals by state (denominator 354 names)

| state | names | of 354 |
|---|---:|---:|
| `REMOTE_DEAD_PACKAGE_OK` | 39 | 11.0% |
| `REMOTE_DEAD_PACKAGE_MISSING` | 0 | 0.0% |
| `NO_REMOTE_PACKAGE_OK` | 314 | 88.7% |
| `NO_REMOTE_PACKAGE_MISSING` | 0 | 0.0% |
| `UNCHECKABLE` | 0 | 0.0% |
| `REMOTE_ALIVE_PACKAGE_OK` | 1 | 0.3% |

- `api.meok.ai` is **NXDOMAIN** (checked by `getaddrinfo`, 2026-09-22). 39 latest versions still declare a `streamable-http` remote there.
- Every declared package version exists today: 354 of 354 package lookups returned HTTP 200 (353 PyPI, 1 npm).
- Nothing was UNCHECKABLE: every remote host resolved or failed DNS cleanly and every package lookup returned 200.

- Cross-check: the independent full walk (`x1-mcp-publisher-concentration-2026-09-22.json`, 112,273 versions) contains exactly the same 1342 versions and 354 names for `io.github.CSOAI-ORG`; the search endpoint dropped nothing.

## Corrections to the brief

- The brief said every remotes[] URL points at api.meok.ai. On isLatest versions 39 of 40 do; 1 (io.github.CSOAI-ORG/gspc 1.4.2) points at https://councilof.ai/mcp, which resolves and answered HTTP 200.
- The brief's five-state vocabulary has no slot for a live remote; a sixth state REMOTE_ALIVE_PACKAGE_OK is added rather than misfiling the row.

## What "OK" and "dead" mean here

- **remote dead**: host does not resolve (NXDOMAIN) — no HTTP was attempted. A resolving host that answered any HTTP status is "alive"; no MCP handshake was attempted (the one live remote, `https://councilof.ai/mcp`, answered 200 to HEAD).
- **package OK**: the exact `identifier@version` in the listing exists on npm/PyPI today. It says nothing about whether it installs or runs.

## Corrective path — where it stopped

Goal: for each `REMOTE_DEAD_PACKAGE_OK` name, publish a patch-bumped version with the dead remote removed and the package kept, then read it back.

1. Pre-flight passed: all 39 dead-remote PyPI packages carry `mcp-name: <registry name>` in their description (39 of 39 match), which is the registry's PyPI ownership gate.
2. One candidate prepared and validated: `io.github.CSOAI-ORG/a2a-governance-bridge-mcp` 1.1.14 → 1.1.15, `remotes` removed, PyPI `a2a-governance-bridge-mcp==1.1.14` kept. File: `mcp-registry-self-listings-fix-candidate-server.json`. `mcp-publisher-official validate` → valid.
3. **Stopped at login.** `mcp-publisher-official login github` printed a GitHub device-flow prompt (`https://github.com/login/device`, one-time code) and polls for authorization. Completing it is an OAuth authorization on the CSOAI-ORG GitHub account — owner consent, not something this lane clicks. No token was issued, nothing was published, the registry is unchanged.
4. Not started: the loop over the remaining 38 names. It is gated on step 3 and a confirmed read-back of the single publish.

Ledger: `mcp-registry-self-listings-fix-ledger-2026-09-22.jsonl` (three rows: prepared / login-blocked / loop-not-started).

To resume (owner): run `mcp-publisher-official login github`, authorize the printed code in a browser signed in as CSOAI-ORG, then `mcp-publisher-official publish mcp-registry-self-listings-fix-candidate-server.json`, then read back `GET /v0/servers?search=io.github.CSOAI-ORG/a2a-governance-bridge-mcp` and confirm 1.1.15 is `isLatest` with no `remotes`. Only then loop.

## The 39 names with a dead remote (latest version, package kept)

- `io.github.CSOAI-ORG/a2a-governance-bridge-mcp` 1.1.14 — remote `https://api.meok.ai/v1/a2a/governance-bridge`; pypi `a2a-governance-bridge-mcp==1.1.14` 200
- `io.github.CSOAI-ORG/agent-audit-logger-mcp` 1.1.10 — remote `https://api.meok.ai/v1/a2a/audit-logger`; pypi `agent-audit-logger-mcp==1.1.10` 200
- `io.github.CSOAI-ORG/agent-commerce-payments-mcp` 1.0.13 — remote `https://api.meok.ai/v1/a2a/commerce-payments`; pypi `agent-commerce-payments-mcp==1.0.13` 200
- `io.github.CSOAI-ORG/agent-commerce-protocol-mcp` 1.0.11 — remote `https://api.meok.ai/v1/a2a/agent-commerce-protocol`; pypi `agent-commerce-protocol-mcp==1.0.11` 200
- `io.github.CSOAI-ORG/agent-content-watermark-mcp` 1.1.9 — remote `https://api.meok.ai/v1/governance/agent-content-watermark`; pypi `agent-content-watermark-mcp==1.1.9` 200
- `io.github.CSOAI-ORG/agent-cost-allocator-mcp` 1.0.7 — remote `https://api.meok.ai/v1/a2a/agent-cost-allocator`; pypi `agent-cost-allocator-mcp==1.0.7` 200
- `io.github.CSOAI-ORG/agent-data-residency-mcp` 1.0.9 — remote `https://api.meok.ai/v1/a2a/data-residency`; pypi `agent-data-residency-mcp==1.0.9` 200
- `io.github.CSOAI-ORG/agent-delegation-mcp` 1.0.12 — remote `https://api.meok.ai/v1/a2a/delegation`; pypi `agent-delegation-mcp==1.0.12` 200
- `io.github.CSOAI-ORG/agent-handoff-certified-mcp` 1.0.12 — remote `https://api.meok.ai/v1/a2a/handoff-certified`; pypi `agent-handoff-certified-mcp==1.0.12` 200
- `io.github.CSOAI-ORG/agent-identity-trust-mcp` 1.0.13 — remote `https://api.meok.ai/v1/a2a/identity-trust`; pypi `agent-identity-trust-mcp==1.0.13` 200
- `io.github.CSOAI-ORG/agent-incident-relay-mcp` 1.0.7 — remote `https://api.meok.ai/v1/a2a/agent-incident-relay`; pypi `agent-incident-relay-mcp==1.0.7` 200
- `io.github.CSOAI-ORG/agent-mcp-router-mcp` 1.1.8 — remote `https://api.meok.ai/v1/a2a/agent-mcp-router`; pypi `agent-mcp-router-mcp==1.1.8` 200
- `io.github.CSOAI-ORG/agent-negotiation-mcp` 1.0.16 — remote `https://api.meok.ai/v1/a2a/negotiation`; pypi `agent-negotiation-mcp==1.0.16` 200
- `io.github.CSOAI-ORG/agent-orchestrator-mcp` 1.0.12 — remote `https://api.meok.ai/v1/a2a/orchestrator`; pypi `agent-orchestrator-mcp==1.0.12` 200
- `io.github.CSOAI-ORG/agent-policy-enforcement-mcp` 1.0.11 — remote `https://api.meok.ai/v1/a2a/policy-enforcement`; pypi `agent-policy-enforcement-mcp==1.0.11` 200
- `io.github.CSOAI-ORG/agent-prompt-injection-firewall-mcp` 1.0.13 — remote `https://api.meok.ai/v1/a2a/prompt-injection-firewall`; pypi `agent-prompt-injection-firewall-mcp==1.0.13` 200
- `io.github.CSOAI-ORG/agent-rate-limiter-mcp` 1.0.10 — remote `https://api.meok.ai/v1/a2a/rate-limiter`; pypi `agent-rate-limiter-mcp==1.0.10` 200
- `io.github.CSOAI-ORG/agent-replay-debugger-mcp` 1.0.7 — remote `https://api.meok.ai/v1/a2a/agent-replay-debugger`; pypi `agent-replay-debugger-mcp==1.0.7` 200
- `io.github.CSOAI-ORG/agent-token-budget-mcp` 1.1.6 — remote `https://api.meok.ai/v1/a2a/agent-token-budget`; pypi `agent-token-budget-mcp==1.1.6` 200
- `io.github.CSOAI-ORG/agent-x402-paywall-mcp` 1.0.10 — remote `https://api.meok.ai/v1/a2a/agent-x402-paywall`; pypi `agent-x402-paywall-mcp==1.0.10` 200
- `withheld-by-brand-gate:756a8c97d5d5` 1.1.9 — remote `withheld-by-brand-gate:ad454f081be5`; pypi `withheld-by-brand-gate:e2c0d439b995==1.1.9` 200
- `io.github.CSOAI-ORG/eudi-wallet-mcp` 1.0.4 — remote `https://api.meok.ai/v1/a2a/eudi-wallet`; pypi `eudi-wallet-mcp==1.0.4` 200
- `io.github.CSOAI-ORG/iso-42005-impact-mcp` 1.0.7 — remote `https://api.meok.ai/v1/governance/iso-42005-impact`; pypi `iso-42005-impact-mcp==1.0.7` 200
- `io.github.CSOAI-ORG/korea-ai-basic-act-mcp` 1.0.4 — remote `https://api.meok.ai/v1/governance/korea-ai-basic-act`; pypi `korea-ai-basic-act-mcp==1.0.4` 200
- `io.github.CSOAI-ORG/mcp-spec-compliance-mcp` 1.0.3 — remote `https://api.meok.ai/v1/dev/mcp-spec-compliance`; pypi `mcp-spec-compliance-mcp==1.0.3` 200
- `io.github.CSOAI-ORG/meok-aaif-agent-card-mcp` 1.0.4 — remote `https://api.meok.ai/v1/a2a/aaif-agent-card`; pypi `meok-aaif-agent-card-mcp==1.0.4` 200
- `io.github.CSOAI-ORG/meok-abci-bridge-mcp` 1.0.3 — remote `https://api.meok.ai/v1/dev/meok-abci-bridge`; pypi `meok-abci-bridge-mcp==1.0.3` 200
- `io.github.CSOAI-ORG/meok-agents-md-lint-mcp` 1.0.3 — remote `https://api.meok.ai/v1/dev/agents-md-lint`; pypi `meok-agents-md-lint-mcp==1.0.3` 200
- `io.github.CSOAI-ORG/meok-ap2-mandate-mcp` 1.0.3 — remote `https://api.meok.ai/v1/a2a/ap2-mandate`; pypi `meok-ap2-mandate-mcp==1.0.4` 200
- `io.github.CSOAI-ORG/meok-cra-art14-reporter-mcp` 1.0.5 — remote `https://api.meok.ai/v1/governance/cra-art14-reporter`; pypi `meok-cra-art14-reporter-mcp==1.0.5` 200
- `io.github.CSOAI-ORG/meok-eu-ai-act-art-13-ifu-mcp` 1.0.6 — remote `https://api.meok.ai/v1/governance/eu-ai-act-art-13-ifu`; pypi `meok-eu-ai-act-art-13-ifu-mcp==1.0.6` 200
- `io.github.CSOAI-ORG/meok-eu-ai-act-art-26-fria-mcp` 1.0.6 — remote `https://api.meok.ai/v1/governance/eu-ai-act-fria`; pypi `meok-eu-ai-act-art-26-fria-mcp==1.0.6` 200
- `io.github.CSOAI-ORG/meok-eu-aia-art-9-rms-mcp` 1.0.3 — remote `https://api.meok.ai/v1/governance/eu-aia-art-9-rms`; pypi `meok-eu-aia-art-9-rms-mcp==1.0.3` 200
- `io.github.CSOAI-ORG/meok-eu-aigc-icon-mcp` 1.0.3 — remote `https://api.meok.ai/v1/governance/eu-aigc-icon`; pypi `meok-eu-aigc-icon-mcp==1.0.3` 200
- `io.github.CSOAI-ORG/meok-mcp-cardgen-mcp` 1.0.3 — remote `https://api.meok.ai/v1/dev/mcp-cardgen`; pypi `meok-mcp-cardgen-mcp==1.0.3` 200
- `io.github.CSOAI-ORG/meok-mcp-hardening-mcp` 1.0.2 — remote `https://api.meok.ai/v1/dev/meok-mcp-hardening`; pypi `meok-mcp-hardening-mcp==1.0.2` 200
- `io.github.CSOAI-ORG/meok-mcp-test-mcp` 1.0.5 — remote `https://api.meok.ai/v1/dev/meok-mcp-test`; pypi `meok-mcp-test-mcp==1.0.5` 200
- `io.github.CSOAI-ORG/meok-stripe-acp-checkout-mcp` 1.0.6 — remote `https://api.meok.ai/v1/a2a/stripe-acp-checkout`; pypi `meok-stripe-acp-checkout-mcp==1.0.6` 200
- `io.github.CSOAI-ORG/meok-w3c-tdm-rights-mcp` 1.0.6 — remote `https://api.meok.ai/v1/governance/tdm-rights`; pypi `meok-w3c-tdm-rights-mcp==1.0.6` 200

## Limitations

- Only the isLatest version of each name is classified; 988 older versions are counted but not checked.
- A remote that resolves and returns any HTTP status is called alive; no MCP handshake was attempted.
- The registry search endpoint was trusted to return the full namespace; it was cross-checked against the full walk in x1-mcp-publisher-concentration-2026-09-22.json where that walk completed.
- Package OK means the exact version exists on the package registry today; it says nothing about whether it installs or runs.
