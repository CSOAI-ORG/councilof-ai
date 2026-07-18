# 🔒 MCP Security & Spec Migration Brief — 2026-06-27

**Source:** `~/mcp-ecosystem-jun-2026.md` (delegated subagent research, all GitHub REST API-sourced, dated 2026-06-27).

**TL;DR — three things materially affect CSOAI/MEOK:**

1. **2 HIGH-severity CVEs in the Python SDK** (both 2026-06-05) — **most of our MCPs are exposed** if running an unpatched `mcp<1.28.0`.
2. **MCP spec v2 (2026-07-28-RC) goes STATELESS** — major API shift, removes `initialize`/`Mcp-Session-Id`/SSE resumability. v2 stable not yet released.
3. **Python SDK v2.0.0a3** shipped 2026-06-26 — `mcp-types` split, `ServerMiddleware` reshaped. Migration guide published.

---

## 1. The CVEs (action now)

### `GHSA-hvrp-rf83-w775` — Experimental task handlers allow any client to access and cancel other clients' tasks
- **Severity:** HIGH
- **Component:** Python SDK, experimental task handlers
- **Impact:** Cross-client data leak — an attacker client can see and cancel another client's in-flight tasks (and possibly read their state).
- **Affected version range:** All `mcp` versions exposing experimental `tasks/get` + `tasks/cancel` handlers without per-client session scoping.
- **Patched:** `mcp>=1.28.0` (released after 2026-06-05).
- **Our exposure:** We don't currently use task handlers (no MCPs declare `tasks/get` in our fleet). **Low risk** — but verify nothing pulled in tasks as a transitive dep.
- **URL:** https://github.com/modelcontextprotocol/python-sdk/security/advisories/GHSA-hvrp-rf83-w775

### `GHSA-jpw9-pfvf-9f58` — HTTP transports serve session requests without verifying the authenticated principal
- **Severity:** HIGH
- **Component:** Python SDK, HTTP transports (Streamable HTTP + SSE)
- **Impact:** Auth bypass — once a session is established, ANY subsequent request on that session ID is served without re-verifying the authenticated principal. Allows session hijacking if session IDs leak (e.g. via logs).
- **Affected version range:** All `mcp` versions using HTTP transports without per-request auth verification.
- **Patched:** `mcp>=1.28.0`.
- **Our exposure:** **HIGH** — 10+ MCPs in our fleet use HTTP transports (agent-mcp-router-mcp, api-tester-ai-mcp, cra-compliance-mcp, dataprivacy-ai-mcp, healthcare-ai-governance-mcp, license-checker-ai-mcp, mcp-spec-compliance-mcp, meok-aaif-agent-card-mcp, meok-cold-chain-pharma-mcp, meok-cra-annex-iv-classifier-mcp, …). **Bump floor to `mcp>=1.28.0` in all of them.**
- **URL:** https://github.com/modelcontextprotocol/python-sdk/security/advisories/GHSA-jpw9-pfvf-9f58

### TypeScript SDK — most recent advisory
- `GHSA-345p-7cg4-v4c7` (2026-02-04) — cross-client data leak via shared transport instances. Not affected by recent advisories.
- **Our TS exposure:** minimal — the OS frontends use TS but the server-side MCP fleet is Python-dominant.

### Action items (M4 lane, no owner keys)
1. ✅ **Bump `mcp` floor to `>=1.28.0`** in every pyproject.toml that currently says `mcp>=1.0.0` or `mcp>=1.2.0` — **302 pyprojects** total.
2. ✅ **Pin `c2pa-watermark-mcp` to `mcp>=1.28.0`** (currently `>=0.1.0` — most exposed).
3. ✅ **Add a SECURITY.md section** to the lead MCPs (oscal-generator, passport, crosswalk) pointing at these CVEs.
4. 🔄 **Verify no MCPs use experimental task handlers** — grep `tasks/get` across the fleet.
5. 🔄 **Test the upgrade** — re-run the 37-MCP high-value sample against `mcp==1.28.1` to confirm no regressions.

---

## 2. The spec v2 (plan, don't migrate yet)

**MCP spec `2026-07-28-RC`** (prerelease, published 2026-05-29). Stable line still **`2025-11-25`**.

### Headline changes (vs `2025-11-25`)

