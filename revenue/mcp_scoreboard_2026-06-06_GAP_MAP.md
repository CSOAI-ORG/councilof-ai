# MCP Portfolio Scoreboard — Distance-to-100 Gap Map
**Generated 2026-06-06 · Phase 0 of MCP Domination Plan**
Engine: `mcp-marketplace/mcp-scorecard-mcp/mcp_scorecard/` (AST + live PyPI/pypistats + directory APIs)
Data: `revenue/mcp_scoreboard_2026-06-06.csv` (flat) · `.json` (full per-category)

> **Scoring is on LOCAL source** (what gets republished) + **live PyPI download data**.
> Directory presence verified for the top-30 download leaders only; long-tail dirs left blank.

---

## Portfolio at a glance (323 package dirs scanned)
| Metric | Value |
|---|---|
| Packages with `pyproject.toml` scanned | **323** |
| Published on PyPI (live) | **282** |
| Local source importable (AST-clean) | **315 / 323** (8 broken — see landmines) |
| Packages with real downloads (>0/mo) | **265** |
| **Total downloads / 30 days** | **218,423** |
| Mean score (published) | **68.4 / 100** |
| On Anthropic MCP registry (top-30 checked) | **30 / 30 ✅** |
| On mcp.so (top-30 checked) | **30 / 30 ✅** |
| On Glama (flagships) | **2 / 14 ❌** |
| On Smithery | **0 / 282 ❌** |

**Headline:** This is **not** a "271 servers / £0 from low quality" problem. The catalogue is
genuinely well-built (tool-design 9.8/10, reliability 9.8, security 9.0, tests 8.9) and pulls
**~218k downloads/month**. The £0 is a **monetization-wiring + distribution + transport** problem,
not a quality problem. Fix the rails, not the servers.

---

