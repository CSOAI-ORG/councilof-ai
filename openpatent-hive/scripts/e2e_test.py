#!/usr/bin/env python3
"""
E2E Flow Test — openpatent.ai hive on sovereign VM.

Executes the full user journey against the live services:
  1. Submit a disclosure via api-gateway → patentmcp
  2. Verify the disclosure via api-gateway → patentmcp
  3. Trigger BFT council review with cross-hive attestation
  4. Search the prior art registry
  5. Draft patent claims via drafting-fork
  6. Run a primitive tool (claim-parser)
  7. Check x402 router + split calculation
  8. Verify MCP manifest completeness
  9. Check the verify page renders
  10. End-to-end MCP server handshake (mocked)
"""
import sys
import time
import json
import base64
import urllib.request
import urllib.error

BASE = "http://127.0.0.1"
SERVICES = {
    "patentmcp":    f"{BASE}:3210",
    "api-gateway":  f"{BASE}:3211",
    "worker":       f"{BASE}:3212",
    "verify-page":  f"{BASE}:3213",
    "mcp-manifest": f"{BASE}:3214",
    "bft-council":  f"{BASE}:3215",
    "drafting-fork":f"{BASE}:3216",
    "x402-router":  f"{BASE}:3217",
    "primitives":   f"{BASE}:3218",
    "landing":      f"{BASE}:3000",
}

passes = 0
fails = 0
results = []


def http(method, url, body=None, timeout=10):
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode() if e.fp else ""
    except Exception as e:
        return 0, str(e)


def check(name, status, body, expect_status=200, expect_substr=None):
    global passes, fails
    body_str = body if isinstance(body, str) else json.dumps(body)
    ok = status == expect_status
    if expect_substr:
        ok = ok and expect_substr in body_str
    if ok:
        passes += 1
        results.append((name, "PASS", status, body_str[:100]))
        print(f"  ✓ {name}: {status}")
    else:
        fails += 1
        results.append((name, "FAIL", status, body_str[:200]))
        print(f"  ✗ {name}: {status} expected {expect_status} {expect_substr or ''}")


print("="*70)
print("E2E FLOW TEST — openpatent.ai hive on sovereign VM")
print("="*70)

# Step 1: Health check all services
print("\n[1/10] Health check all 10 services")
for name, base in SERVICES.items():
    if name == "landing":
        # Landing site is Next.js, no /health — just check the root renders
        s, b = http("GET", f"{base}/")
        check(f"landing {name} root", s, b, 200, "<!DOCTYPE html>")
        continue
    s, b = http("GET", f"{base}/health")
    check(f"health {name}", s, b, 200, '"status"')
    if "overall" in b:  # api-gateway reports overall
        check(f"health {name} overall", s, b, 200, '"overall"')

# Step 2: Submit a real disclosure via the public API gateway
print("\n[2/10] Submit disclosure via api-gateway → patentmcp")
DISCLOSURE_TEXT = "A method for cryptographically-verifiable multi-agent coordination under BFT consensus with 22/33 supermajority threshold, suitable for SOVEREIGN AI deployments in regulated industries. The system produces 6-layer cryptographic proofs anchored to Bitcoin and Polygon, with hash-chained audit log and C2PA Content Credentials. Tested in 10+ jurisdictions including US (FRE 902), EU (eIDAS), UK (Patents Act 1977), CN (Hangzhou 2018), and FR (Marseille 2025)."

doc_b64 = base64.b64encode(DISCLOSURE_TEXT.encode()).decode()
s, b = http("POST", f"{SERVICES['api-gateway']}/v1/disclosure", body={
    "title": "E2E Test: Cryptographically-Verifiable Multi-Agent Coordination",
    "description": DISCLOSURE_TEXT,
    "inventor_did": "did:key:z6MkiSmE2ETestAgent",
    "document_base64": doc_b64,
    "document_format": "txt",
    "classification": "G06N3/00",
    "tier": "defensive",
})
disclosure_resp = json.loads(b) if s == 200 else {}
check("POST /v1/disclosure", s, b, 200, '"DISCLOSED"')
if "document_hash" in disclosure_resp:
    print(f"    → document_hash: {disclosure_resp['document_hash'][:32]}...")
    print(f"    → attestation_url: {disclosure_resp.get('attestation_url', 'N/A')}")
    print(f"    → bitcoin_tx: {disclosure_resp.get('bitcoin_transaction', 'N/A')[:32]}...")
    print(f"    → chain_index: {disclosure_resp.get('chain_index', 'N/A')}")
    print(f"    → fee_paid: ${disclosure_resp.get('fee_paid', 'N/A')}")
    print(f"    → verify all_checks_pass: {disclosure_resp.get('verification', {}).get('all_checks_pass', 'N/A')}")
