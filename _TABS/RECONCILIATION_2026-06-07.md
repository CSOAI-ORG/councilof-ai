# 🔍 GitHub + PC Reconciliation — 2026-06-07
*So we don't miss anything. Cross-referenced GitHub (CSOAI-ORG) ↔ local PC ↔ the ecosystem hub.*

## GitHub: CSOAI-ORG = 300 repos (298 public · 2 private)
- **284** = the MCP fleet (`*-mcp`). Matches the hub's MCP Fleet ecosystem.
- **9** = **NEW — a Developer Platform / Distribution layer the hub MISSED:**
  `meok-sdk-go`, `meok-sdk-typescript`, `meok-sdk-python`, `meok-cli`, `meok-skills`,
  `meok-integrations`, `meok-teams-app`, `meok-slack-app`, `meok-vscode-extension`.
- **7** = product/infra: `clawd-workspace` (the private monorepo), `csoai-dashboard`,
  `haulage-deploy` (the haulage SaaS, 27 routes), `meok-attestation-api`,
  `meok-attestation-verify`, `meok-governance-smithery`, `optimobile-practice-hub`.

## 🆕 Ecosystem 7 — MEOK Developer Platform / Distribution  ·  branch `claude/devplatform`
**Missed in the first hub. This is how third parties BUILD ON and INSTALL MEOK.**
- **SDKs:** `meok-sdk-go`, `meok-sdk-typescript`, `meok-sdk-python` (clawd/meok-sdk-*)
- **CLI:** `meok-cli`
- **Distribution surfaces:** `meok-teams-app`, `meok-slack-app`, `meok-vscode-extension`
- **Extensibility:** `meok-skills`, `meok-integrations`, `meok-setup`, `meok-api-gateway`
- Why it matters: this is the B2B developer funnel — SDK → CLI → IDE/Teams/Slack install. Currently a pile of repos with no unifying story or docs hub.

## ⚠️ AT RISK — work that exists ONLY on your PC (no git, no GitHub backup)
Crashes revert un-committed work (we hit this today). These are **not in any repo:**
| Dir | Files | Risk |
|---|---|---|
| `~/CSOAI-Research-Institute/` | **26,479** | 🔴 huge body of work, zero backup |
| `~/councilof-ai/` | **25,550** | 🔴 the councilof.ai site — live domain, NO backup |
| `~/CSOAI-CORP/` | 3,316 | 🟠 active to 06-06, not git |
| `~/meok-active-systems/` | 530 | 🟠 not git |
| `~/fishkeeper-ai/`, `~/clawd/domain-sales-ghp/` | 38 / 15 | 🟠 local-only sites |
| `~/MEOK-AUTONOMOUS-SYSTEM/` `~/MEOK-IP-COLLATERAL/` `~/MEOK-REVENUE-SYSTEM/` | 40 / 12 / 23 | 🟡 small, not git |
| `~/MEOK-AI-Labs/` (1 file) `~/csoai-dashboard/` (1 file) `~/clawdbot-jarvis/` (stale 04-15) | — | 🟡 stubs/dupes — likely deletable |

**Recommendation:** back up the two 🔴 dirs FIRST (git init + push to private CSOAI-ORG repos), before any more work. That's the single highest-value "don't lose anything" action.

## Forks-as-substrate (3rd-party repos MEOK builds on — not ours, don't audit as products)
`meok-amica`←semperai/amica · `meok-agent-zero`←agent0ai · `meok-platform`←OpenHands ·
`langfuse` · `god-eye`/`meok-godeye`←Vyntral · `.hermes`←NousResearch · robotics:
`wolf-actuator`+`modular-bearing`←Anthrobotics, `opencrane`←asimovinc, `Ironless-QDD-Actuator`←CKraft11.
(These belong to Ecosystem 6 Physical/Robotics as substrates.)

## Net: what the hub was missing
1. **Ecosystem 7 (Dev Platform/Distribution)** — added above.
2. **Unbacked-up local work** — the real "miss"; needs backing up.
3. **Home-level dirs outside `~/clawd`** — triage: archive the stubs, fold the active ones (`CSOAI-CORP`, `meok-active-systems`) into a repo or into clawd.

## 🔴 CRITICAL FIND + FIXED — severed-brand repos were PUBLIC
True repo count is **469** (not 300 — list was capped) · 15 private · 15 forks. The MCP fleet is
~**400** (many named without the `-mcp` suffix, e.g. `agriculture-ai`, `brave-search`, `aws-cloud`).
**7 severed-brand repos (CSGA ×5, TerraNova/erranova ×2) were PUBLIC under CSOAI-ORG** — against the
standing "never reference CSGA/Terranova" rule. **FIXED: all 7 set to PRIVATE** (content preserved,
reversible; 3 were archived → unarchived→private→re-archived). Verified: 0 severed-brand repos public.

New real products spotted in the 469: `lib2b` (B2B AI SDK protocol), `domain-sales` (.AI domains),
private domain-source repos (`fishkeeper`/`koikeeper`/`diyhelp`/`loopfactory`/`industrial-domains`/`asisecurity-portal`).

## Backups — status
- `councilof-ai`: already on GitHub (public, recent). Local diverged; remote now wired. ✅
- `CSOAI-Research-Institute`: has a local crash-safe commit (protected). NOT pushed to GitHub — and it
  contains CSGA material, so it must NOT go to a public repo. If backed up: PRIVATE + CSGA-scrub first.
