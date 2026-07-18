# GATE CLEARANCE RUNBOOK — sovereign.mom → production
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026 10:36 BST
Author: JEEVES

---

## CAN'T BE DONE BY AI (2FA-gated)

| Gate | Why can't I do it | ETA for you |
|---|---|---|
| GATE 2 Stripe live key | Stripe dashboard requires your 2FA + your bank info | 30 min at keyboard |
| npm 2FA ON | npm requires SMS / authenticator from your phone | 5 min at keyboard |

Everything else (GitHub Pages DNS, sovereign.mom CNAME, build pipeline,
Vercel production, Mcp registry, Stripe TEST keys, Smithery POST) is
automatable and I will do it on next "go".

---

## GATE 1: DNS sovereign.mom (5 min, me)

OWNED. We own sovereign.mom on Namecheap. Currently parked at
192.64.119.146 (Namecheap parking page).

### Step 1: Add the cname entry to the public site
Already done: sovereign.mom is documented in DNS_CLEARANCE.md below.
The actual DNS flip is the 2FA-gated Namecheap step (GATE 1b).

### Step 2: (Future, when you OK the flip)
1. Open Namecheap → domain list → sovereign.mom → manage
2. Advanced DNS → add CNAME:
   `www` → `csoai.github.io` (or your chosen public site)
3. Remove parking A records (192.64.119.146)
4. Wait 5-30 min for propagation


## GATE 2: Stripe live key (30 min, you)

### Step 1: Open https://dashboard.stripe.com/webhooks
### Step 2: Switch to LIVE mode (top-left toggle)
### Step 3: Go to Developers → API keys
### Step 4: Reveal live secret key
### Step 5: Save to ~/.sovereign/keys/stripe_live.key
        chmod 600 ~/.sovereign/keys/stripe_live.key
### Step 6: Run test
        /Users/nicholas/.hermes/hermes-agent/venv/bin/python3.11 -c "
        from stripe import stripe
        s = stripe(api_key=open(os.path.expanduser('~/.sovereign/keys/stripe_live.key')).read().strip())
        print(s.Account.list(limit=1))
        "

## GATE 3: npm 2FA (5 min, you)

### Step 1: Open https://www.npmjs.com/settings/csga_global/profile/auth
### Step 2: Enable 2FA via TOTP or SMS
### Step 3: Confirm with code
### Step 4: Save recovery codes
### Step 5: Verify
        npm login --auth-only
        npm publish --dry-run

## GATE 4: Smithery (5 min, me)

### Verify I'm not duplicating today's bound tooling:
- smithery.ai returns HTTP 200 (live)
- Smithery SDK API path returned 404 — that endpoint signature may have
  changed; let me retry when 2FA on npm is on so I can publish the package

