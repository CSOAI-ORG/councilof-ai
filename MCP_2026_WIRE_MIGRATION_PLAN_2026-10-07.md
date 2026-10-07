# MCP 2026-07-28 wire migration plan

**Date:** 2026-10-07 · **Owner:** M4 MCP-governance lane · **Status:** baseline audited, tooling shipped
**Deadline:** the old wire dies **2027-07-28** (12-month deprecation clock that opened with the 2026-07-28
revision). After that date every client that has not moved is off-spec.

Artifacts this plan depends on (all in `~/clawd`, stdlib only, no network):

| file | role |
|---|---|
| `mcp_wire_audit.py` | `audit` / `report` CLI — classifies servers by wire era |
| `mcp2026_shim.py` | bidirectional wire-translation middleware + pure functions |
| `test_mcp_wire.py` | 91 tests — classification, scanning, CLI, shim both directions |
| `MCP_2026_WIRE_MIGRATION_PLAN_2026-10-07.md` | this document |

---

## 1. What actually changed

| dimension | old wire (2024-11-05 / 2025-03-26 / 2025-06-18 / 2025-11-25) | new wire (2026-07-28) |
|---|---|---|
| session | `initialize` → `notifications/initialized`, `Mcp-Session-Id` | **stateless**, no handshake, no session id |
| request identity | inferred from the JSON-RPC body | mandatory **`Mcp-Method`** header on every request |
| target identity | inside `params` only | mandatory **`Mcp-Name`** on `tools/call`, `resources/read`, `prompts/get` |
| discovery | session-scoped | **`server/discover`** RPC |
| long-running results | ad hoc | **MRTR** `resultType: "input_required"`, forward-compatible |
| compatibility | — | 12-month deprecation, old wire **July 2027** |

Consequence: a server that answers `initialize` but cannot emit/parse `Mcp-Method` + `Mcp-Name` is
legacy; a client that requires `Mcp-Session-Id` is legacy. Both can be bridged — see §4.

## 2. Where the estate stands

**Estate under management:** 371 MCP servers / 2,016 tools (218 MEOK core + 153 SOV3 federation),
across the CSOAI-ORG GitHub organisation (751 repos).

**What is checked out locally and therefore auditable today:** three depth-capped passes over
`~/clawd` plus four satellite roots, merged and de-duplicated by path:

```
part 1  ~/clawd + registry-publish/fleet + meok-labs-engine/mcps   depth 3  --name-filter mcp
part 2  councilof-ai-monorepo/packages + 3 satellite roots         depth 3  --name-filter ''
part 3  ~/clawd broad sweep                                        depth 2  --name-filter ''
        5,045 directories seen · 13,977 source files read · ~54 s total
```

**Result: 132 server roots** (46 carry a package manifest and are directly publishable; 86 are
source/work-lane directories rolled up without a `pyproject.toml`/`package.json` above them).

| era | count | meaning |
|---|---:|---|
| pre-2025-06 | 4 | pinned 2024-11-05 / 2025-03-26, raw handshake in source |
| 2025-06 | 2 | pinned 2025-06-18 (batching-removed era) |
| 2025-11 | 3 | pinned 2025-11-25 — the last pre-stateless wire |
| 2026-07 | 29 | already carries stateless-wire evidence |
| unknown | 94 | MCP server, **no version pin in source** (SDK-mediated) |

| migration class | count | |
|---|---:|---|
| `none` | 2 | already 2026-07-28 + headers, no handshake code |
| `header-add` | 114 | headers are the only gap |
| `handshake-removal` | 6 | headers fine, raw initialize/session code remains |
| `full` | 10 | both gaps, or pinned pre-2025-06 |

Caveats, stated rather than smoothed over:

* The remaining **~239 servers are not checked out locally** — they live in CSOAI-ORG repos that have
  no worktree here. §6 phase 3 covers that census; do not read 132 as "the estate is 132".
* `registry-publish/fleet/*/server.json` (32 registry manifests) and `.well-known` manifests were
  **deliberately not counted**: a bare `protocolVersion` date in JSON is not proof a directory is a
  server (corroboration rule, §6). They still must declare the wire they serve — see §7.
* `unknown` era is the honest answer, not a gap in the tool: `mcp>=1.0.0` is unpinned in most
  `pyproject.toml`, so the source does not record which wire the installed SDK speaks.

## 3. The four migration classes and their runbooks

