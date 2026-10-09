## MODELS Cadence — 2026-10-01T12:30Z (updated)

### FIXED this session
- **DesktopCommander (M4)**: ENOSPC root cause (`desktop-commander-remote.out.log` 594MB) truncated; LaunchAgent kickstarted. PID healthy, v0.2.51, KeepAlive. Disk still critical (~2.8Gi free) — keep DC logs truncated.
- **RunPod SSH**: old `194.26.196.156:22081` is dead. Recovery CPU pod `sfnl3hfcknpti5` re-keyed to `runpodctl-ssh-key` (was `fleet-oracle-20260925`, private key not on Mac). Helper: `/Users/nicholas/.runpod/csoai-ssh.sh` (resolves rotating port via `runpodctl ssh info`).
- **GPU mill host**: new SECURE 4090 `ibsaxwhchu6vf0` (`csoai-4090-mill-20261001`) in **EU-RO-1** (network volume `u6bcx7p3uc` lives there). `$0.74/hr`. Ollama 0.35.0 installed; store `/workspace/mill4090/ws/ollama-models` has **phi3.5:3.8b, mistral:7b, llama3.2:3b**.
- **GSPC worker cycle RESTORED** on 4090: `http://<pod>:8888` reports
  `state=RUNNING`, `cycle=1`, `failed_runs=0`, `successful_runs` counting up, job `gov-phi35` / axis=governance / bank 237 items.
  Logs: `/workspace/gspc-logs/worker.log`. State: `/workspace/gspc-worker/state/health.json`.
- **Hub-queue mill can run outside GHA**: `harness/gspc-top100/mill_hub_queue.py` works on the Mac with axis-named banks (`/tmp/mill-banks-final` from `public/interop/mill-evidence/bank-*.jsonl`). Queue rows need `id` + `pipeline_tag` + `rank`. It **never signs** and never marks MEASURED.

### STILL BLOCKED (owner / external)
1. **GitHub Actions account-disabled** — `gh workflow run hub-queue-mill.yml` → HTTP 422 "Actions has been disabled for this user." Ticket **#4720908**. Last GHA run 2026-09-15T08:06Z. No runners registered. **Cannot re-enable via API.** Owner: https://github.com/settings/billing/summary and/or reply to #4720908.
   - Until then: no GHA mill cron, **no OIDC board signing**, no GHA deploy gates. Zero checks is absence of a gate, not a pass.
2. **Provider API keys all dead** (hub mill cannot grade remote hub models):
   - HF `HUGGINGFACE_TOKEN`: **Invalid user token** (401)
   - OpenRouter: **HTTP 402 insufficient credits** (never purchased)
   - Groq: **HTTP 403**
   - Gemini: **HTTP 401**
   - NVIDIA NIM: **HTTP 410 Gone**
   - Owner: refresh HF token (with org-write if mirroring), fund OpenRouter or retire it, rotate Groq/Gemini/NIM keys as needed.
3. **Do not reset GPU mill or start A100** without owner OK (OWNER_ASKS). Current 4090 is intentional.

### Mill paths (honest)
| Path | Status | Notes |
|------|--------|-------|
| GHA `hub-queue-mill.yml` | DEAD | account Actions disabled |
| Local `mill_hub_queue.py` | WORKS | needs live provider keys to stage cards |
| GPU `mill4090` / ollama | WORKS | 3 models pulled; morning slices COMPLETE 14/14; next model needs a pin from 3090-intake-receipts |
| GSPC worker `runpod_gspc_worker.py` | ENDPOINT LIVE | cycle/failed_runs/state on :8888; last job `gov-phi35` attempted 237 items then `MODEL_DIGEST_CHANGED_DURING_RUN` after mid-run ollama reinstall — pin `61819fb3…` itself is correct |

### 4090 restart recipe (after container recycle)
```bash
apt-get install -y zstd
curl -fsSL https://ollama.com/install.sh | OLLAMA_VERSION=0.35.0 sh
setsid nohup env OLLAMA_MODELS=/workspace/mill4090/ws/ollama-models \
  OLLAMA_HOST=127.0.0.1:11434 /usr/local/bin/ollama serve >/workspace/gspc-logs/ollama-serve.log 2>&1 &
rm -f /workspace/gspc-worker/state/worker.lock
setsid nohup python3 /workspace/gspc-worker/runpod_gspc_worker.py \
  --config-dir /workspace/gspc-worker/jobs --state-dir /workspace/gspc-worker/state \
  --forever --health-bind 0.0.0.0 --health-port 8888 >/workspace/gspc-logs/worker.log 2>&1 &
```
Ollama is on **CPU** here (no lspci/CUDA). Do not reinstall ollama mid-run (digest flap).

