#!/usr/bin/env python3
"""
sov33_install_adapters.py — Install Colab-trained adapters on local SOV33.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

AFTER Colab finishes training 4 sovereign experts, the user downloads
sov33_adapters.zip and runs this script. It:
  1. Unzips the adapters to ~/.sovereign/models/charter-N-<expert>/
  2. Verifies each adapter is a valid LoRA
  3. Optionally merges adapter into base (creates a 2.4GB sovereign model)
  4. Optionally quantizes to Q4 GGUF (891MB, fast inference)
  5. Re-runs the substrate explorer to confirm growth
  6. SIGIL-anchors the install event

Mac-light: only quantize step uses CPU but only for ~5 min.
All other steps are <30s.
"""
import sys, os, json, shutil, hashlib, zipfile, argparse
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SIGIL_FILE = Path(_SOVDIR) / 'adapter_install.sigil.jsonl'
MODELS_DIR = Path(_SOVDIR) / 'models'


def sigil_emit(hop):
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def install_adapters(zip_path: Path, merge: bool = True, quantize: bool = True) -> dict:
    """Install adapters from a Colab zip."""
    print()
    print('=' * 70)
    print('SOV33 ADAPTER INSTALL — from Colab zip to local sovereign models')
    print('=' * 70)
    print()

    if not zip_path.exists():
        print(f'  ERROR: zip not found: {zip_path}')
        return {'error': 'zip_not_found'}

    print(f'  Reading: {zip_path}')
    print(f'  Size: {zip_path.stat().st_size / 1e6:.1f}MB')
    print()

    # 1. Unzip to temp dir
    temp_dir = Path(_SOVDIR) / 'incoming_adapters'
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, 'r') as zf:
        names = zf.namelist()
        print(f'  Contents: {len(names)} files')
        zf.extractall(temp_dir)

    # 2. Find the expert directories
    expert_dirs = []
    for p in temp_dir.rglob('adapter_config.json'):
        expert_dirs.append(p.parent)

    print(f'  Found {len(expert_dirs)} adapter(s):')
    results = []
    for ad in expert_dirs:
        expert_name = ad.parent.name if ad.parent.name != 'incoming_adapters' else ad.name
        # Check if it's a valid LoRA
        has_config = (ad / 'adapter_config.json').exists()
        has_weights = (ad / 'adapter_model.safetensors').exists() or (ad / 'adapter_model.bin').exists()
        print(f'    {expert_name:30} config={has_config} weights={has_weights}')
        if has_config and has_weights:
            results.append({'name': expert_name, 'src': str(ad), 'ok': True})
        else:
            results.append({'name': expert_name, 'src': str(ad), 'ok': False})

    # 3. Move to ~/.sovereign/models/
    print()
    print('  Installing to ~/.sovereign/models/...')
    for r in results:
        if not r['ok']:
            print(f'    SKIP {r["name"]} (invalid)')
            continue
        dst = MODELS_DIR / r['name']
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(r['src'], dst)
        size = sum(f.stat().st_size for f in dst.rglob('*') if f.is_file())
        r['dst'] = str(dst)
        r['size_mb'] = round(size / 1e6, 1)
        print(f'    ✓ {r["name"]} → {dst} ({r["size_mb"]}MB)')

    # 4. Optionally merge each into base (creates 2.4GB sovereign model)
    if merge:
        print()
        print('  Merging adapters into base (Qwen3-4B)...')
        print('  (Mac CPU, ~5 min per expert. Skip if you only want GGUF.)')
        try:
            from sov33_sov_brain_adapter import _get_llama  # warm up path
        except Exception:
            pass

        for r in results:
            if not r['ok'] or 'dst' not in r:
                continue
            # Don't merge if merged already exists
            merged_dir = MODELS_DIR / (r['name'] + '-merged')
            if merged_dir.exists() and any(merged_dir.glob('*.safetensors')):
                print(f'    SKIP merge {r["name"]} (already merged)')
                continue
            print(f'    Merging {r["name"]}...', end=' ', flush=True)
            try:
                import torch
                from transformers import AutoModelForCausalLM, AutoTokenizer
                from peft import PeftModel

                base = AutoModelForCausalLM.from_pretrained(
                    'Qwen/Qwen3-4B',
                    torch_dtype=torch.float32,
                    device_map='cpu',
                    low_cpu_mem_usage=True,
                )
                tok = AutoTokenizer.from_pretrained('Qwen/Qwen3-4B')
                model = PeftModel.from_pretrained(base, r['dst'])
                merged = model.merge_and_unload()
                merged.save_pretrained(str(merged_dir), safe_serialization=True)
                tok.save_pretrained(str(merged_dir))
                r['merged'] = str(merged_dir)
                print('OK')
            except Exception as e:
                print(f'FAIL: {e}')

    # 5. Optionally quantize each merged to Q4 GGUF
    if quantize:
        print()
        print('  Quantizing to Q4 GGUF (891MB each)...')
        for r in results:
            if not r['ok'] or 'merged' not in r:
                continue
            q4_path = MODELS_DIR / (r['name'].replace('-merged', '') + '-q4.gguf')
            if q4_path.exists():
                print(f'    SKIP {q4_path.name} (already exists)')
                continue
            print(f'    Quantizing {r["name"]} → {q4_path.name}...', end=' ', flush=True)
            try:
                from llama_cpp import llama_model_quantize, llama_model_quantize_params
                from llama_cpp import LLAMA_FTYPE_MOSTLY_Q4_K_M
                import ctypes

                src_gguf = MODELS_DIR / (r['name'].replace('-merged', '') + '-f16.gguf')
                if not src_gguf.exists():
                    # Need to convert HF to GGUF first
                    from llama_cpp import llama_model_quantize_params
                    print(f'\n      (no F16 GGUF found, skipping — would need convert_hf_to_gguf.py)')
                    continue

                params = llama_model_quantize_params()
                params.nthread = 8
                params.ftype = LLAMA_FTYPE_MOSTLY_Q4_K_M
                result = llama_model_quantize(
                    str(src_gguf).encode(),
                    str(q4_path).encode(),
                    params,
                )
                if result == 0:
                    r['q4_gguf'] = str(q4_path)
                    print('OK')
                else:
                    print(f'FAIL: {result}')
            except Exception as e:
                print(f'FAIL: {e}')

    # 6. Re-run substrate explorer
    print()
    print('  Re-running substrate explorer...')
    try:
        from sov33_substrate_explorer import explore_substrate
        snap = explore_substrate()
        print(f'    n_experts: {snap["n_experts"]}')
        print(f'    total_sigils: {snap["total_sigils"]}')
    except Exception as e:
        print(f'    (explorer error: {e})')

    # 7. Re-run OWEM emergence
    print()
    print('  Re-running OWEM emergence...')
    try:
        from sov33_owem_emergence import print_emergence_report
        print_emergence_report()
    except Exception as e:
        print(f'    (emergence error: {e})')

    # SIGIL
    sigil_emit({
        'hop': 'ADAPTER_INSTALL',
        'zip_path': str(zip_path),
        'n_adapters': len(results),
        'n_ok': sum(1 for r in results if r['ok']),
        'merged': sum(1 for r in results if 'merged' in r),
        'quantized': sum(1 for r in results if 'q4_gguf' in r),
        'care_floor': 0.95,
    })

    return {
        'zip_path': str(zip_path),
        'n_adapters': len(results),
        'adapters': results,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--zip', required=True, help='Path to sov33_adapters.zip from Colab')
    parser.add_argument('--no-merge', action='store_true', help='Skip merge step')
    parser.add_argument('--no-quantize', action='store_true', help='Skip GGUF Q4 quantize')
    args = parser.parse_args()

    install_adapters(
        Path(args.zip),
        merge=not args.no_merge,
        quantize=not args.no_quantize,
    )


if __name__ == '__main__':
    main()
