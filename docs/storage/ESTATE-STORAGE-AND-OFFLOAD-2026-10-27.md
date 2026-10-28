# Storage and offload record — 27 October 2026

**Council of AI — where the work lives, how it got there, and what is still on the owner's disks.**

Status: a **measurement of the estate's own storage**, taken 27 October 2026. It is not a capacity
report and not a guarantee: every number here was read from a live endpoint or a local filesystem
at the time stated, and every transfer is stated with how it was verified.

Measurement, never certification: a file that reached storage is a file that was *copied*; the
digests below are the evidence for that copy, and they say nothing about any artefact's content.

---

## 1. What was wrong

Both owner machines were effectively full, and the reason was never the estate's work:

| Machine | APFS container | Free at 03:00 | Free at 08:00 | Container used |
|---|---|---|---|---|
| `NICHOLASs-MacBook-Air-2` (M4) | 245.1 GB | **537 MB** (0.2%) | 13.2 GB (5.4%) | 99.8% → 94.6% |
| `IOKs-MacBook-Air` (M2) | 228 GB | 5.4 GB | 37 GB | 98% → 82% |

The M4's own data volume was 212 GB. The composition, measured with `du -x` (so the OrbStack NFS
mount was not walked):

| Consumer | Size | Note |
|---|---|---|
| `/Applications` | 59 GB | of which **World of Warcraft is 48 GB** — a game, not work |
| `/Users/nicholas` | ~40 GB | incl. `.hermes/state.db` 8.6 GB and `.codex/thread_history_1.sqlite` 4.9 GB (agent histories) |
| `/opt/homebrew` | 9.8 GB | regenerable; pruned |
| `/private/var` | 8.6 GB | system |
| `/Library` | 6.2 GB | system |
| OrbStack `data.img.raw` | 228 GB **apparent / 3.9 GB allocated** | a sparse image, not the culprit |

The M2's home was 93 GB: `~/workspace_for_ai` 15 GB, `~/Library` 34 GB, `.codex` 7.1 GB,
`.hermes` 5.4 GB, `~/csoai-gh-mirror` 3.2 GB.

**The estate's paid storage had been sitting idle the whole time.** The account has six network
volumes (`csoai-backup-ro` 800 GB, `sov-models` 2 TB, `sov-workspace-mtl4` 200 GB,
`sov-artifacts` 200 GB, `council-os-benchmark-data-20261027` 100 GB,
`busabase-restore-20261025` 50 GB) and three running CPU pods.

---

## 2. Where the work went

**Destination: the RunPod pod `ic0fl7mexpk4dj` — `meok-him-production-20261027`.**
`/workspace` on that pod is a network volume with **421 TB free** (`mfs#euro-3.runpod.net:9421`).
This is the same cluster the estate's own protocol names: the global git hook says worktrees live
on the RunPod build pod, never on the Mac.

| What | Where it is | How it was verified |
|---|---|---|
| The M4's whole working set (`csoai-work`) | `/workspace/csoai/m4-offload-20261027/csoai-work/` | rsync with `--partial`; per-file size+mtime match, `du` on the pod |
| The M4's durable state, as one archive | `/workspace/csoai/m4-offload-20261027/estate-offload-20261027.tar.gz` | **sha256 verified on the pod** (`sha256sum -c` → OK) |
| The same archive, second copy | `micro2` (`sov33-owem-micro2`), `/home/ubuntu/` | **sha256 verified on micro2** (OK) |
| The M4's agent histories (`.codex/thread_history_1.sqlite`, `.hermes/state.db`) | `/workspace/csoai/m4-offload-20261027/agent-history/` | rsync, size match |
| The M2's work (`workspace_for_ai`, `csoai-gh-mirror`, `.codex`, `.hermes`) | `/workspace/csoai/m4-offload-20261027/air/` | piped Air → M4 → pod, `du` on the pod |
| The estate's lane base clone | `/root/base` on the pod, at master's tip | `git rev-parse` → `6bc936a22` |

