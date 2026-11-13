---
title: MEOK Cosmos Reasoner
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
startup_duration_timeout: 1h
models:
  - nvidia/Cosmos3-Nano
tags:
  - cosmos
  - inference
  - deployment-candidate
---

# MEOK Cosmos Reasoner — deployment candidate

This is a generated serving profile from the Council of AI canonical repository,
`mcp/meok-gspc-layer0/cosmos-space`. It provides the model endpoint consumed by
the existing MEOK bridge. It does not replace MEOK coordination, the GSPC grader,
the retained evidence contract, payment recovery or human decisions.

**Status:** source and configuration candidate. A GPU image build, model load,
authenticated inference and MEOK task evaluation are still required. Publishing
these files does not establish a running Cosmos service or a trained MEOK model.

## What this profile serves

- NVIDIA `Cosmos3-Nano` Reasoner, with source revision
  `cec9d585b8e12e5aae0d6508aea94b1f25a35b46`.
- Published vLLM `0.23.0` image, pinned by manifest digest in `Dockerfile`.
- Text chat through `/v1/chat/completions`, model name `meok-cosmos3-nano`.
- One NVIDIA GPU, BF16, 8,192-token context, at most two sequences.
- No model tools, remote media, local file media, video generation, automatic
  training, conversation store or autonomous spending in this profile.

The initial bridge accepts text answers. A returned model tool request is an
unsupported result, not evidence that a tool ran. Native Cosmos capabilities
beyond this profile need a separate integration and evaluation.

## Hosting and storage

Use one **48 GB L40S** for the first Hugging Face GPU trial. Confirm the current
vendor rate, storage costs, tax and an explicit trial cutoff against the linked
Space pricing page. The image has not been GPU-tested in this change. CUDA
driver compatibility and actual context/concurrency headroom
must be checked on the selected host before adopting it.

CPU Basic, an 8 GB M2 or a 16 GB M4 is not the target runtime of this CUDA
profile. Those machines can operate MEOK, inspect evidence and call the hosted
service. An NVIDIA GPU is needed only while this inference service runs.

Space disk is ephemeral. An attached private Hugging Face Bucket can hold
download caches and approved temporary artifacts; set `HF_HOME` to an attached
cache directory only after checking the mount's write permissions and cache
behavior. Model and dataset release repositories supply pinned, versioned
artifacts. A bucket is mutable storage, not an inference processor or a
versioned training release. This profile does not configure a conversation
database and disables normal request logging. Hosting diagnostics and runtime
caches must be assessed separately before admitting private task content.

The model weights have their own **OpenMDW 1.1** terms. The server's software
licences do not replace the model licence. Read the exact model card and licence
at the pinned revision before use or redistribution.

## Activation steps

1. Review the source change and preserve the existing Space revision as rollback.
   Stage it as a Hugging Face pull request first; do not replace a serving
   fallback merely to show deployment progress.
2. Confirm the GPU trial budget, the Space owner's billing and compatible GPU
   availability. This source change never requests hardware or changes billing.
3. Set **`VLLM_API_KEY`** in Space Secrets to a fresh random secret of at least
   32 characters. Do not commit it. If model access requires a Hub token, use a
   separate least-privilege read token as **`HF_TOKEN`**, also a Space secret.
4. Upgrade the qualified target to one L40S and deploy the reviewed source.
   The first download and CUDA compilation can take several minutes.
5. Check `/health`, then an authenticated `/v1/models` response and a small
   authenticated `/v1/chat/completions` request. An unauthenticated model request
   must fail. `/invocations`, `/pause`, `/resume`, `/update_weights` and every
   other unlisted route must be unavailable through the public port. Record the
   source revision, loaded model revision, GPU, latency,
   output and observed cost; a model name alone is not identity verification.
6. Set the existing bridge environment below, test a real MEOK text task and
   retain the result. Keep the coordinator's governed-message and telemetry
   routes on their existing endpoint. Leave the current production default
   unchanged until the candidate passes the task comparison.
7. Pause the trial Space at the agreed cutoff. An upgraded Space is billed
   while starting or running, including idle periods; it runs indefinitely by
   default. Configure sleep explicitly for intermittent use.

```dotenv
MEOK_CHAT_BACKEND=cosmos
MEOK_CHAT_BASE_URL=https://YOUR-QUALIFIED-SPACE.hf.space/v1
MEOK_CHAT_MODEL=meok-cosmos3-nano
MEOK_CHAT_API_KEY=SET_IN_YOUR_SECRET_STORE
MEOK_CHAT_TIMEOUT_MS=90000
MEOK_CHAT_MAX_TOKENS=1024
```

The backend binds only to loopback port 8000. Port 7860 is a bounded allowlist
proxy: public `/health` returns only availability, and the two permitted model
routes require the application bearer. The proxy rejects streaming, tools,
media and unknown model names. Raw vLLM's own API key does not secure all of its
operational routes and is insufficient for public exposure.

The profile does not make a private HF Space publicly accessible: its Hub access
control and the application API key are separate. Qualify the selected access
path independently. Never expose the loopback backend directly.

For a configuration-only check, supply a non-production test value locally and
run `python3 launch.py --plan`. This does not import CUDA or download weights.

## Data and improvement

Serving an answer does not change model weights. The intended MEOK improvement
path is: retain only authorised task traces; verify outcomes; deduplicate and
separate training from held-out evaluation; publish a versioned training
snapshot; run an explicitly bounded compatible SFT/LoRA job; compare with the
unchanged base model; then promote or reject the candidate checkpoint. Family
adapters remain tied to their base model and revision. GSPC evaluation examples
must not silently enter training data.

No training examples, checkpoints or learning-quality claims are fabricated by
this deployment. Use the existing canonical evidence and measurement contracts.

## Sources

- [NVIDIA Cosmos3 backend cookbook](https://github.com/NVIDIA/cosmos-framework/blob/main/.agents/skills/cookbooks/cosmos3/README.md)
- [Cosmos3-Nano pinned model](https://huggingface.co/nvidia/Cosmos3-Nano/tree/cec9d585b8e12e5aae0d6508aea94b1f25a35b46)
- [Hugging Face GPU Space pricing and lifecycle](https://huggingface.co/docs/hub/spaces-gpus)
- [Space storage and attached volumes](https://huggingface.co/docs/hub/spaces-storage)
- [Hugging Face Storage Buckets](https://huggingface.co/docs/hub/storage-buckets)
