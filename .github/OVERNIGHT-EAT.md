# Overnight EAT — Grok · GitHub · Hugging Face · RunPod

Measurement, never certification. Empty stays empty. Mill JSON never rewrites GET `/api/gspc`.

## Alignment (what runs while you sleep)

| Layer | What | Cadence | Writes the board? |
|---|---|---|---|
| GitHub `public-root` | One writer of `public/root.json` (OIDC sign) | hourly `:07` | No (separate Merkle) |
| GitHub `hf-inference-mill` | Probe + FLEET-B mill via `router.huggingface.co/v1` | hourly `:17` | No. 403 = INFERENCE_FAIL artifact, cron stays armed |
| GitHub `eat-overnight` | Node health, board 22/15, restore signed FIN cards if flattened | every 2h `:47` | No |
| GitHub `hf-fin-shells` | OIDC re-sign UNMEASURED coverage | every 2h `:27` | No |
| GitHub `census-delta` | Hub listing SUMMARY | 04:30 UTC | No (`n_measured` stays 0) |
| Hugging Face Space `csoai/gspc-node` | `POST /v1/measure` instrument | always-on (sleeps) | No |
| RunPod KEEP 3090 `fpowppss5ngtkw` | Mill **client** (HF Inference), not a board writer | RUNNING | No |
| Grok bot scheduler `eat-overnight` | Restore unsigned FIN cards, recapture, close HF tabs | every 2h | No |

**Do not start** EXITED A100s (`3ggoud4gj4yv9f`, `fsfskfb6mdjikc`, `5ynpuvuiae807k`, …). Overnight mill is Inference Providers, not a new pod.

**Do not** fill the 7 UNMEASURED financial/index slots. **Do not** treat ZeroGPU as the fleet.

## Call shape (same as a model)

Subject: `POST https://router.huggingface.co/v1/chat/completions` `model=<slug>:<provider>`

Instrument: `POST https://csoai-gspc-node.hf.space/v1/measure` `Authorization: Bearer $HF_INFERENCE_TOKEN`

## Token

`HF_INFERENCE_TOKEN` needs Inference Providers scope. Until then mill/node stay **fail-closed** (INFERENCE_FAIL). That is overnight success, not a crash.
