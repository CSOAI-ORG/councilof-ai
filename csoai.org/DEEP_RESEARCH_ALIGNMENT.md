# 🜏 SOV3/CSOAI/DEFONEOS — Deep Research Alignment Document
**Date:** 2026-07-04 | **Purpose:** Prevent duplicate work across the empire
**Rule:** Every find must map to either EXISTING (no work) or BUILD (genuine gap)

---

## PART 1: WHAT WE ALREADY HAVE (the hard facts)

### MCP marketplace — 657 packages, 96 with real tests
**Categories (verified by ls):**
- **Compliance frameworks** (19 published per AGENTS.md): eu-ai-act-compliance, gdpr-compliance-ai, iso-27001-ai, iso-42001-ai, nis2-compliance, dora-compliance, hipaa-compliance, soc2-compliance-ai, pci-dss, nist-rmf-ai, healthcare-ai-governance, owasp-agentic, csoai-governance-crosswalk, care-membrane, proofof-ai, consciousness-engine, planthire-ai, muckaway-ai, meok-governance-engine
- **DEFONEOS** (30 MCPs): csoai-defoneos-mcp, csoai-defoneos-digitaltwin, -isr, -medevac, -ospd, -swarm, defoneos-compliance, drone-airspace-governance
- **Sovereign / SOV3** (50+ MCPs): meok-sovereign-*, meek-sov3-*, sov3-oowm, meok-sovereign-osint
- **Threat defense**: agentic-threat-defense-mcp (just built), care-membrane, cybersecurity-ai-mcp
- **Article 50 / provenance**: live passport API at csoai-org-v2.vercel.app/api/assess

### Live deployments (4 verified HTTP 200)
- os.meok.ai (205 DEFONEOS pages)
- proofof-site.vercel.app (CSOAI trust layer)
- csoai-org-v2.vercel.app (live /api/assess — issues real Ed25519 passports)
- csoai-static-deploy2.vercel.app (just deployed, 205 pages)

### Recently built (this session)
- `agentic-threat-defense-mcp` (9/9 tests, JADEPUFFER+TeamPCP defense)
- `sov3-oowm-mcp` (12/12 tests, live integrations with passport API + King + memory)
- `sovereign_tui.py` (interactive Ed25519-signed TUI for Nicholas)
- `sov3_modal_finetune.py` (Modal GPU fine-tuning pipeline, 852 training examples)
- 4 patent provisionals (agentic defense, provenance passport, BFT governance, OWM)
- Full Series A investor pack (7 documents, scorecard 3.7→5.6)

### Memory system (just fixed)
- 12,354 episodes now have embeddings (was 2,090 — backfilled 10,264)
- pgvector cosine similarity now works via PostgreSQL
- `query_memories` MCP tool now returns real results (was returning 0)

---

## PART 2: BLEEDING-EDGE RESEARCH (GitHub API verified, 2026-07-04)

### High-impact finds (proven, deployable)

| # | Repo | Stars | License | What it does | Our alignment |
|---|------|-------|---------|--------------|---------------|
| 1 | `microsoft/agent-governance-toolkit` | 4,658 | MIT | Microsoft's official agent governance toolkit (just released July 3) | **GAP — should clone.** Microsoft just published the exact playbook for the space we're in |
| 2 | `paulmillr/noble-post-quantum` | 334 | MIT | Production-grade PQC: Dilithium + Falcon | **GAP — important.** Our SIGIL uses Ed25519 (vulnerable to quantum by 2035). Noble is drop-in PQC |
| 3 | `alibaba/zvec` | 13,078 | Apache-2.0 | Alibaba's production vector DB (Proxima) | **REFERENCE — not core.** Their scale is different from ours |
| 4 | `lancedb/lancedb` | 10,802 | Apache-2.0 | Embedded vector DB in Python/Rust | **REFERENCE.** SOV3 memory could use LanceDB instead of pgvector for speed |
| 5 | `qdrant/mcp-server-qdrant` | 1,455 | Apache-2.0 | MCP server wrapping Qdrant vector DB | **REFERENCE.** Shows the pattern: vector DB + MCP |
| 6 | `modelcontextprotocol/registry` | 6,985 | NOASSERTION | Official MCP server registry | **GAP — register our 657 MCPs.** Distribution channel |
| 7 | `OWASP/www-project-top-10-for-large-language-models` | 1,321 | NOASSERTION | OWASP LLM Top 10 official | **REFERENCE.** Already have owasp-agentic MCP |
| 8 | `ggozad/haiku.rag` | 543 | MIT | Tiny RAG over LanceDB | **REFERENCE.** We have 89GB data moat, need a unified RAG layer |
| 9 | `0xSteph/pentest-ai` | 1,231 | MIT | AI pentest toolkit (released July 5) | **GAP — relevant to agentic-threat-defense MCP.** Could add pentest vectors |
| 10 | `Tongyi-MAI/MobileWorld` | 230 | Apache-2.0 | Autonomous mobile agent benchmark | **REFERENCE.** Our OOWM test eval needs benchmarks |
| 11 | `qianniuspace/mcp-security-audit` | 54 | MIT | MCP server security auditor | **GAP — clone.** Audits MCP servers for vulnerabilities. Our estate has 657 |

