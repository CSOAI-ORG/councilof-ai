"""
RUNESTONE SOVEREIGN IDENTITY — User signup with sigil-based identity.

Each user gets a sovereign identity:
  1. username: their chosen handle
  2. password: hashed with SHA-256
  3. sovereign_id: derived from sigil of (username + password + nonce)
  4. sigil: issued on signup
  5. session: API key for all subsequent calls

Storage: local JSON file (would be sovereign database in production).
"""

import json, hashlib, secrets, time
from datetime import datetime
from pathlib import Path

DB = Path("/tmp/sovereign-portal/identities.json")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def sovereign_id(username: str, password: str, nonce: str) -> str:
    return hashlib.sha256(f"{username}:{nonce}:{password}".encode()).hexdigest()[:32]


def sign(message: str) -> str:
    return hashlib.sha256(message.encode()).hexdigest()[:32]


def load_db() -> dict:
    if DB.exists():
        return json.loads(DB.read_text())
    return {"users": {}, "sessions": {}}


def save_db(db: dict):
    DB.parent.mkdir(exist_ok=True)
    DB.write_text(json.dumps(db, indent=2))


def signup(username: str, password: str) -> dict:
    """Create a new sovereign identity."""
    db = load_db()
    if username in db["users"]:
        return {"error": "User already exists", "username": username}
    nonce = secrets.token_hex(16)
    sid = sovereign_id(username, password, nonce)
    pwd_hash = hash_password(password)
    api_key = sign(f"apikey:{sid}:{nonce}")
    user = {
        "username": username,
        "sovereign_id": sid,
        "password_hash": pwd_hash,
        "nonce": nonce,
        "api_key": api_key,
        "created": datetime.now().isoformat(),
        "runestones_submitted": 0,
    }
    db["users"][username] = user
    save_db(db)
    return {
        "username": username,
        "sovereign_id": sid,
        "api_key": api_key,
        "created": user["created"],
        "sovereignty": "issued",
    }


def login(username: str, password: str) -> dict:
    """Authenticate and get a session."""
    db = load_db()
    user = db["users"].get(username)
    if not user: return {"error": "User not found"}
    if user["password_hash"] != hash_password(password):
        return {"error": "Wrong password"}
    sid = user["sovereign_id"]
    session_token = sign(f"session:{sid}:{secrets.token_hex(8)}")
    db["sessions"][session_token] = {
        "username": username,
        "sovereign_id": sid,
        "created": datetime.now().isoformat(),
    }
    save_db(db)
    return {
        "username": username,
        "sovereign_id": sid,
        "session_token": session_token,
        "sovereignty": "authenticated",
    }


def verify_session(token: str) -> dict:
    db = load_db()
    session = db["sessions"].get(token)
    if not session: return {"error": "Invalid session"}
    return session


def get_user(username: str) -> dict:
    db = load_db()
    user = db["users"].get(username)
    if not user: return {"error": "User not found"}
    return {k: v for k, v in user.items() if k != "password_hash"}


if __name__ == "__main__":
    print("=" * 60)
    print("  🐉 SOVEREIGN IDENTITY — User signup demo")
    print("=" * 60)
    print()

    # Signup test
    r1 = signup("alice", "alice-secret-2026")
    print("1. Signup alice:")
    print(json.dumps(r1, indent=2))
    print()

    r2 = signup("bob", "bob-secret-2026")
    print("2. Signup bob:")
    print(json.dumps(r2, indent=2))
    print()

    # Try duplicate
    r3 = signup("alice", "another-pass")
    print("3. Duplicate signup attempt:")
    print(json.dumps(r3, indent=2))
    print()

    # Login
    r4 = login("alice", "alice-secret-2026")
    print("4. Login alice (correct password):")
    print(json.dumps(r4, indent=2))
    print()

    # Wrong password
    r5 = login("alice", "wrong-password")
    print("5. Login alice (wrong password):")
    print(json.dumps(r5, indent=2))
    print()

    # Verify session
    if "session_token" in r4:
        r6 = verify_session(r4["session_token"])
        print("6. Verify session:")
        print(json.dumps(r6, indent=2))

    # Get user
    r7 = get_user("alice")
    print("7. Get user profile:")
    print(json.dumps(r7, indent=2))
