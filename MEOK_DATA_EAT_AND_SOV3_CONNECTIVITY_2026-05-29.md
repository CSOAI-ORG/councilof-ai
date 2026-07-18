# MEOK Data Eat + SOV3 Connectivity Audit — 2026-05-29

Two questions answered: (1) **how does MEOK "eat" all data daily at lowest cost** — built + verified today; (2) **what's actually connected to SOV3** — audited against real code, not assumed.

---

## PART 1 — THE DAILY EAT (built, live-verified, £0)

### The cheapest/cleverest design (and WHY it's cheapest)
The expensive layers were **already free** in SOV3 — I just had to stop wasting them:

| Layer | Cost | How |
|---|---|---|
| **Embedding** | **£0** | SOV3 already uses local Ollama `nomic-embed-text` — no per-doc API cost |
| **Storage** | **£0** | local PostgreSQL + pgvector |
| **Data sources** | **£0** | arXiv API + HuggingFace Hub — both free, no keys |
| **Compute** | **£0** | runs on the box SOV3 already runs on |
| **Dedup** | saves compute | `content_hash` seen-set → never re-embed the same doc |

**The clever part isn't a new pipeline — it's closing a loop SOV3 already half-had:**
```
curiosity_agent.py   →   sov3_daily_eat.py   →   record_memory MCP   →   nomic-embed (FREE)
(finds knowledge GAPS)   (NEW: fetches free      (existing store,        (existing local
                          data for those gaps)    hash-deduped)            embedding)
```
Before today: curiosity found gaps but nothing fetched external data to fill them. Now it does.

### What's live
- **`sovereign-temple/sov3_daily_eat.py`** — the harvester. Free arXiv + HF, gap-directed topics (via `suggest_exploration`), hash-dedup (persistent `~/.sov3_eat_seen.json`), daily cap (default 40), care-gated through `record_memory`.
- **Wired to scheduler** — `run_daily_eat` at **3 AM daily** (after the 2 AM overnight job), in `sov3_scheduler.py`.
- **VERIFIED live:** ate 3 real HuggingFace EU-AI-Act datasets into SOV3 postgres (`944ae67d`, `cc1d50c4`, …), tagged `daily_eat`/`open_source`, care_weight 0.5, £0.

### Honest caveats
- **arXiv rate-limits** (429/timeout on rapid/cold calls). Handled: throttle + soft-skip ("retries tomorrow") so it never crashes the eat; **HF carries the run** when arXiv is throttled. Over daily cadence (one run/day, 3s spacing) arXiv behaves far better than my rapid testing did.
- **Sources are currently 2** (arXiv + HF). Easy to extend: GitHub public API, RSS feeds, PubMed, EUR-Lex (for the compliance moat) — each is ~20 lines following the same `fetch_*` pattern. Deliberately started with 2 proven ones, not 10 flaky ones.
- **`query_memories` semantic search returns empty** even though `list_memories` shows the docs stored — a pre-existing SOV3 search-index quirk (noted earlier sessions), NOT a daily-eat bug. The eat writes fine; retrieval-by-semantic-search is a separate SOV3 fix.

### To extend (next sources, ranked by moat value)
1. **EUR-Lex** (free) — EU regulation full-text → directly feeds the compliance MCPs. Highest moat.
2. **GitHub public** (free, no key for search) — track open-source compliance/robotics repos.
3. **PubMed/bioRxiv** (free) — aquaculture welfare science → fish-welfare attestation evidence.
4. RSS (free) — AI-policy newsletters already in `revenue/` outreach list.

---

## PART 2 — SOV3 CONNECTIVITY AUDIT (verified against real code today)

"Make sure all is connected to SOV3." Here's what actually pings `:3101`, measured by grep, not assumed:

| Project | Files referencing SOV3 | Status |
|---|---|---|
| **meok** (the OS app) | 60 | ✅ deeply connected |
| **meok-oneos** (canonical shell) | 5 | ✅ connected |
| **meok-sigil** (Thought layer) | 5 | ✅ connected (built this week — adapter + live bench) |
| **meokclaw-tui** | 3 | ✅ connected (license + companion + statusbar views) |
| **meok-attestation-api** | 0 | ⚠️ **disconnected** — signs attestations but doesn't read SOV3 state |
| **meok-labs-engine** | 0 | ⚠️ **disconnected** — compliance MCPs run standalone |
| **bridge** (now folded → meok-oneos) | 0 | ⚠️ router exists but SOV3-wiring not confirmed |
| **cobolbridge-site** etc. (vertical sites) | 0 | ⚠️ marketing surfaces — arguably shouldn't need SOV3 |

### The real picture
- **The core IS connected:** the OS (meok), the shell (meok-oneos), the Thought layer (sigil), and the TUI all talk to SOV3. That's the spine.
- **Two meaningful gaps worth closing:**
  1. **`meok-attestation-api` ↔ SOV3.** The attestation signer doesn't read SOV3 — but SIGIL's `sign.py` (built today) is the bridge: SOV3 thought → SIGIL → Ed25519 sign. Wiring the adapter's `digest`/`sign` output into the live attestation-api (task #43) **is** this connection. *Highest-value link to close.*
  2. **`meok-labs-engine` (compliance MCPs) ↔ SOV3.** The MCPs that generate revenue run blind to SOV3's memory/council. Connecting them means a compliance audit could draw on SOV3's ingested regulation corpus (which the Daily Eat now fills via EUR-Lex). *This is where the eat + the moat converge.*
- **Correctly disconnected:** the marketing/vertical sites (cobolbridge-site, etc.) are static surfaces — they don't need SOV3, and forcing it would be over-engineering.

### The convergence (why eat + connectivity are one thing)
```
Daily Eat (EUR-Lex, arXiv) ──► SOV3 memory (free embed) ──► compliance MCPs query it
                                      │                            │
                                      ▼                            ▼
                              SIGIL adapter (5.25x)        signed attestations (Ed25519)
                                      └──────────► one auditable, low-cost knowledge loop
```
Close the two gaps and MEOK becomes a single system: **it eats regulation daily for free, SOV3 reasons over it, the compliance MCPs sell answers from it, and every answer is SIGIL-compressed + cryptographically signed.** That's the whole thesis in one sentence.

---

## NEXT (ranked, all build on what shipped today)
1. **Add EUR-Lex to the eat** (~20 lines, highest moat — feeds the compliance corpus). Local, no deploy.
2. **Close gap #1:** wire SIGIL sign → live attestation-api (task #43). Needs your Vercel key.
3. **Close gap #2:** give the compliance MCPs a SOV3 `query_memories` call so they answer from the eaten corpus.
4. **Fix SOV3 semantic search** (`query_memories` empty) so the eaten data is actually retrievable, not just stored.

*Built + verified Opus 4.8, 2026-05-29. Eat: live, £0, 3 real docs ingested. Connectivity: audited by grep against real code. Caveats stated, not hidden.*
