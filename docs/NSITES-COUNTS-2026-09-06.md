# Next N-sites — population + probe (6 Sep 2026)

Counts, not names. Each row has a population and a reachability probe.

| site | population | probe | as_of | note |
|---|---|---|---|---|
| HF census | 3,032,028 | `https://huggingface.co/api/models?limit=1` | lock `census_n` | n_measured 0. Do not mill the census tonight. |
| hub-queue | 2,773 rows (`n_queue` 2,410) | `https://huggingface.co/datasets/csoai/hub-queue/resolve/main/queue.jsonl` HTTP 200 | 2026-08-29 | Source of HF2200. |
| HF2200 lock | 2,200 | `public/fleet/HF2200.lock.json` `n_locked` | lock `queue_as_of` | After FLEET-B 40. `n_measured` read from lock, starts 0. |
| FLEET-B | 40 | `https://councilof.ai/fleet/FLEET-B.lock.json` | 2026-08-31 | Do not mix into HF2200. |
| Kaggle Models | 10,000 (`totalResults` on list API); lock holds 500 | `GET https://www.kaggle.com/api/v1/models/list?pageSize=20` HTTP 200 | 2026-09-06 | `locks/KAGGLE.lock.json`. downloads field 0 this hour. |
| GSPC board | 22 axes | `GET https://councilof.ai/api/gspc` HTTP 200 | live | 22 measured; 8 fact panes n<30 — see THIN-AXIS-REASONS. |

`enters_board_means` is false on HF2200 and KAGGLE. A lock is not a grade.
