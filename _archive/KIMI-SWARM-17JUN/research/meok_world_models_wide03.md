# World Models & Physical AI Research: OOWM Landscape Scan v3

**Research Date**: July 2026
**Searches Conducted**: 14 independent queries across NVIDIA Cosmos 3, Mamba-2 SSD, edge deployment, quantization, fine-tuning pipelines, and open-weight alternatives
**Sources**: NVIDIA Developer Blog, Hugging Face, Linux Foundation, arXiv, GitHub, Technical Reports, Industry Analysis

---

## Top 10 Critical Findings

### 1. NVIDIA Cosmos 3: First Open Omni-Model for Physical AI (May 2026)

Cosmos 3 launched at GTC Taipei / Computex on May 31, 2026, as the first fully open physical-AI omnimodel. It unifies text, image, video, audio, and action trajectories in a single architecture under the Linux Foundation's OpenMDW-1.1 license [^2^][^89^][^95^].

**Key Specifications:**
| Variant | Parameters | GPU Target | Status |
|---------|-----------|------------|--------|
| Cosmos 3 Super | 64B (32B Reasoner + 32B Generator) | H100/H200/Blackwell datacenter | Available |
| Cosmos 3 Nano | 16B (8B + 8B) | RTX PRO 6000, consumer GPUs | Available |
| Cosmos 3 Edge | 4B | Jetson devices | "Coming soon" (no date) |

**Architecture**: Mixture-of-Transformers (MoT) -- NOT Mixture-of-Experts (MoE). MoT uses modality-aware transformer parameter decoupling with global self-attention, reducing FLOPs by 44-63% compared to dense baselines [^89^][^107^][^111^].

**Hugging Face Integration**: `Cosmos3OmniPipeline` in Diffusers library enables Text-to-Image, Text-to-Video, Image-to-Video, and action-conditioned generation with just a few lines of code [^109^].

```python
from diffusers import Cosmos3OmniPipeline
pipe = Cosmos3OmniPipeline.from_pretrained(
    "nvidia/Cosmos3-Nano", torch_dtype=torch.bfloat16, device_map="cuda"
)
result = pipe(prompt=prompt, num_frames=1, height=720, width=1280)
```

### 2. OpenMDW-1.1 License: Enterprise-Ready Open Weights Framework

The Linux Foundation released OpenMDW-1.1 on May 28, 2026. NVIDIA adopted it across Cosmos, Isaac GR00T, Ising, and Nemotron model families [^93^][^97^].

**Key License Properties:**
- Permits commercial use, training, modification, redistribution, and derivative models
- Covers weights, parameters, scripts, software, and documentation
- **Attribution requirement**: Products must display "Built on NVIDIA Cosmos" somewhere visible
- **Does NOT claim ownership of outputs**: Whatever you generate is yours
- Distinct from NVIDIA's prior NVIDIA Open Model License
- Designed to be the "MIT license for AI models" -- neutral, community-governed [^93^]

**Enterprise Consideration**: The license is newer than Apache 2.0. Teams should verify specific terms against their organization's open-source policy before production deployment [^89^].

### 3. Fine-Tuning Pipelines: Full Training Recipes Available

NVIDIA released fully open training recipes with code, configs, and workflows for adapting Cosmos 3 to new domains [^6^][^38^][^171^].

**Available Post-Training Workflows:**
1. **Supervised Fine-Tuning (SFT)**: Domain adaptation for vision generation, robotics, autonomous driving
2. **Action Post-Training**: Forward dynamics, inverse dynamics, and policy generation
3. **LoRA**: Low-rank adaptation for efficient fine-tuning
4. **Reinforcement Learning**: Via Cosmos RL framework for large-scale distributed rollout
5. **Model Distillation**: Compress large models for edge deployment [^110^]

**Hardware Requirements for Training:**
- Shipped recipes tested on 8x H100 80GB GPUs
- Tutorial shows 4 GPUs on GB200 node works for action post-training
- QLoRA enables fine-tuning with significantly less VRAM [^172^]

**GitHub Repository Structure** (`github.com/nvidia/cosmos`):
- `cosmos_framework/`: Unified Python package
- Training: FSDP/TP/CP/PP distributed trainer, DCP checkpoints, HuggingFace safetensors
- Inference: Diffusers/Transformers/vLLM backends with Ray + Gradio serving
- Entry point: `cosmos_framework.scripts.train` / `.inference` [^171^]

### 4. Edge Deployment: RTX Spark, Jetson, and Consumer GPU Options