### Next
1. Nick: re-enable Actions (billing / ticket #4720908).
2. Nick: restore at least one provider key (HF or Groq) so hub mill can stage unsigned cards again.
3. Optional: `pciutils` + NVIDIA CUDA libs so ollama uses the 4090 GPU; re-run `gov-phi35` with ollama left alone.
4. Optionally pick the next mill4090 model + 3090-intake digest pin for another local slice.

## 15:20Z mill production (phi3.5:3.8b on GPU 4090)

- GSPC worker: **13 successful_runs**, transport_ok, GPU-resident (`size_vram` full ~15GB after `pciutils` install).
- **12 unsigned cards** staged and copied to `councilof-ai-work/public/interop/mill-cards-unsigned/unsigned-*.json`.
  All `status=UNMEASURED`, `signature=null` (correct until OIDC sign + VALID).
  n≥30 (quotable after sign): care 56, affect 39, governance 35, openness 33, machinery-conformity 30.
  n<30 (unquotable): provenance 23, detector-interop 28, art5-safeguard 29, conformance 15, continuity 13, cross-reality 6, governance 10 (early run).
- Swarm `ALL_UNPARSED` root cause: `done_reason=length` at `max_tokens=32` (worker comment at runpod_gspc_worker.py:851). Raised swarm to 256 and other jobs to ≥64; re-run pending.
- Inbox total on disk: 1632 unsigned cards (pre-existing + these 12).
- **Watch cost**: unexpected pod `mjv14seghkidq6` `csoai-mtl4-meok-pull-h200` at **$4.59/hr** appeared 15:06Z. Not started by this lane — owner confirm keep/stop. Mill 4090 is `ibsaxwhchu6vf0` at $0.74/hr.

### Still owner-blocked
- GHA Actions disable (ticket #4720908) → no OIDC sign, cards stay UNMEASURED.
- Provider keys (HF 401 / OR 402 / Groq 403 / Gemini 401 / NIM 410) → hub-queue mill cannot grade remote hub models.

## 15:45Z multi-model grind

- Playlist **24 jobs** (phi3.5 axes + mistral:7b + llama3.2:3b on gov/affect/care/conformance/provenance/art5). Supervisor `keep-alive.sh` restarts ollama+worker if they die.
- **27 unsigned cards** on volume; copied to sign inbox. **11 n≥30** unsigned candidates, including:
  - llama3.2:3b care n=81, art5-safeguard n=31
  - phi3.5:3.8b care 56, affect 39, governance 35, openness 33, machinery-conformity 30
- Live: `state=RUNNING`, `failed_runs=0`, currently `care-mistral-7b`.
- **Peer process on 4090** (`csoai-m2-selected-review/claims-manual-recheck-review`) left untouched.
- Mac disk ~3.7Gi free after Cypress cache clear. H200 pod `mjv14seghkidq6` still up ($4.59/hr) — owner call.

Signing still requires GHA OIDC (ticket #4720908). Hub mill still needs a live provider key.

## 16:05Z fleet consolidation (owner directive)

- **STOPPED** H200 `mjv14seghkidq6` (gone), `sfnl3hfcknpti5` writer-recovery, `wrrks6yswt9qft` lanes-cpu8.
- **ONLY LIVE POD**: `ibsaxwhchu6vf0` `csoai-4090-mill-20261001` @ $0.74/hr — **all GSPC mill lives here**.
- Playlist expanded to **49 jobs** (phi3.5 / mistral:7b / llama3.2:3b × 12+ axes). keep-alive.sh holds ollama+worker.
- Sign inbox: 49 of today's cards (phi3.5 23 / mistral 19 / llama 7); **28 n≥30 unsigned**.
- DNS note: Mac resolver sometimes fails `rest.runpod.io` / `api.runpod.io`; stop/list works via `dig @1.1.1.1` + Host-pinned HTTPS.
