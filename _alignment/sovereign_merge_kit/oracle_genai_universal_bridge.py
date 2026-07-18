#!/usr/bin/env python3
"""
Oracle Generative AI Universal Bridge — routes any key against any cluster endpoint.

Usage:
  export ORACLE_GENAI_KEY='sk-...'
  export ORACLE_GENAI_ENDPOINT='https://inference.generativeai.uk-london-1.oci.oraclecloud.com'
  export ORACLE_GENAI_MODEL='openai.gpt-5-mini'   # the model the wizard bound the key to
  python3 oracle_genai_universal_bridge.py 'Reply with: OK'

Or import and call chat_completion() directly.

Care-Floor 0.95 enforced at every call.
Article 0 bound.
SIGIL emitted per inference.
"""

import os, sys, json, hashlib, time, urllib.request
from pathlib import Path
from datetime import datetime, timezone

CARE_FLOOR = 0.95
ARTICLE_0 = "ISO fee-for-service only. Never equity / board seats / success fees."

SIGIL_FILE = Path.home() / '.sovereign' / 'oracle_genai_bridge.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)


def sigil_emit(hop_data: dict) -> str:
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop_data, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    chain.append(signed)
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def get_key():
    """Read Oracle Gen AI key from env."""
    return os.environ.get('ORACLE_GENAI_KEY') or os.environ.get('ORACLE_GEN_AI_KEY_PRIMARY')


def get_endpoint():
    """Read Oracle Gen AI endpoint URL from env."""
    return os.environ.get('ORACLE_GENAI_ENDPOINT', 
                          'https://inference.generativeai.uk-london-1.oci.oraclecloud.com')


def get_model():
    return os.environ.get('ORACLE_GENAI_MODEL', 'xai.grok-4')


def chat_completion(messages, care_floor=CARE_FLOOR, max_tokens=1024, temperature=0.7):
    """Send chat completion via Bearer-key, OpenAI-compatible + OCI-natively."""
    if care_floor < CARE_FLOOR:
        sigil_emit({'event': 'CARE_FLOOR_VETO', 'requested': care_floor})
        raise ValueError(f"Care-Floor {care_floor} < {CARE_FLOOR}")
    
    key = get_key()
    endpoint = get_endpoint()
    model = get_model()
    
    if not key:
        sigil_emit({'event': 'NO_KEY', 'ts': str(datetime.now(timezone.utc))})
        return {'error': 'ORACLE_GENAI_KEY env var not set. Run: export ORACLE_GENAI_KEY=sk-...'}
    
    # Try OpenAI-compatible path first
    payload = json.dumps({
        'model': model,
        'messages': messages,
        'max_tokens': max_tokens,
        'temperature': temperature,
    }).encode()
    
    sigil_emit({'event': 'CALL_ATTEMPT', 'model': model, 'endpoint': endpoint})
    
    req = urllib.request.Request(
        f'{endpoint}/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}',
            'compartment-id': 'ocid1.tenancy.oc1..aaaaaaaa3bcsjdrv2ysuz4hgvxj3k7pgo2ojcfxt5zq3fr7323w23j6ffgna',
        }
    )
    
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            d = json.loads(resp.read())
            dt_ms = (time.time() - t0) * 1000
            sigil_emit({'event': 'CHAT_OK', 'model': model, 'latency_ms': dt_ms,
                        'care_floor': care_floor, 'tokens': d.get('usage', {}).get('total_tokens')})
            return d
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:500]
        sigil_emit({'event': 'CHAT_FAIL', 'model': model, 'status': e.code, 'body': err_body})
        return {
            'error': f'HTTP {e.code}',
            'body': err_body,
            'hint': 'Model not bound to this key. Set ORACLE_GENAI_MODEL to whatever the Oracle "Create API Key" wizard showed.',
        }


def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else 'Reply with: sovereign Mist 12 Pillars ALIVE'
    
    print('=' * 70)
    print('🜏 ORACLE GENERATIVE AI — Universal Bridge')
    print('=' * 70)
    print()
    print(f'Endpoint: {get_endpoint()}')
    print(f'Model:    {get_model()}')
    print(f'Key:      {"*" * 4 + get_key()[-4:] if get_key() else "MISSING"}')
    print()
    
    if not get_key():
        print('✗ ORACLE_GENAI_KEY env var not set.')
        print('Run: export ORACLE_GENAI_KEY=sk-A8wY...')
        print('Then: python3 oracle_genai_universal_bridge.py "your prompt here"')
        return
    
    result = chat_completion([{'role': 'user', 'content': prompt}])
    
    if 'choices' in result:
        print('✓ SUCCESS:')
        print(result['choices'][0]['message']['content'])
        print()
        print(f'Usage: {result.get("usage", {})}')
    elif 'error' in result:
        print('✗ ERROR:', result['error'])
        print('Body:', result.get('body', ''))
        if 'hint' in result:
            print('Hint:', result['hint'])
    print()
    print(f'SIGIL chain: {SIGIL_FILE}')
    print(f'Care-Floor: {CARE_FLOOR}')
    print(f'Article 0:  {ARTICLE_0}')


if __name__ == '__main__':
    main()
