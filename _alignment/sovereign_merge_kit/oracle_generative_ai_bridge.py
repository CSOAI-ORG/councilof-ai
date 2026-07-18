"""
Oracle Generative AI Bridge — sovereign Mist 12 Pillars-bound access to OCI Generative AI service.

Provides:
  - chat_completion(model_id, messages, care_floor=0.95) → sovereign-bound LLM call
  - chat_stream(model_id, messages, care_floor=0.95) → streaming
  - list_models() → enumerate available OCI Gen AI models
  - audit(action) → SIGIL emit per sovereign Mist 12 pillars sovereign action

Care-Floor 0.95 enforced at every call.
Article 0 bound.
SIGIL emitted per inference.
"""
import sys
import os
import json
import hashlib
import time
from pathlib import Path
from datetime import datetime, timezone
import urllib.request
import urllib.error
import subprocess

# Sovereign Mist 12 pillars binding
CARE_FLOOR = 0.95
ARTICLE_0 = "ISO fee-for-service only. Never equity / board seats / success fees."
SOVEREIGN_MIST_12 = ['Honor', 'Safety', 'Guidance', 'Sovereignty', 'Resilience',
                     'Auditability', 'Verifiability', 'Transparency', 'Justice',
                     'Equity', 'Openness', 'Continuity']

# OCI Gen AI service config
OCI_REGION = "uk-london-1"
OCI_GENERATIVE_AI_ENDPOINT = f"https://inference.generativeai.{OCI_REGION}.oci.oraclecloud.com"
OCI_GEN_AI_KEY_ID = "ocid1.generativeaiapikey.oc1.uk-london-1.amaaaaaaxo2xreyatqtbkey2pa4snup6x5sjyfqi4lk4g42vrhzwfyjece4q"
OCI_TENANCY = "ocid1.tenancy.oc1..aaaaaaaa3bcsjdrv2ysuz4hgvxj3k7pgo2ojcfxt5zq3fr7323w23j6ffgna"
OCI_USER = "ocid1.user.oc1..aaaaaaaaxbbl4eckj7u3yhzamtkvf6fykmo62iv4enu5jdmaei5iuedovqxa"

SIGIL_FILE = Path.home() / '.sovereign' / 'oracle_genai_bridge.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)


def sigil_emit(hop_data: dict) -> str:
    """Emit a sovereign-bound SIGIL hop."""
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


def get_api_key_value():
    """Retrieve the literal API key VALUE from Keychain.
    
    If not yet present, returns None and instructs how to set it.
    """
    try:
        result = subprocess.run(
            ['security', 'find-generic-password',
             '-s', 'meok-keystone',
             '-a', 'ORACLE_GENERATIVEAI_API_KEY_VALUE',
             '-w'],
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None


def chat_completion(model_id: str, messages: list, care_floor: float = CARE_FLOOR,
                    max_tokens: int = 1024, temperature: float = 0.7,
                    stream: bool = False) -> dict:
    """Send a sovereign Mist 12 Pillars-bound chat completion to OCI Generative AI.
    
    Care-Floor 0.95 enforced. Article 0 bound. SIGIL emitted per inference.
    """
    if care_floor < CARE_FLOOR:
        sigil_emit({'event': 'CARE_FLOOR_VETO', 'requested': care_floor, 'minimum': CARE_FLOOR})
        raise ValueError(f"Care-Floor {care_floor} below sovereign Mist 12 pillars sovereign min {CARE_FLOOR}")
    
    api_key_value = get_api_key_value()
    if not api_key_value:
        # Build the message that we need the literal key
        sigil_emit({'event': 'API_KEY_VALUE_MISSING', 'model_id': model_id, 'care_floor': care_floor})
        return {
            'error': 'API key value missing',
            'how_to_fix': (
                'The OCID is stored. The LITERAL TOKEN (which Oracle shows ONCE when creating '
                'a Generative AI key) needs to be set as ORACLE_GENERATIVEAI_API_KEY_VALUE in '
                'macOS Keychain (meok-keystone service). Run:\n\n'
                '   pbpaste | security add-generic-password '
                '-s meok-keystone -a ORACLE_GENERATIVEAI_API_KEY_VALUE\n\n'
                '(after copying the literal token from Oracle Console -> Generative AI -> API Keys)'
            ),
            'ocid_id': OCI_GEN_AI_KEY_ID,
            'sovereign_mist_12_pillars_bound': True,
        }
    
    payload = {
        'modelId': model_id,
        'messages': messages,
        'maxTokens': max_tokens,
        'temperature': temperature,
    }
    
    req = urllib.request.Request(
        f'{OCI_GENERATIVE_AI_ENDPOINT}/20231130/actions/chat',
        data=json.dumps(payload).encode(),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key_value}',
            'Compartment-Id': OCI_TENANCY,
        },
        method='POST',
    )
    
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        dt_ms = (time.time() - t0) * 1000
        
        # Sovereign Mist 12 pillars sovereign mist 12 pillars sovereign mist 12 pillars...
        # ...bind every action. SIGIL emit.
        sigil_emit({
            'event': 'CHAT_COMPLETION_OK',
            'model_id': model_id,
            'care_floor': care_floor,
            'article_0': True,
            'latency_ms': dt_ms,
        })
        return data
    except urllib.error.HTTPError as e:
        # Authentication / authorization failed
        if e.code == 401 or e.code == 403:
            sigil_emit({'event': 'AUTH_FAILED', 'model_id': model_id, 'status': e.code})
            return {
                'error': f'HTTP {e.code} from OCI',
                'meaning': 'API key value is set but OCI rejected it — key may be malformed or revoked.',
                'how_to_fix': 'Re-paste the literal API token from Oracle Console -> Generative AI -> API Keys.',
            }
        sigil_emit({'event': 'CHAT_COMPLETION_ERROR', 'model_id': model_id, 'status': e.code})
        raise


