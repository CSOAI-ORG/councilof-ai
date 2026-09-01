# Arena Leaderboard Runbook — pod-canonical measure → sign → publish

**Pod-canonical per owner directive 2026-08-23:** the engine runs on the A100 pod; the
signature is created on-pod with the estate key; results commit to the monorepo via PR.
No critical artifact lives only on the Mac.

**Pod:** A100 (compute node) — SSH host/port held privately (see TRADE-SECRETS.md, not committed)
**Monorepo:** `CSOAI-ORG/councilof-ai` — `harness/arena/` + `functions/api/arena/scoreboard.ts`
**RAG volume:** sink pod (host:port held privately) → `/workspace/RAG/mac-migrate/arena-results/`

---

## Pod-side

### Files (`/workspace/arena_engine/`)
| File | Role |
|---|---|
| `axis_arena.py` | per-axis pairwise engine; OOWM fleet; graded scenario→verdict scoring |
| `publish_scoreboard.py` | consumes rounds + bench, filters to OOWM fleet, emits signed scoreboard |
| `arena_scoreboard.py` | converts round JSONL → per-axis Elo + CI |
| `elo.py` | reference Bradley-Terry Elo + bootstrap CI + style control |
| `canon.py` | cross-runtime-stable canonical JSON (int-valued floats → ints) |
| `key` | estate Ed25519 seed (32 bytes) — the signature is created HERE |
| `arena-auto-loop.sh` | measure → publish loop (writes scoreboard to `/tmp`) |

### Loop
```bash
setsid nohup bash /tmp/arena-auto-loop.sh >/dev/null 2>&1 < /dev/null & disown
```
Publishes `/tmp/arena_scoreboard.json` every 10 min. Rounds append to
`/workspace/arena_rounds.jsonl`; bench accumulates in `/workspace/bench/`.

### One-off publish
```bash
cd /workspace/arena_engine && python3 publish_scoreboard.py \
  --rounds /workspace/arena_rounds.jsonl --benchdir /workspace/bench \
  --key /workspace/arena_engine/key --out /tmp/arena_scoreboard.json
```

---

## Sync side (Mac, then PR to monorepo)

`harness/arena/arena-scoreboard-sync.sh` pulls `/tmp/arena_scoreboard.json` off the A100,
recomputes content_id (must match), stages to `public/signed/arena_scoreboard.json`, and
opens an auto-PR. `arena-auto-commit.sh` is the PR wrapper.

```bash
bash harness/arena/arena-scoreboard-sync.sh
```

## Public surface

`GET /api/arena/scoreboard` → signed per-axis leaderboard.
`GET /api/arena/scoreboard?verify=1` → recompute `sha256(canonical body)`, return
`match: true|false` against `signature.content_id`. The Ed25519 sig (kid
`did:web:csoai.org#card-attestation-1`) verifies over that content_id against the published
did:web:csoai.org key.

## Known infra quirk (2026-08-23)

The A100 pod's `/workspace` (mfs RAG mount) became **write-degraded for new files**:
new/large writes truncate to 0 with `Errno 122`. Workaround: the scoreboard is written to
`/tmp` (local overlay, reliable); rounds/bench still append on `/workspace`. See
`~/.clawdbot/shared-knowledge/intel/wave-13-2026-08-23-a100-mfs-write-degraded.md`. If it
persists, restart the pod or move working state to the sink pod (`/workspace/RAG/mac-migrate`).

## Doctrine

Measurement, not certification. Every score carries n and CI; thin-n axes are reported
"insufficient to rank", never invented. Corrections appended, never edited.