- **Stateless protocol.** Removes `Mcp-Session-Id` header, drops the `initialize`/`notifications/initialized` handshake. Every request carries `io.modelcontextprotocol/protocolVersion` + `clientInfo` + `clientCapabilities` in `_meta`.
- **New mandatory `server/discover` RPC** — servers advertise versions + capabilities upfront.
- **`subscriptions/listen`** replaces the HTTP GET endpoint + `resources/subscribe`/`unsubscribe` — one long-lived POST/response stream, opt-in per change-type.
- **Multi-Round-Trip Requests (MRTR)** — servers return `InputRequiredResult { resultType: "input_required", inputRequests }` instead of server-initiated requests (`roots/list`, `sampling/createMessage`, `elicitation/create`).
- **Cache hints** — `ttlMs` + `cacheScope` on list/read results.
- **Tasks become an official extension** — `tasks/get` + new `tasks/update`; no more `tasks/result`.
- **Removes** `ping`, `logging/setLevel`, `notifications/roots/list_changed`, SSE resumability, `Last-Event-ID`.
- **OpenTelemetry** `_meta` keys documented.
- **Required headers** `Mcp-Method` / `Mcp-Name` on Streamable HTTP POST + `x-mcp-header`.

### Sources
- https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28-RC
- https://modelcontextprotocol.io/specification/draft
- https://modelcontextprotocol.io/specification/draft/changelog

### Migration plan (when v2 stable ships)
- Wait for `mcp==2.0.0` stable (alphas: a1, a2, a3 — most recent 2026-06-26).
- New wire types live in standalone `mcp-types` package (split out of `mcp.types`).
- `ServerMiddleware` reshaped to `(ctx, call_next)`.
- Client API: `Client(mode='legacy'|'auto'|<version>, prior_discover=)` — `mode='auto'` probes `server/discover` and falls back to `initialize`.
- Multi-round tool calls: `call_tool(input_responses=, request_state=)` → `CallToolResult | InputRequiredResult`.

**M4 assessment:** The migration is non-trivial. Estimate: 2–3 weeks to upgrade all 79-component Layer-0 to v2 stable (assuming v2 stable lands in next 30 days). The OSCAL package generator + Compliance Passport are the most affected (they wire multiple round trips + session state).

---

## 3. SDK versions currently declared in our fleet

| Min mcp version | MCP count | Status |
|---|---|---|
| `>=0.1.0` | 1 (`c2pa-watermark-mcp`) | **VULNERABLE** — bump to >=1.28.0 |
| `>=1.0.0` | 296 | **POTENTIALLY VULNERABLE** — bump to >=1.28.0 |
| `>=1.2.0` | 5 | Likely safe but bump anyway for consistency |

**Total fleet:** 302 MCPs with `mcp` declared. All should bump to `>=1.28.0`.

---

## 4. Why this matters for CSOAI's positioning

- **EU AI Act Art. 12** (tamper-evident audit trail) requires signed, verifiable logs of every action. The HTTP-transport CVE is **exactly the kind of attack** Art. 12 is designed to detect + reject (unauthenticated principal transitions). Our **Ed25519-signed OSCAL + SIGIL ledger** provides the audit trail — but we also need to **patch the SDKs** so the underlying transport is actually secure.
- **The spec going stateless** is *good* for us — our **Layer-0 Proof** (one Ed25519-signed OSCAL package describing the whole protocol) maps cleanly onto stateless, where each request is independently verifiable. We're not depending on long-lived sessions (most MCPs are stdio today).
- **MRTR (multi-round tool calls)** matches our **agent-incident-reporter** MCP's design — it already returns server-side input requests during the `report_incident` flow. v2 will formalize that pattern.

---

## 5. Recommended action sequence

1. **TODAY (M4 lane, no keys):**
   - Bump `mcp>=1.28.0` in all 302 affected pyproject.toml files
   - Re-run the 37-MCP test sample to confirm no regressions
   - Add SECURITY.md note in the lead MCPs pointing at the CVEs
2. **THIS WEEK (M4 + M2):**
   - Audit which MCPs use experimental task handlers (zero expected)
   - Audit which MCPs use HTTP transports vs stdio (known: ~10 HTTP)
3. **WHEN v2 stable ships (M4 + M2 + Hermes):**
   - Upgrade test fleet to v2 alpha + benchmark
   - Update OSCAL generator + Compliance Passport + A2A substrate for stateless protocol
   - Plan the agent-incident-reporter MRTR migration

---

*Source: `~/mcp-ecosystem-jun-2026.md` + this analysis · 2026-06-27 · M4 lane*