# ENSEMBLE INGEST REPORT — 2026-06-15 02:40:07 UTC

## Phase 1: Ingest
```
Ensemble Ingest — 03:40:07
  Hindsight: http://localhost:8765
  Bank: meok-empire
  Files: 28
  [1/28] revenue/PRICING_SOURCE_OF_TRUTH.md (8016 chars)... OK
  [2/28] revenue/MASTER_ACTION_LIST_2026-05-05.md (8016 chars)... OK
  [3/28] revenue/ALIGNMENT_2026-04-29.md (8016 chars)... OK
  [4/28] revenue/CARE_HOME_COLD_LIST_2026-04-29.md (6266 chars)... OK
  [5/28] revenue/CARE_HOME_EMAILS_READY_TO_SEND_2026-05-09.md (8016 chars)... OK
  [6/28] revenue/COLD_EMAILS_V2.md (8016 chars)... OK
  [7/28] revenue/LINKEDIN_DMS_READY_TO_SEND.md (7437 chars)... OK
  [8/28] revenue/LIVE_PAYMENT_LINKS_2026-05-09.md (2266 chars)... OK
  [9/28] revenue/COMPETITIVE_SCORECARD_100_ROADMAP.md (8016 chars)... OK
  [10/28] revenue/BLUEPRINT_PIVOT_PLAN.md (6054 chars)... OK
  [11/28] revenue/DEEP_RESEARCH_LIVING_TOPOLOGY_2026-05-09.md (6078 chars)... OK
  [12/28] revenue/OUTREACH_MACHINE_2026-05-09.md (8016 chars)... OK
  [13/28] revenue/MULTI_PHASE_ACTION_PLAN_2026-05-09.md (8016 chars)... OK
  [14/28] revenue/BLOCKERS_2026-04-27.md (8016 chars)... OK
  [15/28] revenue/EOD_AUDIT_2026-04-27.md (7509 chars)... OK
  [16/28] revenue/NLNET_GRANT_DRAFT_2026-04-26.md (6193 chars)... OK
  [17/28] revenue/MCP_MASTER_REFERENCE.md (8016 chars)... OK
  [18/28] _TOPOLOGY/MASTER_INDEX.md (8016 chars)... OK
  [19/28] _TOPOLOGY/DOMAINS.md (8016 chars)... OK
  [20/28] _TOPOLOGY/REVENUE_OPPORTUNITIES.md (8016 chars)... OK
  [21/28] _TOPOLOGY/A2A_GAPS.md (8016 chars)... OK
  [22/28] legal/TERMS_OF_SERVICE.md (7773 chars)... OK
  [23/28] legal/PRIVACY_POLICY.md (7125 chars)... OK
  [24/28] stripe-activation-guide.md (1332 chars)... OK
  [25/28] unified-portfolio-catalog/stripe-products.json (8016 chars)... OK
  [26/28] audits/stripe-audit-2026-04-13.md (8016 chars)... OK

  Done: 26 ingested, 0 failed
  Bank stats: {
  "bank_id": "meok-empire",
  "total_nodes": 619,
  "total_links": 22369,
  "total_documents": 1343,
  "nodes_by_fact_type": {
    "experience": 332,
    "world": 287
  },
  "links_by_link_type": {
    "temporal": 8899,
    "entity": 2730,
    "semantic": 10739,
    "caused_by": 1
  },
  "links_by_fact_type": {
    "experience": 12184,
    "world": 10185
  },
  "links_breakdown": {
    "experience": {
      "temporal": 4860,
      "entity": 1613,
      "semantic": 5711
    },
    "world": {
  
```

## Phase 2: Gap Analysis
```
Knowledge Gap Analysis:
  SOV3: 14301 episodes
  Hindsight: {"bank_id": "meok-empire", "total_nodes": 619, "total_links": 22369, "total_documents": 1343, "nodes_by_fact_type": {"experience": 332, "world": 287}, "links_by_link_type": {"temporal": 8899, "entity"
  OK:  pricing — 'Stripe is pricing the Starter membership at £79/month, while the monetization en'
  OK:  domains — 'List premium unused domains for resale. | Involving: userok-AI agent'
  OK:  stripe — 'Stripe £150/mo recurring product | Involving: user'
  OK:  mcps — 'PyPI other CSOAI-affiliated packages (verified): 21+ (eu-ai-act-compliance-mcp, '
  OK:  grants — 'Open-source MCP-server toolkit for generating cryptographically signed complianc'
  OK:  outreach — 'Plus 7+ more (dashboard, chatbot, lead-capture-api, sales-one-pagers, suicidesto'
  OK:  legal — 'Legal Obligations | Involving: We may disclose data to comply with applicable la'

  No critical gaps found!
```

## Phase 3: One-Shot Recall Test
```
Q: What are MEOK product prices?
  [1] () Stripe is pricing the Starter membership at £79/month, while the monetization engine defines the MEOK Core Pack at £49/month. | When: May 31, 2026 | Involving: Meok-empire (AI agent) – assistant | There are conflicting pricing models for the Starter membership, creating a mismatc
  [2] () Revenue-Ready | When: LIVE, 3 pages, pricing $99/mo/$499/mo | Involving: meok-empire (AI agent — first-person statements like "I did X" are the agent's own actions; classify as "assistant"
  [3] () The monetization_engine.py maps MEOK packs to bundle Stripe product IDs, but defines DIFFERENT prices than what Stripe actually charges. | When: Sunday, May 31, 2026 | Involving: meok-empire (AI agent — first-person statements like "I did X" are the agent's own actions; classify 

Q: Which MCP packages have the most installs?
  [1] () PyPI other CSOAI-affiliated packages (verified): 21+ (eu-ai-act-compliance-mcp, ai-bom-mcp, dora-compliance-mcp, etc.) | Involving: user
  [2] () PyPI other CSOAI-affiliated packages (verified): 21+ (eu-ai-act-compliance-mcp, ai-bom-mcp, dora-compliance-mcp, etc.) | Involving: user
  [3] () PyPI Package: a2a-governance-bridge-mcp | When: Sunday, May 31, 2026 | Involving: meok-empire (AI agent — first-person statements like "I did X" are the agent's own actions; classify as "assistant")

```

