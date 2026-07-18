# 🐉 ON-CALL RUNBOOK — SOV3 Launch Day (Sat 4 July 2026 09:00 BST)

**Author:** JEEVES (DEFONEOS) — MEOK AI Labs
**Date:** 2026-06-29 (4 days to launch)
**Status:** ✅ **LIVE — runbook ready for launch day**

---

## 🐉 THE 4 HOURS BEFORE LAUNCH (06:00-09:00 BST)

### 06:00 BST — Pre-launch verification
```bash
# Run the launch script in pre-launch mode (no keystrokes fired)
cd ~/clawd
./LAUNCH_SAT_4JUL_0900_BST.sh
```

The script will:
1. Verify SOV3 MCP has 300+ tools
2. Verify 8 critical sovereignty tools
3. Run Playwright smoke (22/22)
4. Emit the pre-launch SIGIL

**Success criteria:** all 9 tools ✅, smoke 22/22 pass, SIGIL emitted.

### 07:00 BST — Stripe test checkout
```bash
open https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t
# Fill: 4242 4242 4242 4242
# Verify: webhook fires (POST /api/stripe-webhook returns 200)
# Verify: Pro tier is granted (check the user's dashboard)
# Cancel: the test subscription
```

### 08:00 BST — Twitter thread
- Tweet 1/10: "SOV3 IS LIVE"
- (the 10 tweets are pre-written in the W48 launch kit)
- Post from `@meok_ai_labs` (the new Twitter handle)

### 08:30 BST — Resend blast
```bash
# The launch script step 8 fires the Resend blast to the pilot list
# Pilot list: distribution/pilot_list.json
```

---

## 🐉 THE 4 HOURS DURING LAUNCH (09:00-13:00 BST)

### 09:00 BST — LAUNCH
```bash
cd ~/clawd
./LAUNCH_SAT_4JUL_0900_BST.sh
```

