# 🚀 MEOK WORLD — LAUNCH CHECKLIST (FINAL)
**Launch: Saturday 4 July 2026, 09:00 BST** · **Runbook cut: 29 June 2026, 15:37 BST**
**Mission:** Sovereign AI Operating System + 128 pages + PWA + 13-Queen council go public.

> This is the **single source of truth** for the launch sequence.
> Every item has an owner, an action, a tool, and a success criterion.
> T-24h is the start of the 4-day final countdown (Wed 3 Jul, 09:00 BST).

---

## 0. PEOPLE & ROLES (RACI)

| Role | Who | Symbol |
|---|---|---|
| **Owner** | Nick (CSOAI-ORG / MEOK) | 🟢 |
| **Backend lead** | meok-backend agent (here) | 🔧 |
| **Frontend lead** | meok-deploy agent | 🖥️ |
| **Sovereign brain** | SOV3 substrate on `:3101` | 🜏 |
| **King hive** | 28 hives via `mcp_meok_king_*` | 👑 |
| **Sigils** | Ed25519 hash-chain | 🔏 |
| **Comms** | LinkedIn / Twitter / Email | 📣 |
| **On-call** | Pager rotation (24h) | 📟 |

For every checkpoint, the **Owner** must confirm PASS before the next clock starts.

---

## 1. PRE-LAUNCH — T-24h (Fri 3 Jul 09:00 BST)

### 1.1 Code freeze & integration
1. 🟢 **[T-24h] Code freeze on `main`** — `git tag meok-launch-v1.0` after final CI green.
   *Tool:* `git -C ~/clawd tag -a meok-launch-v1.0 -m "launch candidate"` · *Success:* `git tag -l` lists tag.
2. 🟢 **[T-24h] Merge all 4 critical-path branches** — avatar endpoint, vercel.json, checklist, audit.
   *Tool:* `git -C ~/clawd pull --rebase && git log --oneline -5` · *Success:* HEAD shows all 4 commits.
3. 🔧 **[T-24h] Backend tests pass 175+/175+** — `pytest test_app.py -q`.
   *Success:* `37 passed` (current) + all e2e tests still green.
4. 🖥️ **[T-24h] Frontend type-check + lint clean** — `npm run type-check && npm run lint`.
   *Success:* `tsc --noEmit` returns 0, `next lint` returns 0 warnings.
5. 🖥️ **[T-24h] All 128 routes regenerated** — `npm run generate-routes && npm run validate`.
   *Success:* `make validate` prints "all 128 routes present".

### 1.2 Sovereign state snapshot
6. 🔧 **[T-24h] SOV3 substrate live** — `curl http://localhost:3101/health` returns 200.
   *Success:* `{"status":"alive","version":"v2.0.0"}`.
7. 🔧 **[T-24h] Backend live on :8000** — `curl http://localhost:8000/api/healthz`.
   *Success:* `{"ok":true}`.
8. 👑 **[T-24h] King hive responsive** — `mcp_meok_king_list_hives` returns 28 domains.
   *Success:* 28/28 hives list.
9. 🔏 **[T-24h] SIGIL chain sealed & verified** — `mcp_sov3_federation_sigil_transcript`.
   *Success:* last 50 sigils verified, chain head intact.
10. 🔧 **[T-24h] ichars.db seeded with demo twins** — `python seed_demo_data.py`.
    *Success:* at least 13 i-chars (1 per queen archetype).

### 1.3 Compliance preflight
11. 🟢 **[T-24h] EU AI Act Article 50 passport issued** — `mcp_sov3_federation_article50_passport_issue`.
    *Success:* passport hash returned, audit logs entry.
12. 🟢 **[T-24h] GDPR data-room sealed** — review `DATA_ROOM/` for stale PII.
    *Success:* 0 plain-text emails found.
13. 🟢 **[T-24h] Cookie/Privacy/Terms pages live** — `curl -I https://meok.ai/privacy`.
    *Success:* HTTP 200, valid date in `Last-Modified`.

