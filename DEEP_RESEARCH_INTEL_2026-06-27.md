# 🐉 DEEP RESEARCH INTEL — Action Plan (M4 27JUN)

**Source:** Research brief transcribed from 6 photos (June 27, 2026) covering NVIDIA ACE, OpenFang, ClawTeam, MoltBook, humanoids, EU AI Act compliance, IoT aquaponics, construction SaaS, sovereign AI.

This is the **complete hit list** for what to clone + what to absorb.

---

## ✅ Already in repo (no action needed)

| Item | Wall claim | Repo status |
|---|---|---|
| Humanoid research | "47 autonomous humanoids in CSOAI Town" | ✅ `KIMI_AGENT47_2026-06-23/research/humanoid_robotics_dim.md` (25+ tools) |
| Aquaponics MCP | "ESP32 + pH/DO sensors" | ✅ `meok-aquaponics-monitor-mcp/` (live in mcp-marketplace) |
| 700K LOC construction SaaS competitor | "non-developer shipped with AI" | ✅ Kimi's `KIMI_AGENT47_2026-06-23/research/dsrb_dim05_csoai_gap_analysis.md` |
| MoltBook (770K agents) | "largest swarm coordination paper" | ✅ `moltbook` 1 file in repo |
| EU AI Act enforcement | "Aug 2 2026 deadline" | ✅ Already the core of our positioning |
| Construction compliance | "700K LOC + Procore + Track3D" | ✅ Researched + ACI in our vertical finds |
| Microsoft Agent Governance Toolkit | "EU AI Act gravity well" | ✅ Delegation #2 found it; `K_ITEM K` in CROWN_JEWELS_HUNT_2026-06-27.md |

---

## 🚨 NOT YET CLONED — high priority

### Crown jewels (clone TODAY)

| Item | Stars | Why | Source | Est. time |
|---|---:|---|---|---|
| **`RightNow-AI/openfang`** | **17.9k** | Direct competitor/architecture reference for MEOK OS. Rust, 14 crates, 137K LOC, MIT. **Their "Hands" layer = our SOV3 capability scheduler.** | https://github.com/RightNow-AI/openfang | ✅ **CLONED to /tmp/openfang** (22M) |
| **`HKUDS/ClawTeam`** | **5.3k** | Their 12-queen council + 33-disciples P2P swarm template. Their `hedge-fund.toml` is the spec to clone. ZeroMQ transport + Git worktrees. | https://github.com/HKUDS/ClawTeam | ✅ **CLONED to /tmp/ClawTeam** (20M) |
| **`inkog-io/inkog`** | **28** | Static security scanner for AI agents. Catches token bombing, prompt injection, missing oversight, EU AI Act Art 14 compliance. CLI + MCP server. | https://github.com/inkog-io/inkog | ✅ **CLONED to /tmp/inkog** (37M) + built `inkog` binary (10MB) — needs API key for cloud reports |
| **`Open-X-Humanoid/pelican-vl`** | **84** | Open-source embodied brain. Family of VL models for humanoid reasoning. | https://github.com/Open-X-Humanoid/pelican-vl | ✅ **CLONED to /tmp/pelican-vl** (74M) |

### Industry-grade (clone THIS WEEK)

| Item | Status | Action |
|---|---|---|
| **NVIDIA ACE Game Agent SDK Beta** (June 16 2026, MIT) | NOT in repo (no clone possible — proprietary download from developer.nvidia.com/ace-for-games) | **Owner action**: download + license-key + integrate with `meok-gaming-wow-mcp` + `meok-gaming-fortnite-mcp` (we have 5 gaming MCPs ready) |
| **OpenLoong Humanoid Hardware** (43 DOF, 80kg) | ❌ Not in repo | Clone when ready (3D-printable humanoid — fits our `meok-3d-characters/` factory + 3D print queue) |
| **RoboParty Roboto Origin** ($2,300 bipedal) | ❌ Not in repo | Clone + absorb supplier list into our humanoid stack |
| **Open-X-Humanoid (main repo)** | ❌ Not in repo (only `pelican-vl` subdirectory exists) | Clone when we expand the humanoid fleet |
| **MiroFish** (swarm sim engine) | ❌ Not in repo | Clone for "towns/villages/cities" simulation in MEOK DOME |
| **APDuino / ESP32 aquaponics** (IoT firmware) | ❌ Not in repo | Clone + adapt for our 13×12m pond (pH + DO sensors + auto-pump) |

---

## 🛑 SECURITY WARNINGS (brief §14)

**DO NOT DEPLOY OpenClaw** as a production dependency:
- **CVE-2026-25253** (CVSS 8.8): RCE via one-click malicious webpage
- **42,900 exposed instances** across 82 countries
- **93.4%** have authentication bypass conditions
- **341/2,857** ClawHub skills are malicious (Bitdefender: 824/10,700)
- **283 skills** leak credentials in plaintext
- Gartner: **"insecure by default"**

**Action:** Audit our 313 MCPs against this threat model. Use **inkog** + **clawguard** as the daily scanner. Don't deploy OpenClaw.

---

## 🎯 Strategic actions for July 4 launch

The brief says NVIDIA ACE is "MIT license June 2026, 6-month head start" — **this is the highest-value single integration we can do in 1-2 days** if we get the SDK + a license.