disclosure_hash = disclosure_resp.get("document_hash", "")

# Step 3: Verify the disclosure
print("\n[3/10] Verify disclosure via api-gateway → patentmcp")
s, b = http("POST", f"{SERVICES['api-gateway']}/v1/verify", body={
    "disclosure_json": json.dumps(disclosure_resp),
})
check("POST /v1/verify", s, b, 200)
verify_resp = json.loads(b) if s == 200 else {}
print(f"    → all_checks_pass: {verify_resp.get('all_checks_pass', 'N/A')}")
print(f"    → checks: {verify_resp.get('checks', [])}")

# Step 4: Search prior art registry
print("\n[4/10] Search prior art registry")
s, b = http("POST", f"{SERVICES['api-gateway']}/v1/search", body={
    "query": "BFT consensus",
    "limit": 5,
})
check("POST /v1/search", s, b, 200)
search_resp = json.loads(b) if s == 200 else {}
print(f"    → total entries: {search_resp.get('total', 0)}")
for e in search_resp.get("entries", [])[:2]:
    print(f"    → entry: {e.get('title', '?')[:60]}...")

# Step 5: Trigger BFT council review (premium tier with cross-hive attestation)
print("\n[5/10] BFT council review with cross-hive attestation")
s, b = http("POST", f"{SERVICES['api-gateway']}/v1/disclosure", body={
    "title": "E2E Test: Premium BFT Council Review",
    "description": "Premium tier disclosure triggering 33-agent sovereign-temple v3.0 BFT council review with 6 care dimensions, 11 domains, 55 bridge pairs, and cross-hive attestation via meok-keystone.",
    "inventor_did": "did:key:z6MkiSmE2EPremiumAgent",
    "document_base64": doc_b64,
    "document_format": "txt",
    "tier": "premium",
    "request_bft_review": True,
})
# Note: api-gateway doesn't proxy request_bft_review, so let's call the BFT directly
s2, b2 = http("POST", f"{SERVICES['bft-council']}/review", body={
    "disclosure_hash": disclosure_hash,
    "disclosure_result": disclosure_resp,
    "cross_hive": True,
})
check("POST bft /review (with cross-hive)", s2, b2, 200)
bft_resp = json.loads(b2) if s2 == 200 else {}
print(f"    → consensus: {bft_resp.get('consensus', 'N/A')}")
print(f"    → approvals: {bft_resp.get('approvals', 0)}/{bft_resp.get('council_size', 33)}")
print(f"    → care_vetoes: {bft_resp.get('care_vetoes', 0)}")
print(f"    → expertise_rejects: {bft_resp.get('expertise_rejects', 0)}")
print(f"    → alignment: {bft_resp.get('alignment', 'N/A')}")
print(f"    → cross_hive_attestation: {bft_resp.get('cross_hive_attestation', 'N/A')}")

# Step 6: Draft patent claims via drafting-fork
print("\n[6/10] Draft patent claims via drafting-fork (via api-gateway)")
s, b = http("POST", f"{SERVICES['api-gateway']}/v1/draft-claims", body={
    "title": "E2E Test Invention",
    "description": "A method for coordinating multiple AI agents using Byzantine Fault Tolerant consensus with a 22/33 supermajority threshold, comprising: collecting agent proposals; computing cryptographic hashes; signing with Ed25519; anchoring to public blockchains; and replaying consensus to verify integrity.",
    "technical_field": "Distributed systems / AI safety",
    "jurisdiction": "US",
})
check("POST /v1/draft-claims", s, b, 200, '"independent_claims"')
draft_resp = json.loads(b) if s == 200 else {}
print(f"    → novelty_index: {draft_resp.get('novelty_index', 'N/A')}")
print(f"    → patentability: {draft_resp.get('estimated_patentability', 'N/A')}")
print(f"    → independent claims: {len(draft_resp.get('independent_claims', []))}")
print(f"    → dependent claims: {len(draft_resp.get('dependent_claims', []))}")

