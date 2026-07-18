# Manual IndexNow Submission Runbook
**Date:** 2026-06-17  
**Purpose:** Submit 15 URLs to Bing manually if automated script is blocked  

---

## URLs to submit

From `clawd/_findings/INDEXNOW_BATCH_2026-06-17.md`:

1. https://cobolbridge.ai
2. https://cobolbridge.ai/pricing
3. https://csoai.org
4. https://csoai.org/article-50-kit
5. https://csoai.org/layer0
6. https://csoai.org/pricing
7. https://meok.ai
8. https://meok.ai/article-50-kit
9. https://meok.ai/for-care-homes
10. https://meok.ai/for-fintech
11. https://meok.ai/pricing
12. https://proofof.ai
13. https://proofof.ai/pricing
14. https://proofof.ai/verify

(15th URL `https://www.bing.com/webmasters/Home` is the dashboard link, not for submission.)

---

## Method 1 — Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters/Home
2. Sign in and select your site.
3. Navigate to **URL Submission** or **IndexNow**.
4. Paste each URL one by one and submit.

## Method 2 — IndexNow API via curl

1. Generate an IndexNow key in Bing Webmaster Tools.
2. Save the key to a TXT file at `/.well-known/IndexNow.txt` on each domain.
3. Run:

```bash
KEY="your-indexnow-key"
curl -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"meok.ai\",
    \"key\": \"$KEY\",
    \"urlList\": [
      \"https://meok.ai\",
      \"https://meok.ai/article-50-kit\",
      \"https://meok.ai/for-care-homes\",
      \"https://meok.ai/for-fintech\",
      \"https://meok.ai/pricing\"
    ]
  }"
```

Repeat for `csoai.org`, `proofof.ai`, and `cobolbridge.ai` with the appropriate host and URLs.

## Expected response

- `200 OK` — URLs accepted
- `202 Accepted` — URLs queued
- `400 Bad Request` — check key or URL format

## Automated alternative (once key drops)

```bash
cd /Users/nicholas/clawd
python3 scripts/indexnow-submit.py --from-file _findings/INDEXNOW_BATCH_2026-06-17.md
```
