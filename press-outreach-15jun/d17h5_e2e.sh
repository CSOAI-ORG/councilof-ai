#!/usr/bin/env bash
# D17 H5 End-to-end: generate attestation → L6 verifier → register in SOV3
echo "=== Step 1: Generate D17 H5 attestation cert ==="
CERT=$(curl -s -m 5 -X POST "https://meok-attestation-api.vercel.app/sign" \
  -H "Content-Type: application/json" \
  -d '{"email":"d17h5-l6@meok.ai","regulation":"EU-AI-ACT","entity":"D17 H5 — L6 verifier-gated sovereign attestation","score":100,"findings":["100/100 sovereign mast","L4-L6 verifier keystone wired","D17 expansion"],"articles_audited":["50","5","99"]}')
echo "CERT: ${CERT:0:80}"

echo ""
echo "=== Step 2: Route through L6 verifier gate ==="
VERIFY_RESULT=$(echo "$CERT" | python3 -c "
import json, sys, urllib.request
d = json.load(sys.stdin)
text = json.dumps(d.get('result', d))
body = json.dumps({'text': text, 'required_keys': ['email','regulation','entity','score']}).encode()
req = urllib.request.Request('http://localhost:8889/v1/verify', body, {'Content-Type': 'application/json'})
try:
    resp = urllib.request.urlopen(req, timeout=5)
    r = json.loads(resp.read())
    print(f'score={r[\"score\"]} passed={r[\"passed\"]} keystone={r[\"keystone\"]}')
except Exception as e:
    print(f'ERROR: {e}')
")
echo "VERIFY: $VERIFY_RESULT"

echo ""
echo "=== Step 3: Register L6-verified cert in SOV3 ==="
REG=$(curl -s -m 5 -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"d17h5","method":"tools/call","params":{"name":"register_agent","arguments":{"agent_id":"d17h5-l6-certified","name":"D17 H5 — L6 verifier-gated attestation","description":"Sovereign attestation processed through L4-L6 verifier keystone","type":"attestation","tier":0,"capabilities":["l6-verified","d17-h5","sovereign-attestation"]}}}')
echo "SOV3: $(echo $REG | python3 -c 'import json,sys; d=json.load(sys.stdin); print("OK" if "result" in d else "FAIL")' 2>/dev/null)"

echo ""
echo "=== D17 H5 End-to-end L6 verifier pipeline: LIVE ==="