**RTX Spark (Fall 2026)**:
- Blackwell-based consumer chip: 120B parameter local inference, 1M token context, 1 petaflop AI compute, 128GB VRAM [^7^]
- 30+ laptop and 10+ desktop models from major OEMs
- **Critical for OOWM**: Cosmos 3 Nano on RTX Spark will determine whether NVIDIA's open physical AI stack delivers on edge deployment promise
- Independent benchmarks pending hardware availability (Fall 2026) [^7^]

**Current Consumer GPU Feasibility** (RTX 4090 24GB / RTX PRO 6000 96GB):
- Cosmos 3 Nano (16B) runs on RTX PRO 6000 workstation-class GPUs [^2^]
- RTX 4090 24GB can run 7B-13B LLMs locally; QLoRA fine-tuning possible for up to ~20B models [^117^][^155^]
- For video generation models: INT8/FP8 quantization via TensorRT Model Optimizer critical for fitting in consumer VRAM [^164^]

**Jetson Edge Options**:
- Jetson Orin Nano 8GB: Suitable for 3-4B models (Qwen3-4B, VILA 3B) with INT4 AWQ quantization [^173^][^175^]
- Jetson AGX Orin 64GB: 4B-20B range models (LLaVA-13B, Qwen2.5-VL-7B) [^173^]
- Jetson AGX Thor 128GB: Up to 120B parameter models [^173^]
- Cosmos-Reason2-8B demonstrated on Thor with NVFP4 quantization [^175^]

### 5. Mamba-2 SSD: State Space Models for Long-Sequence World Modeling

Mamba-2 introduces Structured State Space Duality (SSD) -- a theoretical bridge between state space models and attention that enables linear-time sequence processing [^35^][^40^][^41^].

**Key Properties for OOWM:**
| Aspect | Transformer | Mamba-2 SSD |
|--------|-------------|-------------|
| Complexity | O(n^2) | O(n) linear |
| Memory (inference) | O(n) KV cache | O(1) constant state |
| Long context | Expensive | Efficient |
| Throughput (7B) | 1,200 tok/s | 6,000 tok/s (5x) |
| Memory @ 64K ctx | 128 GB | 8 GB |

**Critical Trade-off**: Mamba lags on in-context learning tasks (MMLU: 46.3% vs 51.2% for Transformer at 8B). **Hybrid architectures** (43% SSM + 7% attention + 50% MLP) *outperform* pure transformers by +1.3 points while maintaining efficiency [^37^][^41^].

**SSD Algorithm**: Block decomposition combines SSM and attention modes -- chunkwise algorithm splits sequences, computes attention within segments, passes SSM states between segments. ~30 lines of PyTorch for minimal implementation [^43^].

**Implication for OOWM**: Mamba-2 SSD layers could process long video sequences for world models at constant memory, but hybrid SSM+attention architectures are likely optimal for world model backbones.

### 6. Open-Weight World Model Alternatives to Cosmos 3

The world model landscape has several viable alternatives, each with different strengths [^42^][^115^][^118^]:

| Model | Organization | Type | Open Weights | Key Strength |
|-------|-------------|------|-------------|--------------|
| **Cosmos 3** | NVIDIA | Omni-model (gen + reason + action) | Yes (OpenMDW-1.1) | Unified architecture, action output |
| **V-JEPA 2** | Meta (FAIR) | Latent-space predictive (JEPA) | Yes | Planning, zero-shot robot control |
| **Genie 3** | DeepMind | Generative simulator | No (API only) | Interactive world generation |
| **Dreamer 4** | DeepMind/U Toronto | World model for RL | Code available | Agent training in imagination |
| **GAIA-2** | Various | Domain-specific world models | Varies | Specialized environments |

**V-JEPA 2 Details** [^115^][^118^]:
- Encoder + Predictor architecture trained via self-supervised learning
- Trained on 1M+ hours of video + 1M images
- Only 62 hours of robot data needed for action-conditioned planning
- Achieves 65-80% success on pick-and-place in unseen environments
- **Open source**: Code and checkpoints on GitHub/HuggingFace for commercial use

**Dreamer 4** [^166^][^169^]:
- Three-phase training: world model pretraining -> agent finetuning -> imagination training
- Key insight: Can pretrain on unlabeled video, requiring minimal action-labeled data
- Unofficial PyTorch implementation available with pre-trained checkpoints
- Strongest agent-training result for Minecraft long-horizon tasks

### 7. Quantization for Local/Edge World Model Deployment

