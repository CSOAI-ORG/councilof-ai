# 🜏 Colab Zip Install Guide — 12 Jul 2026
## When ~/Downloads/sov33_adapters.zip appears

## AUTOMATIC (recommended)

A background watcher is running. When the zip appears, it auto-installs:

```bash
~/.sovereign/logs/zip_watcher.log
```

Check it for the result.

## MANUAL (if you want to run it yourself)

```bash
# Mac-light: skip CPU-heavy merge/quantize
python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_install_adapters.py \
    --zip ~/Downloads/sov33_adapters.zip \
    --no-merge --no-quantize

# Full: also merge into base + quantize to Q4 GGUF (CPU-heavy, ~20 min total)
python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_install_adapters.py \
    --zip ~/Downloads/sov33_adapters.zip
```

## WHAT HAPPENS (5 steps, <30s for Mac-light)

1. **Unzip** to `~/.sovereign/models/charter-N-<expert>/`
2. **Verify** each adapter has `adapter_config.json` + `adapter_model.safetensors`
3. **Re-run substrate explorer** → shows 4 experts (was 1)
4. **Re-run OWEM emergence** → transitions L0 → L1 (4 experts meets L1 spec)
5. **SIGIL** the install event

## EXPECTED OWEM ROUTING (after install)

```
compliance  → charter-1-compliance (sovereign brain) → oracle fallback
defense     → charter-2-defense (sovereign brain) → oracle fallback  
intuition   → charter-3-intuition (sovereign brain) → oracle fallback
voice       → charter-4-voice (sovereign brain) → oracle fallback
general     → oracle_genai (no sovereign expert)
```

**Before install:** 1 sovereign expert (compliance) + 4 cloud backends
**After install:** 4 sovereign experts + 4 cloud backends

## VERIFICATION COMMANDS

```bash
# Check experts
ls ~/.sovereign/models/  # should show charter-1-compliance, charter-2-defense, etc.

# Check OWEM level
python -c "
import sys
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
import sov33
r = sov33.capability_owem_emergence('snapshot')
print(f'Level: {r[\"level\"]}')
print(f'Experts: {r[\"state\"][\"n_experts\"]}')
"

# Re-run BFT-33 council
python /Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov33_bft33_owem_council.py \
    --question "Is the sovereign care floor at 0.95?" --voters 15 --workers 10
```

## IF ZIP DOESN'T ARRIVE

Check Colab status by looking at Claude-science's logs:
```bash
tail -50 /Users/nicholas/.claude-science/logs/server-20260712.log
```

If Colab crashed, the watcher's `install exit code: != 0` line will tell us.