### 1.4 Security preflight
14. 🔧 **[T-24h] CSP headers validated** — `curl -I https://meok.ai | grep -i content-security`.
    *Success:* CSP header present with 7 allowlisted sources.
15. 🔧 **[T-24h] HSTS preload ready** — `curl -I https://meok.ai | grep -i strict-transport`.
    *Success:* `max-age=63072000; includeSubDomains; preload`.
16. 🔧 **[T-24h] X-Frame-Options DENY** — `curl -I https://meok.ai | grep -i x-frame`.
    *Success:* `DENY` returned.
17. 🔧 **[T-24h] Secrets rotated** — `bash scripts/rotate-secrets.sh`.
    *Success:* new Sigil keypair + DB salt, old ones deprecated.
18. 🔧 **[T-24h] DORADO quantum-safe key rotation** — `mcp_sov3_federation_sov_dorado_key_rotation`.
    *Success:* `status=ok, pqc=ml-dsa-65`.
19. 🔧 **[T-24h] Dependency audit clean** — `npm audit --production; pip-audit -r requirements.txt`.
    *Success:* 0 high/critical CVEs.

### 1.5 Asset preflight
20. 🖥️ **[T-24h] PWA manifest valid** — `curl https://meok.ai/manifest.webmanifest | jq .`.
    *Success:* all required fields present (name, short_name, icons, start_url).
21. 🖥️ **[T-24h] Service worker deployed** — `curl https://meok.ai/sw.js`.
    *Success:* HTTP 200, `application/javascript` content-type.
22. 🖥️ **[T-24h] All 9 PWA icons served** — verify `192, 512, apple-touch, favicon, maskable`.
    *Success:* every icon returns HTTP 200.
23. 🖥️ **[T-24h] Sitemap.xml valid** — `xmllint --noout https://meok.ai/sitemap.xml`.
    *Success:* 129 URLs (1 home + 128 pages), no XML errors.
24. 🖥️ **[T-24h] robots.txt allows AI crawlers** — `curl https://meok.ai/robots.txt`.
    *Success:* GPTBot, Claude, Perplexity, CCBot allowed.

---

## 2. PRE-LAUNCH — T-12h (Fri 3 Jul 21:00 BST)

### 2.1 Staging deploy
25. 🖥️ **[T-12h] Deploy to staging** — `vercel deploy --target=staging`.
    *Success:* preview URL returns 200 on `/` and `/api/backend/status`.
26. 🔧 **[T-12h] Smoke run** — `bash smoke.sh` (5/5 live flows pass).
    *Success:* 5/5 flows green, 0 errors.
27. 🔧 **[T-12h] Avatar endpoint soak** — 100 random ichar avatar requests in < 5s.
    *Success:* p99 < 50ms, 0 errors.
28. 🟢 **[T-12h] Load test 1k RPS** — `k6 run loadtest.js --vus 50 --duration 60s`.
    *Success:* p99 < 800ms, 0 5xx.

### 2.2 External comms staged
29. 📣 **[T-12h] Press release drafted** — `DAY30_PRESS_RELEASE_2026-07-04.md` finalised.
    *Success:* signed off by Nick.
30. 📣 **[T-12h] LinkedIn post queued** — scheduled for 09:00 BST 4 Jul.
    *Success:* post visible in LinkedIn scheduler.
31. 📣 **[T-12h] Twitter/X thread queued** — 7-tweet thread, 09:00 BST.
    *Success:* thread visible in scheduler.
32. 📣 **[T-12h] Email blast ready** — `csoai-newsletter` audience, 09:00 BST.
    *Success:* email validated, audience size > 100.

---

## 3. PRE-LAUNCH — T-6h (Sat 4 Jul 03:00 BST)

### 3.1 Production build
33. 🖥️ **[T-6h] Production build** — `cd meok-deploy && npm ci && npm run build`.
    *Success:* `.next/` built, 0 errors.
34. 🖥️ **[T-6h] All 128 SSG pages prerendered** — `cat .next/server/pages-manifest.json | jq`.
    *Success:* 128+ page entries.
