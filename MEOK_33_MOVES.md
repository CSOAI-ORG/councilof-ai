# 🐉 MEOK — Next 33 Moves (2026-06-07)

Forward-momentum program. ✅=done · ⬜=todo · 🔒=owner-gated (Nick). RAILS: GCP for heavy,
health-gated deploys + rollback (never pkill), no secrets/Stripe/DNS/PyPI-without-lock, verify live.

## A. Revenue funnel — finish the £0-killer (highest value)
1. ✅ Cap `/api/sovereign` too (free users capped on the council brain, not just /api/think)
2. ✅ Make the cap env-tunable (`MEOK_FREE_DAILY_CAP`) — A/B without a deploy
3. ⬜ Live usage indicator in OS chat ("X/50 today")
4. ⬜ Add `/api/sovereign` to the startup warmup list
5. ⬜ Pricing-page upgrade buttons → `/api/checkout` (carry client_reference_id)
6. ⬜ Stripe-return `?upgraded=1` → OS re-fetches `/api/auth/me` → unlock in-session
7. ⬜ Funnel unittests (cap, webhook signature, tier-flip)
8. 🔒 Stripe £9 link + `whsec_` → `data/.env`; run the test charge

## B. MCP Scorecard — ship the engine that's already built
9. ✅ Add `pyproject.toml` + README to `mcp-scorecard-mcp` (packageable)
10. ⬜ Wrap the scorer as an MCP server (a `score_mcp` tool via FastMCP)
11. ✅ Run the scorer over a sample of our published MCPs → a real leaderboard JSON
12. ⬜ Live `/scorecard` page in MEOK ONE (score any MCP — lead magnet)
13. 🔒 Publish `mcp-scorecard` to PyPI via the gate harness (needs the publish lock)

## C. Tech hardening (Tier B/C)
14. ⬜ Wire remaining sovereign_search callers (browser_automation, jarvis_skills)
15. ⬜ Brave-vs-SearXNG decision + a SearXNG docker-compose for the VM (env-ready)
16. ⬜ SOV3 #75 pgvector migration — scaffold + concrete plan (start the big one)
17. ⬜ Mem0 / LightRAG functional smoke tests (isolated venv)
18. ⬜ Bind SOV3 :3101 to 127.0.0.1 (#59 belt-and-braces) — careful, verify MCP still reaches it
19. ⬜ Re-run GCP E2E audit after the batch → confirm 36/36 holds
20. ⬜ SBOM/security quick scan of the new funnel + webhook code

## D. Growth / content (safe drafts — for Nick to fire)
21. ⬜ of.ai governance landing pages (#29)
22. ⬜ UK construction redirects plan (#30)
23. ⬜ Sedo listings draft (#32)
24. ⬜ Scorecard drip sequence finalize
25. ⬜ LinkedIn/X launch one-liners batch
26. ⬜ Show HN final polish (verify numbers current)

## E. Hygiene / debt
27. ⬜ Draft the stale-Stripe-products archive list (#33 — Nick archives)
28. ⬜ Verify all 14 MEOK ONE surfaces post-funnel-deploys
29. ⬜ Update MEMORY with today's funnel + scorecard state
30. ⬜ Guardian: confirm singleton holding (1 instance) after the night
31. ⬜ Tidy VM `.bak` files (keep newest, note rollbacks)
32. ⬜ Cost/repo sanity: confirm no secret leaked in the funnel commits-to-be
33. ⬜ Final rundown doc + push notification

## PROGRESS LOG
- (init) plan written; executing batch A+B first (revenue + the scorecard Nick asked about).
- batch A: moves 1 (cap /api/sovereign) + 2 (env-tunable caps) done + deployed.
- batch B: move 11 (ran scorer → 338 pkgs scored, mean 62.9, leaderboard at revenue/mcp_scoreboard_2026-06-07.{json,csv}) + move 9 (pyproject+README → packageable) done.

## F. Folded in 2026-06-07 (WORLD + intel + refinement — "don't miss anything")
34. ⬜ agentmemory/mex patterns → evaluate + fold into SOV3 memory (#75) [intel]
35. ⬜ GEO pass: schema.org/JSON-LD on top domains for AI-search citation [intel]
36. ⬜ Model-collapse citation → CSOAI / EU-AI-Act docs (human-in-loop = anti-collapse) [intel]
37. ⬜ Battle-mode: one prompt → multi-provider compare (leverage swarm + sovereign_search) [intel, optional]
38. ⬜ MEOK WORLD spec + v0 — stylized NON-geo character habitat from existing assets (NOT real geo; Genie/Higgsfield = optional garnish)
39. ✅ MEOK ONE OS: in-OS Help / Guide / FAQ surface (content + UX) ← TODAY
40. ⬜ MEOK ONE OS: onboarding/empty-state copy polish + usage indicator (=move 3) ← TODAY
41. ⬜ Character Factory: verify end-to-end (create→roster→DOME/WORLD) + polish ← TODAY
42. ⬜ DOME×CSOAI×MCP unification: the moat-story page (governance narrative)
43. ⬜ Images/brand pass: audit existing assets, flag what needs real image-gen (owner/tool)
- refine: move 39 (Help/Guide/FAQ surface at /help,/faq,/guide — getting-started + moat + plans + privacy + 7 FAQs) deployed.
