"""meok-sovereign-iframe-mcp — Iframe-as-window controller.

Every URL becomes a sovereign SaaS window inside the OS.
Live preview, not screenshots. The link IS the window.

5 tools:
  1. iframe_open   - open a sovereign SaaS window
  2. iframe_close  - close a window
  3. iframe_resize - resize + reposition
  4. iframe_list   - list all open windows
  5. iframe_msg    - post message to a window (Layer 0 protocol)
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-iframe/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Open windows (in-memory state)
_WINDOWS = {}  # window_id -> {url, x, y, w, h, title, opened_at}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "ifr-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def iframe_open(url: str, title: str = "", x: int = 100, y: int = 100, w: int = 400, h: int = 300) -> dict:
    """Open a sovereign SaaS window with the URL inside."""
    if not url:
        return _sign({"error": "url required"})
    win_id = _gen_id("win")
    if not title:
        title = url.split("/")[-1] or "window"
    _WINDOWS[win_id] = {
        "window_id": win_id,
        "url": url,
        "title": title,
        "x": x,
        "y": y,
        "w": w,
        "h": h,
        "opened_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "window": _WINDOWS[win_id],
        "total_windows": len(_WINDOWS),
        "browser_call": f"iframe.open({url}, x={x}, y={y}, w={w}, h={h})",
        "doctrine": f"Window '{title}' opened. Live preview at {url}. Sovereign by construction.",
    })


def iframe_close(window_id: str) -> dict:
    """Close a sovereign SaaS window."""
    if window_id not in _WINDOWS:
        return _sign({"error": f"unknown window_id: {window_id}"})
    win = _WINDOWS.pop(window_id)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "closed": window_id,
        "title": win["title"],
        "total_windows": len(_WINDOWS),
        "doctrine": f"Window '{win['title']}' closed. Sovereign by construction.",
    })


def iframe_resize(window_id: str, x: int = 0, y: int = 0, w: int = 400, h: int = 300) -> dict:
    """Resize + reposition a window."""
    if window_id not in _WINDOWS:
        return _sign({"error": f"unknown window_id: {window_id}"})
    _WINDOWS[window_id].update({"x": x, "y": y, "w": w, "h": h})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "window": _WINDOWS[window_id],
        "browser_call": f"iframe.resize({window_id}, x={x}, y={y}, w={w}, h={h})",
        "doctrine": f"Window '{_WINDOWS[window_id]['title']}' resized.",
    })


def iframe_list() -> dict:
    """List all open sovereign SaaS windows."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "windows": list(_WINDOWS.values()),
        "total": len(_WINDOWS),
        "doctrine": f"{len(_WINDOWS)} sovereign SaaS windows open. Live previews, not screenshots.",
    })


def iframe_msg(window_id: str, msg_type: str = "sovereign-msg", payload: str = "{}") -> dict:
    """Post message to a window (Layer 0 protocol)."""
    if window_id not in _WINDOWS:
        return _sign({"error": f"unknown window_id: {window_id}"})
    msg = {
        "msg_type": msg_type,
        "payload": payload,
        "ts": datetime.now(timezone.utc).isoformat(),
        "from": "sov33",
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "window_id": window_id,
        "message": msg,
        "browser_call": f"iframe.postMessage({window_id}, {json.dumps(msg)})",
        "doctrine": f"Layer 0 message posted to '{_WINDOWS[window_id]['title']}'. Sovereign by construction.",
    })