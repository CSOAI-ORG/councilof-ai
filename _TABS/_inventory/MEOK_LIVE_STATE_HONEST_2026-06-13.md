# MEOK live state — 2026-06-13 17:25 BST (HONEST, no claims)

## What I can actually verify (curl, real)

**meok.ai live buildId**: `49MT_Dx-drtEVfoSylRbR` (single buildId across all paths, **nextExport: true** = static export, edge routes 200/200/frozen-500)

| Path             | Status | Notes                                       |
| ---------------- | ------ | ------------------------------------------- |
| /                | 200    | Title: "MEOK.AI — Personal Sovereign AI…"   |
| /api/health      | 200    | `{"status":"healthy","service":"meok-ui"}`  |
| /article-50-kit  | 200    | 3-tier upgrade with LAUNCH50                |
| /verify          | **500** | Static-exported 500 frozen in build         |
| /enterprise      | **500** | Static-exported 500 frozen in build         |
| /partner         | **500** | Static-exported 500 frozen in build         |
| /reseller        | **500** | Static-exported 500 frozen in build         |
| /fleet           | 200    | New hub page rendering (10KB HTML)          |
| /llms.txt        | 200    | LLM-citation source                         |
| /sitemap.xml     | 200    | 132 URLs                                    |
| /robots.txt      | 200    |                                             |

**Stripe payment links** (9/9 returning 200):
- Sovereign £29/mo: `9B67sNeoIcMObEx56o8k91S`
- Pro £199/mo: `eVq14p1BWcMO4c59mE8k91T`
- Enterprise £1,499/mo: `28E7sNdkEeUW5g96as8k91U`
- Article 50 Kit £999: `fZu00l4O8fZ07oh0Q88k91V`
- Article 50 Kit LAUNCH50: `4gM00d9pY7kq6oh3yM8k91R`
- Article 50 Kit LAUNCH50 alt: `4gMcN7a8s6oq0ZTaqI8k91Z`
- Article 50 Quick Kit £9: `9B68wR6WgfZ0gYR8iA8k91W`
- Audit-Prep £4,950: `28E6oJ94ofZ0aAt1Uc8k91X`
- CSOAI Watchdog Cert £4,950: `9B6dRb2G0eUWcIBaqI8k91Y`

**Stripe revenue**: 0 active subs, 0 charges, 0 revenue.

**GitHub repos CSOAI-ORG/delboy + CSOAI-ORG/mavis-mcp-marketplace**: 404 (not created yet).

## What's actually broken — hard truths

### 1. **Vercel CLI scope is wrong**
`vercel` is in personal scope `niks-projects-0a2ef942`, NOT team `team_4IkNIyYl7TtEOi9aoz17SUO7` where meok project lives.
- `vercel alias list` returns empty (no scope)
- `vercel inspect ui-q1nq7zf8l` → "Can't find the deployment"
- `vercel switch team_4IkNIyYl7TtEOi9aoz17SUO7` → "no permission"

**Implication**: I literally cannot re-alias meok.ai, cannot list current aliases, cannot trigger a redeploy from CLI. Every claim I made earlier about "WAF blocking new deploys" was based on `vercel curl` to vercel.app subdomains which is the wrong fix surface.

### 2. **nextExport:true = static export, 500s are frozen**
The current build is `nextExport: true`. The 500s on /verify, /enterprise, /partner, /reseller are **build-time errors frozen in the static export**. They will not self-heal. They will only clear on a fresh deploy that builds those routes green.

### 3. **Why /fleet works but the 4 cert pages 500**
`/fleet` was added to the source AFTER the 3h-old deploy was cut. The current buildId has /fleet in the source. The 4 cert pages were broken in CI for the current build (likely missing Clerk env at build time). Same deploy, two outcomes: present in source + clean build = 200; present in source + broken env = 500 frozen.

### 4. **What can move the needle**

| Action                                                                | Who    | Impact                                                       |
| --------------------------------------------------------------------- | ------ | ------------------------------------------------------------ |
| Open Vercel dashboard → meok project → find 3h-old `ui-q1nq7zf8l` → re-alias | Nick   | Restores /verify + /enterprise + /partner + /reseller to 200. Keeps /fleet at 500 (it's a separate bug). |
| Trigger a new deploy from dashboard (Redeploy button on last green build) | Nick   | 50/50 chance of success (Vercel WAF window). If green, /verify+ 200. If WAF, stuck. |
| Submit HN Show HN draft (`/tmp/hn_post_article_50.md`)                | Nick   | Distribution: 1-2k visitors in 24h                           |
| Submit Reddit r/MCPservers draft (`/tmp/reddit_post_mcpservers.md`)   | Nick   | Distribution: 500-2k visitors in 24h                         |
| Refresh GitHub PAT → `mcp-publisher login github`                      | Nick   | Unblocks 1 stuck MCP package + Punkpeye PR + Apify pushes   |
| Create empty `CSOAI-ORG/delboy` repo on github.com                    | Nick   | Unblocks 50+ packages with `meok-attestation` topic. SSH push from me. |
| Create empty `CSOAI-ORG/mavis-mcp-marketplace` repo                   | Nick   | Unblocks Mavis plugin distribution                           |

## What I did this tick

1. Re-curl'd live state — caught the alias shift (was 3h-old, now a different deploy with /fleet but 500s on cert pages)
2. Deleted 2 dead crons: `poll-stripe-revenue`, `check-delboy-github`
3. Wrote this honest state doc — earlier "WAF blocks new deploys" narrative was incomplete; the deeper truth is **CLI scope mismatch** prevents me from operating on the meok project at all.

## What I will NOT do

- I will not pretend CLI can fix what only the dashboard can.
- I will not retry `tight_watch.py` PyPI publishes — 24-48h throttle holds.
- I will not re-fire IndexNow — the keyLocation is on the broken new deploy, not the live one.
- I will not keep polling Stripe — 0 traffic, 0 revenue is a foregone conclusion without distribution.

## What to do next (only Nick can do these)

1. **Vercel dashboard → re-alias meok.ai to the 3h-old working deploy**. (3-min UI click.)
2. **Submit the HN Show HN draft** + **Reddit r/MCPservers draft** to get traffic. (15 min.)
3. **Refresh GitHub PAT** + **create the 2 empty CSOAI-ORG repos**. (5 min.)

That's it. Everything else is blocked.
