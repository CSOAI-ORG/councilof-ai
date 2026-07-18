# Google Search Console + Bing Webmaster + IndexNow — Final Instructions

**Why this matters:** without these submissions, Google takes ~14-30 days to find your sitemap on its own. With them, Google indexes within 2-4 days.

---

## ✓ IndexNow — DONE autonomously this session

**IndexNow key generated and saved to `/public/`:**

```
a83997e3e187a1cc5931a100e14a9f8a42ed6153357cd63deff8be92a142f755
```

**Will be live at:** https://meok.ai/a83997e3e187a1cc5931a100e14a9f8a42ed6153357cd63deff8be92a142f755.txt after next deploy completes.

**To push 30+ URLs to Bing/Yandex now (run from any terminal):**

```bash
KEY="a83997e3e187a1cc5931a100e14a9f8a42ed6153357cd63deff8be92a142f755"
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "host": "meok.ai",
  "key": "$KEY",
  "keyLocation": "https://meok.ai/$KEY.txt",
  "urlList": [
    "https://meok.ai/",
    "https://meok.ai/scorecard",
    "https://meok.ai/fine-calculator",
    "https://meok.ai/tools",
    "https://meok.ai/audit-prep-bundle",
    "https://meok.ai/article-50-kit",
    "https://meok.ai/nis2-de-kit",
    "https://meok.ai/transparency",
    "https://meok.ai/bias-detection",
    "https://meok.ai/dora",
    "https://meok.ai/newsletter",
    "https://meok.ai/partners",
    "https://meok.ai/case-studies",
    "https://meok.ai/eu-ai-act",
    "https://meok.ai/eu-ai-act/article-4",
    "https://meok.ai/eu-ai-act/article-5",
    "https://meok.ai/eu-ai-act/article-9",
    "https://meok.ai/eu-ai-act/article-10",
    "https://meok.ai/eu-ai-act/article-13",
    "https://meok.ai/eu-ai-act/article-14",
    "https://meok.ai/eu-ai-act/article-15",
    "https://meok.ai/eu-ai-act/article-26",
    "https://meok.ai/eu-ai-act/article-43",
    "https://meok.ai/eu-ai-act/article-50",
    "https://meok.ai/eu-ai-act/article-72",
    "https://meok.ai/eu-ai-act/article-99",
    "https://meok.ai/eu-ai-act-for-fintech",
    "https://meok.ai/eu-ai-act-for-hr-tech",
    "https://meok.ai/eu-ai-act-for-healthcare",
    "https://meok.ai/eu-ai-act-for-edtech",
    "https://meok.ai/eu-ai-act-for-legal-tech",
    "https://meok.ai/eu-ai-act-for-saas",
    "https://meok.ai/eu-ai-act-for-ai-startups",
    "https://meok.ai/vs-vanta",
    "https://meok.ai/vs-drata",
    "https://meok.ai/vs-sprinto",
    "https://meok.ai/vs-auditboard",
    "https://meok.ai/vs-servicenow-grc",
    "https://meok.ai/vs-onetrust",
    "https://meok.ai/blog/digital-omnibus-delay-2026",
    "https://meok.ai/blog/article-50-watermarking-guide",
    "https://meok.ai/blog/nis2-germany-deadline-2026"
  ]
}
EOF
```

Returns 200 / 202 on success. Bing + Yandex will crawl the listed URLs within 24-72 hours.

---

## Google Search Console — manual (3 min)

URL: https://search.google.com/search-console

1. **Verify ownership** of meok.ai (you should already have this from earlier setup; if not — choose DNS verification, paste the TXT record into Namecheap)
2. Left sidebar → **Sitemaps** → **Add a new sitemap** → enter `sitemap.xml` (path only) → Submit
3. Status will show **"Couldn't fetch"** for ~5-30 min → then **"Success"** with URL count
4. Optional URL Inspection: In the search bar at the top, paste each top-priority URL (limit 10/day):
   - https://meok.ai/scorecard
   - https://meok.ai/fine-calculator
   - https://meok.ai/tools
   - https://meok.ai/audit-prep-bundle
   - https://meok.ai/article-50-kit
   - https://meok.ai/eu-ai-act/article-50
   - https://meok.ai/dora
   - https://meok.ai/newsletter
   - https://meok.ai/partners
   - https://meok.ai/eu-ai-act-for-ai-startups

   For each: click **"Request Indexing"** → wait 30s → "URL is on Google" within 24h

---

## Bing Webmaster Tools — manual (2 min)

URL: https://www.bing.com/webmasters

1. Sign in (Microsoft account)
2. **Add a site** → enter `https://meok.ai`
3. **Verify** → choose "Import from Google Search Console" if you've done GSC verification (saves a step) OR DNS verification
4. **Sitemaps** → enter `https://meok.ai/sitemap.xml` → Submit
5. Bing also feeds DuckDuckGo, Yandex (alongside IndexNow), and ChatGPT search index

---

## Verification checklist (do after all 3 above)

- [ ] GSC: site verified, sitemap submitted, status "Success"
- [ ] Bing: site verified, sitemap submitted
- [ ] IndexNow: ~~key file live at meok.ai/{key}.txt~~ → **DONE in this deploy**
- [ ] IndexNow: API push run with 30+ URLs (curl above)

---

## Expected outcomes

| Channel | Time to first crawl | Time to first ranked impression |
|---|---|---|
| GSC sitemap submission | 1-3 days | 5-30 days |
| Bing sitemap submission | 1-2 days | 3-14 days |
| IndexNow push | 4-72 hours | 7-30 days |
| Perplexity / ChatGPT search | 2-3 weeks after first ranked Google/Bing impression | n/a |

---

## After 7 days — check progress

- [ ] Search "site:meok.ai" in Google — count results (expect 50+)
- [ ] Search "site:meok.ai" in Bing — count results (expect 30+)
- [ ] Search "EU AI Act readiness scorecard" in Perplexity — see if you appear
- [ ] Check GSC → Pages → Indexed count (target: 80+ within 30 days)