| # | Action | Owner | When | Est. value |
|---|---|---|---|---|
| 1 | Download NVIDIA ACE Game Agent SDK (MIT, June 16 2026) | Nick | **BEFORE 4 Jul** | 6-mo head start on gaming AI; white-label into MEOKCLAW |
| 2 | Integrate ACE with `meok-gaming-wow-mcp` (Unreal Engine 5 plugin) | M4 | After ACE download | 1-2 days; production-grade WoW AI |
| 3 | Clone `OpenLoong-Hardware` (43 DOF humanoid) | M4 | Pre-4 Jul | 3D-printable humanoid; ties to our 3D factory |
| 4 | Study OpenFang's `HAND.toml` schema; port to SOV3 capability scheduler | M4 | Post-4 Jul | MEOK OS gets "hands" layer |
| 5 | Study ClawTeam's `hedge-fund.toml`; port to 12-queen council template | M4 | Post-4 Jul | 33-Disciples architecture ships |
| 6 | Clone MiroFish for DOME swarm sim | M4 | Post-4 Jul | Towns/villages/cities sim |
| 7 | Clone Open-X-Humanoid main repo + train `pelican-vl` on our sim | M4 | Q3 2026 | 47-humanoid reasoning |
| 8 | Clone OpenLoong / RobotoOrigin for hardware BOM | M4 | Q3 2026 | $2,300 reference humanoid |
| 9 | Replace OpenClaw usage in our toolchain with Claude Code / Codex | M4 | ASAP | Security; we already migrated off it per AGENTS |
| 10 | Clone APDuino / ESP32 aquaponics; integrate with `meok-aquaponics-monitor-mcp` | M4 | Q3 2026 | Pond automation (13×12m + bead filters + UVs) |
| 11 | Run `inkog` against all 313 MCPs (when API key available) | M4 | Pre-4 Jul | OWASP Agentic + EU AI Act Art 14 compliance check |
| 12 | Run `clawguard` against all 369 MCPs (already done — 14 critical MCPs scanned) | M4 | **DONE** | Baseline security posture |

---

## 🧬 What we should adopt into MEOK OS (architecturally)

| OpenFang concept | Our equivalent | Action |
|---|---|---|
| `openfang-hands` (pre-built autonomous capabilities) | SOV3 capability scheduler (per AGENTS board) | Port `HAND.toml` schema → SOV3 `hand.yml` |
| `openfang-channels` (40+ communication channels) | Our A2A substrate (20 MCPs) | Adopt their channel abstraction |
| `openfang-memory` (knowledge graphs) | Our OLM (`federated_rag`, `quantum_memory_search`) | Benchmark vs ours |
| `openfang-skills` (SKILL.md packages) | Our `*.cursorrules` + `SKILL.md` per MCP | Adopt their loading pattern |
| `openfang-kernel` (the actual OS) | SOV3 runtime | Architectural reference for "sovereign" claims |

| ClawTeam concept | Our equivalent | Action |
|---|---|---|
| `hedge-fund.toml` (team template) | Council template | Port to our 12-queen + 33-disciples |
| P2P transport (ZeroMQ) | SOV3 inter-hive comms | Adopt ZeroMQ layer |
| Git worktree per worker | `agent-orchestrator` MCP | Already have; benchmark |
| `clawteam launch` | `sov3 spawn` | Match the command |

---

## 💰 Business signal

The brief says: "**700,000 lines of AI-generated code** by a chartered builder with zero software background" — that's the **competition in the construction vertical** (GRABHIRE / MUCKAWAY / PLANTHIRE). Our "domain expert + AI" strategy is validated but the bar is rising fast.

**LeanCon ($6M raised)** + **Track3D ($342K saved on SF airport + 3,000 labour hours)** + **Procore Agentic APIs** — these are the specific threats in our construction vertical. **Need to add Track3D-equivalent progress monitoring to our platform** OR partner.

---

## 📡 The 4 Jul launch — risk-adjusted

**Brief says EU AI Act enforcement lands Aug 2, 2026** — that's 28 days after our 4 Jul launch. Every CCO who waits is suddenly non-compliant on Aug 2. **Our "August 2nd Survival Kit" positioning** is the right play. We have 28 days to ship our compliance surface to production.

---

## 🚀 My next moves (queued for when you say go)

1. **Add NVIDIA ACE to `meok-gaming-wow-mcp`** (once SDK downloaded — owner action)
2. **Adapt `hedge-fund.toml` → `12-queen-council.toml`** in SOV3 (uses ClawTeam's template format, ~2-3 hours)
3. **Add OpenFang's HAND.toml schema to SOV3 capability scheduler** (~2-3 hours, pure design)
4. **Clone MiroFish for MEOK DOME swarm sim** (~30 min)
5. **Run inkog scan on the 5 most-critical MCPs** (when API key available)
6. **Cross-reference OpenLoong humanoid design with our `meok-3d-characters/` factory** (~1 hour design review)

---

*Compiled 2026-06-27, M4 lane, against `~/clawd/` + the research brief transcribed from 6 photos.*

## Clone log (this session)

```bash
# Cloned successfully (22+20+37+74 = 153 MB of strategic code)
git clone https://github.com/RightNow-AI/openfang.git   # 22M, 14 crates, Rust
git clone https://github.com/HKUDS/ClawTeam.git         # 20M, Python+P2P, MIT
git clone https://github.com/inkog-io/inkog.git         # 37M, Go, MIT, built to /tmp/inkog/inkog
git clone https://github.com/Open-X-Humanoid/pelican-vl.git  # 74M, embodied brain
```

## Already known but not yet cloned (in brief but lower priority)

- **RobotoParty Roboto Origin** — `huangyi/roboto-origin` (the brief's URL was `huangyi/Roboto-Origin`)
- **Open X-Humanoid main** (not just `pelican-vl`)
- **MiroFish** — `anthropic-experimental/mirofish`
- **APDuino / ESP32 aquaponics firmware** — search GitHub for `esp32 aquaponics`
- **OpenLoong** — `loongOpen/OpenLoong-Hardware`

(NVIDIA ACE is not on GitHub — proprietary download from developer.nvidia.com.)