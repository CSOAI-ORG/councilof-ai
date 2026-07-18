#!/usr/bin/env python3
"""sov33_identity.py — Founder/Public identity gate (Stage-1 LEARN component).
Two tiers: SOV33 = founder BUILD tier (authenticated, full authority); SOV3 = public SANDBOX tier.

HONESTY / LEGAL LINE (binding — from the estate's own EU-AI-Act discipline):
- Identity is CRYPTOGRAPHIC (something you HAVE/KNOW), NEVER biometric.
- No facial/voice/biometric matching. That is EU AI Act Art.9 / GDPR special-category territory
  and a regulated high-risk practice — out of scope by design. 'Visual/HARV' stays MYTHOS; the
  implementation is a signed key. This keeps founder-recognition sellable, not a liability.
- Founder secret is verified by CONSTANT-TIME HASH COMPARE; the raw secret is never stored,
  never logged, never committed. Only a salted SHA-256 digest lives on disk.
"""
import os, hmac, hashlib, json, time
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


SIGIL_DIR = os.environ.get("SOV33_SIGIL_DIR", os.path.expanduser("~/.sovereign"))
FOUNDER_DIGEST_FILE = os.path.join(SIGIL_DIR, "founder.digest")   # salted hash ONLY, never the secret
SALT = b"sov33-founder-v1"  # not secret; per-deploy salt would be better, fine for gate logic

def _digest(secret:str)->str:
    return hashlib.sha256(SALT + secret.encode()).hexdigest()

def enroll_founder(secret:str):
    """One-time: store ONLY the salted digest of the founder secret. Raw secret discarded."""
    os.makedirs(SIGIL_DIR, exist_ok=True)
    with open(FOUNDER_DIGEST_FILE,"w") as f: f.write(_digest(secret))
    os.chmod(FOUNDER_DIGEST_FILE, 0o600)
    return {"enrolled":True,"digest_file":FOUNDER_DIGEST_FILE,"raw_secret_stored":False}

def identify(secret:str=None, device_key:str=None):
    """Return the tier + access grant. Founder iff the presented secret's digest matches.
    Everyone else = public SOV3 sandbox tier (NO build access)."""
    is_founder = False
    if secret and os.path.exists(FOUNDER_DIGEST_FILE):
        stored = open(FOUNDER_DIGEST_FILE).read().strip()
        is_founder = hmac.compare_digest(stored, _digest(secret))   # constant-time
    tier = "SOV33_FOUNDER_BUILD" if is_founder else "SOV3_PUBLIC_SANDBOX"
    grant = {
        "SOV33_FOUNDER_BUILD": {"build":True,"deploy_propose":True,"charter_read":True,
                                "charter_amend":False,  # still needs BFT+human sigs even for founder
                                "money":False,"dns":False,"secrets":False},  # owner-gated actions stay gated
        "SOV3_PUBLIC_SANDBOX": {"build":False,"deploy_propose":False,"charter_read":True,
                                "chat":True,"governed_ask":True},
    }[tier]
    rec = {"t":time.time(),"tier":tier,"is_founder":is_founder,"grant":grant,
           "auth_method":"cryptographic_secret" + ("+device" if device_key else ""),
           "biometric_used":False}
    rec["sigil"]=hashlib.sha256(json.dumps(rec,sort_keys=True).encode()).hexdigest()[:16]
    return rec

def keyword_signals():
    """TUI/chat keyword hints that PROMPT for founder auth (they do NOT grant it alone)."""
    return ["build mode","founder","sov33 build","unlock build","eat"]

if __name__=="__main__":
    print("SOV33 IDENTITY GATE — founder(build) vs public(sandbox), CRYPTOGRAPHIC not biometric\n")
    # demo: enroll a test founder secret, then show all three paths
    enroll_founder("demo-founder-passphrase")
    for label, kw in [("founder (correct secret)", dict(secret="demo-founder-passphrase", device_key="id_ed25519")),
                      ("impostor (wrong secret)",  dict(secret="guessing")),
                      ("public end-user (no secret)", dict())]:
        r = identify(**kw)
        print(f"  [{r['tier']:22}] {label:26} build={r['grant'].get('build',False)} biometric={r['biometric_used']}")
    print("\n  LEGAL LINE: no biometric/face/voice ID (EU AI Act Art.9). Founder = signed secret + device.")
    print("  Owner-gated (money/dns/secrets/charter-amend) stay FALSE even for founder — human+BFT still required.")
    r=identify(secret="demo-founder-passphrase")
    json.dump(r, open("identity_demo.json","w"), indent=2)