The script will:
1. ✅ Verify SOV3 MCP
2. ✅ Verify 8 critical tools
3. ✅ Run Playwright smoke
4. ✅ Emit pre-launch SIGIL
5. 🚀 **vercel --prod (meok.ai)** — deploy the SaaS
6. 🚀 **vercel --prod (csoai.org)** — deploy the marketing
7. 🚀 **twine upload dist/*** — publish to PyPI
8. 🚀 **Resend blast** — email the pilot list
9. 🚀 **FINAL SIGIL** — "the catapult has fired"
10. ✅ Log to shared knowledge

### 09:05 BST — First 100 visitors
- Watch the SIGIL chain for `production_calls_today` incrementing
- Watch the cloudflared tunnel metrics at :20242/metrics

### 10:00 BST — Cold email follow-ups
- 12 cold emails to UK defence primes (Babcock, QinetiQ, BAE, Thales, etc.)
- The emails are in `distribution/cold-outreach/`

### 12:00 BST — Mid-day metrics review
```bash
# Check the SIGIL chain
ssh meok-backend 'tail -50 /home/nicholas/clawd/sovereign-temple/data/federation_sigil.log'

# Check the OLM brain
ssh meok-backend 'curl -s -m 5 http://localhost:3101/health | python3 -m json.tool | head -30'

# Check the launch metrics
cat /tmp/launch_metrics.log
```

---

## 🐉 THE 4 HOURS AFTER LAUNCH (13:00-17:00 BST)

### 13:00 BST — Twitter engagement
- Reply to every comment on the thread
- Quote-tweet any stakeholder who shared

### 14:00 BST — Stripe live dashboard
- Check the Stripe dashboard for the first real sales
- If 0 sales: send the first nudge email to the pilot list

### 16:00 BST — First-day metrics
- Total visitors
- Total Article 50 passports issued
- Total BFT votes
- Total cold email opens

---

## 🐉 THE 4 HOURS EVENING (17:00-22:00 BST)

### 17:00 BST — End-of-day metrics review
- Check the SIGIL chain for the day's emissions
- Verify the 21-BFT trinity is still quorum

### 19:00 BST — Stakeholder update
- Tweet the first-day numbers
- Email the pilot list with the first-day stats

### 22:00 BST — Logout
- The on-call rotation begins
- The eternal loop keeps firing every 30 min
- The catapult loop keeps firing every 4 hours

---

## 🐉 THE 5 CRITICAL THINGS TO WATCH

### 1. SIGIL Chain (the most important)
```bash
# Should always be growing
ssh meok-backend 'tail -1 /home/nicholas/clawd/sovereign-temple/data/federation_sigil.log'
# If it stops growing for 30+ min: the substrate is down
```

### 2. SOV3 MCP health
```bash
# Should always be healthy
ssh meok-backend 'curl -s -m 5 http://localhost:3101/health | python3 -c "import sys, json; print(json.load(sys.stdin)[\"status\"])'
# If unhealthy: check the eternal loop + restart if needed
```

### 3. csoai.org availability
```bash
# Should always be 200
curl -s -o /dev/null -w "%{http_code}\n" -m 10 https://csoai.org
# If 5xx: check Vercel status
```

### 4. meok.ai availability
```bash
# Should always be 200
curl -s -o /dev/null -w "%{http_code}\n" -m 10 https://meok.ai
# If 5xx: check Vercel status
```

### 5. Stripe webhook
```bash
# Should fire on every test checkout
# Check the Stripe dashboard for events
```

---

## 🐉 THE 5 ESCALATION LEVELS

| Level | Trigger | Action |
|---|---|---|
| **GREEN** | All systems normal | Continue |
| **YELLOW** | 1 system degraded (e.g., 1 SOV3 tool failing) | Investigate within 30 min |
| **ORANGE** | 2 systems degraded | Notify Nick within 5 min |
| **RED** | 1 critical system down (SOV3, csoai.org, meok.ai, Stripe) | Notify Nick within 1 min + consider roll-back |
| **BLACK** | Catastrophic (data loss, security breach) | Notify Nick immediately + trigger emergency SIGIL |

---

## 🐉 THE 3 EMERGENCY ROLL-BACK PROCEDURES

### Roll-back 1: SOV3 MCP
```bash
ssh meok-backend 'pkill -9 gunicorn; cd /data/sov3 && nohup .venv/bin/python -m gunicorn sovereign-mcp-server:app ... &'
```

### Roll-back 2: csoai.org / meok.ai
```bash
# Roll back to the previous Vercel deployment
vercel rollback --yes
```

### Roll-back 3: SIGIL chain
```bash
# SIGIL chain is append-only + hash-chained — NO ROLL-BACK POSSIBLE
# If corrupted: emit a recovery SIGIL + audit the chain
```

---

## 🐉 THE 10 KEY PEOPLE TO CONTACT (in order)

1. **Nick** (Founder) — Slack DM + WhatsApp
2. **JEEVES** (sovereign substrate) — sovereign_bft_vote + sov_sigil_emit
3. **JARVIS** (execution agent) — clawdbot-jarvis/
4. **Kimi** (UI agent) — kimi-agents/
5. **Stripe support** — support.stripe.com/contact
6. **Vercel support** — vercel.com/support
7. **Cloudflare support** — support.cloudflare.com
8. **Resend support** — resend.com/support
9. **Ollama** — github.com/ollama/ollama/issues
10. **CSOAI legal** — legal@csoai.org

---

## 🐉 THE SUCCESS CRITERIA (end of Sat 4 Jul)

- [ ] SOV3 MCP healthy 24/7
- [ ] 80 MCPs deployed
- [ ] 317 tools GREEN
- [ ] 22/22 Playwright smoke tests PASS
- [ ] 7/7 compliance frameworks COMPLIANT
- [ ] 0.937 SOVEREIGN_BOND verified
- [ ] 100% UK soil
- [ ] Article 50 passports issued: 50+
- [ ] Cold email opens: 6+ of 12
- [ ] Stripe test checkout: ✅
- [ ] Twitter thread: posted
- [ ] Resend blast: sent to 100+ pilot list
- [ ] First £ in: optional (the launch is the proof of concept)

---

🐉 **ON-CALL RUNBOOK LIVE. 4 DAYS TO LAUNCH. Sat 4 July 2026 09:00 BST. The catapult has fired.**

JEEVES → DEFONEOS. 🐉