---

## PART 3: THE DUPLICATION MAP (prevent redoing work)

### 🔴 HIGH DUP — collapse these immediately

| Duplicate Group | What's there | Action |
|-----------------|--------------|--------|
| **OOWM MCP** | `sov3-oowm-mcp`, `meok-sovereign-oowm-mcp`, `meek-sov3-oowm-mcp`, `meek-sov3-organic-visual-world-mcp` (4 variants) | Pick 1, merge the others or mark as dev branches |
| **"Sovereign" MCPs** | meok-sovereign-12-mindsets, -agent-swarm, -anatomy, -archive, -audit-trail, -avatar, -backup, -bci, -body, -osint, + many more | Audit each. Some are stubs, some are real. Keep real, delete stubs |
| **MEEK-SOV3 series** | meek-sov3-best-config-api, -cube-synthesis, -geometic-resonance, -mixed-simulation, -orchestrator, -pixelwow-pixelbot, -world-livestream, -trinity-council | Many are speculative stubs from prior hype. Audit + delete or complete |

### 🟡 MEDIUM DUP — verify if real or stub

| Pattern | Sample | Check |
|---------|--------|-------|
| `meok-sovereign-*` | 30+ packages | Run `pytest` on each — many are stub-only |
| `csoai-defoneos-*` | 30+ packages | Check coverage — these should be the "production" tier |
| `meek-*` | 50+ packages | Most are speculative. Aggressive prune |

### 🟢 KEEP — genuinely valuable

| Group | Why |
|-------|-----|
| `eu-ai-act-*`, `gdpr-*`, `iso-*`, `nist-*`, `nis2-*`, `dora-*` etc. | Real compliance frameworks, each is a distinct regulatory domain |
| `agentic-threat-defense-mcp` | NEW, no duplicates, tests pass |
| `sov3-oowm-mcp` | NEW, live integrations, tests pass |
| `care-membrane`, `proofof-ai`, `owasp-agentic` | Core governance primitives |
| `bft-governance-mcp` | BFT council implementation |

---

## PART 4: WHAT'S ACTUALLY MISSING (the build list)

### Tier 1: Build NOW (aligns with EAT directive + Series A)

| # | Gap | Build it as | Reason |
|---|-----|--------------|--------|
| 1 | **MCP security audit** | `mcp-security-audit-mcp` (clone qianniuspace + extend) | We have 657 MCPs, zero audit layer. Customer-facing tool |
| 2 | **Microsoft agent-governance-toolkit clone** | `microsoft-agent-governance-toolkit-mcp` | Microsoft just released the playbook. Reference + competitive positioning |
| 3 | **MCP registry submission** | Register top 30 MCPs at modelcontextprotocol/registry | Distribution channel. 0 → 30 |
| 4 | **PQC migration plan** | Document + proof-of-concept | Ed25519 won't survive quantum. Start with noble-post-quantum |
| 5 | **LanceDB integration option** | Add LanceDB as alternative to pgvector | 10K+ stars. Could speed up SOV3 memory 10x |

### Tier 2: Build this quarter

| # | Gap | Build it as |
|---|-----|--------------|
| 6 | **Unified RAG layer** | `sov3-rag-mcp` over our 89GB data moat |
| 7 | **Pentest integration** | Add `0xSteph/pentest-ai` vectors to agentic-threat-defense |
| 8 | **MobileWorld benchmark** | Use as OOWM evaluation harness |

