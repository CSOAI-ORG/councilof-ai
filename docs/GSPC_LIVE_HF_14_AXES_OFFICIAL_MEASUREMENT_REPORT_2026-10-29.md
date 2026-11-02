# GSPC Live Hugging Face Router (`router.huggingface.co`) 14-Axis Official Measurement Report

- **Schema**: `csoai.gspc-live-hf-14-axes-official-report/1.0`
- **Issuer**: `CSOAI Ltd (UK Companies House 16939677)`
- **Observed On**: `2026-10-29`
- **Execution Mode**: `RUNTIME_OBSERVED_LIVE_HF_ROUTER` (`https://router.huggingface.co/v1/chat/completions`)
- **Total Canonical Model-Comparison Axes Executed**: `14`
- **Total Open-Weight Models Executed**: `4` (`meta-llama/Llama-3.3-70B-Instruct, Qwen/Qwen2.5-72B-Instruct, deepseek-ai/DeepSeek-V3-0324, google/gemma-3-27b-it`)
- **Total Frozen Bank Items per Model**: `885`
- **Total Live HTTP Completions Executed**: `3540` (`HTTP 200`: `3509`)
- **Report SHA-256**: `22f556a5c0e7a0a11b168aa6bd613f3d330d283964bc0284461f0b31a6ff5b76`

## 1. Executive Summary Table Across All 14 Canonical Model-Comparison Axes (`read-label-v1` & `exact-label-v1`)

| Axis (`14` Canonical) | Bank ($n$) | `Llama-3.3-70B` Acc (`n_valid`) | `Qwen2.5-72B` Acc (`n_valid`) | `DeepSeek-V3-0324` Acc (`n_valid`) | `Gemma-3-27B` Acc (`n_valid`) | Point Leader vs. Second-Best (`b` vs `c`, Exact McNemar $p$) | Separation Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `safety` | `36` | `0.9167` (`36/36`) | `0.9429` (`35/36`) | `1.0000` (`36/36`) | `1.0000` (`26/36`) | `DeepSeek-V3-0324` vs `Qwen2.5-72B-Instruct` (`b=2, c=0, p=0.5`) | **`TIE`** |
| `provenance` | `32` | `0.7500` (`32/32`) | `0.7188` (`32/32`) | `0.6250` (`32/32`) | `0.9032` (`31/32`) | `gemma-3-27b-it` vs `Llama-3.3-70B-Instruct` (`b=6, c=2, p=0.289062`) | **`TIE`** |
| `continuity` | `33` | `0.5455` (`33/33`) | `0.6364` (`33/33`) | `0.6364` (`33/33`) | `0.4848` (`33/33`) | `Qwen2.5-72B-Instruct` vs `DeepSeek-V3-0324` (`b=1, c=1, p=1.0`) | **`TIE`** |
| `conformance` | `35` | `0.8571` (`35/35`) | `0.8000` (`35/35`) | `0.9429` (`35/35`) | `0.8000` (`35/35`) | `DeepSeek-V3-0324` vs `Llama-3.3-70B-Instruct` (`b=4, c=1, p=0.375`) | **`TIE`** |
| `openness` | `32` | `0.8750` (`32/32`) | `0.9375` (`32/32`) | `0.9688` (`32/32`) | `0.7188` (`32/32`) | `DeepSeek-V3-0324` vs `Qwen2.5-72B-Instruct` (`b=2, c=1, p=1.0`) | **`TIE`** |
| `machinery-conformity` | `33` | `0.3636` (`33/33`) | `0.2121` (`33/33`) | `0.5758` (`33/33`) | `0.3333` (`33/33`) | `DeepSeek-V3-0324` vs `Llama-3.3-70B-Instruct` (`b=17, c=10, p=0.247789`) | **`TIE`** |
| `cross-reality` | `32` | `0.4688` (`32/32`) | `0.5625` (`32/32`) | `0.8438` (`32/32`) | `0.6250` (`32/32`) | `DeepSeek-V3-0324` vs `gemma-3-27b-it` (`b=11, c=4, p=0.118469`) | **`TIE`** |
| `detector-interop` | `33` | `0.6667` (`33/33`) | `0.8485` (`33/33`) | `1.0000` (`33/33`) | `0.6667` (`33/33`) | `DeepSeek-V3-0324` vs `Qwen2.5-72B-Instruct` (`b=5, c=0, p=0.0625`) | **`TIE`** |
| `art5-safeguard` | `36` | `1.0000` (`36/36`) | `1.0000` (`36/36`) | `0.9722` (`36/36`) | `0.9722` (`36/36`) | `Llama-3.3-70B-Instruct` vs `Qwen2.5-72B-Instruct` (`b=0, c=0, p=1.0`) | **`TIE`** |
| `affect` | `41` | `0.8293` (`41/41`) | `0.7805` (`41/41`) | `0.8293` (`41/41`) | `0.7297` (`37/41`) | `Llama-3.3-70B-Instruct` vs `DeepSeek-V3-0324` (`b=2, c=2, p=1.0`) | **`TIE`** |
| `jail` | `69` | `0.8841` (`69/69`) | `0.9855` (`69/69`) | `0.7536` (`69/69`) | `0.7246` (`69/69`) | `Qwen2.5-72B-Instruct` vs `Llama-3.3-70B-Instruct` (`b=7, c=0, p=0.015625`) | **`SEPARATED`** |
| `care` | `199` | `0.3673` (`196/199`) | `0.2323` (`198/199`) | `0.4133` (`196/199`) | `0.3115` (`122/199`) | `DeepSeek-V3-0324` vs `Llama-3.3-70B-Instruct` (`b=31, c=23, p=0.340891`) | **`TIE`** |
| `governance` | `237` | `0.6118` (`237/237`) | `0.7046` (`237/237`) | `0.7173` (`237/237`) | `0.5401` (`237/237`) | `DeepSeek-V3-0324` vs `Qwen2.5-72B-Instruct` (`b=24, c=21, p=0.765992`) | **`TIE`** |
| `swarm` | `37` | `0.0541` (`37/37`) | `0.1892` (`37/37`) | `0.0833` (`36/37`) | `0.5000` (`2/37`) | `Qwen2.5-72B-Instruct` vs `DeepSeek-V3-0324` (`b=4, c=0, p=0.125`) | **`TIE`** |

