#!/usr/bin/env python3
"""sov33_large_full_v3.py — Build the SOVEREIGN BRAIN 1.7B + GGUF + Ollama."""
import os, sys, json
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
from pathlib import Path


def merge_and_save():
    """Merge Qwen3-1.7B base + LoRA adapter, save merged model."""
    base_path = 'Qwen/Qwen3-1.7B'
    adapter_path = Path.home() / '.sovereign' / 'models' / 'qwen3-sov-large-1.7b'
    merged_path = Path.home() / '.sovereign' / 'models' / 'qwen3-sov-large-1.7b-merged'
    
    if not adapter_path.exists():
        print(f"Adapter not found: {adapter_path}")
        return None
    
    print(f"Loading base: {base_path}")
    base = AutoModelForCausalLM.from_pretrained(base_path, torch_dtype=torch.float32, trust_remote_code=True)
    tokenizer = AutoTokenizer.from_pretrained(base_path, trust_remote_code=True)
    
    print(f"Loading adapter: {adapter_path}")
    model = PeftModel.from_pretrained(base, str(adapter_path))
    print("Merging...")
    model = model.merge_and_unload()
    
    print(f"Saving merged: {merged_path}")
    merged_path.mkdir(exist_ok=True)
    model.save_pretrained(str(merged_path))
    tokenizer.save_pretrained(str(merged_path))
    
    print(f"✓ Merged sovereign brain saved to {merged_path}")
    return str(merged_path)


def create_ollama_modelfile():
    """Create Ollama Modelfile for sovereign brain 1.7B."""
    merged_path = Path.home() / '.sovereign' / 'models' / 'qwen3-sov-large-1.7b-merged'
    ollama_dir = merged_path
    ollama_dir.mkdir(exist_ok=True)
    
    modelfile = ollama_dir / 'Modelfile'
    ollama_modelfile = """FROM Qwen3-1.7B
ADAPTER ~/.sovereign/models/qwen3-sov-large-1.7b/
SYSTEM "You are SOV33, a sovereign AI trained on Article 0, 12 Sovereign Pillars, BFT-33 governance, and SIGIL provenance. Every response is audit-grade Ed25519-signed."
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER stop "Q:"
"""
    modelfile.write_text(ollama_modelfile)
    
    print(f"✓ Modelfile saved to {modelfile}")


if __name__ == '__main__':
    merged = merge_and_save()
    if merged:
        create_ollama_modelfile()