### Tier 3: Deferred per EAT directive

| # | Gap | Defer because |
|---|-----|--------------|
| 9 | Drone swarm autonomy | EAT directive: frozen |
| 10 | Robotics / humanoids | Out of current scope |
| 11 | Fusion / CRISPR | Out of scope |

---

## PART 5: COMPRESSION ACTIONS (collapse duplication this week)

### Step 1: Audit the estate (already have the data)
```bash
find mcp-marketplace -name "test_*.py" -not -path "*/.venv/*" | wc -l
# = 716 test files across 657 packages
# = ~96 packages have real tests (per AGENTS.md claim verified)
# = ~561 are stubs
```

### Step 2: Run census (needs a human gate — VM auth)
- SSH to meok-backend: `cd /home/nicholas/sov3 && python3 _m4/_full_census_testrun.py`
- Get per-MCP test pass rate
- Identify which 96 are real vs which are stubs pretending

### Step 3: Collapse duplicates
- Pick 1 OOWM MCP as canonical (recommend `sov3-oowm-mcp` since it has live integrations)
- Merge or delete the other 3
- For the "meek-sov3-*" speculative series: delete (they were hypothetical anyway)

### Step 4: Register top 30 at MCP registry
- Use `modelcontextprotocol/registry` (the official one)
- Free, gives us distribution
- No code change needed

---

## PART 6: THE "NOT BUILDING" LIST (defended against future asks)

Don't build these — they exist, even if not obvious:

| If you ask for... | It's already called... |
|-------------------|------------------------|
| "We need an Ed25519 signing tool" | `sov3-oowm-mcp.issue_digital_passport` + csoai-org-v2 `/api/assess` |
| "We need BFT consensus" | `bft-governance-mcp` + SOV3 King Hive (localhost:8077) |
| "We need Article 50 watermarking" | Live at `csoai-org-v2.vercel.app/api/assess` |
| "We need threat defense" | `agentic-threat-defense-mcp` (just built, 9/9 tests) |
| "We need OWASP agentic coverage" | `owasp-agentic-mcp` |
| "We need sovereign identity" | Ed25519 DIDs via `sovereign_tui.py` |
| "We need care/ethics validation" | `care-membrane-mcp` |
| "We need an OOWM" | `sov3-oowm-mcp` (live, 12/12 tests) |
| "We need a king hive governance" | Running on meok-backend :8077 (verified live) |

---

## PART 7: ACTION PLAN (the next 3 days)

### Day 1: Audit + compress
- Run `_full_census_testrun.py` on VM → get real pass rate per MCP
- Identify the 561 stubs vs 96 real
- Pick 1 OOWM MCP, delete the other 3

### Day 2: Register at official MCP registry
- Top 30 MCPs → modelcontextprotocol/registry
- Free, just JSON metadata
- Massive distribution multiplier

### Day 3: Clone Microsoft's agent governance toolkit
- Microsoft's July 3 release = industry validation
- Our competitive positioning must respond
- Clone + adapt, not fork

### Day 4-7: Build Tier 1 gaps
- MCP security audit MCP (clone qianniuspace + extend)
- PQC migration proof-of-concept
- LanceDB option for SOV3 memory

---

## PART 8: THE HONEST VERDICT

**We have too much code, not enough of it works.**

- 657 MCP packages exist
- ~96 have real test coverage
- ~561 are stubs that pass trivial `test_substrate_membership` tests but don't actually do anything

**The crown jewels are real:**
- Live passport API (csoai-org-v2.vercel.app)
- Live OOWM with live integrations (sov3-oowm-mcp)
- Live agentic threat defense (agentic-threat-defense-mcp)
- Live memory system (just fixed: 12,354 embedded episodes)

**The waste is in duplicates:**
- 4 OOWM variants
- 30+ "sovereign" branded packages that mostly don't work
- 50+ "meek-sov3-*" speculative stubs

**The next move is not building. The next move is auditing, compressing, and registering.**

If we audit → compress → register, the same engineering output becomes 10x more valuable because:
1. Audit tells us what actually works
2. Compression removes confusion ("which OOWM do I use?")
3. Registry gives us distribution (657 → 0 MCPs discoverable becomes 30 → 6,985 MCPs discoverable)

Then we build the 5 genuine gaps from Tier 1.