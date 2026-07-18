# GCP VM Push Plan — 2026-06-15

**Author:** Hermes subagent (read-only audit)
**Target VM:** `35.242.143.249` (europe-west2-a, GCP) — `meok-backend` SSH alias
**Project (GCP):** `meok-498012` (MEOK)
**Red line:** Never destructive. Never spend money. Read-only audit.
**Status:** ✅ VM reachable, gcloud SDK present (off PATH), SSH key valid, hive already deployed but **not via git**.

---

## (a) Current GCP configuration

### Local workstation (Mac M-series, /Users/nicholas)

| Component | State | Path / value |
|---|---|---|
| `gcloud` SDK | ✅ Installed, **not on `$PATH`** | `~/google-cloud-sdk/bin/gcloud` (v572.0.0, core 2026.06.05) |
| Active GCP project | `meok-498012` (MEOK) | set via `gcloud config` |
| Active account | `nicholastempleman@gmail.com` | OAuth user |
| GCP key for SSH | ✅ present, 600 perms | `~/.ssh/google_compute_engine` (RSA, 2.6 KB) |
| `~/.ssh/config` host `meok-backend` | ✅ configured | direct IP, user `nicholas`, `StrictHostKeyChecking accept-new` |
| Other SSH keys | `id_ed25519`, `m2_key` | unrelated to GCP |

### `~/clawd/meok_gcp_bootstrap.sh` (MEOK ONE bootstrap, zone `europe-west2-a`)
- Creates **SPOT** VM `meok-backend` (e2-standard-4, Ubuntu 22.04 LTS, 50 GB pd-balanced).
- Tags `meok-backend`. Opens :22 + :443. Provisions Ollama + `qwen3:0.6b` + Caddy.
- API key header `X-MEOK-Key`. Caddyfile proxies `/llm/*` → `127.0.0.1:11434`.
- **`meok-backend` is already this very VM (35.242.143.249)** — bootstrap appears to have been run previously.

### `~/clawd/openpatent-hive/deploy/gcp/` (openpatent hive provisioning)
- `provision.sh` — creates `openpatent-hive` VM (e2-standard-4, Debian 12, 100 GB SSD) in `us-central1-a`, reserves static IP `openpatent-ip`, opens 22/80/443.
- `bootstrap.sh` — installs Docker CE + Compose, nginx, certbot, ufw, fail2ban; clones `https://github.com/CSOAI-ORG/openpatent-hive.git` to `/opt/openpatent-hive`; runs `scripts/build-all.sh` + `bring-up.sh`; writes nginx vhost for `openpatent.ai` + 4 subdomains.

### Vast.ai path
- ❌ **No `vast_create_instance.sh` or `vast_deploy_fixed.sh` exists locally** (searched `~/clawd` and home).
- The "Vast.ai path" referenced in the context is **not present on this machine**.

### State of `/opt/openpatent-hive` on the VM
- Deployed via `scp -r` or rsync, **not via `git clone`**: `.git` is absent on the VM.
- 7 service dirs present (`api-gateway`, `patentmcp`, `landing-site`, `bft-council`, `worker`, `mcp-manifest`, `verify-page`, `drafting-fork`, `x402-router`, `primitives`, `sov3-hive`, `sovereign-temple`, `openpatent-mcp`, `_shared`).
- 12 docker containers up; **only `openpatent-drafting-fork` is unhealthy** (Up 20 h, unhealthy) — needs attention post-push.
- Other `/opt` siblings: `csoai-layer0`, `meok-council`, `meok-one`, `containerd` — none are git repos visible to our user.

### State of local `~/clawd/openpatent-hive/`
- **Branch:** `feat/compliance-map` (1 commit ahead of `origin/feat/compliance-map`).
- **Remote:** `git@github.com:CSOAI-ORG/openmore.ai.git` — **wrong remote**; should be `openpatent-hive.git`.
- **Working tree dirty:** 2,788 files changed, 1,301 insertions, 5,559 deletions (massive churn — likely an alignment sweep from `185742e`).
- **Repo size:** 351 MB (rsync of the whole thing is feasible; `git push` is not, because remote is wrong).

