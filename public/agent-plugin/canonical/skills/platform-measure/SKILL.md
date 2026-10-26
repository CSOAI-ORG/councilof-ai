---
name: platform-measure
description: Census the local agent harness and report what is carrying, looping, idle or unreachable, with a dated receipt. Use when the user asks what is running on this machine, why work is stuck in a loop, what is looping, or for an operator status of the local agent estate. Also use before concluding that a task is blocked by infrastructure.
---

# Platform measure

The estate produces measurement artifacts, not revenue. That is only a problem if the harness itself is
stuck. This skill measures the **harness** — the launchd lanes, cron jobs, daemons and MCP bridges
that are supposed to be doing the work — and says, with receipts, which ones are actually carrying.

This is a **subject-family** measurement: it answers "is the instrument honest and still running", not
"how good is the product". It is the `harness-fidelity` slot. It is published against CSOAI's own
interest, so it is worth running.

## Canonical implementation

The census is a real program with a frozen, sha-pinned method. Do not reimplement it inline; run it.

```bash
python3 ~/clawd/_alignment/platform-measure/csoai_console.py      # live state + ranked actions
python3 ~/clawd/_alignment/platform-measure/measure_platforms.py   # the census itself
python3 ~/clawd/_alignment/platform-measure/csoai_console.py --json
```

The console **publishes nothing and sends nothing**. It writes a dated receipt under
`~/clawd/_alignment/platform-measure/receipts/`. That receipt is the evidence; the console output is
the summary.

Method, method sha, runbook: `~/clawd/_alignment/platform-measure/RUNBOOK.md` and
`~/clawd/_alignment/platform-measure/bank/method-v2.json`.

## Verdict vocabulary — use exactly these

| Verdict | Meaning |
|---|---|
| `CARRYING` | the lane produced new bytes inside the sample window |
| `LOOPING` | the lane produced new bytes and every one of them is an error |
| `IDLE` | the lane is registered and alive but produced nothing in the window |
| `UNREACHABLE` | the lane's target could not be reached |
| `UNCHECKABLE` | the lane could not be read with confidence |

`UNCHECKABLE` is never `FAIL`. `IDLE` is not broken. A lane that produced no bytes has no count — it
is null, never zero.

## Storage: measure the volume, not the container

A RunPod network volume is a slice of a petabyte MooseFS cluster, so `statvfs` reports the cluster
and not the volume. The container overlay (`/`) is the only genuinely tight filesystem, and it is
20 GB. When a lane reports a disk floor, check which filesystem it read before concluding the estate
is out of space. The estate's provisioned network volumes are counted in the RunPod account, not on
the container.

## How to present

1. The verdict table with counts per verdict, and the sample window that produced them.
2. The method sha and the receipt path, so the number is re-checkable.
3. The ranked actions the console produced.
4. Anything the census could not see, named as such.

## What this skill is not

- It does not measure product quality. The estate's own products are not scored here.
- It does not fix anything. Report first; change lanes only when the owner asks.
- It does not publish. Promotion to the public board is a gated PR, never a console flag.

## If the canonical lane is missing

Say so, state the path you looked for, and measure by hand **only if asked** — and then label the
run `UNPINNED`: a hand-made census has no method sha and is not admissible evidence.
