# TUI-4 Gap Register — 2026-10-07

Machine-readable twin: `gap-register-2026-10-07.json` (same directory).
Doctrine: measurement, never certification. Submission ≠ acceptance; listing ≠ indexing;
HTTP 200 ≠ correct bytes. All readbacks below were anonymous, unauthenticated HTTP from one
machine, 2026-10-07 ~04:00–04:15 UTC. Cost of this audit: $0 (read-only probes).

This register answers one question: **what is missing from what TUI-4 was doing on
2026-09-11**, learned by probing, with a worked-out fix for each gap.

---

## The estate moved (11 Sep → 7 Oct)

| Surface | 2026-09-11 | 2026-10-07 (live probe) |
|---|---|---|
| MCP tools | 12 (8 free / 4 paid) | **19 (14 free / 5 metered)**; plus `/mcp/free` → 14 |
| A2A skills | 4 | **12** |
| `/.well-known/x402.json` resources | 9 | **31** |
| `/api/x402` catalog resources | 9 | **29** |
| Registry identity | `io.github.CSOAI-ORG/gspc` 1.4.0 | **`ai.councilof/gspc` 1.4.4** + new `ai.councilof/gspc-free` 1.4.4 |
| DID keys | 3 | **7** |
| npm `csoai-gspc-mcp` | 0.2.1 | 0.2.2 (0.2.3-rc.2 prerelease present) |

Full registry walk (70 pages / 7,000 entries, 2026-10-07): **old `io.github.CSOAI-ORG/gspc`
no longer exists** — the rename replaced it, no duplicate source of truth.

## TUI-4 verify checklist — live, 2026-10-07

| # | Requirement | State | Evidence |
|---|---|---|---|
| 1 | MCP tool discovery | **VERIFIED** | POST `/mcp` tools/list → 19; `/mcp/free` → 14 |
| 2 | A2A Agent Card discovery | **VERIFIED** | `/.well-known/agent-card.json` 200, v1.4.0, 12 skills |
| 3 | x402 Bazaar-compatible challenge | **VERIFIED** | free door → 402 amount 0; `/api/proof?bundle=1` → 402 amount 10000 |
| 4 | Signed offer receipt | **VERIFIED** | offer-receipt extension present on doors; offline Ed25519 VALID, server verdict VALID |
| 5 | Free metadata door | **VERIFIED** | `/api/free-door` 402, amount "0", eip155:8453 |
| 6 | Paid existing-evidence door | **VERIFIED** | 402, 10000 atomic ($0.01), csoai_pricing + bazaar ext |
| 7 | Attribution fields | **VERIFIED** | `csoai_pricing` block on 402; UTM per 09-14 map; receipts carry payer/resourceUrl/transaction |
| 8 | Correction + provenance links | **VERIFIED** | `/api/corrections` 200 (248,487 B); llms.txt names both |
| 9 | Truthful directory updates | **GAP — 5 items below** | see GAP-2…GAP-7 |

---

## Gaps and worked-out fixes

### GAP-1 — `llms.txt` prints 3 discover routes twice — FIXED, PR #2854 FILED
- **Evidence:** 6 discover mentions, 3 unique (live `llms.txt`, 2026-10-07T04:00Z).
- **Root cause:** `council-os/capabilities.json` declares GET **and** POST variants of the
  same route (258 entries, 59 duplicated paths; the three discover routes are explicitly
  `Chainlink discovery` + `Chainlink discovery (POST)`). The `freeDoors` render is a
  methodless path line with no dedupe.
- **Fix landed:** Set-based path dedupe in `scripts/llms-txt.mjs` + regenerated
  `public/llms.txt` — **PR #2854** (+5/−3). `node scripts/llms-txt.mjs --check` ✓ both
  files match live; `bash scripts/pre-push-gates.sh` ✓ clean.
- **Supersedes:** PR #2799 (same dedup, CONFLICTING/DIRTY; its other intents landed via
  #2783 and #2835).

### GAP-2 — `awesome-mcp-servers` listing was deleted upstream — REGRESSED, needs re-PR
- **Evidence:** repo-wide code search for `councilof-ai`/`csoai-gspc` → **0 hits**
  (2026-10-07). Was present 2026-09-23 (5 lines), first absent 2026-09-27.
