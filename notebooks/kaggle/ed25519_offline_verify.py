# Offline Ed25519 verify (Kaggle-ready stub)

Measurement, not certification. Run offline against a published card JSON.

```python
# pip install pynacl
import json, hashlib
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

def canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()

def verify_card(card: dict, pubkey_hex: str) -> bool:
    sig = bytes.fromhex(card["signature"])
    body = {k: v for k, v in card.items() if k not in ("signature", "content_id")}
    msg = hashlib.sha256(canon(body)).digest()  # adapt to RECEIPT-SPEC if envelope differs
    try:
        VerifyKey(bytes.fromhex(pubkey_hex)).verify(msg + sig)  # adjust to estate verify.ts
        return True
    except BadSignatureError:
        return False

# Prefer the estate's published verify path:
# https://councilof.ai/gspc-verify  and  node public/east-west/verify-pack.mjs
print("Stub only — use councilof.ai verify tooling for production checks.")
```

Do **not** invent MEASURED labour/economy scores in this notebook.
