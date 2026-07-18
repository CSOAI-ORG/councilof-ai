# 🚨 5-MINUTE HUMAN-GATE RUNBOOK — Day 2 Sprint Unlock
**Date:** 2026-06-15 · **Move 9 of the Day 2 plan** · **Owner:** Sir Nick · **Executor:** Sir Nick (no thinking, no "consider" — just run)

**Goal:** execute the 6 human-gated actions that unlock the first £199/mo customer.

| # | Action | Time (serial) | Time (parallel + 1Password) | Wait for confirm? |
|---|--------|---------------|------------------------------|--------------------|
| 1 | Drop `EMAIL_ADDRESS` + `EMAIL_PASSWORD` into `~/clawd/.env.local` | 2 min | 30 sec | ✅ 30-min mailer tick |
| 2 | Drop `MEOK_MASTER_API_KEY` into `~/clawd/.env.local` | 1 min | 30 sec | ✅ instant (keystone smoke test) |
| 3 | Add IndexNow key file to meok.ai + proofof.ai + csoai.org | 5 min | 2 min | ⏳ **24h Bing crawl** |
| 4 | Fire 1 outbound (Monzo 80% / Cera Care 75% / any 73%+ prospect) | 2 min | 1 min | ⏳ **24-72h reply** |
| 5 | Buy `$6.79` `wowmcp.ai` on Namecheap | 2 min | 1 min | ⏳ **5-30 min DNS prop** |
| 6 | `launchctl load` the 3-4 idle plists | 30 sec | 30 sec | ✅ instant (cron picks up) |
| | **TOTAL** | **~13 min serial** | **~5 min parallel with password manager** | |

> **Time honesty:** 5 minutes is the *parallel* number — assumes you have 1Password/Resend dashboard/MEOK admin/Namecheap/Vercel already open in browser tabs, and you're typing while the .env file is editing. **22 min serial** (the realistic worst case) is if you click each link fresh.

---

## ⏱️ TIME BUDGET (real)

- 3 actions take **30 sec** (file edits, `launchctl load`).
- 2 actions take **1-2 min** (keystone + Namecheap buy).
- 1 action takes **5 min** (3 IndexNow key file uploads, one per domain).
- **24h wait** on 2 of 6 (IndexNow crawl + prospect reply).
- **30-min wait** on 1 of 6 (mailer tick to drain the 34-row backlog).

The 5 minutes buys you **setup**. The **first £199/mo charge** lands at **T+72h** (per Day 6 runbook timeline).

---

## 0. SANITY (10 sec — do this first)

```bash
cd ~/clawd && pwd && grep -c '=' .env.local
```

Expected: `/Users/nicholas/clawd` and a number (currently `2` per DAY2_MORNING_RUNDOWN: 1 comment + `VERCEL_OIDC_TOKEN`).

If different: STOP. Re-read the path. Run from `~/clawd` only.

---

## ACTION 1 — DROP MAILER CREDS (30 sec — 2 min)

**Unlocks:** mailer v2 (`c436c69`) fires the **34-row queue** (25 GRC + 9 NIS2) on next 30-min tick + 5 prospect emails per day.

### 1.1 — Open `.env.local` (5 sec)

```bash
open -e ~/clawd/.env.local
```

### 1.2 — Get the Resend API key from GCP (15 sec)

Open in browser: `https://console.cloud.google.com/security/secret-manager/secret/RESEND_API_KEY/versions/latest?project=meok-498012`

Click **"Show secret value"**. Copy the string (starts with `re_`).

### 1.3 — Get the verified FROM address (0 sec)

The sender is already pinned in code: `Nick Templeman <hello@mail.meok.ai>`. Set `EMAIL_ADDRESS` to exactly that.

### 1.4 — Append two lines (10 sec)

At the **bottom** of the open editor, add:

```
EMAIL_ADDRESS=hello@mail.meok.ai
EMAIL_PASSWORD=re_PASTE_THE_KEY_HERE
```

Save (⌘S). Close editor.

### 1.5 — Verify the drop (5 sec)

```bash
grep -E '^EMAIL_' ~/clawd/.env.local
```

Expected: 2 lines, both with non-empty values after `=`.

✅ **ACTION 1 DONE.**

---

## ACTION 2 — DROP MEOK_MASTER_API_KEY (30 sec — 1 min)

**Unlocks:** Pro-tier keystone signing (£199/mo Stripe tier) + 4 paywalled MCP tools (DORA audit, UK AI Bill sign, Annex IV docs, full audit report).

### 2.1 — Generate the key (15 sec)

Open: `https://meok-attestation-api.vercel.app/admin`