- **Root cause:** upstream commit `3c301956` "shorten long descriptions" (2026-09-27T02:12Z)
  removed both CSOAI-ORG entries (original merge: PR #13360).
- **Fix worked out:** re-submit a **short** entry (long descriptions invite the next
  shortening pass). Draft, ready to PR to `punkpeye/awesome-mcp-servers`:
  `- [CSOAI-ORG/councilof-ai](https://github.com/CSOAI-ORG/councilof-ai) … ☁️ - Live GSPC measurement board over MCP (councilof.ai/mcp, 19 tools: 14 free + x402-metered). Measurement, never certification. Verify: councilof.ai/gspc-verify`
- **Status (2026-10-07T04:40Z): PR FILED** — https://github.com/punkpeye/awesome-mcp-servers/pull/15893
  (fork branch `CSOAI-ORG:add-csoai-entries-20261007`, both entries re-added at their
  historical positions with shortened one-sentence descriptions). Owner's "go" was the
  action-time approval. Awaiting upstream review.

### GAP-3 — PulseMCP entry is gone — REGRESSED, needs re-submission
- **Evidence:** manifest claimed LISTED (`servers/detail/io-github-csoai-org-gspc`,
  checked 2026-09-14); **today that URL → 404**, searches for gspc/council-of-ai → 0 hits.
  (The org's other servers still appear in their index — the gspc entry specifically is gone.)
- **RESOLVED (2026-10-07T04:35Z): submissions are paused site-wide.** The /submit page
  states: *"submissions and changes are temporarily paused… publish it to the Official MCP
  Registry. That is the best first step even when we are not paused, and we will pick it up
  automatically once we are back"* (last updated 2026-09-03). We are already published
  there (`ai.councilof/gspc` 1.4.4, isLatest). Their sitemap carries **188 CSOAI-family
  entries and 0 gspc/councilof entries** — the gap is theirs to close on reopen, and our
  only correct action (official registry) is already done. Nothing to submit.

### GAP-4 — Smithery: stale duplicate + tool set never re-verified
- **Evidence:** current listing `csoai/gspc-mcp` "Council of AI GSPC (HTTP)" 200; the old
  duplicate `csoai/gspc` also still serves 200 (153 KB). The 2026-09-14 claim of 4 phantom
  tools (`verify, jail-probe, enter-arena, measure`) could **not** be re-confirmed today —
  the tool list renders client-side (SPA), so raw HTML proves nothing either way.
- **RESOLVED (2026-10-07T04:38Z) — both claims do not reproduce.** Registry API
  `registry.smithery.ai/servers/csoai/gspc-mcp` returns a **live tool list of exactly the
  current 19 tools** (no `measure`, no phantoms), `inactive:false`, `isDeployed:true`.
  The old duplicate `csoai/gspc` → **404 "Server not found"** in the registry API; its 200
  on the website is only the SPA shell (HTTP 200 ≠ correct bytes). No owner action needed.

### GAP-5 — Glama connector points at a retired registry name
- **Evidence:** listing live (200, `quality_grade:a`, `maintenance_grade:a`,
  `license_grade:a`, `author:claimed`). Connector is keyed
  `io.github.CSOAI-ORG/gspc` — **the registry name that no longer exists** (renamed
  `ai.councilof/gspc`). The 2026-09-14 "40/40 Unhealthy connectors" claim did **not**
  reproduce: no "Unhealthy" text in today's page HTML.
- **RESOLVED (2026-10-07T04:40Z) — Glama already re-crawled.** Connectors exist and serve 200
  for **both new names**: `glama.ai/mcp/connectors/ai.councilof/gspc` and `…/ai.councilof/gspc-free`
  ("Council of AI GSPC (free)"). Repo `server.json` emits `ai.councilof/gspc` 1.4.4 ✓. The old-key
  connector page remains as historical record only. No owner action needed.

### GAP-6 — Receipt signature "mismatch" was stale/false — CLOSED with correction
- **Evidence:** the 11 Sep self-test JWS (`public/interop/x402-self-settlement-2026-09-11.json`,
  kid `#board-attestation-1`) verified **offline VALID** against the current DID (exact kid
  match; 6 other keys correctly invalid) and the server verdict today is `VALID`.
- **Fix landed:** dated CORRECTION appended to `docs/tui4/agent-economy-map-2026-09-14.md`
  in this PR; findings row marked closed. The 2026-09-14 observation stays on record as a
  historical observation that does not reproduce.

### GAP-7 — x402 index coverage unproven — ENUMERATION BLOCKED, honest UNKNOWN
- **Evidence:** PayAI discovery returns only its first 100 rows to an anonymous caller and
  no cursor was extractable — **0 of those 100 rows are ours**, but absence across the full
  catalogue is **not established**. The CDP discovery URL from the 09-14 manifest
  (`api.cdp.coinbase.com/x402/discovery/resources`) now **404s** — endpoint moved/dead.
- **CDP mechanism now EXACT (2026-10-07T04:45Z), all free checks run:**
  - `GET …/v2/x402/discovery/merchant?payTo=0x2126864…` → **total 0** (absent, no key needed).
  - `POST …/v2/x402/validate` on `/api/proof?bundle=1` → **`valid: true`,
    simulation.outcome: "accepted"**, and our `extensions.bazaar` block (input schema,
    output example) extracted intact. The paid door is already conformant.
  - Free door: `valid: false` (Coinbase does not catalogue $0 discovery-only flows — by their docs).
  - There is **no registration form**: indexing fires on the **first settled payment through
    the CDP facilitator** (`settle`, not `verify`, with `paymentPayload.resource` set).
  - **Staged owner decision (not executed):** the rail's facilitator is an owner switch —
    `X402_FACILITATOR_URL` (Cloudflare Pages env). Runbook: (1) point the env at
    `https://api.cdp.coinbase.com/platform/v2/x402` (CDP seller path may require CDP API
    credentials — credential creation = owner), (2) run ONE self-facilitated $0.01
    settlement against `/api/proof?bundle=1` (cost: $0.01 USDC + negligible Base gas;
    classification INTERNAL_SELF_FUNDED, never revenue), (3) verify merchant discovery
    total ≥ 1, (4) switch env back to PayAI or keep CDP — routing is the owner's call.
  - **Owner said GO (2026-10-07T05:0xZ).** Deliverables: runbook
    `docs/tui4/cdp-bazaar-runbook-2026-10-07.md` + staged `scripts/x402/cdp_index_settle.py`
    (dry-run exit 0; no-creds exit 2 BLOCKED, attempts nothing). The edge turns out to be
    **CDP-code-complete** (`functions/api/_cdp_jwt.ts`, per-request Ed25519 JWT) — Option B is
    3 env entries away, deferred as a live-rail decision. Option A (direct settle, no rail
    change) needs only: CDP API keys + funded signer + ~$0.01 self-settled.
  - **Permissionless alternative FIRED, service down:** `bazaar.saylorinnovations.com`
    `POST /submit {"manifestUrl":…}` + every D1-backed route returned Cloudflare 1101 across
    4 attempts (only cached `/discovery/stats` answers: 2041 listings / 21172 resources).
    Submit unverifiable while their service is down — retry pending.
  - PayAI full-catalogue enumeration remains blocked (no cursor for anonymous callers) —
    first 100 rows contain 0 of ours; absence NOT established.

---

## Also stale, not fixed here (controller-owned surfaces)

- `docs/tui4/destination-manifest-2026-09-14.json` still records the old registry identity
  (`io.github.CSOAI-ORG/gspc`, 1.4.2) for five destinations. It is a **dated** artifact and
  is left intact; this register supersedes its counts and identity fields as of 2026-10-07.
- `wk 31 vs catalog 29` resource counts differ because `/.well-known/x402.json` expands the
  three discover URLs while `/api/x402` keeps one template row — presentation difference,
  not two truths. Both render from `council-os/capabilities.json`.

## Claims this register does NOT make

- No customer, revenue, or settlement claim (the 11 Sep self-test remains
  INTERNAL_SELF_FUNDED).
- No directory is called healthy, verified, or endorsed — only HTTP-observed.
- Rekor/OTS/Bitcoin states are untouched here; OTS stays `STAMPED_PENDING_BITCOIN`.
- "Not listed" is recorded as an observation with method and time, never as a fact about
  a third party's internals.
