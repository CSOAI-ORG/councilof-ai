"""P5a: Consented-awareness gate. The honest inversion of covert awareness (the Gemini-location move):
detect an inference is AVAILABLE -> ask first -> record hash-stamped consent (tamper-evident, NOT Ed25519-signed) -> use only if granted ->
every use logged -> revocable. If no consent on record, the awareness is NOT used. EU AI Act Art.50 /
GDPR Art.6 aligned by construction."""
import os, json, time, hashlib
from sov33_paths import SOV_DIR
_CONSENT = SOV_DIR / "consent_ledger.jsonl"

def _stamp(rec):  # SHA256 content hash — tamper-evident, NOT a cryptographic signature
    rec["ts"]=rec.get("ts") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    rec["hash"]=hashlib.sha256(json.dumps(rec,sort_keys=True).encode()).hexdigest()[:16]
    return rec
def _log(rec):
    os.makedirs(SOV_DIR, exist_ok=True)
    open(_CONSENT,"a").write(json.dumps(_stamp(rec))+"\n")
def request_consent(signal, purpose):
    """Return the disclosure text to SHOW the user (never acts before they answer)."""
    return (f"I can see [{signal}] from your connection. May I use it to {purpose}? "
            f"I'll only use it if you say yes, log every use, and you can revoke anytime.")
def grant(signal, granted:bool, user="owner"):
    _log({"event":"consent","signal":signal,"granted":bool(granted),"user":user}); return granted
def has_consent(signal, user="owner"):
    if not os.path.exists(_CONSENT): return False
    latest=None
    for line in open(_CONSENT):
        r=json.loads(line)
        if r.get("event")=="consent" and r.get("signal")==signal and r.get("user")==user: latest=r
    return bool(latest and latest.get("granted"))
def use_awareness(signal, value, user="owner"):
    """The gate: only returns the value if consent is on record; logs the use; else refuses."""
    if not has_consent(signal, user):
        _log({"event":"use_denied","signal":signal,"reason":"no consent on record"})
        return {"allowed":False,"reason":"no consent — awareness NOT used","signal":signal}
    _log({"event":"use","signal":signal,"user":user})
    return {"allowed":True,"value":value,"signal":signal}
def revoke(signal, user="owner"):
    _log({"event":"consent","signal":signal,"granted":False,"user":user,"revoked":True}); return True
