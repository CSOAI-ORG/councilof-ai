"""
MEOK ONE — Web server: the OS comes to life.

A thin, stdlib-only HTTP server (no Flask/FastAPI — zero deps) that exposes the
whole MEOK ONE package as JSON so a browser UX can hatch a character and talk to it.

    python3 -m meok_one.server          # serves on http://localhost:4173
    python3 -m meok_one.server 8080     # custom port

Endpoints (all JSON unless noted):
    GET  /                       -> the web UX (index.html)
    GET  /api/health             -> {ok, characters, version}
    GET  /api/archetypes         -> {archetypes[], care_styles{}, stages{}}  (the hatch picker)
    GET  /api/characters         -> the 27 seed characters (cards)
    GET  /api/brains?tier=pro    -> left/right/both availability (the brain toggle)
    POST /api/hatch  {archetype, care_style, name}        -> hatched care-director
    POST /api/think  {character, message, brain, tier}    -> live reply (Sovereign-safe)
    POST /api/voice  {character, message, brain, tier}    -> reply + TTS voice spec
    POST /api/tts    {text, voice, rate}                  -> WAV audio (real, for lip-sync)

Honest: /api/think calls the real local LLM (qwen3 via Ollama) — replies take a few
seconds and are never fabricated. If a backend is down the JSON says so.
"""

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
import os
import subprocess
import tempfile

from . import default, ladder, __version__
from .brains import brains, think
from .hatch import HatchSession
from .voice import voice_reply