Quantization is critical for running world models on consumer/edge hardware. Several approaches available [^96^][^164^][^167^]:

**NVIDIA TensorRT Model Optimizer (ModelOpt)**:
- Unified tool for FP8, INT4 (AWQ/GPTQ), FP4, INT8
- Post-training quantization (PTQ) and quantization-aware training (QAT)
- Exports to TensorRT-LLM, vLLM, SGLang, or HuggingFace
- **FP8 on H100**: 1.8-2.1x throughput vs FP16 with <0.5% accuracy loss
- **FP4 on B200**: 3-4x throughput gain (newest Blackwell hardware) [^164^]

**GGUF + llama.cpp** (CPU/Edge/Consumer GPU):
- Q4_K_M: Best quality/size balance for local inference
- Works across platforms: NVIDIA, Apple Silicon, CPU
- Ollama integration for easy model management [^94^][^96^][^143^]

**Hardware-Precision Matching**:
| GPU | Best Precision | Throughput Gain vs FP16 |
|-----|---------------|------------------------|
| H100 SXM5 | FP8 | 1.8-2.1x |
| H200 SXM5 | FP8 | 1.9-2.2x |
| B200 SXM6 | FP4 | 3.0-4.0x |
| A100 80G | INT8 | 1.4-1.6x |
| RTX 4090 | INT4/INT8 | 1.2-1.4x |

**VRAM Requirements for Fine-Tuning** (with QLoRA) [^152^]:
| Method | 7B | 13B | 30B | 65B |
|--------|-----|-----|-----|-----|
| Full (FP16) | 160GB | 320GB | 600GB | 1200GB |
| LoRA (FP16) | 16GB | 32GB | 80GB | 160GB |
| QLoRA (4-bit) | 6GB | 12GB | 24GB | 48GB |

### 8. Synthetic Data Generation (SDG) for World Model Fine-Tuning

NVIDIA released 6 open synthetic datasets for physical AI fine-tuning [^95^][^109^]:

| Dataset | Domain | Link |
|---------|--------|------|
| SDG-PhyxSim | Physical interactions | huggingface.co/datasets/nvidia/PhysicalAI-WorldModel-Synthetic-Physical-Interaction-Scenes |
| SDG-RobotSim | Embodied robot scenes | ...Synthetic-Embodied-Robot-Scenes |
| SDG-DriveSim | Autonomous driving | ...Synthetic-Autonomous-Driving-Scenarios |
| SDG-SynHuman | Digital humans | ...Synthetic-Digital-Human-Scenes |
| SDG-Warehouse | Warehouse operations | ...Synthetic-Warehouse-Operations-Scenes |

**SDG Pipeline Components** [^5^][^110^]:
- **Cosmos Curator**: GPU-accelerated video curation (splitting, filtering, annotation, dedup)
- **Cosmos-Transfer**: Domain/style adaptation of video
- **Cosmos-Reason/Evaluator**: Quality evaluation and rejection sampling
- **NVIDIA OSMO**: Orchestration layer for compute scheduling

**Fine-tuning world foundation models** with domain-specific synthetic video data allows generation of simulations highly adaptive to complex environments like factory floors or construction sites [^91^].

**Best Practice**: Use teacher-student knowledge distillation -- large teacher model generates synthetic data to fine-tune smaller student model. Calibration datasets of 512-1024 samples sufficient for ModelOpt PTQ [^101^][^164^].

### 9. Ollama / HuggingFace Integration for Local World Models

**HuggingFace Diffusers Integration**:
- `Cosmos3OmniPipeline` provides unified inference for all generation modes
- Supports Text-to-Image, Text-to-Video, Image-to-Video, Video2World
- Model variants: `nvidia/Cosmos3-Nano`, `nvidia/Cosmos3-Super`, `nvidia/Cosmos3-Super-Text2Image`, `nvidia/Cosmos3-Super-Image2Video` [^109^]

**Ollama for Local Deployment**:
- Ollama can run GGUF-quantized models from HuggingFace locally
- Simple workflow: Download GGUF -> Create Modelfile -> `ollama create` -> `ollama run` [^94^][^98^]
- Best for LLM components; video generation models require Diffusers/vLLM backends

**llama.cpp Ecosystem**:
- Built-in local inference with GGUF format
- Supports GPU offloading, memory management, automatic model unloading
- Works with quantized models (Q4_K_M recommended balance) [^143^][^146^][^150^]

