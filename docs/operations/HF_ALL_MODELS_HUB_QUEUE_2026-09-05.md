# All Hugging Face models on the hub-queue engine — 5 Sep 2026

Nothing here is a card. Every number has the command that returned it; re-run the command, not the number.

## What was measured

`scripts/hf/hf-coverage.py --probe-router --hub-list --probe-budget-minutes 55` → `public/interop/hf-coverage.json` (as_of 2026-09-05T13:41Z).

| Population | Rows | Router answered 200 | 503 capacity (not dead) | 402 billing | 400/404 every door | No live provider | Not probed (budget) |
|---|---:|---:|---:|---:|---:|---:|---:|
| hub-queue, chat-servable tag | 584 | **107** | 18 | 2 | 3 | 454 | 0 |
| Hub `text-generation` with any provider mapping, not in the queue | 6,012 | **363** | 128 | 0 | 63 | 0 | 5,458 |

- "Reachable" = one `POST /v1/chat/completions` with `max_tokens=1` answered HTTP 200 at as_of, bare id first, then each Hub-mapped provider suffix until the first 200 (per-provider caps: featherless-ai 2, others 4).
- Of the 107 reachable queue rows, 47 answer the bare id and 60 only through an explicit `:provider` suffix (the account has `featherless-ai` disabled in its provider settings; the suffix works regardless). 35 of the 107 had zero measured axes.
- Cells: 470 reachable rows × 13 rotation axes = 6,110; 620 measured; **5,490 open** (771 on the 107 pre-expansion rows).
- featherless-ai's own edge (`server: cloudflare`) answers a burst with a 403 HTML page and 200 on a quiet retry; the mill treats a 403 door as dead for the run, so the mill must stay sequential. featherless also answers `503 capacity_exhausted` for models it maps but has not loaded — capacity, not absence.
- `fireworks-ai` answers `402 Pay-as-you-go is not enabled for provider fireworks-ai yet` (2 queue rows: NVIDIA Nemotron 3.5 Lightning / Nemotron-3 Ultra). Owner setting, not code.
- No model in this run is reachable ONLY outside `HF_PROVIDER_SUFFIX` (`zai-org/GLM-5.3` looked so via the short-circuit at `:novita`; `:together` answers 200 — `post_check` in the file).

## What changed

1. **Queue lock expanded**: `scripts/hf/hf-queue-expand.py --push` appended the 363 reachable, not-yet-listed rows to `csoai/hub-queue` `queue.jsonl` + `queue.parquet` + `SUMMARY.json` on main (commit `b1cad7636871`), ranks 2411-2773, every row `UNMEASURED` with an empty `card_id`; 688 measured cells untouched (asserted). Parent-commit guarded, so a flip landing mid-write fails the commit instead of being clobbered.
2. **`hub-queue-mill.yml`**: `GRADE` 12 → 36, `timeout-minutes` 45 → 60, `--pick 1000` (the default 100-row window was mostly rows with no provider), second cron line (`11 * * * *`). Arithmetic is in the workflow comments: ≈170 cells/day at today's 7 executed runs, ≈340 if the second line doubles them; 48 h covers 340-680 of the 5,490 open cells. The ceiling is GitHub schedule starvation (~350 runs/day in this repo) and one sequential door.
3. **`harness/gspc-top100/dead_slugs.jsonl`**: removed `Qwen/Qwen2.5-0.5B-Instruct` (persisted "no live inference provider" on 3 Sep; answers 200 via `:featherless-ai` on 5 Sep, rank 63). Dead rows have no expiry — a mapping that appears later stays dead until someone looks. Not fixed here.
4. **28 stranded HF-Jobs cards landed** (PR #1347, merged 12:48Z, flip +28 cells → 688). See the reach-pack report for the chain.

## How to re-run

```bash
python3 scripts/hf/hf-coverage.py --out public/interop/hf-coverage.json --probe-router --hub-list --probe-budget-minutes 55
python3 scripts/hf/hf-queue-expand.py --coverage public/interop/hf-coverage.json --out /tmp/expand          # files only
python3 scripts/hf/hf-queue-expand.py --coverage public/interop/hf-coverage.json --out /tmp/expand --push   # + commit to main
```

Needs an HF token with `repo.write` on `csoai` for `--push` (the local CLI token; the Actions token 403s on main).

## Not done, and why

- 5,458 Hub models past the 55-minute budget are "not probed", not "unreachable". Another sweep (`--probe-budget-minutes 240`) is the next honest step.
- `image-text-to-text` (342 queue rows) stays out until a VL bank exists.
- The 6 `jail` cards on `staged-unsigned/` were not landed: `csoai/gspc-jail/items.jsonl` has 37 items that all expect `CONFINED`; a one-label prompt grade is vacuous.
- The 15 + 16 draft PRs on the two HF datasets (3 Sep, the 403 era) carry older bytes than main; recommended: close, never merge.
