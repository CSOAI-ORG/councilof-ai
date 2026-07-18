# Free compute + free training data — honest census (2026-07-15)

The goal: build the Sovereign student (T path) on FREE compute + FREE commercial-safe data. This is the real,
verified状态 — what's usable now, what's gated, what's dead. No hype.

## Free COMPUTE (training + inference)
| Surface | Free tier | Good for | Status |
|---|---|---|---|
| **Groq API** | free, fast | inference (70B, 120B) | 🟢 LIVE — powers the shared brain |
| **Oracle micro VM** | always-free (1GB/2core/42GB) | always-on brain, data-eating, light jobs | 🟢 LIVE (sovereign-hermes) |
| **Google Colab** | free T4 (~ few hrs/session) | QLoRA training the student | 🟢 usable — run `sov33_gpu_fire.py` |
| **Kaggle** | free T4×2, ~30 GPU-hrs/week | training, longer runs | 🟢 usable (browser; internet toggle) |
| **Modal** | ~$30/mo free credits | serverless GPU training | 🟢 AUTHED — `sov33_modal_train.py` |
| **HF Spaces** | free CPU (+ community GPU grants) | demos, small inference | 🟢 usable |
| **GitHub Codespaces** | ~60 core-hrs/mo | CPU dev, data prep | 🟢 usable |
| **NVIDIA NIM API** | free hosted up to 405B | biggest free inference | 🟡 key rejected — REGEN at build.nvidia.com |
| **Lightning AI** | limited free hrs | SSH Studios | 🔴 BLOCKED — account gated behind billing (support code 03920104); needs card |
| GCP / vast.ai | — | — | 🔴 dead (billing disabled / not set up) |

**Honest GPU reality:** there is NO free *persistent SSH* GPU box. Free GPU = Groq/NVIDIA (inference APIs) +
Colab/Kaggle/Modal (training, ephemeral). That's plenty to train small/QLoRA students — not to train frontier/T
from scratch (that needs 40+ H100s, £millions). We build via distillation on these free GPUs. That's the path.

## Free TRAINING DATA — commercial-safe only (see sov33_eat_datasets.py)
| Dataset | License | Use | Eat? |
|---|---|---|---|
| Open-Orca/OpenOrca | MIT | instruction-following | ✅ |
| databricks-dolly-15k | CC-BY-SA-3.0 | instruction/QA | ✅ |
| OpenAssistant/oasst1 | Apache-2.0 | assistant dialogue (needs pairing) | ✅ (prompts as seeds) |
| coastalcph/lex_glue (eurlex) | CC-BY (verify) | EU legal classification (our domain) | ✅ (verify per-task) |
| tatsu-lab/alpaca | **CC-BY-NC** | — | ❌ non-commercial — EXCLUDED |
| HuggingFaceH4/no_robots | **CC-BY-NC** | — | ❌ non-commercial — EXCLUDED |

**Why exclude the NC sets:** a commercial Sovereign product legally can't train on non-commercial data. We only
eat Apache/MIT/CC-BY/CC-BY-SA. Honesty > corpus size. Our own `sovereign_distilled.jsonl` (113 governance pairs,
teacher-generated) stays the domain core; the open sets add general capability.

## The build recipe (free, honest)
1. **Eat** open data on the VM/Colab: `pip install datasets && python3 sov33_eat_datasets.py --per 2000`
2. **Merge** with `expert_data/sovereign_distilled.jsonl` (our governance core)
3. **Train** the student (QLoRA) on Colab/Kaggle/Modal: `sov33_gpu_fire.py`
4. **Serve** it via the shared brain, signed.

## Two owner unlocks that widen the funnel
- **NVIDIA key regen** → 405B teacher generates far better distillation data (bigger teacher = smarter student).
- **os.meok.ai → shared brain:** the brain is localhost-only; for the live site to call it, it must be made
  public (Oracle security list + iptables + public bind) OR the site keeps calling Groq directly. Flagged, not done.
