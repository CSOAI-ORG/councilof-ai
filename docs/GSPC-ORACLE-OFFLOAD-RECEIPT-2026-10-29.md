# ORACLE BULK OFFLOAD — destination decision and measurement receipt

**Decided:** 2026-10-29 · **Source:** `oracle-micro-2` `/evac-bulk` · **Destination:** **RE-DECISION REQUIRED** (see the correction below)
**Corrected:** 2026-10-29T09:41Z, after a second measurement contradicted the first one.

---

## The decision, and its correction

**The bulk was to go to the pod, pulled pod→Oracle over SSH agent forwarding, with the Mac acting only as the key broker.**

**That destination is now withdrawn, on measurement.** The first version of this receipt said the pod's
per-user quota was gone and that a 40 GB write had succeeded at 2.2 GB/s. Re-measured, that write landed on the
pod's **overlay** volume (`/root`, `/tmp`), not on the shared MooseFS mount where the offload was headed. On the
MooseFS mount the offload was aimed at, **every write still fails with "Disk quota exceeded"** — while `df`
still reports 436 TB free.

So: **the route and the source stand; the destination does not.** The transfer is **not started**.

---

## The measurement, from the estate's own hosts

| Fact | Value | How it was established |
|---|---|---|
| Source | `oracle-micro-2` (141.147.73.85), `/evac-bulk` | recovered on retry after the guest stopped answering |
| Source size | **1,226,000 files · 43,690,453,268 bytes** (≈ 40.7 GiB) | counted on the host; the tree is stable (1,226,006 momentarily, +6 while writing) |
| Source read speed, local | 28 MB/s | the host's own disk is not the bottleneck |
| Source read speed, over the wire | ~4.8 MB/s Mac→Oracle; ~5.1 MB/s aggregate with 4 parallel streams | measured; 8 streams gave 5.3 MB/s — no further gain |
| Pod overlay write capacity | **64 MiB at 3.5 GB/s** | measured 2026-10-29T09:41Z on `/root`; the probe was removed afterwards |
| Pod overlay free space | **9.6 GB** (20 GB volume, 11 GB used) | `df` on `/root` and `/tmp` — the same overlay |
| Pod `/workspace` free space | 436 TB **reported, and not writable** | `df` on the shared MooseFS mount; `df` lies, and the quota is real |
| Pod `/workspace` write | **"Disk quota exceeded"** | measured at `/workspace/csoai/.qprobe3` (64 MiB), 2026-10-29T09:41Z; the probe was removed afterwards |
| Pod `/workspace` already spent | **26 GB** | `du -sh /workspace/csoai` |
| `m2` host | 2,061,092 files | **not the source** — a different tree |
| `oracle-micro` (145.241.232.16) | alive, `/evac-bulk` mounted, but an **August-era generation (267K files)** | **not the bulk** |

### The correction, in full

The first version of this receipt carried two claims. Both are corrected here, and one of them was the receipt's
own error:

1. **The estate's ssh config marks `oracle-micro` (145.241.232.16) as DEAD.** It is **alive and reachable**. It is
   `micro2` — the host the plan calls "Oracle" — whose guest was wedged (SSH, HTTP and HTTPS all timed out with no
   banner) and which then recovered. The config's dead-host entry is for the wrong machine, and `micro2` is not
   permanently dead. **This one stands.**
2. **"The 7.6 GB pod quota is gone" — CONTRADICTED.** It is a per-user quota on a shared filesystem and it is
   **still in force**. The 40 GB write that seemed to disprove it went to the overlay volume, not to the shared
   mount. Measured 2026-10-29T09:41Z:

   | Path | Filesystem | Reported free | Measured write |
   |---|---|---|---|
   | `/workspace` | `mfs#euro-3.runpod.net:9421` (MooseFS, shared) | 436 TB | **"Disk quota exceeded" — every path tried** |
   | `/root` | overlay | 9.6 GB | 64 MiB at 3.5 GB/s — **succeeds** |
   | `/tmp` | overlay (the same volume as `/root`) | 9.6 GB | the same volume |

   `/workspace/csoai` already holds **26 GB**, so the quota is spent, not absent.

**The consequence, stated plainly: at the time of this receipt neither candidate destination on the pod can take
the bulk.** The MooseFS mount is quota-blocked; the overlay has 9.6 GB free and the bulk is 43.7 GB. A third
destination — a different pod, a larger volume, or an object store — is the open decision, and it belongs to the
owner.

### The route, and why it is still the only workable one

The Mac holds both keys, but **neither host holds the other's private key** — so a direct pod→Oracle pull needs the
Mac's key, which is present in **both** the pod's and Oracle's `authorized_keys` (`sovereign-council-deployment`, plus
Oracle's `pod-oracle-mirror-20260925` and `pod-fb4156fe923e-oracle-offload` entries).

**SSH agent forwarding therefore gives a direct pod→Oracle route**, bypassing the Mac's 4.8 MB/s read path and the
Mac's disk entirely. The Mac relays the key and then gets out of the data path.

**Routing through the Mac is not viable**: it needs a local 29–44 GB staging copy on a volume with ~1.7 GB free.

### The cost

43.7 GB at ~5 MB/s aggregate is **≈ 2 hours 25 minutes**, bound by Oracle's own egress, not by the pod, not by the
Mac, and not by compression (the tree is already gzipped, so compression gains nothing).

---

## What was NOT done, and why

- **The bulk was not moved.** The route was measured end to end and the source is confirmed; the destination is
  withdrawn on measurement, so the transfer was not started. Starting it would have written 43.7 GB into a quota
  that has already refused two smaller probes.
- **Nothing on the source was deleted.** Every probe was read-only or confined to the pod, and the pod's test writes
  were cleaned up (both probe files were removed after the 2026-10-29T09:41Z measurement).
- **`m2` and `oracle-micro` were not used as the source.** Both were measured and both are a different generation.

## To execute it, once a destination exists

```bash
# on the Mac: broker the key to the pod, then let the pod pull directly.
# The destination path below is the one that is QUOTA-BLOCKED and must be replaced
# with a destination that has been measured to accept the bulk.
ssh -A rp-3090-now 'rsync -a --partial --append-verify --info=progress2 \
  oracle-micro-2:/evac-bulk/ /workspace/csoai/oracle-offload/'
```

`--partial --append-verify` is what makes a 2.5-hour transfer resumable and verifiable against the source, and it is
the mechanism that reconciles with the 453,102 files already on the pod from the paused 16 October run.

**Not a certification.** This is a file-movement receipt: what the source measured, where the bytes are going, how
fast, what was not done, and — where a first measurement turned out to be wrong — what the correction is.
