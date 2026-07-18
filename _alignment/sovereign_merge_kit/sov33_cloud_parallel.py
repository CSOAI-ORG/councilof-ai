#!/usr/bin/env python3
"""
sov33_cloud_parallel.py — Parallel sovereign ops across cloud backends.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

THE SCALING ANSWER:
  Mac orchestrates. Cloud does the work. PARALLEL.
  Spawn N concurrent Oracle GenAI calls = N × throughput.
  No Mac CPU used (Mac just sends/receives HTTP).

EXAMPLE:
  100 sovereign questions × 70B model = sequential ~10 minutes
  100 sovereign questions × 70B model = PARALLEL 10 concurrent ~ 1 minute

THIS IS THE SUBSTRATE'S FLEET-WORKER PATTERN:
  - Worker = single cloud inference call
  - Job = batch of workers
  - Dispatcher = routes jobs to available backends
  - Result = aggregated sovereign ops
"""
import sys, os, json, time, asyncio, hashlib
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SIGIL_FILE = Path(_SOVDIR) / 'cloud_parallel.sigil.jsonl'
CARE_FLOOR = 0.95


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


def oracle_genai_call(prompt: str, model: str = 'meta.llama-3.3-70b-instruct', max_tokens: int = 200) -> dict:
    """Single Oracle GenAI call (signed OCI). Blocks during call, but Mac CPU idle."""
    import oci
    cfg = oci.config.from_file('/Users/nicholas/.oci/config', 'DEFAULT')
    cl = oci.generative_ai_inference.GenerativeAiInferenceClient(
        cfg, service_endpoint='https://inference.generativeai.uk-london-1.oci.oraclecloud.com'
    )
    chat_request = oci.generative_ai_inference.models.GenericChatRequest(
        api_format='GENERIC',
        messages=[
            oci.generative_ai_inference.models.SystemMessage(
                content=[oci.generative_ai_inference.models.TextContent(text='You are SOV33.')]
            ),
            oci.generative_ai_inference.models.UserMessage(
                content=[oci.generative_ai_inference.models.TextContent(text=prompt)]
            ),
        ],
        max_tokens=max_tokens, temperature=0.0
    )
    chat_details = oci.generative_ai_inference.models.ChatDetails(
        compartment_id=cfg['tenancy'],
        serving_mode=oci.generative_ai_inference.models.OnDemandServingMode(
            model_id=model
        ),
        chat_request=chat_request
    )
    t0 = time.time()
    resp = cl.chat(chat_details)
    elapsed = (time.time() - t0) * 1000
    text = resp.data.chat_response.choices[0].message.content[0].text
    return {
        'text': text.strip(),
        'elapsed_ms': round(elapsed, 1),
        'model': model,
        'tokens': len(text.split()),
    }


