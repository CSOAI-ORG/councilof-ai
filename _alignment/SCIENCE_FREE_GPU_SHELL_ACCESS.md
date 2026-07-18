# Free GPU + shell/SSH access — for Claude Science (verified 2026-07-17, CC lane)

**The honest headline: there is NO free PERSISTENT SSH GPU box.** Anyone promising one is selling something.
But there IS a real free interactive GPU shell — **`modal shell`** — and it's already authed on the Mac.

## 🥇 1. Modal shell — THE answer (free, real shell, GPU-backed)
Verified working this session (`modal client 1.5.2`, token present, SDK importable).
```bash
export PATH="$HOME/.local/bin:$PATH"

# interactive shell INSIDE a GPU container, inheriting our train function's spec (gpu="T4", full ML image):
modal shell /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_modal_train.py::train

# or a bare shell, choose your own image/resources:
modal shell --image nvidia/cuda:12.1.0-devel-ubuntu22.04 --add-python 3.11
modal shell --cmd "nvidia-smi"          # one-shot command
modal shell --volume <vol> --add-local <path>   # mount data / local files
```
- **Cost:** Modal Starter = **$30/mo recurring credits, no card.** Our whole trinity cost ~$0.15.
- **Real allowance:** ≈12h A100-80GB, ≈51h T4, ≈7.6h H100 per month.
- **Caveat (honest):** the container is **ephemeral** — it dies when you exit. Persist work to a
  `modal.Volume` or push to git. It is NOT a long-lived box.
- ⚠️ **Gotcha found + fixed today:** the Modal CLI was BROKEN (its venv `~/.sovereign/ml-venv` had been deleted;
  the shim `~/.local/bin/modal` pointed at a dead python). Fixed by recreating the venv + `pip install modal`.
  **If `modal` errors with "No such file or directory", that's the cause — recreate the venv, the token survives.**

## 2. Lightning.ai Studios — real native SSH, free tier
- Genuine `ssh` into a persistent Studio, 15 credits/mo (= ~10h A100-40GB / 75h T4).
- 🔴 **BLOCKED for us:** Nick's account is billing-gated (support code 03920104), and the pricing page has
  **no support button** (support is a paid/enterprise feature). Don't sink time here.
- ⚠️ Their "80 free GPU hours" is **T4-only marketing** — the real unit is 15 credits.

## 3. Colab / Kaggle + a tunnel — hacky SSH into a free GPU
No native SSH, but you can tunnel into the notebook runtime:
```python
# in a Colab/Kaggle cell — gives you an SSH-able endpoint into the free GPU runtime
!curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cf && chmod +x cf
!./cf tunnel --url ssh://localhost:22 &     # pair with an sshd started in the runtime
```
- **Kaggle: 30 GPU-hr/WEEK (T4×2)** — the most generous free allowance anywhere, no card.
- **Colab:** T4, ~12h session, quota unpublished, idle-kills.
- **Honest:** tunnels are fragile, against the spirit of some ToS, and die with the session. Fine for a hands-on
  debug session; do NOT build the pipeline on it. Prefer `modal shell`.

## 4. Oracle free VM — real persistent SSH, but NO GPU
- We already run `sovereign-hermes` here (always-on, 42GB disk, Ed25519-signed brain).
- **CPU only.** Real SSH, real persistence, zero GPU. Use it for the always-on brain, not training.
- ⚠️ Oracle **halved the A1 ARM free tier (4→2 OCPU) in June 2026**. Our box is the AMD micro — **unaffected**.

## 5. The step-change (not free-tier — but free)
**UKRI AIRR Rapid Access: 20,000 GH200 hours**, UK SME + Companies House number, no VC/academic gate.
Application drafted: `_alignment/AIRR_APPLICATION_DRAFT_2026-07-17.md`. This is the only route to real
scale for a bootstrapped UK company. ~2 weeks, light-touch review.

## Recommended for Science
| Need | Use |
|---|---|
| **Interactive GPU shell now** | **`modal shell ...::train`** (free, authed, works today) |
| **Long training runs** | Kaggle (30h/wk, no card) or `modal run` |
| **Always-on service** | Oracle VM (CPU, SSH, persistent) |
| **Real scale** | UKRI AIRR (20k GH200 hrs — apply) |
| **Inference (no GPU needed)** | Groq `openai/gpt-oss-120b` — **FREE 120B, verified working** |

**Do NOT waste time on:** Lightning (billing-blocked), RunPod ("free" needs $10 deposit), Paperspace free
(M4000 8GB Maxwell — a decoy), Saturn Cloud (free tier gone), Banana (dead since 2024),
SageMaker Studio Lab (**closes to new signups 30 Jul 2026**).