**Practical Pipeline for OOWM**:
```
HuggingFace (weights) -> Diffusers (video pipeline) / Ollama (LLM) 
  -> TensorRT-LLM (optimized serving) / llama.cpp (edge inference)
```

### 10. Physical AI Applications Beyond Robotics: SME Opportunities

**Aquaculture Applications** [^178^][^179^]:
- Fish counting and species identification via camera systems
- Disease detection through behavior/appearance analysis
- Biomass estimation using computer vision (YOLOv7 achieves mAP 0.988)
- Feed optimization by monitoring feeding patterns
- Water quality monitoring with sensor fusion

**Construction/Site Monitoring**:
- Worker safety compliance detection (zero-shot with Cosmos Reason 2) [^174^]
- Equipment tracking and activity monitoring
- Progress documentation via video analytics
- Hazard detection in warehouse/factory environments

**Key Insight for OOWM Builder**: World models can generate synthetic training data for these niche domains where real-world data is scarce. Fine-tuning Cosmos 3 Nano on domain-specific video (e.g., aquaculture tank footage, construction site video) enables:
1. Synthetic data generation for training downstream perception models
2. Future state prediction for anomaly detection
3. Action-conditioned video generation for training monitoring policies

The Physical AI Data Factory Blueprint connects Cosmos components with OSMO orchestration for end-to-end synthetic data pipelines [^5^].

---

## OOWM Architecture Recommendations

Based on this landscape scan, a sovereign world model architecture for an AI OS should consider:

### Immediate Path (Q3-Q4 2026)
1. **Prototype on Cosmos 3 Nano** (16B) via HuggingFace Diffusers -- no custom GPU needed for experimentation
2. **Fine-tune with QLoRA** on domain-specific video (aquaculture/construction) using RTX 4090/5090 24-32GB
3. **Generate synthetic training data** using Cosmos Transfer for domain adaptation
4. **Quantize to INT4/INT8** using TensorRT Model Optimizer for edge deployment

### Medium Path (2027)
1. **Migrate to Cosmos 3 Edge** (4B) when available for Jetson deployment
2. **Evaluate RTX Spark** (128GB VRAM, Fall 2026) for local 16B model inference
3. **Integrate Mamba-2 SSD layers** for long-sequence video processing at constant memory
4. **Hybrid SSM+Attention backbone** for world model core architecture

### Technical Stack
```
Base Model: Cosmos 3 Nano (16B) or Edge (4B)
Quantization: TensorRT Model Optimizer -> INT8/FP8
Edge Runtime: TensorRT-Edge-LLM (Jetson) / llama.cpp (consumer GPU)
Fine-tuning: QLoRA via HuggingFace PEFT + Cosmos Framework
Data Pipeline: Cosmos Curator -> Transfer -> Reason (quality filter)
Serving: vLLM (cloud) / TensorRT-LLM (edge)
License: OpenMDW-1.1 (commercial use permitted with attribution)
```

---

## Source References