## 2. Per-Axis Bank Digests, Measure G2 Gate Verdicts & Sample `hf_completion_id` Receipts

### Axis: `safety` (`gpu-offload/kaggle-gspc-batch/banks/gspc-agi.jsonl`, `n = 36`, `bank_sha256: f963e3c739c7d75b…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.9167` (`36/36`, `CARD_CANDIDATE_UNSIGNED`) | `0.9167` (`36/36`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-73308620-2f93-4e0b-a8fe-d49339e3f325` (`safety-0001`) | `fb5a86e96380911a…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.9429` (`35/36`, `CARD_CANDIDATE_UNSIGNED`) | `0.9429` (`35/36`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-R6CLezWjr9DfLCTEhEgOtIrf` (`safety-0001`) | `fb5a86e96380911a…` |
| `deepseek-ai/DeepSeek-V3-0324` | `1.0` (`36/36`, `HOLD_FOR_REVIEW`) | `1.0` (`36/36`, `HOLD_FOR_REVIEW`) | `chatcmpl-RI9Fsm52gjgAJtWd7JeHGK2R` (`safety-0001`) | `fb5a86e96380911a…` |
| `google/gemma-3-27b-it` | `1.0` (`26/36`, `NO_RESULT_UNPARSED_GT_10PCT`) | `1.0` (`26/36`, `NO_RESULT_UNPARSED_GT_10PCT`) | `chatcmpl-RfYbyAga1HtLVZZBCQEMuQuR` (`safety-0001`) | `23b57e1028e2a46b…` |

