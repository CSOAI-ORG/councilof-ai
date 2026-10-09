
## 14. Cross-TUI alignment (2026-10-01) — lane 1 handoff

Read STATUS-tui2-surfaces / STATUS-outward / STATUS-MODELS. This lane (estate/release) does **not** take over 2–6.

### What the other TUIs are doing (aligned)
| Lane | Owner session | Current state | Shared truth |
|---|---|---|---|
| 2 surfaces | ses_-ffe5f090c9fdd… | GREEN: static-shell / brand-gate / _no_typed_prices PASS; wrappers probe must use curl -sL (308) | No typed prices; no invented tool counts |
| 3 outward | ses_-ffe5f090af621… | Kaggle versioned; MCP tools/list **19** (14 free + 5 metered) @ v1.4.4; outreach draft-only | 12/13/16 tool strings in directories are STALE |
| 4 claim-maint | ses_-ffe5f090aeb56… | T1–T23 done; CHANGED_CONFIRMED trace held as CANDIDATE | Never publish without consent + release path |
| 5 SOV3/MEOK | ses_-ffe5f090ae14d… | capability router trace (local only) | No unapproved compute |
| 6 infra/mill | ses_-ffe5f090afd64… | **Only live pod** ibsaxwhchu6vf0 4090 @ $0.74/hr; 49-job playlist; **28 n≥30 unsigned** in sign inbox | Signing needs GHA OIDC — cards stay UNMEASURED |

### Shared blockers (coordinator / Nick)
1. **GitHub token INVALID** (both CSOAI-ORG and CouncilofAI-CSOAI keyring) — lane 1 cannot push/PR. `gh auth refresh -h github.com`.
2. **GHA account-disabled** HTTP 422 (ticket #4720908) — no deploy, no pr-gates, no OIDC mill sign.
3. **Provider keys dead** (HF 401 / OpenRouter 402 / Groq 403 / Gemini 401 / NIM 410) — hub mill cannot grade remote models.
4. **MCP Registry alias** `io.github.CSOAI-ORG/gspc` v1.4.3 STALE (16 tools) vs canonical `ai.councilof/gspc` v1.4.4 (19). Owner: publish 1.4.4 on alias or retire it. Do not add a third name.

### Lane 1 contribution to the one job record (convergence)
- Requested work: estate/release closure + PR queue (done — open queue empty).
- Capability: local DC + sov3-bridge + meok-hub + council-measure (mimo mcp list).
- Measurement: GSPC 23 axes · 23 measured (live /api/gspc).
- Provenance: openapi 160 paths regenerated; offline http.ok=true after #2789.
- Admission/correction: C-2026-0930-01 CORRECTED; LIVE READBACK 2026-10-01.
- Public distribution: mill 28 unsigned n≥30 WAITING on OIDC (not counted as MEASURED).
- Settlement: **0** external revenue (0.02 USDC historical non-self; repeat UNVERIFIED).

### Lane 1 next (when GH token returns)
1. Land any pending local-only fixes (none queued).
2. Do **not** sign mill cards (lane 6 / OIDC).
3. Do **not** send outreach (lane 3 / hard rule).
4. Re-read /api/gspc + /api/state after first post-#2789 deploy.

### Live MCP truth (verified 2026-10-01)
```
serverInfo: csoai-gspc-mcp v1.4.4
instructions: 14 free read-only tools and 5 paid x402 tools  → 19 total
```
