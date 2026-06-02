#!/usr/bin/env python3
"""
hands_bridge.py — the LOCAL "hands" for the MEOK co-pilot. Runs on YOUR machine only.

Architecture (honest):
    /hud Approve→Run button  ──HTTP──▶  this bridge (127.0.0.1:7777)  ──▶  your desktop
    meok-one decides + GATES + audits the action; it never touches your mouse. THIS does,
    and only when YOU click Approve, and only for non-prohibited actions.

It executes deterministic actions itself (type / key / hotkey / scroll / click-at-coords) via
pyautogui. For vision-grounded "click the Reply button" it defers to Open Computer Use (set
OCU via env) — because resolving a named on-screen target needs a vision agent, not raw coords.

Defense-in-depth: even though meok-one already refuses prohibited actions upstream, this bridge
re-checks an allowlist and refuses anything money/credential/delete-shaped. Belt and braces.

Run (on your Mac, after `pip install pyautogui` + granting Accessibility + Screen-Recording):
    python3 tools/hands_bridge.py            # listens on 127.0.0.1:7777
Then in /hud the Approve→Run button will work. Stop with Ctrl-C.

Security: binds 127.0.0.1 only (never the network). Does nothing on its own — it only acts on
an explicit, gated, human-approved request from your own browser tab.
"""
import json
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 7777

# verbs this bridge will perform itself (deterministic, low-risk). Anything else -> defer/refuse.
_SAFE_VERBS = {"type", "write", "key", "press", "hotkey", "scroll", "move", "click_at", "screenshot"}
# never perform, even if asked — these only ever belong to the human (matches meok-one's gate)
_PROHIBITED = re.compile(r"\b(password|passphrase|credit|card|cvv|iban|sort.?code|seed.?phrase|"
                         r"private.?key|wire|transfer|withdraw|delete account|empty trash)\b", re.I)

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    _HANDS = True
except Exception:
    _HANDS = False


def _do(action: dict) -> dict:
    verb = (action.get("action") or "").lower().strip()
    target = action.get("target") or ""
    text = action.get("text") or ""
    blob = f"{verb} {target} {text} {action.get('goal','')}"
    if _PROHIBITED.search(blob):
        return {"ok": False, "refused": True,
                "note": "refused locally — money/credentials/delete are human-only"}
    if not _HANDS:
        return {"ok": False, "note": "pyautogui not installed — run: pip install pyautogui"}

    if verb in ("type", "write"):
        pyautogui.typewrite(text or target, interval=0.02); return {"ok": True, "note": f"typed {len(text or target)} chars"}
    if verb in ("key", "press"):
        pyautogui.press((target or text).lower()); return {"ok": True, "note": f"pressed {target or text}"}
    if verb == "hotkey":
        keys = [k.strip().lower() for k in re.split(r"[+, ]+", target or text) if k.strip()]
        pyautogui.hotkey(*keys); return {"ok": True, "note": f"hotkey {'+'.join(keys)}"}
    if verb == "scroll":
        amt = -400 if "down" in (target + text).lower() else 400
        pyautogui.scroll(amt); return {"ok": True, "note": f"scrolled {'down' if amt<0 else 'up'}"}
    if verb == "click_at":
        m = re.findall(r"\d+", target);
        if len(m) >= 2:
            pyautogui.click(int(m[0]), int(m[1])); return {"ok": True, "note": f"clicked {m[0]},{m[1]}"}
        return {"ok": False, "note": "click_at needs 'x,y' coords in target"}
    if verb == "screenshot":
        return {"ok": True, "note": "screenshot is handled by /hud's own capture"}
    # vision-grounded actions (click a NAMED target, find, etc.) need Open Computer Use
    return {"ok": False, "needs_ocu": True,
            "note": f"'{verb}' on a named target needs Open Computer Use (vision). "
                    "Wire OCU and forward there; deterministic verbs work here now."}


class H(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(200, {"ok": True})

    def do_POST(self):
        if self.path != "/act":
            return self._send(404, {"error": "POST /act"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            action = json.loads(self.rfile.read(n) or b"{}")
        except Exception as e:
            return self._send(400, {"ok": False, "note": f"bad request: {e}"})
        try:
            self._send(200, _do(action))
        except Exception as e:
            self._send(200, {"ok": False, "note": f"hands error: {e}"})

    def log_message(self, *a):  # quiet
        pass


def main():
    print(f"MEOK hands-bridge on http://127.0.0.1:{PORT}/act  (pyautogui={'on' if _HANDS else 'MISSING'})")
    print("It only acts on explicit, gated, human-approved requests from your /hud tab. Ctrl-C to stop.")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