---

## (b) 5-step push sequence (no state changes during this audit)

The path that works given the current state — **rsync of the source tree + restart compose** — because the VM has no git and the local repo points at the wrong remote.

> **0. Pre-flight (run from local, no remote effect)**
> - Confirm reachability: `nc -zv 35.242.143.249 22` → ok.
> - Confirm SSH key: `ssh meok-backend 'echo OK'` → ok.
> - Confirm `gcloud` works off-PATH: `~/google-cloud-sdk/bin/gcloud config get-value project` → `meok-498012`.
> - *(Optional) snapshot the VM with `gcloud compute snapshots create meok-pre-push-$(date +%F) --source-instance meok-backend --zone=europe-west2-a` so a bad push is reversible. ~$0.05/GB-month of snapshot storage — discuss cost with user before running.*

**1. Stage the local tree (no push)**
- `cd ~/clawd && rsync --dry-run -a --delete --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='*.pyc' --exclude='.venv' --exclude='target/' --exclude='*.rlib' openpatent-hive/ meok-backend:/opt/openpatent-hive/`
- Inspect the dry-run output for any unexpected deletions. `--delete` is safe only because VM has no `.git` to lose, but flag if `services/*/node_modules` shows up.
- Remove the `--dry-run` flag once approved.

> **Reconciliation note:** the VM's `/opt/openpatent-hive` was last deployed 2026-06-13 (per `FINAL.md`); local has 2,788 uncommitted file diffs. If you don't want to clobber manual edits on the VM, add `--backup --backup-dir=/tmp/hive-pre-push-$(date +%F)` (stores deltas on the VM, no extra cost beyond a few MB disk).

**2. Push (atomic)**
- `rsync -a --delete --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='*.pyc' --exclude='.venv' --exclude='target/' --exclude='*.rlib' -e 'ssh -o StrictHostKeyChecking=accept-new' openpatent-hive/ meok-backend:/opt/openpatent-hive/`
- Expected throughput: ~50–100 MB/s on GCP internal; 351 MB ⇒ <1 min cold, <30 s warm. Bandwidth from M2 to VM is **egress to internet**; the rsync itself is small in *delta* terms (gzipped).

**3. Rebuild + restart on the VM**
- `ssh meok-backend 'cd /opt/openpatent-hive && ./scripts/build-all.sh && ./scripts/bring-up.sh'`
- `build-all.sh` rebuilds only changed service images; `bring-up.sh` is idempotent and waits for `/health` on each service.

**4. Verify**
- `ssh meok-backend 'docker ps --format "table {{.Names}}\t{{.Status}}"'` — expect all 12 containers `Up (healthy)`. `openpatent-drafting-fork` was unhealthy *before* the push, so verify it didn't get worse; if still unhealthy, the push didn't introduce it.
- `curl -fsS http://127.0.0.1:3210/health` (patentmcp), `:3211` (api-gateway), `:3213` (verify), `:3214` (mcp-manifest) from the VM.
- If you have a tunnel or the public IP serves :80/:443 (certbot must have run), hit `https://openpatent.ai/health` from local.

**5. Rollback (only if step 4 fails)**
- VM has no version control on `/opt/openpatent-hive`, so rollback = restore from the snapshot taken in step 0, or re-rsync from a known-good local commit.
- If you used `--backup` in step 1, the pre-push files live in `/tmp/hive-pre-push-*/` on the VM — copy them back, then `bring-up.sh`.

> **Why not `git push`?** The local repo's `origin` is `openmore.ai.git` (wrong org/repo) and the VM has no `.git` to pull into. To convert to a git-based flow you'd need to: (a) re-point the local remote to `CSOAI-ORG/openpatent-hive.git`, (b) `git push -u origin feat/compliance-map`, (c) on the VM, `git clone` the repo, (d) decide whether the existing deployed tree or the freshly-cloned one wins. That is a bigger change than the user authorized today — recommend doing it as a follow-up.

---

## (c) Cost estimate

**The 5-step push itself costs $0.** It is rsync over SSH using a key you already have, into a VM that is already running.

