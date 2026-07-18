# MEOK Full-Auto Plan — 2026-06-15 (Nick @ pond)

Owner: Claude (autonomous). Sovereign gate: Nick. Repo: `~/clawd/meok` (UI subdir `ui/`, Vercel project `ui` → meok.ai).

## Standing rules (apply to every auto task)
1. **Never push or deploy** without Nick. All work lands on branch `meok-e2e-polish-jun15` (or a new dated branch). Deploy = Nick merges to `main` → Vercel.
2. **Typecheck is the gate.** `npx tsc --noEmit` must be `exit 0` before any commit. If errors appear, fix or revert — never commit red.
3. **Match house conventions.** JSON-LD = inline `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(OBJ) }} />` as first child of the top-level element. Color consts (NAVY/GOLD/BG) already include `#` → write `${NAVY}cc`, never `#${NAVY}cc`.
4. **Never invent prices.** Schema `offers.price` must equal the page's displayed price. No fabricated financial/compliance claims.
5. **Schema only on PUBLIC pages.** Skip app/internal: dashboard, os, guardian, characters, admin, login, register, family, settings, *-dashboard, chat, onboarding, memory, and user-shared dynamic routes.

## DONE 2026-06-15 (branch `meok-e2e-polish-jun15`, 7 commits, all tsc-clean)
- **Deploy unblocked**: removed 2 openpatent orphan pages (`onboard`,`portfolio`) that failed `next build` → moved to `~/clawd/_orphans_openpatent_pages/`.
- **Fixed** 54 invalid-CSS `#${NAVY}` double-hash bugs; i18n.ts TS7053 build-blocker; 2 schema/price mismatches.
- **Schema sweep COMPLETE**: 66 public pages enhanced (FAQPage+BreadcrumbList+Service/Product/SoftwareApplication/Organization as fit) across waves 1–4, incl. dynamic routes `docs/[slug]` (TechArticle) + `mcp/[slug]` (SoftwareApplication). Coverage 67%→76% (547/717); the remaining 24% are app/internal (correct).
- **Committed deploy-ready backlog**: 13 previously-untracked new pages + 7 widgets + MEOK OS v3 assets.
- **Hermes**: killed runaway dashboard; committed M3 `oauth_minimax` aux fix (branch `fix/aux-client-minimax-oauth`).

## NEXT DAYS — bounded, safe queue (do top-down)
1. **[Nick] Merge + deploy** `meok-e2e-polish-jun15` → main → Vercel. Everything below assumes deploy happened.
2. **Verify live** (read-only): `/api/health` 200, the 66 pages return 200, Google Rich Results / schema validates. Report failures.
3. **De-dup FAQ** on the 4 `best-ai-for-*` pages (AnswerPage already renders one; an extra was added). Cosmetic — remove the added visible section, keep the Breadcrumb/Service JSON-LD.
4. **Leaderboard endpoint**: `src/app/api/leaderboard/route.ts` reads `~/.meok/leaderboard.json` via `os.homedir()` — won't resolve on Vercel serverless. Move data to a deployed source (KV/blob/static JSON) or mark it local-only.
5. **New-page schema watch**: any new public `page.tsx` ≥50L without JSON-LD/AnswerPage → enhance per the playbook, typecheck, commit.
6. **Sitemap/robots audit**: confirm new pages (pricing, smart-agri, smart-home, press-kit, etc.) are in `sitemap.xml` and not blocked by robots.
7. **Internal linking**: the new vertical pages need inbound links from a hub (constellation/verticals index) for crawl + AEO.
8. **Broaden**: repeat the audit on the other live sites (proofof.ai, councilof.ai) and the MCP catalogue READMEs.

## Recurring automation (scheduled)
A daily routine runs the SAFE subset: deploy/health probe + new-page schema watch (steps 2,5,6) → typecheck-gate → commit to the polish branch → report. It does NOT push/deploy and does NOT touch app/internal pages.
