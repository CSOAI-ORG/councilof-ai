# TUI 5 — GitHub, Hugging Face and Kaggle Discoverability
**Generated:** 2026-09-11T15:00:00Z
**Basis:** master (3d9da9ae)
**Verification:** Live API probes + subagent audit

---

## GitHub (CSOAI-ORG)

### Account
| Field | Value |
|-------|-------|
| Account type | **User** (not Organization) |
| Public repos | **651** |
| Followers | 8 |
| Homepage | https://councilof.ai |

### Pinned Repos (6 of 6 — ALL SLOTS USED)

| # | Repo | What |
|---|------|------|
| 1 | dora-compliance-mcp | DORA tooling |
| 2 | eu-ai-act-compliance-mcp | EU AI Act corpus |
| 3 | csoai-cra-annex-iv-classifier-mcp | CRA classifier |
| 4 | csoai-governance-engine-mcp | 13 frameworks MCP |
| 5 | csoai-mcp-injection-scan-mcp | Injection scanning |
| 6 | csoai-watermark-attest-mcp | Art 50 watermarking |

**CRITICAL:** Neither `councilof-ai` (flagship) nor `gspc-board` (living board) is pinned.

### councilof-ai (Flagship)
| Field | Value |
|-------|-------|
| Description | CSOAI flagship — 425 stablecoins indexed, 371 signed cards, 22 axes measured, MCP/A2A/x402 |
| Homepage | https://councilof.ai |
| Default branch | master |
| Language | TypeScript |
| Topics (12) | mcp, gspc, measurement, a2a, x402, ed25519, governance, scitt, attestation, eu-ai-act, mcp-server, provenance |
| Latest release | **NONE** |
| CI status | ✅ conflict-guard + eval-ci green |
| Stars | 0 |
| Pinned | **NO** |

### gspc-board (Board Mirror)
| Field | Value |
|-------|-------|
| Description | GSPC Board — 22-axis AI measurement, Ed25519-signed cards, Merkle-rooted |
| Homepage | https://councilof.ai/api/gspc |
| Topics (14) | ai-governance, ai-safety, attestation, benchmark, council-of-ai, ed25519, eu-ai-act, gspc, llm-evaluation, measurement, open-data, provenance, signed-evidence, transparency |
| Pinned | **NO** |

### Repository Categories (top 200)
- MCP servers: ~100+
- Site repos: ~20
- Hive repos: ~8
- Core infra: ~10
- MEOK ecosystem: ~8
- Forks (awesome-*): 21

### Profile README
- Status: ✅ Rich auto-derived profile (daily refresh)
- Contains: 22-axis GSPC table, integrity stack, verification walkthrough, revenue transparency
- Community health: CODE_OF_CONDUCT, CONTRIBUTING, SECURITY, SUPPORT present

---

## Hugging Face (csoai)

### Organization
| Field | Value |
|-------|-------|
| URL | https://huggingface.co/csoai |
| Fullname | Council of AI |
| Type | org (team plan) |
| Followers | 1 |

### Inventory
| Type | Count | Top downloads |
|------|-------|---------------|
| Datasets | **100** | gspc-boards (4,383), gspc-hub-cards (3,105), hub-queue (3,015) |
| Spaces | **42** | gspc-node (Docker, 200), gspc-governance-leaderboard (Gradio, 200) |
| Models | **2** | clan-csoai-plain, council-safe (own-model-excluded) |
| Collections | **6** | GSPC measured governance, signed evidence, censuses/readers, printers, 22 axes, board+verify+flywheel |

### Total Downloads: ~25,000+

### Superseded Spaces (3)
| Space | State | Replacement |
|-------|-------|-------------|
| gspc-flywheel | RETIRED | gspc-board or gspc-node |
| gspc-live-board | SUPERSEDED | gspc-board |
| gspc-governance-leaderboard-spc | SUPERSEDED | gspc-governance-leaderboard |

### Note on Static SDK Spaces
Static SDK spaces return HTTP 404 on direct `.hf.space` URLs. This is normal HF behavior — they render via iframe on `huggingface.co/spaces/csoai/...`. NOT outages.

---

## Kaggle

### Account
| Field | Value |
|-------|-------|
| Account | `nicktempleman` (personal — no CSOAI org on Kaggle) |
| Authenticated | ✅ `~/.kaggle/kaggle.json` present |

### CSOAI-Related Datasets (19)
| Dataset | Downloads | Status |
|---------|-----------|--------|
| csoai-gspc-living-board | 68 | Active |
| csoai-signed-measurement-cards | 137 | ARCHIVED |
| csoai-corpus-baselines | 48 | Active |
| gspc-defbench | 50 | DEPRECATED → gspc-det |
| gspc-ossbench | 33 | DEPRECATED → gspc-oss |
| gspc-govbench | 47 | DEPRECATED → gspc-agi |
| gspc-sim-cards | 9 | Active |
| gspc-hf-model-census | 2 | Active |
| gspc-kernel-results | 6 | Active |
| 8 HOLD parallel banks | 2-6 each | HOLD (not live axis) |

**Total Kaggle downloads:** ~419

### Note
No verified public CSOAI dataset in the Kaggle API under a `csoai` organization. All content under personal `nicktempleman`.

---

## Site Metadata Audit

| Item | URL | Status |
|------|-----|--------|
| RSS feed | https://councilof.ai/feed.xml | ✅ 200 |
| Sitemap | https://councilof.ai/sitemap.xml | ✅ 200 |
| llms.txt | https://councilof.ai/llms.txt | ✅ 200 |
| Agent Card | https://councilof.ai/.well-known/agent-card.json | ✅ 200 |
| JSON-LD | Embedded in index.html | ✅ Present |
| OG tags | og:title, og:description, og:image | ✅ Present |

---

## Recommendations (NOT implemented — audit only)

1. **Pin `councilof-ai` and `gspc-board`** — Replace 2 compliance MCP pins with flagship + board
2. **Create first GitHub release** on councilof-ai — Tag current signed root
3. **Create CSOAI Kaggle org** — Move from personal `nicktempleman` to org
4. **Archive 3 deprecated Kaggle datasets** — defbench, ossbench, govbench
5. **Archive 3 superseded HF Spaces** — flywheel, live-board, leaderboard-spc
6. **Note:** Account type is User not Org — limits team/security features
