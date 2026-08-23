# OWNERSHIP — 100 Moves (2026-08-23)

**CSOAI + MEOK + SovOS** · Measurement, not certification · Grounded in live signed estate

Four ownership levers: **Standards** · **Domain** · **Data** · **Trust** · **Distribution**

---

## Phase 1 — Standards (Moves 1–20) · *define the field*

| # | Move | Asset | Status |
|---|------|-------|--------|
| 1 | **Ship RECEIPT-SPEC-0.1** | `docs/SOVOS/RECEIPT-SPEC-0.1.md` | ✅ |
| 2 | Publish JSON Schema | `/.well-known/schemas/agent-measurement-card.schema.json` | ✅ |
| 3 | Register in SCITT profile | `/.well-known/scitt.json` → schema URL | 🔄 |
| 4 | `/receipt-spec` public page | React surface + download | 🔄 |
| 5 | Coordinate with draft-sirkkavaara-vaara-receipt | IETF list — differentiate firewall | Owner gate |
| 6 | Submit SCITT profile to scitt@ietf.org | Standards body filing | Owner gate |
| 7 | Agent2Agent receipt MIME registration | agent2agent@ietf.org | Owner gate |
| 8 | WEXP evidence export from verify walk | `/verify-walk.md` | ✅ |
| 9 | Media type `csoai.measurement-card/0.1` | In spec §2 | ✅ |
| 10 | Canonical JSON test vectors | `scripts/receipt-spec-vectors/` | 🔄 |
| 11 | `eunomia://` URI registry page | `/engine-axis` | ✅ |
| 12 | MCP well-known spine | `/.well-known/mcp.json` | Existing |
| 13 | Finance crossing schema | `GET /api/finance/bond-crossing` | ✅ |
| 14 | Eunomia router OpenAPI stub | `/api/instruments` | ✅ |
| 15 | Honesty register as normative doc | `docs/STACK_HONESTY.md` | ✅ |
| 16 | RFC 9943 statement types enumerated | scitt.json statements[] | ✅ |
| 17 | PQC roadmap in did.json (honest) | ML-DSA named when shipped | ✅ |
| 18 | Crosswalk JSON export | hive-frameworks.ts → API | 🔄 |
| 19 | ISO 42001 predicate IDs frozen | `/crosswalk` | Existing |
| 20 | Version RECEIPT-SPEC-0.2 only on breaking change | Changelog in spec | ✅ |

---

## Phase 2 — Domain (Moves 21–40) · *own the crossings*

| # | Move | Field |
|---|------|-------|
| 21 | Engine Axis public map | `/engine-axis` |
| 22 | Bond Venturi named thesis | `/venturi` |
| 23 | Axis 18 MEASURED synthetic crossing | `/api/finance/bond-crossing` |
| 24 | Eunomia Router = "OpenRouter of governance" | `/instruments` |
| 25 | 291 MCP routing table | `mcpRegistry.json` |
| 26 | 15 hive framework crosswalk | `hive-frameworks.ts` |
| 27 | COBOL→A2A bridge repo SPEC | `docs/cobol-a2a-bridge-mcp.md` |
| 28 | Insurer evidence pack | `/insurers` |
| 29 | Regulator brief lobby task | `regulator-brief` |
| 30 | Art 50 transparency page live | `/article-50` |
| 31 | SB 315 / US state tracker | `/regulation-tracker` |
| 32 | Finance anatomy API | `/api/finance/anatomy` |
| 33 | Settlement envelope stub (honest) | `/api/finance/settle` |
| 34 | x402 receipt MCP named | bond-venturi data |
| 35 | MEOK arena as eval source | `/gspc-arena` |
| 36 | Agent economy slot 23 PARTIAL | engine-axis |
| 37 | East-west slot 21 crosswalk | hive |
| 38 | Legacy bridge page | `/legacy` |
| 39 | Competitor matrix | `/competitors` |
| 40 | Domain flywheels documented | engine-axis.ts |

---

## Phase 3 — Data (Moves 41–60) · *moat compounds*

