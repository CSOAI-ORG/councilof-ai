# ⚡ THE 40-MINUTE GATE — exact runbook (keyholder only · 2026-06-25)
Every step here needs a live credential / DNS / send → **only the keyholder runs these.** M4 has staged everything else. Do them top to bottom; first £ is live at the end.

## 0. Ratify Pro price (2 min — decide, then tell M4)
Pick ONE: **£99** (recommended — already live on proofof) / £79 / £199.
→ Tell M4 the number; M4 propagates it to source-of-truth + both outreach drafts + (PR) the sites. **Don't send until this is one number.**

## 1. Roll the leaked Stripe key (~10 min)
1. Stripe Dashboard → **Developers → API keys** → on the live `sk_live_…` → **Roll key** → copy the new secret.
2. Vercel → project **meok-attestation-api** → **Settings → Environment Variables** → update `STRIPE_SECRET_KEY` = new value → **Save**.
3. Vercel → **Deployments → Redeploy** (production).
4. Verify: `curl -s https://proofof.ai/api/provision …` returns a key (not 500). Meter is now safe.

## 2. Wire `hello@meok.ai` to send (~10 min)
1. **Resend** dashboard → **Domains → Add** `meok.ai` → it shows SPF / DKIM / DMARC records.
2. **Namecheap** → meok.ai → **Advanced DNS** → add those 3 records (TXT/CNAME as Resend specifies).
3. Back in Resend → **Verify** (DNS can take a few min). Send a test to yourself.

## 3. (Optional, 6 min) Point the 3 sovereign domains
Namecheap → each domain → **Advanced DNS**:
- `sovereign.wiki` → A record `@` → **76.76.21.21** (Vercel) → then Vercel → add domain → redirect to `meok.ai/os`
- `sovereign.mom` → same A → redirect to `meok.ai/guardian`
- `sovereign.moe` → same A → redirect to `csoai.org`

## 4. Fix the proofof checkout (lane — before sends land)
- Replace the **mis-wired shared** Stripe Pro link `buy.stripe.com/…cgAdQS0ZT1Uc8k91t` with a **distinct** Payment Link for the ratified Pro price.
- Swap **"HMAC" → "Ed25519"** on the site.
- Fix the hero countdown (shows **"108 days"**; ~38 days to 2 Aug).

## 5. SEND (the whole game — ~10 min, today)
From `hello@meok.ai`, the 3 freshened drafts in `_inbox/wave4-claude-actionables/12_REVENUE_NOW`:
1. **NIS2 £499** — NL (30-Jun deadline, ~5 days) + DE overdue. **Send first.**
2. **GRC white-label** — 3 consultancies (reply-path, unaffected by checkout).
3. **OneOS** — warm cross-sell to the 7 orgs.
Fill `{name}/{company}`, batch ~20–30, send.

---
**M4 cannot do any of the above** (live keys / DNS / send). M4 *has* done: freshened the drafts, reconciled the pricing, mapped the portfolio (`MULTI_PRODUCT_REVENUE_ACTIVATION_2026-06-25.md`), fixed the medical-MCP bug (PR #25). The instant you pick the Pro number, M4 propagates it everywhere.
