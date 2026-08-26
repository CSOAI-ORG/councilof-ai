# Arena Harness — signed per-axis Elo leaderboard engine

The measurement differentiator vs **OpenRouter** (usage rank, no provenance) and
**LMArena** (crowd Elo, no verify path): we publish a **signed, per-axis Elo leaderboard**
that a third party can recompute and verify against a published key — on a per-domain basis
LMArena's general crowd Elo cannot resolve and OpenRouter's adoption rank does not measure.

Pod-canonical (owner directive 2026-08-23): the engine runs ON the A100 pod, the signature
is created ON the pod with the estate key, and results commit to the monorepo. No Mac step.

## Components

- `elo.py` — reference Bradley-Terry Elo (K-factor, draw handling, bootstrap CI,
  length/style control). Self-tests.
- `axis_arena.py` — the per-axis pairwise engine: pits two OOWM-fleet models on the same
  gspc scenario, grades deterministically (scenario→verdict, never LLM-as-judge), updates
  per-axis Elo. Writes `arena_rounds.jsonl`.
- `arena_scoreboard.py` — converts recorded rounds into a per-axis Elo leaderboard with CI,
  per axis, content_id + Ed25519 signature.
- `publish_scoreboard.py` — consumes bench + rounds, grades (with fleet filter), emits the
  signed scoreboard. This is the publish step.
- `scoreboard.ts` — Cloudflare Pages Function at `/api/arena/scoreboard` (with `?verify=1`).
- `arena-scoreboard-sync.sh` — pulls the signed board off the pod, verifies content_id, and
  stages it to `public/signed/arena_scoreboard.json`.

## OOWM fleet (owner directive)

The measured fleet is the specialist big models only — `nemotron-3-nano:30b`, `phi4:14b`,
`gemma3:12b`, `deepseek-r1:8b`, `qwen3:8b`, `mistral:7b`. (2026-08-26: `qwen2.5:7b` was
removed from the sampled fleet — it is not loaded on the measurement pod, so sampling it
404'd; the loaded `qwen3:8b` takes its place.) Tiny models (0.5b/1.5b/3b/4b)
are excluded from the board: `is_oowm()` filters them out.

## Run

```bash
# pod (A100): measure + publish every 15 min
setsid nohup bash arena-auto-loop.sh &    # measure → publish signed scoreboard

# local, from a worktree
python3 elo.py                                   # reference selftest
python3 publish_scoreboard.py --rounds <file> --benchdir <dir> \
    --key <estate key> --out arena_scoreboard.json
```

## Verify path

`GET /api/arena/scoreboard?verify=1` recomputes `sha256(canonical body)` and returns
`match: true|false` against `signature.content_id`. The Ed25519 signature (kid
`did:web:csoai.org#card-attestation-1`) verifies over that content_id against the published
did:web:csoai.org key. Every score carries `n` and CI; a thin-n axis is reported honest
("not sufficient to rank"), never invented.

## Doctrine

Measurement, not certification. Never fabricate a score. Corrections appended, never edited.
