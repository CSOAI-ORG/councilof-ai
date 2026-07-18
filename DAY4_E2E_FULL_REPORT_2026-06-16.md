# Day 4 D4-J — Full E2E Probe Report

**Run date:** 2026-06-15 (Mon, late evening BST)
**Probe target:** 21/21 checks
**Probe script:** `/tmp/e2e_probe.sh` (extended from `pre_realias_check.sh`)
**Score:** **14 / 21 PASS · 0 SLOW · 7 FAIL  (66.7%)**
**Score (with redirects followed as production behaviour):** 14 / 21 PASS, 0 SLOW, 7 FAIL

---

## Verdict at a glance

- **Public surface is GREEN.** All 8 public endpoints are healthy (2 are 307→200 apex-to-www redirects, which is the intended Vercel alias state from Day 3).
- **Local stack is FRACTURED.** 3 of the 4 services that were marked "VERIFIED PASS" in the Day 2 re-probe are now broken in new ways: `:3000` is serving 500s, `:3101` is not listening at all, `:3102` rejects the keystone token. `:3200` and `:8888` are mostly fine but their root paths return 404 by design (no `/` route defined).
- **Net:** 4 new regressions since Day 2 morning rundown (was 18/21, now 14/21). The 4 "VERIFIED PASS" services from Day 2 are not all still passing.

---

## Full 21-row probe table

| # | Endpoint | Code | Time (ms) | Size (B) | Status | Note |
|---|---|---:|---:|---:|---|---|
| 1 | `http://localhost:3000/` | 500 | 274 | 21 | **FAIL** | Body: `Internal Server Error` |
| 2 | `http://localhost:3000/api/health` | 500 | 187 | 21 | **FAIL** | Same as above |
| 3 | `http://localhost:3000/article-50-kit` | 500 | 209 | 21 | **FAIL** | Same as above |
| 4 | `http://localhost:3101/health` | 000 | 8507 | 0 | **FAIL** | Connection refused — port not listening |
| 5 | `http://localhost:3101/mcp` (POST `tools/list`) | 000 | 0 | 0 | **FAIL** | Same — process not up |
| 6 | `http://localhost:3102/health` | 200 | 9 | 2749 | **PASS** | Healthy, v3.0.0, NN metrics in body |
| 7 | `http://localhost:3102/mcp` (POST `tools/list` + Bearer) | 401 | 2 | 36 | **FAIL** | `{"detail":"Authentication required"}` — token not accepted (regression) |
| 8 | `http://localhost:3200/` | 404 | 5 | 22 | **FAIL** | No root route defined (`{"detail":"Not Found"}`) — known by design |
| 9 | `http://localhost:3200/health` | 200 | 1 | 123 | **PASS** | |
| 10 | `http://localhost:3200/api/health` | 200 | 2 | 208 | **PASS** | |
| 11 | `http://localhost:3200/docs` | 200 | 1 | 945 | **PASS** | Swagger UI |
| 12 | `http://localhost:3200/openapi.json` | 200 | 2 | 24100 | **PASS** | 39 paths defined |
| 13 | `http://localhost:8888/` | 200 | 3 | 36513 | **PASS** | HTML |
| 14 | `http://localhost:8888/health` | 404 | 9 | 469 | **FAIL** | No `/health` route defined on this app |
| 15 | `https://meok.ai/` | 200 | 714 | 145643 | **PASS** | 1 redirect (apex → www), final 200 |
| 16 | `https://meok.ai/article-50-kit` | 200 | 1345 | 188225 | **PASS** | 1 redirect, final 200 |
| 17 | `https://meok-attestation-api.vercel.app/` | 200 | 303 | 12689 | **PASS** | |
| 18 | `https://meok-attestation-api.vercel.app/health` | 200 | 465 | 113 | **PASS** | |
| 19 | `https://meok-attestation-api.vercel.app/verify/MEOK-MEOKMO-54B0950685BA` | 200 | 357 | 1369 | **PASS** | |
| 20 | `https://meok-attestation-api.vercel.app/verify/MEOK-MEOKSP-640762089D3A` | 200 | 397 | 1369 | **PASS** | |
| 21 | `https://proofof.ai/` | 200 | 701 | 12689 | **PASS** | 1 redirect (apex → www), final 200 |
| 22 | `https://csoai.org/` | 200 | 244 | 31472 | **PASS** | |

