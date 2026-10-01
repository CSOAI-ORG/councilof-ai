#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DID=ROOT/"public/.well-known/did.json"

required={
  "did:web:csoai.org#board-attestation-1",
  "did:web:csoai.org#card-attestation-1",
  "did:web:csoai.org#route-attestation-1",
}

doc=json.loads(DID.read_text())
methods={m.get("id") for m in doc.get("verificationMethod",[]) if isinstance(m,dict)}
assertions=set(doc.get("assertionMethod",[]))

missing_methods=sorted(required-methods)
missing_assertions=sorted(required-assertions)
if missing_methods or missing_assertions:
    raise SystemExit(f"FAIL DID required methods missing verification={missing_methods} assertion={missing_assertions}")

for kid in required:
    vm=next(m for m in doc["verificationMethod"] if m.get("id")==kid)
    jwk=vm.get("publicKeyJwk") or {}
    if jwk.get("kty")!="OKP" or jwk.get("crv")!="Ed25519" or not jwk.get("x"):
        raise SystemExit(f"FAIL malformed required Ed25519 method {kid}")

print("PASS DID required verification/assertion methods")
