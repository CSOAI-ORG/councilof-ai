"""meok-sov33 — the sovereign AI client.

Talk to a governed, care-floored, signed AI substrate from Python. Every call routes through the
public MEOK sovereign endpoints (os.meok.ai/api): care-floor 0.95, Ed25519-signed, honest about its
OWEM tiers. SOV3 is free (no key); premium models route when you bring your own key server-side.

    import meok_sov33 as sov
    sov.talk("what is a sovereign AI?")           # governed answer
    sov.govern("a bank")                          # real frameworks
    m = sov.remember("my daughter is allergic to peanuts", owner="did:csoai:nick")  # signed memory
    s = sov.sign({"amount": 100}); sov.verify(s["canonical"], s["signature"], s["publicKey"])  # -> True

Honest scope: this is a client to a live governed API — not a local model and not a capability claim.
The OWEM `tier` picks the model size (routing); it is NOT the same as the four OWEM scopes (see owem()).
"""
from __future__ import annotations
import json, urllib.request, urllib.parse

BASE = "https://os.meok.ai/api"
CARE_FLOOR = 0.95
# the model-routing tiers (NOT the four OWEM scopes — see owem() for those). Honest labels.
OWEM_TIERS = {"small": "reflex · ~8B", "medium": "tools · ~70B", "large": "deep/verify · ~120B"}
__version__ = "0.1.0"


def _post(path: str, obj: dict, timeout: int = 30) -> dict:
    req = urllib.request.Request(BASE + path, method="POST",
                                 headers={"Content-Type": "application/json"},
                                 data=json.dumps(obj).encode())
    return json.load(urllib.request.urlopen(req, timeout=timeout))


def _get(path: str, timeout: int = 20) -> dict:
    return json.load(urllib.request.urlopen(BASE + path, timeout=timeout))


def talk(message: str, tier: str = "medium", persona: str | None = None) -> str:
    """Ask the governed Sovereign. tier = small|medium|large (model routing, care-floored)."""
    d = _post("/chat", {"message": message, "tier": tier,
                        "persona": persona or "You are the Sovereign — warm, brief, honest.",
                        "register": "plain"})
    return d.get("response") or d.get("say") or ""


def sign(payload) -> dict:
    """Ed25519-sign any payload. Returns {canonical, signature, publicKey, fingerprint}."""
    return _post("/sign", {"payload": payload})


def verify(message: str, signature: str, publicKey: str) -> bool:
    """Verify a signature via the sovereign verify endpoint. Returns True/False."""
    return _post("/verify", {"message": message, "signature": signature, "publicKey": publicKey}).get("valid") is True


def govern(industry: str) -> dict:
    """What real frameworks govern an industry (EU AI Act, GDPR, DORA, …)."""
    return _get("/govern?q=" + urllib.parse.quote(industry))


def remember(fact: str, owner: str = "did:csoai:anon") -> dict:
    """Mint a signed, portable memory episode bonded to `owner` (did:csoai:<you>)."""
    ep = {"type": "meok.memory.v1", "fact": str(fact)[:2000], "owner": owner}
    s = sign(ep)
    return {"remembered": fact, "owner": owner,
            **{k: s.get(k) for k in ("signature", "publicKey", "fingerprint", "canonical")}}


def owem() -> dict:
    """The canonical OWEM manifest — the four SCOPES (person/tools/governance/identity) + tier routing.
    Note: the OWEM scopes are sized by REACH, not parameters. Never a 'trillion-param' model."""
    return _get("/owem")


def emergence() -> dict:
    """The current OWEM emergence level (honest baseline L0 until experts land)."""
    return _get("/emergence")


__all__ = ["talk", "sign", "verify", "govern", "remember", "owem", "emergence",
           "CARE_FLOOR", "OWEM_TIERS", "BASE", "__version__"]
