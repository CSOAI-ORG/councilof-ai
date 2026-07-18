# MEOK — Always-On GCP Hosting Plan (SOV3 + Ollama off the M4)

**Goal (Nick, 2026-05-31):** Run SOV3 + Ollama 24/7 on a fresh GCP VM so (a) the M4 is freed for UI/3D dev, and (b) the MEOK ONE backend is reachable even when the Mac is off — a step toward deploying MEOK ONE publicly.

---

## The cost-saving insight (read this first)
Your own bench proved **qwen3:0.6b is the cleanest local default** (BENCH_RESULT_2026-05-30). A 0.6b model runs **fine on CPU** — no GPU needed.
- **CPU VM** (qwen3:0.6b + SOV3): **~£90/mo** always-on
- **GPU VM** (only if you want 8B+ fast): **~£250–500/mo** always-on

**Recommendation: CPU-only.** GPU is 3–5× the cost for a model you've already shown you don't need. Add a GPU later only if a paying customer needs the big model.

⚠️ **Honest flag:** always-on = a real **~£90/mo** bill, and Stripe is currently £0. Two ways to soften that:
- **Scale-to-zero** (Cloud Run, cold-start ~10–30s) → pay only when used, ~£0–15/mo. Best pre-revenue.
- **Spot/preemptible VM** → 60–90% cheaper (~£15–30/mo) but can be reclaimed (auto-restarts). Fine for a backend, not for a demo mid-pitch.
True always-on 24/7 VM is the simplest but the priciest. My pick **pre-launch: spot VM**; **at launch: standard VM**.

---

## Recommended spec (CPU, London region)
| Item | Choice | Why |
|---|---|---|
| Region | `europe-west2` (London) | Lowest latency for you + UK users; data residency |
| Machine | `e2-standard-4` (4 vCPU, 16GB) | SOV3 + Postgres + qwen3:0.6b comfortably. (`e2-standard-2`/8GB works if frugal, ~£48/mo) |
| Disk | 50GB balanced PD | OS + 16GB Ollama models + Postgres + headroom |
| OS | Ubuntu 22.04 LTS | matches your stack; easy Python 3.11 + Homebrew-equiv |
| Cost | ~£90/mo on-demand / ~£20/mo spot | sustained-use discount applies automatically |

---

## Create-it steps (you run these — I can't touch billing/accounts)

### 1. Create the VM (gcloud CLI — fastest)
```bash
gcloud compute instances create meok-backend \
  --project=YOUR_PROJECT_ID \
  --zone=europe-west2-a \
  --machine-type=e2-standard-4 \
  --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB --boot-disk-type=pd-balanced \
  --tags=meok-backend
  # add --provisioning-model=SPOT for the cheap pre-launch option
```

### 2. Firewall — DO NOT expose Ollama/SOV3 raw to the internet
Ollama (:11434) and SOV3 (:3101) have **no auth**. Exposing them = anyone can use your compute / read memory.
**Safe pattern:** only open :443 (HTTPS) behind a reverse proxy with an API key; keep 11434/3101 internal-only.
```bash
# allow only HTTPS in; everything else stays closed
gcloud compute firewall-rules create meok-https --allow=tcp:443 --target-tags=meok-backend
# (NO rule for 11434 or 3101 — they listen on localhost only, proxied by Caddy/nginx)
```

### 3. Provision on the box (SSH in, then)
```bash
sudo apt update && sudo apt install -y python3.11 python3.11-venv postgresql-15 caddy
# Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen3:0.6b        # the bench winner — small, CPU-fine
# (optionally qwen3:4b for a 'better' tier; skip 8b on CPU)
# SOV3: clone sovereign-temple (it's gitignored locally — copy via scp or a private repo),
#   set up Postgres 15 + pgvector, run ./run-local.sh
# Caddy: reverse-proxy https://api.meok.ai/llm -> 127.0.0.1:11434 with a header API key check
```

### 4. Point MEOK ONE at it
- `router.py` left-brain: change `OLLAMA_HOST` from `localhost:11434` → `https://api.meok.ai/llm` (+ API key header).
- SOV3 calls: `SOV3_MCP` → `https://api.meok.ai/sov3/mcp`.
- Keep a **local fallback**: if the cloud is unreachable, fall back to localhost (so dev still works offline).

---

## Security checklist (non-negotiable — these services have no built-in auth)
- [ ] Ollama + SOV3 bind to `127.0.0.1` only, never `0.0.0.0`
- [ ] All external access via reverse proxy (Caddy auto-HTTPS) + API key header
- [ ] Firewall: inbound only :443 (+ :22 from your IP for SSH)
- [ ] Postgres: localhost only, strong password, not exposed
- [ ] Don't put secrets in the VM image; use env files with 600 perms

---

## Migration order (safe, reversible)
1. Stand up VM + Ollama + qwen3:0.6b → test `curl https://api.meok.ai/llm` from your Mac.
2. Mirror SOV3 → test `/sov3/mcp` reachable.
3. Flip MEOK ONE's router to cloud **with local fallback** → verify character still talks.
4. Only once verified: stop local Ollama on the M4 → reclaim 16GB + the memory that's been crashing us.
5. Keep `meok-one` server (:4173) local — it's tiny (39MB); only the LLM/SOV3 move off-box.

## What this fixes
- The 33GB crash: Ollama's 16GB models + SOV3 leave the M4; only the lightweight UI + one Python server stay local.
- Public path: the same VM becomes where MEOK ONE's backend lives when you deploy the frontend to Vercel.

## Decisions still needed from Nick
1. GCP **project ID** + confirm billing account (I can't see/touch these).
2. Pre-launch **spot (~£20/mo)** vs always-on **standard (~£90/mo)**?
3. Is `api.meok.ai` DNS free to point at the VM? (you own meok.ai)
4. How to get `sovereign-temple` onto the VM (it's gitignored locally) — private repo or scp tarball?
