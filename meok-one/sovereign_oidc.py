#!/usr/bin/env python3
"""Minimal OIDC-compatible identity provider (stub)."""
import json, secrets, hashlib, time
from datetime import datetime, timedelta

USERS = Path("/tmp/sovereign-portal/identities.json")

def discover():
    """OIDC discovery endpoint."""
    return {
        "issuer": "https://portal.csoai.org",
        "authorization_endpoint": "https://portal.csoai.org/oauth/authorize",
        "token_endpoint": "https://portal.csoai.org/oauth/token",
        "userinfo_endpoint": "https://portal.csoai.org/oauth/userinfo",
        "jwks_uri": "https://portal.csoai.org/.well-known/jwks.json",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["Ed25519"],
    }

def authorize(client_id, redirect_uri, scope, state):
    """OAuth authorize - returns a code."""
    code = secrets.token_urlsafe(32)
    return {"code": code, "state": state, "redirect_uri": redirect_uri}

def token(code, client_id, client_secret):
    """OAuth token - returns an access_token + id_token."""
    access_token = secrets.token_urlsafe(48)
    id_token_payload = {
        "iss": "https://portal.csoai.org",
        "sub": "sovereign-user-" + hashlib.sha256(code.encode()).hexdigest()[:16],
        "aud": client_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return {
        "access_token": access_token,
        "id_token": json.dumps(id_token_payload),  # In production: sign with Ed25519
        "token_type": "Bearer",
        "expires_in": 3600,
    }

if __name__ == "__main__":
    print(json.dumps(discover(), indent=2))
