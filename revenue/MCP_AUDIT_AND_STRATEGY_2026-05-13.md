# MCP Package Audit & Growth Strategy
**Date:** 2026-05-13
**Status:** All 3 audit agents completed. Critical bugs fixed. Strategy compiled.

---

## BUGS FIXED THIS SESSION

| Fix | Packages | Impact |
|-----|----------|--------|
| Broken double-try auth syntax | 10/15 packages | Confusing error paths for PyPI users |
| `structured_output`/`error_output` embedded in FastMCP instructions | 11/15 packages | 40 lines of dead Python polluting LLM context |
| `check_access` NameError (watermarking) | 1 package | Every tool crashed at runtime |
| `_MEOK_API_KEY` undefined (watermarking) | 1 package | Auth fallback broken |
| CSOAI-ORG brand references | 75+ files across 15 packages | Severed brand leaking everywhere |

**All 15 packages now parse cleanly (verified via `ast.parse`).**

---

## FULL SCORECARD

| # | Package | DL/mo | Tools | Code | Docs | Tests | Overall |
|---|---------|-------|-------|------|------|-------|---------|
| 1 | eu-ai-act-compliance | 1,327 | 11 | 7 | 8 | 4 | 6.5 |
| 2 | bias-detection | 1,196 | 5 | 7 | 4 | 1 | 4.5 |
| 3 | ai-bom | 1,034 | 4 | 6 | 3 | 5 | 5.0 |
| 4 | dora-compliance | 842 | 9 | 8 | 4 | 2 | 5.3 |
| 5 | nis2-compliance | 812 | 7 | 7 | 4 | 5 | 5.8 |
| 6 | cra-compliance | 765 | 7 | 8 | 4 | 3 | 5.5 |
| 7 | ai-incident-reporting | 251 | 3 | 7 | 7 | 3 | 5.8 |
| 8 | dora-nis2-crosswalk | 228 | 4 | 4 | 6 | 1 | 4.3 |
| 9 | prompt-injection-firewall | 168 | 5 | 6 | 6 | 3 | 5.5 |
| 10 | handoff-certified | 151 | 5 | 6 | 5 | 1 | 4.5 |
| 11 | policy-enforcement | 150 | 6 | 7 | 5 | 1 | 4.8 |
| 12 | audit-logger | 148 | 5 | 6 | 7 | 1 | 5.0 |
| 13 | uk-ai-act | 146 | 5 | 5 | 7 | 2 | 4.8 |
| 14 | rate-limiter | 144 | 6 | 6 | 2 | 1 | 3.8 |
| 15 | watermarking-authenticity | 143 | 5 | 2 | 5 | 2 | 3.3 |

**Totals:** 7,505 downloads/month, 87 tools, 0 Pydantic models, 0 functional tests, 0 MCP resources/prompts.

---

## COMPETITIVE LANDSCAPE

### Direct Competitors
| Competitor | Regulations | Key Advantage | Weakness |
|-----------|-------------|---------------|----------|
| **Ansvar Systems** | 61 EU regulations, 4,095 articles | Daily EUR-Lex sync, hosted endpoint, country-law MCPs | Low stars (11), no monetization |
| **ArkForge** | EU AI Act codebase scanner | Stripe tiers, CI/CD integration, Trust Layer | Narrow (1 regulation only) |
| **AIR Blackbox** | EU AI Act + bias detection | Fine-tuned local LLM, framework-aware | Low visibility |
| **EuConform** | Risk classification + bias | 100% offline, privacy-first | Basic features |

### Our Unique Advantages
- Only suite combining: attestation API + watermark compliance + DORA/NIS2 crosswalk + omnibus tracker + bias detection + injection scanning
- 7,500 downloads/month (more than any competitor in governance niche)
- 87 tools across 15 packages (broadest tool surface)
- Already monetized with Stripe (just need first paying customer)

### Our Critical Gaps vs. Ansvar
- They have 61 regulations in ONE MCP vs our 15 separate packages
- They have daily EUR-Lex auto-sync vs our hardcoded summaries
- They have hosted endpoint (`mcp.ansvar.eu`) vs our pip-install-only
- They have 16 country-specific law MCPs vs our EU-only focus

---

## DISTRIBUTION CHANNELS (submit to ALL)

| Channel | Size | Status | Action |
|---------|------|--------|--------|
| Official MCP Registry | Preview | 8/15 listed | Publish remaining 7 |
| Glama.ai | 23,400+ | Auto-indexed | Verify metadata |
| mcp.so | 20,000+ | Issue #2170 pending | Follow up |
| Smithery | 7,000+ | Not listed | `smithery mcp publish` |
| PulseMCP | 12,650+ | Not listed | Submit via nav button |
| MCP Market | 10,000+ | Not listed | Submit |
| MCPize | Marketplace | Not listed | **REGISTER BEFORE JUNE 10 (85% rev share)** |
| Desktop Extensions | Curated | Not built | Build .mcpb package |
| punkpeye/awesome-mcp-servers | GitHub | Not listed | Submit PR |
| wong2/awesome-mcp-servers | GitHub | PR pending | Follow up |
| tolkonepiu/best-of-mcp-servers | Auto-ranked | Not listed | PR to projects.yaml |

---

## STRATEGIC ROADMAP

### Phase 1: Fix & Ship (This Week)
1. ✅ Fix syntax errors in 10 packages
2. ✅ Remove dead structured_output code from 11 packages
3. ✅ Fix watermarking NameError
4. ✅ Scrub CSOAI-ORG from 75+ files
5. [ ] Version bump all 15 packages
6. [ ] Republish to PyPI
7. [ ] Register on MCPize as founding member (deadline: June 10)

### Phase 2: Quality Upgrade (Next Week)
8. [ ] Add Pydantic input/output models to flagship (eu-ai-act)
9. [ ] Write 1 functional test per tool in top 5 packages
10. [ ] Rebuild READMEs with badges, GIF demos, copy-paste install commands
11. [ ] Audit tool descriptions for token efficiency (<200 chars each)
12. [ ] Build .mcpb desktop extension for hero product

### Phase 3: Distribution Blitz (Week After)
13. [ ] Deploy consolidated remote endpoint on Cloudflare Workers
14. [ ] Submit to ALL 11 directories listed above
15. [ ] Show HN + Reddit (r/compliance, r/cybersecurity) + Product Hunt launch
16. [ ] Publish weekly content (blog posts, tutorials, case studies)

### Phase 4: Consolidation (Month 2)
17. [ ] Merge top packages into mega-MCP (`meok-eu-governance`)
18. [ ] Add real regulation text via EUR-Lex API
19. [ ] Build CI/CD scanner (like ArkForge)
20. [ ] Add country-specific law MCPs (UK, Germany, France)

---

## KEY METRICS TO TRACK

| Metric | Current | Target (30 days) | Target (90 days) |
|--------|---------|-------------------|-------------------|
| PyPI downloads/month | 7,505 | 15,000 | 50,000 |
| GitHub stars (total) | 0 | 200 | 1,000 |
| MRR | £0 | £500 | £3,000 |
| Directory listings | 1 (MCP Registry partial) | 8+ | All 11 |
| Functional tests | 0 | 25 | 100 |
| Pydantic models | 0 | 10 | 50 |