Click **"Generate Master Key"**. Copy the value (long base64 string).

### 2.2 — Append the key (10 sec)

```bash
open -e ~/clawd/.env.local
```

At the **bottom**, add:

```
MEOK_MASTER_API_KEY=paste_the_key_here
```

Save. Close editor.

### 2.3 — Verify (5 sec)

```bash
grep '^MEOK_MASTER_API_KEY' ~/clawd/.env.local | wc -l
```

Expected: `1`. (If `0`, you forgot to save.)

✅ **ACTION 2 DONE.**

---

## ACTION 3 — INDEXNOW KEY FILE ON 3 DOMAINS (2 min — 5 min)

**Unlocks:** 14 marketing URLs (meok.ai, proofof.ai, csoai.org + sub-pages) crawled & indexed by Bing/Copilot/ChatGPT-search. Cuts the 2-4 week Google crawl lag.

⏳ **This action's effect is NOT immediate.** IndexNow triggers a Bing crawl within 24h, not instantly. The action itself is fast; the *outcome* takes 24h.

### 3.1 — Find the existing key (10 sec)

```bash
ls ~/clawd/meok.ai/public/.well-known/ 2>/dev/null
# Or wherever the key is staged. Per MEOK_EAT_PUSH_2026-06-14.md:
# Key file is live at meok.ai/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt
cat ~/clawd/meok.ai/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt 2>/dev/null
```

If the file exists locally, you have the key. If not, generate one at https://www.bing.com/indexnow (free, 30 sec).

### 3.2 — Upload to meok.ai (60 sec)

Open: `https://vercel.com/niks-projects-0a2ef942/meok-ui`

1. Go to the project → **Settings** → **Domains** → `meok.ai`
2. In the static-asset editor (or `git push` if using the meok.ai repo directly):
   - Create: `public/.well-known/<KEY>.txt`
   - Body: the key string (just the key, no HTML wrapping)
3. Commit + push. Vercel auto-deploys.

### 3.3 — Upload to proofof.ai (60 sec)

Same as 3.2 but for `proofof.ai`. Vercel project: search for it in the dashboard (probably `proofof-deploy` or similar).

### 3.4 — Upload to csoai.org (60 sec)

Same as 3.2 but for `csoai.org`. Vercel project: `csoai-platform` or `csoai-org`.

### 3.5 — Verify all 3 reachable (10 sec)

```bash
for d in meok.ai proofof.ai csoai.org; do
  curl -s -o /dev/null -w "$d/.well-known/<KEY>.txt: %{http_code}\n" "https://$d/.well-known/<KEY>.txt"
done
```

Expected: 3 lines, each `200`.

✅ **ACTION 3 DONE.** ⏳ **Wait 24h for Bing crawl to surface 14 URLs.**

---

## ACTION 4 — FIRE 1 OUTBOUND (1 min — 2 min)

**Unlocks:** the actual human-readable path to the first £199/mo customer. The mailer queue has 5 prospects ready (Monzo 80% / Cera Care 75% / Verisure / Parsa / Stitch). Even one of these replied-to = first pilot.

⏳ **This action's effect is NOT immediate.** A reply takes 24-72h. But *firing* the email is instant.

### 4.1 — Pick the prospect (10 sec)

Top 3 by fit-score (per DAY2_5_PROSPECT_EMAILS_2026-06-15.md):

| Rank | Prospect | Fit | Why |
|------|----------|-----|-----|
| 1 | **Monzo** (UK challenger bank) | 80% | UK bank, EU AI Act + DORA + PRA, ahead of 2 Aug 2026 deadline |
| 2 | **Cera Care** (UK care-tech) | 75% | AI-mediated care assessments = HIGH-RISK Annex III |
| 3 | any 73%+ prospect | 73%+ | from `~/clawd/hive-mailer/queue.jsonl` |

### 4.2 — Check the queue is ready (5 sec)

```bash
grep '"status":"queued"' ~/clawd/hive-mailer/queue.jsonl | wc -l
# Expected: 5 (or more, after mailer drains the 34 backlog)
```

### 4.3 — Force the mailer to fire NOW (don't wait for the 30-min tick) (30 sec)

```bash
launchctl kickstart -k gui/$(id -u)/ai.meok.hive-mailer
```

### 4.4 — Watch one email land (60 sec)

```bash
tail -f ~/clawd/hive-mailer/mailer.log
# Expect: "run complete — 1 sent this run" within 60-90s
```

(Or, if the prospect is on the *new* 5-prospect batch added in Day 2, the kickstart will drain 5. Watch the log for the first Monzo/Cera line.)

✅ **ACTION 4 DONE.** ⏳ **Wait 24-72h for reply.**

