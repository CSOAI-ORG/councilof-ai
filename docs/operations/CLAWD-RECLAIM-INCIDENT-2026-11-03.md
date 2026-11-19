# The clawd reclaim emptied 4,460 files and reported success — 2026-11-03

A dated record of an incident in the estate's own offload tooling, the repair, and the
hardened replacement.

## What happened

At **2026-11-02 09:25**, 4,460 files under `~/clawd/_alignment` on the owner's machine were
left at **zero bytes**, all with the same mtime. The five dated records the doctrine names were
among them:

| record | bytes after the incident |
|---|---|
| `PLAN-years-to-days-20261028.md` | 0 |
| `IETF-127-STAGING-20261028.md` | 0 |
| `DATED-ITEMS-DISPOSITION-20261028.md` | 0 |
| `IETF-DECISION-BRIEF-20261028.md` | 0 |
| `STATUS-outward-2026-10-28.md` | 0 — the **sent log** |

The sent log matters most: rule 2 says nothing leaves in the owner's name without the outward
gate at 100% **and** a line in the sent log. The evidence that the gate ran on each send was in
that file.

The reclaim also `rmdir`'d the directories whose files all became empty, so the machine lost the
tree's **shape**: 10,025 paths became 4,906.

## What emptied them

`~/csoai-work/reclaim-after-verify.sh`. Its intent was right — expand the archive on the cluster
and compare the EXPANDED tree, because a sha256 of a truncated archive still matches a truncated
file — and its reclaim was truncate-then-remove-empty-dirs rather than a recursive delete, so a
mistake leaves the file names.

Five things were wrong with it, each measured:

1. **It compared totals, not identity.** File count and byte total of the source against the same
   two numbers for the expanded copy. Two different trees with the same totals pass. Totals are
   not identity.
2. **It never re-read the keeper after reclaiming.** The point of a reclaim is that the keeper
   survives; it proved the keeper existed and then destroyed the source without ever proving the
   keeper still held the bytes.
3. **It left the emptied files looking like files and wrote nothing recording what was emptied
   or where the keeper was.** The evidence of the damage was the *absence* of content, and the
   record of where the content went lived in a log on a machine that is also reclaimed.
4. **It removed the emptied directories**, destroying the path context — which is evidence too.
5. **It had no guard against running over a source that had already been reclaimed.** A source
   that is already empty is already damaged, and that must stop the run, not pass it.

## The bytes were never lost

The keeper was, and still is, the cluster copy:

- **RunPod pod `6sr24tuhwl62sw`, network volume:**
  `/workspace/m4-offload/verify-20261102-063232/x-clawd/clawd/`
  — `_alignment` there is **10,025 files, 9,996 non-zero, 29 genuinely empty, 368.6 MB**. All
  five doctrine records are present with content: PLAN 9,188 B · IETF staging 7,256 B ·
  DATED-ITEMS 7,995 B · IETF brief 6,123 B · STATUS-outward 3,251 B.
- **Hugging Face, private repo `csoai/estate-offload-20261102`:**
  `m4-offload/clawd-20261102.tar.zst` — 6,237,957,043 bytes,
  `sha256 ab54af21b22337c6a3243eed10f8592562f5a192ade6ac1fa716cb5be00f354d`.

## The repair

`scripts/ops/restore-clawd-from-cluster.sh` pulls the emptied files back from the cluster
keeper. It restores the files that are **present but empty**, and deliberately does **not**
resurrect the directories the reclaim removed — that is the space the reclaim bought, and
deciding to undo it is not a repair's call.

It **verifies afterwards**: every targeted file must be non-empty, and the count that is empty
here but not empty in the keeper must be zero. It reports failure if that is not true, which is
the behaviour the original reclaim lacked.

Measured: 4,461 empty → **29**, and of those 29, the number that are empty on the machine but
**not** empty in the keeper is **0**. Every one is genuinely empty in the keeper as well (the
keeper holds 31 empties; two of them live under directories the reclaim removed). Nothing is
missing.

## The hardened reclaim

`scripts/ops/reclaim-after-verify-safe.sh` — same `SRC` / `VERIFY_DIR` / `POD_NAME` contract as
the script it replaces. It keeps the good part (expand on the cluster and compare, not just
hash) and adds:

- **Per-file identity.** Every source file must exist at the same relative path in the expanded
  copy with the same size. Mismatches are counted **and named**, and the run refuses.
- **A keeper of empty files is not a keeper.** The run refuses if the expanded copy holds any
  zero-length file.
- **A source that is already empty is already damaged.** The run refuses outright over a source
  that contains empty files, unless `ALLOW_EMPTY_SOURCE=1` is set deliberately.
- **A reclaim manifest, written BEFORE anything is truncated** — relative path, size, sha256 —
  to the machine and a copy to the cluster, so every emptied file is explained by a line.
- **The emptied directories are kept.** A file name and its path are evidence.
- **A post-reclaim re-read of the keeper**, so "reclaimed" is a statement about the keeper and
  not about the source. If the keeper does not hold the bytes, the script reports failure and
  says the source has already been emptied.

## Still open, and it is a space decision

The `rmdir` removed ~5,119 paths from the machine entirely. They are all in the keeper
(10,025 files / 368.6 MB for `_alignment` alone). Restoring them would put the pre-reclaim tree
back and undo the space the reclaim bought, so it has not been done.

## What this session did not do

- It did not delete anything under `~/clawd` or `~/csoai-work`.
- It did not modify the original `reclaim-after-verify.sh`; the hardened version is a separate
  file, so no other lane's in-flight use of it is disturbed.
- It did not restore the `rmdir`'d directories (the space decision above).
