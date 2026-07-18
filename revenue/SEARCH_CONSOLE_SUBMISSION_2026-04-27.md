# Search Console + AI Crawler Submission — 2026-04-27

**Goal:** Get every revenue page into Google + Bing + ChatGPT-search + Perplexity index ASAP. Submission cost = 30 min.

---

## 1. Google Search Console (3 min)

URL: https://search.google.com/search-console

1. Verify https://meok.ai is added to your property list (DNS TXT record on Namecheap).
2. Sitemaps → Add new sitemap → enter `sitemap.xml` (path only, not full URL).
3. Submit. Status will say "Couldn't fetch" → "Success" within minutes.
4. Optional: URL Inspection → enter each top-priority URL one by one → "Request Indexing" (max 10/day):
   - https://meok.ai/scorecard
   - https://meok.ai/fine-calculator
   - https://meok.ai/tools
   - https://meok.ai/audit-prep-bundle
   - https://meok.ai/article-50-kit
   - https://meok.ai/nis2-de-kit
   - https://meok.ai/transparency
   - https://meok.ai/bias-detection
   - https://meok.ai/eu-ai-act
   - https://meok.ai/eu-ai-act/article-50

---

## 2. Bing Webmaster Tools (2 min)

URL: https://www.bing.com/webmasters

1. Sign in (Microsoft account).
2. Add site → https://meok.ai.
3. Verify via DNS TXT or HTML file (Bing accepts the same Google verification token if pasted).
4. Sitemaps → Add `https://meok.ai/sitemap.xml`.
5. Submit URL — paste each of the 10 top-priority URLs.

Bing also feeds DuckDuckGo, Yandex, and ChatGPT search.

---

## 3. IndexNow (Bing + Yandex push) (5 min)

IndexNow lets you ping Bing/Yandex directly when content updates — gets new pages indexed in hours not days.

1. Generate a key (any random hex string ~32 chars): `openssl rand -hex 32`
2. Save the key as a public file at `https://meok.ai/{key}.txt` containing only the key string.
3. POST notification:

```bash
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "meok.ai",
    "key": "YOUR_KEY",
    "keyLocation": "https://meok.ai/YOUR_KEY.txt",
    "urlList": [
      "https://meok.ai/scorecard",
      "https://meok.ai/fine-calculator",
      "https://meok.ai/tools",
      "https://meok.ai/audit-prep-bundle",
      "https://meok.ai/article-50-kit",
      "https://meok.ai/nis2-de-kit",
      "https://meok.ai/transparency",
      "https://meok.ai/bias-detection",
      "https://meok.ai/eu-ai-act",
      "https://meok.ai/eu-ai-act/article-4",
      "https://meok.ai/eu-ai-act/article-9",
      "https://meok.ai/eu-ai-act/article-10",
      "https://meok.ai/eu-ai-act/article-13",
      "https://meok.ai/eu-ai-act/article-14",
      "https://meok.ai/eu-ai-act/article-15",
      "https://meok.ai/eu-ai-act/article-26",
      "https://meok.ai/eu-ai-act/article-43",
      "https://meok.ai/eu-ai-act/article-50",
      "https://meok.ai/eu-ai-act/article-72",
      "https://meok.ai/vs-vanta",
      "https://meok.ai/vs-drata",
      "https://meok.ai/vs-sprinto",
      "https://meok.ai/vs-auditboard",
      "https://meok.ai/vs-servicenow-grc",
      "https://meok.ai/blog/digital-omnibus-delay-2026",
      "https://meok.ai/blog/article-50-watermarking-guide",
      "https://meok.ai/blog/nis2-germany-deadline-2026"
    ]
  }'
```

Returns 200/202 on success. 90% of submissions get crawled within 24h.

---

## 4. Perplexity / ChatGPT-search (passive — already works)

Both crawl their own indexes built on top of Google + Bing. Once Google + Bing have you indexed, Perplexity + ChatGPT search will surface you within 1-2 weeks.

To accelerate:

- Cite your URLs in Hacker News comments (Show HN post drafted at /revenue/SHOW_HN_2026-04-27.md)
- Cite in Reddit posts (drafts at /revenue/REDDIT_CROSSPOSTS_2026-04-27.md)
- Get one inbound link from a high-DA site (HN front page, niche newsletter mention) — accelerates Perplexity ingestion massively

---

## 5. AI training-data crawlers (optional)

Anthropic, OpenAI, Google all crawl. They respect robots.txt. Current `/robots.ts` — verify it allows `*` user-agents on all paths except `/api/`, `/admin`, `/checkout`. Also confirm:

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /
```

These three tags signal you WANT to be in their training data + retrieval. Adding them is basically free distribution.

---

## 6. AI search engine direct submission

| Engine | Submission URL | Notes |
|--------|---------------|-------|
| Perplexity | (no direct) | Crawls Bing index |
| You.com | https://you.com/search-console | Optional |
| Phind | (no direct) | Crawls Bing |
| Kagi | https://kagi.com/sitemap | Niche but high-quality user base |

---

## 7. AI directory submission (low priority but cheap)

- https://aitrackerlist.com (free)
- https://theresanaiforthat.com (free, AI products)
- https://aitools.fyi (free)
- https://futurepedia.io (free, top AI directory)
- https://producthunt.com (Tuesday launch ideal)

For each, submit the homepage + 1-2 product pages (audit-prep-bundle, scorecard).

---

## Post-submission checklist (after 7 days)

- [ ] Google Search Console: check "Pages → Indexed" count. Target: 50+ in week 1, 200+ in month 1.
- [ ] Bing Webmaster: same check.
- [ ] Search "site:meok.ai" in Google + Bing — count results.
- [ ] Search "EU AI Act readiness" in Perplexity → check if you're cited.
- [ ] Search "what is article 50 watermarking" in ChatGPT (with web search) → check if cited.

If after 7 days fewer than 30 pages indexed in Google: investigate sitemap errors, check noindex meta tags on stale pages, verify robots.txt isn't blocking.