The working set was also **moved out of a git working tree**: it now lives at
`/Users/nicholas/csoai-work`, and `/Users/nicholas/clawd/csoai-work` is a symlink to it. See §5 for
why that mattered.

---

## 3. What was reclaimed on the M4

| Action | Effect |
|---|---|
| `node_modules` and `dist` removed from the main clone (both regenerate; `npm ci` restores them) | 1.26 GB |
| The landing clone `mill3425` retired **after** its merge resolution was pushed (`5869f7476`) | 2.1 GB |
| `~/Library/Caches/*` cleared (regenerable) | ~2 GB |
| `brew cleanup --prune=all` | old formulae |
| The M4's working set moved off the disk and the lane's dependencies reinstalled | the rest |

---

## 4. The estate's own gate, and one thing it caught that was not mine

The pre-push content gate refused a push of the SAFE port work with *"Chromium for Playwright is
not installed"*. The cause was mine: clearing `~/Library/Caches` had removed the Playwright browser
download, and the lane clone had no `node_modules` to launch it from. The fix was to reinstall
both — **not** to bypass the gate. The lane-guard and the content gate both pass with no bypass.

One earlier push did use the estate's own documented, loud, per-commit escape hatch
(`LANE_GUARD_SKIP=1`) to conclude a merge commit in a standalone clone: the lane guard identifies
"the main checkout" by *`.git` being a directory*, so any standalone clone looks like the shared
checkout, and the guard then blocks the very commit that resolves a conflicted merge. The same
work done in a lane with a **separate git dir** (`.git` as a file) passes the guard with no bypass
at all — that is the shape the guard's own selftest calls correct. Every lane after that used the
separate-git-dir shape.

---

## 5. The finding worth keeping

**A working set inside a git working tree is one `git clean` away from gone.** The M4's
`~/clawd/csoai-work` was an untracked directory inside the `~/clawd` git repository, and at 07:52
it was removed while a push was running in it — the push died with it, and the merge-loop script,
the A10 lane and the offload logs all went with it. The offload to the pod is what made the
recovery possible: the pod's copy restored the working set within minutes.

The fix is structural, and it is now in place: the working set lives at `/Users/nicholas/csoai-work`
(outside every git working tree), and the old path is a symlink so no existing reference breaks.

---

## 6. What is still blocked, and what needs one human act

| Blocker | Evidence | What unblocks it |
|---|---|---|
| RunPod **S3** endpoint storage is unreachable from both owner machines | `403 SignatureDoesNotMatch` (M4, stale keys) and `401 missing Authorization header` (micro2, no keys in config) | fresh S3 access keys, or `rclone config reconnect` |
| **Hugging Face** has no usable local token | the machine's `HUGGINGFACE_TOKEN` is rejected (`Invalid user token`); the CLI has no stored login. The **repository secret `HF_TOKEN` works in CI** — the estate already publishes to HF from CI | one `hf auth login`, or an offload workflow in CI |
| Google Drive remotes (both machines) | `invalid_grant: maybe token expired?` | `rclone config reconnect gdrive:` |
| Two of the three pods reject the account SSH key | `csoai-build-cpu-writer-20261001` and `council-os-benchmark-live-20261027` → `Permission denied (publickey)`; only `meok-him-production` accepts `runpodctl-ssh-key` | the key those pods were created with |
| The M4's 48 GB game install | `/Applications/World of Warcraft` | an owner decision — it is not work, and it is the single largest item on the disk |
| `micro2`'s own bulk volume is 95% full (2.6 GB free) | `df -h /evac-bulk` | the same offload, once the S3 keys work |

**The two email sends remain unsent**, for reasons that are separate from storage: the SMTP path
returns `535` for the mailbox password, the Resend key returns `400 API key is invalid`, the
Cloudflare token returns `403`, and Proton is absent from the `csoai.org` SPF. The bodies are
staged, verified and body-only; they need one owner action (a mailbox credential, or a sign-in to
Proton plus the DNS decision), then one confirmation per send.
