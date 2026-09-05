# Why signed cells stayed invisible — A16 and A17

Derived 2026-09-05 from the live endpoint, the live HF index and workflow run 33967715806.
Every claim has the command that re-runs it.

## The symptom

70 pod cards were signed and sat on master. `/api/hub-cards` did not move.

    git grep -l '"model": "ollama:' origin/master -- public/interop/mill-cards-signed/ | wc -l   # 70
    curl -s https://councilof.ai/api/hub-cards | python3 -c 'import json,sys;print(json.load(sys.stdin)["counts"])'

## A16 — it was never a model-id mapping problem

The backlog row proposed either rewriting pod model ids onto hub-queue slugs, or adding a fifth
`INDEX-local-fleet`. **Neither is needed, and the first would have been a lie** — `ollama:mistral:7b`
is a quantised GGUF, not `mistralai/Mistral-7B-Instruct-v0.3`; equal digests would not make them the
same artefact.

`flip_hub_queue.py` already indexes **every** VALID card with no model filter, and it did:

    run 33967715806 → {"index_rows": 756, "verdicts": {"VALID": 756, "UNQUOTABLE": 5}, "changed": false}

756 rows built. **691 rows published.** The difference is exactly the pod's 65 MEASURED cells.

The upload step is gated `if: steps.flip.outputs.changed == 'true'`, and `changed` was derived from
the **queue blob alone**. A card for a model the queue does not list adds an index row and moves no
queue row — so `changed` was false and the upload was skipped. The cells were signed, VALID, indexed,
and invisible.

    curl -sL "https://huggingface.co/datasets/csoai/gspc-hub-cards/resolve/main/mill-cards/INDEX.jsonl" \
      | grep -c .        # 691 before this fix
    # and its first row's `indexed` stamp is the last run where a queue row moved.

**Fix:** the index is a published artefact in its own right, so a change to it is a change.
`flip_hub_queue.py` now takes `--prev-index` (the currently published INDEX.jsonl) and reports
`queue_changed`, `index_changed`, `prev_index_seen` separately; `changed` is the OR. An absent prior
index is UNKNOWN and uploads — absent is not "same".

### The comparison had to be made able to fail

The first version compared the two files as text. That is TRUE on every run, because every row
carries `indexed`, a fresh as_of stamp — a check that cannot fail is not a check. It is caught by
the second control below. The comparison now drops that one field before comparing.

Three controls, all run against the real 863 signed cards and the real queue:

| control | expected | got |
|---|---|---|
| stale published index (691 rows) | `changed=true` | **true** |
| the index it just built | `changed=false` | **false** |
| no `--prev-index` (UNKNOWN) | `changed=true` | **true** |

Re-run:

    python3 scripts/flip_hub_queue.py --queue q.jsonl --did did.json --out o1 --prev-index PUBLISHED.jsonl
    python3 scripts/flip_hub_queue.py --queue q.jsonl --did did.json --out o2 --prev-index o1/mill-cards/INDEX.jsonl

## A17 — a workflow-token push starts nothing

`hub-queue-flip` triggers on push to master under `public/interop/mill-cards-signed/**`. The signer
pushes with the workflow token, and GitHub fires no push event for those — that is what stops
workflows recursing. So the signer's own commit could never start the flip.

**Fix:** `hf-fin-shells-measure.yml` now asks for the run explicitly after a push that reached
master, with `actions: write` added for it. It is skipped for `target=mill`, which lands on its own
branch where there is nothing to print yet; that flip happens when the branch's PR merges.

    gh workflow run hub-queue-flip.yml --ref master -f dry_run=false

## Expected effect

`/api/hub-cards` `measured` **691 → 756**, `cells` **761 → 826**, with 65 `ollama:` cells appearing
in `INDEX.jsonl`. A projection until the endpoint says it:

    curl -s https://councilof.ai/api/hub-cards | python3 -c 'import json,sys;print(json.load(sys.stdin)["counts"])'
