# Sovereign Search for SOV3 — decision + activation

**Question:** "Qwant as our sovereign browser for Sovereign and SOV3?"
**Answer:** Yes to the *spirit* — but built right: **one swappable `SOVEREIGN_SEARCH` layer**
with Qwant + Mojeek + Brave behind it, not Qwant alone. (Your "browser" stays
Playwright/Chromium — Qwant is a search *engine*, not a browser engine.)

## Why not just Qwant
- Qwant is sovereign in **privacy & jurisdiction** (French, EU, GDPR) but its results are
  historically **Bing-syndicated** — so it's *not* sovereign in **index**.
- Qwant has **no clean agent API** — its API now blocks bots (403 verified 2026-06-06).
- **Empirical finding (2026-06-06):** *every* free no-key scrape path is dead from
  datacenter/residential IPs — DDG serves an anti-bot page, the "lite" variants too,
  Qwant API 403s. The old SOV3 code (DDG scrape + `duckduckgo_search` lib, which isn't
  even installed) was silently returning nothing. A GCP IP would be blocked *harder*.
- **Conclusion:** reliable sovereign search needs ONE real backend up — a SearXNG we host,
  or one independent API key. There is no free-scrape shortcut.

## What shipped (code, done + tested 12/12)
- `sovereign-temple/sovereign_search.py` — stdlib-only, never-raises, env-swappable.
  Fallback chain: **SearXNG → Brave → Mojeek → Qwant → DuckDuckGo**. First non-empty wins.
  Normalises every engine to `[{title,url,snippet,engine}]`.
- Unified the scattered callers onto it (sovereign-first, legacy kept as fallback):
  `quick_search.py`, `sov3_tool_bridge._web_search`. *(browser_automation_bridge + jarvis_skills
  can be repointed the same way next.)*
- `tests/test_sovereign_search.py` — 12 network-free tests, green.
- `deploy/searxng/` — turnkey self-host: `docker-compose.yml` + `settings.yml` (engines =
  qwant+mojeek+brave+ddg, JSON enabled) + `run.sh` (one command, localhost-only).

## Activate it — pick the lane (each needs ONE owner-gated thing from you)

| Lane | Sovereignty | Cost | What you do | Then |
|---|---|---|---|---|
| **A. SearXNG self-host** *(most sovereign)* | We own the box; Qwant+Mojeek as engines | £0 + a little VM RAM | greenlight infra (needs Docker on the VM) | `bash deploy/searxng/run.sh` → set `SOVEREIGN_SEARCH_URL=http://127.0.0.1:8888` |
| **B. Brave API** *(fastest, free)* | Independent index, not Bing | **Free 2,000 q/mo** | sign up brave.com/search/api → give me the key | set `BRAVE_API_KEY=…` |
| **C. Mojeek API** *(most index-independent)* | UK own crawler | Paid | sign up mojeek.com/services/search → key | set `MOJEEK_API_KEY=…` |

**My recommendation:** **B now, A soon.** Brave's free tier makes search *work today* with
zero infra and a genuinely independent index; then stand up SearXNG (A) for the fully-owned
sovereign path and keep Brave/Mojeek as its engines + the layer's fallback. You can run all
three at once — the chain uses whichever is healthiest.

> I don't create accounts or enter keys (owner-gated). Hand me a key and I'll wire + verify;
> or greenlight Docker on the VM and I'll deploy SearXNG health-gated.

## Note on the human-facing side (MEOK ONE)
Separately, setting **Qwant as the default search / start-page** in the MEOK ONE consumer
browser is a clean, cheap brand win (EU + privacy) and is independent of the agent layer above.
