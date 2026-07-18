# 🐉 MEOK — Next 33 Moves (planned 2026-06-07, for the week of Mon 9 June)
*⬜ I can do · 🔒 needs Nick first · ✅ done. Prioritised: highest leverage first. Honest — no vapor.*

## A. Unblock (🔒 your 30-second actions — everything downstream waits on these)
1. 🔒 DNS `one.meok.ai A → 35.242.143.249` (Namecheap) → MEOK ONE goes public.
2. 🔒 Team-scoped Vercel token (`niks-projects`) → I run the project cleanup.
3. 🔒 Rotate the personal Vercel token from the transcript.

## B. Distribution — the A2A first-mover play (free, uncontested, my top pick)
4. ⬜ Build the **A2A Agent Card generator** into `lib2b` (one card per flagship MCP).
5. ⬜ Serve Agent Cards at `/.well-known/agent.json` per remote MCP endpoint.
6. ⬜ Add an **ACP** (IBM BeeAI, REST) shim so the fleet speaks A2A + MCP + ACP.
7. ⬜ MCP cross-post sweep: all 271 published → every directory (mcp-submit + openMCP cross-post). FREE — no paid tiers.
8. ⬜ Submit fleet to Anthropic MCP Registry + Smithery + Glama + Docker MCP Catalog (server.json 95% ready from move-47 audit).
9. ⬜ Register flagship agents in the emerging A2A registries.

## C. Dev-Platform coherence (my lane — `/developers` is live, finish the product)
10. ⬜ PyPI republish `meok-sdk` v0.1.1 so the 3.9 fix reaches users.
11. ⬜ Verify the **TS + Go** SDKs round-trip against the live API (I proved Python; do the other two).
12. ⬜ Cross-link all 3 SDK READMEs → `meok.ai/developers`; consistent badges.
13. ⬜ Fix the 3 stubs (`meok-skills`/`meok-integrations`/`meok-teams-app`) — build or honest-redirect.
14. ⬜ Make `lib2b` the real unified protocol SDK (MCP + A2A + ACP + libp2p) — it's named, now ship a v0.1.

## D. Vercel + infra hygiene (cleanup — mostly 🔒-gated on the token)
15. 🔒 Pull the COMPLETE enriched project inventory (domains + last-deploy + repo per project).
16. 🔒 Delete the ~20–25 duplicate/dead projects (5 optimobiles, 4 templemans, leftover `dist`/`client`/`frontend`).
17. ⬜ Fold industry hubs (`medtech`/`fintech`/`cybersec`/`kidsai`) + tool pages into meok.ai routes; retire the standalone projects.
18. ⬜ Back up remaining at-risk local dirs (`CSOAI-CORP`, `meok-active-systems`) to PRIVATE repos (secret-scanned).
19. ⬜ Reconcile `councilof-ai` local↔remote divergence (it's 2 commits apart).

## E. Product depth — MEOK ONE (the consumer OS)
20. ⬜ Chat: **real token streaming** (replace the simulated typewriter).
21. ⬜ Chat: markdown rendering (code/links/bold) + copy / speak-again / regenerate actions.
22. ⬜ Finish the `/guardian` + `/family` `/os` surfaces (another tab started; wire to the live MCP tools).
23. ⬜ Characters: **anime persona variants** (expressive tone when Anime Mode is on).
24. ⬜ Characters: a visible **Faith-pack toggle** (not just the voice command).
25. ⬜ OLM: turn the v0.1 spec into the first real milestone (tie to SOV3 neural retrain + ICRL).

## F. GEO / authority (keep the citable-source momentum)
26. ⬜ Submit `/developers` + `/constellation` sitemaps to Google Search Console + Bing; track via Ahrefs brand-radar.
27. ⬜ More vertical-GEO "best AI for X" pages: aquaculture, COBOL migration, optometry.
28. ⬜ Add `/developers` as a node on `/constellation`; cross-link SDKs ↔ hub.
29. ⬜ One REAL PR for a genuine milestone (the Dev-Platform / A2A launch) — quality wire, no spam.

## G. Revenue + cadence (turn shipped → money)
30. ⬜ Consolidate the ~50 Stripe links → one canonical pricing ladder (kill the link sprawl leak).
31. ⬜ Wire a paid tier to the dev platform (SDK Pro / hosted attestation) — a real B2B funnel.
32. ⬜ Once DNS is live: verify the MEOK ONE funnel end-to-end (cap → upgrade → Stripe).
33. ⬜ Friday: reconcile `_TABS/STATUS.md` across all tabs + a weekly rundown.

---
**Sequencing:** B (distribution, free, first-mover) + C (finish dev-platform) are Monday's focus — both uncontested, high-leverage, my lanes. A unblocks D + G. E + F run in parallel via the other tabs.
**Discipline:** 1 tab per codebase. Commit every change. Verify before claiming. No CSGA/Terranova. No fake metrics.