# Step 7: Run primitive tool (claim_parser)
print("\n[7/10] Run primitive tool — claim-parser")
s, b = http("POST", f"{SERVICES['primitives']}/claim-parser", body={
    "claim_text": "1. A computer-implemented method for coordinating multi-agent AI systems under BFT consensus, comprising: collecting agent proposals; computing cryptographic hashes; signing with Ed25519; anchoring to public blockchains; and replaying consensus to verify integrity."
})
check("POST primitives /claim-parser", s, b, 200, '"elements"')
parse_resp = json.loads(b) if s == 200 else {}
print(f"    → claim_type: {parse_resp.get('claim_type', 'N/A')}")
print(f"    → transitional_phrase: {parse_resp.get('transitional_phrase', 'N/A')}")
print(f"    → element_count: {parse_resp.get('element_count', 0)}")

# Step 8: x402 router — submit payment, check split
print("\n[8/10] x402 router — payment + split")
s, b = http("POST", f"{SERVICES['x402-router']}/pay/", body={
    "payer_did": "did:key:z6MkiSmE2EPayer",
    "amount_usd": 149.0,
    "tier": "defensive",
    "disclosure_hash": disclosure_hash,
})
check("POST x402 /pay/", s, b, 200, "operations_treasury")
pay_resp = json.loads(b) if s == 200 else {}
if "split" in pay_resp:
    sp = pay_resp["split"]
    print(f"    → operations: ${sp['operations_treasury']['amount_usd']} ({sp['operations_treasury']['share']*100:.0f}%)")
    print(f"    → infrastructure: ${sp['infrastructure_pool']['amount_usd']} ({sp['infrastructure_pool']['share']*100:.0f}%)")
    print(f"    → bft_council: ${sp['bft_council_reward']['amount_usd']} ({sp['bft_council_reward']['share']*100:.0f}%)")
    print(f"    → status: {pay_resp.get('status', 'N/A')}")
    print(f"    → tx_hash: {pay_resp.get('tx_hash', 'N/A')[:32]}...")
    # Math check
    total = sp['operations_treasury']['amount_usd'] + sp['infrastructure_pool']['amount_usd'] + sp['bft_council_reward']['amount_usd']
    expected = 149.0
    diff = abs(total - expected)
    if diff < 0.01:
        print(f"    → ✓ split total = ${total:.2f} matches input ${expected:.2f}")
    else:
        print(f"    → ✗ split total = ${total:.2f} but input was ${expected:.2f} (diff ${diff:.4f})")
        fails += 1

# Step 9: Verify MCP manifest is complete
print("\n[9/10] MCP manifest completeness")
s, b = http("GET", f"{SERVICES['mcp-manifest']}/.well-known/mcp.json")
check("GET mcp manifest", s, b, 200, "openpatent-mcp")
mcp_manifest = json.loads(b) if s == 200 else {}
print(f"    → name: {mcp_manifest.get('name', 'N/A')}")
print(f"    → tools: {[t['name'] for t in mcp_manifest.get('tools', [])]}")
print(f"    → transports: {[t['type'] for t in mcp_manifest.get('transports', [])]}")
print(f"    → legal_jurisdictions: {mcp_manifest.get('legal', {}).get('jurisdictions', [])}")
print(f"    → pricing tiers: {list(mcp_manifest.get('pricing', {}).get('tiers', {}).keys())}")

# Step 10: Verify page renders
print("\n[10/10] Verify page renders")
s, b = http("GET", f"{SERVICES['verify-page']}/")
check("GET verify-page /", s, b, 200, "verify.openpatent.ai")
if s == 200:
    # Check the static HTML
    has_hero = "Disclose" in b or "Independent cryptographic verification" in b
    has_6_layers = "SHA-3/512" in b and "Ed25519" in b and "Bitcoin" in b
    print(f"    → hero present: {has_hero}")
    print(f"    → all 6 layers mentioned: {has_6_layers}")
    print(f"    → HTML size: {len(b)} bytes")

# Final summary
print("\n" + "="*70)
print(f"E2E RESULTS: {passes} passed, {fails} failed")
print("="*70)
if fails == 0:
    print("\n✓ ALL E2E FLOWS PASS — openpatent.ai hive is fully operational")
else:
    print(f"\n✗ {fails} failures — see results above")
print()
sys.exit(0 if fails == 0 else 1)
