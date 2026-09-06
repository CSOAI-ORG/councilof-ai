# The satellite indexes now have a producer

## What was wrong

`mill-cards/INDEX-safety.jsonl`, `INDEX-art5-affect.jsonl` and `INDEX-empty3.jsonl` were **orphans**.
Nothing in the repository wrote them — `hub-queue-flip` uploads `mill-cards/` and `INDEX.jsonl` and
never touched them. They were made by hand once and frozen.

So when `sign_mill_cards.py` corrected 70 bodies for #1155 — by writing **new** cards and ledgering
the old ones — the satellites went on citing the **retired** cards. And a row citing a retired card
is *self-consistent with it*: the retired card really does say UNMEASURED. `hub-index-drift`
therefore passed them for days while `/api/hub-cards` served 70 cells as UNMEASURED whose live
status was MEASURED.

    published rows citing a retired card: 70   (all three satellites, 0 in INDEX.jsonl)

## What changed

`flip_hub_queue.py` now derives each satellite as a filtered **view** of the rows it has just built
from the LIVE cards. A satellite cannot cite a superseded card, and cannot disagree with
`INDEX.jsonl`, because it is made of `INDEX.jsonl`.

The axis scopes were **read off the published bytes, not invented**:

| satellite | axes | hand-made rows | derived rows |
|---|---|---|---|
| `INDEX-safety` | `safety` | 11 | 63 |
| `INDEX-art5-affect` | `art5-safeguard`, `affect` | 24 | 126 |
| `INDEX-empty3` | `machinery-conformity`, `cross-reality`, `detector-interop` | 35 | 177 |

The row counts grow because a frozen snapshot is replaced by every live card in those axes.

## Proof

    cites a retired card   old: 70    new: 0
    subset of INDEX.jsonl  all three: True
    statuses               366 rows, all MEASURED

Re-run the whole thing:

    python3 scripts/flip_hub_queue.py --queue queue.jsonl --did did.json --out out \
      --prev-index PUBLISHED-INDEX.jsonl
    python3 - <<'PY'
    import json, glob
    sup={json.loads(l)["superseded_id"] for l in open("SUPERSEDED.jsonl") if l.strip()}
    for n in ("INDEX-safety","INDEX-art5-affect","INDEX-empty3"):
        rows=[json.loads(l) for l in open(f"out/mill-cards/{n}.jsonl") if l.strip()]
        print(n, len(rows), "cites retired:", sum(1 for r in rows if r["card_sha256"] in sup))
    PY

## Effect on the census

The satellites are views, so every row they carry duplicates one in `INDEX.jsonl`.
`/api/hub-cards` collapses those, and the count is unchanged:

    rows_served_by_indexes 1146 · superseded_excluded 0 · duplicates_collapsed 369
    cells 777 · measured 777 · unmeasured 0

`superseded_excluded` falls to **0**: the endpoint's ledger check (added in #1398) becomes a safety
net rather than the thing holding the number up. Defence in depth, in the right order — fix the
producer, keep the guard.

`hub-index-drift` should go green on its next run, because no published row will cite a retired
card. It has been correctly red since #1405 taught it to look.