def parallel_sovereign_ask(prompts: list, max_workers: int = 10, max_tokens: int = 200) -> dict:
    """Run N sovereign asks in parallel via cloud. Mac CPU: 0% during runtime."""
    print()
    print('=' * 70)
    print(f'SOV33 PARALLEL CLOUD — {len(prompts)} sovereign ops, {max_workers} workers')
    print('=' * 70)
    print()
    print('  Mac CPU: 0% (HTTP only). Cloud: meta.llama-3.3-70b-instruct via Oracle GenAI.')
    print()

    t0 = time.time()
    results = [None] * len(prompts)

    def worker(idx_prompt):
        idx, prompt = idx_prompt
        try:
            return idx, oracle_genai_call(prompt, max_tokens=max_tokens)
        except Exception as e:
            return idx, {'error': str(e)[:200], 'elapsed_ms': 0, 'text': ''}

    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = [ex.submit(worker, (i, p)) for i, p in enumerate(prompts)]
        completed = 0
        for fut in as_completed(futures):
            idx, r = fut.result()
            results[idx] = r
            completed += 1
            mark = '✓' if 'error' not in r else '✗'
            print(f'  {mark} [{completed}/{len(prompts)}] ({r.get("elapsed_ms", 0):.0f}ms) {prompts[idx][:60]}')

    total_ms = (time.time() - t0) * 1000
    successes = sum(1 for r in results if 'error' not in r)
    avg_ms = sum(r.get('elapsed_ms', 0) for r in results) / max(1, len(results))

    sigil_emit({
        'hop': 'PARALLEL_CLOUD_RUN',
        'n_prompts': len(prompts),
        'n_successes': successes,
        'max_workers': max_workers,
        'total_ms': round(total_ms, 1),
        'avg_ms_per_call': round(avg_ms, 1),
        'throughput_per_sec': round(1000 * len(prompts) / max(1, total_ms), 3),
        'care_floor': CARE_FLOOR,
    })

    print()
    print(f'  Total: {total_ms:.0f}ms ({total_ms/1000:.1f}s)')
    print(f'  Successes: {successes}/{len(prompts)}')
    print(f'  Avg per call: {avg_ms:.0f}ms')
    print(f'  Throughput: {len(prompts) * 1000 / max(1, total_ms):.1f} prompts/sec')
    print(f'  SIGIL: {SIGIL_FILE}')

    return {
        'n_prompts': len(prompts),
        'n_successes': successes,
        'results': results,
        'total_ms': round(total_ms, 1),
        'throughput_per_sec': round(len(prompts) * 1000 / max(1, total_ms), 3),
    }


# ═══════════════════════════════════════════════════════════════
# THE ACTUAL SCALING DEMO: 20-prover BFT-33 council in PARALLEL
# ═══════════════════════════════════════════════════════════════

def parallel_bft33_demo():
    """BFT-33 council vote where each voter is a parallel cloud call.

    This is the BFT-33 ACTUAL scaling: 33 parallel cloud inferences
    instead of 33 sequential ones.
    """
    print()
    print('=' * 70)
    print('SOV33 BFT-33 PARALLEL — 33 sovereign voters in cloud-parallel')
    print('=' * 70)
    print()
    print('  33 voters × 70B model in PARALLEL = ~3-5 seconds total')
    print('  (vs 33 sequential calls = ~30-60 seconds)')
    print()

    # 33 voter prompts (mocked but representative)
    question = 'What is the sovereign care floor?'
    voter_prompts = [
        f'[BFT voter {i+1}/33, lineage={["qwen","llama","deepseek","mistral"][i%4]}] '
        f'Vote ALLOW or REJECT with 1-sentence reason: {question}'
        for i in range(33)
    ]

    t0 = time.time()
    result = parallel_sovereign_ask(voter_prompts, max_workers=33, max_tokens=80)
    total = (time.time() - t0) * 1000

    # Tally votes
    allow = 0
    reject = 0
    for r in result['results']:
        if 'error' in r:
            continue
        text = r.get('text', '').lower()
        if 'allow' in text and 'reject' not in text[:30]:
            allow += 1
        elif 'reject' in text:
            reject += 1

    print()
    print(f'  Council tally: {allow} ALLOW, {reject} REJECT')
    print(f'  (Honest: this is a stub vote to show parallel scaling works.)')
    print(f'  BFT-33 quorum: 23/33 needed. Got: {allow + reject} votes in {total/1000:.1f}s')
    return result


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--demo', choices=['fleet', 'parallel', 'bft33'], default='parallel')
    parser.add_argument('--workers', type=int, default=10)
    parser.add_argument('--prompts', type=int, default=20)
    args = parser.parse_args()

    if args.demo == 'parallel':
        prompts = [
            f'Sovereign question {i+1}: What does Article 0 require?' for i in range(args.prompts)
        ]
        parallel_sovereign_ask(prompts, max_workers=args.workers)
    elif args.demo == 'bft33':
        parallel_bft33_demo()
    else:
        from sov33_cloud_fleet import discover_fleet, print_fleet
        f = discover_fleet()
        print_fleet(f)