### Class `none` — 2 servers — *no work*
Already emits `Mcp-Method`/`Mcp-Name`, has `server/discover`, no handshake code.
**Runbook:** none. Re-audit monthly; if it regresses, it moves class.

### Class `header-add` — 114 servers — *cheapest, do first*
Version evidence exists (or the server is SDK-mediated), but the mandatory headers are not handled.
**Runbook, in order:**
1. **Pin the SDK.** In `pyproject.toml` replace `mcp>=1.0.0` with the first SDK release that speaks
   2026-07-28 (`mcp>=<version>`, exact pin in the release notes). Unpinned `>=1.0.0` is why 94
   servers read `unknown`.
2. **Add header middleware at the transport**, not per-tool: read `Mcp-Method` / `Mcp-Name` on
   ingress, validate `Mcp-Name` for `tools/call` / `resources/read` / `prompts/get`, reject with
   `-32602` when absent. `mcp2026_shim.translate_request()` is that middleware — wire it in
   (§4) instead of hand-rolling it 114 times.
3. **Emit `params._meta.protocolVersion = "2026-07-28"`** on every outbound request.
4. **Do not emit `Mcp-Session-Id`.** Stateless: drop it if a proxy adds it.
**Verify:** `audit --local <repo>` → `era: "2026-07"`, `migration: "none"`.

### Class `handshake-removal` — 6 servers — *delete legacy branches*
Headers already work, but the source still implements the handshake (`"initialize"` case,
`notifications/initialized`, `Mcp-Session-Id` handling).
**Runbook:**
1. Delete the `initialize` / `notifications/initialized` handlers and all session-id bookkeeping.
   Clients that still handshake get the reply from the **shim**, not from the server.
2. Replace any session-scoped capability lookup with stateless lookup (arguments carry the state).
3. Keep `server/discover` as the only discovery path.
**Verify:** `audit` → `migration: "none"` and **no** `initialize-handshake` / `session-id` in
`signals`.

### Class `full` — 10 servers — *both, oldest first*
pre-2025-06 pins (4) + servers with raw handshake and no headers (the remaining 6).
**Runbook:** run the `header-add` runbook *and* the `handshake-removal` runbook, oldest pin first
(`pre-2025-06` → `2025-06` → `2025-11`). A pre-2025-06 server may also rely on JSON-RPC batching
(removed 2025-06-18): confirm no client sends batches before deleting that path.
**Verify:** both runs of `audit` above; plus one live `tools/call` per server through the shim.

## 4. The shim as the bridge

`mcp2026_shim.py` is the compatibility layer that lets **un-migrated servers keep serving both
wires** until each class is finished, so the July 2027 deadline is a code-quality deadline rather
than a outage-shaped one.

* **Pure functions (no server, fully testable):**
  `translate_request(headers, body, config) -> (headers, body, notes)` and
  `translate_response(headers, body, client_wire, config) -> (headers, body, notes)`.
  `notes` is machine-readable; any note starting `respond-local:` means the shim answered the
  exchange itself and the caller must not forward (`is_local_reply(notes)`).
* **Inbound (2026 → internal):** validates `Mcp-Method`/`Mcp-Name`, injects
  `params._meta.protocolVersion`, strips any session header, normalises a header/body method
  mismatch (body wins), rejects a missing `Mcp-Name` with `-32602`.
* **Inbound (legacy → internal):** answers `initialize` locally with a **2025-11-25-compatible**
  `InitializeResult`, answers `notifications/initialized` locally (no session requirement is ever
  emitted), derives `Mcp-Method` and `Mcp-Name` from the JSON-RPC body for non-handshake calls,
  strips `Mcp-Session-Id`, forwards on the internal 2026 state.
* **`server/discover`:** answered locally with `{protocolVersion: "2026-07-28", capabilities,
  serverInfo}` — configurable through `ShimConfig` so each server reports its own identity.
* **MRTR:** any `resultType` subtree (e.g. `input_required`) passes through **untouched** in both
  directions — the shim never rewrites, strips or re-keys it, and skips protocolVersion rewriting
  inside an MRTR exchange.
* **Outbound:** `translate_response(..., client_wire="legacy")` drops the session header and
  rewrites a 2026-07-28 `protocolVersion` in a handshake result to 2025-11-25 so pre-revision
  clients accept it; `client_wire="2026"` leaves everything alone.
* **Hosts:** `ShimASGI` (drop-in ASGI middleware, local replies short-circuit before the app is
  called) and `ShimWSGI`. Bodies are buffered, so SSE streaming through the wrappers is out of
  scope — use the pure functions in front of a streaming transport. MCP **stdio** carries no HTTP
  headers, so the shim does not apply there.

