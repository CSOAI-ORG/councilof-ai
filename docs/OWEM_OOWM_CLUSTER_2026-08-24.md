# OWEM-OOWM CLUSTER — the specialist engine, aligned to the monorepo harness

**Doc ID:** `csoai-owem-oowm-cluster-v1` · **Revision:** 2026-08-24
**Aligned with:** the LIVE OOWM agent team (measure/mine/mine VMs + GPU pods), the 14-axis (13 canonical + jail)
GSPC registry, the unified grounded chat (`/api/chat`), and the verified-measurement backend.
**Doctrine:** measurement-not-certification · nobody-ranked-pays · never fabricate ·
no banned codenames public · pod-canonical + Oracle-backed.

---

## 0. The architecture (one line)

**One specialist cluster per axis/industry/regulator/end-party — each an independent OWEM engine
that trains over time, all reachable through ONE OOWM (the unified chat), all wired into the
monorepo harness, deployable as white-label / API / MCP / A2A / AG-UI, living 24/7 with simulation
for forecast + growth + index signal.**

## 1. The cluster map (who is the specialist)

| Layer | Cluster | Example | What it does |
|---|---|---|---|
| **Axis specialist** | one per GSPC axis | `gov`, `care`, `jail`, `swarm`, `det` | Measures that axis, trains on its probes, gets better over time |
| **Industry specialist** | one per sector | finance, healthcare, defence-compartments | Domain-scoped measurement + compliance mapping |
| **Regulator specialist** | one per regime | EU AI Act, UK AI Bill, NIST RMF | Crosswalk + evidence + attestation shaping |
| **End-party specialist** | one per buyer | researcher, vendor, enterprise, fact-checker | The tailored entry point + verified answers |
| **Unified OOWM** | the chat (ONE) | `/api/chat` (grounded) | Routes to the right specialist; OOWM-to-all |

Each specialist = **its own cluster**: an OWEM (measurement engine) + its own model/training loop
+ its own MCP tooling + its own data feed. They are NOT isolated — each publishes into the shared
monorepo + reporting ledger, and the unified OOWM routes across them.

## 2. Monorepo harness wiring (so "we really are what we say")

```
councilof-ai/                        ← the monorepo (harness, deploys to councilof.ai)
├── public/arena/elo_reference.json  ← signed per-axis Elo (already live, verifies)
├── public/signals/*.json            ← per-axis specialist signals (each cluster publishes here)
├── functions/api/
│   ├── chat.ts                      ← unified OOWM (grounded, routes to specialists)
│   ├── axis-register.ts             ← the 14-axis honest register (live; jail MEASURED/TIE)
│   ├── article50.ts                 ← free Article 50 passport (LIVE)
│   └── arena/scoreboard.ts          ← signed leaderboard API (?verify=1)
├── docs/OWEM-OOWM-CLUSTER/          ← this blueprint + the per-specialist design docs
└── content/axis/*.md                ← per-axis content (the authority engine)
```

**Wiring guarantee:** every specialist publishes a **signed signal** (content_id + Ed25519) into
`public/signals/`; the front-end + chat read from there; the monorepo is the source of truth; the
Oracle backup protects it; the EAT loop keeps it fresh. Nothing floats on a laptop.

## 3. The living, learning loop (per specialist cluster)

1. **Measure** (EAT): the axis-engine runs frozen probes → per-axis Elo + CI (live).
2. **Train**: each specialist's model trains on its axis probes + feedback (gets better over time;
   honest — a thin-n axis stays "not sufficient to rank").
3. **Publish**: signed signal → monorepo `public/signals/` → front-end + chat + APIs.
4. **Simulate**: a simulation layer runs the axis forward (forecast capability drift), feeding a
   **growth index** + the **sov signal** — the trend the estate can grow against.
5. **Verify**: a reviewer recomputes + checks the signature (the trust proof).

**24/7:** the loop is pod-cron-driven (eat-arena every 2h, eat_loop, backup_snapshot) — no manual
step; the Mac is not in the path.

## 4. Deployment surfaces (white-label / API / MCP / A2A / AG-UI)

- **API**: any specialist signal is a signed endpoint (e.g. `/api/arena/scoreboard?verify=1`).
- **MCP**: any specialist is an MCP server (ClaimGuard already is: `claimguard-mcp`).
- **A2A**: the agent-card + `.well-known/agent.json` exposes the specialist as an agent.
- **AG-UI**: the live AG UI embeds the chat (the `councilof-ai` AG UI bundle).
- **White-label**: a customer can carry a specialist under their own brand, with the measure +
  verify path intact (the trust is in the key, not the surface).
- **Loaded on other platforms**: MCP directories (mcp.so/Glama — bundle ready), A2A Registry
  (registered), HF (dataset live), Zenodo (DOI live).

## 5. What we need to build next (the sizing)

1. `public/signals/` — per-axis specialist signal JSON + the signed signal emitter (reuse the
   leaderboard sign path — verified pattern).
2. `content/axis/*.md` — the per-axis authority content (the content engine deliverable).
3. Specialist routing in the chat — the unified OOWM picks the right axis/regulator/industry
   answer with the signed signal as the evidence anchor.
4. The simulation + forecast layer (growth index + sov signal) — a pod cron computing a signed
   trend from the longitudinal corpus.
5. The team roll — `oowm_team_roll.sh` already configures a VM as an OOWM; extend so each can
   carry a specialist role + sign its own signals.

## 6. Doctrine lines (the cluster never crosses)

- Measurement, not certification (every specialist says so; `not_a_certification` everywhere).
- Nobody-ranked-pays (a licensed specialist is data + tooling, never a paid rank).
- Never fabricate (a thin-n axis is honest, a free feature stays free-honest).
- No banned codenames on any public/specialist surface.
- Signing key never travels; corrections appended, never edited.
