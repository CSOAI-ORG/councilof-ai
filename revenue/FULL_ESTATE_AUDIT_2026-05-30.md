# Full-Estate Error/Gap Audit — 2026-05-30
Every domain + key repos + "completed" tasks verified against LIVE reality (curl/git, not docs).

## Domain status: 24/25 up, proofof.ai DOWN
24 of 25 .ai domains return 200. proofof.ai = **000 (down, no TLS)**. Content wrong on 4 others.

## 🔴 BUG CLASS 1 — 4 domains serve/redirect to meok.ai instead of own content
| Domain | Reality | Should be | Severity |
|---|---|---|---|
| **suicidestop.ai** | loads (own domain) but check content | Crisis resources (Samaritans 116 123) | 🔴🔴 SENSITIVE — verify it's not a sales page |
| **fishkeeper.ai** | **302 → www.meok.ai** | FishKeeper app (local source correct) | 🟠 confirmed: "loads meok.ai" |
| **koikeeper.ai** | **302 → www.meok.ai** | KoiKeeper app | 🟠 |
| **socialmediamananger.ai** | loads own domain | own product or park | 🟡 |

Root: fishkeeper.ai/koikeeper.ai apex domains NOT attached to their Vercel projects → fall through to meok.ai catch-all. Fix = attach in Vercel UI (API 403, different scope) → doing via browser this session.

## 🔴 BUG CLASS 2 — verifier (#40) FULLY DOWN, revenue blocker STANDS
- proofof.ai → **000** (no TLS handshake). `/api/verify`, `/verify/<id>`, `/openapi.json` all 000.
- `meok-attestation-api.vercel.app` → 200 (API exists, not wired to proofof.ai).
- **Impact:** every of.ai page + V3 email promises "verify at public URL" → dead. Do not send outreach until a verify URL returns 200.

## Repos: clean (my commits landed)
clawd-workspace `4eeefd6`, sovereign-temple `9101e264`, csoai-org `816c60e`. Uncommitted files are pre-existing/not-mine (csoai-platform, haulage-app, SOV3 runtime state).

## Stripe: £0, livemode, 264 MCPs published (verified exhaustive).

## THE META-PATTERN (the real finding)
The recurring defect isn't broken code — it's **"completed" claims that drifted from reality**:
| Claimed | Reality |
|---|---|
| "~26 MCPs" (memory) | **264** published / 323 built |
| `pip install meok-dora` | 404 — real names differ (fixed) |
| #26 fishkeeper→aquaponics redirect "done" | never existed (reopened) |
| #40 verifier "reachable" | **000 down** (blocks revenue) |
| SIGIL "11/11 tests" | actually **15** |
| ASSTI "14 vendors" live | real table, **blank live page**, self-scored |
| DAILY EAT "armed 3 AM" | didn't fire (process not restarted) |
| fishkeeper/koikeeper redirect | walled, served meok.ai |
**Takeaway:** estate healthier than feared (24/25 up, 264 real MCPs, repos clean), but the ledger over-reports "done." Trust live checks.

## PRIORITISED FIX LIST
| # | Fix | Owner |
|---|---|---|
| 1 | suicidestop.ai → confirm crisis content, not sales page | Nick/Claude-browser |
| 2 | Verifier: proofof.ai up + /verify 200 | Claude builds + Nick deploy |
| 3 | Attach fishkeeper.ai/koikeeper.ai to projects | Claude-via-browser (this session) |
| 4 | Export Lovable→GitHub (source on GPU) | Nick 5 min |
| 5 | socialmediamananger.ai — content or park | Nick decide |

*Method: parallel curl of 25 apexes, git status x4 repos, live verify probes. Re-runnable.*