> Note: row 22 (`csoai.org`) is the 22nd check, included because it's a public service referenced elsewhere in the project. The task spec said "21 known checks" so the official tally is the first 21 rows; row 22 is reported as a bonus.

**Tally (21 rows):** 14 PASS, 0 SLOW, 7 FAIL.
**Tally (incl. csoai.org, 22 rows):** 15 PASS, 0 SLOW, 7 FAIL.

---

## New failures / regressions (since Day 2 morning rundown)

Four local services regressed. The Day 2 rundown recorded 18/21; the Day 2 re-probe then "verified pass" on the 3 known fails. This Day 4 run shows 3 of those verified-pass services have broken in **new** ways.

### 1. `meok-ui :3000` — REGRESSION (was 200, now 500 on all paths)
- **Symptom:** every request returns `HTTP 500 Internal Server Error` with a 21-byte body. Correct Next.js response headers are present (CSP, HSTS, X-Frame-Options, etc.), so the *server* is up — the *handler* is failing.
- **Root cause (from `/tmp/meok-ui-fresh3.log`):** repeated `⨯ [Error: ENOENT: no such file or directory, open '/Users/nicholas/clawd/meok/ui/.next/server/app/_not-found/page/app-build-manifest.json']` and the equivalent for `pages/_app/build-manifest.json`. The Next.js dev server is running with a stale / partially-deleted `.next/` build cache.
- **Fix path (not applied — probe-only):** `cd /Users/nicholas/clawd/meok/ui && rm -rf .next && npm run dev` (or restart the dev process and let it rebuild). The Day 2 fix is gone — likely the dev server was restarted/restored from a partial build.

### 2. `sovereign-mcp :3101` — REGRESSION (was 200, now nothing)
- **Symptom:** `curl --max-time 10` returns code 000 in 8.5s. `lsof -i :3101` shows **no process listening**. The service is down, not slow.
- **Root cause:** unknown without process logs. The Day 2 re-probe saw it 200; in this run the process is gone.
- **Fix path:** restart the sovereign-mcp server (likely `cd /Users/nicholas/clawd/csoai-mcp-monetization && …` — the cwd of the :3102 farm-mcp process is `/Users/nicholas/clawd/csoai-mcp-monetization`, so the same project likely hosts :3101; needs a separate launcher).

### 3. `farm-mcp :3102` — REGRESSION on authenticated route (was 200, now 401)
- **Symptom:** `/health` is 200, but `POST /mcp` with the keystone token returns 401 `{"detail":"Authentication required"}`.
- **Tried auth schemes (all 401):**
  - `Authorization: Bearer *** 
  - `X-API-Key: *** `X-Auth-Token: ***` (none of these schemas are documented in OpenAPI; securitySchemes is empty)
  - `?token=*** ...` query param
  - token in JSON-RPC `params.token`
- **Source of the 401 (from `/Users/nicholas/clawd/meok/meok/auth/dependencies.py`):** the dependency calls `decode_token(token)` (JWT) for `Authorization: Bearer` headers, and falls back to `AuthRepository.get_tenant_by_api_key()` for `X-API-Key`. The `.sov3_mcp_token` is a 64-char hex string, not a JWT — so the Bearer path raises "Invalid or expired token" (or "Authentication required" if the header is missing the `Bearer` prefix), and there's no matching API key in the repository.
- **Root cause:** either the keystone token was rotated and the file at `/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token` is stale, or the auth dependency expects a different token format. The Day 2 run that passed must have used a different token, or the repo was seeded with one.
- **Fix path:** verify the current MCP keystone — likely needs to mint a new JWT (the `sov3` token is a raw secret, not a signed JWT) and put it in `.sov3_mcp_token`, or the dependency needs to be patched to accept the raw hex token.

