# Day 6 — IndexNow 7-URL Fallback Submission

**Date:** 2026-06-16 (Day 6, Move D6-E)
**Engineer:** D6-E subagent
**Status:** Submission attempted. **HTTP 422 returned** — fallback did NOT work. Blocker remains the apex→www redirect (carried over from Day 5).

---

## TL;DR

The 7-URL fallback batch was constructed, re-verified as 200, and POSTed to `https://api.indexnow.org/indexnow`. The endpoint returned **HTTP 422** with the same IndexNow error as the Day 5 attempts: `"One or more URLs are not related to your site verified through the keylocation parameter"`. **The fallback did not work.** Submission did not index the URLs.

The blocker is the same one Day 5 identified: the `host` field (`www.meok.ai`) and the `keyLocation` field (also `www.meok.ai`) appear consistent, but Bing's verifier is treating this as a host-mismatch with the previously-registered bare-apex key. The fix is on the Vercel hosting side (see Day 5 Option A: a `vercel.json` rewrite that makes `meok.ai/.well-known/*` return 200 directly without the apex→www redirect) and is **BLOCKED on the WAF cooldown per AGENTS.md**.

---

## (1) The 7 URLs (from D5 report, Option D)

D5 subagent's "recommended 7-URL fallback batch" (Option D section of `DAY5_INDEXNOW_FIX_2026-06-16.md`). All 7 are the URLs from the original 99-URL batch that returned HTTP 200 on the D5 HEAD sweep.

1. `https://www.meok.ai/`
2. `https://www.meok.ai/fleet/`
3. `https://www.meok.ai/llms.txt`
4. `https://www.meok.ai/llms-full.txt`
5. `https://www.meok.ai/sitemap.xml`
6. `https://www.meok.ai/compliance-whitepaper.html`
7. `https://www.meok.ai/eu-ai-act-article-50-cliff.html`

## (2) Re-verification (HEAD check, D6 morning)

Ran `curl -sI -L -m 5 <url>` against each. All 7 return **200** as the **final** HTTP code (one URL, `/fleet/`, has a 308 redirect from `/fleet/` to `/fleet` before the 200 — the final 200 is the one that matters to IndexNow).

| # | URL | Final HTTP code | Content-Type | Content-Length | Redirect chain |
|---|-----|-----------------|--------------|----------------|----------------|
| 1 | `/` | **200** | text/html; charset=utf-8 | 145,643 | direct |
| 2 | `/fleet/` | **200** | text/html; charset=utf-8 | 7,384 | 308 → `/fleet` → 200 |
| 3 | `/llms.txt` | **200** | text/plain; charset=utf-8 | 4,758 | direct |
| 4 | `/llms-full.txt` | **200** | text/plain; charset=utf-8 | 10,669 | direct |
| 5 | `/sitemap.xml` | **200** | application/xml | 27,474 | direct |
| 6 | `/compliance-whitepaper.html` | **200** | text/html; charset=utf-8 | 15,212 | direct |
| 7 | `/eu-ai-act-article-50-cliff.html` | **200** | text/html; charset=utf-8 | 9,553 | direct |

Also re-verified `https://www.meok.ai/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt` → **200**, 32 bytes, body matches the key.

**Re-verification result: all 7 URLs are still serving 200. The 7-URL set is submittable from a URL-existence standpoint.**

## (3) Submission attempt

Wrote the fallback batch to `/Users/nicholas/clawd/DAY6_INDEXNOW_7URL_FALLBACK_2026-06-16.json`:

```json
{
  "host": "www.meok.ai",
  "key": "4ce8d40dd91b87a343a68755bfb7e8c9",
  "keyLocation": "https://www.meok.ai/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt",
  "urlList": [
    "https://www.meok.ai/",
    "https://www.meok.ai/fleet/",
    "https://www.meok.ai/llms.txt",
    "https://www.meok.ai/llms-full.txt",
    "https://www.meok.ai/sitemap.xml",
    "https://www.meok.ai/compliance-whitepaper.html",
    "https://www.meok.ai/eu-ai-act-article-50-cliff.html"
  ]
}
```

POSTed to `https://api.indexnow.org/indexnow` with `Content-Type: application/json; charset=utf-8`.

### Response

```
HTTP/2 422
{"errorCode":"InvalidRequestParameters",
 "message":"One or more URLs are not related to your site verified through the keylocation parameter. Please verify URLs before submitting.",
 "details":null}
```

**Submission HTTP code: 422.** This is the 9th IndexNow 422 in a row (8 in Day 5 + this one). It is also the 2nd submission of the 5-min window, well under the 3-per-5-min rate limit cap.

## (4) Why the fallback did not work

