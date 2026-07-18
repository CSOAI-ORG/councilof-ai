# MEOK — GCP Bootstrap Methods (researched 2026-05-31)

**Local state:** gcloud NOT installed. `docker` ✓ and `vercel` ✓ already present. No GCP auth/config yet.
**Target:** always-on (or scale-to-zero) home for SOV3 + Ollama qwen3:0.6b, off the 16GB M4.

---

## Step 0 — Install gcloud (needed for ALL methods)
Apple Silicon, Homebrew (cleanest):
```bash
brew install --cask gcloud-cli      # community cask (was google-cloud-sdk; renamed)
gcloud init                          # opens browser → pick Google account + project
gcloud auth application-default login
```
~600MB download. This is the only thing that touches your Mac; everything else runs in the cloud. Safe on RAM (CLI, not a server).

---

## The 3 methods, compared for YOUR case

### Method A — Cloud Run + container (RECOMMENDED, pre-revenue) ⭐
Serverless. **Scale-to-zero = pay ~£0 when idle**, spins up on request.
- **Cost:** ~£0–15/mo at your usage (only billed while a request runs). Best while Stripe = £0.
- **Cold start:** ~10–30s first request after idle (model load). Fine for a backend; a beat slow for a live demo's first message.
- **qwen3:0.6b fits CPU Cloud Run** — no GPU, no GPU quota request, cheapest tier.
- Ollama as a container: image `ollama/ollama`, `OLLAMA_HOST=0.0.0.0:8080`, `OLLAMA_KEEP_ALIVE=-1`, `--min-instances=0 --max-instances=2` (cost cap), models on a GCS volume mounted at `/root/.ollama` so they persist across cold starts.
```bash
gcloud run deploy meok-llm \
  --image=ollama/ollama --port=8080 \
  --cpu=4 --memory=8Gi --region=europe-west2 \
  --min-instances=0 --max-instances=2 \
  --set-env-vars=OLLAMA_HOST=0.0.0.0:8080,OLLAMA_KEEP_ALIVE=-1 \
  --allow-unauthenticated   # ← replace with an API-key/IAM guard before real use
```
- **Caveat:** SOV3 (Postgres + pgvector + long-running agents) is NOT a clean fit for stateless scale-to-zero. Put **LLM on Cloud Run, SOV3 on a small VM** (hybrid) — or run both on the VM (Method B).

### Method B — Compute Engine VM (best for SOV3 / always-on)
A real always-on box. Simplest mental model; SOV3's Postgres + agents run naturally.
- **Cost:** ~£90/mo on-demand `e2-standard-4` / **~£20/mo as a Spot VM** (can be reclaimed, auto-restarts).
- **No cold start** — always warm (good for live demos/pitches).
- This is the spec already in `MEOK_GCP_HOSTING_PLAN_2026-05-31.md`.
```bash
gcloud compute instances create meok-backend \
  --zone=europe-west2-a --machine-type=e2-standard-4 \
  --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB --tags=meok-backend
  # add --provisioning-model=SPOT for the ~£20/mo option
```

### Method C — Terraform (only when it's worth codifying)
Infrastructure-as-code: the VM/Cloud Run/firewall/DNS all defined in `.tf` files, reproducible.
- **Worth it later** when you have paying customers + want repeatable multi-region. **Overkill now** — adds a tool to learn for a single box. Skip until Method A/B is proven.

---

## RECOMMENDATION for now (16GB M4, pre-revenue)
**Hybrid, cheapest-first:**
1. **SOV3 → Spot VM (Method B, ~£20/mo)** — it needs a real box for Postgres + agents, and Spot is cheap.
2. **Ollama qwen3:0.6b → on the SAME Spot VM** (CPU, tiny model) — no need for separate Cloud Run yet; one box, one bill.
3. Revisit Cloud Run scale-to-zero only if the £20/mo Spot bill bites, or split the LLM out under load later.

Net: **~£20/mo, one VM, always-warm, frees the M4's 16GB.** Simpler than juggling Cloud Run + VM, and avoids cold-start on a live character demo.

---

## What I need from you to generate the exact deploy scripts
1. GCP **project ID** (+ billing enabled?) — I can't see/create these.
2. OK to **`brew install --cask gcloud-cli`** on your Mac now? (safe, CLI only)
3. **Spot (~£20/mo)** confirmed as the start?
4. `sovereign-temple` is gitignored locally — **private repo** or **scp tarball** to get it onto the VM?

## Sources
- Install: https://docs.cloud.google.com/sdk/docs/downloads-homebrew · https://formulae.brew.sh/cask/gcloud-cli
- Cloud Run + Ollama: https://docs.cloud.google.com/run/docs/tutorials/gpu-gemma-with-ollama · https://geshan.com.np/blog/2025/01/ollama-google-cloud-run/
- Deploy to Compute Engine: https://docs.cloud.google.com/build/docs/deploying-builds/deploy-compute-engine