## THE FLAGSHIP 10 — CONFIRMED by real 30-day downloads
Revenue-bearing compliance/governance MCPs, ranked by **actual** pypistats downloads.
(Generic dev-utility MCPs with high downloads — encoder, clipboard, password — excluded:
they don't carry the compliance/attestation revenue thesis.)

| # | Package | DL/30d | Score | Attest | Stripe | Glama | Distance-to-100 | Top gaps |
|---|---|---:|---:|:--:|:--:|:--:|---:|---|
| 1 | **eu-ai-act-compliance-mcp** | **2,726** | 80 | ✅ | ✅ | ❌ | 20 | examples, http-transport, Glama/Smithery |
| 2 | **dora-compliance-mcp** | **2,410** | 78 | ✅ | ✅ | ❌ | 22 | examples, http, dirs |
| 3 | **ai-bom-mcp** | **1,829** | 70 | ❌ | ✅ | ❌ | 30 | **no attestation**, examples, http, dirs |
| 4 | **bias-detection-mcp** | **1,752** | 78 | ❌ | ✅ | ❌ | 22 | **no attestation**, examples, dirs |
| 5 | **meok-governance-engine-mcp** | **1,735** | 75 | ❌ | ✅ | ❌ | 25 | **no attestation**, examples, dirs |
| 6 | **cra-compliance-mcp** | **1,713** | 76 | ✅ | ✅ | ❌ | 24 | examples, http, dirs |
| 7 | **nis2-compliance-mcp** | **1,710** | 72 | ❌ | ✅ | ❌ | 28 | **no attestation**, examples, dirs |
| 8 | **gdpr-compliance-ai-mcp** | **1,667** | 68 | ❌ | ✅ | ❌ | 32 | **no attestation**, docs, examples, http |
| 9 | **llm-compliance-comparison-mcp** | **1,598** | 75 | ❌ | ✅ | ❌ | 25 | **no attestation**, examples, dirs |
| 10 | **iso-42001-ai-mcp** | **1,589** | 66 | ❌ | ❌ | ❌ | 34 | **no attestation, no Stripe**, examples, http |

### Revisions vs the plan's assumed flagship list
**Confirmed** (data agrees): eu-ai-act (#1, but real DL = 2,726/mo, ~8.5× the assumed "320"),
dora, cra, csrd, watermark-attest, the A2A safety pack, gods-eye, ai-incident-reporting, nis2-de-register.

**Promote into the 10 (real traffic the plan under-rated):**
- `bias-detection-mcp` (1,752/mo) — #4 overall, not in the assumed list
- `meok-governance-engine-mcp` (1,735/mo) — #5
- `nis2-compliance-mcp` (1,710/mo) and `gdpr-compliance-ai-mcp` (1,667/mo) — the *generic* DORA/NIS2/GDPR engines outsell the *crosswalk* variants
- `llm-compliance-comparison-mcp` (1,598/mo)
- `iso-42001-ai-mcp` (1,589/mo)

**Demote / watch (lower real traffic than assumed):**
- `dora-nis2-crosswalk-mcp` — 630/mo (the standalone `dora-compliance-mcp` at 2,410 is the real winner)
- `uk-ai-bill-compliance-mcp` — no pypistats record yet (too new); keep but don't lead with it
- `meok-omnibus-tracker-mcp` — 1,129/mo but **local source is BROKEN** (see landmines); fix before promoting
- `gods-eye-geospatial-mcp` — 859/mo; solid but mid-pack

**Recommendation:** treat the **top ~15 compliance MCPs** as the flagship investment tier (they're
within ~1,000 downloads of each other), and lead marketing with eu-ai-act + dora (the two clear leaders
at 2,400–2,700/mo).

---

## TOP 5 PORTFOLIO-WIDE GAPS (ranked by leverage)

### 1. Monetization rails barely wired — `Provenance/Revenue` = 2.7/10 (worst category)
The plan's entire revenue thesis (PAYG → subscription → attestation) is mostly **not in the code**:
- **PAYG: 5 / 282 packages (1%)** — the £0.05/call meter is essentially unshipped.
- **Attestation: 68 / 282 (24%)** — the "moat" SKU; even top earners ai-bom, bias-detection,
  governance-engine, nis2-compliance, gdpr have **no attestation**.
- **Stripe link: 116 / 282 (41%)** — over half the catalogue has no upsell path at all.
→ *Highest-leverage fix:* a shared meter/attestation decorator (Phase 8) applied to the top 15.

### 2. Zero remote transport — `Transports` = 5.0/10, `transport_http` = 1 / 282 (0%)
Everything is **stdio-only**. No streamable-HTTP / remote URL means **none** of these can be added
as ChatGPT Connectors, claude.ai custom connectors, or any URL-based platform — closing off the
largest untapped buyer pool (Phase 3/5). This is a structural ceiling on revenue.

### 3. Distribution holes — Glama misses flagships, Smithery is empty
- **Smithery: 0 / 282** MEOK servers indexed (verified by direct search). A whole free
  distribution + billing rail unused.
- **Glama: only ~29 CSOAI-ORG repos indexed, and 12 of the 14 flagships are MISSING** —
  including the two top earners (eu-ai-act 2,726/mo, dora 2,410/mo). Glama auto-indexes GitHub
  `mcp` topic + `server.json`; these flagships have `server.json` but aren't picked up → needs
  manual submit / topic fix.
- ✅ Anthropic registry + mcp.so coverage is good (30/30 of top earners), **but registry versions
  are stale** (eu-ai-act listed at 1.2.2 vs PyPI 1.8.2) — re-publish to registry.

### 4. No examples — `Examples` = 3.3/10
Almost no package ships an `examples/` dir or ≥3 prompt→tool examples. This directly lowers
Glama/Smithery quality scores AND hurts LLM tool-selection. Cheap to fix at scale via the
generator (Phase 8): add an `examples/` block from each tool's docstring.

### 5. Thin docs surface — `Docs surface` = 3.4/10
Changelog / `.well-known/mcp-server-card.json` / per-MCP domain pages are sparse outside the
top flagships. Combined with the directory gap (#3), discoverability is the second structural
ceiling after transport.

> **What's already good (don't spend here):** Tool design 9.8, Reliability 9.8, Security 9.0,
> Tests 8.9, README 8.1, Metadata 8.4. The build quality is there.

---

## ⚠️ Republish landmines — 5 packages with BROKEN local source
These import-fail under Python 3.11 (AST). Their *published wheels* may still work (the gate
harness only ships importable wheels), but **the next republish from these dirs will break or be
blocked**. Fix the source (mostly em-dash / smart-quote unicode contamination) before any re-release.

| Package | DL/30d | Local error |
|---|---:|---|
| `meok-omnibus-tracker-mcp` | 1,129 | `SyntaxError L96: unterminated string literal` |
| `hash-utils-ai-mcp` | 895 | `SyntaxError L48: invalid char '—' (U+2014)` |
| `diff-ai-mcp` | 874 | `SyntaxError L4: invalid char '—' (U+2014)` |
| `database-universal-mcp` | (new) | `SyntaxError L5: invalid syntax` |
| `yaml-ai-mcp` | (new) | `SyntaxError L155: unterminated triple-quoted string` |

(3 more dirs — `meok-attestation-verify`, `meok-uk-adm-article22c-mcp`, `meok-drcf-agent-crosswalk-mcp`
— flagged "not importable" only because `server.py` is nested elsewhere; not true defects.)

---

## How to refresh this scoreboard
```bash
cd ~/clawd/mcp-marketplace/mcp-scorecard-mcp
python3.11 -m mcp_scorecard.runner \
  --root ~/clawd/mcp-marketplace \
  --out  ~/clawd/revenue/mcp_scoreboard_$(date +%F)
# directory presence (top earners), throttled:
python3.11 -c "from mcp_scorecard.directory import check_all; print(check_all('eu-ai-act-compliance-mcp'))"
```
Nightly via Ralph queue: feed `runner` + `directory` → re-emit this gap map (Phase 8 scorer task).
