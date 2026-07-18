#!/usr/bin/env python3
"""Test the new api-gateway endpoints + verify Postgres persistence."""
import json
import urllib.request
import urllib.error
import base64

BASE = "http://127.0.0.1:3211"

def http(method, url, body=None, timeout=15):
    headers = {"Content-Type": "application/json"} if body else {}
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

print("=" * 60)
print("L5 PRODUCTION E2E — new endpoints + Postgres persistence")
print("=" * 60)

# 1. /v1/community
print("\n[1/6] /v1/community")
s, b = http("GET", f"{BASE}/v1/community")
if s == 200:
    d = json.loads(b)
    print("  total_disclosures:", d.get("total_disclosures", 0))
    print("  unique_inventors:", d.get("unique_inventors", 0))
    juris = d.get("jurisdictions_list", d.get("jurisdictions_covered", []))
    print(f"  jurisdictions: {len(juris)}")
    print("  last_24h disclosures:", d.get("last_24h", {}).get("disclosure_count", "?"))
    print("  bft_proposals_pending:", d.get("bft_proposals_pending", "?"))
    print("  council_size:", d.get("council_size", "?"))
    sig = d.get("_sig", "")
    print("  _sig:", sig[:60])

# 2. /v1/leaderboard
print("\n[2/6] /v1/leaderboard")
s, b = http("GET", f"{BASE}/v1/leaderboard")
if s == 200:
    d = json.loads(b)
    top = d.get("top", [])
    print("  top count:", len(top))
    if top:
        print("  #1:", top[0].get("did", "?"), "score=", top[0].get("composite_score", 0))
    sig = d.get("_sig", "")
    print("  _sig:", sig[:60])

# 3. /v1/bft/proposals
print("\n[3/6] /v1/bft/proposals")
s, b = http("GET", f"{BASE}/v1/bft/proposals?limit=5")
if s == 200:
    d = json.loads(b)
    print("  total:", d.get("total", 0))
    print("  returned:", len(d.get("proposals", [])))
    sig = d.get("_sig", "")
    print("  _sig:", sig[:60])

# 4. /v1/bft/queue
print("\n[4/6] /v1/bft/queue")
s, b = http("GET", f"{BASE}/v1/bft/queue")
if s == 200:
    d = json.loads(b)
    agents = d.get("agents", [])
    print("  agents:", len(agents))
    if agents:
        a = agents[0]
        print("  first agent:", a.get("agent_id", "?"), "pending=", a.get("pending", 0))
    sig = d.get("_sig", "")
    print("  _sig:", sig[:60])

# 5. /v1/disclose/batch — actually do a batch disclosure
print("\n[5/6] /v1/disclose/batch (real)")
doc = base64.b64encode(b"Batch E2E test document content for sovereign hive.").decode()
batch_body = {"items": [
    {"title": f"Batch Item {i}", "description": f"Batch disclosure test {i}",
     "inventor_did": f"did:key:z6MkBatchE2E{i}", "document_base64": doc,
     "document_format": "txt", "tier": "defensive"}
    for i in range(3)
]}
s, b = http("POST", f"{BASE}/v1/disclose/batch", body=batch_body)
print("  status:", s)
if s == 200:
    d = json.loads(b)
    print("  total:", d.get("total", 0))
    print("  succeeded:", d.get("succeeded", 0))
    print("  failed:", d.get("failed", 0))
    sig = d.get("_sig", "")
    print("  _sig:", sig[:60])

# 6. /v1/audit/log from Postgres
print("\n[6/6] /v1/audit/log?source=postgres")
s, b = http("GET", f"{BASE}/v1/audit/log?source=postgres&limit=3")
print("  status:", s)
if s == 200:
    d = json.loads(b)
    print("  source:", d.get("source", "?"))
    print("  total:", d.get("total", 0))
    print("  returned:", len(d.get("entries", [])))

print()
print("=" * 60)
print("E2E complete.")
print("=" * 60)
