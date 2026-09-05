# Predicate banks, and the other eight axes

Derived 2026-09-05 against the live Hub and the worker's own validators.

## What was found

Nine frozen banks exist on the Hub that the pod does not grade, each **exactly 30 rows** — the
quotable threshold, so a clean run would be MEASURED rather than "n<30 unquotable":

    csoai/gspc-accountability   csoai/gspc-creativity     csoai/gspc-efficiency
    csoai/gspc-fairness         csoai/gspc-human-vs-ai    csoai/gspc-sovereignty
    csoai/gspc-transparency     csoai/gspc-safety         csoai/gspc-continuity

They are **predicate banks**: every row is `expected: "KEYWORD_MATCH"` with its own `must_inc`
keyword list, rather than an exact label like COMPLY / REFUSE.

    curl -sL "https://huggingface.co/datasets/csoai/gspc-fairness/resolve/main/gspc-fairness.jsonl" \
      | head -1 | python3 -m json.tool

**They were never found by guessing a filename.** `items.jsonl` 404s on all nine; the banks are at
`gspc-<axis>.jsonl`. A 404 on a guessed path proves nothing — list the tree:

    curl -s "https://huggingface.co/api/datasets/csoai/gspc-fairness/tree/main"

## What this changes (in this PR)

`bank_labels()` refused both kinds of bank for reasons that were not about the bank:

1. **Predicate banks.** It required at least two distinct `expected` values. A pure predicate bank
   has exactly one, `KEYWORD_MATCH`, so all nine were rejected — while
   `scripts/runpod_gspc_worker.py` has graded such rows row-by-row all along (`must_inc`,
   `KEYWORD_MATCH_ALL`). Their allowed-label set is legitimately **empty**: the worker *rejects* a
   config that lists KEYWORD_MATCH as an allowed label. `bank_labels()` now returns `()` for them.
2. **Canary rows.** Contamination canaries carry no `expected` by design
   (`{"_canary": "GSPC-CANARY-GUID safety-csoai-2026"}`, row 37 of `gspc-agi`). The old code raised
   "lacks expected" on them, so it would have rejected **every behavioural bank we already grade**.
   They are skipped as non-items.

A one-label *exact* bank is still rejected — one label cannot discriminate. Four controls:

| bank | expected | got |
|---|---|---|
| behavioural + canary row | `('COMPLY','REFUSE')` | ✅ |
| all-KEYWORD_MATCH predicate | `()` | ✅ |
| degenerate one-label exact | REJECT | ✅ rejected |
| mixed predicate + exact | `('COMPLY','REFUSE')` | ✅ |

## What this deliberately does NOT change — a ruling is needed

The seven new axis names were **not** added to `AXES`, and this is the point of the document.

`runpod_gspc_worker.py` validates `axis` against `CANONICAL_MODEL_AXES`, which is exactly the
fourteen the pod grades. Seven of the nine banks (+ the 0-byte `gspc-slot15`) are the **other eight**
of the 22-axis board — the deterministic-fact family, not the behavioural one.

    python3 - <<'PY'
    import json,hashlib,importlib.util,sys
    spec=importlib.util.spec_from_file_location("wk","scripts/runpod_gspc_worker.py")
    w=importlib.util.module_from_spec(spec); sys.modules["wk"]=w; spec.loader.exec_module(w)
    print(sorted(w.CANONICAL_MODEL_AXES))   # the 14, and fairness is not among them
    PY

So adding them would emit **35 configs the pod rejects with UNKNOWN_AXIS**, and widening
`CANONICAL_MODEL_AXES` would put two axis families behind one per-model grader — a cell would stop
saying which family produced it. **That is a canon ruling, not a tuple edit.**

Two of the nine collide by name with axes the pod already grades, which is a second reason to stop:

    csoai/gspc-safety      vs  the pod's "safety"     -> gspc-agi.jsonl
    csoai/gspc-continuity  vs  the pod's "continuity" -> gspc-asi.jsonl

Two different frozen banks behind one axis label would make a cell ambiguous about its own source.

`csoai/gspc-slot15` is a **0-byte** file: unmeasurable, which is not the same as empty and not zero.

## The ask

Rule on whether the deterministic-fact axes are graded per-model. If yes, they need their own
canonical set and their own cell namespace, not a widened `CANONICAL_MODEL_AXES`. If no, say so and
the nine banks stop being candidate coverage. Either way the answer is worth **35 cells** at n=30.
