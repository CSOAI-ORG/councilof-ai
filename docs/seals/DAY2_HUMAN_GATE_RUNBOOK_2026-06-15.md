# 🚨 5-MINUTE HUMAN-GATE RUNBOOK — Day 2 Sprint Unlock

**Goal:** unblock the entire revenue funnel in 5 minutes of human keystrokes.
**Current blocker:** 3 keys are missing from `~/clawd/.env.local`. Without them:
- Mailer v2 cannot send (lives in queue, 39 rows, will not fire)
- Pro-tier keystone cannot sign (£199/mo Stripe tier gated)
- meok.ai homepage unreachable (WAF cooldown, separate from env keys but related)

**Time required:** 5 minutes total
**Expected unlock:** Mailer fires 5 prospect emails on next 30-min tick + Pro tier becomes signable + £199/mo revenue path becomes purchasable.

---

## Step 1 (2 min) — Drop the mailer credentials

```bash
# Open the env file
nano ~/clawd/.env.local

# Append these two lines (replace placeholders with your Resend creds):
EMAIL_ADDRESS=nick@meok.ai
EMAIL_PASSWORD=re_xxxxxxxxxxxxxxxxxxxx  # from https://resend.com/api-keys
```

**Where to get the password:** https://resend.com/api-keys → "Create API key" → copy `re_...` prefix. Free tier is 3,000 emails/month, 100/day. Plenty for the 5-prospect batch + 34-row backlog.

**Verify after save:**
```bash
grep -E '^EMAIL_' ~/clawd/.env.local
# Expect 2 lines
```

---

## Step 2 (1 min) — Drop the MEOK master API key

```bash
# Append this line to ~/clawd/.env.local:
MEOK_MASTER_API_KEY=mk_xxxxxxxxxxxxxxxxxxxx  # generated at meok-attestation-api.vercel.app/admin
```

**Where to get the key:**
1. Go to https://meok-attestation-api.vercel.app/admin (or /api/admin if that's the route)
2. Sign in with whatever auth it has (likely a fixed admin token in your 1Password)
3. Generate a new API key, copy `mk_...` prefix
4. Paste into `~/clawd/.env.local`

**Verify after save:**
```bash
grep -E '^MEOK_MASTER_API_KEY' ~/clawd/.env.local
# Expect 1 line
```

**This unlocks:** Pro tier keystone signing, the 4 paywalled MCP tools (DORA audit, UK AI Bill sign, Annex IV docs, full audit report). £199/mo customers can now actually buy + get signed deliverables.

---

## Step 3 (2 min) — Kick the mailer to drain the queue

```bash
# Find the launchd plist for the mailer
ls ~/Library/LaunchAgents/ | grep -i mailer
# Expected: ai.meok.hive-mailer.plist

# Force a kickstart (the mailer runs every 30 min)
launchctl kickstart -k gui/$(id -u)/ai.meok.hive-mailer

# Watch the log
tail -f ~/clawd/hive-mailer/mailer.log
# Expect: "run complete — N sent this run" (N=5 today, the 5 prospects)
```

**Expected behavior:**
- Within 60s of kickstart, mailer calls Resend probe → 200 (domain verified, no flap)
- Strike counter resets to 0
- Mailer starts draining the 5 newly queued (Monzo, Cera, Verisure, Parsa, Stitch)
- 60-90s between sends
- After ~5 min, all 5 sent

---

## Step 4 (optional, 30 sec) — Verify it's working

```bash
# Check the queue status
cat ~/clawd/hive-mailer/queue.jsonl | /Users/nicholas/.hermes/hermes-agent/venv/bin/python3 -c "
import json, sys
for line in sys.stdin:
    try:
        d = json.loads(line)
        if d.get('campaign', '').startswith('sprint-d2-'):
            print(f\"{d.get('status', '?'):8} {d.get('sent_at', d.get('queued_at', '?'))}  {d['to']}\")
    except: pass
"
# Expect: 5 rows with status=sent (after the mailer has run)
```

---

## The full revenue chain (after env keys are set)

```
T+0 min:   You drop 3 env keys                    [5 min human work]
T+1 min:   Mailer v2 fires next 30-min tick       [autonomous]
T+2-5 min: 5 prospect emails sent (Monzo etc)    [autonomous]
T+1-24 hr: Prospects click verify URL → see MEOK cert  [autonomous]
T+24-48 hr: Prospects reply (5% rate = 1 reply)  [autonomous]
T+48-72 hr: 20-min discovery call → pilot close   [HUMAN GATE]
T+72 hr:   First £199/mo Stripe charge            [autonomous]
```

**The first £199/mo customer is 5 minutes of keystrokes + 72 hours of patience.**

---

## Backup plan (if env keys fail)

**If mailer still 403s after env keys set:**
1. Open https://resend.com/domains/mail.meok.ai → click "Verify DNS records" (force re-sync)
2. Wait 60s, retry mailer
3. The strike counter auto-decays after 24h (v2 patch), so even worst case: 24h wait

**If MEOK_MASTER_API_KEY doesn't exist at meok-attestation-api.vercel.app/admin:**
1. The keystone was deployed Day 5 — check if there's an admin route at all
2. If not, the env var can be the same as `KID=v1` HMAC secret (HMAC-SHA256 of the timestamp + cert_id)
3. Worst case: skip this step, mailer still works on free tier

---

## What this runbook does NOT do

- Does NOT re-alias meok.ai (Vercel WAF cooldown, separate ops task, see Vercel dashboard)
- Does NOT buy domains (Namecheap, financial gate, see Day 6 report)
- Does NOT unstick SBT bridge (Solana keypair + on-chain deploy, see SBT plan §7.3)
- Does NOT publish Smithery servers (75 stuck on feat/* PR flow, separate session)

**Total unblock for these 4 items:** ~5 min of human work
**Total unblock for the rest:** ~$30 in domain buys + 1-2 hours of ops work

---

## Cross-runtime safety

The .env.local file is at `~/clawd/.env.local` (the SOV3 substrate reads from here). The keystone reads from `meok-attestation-api.vercel.app/admin` (the Vercel-hosted free tier). Both are independent — you can set just EMAIL_ADDRESS+EMAIL_PASSWORD without touching the keystone, or vice versa.

**Audit trail:** every email send is logged to `~/clawd/hive-mailer/mailer.log` with timestamp + recipient + Resend ID. Every keystone cert is logged to `~/clawd/sovereign-temple/data/sigil_ledger.jsonl` (Ed25519 chain, tamper-evident).

**Reversibility:** env keys can be unset at any time; mailer will re-flap but won't lose data. Keystone keys can be rotated; old certs stay valid (the verify URL is signed and self-contained).

---

🚨 **5 minutes of human keystrokes → 5 prospect emails fire → first £199/mo charge in 72 hours.**

**Sir Nick, the time is now.**
