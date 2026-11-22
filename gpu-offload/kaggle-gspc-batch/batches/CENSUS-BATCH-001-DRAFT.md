# CENSUS-BATCH-001 — DRAFT for Measure review. Dispatch ONLY after the hf: runner variant merges.

Label if named: **GSPC-CENSUS-001**. Same group discipline as G3 (2xT4, one GPU type for the whole batch).
Models sourced from huggingface.co, pinned by commit sha + GGUF sha256 (moved = SKIPPED, never re-pinned) —
the hf: handler in runner.py (this branch). Rows resolved live from the Hub on 2026-11-04; re-resolve at dispatch time.

tag	ollama_manifest_sha256	weights_GB	fits	est_gpu_hours
hf:unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF@b17cb02dd882d5b6ab62fc777ad2995f19668350:Qwen3-Coder-30B-A3B-Instruct-UD-TQ1_0.gguf	fcb403c1d7a98bc0ffbe98ec7fbfafe1cdd0050af808ba4af8cd6dcaa807f8d9	7.46	P100 or 2xT4	0.6
hf:ornith-ai/Ornith-1.0-9B-GGUF@3296bc7a404871a72ac3f1903f561459c09b5c17:ornith-1.0-9b-Q4_K_M.gguf	5720d1f671b4996481274fffe01868c3c36e87c135cc8538471cc7bd6087b106	5.24	P100 or 2xT4	0.6