---

## ACTION 5 — BUY wowmcp.ai ON NAMECHEAP (1 min — 2 min)

**Unlocks:** the `wowmcp.ai` vanity URL (MEOK Gaming product domain). Currently HTTP 000 in the empire audit. Once bought + DNS'd to Vercel, the MEOK Gaming pillar gets a real home.

⏳ **This action's effect is NOT immediate.** DNS propagation takes 5-30 min. Vercel aliasing takes another 5 min. The action *itself* (the purchase click) is fast.

### 5.1 — Open Namecheap (5 sec)

Open in browser: `https://ap.www.namecheap.com/Domains/DomainList`

Login: `nicholastempleman` (per CRITICAL_FIXES_INSTRUCTIONS.md).

### 5.2 — Search for wowmcp.ai (15 sec)

Search bar → `wowmcp.ai` → confirm it's available (it is — per MEOK_EMPIRE_MASTER_AUDIT_2026-06-14.md:145, "Not bought yet").

### 5.3 — Add to cart + checkout (60 sec)

1. Add to cart (1 yr registration).
2. Price: **$6.79** (per MEOK_EMPIRE_MASTER_AUDIT_2026-06-14.md:253, promo code `NEWCOM679` if it still applies).
3. Use existing Namecheap credit / saved card.
4. Confirm purchase.

### 5.4 — (Optional) Point DNS to Vercel (60 sec)

In Namecheap → `wowmcp.ai` → **Advanced DNS**:

```
@ A     76.76.21.21        (Vercel apex)
www CNAME cname.vercel-dns.com.
```

(Only if you also want to *use* the domain right now. The purchase itself is the gate; the alias can wait for Vercel login.)

✅ **ACTION 5 DONE.** ⏳ **Wait 5-30 min for DNS prop, then Vercel alias.**

---

## ACTION 6 — launchctl LOAD THE 3-4 IDLE PLISTS (30 sec)

**Unlocks:** the cron jobs that should be running but aren't (per DAY2_MORNING_RUNDOWN row 5: "22/23 loaded, 3 conversion-critical jobs idle"). Specifically:
- `com.meok.auto-fire-emails` (Mon 09:00 — fires the weekly prospect batch)
- `com.meok.daily-sov3-sigil` (daily 08:00 — already alive, re-confirm)
- `com.meok.weekly-indexnow` (Mon 10:00 — re-pings Bing with the latest URLs)
- `com.meok.status-ping` (daily 09:00 — health check)

### 6.1 — List the plists (5 sec)

```bash
ls ~/Library/LaunchAgents/ | grep -E '(auto-fire-emails|daily-sov3-sigil|weekly-indexnow|status-ping)'
# Expected: 4 plists
```

### 6.2 — See which are loaded vs idle (5 sec)

```bash
launchctl list | grep -E 'meok\.(auto-fire-emails|daily-sov3-sigil|weekly-indexnow|status-ping)'
# Expected: 1-2 loaded, 2-3 with "-" PID (idle)
```

### 6.3 — Load the idle ones (10 sec)

```bash
for plist in com.meok.auto-fire-emails com.meok.daily-sov3-sigil com.meok.weekly-indexnow com.meok.status-ping; do
  launchctl load -w ~/Library/LaunchAgents/${plist}.plist 2>&1 | head -1
done
```

(`-w` = persist across reboots. Idempotent — safe to re-run.)

### 6.4 — Verify all 4 loaded (10 sec)

```bash
launchctl list | grep -E 'meok\.(auto-fire-emails|daily-sov3-sigil|weekly-indexnow|status-ping)' | awk '{print $3, "PID="$1}'
# Expected: 4 lines, all with a non-dash PID
```

✅ **ACTION 6 DONE.**

---

## ✅ VERIFY IT WORKED (post-execution smoke test)

Run all 6 checks. Each should flip from ❌ to ✅.

