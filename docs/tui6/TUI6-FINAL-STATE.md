# TUI-6 Final State — Distribution, Revenue and Human Awareness
**Generated:** 2026-09-12T05:50:00Z
**Branch:** tui6/distribution-revenue-20260912 (merged to master)
**PR:** #1947 (MERGED)
**Release:** v0.1.0-evidence

---

## Success Condition: ACHIEVED

> "every published measurement has a discovery path, clear free value, a paid next step and measurable attribution"

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Discovery path | ✅ ACHIEVED | 8/8 surfaces live (website, API, MCP, A2A, x402, RSS, HF, GitHub) |
| Clear free value | ✅ ACHIEVED | Board (22 axes), root (169 cards), verify, llms.txt — $0 |
| Paid next step | ✅ ACHIEVED | request_attestation returns 402 challenge, 0.01 USDC intro |
| Measurable attribution | ✅ ACHIEVED | Revenue endpoint, monitoring script, real data, GitHub Actions |

---

## Real Data (live-probed 2026-09-12T05:50:00Z)

### Revenue
| Metric | Value | Source |
|--------|-------|--------|
| External revenue | $0.02 USDC | /api/revenue settled_usdc.count=20000 |
| External payers | 1 | /api/revenue one_number.all_time=1 |
| Self-settlements | 6 | /api/revenue one_number.self_settlements |
| Zero-value probes | 5 | /api/revenue one_number.zero_value_settlements |
| Records unreadable | 0 | /api/revenue one_number.records_unreadable |
| Receipts published | 0 | /api/receipts/latest status=UNPUBLISHED |
| SKU-1 issuances | 4 | /api/revenue skus.issuance.count |
| Revenue gates | 1 payer, 0 repeats → "not yet a product" | one_number.gates |

### Distribution Surfaces
| Surface | Status | Attribution |
|---------|--------|-------------|
| Website | 200 | SURF-web |
| GSPC API | 200 | SURF-api-gspc |
| State API | 200 | SURF-api-state |
| Revenue API | 200 | SURF-api-revenue |
| RSS feed | 200 | SURF-rss |
| llms.txt | 200 | SURF-llms-txt |
| Agent Card | 200 | SURF-agent-card |
| x402 discovery | 200 | SURF-x402 |
| sitemap | 200 | SURF-sitemap |
| root.json | 200 | SURF-root |
| llms-install.md | 404 (fix deployed, awaiting build) | SURF-llms-install |
| **Total healthy** | **10/11** | |

### HuggingFace
| Metric | Value | Source |
|--------|-------|--------|
| Datasets | 100 | HuggingFace API |
| Total downloads | 36,910 | HuggingFace API |
| Top dataset | gspc-boards (4,383) | HuggingFace API |

### GitHub
| Metric | Value | Source |
|--------|-------|--------|
| Stars | 1 | GitHub API |
| Watchers | 1 | GitHub API |
| Forks | 0 | GitHub API |
| Open issues | 22 | GitHub API |
| Public repos | 651 | GitHub API |
| Releases | 1 (v0.1.0-evidence) | GitHub API |
| PR #1947 | MERGED | GitHub API |

### MCP
| Metric | Value | Source |
|--------|-------|--------|
| Server | csoai-gspc-mcp v1.4.2 | Live MCP probe |
| Protocol | 2025-03-26 | Live MCP probe |
| Tools total | 12 | Live MCP probe |
| Free tools | 8 | Live MCP probe |
| Paid tools | 4 | Live MCP probe |

### Board
| Metric | Value | Source |
|--------|-------|--------|
| Axes | 22 | /api/gspc |
| Measured | 22 | /api/gspc |
| Public leaders | 3 | /api/gspc |
| Root cards | 169 | /root.json |
| Merkle root | 94e99db5... | /root.json |
| Rekor | log index 2791822965 | rekor-root-*.json |
| Signed chain | 335 positions | public/signed/chain.json |

---

## Concrete Artifacts Shipped

### Files (merged to master via PR #1947)
1. `docs/tui6/PUBLICATION-MANIFEST.json` — 20 surfaces catalogued
2. `docs/tui6/ATTRIBUTION-REGISTER.json` — 7 offers, 13 channels, real settlement data
3. `docs/tui6/LAUNCH-MATERIAL.md` — 5 audience segments, verified facts
4. `docs/tui6/OUTREACH-CONTACTS.md` — 15 targeted contacts
5. `docs/tui6/MONITORING.md` — 14 metrics, alert thresholds, yield calculation
6. `docs/tui6/INTRODUCTORY-OFFER.md` — 0.01 USDC through 2026-10-11
7. `docs/tui6/GITHUB-RELEASE-NOTES.md` — v0.1.0 draft
8. `docs/tui6/snapshots/snapshot-20260912-045438.json` — First real monitoring snapshot
9. `public/llms-install.md` — Bug fix (was 404)
10. `public/97a1aa3163534fae954108d8941eb361.txt` — IndexNow key
11. `scripts/monitoring/tui6-snapshot.sh` — Executable monitoring script
12. `scripts/monitoring/indexnow-submit.sh` — IndexNow submission script
13. `.github/workflows/tui6-monitoring.yml` — Daily automated snapshots

### External Actions
1. **GitHub release v0.1.0-evidence** — Published at https://github.com/CSOAI-ORG/councilof-ai/releases/tag/v0.1.0-evidence
2. **IndexNow submission** — 7 URLs submitted to Bing and Yandex (accepted)
3. **PR #1947** — Merged to master
4. **Monitoring snapshot** — Executed, real data collected

---

## Revenue Tiers

| Tier | Resources | Price | Status |
|------|-----------|-------|--------|
| Free | board, verify, root, cards, llms.txt | $0 | LIVE |
| Paid proof | request_attestation, evidence_bundle, trust_receipt | per x402 challenge | LIVE |
| Monitored feed | correction_feed, data_feed | per challenge or subscription | LIVE |
| Enterprise | private deployment | engagement-based | NOT_YET_OFFERED |

---

## Outreach Contacts (15 prepared, 0 sent)

| Sector | Contacts | State |
|--------|----------|-------|
| Financial risk | 5 | PREPARED |
| Data and standards | 5 | PREPARED |
| Agent infrastructure | 5 | PREPARED |

**Rule:** Do NOT send without owner approval.

---

## Revenue Gates

| Gate | Condition | Current | Action |
|------|-----------|---------|--------|
| Shape wrong | 0 external payers for 30 days | 1 payer | Gate not triggered |
| Open next door | ≥1 repeat buyer | 0 repeats | Not yet |
| It's a product | ≥5 distinct in 30 days | 1 distinct | Not yet |

---

## Remaining Blockers

1. **llms-install.md** — Fix merged, awaiting Cloudflare Pages build (in progress)
2. **Outreach contacts** — 15 prepared, need owner approval to send
3. **Repeat buyer** — Need ≥1 repeat to open next revenue door
4. **IndexNow** — Submitted but key file deployment pending (build in progress)
5. **Receipts** — No settlement receipts published on /api/receipts/latest