**Standing costs (unchanged by the push):**

| Resource | Rate | Notes |
|---|---|---|
| `meok-backend` e2-standard-4 (SPOT) | ~$0.04–0.06/hr (Spot varies) | London, europe-west2-a; running ~$30–45/mo at 24/7 |
| 50 GB pd-balanced boot disk | ~$5/mo | |
| Static IP (if attached, not currently reserved) | $0 if used, ~$3/mo if orphaned | confirm with `gcloud compute addresses list` |
| Egress to internet (rsync, ~350 MB) | ~$0.04 (first 1 GB/month is free in many regions) | |
| **One-time snapshot (if you take it in step 0)** | $0.05/GB-month × ~10 GB = **~$0.50/month** | delete with `gcloud compute snapshots delete` after a clean push to avoid recurring charge |

**GCP free-tier relevance:** none — `meok-498012` is a paid-billing project; e2-standard-4 SPOT is not in the always-free tier. Do **not** run `gcloud compute instances create` from `meok_gcp_bootstrap.sh` — the VM already exists; re-running would fail or create a duplicate (and bill it).

**Cost-control reminders (red-line compatible):**
- Stop the VM when idle: `gcloud compute instances stop meok-backend --zone=europe-west2-a` (saves the hourly cost; disk and IP charges continue).
- Don't leave orphaned static IPs: `gcloud compute addresses list` to audit.
- Don't enable additional APIs (`compute.googleapis.com` is already on; do not run `gcloud services enable` ad-hoc).

---

## (d) DNS workaround for `.ai` TLDs

The user reports DNS is broken for `.ai` TLDs on the VM. Two distinct failure modes need separate fixes:

### 1. **Outbound resolution** (the VM can't *look up* `.ai` names)
   - Root cause: GCP's default `8.8.8.8` resolver or the VM's `/etc/resolv.conf` may be returning NXDOMAIN for `.ai` if the resolver is mis-configured or the local stub listener (`127.0.0.53`) is broken.
   - **Workaround A — point to a public resolver that has fresh `.ai` records:**
     ```bash
     sudo tee /etc/resolv.conf <<EOF
     nameserver 1.1.1.1
     nameserver 8.8.8.8
     nameserver 9.9.9.9
     options edns0 trust-ad
     EOF
     sudo systemctl restart systemd-resolved 2>/dev/null || true
     ```
   - **Workaround B — use DNS-over-HTTPS via `cloudflared` or `dnscrypt-proxy`** if the local network blocks plain DNS. `cloudflared proxy-dns` listens on `127.0.0.1:5054` and forwards to `1.1.1.1` over DoH; set `/etc/resolv.conf` to `nameserver 127.0.0.1` after starting it as a systemd unit.
   - **Verify:** `dig +short openpatent.ai @1.1.1.1` should return the A record you published at Namecheap.

