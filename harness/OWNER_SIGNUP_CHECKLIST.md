# OWNER GATE — 15-MINUTE SIGNUP CHECKLIST (free, nicholas@csoai.org)
You do the browser clicks (each takes 1-3 min). I do everything after you paste the key back.
All services free. Use your password manager; DO NOT reuse the shared password (rotate that one first).

## 1. RWA.xyz API key (unlocks the 10 "pending" RWA addresses)
- URL: https://app.rwa.xyz/tools/api  →  sign up with nicholas@csoai.org
- After email verify: click "Generate API Key" (free tier = 3 exports/mo; ask team@rwa.xyz for the early-stage startup discount)
- PASTE BACK: `RWA_XYZ_API_KEY`

## 2. Etherscan API key (unlocks source_verified for BUIDL/BENJI/ACRED)
- URL: https://etherscan.io/register (free) → verify email → https://etherscan.io/myapikey → "+ Add" (free, 5 calls/sec)
- PASTE BACK: `ETHERSCAN_API_KEY`

## 3. GitHub PAT (unlocks API edits instead of the dead MCP token)
- URL: https://github.com/settings/tokens → Generate new (classic) → scopes: `repo`, `workflow` → Generate
- PASTE BACK: `GITHUB_PAT` (I'll use it only for repo API calls; store in vault after)

## 4. Cloudflare secrets (unlocks /api/fulfill + payment provider)
- URL: https://dash.cloudflare.com → councilof-ai project → Settings → Functions/Pages secrets
- Add: `RECEIPT_PUBKEY_HEX` and `STRIPE_SECRET_KEY`
- Where are the values? RECEIPT_PUBKEY_HEX = the pubkey in `public/signed/card_index.json` / `board_living.json`
  (`d4cb0eaa…`). STRIPE_SECRET_KEY = your Stripe test/live key (Stripe dashboard, free).
- PASTE BACK: confirm you set both (don't paste the secret into chat)

## 5. Hugging Face token (unlocks HF dataset publish — the sibling lane has 14+ datasets)
- URL: https://huggingface.co/settings/tokens (free) → New token → read+write
- PASTE BACK: `HF_TOKEN`

## 6. OpenRouter free (optional — sovereign sov family is the free substrate; credits NOT needed)
- URL: https://openrouter.ai/keys → free tier. Only if you want paid-routing fallback.

## 7. Kaggle (already have — ~/.kaggle/kaggle.json works). Nothing needed.

## 8. One ruling (no browser): **ship 150** (the honest verifiable floor). Say the word.

---
### What I execute the moment you paste back keys
1. `ETHERSCAN_API_KEY` → measure `source_verified` for BUIDL/BENJI/ACRED → signed control-facts update.
2. `RWA_XYZ_API_KEY` → resolve the 10 `pending` RWA addresses (cross-check Etherscan/XRPScan) → move cards from `pending` to verified → re-verify (ClaimGuard).
3. `HF_TOKEN` → publish/refresh the measurement datasets + cards on HF `csoai/*`.
4. `GITHUB_PAT` → repo API edits (branches/PRs) per the one-lane doctrine.
5. Cloudflare secrets set → /api/fulfill + payment provider wired.
6. Ruling 150 → board headline fixed.

Paste keys back in one message; I'll execute each gate immediately and report signed results (bytes). No keys → the browser part is genuinely yours, but it's now a 15-min checklist, not "100s of things."
