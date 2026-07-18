# 🛠️ M4 SESSION ALIGNMENT — 2026-07-07

**Lane:** M4-Hermes (builder / substrate). **Purpose:** record what this M4 session shipped so the
surface lane (JEEVES/M2) + Hermes don't redo it. Same tree (`clawd-workspace` @ `m4-handoff-2026-06-24`),
same Care Floor 0.95 + BFT 22-of-33 + SIGIL. Honesty register throughout.

## What M4 SHIPPED this session (don't rebuild — extend)
| Area | State | Where |
|---|---|---|
| **Hatch = live overlay runtime** | LIVE | `meok-os-deploy/sovereign-embed.js` — see (screen-aware) + do (PDCA) + online/offline brain + memory namespaced to Hatch fingerprint. Browser-verified. |
| **Hatch package + legacy→Layer-0** | LIVE | `meok-os-deploy/api/hatch.js` — `?bridge=<key>` fronts any of 22 legacy systems; `pkg.trust` pulls **live ArkForge score**. |
| **ArkForge trust — DEPLOYED on the VM** | LIVE | `meok-backend` (35.242.143.249): `meok-trust.service` (systemd) → nginx `trust.35.242.143.249.sslip.io` → `MEOK_AI_URL` on os.meok.ai. Hatch carries `source:meok-ai/arkforge · silver · 0.68`. |
| **King-hive offline brain** | WARM | `meok-king-hive` (34.105.200.72) ollama `llama3.2:1b`+`3b`, generates (first load ~60s CPU). |
| **PyPI distribution** | 4 LIVE + cron | Published iso20022/dlms/edi/fix bridges (count→317). `_pypi_paced/` cron ships the safe **defence-filtered** 63 more, ~10/20min, self-removes when done. |
| **Killer demo** | LIVE | `meok-os-deploy/hatch-demo.html` → os.meok.ai/hatch-demo.html. |
| **MCP Registry** | READY | `meok-os-deploy/server.json` + `PUBLISH_MCP_REGISTRY.md` (owner: `mcp-publisher login`). |
| **Security** | PR up | MySQL 3306 locked at Docker layer (was open to world) + `meok-ai#5` scrubs 2 secrets. |
| **Provenance Hatch (Claude Science)** | STAGED | not built — the moat-on-top-of-Claude-Science; sign+verify real research claims. |

## 🚨 DEDUP — stop redoing these
- **Deep research = DONE** → `_alignment/RESEARCH_PACK_2026-07-07.md` (JEEVES). Do NOT re-run; absorb from it. (My re-run this session FAILED on session-limit and was redundant — proof of the problem.)
- **Distribution exists TWICE** → reconcile: JEEVES' **LEADS-GLOBE / finite-TAM** (`csoai_leads.db`, `distribution-globe.html`, 40th charter) is the *outbound/named-account* engine; M4's **PyPI + Hatch + MCP-registry** is the *inbound/discoverability* engine. They're complementary — ONE distribution story, two directions. Don't fork a third.
- **Trust/signing** → one SIGIL key everywhere; M4's ArkForge wire is now the live trust source. Surface lane should read it, not re-implement.

## OWNER SWITCHES (block both lanes — Nick only)
1. **Billing OFF on GCP project `meok-498012`** → VMs at risk; blocks firewall fixes. Re-enable.
2. **Rotate `CRON_SECRET`** (meok-ai) → then repo can go public.
3. **Set `SIGIL_SEED`** → signing becomes permanently sovereign (today = demo key).
4. **MCP Registry publish** (`mcp-publisher login github`).

## SAME-PATH PROTOCOL (to actually stay aligned)
1. **One branch** (`m4-handoff-2026-06-24`) — keep committing here; pull before big edits.
2. **Commit often** — don't leave work uncommitted (M2 has 4 uncommitted pricing pages at risk right now).
3. **Read `_alignment/` + `RESEARCH_PACK` + this file BEFORE researching or building** — the tree is the source of truth, not any single chat.
4. **`sovereign-temple`** is on its own branch (`fix/silent-noop-metrics`, 101 uncommitted) — reconcile or merge.
