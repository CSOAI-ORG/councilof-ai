import re
import requests
import json
import os

PACK_FILES = [
    '../../meok/ui/src/lib/character-packs/mythological.ts',
    '../../meok/ui/src/lib/character-packs/historical.ts',
    '../../meok/ui/src/lib/character-packs/archetypes.ts',
    '../../meok/ui/src/lib/character-packs/literary.ts'
]

FACTORY_URL = 'http://127.0.0.1:3300/mint'

def sync_packs():
    print("🚀 Starting Mass Character Sync (Success on 201)...")
    
    for file_path in PACK_FILES:
        full_path = os.path.join(os.path.dirname(__file__), file_path)
        if not os.path.exists(full_path):
            continue
            
        print(f"📦 Processing {file_path}...")
        with open(full_path, 'r') as f:
            content = f.read()
            
        blocks = re.split(r'\n\s+([a-z0-9_]+):\s*{', content)
        
        count = 0
        for i in range(1, len(blocks), 2):
            char_id = blocks[i]
            char_body = blocks[i+1]
            
            if char_id in ['dimensions', 'visual', 'evolutionAxes']: continue
            
            name_match = re.search(r"name:\s*['\"](.*?)['\"]", char_body)
            arch_match = re.search(r"archetype:\s*['\"](.*?)['\"]", char_body)
            tags_match = re.search(r"tags:\s*\[(.*?)\]", char_body, re.DOTALL)
            
            if name_match and arch_match:
                name = name_match.group(1)
                arch = arch_match.group(1)
                tags = []
                if tags_match:
                    tags = [t.strip().strip("'").strip('"') for t in tags_match.group(1).split(',') if t.strip()]
                
                payload = {
                    "name": name,
                    "archeType": arch,
                    "ownerId": 'MEOK-FOUNDER',
                    "tools": tags,
                    "mbti": next((t for t in tags if re.match(r'^[IE][SN][TF][JP]$', t)), 'INTJ'),
                    "enneagram": next((t for t in tags if re.match(r'^[1-9]w[1-9]$', t)), '5w6'),
                    "dimensions": { "warmth": 0.5, "energy": 0.5, "whimsy": 0.5, "edge": 0.5, "complexity": 0.5 }
                }
                
                try:
                    r = requests.post(FACTORY_URL, json=payload, timeout=5)
                    if r.status_code in [200, 201]:
                        print(f"  ✨ Minted {name}")
                        count += 1
                    else:
                        print(f"    ❌ Failed {name}: {r.status_code}")
                except Exception as e:
                    print(f"    ❌ Error connecting for {name}: {e}")
                    
        print(f"  ✅ Finished {file_path} ({count} characters)")

if __name__ == "__main__":
    sync_packs()