| # | Move | Moat |
|---|------|------|
| 41 | GSPC frozen bank | `GET /api/gspc` |
| 42 | 13/14 axes MEASURED honest | gspcAxes.ts |
| 43 | Corrections append-only ledger | `/api/corrections` |
| 44 | Regulation feed dated | `/api/regulation` |
| 45 | Benchmark-quality register | `/api/benchmark-quality` |
| 46 | Divergence layer API | `/api/cross` |
| 47 | HF dataset snapshots | huggingface.co/csoai |
| 48 | Arena round hashes signed | gspc-arena |
| 49 | MEOK→CSOAI sensory loop wire | PARTIAL |
| 50 | 335-card chain verifiable | did.json #card-attestation-1 |
| 51 | Refutation ledger | `/refutation-ledger` |
| 52 | ProvBench corpus | `/provbench` |
| 53 | Methodology DOI | Zenodo 10.5281/zenodo.21991104 |
| 54 | Library sector archive | `/library/:sector` |
| 55 | Intel landscape notes | `/intel` |
| 56 | Watchdog public DB | `/watchdog` |
| 57 | Agent registry | `/agents` |
| 58 | Feed.xml state changes | `/api/feed.xml` |
| 59 | llms.txt agent index | `/llms.txt` |
| 60 | No fake numbers policy | STACK_HONESTY |

---

## Phase 4 — Trust (Moves 61–80) · *stranger-verifiable*

| # | Move | Trust |
|---|------|-------|
| 61 | did:web trust root | `/.well-known/did.json` |
| 62 | 60-second verify walk | `/verify-walk.md` |
| 63 | gspc-verify client-side | `/gspc-verify` |
| 64 | Firewall charter | `/firewall-charter` |
| 65 | Honesty gate | `/honesty` |
| 66 | Never the scored doctrine | site-wide |
| 67 | Buyer-side regulatory hook | Art 50 / SB 315 |
| 68 | No certification claims | disclaimers |
| 69 | Key continuity doc | KEY-CONTINUITY |
| 70 | SCITT transparency planned (honest) | scitt.json |
| 71 | Timestamp authority: none (honest) | cards |
| 72 | Independence from vendors | `/compare` |
| 73 | Remediation partners firewall | `/remediation-partners` |
| 74 | Trust center honest gaps | `/trust-center` |
| 75 | Pressroom proof line | `/pressroom` |
| 76 | Singapore verify pack | council-os/ |
| 77 | Ed25519 today only | did.json |
| 78 | Stranger walk in agent runbook | `/agent-runbook` |
| 79 | Council OS consent lock | lobbyLink |
| 80 | DSH = same evidence as OS | `/dashboard` |

---

## Phase 5 — Distribution (Moves 81–100) · *get cited*

| # | Move | Channel |
|---|------|---------|
| 81 | **Launch post: RECEIPT-SPEC-0.1** | `/blog/receipt-spec-0-1` |
| 82 | Art 50 commentary (2 Aug 2026 live) | blog + `/article-50` |
| 83 | SB 315 deployer evidence angle | `/regulation-tracker` |
| 84 | Y-axis essay (measurement vs certification) | `/verifiable-trust` |
| 85 | Agent runbook curl page | `/agent-runbook` |
| 86 | MCP directory submissions | external |
| 87 | HF model card linking gspc | huggingface |
| 88 | Regulator outreach pack | `/for/regulator` |
| 89 | Insurer underwriting one-pager | `/insurers` |
| 90 | OpenRouter comparison SEO | `/instruments` |
| 91 | LinkedIn / X thread: verify walk | owner gate |
| 92 | IETF SCITT list intro | owner gate |
| 93 | A2A working group receipt MIME | owner gate |
| 94 | Podcast / briefing deck | `/pressroom` |
| 95 | Newsletter RSS corrections | `/api/feed.xml` |
| 96 | llms.txt update | ✅ |
| 97 | Sitemap all new routes | sitemap.xml |
| 98 | DSH onboarding CTA | `/dashboard` |
| 99 | Council OS deep links everywhere | lobbyLink |
| 100 | Weekly board delta post | owner gate |

---

## Execute order (GO)

**Today (in-lane):** 1–4, 13, 81, 85, 96–97  
**This week (owner gate):** 6–7, 91–93, 100  
**This month:** 10, 18, 27, 49, 86–888

**Tipping move:** Ship spec (#1) + get cited (#81–99). Standards adoption + distribution compound.
