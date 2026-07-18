#!/usr/bin/env python3
"""Fast parallel publish MCP servers to Smithery via REST API."""
import json, os, requests, sys, threading

API_KEY = os.environ.get("SMITHERY_API_KEY", "")
BASE = "https://api.smithery.ai/v1"
NAMESPACE = "nicholastempleman"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

MANIFEST = "/Users/nicholas/clawd/MCP_DEPLOYMENT_MANIFEST.json"
lock = threading.Lock()
published = failed = skipped = 0

def publish(name):
    global published, failed, skipped
    url = f"{BASE}/servers/{NAMESPACE}/{name}"
    payload = {
        "type": "github",
        "repository": f"https://github.com/CSOAI-ORG/{name}",
        "qualifiedName": f"{NAMESPACE}/{name}",
    }
    try:
        r = requests.post(url, json=payload, headers=HEADERS, timeout=30)
        with lock:
            if r.status_code in (200, 201):
                published += 1
                print(f"  ✅ {name}")
            elif r.status_code == 409:
                skipped += 1
                print(f"  ⏭️  {name} (already exists)")
            else:
                failed += 1
                print(f"  ❌ {name} ({r.status_code}: {r.text[:80]})")
    except Exception as e:
        with lock:
            failed += 1
            print(f"  ❌ {name} (error: {e})")

def main():
    global published, failed, skipped
    if not API_KEY:
        print("❌ SMITHERY_API_KEY not set")
        sys.exit(1)
    
    with open(MANIFEST) as f:
        manifest = json.load(f)
    
    servers = [s["name"] for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Publishing {len(servers)} servers to Smithery in parallel...\n")
    
    threads = []
    for name in servers:
        t = threading.Thread(target=publish, args=(name,))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    print(f"\n✅ Published: {published} | ⏭️  Skipped: {skipped} | ❌ Failed: {failed}")

if __name__ == "__main__":
    main()