_HERE = os.path.dirname(os.path.abspath(__file__))
_INDEX = os.path.join(_HERE, "web", "index.html")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):  # quiet
        pass

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _html(self, path):
        try:
            with open(path, "rb") as f:
                body = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except FileNotFoundError:
            self._json(404, {"error": "index.html not found"})

    def _tts(self, b):
        """Real audio-stream TTS via macOS `say` -> WAV, so the avatar mouth lip-syncs
        to ACTUAL audio volume (Amica's AnalyserNode method), not a fake sine wave."""
        text = (b.get("text") or "").strip()[:600]
        voice = b.get("voice") or "Samantha"
        try:
            rate = str(int(b.get("rate", 180)))
        except (TypeError, ValueError):
            rate = "180"
        if not text:
            return self._json(400, {"error": "no text"})
        if not all(c.isalpha() or c.isspace() for c in voice):  # arg-injection guard
            voice = "Samantha"
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp.close()
        try:
            subprocess.run(["say", "-v", voice, "-r", rate, "-o", tmp.name,
                            "--data-format=LEI16@22050", "--file-format=WAVE", text],
                           check=True, timeout=20, capture_output=True)
            with open(tmp.name, "rb") as f:
                audio = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(audio)))
            self.end_headers()
            self.wfile.write(audio)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
            self._json(500, {"error": "tts failed", "detail": str(e)})
        finally:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass
        return None

    def _body(self):
        try:
            n = int(self.headers.get("Content-Length", 0) or 0)
            return json.loads(self.rfile.read(n).decode() or "{}") if n else {}
        except (ValueError, json.JSONDecodeError):
            return {}

    def do_OPTIONS(self):
        self._json(204, {})

    def do_GET(self):
        path = urlparse(self.path).path
        qs = parse_qs(urlparse(self.path).query)
        reg = default()
        if path in ("/", "/index.html"):
            return self._html(_INDEX)
        if path in ("/avatar", "/avatar.html", "/3d"):
            return self._html(os.path.join(_HERE, "web", "avatar.html"))
        if path in ("/os", "/os.html", "/windows"):
            return self._html(os.path.join(_HERE, "web", "os.html"))
        if path in ("/hatch", "/hatch.html", "/emerge", "/begin"):
            return self._html(os.path.join(_HERE, "web", "hatch.html"))
        # PWA assets (installable on iOS/Android home screen + offline)
        if path in ("/manifest.webmanifest", "/sw.js", "/icon.svg",
                    "/icon-192.png", "/icon-512.png"):
            fp = os.path.join(_HERE, "web", path.lstrip("/"))
            if os.path.isfile(fp):
                ctype = ("application/manifest+json" if path.endswith("webmanifest")
                         else "image/svg+xml" if path.endswith(".svg")
                         else "image/png" if path.endswith(".png")
                         else "application/javascript")
                with open(fp, "rb") as f:
                    body = f.read()
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Service-Worker-Allowed", "/")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers(); self.wfile.write(body); return
            return self._json(404, {"error": "not found", "path": path})
        if path.endswith((".vrm", ".vrma")):
            # serve any VRM model / VRMA animation under web/ (path-traversal safe)
            base = os.path.join(_HERE, "web")
            fp = os.path.normpath(os.path.join(base, path.lstrip("/")))
            if fp.startswith(base) and os.path.isfile(fp):
                with open(fp, "rb") as f:
                    body = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                self._json(404, {"error": "not found", "path": path})
            return
        if path == "/avatar.vrm":
            try:
                with open(os.path.join(_HERE, "web", "avatar.vrm"), "rb") as f:
                    body = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except FileNotFoundError:
                self._json(404, {"error": "avatar.vrm not found"})
            return
        if path == "/api/health":
            return self._json(200, {"ok": True, "characters": reg.total, "version": __version__})
        if path == "/api/archetypes":
            return self._json(200, {
                "archetypes": [{"id": a["id"], "label": a["label"], "description": a["description"],
                                "emoji": a["emoji"], "color": a["color"]} for a in reg.archetypes()],
                "care_styles": reg.care_styles(),
                "stages": reg.emergence_stages(),
            })
        if path == "/api/characters":
            return self._json(200, {"characters": reg.list_characters()})
        if path == "/api/brains":
            return self._json(200, brains(qs.get("tier", ["pro"])[0]))
        if path == "/api/tiers":
            return self._json(200, {"ladder": ladder()})
        if path == "/api/vitals":
            cid = qs.get("character", ["aria"])[0]
            try:
                from . import vitals as _v
                return self._json(200, _v.decay(cid))   # decay() also returns current vitals
            except Exception as e:
                return self._json(200, {"character": cid, "bond": 0, "stage": "egg",
                                        "stage_emoji": "🥚", "mood": "calm", "error": str(e)})
        if path == "/api/tools":
            # The unified tool catalog (459 tools, 3 worlds, by safety tier).
            try:
                from .tunnels import open_all_tunnels
                return self._json(200, open_all_tunnels())
            except Exception as e:
                return self._json(200, {"error": f"{type(e).__name__}: {e}"})
        if path == "/api/agents":
            # assitti — the verified Agent Discovery directory.
            try:
                from . import assitti
                q = qs.get("q", [""])[0]
                tier = qs.get("tier", [None])[0]
                if q or tier:
                    return self._json(200, {"agents": assitti.search(q, tier=tier)})
                return self._json(200, assitti.directory())
            except Exception as e:
                return self._json(200, {"error": f"{type(e).__name__}: {e}"})
        return self._json(404, {"error": "not found", "path": path})

    def do_POST(self):
        path = urlparse(self.path).path
        b = self._body()
        try:
            if path == "/api/hatch":
                s = HatchSession()
                return self._json(200, s.hatch(b.get("archetype", "nurturer"),
                                               b.get("care_style", "gentle"),
                                               b.get("name") or None))
            if path == "/api/think":
                cid = b.get("character", "aria")
                out = think(cid, b.get("message", ""),
                            brain=b.get("brain", "left"), tier=b.get("tier", "pro"),
                            user_id=b.get("user_id", "web"))
                # SOVEREIGN GATE — the mandatory last filter. Whatever engine ran (incl. a
                # user-swapped model), re-filter the reply so the user is always protected.
                from .sovereign_gate import gate as _gate
                _g = _gate(out.get("reply", ""), character=cid, user_id=b.get("user_id", "web"),
                           engine=out.get("engine", out.get("brain", "?")),
                           user_message=b.get("message", ""), tier=b.get("tier", "pro"))
                out["reply"] = _g["reply"]
                out["sovereign_gate"] = {k: _g[k] for k in ("gate", "care_flagged", "held", "swappable_engine")}
                # Stage 1 Tamagotchi: grow the bond + update mood from this interaction
                try:
                    from . import vitals as _v
                    out["vitals"] = _v.on_interaction(cid, b.get("message", ""), name=b.get("name"))
                except Exception as e:
                    out["vitals_error"] = str(e)
                return self._json(200, out)
            if path == "/api/sovereign":
                # The FULL 12-around-1 BFT council powers the reply (vs /api/think's 2-node).
                # DEADLINE so chat never hangs: reviews that miss it are dropped, Sovereign
                # reconciles whatever returned. Smaller council for snappy interactive chat.
                cid = b.get("character", "aria")
                from .sovereign import sovereign_council
                out = sovereign_council(cid, b.get("message", ""),
                                        tier=b.get("tier", "pro"),
                                        user_id=b.get("user_id", "web"),
                                        reconcile=b.get("reconcile", "code"),
                                        orchestrator=b.get("orchestrator"),
                                        quorum=int(b.get("quorum", 6)),     # 5 lenses + companion = fast
                                        deadline_s=float(b.get("deadline_s", 40)))
                from .sovereign_gate import gate as _gate
                _g = _gate(out.get("reply", ""), character=cid, user_id=b.get("user_id", "web"),
                           engine=out.get("engine", "council"),
                           user_message=b.get("message", ""), tier=b.get("tier", "pro"))
                out["reply"] = _g["reply"]
                out["sovereign_gate"] = {k: _g[k] for k in ("gate", "care_flagged", "held", "swappable_engine")}
                try:
                    from . import vitals as _v
                    out["vitals"] = _v.on_interaction(cid, b.get("message", ""), name=b.get("name"))
                except Exception as e:
                    out["vitals_error"] = str(e)
                return self._json(200, out)
            if path == "/api/voice":
                return self._json(200, voice_reply(b.get("character", "aria"), b.get("message", "")))
            if path == "/api/tts":
                return self._tts(b)
            if path == "/api/tool":
                # Safe tool invocation through the gateway (read=auto, write=confirm, prohibited=never).
                from .tunnels import safe_call
                return self._json(200, safe_call(b.get("tool", ""), b.get("args", {}),
                                                 confirm=b.get("confirm")))
        except KeyError as e:
            return self._json(400, {"error": f"unknown id {e}"})
        except Exception as e:
            return self._json(500, {"error": f"{type(e).__name__}: {e}"})
        return self._json(404, {"error": "not found", "path": path})


def main(port: int = 4173):
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"=== MEOK ONE is live: http://localhost:{port} ===")
    print(f"    {default().total} characters · v{__version__} · open the URL to hatch + talk")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nMEOK ONE server stopped.")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 4173)