## Entities Snapshot
```
Hindsight Entities:
  Total: 100
  Entity                                             | Mentions
  -----------------------------------------------------------------
    meok-empire                                        | 53
    user planning wedding, wants small outdoor ceremony. Just got back from Emily's wedding, she married Sarah at a rooftop garden. It was nice weather. I grabbed a coffee on the way. | 25
    Claude                                             | 24
    AI agent                                           | 22
    meok-empire (AI agent — first-person statements like "I did X" are the agent's own actions; classify as "assistant") | 21
    UK Care Home Cold-List                             | 13
    meok.ai                                            | 13
    Postgres                                           | 12
    Twilio                                             | 12
    SMTP                                               | 12
    Saturday, May 09, 2026                             | 10
    EU AI Act                                          | 9
    Stripe                                             | 8
    wedding                                            | 8
    Blueprint                                          | 7
    Emily (user's friend)”,                            | 5
    wedding planning                                   | 5
    MEOK AI Labs                                       | 4
    user's roommate                                    | 4
    eu-ai-act                                          | 4
    MCP Registry                                       | 4
    PyPI                                               | 4
    details                                            | 4
     CSOAI                                             | 3
    credit scoring                                     | 3
    care home                                          | 3
    UK AI Bill                                         | 3
    Smartlead                                          | 3
    Apollo                                             | 3
    Emily (user's friend)                              | 3
    MEOK Family                                        | 2
    price_xxxxx                                        | 2
    MEOK Sovereign                                     | 2
    data                                               | 2
    UK Information Commissioner's Office               | 2
    UK GDPR                                            | 2
```

---

# SUMMARY

## Ingest Summary

- **Files in priority list:** 28
- **Successfully ingested:** 26
- **Failed (Hindsight errors):** 0
- **Skipped (file not found):** 2 — `grants/nlnet/READY-TO-SUBMIT.md`, `grants/innovate-uk/READY-TO-SUBMIT.md` (paths referenced in PRIORITY_FILES but not on disk; ensemble_engine.py silently skips missing files at line 175-176)
- **Errors during ingest:** 0 Hindsight errors
- **Entities in Hindsight bank:** 100 (top: `meok-empire` 53, `Claude` 24, `AI agent` 22, `MEOK AI Labs` 4, `Stripe` 8, `PyPI` 4, `MCP Registry` 4, `EU AI Act` 9, `UK AI Bill` 3)
- **Bank stats after ingest:** 619 nodes, 22,369 links, 1,343 documents, 332 experience / 287 world nodes

## Gap Closure

- **Areas tested:** 7 (pricing, domains, stripe, mcps, grants, outreach, legal)
- **Gaps remaining (critical):** 0
- **Gap closure %:** 100% (7/7 categories now return Hindsight results — was 0/7 at 03:02 gap analysis)
- Verdict: all 7 knowledge gaps surfaced at 03:02 are now closed.

## Recall Result

**Q1: "What are MEOK product prices?"**
- Top hit: "Stripe is pricing the Starter membership at £79/month, while the monetization engine defines the MEOK Core Pack at £49/month." (with caveat: conflicting pricing models between Stripe and monetization_engine.py)
- Other hits: \$99/mo / \$499/mo revenue-ready pricing; monetization_engine vs Stripe price mismatch warning.
- Note: answer surfaces a real **pricing inconsistency** — the data exists, but the two sources disagree. This is a finding, not a gap.

**Q2: "Which MCP packages have the most installs?"**
- Top hits: 21+ CSOAI-affiliated PyPI packages (eu-ai-act-compliance-mcp, ai-bom-mcp, dora-compliance-mcp, etc.) and a2a-governance-bridge-mcp.
- Note: Hindsight returns *which packages exist* but does **not** return install counts / download numbers. Recall confirms catalog but not metrics — that's the next gap to fill (see below).

## Next Gaps

1. **MCP install counts** — recall returns package names but not actual PyPI download statistics. Need a `pypistats.org` or `pypinfo` ingest (or a snapshot CSV).
2. **Pricing consistency** — Stripe and monetization_engine.py disagree on prices. Need a reconciliation ingest (PRICING_SOURCE_OF_TRUTH.md should be authoritative; older data may be stale).
3. **Grant READY-TO-SUBMIT files missing** — the priority list references `grants/nlnet/READY-TO-SUBMIT.md` and `grants/innovate-uk/READY-TO-SUBMIT.md` but only `grants/NLNET_NGI_ZERO_COMMONS_2026.md` exists. Either the files were never written or the paths in PRIORITY_FILES need updating.
4. **Entity extraction noise** — Hindsight is treating full memory sentences as entity names (e.g., "user planning wedding, wants small outdoor ceremony..." appears as a top-5 entity with 25 mentions). May need to ingest a domain glossary or prune noise entities.
5. **SOV3 has 14,301 episodes vs Hindsight 619 nodes** — large asymmetry; SOV3 long-term memory is mostly not yet in Hindsight. Consider a bulk SOV3→Hindsight sync pass.