```bash
echo "=== 1. MAILER CREDS LANDED ==="
grep -E '^EMAIL_' ~/clawd/.env.local
# Expect: 2 lines, both non-empty

echo ""
echo "=== 2. MEOK_MASTER_API_KEY LANDED ==="
grep '^MEOK_MASTER_API_KEY' ~/clawd/.env.local | sed 's/=.*/=<REDACTED>/'
# Expect: 1 line, non-empty value

echo ""
echo "=== 3. INDEXNOW KEY FILE REACHABLE ==="
for d in meok.ai proofof.ai csoai.org; do
  curl -s -o /dev/null -w "$d/.well-known/<KEY>.txt: %{http_code}\n" "https://$d/.well-known/<KEY>.txt"
done
# Expect: 3 lines, all 200

echo ""
echo "=== 4. MAILER FIRES ==="
tail -5 ~/clawd/hive-mailer/mailer.log
# Expect: "run complete — N sent" in last 5 lines
grep '"status":"sent"' ~/clawd/hive-mailer/queue.jsonl | wc -l
# Expect: ≥1 (growing toward 34 as backlog drains)

echo ""
echo "=== 5. wowmcp.ai BOUGHT ==="
whois wowmcp.ai 2>/dev/null | grep -E 'Registrar|Creation' | head -2
# Expect: Namecheap + creation date = 2026-06-15 (or 2026-06-14)

echo ""
echo "=== 6. LAUNCHD PLISTS LOADED ==="
launchctl list | grep -E 'meok\.(auto-fire-emails|daily-sov3-sigil|weekly-indexnow|status-ping)' | awk '{print $3}'
# Expect: 4 lines
```

**If any line is wrong:** re-run the matching action above.

---

## 📊 POST-EXECUTION: THE CONVERSION CHAIN

```
T+0 min:   You finish Action 6 (launchctl load)         [DONE in 5 min]
T+1 min:   Mailer v2 drains 1st prospect (Action 4)      [autonomous, every 30-min tick]
T+30 min:  Mailer drains ~5 of 34-row backlog            [autonomous]
T+24 h:    IndexNow → Bing has crawled the 14 URLs       [autonomous, Action 3 outcome]
T+24-72 h: Prospect replies to the outbound              [HUMAN GATE: read + reply]
T+48-72 h: 20-min discovery call → pilot close           [HUMAN GATE: schedule + close]
T+72 h:    First £199/mo Stripe charge                    [autonomous, once keystone signs Pro]
```

**The 5 minutes buys you setup.** The **first £199/mo charge** lands at **T+72h**.

---

## 🛑 RED LINES (do not cross during this runbook)

- **Do NOT** `vercel deploy --prod --force` from the CLI (per AGENTS.md — re-triggers WAF block). The Vercel redeploy is the dashboard button ONLY (a separate gate, not part of this runbook).
- **Do NOT** publish to PyPI (`twine upload`). The 3 Python wheels are built; publish is a separate ops step.
- **Do NOT** touch the Solana keypair or flip `SBT_MOCK_MODE=false`. That's a 1-2 day bugfix track (see SBT_WIRING_PLAN_2026-06-15.md §7.3).
- **Do NOT** spend more than $10 on domains. The $6.79 wowmcp.ai is the only buy.
- **Do NOT** `git push --force` on meok.ai / proofof.ai / csoai.org (would clobber the IndexNow key file).

---

## 🔑 REVERSIBILITY + AUDIT TRAIL

| Action | Reversible? | Audit trail |
|--------|-------------|-------------|
| 1. Mailer creds | Yes — unset vars, mailer flaps but doesn't lose data | `~/clawd/hive-mailer/mailer.log` (every send: timestamp + recipient + Resend ID) |
| 2. MEOK_MASTER_API_KEY | Yes — rotate key, old certs stay valid (signed + self-contained) | `~/clawd/sovereign-temple/data/sigil_ledger.jsonl` (Ed25519 chain) |
| 3. IndexNow key file | Yes — delete file from `public/.well-known/` | Vercel deploy log + `~/clawd/meok.ai/indexnow_30urls_2026-06-14.json` |
| 4. Outbound email | One-way (the email is sent) | `~/clawd/hive-mailer/mailer.log` |
| 5. wowmcp.ai buy | No (refund via Namecheap support, slow) | WHOIS record + Namecheap order history |
| 6. launchctl load | Yes — `launchctl unload -w <plist>` | `launchctl list` output |

---

## 📋 POST THESE 6 LINES IN THE M2 CHANNEL

```
ACTION 1 ✅  EMAIL_ADDRESS + EMAIL_PASSWORD dropped, mailer test send OK
ACTION 2 ✅  MEOK_MASTER_API_KEY dropped, keystone Pro sign OK
ACTION 3 ✅  IndexNow key file on meok.ai + proofof.ai + csoai.org, 24h wait
ACTION 4 ✅  Outbound fired to Monzo/Cera, 24-72h wait
ACTION 5 ✅  wowmcp.ai bought on Namecheap ($6.79), DNS prop in 5-30 min
ACTION 6 ✅  4 launchd plists loaded, cron jobs active
TOTAL:    First £199/mo customer unblocked. T+72h to first charge.
```

---

*Runbook generated 2026-06-15. Move 9 of Day 2 plan. Owner: Sir Nick. Executor: Sir Nick. Time-to-execute: 5 min parallel / 22 min serial.*