This is the same root cause D5 identified: **`host=www.meok.ai` + `keyLocation=https://www.meok.ai/...` looks consistent on the wire, but Bing's IndexNow verifier has the key registered against the bare-apex `meok.ai` hostname from the Day-1 submission and is treating `www.meok.ai` as a different (unverified) host until the apex no longer redirects OR the key is explicitly re-registered via Bing Webmaster Tools.**

The D5 evidence (Yandex's structured `invalidUrlList: ["https://meok.ai/"]` error with key verification succeeding on www) still holds and is consistent with this D6 422.

The local key file at `/Users/nicholas/clawd/meok/ui/public/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt` is **still 100% correct** (32 bytes, no newline, no whitespace, body matches the served `www.meok.ai` body via xxd). No local fix is possible.

## (5) Follow-up section

> **Still 422 — the keyLocation check is the blocker, requires Vercel deploy.**

The 7-URL fallback did not unblock the IndexNow pipeline. The blocker is on the Vercel hosting side: `meok.ai` (bare apex) returns 307→`www.meok.ai` for ALL paths, and Bing's verifier has the key registered against the apex. The fix is in `vercel.json` (D5 Option A):

```json
{
  "cleanUrls": false,
  "trailingSlash": false,
  "redirects": [
    { "source": "/(.*)", "has": [{ "type": "host", "value": "meok.ai" }],
      "destination": "https://www.meok.ai/$1", "statusCode": 307,
      "missing": [{ "type": "file", "value": "!.well-known/*"}] }
  ]
}
```

…so that `meok.ai/.well-known/<key>.txt` returns 200 directly and Bing sees the key on the bare apex.

**This deploy is BLOCKED** on the WAF cooldown per `/Users/nicholas/clawd/meok/AGENTS.md` — every new Vercel deploy after 2026-06-13 11:00 BST returns 403 with `x-vercel-mitigated: deny` for `/api/*`. Per the hard rules, this subagent did NOT trigger a Vercel deploy and did NOT modify the meok.ai project source.

Once the WAF clears (estimated 24-48h from 2026-06-13, so likely clearing 2026-06-15/16 already — but the D5 subagent's record shows the WAF is still active, so we should re-test with a fresh deploy attempt before re-aliasing), the workflow is:

1. Land the `vercel.json` change (D5 Option A).
2. Run `pre_realias_check.sh <new-vercel-app-url>` to confirm `meok.ai/.well-known/<key>.txt` returns 200 with body = key.
3. Re-alias meok.ai / www.meok.ai / try.meok.ai to the new deploy.
4. Re-POST this same 7-URL batch (or the full 99-URL batch once `dist/*` and `guides/*` routes are also 200).
5. Expect HTTP 200 from `api.indexnow.org`.

## (6) Hard-rules compliance

- ❌ Did NOT trigger a Vercel deploy.
- ❌ Did NOT modify the meok.ai project source.
- ❌ Did NOT send to api.indexnow.org more than once in 5 minutes (1 submission, well under the 3-per-5-min cap).
- ✅ Did re-verify all 7 URLs are 200 before submission.
- ✅ Did validate the JSON before POSTing.
- ✅ Did write the fallback batch file at the prescribed path.
- ✅ Did record the response and write this report.

## Files touched

- **Created:** `/Users/nicholas/clawd/DAY6_INDEXNOW_7URL_FALLBACK_2026-06-16.json` — the 7-URL fallback batch.
- **Created:** `/Users/nicholas/clawd/DAY6_INDEXNOW_FALLBACK_REPORT_2026-06-16.md` — this report.
- **Not modified:** `/Users/nicholas/clawd/meok/ui/public/.well-known/4ce8d40dd91b87a343a68755bfb7e8c9.txt` (still correct).
- **Not modified:** `/Users/nicholas/clawd/meok.ai/indexnow_batch_real.json` (still the full 99-URL batch with the 92 known-404s).

## Summary for the parent agent

- **(a) The 7 URLs:** `https://www.meok.ai/`, `https://www.meok.ai/fleet/`, `https://www.meok.ai/llms.txt`, `https://www.meok.ai/llms-full.txt`, `https://www.meok.ai/sitemap.xml`, `https://www.meok.ai/compliance-whitepaper.html`, `https://www.meok.ai/eu-ai-act-article-50-cliff.html`.
- **(b) Submission HTTP code:** **422** (with the same `InvalidRequestParameters` / "URLs not related to your site verified through the keylocation parameter" message as the 8 Day-5 attempts).
- **(c) Did the fallback work?** **No.** The 7 URLs are all 200, the JSON is valid, the submission went out — but the IndexNow verifier is still rejecting on the host/keyLocation check. The blocker is the apex→www redirect on `meok.ai`, and the only fix is a Vercel deploy adding the `/.well-known/*` redirect-bypass middleware (D5 Option A). That deploy is BLOCKED on the WAF cooldown per `meok/AGENTS.md`. This subagent did not and could not trigger that deploy.
