"""Current-request Hugging Face identity for opt-in conversation snapshots.

No saved identity, profile, username, session hash, ambient account token or
successful earlier check is an authority for a later operation.
"""
from __future__ import annotations
import hashlib
import math
import re
import time

import gradio as gr
from huggingface_hub import HfApi

HF_ENDPOINT = "https://huggingface.co"


class MemoryAuthError(ValueError):
    pass


def _current_token(oauth_token, request):
    expires_at = None
    if oauth_token is not None:
        if not isinstance(oauth_token, gr.OAuthToken):
            raise MemoryAuthError("Sign in with Hugging Face before using saved copies.")
        expires_at = oauth_token.expires_at
        if (type(expires_at) not in (int, float) or not math.isfinite(expires_at)
                or expires_at <= time.time()):
            raise MemoryAuthError("Your Hugging Face sign-in has expired. Sign in again.")
        token = oauth_token.token
    else:
        # This is the server-injected request, never a UI field or stored state.
        if not isinstance(request, gr.Request):
            raise MemoryAuthError("Sign in with Hugging Face before using saved copies.")
        headers = getattr(request, "headers", {})
        authorization = headers.get("authorization", headers.get("Authorization", ""))
        match = re.fullmatch(r"Bearer ([A-Za-z0-9._~+/-]+=*)", authorization, re.I) if isinstance(authorization, str) else None
        if match is None:
            raise MemoryAuthError("Sign in with Hugging Face before using saved copies.")
        token = match.group(1)
    if (not isinstance(token, str) or not 1 <= len(token) <= 8192
            or re.fullmatch(r"[A-Za-z0-9._~+/-]+=*", token) is None):
        raise MemoryAuthError("Hugging Face authentication was not valid. Sign in again.")
    return token, expires_at


def verified_owner(oauth_token=None, request=None):
    """Return only an opaque owner key after a fresh Hub check, on every call."""
    token, expires_at = _current_token(oauth_token, request)
    try:
        # Explicit token: do not fall back to HF_TOKEN, the account cache or a
        # Space owner's credential. cache=False also detects token revocation.
        profile = HfApi(endpoint=HF_ENDPOINT).whoami(token=token, cache=False)
    except Exception:
        raise MemoryAuthError(
            "Hugging Face could not verify this sign-in. No saved-copy operation "
            "was performed. Sign in again or retry when the service is available."
        ) from None
    if expires_at is not None and expires_at <= time.time():
        raise MemoryAuthError("Your Hugging Face sign-in has expired. Sign in again.")
    subject = profile.get("id") if isinstance(profile, dict) else None
    if (not isinstance(profile, dict) or profile.get("type") != "user"
            or not isinstance(subject, str)
            or re.fullmatch(r"[A-Za-z0-9_-]{1,128}", subject) is None):
        raise MemoryAuthError("Hugging Face did not return a verified personal identity.")
    return hashlib.sha256(("meok.hf-owner/1\0" + subject).encode("utf-8")).hexdigest()
