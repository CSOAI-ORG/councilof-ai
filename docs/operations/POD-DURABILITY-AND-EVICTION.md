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