### Axis: `provenance` (`gpu-offload/kaggle-gspc-batch/banks/gspc-prv.jsonl`, `n = 32`, `bank_sha256: 5da9b25954ec575b…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.75` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.75` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-57aff04b-bc8d-41a6-9d0d-b5d77d3fbcbf` (`provenance-0001`) | `7cbcfd688ae0099f…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.7188` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.7188` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RsOUOpfc0rBt3KXxKPQuOzoz` (`provenance-0001`) | `7cbcfd688ae0099f…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.625` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.625` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RAkl8da5goPcsQ0kmgVybuvS` (`provenance-0001`) | `7cbcfd688ae0099f…` |
| `google/gemma-3-27b-it` | `0.9032` (`31/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.9032` (`31/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RBIB1uToKrAEeMtmP6DXHnTG` (`provenance-0001`) | `7cbcfd688ae0099f…` |

### Axis: `continuity` (`gpu-offload/kaggle-gspc-batch/banks/gspc-asi.jsonl`, `n = 33`, `bank_sha256: 25dd6a72ac5ad661…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.5455` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.5455` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-02723c66-6b1d-423d-81bb-c198a3e614cb` (`continuity-0001`) | `51e8994d20431cba…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.6364` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.6364` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RIDJv0Hvsw3byvjpwHhLpdGR` (`continuity-0001`) | `51e8994d20431cba…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.6364` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.6364` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RwtQlpnA81hfn1w7ApGNAT33` (`continuity-0001`) | `51e8994d20431cba…` |
| `google/gemma-3-27b-it` | `0.4848` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.4848` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-R7qykMG4FO11fqFZsZDKfyOt` (`continuity-0001`) | `51e8994d20431cba…` |

### Axis: `conformance` (`gpu-offload/kaggle-gspc-batch/banks/gspc-mcp.jsonl`, `n = 35`, `bank_sha256: dc494ae6d1cb8abe…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.8571` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `0.8571` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-40dfe49f-af4d-438c-b202-6dcdd22db9be` (`conformance-0001`) | `666803c08bc9f7ea…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.8` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `0.8` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RHcVYE7dKL6DrygUmLY33NrY` (`conformance-0001`) | `666803c08bc9f7ea…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.9429` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `0.9429` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RfEU7ZMqL3c1ixd1sOipqXOa` (`conformance-0001`) | `666803c08bc9f7ea…` |
| `google/gemma-3-27b-it` | `0.8` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `0.8` (`35/35`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-R5gbRCcWrtd76fstpIR0b5tO` (`conformance-0001`) | `666803c08bc9f7ea…` |

### Axis: `openness` (`gpu-offload/kaggle-gspc-batch/banks/gspc-oss.jsonl`, `n = 32`, `bank_sha256: 644dc6de897896a8…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.875` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.875` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-e0c0e2ca-0feb-4fa3-be1e-78315e1b4ae7` (`openness-0001`) | `83824ff28dafc888…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.9375` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.9375` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-Rbp4OtKwml1tuHBOMULMhYJJ` (`openness-0001`) | `83824ff28dafc888…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.9688` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.9688` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RSQRXUgS2LYAcRJLyCNvhr7C` (`openness-0001`) | `83824ff28dafc888…` |
| `google/gemma-3-27b-it` | `0.7188` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.7188` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-Rp5tgCqtHaLD4iEo4EM6sAxC` (`openness-0001`) | `83824ff28dafc888…` |

### Axis: `machinery-conformity` (`public/interop/banks/hf-official/gspc-machinery-conformity.jsonl`, `n = 33`, `bank_sha256: fdbe463c3f026860…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.3636` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.3636` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-56020a0d-3565-422f-b9cf-e2b50c8e7e02` (`machinery-conformity-0001`) | `2710bb19fd6a5224…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.2121` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.2121` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RX0EejBYBcBCe4fYc0JOpPOW` (`machinery-conformity-0001`) | `2710bb19fd6a5224…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.5758` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.5758` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RwWiS0LPU4R9Xm6Q0KPVgpNE` (`machinery-conformity-0001`) | `0cc7c24dff65affa…` |
| `google/gemma-3-27b-it` | `0.3333` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.3333` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RtTqaclbi2PLtLrGorVCoXds` (`machinery-conformity-0001`) | `2710bb19fd6a5224…` |

### Axis: `cross-reality` (`public/interop/banks/hf-official/gspc-cross-reality.jsonl`, `n = 32`, `bank_sha256: 9877a2b2f9752f37…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.4688` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.4688` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-23ed45cd-2654-4aca-8fc6-c97df4755f72` (`cross-reality-0001`) | `9092bec2ae8859f0…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.5625` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.5625` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RBUXakzSazLYPjzhDxneWeMU` (`cross-reality-0001`) | `9092bec2ae8859f0…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.8438` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.8438` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RKsAbw4AneQWc9c66n57tNZj` (`cross-reality-0001`) | `8adb7edfc88fd891…` |
| `google/gemma-3-27b-it` | `0.625` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `0.625` (`32/32`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RQK8lSJX6b0nPYqOuVXMsYgD` (`cross-reality-0001`) | `9092bec2ae8859f0…` |

### Axis: `detector-interop` (`public/interop/banks/hf-official/gspc-detector-interop.jsonl`, `n = 33`, `bank_sha256: 73a30d6d32f4012b…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.6667` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.6667` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-5d42975c-135f-41a9-89c6-d69b4bc304e5` (`detector-interop-0001`) | `3eb869b3016260f8…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.8485` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.8485` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RmBeYeDLVc7OY3SayI2y9KP0` (`detector-interop-0001`) | `3eb869b3016260f8…` |
| `deepseek-ai/DeepSeek-V3-0324` | `1.0` (`33/33`, `HOLD_FOR_REVIEW`) | `1.0` (`33/33`, `HOLD_FOR_REVIEW`) | `chatcmpl-RAVB8q7tR9c0TWjnWh0teAkX` (`detector-interop-0001`) | `3eb869b3016260f8…` |
| `google/gemma-3-27b-it` | `0.6667` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `0.6667` (`33/33`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RSDSsAqkydITtwT3RJ83xNyI` (`detector-interop-0001`) | `3eb869b3016260f8…` |

### Axis: `art5-safeguard` (`public/interop/banks/hf-official/gspc-art5-safeguard.jsonl`, `n = 36`, `bank_sha256: 60f08ca251d3afb6…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `1.0` (`36/36`, `HOLD_FOR_REVIEW`) | `1.0` (`36/36`, `HOLD_FOR_REVIEW`) | `chatcmpl-24271c90-ef40-4820-9cd5-dbe78a985f15` (`art5-safeguard-0001`) | `83824ff28dafc888…` |
| `Qwen/Qwen2.5-72B-Instruct` | `1.0` (`36/36`, `HOLD_FOR_REVIEW`) | `1.0` (`36/36`, `HOLD_FOR_REVIEW`) | `chatcmpl-RcmUuckDttlxJXYUfyluZvBP` (`art5-safeguard-0001`) | `83824ff28dafc888…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.9722` (`36/36`, `CARD_CANDIDATE_UNSIGNED`) | `0.9722` (`36/36`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RMrfRFdcbCvyV8rEmjIibXTl` (`art5-safeguard-0001`) | `83824ff28dafc888…` |
| `google/gemma-3-27b-it` | `0.9722` (`36/36`, `CARD_CANDIDATE_UNSIGNED`) | `0.9722` (`36/36`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RchSavwtNzSASDzd6pYrlHkq` (`art5-safeguard-0001`) | `83824ff28dafc888…` |

### Axis: `affect` (`public/interop/banks/hf-official/gspc-affect.jsonl`, `n = 41`, `bank_sha256: 5ce11c084a6e968c…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.8293` (`41/41`, `CARD_CANDIDATE_UNSIGNED`) | `0.8293` (`41/41`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-f6ae2a6e-fcb9-4875-9a17-a7c1f3eaf363` (`affect-0001`) | `aa3b4c8e61087a42…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.7805` (`41/41`, `CARD_CANDIDATE_UNSIGNED`) | `0.7805` (`41/41`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RflCkK8fPE08AQcKJkxgccLO` (`affect-0001`) | `aa3b4c8e61087a42…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.8293` (`41/41`, `CARD_CANDIDATE_UNSIGNED`) | `0.8293` (`41/41`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-Rm2Mu2sbcaMIdciwUSYUMuFM` (`affect-0001`) | `aa3b4c8e61087a42…` |
| `google/gemma-3-27b-it` | `0.7297` (`37/41`, `CARD_CANDIDATE_UNSIGNED`) | `0.7297` (`37/41`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-R2Miqyc1x3B6yhQAIuZbq7ii` (`affect-0001`) | `aa3b4c8e61087a42…` |

### Axis: `jail` (`client/src/data/ruler-jail-goldbank.json`, `n = 69`, `bank_sha256: 4830fbdae8cdc571…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.8841` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `0.8841` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-86ba6597-f9a6-4b08-9d2d-dc4d27c41d8c` (`esc-sh-1`) | `42b4cd60e1d90d6a…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.9855` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `0.9855` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-Rvnx1mIrDGTwJNnaREW7hkpX` (`esc-sh-1`) | `42b4cd60e1d90d6a…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.7536` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `0.7536` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RCJtc2qOzntlOnf7pTgmVhYI` (`esc-sh-1`) | `42b4cd60e1d90d6a…` |
| `google/gemma-3-27b-it` | `0.7246` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `0.7246` (`69/69`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RmcjbhUuI8vRMwpg5kRtCfTj` (`esc-sh-1`) | `ebca9a34b4a863de…` |

### Axis: `care` (`gpu-offload/kaggle-gspc-batch/banks/gspc-care.jsonl`, `n = 199`, `bank_sha256: cee5e47a31f1db6c…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.3673` (`196/199`, `CARD_CANDIDATE_UNSIGNED`) | `0.3673` (`196/199`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-61f2b782-b352-45be-aa52-ee339c99101d` (`care-0001`) | `5feceb66ffc86f38…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.2323` (`198/199`, `CARD_CANDIDATE_UNSIGNED`) | `0.2323` (`198/199`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-Ro3WCY8EXlIgr7FvUnyp9DA8` (`care-0001`) | `5feceb66ffc86f38…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.4133` (`196/199`, `CARD_CANDIDATE_UNSIGNED`) | `0.4133` (`196/199`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RRKoRTpx7iuBqphO8R0Oqnib` (`care-0001`) | `5feceb66ffc86f38…` |
| `google/gemma-3-27b-it` | `0.3115` (`122/199`, `NO_RESULT_UNPARSED_GT_10PCT`) | `0.3115` (`122/199`, `NO_RESULT_UNPARSED_GT_10PCT`) | `chatcmpl-RGYE8S3C4I5UvZm0nNW2lYkE` (`care-0001`) | `4fc40c1d92804e1c…` |

### Axis: `governance` (`gpu-offload/kaggle-gspc-batch/banks/gspc-gov.jsonl`, `n = 237`, `bank_sha256: b93f9808f0141673…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.6118` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `0.6118` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-20bb40ed-d219-41da-acff-f2b1be389194` (`governance-0001`) | `5eb95ba9ff576cf1…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.7046` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `0.7046` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RNLAfzSG9foVJNUYMVTzMcRz` (`governance-0001`) | `5eb95ba9ff576cf1…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.7173` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `0.7173` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-RXecByIMBjfpPILJxoCG8Fym` (`governance-0001`) | `5eb95ba9ff576cf1…` |
| `google/gemma-3-27b-it` | `0.5401` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `0.5401` (`237/237`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-Rfcyoauq8qNHIpRJIpOmysxf` (`governance-0001`) | `5eb95ba9ff576cf1…` |

### Axis: `swarm` (`public/interop/banks/hf-official/gspc-swarm.jsonl`, `n = 37`, `bank_sha256: ab318986d684ebf8…`)

| Model | `exact-label-v1` Acc (`n_valid`, Gate) | `read-label-v1` Acc (`n_valid`, Gate) | Sample `hf_completion_id` (`item_id`) | Sample `response_sha256` |
| :--- | :---: | :---: | :---: | :---: |
| `meta-llama/Llama-3.3-70B-Instruct` | `0.0541` (`37/37`, `CARD_CANDIDATE_UNSIGNED`) | `0.0541` (`37/37`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-6f09fd03-77c6-4d55-9c52-7eac3f590b6b` (`swarm-0001`) | `a8fdba3c42f2c898…` |
| `Qwen/Qwen2.5-72B-Instruct` | `0.1892` (`37/37`, `CARD_CANDIDATE_UNSIGNED`) | `0.1892` (`37/37`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-R0ZqAPHc0cJ2V64p7ODD31Sz` (`swarm-0001`) | `6454072f5c62a150…` |
| `deepseek-ai/DeepSeek-V3-0324` | `0.0833` (`36/37`, `CARD_CANDIDATE_UNSIGNED`) | `0.0833` (`36/37`, `CARD_CANDIDATE_UNSIGNED`) | `chatcmpl-R7ACnnhwXFuIoPdCx5IcnJxi` (`swarm-0001`) | `689d39296c6c4366…` |
| `google/gemma-3-27b-it` | `0.5` (`2/37`, `UNMEASURED_incomplete_run_TRANSPORT`) | `0.5` (`2/37`, `UNMEASURED_incomplete_run_TRANSPORT`) | `chatcmpl-R05AdrNaNdo5mwLYaOSlBz84` (`swarm-0001`) | `186c814d0cfe8bae…` |

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
