# 🔌 Compute access for Claude Science — the HONEST pack (2026-07-14)
_Verified live this session. NO keys/secrets in this file — those you add yourself in Customize → Compute.
Reality-checked by actual reachability tests, not assumptions._

## The honest correction first
The sibling's model was "add your GPU box as an SSH host → dispatch training." Verified reality:
- **Free GPUs (Colab, Kaggle) are NOT SSH hosts.** You cannot wire them into Compute → SSH. They're
  browser/notebook platforms — Science can't `ssh` them. They stay manual browser flows (Colab is proven working).
- You currently have **no reachable GPU box.** So "add SSH host → train" only helps once a real GPU target exists.

## SSH hosts — verified reachability (port 22)
| Host | Address · user | Status | Use |
|---|---|---|---|
| **oracle-micro** | 145.241.232.16 · `ubuntu` | ✅ **LIVE** | Add to Compute → SSH now. But OCI always-free **micro = ~1 CPU / 1 GB, NO GPU** → orchestration/light CPU only |
| meok-backend (GCP) | 35.242.143.249 · `nicholas` | ❌ **DOWN** | GCP project `meok-498012` **billing DISABLED** → VM stopped. Needs you to re-enable billing ($) to revive |
| m2 | 192.168.1.159 · `iokfarm` | ❌ LAN-only | Home network — Science's cloud sandbox can't reach it |

**To add oracle-micro** (Customize → Compute → SSH host): host `145.241.232.16`, user `ubuntu`, key = the key you
already use for it (you paste the key in the UI — I never handle it). Then Science sees it in `list_compute`.

## The REAL ways to give Science actual GPU/big compute (ranked)
1. **Modal** — free monthly GPU credits, *programmatic dispatch* (exactly what Science wants). NOT set up here.
   You: `pip install modal && modal token new` (browser auth). Then Science can dispatch GPU jobs to Modal.
   **This is the single highest-value action for real GPU that Science can drive itself.**
2. **OCI Ampere A1 (always-free, 24 GB / 4 ARM cores, CPU)** — your OCI is authed (44 regions). Bigger than your
   16 GB Mac. No GPU, but real for CPU inference / slow small-QLoRA / orchestration. **I can provision this for you
   on request** (creates a free VM under your OCI account — I'll confirm before creating anything).
3. **Colab (proven this session)** — real T4, but browser-only. Science can't SSH it; stays a manual flow (our fixed recipe works).
4. **Re-enable GCP billing** — revives meok-backend (unknown if it has a GPU; costs money). Your call.

## Honest bottom line
- **Add now (free, live):** oracle-micro SSH — but it's CPU-micro, only good for orchestration.
- **For real GPU Science can dispatch:** set up **Modal** (`modal token new`) — that's the wire that actually
  collapses the GPU wall programmatically.
- **For a big free CPU box (24 GB > your Mac):** say the word and I'll provision the OCI A1.
- Colab/Kaggle stay manual (not SSH-able) — no way around that.

---
## VERIFIED specs (SSH'd 2026-07-14)
- **sov33-owem-micro (oracle, 145.241.232.16, ubuntu):** LIVE. 2 CPU · ~1GB RAM · 42GB disk · **NO GPU** · Py3.10.
  Use as an always-on COORDINATOR (router / signed Layer-0 node / light orchestration). NOT training/serving.
- **SETTLED:** no free GPU is reachable via SSH. GPU only from: Groq API (live), NVIDIA API (key rejected—fix), Modal (owner token), Colab (browser, training). A GPU SSH box requires PAID cloud (AWS/Azure credits).
- **Modal** not installed → owner: `pip install modal && modal token new`.
- **To connect Science:** GitHub (repos) + NVIDIA (fix key) + Modal (token). Oracle SSH optional for a persistent coordinator. Skip GCP(billing off)/Literature/OpenAlex.

---
## FREE GPU — the definitive ranked list (SSH reality per option)
_Asked repeatedly; here's the settled truth. NONE is a "persistent free SSH GPU box" — that doesn't exist._
| Option | GPU | Access | Needs |
|---|---|---|---|
| **Lightning AI Studios** | free monthly GPU hours (incl. bigger GPUs) | ✅ **has a terminal / SSH-like Studio** — closest to your ask | your login |
| **Modal** | serverless GPU, free monthly credits | programmatic (not SSH, but the *right* tool for Science to dispatch) | `modal token new` |
| **Groq API** | 70B, **LIVE now** | HTTPS API (no box) | ✅ done |
| **Colab / Kaggle** | free T4 | browser notebook — **NOT SSH** | your Google/Kaggle login |
| **NVIDIA API** | 405B free | HTTPS API | fix the rejected key |

**For Claude Science's backend, the two that matter:** (1) **Modal** — real programmatic free GPU it can dispatch to
(`modal token new`, then add in Science → Compute). (2) **Lightning AI** — if you want an SSH-style GPU studio,
that's the only free one; log in, create a Studio, add it as an SSH host. Both are owner-login, not something I
can set up for you. Free-tier limits change — re-check current quotas before relying.
