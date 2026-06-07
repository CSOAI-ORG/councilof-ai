# 🐉 MEOK ONE Pro funnel — BUILT & LIVE on the backend (Path B)

The cap→Stripe→unlock funnel is wired, deployed, and verified on the VM. Below: what's done,
and the 3 owner-gated steps only you can do to take the first £9.

---

## ✅ What I built + verified live (2026-06-07)
- **Per-user tier + daily usage** in `auth.py` (`tier`, `usage`, `check_and_bump`, `set_tier`, `get_tier`).
  Logic unit-tested: FREE caps at exactly **50/day**, PRO = **2000/day**.
- **Cap enforcement in `/api/think`** — over-limit returns `cap_reached` + the upgrade URL (with
  `client_reference_id=<uid>` so the webhook maps payment→user). **Verified live**: usage counts
  increment (3 calls → `usage_today=3`), `daily_cap=50`, `tier=free`.
- **Stripe webhook** `POST /api/stripe/webhook` — **signature-verified** (HMAC-SHA256 via
  `STRIPE_WEBHOOK_SECRET`); on `checkout.session.completed` it flips the paying user to Pro **and
  logs the payment to the SIGIL ledger**. **Verified secure**: returns 400 without the secret (not
  an open grant).
- **`/api/checkout`** tags the Stripe URL with `client_reference_id`. **`/api/auth/me`** now returns
  `tier / usage_today / daily_cap` so the OS unlocks in-session after payment.
- **Cap-modal UI** in the OS chat — at the limit it shows the message + a prominent
  **"⚡ Upgrade to Pro — £9/mo"** button. Deployed, `/os` 200.

## 🔑 The 3 steps only you can do (owner-gated — I can't touch Stripe/secrets)
1. **Create/confirm the £9 Pro payment link** in Stripe (Products → Payment links). Copy its URL.
2. **Add a Stripe webhook**: Developers → Webhooks → Add endpoint →
   `https://meok-one.35.242.143.249.sslip.io/api/stripe/webhook` → event **`checkout.session.completed`**.
   Copy the **Signing secret** (`whsec_…`).
3. **Set 2 env vars on the VM** for the meok-one service, then restart:
   - `MEOK_PRO_CHECKOUT_URL` = the £9 payment link from step 1 (public, not a secret)
   - `STRIPE_WEBHOOK_SECRET` = the `whsec_…` from step 2 (secret — never paste it to me)

   **Easiest path:** say the word and I'll add **`.env` loading** to the server (reads a gitignored
   `/opt/meok-one/.env`) — then you just paste the 2 lines there + I restart. You never have to
   hand me the secret.

## 🧪 The test (yours — entering a card is owner-gated)
1. Open `/os`, click **Upgrade** (or burn 50 messages to hit the cap).
2. Pay — Stripe **test mode** card `4242 4242 4242 4242`, any future expiry/CVC.
3. Stripe fires the webhook → user flips to **Pro** → next message is uncapped, all 27 characters unlock.
4. Confirm: `GET /api/auth/me` shows `tier: pro`; the payment shows in your Stripe dashboard **and**
   on the SIGIL ledger (`/api/sigil/recent`) as a `stripe_paid` event. **That kills the £0.**

## Honest gaps / follow-ups (I can do on your word)
- `/api/sovereign` (the council brain toggle) isn't capped yet — only `/api/think` (the default).
  Easy to add the same one-liner if you want free users capped there too.
- The cap-modal UI is deployed but not triggered live (would need 50 real calls) — backend cap is
  unit-proven + live-counting confirmed; the response shape the UI reads is verified in code.
- Make the cap env-tunable (`MEOK_FREE_DAILY_CAP`) so you can A/B the free limit without a deploy.