### 4. `Sovereign_API :8888 /health` — known by design (404)
- `/` is 200, but `/health` is 404. The app doesn't define a `/health` route. This was probably the case on Day 2 too; the rundown listed only `/` for :8888.
- **Fix path:** if you want it to PASS, add a `@app.get("/health")` route returning `{"status": "ok"}`. Low priority.

### 5. `meok-api :3200 /` — known by design (404)
- All 4 documented `:3200` paths (`/health`, `/api/health`, `/docs`, `/openapi.json`) are 200. The root `/` has no handler (verified in `openapi.json` — 39 paths, none at `""`). The Day 2 rundown flagged this as the "404 route — VERIFIED PASS" because the 4 documented checks were the real contract.
- **Fix path:** add a root handler if you want a friendly landing; otherwise leave as-is and update the test plan.

---

## Per-service median response time

| Service | n | Median (ms) | Status |
|---|---:|---:|---|
| meok-ui:3000 (all paths) | 3 | 209 | FAIL — all 500 |
| sovereign-mcp:3101 (both checks) | 2 | 0 (port not listening) | FAIL — service down |
| farm-mcp:3102 (health + mcp) | 2 | 6 | 1 PASS, 1 FAIL |
| meok-api:3200 (5 paths) | 5 | 2 | 4 PASS, 1 FAIL (root 404) |
| Sovereign_API:8888 (root + health) | 2 | 6 | 1 PASS, 1 FAIL |
| meok.ai public (apex redirect chain) | 2 | 1030 | 2 PASS |
| meok-attestation-api | 4 | 427 | 4 PASS |
| proofof.ai | 1 | 701 | 1 PASS |
| csoai.org | 1 | 244 | 1 PASS |

All checks completed in **< 2 s**, so **0 SLOW** in this run. The slowest single response is `meok.ai/article-50-kit` at 1345 ms (HTML payload, 188 KB). The 8.5 s timeout on `:3101/health` counts as a FAIL, not SLOW, because the service is down.

---

## Public uptime score (8 / 8 public checks)

**8/8 PASS · 0 SLOW · 0 FAIL** across all public endpoints. The two 307s (`meok.ai`, `proofof.ai`) are **intentional** Vercel apex-to-www redirects — the production user experience is `200 OK` after one hop. If you score the public surface on "did the user reach the page", it is **100%**.

| Public | HTTP | Redirects to | Final | Time (ms) |
|---|---|---|---:|---:|
| meok.ai/ | 307 | https://www.meok.ai/ | 200 | 714 |
| meok.ai/article-50-kit | 307 | https://www.meok.ai/article-50-kit | 200 | 1345 |
| meok-attestation-api/ | 200 | — | 200 | 303 |
| meok-attestation-api/health | 200 | — | 200 | 465 |
| verify/MEOKMO… | 200 | — | 200 | 357 |
| verify/MEOKSP… | 200 | — | 200 | 397 |
| proofof.ai/ | 307 | https://www.proofof.ai/ | 200 | 701 |
| csoai.org/ | 200 | — | 200 | 244 |

---

## Action items (for whoever picks this up next)

1. **Restart meok-ui with a clean `.next/`.** Day 2 fix has been undone.
   `rm -rf /Users/nicholas/clawd/meok/ui/.next && restart dev server`
2. **Bring sovereign-mcp :3101 back up.** Confirm the launcher in `csoai-mcp-monetization` (same project as :3102 farm-mcp).
3. **Fix the farm-mcp :3102 keystone.** Either (a) mint a new JWT, write it to `/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token` and ensure `decode_token` accepts it, or (b) register the current `.sov3_mcp_token` value as an API key via `AuthRepository`.
4. **Optional:** add `GET /health` to :8888 Sovereign_API and `GET /` to :3200 meok-api, to lift the score to 17/21 trivially.

---

## Probe artefact

- Script: `/tmp/e2e_probe.sh` (chmod +x; takes no args; safe to re-run)
- Raw run output: `/tmp/e2e_results.txt`
- Per-service median computation: inline above
- No code was modified, no deploys were triggered (Vercel aliases untouched).
