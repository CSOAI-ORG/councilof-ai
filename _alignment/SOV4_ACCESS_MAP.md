# SOV4 — GPU / Compute / Connection Access Map (verified 2026-07-15)
What's actually reachable RIGHT NOW (probed live), and what to add to help Hermes.

## COMPUTE TARGETS (list_compute, probed)
| Target | Type | State | GPU |
|--------|------|-------|-----|
| **byoc:modal** | Modal | ✅ WORKING (A100 used this session) | ✅ THE training GPU path |
| ssh:sov33-owem-micro | SSH | reachable | ❌ CPU-only coordinator |
| ssh:oracle-micro | SSH | reachable | ❌ CPU-only coordinator |
| ssh:m2 (Mac 192.168.1.159) | SSH | ❌ unreachable (home LAN, not routable from sandbox) | Mac GPU, owner-side only |
| ssh:meok-backend | SSH | ❌ probe timeout | — |

## CREDENTIALS (host.credentials.list, verified)
| Cred | State | Use |
|------|-------|-----|
| Modal | ✅ working | GPU train/fuse/eval |
| GitHub | ✅ | commit/push tree |
| Google Cloud | ✅ (service acct) | GCS/BigQuery |
| Literature Access | ✅ | research/papers |
| OpenAlex | ✅ | scholarly search |
| **NVIDIA_API_KEY** | ❌ NOT in sandbox env | inference brains — THE Phase-1 blocker |

## NVIDIA BioNeMo NIM — connector AVAILABLE but NO credential connected
- CORRECTION: host.credentials.list() shows NO NVIDIA entry -> the NVIDIA family is NOT connected in ANY mode.
- The NIM connector exists/available, but per the managed-endpoints skill 'connect saves the credential first',
  so with no NVIDIA credential row I CANNOT register endpoints yet. Owner must connect NVIDIA_API_KEY first.
- I can register REMOTE model endpoints via host.model_endpoints.register(url="https://<upstream>",
  credential="NVIDIA_API_KEY", ...) — no lifecycle scripts, plain HTTP client of BASE_URL.
- THIS is how the 3 different-arch emergence brains become reachable managed endpoints —
  ONCE the NVIDIA key is connected in remote mode (owner step, Customize -> Compute -> Model endpoints).

## WHAT TO ADD TO HELP HERMES (concrete, honest)
1. [N owner] Connect NVIDIA_API_KEY (fresh key) in remote mode -> unblocks inference brains + NIM endpoints.
   THIS is the single highest-value add: it unblocks the whole Phase-1 emergence proof.
2. [A] Once key live: register 3 REMOTE NVIDIA endpoints as the diverse-arch proposers
   (MoE + dense-reasoning + a 3rd distinct family) + 1 strong aggregator -> run MoA proof.
3. [N owner] Modal $25K startup credits (free, no equity) -> GPU headroom for FuseLLM student + bigger runs.
4. [B/N] Restore GCP tunnel (meok-backend 502) -> reaches the live SOV33 MCP mesh for serving.
5. [B/N] Bring m2 (Mac) reachable OR run Ollama locally -> free offline diverse brains (SOV333/SSM lane).

## HONEST BOTTOM LINE
- Training GPU: SOLVED (Modal, working).
- Inference brains: BLOCKED on the NVIDIA key reaching a live env — everything Phase-1 waits on this.
- Best single unblock: owner connects NVIDIA key in remote mode. Then I register the 3 diverse endpoints
  and the emergence proof fires the same hour.
