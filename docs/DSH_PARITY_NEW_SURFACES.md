# DSH parity — new surfaces checklist

**Doctrine:** DSH = same evidence as OS (OWNERSHIP #80). Never a softer grade on `/dashboard`.  
Council Software Hub (`/dashboard*`) is not a second scoreboard — it must open the same Layer 0 destinations as Council OS Lobby.

Canon: `docs/EAT_DSH_ALIGNMENT.md` · `docs/EAT_PLAYBOOK.md` · `docs/agent-runbook.md` · `docs/COUNCIL_OS_BUILD_PLAN.md`.

## Surfaces that must appear the same in OS Lobby and DSH

| Surface | OS / site path | DSH / dashboard path | API |
|---------|----------------|----------------------|-----|
| Labour / AI-economy indices | `/indices`, `/indices/:slug` | `/dashboard/measurement` tile → `/indices` | `GET /api/indices`, `GET /api/indices/:slug` |
| Products catalog (HO.2) | `/products` | measurement hub tile → `/products` | — |
| Option A white-label | `/powered-by` | enterprise / RAS path | — |
| GSPC board | `/gspc-scoreboard` + Lobby board | `/dashboard/measurement` | `GET /api/gspc` |
| RWA EAT corpus | `/competitors` | same cards | adapters → publishers |
| Instruments / Eunomia | `/instruments` | same catalog | `GET /api/instruments` |
| Verify | `/gspc-verify` | loginless verify still reachable | — |

## Definition of done for any new card

- [x] Openable in Council OS Lobby (tool card / pane / East-West / Measure menu) — `indices_catalog`
- [x] Reachable from DSH `/dashboard/measurement` (indices + products tiles)
- [x] Layer-0 link registry includes `/indices` (`layer0Links.ts`)
- [ ] Verify path if signed (`/gspc-verify` or pack verify) — N/A while UNMEASURED
- [x] Grammar pill: **UNMEASURED** — never “rated”
- [x] No grade prices (HO.2) on marketing or dashboard
- [x] Same evidence destination on both surfaces (no dual truth)

## Indices (current)

Declared **UNMEASURED**. Contextual firewall. Must not appear as scored GSPC cells in either OS or DSH.  
`measured_score: null` on all three slugs until INDEX-METHOD freezes a bank. Probe:

```bash
curl -sS https://councilof.ai/api/indices
curl -sS https://councilof.ai/api/indices/ai-economy
```

## Anti-patterns

- Dashboard-only soft scores or “preview grades”
- OS Lobby card that DSH cannot reach without a second corpus
- Marketing TVL/ARR on either surface labeled MEASURED
- GPU / RunPod inventing labour scores (`docs/RUNPOD_POLICY.md`)