### 2. **Inbound resolution** (other resolvers can't find *your* `*.ai` records)
   - `.ai` TLD is operated by Cocca-Collins and resold through registrars (Namecheap, Porkbun, Gandi). Resolution works fine *globally* once the zone is published — there is no inherent `.ai` resolution problem at authoritative servers.
   - If the user's claim is that "DNS is broken for `.ai`", the most likely real cause is **the zone is not yet published** (registrar NS records not delegated) or **the A record is missing**. Check:
     - `dig +trace openpatent.ai` (should show `ns1.namecheap.com` etc. as authoritative)
     - `dig openpatent.ai @dns1.registrar-servers.com` (the registrar's own nameserver — should return the A record)
   - **Workaround if you need the name to resolve *now* and the zone isn't published yet:** use a **public IP override** locally for testing:
     - `curl --resolve openpatent.ai:443:$STATIC_IP https://openpatent.ai/health` — bypasses DNS entirely.
     - For browser testing: `/etc/hosts` (or a Chrome extension like "Live Host") can pin the name to the static IP. Note: this only works for the hostname, not subdomains (`api.openpatent.ai`, `draft.openpatent.ai`, etc.) unless you add all of them.
   - **Workaround if you need TLS to work before the zone is live:** use a self-signed cert + `curl -k`, or run a local CA and trust it in your browser. The VM's `bootstrap.sh` already includes this: `tls internal` for Caddy in the MEOK bootstrap, and `certbot --nginx` will simply fail gracefully for OpenPatent until DNS is live.

### 3. **If the *resolver network* (e.g., inside a corporate VPN) genuinely blocks `.ai`**
   - Use a SOCKS5/HTTPS proxy: `curl --proxy socks5h://localhost:1080 https://api.openpatent.ai/v1/...` after running `ssh -D 1080 meok-backend` for a local SOCKS tunnel.
   - Or use the GCP VM itself as the egress: any HTTP client on the VM will resolve `.ai` via *its* resolvers; tunnel traffic back to the workstation with `ssh -L 8080:127.0.0.1:3211 meok-backend` for api-gateway-style traffic.

**Recommended order of operations:**
1. Verify the zone is actually published: `dig +trace openpatent.ai` from a *third* network (e.g., `1.1.1.1`).
2. If yes but the VM can't resolve: apply Workaround A (1.1.1.1) on the VM. Cost: $0.
3. If no (zone not published): fix the Namecheap NS records first; DNS is a precondition, not a workaround.
4. If you need to test services before DNS is live: pin via `/etc/hosts` locally + use `curl --resolve` for scripts.

---

## Audit summary (for the parent agent)

| Question | Answer |
|---|---|
| gcloud installed? | ✅ **Yes**, at `~/google-cloud-sdk/bin/gcloud` (v572.0.0). **Not on `$PATH`** — recommend `export PATH="$HOME/google-cloud-sdk/bin:$PATH"` in shell rc. Project `meok-498012`, account `nicholastempleman@gmail.com`. |
| SSH key present? | ✅ **Yes**, `~/.ssh/google_compute_engine` (RSA, 600 perms), already wired to the `meok-backend` host alias in `~/.ssh/config`. |
| VM reachable? | ✅ **Yes** — port 22 (SSH) and 443 (HTTPS) both open on `35.242.143.249`. `ssh meok-backend` succeeded; VM is Ubuntu 22.04.5 LTS, x86_64. Hive already deployed at `/opt/openpatent-hive` (no `.git`), 12 containers running, **`openpatent-drafting-fork` is unhealthy** (pre-existing, not caused by us). |
| 5-step plan? | ✅ **Yes** — section (b) above. rsync (not git) because the local repo's `origin` is `openmore.ai.git` (wrong) and the VM has no git tree. 0 → 1: rsync dry-run; 2: rsync; 3: rebuild + `bring-up.sh`; 4: verify; 5: rollback via snapshot or `--backup`. |
| Vast.ai path? | ❌ **No `vast_create_instance.sh` or `vast_deploy_fixed.sh` exists on this machine.** The context's "Vast.ai path also exists" claim is **not verifiable locally**. If the user wants a Vast.ai fallback, those scripts need to be authored or located. |
| Any state changed? | ❌ **No.** Read-only audit. No files created outside this report. No gcloud commands run. No SSH writes. No rsync executed. No money spent. |
| Report path | `/Users/nicholas/clawd/GCP_VM_PUSH_PLAN_2026-06-15.md` (this file) |

### Open questions for the user
1. **Take a snapshot before pushing?** (~₤$0.50/month recurring until deleted) — recommended for first push.
2. **Is the local repo's remote *supposed* to be `openmore.ai.git`?** The directory name is `openpatent-hive` but the remote is `openmore.ai`. If this is a fork or rename, `git remote set-url origin git@github.com:CSOAI-ORG/openpatent-hive.git` would let you switch to a git-based push later.
3. **Should the 2,788 uncommitted file diffs be pushed as-is, committed first, or stashed?** Pushing dirty uncommitted files via rsync is fine for a "hive is the source of truth" model, but a clean tree is easier to debug.
4. **Do you want me to address `openpatent-drafting-fork` (unhealthy) as part of the push or as a separate ticket?**
5. **Where is the "Vast.ai path" the context referenced?** I couldn't find any vast scripts; either they live elsewhere (a different machine, a different repo) or they don't exist yet.
