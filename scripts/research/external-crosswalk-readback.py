#!/usr/bin/env python3
"""Read-only external contract probe. Not independent assurance or signature verification."""
import json
import urllib.request
import urllib.error

BASE = "https://councilof.ai"
def request(path, payload=None):
    req = urllib.request.Request(BASE + path,
        data=None if payload is None else json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "A2A-Version": "1.0",
                 "User-Agent": "CSOAI-external-contract-readback/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)

def call_crosswalk():
    return request("/api/a2a", {"jsonrpc":"2.0","id":1,"method":"SendMessage",
        "params":{"message":{"messageId":"external-contract-probe","role":"ROLE_USER",
        "parts":[{"data":{"skill":"east-west-crosswalk","input":{}},
                  "mediaType":"application/json"}]}}})

def main():
    direct = request("/api/cross")
    result = call_crosswalk()
    parts = result["result"]["message"]["parts"]
    data = next(p["data"] for p in parts if isinstance(p.get("data"), dict))
    payload = data.get("payload")
    assert isinstance(payload, dict), "Missing structured source payload"
    assert data.get("source") == BASE + "/api/cross", "Unexpected source"
    assert data.get("state") == "DELIVERED_SOURCE", "Source attribution lost"
    assert payload.get("schema") == direct.get("schema"), "Schema mismatch between routes"
    assert isinstance(payload.get("rows"), list), "Missing structured rows"
    output = {"direct_schema": direct.get("schema"), "a2a_payload_schema": payload.get("schema"),
              "source_attribution_preserved": True, "row_count": len(payload["rows"]),
              "advertised_v1_contract_established": False,
              "signature_verified": False,
              "note": "Readback confirms source delivery, not crosswalk v1 or a verified signed card."}
    print(json.dumps(output, indent=2))
if __name__ == "__main__":
    main()
