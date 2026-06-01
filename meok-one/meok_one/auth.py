"""MEOK ONE — passwordless cross-device identity (stdlib only, zero deps).

The seamless answer to "log in on desktop AND mobile and it's all connected":

  ANONYMOUS-FIRST   a visitor just starts — the server mints a durable account
                    (user_id + signed token), so their character, memory and bond
                    persist server-side from the first message. No signup wall.
  DEVICE PAIRING    to connect a second device, the logged-in device mints a
                    short-lived PAIR CODE; the new device claims it → SAME user_id
                    → everything is shared. Secure: the code is single-use, expires
                    in 10 min, and requires possession of the first device.
  RECOVERY (opt)    a user may attach an email later for cross-device recovery.

JWT is HS256 via hmac/hashlib (no PyJWT). Store is a JSON file (no DB dep) that
survives restarts; migrate to Postgres later. Secret from MEOK_JWT_SECRET (env).
Everything here is keyed to user_id, which the rest of MEOK ONE uses to scope state.
"""
import os, json, hmac, hashlib, base64, time, secrets, threading
from pathlib import Path

_SECRET = os.environ.get("MEOK_JWT_SECRET") or "dev-insecure-meok-jwt-secret-set-MEOK_JWT_SECRET"
_STORE = Path(os.environ.get("MEOK_USERS",
              str(Path(__file__).resolve().parent / "data" / "users.json")))
_LOCK = threading.RLock()
_TOKEN_DAYS = 365
_PAIR_TTL = 600  # 10 minutes
_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no ambiguous 0/O/1/I/L


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


# ---------- JWT (HS256, stdlib) ----------
def issue_token(user_id: str) -> str:
    payload = {"sub": user_id, "iat": int(time.time()),
               "exp": int(time.time() + _TOKEN_DAYS * 86400)}
    head = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    msg = f"{head}.{body}".encode()
    sig = _b64(hmac.new(_SECRET.encode(), msg, hashlib.sha256).digest())
    return f"{head}.{body}.{sig}"


def verify_token(tok: str):
    """Return the payload dict if the token is well-formed, signed, and unexpired; else None."""
    try:
        head, body, sig = tok.split(".")
        msg = f"{head}.{body}".encode()
        good = _b64(hmac.new(_SECRET.encode(), msg, hashlib.sha256).digest())
        if not hmac.compare_digest(sig, good):
            return None
        p = json.loads(_b64d(body))
        if int(p.get("exp", 0)) < time.time():
            return None
        return p
    except Exception:
        return None


# ---------- user store (JSON, atomic) ----------
def _load() -> dict:
    with _LOCK:
        try:
            return json.loads(_STORE.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            return {"users": {}, "pairs": {}}


def _save(d: dict) -> None:
    with _LOCK:
        _STORE.parent.mkdir(parents=True, exist_ok=True)
        tmp = _STORE.with_suffix(".tmp")
        tmp.write_text(json.dumps(d, indent=2))
        tmp.replace(_STORE)


def _gc_pairs(d: dict) -> None:
    now = time.time()
    d["pairs"] = {k: v for k, v in d.get("pairs", {}).items() if v.get("exp", 0) > now}


# ---------- public API ----------
def create_anon() -> dict:
    d = _load()
    uid = "u_" + secrets.token_hex(8)
    d.setdefault("users", {})[uid] = {"created": int(time.time()), "devices": 1, "email": None}
    _save(d)
    return {"user_id": uid, "token": issue_token(uid), "anon": True}


def user_exists(uid: str) -> bool:
    return uid in _load().get("users", {})


def start_pair(uid: str) -> dict:
    """Logged-in device mints a short-lived, single-use code to link another device."""
    d = _load()
    if uid not in d.get("users", {}):
        return {"error": "unknown user"}
    _gc_pairs(d)
    code = "".join(secrets.choice(_ALPHABET) for _ in range(6))
    d.setdefault("pairs", {})[code] = {"uid": uid, "exp": int(time.time() + _PAIR_TTL)}
    _save(d)
    return {"pair_code": code, "expires_in": _PAIR_TTL}


def claim_pair(code: str) -> dict:
    """New device claims a code → gets a token for the SAME account."""
    code = (code or "").strip().upper()
    d = _load()
    _gc_pairs(d)
    p = d.get("pairs", {}).get(code)
    if not p:
        return {"error": "invalid or expired code"}
    uid = p["uid"]
    if uid not in d.get("users", {}):
        return {"error": "account no longer exists"}
    del d["pairs"][code]  # single-use
    d["users"][uid]["devices"] = d["users"][uid].get("devices", 1) + 1
    _save(d)
    return {"user_id": uid, "token": issue_token(uid)}


def attach_email(uid: str, email: str) -> dict:
    d = _load()
    if uid not in d.get("users", {}):
        return {"error": "unknown user"}
    d["users"][uid]["email"] = (email or "").strip().lower() or None
    _save(d)
    return {"ok": True}


def me(uid: str) -> dict:
    u = _load().get("users", {}).get(uid)
    if not u:
        return {"error": "unknown user"}
    return {"user_id": uid, "created": u["created"],
            "devices": u.get("devices", 1), "email": u.get("email"),
            "characters": len(u.get("characters", []))}


# ---------- per-user character roster (the Character Factory persists creations here) ----------
def add_character(uid: str, char: dict) -> dict:
    d = _load()
    u = d.get("users", {}).get(uid)
    if not u:
        return {"error": "unknown user"}
    keep = {k: char.get(k) for k in ("id", "name", "emoji", "archetype", "care_style", "color", "tagline")}
    roster = [c for c in u.get("characters", []) if c.get("id") != keep.get("id")]
    roster.append(keep)
    u["characters"] = roster[-50:]   # cap per user
    _save(d)
    return {"ok": True, "count": len(u["characters"])}


def list_characters(uid: str) -> list:
    return _load().get("users", {}).get(uid, {}).get("characters", [])
