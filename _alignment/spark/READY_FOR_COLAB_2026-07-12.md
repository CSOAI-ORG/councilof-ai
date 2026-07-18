# 🜏 Ready for Colab — 12 Jul 2026
## All systems live. Awaiting sov33_adapters.zip from Colab T4.

## STATE (all systems live, all heavy work on cloud)

| Component | Status | Where |
|---|---|---|
| Sovereign brain (Q4 GGUF) | ✓ LIVE | ~/.sovereign/models/qwen3-sov-compliance-0.6b-q4.gguf |
| Sovereign brain (adapter) | ✓ LIVE | ~/.sovereign/models/qwen3-sov-compliance-0.6b/ |
| Sovereign brain (merged) | ✓ LIVE | ~/.sovereign/models/qwen3-sov-compliance-0.6b-merged/ |
| 5 OWEMs (compliance/defense/intuition/voice/general) | ✓ LIVE | sov33_owem_e2e.py |
| BFT-33 council (5 OWEMs as voters) | ✓ LIVE | sov33_bft33_owem_council.py |
| Cloud orchestrator (5 backends) | ✓ LIVE | sov33_cloud_orchestrator.py |
| Cloud parallel (33 BFT voters in 7s) | ✓ LIVE | sov33_cloud_parallel.py |
| Live tool awareness (847 tools) | ✓ LIVE | sov33_live_tool_awareness.py |
| OWEM emergence (L0/L1/L2/L3/L4 detector) | ✓ LIVE | sov33_owem_emergence.py |
| Care-floor + cache + SIGIL | ✓ LIVE | all paths |
| **Install bridge** | **✓ READY** | **sov33_install_adapters.py** |
| **Zip watcher (background)** | **✓ RUNNING** | **zip_watcher.sh (pid 24915)** |

## INSTALL COMMAND (run NOW, will fail with "zip not found")

```bash
python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_install_adapters.py \
    --zip ~/Downloads/sov33_adapters.zip \
    --no-merge --no-quantize
```

Result right now: **ERROR: zip not found** (because Colab hasn't finished)

When Colab finishes:
1. Nick downloads `sov33_adapters.zip` to `~/Downloads/`
2. Watcher (pid 24915) detects it within 30s
3. Watcher runs install command automatically
4. Watcher logs result to `~/.sovereign/logs/zip_watcher.log`

## WHAT THE WATCHER DOES (auto-install path)

```bash
unset PYTHONPATH
~/.sovereign/ml-venv/bin/python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_install_adapters.py \
    --zip "$ZIP_PATH" --no-merge --no-quantize
```

The watcher:
- Polls every 30s
- Detects zip via `os.path.exists`
- Waits 5s for download to complete
- Runs install
- Logs exit code
- Exits after success

## WHAT HAPPENS (when zip appears)

1. **Unzip** 4 adapters to `~/.sovereign/models/charter-N-<expert>/`
2. **Re-run substrate explorer** → 4 experts (was 1)
3. **Re-run OWEM emergence** → L0 → L1 (4 experts meets L1 spec)
4. **SIGIL** the install event
5. **OWEM routing** auto-updates (charter-1 → compliance OWEM, etc.)

## EXPECTED TRANSITION

| | Before | After |
|---|---|---|
| Experts on disk | 1 (compliance) | 5 (compliance + 4 new) |
| OWEM level | L0 | L1 |
| Sovereign experts per OWEM | 1 of 5 (compliance only) | 5 of 5 |
| BFT-33 council voters | 15 (5 OWEM × 3 lineages) | 15 (5 OWEM × 3 lineages, but each with own-weights) |
| Total time | Mac CPU 100% (sov_brain in series) | Mac CPU 0% (each OWEM has its own sovereign brain) |

## MAC STATE (calm, ready to receive)

```
Disk:        9.1GB free
Memory:      Ollama 3GB (qwen2.5:3b loaded)
Heavy procs: 0 (everything routed to cloud)
Watcher:     pid 24915 (polling every 30s)
Sigils:      18,243
Cache:       50 entries
OWEM caps:   66+
```

## WATCHER LOG

```bash
cat ~/.sovereign/logs/zip_watcher.log
```

Last entry:
```
[Sun Jul 12 07:14:34 BST 2026] zip_watcher started, polling /Users/nicholas/Downloads/sov33_adapters.zip
```

(Watching. Will add more entries when the zip appears or install runs.)

## IF YOU WANT TO MANUALLY RUN THE COMMAND (you can, anytime)

```bash
# This is the exact command the watcher runs
python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_install_adapters.py \
    --zip ~/Downloads/sov33_adapters.zip \
    --no-merge --no-quantize
```

Will work immediately when the zip is in `~/Downloads/`.

## IF YOU WANT TO CANCEL THE WATCHER

```bash
kill 24915
# (or)
pkill -f zip_watcher
```

## IF COLAB FAILS (zip never appears)

Check:
```bash
tail -100 /Users/nicholas/.claude-science/logs/server-20260712.log
# Look for Colab T4 activity
```

If Colab crashed, you can re-run the Colab script manually:
1. Open https://colab.research.google.com/
2. Runtime → Change runtime type → T4 GPU
3. Paste `SOV33_FOUR_EXPERT_STREAMS_COLAB.py` (from `_alignment/sovereign_merge_kit/`)
4. Wait 2-4 hours for training
5. Download `sov33_adapters.zip` (auto-zipped at end)
6. Watcher detects it → auto-install
