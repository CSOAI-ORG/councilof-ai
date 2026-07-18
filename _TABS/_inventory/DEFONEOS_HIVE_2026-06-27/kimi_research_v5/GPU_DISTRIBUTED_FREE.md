# OPERATION FREE GPU -- Distributed Training Architecture for Free Tiers

> **Mission:** Train models bigger than a single free GPU can handle by coordinating multiple free GPU nodes (Colab + Kaggle + Lightning AI + Lambda) as if they were a single compute cluster. Zero budget. Maximum results.

---

## Table of Contents

1. [Distributed Training Basics](#1-distributed-training-basics)
2. [Training Across Multiple Free Platforms](#2-training-across-multiple-free-platforms)
3. [Federated Training on Free Nodes](#3-federated-training-on-free-nodes)
4. [Checkpoint Management Strategy](#4-checkpoint-management-strategy)
5. [The 70B Model Challenge](#5-the-70b-model-challenge)
6. [Training Throughput Optimization](#6-training-throughput-optimization)
7. [The DEFONEOS Training Grid](#7-the-defoneos-training-grid)
8. [Practical Code & Configurations](#8-practical-code--configurations)
9. [Quick Start Playbooks](#9-quick-start-playbooks)
10. [Reference Tables](#10-reference-tables)

---

## 1. Distributed Training Basics

### 1.1 The Three Paradigms

| Paradigm | What It Splits | Best For | Free Tier Suitability |
|----------|---------------|----------|----------------------|
| **Data Parallelism (DP)** | Batch across GPUs | Same model fits on each GPU | **EXCELLENT** -- default for free tiers |
| **Model Parallelism (MP)** | Model layers across GPUs | Model too big for one GPU | **GOOD** -- essential for 70B+ |
| **Pipeline Parallelism (PP)** | Layers across GPUs with micro-batches | Very deep models | **MODERATE** -- complex on free tiers |
| **Tensor Parallelism (TP)** | Individual layers/matmuls across GPUs | Massive matrices | **POOR** -- needs fast interconnect (NVLink) |
| **FSDP / ZeRO** | Parameters/gradients/optimizer states | Very large models | **EXCELLENT** -- best for free tiers |

### 1.2 Data Parallelism (The Free Tier Default)

```
[Global Batch = 64]
     |
[GPU 0: Batch 16]  [GPU 1: Batch 16]  [GPU 2: Batch 16]  [GPU 3: Batch 16]
     |                   |                   |                   |
[Forward+Backward] [Forward+Backward] [Forward+Backward] [Forward+Backward]
     |                   |                   |                   |
[Gradient Sync via AllReduce] <--- every step
     |
[Optimizer Step]
```

**Why DP is best for free tiers:**
- Each node works independently for forward/backward
- Only needs to sync gradients (small relative to model weights)
- Works across slow/unreliable networks (async possible)
- Simple to implement with PyTorch DDP

### 1.3 Model Parallelism (For Models That Don't Fit)

```
Input Batch -> [GPU 0: Embeddings] -> [GPU 1: Layers 1-6] -> [GPU 2: Layers 7-12] -> [GPU 3: Head]
```

**Model Parallelism on Free Tiers:**
- Split a large model across 2-4 Colab/Kaggle instances
- Each instance holds ~1/N of the model
- Activation checkpointing between nodes
- Works best with sequential layer models (Transformers)

### 1.4 Fully Sharded Data Parallel (FSDP) -- The Sweet Spot

FSDP shards model parameters, gradients, AND optimizer states across all GPUs:

```
Standard DP: Each GPU holds full model + full gradients + full optimizer states
FSDP:        Each GPU holds 1/N of model + 1/N of gradients + 1/N of optimizer states
             (gathered on-demand during forward/backward)
```

**Memory savings with FSDP:**
- FSDP Stage 1: Shard optimizer states -- ~4x memory reduction
- FSDP Stage 2: Shard optimizer + gradients -- ~8x memory reduction
- FSDP Stage 3: Shard everything -- proportional to 1/N GPUs

**FSDP is the #1 recommendation for training large models on free GPUs.**

### 1.5 DeepSpeed ZeRO (FSDP Alternative)

ZeRO-1: Shard optimizer states
ZeRO-2: Shard optimizer + gradients
ZeRO-3: Shard optimizer + gradients + parameters
ZeRO-Offload: Offload to CPU/NVMe -- train 70B on a single 16GB GPU (slow but works)

---

## 2. Training Across Multiple Free Platforms

### 2.1 Platform Inventory

| Platform | GPU | VRAM | RAM | Disk | Timeout | Weekly Limit |
|----------|-----|------|-----|------|---------|--------------|
| **Google Colab (Free)** | T4 | 16GB | ~12GB | ~78GB | 12h idle | ~12h/day |
| **Google Colab (Free)** | V100* | 16GB | ~12GB | ~78GB | 12h idle | ~12h/day |
| **Kaggle** | P100 | 16GB | ~13GB | ~20GB | 12h/session | 30h/week |
| **Kaggle** | T4x2 | 2x16GB | ~29GB | ~20GB | 12h/session | 30h/week |
| **Lightning AI** | T4 | 16GB | ~16GB | ~50GB | 22h* | ~22h/month |
| **Lambda Labs** | A100 | 40GB | ~200GB | ~200GB | No hard limit | $30 credit |
| **RunPod (Free)** | RTX 4090 | 24GB | ~60GB | ~50GB | ~1h | Very limited |
| **Paperspace** | M4000 | 8GB | ~30GB | ~50GB | ~6h | Limited |

*V100 on Colab is rare allocation. Lightning AI offers 22h/month of continuous use.

### 2.2 The Sequential Pipeline Strategy (Simplest)

For free tiers with different GPU types and timeout limits, the **Sequential Pipeline** is the most practical approach:

```
PHASE 1 (Colab T4):     Train layers 1-10  -> Save checkpoint to HF Hub
PHASE 2 (Kaggle P100):  Load checkpoint    -> Train layers 11-20 -> Save checkpoint
PHASE 3 (Lambda A100):  Load checkpoint    -> Train layers 21-30 -> Save checkpoint
PHASE 4 (Lightning T4): Load checkpoint    -> Train head + fine-tune all -> Final model
```

**Why sequential pipeline over true distributed:**
- Free tiers have timeouts -- sequential handles this naturally
- Different GPU types don't matter -- each phase adapts to its GPU
- No network synchronization needed -- only checkpoint transfer
- HuggingFace Hub is free checkpoint storage
- If a node dies, resume from last saved checkpoint

### 2.3 The Parallel Federation Strategy (Faster)

For multiple nodes training simultaneously:

```
[Colab T4] -----> train on data shard A -----> HF Hub ----->
                                                              |
[Kaggle P100] --> train on data shard B -----> HF Hub -----> [Aggregation Server]
                                                              |
[Lightning T4] -> train on data shard C -----> HF Hub ----->
                                                              |
[Lambda A100] --> train on data shard D -----> HF Hub -----> (FedAvg every N steps)
```

### 2.4 Coordination via HuggingFace Hub (Free)

HuggingFace Hub provides **free** model storage (up to 300GB per repo, unlimited repos):

```python
# Save checkpoint to HF Hub (free)
from huggingface_hub import HfApi
api = HfApi()
api.upload_folder(
    folder_path="./checkpoint-step-1000",
    repo_id="defoneos/training-checkpoints",
    repo_type="model"
)

# Load checkpoint from HF Hub
from huggingface_hub import snapshot_download
checkpoint_path = snapshot_download(
    repo_id="defoneos/training-checkpoints",
    local_dir="./checkpoint-step-1000"
)
```

### 2.5 Synchronization Protocol

```python
# Simple checkpoint-based sync -- no need for complex distributed protocols

class CheckpointSync:
    """Synchronize training across free tier nodes via HuggingFace Hub."""

    def __init__(self, hub_repo_id, hf_token):
        self.api = HfApi(token=hf_token)
        self.repo_id = hub_repo_id

    def push_checkpoint(self, local_path, step, metrics=None):
        """Push checkpoint to HF Hub. Keep only last N checkpoints."""
        commit_msg = f"checkpoint-step-{step}"
        if metrics:
            commit_msg += f" | loss={metrics.get('loss', 'N/A')}"

        self.api.upload_folder(
            folder_path=local_path,
            path_in_repo=f"checkpoint-{step}",
            repo_id=self.repo_id,
            repo_type="model",
            commit_message=commit_msg
        )

    def get_latest_checkpoint(self):
        """List repo files and find latest checkpoint."""
        files = self.api.list_repo_files(self.repo_id, repo_type="model")
        checkpoints = [f for f in files if f.startswith("checkpoint-")]
        if not checkpoints:
            return None
        # Sort by step number
        latest = sorted(checkpoints, key=lambda x: int(x.split("-")[1]))[-1]
        return latest

    def pull_checkpoint(self, step, local_dir="./checkpoint"):
        """Download specific checkpoint."""
        return snapshot_download(
            repo_id=self.repo_id,
            allow_patterns=[f"checkpoint-{step}/**"],
            local_dir=local_dir
        )
```

---

## 3. Federated Training on Free Nodes

### 3.1 Why Federated Learning for Free Tiers

Free GPU nodes are:
- **Unreliable**: Can timeout or disconnect at any moment
- **Heterogeneous**: Different GPU types and memory
- **Intermittent**: Not always available when you need them
- **Independent**: No fast interconnect between them

**Federated Learning handles ALL of these naturally.**

### 3.2 Comparison of Federated Learning Frameworks

| Framework | Best For | Free Tier Suitability | Complexity |
|-----------|----------|----------------------|------------|
| **Flower (flwr)** | Research, PyTorch/TF/JAX | **EXCELLENT** | Low |
| **PySyft** | Privacy-preserving FL | GOOD | High |
| **TensorFlow Federated** | TensorFlow only | MODERATE | Medium |
| **OpenFL** | Intel-optimized | MODERATE | Medium |
| **Custom (simple)** | Our use case | **EXCELLENT** | Very Low |

**Recommendation: Flower (flwr)** for production federated training, **Custom implementation** for simple checkpoint-based federation.

### 3.3 Flower (flwr) Setup for Free Tiers

```bash
pip install flwr torch transformers
```

```python
# server.py -- Run this on a persistent machine (or use Flower's free hosted server)
import flwr as fl
import numpy as np

class FedAvgStrategy(fl.server.strategy.FedAvg):
    """Custom FedAvg with checkpoint saving to HF Hub."""

    def aggregate_fit(self, rnd, results, failures):
        aggregated = super().aggregate_fit(rnd, results, failures)
        if aggregated is not None:
            weights = fl.common.parameters_to_ndarrays(aggregated[0])
            # Save aggregated weights to HF Hub
            save_to_hub(weights, step=rnd)
        return aggregated

# Start server
fl.server.start_server(
    server_address="0.0.0.0:8080",
    strategy=FedAvgStrategy(
        fraction_fit=0.5,        # 50% of clients participate each round
        min_fit=1,               # Minimum 1 client
        min_available=1,         # Minimum 1 client available
    ),
)
```

```python
# client.py -- Run this on each free GPU node
import flwr as fl
import torch
from transformers import AutoModelForCausalLM

class FreeTierClient(fl.client.NumPyClient):
    def __init__(self, model_name, device):
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            load_in_4bit=True,          # QLoRA for free tier VRAM
            device_map=device
        )
        self.dataset = load_local_data()  # Each node has different data

    def get_parameters(self, config):
        """Get model weights as numpy arrays."""
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters):
        """Set model weights from numpy arrays."""
        state_dict = dict(zip(self.model.state_dict().keys(), parameters))
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        """Train locally for a few steps."""
        self.set_parameters(parameters)

        # Local training
        trainer = Trainer(
            model=self.model,
            train_dataset=self.dataset,
            max_steps=config.get("local_steps", 100),
        )
        trainer.train()

        return self.get_parameters({}), len(self.dataset), {}

    def evaluate(self, parameters, config):
        """Evaluate on local validation set."""
        self.set_parameters(parameters)
        loss = evaluate_model(self.model, self.val_dataset)
        return float(loss), len(self.val_dataset), {"loss": float(loss)}

# Start client -- each free tier node runs this
fl.client.start_numpy_client(
    server_address="YOUR_SERVER:8080",  # Can use ngrok for free
    client=FreeTierClient("meta-llama/Llama-2-7b", "cuda"),
)
```

### 3.4 Custom Lightweight Federation (Recommended for Simple Cases)

For most free tier setups, a custom implementation is simpler and more robust:

```python
# custom_federation.py -- Lightweight, no external FL framework needed
import torch
import requests
import json
from huggingface_hub import upload_file, hf_hub_download

class LightweightFederation:
    """
    Simple federated training using HF Hub as the parameter server.
    No need for persistent servers -- HF Hub IS the server.
    """

    def __init__(self, repo_id, hf_token, aggregation="fedavg"):
        self.repo_id = repo_id
        self.hf_token = hf_token
        self.round = 0
        self.aggregation = aggregation

    def submit_update(self, local_weights_path, dataset_size, metrics):
        """Submit local model update to HF Hub."""
        update = {
            "round": self.round,
            "dataset_size": dataset_size,
            "metrics": metrics,
            "timestamp": time.time()
        }
        # Upload weights
        upload_file(
            path_or_fileobj=local_weights_path,
            path_in_repo=f"updates/round-{self.round}/client-{self.client_id}.pt",
            repo_id=self.repo_id,
            token=self.hf_token
        )
        # Upload metadata
        upload_file(
            path_or_fileobj=json.dumps(update).encode(),
            path_in_repo=f"updates/round-{self.round}/client-{self.client_id}.json",
            repo_id=self.repo_id,
            token=self.hf_token
        )

    def aggregate_round(self, round_num):
        """Aggregate all client updates using FedAvg."""
        # Download all updates for this round
        client_files = list_repo_files(self.repo_id, repo_type="model")
        round_files = [f for f in client_files if f"round-{round_num}" in f and f.endswith(".pt")]

        if len(round_files) == 0:
            return None

        # Load all client weights and dataset sizes
        client_weights = []
        dataset_sizes = []

        for f in round_files:
            weights_path = hf_hub_download(self.repo_id, f, token=self.hf_token)
            client_weights.append(torch.load(weights_path))

            # Load metadata for dataset size
            meta_path = f.replace(".pt", ".json")
            meta_path = hf_hub_download(self.repo_id, meta_path, token=self.hf_token)
            with open(meta_path) as fp:
                meta = json.load(fp)
            dataset_sizes.append(meta["dataset_size"])

        # FedAvg: weighted average by dataset size
        total_size = sum(dataset_sizes)
        aggregated = {}
        for key in client_weights[0].keys():
            aggregated[key] = sum(
                w[key] * (size / total_size)
                for w, size in zip(client_weights, dataset_sizes)
            )

        # Save aggregated model
        torch.save(aggregated, "aggregated.pt")
        upload_file(
            path_or_fileobj="aggregated.pt",
            path_in_repo=f"global/round-{round_num}.pt",
            repo_id=self.repo_id,
            token=self.hf_token
        )

        return aggregated
```

### 3.5 Handling Unreliable Nodes

```python
class FaultTolerantTrainer:
    """Training loop that handles free tier timeouts and disconnections."""

    def __init__(self, sync_manager, checkpoint_every=100):
        self.sync = sync_manager
        self.checkpoint_every = checkpoint_every
        self.step = 0

    def train_with_fault_tolerance(self, model, dataloader, optimizer):
        """Train with automatic checkpoint and resume."""
        try:
            for batch in dataloader:
                # Forward + backward
                loss = self.train_step(model, batch, optimizer)
                self.step += 1

                # Checkpoint every N steps
                if self.step % self.checkpoint_every == 0:
                    self.save_checkpoint(model, optimizer, self.step)
                    print(f"Checkpoint saved at step {self.step}")

                # Report metrics
                if self.step % 10 == 0:
                    print(f"Step {self.step}: loss={loss:.4f}")

        except (RuntimeError, ConnectionError, KeyboardInterrupt) as e:
            print(f"Training interrupted: {e}")
            # Emergency checkpoint save
            self.save_checkpoint(model, optimizer, self.step, emergency=True)
            print(f"Emergency checkpoint saved at step {self.step}")
            raise

    def save_checkpoint(self, model, optimizer, step, emergency=False):
        """Save checkpoint locally AND to HF Hub."""
        ckpt = {
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "step": step,
            "emergency": emergency
        }
        local_path = f"checkpoint-step-{step}.pt"
        torch.save(ckpt, local_path)
        # Upload to HF Hub (non-blocking)
        Thread(target=self.sync.push_checkpoint, args=(local_path, step)).start()

    def resume_from_checkpoint(self, model, optimizer):
        """Resume from latest checkpoint on HF Hub."""
        latest = self.sync.get_latest_checkpoint()
        if latest is None:
            print("No checkpoint found, starting from scratch")
            return model, optimizer, 0

        print(f"Resuming from {latest}")
        ckpt_path = self.sync.pull_checkpoint(latest)
        ckpt = torch.load(ckpt_path)
        model.load_state_dict(ckpt["model_state_dict"])
        optimizer.load_state_dict(ckpt["optimizer_state_dict"])
        return model, optimizer, ckpt["step"]
```

---

## 4. Checkpoint Management Strategy

### 4.1 The Hub-Backed Checkpoint System

```python
# checkpoint_manager.py -- Production-grade checkpoint management
import os
import json
import time
import torch
from datetime import datetime, timedelta
from huggingface_hub import (
    HfApi, upload_file, hf_hub_download,
    create_repo, repo_exists, delete_file
)
from threading import Thread

class HubCheckpointManager:
    """
    Production checkpoint manager using HuggingFace Hub as backend.
    Features: versioning, cleanup, resume, metadata tracking.
    """

    def __init__(self, repo_id, hf_token, keep_last=5, async_upload=True):
        self.api = HfApi(token=hf_token)
        self.repo_id = repo_id
        self.hf_token = hf_token
        self.keep_last = keep_last
        self.async_upload = async_upload

        # Create repo if it doesn't exist
        if not repo_exists(repo_id, repo_type="model", token=hf_token):
            create_repo(repo_id, repo_type="model", token=hf_token, private=True)
            print(f"Created checkpoint repo: {repo_id}")

    def save(self, model, optimizer, step, metrics=None, scheduler=None, tag=None):
        """
        Save a complete checkpoint to HF Hub.

        Args:
            model: PyTorch model
            optimizer: PyTorch optimizer
            step: Current training step
            metrics: Optional metrics dict (loss, accuracy, etc.)
            scheduler: Optional LR scheduler
            tag: Optional tag (e.g., 'best', 'final')
        """
        checkpoint = {
            "step": step,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": metrics or {},
        }
        if scheduler is not None:
            checkpoint["scheduler_state_dict"] = scheduler.state_dict()

        # Save locally first
        local_filename = f"checkpoint-step-{step}.pt"
        torch.save(checkpoint, local_filename)

        # Upload to HF Hub
        path_in_repo = f"checkpoints/{tag or 'step'}-{step}.pt"

        if self.async_upload:
            Thread(target=self._upload, args=(local_filename, path_in_repo)).start()
        else:
            self._upload(local_filename, path_in_repo)

        # Upload metadata JSON for easy inspection
        metadata = {
            "step": step,
            "timestamp": checkpoint["timestamp"],
            "metrics": metrics or {},
            "tag": tag,
            "size_mb": os.path.getsize(local_filename) / (1024 * 1024)
        }
        meta_path = f"/tmp/meta-{step}.json"
        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)
        self._upload(meta_path, f"checkpoints/meta-{step}.json")

        # Cleanup old checkpoints
        self._cleanup_old_checkpoints()

        return path_in_repo

    def _upload(self, local_path, path_in_repo):
        """Upload a file to HF Hub."""
        try:
            upload_file(
                path_or_fileobj=local_path,
                path_in_repo=path_in_repo,
                repo_id=self.repo_id,
                token=self.hf_token,
                repo_type="model"
            )
        except Exception as e:
            print(f"Upload failed: {e}")

    def load(self, step=None, tag=None, local_path=None):
        """
        Load a checkpoint. If step is None, loads the latest.

        Args:
            step: Specific step to load
            tag: Load by tag ('best', 'final')
            local_path: Load from local path instead of hub
        """
        if local_path and os.path.exists(local_path):
            return torch.load(local_path, map_location="cpu")

        # List available checkpoints
        files = self.api.list_repo_files(self.repo_id, repo_type="model")
        ckpt_files = [f for f in files if f.startswith("checkpoints/") and f.endswith(".pt")]

        if not ckpt_files:
            return None

        # Determine which checkpoint to load
        target_file = None
        if tag:
            matches = [f for f in ckpt_files if f"{tag}-" in f]
            if matches:
                target_file = sorted(matches)[-1]
        elif step:
            target_file = f"checkpoints/step-{step}.pt"
        else:
            # Load latest by step number
            steps = []
            for f in ckpt_files:
                try:
                    s = int(f.split("-")[-1].replace(".pt", ""))
                    steps.append((s, f))
                except ValueError:
                    continue
            if steps:
                target_file = sorted(steps)[-1][1]

        if target_file is None:
            return None

        print(f"Loading checkpoint: {target_file}")
        downloaded = hf_hub_download(
            self.repo_id,
            target_file,
            token=self.hf_token,
            repo_type="model"
        )
        return torch.load(downloaded, map_location="cpu")

    def _cleanup_old_checkpoints(self):
        """Keep only the last N checkpoints."""
        try:
            files = self.api.list_repo_files(self.repo_id, repo_type="model")
            ckpt_files = [f for f in files if f.startswith("checkpoints/step-")]

            if len(ckpt_files) <= self.keep_last:
                return

            # Sort by step number and delete oldest
            steps = []
            for f in ckpt_files:
                try:
                    s = int(f.split("-")[-1].replace(".pt", ""))
                    steps.append((s, f))
                except ValueError:
                    continue

            steps.sort()
            for _, f in steps[:-self.keep_last]:
                delete_file(f, repo_id=self.repo_id, repo_type="model", token=self.hf_token)
                # Also delete metadata
                meta_f = f.replace("step-", "meta-").replace(".pt", ".json")
                try:
                    delete_file(meta_f, repo_id=self.repo_id, repo_type="model", token=self.hf_token)
                except:
                    pass
        except Exception as e:
            print(f"Cleanup failed: {e}")

    def list_checkpoints(self):
        """List all available checkpoints with metadata."""
        files = self.api.list_repo_files(self.repo_id, repo_type="model")
        meta_files = sorted([f for f in files if f.startswith("checkpoints/meta-")])

        checkpoints = []
        for mf in meta_files:
            try:
                downloaded = hf_hub_download(self.repo_id, mf, token=self.hf_token, repo_type="model")
                with open(downloaded) as f:
                    checkpoints.append(json.load(f))
            except:
                pass
        return checkpoints
```

### 4.2 Checkpoint Resume Strategy

```python
def resume_or_start(model, optimizer, ckpt_manager, scheduler=None):
    """Universal resume function."""
    checkpoint = ckpt_manager.load()

    if checkpoint is None:
        print("Starting training from scratch")
        return model, optimizer, 0, {}

    # Load states
    model.load_state_dict(checkpoint["model_state_dict"])
    optimizer.load_state_dict(checkpoint["optimizer_state_dict"])

    step = checkpoint["step"]
    metrics = checkpoint.get("metrics", {})

    if scheduler is not None and "scheduler_state_dict" in checkpoint:
        scheduler.load_state_dict(checkpoint["scheduler_state_dict"])

    print(f"Resumed from step {step} | Metrics: {metrics}")
    return model, optimizer, step, metrics
```

---

## 5. The 70B Model Challenge

### 5.1 The Problem

Can we fine-tune a 70B parameter model on free GPUs?

| Model | FP32 VRAM | FP16 VRAM | 4-bit VRAM | LoRA 4-bit |
|-------|-----------|-----------|------------|------------|
| 7B | 28 GB | 14 GB | 7 GB | 4 GB |
| 13B | 52 GB | 26 GB | 13 GB | 6 GB |
| 30B | 120 GB | 60 GB | 30 GB | 10 GB |
| 70B | 280 GB | 140 GB | 70 GB | 20 GB |

### 5.2 QLoRA: The Solution for Free Tiers

QLoRA combines 4-bit quantization with LoRA adapters:

```
[Base Model: 4-bit quantized] + [LoRA Adapters: FP16]
     ~18GB VRAM                    ~2GB VRAM
         +              =              ~20GB total
```

**This fits on Lambda A100 (40GB) with room to spare!**

### 5.3 Training 70B on Lambda A100 (Primary Strategy)

```python
# 70B_training.py -- Train 70B model on Lambda A100
import torch
from transformers import (
    AutoModelForCausalLM, AutoTokenizer,
    TrainingArguments, Trainer,
    BitsAndBytesConfig
)
from peft import (
    LoraConfig, get_peft_model,
    prepare_model_for_kbit_training
)
from datasets import load_dataset

# Step 1: 4-bit quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,      # Nested quantization for memory
    bnb_4bit_quant_type="nf4",            # 4-bit Normal Float
    bnb_4bit_compute_dtype=torch.bfloat16 # Compute in BF16
)

# Step 2: Load model in 4-bit
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-70b",  # or any 70B model
    quantization_config=bnb_config,
    device_map="auto",           # Auto-distribute across GPU/CPU
    trust_remote_code=True,
    torch_dtype=torch.bfloat16,
)

# Step 3: Prepare for training
model = prepare_model_for_kbit_training(model)

# Step 4: LoRA configuration
lora_config = LoraConfig(
    r=64,                # LoRA rank (higher = more capacity)
    lora_alpha=16,       # Scaling factor
    target_modules=[     # Which layers to adapt
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_dropout=0.1,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)

# Step 5: Training arguments optimized for 40GB VRAM
training_args = TrainingArguments(
    output_dir="./llama-70b-lora",
    num_train_epochs=3,
    per_device_train_batch_size=1,      # Must be 1 for 70B
    gradient_accumulation_steps=4,      # Effective batch = 4
    optim="paged_adamw_8bit",           # 8-bit optimizer (critical!)
    learning_rate=2e-4,
    bf16=True,                          # BF16 mixed precision
    logging_steps=10,
    save_strategy="steps",
    save_steps=100,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    group_by_length=True,               # Efficiency optimization
)

# Step 6: Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    data_collator=data_collator,
)
trainer.train()

# Step 7: Save only LoRA adapters (small!)
model.save_pretrained("./llama-70b-lora-adapters")  # ~500MB
```

### 5.4 Splitting 70B Across 2x T4 (Model Parallelism)

For platforms with 2x T4 (Kaggle) or multiple smaller GPUs:

```python
# multi_gpu_70b.py -- Model parallelism across 2 GPUs
from accelerate import init_empty_weights, load_checkpoint_and_dispatch
from transformers import AutoModelForCausalLM, AutoConfig

# Step 1: Define device map manually for 2x T4
# Split layers evenly across two GPUs
device_map = {
    "model.embed_tokens": 0,
    "model.layers.0": 0, "model.layers.1": 0, "model.layers.2": 0,
    "model.layers.3": 0, "model.layers.4": 0, "model.layers.5": 0,
    "model.layers.6": 0, "model.layers.7": 0, "model.layers.8": 0,
    "model.layers.9": 0, "model.layers.10": 0, "model.layers.11": 0,
    "model.layers.12": 0, "model.layers.13": 0, "model.layers.14": 0,
    "model.layers.15": 0, "model.layers.16": 0, "model.layers.17": 0,
    "model.layers.18": 0, "model.layers.19": 0,
    "model.layers.20": 1, "model.layers.21": 1, "model.layers.22": 1,
    "model.layers.23": 1, "model.layers.24": 1, "model.layers.25": 1,
    "model.layers.26": 1, "model.layers.27": 1, "model.layers.28": 1,
    "model.layers.29": 1, "model.layers.30": 1, "model.layers.31": 1,
    "model.layers.32": 1, "model.layers.33": 1, "model.layers.34": 1,
    "model.layers.35": 1, "model.layers.36": 1, "model.layers.37": 1,
    "model.layers.38": 1, "model.layers.39": 1,
    "model.norm": 1,
    "lm_head": 1,
}

# Step 2: Load with device map
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-70b",
    load_in_4bit=True,
    device_map=device_map,  # Manual device placement
    torch_dtype=torch.bfloat16,
)

# Now the model is split across 2x T4 GPUs!
# GPU 0: ~35GB of layers, GPU 1: ~35GB of layers
# With 4-bit quantization, each T4 only needs ~9GB for its layers
```

### 5.5 CPU Offloading (Slowest But Works Anywhere)

```python
# cpu_offloading.py -- Train 70B on ANY GPU with CPU offloading
from accelerate import Accelerator

accelerator = Accelerator(
    mixed_precision="bf16",
    cpu_offload=True,  # Offload to CPU when GPU OOM
)

# DeepSpeed ZeRO-Offload config
deepspeed_config = {
    "bf16": {"enabled": True},
    "zero_optimization": {
        "stage": 3,
        "offload_optimizer": {
            "device": "cpu",
            "pin_memory": True
        },
        "offload_param": {
            "device": "cpu",
            "pin_memory": True
        },
        "overlap_comm": True,
        "contiguous_gradients": True,
    },
    "train_batch_size": "auto",
    "train_micro_batch_size_per_gpu": 1,
    "gradient_accumulation_steps": "auto",
}

# With this config, a 70B model can train on a single 16GB T4
# It will be SLOW (CPU<->GPU transfers), but it WORKS
```

### 5.6 The 70B Decision Matrix

| GPU Setup | Method | Expected Speed | Viable? |
|-----------|--------|---------------|---------|
| **Lambda A100 40GB** | QLoRA + 8-bit optim | ~100 tok/s | **YES -- Primary** |
| **Kaggle 2x T4** | 4-bit + Model Parallel | ~40 tok/s | **YES -- Secondary** |
| **Colab T4 16GB** | QLoRA + CPU offloading | ~10 tok/s | **YES -- Slow** |
| **Kaggle P100 16GB** | QLoRA + DeepSpeed ZeRO-Offload | ~15 tok/s | **YES -- Slow** |
| **Lightning T4 16GB** | QLoRA | ~12 tok/s | **YES -- Backup** |

---

## 6. Training Throughput Optimization

### 6.1 Optimization Checklist (Free -- Apply All)

| Optimization | Speedup | VRAM Reduction | How to Enable |
|-------------|---------|---------------|---------------|
| **Mixed Precision (BF16)** | 2-3x | ~50% | `torch.bfloat16` or `transformers --bf16` |
| **Gradient Accumulation** | N/A (simulates larger batch) | None | `gradient_accumulation_steps=4` |
| **Flash Attention 2** | 2-4x | ~20-30% | `pip install flash-attn` + `use_flash_attention_2=True` |
| **Gradient Checkpointing** | ~30% slower per step | ~50% | `model.gradient_checkpointing_enable()` |
| **8-bit Optimizer** | N/A | ~75% optim VRAM | `optim="paged_adamw_8bit"` |
| **4-bit Weights (QLoRA)** | N/A | ~75% model VRAM | `BitsAndBytesConfig(load_in_4bit=True)` |
| **DeepSpeed ZeRO-3** | N/A | Proportional to 1/GPUs | DeepSpeed config |
| **FSDP** | N/A | Proportional to 1/GPUs | `torch.distributed.run --nproc_per_node=N` |

### 6.2 Flash Attention 2 Setup

```bash
# Install Flash Attention 2 (free speedup!)
pip install flash-attn --no-build-isolation

# Use in model
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-70b",
    attn_implementation="flash_attention_2",
    torch_dtype=torch.bfloat16,
    # ... other config
)
```

**Flash Attention 2 gives 2-4x speedup for training Transformers on GPUs.**
Always use it when available (A100, T4, V100 with compute capability >= 7.5).

### 6.3 Gradient Accumulation Pattern

```python
# Effective batch size = per_device_batch * num_gpus * gradient_accumulation_steps
# Example: 1 * 1 * 8 = effective batch of 8 on a single GPU

training_args = TrainingArguments(
    per_device_train_batch_size=1,         # Safe for any GPU
    gradient_accumulation_steps=8,          # Simulate batch of 8
    # ...
)

# Custom training loop with gradient accumulation:
for step, batch in enumerate(dataloader):
    loss = model(**batch).loss
    loss = loss / gradient_accumulation_steps
    loss.backward()

    if (step + 1) % gradient_accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

### 6.4 DeepSpeed Config for Free GPUs

```json
{
  "bf16": {
    "enabled": true
  },
  "zero_optimization": {
    "stage": 2,
    "offload_optimizer": {
      "device": "cpu",
      "pin_memory": true
    },
    "allgather_partitions": true,
    "allgather_bucket_size": 2e8,
    "overlap_comm": true,
    "reduce_scatter": true,
    "reduce_bucket_size": 2e8,
    "contiguous_gradients": true
  },
  "gradient_accumulation_steps": 4,
  "gradient_clipping": 1.0,
  "train_batch_size": "auto",
  "train_micro_batch_size_per_gpu": 1,
  "wall_clock_breakdown": false
}
```

### 6.5 DeepSpeed Config for Maximum Memory Savings (ZeRO-3)

```json
{
  "bf16": {
    "enabled": true
  },
  "zero_optimization": {
    "stage": 3,
    "offload_optimizer": {
      "device": "cpu",
      "pin_memory": true
    },
    "offload_param": {
      "device": "cpu",
      "pin_memory": true
    },
    "overlap_comm": true,
    "contiguous_gradients": true,
    "sub_group_size": 1e9,
    "reduce_bucket_size": "auto",
    "stage3_prefetch_bucket_size": "auto",
    "stage3_param_persistence_threshold": "auto",
    "stage3_max_live_parameters": 1e9,
    "stage3_max_reuse_distance": 1e9,
    "stage3_gather_16bit_weights_on_model_save": true
  },
  "gradient_accumulation_steps": "auto",
  "gradient_clipping": "auto",
  "train_batch_size": "auto",
  "train_micro_batch_size_per_gpu": "auto",
  "steps_per_print": 10
}
```

---

## 7. The DEFONEOS Training Grid

### 7.1 Grid Architecture

```
                    DEFONEOS Training Grid
                    =====================

    +------------------+     +------------------+     +------------------+
    |   COLAB T4       |     |   KAGGLE P100    |     |   LIGHTNING T4   |
    |   (16GB VRAM)    |     |   (16GB VRAM)    |     |   (16GB VRAM)    |
    |                  |     |                  |     |                  |
    |  Small Models    |     |  Medium Models   |     |  Medium Models   |
    |  - YOLOv8 (train)|     |  - DETR (train)  |     |  - BERT (train)  |
    |  - MobileNet     |     |  - ResNet-50     |     |  - ViT (fine-tune)|
    |  - DistilBERT    |     |  - GPT-2 (train) |     |  - CLIP          |
    |                  |     |  - LoRA adapters |     |  - T5 (small)    |
    +--------+---------+     +--------+---------+     +--------+---------+
             |                        |                        |
             +------------------------+------------------------+
                                      |
                         +------------+------------+
                         |     HF HUB (FREE)       |
                         |  - Checkpoints          |
                         |  - LoRA adapters        |
                         |  - Dataset shards       |
                         +------------+------------+
                                      |
                         +------------+------------+
                         |    LAMBDA A100 40GB     |
                         |                         |
                         |  Large Models           |
                         |  - LLaMA-70B (QLoRA)    |
                         |  - Falcon-40B           |
                         |  - Mistral-7B (full FT) |
                         |  - Stable Diffusion XL  |
                         |  - Video models         |
                         +-------------------------+
```

### 7.2 Model-to-Platform Mapping

| Model Size | Model Examples | Best Platform | Strategy | VRAM Need |
|-----------|---------------|---------------|----------|-----------|
| **<1B** | DistilBERT, MobileNet, YOLOv8-n | Colab T4 | Full fine-tuning | 2-8 GB |
| **1B-7B** | GPT-2, BERT-Large, ViT, T5-base | Colab T4 / Kaggle P100 | Full fine-tuning or LoRA | 4-16 GB |
| **7B-13B** | LLaMA-2-7B, Mistral-7B, Falcon-7B | Kaggle T4x2 / Lambda A100 | LoRA or 4-bit | 8-20 GB |
| **13B-40B** | LLaMA-2-13B, Falcon-40B, GPT-J | Lambda A100 | QLoRA | 15-25 GB |
| **40B-70B** | LLaMA-2-70B, Falcon-180B | Lambda A100 | QLoRA + 8-bit optim | 20-35 GB |
| **>70B** | GPT-4 class, Falcon-180B | Lambda A100 + CPU offloading | QLoRA + ZeRO-Offload | 35+ GB |

### 7.3 Weekly Training Schedule

```
MONDAY:
  08:00-12:00  [Colab]    YOLOv8 training on custom dataset
  12:00-16:00  [Kaggle]   BERT fine-tuning on classification task
  16:00-20:00  [Lightning] ViT training on image dataset
  20:00-24:00  [Lambda]   LLaMA-70B QLoRA (priority: large models)

TUESDAY:
  08:00-12:00  [Colab]    YOLOv8 continued (or new small model)
  12:00-16:00  [Kaggle]   DETR training on object detection
  16:00-20:00  [Lightning] T5 fine-tuning on summarization
  20:00-24:00  [Lambda]   LLaMA-70B continued

WEDNESDAY:
  08:00-12:00  [Colab]    Small model evaluation + new experiment
  12:00-16:00  [Kaggle]   GPT-2 training from scratch (small)
  16:00-20:00  [Lightning] CLIP fine-tuning
  20:00-24:00  [Lambda]   LLaMA-70B + merge adapters

THURSDAY:
  08:00-12:00  [Colab]    DistilBERT training
  12:00-16:00  [Kaggle]   LoRA training for 7B model
  16:00-20:00  [Lightning] Model evaluation + dataset prep
  20:00-24:00  [Lambda]   Stable Diffusion XL fine-tuning

FRIDAY:
  08:00-12:00  [Colab]    Final small model training
  12:00-16:00  [Kaggle]   Final medium model training
  16:00-20:00  [Lightning] Final medium model training
  20:00-24:00  [Lambda]   Final large model training + export

SATURDAY-SUNDAY:
  Full days on Lambda A100 for large model training
  Backup: Colab/Kaggle for small model experiments
```

### 7.4 Platform Priority Rules

1. **Lambda A100 (40GB)** -> Reserve for models > 13B parameters ONLY
2. **Kaggle T4x2 (32GB total)** -> Medium models (7B-13B) or data parallelism
3. **Lightning AI T4 (16GB)** -> Medium models with LoRA/4-bit
4. **Colab T4 (16GB)** -> Small models (< 7B) and experimentation
5. **Multiple platforms simultaneously** -> Data parallelism across same model

### 7.5 Automatic Platform Detection

```python
# platform_detector.py -- Auto-detect platform and optimize config
import torch
import os

def detect_platform():
    """Detect which free tier platform we're running on."""
    env = {
        "colab": os.path.exists("/content"),
        "kaggle": os.environ.get("KAGGLE_KERNEL_RUN_TYPE") is not None,
        "lightning": os.environ.get("LIGHTNING_CLOUD_APP_ID") is not None,
        "lambda": os.path.exists("/opt/lambda"),
    }
    platform = [k for k, v in env.items() if v]
    return platform[0] if platform else "unknown"

def get_gpu_info():
    """Get GPU info for auto-config."""
    if not torch.cuda.is_available():
        return {"gpu": "none", "vram_gb": 0, "count": 0}

    props = torch.cuda.get_device_properties(0)
    vram_gb = props.total_memory / (1024**3)
    gpu_name = props.name
    gpu_count = torch.cuda.device_count()

    return {
        "gpu": gpu_name,
        "vram_gb": vram_gb,
        "count": gpu_count,
        "multi_gpu": gpu_count > 1,
        "compute_capability": f"{props.major}.{props.minor}"
    }

def auto_config(model_size_params=7e9):
    """Automatically generate optimal training config."""
    platform = detect_platform()
    gpu = get_gpu_info()

    config = {
        "platform": platform,
        "gpu": gpu,
        "batch_size": 1,
        "gradient_accumulation_steps": 4,
        "mixed_precision": "bf16" if torch.cuda.is_bf16_supported() else "fp16",
        "use_4bit": False,
        "use_lora": False,
        "use_deepspeed": False,
        "flash_attention": gpu["compute_capability"] >= "7.5",
    }

    # Auto-configure based on VRAM
    vram = gpu["vram_gb"]
    model_size_gb = model_size_params * 4 / (1024**3)  # FP32 size

    if model_size_gb > vram * 0.8:
        config["use_4bit"] = True
        config["use_lora"] = True
        print(f"Model ({model_size_gb:.1f}GB) > VRAM ({vram:.1f}GB): Enabling QLoRA")

    if vram < 20:
        config["gradient_accumulation_steps"] = 8
        config["use_deepspeed"] = True
        print(f"Limited VRAM ({vram:.1f}GB): Using DeepSpeed + high gradient accumulation")

    if gpu["multi_gpu"]:
        config["use_deepspeed"] = True
        print(f"Multi-GPU detected ({gpu['count']}x): Enabling DeepSpeed for parallelism")

    # Platform-specific optimizations
    if platform == "kaggle" and gpu["count"] == 2:
        config["device_map"] = "auto"  # Let transformers handle 2-GPU split

    if platform == "lambda":
        config["flash_attention"] = True  # A100 definitely supports it
        config["gradient_accumulation_steps"] = 4  # Can use larger micro-batches

    return config

# Usage:
config = auto_config(model_size_params=70e9)
print(json.dumps(config, indent=2))
```

---

## 8. Practical Code & Configurations

### 8.1 PyTorch DistributedDataParallel (DDP) Setup

```python
# ddp_training.py -- Distributed training across multiple GPUs/nodes
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
import os

def setup_distributed():
    """Initialize distributed training."""
    # Check if we're in a distributed environment
    if "RANK" in os.environ and "WORLD_SIZE" in os.environ:
        rank = int(os.environ["RANK"])
        world_size = int(os.environ["WORLD_SIZE"])
        local_rank = int(os.environ.get("LOCAL_RANK", 0))
    else:
        rank = 0
        world_size = 1
        local_rank = 0

    if world_size > 1:
        dist.init_process_group(
            backend="nccl" if torch.cuda.is_available() else "gloo",
            rank=rank,
            world_size=world_size
        )
        torch.cuda.set_device(local_rank)

    return rank, world_size, local_rank

def create_distributed_dataloader(dataset, batch_size, world_size, rank):
    """Create a DataLoader with DistributedSampler."""
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True
    )
    loader = DataLoader(
        dataset,
        batch_size=batch_size,
        sampler=sampler,
        num_workers=4,
        pin_memory=True
    )
    return loader

def train_ddp(model, train_dataset, config):
    """Main DDP training loop."""
    rank, world_size, local_rank = setup_distributed()
    device = torch.device(f"cuda:{local_rank}" if torch.cuda.is_available() else "cpu")

    # Move model to device and wrap with DDP
    model = model.to(device)
    if world_size > 1:
        model = DDP(model, device_ids=[local_rank], output_device=local_rank)

    # Create distributed dataloader
    train_loader = create_distributed_dataloader(
        train_dataset,
        batch_size=config["batch_size"],
        world_size=world_size,
        rank=rank
    )

    optimizer = torch.optim.AdamW(model.parameters(), lr=config["lr"])
    scaler = torch.cuda.amp.GradScaler()  # For mixed precision

    model.train()
    for epoch in range(config["epochs"]):
        train_loader.sampler.set_epoch(epoch)  # Important for proper shuffling

        for step, batch in enumerate(train_loader):
            batch = {k: v.to(device) for k, v in batch.items()}

            optimizer.zero_grad()

            # Mixed precision forward
            with torch.cuda.amp.autocast(dtype=torch.bfloat16):
                outputs = model(**batch)
                loss = outputs.loss

            # Scaled backward
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            if rank == 0 and step % 10 == 0:
                print(f"Epoch {epoch} | Step {step} | Loss: {loss.item():.4f}")

    if world_size > 1:
        dist.destroy_process_group()

# Launch command for single-node multi-GPU:
# torchrun --nproc_per_node=2 ddp_training.py
#
# Launch command for multi-node (via ngrok tunnel):
# Node 0: torchrun --nnodes=2 --node_rank=0 --master_addr=NGROK_URL --master_port=29500 --nproc_per_node=1 ddp_training.py
# Node 1: torchrun --nnodes=2 --node_rank=1 --master_addr=NGROK_URL --master_port=29500 --nproc_per_node=1 ddp_training.py
```

### 8.2 DeepSpeed Integration

```python
# deepspeed_training.py -- DeepSpeed for memory-efficient training
import deepspeed
import torch
from transformers import AutoModelForCausalLM

def train_with_deepspeed(model_name, dataset, config):
    """Train with DeepSpeed ZeRO optimization."""

    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.bfloat16
    )

    # DeepSpeed config
    ds_config = {
        "bf16": {"enabled": True},
        "zero_optimization": {
            "stage": config.get("zero_stage", 2),
            "offload_optimizer": {
                "device": "cpu" if config.get("cpu_offload") else "none",
                "pin_memory": True
            } if config.get("cpu_offload") else {},
            "overlap_comm": True,
            "contiguous_gradients": True,
        },
        "optimizer": {
            "type": "AdamW",
            "params": {
                "lr": config["lr"],
                "betas": [0.9, 0.999],
                "eps": 1e-8,
                "weight_decay": 0.01
            }
        },
        "scheduler": {
            "type": "WarmupLR",
            "params": {
                "warmup_min_lr": 0,
                "warmup_max_lr": config["lr"],
                "warmup_num_steps": config.get("warmup_steps", 100)
            }
        },
        "train_batch_size": config["batch_size"] * config.get("gradient_accumulation", 4),
        "train_micro_batch_size_per_gpu": config["batch_size"],
        "gradient_accumulation_steps": config.get("gradient_accumulation", 4),
        "wall_clock_breakdown": False
    }

    # Initialize DeepSpeed
    model_engine, optimizer, _, scheduler = deepspeed.initialize(
        model=model,
        model_parameters=model.parameters(),
        config=ds_config
    )

    # Training loop
    model_engine.train()
    for step, batch in enumerate(dataset):
        batch = {k: v.to(model_engine.local_device) for k, v in batch.items()}

        loss = model_engine(**batch).loss
        model_engine.backward(loss)
        model_engine.step()

        if step % 10 == 0:
            print(f"Step {step} | Loss: {loss.item():.4f}")

        # DeepSpeed handles gradient accumulation internally!

    # Save checkpoint (DeepSpeed handles sharded saves)
    model_engine.save_checkpoint("./checkpoint")
```

### 8.3 Complete Training Loop with Fault Tolerance

```python
# fault_tolerant_trainer.py -- Production training with full fault tolerance
import torch
import time
import signal
import sys
from dataclasses import dataclass
from pathlib import Path
from huggingface_hub import HfApi
from torch.utils.data import DataLoader

@dataclass
class TrainingConfig:
    model_name: str = "meta-llama/Llama-2-7b"
    output_dir: str = "./output"
    num_epochs: int = 3
    batch_size: int = 1
    gradient_accumulation_steps: int = 4
    learning_rate: float = 2e-4
    warmup_steps: int = 100
    max_steps: int = 10000
    save_every: int = 500
    log_every: int = 10
    use_4bit: bool = True
    use_lora: bool = True
    lora_r: int = 16
    mixed_precision: str = "bf16"
    hub_repo_id: str = None
    hub_token: str = None

class FaultTolerantTrainer:
    """Complete fault-tolerant trainer for free GPU tiers."""

    def __init__(self, config: TrainingConfig):
        self.config = config
        self.step = 0
        self.epoch = 0
        self.interrupted = False
        self.api = HfApi(token=config.hub_token) if config.hub_token else None

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        # Ensure output directory exists
        Path(config.output_dir).mkdir(parents=True, exist_ok=True)

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        print(f"\nReceived signal {signum}. Saving checkpoint...")
        self.interrupted = True

    def save_checkpoint(self, model, optimizer, scheduler=None, is_emergency=False):
        """Save checkpoint locally and to HF Hub."""
        checkpoint = {
            "step": self.step,
            "epoch": self.epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "config": self.config,
            "timestamp": time.time(),
            "emergency": is_emergency
        }
        if scheduler is not None:
            checkpoint["scheduler_state_dict"] = scheduler.state_dict()

        # Local save
        filename = f"checkpoint-step-{self.step}.pt"
        local_path = Path(self.config.output_dir) / filename
        torch.save(checkpoint, local_path)
        print(f"Checkpoint saved: {local_path}")

        # HF Hub save
        if self.api and self.config.hub_repo_id:
            try:
                from huggingface_hub import upload_file
                upload_file(
                    path_or_fileobj=str(local_path),
                    path_in_repo=f"checkpoints/{filename}",
                    repo_id=self.config.hub_repo_id,
                    token=self.config.hub_token,
                    repo_type="model"
                )
                print(f"Checkpoint uploaded to HF Hub")
            except Exception as e:
                print(f"HF Hub upload failed: {e}")

        return str(local_path)

    def load_checkpoint(self, model, optimizer, scheduler=None, path=None):
        """Load checkpoint from local path or latest available."""
        if path is None:
            # Find latest local checkpoint
            checkpoints = sorted(
                Path(self.config.output_dir).glob("checkpoint-step-*.pt"),
                key=lambda p: int(p.stem.split("-")[-1])
            )
            if not checkpoints:
                # Try HF Hub
                if self.api and self.config.hub_repo_id:
                    return self._load_from_hub(model, optimizer, scheduler)
                print("No checkpoint found, starting from scratch")
                return 0
            path = checkpoints[-1]

        print(f"Loading checkpoint from {path}")
        checkpoint = torch.load(path, map_location="cpu")

        model.load_state_dict(checkpoint["model_state_dict"])
        optimizer.load_state_dict(checkpoint["optimizer_state_dict"])

        self.step = checkpoint["step"]
        self.epoch = checkpoint["epoch"]

        if scheduler and "scheduler_state_dict" in checkpoint:
            scheduler.load_state_dict(checkpoint["scheduler_state_dict"])

        print(f"Resumed from step {self.step}, epoch {self.epoch}")
        return self.step

    def _load_from_hub(self, model, optimizer, scheduler):
        """Load latest checkpoint from HF Hub."""
        try:
            from huggingface_hub import list_repo_files, hf_hub_download
            files = list_repo_files(self.config.hub_repo_id, repo_type="model")
            ckpt_files = sorted(
                [f for f in files if f.startswith("checkpoints/")],
                key=lambda f: int(f.split("-")[-1].replace(".pt", ""))
            )
            if not ckpt_files:
                return 0

            latest = ckpt_files[-1]
            downloaded = hf_hub_download(
                self.config.hub_repo_id,
                latest,
                token=self.config.hub_token,
                repo_type="model"
            )
            return self.load_checkpoint(model, optimizer, scheduler, downloaded)
        except Exception as e:
            print(f"HF Hub load failed: {e}")
            return 0

    def train(self, model, train_dataset, eval_dataset=None):
        """Main training loop with fault tolerance."""
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = model.to(device)

        optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=self.config.learning_rate,
            weight_decay=0.01
        )
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=self.config.max_steps
        )

        # Try to resume
        self.load_checkpoint(model, optimizer, scheduler)

        train_loader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            shuffle=True,
            num_workers=2,
            pin_memory=True
        )

        model.train()
        optimizer.zero_grad()

        while self.step < self.config.max_steps and not self.interrupted:
            for batch in train_loader:
                if self.interrupted or self.step >= self.config.max_steps:
                    break

                # Move batch to device
                batch = {k: v.to(device) if isinstance(v, torch.Tensor) else v
                        for k, v in batch.items()}

                # Forward with mixed precision
                with torch.cuda.amp.autocast(
                    enabled=self.config.mixed_precision in ["fp16", "bf16"],
                    dtype=torch.bfloat16 if self.config.mixed_precision == "bf16" else torch.float16
                ):
                    outputs = model(**batch)
                    loss = outputs.loss / self.config.gradient_accumulation_steps

                # Backward
                loss.backward()

                # Gradient accumulation step
                if (self.step + 1) % self.config.gradient_accumulation_steps == 0:
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                    optimizer.step()
                    scheduler.step()
                    optimizer.zero_grad()

                self.step += 1

                # Logging
                if self.step % self.config.log_every == 0:
                    lr = scheduler.get_last_lr()[0]
                    print(f"Step {self.step}/{self.config.max_steps} | "
                          f"Loss: {loss.item() * self.config.gradient_accumulation_steps:.4f} | "
                          f"LR: {lr:.2e}")

                # Checkpoint saving
                if self.step % self.config.save_every == 0:
                    self.save_checkpoint(model, optimizer, scheduler)

            self.epoch += 1

        # Final save
        if not self.interrupted:
            self.save_checkpoint(model, optimizer, scheduler, is_emergency=self.interrupted)

        return model
```

### 8.4 Platform-Specific Launch Scripts

```python
# launcher.py -- Universal launcher for all free tier platforms
import os
import sys
import subprocess
import argparse

PLATFORM_CONFIGS = {
    "colab": {
        "gpu": "T4",
        "vram_gb": 16,
        "max_runtime_hours": 12,
        "recommended": {
            "7b": {"batch": 2, "grad_acc": 4, "4bit": False, "lora": True},
            "13b": {"batch": 1, "grad_acc": 8, "4bit": True, "lora": True},
            "70b": {"batch": 1, "grad_acc": 16, "4bit": True, "lora": True, "cpu_offload": True},
        }
    },
    "kaggle": {
        "gpu": "P100",
        "vram_gb": 16,
        "max_runtime_hours": 12,
        "recommended": {
            "7b": {"batch": 2, "grad_acc": 4, "4bit": False, "lora": True},
            "13b": {"batch": 1, "grad_acc": 8, "4bit": True, "lora": True},
            "70b": {"batch": 1, "grad_acc": 16, "4bit": True, "lora": True, "cpu_offload": True},
        }
    },
    "lambda": {
        "gpu": "A100",
        "vram_gb": 40,
        "max_runtime_hours": 24,
        "recommended": {
            "7b": {"batch": 4, "grad_acc": 2, "4bit": False, "lora": False},
            "13b": {"batch": 2, "grad_acc": 4, "4bit": False, "lora": True},
            "70b": {"batch": 2, "grad_acc": 4, "4bit": True, "lora": True},
        }
    },
    "lightning": {
        "gpu": "T4",
        "vram_gb": 16,
        "max_runtime_hours": 22,
        "recommended": {
            "7b": {"batch": 1, "grad_acc": 8, "4bit": True, "lora": True},
            "13b": {"batch": 1, "grad_acc": 16, "4bit": True, "lora": True},
            "70b": {"batch": 1, "grad_acc": 32, "4bit": True, "lora": True, "cpu_offload": True},
        }
    }
}

def launch(platform, model_size, script_path):
    """Launch training with platform-optimized config."""
    config = PLATFORM_CONFIGS.get(platform)
    if not config:
        print(f"Unknown platform: {platform}")
        sys.exit(1)

    rec = config["recommended"].get(model_size)
    if not rec:
        print(f"Unknown model size: {model_size}")
        sys.exit(1)

    env = os.environ.copy()
    env["PLATFORM"] = platform
    env["BATCH_SIZE"] = str(rec["batch"])
    env["GRADIENT_ACCUMULATION"] = str(rec["grad_acc"])
    env["USE_4BIT"] = str(rec["4bit"])
    env["USE_LORA"] = str(rec["lora"])
    env["CPU_OFFLOAD"] = str(rec.get("cpu_offload", False))
    env["MAX_RUNTIME_SECONDS"] = str(config["max_runtime_hours"] * 3600)

    print(f"Launching on {platform.upper()} ({config['gpu']}, {config['vram_gb']}GB)")
    print(f"Model: {model_size} | Batch: {rec['batch']} | GradAcc: {rec['grad_acc']}")
    print(f"4-bit: {rec['4bit']} | LoRA: {rec['lora']}")

    subprocess.run([sys.executable, script_path], env=env)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", required=True, choices=["colab", "kaggle", "lambda", "lightning"])
    parser.add_argument("--model-size", required=True, choices=["7b", "13b", "70b"])
    parser.add_argument("--script", default="train.py")
    args = parser.parse_args()

    launch(args.platform, args.model_size, args.script)
```

---

## 9. Quick Start Playbooks

### 9.1 Playbook 1: Quick LoRA Fine-tune on Colab (7B Model)

```python
# %%writefile colab_lora_train.py
# Run this in a Colab notebook cell

!pip install -q transformers accelerate peft bitsandbytes datasets

from transformers import (
    AutoModelForCausalLM, AutoTokenizer,
    TrainingArguments, Trainer,
    BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset

# 1. Config
MODEL_NAME = "meta-llama/Llama-2-7b-hf"
DATASET_NAME = "tatsu-lab/alpaca"
OUTPUT_DIR = "./llama-7b-lora"

# 2. 4-bit config for Colab T4 (16GB)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

# 3. Load model
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
model = prepare_model_for_kbit_training(model)

# 4. LoRA config
lora_config = LoraConfig(
    r=16, lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05, bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(model, lora_config)

# 5. Dataset
dataset = load_dataset(DATASET_NAME, split="train[:1000]")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token

def tokenize(example):
    return tokenizer(example["text"], truncation=True, max_length=512, padding="max_length")

tokenized = dataset.map(tokenize, batched=True)

# 6. Train
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=1,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    bf16=True,
    logging_steps=10,
    save_strategy="epoch",
)

trainer = Trainer(model=model, args=training_args, train_dataset=tokenized)
trainer.train()

# 7. Save adapters (only ~10-100MB!)
model.save_pretrained(f"{OUTPUT_DIR}/final")

# 8. Push to HF Hub (free storage)
from huggingface_hub import notebook_login
notebook_login()
model.push_to_hub("your-username/llama-7b-lora-finetuned")
```

### 9.2 Playbook 2: 70B Model on Lambda A100

```python
# %%writefile lambda_70b_train.py
# Run on Lambda A100 (40GB) instance

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset

MODEL_NAME = "meta-llama/Llama-2-70b-hf"
DATASET = "tatsu-lab/alpaca"

# 4-bit quantization
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

# Load 70B model -- fits in 40GB A100 with 4-bit!
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    trust_remote_code=True,
)
model = prepare_model_for_kbit_training(model)

# LoRA -- only train these small adapter matrices
lora_config = LoraConfig(
    r=64, lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                   "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.1, bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
print(f"Trainable parameters: {model.print_trainable_parameters()}")

# Dataset
dataset = load_dataset(DATASET, split="train[:5000]")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token

def format_prompt(example):
    text = f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"
    return tokenizer(text, truncation=True, max_length=1024, padding="max_length")

tokenized = dataset.map(format_prompt, remove_columns=dataset.column_names)

# Training -- A100 can handle batch_size=2 with 70B 4-bit!
training_args = TrainingArguments(
    output_dir="./llama-70b-lora",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    optim="paged_adamw_8bit",
    learning_rate=2e-4,
    bf16=True,
    logging_steps=10,
    save_strategy="steps",
    save_steps=200,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    group_by_length=True,
)

trainer = Trainer(model=model, args=training_args, train_dataset=tokenized)
trainer.train()

# Save final model
model.save_pretrained("./llama-70b-lora-final")
# Merge adapters with base model for inference
# model = model.merge_and_unload()
```

### 9.3 Playbook 3: Multi-Platform Federated Training

```python
# %%writefile federated_node.py
# Run this SAME script on each platform with different data shards

import os
import torch
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# Configuration -- set via environment variables
PLATFORM = os.environ.get("PLATFORM", "colab")
MODEL_NAME = os.environ.get("MODEL", "meta-llama/Llama-2-7b-hf")
DATA_SHARD = os.environ.get("DATA_SHARD", "0")  # Each node uses different shard
HUB_REPO = os.environ.get("HUB_REPO", "defoneos/fl-aggregates")
HUB_TOKEN = os.environ.get("HF_TOKEN")

def get_device_map():
    """Get optimal device map for current platform."""
    if PLATFORM == "kaggle" and torch.cuda.device_count() == 2:
        return "auto"  # Use both T4s
    return "auto"

def train_local():
    """Train locally on this node's data shard."""
    # Load model with platform-optimized quantization
    use_4bit = PLATFORM in ["colab", "kaggle", "lightning"]

    bnb_config = None
    if use_4bit:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map=get_device_map(),
        torch_dtype=torch.bfloat16,
    )
    model = prepare_model_for_kbit_training(model)

    # LoRA
    lora_config = LoraConfig(
        r=16, lora_alpha=32,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05, bias="none",
        task_type="CAUSAL_LM"
    )
    model = get_peft_model(model, lora_config)

    # Load THIS node's data shard
    dataset = load_dataset("your-dataset", split=f"train[{DATA_SHARD}000:{int(DATA_SHARD)+1}000]")

    # Train for a few steps
    trainer = Trainer(
        model=model,
        args=TrainingArguments(
            output_dir=f"./local-{PLATFORM}",
            num_train_epochs=1,
            per_device_train_batch_size=1,
            gradient_accumulation_steps=4,
            learning_rate=2e-4,
            bf16=True,
            max_steps=500,  # Local training steps before aggregation
        ),
        train_dataset=dataset,
    )
    trainer.train()

    # Save local update
    adapter_path = f"./local-{PLATFORM}-adapters"
    model.save_pretrained(adapter_path)

    # Upload to HF Hub for aggregation
    from huggingface_hub import HfApi
    api = HfApi(token=HUB_TOKEN)
    api.upload_folder(
        folder_path=adapter_path,
        path_in_repo=f"round-1/{PLATFORM}-shard-{DATA_SHARD}",
        repo_id=HUB_REPO,
        repo_type="model"
    )
    print(f"Uploaded local update from {PLATFORM} (shard {DATA_SHARD})")

if __name__ == "__main__":
    train_local()
```

### 9.4 Playbook 4: ngrok Tunnel for Multi-Node DDP

```python
# %%writefile ddp_master.py
# Use ngrok to create a tunnel for multi-node PyTorch DDP
# Run this on the MASTER node

import os
import subprocess

# Install and start ngrok
!pip install -q pyngrok
from pyngrok import ngrok

# Start tunnel on port 29500 (PyTorch default)
tunnel = ngrok.connect(29500, "tcp")
print(f"MASTER ADDRESS: {tunnel.public_url}")
print("Share this address with worker nodes")
print("It will look like: tcp://0.tcp.ngrok.io:12345")

# Extract host and port for PyTorch
import re
match = re.match(r"tcp://(.+):(\d+)", tunnel.public_url)
master_host = match.group(1)
master_port = match.group(2)

os.environ["MASTER_ADDR"] = master_host
os.environ["MASTER_PORT"] = master_port
os.environ["WORLD_SIZE"] = "2"  # Total nodes
os.environ["RANK"] = "0"        # This is rank 0 (master)

# Start training
torchrun_cmd = [
    "torchrun",
    "--nnodes=2",
    "--node_rank=0",
    f"--master_addr={master_host}",
    f"--master_port={master_port}",
    "--nproc_per_node=1",
    "train.py"
]
subprocess.run(torchrun_cmd)
```

```python
# %%writefile ddp_worker.py
# Run this on WORKER nodes (other free tier platforms)

import os
import subprocess

# Set these from the master node's output
MASTER_ADDR = "0.tcp.ngrok.io"  # Replace with actual from master
MASTER_PORT = "12345"           # Replace with actual from master

os.environ["MASTER_ADDR"] = MASTER_ADDR
os.environ["MASTER_PORT"] = MASTER_PORT
os.environ["WORLD_SIZE"] = "2"
os.environ["RANK"] = "1"  # This is rank 1 (worker)

# Start training
torchrun_cmd = [
    "torchrun",
    "--nnodes=2",
    "--node_rank=1",
    f"--master_addr={MASTER_ADDR}",
    f"--master_port={MASTER_PORT}",
    "--nproc_per_node=1",
    "train.py"
]
subprocess.run(torchrun_cmd)
```

---

## 10. Reference Tables

### 10.1 Free GPU Specifications

| Platform | GPU | Architecture | Compute | VRAM | Memory BW | FP16 TFLOPS | BF16 | Notes |
|----------|-----|-------------|---------|------|-----------|-------------|------|-------|
| Colab Free | T4 | Turing | 7.5 | 16GB | 320 GB/s | 65 | No | Most reliable |
| Colab Free | V100 | Volta | 7.0 | 16GB | 900 GB/s | 125 | No | Rare allocation |
| Kaggle | P100 | Pascal | 6.0 | 16GB | 732 GB/s | 18.7 | No | 30h/week limit |
| Kaggle | T4x2 | Turing | 7.5 | 2x16GB | 2x320 GB/s | 2x65 | No | Best for data parallel |
| Lightning | T4 | Turing | 7.5 | 16GB | 320 GB/s | 65 | No | 22h/month |
| Lambda | A100 | Ampere | 8.0 | 40GB | 1555 GB/s | 312 | Yes | $30 credit limit |
| RunPod | RTX 4090 | Ada | 8.9 | 24GB | 1008 GB/s | 330 | Yes | Very limited free tier |
| Paperspace | M4000 | Maxwell | 5.2 | 8GB | 192 GB/s | ~3 | No | Limited free hours |

### 10.2 Model Size vs. VRAM Requirements

| Model | Full Fine-tune (FP16) | LoRA (FP16) | QLoRA (4-bit) | DeepSpeed ZeRO-3 |
|-------|----------------------|-------------|---------------|-----------------|
| 125M | 1 GB | 0.5 GB | 0.3 GB | 0.2 GB |
| 1B | 4 GB | 2 GB | 1.2 GB | 0.8 GB |
| 3B | 12 GB | 4 GB | 2.5 GB | 1.5 GB |
| 7B | 28 GB | 8 GB | 5 GB | 3 GB |
| 13B | 52 GB | 12 GB | 8 GB | 5 GB |
| 30B | 120 GB | 24 GB | 16 GB | 10 GB |
| 65B/70B | 260 GB | 48 GB | 32 GB | 20 GB |
| 180B | 720 GB | 120 GB | 80 GB | 50 GB |

### 10.3 Optimization Impact Summary

| Technique | VRAM Reduction | Speed Impact | When to Use |
|-----------|---------------|-------------|-------------|
| Mixed Precision (BF16) | ~40% | +2-3x | Always |
| Gradient Checkpointing | ~50% | -30% | When OOM |
| Gradient Accumulation | None | N/A | Always (batch_size=1) |
| Flash Attention 2 | ~20% | +2-4x | Transformers on Ampere+ |
| 8-bit Optimizer | ~75% optim | None | Large models |
| 4-bit Weights (QLoRA) | ~75% weights | -10% | Models > 13B |
| LoRA Adapters | ~95% trainable | None | Fine-tuning |
| DeepSpeed ZeRO-2 | ~8x total | Slight | Multi-GPU |
| DeepSpeed ZeRO-3 | ~N_GPUs x | Slight | Max memory savings |
| DeepSpeed ZeRO-Offload | Infinite (CPU) | -50% | Any model, any GPU |
| FSDP | ~N_GPUs x | Slight | PyTorch native |
| torch.compile | None | +1.3-1.5x | PyTorch 2.0+ |

### 10.4 Recommended Configurations by Use Case

| Use Case | Platform | Model | Config | Expected Time |
|----------|----------|-------|--------|---------------|
| Quick experiment | Colab T4 | 7B | LoRA + FP16 | 30-60 min |
| Full fine-tune 7B | Lambda A100 | 7B | Full FP16 | 2-4 hours |
| Production LoRA | Lambda A100 | 70B | QLoRA | 4-8 hours |
| Production LoRA | Kaggle T4x2 | 13B | QLoRA | 3-6 hours |
| Research (long) | Lightning | 7B | LoRA + grad check | 10-20 hours |
| Max throughput | Kaggle T4x2 | 7B | DDP across 2 GPUs | 1-2 hours |
| 70B on budget | Colab T4 | 70B | QLoRA + CPU offload | 12+ hours |

---

## Appendix A: Environment Setup Scripts

### A.1 Colab Setup

```python
# Run at start of every Colab notebook
!pip install -q transformers accelerate peft bitsandbytes datasets flash-attn

# Mount Google Drive for local checkpoint storage
from google.colab import drive
drive.mount('/content/drive')
CHECKPOINT_DIR = "/content/drive/MyDrive/checkpoints"

# Login to HF Hub
from huggingface_hub import notebook_login
notebook_login()  # Enter your token
```

### A.2 Kaggle Setup

```python
# Add to Kaggle notebook
!pip install -q transformers accelerate peft bitsandbytes datasets

# Kaggle secrets for HF token
from kaggle_secrets import UserSecretsClient
user_secrets = UserSecretsClient()
HF_TOKEN = user_secrets.get_secret("HF_TOKEN")

# Kaggle has 2x T4 -- use both!
import torch
print(f"GPUs available: {torch.cuda.device_count()}")  # Should print 2
```

### A.3 Lambda Setup

```bash
# Run once on Lambda instance
pip install transformers accelerate peft bitsandbytes datasets flash-attn deepspeed

# Lambda A100 has 200GB RAM -- great for CPU offloading if needed
# No timeout on Lambda (just $30 credit limit)
```

### A.4 Lightning AI Setup

```python
# Lightning AI uses persistent environments
!pip install transformers accelerate peft bitsandbytes datasets

# Store HF token in Lightning secrets
import os
os.environ["HF_TOKEN"] = "your-token-here"
```

---

## Appendix B: Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| `CUDA OOM` | Model too big for VRAM | Enable 4-bit quantization, reduce batch size, enable gradient checkpointing |
| `CUDA OOM during save` | Not enough VRAM for checkpoint | Use `accelerate` for offloading, save on CPU |
| `Training too slow` | CPU bottleneck, no Flash Attention | Install `flash-attn`, use `pin_memory=True`, reduce `num_workers` |
| `Timeout on Colab` | 12-hour idle limit | Save every 100 steps, use the fault-tolerant trainer |
| `Kaggle disconnected` | 12-hour session limit | Same as above -- frequent checkpoints to HF Hub |
| `Lambda credit expired` | $30 credit used up | Monitor usage, prioritize large model training |
| `NCCL timeout` | Slow network between nodes | Use smaller `timeout` in DDP, use checkpoint-based sync instead |
| `Different GPU types` | Mixed precision issues | Always use BF16 if supported, fallback to FP16 |
| `HF Hub upload fails` | Large checkpoint | Use `git-lfs`, chunk uploads, or save only LoRA adapters |

---

## Appendix C: Cost Analysis (Free Tier)

| Platform | Monthly Compute | Equivalent Cloud Cost | Value |
|----------|----------------|----------------------|-------|
| Colab Free | ~360 GPU-hours (T4) | ~$180 (at $0.50/T4-hr) | HIGH |
| Kaggle | ~120 GPU-hours (P100) | ~$120 (at $1.00/P100-hr) | HIGH |
| Lightning AI | ~22 GPU-hours (T4) | ~$11 | MODERATE |
| Lambda | ~30 GPU-hours (A100) | ~$90 (at $3.00/A100-hr) | VERY HIGH |
| **TOTAL** | **~532 GPU-hours** | **~$401/month** | **FREE** |

**By coordinating all free tiers, DEFONEOS gets ~$400/month worth of GPU compute for free.**

---

> **Document Version:** 1.0
> **Last Updated:** 2024
> **Status:** OPERATIONAL
> **Classification:** INTERNAL -- DEFONEOS TRAINING GRID