| Citation | Source | URL |
|----------|--------|-----|
| [^2^] | Digital Applied - Cosmos 3 Guide | digitalapplied.com/blog/nvidia-cosmos-3-open-physical-ai-omnimodel-2026-guide |
| [^5^] | Spheron - Cosmos GPU Cloud | spheron.network/blog/deploy-nvidia-cosmos-gpu-cloud-synthetic-data/ |
| [^6^] | NVIDIA Developer Blog | developer.nvidia.com/blog/develop-physical-ai-reasoning-world-and-action-models-with-nvidia-cosmos-3/ |
| [^7^] | TechJack - Cosmos 3 + RTX Spark | techjacksolutions.com/ai-brief/nvidias-open-physical-ai-strategy-what-cosmos-3-plus-rtx-spa/ |
| [^35^] | Princeton - Mamba-2 Algorithms | pli.princeton.edu/blog/2024/mamba-2-algorithms-and-systems |
| [^36^] | Medium - Mamba SSMs | medium.com/@raktims2210/mamba-selective-state-space-models |
| [^37^] | Longterm Wiki - SSM/Mamba | longtermwiki.com/wiki/E501 |
| [^38^] | Cosmos Cookbook | nvidia-cosmos.github.io/cosmos-cookbook/ |
| [^39^] | Cosmos 3 Technical Report | research.nvidia.com/labs/cosmos-lab/cosmos3/technical-report.pdf |
| [^40^] | Gradient Flow - Mamba-2 | gradientflow.com/mamba-2/ |
| [^41^] | Tri Dao Blog - Mamba-2 Systems | tridao.me/blog/2024/mamba2-part4-systems/ |
| [^42^] | World Models Zero to Hero | hackmd.io/@AbdelStark/world-model-from-zero-to-hero |
| [^89^] | TechJack - Open Source AI News | techjacksolutions.com/ai-brief/open-source-ai-news-cosmos-3/ |
| [^90^] | Artificial Analysis Tweet | x.com/ArtificialAnlys/status/2061494719998546206 |
| [^91^] | NVIDIA SDG Glossary | nvidia.com/en-us/glossary/synthetic-data-generation/ |
| [^93^] | Diginomica - OpenMDW 1.1 | diginomica.com/what-openmdw-11-guarantees-enterprise |
| [^94^] | Daniel Miessler - HF + Ollama | danielmiessler.com/blog/how-to-use-hugging-face-models-with-ollama |
| [^95^] | Cosmos 3 Technical Report (PDF) | research.nvidia.com/labs/cosmos-lab/cosmos3/technical-report.pdf |
| [^96^] | Meta-Intelligence - Quantization | meta-intelligence.tech/en/insight-quantization |
| [^97^] | Linux Foundation Press Release | linuxfoundation.org/press/linux-foundation-releases-openmdw-1.1 |
| [^107^] | NVIDIA MoT Glossary | nvidia.com/en-us/glossary/mixture-of-transformers/ |
| [^109^] | HuggingFace Blog - Cosmos 3 | huggingface.co/blog/nvidia/cosmos-3-for-physical-ai |
| [^110^] | Cosmos Cookbook | nvidia-cosmos.github.io/cosmos-cookbook/ |
| [^111^] | MoT Paper (OpenReview) | openreview.net/forum?id=Nu6N69i8SB |
| [^112^] | MoT GitHub (Meta) | github.com/facebookresearch/Mixture-of-Transformers |
| [^115^] | V-JEPA 2 Paper (arXiv) | arxiv.org/html/2506.09985v1 |
| [^117^] | Spheron - RTX 4090 AI | spheron.network/blog/rtx-4090-for-ai-ml/ |
| [^118^] | Meta AI Blog - V-JEPA 2 | ai.meta.com/blog/v-jepa-2-world-model-benchmarks/ |
| [^143^] | Goose Docs - Local Inference | goose-docs.ai/blog/2026/04/24/use-goose-with-built-in-local-inference/ |
| [^145^] | DeepMind Genie 3 | jasonhowell.substack.com/p/deepmind-genie-3-builds-worlds-instantly |
| [^148^] | LearnOpenCV - Diffusers | learnopencv.com/hugging-face-diffusers/ |
| [^152^] | Reddit - VRAM Requirements | reddit.com/r/LocalLLaMA/comments/18o5u0k/ |
| [^155^] | Kaitchup - QLoRA Guide | kaitchup.substack.com/p/qlora-fine-tune-a-large-language-model |
| [^157^] | Cloudrift - RTX PRO 6000 | cloudrift.ai/blog/benchmarking-rtx6000-vs-datacenter-gpus |
| [^164^] | Spheron - ModelOpt Guide | spheron.network/blog/tensorrt-model-optimizer-modelopt-quantization-guide/ |
| [^165^] | BlackScarab - Edge AI Stack | blackscarab.ai/insights/nvidia-physical-ai-cosmos-isaac-jetson-omniverse-guide |
| [^166^] | Dreamer 4 Paper | emergentmind.com/papers/2509.24527 |
| [^167^] | NVIDIA TensorRT Quantization | docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/work-quantized-types.html |
| [^169^] | Dreamer 4 GitHub | github.com/nicklashansen/dreamer4 |
| [^171^] | Cosmos Framework GitHub | github.com/NVIDIA/cosmos-framework |
| [^173^] | Edge AI Vision - Jetson | edge-ai-vision.com/2026/01/getting-started-with-edge-ai-on-nvidia-jetson/ |
| [^174^] | Cosmos Cookbook (legacy) | github.com/nvidia-cosmos/cosmos-cookbook |
| [^175^] | Jetson AI Lab - TensorRT Edge | jetson-ai-lab.com/tutorials/tensorrt-edge-llm/ |
| [^178^] | Meegle - CV in Aquaculture | meegle.com/en_us/topics/computer-vision/computer-vision-in-aquaculture |
| [^179^] | MDPI - AIoT in Aquaculture | mdpi.com/2227-9717/13/1/73 |

---

*Research compiled for OOWM (Organic Open World Model) builder. Focus: sovereign world model for AI OS targeting SME/construction/aquaculture verticals.*