**Placement:** one shim instance per ingress (reverse proxy / gateway), or in-process in the FastMCP
host app. It is a bridge, not the destination: class `none` servers retire it.

## 5. Deadline and phases (2026-10-07 → 2027-07-28)

| phase | window | scope | exit criterion |
|---|---|---|---|
| 0 — baseline | **done 2026-10-07** | tooling + local audit | 91 tests green, 132 roots classified |
| 1 — cheap wins | Oct–Nov 2026 | `header-add` (114) + SDK pins | local `header-add` count → 0 |
| 2 — cutovers | Dec 2026–Feb 2027 | `handshake-removal` (6) + `full` (10) | local `full`/`handshake-removal` → 0 |
| 3 — org census | Mar–May 2027 | the ~239 non-local servers: worktree sweep of CSOAI-ORG | every repo audited, no `unknown` without a pinned SDK |
| 4 — freeze | Jun–2027-07-28 | shim decommission check, public claim update | `report` shows `none` for all 371, or a documented exception |

Monthly ritual (5 minutes): re-run §6 commands, diff the report against last month, re-classify any
regression.

## 6. Verification steps

```bash
PY=/opt/homebrew/bin/python3.11
cd ~/clawd

# 1. tooling self-test — must be green before any claim is made
$PY test_mcp_wire.py                       # 91 tests, all pass

# 2. audit one repository (depth-capped, name-filtered)
$PY mcp_wire_audit.py audit --local <repo> --depth 3 --name-filter mcp --stats

# 3. aggregate estate state
$PY mcp_wire_audit.py report --in estate.jsonl          # human table
$PY mcp_wire_audit.py report --in estate.jsonl --json   # machine-readable

# 4. per-class acceptance
#    header-add        -> era 2026-07, migration none
#    handshake-removal -> signals contain neither initialize-handshake nor session-id
#    full              -> both of the above
#    unknown           -> SDK pinned in pyproject.toml, then re-audit

# 5. live probe per migrated server
#    a. legacy client: initialize -> 2025-11-25 result, no Mcp-Session-Id
#    b. 2026 client  : Mcp-Method + Mcp-Name on tools/call -> passes
#    c. server/discover -> protocolVersion 2026-07-28 + capabilities + serverInfo
#    d. MRTR          : resultType "input_required" survives both directions byte-identical
```

`report --json` is the artifact of record: archive one per month next to this plan.

## 7. Article 21 mapping — public claim state

Article 21: *public claims track actual state; submitted / published / indexed / invoked / settled /
delivered / verified are different states and must not be collapsed.*

Applied to the wire, "we support MCP" is not a claim that can carry all nine states. Each public
surface must state **which wire it actually speaks**, at the state the audit can prove:

| state | claim wording | evidence |
|---|---|---|
| submitted | "2026-07-28 migration submitted (PR open)" | PR link, no audit requirement |
| verified (local) | "speaks 2026-07-28 (headers + discover, no handshake)" | `report --json` record: `era: 2026-07`, `migration: none` |
| bridged | "serves legacy clients via `mcp2026_shim`" | shim deployment record + live probe §6.5 |
| not started | "speaks 2025-11-25, migration planned for Q1 2027" | `report --json` record with `era: 2025-11` |
| unknown | **"wire version unpinned (SDK `mcp>=1.0.0`)" — never "MCP 2026 compliant"** | `era: unknown` |

Enforcement surfaces that must carry the declaration: each repo `README.md`, `AGENTS.md`,
registry `server.json`, `.well-known` manifests, and the public docs index. A surface whose declared
wire disagrees with its `report --json` record is an Article 21 violation → correction ledger
(Art. 17), not a silent edit. No surface may claim 2026-07-28 while its record reads `unknown` or
anything older; "measurement, not certification" still applies to every wording.

## 8. Risks / out of scope

* **Unpinned SDKs (`mcp>=1.0.0`)** are the single largest source of `unknown` — pin them first.
* **Clients, not just servers:** the audit classifies server source. Client-side legacy (session
  requirements) is caught by live probes (§6.5), not by static scan.
* **stdio transports** are outside the shim (no headers to translate); they move with the SDK pin.
* **Batching** (removed 2025-06-18): the shim forwards batches untouched rather than rewriting them.
* No git commit from this lane — the parent lane commits.