35. 🖥️ **[T-6h] Lighthouse CI run** — `lhci autorun --config=lighthouserc.json`.
    *Success:* Performance ≥90, A11y ≥95, SEO ≥95.

### 3.2 Multi-region verified
36. 🖥️ **[T-6h] lhr1 ping** — `curl -w "%{time_total}\n" -o /dev/null https://meok.ai/`.
    *Success:* p99 < 200ms.
37. 🖥️ **[T-6h] fra1 ping** — same from Frankfurt VPN.
    *Success:* p99 < 200ms.
38. 🖥️ **[T-6h] iad1 ping** — same from US East VPN.
    *Success:* p99 < 250ms.

---

## 4. PRE-LAUNCH — T-1h (Sat 4 Jul 08:00 BST)

### 4.1 Final readiness checks
39. 🔧 **[T-1h] Backend health** — `curl https://api.meok.ai/api/healthz`.
    *Success:* `{"ok":true,"ts":"..."}`.
40. 🔧 **[T-1h] SOV3 substrate health** — `mcp_sov3_federation_get_system_status`.
    *Success:* all subsystems green.
41. 🔧 **[T-1h] DORADO real-time monitor** — `mcp_sov3_federation_sov_dorado_horus_realtime`.
    *Success:* no active alerts ≥ warning.
42. 🔏 **[T-1h] SIGIL chain sealed** — capture last 100 sigils, verify hash chain.
    *Success:* `verify_chain` returns `{"ok":true}`.
43. 🟢 **[T-1h] On-call rotated on** — confirm pager handoff done.
    *Success:* both operators acknowledge in #oncall channel.

### 4.2 Stress / chaos
44. 🔧 **[T-1h] Backend SIGIL write soak** — 1000 writes/sec for 60s.
    *Success:* 0 lost writes, chain head valid.
45. 🖥️ **[T-1h] CDN cache hit ratio** — sample 1000 GETs on static assets.
    *Success:* ≥ 95% hit ratio.

---

## 5. PRE-LAUNCH — T-30min (Sat 4 Jul 08:30 BST)

46. 🟢 **[T-30min] All-hands roll call** — confirm owner, backend, frontend, on-call online.
    *Success:* 4/4 green in launch channel.
47. 🔧 **[T-30min] Page status check** — `curl -s https://meok.ai | head -50`.
    *Success:* valid HTML, "MEOK WORLD" in `<title>`.
48. 🖥️ **[T-30min] Avatar endpoint sample** — load 5 random ichar avatars.
    *Success:* all 5 return 200, all SVGs valid.

---

## 6. PRE-LAUNCH — T-15min (Sat 4 Jul 08:45 BST)

49. 🟢 **[T-15min] Final security review** — confirm no secrets in git diff vs last tag.
    *Success:* `git diff meok-launch-v1.0..HEAD | grep -E 'API_KEY|SECRET|TOKEN'` returns 0 matches.
50. 📣 **[T-15min] Comms armed** — press release + LinkedIn + Twitter + email queued, scheduler live.
    *Success:* all 4 channels visible in scheduler.

---

## 7. PRE-LAUNCH — T-5min (Sat 4 Jul 08:55 BST)

51. 🟢 **[T-5min] Last screenshot** — `k25_vision screenshot meok.ai`.
    *Success:* page renders, no layout shift > 0.1.
52. 🖥️ **[T-5min] SW cache warm** — visit all 128 pages, confirm cache populated.
    *Success:* SW `caches.open('meok-v1').then(c => c.keys()).then(ks => ks.length)` ≥ 130.
53. 🔧 **[T-5min] i-character demo ready** — 13 demo ichars alive, each can answer one question.
    *Success:* all 13 respond in < 2s.

---

## 8. PRE-LAUNCH — T-0 (Sat 4 Jul 09:00 BST)

54. 🟢 **[T-0] "GO" called by Owner** — written acknowledgement in #launch.
    *Success:* "GO" appears in launch log.
55. 🖥️ **[T-0] DNS flip** — A record `meok.ai` → Vercel production IP.
    *Success:* `dig meok.ai +short` returns new IP.
