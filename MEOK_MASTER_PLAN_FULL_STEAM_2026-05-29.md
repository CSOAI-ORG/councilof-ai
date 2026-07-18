# MEOK — Full Steam Master Plan (2026-05-29)

Single execution plan tying together everything built this session + what's left. Marked by who can do it: **[C]** = Claude can execute now (local, reversible), **[N]** = needs Nick (legal/deploy/money/irreversible). Honest scope throughout — no fabricated numbers, no firehose.

---

## Canonical truth (locked this session)
- **Legal:** CSOAI LTD (UK CH 16939677) · **Trading:** MEOK AI Labs · **Site:** Sutton St James, Lincolnshire, UK (~52.8°N)
- **Real metrics (never inflate):** ~26 PyPI MCPs · Stripe £0 · DAILY EAT live (free) · SOV3 0.788, ~76 agents, ~9,276 episodes, 6 NNs
- **Severed (never surface):** CSGA / James Castle / Terranova — quarantined to `_archive/severed/`

---

## WORKSTREAM 1 — Data & SOV3 (the "eat everything" engine)
| # | Item | Owner | Status |
|---|---|---|---|
| 1.1 | DAILY EAT (free arXiv+HF → record_memory → free embed), scheduled 3 AM | C | ✅ live, verified |
| 1.2 | Research ingest (white papers + facility + SIGIL), banned-gated, deduped | C | ✅ 41 files/116 chunks |
| 1.3 | MEOK DATA strategy ingested truth-corrected | C | ✅ done |
| 1.4 | Add EUR-Lex source to DAILY EAT | C | ⚠️ stub written — HTML-scrape returns nothing; needs the Cellar SPARQL/REST API to work. arXiv+HF carry the eat. Honest TODO, not "done". |
| 1.5 | Fix SOV3 semantic search (query_memories empty though list_memories works) | C | ▶ investigate |
| 1.6 | Connect compliance MCPs → SOV3 query_memories (answer from eaten corpus) | C | queued |

## WORKSTREAM 2 — SIGIL / MEOK ONE (the language + nervous system)
| # | Item | Owner | Status |
|---|---|---|---|
| 2.1 | Core language + emergent registry + Thought bus | C | ✅ 15/15 tests |
| 2.2 | SOV3 adapter, live-verified 5.25× compression | C | ✅ done |
| 2.3 | Ed25519 verifiable signing (the moat primitive) | C | ✅ done |
| 2.4 | Port Ed25519 to live meok-attestation-api | N+C | C preps preview → N sets Vercel key + publishes pubkey (task #43) |
| 2.5 | Native SIGIL emission in SOV3 council loop | C | queued (deeper SOV3 integration) |
| 2.6 | B6 consolidation batch 2 (repoint mcp-bridge/meok-bridge then archive) | C | queued (mcp-bridge = empty stub) |
| 2.7 | Publish meok-sigil to PyPI via Trusted Publishing (OIDC) | N+C | C preps repo+CI → N approves OIDC |

## WORKSTREAM 3 — Docs / IPO-readiness (truth + alignment)
| # | Item | Owner | Status |
|---|---|---|---|
| 3.1 | Capillary paper geography → UK | C | ✅ fixed |
| 3.2 | Entity name → canonical across 3 white papers | C | ✅ swept |
| 3.3 | Canonical identity source-of-truth doc | C | ✅ written |
| 3.4 | Quarantine severed archive | C | ✅ 63 files moved to _archive/severed |
| 3.5 | Investor-safe MEOK DATA doc (real numbers) | C | ✅ this session (MEOK_DATA_STRATEGY_INVESTOR_SAFE) |
| 3.6 | Unified research index (data-room navigator) | C | ✅ this session (RESEARCH_INDEX) |
| 3.7 | Back capillary "field validation" claims with real logs OR soften to "proposed" | N | needs real test data or Nick's call |
| 3.8 | IP assignment deed (founder → CSOAI LTD) | N | C can draft template; N+solicitor execute |
| 3.9 | Cap table | N | C can draft; N confirms |

## WORKSTREAM 4 — Facility (24,000 sqft)
| # | Item | Owner | Status |
|---|---|---|---|
| 4.1 | Blueprint + floor plan + phased plan + Gantt | C | ✅ done |
| 4.2 | Confirm trout tonnage → size Phase-1 BOM | N | one number unlocks the BOM |
| 4.3 | Start long poles: EA permit · DNO 3-phase · planning pre-app | N | parallel, day 1 |

## WORKSTREAM 5 — Revenue (the thing that funds all of it)
| # | Item | Owner | Status |
|---|---|---|---|
| 5.1 | COLD_EMAILS_V3 (money-first, €15M-correct) | C | ✅ written, send-blocked on verifier |
| 5.2 | Show HN (brew install live) | C+N | ✅ ready; N posts Tue–Thu 8am ET |
| 5.3 | Homebrew tap live (brew install meokclaw) | C | ✅ shipped |
| 5.4 | Make verifier public (proofof.ai cert) — unblocks outreach | N | Vercel UI (task #40) |
| 5.5 | Stripe webhook replay-guard + key entropy | C | local edits ready (task #45) |
| 5.6 | Rotate SECRETS_LOCAL keys → 1Password | N | task #44 |

---

## EXECUTION ORDER (full steam, value × safety)
**Now (Claude, this session):** 3.4 ✅ · 3.5 · 3.6 · 1.4 (EUR-Lex) · 1.5 (semantic search probe) · re-ingest corrected docs.
**This week (Nick, the unlockers):** 5.4 verifier (unblocks all outreach) · 4.2 tonnage · 5.2 Show HN.
**Next (Claude, queued):** 2.4 Ed25519 port (preview) · 2.6 B6 batch 2 · 1.6 MCP↔SOV3 · 3.8 IP deed template.

## What I will NOT do autonomously
Deploy to prod · publish to PyPI · push Stripe changes · sign legal docs · send outreach · spend money. Those are all **[N]** — I prep, you pull the trigger.
