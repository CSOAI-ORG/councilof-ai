# /opt is ephemeral on this pod, and the mill was grading from it

Measured 2026-09-06.

## The mounts

    /workspace   /dev/nvme0n1p3   100G   durable volume
    /opt         overlay          200G   EPHEMERAL — mount point is "/"

`stat -c %m /opt/gspc-banks` returns `/`. Everything under `/opt` dies with the pod.

## What was sitting there

| path | size | what it is |
|---|---:|---|
| `/opt/gspc-banks` | 504K | **the frozen banks every card pins by `bank_sha256`** |
| `/opt/gspc-logs` | 57M | every batch log |
| `/opt/gspc-out`, `/opt/gspc-jobs` | 1.6M | run outputs and configs |
| `/opt/gspc-models` | 18G | a dead model store, holding overlay space |

The first row is the one that matters. A card's `bank_sha256` pins bytes that existed
only on an ephemeral overlay, and `scripts/runpod_gspc_bank_allowlist.current.json` pins
the same digests. Lose the pod and no published card could ever be checked against the
bank it names — see also `BANK-PIN-STRANGER-RECOMPUTABILITY.md`, where those digests
already fail to reproduce from the published banks.

38 banks are now copied to `/workspace/gspc-banks`, verified byte-identical (38 of 38,
0 mismatched), and the mill reads those. Logs moved to `/workspace/gspc-logs`.

## Eviction, and why "ollama rm" was not it

Three shards pulling concurrently took `/workspace` to **100% — 4.0K free**. One shard
died with `ENOSPC` writing a one-line JSON file; another failed CONFIG on a model that
had been evicted out from under it.

The guard was doing nothing. It ran `ollama rm <tag>` on the shard's OWN tag, immediately
before pulling that same tag, and `ollama rm` unlinks a manifest while leaving the blobs.
**48 orphaned blobs held 68 GiB.**

`evict()` now drops every `hf.co` manifest that is not claimed by a running shard, then
every blob no remaining manifest references, and returns what it freed so the batch can
print it:

    EVICTED 12 manifest(s), 21.4 GiB of blobs (kept 1 in use) — free 47.2GB

A shard writes its current tag to `/workspace/inuse/<shard>.tag`, so a sibling never
evicts the model another shard is mid-run on. Shard count reduced 3 → 2: peak footprint
is what filled a 100 GB volume.

## Attribution, per batch

A pod card's model id is `ollama:hf.co/<repo>:<quant>@sha256:<digest>` and a queue id is
an HF repo name, so string equality is the wrong test (PR #1549). The check that means
something is that the card's `model_transport` IS the tag pulled for that queue id. Each
model prints `ATTRIBUTION n ok · m mismatched`, and a mismatch is recorded as
`ATTRIBUTION_MISMATCH` rather than GRADED.

## Why the driver is in this repo

It was not. It ran only on the pod — the same way `#1516`'s orchestrator fixes ran only
on the pod while master carried none of them. Code that produces published cards belongs
where it can be reviewed and restored.

## The restart drill, performed 2026-09-06

Not asserted. Everything the mill depends on was killed and restarted, with the state
hashed on both sides.

    banks_set_sha256 = sha256 of every /workspace/gspc-banks/*.jsonl, sorted

| | banks | banks_set_sha256 | run dirs | ledger rows |
|---|---:|---|---:|---:|
| before | 38 | `b8c2b1972e96058e` | 87 | 90 |
| after teardown (drivers, workers, ollama all killed) | 38 | `b8c2b1972e96058e` | 87 | 90 |
| after restart | 38 | `b8c2b1972e96058e` | 87 | **106** |

Nothing was lost. The daemon came back on the durable store —
`OLLAMA_MODELS=/workspace/ollama-models` read straight out of `/proc/<pid>/environ`,
`/api/tags` 200 with 7 models still present — and both shards **resumed from the
ledger**, each reporting `7 axes to do` on the model they were part-way through rather
than starting it again.

### Eviction, printed

The first two lines the restarted shards wrote:

    EVICTED 1 manifest(s), 38.5 GiB after nvidia/Qwen3.6-35B-A3B-NVFP4 — free 44.0GB
    EVICTED 1 manifest(s),  4.4 GiB after Qwen/Qwen2.5-7B-Instruct     — free 35.5GB

38.5 GiB reclaimed from one 35B model. Under the old guard that space was never
returned, which is how a 100 GB volume reached 4.0K free.

### One trap this drill walked into twice

`pkill -9 -f "ollama serve"` **killed the SSH shell running it**, because that shell's
own command line contains the pattern. Same for `pkill -f "runpod_gspc_worker"`. The
first teardown looked like it had done nothing; the second silently took ollama down and
left no restart running. Use `pkill -x <comm>`, or a pattern that cannot appear in the
invoking command. This is the `pgrep -f` self-match already recorded for probes, and it
is worse for `pkill`: there the failure is a false ALIVE, here it is killing yourself
mid-operation.

## A threshold is checked once; a pull is not

The first eviction guard fired below 25 GiB free. Observed 2026-09-06 with two shards:

    EVICTED 0 manifest(s), 19.2 GiB of blobs (kept 2 in use) — free 4.7GB

The check passed at 28 GiB, then two concurrent pulls of 20+ GiB models ran and the
volume reached **4.7 GiB** before the next check. The guard was not wrong about its
threshold; it was wrong to have one.

Eviction now runs BEFORE EVERY PULL, keeping only tags a shard has claimed in
`/workspace/inuse/`. That bounds the store to what is actually in use, and it prints on
every model instead of only when the volume is nearly gone — which is what "every batch
prints its evictions" has to mean to be worth anything. A shard that still finds under
12 GiB after evicting waits five minutes for a sibling to finish rather than pulling into
a full disk.

    EVICTED 0 manifest(s), 4.5 GiB of blobs (kept 2 in use) — free 58.6GB

## Order the batch smallest-first

The driver took models in queue order, which is roughly by download rank, so it spent
its hours on the largest models first. Measured over the 532 usable models:

| size hint | models |
|---|---:|
| ≤ 4B | 77 |
| 4–9B | 174 |
| 9–20B | 41 |
| **> 20B** | **149** |
| no parseable hint | 91 |

A 32B `Q4_K_M` is a ~20 GiB pull that takes ten minutes before a single item is graded;
a 0.5B model is graded in seconds. Two shards were observed sitting on
`GLM-4.7-Flash-GGUF:Q4_K_M` and `Qwen3-32B-GGUF:Q4_K_M` simultaneously, both mid-pull,
with the ledger flat for nine minutes.

`size_hint()` reads the parameter count out of the model name and the todo list is
sorted ascending. **This changes the order, never the quant and never the grade.** A
model with no parseable hint sorts LAST, because an unknown size is not a small one.

Throughput, measured on the same hardware:

    before sharding          0.27 completions/min
    3 shards, queue order    1.6
    2 shards, smallest-first 3.6      (ledger 204 -> 210 in 100s)

Restarting to pick up the ordering killed two in-flight pulls; `evict()` reclaimed the
18.4 GiB of orphaned partial blobs on the next model, which is what it is for.