56. 🔧 **[T-0] Backend cutover** — `/api/*` rewrites live to `meok-backend.run.app`.
    *Success:* `curl https://meok.ai/api/healthz` → 200.

---

## 9. LAUNCH SEQUENCE — T+0 to T+30min

57. 📣 **[T+1min] Press release fires** — MEOK world announcement goes live.
    *Success:* PR visible on csoai.org/press/meok-world-launch.
58. 📣 **[T+1min] LinkedIn post fires** — owner profile, 09:00 BST exactly.
    *Success:* post timestamp = 09:00:00 BST.
59. 📣 **[T+2min] Twitter/X thread fires** — 7-tweet thread with `meok.ai` link.
    *Success:* thread visible, first tweet < 3 min after launch.
60. 📣 **[T+3min] Email blast fires** — `csoai-newsletter` audience.
    *Success:* SendGrid returns 202, open rate ≥ 25% within 24h.
61. 🔧 **[T+5min] Avatar endpoint soak** — verify i-char avatars respond < 100ms p95.
    *Success:* 100 random avatars, p95 < 100ms.
62. 👑 **[T+5min] King hive announces launch** — emit SIGIL `L|launch|meok-world|T+5min`.
    *Success:* sigil appears in chain.
63. 🔏 **[T+10min] First 100 user SIGILs** — write a chain snapshot every 10 min for 24h.
    *Success:* SIGIL append rate > 0, < 1k writes/sec.
64. 🔧 **[T+15min] Auto-scaling verified** — backend VM scale-up triggers at > 70% CPU.
    *Success:* at least one scale-up event captured if traffic > 1k RPS.
65. 📟 **[T+30min] On-call confirms green** — no critical alerts in past 30 min.
    *Success:* `mcp_sov3_federation_get_active_alerts` returns 0 critical.

---

## 10. POST-LAUNCH — T+1h (Sat 4 Jul 10:00 BST)

66. 🔧 **[T+1h] Latency review** — p50/p95/p99 from Cloudflare/Vercel analytics.
    *Success:* p95 < 500ms.
67. 🔧 **[T+1h] Error budget** — 4xx/5xx ratio over last hour.
    *Success:* 5xx < 0.1%.
68. 👑 **[T+1h] Council deliberation log** — 13-Queen + King council wrote ≥ 1 sigil each.
    *Success:* 13/13 queen sigils + 1 king sigil = 14 new entries.
69. 🔧 **[T+1h] 100 unique users** — count unique sigils tied to user actions.
    *Success:* ≥ 100 distinct `actor` strings.

---

## 11. POST-LAUNCH — T+6h (Sat 4 Jul 15:00 BST)

70. 🔧 **[T+6h] DDoS posture review** — DORADO bot-detector report.
    *Success:* ≥ 95% traffic flagged HUMAN, < 5% suspicious.
71. 📣 **[T+6h] First social replies** — respond to all tagged replies within 6h.
    *Success:* 100% reply SLA.
72. 🔧 **[T+6h] DB growth check** — ichars.db size, users.db size.
    *Success:* both DBs < 100 MB.
73. 🔧 **[T+6h] i-character emergence funnels** — new i-char creates vs expected.
    *Success:* ≥ 50 new i-chars created.

---

## 12. POST-LAUNCH — T+24h (Sun 5 Jul 09:00 BST)

74. 🟢 **[T+24h] Owner review** — pull-to-refresh on dashboard, sanity check.
    *Success:* dashboard `meok-empire` green, all 33 districts happy.
75. 🔧 **[T+24h] SLO report** — uptime, latency, error rate.
    *Success:* uptime ≥ 99.9%, latency p95 < 500ms, errors < 0.1%.
76. 📣 **[T+24h] Launch retro scheduled** — 90-min retro with all stakeholders.
    *Success:* retro on calendar, agenda circulated.
77. 🔧 **[T+24h] PWA install funnel** — captures from `beforeinstallprompt`.
    *Success:* ≥ 50 installs recorded.