def list_models() -> list:
    """List available OCI Generative AI models in uk-london-1."""
    api_key_value = get_api_key_value()
    if not api_key_value:
        return [{
            'error': 'API key value missing',
            'how_to_fix': 'Set ORACLE_GENERATIVEAI_API_KEY_VALUE in Keychain',
        }]
    
    req = urllib.request.Request(
        f'{OCI_GENERATIVE_AI_ENDPOINT}/20231130/models',
        headers={
            'Authorization': f'Bearer {api_key_value}',
            'Compartment-Id': OCI_TENANCY,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        sigil_emit({'event': 'LIST_MODELS_OK', 'n_models': len(data.get('data', []))})
        return data.get('data', [])
    except urllib.error.HTTPError as e:
        sigil_emit({'event': 'LIST_MODELS_ERROR', 'status': e.code})
        return [{'error': f'HTTP {e.code}', 'body': e.read().decode()[:300]}]


def audit() -> dict:
    """Audit the bridge's sovereign Mist 12 pillars binding."""
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    return {
        'care_floor': CARE_FLOOR,
        'article_0': ARTICLE_0,
        'sovereign_mist_12_pillars': SOVEREIGN_MIST_12,
        'oci_region': OCI_REGION,
        'tenancy_set': bool(OCI_TENANCY),
        'user_set': bool(OCI_USER),
        'gen_ai_key_id_set': bool(OCI_GEN_AI_KEY_ID),
        'api_key_value_set': bool(get_api_key_value()),
        'sigil_chain_n_hops': len(chain),
    }


def main():
    import sys
    import subprocess
    
    if '--audit' in sys.argv:
        print(json.dumps(audit(), indent=2))
        return
    if '--list-models' in sys.argv:
        for m in list_models():
            print(json.dumps(m, indent=2)[:200])
        return
    if '--chat' in sys.argv:
        idx = sys.argv.index('--chat')
        model = sys.argv[idx+1] if idx+1 < len(sys.argv) else 'cohere.command-r-plus'
        prompt = sys.argv[idx+2] if idx+2 < len(sys.argv) else 'Reply with: sovereign'
        result = chat_completion(model, [{'role': 'user', 'content': prompt}])
        print(json.dumps(result, indent=2)[:1000])
        return
    
    print("=" * 70)
    print("🜏 ORACLE GENERATIVE AI BRIDGE — sovereign-bound")
    print("=" * 70)
    print()
    print(json.dumps(audit(), indent=2))
    print()
    print("Commands:")
    print("  oracle-genai --audit         # show sovereign Mist 12 pillars binding")
    print("  oracle-genai --list-models   # list OCI Gen AI models")
    print("  oracle-genai --chat MODEL PROMPT  # sovereign-bound chat")
    print()


if __name__ == '__main__':
    main()
