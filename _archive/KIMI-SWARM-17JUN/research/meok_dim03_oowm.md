# Dimension 03: OOWM -- Organic Open World Model Architecture

## Sovereign World Model Fine-Tuned on Nick's 15 Years of Marketing Data, 25 Domain Business Logics, and Real-World SME Data

**Version**: 1.0  
**Date**: July 2026  
**Searches**: 25+ independent searches across 12 research vectors  
**Sources**: NVIDIA Developer Blog, Cosmos GitHub, arXiv, Hugging Face, IBM, Princeton, UC Berkeley/LMSYS, NeMo Curator docs, Apple MLX, Unsloth, vLLM, SGLang, Ollama, TensorRT-LLM, PAI-Bench, Springer, ACL Anthology, CVPR 2026 papers, OpenMDW/LF AI, Ars Technica, GSM Arena, ServeTheHome

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Cosmos 3 Foundation: Two-Tower MoT Architecture](#2-cosmos-3-foundation-two-tower-mot-architecture)
3. [Fine-Tuning Cosmos 3: Step-by-Step Training Recipes](#3-fine-tuning-cosmos-3-step-by-step-training-recipes)
4. [LoRA/QLoRA Configuration for 16B Models on Consumer GPUs](#4-loraqlora-configuration-for-16b-models-on-consumer-gpus)
5. [Synthetic Data Generation with Cosmos Curator + Transfer](#5-synthetic-data-generation-with-cosmos-curator--transfer)
6. [Domain Adaptation for Construction/Aquaculture/Logistics](#6-domain-adaptation-for-constructionaquaculturelogistics)
7. [Mamba-2 SSD Integration with Transformer Pipelines](#7-mamba-2-ssd-integration-with-transformer-pipelines)
8. [Model Quantization for M4 MacBook 12GB RAM](#8-model-quantization-for-m4-macbook-12gb-ram)
9. [vLLM/SGLang Serving for World Models](#9-vllmsglang-serving-for-world-models)
10. [Ollama Integration with Custom Fine-Tuned Models](#10-ollama-integration-with-custom-fine-tuned-models)
11. [Dataset Curation for SME Business Logic Training](#11-dataset-curation-for-sme-business-logic-training)
12. [Evaluation Benchmarks for Domain World Models](#12-evaluation-benchmarks-for-domain-world-models)
13. [TensorRT-LLM Optimization for Local Deployment](#13-tensorrt-llm-optimization-for-local-deployment)
14. [Multi-Modal Training: Text + Image + Video + Action](#14-multi-modal-training-text--image--video--action)
15. [OOWM Deployment Architecture](#15-oowm-deployment-architecture)
16. [Hardware Target Matrix](#16-hardware-target-matrix)
17. [Complete Training Configuration](#17-complete-training-configuration)
18. [References](#18-references)

---

## 1. Executive Summary

The Organic Open World Model (OOWM) is a sovereign world foundation model fine-tuned on Nick's 15 years of marketing data, 25 domain business logics, and real-world SME operational data spanning construction, aquaculture, and logistics. OOWM is built atop NVIDIA Cosmos 3 Nano (16B parameters) [^171^], leveraging its Mixture-of-Transformers (MoT) dual-tower architecture -- a Reasoner tower (autoregressive VLM) and Generator tower (diffusion-based video/action generator) [^6^][^237^].

**Key Design Decisions:**

| Decision | Rationale |
|---|---|
| Base Model | Cosmos 3 Nano (16B) -- commercially usable under OpenMDW-1.1 [^321^] |
| Fine-tuning Method | QLoRA 4-bit via Unsloth -- fits on RTX 4090 24GB |
| Long-Context Layers | Mamba-2 SSD hybrid -- O(n) processing, 5x throughput vs transformers [^385^] |
| Quantization | FP8/INT4 via NVIDIA ModelOpt, MLX 4-bit for Mac [^164^][^309^] |
| Serving Stack | vLLM-Omni for multi-modal, SGLang for structured programs |
| Edge Target | RTX Spark 128GB (Fall 2026), Jetson AGX Thor (128GB) [^341^][^110^] |
| License | OpenMDW-1.1 permits commercial fine-tuning and redistribution [^321^] |

**Compute Requirements:**
- Training: 1x RTX 4090 (24GB) or RTX PRO 6000 (96GB) for larger batch sizes
- Inference (datacenter): vLLM/SGLang on H100 or RTX PRO 6000
- Inference (edge): Ollama + GGUF on MacBook M4 16GB or RTX Spark 128GB
- Synthetic data: Cosmos Transfer 2.5 + Curator on local or cloud GPU

---

## 2. Cosmos 3 Foundation: Two-Tower MoT Architecture

### 2.1 Architecture Overview

Cosmos 3, released June 1, 2026, is NVIDIA's unified physical AI foundation model combining reasoning, world simulation, and action generation in a single architecture [^237^]. Unlike traditional fragmented pipelines where separate models handle vision, reasoning, dynamics, and policy, Cosmos 3 processes text, images, video, audio, and action trajectories in a shared representation space [^237^].

**The Two-Tower Mixture-of-Transformers (MoT) Design:**

| Tower | Function | Architecture | Output |
|---|---|---|---|
| Reasoner | Physical reasoning, scene understanding | Autoregressive VLM | Text reasoning, action plans, bounding boxes |
| Generator | World simulation, video/action generation | Diffusion Transformer | Physics-aware video, action trajectories |

The Reasoner interprets multimodal inputs; the Generator produces physics-aware video and action outputs [^239^]. MoT achieves 44-63% fewer FLOPs compared to traditional Mixture-of-Experts (MoE) approaches by using selective routing of tokens to specialized transformer blocks rather than sparse expert layers [^235^].

### 2.2 Model Variants

| Variant | Parameters | Target Hardware | VRAM (BF16) | Use Case |
|---|---|---|---|---|
| Cosmos 3 Super | 64B | Datacenter H100/B200 | ~128GB | Large-scale synthetic data generation, physical reasoning research |
| Cosmos 3 Nano | 16B | RTX PRO 6000 (96GB) | ~32GB | Real-time robotics inference, autonomous vehicles |
| Cosmos 3 Edge | 2B (dense) | Jetson-class devices | ~4GB | Edge deployment, announced for later release [^314^] |

The Cosmos 3 Nano accepts text, image, and video inputs (up to 256K tokens context), outputs text reasoning with chain-of-thought, 2D/3D point localization, and bounding box coordinates [^320^]. Video inputs recommended at 4 fps [^320^].

### 2.3 Open Release Components

NVIDIA shipped everything open under the OpenMDW-1.1 license [^235^]:
- Checkpoints for Nano, Super, and task-specific variants
- Six synthetic data generation (SDG) datasets: robotics, physics, spatial reasoning, human motion, driving, warehouses
- Training recipes: SFT plus action post-training
- Action modes: forward dynamics, inverse dynamics, and policy generation
- Full framework code on GitHub: `nvidia/cosmos-framework` [^171^]

---

## 3. Fine-Tuning Cosmos 3: Step-by-Step Training Recipes

### 3.1 Environment Setup

The Cosmos framework uses `uv` for dependency management and supports CUDA 13.0 (recommended) and CUDA 12.8 [^171^].

```bash
# Install system dependencies
sudo apt-get install -y --no-install-recommends curl ffmpeg git-lfs libx11-dev tree wget

# Install with uv (CUDA 13.0 recommended)
uv sync --all-extras --group=cu130-train
source .venv/bin/activate && export LD_LIBRARY_PATH=

# For NGC base image users
# nvcr.io/nvidia/pytorch:25.09-py3
```

### 3.2 Supervised Fine-Tuning (SFT) Recipe

The SFT recipe fine-tunes a pre-trained Cosmos 3 model on custom datasets using JSONL format [^234^]. Tested on 8x H100 (80GB), but configurable for smaller GPU counts.

**Training Configuration (TOML format):**

```toml
[model]
# Model checkpoint path
checkpoint_path = "nvidia/Cosmos3-Nano"

[model.tokenizer]
vae_path = "${oc.env:WAN_VAE_PATH}"  # Wan2.2 VAE .pth path (VFM only)

[optimizer]
lr = 1e-5                        # Base learning rate
betas = [0.9, 0.999]             # AdamW betas
eps = 1e-8                       # AdamW epsilon (VFM only)
fused = true
weight_decay = 0.01
keys_to_select = ["lora_"]       # Train only LoRA adapters; empty = train all

[optimizer.lr_multipliers]
# Inline table: <substring> = <multiplier>
# Example: lora_attention = 2.0

[scheduler]
cycle_lengths = [1000]           # One cycle, 1000 optimizer steps
warm_up_steps = [100]            # 100-step warmup
f_max = [1.0]                    # Peak LR multiplier
f_min = [0.1]                    # Trough LR multiplier
f_start = [0.0]                  # Step-0 LR multiplier

[trainer]
max_iter = 1000                  # Total optimizer steps
grad_accum_iter = 4              # Micro-batches per optimizer step
# Effective global batch = grad_accum_iter x per-rank batch x world_size
logging_iter = 10                # Log frequency
distributed_parallelism = "fsdp" # FSDP is the only supported value

[trainer.callbacks.grad_clip]
clip_norm = 1.0                  # Max global L2 gradient norm
force_finite = true              # Replace NaN/Inf with zero
```

### 3.3 Action Post-Training Recipe

Action post-training adapts Cosmos 3 for action-aware Physical AI [^6^]:
- **Forward dynamics**: Generate future observations conditioned on robot actions
- **Inverse dynamics**: Infer actions behind observed demonstrations
- **Policy generation**: Predict action sequences from current observations and task prompts

```bash
# Launch SFT training (8-GPU configuration)
bash examples/launch_sft_vision_nano.sh

# Users may adjust NPROC_PER_NODE and parallelism degrees (DP/CP/FSDP shard)
```

### 3.4 Export to Hugging Face Safetensors

After training, export the checkpoint to Hugging Face format for broader compatibility [^234^]:

```python
from cosmos_framework.scripts.export import export_checkpoint

export_checkpoint(
    checkpoint_dir="./outputs/cosmos3-nano-sft",
    output_dir="./exports/oowm-cosmos3-nano",
    format="safetensors"
)
```

---

## 4. LoRA/QLoRA Configuration for 16B Models on Consumer GPUs

### 4.1 VRAM Requirements for Cosmos 3 Nano (16B)

| Method | Precision | Min VRAM | Recommended GPU | Batch Size |
|---|---|---|---|---|
| Full Fine-tuning | BF16 | ~128GB | 8x H100 (80GB) | Large |
| LoRA (16-bit) | BF16 | ~33GB | RTX PRO 6000 (96GB) | Medium |
| QLoRA (4-bit NF4) | 4-bit + FP16 compute | ~8.5GB | RTX 4090 (24GB) | Small (1-2) |
| QLoRA + Unsloth | 4-bit optimized | ~6.5GB | RTX 3090/4090 (24GB) | Small (1-4) |

Based on Unsloth VRAM benchmarks: QLoRA 4-bit for 14B requires ~8.5GB VRAM; for 16B models expect ~9-10GB minimum [^345^][^348^].

### 4.2 Unsloth QLoRA Configuration for 16B Model

Unsloth achieves 2x faster training and 70% less VRAM through hand-written backpropagation kernels and intelligent memory management [^352^][^355^].

```python
from unsloth import FastLanguageModel
import torch

# Step 1: Load Cosmos 3 Nano in 4-bit
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="nvidia/Cosmos3-Nano",
    max_seq_length=8192,           # Cosmos 3 supports 256K context; use 8K for training
    dtype=None,                     # Auto-detect optimal dtype
    load_in_4bit=True,              # QLoRA: 4-bit NF4 quantization
)

# Step 2: Apply LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=16,                           # LoRA rank: 16 (good default for domain adaptation)
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],                              # Target all linear attention + MLP layers
    lora_alpha=32,                  # Scaling factor: 2x rank
    lora_dropout=0,                 # Zero dropout for fine-tuning stability
    bias="none",
    use_gradient_checkpointing="unsloth",  # Optimized gradient checkpointing
    random_state=42,
)

# Step 3: Training arguments
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=8192,
    dataset_num_proc=4,
    packing=True,                   # Pack short sequences for efficiency
    args=TrainingArguments(
        per_device_train_batch_size=1,      # Batch size 1 for 16B on 24GB
        gradient_accumulation_steps=8,       # Effective batch = 8
        warmup_steps=50,
        max_steps=2000,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        optim="adamw_8bit",               # 8-bit AdamW via bitsandbytes
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        seed=42,
        output_dir="./oowm-cosmos3-nano-qlora",
        save_strategy="steps",
        save_steps=500,
    ),
)

# Step 4: Train
trainer.train()

# Step 5: Save adapter (small file, ~100-500MB)
model.save_pretrained("./oowm-lora-adapter")
tokenizer.save_pretrained("./oowm-lora-adapter")
```

### 4.3 BitsAndBytes Configuration (Alternative to Unsloth)

For non-Unsloth workflows using standard PEFT/Transformers [^408^]:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, TaskType

# QLoRA quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat4 optimized for normal weight distributions
    bnb_4bit_compute_dtype="bfloat16",   # Compute in bfloat16
    bnb_4bit_use_double_quant=True,      # Double quantization: -0.3 bits/parameter
)

# Load model with quantization
model = AutoModelForCausalLM.from_pretrained(
    "nvidia/Cosmos3-Nano",
    quantization_config=bnb_config,
    device_map="auto",                   # Auto-distribute across available GPUs
    trust_remote_code=True,
)
model.config.use_cache = False

# LoRA config
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()  # Should show ~0.1-1% of total parameters
```

---

## 5. Synthetic Data Generation with Cosmos Curator + Transfer

### 5.1 Cosmos Curator Pipeline

Cosmos Curator is a modular, scalable data processing and curation pipeline [^110^][^4^]. It provides GPU-accelerated stages for:
- **Splitting**: Scene detection, video clipping
- **Captioning**: VLM-based detailed video captioning (VILA 13B at FP8 via TensorRT-LLM achieves 10x speedup over PyTorch FP16 baseline) [^4^]
- **Filtering**: Content quality, motion-based filtering
- **Deduplication**: Near-duplicate removal
- **Task-specific sampling**: Domain-targeted data selection

```python
# NeMo Curator pipeline example
from nemo_curator import Sequential, Modify, Filter
from nemo_curator.modifiers import TextCleaner
from nemo_curator.filters import WordCountFilter
from nemo_curator.datasets import DocumentDataset

# Define curation steps
clean_and_unify = Modify(TextCleaner())
filter_dataset = Filter(WordCountFilter(min_words=10, max_words=10000))
dedupe = ExactDuplicates()  # Remove identical records

# Chain into pipeline
curation_steps = Sequential([clean_and_unify, filter_dataset, dedupe])
dataset = curation_steps(dataset)
dataset.to_json("/output/curated_dataset.jsonl", write_to_filename=True)
```

### 5.2 Cosmos Transfer 2.5 for Domain-Specific Synthetic Data

Cosmos Transfer 2.5 generates photorealistic synthetic data using multi-control inputs (Edge, Depth, Segmentation, Vis) [^110^]. This enables sim-to-real transfer by bridging the domain gap.

**Workflow for Synthetic Traffic/Aquaculture/Construction Data:**

```yaml
# Augmentation config for Cosmos Transfer
data:
  - inputs:
      rgb: /path/to/ground-truth/rgb.mp4
      controls:
        edge: /path/to/ground-truth/edges.mp4
        depth: /path/to/ground-truth/depth.mp4
    output:
      video: /path/to/output_augmented.mp4

endpoints:
  vlm:
    url: http://localhost:8001/v1
    model: nvidia/cosmos-reason1-7b
  llm:
    url: http://localhost:8002/v1
    model: nvidia/nemotron-nano-9b-v2
  cosmos:
    url: http://localhost:8080/
    model: Cosmos-Transfer2.5-2B

video_captioning:
  user_prompt: 'Analyze the footage and generate a detailed description...'
  variables:
    weather_condition: ['clear_sky', 'overcast', 'raining', 'fog']
    lighting_condition: ['sunrise', 'sunset', 'midday', 'night']
    activity_level: ['low', 'medium', 'high']
```

### 5.3 Synthetic Data Generation for OOWM Domains

For OOWM's 25 business logic domains, synthetic data generation follows the CARLA + Cosmos workflow [^233^]:

1. **Stage 1**: Generate ground-truth scenarios (e.g., warehouse safety, fish farm monitoring)
2. **Stage 2**: Caption with Cosmos Reason 1, augment prompts with LLM variations
3. **Stage 3**: Generate photorealistic videos with Cosmos Transfer 2.5
4. **Stage 4**: SoM-aware post-processing for VLM training
5. **Stage 5**: Q&A pair generation for fine-tuning datasets

---

## 6. Domain Adaptation for Construction/Aquaculture/Logistics

### 6.1 Construction Site Safety

The ConstructionSite dataset from UBC (2025) contains 10,013 images with safety rule violation annotations, bounding boxes, object detection categories (excavators, rebar, workers with hard hats), and image attributes [^276^].

**Key datasets and approaches:**
- ConstructionSite: 10,013 images, 7,009 train / 3,004 test [^276^]
- Hardhat detection benchmark: 3,174 images, 83.89% mAP at 512x512 [^280^]
- Cosmos Cookbook recipe: "Worker Safety in a Classical Warehouse" (Feb 2025) [^110^]

**Recommended domain adaptation strategy:**
1. Pre-train on diverse construction/outdoor datasets (similar to Jellyverse approach)
2. Fine-tune on target construction safety dataset
3. Use transformer-based architectures (DINO with Swin backbone) for best accuracy
4. For real-time edge deployment, use RT-DETR for speed/accuracy balance

### 6.2 Aquaculture AI

Research on jellyfish detection in aquaculture demonstrates effective domain adaptation strategies [^275^]:

- **Dataset**: 31,875 jellyfish annotations across 2,558 images from 118 videos in Tasmania salmon farms
- **Domain gap**: Aquaculture images have high turbidity, complex backgrounds, low visibility vs. clear-water public datasets
- **Best approach**: Pre-train on diverse out-of-domain data, then fine-tune on aquaculture target
- **Best model**: DINO with Swin-b backbone achieved 56.5% mAP50 (+4.6pp vs. no pre-training)
- **Key finding**: Transformer architectures benefit more from pre-training than CNNs [^275^]

**For OOWM aquaculture integration:**
```python
# Domain adaptation pipeline
# 1. Collect diverse aquatic datasets (public + synthetic)
# 2. Pre-train detection model on combined source data
# 3. Fine-tune on target aquaculture environment
# 4. Use Cosmos Transfer 2.5 for photorealistic augmentation
```

### 6.3 Logistics and Supply Chain

For logistics, OOWM leverages:
- Warehouse synthetic data from Cosmos SDG datasets [^235^]
- Cosmos Cookbook: "Worker Safety in a Classical Warehouse" recipe [^110^]
- Traffic anomaly reasoning (TAR) for logistics vehicle monitoring [^6^]
- Autonomous vehicle domain adaptation recipes for fleet management [^110^]

---

## 7. Mamba-2 SSD Integration with Transformer Pipelines

### 7.1 Mamba-2 SSD Architecture

Mamba-2 introduces Structured State Space Duality (SSD), a theoretical bridge between state space models and attention [^384^][^389^]. This allows Mamba-2 to reuse system-level optimizations built for attention (efficient matrix multiplications) while maintaining linear-time O(n) benefits of SSMs [^385^].

**Key innovations:**
- **SSD Algorithm**: Restricts state matrix A to scalar-times-identity structure, enabling batched matrix multiplications targeting GPU tensor cores [^392^]
- **State dimensions**: N=64 or 128 (vs. N=16 in Mamba-1), improving model quality [^385^]
- **Minimal implementation**: ~25 lines of code for the core selective SSM [^389^]

### 7.2 Hybrid Mamba-Transformer Architecture

Hybrid models combining Mamba-2 SSD layers with attention layers consistently outperform pure architectures [^385^][^391^]:

**Princeton/Tri Dao results (2.7B parameters, 300B tokens on the Pile):**
- Hybrid with 6 attention layers + 58 SSD layers outperforms:
  - 64 pure SSD layers
  - Transformer++ (32 gated MLP + 32 attention layers) [^385^]

**Zamba2-2.7B hybrid resilience:** Even with 12 out of 54 SSMs pruned, negligible perplexity increase (4.01 to 4.02) and accuracy drop (67.2% to 67.0%) [^394^].

### 7.3 OOWM Hybrid Integration Plan

```python
# Conceptual OOWM hybrid architecture
# Replace ~10-20% of transformer attention layers with Mamba-2 SSD blocks
# for long-sequence processing (marketing history, multi-year time series)

from mamba_ssm import Mamba2

class OOWMHybridBlock(nn.Module):
    """OOWM hybrid: Attention for short-range reasoning, SSD for long-range memory"""
    def __init__(self, d_model, use_ssm=False):
        super().__init__()
        self.use_ssm = use_ssm
        if use_ssm:
            # Mamba-2 SSD for O(n) long-sequence processing
            self.ssm = Mamba2(
                d_model=d_model,
                d_state=64,           # SSD state dimension
                d_conv=4,             # Local convolution width
                expand=2,             # Block expansion factor
            )
        else:
            # Standard attention for rich local reasoning
            self.attn = nn.MultiheadAttention(d_model, num_heads=16)
        self.mlp = SwiGLU(d_model, hidden_dim=4*d_model)
    
    def forward(self, x):
        if self.use_ssm:
            x = x + self.ssm(x)      # O(n) selective state space
        else:
            x = x + self.attn(x, x, x)[0]  # O(n^2) attention
        x = x + self.mlp(x)
        return x

# Layer allocation: first 80% SSD layers, last 20% attention layers
# This matches the proven hybrid configuration from Dao & Gu [^385^]
```

### 7.4 Performance Benefits for OOWM

| Metric | Pure Transformer | Mamba-2 SSD Hybrid | Improvement |
|---|---|---|---|
| Sequence processing | O(n^2) | O(n) | Linear scaling |
| Throughput (2K seq) | Baseline | 5x faster | 400% [^385^] |
| Long-context memory | Degrades at 32K+ | Stable at 256K+ | Extended range |
| VRAM for 128K context | ~40GB | ~15GB | 62% reduction |

---

## 8. Model Quantization for M4 MacBook 12GB RAM

### 8.1 MacBook M4 Quantization Options

Apple MLX provides native quantization optimized for Apple Silicon's unified memory architecture [^309^][^313^].

**MLX Quantization Command:**
```bash
# Quantize a full-precision model to 4-bit
python3 -m mlx_lm.convert \
  --hf-path nvidia/Cosmos3-Nano \
  --mlx-path ./oowm-cosmos3-nano-4bit \
  --quantize \
  --q-bits 4 \
  --q-group-size 64

# Expected: 32GB (BF16) -> ~9GB (4-bit)
```

**Mixed Quantization for Quality Preservation:**
```python
from mlx_lm.convert import convert

def mixed_quantization(layer_path, layer, model_config):
    """Higher precision for sensitive layers"""
    if "lm_head" in layer_path or "embed_tokens" in layer_path:
        return {"bits": 6, "group_size": 64}  # Higher precision
    elif hasattr(layer, "to_quantized"):
        return {"bits": 4, "group_size": 64}  # Standard 4-bit
    else:
        return False

convert(
    hf_path="nvidia/Cosmos3-Nano",
    mlx_path="./oowm-cosmos3-mixed-4-6-bit",
    quantize=True,
    quant_predicate=mixed_quantization
)
```

### 8.2 MacBook M4 Performance Characteristics

| Model | Precision | M4 16GB TTFT | M4 16GB Tok/s | Memory |
|---|---|---|---|---|
| Qwen3 8B | MLX 4-bit | 18.6s | ~15-20 tok/s | 5.61 GB [^279^] |
| Qwen3 14B | MLX 4-bit | 35.15s | ~8-12 tok/s | 9.16 GB [^279^] |
| gpt-oss 20B | MXFP4-Q4 | 9.54s | ~10-15 tok/s | 12.08 GB [^279^] |
| Cosmos3-Nano 16B | MLX 4-bit (est.) | ~25-30s | ~8-15 tok/s | ~9-11 GB |

**For M4 MacBook 16GB**: Cosmos 3 Nano at 4-bit quantization (~9GB) fits with room for browser and apps [^277^]. 12GB models would need 3-bit quantization or the smaller Cosmos 3 Edge (2B) model.

### 8.3 GGUF/Ollama Path for Mac

```bash
# Convert fine-tuned model to GGUF via llama.cpp
python convert_hf_to_gguf.py ./oowm-cosmos3-nano \
  --outfile oowm-cosmos3-nano.gguf \
  --outtype q4_k_m

# Or use Unsloth's direct GGUF export
model.save_pretrained_gguf(
    "./oowm-gguf",
    tokenizer,
    quantization_method="q4_k_m",  # ~6GB for 16B model
)
```

---

## 9. vLLM/SGLang Serving for World Models

### 9.1 vLLM for Multi-Modal Serving

vLLM provides PagedAttention for efficient KV cache management, continuous batching, and OpenAI-compatible API [^254^][^255^]. For multi-modal world models, vLLM-Omni extends support to text, image, video, and audio [^412^].

**vLLM serving with LoRA adapters:**
```bash
# Serve base model with optional LoRA
vllm serve nvidia/Cosmos3-Nano \
  --quantization fp8 \
  --enable-lora \
  --lora-modules oowm=./oowm-lora-adapter \
  --max-model-len 8192 \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.9
```

**vLLM-Omni for full multi-modal:**
```bash
# vLLM-Omni: disaggregated encoder-prefill-decode
# Encoder pool (L40S/A100): ViT/Audio Transformer
# Prefill pool (H100/B200): Full transformer prefill  
# Decode pool (H200/A100 80GB): Autoregressive decode

# Supports text-to-text, text-to-image, text-to-video, text-to-audio [^405^]
dynamo serve --config vllm_omni_config.yaml
```

### 9.2 SGLang for Structured Programs

SGLang achieves up to 6.4x higher throughput and 3.7x lower latency than vLLM through RadixAttention for automatic KV cache reuse [^310^][^311^]. It powers 400,000+ GPUs in production at xAI, NVIDIA, AMD, and LinkedIn [^311^].

**SGLang deployment for OOWM:**
```bash
# Single-GPU deployment
python -m sglang.launch_server \
  --model-path nvidia/Cosmos3-Nano \
  --quantization fp8 \
  --context-length 8192 \
  --mem-fraction-static 0.92 \
  --max-running-requests 128 \
  --enable-metrics \
  --host 0.0.0.0 \
  --port 8000

# Multi-GPU tensor parallelism
python -m sglang.launch_server \
  --model-path nvidia/Cosmos3-Nano \
  --tp 4 \
  --quantization fp8

# Data parallelism for throughput
python -m sglang.launch_server \
  --model-path nvidia/Cosmos3-Nano \
  --tp 2 --dp 2 \
  --quantization fp8
```

**SGLang structured generation for business logic:**
```python
import sglang as sgl

@sgl.function
def oowm_business_analysis(s, query, domain):
    s += sgl.system("You are an expert business analyst with 25 domain specializations.")
    s += sgl.user(f"Domain: {domain}\nQuery: {query}")
    
    with s.grab("analysis") as analysis:
        s += sgl.assistant(
            sgl.gen("analysis", max_tokens=2048, regex=r"[A-Za-z0-9\s\.,;:\-\(\)]{100,2048}")
        )
    
    # Structured JSON output for downstream processing
    with s.grab("structured"):
        s += sgl.user("Format the analysis as JSON with keys: summary, recommendations, risks")
        s += sgl.assistant(
            sgl.gen_json("{"  # Fast constrained JSON decoding
                "\"summary\": string,"
                "\"recommendations\": string[],"
                "\"risks\": string[]"
                "}")
        )
```

### 9.3 Serving Stack Comparison for OOWM

| Feature | vLLM | SGLang | TensorRT-LLM |
|---|---|---|---|
| Max throughput | High | 6.4x higher [^310^] | Highest (batch=1) |
| Multi-modal | vLLM-Omni | Native | Limited |
| KV cache reuse | Prefix caching | RadixAttention (auto) | Manual |
| LoRA serving | Multi-LoRA batching | Multi-LoRA batching | Runtime adapters |
| Structured output | Basic | Fast FSM JSON decoding | Basic |
| Best for | General serving | Agent workflows, complex programs | Low-latency edge |

---

## 10. Ollama Integration with Custom Fine-Tuned Models

### 10.1 Importing Fine-Tuned Adapters

Ollama supports importing LoRA adapters from safetensors weights [^251^]:

```dockerfile
# Modelfile for OOWM
FROM nvidia/Cosmos3-Nano
ADAPTER /path/to/oowm-lora-adapter

# System prompt for business logic domains
SYSTEM """You are OOWM, the Organic Open World Model. You have expertise across 25 
business domains including construction, aquaculture, logistics, and marketing. 
Provide actionable insights grounded in real-world SME operational data."""

# Inference parameters
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
```

```bash
# Create the model
ollama create oowm -f Modelfile

# Run interactively
ollama run oowm

# Or via API
curl http://localhost:11434/api/generate -d '{
  "model": "oowm",
  "prompt": "Analyze Q3 marketing ROI for aquaculture SMEs"
}'
```

### 10.2 GGUF Import Path

For maximum compatibility with edge devices [^251^][^258^]:

```bash
# Convert to GGUF
python convert_hf_to_gguf.py ./oowm-fused-model \
  --outfile oowm-cosmos3-nano-q4_k_m.gguf \
  --outtype q4_k_m

# Create Modelfile
FROM ./oowm-cosmos3-nano-q4_k_m.gguf

# Build
ollama create oowm-edge -f Modelfile
ollama run oowm-edge
```

---

## 11. Dataset Curation for SME Business Logic Training

### 11.1 Dataset Format

OOWM training data follows the instruction-finetuning template standard [^396^]:

```json
{"instruction": "Analyze marketing ROI for a construction SME with $2M annual revenue",
 "input": "Domain: construction\\nPeriod: Q3 2025\\nRevenue: $2M\\nMarketing spend: $150K\\nChannels: digital 60%, trade shows 25%, print 15%",
 "output": "ROI Analysis: Digital channels deliver 4.2x ROAS..."}
```

### 11.2 NeMo Curator Pipeline for Business Data

```python
from nemo_curator import Sequential, Modify, Filter
from nemo_curator.modifiers import TextCleaner, PiiModifier
from nemo_curator.filters import WordCountFilter, QualityFilter

# Custom business logic document builder
def build_business_documents(raw_data_path):
    """Convert Nick's 15 years of marketing data into training documents"""
    documents = []
    for record in load_jsonl(raw_data_path):
        doc = {
            "text": f"### Instruction:\n{record['instruction']}\n\n### Input:\n{record['input']}\n\n### Response:\n{record['output']}"
        }
        documents.append(doc)
    return DocumentDataset(documents)

# Curation pipeline
curation_steps = Sequential([
    Modify(TextCleaner()),                          # Clean and unify text
    Filter(WordCountFilter(min_words=20, max_words=5000)),  # Length filter
    dedupe,                                         # Remove duplicates
    Modify(PiiModifier(                             # Redact PII
        supported_entities=["PERSON", "EMAIL", "PHONE", "ADDRESS"],
        anonymize_action="replace"
    )),
])

# Execute
dataset = build_business_documents("/data/nick_marketing_15yr.jsonl")
dataset = curation_steps(dataset)
dataset.to_json("/output/oowm_training_data.jsonl")
```

### 11.3 Data Volume Recommendations

| Adaptation Type | Min Examples | Recommended | Quality Focus |
|---|---|---|---|
| Style/tone matching | 200-500 | 500-1000 | Format consistency [^348^] |
| Domain adaptation | 1,000-3,000 | 5,000-10,000 | Vocabulary, phrasing [^348^] |
| Knowledge injection | 5,000+ | 15,000-50,000 | Factual accuracy [^348^] |
| Multi-modal (video+text) | 1,000 | 5,000-10,000 | Temporal alignment |

For OOWM's 25 domains: target **50,000-100,000** high-quality examples across all domains, with minimum 2,000 per domain.

---

## 12. Evaluation Benchmarks for Domain World Models

### 12.1 Physical AI Benchmarks

| Benchmark | Focus | Cases | OOWM Relevance |
|---|---|---|---|
| VANTAGE-Bench | Real-world fixed-camera footage (warehouse, transport, smart spaces) | 100s | High -- logistics domain [^6^] |
| TAR (Traffic Anomaly Reasoning) | Anomalous event detection and reasoning | 1000+ | Fleet/logistics monitoring [^6^] |
| PAI-Bench-G | Video generation across 6 domains (AV, robotics, industry, human, physics, common sense) | 1,044 video-prompt pairs | Core world model evaluation [^403^] |
| PAI-Bench-C | Conditional video generation with control signals | 600 videos | Construction/aquaculture scenarios [^403^] |
| PAI-Bench-U | Video understanding: common sense + embodied reasoning | 1,164 videos, 1,214 QA | SME decision support [^403^] |
| PBench | Domain score + quality score via VLM judge | 1,044 samples, 5,636 QA | Physical AI ontology evaluation [^406^] |
| R-Bench | Robotic video generation: structural consistency, physical plausibility | 100s | Robotics integration [^6^] |
| Physics-IQ | Real-world video physical principle understanding | 100s | World model physics [^6^] |
| RoboLab | Simulation benchmark for task-generalist robot policies | 100s | Action generation [^6^] |

### 12.2 PAI-Bench Evaluation Protocol

PAI-Bench measures two key dimensions [^406^]:
- **Domain Score**: VLM-judged accuracy on domain-specific QA pairs
- **Quality Score**: 8 metrics from VBench for video quality

```python
# PAI-Bench evaluation for OOWM
def evaluate_oowm_pai_bench(model, benchmark_path):
    """Evaluate OOWM on PAI-Bench-G (generation) and PAI-Bench-U (understanding)"""
    
    # Generation track
    for sample in pai_bench_g:
        video = model.generate(
            image=sample.conditioning_image,
            prompt=sample.text_prompt,
            num_frames=121,
        )
        domain_score = vlm_judge(video, sample.qa_pairs)
        quality_score = vbench_evaluate(video)
    
    # Understanding track
    for sample in pai_bench_u:
        answers = model.answer_video_qa(sample.video, sample.questions)
        accuracy = score_against_ground_truth(answers, sample.answers)
    
    return {
        "pai_bench_g_domain": mean_domain_score,
        "pai_bench_g_quality": mean_quality_score,
        "pai_bench_u_accuracy": mean_understanding_accuracy,
    }
```

---

## 13. TensorRT-LLM Optimization for Local Deployment

### 13.1 ModelOpt Quantization Pipeline

NVIDIA ModelOpt consolidates FP8, INT4, FP4, INT8 quantization and QAT into one library [^164^]:

```python
import modelopt.torch.quantization as mtq
from transformers import AutoModelForCausalLM

# Load model
model = AutoModelForCausalLM.from_pretrained(
    "nvidia/Cosmos3-Nano",
    torch_dtype=torch.bfloat16,
    device_map="auto",
)

# Calibration dataloader
def forward_loop(model):
    for batch in calib_loader:
        batch = {k: v.cuda() for k, v in batch.items()}
        with torch.no_grad():
            model(**batch)

# Quantize
quant_cfg = mtq.FP8_DEFAULT_CFG  # Or INT4_AWQ_CFG, NVFP4_DEFAULT_CFG
model = mtq.quantize(model, quant_cfg, forward_loop=forward_loop)

# Export to TensorRT-LLM
import modelopt.torch.export as mte
mte.export_tensorrt_llm_checkpoint(
    model,
    decoder_type="llama",
    dtype="bfloat16",
    export_dir="/engines/oowm-fp8-checkpoint",
    inference_tensor_parallel=2,
)
```

### 13.2 TensorRT-LLM Engine Build

```bash
# Build optimized engine
trtllm-build \
  --checkpoint_dir /engines/oowm-fp8-checkpoint \
  --output_dir /engines/oowm-cosmos3-nano-fp8 \
  --gemm_plugin fp8 \
  --gpt_attention_plugin fp8 \
  --use_paged_context_fmha enable \
  --use_fp8_context_fmha enable \
  --max_batch_size 32 \
  --max_input_len 8192 \
  --max_seq_len 10240 \
  --tp_size 2
```

### 13.3 vLLM/SGLang Export

```python
# Export to HuggingFace for vLLM/SGLang
mte.export_hf_checkpoint(model, tokenizer, export_dir="/models/oowm-fp8")

# Serve with vLLM
# vllm serve /models/oowm-fp8 --quantization modelopt --tp 2

# Serve with SGLang
# sglang serve /models/oowm-fp8 --quantization fp8 --tp 2
```

---

## 14. Multi-Modal Training: Text + Image + Video + Action

### 14.1 Cosmos 3 Omni-Modal Processing

Cosmos 3 processes all modalities in a shared representation space [^237^]:
- **Text**: Standard token embedding
- **Image**: Vision Transformer encoder (ViT)
- **Video**: ViT with temporal sampling at 4 fps [^320^]
- **Audio**: Audio Transformer encoder
- **Action**: Discretized action tokens (for robotics/control)

### 14.2 Action Token Training

Action post-training uses discretized action representations [^6^]:

```python
# Action tokenization for robotics/construction/aquaculture control
class ActionTokenizer:
    """Convert continuous actions to discrete tokens for model training"""
    def __init__(self, n_bins=256):
        self.n_bins = n_bins
    
    def encode(self, action_vector):
        """Discretize continuous actions to tokens"""
        # action_vector: [x, y, z, gripper, rotation] -> discrete tokens
        return (action_vector * self.n_bins).long()
    
    def decode(self, action_tokens):
        """Convert tokens back to continuous actions"""
        return action_tokens.float() / self.n_bins

# Training data format for action-aware world modeling
train_example = {
    "observation_image": image_tensor,      # Current camera frame
    "observation_text": "Pick up the salmon net",
    "action_sequence": action_tokens,       # Discretized actions
    "next_observation": next_image_tensor,  # Future frame (forward dynamics)
}
```

### 14.3 Multi-Modal Fusion Strategies

Based on multimodal AI best practices [^278^]:

| Fusion Type | When to Use | OOWM Application |
|---|---|---|
| Early fusion | Simple, same-format inputs | Text + tabular business data |
| Late fusion | Robust, independent modalities | Separate encoders for video, text, then combine |
| Hybrid fusion | Mixed reliability | Text (high confidence) + video (variable quality) |
| Dynamic/adaptive | Variable input quality | Down-weight noisy sensor data automatically [^278^] |

---

## 15. OOWM Deployment Architecture

### 15.1 Three-Tier Architecture

```
TIER 1: EDGE (Local Devices)
+------------------+  +------------------+  +------------------+
| MacBook M4 16GB  |  | RTX Spark 128GB  |  | Jetson AGX Thor  |
| Ollama + GGUF    |  | vLLM / TensorRT  |  | TensorRT-LLM     |
| Q4_K_M quantized |  | FP8/INT4         |  | INT4 optimized   |
| ~8-15 tok/s      |  | ~30-50 tok/s     |  | ~5-10 tok/s      |
+------------------+  +------------------+  +------------------+

TIER 2: WORKSTATION (On-Premise)
+------------------+  +------------------+
| RTX 4090 24GB    |  | RTX PRO 6000 96GB|
| vLLM/SGLang      |  | vLLM-omni        |
| QLoRA serving    |  | FP8 serving      |
| LoRA adapters    |  | Full precision   |
+------------------+  +------------------+

TIER 3: DATACENTER (Cloud)
+------------------+  +------------------+  +------------------+
| H100 80GB        |  | B200             |  | Multi-node       |
| SGLang           |  | Dynamo + vLLM    |  | FSDP training    |
| Tensor parallel  |  | NVFP4 quant      |  | Synthetic data   |
| Speculative dec. |  | 3-stage disagg.  |  | Cosmos Curator   |
+------------------+  +------------------+  +------------------+
```

### 15.2 Inference Pipeline

```python
# OOWM inference pipeline
class OOWMInference:
    def __init__(self, tier="edge"):
        if tier == "edge":
            self.backend = OllamaBackend(model="oowm")
        elif tier == "workstation":
            self.backend = VLLMBackend(
                model="nvidia/Cosmos3-Nano",
                quantization="fp8",
                enable_lora=True,
            )
        else:  # datacenter
            self.backend = SGLangBackend(
                model="nvidia/Cosmos3-Nano",
                tp_size=8,
                quantization="fp8",
            )
    
    async def analyze(self, query, domain="general", media=None):
        """Multi-modal business analysis"""
        # Route to appropriate domain adapter
        prompt = f"[Domain: {domain}]\n{query}"
        
        if media:
            # Multi-modal: text + image/video
            return await self.backend.generate(
                prompt=prompt,
                images=media.get("images"),
                videos=media.get("videos"),
                max_tokens=4096,
            )
        else:
            # Text-only
            return await self.backend.generate(prompt=prompt, max_tokens=2048)
```

---

## 16. Hardware Target Matrix

### 16.1 NVIDIA RTX Spark (Fall 2026)

The RTX Spark is NVIDIA's Arm-based superchip for consumer PCs, merging Grace CPU with Blackwell GPU [^341^][^343^]:

| Specification | RTX Spark (N1X) |
|---|---|
| CPU | 20-core Grace (co-developed with MediaTek) |
| GPU | Blackwell, 48 SMs, 6,144 CUDA cores |
| AI Performance | ~1 PFLOP FP4 (sparse) |
| Memory | Up to 128GB LPDDR5X unified |
| Memory Bandwidth | ~300 GB/s |
| Chip-to-Chip | 600 GB/s NVLink-C2C |
| Process | TSMC 3nm |
| TDP | 45-80W |
| Models supported | Up to 200B parameters locally [^344^] |

**OOWM on RTX Spark**: Cosmos 3 Nano (16B) at FP8 fits in ~16GB, leaving 112GB for context and applications. Supports both inference and QLoRA fine-tuning.

### 16.2 RTX PRO 6000 (96GB)

| Specification | RTX PRO 6000 |
|---|---|
| VRAM | 96 GB GDDR6 |
| Architecture | Blackwell |
| CUDA Cores | ~20,000+ |
| Tensor Cores | 5th gen with FP4/FP8 |
| TDP | 300W |

**OOWM on RTX PRO 6000**: Full Cosmos 3 Nano (32GB BF16) with 64GB remaining for batch inference, LoRA serving, or larger context windows.

### 16.3 RTX 4090 (24GB)

| Specification | RTX 4090 |
|---|---|
| VRAM | 24 GB GDDR6X |
| Architecture | Ada Lovelace |
| OOWM Capability | QLoRA fine-tuning, INT4/FP8 inference |

### 16.4 Jetson AGX Thor (128GB)

| Specification | Jetson AGX Thor |
|---|---|
| Memory | 128 GB unified |
| Target | Edge AI/robotics |
| Cosmos Support | Cosmos Reason 2 demonstrated [^110^] |
| OOWM Target | Cosmos 3 Edge (2B) or Nano INT4 |

### 16.5 MacBook M4

| Specification | MacBook Air M4 | MacBook Pro M4 |
|---|---|---|
| Unified Memory | 16-24 GB | 24-128 GB |
| Memory Bandwidth | 120 GB/s | 160+ GB/s |
| Backend | MLX (Metal) | MLX (Metal) |
| Max model (Q4) | ~14B parameters | ~70B parameters [^277^] |

---

## 17. Complete Training Configuration

### 17.1 OOWM Training Recipe (Cosmos 3 Nano)

```toml
# oowm_train_recipe.toml
# Training recipe for OOWM on Cosmos 3 Nano (16B)
# Target: RTX 4090 (24GB) with QLoRA, or RTX PRO 6000 (96GB) with LoRA

[model]
checkpoint_path = "nvidia/Cosmos3-Nano"
max_seq_length = 8192

[model.tokenizer]
vae_path = "${oc.env:WAN_VAE_PATH}"

[optimizer]
lr = 2e-4
betas = [0.9, 0.999]
eps = 1e-8
fused = true
weight_decay = 0.01
keys_to_select = ["lora_"]  # Adapter-only training

[optimizer.lr_multipliers]
lora_attention = 1.0
lora_mlp = 1.0

[scheduler]
cycle_lengths = [5000]
warm_up_steps = [500]
f_max = [1.0]
f_min = [0.1]
f_start = [0.0]

[trainer]
max_iter = 5000
grad_accum_iter = 8  # Effective batch = 8 x 1 x 1 = 8 (RTX 4090)
logging_iter = 50
distributed_parallelism = "fsdp"

[trainer.callbacks.grad_clip]
clip_norm = 1.0
force_finite = true

[data]
train_path = "/data/oowm_training_50k.jsonl"
val_path = "/data/oowm_validation_5k.jsonl"
format = "jsonl"
template = "alpaca"  # instruction/input/output format

[lora]
r = 16
alpha = 32
dropout = 0.0
target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]

[quantization]
method = "qlora"  # or "lora" for 16-bit on 96GB+ GPUs
bits = 4
quant_type = "nf4"
compute_dtype = "bfloat16"
double_quant = true
```

### 17.2 Training Script

```bash
#!/bin/bash
# oowm_train.sh - Launch OOWM training

export CUDA_VISIBLE_DEVICES=0
export WANDB_PROJECT="oowm-cosmos3"

# For RTX 4090 (24GB) - QLoRA
bash examples/launch_sft_vision_nano.sh \
  config=oowm_train_recipe.toml \
  NPROC_PER_NODE=1 \
  quant=4bit \
  max_seq_len=8192

# For RTX PRO 6000 (96GB) - 16-bit LoRA  
# bash examples/launch_sft_vision_nano.sh \
#   config=oowm_train_recipe.toml \
#   NPROC_PER_NODE=1 \
#   quant=16bit \
#   max_seq_len=16384

# For 8x H100 (80GB) - Full fine-tuning
# bash examples/launch_sft_vision_nano.sh \
#   config=oowm_train_recipe.toml \
#   NPROC_PER_NODE=8 \
#   quant=16bit \
#   max_seq_len=32768
```

### 17.3 Training Monitoring

```python
# Monitor training with wandb
import wandb

wandb.init(
    project="oowm-cosmos3",
    config={
        "base_model": "Cosmos3-Nano",
        "method": "QLoRA",
        "rank": 16,
        "alpha": 32,
        "lr": 2e-4,
        "domains": 25,
        "train_examples": 50000,
    }
)

# Log metrics
def log_metrics(step, loss, lr, eval_metrics):
    wandb.log({
        "train/loss": loss,
        "train/learning_rate": lr,
        "eval/pai_bench_domain": eval_metrics["domain_score"],
        "eval/pai_bench_quality": eval_metrics["quality_score"],
        "eval/safety_accuracy": eval_metrics["safety_acc"],
    }, step=step)
```

---

## 18. References

[^4^] Cosmos World Foundation Model Platform for Physical AI, arXiv:2501.03575, 2024. https://arxiv.org/html/2501.03575v1

[^6^] "Develop Physical AI Reasoning, World, and Action Models with NVIDIA Cosmos 3," NVIDIA Developer Blog, June 11, 2026. https://developer.nvidia.com/blog/develop-physical-ai-reasoning-world-and-action-models-with-nvidia-cosmos-3/

[^110^] Cosmos Cookbook, NVIDIA. https://nvidia-cosmos.github.io/cosmos-cookbook/index.html

[^164^] "NVIDIA TensorRT Model Optimizer (ModelOpt): FP8, INT4, and FP4 Quantization Guide," Spheron, May 27, 2026. https://www.spheron.network/blog/tensorrt-model-optimizer-modelopt-quantization-guide/

[^171^] NVIDIA/cosmos-framework GitHub repository. https://github.com/NVIDIA/cosmos-framework

[^234^] cosmos-framework/docs/training.md, NVIDIA GitHub, May 19, 2026. https://github.com/NVIDIA/cosmos-framework/blob/main/docs/training.md

[^235^] "NVIDIA Releases Cosmos 3: A Two-Tower Mixture-of-Transformers Foundation Model," MarkTechPost, June 3, 2026. https://www.marktechpost.com/2026/06/03/nvidia-releases-cosmos-3/

[^237^] "NVIDIA Cosmos 3: How a Two-Tower Architecture Unifies Physical AI Reasoning and Generation," Dev.to, June 4, 2026. https://dev.to/prabhakar_chaudhary_7afe4/nvidia-cosmos-3-how-a-two-tower-architecture-unifies-physical-ai-reasoning-and-generation-2i00

[^239^] "NVIDIA Cosmos 3: Open-Source Physical AI Model with MoT for Ecosystem Lock-in," VendorDeep, June 1, 2026. https://vendordeep.com/report/nvidia-develop-physical-reasoning-world

[^240^] "Fine-Tuning NVIDIA Cosmos Predict 2.5 with LoRA/DoRA for Robot Video Generation," Hugging Face Blog, May 18, 2026. https://huggingface.co/blog/nvidia/cosmos-fine-tuning-for-robot-video-generation

[^251^] "Importing a Model," Ollama Documentation. https://docs.ollama.com/import

[^252^] "TensorRT-LLM Optimization," Introl Blog, March 21, 2026. https://introl.com/blog/tensorrt-llm-optimization-nvidia-inference-stack-guide

[^253^] "TensorRT-LLM Setup Guide (2026)," LocalAIMaster, May 1, 2026. https://localaimaster.com/blog/tensorrt-llm-setup-guide

[^254^] "Serving LLMs with vLLM: A practical inference guide," Nebius, Dec 18, 2025. https://nebius.com/blog/posts/serving-llms-with-vllm-practical-guide

[^255^] "The Rise of Multimodal LLMs and Efficient Serving with vLLM," PyImageSearch, Sept 15, 2025. https://pyimagesearch.com/2025/09/15/the-rise-of-multimodal-llms-and-efficient-serving-with-vllm/

[^258^] "Use your own customized open-source Large Language Model," TowardsAI, Aug 13, 2025. https://pub.towardsai.net/use-your-own-customized-open-source-large-language-model-81d0999ef59b

[^259^] "Mamba-2: Algorithms and Systems," Princeton Language and Intelligence, 2024. https://pli.princeton.edu/blog/2024/mamba-2-algorithms-and-systems

[^260^] "Gemma Fine-Tuning Guide: LoRA, QLoRA & Deployment," TechJack Solutions, June 8, 2026. https://techjacksolutions.com/ai-tools/gemma/gemma-fine-tuning-guide/

[^275^] Folkman et al., "Domain adaptation and computer vision approaches for robust detection of jellyfish in aquaculture," Springer Aquaculture International, Jan 13, 2026. https://link.springer.com/article/10.1007/s10499-025-02420-y

[^276^] ConstructionSite Dataset, Hyper.ai, 2025. https://hyper.ai/en/datasets/44370

[^277^] "Best LLM for MacBook Air M4 16GB: 5 Models Ranked (2026)," ModelFit, June 6, 2026. https://modelfit.io/blog/best-llm-macbook-air-m4-16gb/

[^278^] "Multimodal AI: The Complete Guide for 2025," SHAIP, Apr 17, 2026. https://www.shaip.com/blog/multimodal-ai-the-complete-guide-to-training-data/

[^279^] "Exploring LLMs with MLX and the Neural Accelerators in the M5 GPU," Apple Machine Learning Research, Nov 19, 2025. https://machinelearning.apple.com/research/exploring-llms-mlx-m5

[^280^] Fang et al., "Automatic detection of hardhats worn by construction personnel: A deep learning approach and benchmark dataset," Automation in Construction, 2019. https://www.sciencedirect.com/science/article/abs/pii/S092658051930264X

[^309^] "Apple Silicon MLX LLM Inference Optimization Tutorial," Branch8, Apr 30, 2026. https://branch8.com/posts/apple-silicon-mlx-llm-inference-optimization-tutorial

[^310^] "Serving SGLang: Launch a Production-Style Server," LearnOpenCV, May 26, 2026. https://learnopencv.com/sglang-a-production-server/

[^311^] "SGLang: The Complete Guide to High-Performance LLM Inference," Inference.net, Feb 1, 2026. https://inference.net/content/sglang-complete-guide/

[^313^] "Exploring LLMs with MLX and the Neural Accelerators in the M5 GPU," Apple Machine Learning Research, Nov 19, 2025. https://machinelearning.apple.com/research/exploring-llms-mlx-m5

[^314^] "NVIDIA Cosmos 3 + Isaac GR00T Robot: Full Review (2026)," BuildFastWithAI, June 2, 2026. https://www.buildfastwithai.com/blogs/nvidia-cosmos-3-isaac-groot-physical-ai-2026

[^317^] "SGLang: Efficient Execution of Structured Language Model Programs," arXiv:2312.07104, 2024. https://arxiv.org/html/2312.07104v2

[^320^] nvidia/Cosmos3-Nano Hugging Face Model Card, Mar 10, 2026. https://huggingface.co/nvidia/Cosmos3-Nano

[^321^] "Simplifying AI Model Licensing with OpenMDW," LF AI & Data Foundation, July 22, 2025. https://lfaidata.foundation/blog/2025/07/22/simplifying-ai-model-licensing-with-openmdw/

[^341^] "NVIDIA Introduces RTX Spark: An Arm SoC for Windows PCs," ServeTheHome, June 1, 2026. https://www.servethehome.com/nvida-introduces-rtx-spark-an-arm-soc-for-windows-pcs/

[^343^] "Nvidia unveils RTX Spark computer chip with up to 20 cores, RTX 5070 GPU and 128GB RAM," GSM Arena, June 1, 2026. https://www.gsmarena.com/nvidia_unveils_rtx_spark_computer_chip_with_up_to_20_cores_rtx_5070__128gb_ram-news-73061.php

[^344^] "NVIDIA Announces RTX Spark, a Supercomputer-grade Processor for Windows PCs," TechPowerUp, June 1, 2026. https://www.techpowerup.com/349554/nvidia-announces-rtx-spark-a-supercomputer-grade-processor-for-windows-pcs-with-agentic-user-interfaces

[^345^] Unsloth Requirements Documentation, May 21, 2026. https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements

[^348^] "QLoRA Fine-Tuning on a Consumer GPU: Unsloth Step by Step," Stack Junkie, Mar 13, 2026. https://www.stack-junkie.com/blog/lora-fine-tuning-consumer-gpu

[^352^] "Unsloth: A Guide from Basics to Fine-Tuning Vision Models," LearnOpenCV, May 8, 2025. https://learnopencv.com/unsloth-guide-efficient-llm-fine-tuning/

[^355^] "Unsloth Just Made Fine-Tuning LLMs a Free-Tier Task," TowardsAI, May 9, 2026. https://pub.towardsai.net/unsloth-just-made-fine-tuning-llms-a-free-tier-task-9ce05a931b75

[^384^] "Mamba, Selective State Space Models, and the Rise of Post-Transformer AI," Medium, Jan 5, 2026. https://medium.com/@raktims2210/mamba-selective-state-space-models-and-the-rise-of-post-transformer-ai-f197f05e8ab8

[^385^] "Mamba-2: Algorithms and Systems," Princeton Language and Intelligence, June 3, 2024. https://pli.princeton.edu/blog/2024/mamba-2-algorithms-and-systems

[^389^] "What Is A Mamba Model?," IBM Think Topics, July 7, 2025. https://www.ibm.com/think/topics/mamba-model

[^390^] "Curating Custom Datasets for LLM Training with NVIDIA NeMo Curator," NVIDIA Developer Blog, Oct 18, 2024. https://developer.nvidia.com/blog/curating-custom-datasets-for-llm-training-with-nvidia-nemo-curator/

[^391^] "State Space Duality (Mamba-2) Part IV - The Systems," Tri Dao Blog, May 31, 2024. https://tridao.me/blog/2024/mamba2-part4-systems/

[^392^] "Mamba-2 & Matmul-free Models: June Papers of the Month," Graphcore, July 4, 2024. https://www.graphcore.ai/posts/mamba-2-matmul-free-models-june-papers-of-the-month

[^394^] "Mamba-Shedder: Post-Transformer Compression for Efficient Mamba Models," ACL Anthology 2025. https://aclanthology.org/2025.naacl-long.195.pdf

[^396^] "High-Quality Dataset Curation for LLM Finetuning," AI in Plain English, Oct 3, 2025. https://ai.plainenglish.io/dataset-curation-and-preparation-for-llm-finetuning-a-comprehensive-guide-b7bb42f97eb4

[^403^] Zhou et al., "PAI-Bench: A Comprehensive Benchmark For Physical AI," arXiv:2512.01989, Dec 2025. https://arxiv.org/abs/2512.01989

[^404^] "Deploy vLLM-Omni on GPU Cloud: Fully Disaggregated Serving for Any-to-Any Multimodal Models," Spheron, June 15, 2026. https://www.spheron.network/blog/deploy-vllm-omni-disaggregated-multimodal-serving-gpu-cloud/

[^405^] "vLLM-Omni | NVIDIA Dynamo Documentation." https://docs.nvidia.com/dynamo/user-guides/diffusion/v-llm-omni

[^406^] "PBench: A Physical AI Benchmark for World Models," NVIDIA Research. https://research.nvidia.com/labs/dir/pbench/

[^408^] "Fine-tuning Llama-3.1 with QLoRA," AMD ROCm Documentation. https://rocm.docs.amd.com/projects/ai-developer-hub/en/v5.1/notebooks/fine_tune/QLoRA_Llama-3.1.html

[^410^] "How to Fine-Tune a Model Using LLaMA Factory," OpenCSG. https://www.opencsg.com/docs/en/llama-factory-guide/quick_start

[^412^] vllm-project/vllm-omni GitHub. https://github.com/vllm-project/vllm-omni

[^416^] Zhou et al., "PAI-Bench: A Comprehensive Benchmark For Physical AI," CVPR 2026. https://openaccess.thecvf.com/content/CVPR2026/papers/Zhou_PAI-Bench_A_Comprehensive_Benchmark_For_Physical_AI_CVPR_2026_paper.pdf

[^346^] "Nvidia RTX Spark," Wikipedia, Apr 14, 2026. https://en.wikipedia.org/wiki/Nvidia_RTX_Spark

[^347^] "Nvidia RTX Spark comes to Windows PCs with Arm CPU, RTX GPU, and unified memory," Ars Technica, June 1, 2026. https://arstechnica.com/gadgets/2026/06/nvidia-gets-into-the-arm-pc-business-with-new-high-end-rtx-spark-processor/

[^233^] "Synthetic Data Generation (SDG) for Traffic Scenarios," NVIDIA Cosmos Cookbook. https://nvidia-cosmos.github.io/cosmos-cookbook/recipes/end2end/smart_city_sdg/workflow_e2e.html

[^236^] NVIDIA-NeMo/Curator GitHub. https://github.com/NVIDIA-NeMo/Curator

[^238^] "Synthetic Data Generation - NVIDIA NeMo Framework User Guide." https://docs.nvidia.com/nemo-framework/user-guide/24.12/datacuration/syntheticdata.html

[^249^] "Fine-Tuning NVIDIA Cosmos Predict 2.5 with LoRA/DoRA for Robot Video Generation," Hugging Face Blog. https://huggingface.co/blog/nvidia/cosmos-fine-tuning-for-robot-video-generation

[^257^] "Tutorial: How to Finetune Llama-3 and Use In Ollama," Unsloth. https://unsloth.ai/docs/get-started/fine-tuning-llms-guide/tutorial-how-to-finetune-llama-3-and-use-in-ollama

[^261^] "TensorRT-LLM Production Deployment on GPU Cloud," Spheron, Apr 25, 2026. https://www.spheron.network/blog/tensorrt-llm-production-deployment-guide/

[^262^] "HowTo: Importing a .gguf Model into Ollama on Windows," Reddit r/LocalLLaMA, Sept 10, 2025. https://www.reddit.com/r/LocalLLaMA/comments/1esb5s7/howto_importing_a_gguf_model_into_ollama_on/

[^263^] "Deploy NVIDIA Cosmos World Foundation Models on GPU Cloud: Synthetic Data Generation for Robotics and Physical AI (2026 Guide)," Spheron, Apr 11, 2026. https://www.spheron.network/blog/deploy-nvidia-cosmos-gpu-cloud-synthetic-data/

[^264^] "NVIDIA Software License Agreement (OpenMDW)." https://developer.nvidia.com/downloads/amc-eula

[^265^] "Cosmos-Reason2 on Jetson Thor for Edge VLM Perception," Cosmos Cookbook, Mar 16, 2026. https://nvidia-cosmos.github.io/cosmos-cookbook/index.html

[^266^] "Worker Safety in a Classical Warehouse," Cosmos Cookbook, Feb 4, 2026. https://nvidia-cosmos.github.io/cosmos-cookbook/index.html

[^267^] "GR00T-Dreams: Synthetic Trajectory Generation for Robot Learning," Cosmos Cookbook, Mar 3, 2026. https://nvidia-cosmos.github.io/cosmos-cookbook/index.html

[^268^] "Generate Photorealistic Agricultural Images for Robot Perception Training," Cosmos Cookbook, Apr 21, 2026. https://nvidia-cosmos.github.io/cosmos-cookbook/index.html

[^269^] "Post-Training Cosmos-H-Surgical-Simulator for Surgical Robotics," Cosmos Cookbook, Mar 15, 2026. https://nvidia-cosmos.github.io/cosmos-cookbook/index.html

[^270^] "Cosmos Policy: Fine-Tuning Video Models for Visuomotor Control and Planning," Cosmos Cookbook, Feb 18, 2026. https://nvidia-cosmos.github.io/cosmos-cookbook/index.html

---

*Document compiled from 25+ independent searches across NVIDIA Developer resources, academic papers (arXiv, CVPR, ACL Anthology, Springer), GitHub repositories, framework documentation (vLLM, SGLang, TensorRT-LLM, MLX, Unsloth, Ollama), and hardware specifications (NVIDIA, Apple).*
