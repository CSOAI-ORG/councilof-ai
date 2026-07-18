# IndexNow Submission Batch — 2026-06-17
**Agent:** JEEVES  
**Status:** Payload ready; requires Bing Webmaster IndexNow key

---

## URLs to Submit (14)

### meok.ai
1. https://meok.ai/
2. https://meok.ai/pricing
3. https://meok.ai/article-50-kit
4. https://meok.ai/for-fintech
5. https://meok.ai/for-care-homes

### csoai.org
6. https://csoai.org/
7. https://csoai.org/pricing
8. https://csoai.org/article-50-kit
9. https://csoai.org/layer0

### proofof.ai
10. https://proofof.ai/
11. https://proofof.ai/verify
12. https://proofof.ai/pricing

### cobolbridge.ai
13. https://cobolbridge.ai/
14. https://cobolbridge.ai/pricing

---

## Required Setup

1. Go to https://www.bing.com/webmasters/Home
2. Generate an IndexNow key (e.g., `abc123def456`)
3. Serve the key at `/.well-known/IndexNow.txt` on each domain:
   ```
   abc123def456
   ```
4. Add the key to `~/clawd/.env.local`:
   ```bash
   BING_INDEXNOW_KEY="abc123def456"
   ```

## Submission Command

```bash
cd ~/clawd
python3 scripts/indexnow-submit.py \
  --key "$BING_INDEXNOW_KEY" \
  --urls _findings/INDEXNOW_BATCH_2026-06-17.md
```

If `scripts/indexnow-submit.py` does not exist, I will generate it on demand.

---

*Payload ready. Key required: BING_INDEXNOW_KEY.*
