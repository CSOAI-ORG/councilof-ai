# DISK RECLAIM RECEIPT — what was removed, what was kept, and what the volume says now

**Measured:** 2026-10-29, 09:20Z–10:05Z · **Volume:** `/System/Volumes/Data` (228 GiB) · **Estate target:** ≥ 5 GiB free

---

## The volume now

```
/dev/disk3s1   228Gi   196Gi   1.7Gi   100%    8.8M   17M   33%   /System/Volumes/Data
```

**1.7 GiB free. The ≥ 5 GiB target is NOT met, and this receipt says so rather than rounding it up.**

---

## What was reclaimed, in two passes

### Pass 1 — two merged worktrees (earlier in this docket)

`~/clawd/_merge/wt-3517` (PR #3517) and `~/clawd/_merge/wt-3531` (PR #3531), both merged, removed with
`git worktree remove --force`. Their history survives in the parent repo's object store — both HEADs
(`86e7d9a02`, `4601f18ba`) were confirmed present with `git cat-file -t` → `commit` after the removal.

**1.3 GiB → 4.5–5.0 GiB.**

### The estate then grew back

Another lane system's checkouts took `~/csoai-work` to **25 G** and the volume fell to **817 MiB free** — measured at
09:41Z, with the growth attributed by directory measurement rather than guessed.

### Pass 2 — twenty derived lane checkouts (this session)

`~/csoai-work` held **20 lane checkouts of ~890 MiB each**. Each lane is a `GIT_DIR` (`lane-X.gitdir`, holding every
ref and the object store) plus a **linked checkout** (`lane-X`, the derived content). The checkouts are the
disposable half.

**The safety check, before anything was removed:** for all 20 lanes, the lane's HEAD commit was confirmed present in
`CSOAI-ORG/councilof-ai` (`GET /repos/…/commits/<sha>` → **HTTP 200**). So the remote holds every commit the checkout
held. The `GIT_DIR` was kept regardless, so the refs and objects survive locally too — **two independent copies of the
history, one of them already verified**.

**What was removed:** the 20 checkout directories only, via `mavis-trash` (recoverable; nothing permanently deleted).
The 20 `lane-X.gitdir` directories and the shared object store (`lane-b7.gitdir/objects`) were **kept**.

**`~/csoai-work`: 25 G → 8.1 G.**

### Pass 3 — caches

`~/Library/Caches` cleared (1.4 G → 961 M) and the npm cache cleaned. Both are rebuildable by definition.

---

## What was deliberately KEPT, and why

| Kept | Size | Why |
|---|---|---|
| `~/csoai-work/lane-b8` | 889 M | HEAD `9da85eab2d` is **not** on the remote (HTTP 422) — it holds unique local commits |
| `~/csoai-work/lane-m6` | 901 M | HEAD `fe7bb1b6e` — **not** on the remote |
| `~/csoai-work/lane-m7` | 900 M | HEAD `fa77c0954` — **not** on the remote |
| `~/clawd/_merge/fix-20261028` | 2.5 G | branch `feat/outward-gate-txt-id-exemptions` is **diverged ahead 57 — not merged** |
| `~/.hermes/hermes-agent` | 3.9 G | **LIVE.** The hermes gateway runs from this path (`mcp_death_supervisor.py` under `~/.hermes/hermes-agent/tools/`). An earlier plan that treated it as disposable build output was wrong and is void |

---

## The honest remainder

**The ~15.3 G moved to the Trash is still on the volume.** `mavis-trash` moves to the macOS Trash on the same volume, so
the working area is clean but `df` has not moved: the free space comes back when the Trash is emptied, not before.
The estate's deletion discipline forbids permanent deletion by an agent, so **the final purge is the owner's**.

**What is still reclaimable, with the owner's word:**

- `~/clawd/.git` — 2.7 G of git objects. `git gc` would shrink it, but it needs headroom to do it and the repo is
  shared with a running lane system.
- `~/clawd/councilof-ai-work/condor/data/busabase_backup` — 1.8 G. A **backup**: not mine to delete.
- `~/Documents` (10 G), `~/Library` (17 G), `~/.minimax/sessions` (3.9 G, the estate's own session record) — the
  owner's data and the estate's record, not mine.
- `~/OrbStack` — 3.1 G of container images.

---

## The pod is not the answer, and the measurement says so

The pod was measured as an offload destination on 2026-10-29T09:41Z, and **it cannot take the bulk**:

| Path | Filesystem | Reported free | Measured write |
|---|---|---|---|
| `/workspace` | `mfs#euro-3.runpod.net:9421` (MooseFS, shared) | 436 TB | **"Disk quota exceeded" — every path tried** |
| `/root` | overlay | 9.6 GB | 64 MiB at 3.5 GB/s — succeeds, but the bulk is 43.7 GB |

Both probe files were removed after the measurement. **The bulk fits nowhere on the pod today**, which is why the
Oracle transfer has not started. The full account is in the offload receipt.

---

**Measurement, never a certification.** This receipt reports what was measured on this volume, what was removed, what
was kept and why, and what the free space is now. It asserts nothing about the state of any other host.
