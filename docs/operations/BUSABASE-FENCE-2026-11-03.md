# The Busabase memory fence was inert, and the estate's instance script was unversioned — 2026-11-03

A dated record of two defects found while checking the substrate's health, and what changed.

## 1. The memory fence never fired on any pod

`busabase-instance.sh` refuses to start a store when the memory headroom is below
`MIN_HEADROOM_MB` (default 900). That fence is computed by `headroom_mb()`:

```bash
max=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || echo max)
[ "$max" = max ] && { echo 999999; return; }
```

`/sys/fs/cgroup/memory.max` is a **cgroup v2** path. The RunPod pods are **cgroup v1**, where
that file does not exist — so the function returned **999999 MB** and the fence never fired on
exactly the platform that needed it. A fence that never fires protects nothing.

Measured on `6sr24tuhwl62sw` (2026-11-03):

| Signal | Value |
|---|---|
| `/sys/fs/cgroup/memory.max` | does not exist (v1) |
| `memory.limit_in_bytes` | 3,999,997,952 (4 GB) |
| `memory.usage_in_bytes` | 3,999,973,376 — reads as *at the limit*, because the FUSE page cache for the volume is counted in usage |
| `active_anon + inactive_anon` | 2,030,297,088 |
| `slab_unreclaimable` / `shmem` | 0 / 4,096 |
| **headroom, v2 formula applied to v1** | **1,878–1,901 MB** |

Note the trap in the middle of that table: `limit - usage` is **0 MB**, which reads as "the pod is
out of memory", while the number the fence is actually about — memory that cannot be reclaimed —
is **~1.9 GB**. `usage` includes reclaimable page cache; the fence's formula deliberately
excludes it. A fence that used `limit - usage` here would refuse to start a store that has
plenty of room.

**The fix.** `headroom_mb()` now reads v2 first, falls back to v1 (`active_anon + inactive_anon`
for anonymous memory, the same `slab_unreclaimable`/`shmem` rows, the same formula), and reports a
third state when there is no usable memory controller at all:

```
UNMEASURABLE
```

The caller treats `UNMEASURABLE` as what it is — it logs that the fence cannot fire on this host
and does not pretend there is headroom. Before, an absent controller meant "999999 MB of
headroom", which is a claim that was never measured.

Verified on the pod after patching: `computed headroom_mb: 1901`, the stores still
`RUNNING`, and `15429`/`15430` both answer **200** (0.20 s through the M4 tunnel).

## 2. The estate's instance script was not in the repository

`busabase-instance.sh` existed only at `/workspace/busabase/bin/busabase-instance.sh` on one pod
— the script that starts, stops and health-checks the estate's Busabase stores, written 14 Oct
2026 and never versioned. A pod's `/workspace` is the network volume, so it survived, but the
script that governs the estate's substrate had no review, no history and no second copy.

It is now `scripts/ops/busabase-instance.sh` in this repository, carrying the fence fix above.

## 3. The build pod's pre-push gate was not running

The estate's content gates (`wallet-credential-gate`, `facts-gate`, `board-production-anchor`,
`brand-gate`, `canary-leak-gate`, `price-gate`) are supposed to run before every push. On the M4
they do: `core.hooksPath` is the absolute `/Users/nicholas/.config/git/hooks`.

On the **build pod** they did not. That repo had no `core.hooksPath` and no hook in `.git/hooks`,
so a push from the pod ran **no gate at all** and looked exactly like a clean fast-forward. (The
gates had been run by hand before each pod push and did pass — but a gate that someone remembers
to run by hand is not a gate.)

`scripts/ops/pre-push-pod.sh` installs it: absolute `core.hooksPath`, the hook resolves the work
tree with `git rev-parse --show-toplevel` before it looks for the suite, and it **fails closed**
— if no safety suite is found, the push is refused.

### The staleness trap this exposed

With the hook actually firing, its first act was to **block** a push:

```
✖ board-production-anchor — its verdict:
      ✗ measured_axes 24 != production 34 + 0 promotion(s)
```

That was not a content failure. The pod's checkout was **two days stale** (master from 1 Nov) and
`board-production-anchor` compares the checkout against the **live** board, which now has 34
measured axes. After re-syncing the pod's checkout onto current master, the same gate on the same
machine is clean:

```
✓ wallet-credential-gate + node-engine-floor-gate + facts-gate + board-production-anchor
  + brand-gate + canary-leak-gate + price-gate clean
```

**If a push from the pod fails on `board-production-anchor` with an axis-count mismatch, re-sync
the checkout first** (`git fetch origin && git checkout -B <branch> origin/master`) and re-run.
A live-board gate applied to a stale checkout is a guard that stops the work while the work is
going well — the same shape as the merge loop's minimum-open-PR floor and the offload watcher's
totals-versus-live comparison. Three instances of one class.

## 4. The estate-scratch volume is not at quota

A sibling lane had recorded "estate-scratch disk full (948M free)". Measured on the pod:

| Probe | Result |
|---|---|
| 1 GB write to `/workspace` | persisted, read back 1,073,741,824 bytes exactly |
| 5 GB write to `/workspace` | persisted, read back 5,368,709,120 bytes exactly, at 1.8 GB/s |

The volume was never refusing writes. The console overlay (`/`) is the 30 GB one, and it showed
15 GB free. `scripts/ops/volume-audit.sh` now measures the volume per directory, streaming with
`find -printf` rather than `du -sh` — a `du` over the 300k-file tree buffers the whole tree and is
what pushes a 4 GB cgroup pod over its limit.

Usage at the time of the audit: `busabase` 12.78 GB / 82,504 files · `lanes` 12.74 GB / 212,417 ·
`m4-lanes` 1.84 GB / 260,602 · `dc-agent` 0.18 GB / 25,243.

## What this session did not do

- It did not change any RunPod volume's contents.
- It did not change the estate's branch protection or the merge queue.
- It did not delete anything under `/Users/nicholas/csoai-work` — that tree was reclaimed by the
  sibling lane that owns the resolver, after its own Hugging Face verification.

## 5. The class: four stops, one rule

Four separate mechanisms have now stopped work that was going well, and they are the same
mechanism:

| # | what stopped | the shape |
|---|---|---|
| 1 | the merge loop refused every round below 50 open PRs | a threshold the estate legitimately grows past |
| 2 | the clawd reclaim compared **totals** between a source and a copy | a comparison whose local side can drift |
| 3 | `board-production-anchor` on the build pod | a **local** checkout compared against the **live** board |
| 4 | a green PR invalidated because the base moved underneath it | a comparison whose local side can go stale |

The rule, which is the same grammar the board already uses for counts:

> A comparison against a live source must first establish that the local artefact is CURRENT,
> and a comparison whose local side can go stale must degrade to **"cannot answer"** — never to
> **"fails"**. "The base moved" is not a content failure; it is the queue's job.

`scripts/ops/pre-push-pod.sh` applies it to the gate path:

- it **states the revision it is about to compare against** (`comparing HEAD <sha> against
  origin/master <sha>`), so a stale local is visible in the gate's own output instead of being
  invisible;
- when the base has moved it says so **and says what to do** — re-sync and re-run — rather than
  letting a live-vs-local mismatch surface as a content verdict;
- `--resync` makes the hook fast-forward the branch onto `origin/master` first, and **fails the
  push** if that rebase fails, so a stale tree is never silently gated.

Installed on the build pod at `/root/.config/git/hooks/pre-push` with an absolute
`core.hooksPath`, so the gate is now automatic there and fails closed.