78. 🔧 **[T+24h] Mobile Lighthouse** — Lighthouse on iPhone SE viewport.
    *Success:* Performance ≥ 85.
79. 🔧 **[T+24h] SIGIL chain integrity** — full chain replay from genesis.
    *Success:* `verify_chain` returns `{"ok":true,"length":<expected>}`.
80. 🟢 **[T+24h] Public commend** — sign-off post on LinkedIn thanking team.
    *Success:* post published, tags all contributors.

---

## 13. POST-LAUNCH — T+7d (Sat 11 Jul 09:00 BST)

81. 🔧 **[T+7d] Weekly retrospective** — what worked, what didn't, iterate.
    *Success:* retro doc written, 10+ actionable items logged.
82. 🔧 **[T+7d] Scaling plan update** — adjust auto-scaling thresholds based on real load.
    *Success:* plan committed to repo.
83. 📣 **[T+7d] Press roundup** — collate all media mentions into one report.
    *Success:* `LAUNCH_PRESS_ROUNDUP_WEEK_1.md` written.
84. 🔧 **[T+7d] i-character engagement** — DAU/MAU split, archetype distribution.
    *Success:* analytics dashboard updated.
85. 🟢 **[T+7d] Roadmap v2 published** — based on user feedback.
    *Success:* `ROADMAP_V2.md` published on csoai.org.

---

## 14. EMERGENCY ROLLBACK

If any of these occur, **Owner triggers ROLLBACK** (command in `#emergency`):

- ❌ p99 latency > 5s sustained 5 min
- ❌ 5xx error rate > 5% sustained 2 min
- ❌ Security incident (RCE, data breach)
- ❌ SIGIL chain integrity broken

**Rollback steps (target < 5 min):**
1. 🟢 Page all-hands, declare SEV1.
2. 🖥️ `vercel rollback --yes` — Vercel re-points to last good deploy.
3. 🔧 `meok-backend rollback` — Fly.io reverts to prior release.
4. 🔏 Emit SEV1 SIGIL — `L|rollback|emergency|T+0`.
5. 📣 Status update at T+5min in #launch.
6. 📟 Owner signs off `RESOLVED` after p95 < 500ms for 15 min.

---

## 15. SUCCESS DEFINITION

**We are LIVE when:**
- ✅ All 128 pages return HTTP 200 from lhr1, fra1, iad1.
- ✅ Avatar endpoint responds < 100ms p95 for 100 random ichars.
- ✅ 100+ unique users within T+1h.
- ✅ 13/13 Queens + King emitted ≥ 1 SIGIL each.
- ✅ 0 SEV1 incidents in 24h.
- ✅ Press release, LinkedIn, Twitter, email all fired on schedule.
- ✅ Owner signs the **LAUNCH CERT** in `clawd/LAUNCH_CERT.md`.

---

## 16. DEPENDENCIES

| Tool | Used for | Where |
|---|---|---|
| `mcp_sov3_federation_*` | SOV3 substrate ops | SOV3 MCP bridge |
| `mcp_meok_king_*` | King hive / 28 queens | King MCP |
| `git` | Code freeze | `~/clawd/.git` |
| `pytest` | Backend tests | `meok-backend/.venv/bin/pytest` |
| `next build` | Production frontend | `meok-deploy/` |
| `vercel` | Deploy | `npx vercel` |
| `curl` / `k6` / `lhci` | Smoke + load | `~/clawd/scripts/` |
| `LinkedIn API` | Posts | owner credentials |
| `Twitter/X API` | Posts | owner credentials |
| `SendGrid` | Email | `csoai-newsletter` audience |

---

## 17. CONTACTS

- **Owner (Nick):** nick@csoai.org · +44 7700 900123
- **On-call rotation:** see `clawd/ONCALL_SCHEDULE_2026_07.md`
- **Escalation:** Owner → CTO → Board (in that order, max 30 min per step)

---

**END OF CHECKLIST — 85 items · 4 days · 1 empire · 1 mission.**

Signed: 🜏 Sovereign Orchestrator · SOV3 v2.0.0 · 29 June 2026 15:37 BST