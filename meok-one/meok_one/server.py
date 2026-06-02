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
from . import auth
from .brains import brains, think
from .hatch import HatchSession
from .voice import voice_reply

_HERE = os.path.dirname(os.path.abspath(__file__))
_INDEX = os.path.join(_HERE, "web", "index.html")


_VISION_PROMPT = ("Reply with ONLY this, no preamble or thinking: one short sentence describing the "
                  "screen, then ' — ' and a comma-separated list of the key UI elements.")


def _classify_action(action: str, target: str = "", text: str = "", context: str = "") -> str:
    """Gate a co-pilot desktop action: read (auto) / write (confirm) / prohibited (refused).
    Observing is always safe. For ACTING (click/type/key), the danger is in the INTENT, not the
    bare verb ("click Confirm" can be a money transfer) — so prohibited is checked over the action
    AND the goal+scene context (anything touching money / credentials / purchases / account deletion)."""
    if action.lower() in ("observe", "read", "screenshot", "look", "wait", "none", "done"):
        return "read"
    from . import tool_gateway as _gw
    blob = f"{action} {target} {text} {context}".lower()
    if (_gw.classify(blob.replace(" ", "_")) == "prohibited"
            or any(k in blob for k in ("password", "credential", "payment", "credit card", "bank",
                                       "delete account", "buy now", "purchase", "checkout", "pay ",
                                       "wire", "transfer", "send money", "account number", "ssn",
                                       "card number", "withdraw", "deposit", "invoice", "crypto", "wallet"))):
        return "prohibited"
    return "write"   # click / type / scroll / key / drag — needs explicit human confirm


def _parse_vision(txt: str):
    """A vision model's free text → (scene, objects). Small models ignore rigid formats, so we
    take the description itself as the scene + loosely grab any comma list."""
    txt = (txt or "").strip()
    if not txt:
        return (None, [])
    flat = " ".join(txt.split())
    scene = flat[:200]
    tail = flat.split(".", 1)[1] if "." in flat else flat
    objs = [o.strip(" .").lower()[:40] for o in tail.split(",") if 1 < len(o.strip()) < 41][:10]
    return (scene, objs)


def _ollama_vision(image_b64: str, model: str, timeout: int = 90):
    """LOCAL Ollama vision (sovereign, no key). moondream (~3s CPU) / gemma3:4b·gemma4 (GPU)."""
    import urllib.request as _u
    host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    payload = {"model": model, "prompt": _VISION_PROMPT, "images": [image_b64], "stream": False,
               "options": {"num_predict": 120, "temperature": 0.2}}
    try:
        req = _u.Request(host + "/api/generate", data=json.dumps(payload).encode(),
                         headers={"Content-Type": "application/json"})
        with _u.urlopen(req, timeout=timeout) as r:
            return _parse_vision(json.loads(r.read().decode()).get("response", ""))
    except Exception:
        return (None, [])


def _cloud_vision(image_b64: str, model: str, timeout: int = 50):
    """CLOUD vision via OpenRouter (e.g. stepfun/step-3.7-flash — text+image+video). Reuses our key."""
    import urllib.request as _u
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        return (None, [])
    # step3.7 is a REASONING model — give room for content + keep reasoning low, and fall back to
    # the reasoning text if content lands null (it puts the answer there when tokens run short).
    body = json.dumps({"model": model, "max_tokens": 400, "reasoning": {"effort": "low"}, "messages": [
        {"role": "user", "content": [
            {"type": "text", "text": _VISION_PROMPT},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + image_b64}}]}]}).encode()
    try:
        req = _u.Request("https://openrouter.ai/api/v1/chat/completions", data=body,
                         headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                                  "HTTP-Referer": "https://meok.ai", "X-Title": "MEOK ONE"})
        with _u.urlopen(req, timeout=timeout) as r:
            msg = json.loads(r.read().decode())["choices"][0]["message"]
            return _parse_vision(msg.get("content") or msg.get("reasoning") or "")
    except Exception:
        return (None, [])


def _vision_describe(image_b64: str, model: str = None):
    """Pluggable screen-vision: local Ollama by default (moondream); a "/"-slug routes to OpenRouter
    cloud (step3.7). Same SIGIL→memory→audit pipeline downstream. Returns (scene, objects)."""
    model = model or os.environ.get("MEOK_VISION_MODEL", "moondream")
    return _cloud_vision(image_b64, model) if "/" in model else _ollama_vision(image_b64, model)

# Deep-think council default (benchmark 2026-06-01, MEOK_COUNCIL_BENCHMARK):
#  - code-reconcile NEVER error-corrects (votes but keeps the draft); llm-reconcile DOES (it
#    synthesizes a corrected answer from the lens critiques — lifted a weak draft to correct).
#  - local-Ollama lenses time out on the CPU VM, so the deployed council uses a fast CLOUD roster.
#  TURBO (2026-06-01 research): lenses pinned to Groq (~0.5s each, verified). Use only fast
#  NON-reasoning models — reasoning models (gpt-oss/qwen3) burn the 96-tok cap on hidden thinking
#  and return empty. Synthesis stays on Opus (reliable quality; conditional + falls back via
#  allow_fallbacks). Override orchestrator="turbo-llama70" for a faster (jittery) all-Groq path.
_COUNCIL_ROSTER = ["turbo-llama70", "turbo-llama4s", "turbo-llama8", "turbo-llama4s", "turbo-llama8"]
_COUNCIL_PROVIDER = ["Groq", "Cerebras"]


_VISION_PROMPT = ("Reply with ONLY this, no preamble or thinking: one short sentence describing the "
                  "screen, then ' — ' and a comma-separated list of the key UI elements.")


def _classify_action(action: str, target: str = "", text: str = "", context: str = "") -> str:
    """Gate a co-pilot desktop action: read (auto) / write (confirm) / prohibited (refused).
    Observing is always safe. For ACTING (click/type/key), the danger is in the INTENT, not the
    bare verb ("click Confirm" can be a money transfer) — so prohibited is checked over the action
    AND the goal+scene context (anything touching money / credentials / purchases / account deletion)."""
    if action.lower() in ("observe", "read", "screenshot", "look", "wait", "none", "done"):
        return "read"
    from . import tool_gateway as _gw
    blob = f"{action} {target} {text} {context}".lower()
    if (_gw.classify(blob.replace(" ", "_")) == "prohibited"
            or any(k in blob for k in ("password", "credential", "payment", "credit card", "bank",
                                       "delete account", "buy now", "purchase", "checkout", "pay ",
                                       "wire", "transfer", "send money", "account number", "ssn",
                                       "card number", "withdraw", "deposit", "invoice", "crypto", "wallet"))):
        return "prohibited"
    return "write"   # click / type / scroll / key / drag — needs explicit human confirm


def _parse_vision(txt: str):
    """A vision model's free text → (scene, objects). Small models ignore rigid formats, so we
    take the description itself as the scene + loosely grab any comma list."""
    txt = (txt or "").strip()
    if not txt:
        return (None, [])
    flat = " ".join(txt.split())
    scene = flat[:200]
    tail = flat.split(".", 1)[1] if "." in flat else flat
    objs = [o.strip(" .").lower()[:40] for o in tail.split(",") if 1 < len(o.strip()) < 41][:10]
    return (scene, objs)


def _ollama_vision(image_b64: str, model: str, timeout: int = 90):
    """LOCAL Ollama vision (sovereign, no key). moondream (~3s CPU) / gemma3:4b·gemma4 (GPU)."""
    import urllib.request as _u
    host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    payload = {"model": model, "prompt": _VISION_PROMPT, "images": [image_b64], "stream": False,
               "options": {"num_predict": 120, "temperature": 0.2}}
    try:
        req = _u.Request(host + "/api/generate", data=json.dumps(payload).encode(),
                         headers={"Content-Type": "application/json"})
        with _u.urlopen(req, timeout=timeout) as r:
            return _parse_vision(json.loads(r.read().decode()).get("response", ""))
    except Exception:
        return (None, [])


def _cloud_vision(image_b64: str, model: str, timeout: int = 50):
    """CLOUD vision via OpenRouter (e.g. stepfun/step-3.7-flash — text+image+video). Reuses our key."""
    import urllib.request as _u
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        return (None, [])
    # step3.7 is a REASONING model — give room for content + keep reasoning low, and fall back to
    # the reasoning text if content lands null (it puts the answer there when tokens run short).
    body = json.dumps({"model": model, "max_tokens": 400, "reasoning": {"effort": "low"}, "messages": [
        {"role": "user", "content": [
            {"type": "text", "text": _VISION_PROMPT},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + image_b64}}]}]}).encode()
    try:
        req = _u.Request("https://openrouter.ai/api/v1/chat/completions", data=body,
                         headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                                  "HTTP-Referer": "https://meok.ai", "X-Title": "MEOK ONE"})
        with _u.urlopen(req, timeout=timeout) as r:
            msg = json.loads(r.read().decode())["choices"][0]["message"]
            return _parse_vision(msg.get("content") or msg.get("reasoning") or "")
    except Exception:
        return (None, [])


def _vision_describe(image_b64: str, model: str = None):
    """Pluggable screen-vision: local Ollama by default (moondream); a "/"-slug routes to OpenRouter
    cloud (step3.7). Same SIGIL→memory→audit pipeline downstream. Returns (scene, objects)."""
    model = model or os.environ.get("MEOK_VISION_MODEL", "moondream")
    return _cloud_vision(image_b64, model) if "/" in model else _ollama_vision(image_b64, model)

# Deep-think council default (benchmark 2026-06-01, MEOK_COUNCIL_BENCHMARK):
#  - code-reconcile NEVER error-corrects (votes but keeps the draft); llm-reconcile DOES (it
#    synthesizes a corrected answer from the lens critiques — lifted a weak draft to correct).
#  - local-Ollama lenses time out on the CPU VM, so the deployed council uses a fast CLOUD roster.
#  TURBO (2026-06-01 research): lenses pinned to Groq (~0.5s each, verified). Use only fast
#  NON-reasoning models — reasoning models (gpt-oss/qwen3) burn the 96-tok cap on hidden thinking
#  and return empty. Synthesis stays on Opus (reliable quality; conditional + falls back via
#  allow_fallbacks). Override orchestrator="turbo-llama70" for a faster (jittery) all-Groq path.
_COUNCIL_ROSTER = ["turbo-llama70", "turbo-llama4s", "turbo-llama8", "turbo-llama4s", "turbo-llama8"]
_COUNCIL_PROVIDER = ["Groq", "Cerebras"]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):  # quiet
        pass

    def _uid(self, body=None):
        """Resolve the user from the Bearer token (cross-device identity). Falls back to a
        body-supplied user_id, then 'web', so unauthenticated calls still work (anonymous)."""
        a = self.headers.get("Authorization", "")
        if a.startswith("Bearer "):
            p = auth.verify_token(a[7:].strip())
            if p and p.get("sub"):
                return p["sub"]
        return (body or {}).get("user_id", "web")

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
        if path in ("/dome", "/dome.html", "/world", "/map"):
            return self._html(os.path.join(_HERE, "web", "dome.html"))
        if path in ("/hud", "/hud.html", "/overlay"):
            return self._html(os.path.join(_HERE, "web", "hud.html"))
        if path in ("/law", "/law.html", "/meoklaw", "/compliance"):
            return self._html(os.path.join(_HERE, "web", "law.html"))
        if path in ("/pricing", "/pricing.html", "/plans", "/upgrade"):
            return self._html(os.path.join(_HERE, "web", "pricing.html"))
        if path in ("/work", "/work.html", "/services", "/hire", "/consulting"):
            return self._html(os.path.join(_HERE, "web", "work.html"))
        if path in ("/siri", "/siri.html", "/shortcut"):
            return self._html(os.path.join(_HERE, "web", "siri.html"))
        if path in ("/widget", "/widget.html"):
            return self._html(os.path.join(_HERE, "web", "widget.html"))
        if path in ("/embed", "/embed.html"):
            return self._html(os.path.join(_HERE, "web", "embed.html"))
        if path in ("/registry", "/registry.html", "/verified"):
            return self._html(os.path.join(_HERE, "web", "registry.html"))
        # PWA assets (installable on iOS/Android home screen + offline)
        if path in ("/manifest.webmanifest", "/sw.js", "/icon.svg",
                    "/icon-192.png", "/icon-512.png", "/embed.js"):
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
        if path == "/api/factory/preview":
            # Mint WITHOUT persisting — powers the live glass-egg preview in the factory,
            # so what you SEE before you commit is exactly what you'll get (same mint()).
            from . import factory as _factory
            try:
                char = _factory.mint(qs.get("archetype", ["nurturer"])[0],
                                     qs.get("care_style", ["gentle"])[0],
                                     (qs.get("name", [""])[0] or "").strip() or None)
            except KeyError as e:
                return self._json(400, {"error": str(e)})
            return self._json(200, {"character": char})
        if path == "/api/sigil/recent":
            # the live, hash-chained agent-decision audit trail (gloss + receipts)
            from . import sigil as _sigil
            n = int(qs.get("n", ["50"])[0] or 50)
            return self._json(200, {"records": _sigil.recent(n), "chain": _sigil.verify_chain()})
        if path == "/api/sigil/verify":
            from . import sigil as _sigil
            return self._json(200, _sigil.verify_chain())
        if path == "/api/sigil/manifest":
            from . import sigil as _sigil
            return self._json(200, {"opcodes": _sigil.manifest()})
        if path == "/api/sigil/gloss":
            from . import sigil as _sigil
            line = qs.get("line", [""])[0]
            return self._json(200, {"line": line, "gloss": _sigil.gloss(line)})
        if path == "/api/products":
            # MEOK products bridged into the DOME — the geospatial product constellation
            # (map nodes + cosmos planets the user can fly to / open / ask their AI about).
            from . import products as _products
            return self._json(200, _products.products())
        if path == "/api/pricing":
            # Consumer pricing for MEOK ONE (the B2C product) — data-driven from tiers.py so it
            # never drifts from the real ladder. Brand-clean: separate from the CSOAI compliance line.
            from . import tiers as _t
            _CTA = {"local": ("Get the code", "link", "/os"),
                    "free": ("Start free", "link", "/hatch"),
                    "pro": ("Upgrade to Pro", "checkout", ""),
                    "enterprise": ("Contact us", "contact", "")}
            _FEAT = {
                "local": ["All 27 characters (on your machine)", "Your own LLM (Ollama) — fully private",
                          "Hash-chained audit trail", "Open source · £0 forever"],
                "free": ["1 hatched character", "Cross-device memory", "50 messages/day", "Free, hosted"],
                "pro": ["All 27 characters", "Full cross-device memory", "2,000 messages/day",
                        "Signed attestation on export"],
                "enterprise": ["Everything in Pro", "RegGeoInt compliance map",
                               "Full audit trail + SLA", "Custom characters"]}
            cards = []
            for tid in ("local", "free", "pro", "enterprise"):
                t = _t.TIERS[tid]; cta, kind, href = _CTA[tid]
                pm = t.price_gbp_month or 0
                cards.append({"id": tid, "label": t.label.split(" (")[0], "who": t.who,
                              "price": ("£0" if pm == 0 else f"£{pm:.0f}"),
                              "price_sub": ("self-host" if tid == "local" else
                                            "forever" if pm == 0 else "/month"),
                              "features": _FEAT[tid], "cta": cta, "cta_kind": kind, "href": href,
                              "featured": tid == "pro"})
            return self._json(200, {"cards": cards, "currency": "GBP"})
        if path == "/api/checkout":
            # Returns the Stripe checkout URL for a paid tier from env (NEVER hardcoded/guessed —
            # the payment link is created in Stripe by the owner and supplied via env).
            tier = (qs.get("tier", ["pro"])[0] or "pro").strip()
            env_key = {"pro": "MEOK_PRO_CHECKOUT_URL", "enterprise": "MEOK_ENTERPRISE_CHECKOUT_URL"}.get(tier, "")
            url = (os.environ.get(env_key, "").strip() if env_key else "")
            return self._json(200, {"tier": tier, "url": url or None, "configured": bool(url)})
        if path == "/api/law":
            # MEOK LAW — the capability map: frameworks, regions, crosswalk MCPs, honest coverage.
            from . import law as _law
            return self._json(200, _law.overview())
        if path == "/api/law/applicable":
            # "Which rules apply to me, here?" — region + entity -> binding/advisory + obligations.
            from . import law as _law
            return self._json(200, _law.applicable(qs.get("region", ["GLOBAL"])[0],
                                                    qs.get("entity", ["ai_agent"])[0]))
        if path == "/api/law/crosswalk":
            # "What happens when I cross a border?" — re-map charter obligations via the CSOAI pivot.
            from . import law as _law
            return self._json(200, _law.crosswalk(qs.get("from", ["EU"])[0],
                                                   qs.get("to", ["US"])[0]))
        if path == "/api/law/contract":
            # the portable 'AI social contract' an agent carries across regions (charter-bound).
            from . import law as _law
            return self._json(200, _law.social_contract(qs.get("entity", ["ai_agent"])[0],
                                                         qs.get("region", ["GLOBAL"])[0]))
        if path == "/api/law/agents":
            # the tracked registry — every entity registered under MEOK LAW.
            from . import law as _law
            return self._json(200, _law.agents(int(qs.get("limit", ["100"])[0] or 100)))
        if path == "/api/forecast":
            # Predictive small→large: forecast intent from a PARTIAL typed input. If the small
            # model can resolve it (trivial), it answers here; else route='large' = wake council.
            from . import forecast as _fc
            return self._json(200, _fc.forecast(qs.get("partial", [""])[0],
                                                tier=qs.get("tier", ["pro"])[0]))
        if path == "/api/sbt/status":
            from . import sbt as _sbt
            return self._json(200, _sbt.status())
        if path == "/api/sbt/mint-intent":
            # Build the soulbound mint INTENT for a character (off-chain; never mints).
            from . import sbt as _sbt
            cid = (qs.get("id", [""])[0] or "").strip()
            owner = (qs.get("owner", [""])[0] or "").strip() or None
            char = None
            try:
                char = dict(reg.get(cid))
            except KeyError:
                _u = self._uid()
                for r in (auth.list_characters(_u) if auth.user_exists(_u) else []):
                    if r.get("id") == cid:
                        char = r
                        break
            if not char:
                return self._json(404, {"error": f"unknown character {cid!r}"})
            return self._json(200, _sbt.mint_intent(char, owner_pubkey=owner))
        if path == "/api/governance":
            # The HONEST live governance posture — what actually keeps every DOME agent in
            # harmony (the antidote to ungoverned simulated-town chaos). All derived from the
            # real modules; numbers reflect the RUNNING config (12-around-1, not the 33-node spec).
            gov = {}
            try:
                from . import sovereign as _sov
                lenses = _sov._load_lenses()
                safety = [l["id"] for l in lenses if l.get("is_safety")]
                voters = len(lenses) + 1   # 11 lenses + companion draft; orchestrator reconciles
                gov["council"] = {
                    "shape": "12-around-1 BFT-of-MoEs",
                    "lenses": len(lenses), "companion": 1, "orchestrator": 1,
                    "voters": voters, "byzantine_f": max(0, (voters - 1) // 3),
                    "safety_lenses": safety,
                    "rule": "safety lenses VETO; quality is a vote over the SAFE set",
                }
            except Exception as e:
                gov["council"] = {"error": f"{type(e).__name__}: {e}"}
            gov["gate"] = {"active": True,
                           "order": ["care membrane (crisis → real help)", "hard-unsafe veto",
                                     "capability-leak strip", "persona seal"],
                           "rule": "crisis wins over everything; every engine's reply is re-filtered"}
            try:
                from .tunnels import open_all_tunnels
                t = open_all_tunnels(); st = t.get("safety_tiers", {})
                gov["tools"] = {"total": t.get("total_tools"), "read_auto": st.get("read"),
                                "write_confirm": st.get("write"),
                                "prohibited": "refused on sight (money/creds/access/delete) — never registered",
                                "guarantee": t.get("guarantee")}
            except Exception as e:
                gov["tools"] = {"error": f"{type(e).__name__}: {e}"}
            gov["care_bond"] = {"active": True, "source": "Maternal Covenant",
                                "behavior": "deterministic crisis floor → escalate to a human, never restrict"}
            gov["charter"] = {"name": "Partnership Charter", "articles": 52,
                              "anchor": "Art. 1 — the Maternal Covenant"}
            gov["thesis"] = ("The simulated towns proved the danger; the DOME proves the cure — "
                             "agents live under a Partnership Charter + care bond enforced by real code.")
            return self._json(200, gov)
        if path == "/api/character":
            # Full record for one character (detail card): traits, voice, domain, backstory.
            cid = (qs.get("id", [""])[0] or "").strip()
            try:
                c = dict(reg.get(cid))   # copy; don't mutate the registry
                # consistent contract: every character carries top-level emoji + color
                # (seeds nest them under visual.*; minted already expose them top-level)
                c.setdefault("emoji", (c.get("visual") or {}).get("emoji"))
                c.setdefault("color", (c.get("visual") or {}).get("color_primary"))
                return self._json(200, {"character": c})
            except KeyError:
                # minted (gen_*) — rebuild the full record from this user's roster entry,
                # which keeps (archetype, care_style, name) → re-mint is deterministic (same id).
                _u = self._uid()
                for r in (auth.list_characters(_u) if auth.user_exists(_u) else []):
                    if r.get("id") == cid:
                        from . import factory as _factory
                        try:
                            full = _factory.mint(r.get("archetype", "nurturer"),
                                                 r.get("care_style", "gentle"), r.get("name"))
                            return self._json(200, {"character": full})
                        except Exception:
                            return self._json(200, {"character": r})   # trimmed fallback
                return self._json(404, {"error": f"unknown character {cid!r}"})
        if path == "/api/characters":
            chars = reg.list_characters()
            _u = self._uid()   # include this user's Character-Factory creations
            if auth.user_exists(_u):
                chars = chars + auth.list_characters(_u)
            return self._json(200, {"characters": chars})
        if path == "/api/brains":
            return self._json(200, brains(qs.get("tier", ["pro"])[0]))
        if path == "/api/tiers":
            return self._json(200, {"ladder": ladder()})
        if path == "/api/marketplace":
            # The honest creator economy (off-chain v1). Ownership today = your per-user roster;
            # SBT-on-Solana is designed but Nick-authorized (see MEOK_EARNINGS_SBT_DESIGN).
            _u = self._uid()
            owned = len([c for c in (auth.list_characters(_u) if auth.user_exists(_u) else [])
                         if str(c.get("id", "")).startswith("gen_")])
            return self._json(200, {
                "split": {"creator": 70, "platform": 30},
                "ownership": {"today": "per-user roster — yours across devices via SOV3",
                              "onchain": "SBT (soulbound) on Solana — designed, pending authorization",
                              "badge": "✦ Yours forever · SBT-ready"},
                "you": {"owned": owned},
                "flow": ["free hatch", "buy pre-made", "hatch custom (paid, resellable)", "resell → keep 70%"],
                "sellable": ["custom characters", "skins / themes", "MCP tools", "compliance packs"],
                "settlement": "Stripe (fiat) for v1 — no crypto on the critical path",
                "tiers": ladder(),
            })
        if path == "/api/vitals":
            cid = qs.get("character", ["aria"])[0]
            try:
                from . import vitals as _v
                return self._json(200, _v.decay(cid, self._uid()))  # decay() also returns current vitals
            except Exception as e:
                return self._json(200, {"character": cid, "bond": 0, "stage": "egg",
                                        "stage_emoji": "🥚", "mood": "calm", "error": str(e)})
        if path == "/api/auth/me":
            uid = self._uid()
            return self._json(200, auth.me(uid) if auth.user_exists(uid)
                              else {"user_id": None, "anon": True})
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
                d = assitti.directory()
                # also surface the REAL council nodes that review every reply (12-around-1)
                try:
                    from .sovereign import _load_lenses
                    d["council"] = [{"id": l["id"], "focus": l["focus"], "is_safety": l["is_safety"]}
                                    for l in _load_lenses()]
                except Exception:
                    d["council"] = []
                return self._json(200, d)
            except Exception as e:
                return self._json(200, {"error": f"{type(e).__name__}: {e}"})
        return self._json(404, {"error": "not found", "path": path})

    def do_POST(self):
        path = urlparse(self.path).path
        b = self._body()
        uid = self._uid(b)   # cross-device identity (Bearer token → user_id; else 'web')
        try:
            # ---- passwordless cross-device identity ----
            if path == "/api/auth/anon":
                return self._json(200, auth.create_anon())           # just-start: durable account
            if path == "/api/auth/link/start":
                if not auth.user_exists(uid):
                    return self._json(401, {"error": "sign in on this device first"})
                return self._json(200, auth.start_pair(uid))          # mint a pair code
            if path == "/api/auth/link/claim":
                return self._json(200, auth.claim_pair(b.get("code", "")))  # claim on a new device
            if path == "/api/auth/email":
                if not auth.user_exists(uid):
                    return self._json(401, {"error": "no account"})
                return self._json(200, auth.attach_email(uid, b.get("email", "")))
            if path == "/api/hatch":
                s = HatchSession()
                return self._json(200, s.hatch(b.get("archetype", "nurturer"),
                                               b.get("care_style", "gentle"),
                                               b.get("name") or None))
            if path == "/api/factory":
                # Character Factory: mint a NEW character (archetype × care-style × name) and
                # persist it to THIS user's roster, so it lives in their OS + DOME world forever.
                from . import factory as _factory
                try:
                    char = _factory.mint(b.get("archetype", "nurturer"),
                                         b.get("care_style", "gentle"), b.get("name") or None)
                except KeyError as e:
                    return self._json(400, {"error": str(e)})
                saved = auth.add_character(uid, char) if auth.user_exists(uid) else {"ok": False}
                return self._json(200, {"character": char, "created": True, "roster": saved.get("count")})
            if path == "/api/law/register":
                # MEOK LAW — bind an agent/robot/business to the CSOAI charter + care bond.
                # Returns a tamper-evident, SIGIL-audited certificate. Registration + tracking
                # only — it never grants powers or touches money/credentials/deletion.
                from . import law as _law
                return self._json(200, _law.register({
                    "name": b.get("name") or b.get("entity") or "",
                    "type": b.get("type") or "ai_agent",
                    "region": b.get("region") or "GLOBAL",
                    "operator": b.get("operator") or "",
                }))
            if path == "/api/forecast":
                # predictive small→large from a partial input (POST form for longer text)
                from . import forecast as _fc
                return self._json(200, _fc.forecast(b.get("partial") or b.get("text") or "",
                                                    tier=b.get("tier") or "pro"))
            if path == "/api/factory/suggest":
                # "Describe your AI in words" → the openclaw multi-LLM substrate proposes a
                # {archetype, care_style, name} the user can tweak. LLM-first; ALWAYS falls back
                # to a keyword heuristic so a valid character is returned even fully offline.
                from . import factory as _factory
                desc = (b.get("description") or b.get("text") or "").strip()
                archs = list(_factory._ARCHETYPES.keys())
                cares = list(_factory._CARE.keys())
                pick = {"archetype": None, "care_style": None, "name": None, "via": "heuristic"}
                if desc:
                    try:
                        from . import router as _router
                        prompt = (
                            "You design AI companions. Map the description to EXACTLY one archetype "
                            "and one care_style from the lists, and invent one evocative one-word NAME.\n"
                            f"archetypes = {archs}\ncare_styles = {cares}\n"
                            f'description = "{desc[:400]}"\n'
                            'Reply with ONLY compact JSON: {"archetype":"..","care_style":"..","name":".."}')
                        # tier="pro" so the openclaw CLOUD substrate is allowed (free tier is
                        # local/sov3 only); this is a server-internal mint helper, not metered chat.
                        r = _router.ask(prompt, model=b.get("model", "turbo-llama8"),
                                        tier="pro", max_tokens=120)
                        raw = (r or {}).get("reply", "") if isinstance(r, dict) else str(r or "")
                        import re as _re
                        raw = raw.replace("```json", "").replace("```", "")   # strip code fences
                        m = _re.search(r"\{.*\}", raw, _re.S)
                        if m:
                            j = json.loads(m.group(0))
                            if j.get("archetype") in archs: pick["archetype"] = j["archetype"]
                            if j.get("care_style") in cares: pick["care_style"] = j["care_style"]
                            nm = (j.get("name") or "").strip().split()
                            if nm: pick["name"] = nm[0][:24]
                            if pick["archetype"]: pick["via"] = "llm"
                    except Exception:
                        pass
                low = desc.lower()
                if not pick["archetype"]:
                    kw = {
                        "challenger": ["coach", "discipl", "push", "goal", "accountab", "fitness", "perform", "stronger"],
                        "nurturer":  ["comfort", "gentle", "support", "listen", "kind", "care", "feel", "lonely", "warm", "soothe"],
                        "explorer":  ["curious", "idea", "discover", "learn", "explore", "question", "wonder"],
                        "strategist": ["plan", "strateg", "organi", "business", "decision", "execute", "focus", "productiv"],
                        "creator":   ["art", "write", "music", "design", "create", "imagin", "story", "paint"],
                        "guardian":  ["protect", "safe", "privacy", "secur", "watch", "defend", "shield"],
                        "sage":      ["wisdom", "calm", "perspective", "meaning", "slow", "reflect", "philosoph", "star", "garden", "nature", "peace"],
                        "seeker":    ["faith", "spirit", "pray", "purpose", "sacred", "soul", "god", "contempl"],
                    }
                    best, score = "nurturer", 0
                    for a, words in kw.items():
                        s = sum(1 for w in words if w in low)
                        if s > score: best, score = a, s
                    pick["archetype"] = best
                if not pick["care_style"]:
                    cmap = {"gentle": ["gentle", "calm", "slow", "soft", "soothe", "peace"],
                            "supporter": ["support", "beside", "validate", "listen", "encourage"],
                            "challenger": ["challeng", "push", "standard", "tough", "discipl", "goal"],
                            "explorer": ["explore", "idea", "curious", "discover", "creative"],
                            "seeker": ["faith", "spirit", "sacred", "doubt", "purpose", "soul"]}
                    bc, sc = "gentle", 0
                    for c, words in cmap.items():
                        s = sum(1 for w in words if w in low)
                        if s > sc: bc, sc = c, s
                    pick["care_style"] = bc
                char = _factory.mint(pick["archetype"], pick["care_style"], pick["name"])
                return self._json(200, {"suggestion": pick, "character": char})
            if path == "/api/perceive":
                # The EYES of the OS: a vision source (step3.7 / screen-grab) describes a frame →
                # we compress it to SIGIL (F + optional D), REMEMBER it in SOV3, and LOG the pair
                # so a future "salience" net can learn what's worth keeping. Does BOTH at once.
                import time as _t, hashlib as _hl
                from . import sigil as _sig
                scene = (str(b.get("scene") or "screen")).strip()[:200]
                objects = [str(o)[:40] for o in (b.get("objects") or [])][:12]
                saw = False
                img = b.get("image")
                if img:   # a real screen frame → describe it with the local vision model
                    if isinstance(img, str) and img.startswith("data:"):
                        img = img.split(",", 1)[-1]
                    vscene, vobjs = _vision_describe(img, b.get("vision_model"))
                    if vscene:
                        scene, saw = vscene, True
                    if vobjs:
                        objects = vobjs
                ref = (str(b.get("ref") or "")[:24]
                       or "sha_" + _hl.sha256((scene + str(objects)).encode()).hexdigest()[:8])
                care = max(0.0, min(1.0, float(b.get("care_weight", 0.5))))
                rec = _sig.record({"op": "F", "scene": scene, "objects": objects, "ref": ref})
                dets = []
                for d in (b.get("detections") or [])[:8]:
                    dr = _sig.record({"op": "D", "label": str(d.get("label", "?"))[:40],
                                      "bbox": str(d.get("bbox", ""))[:40],
                                      "conf": str(d.get("conf", "0.0"))[:6]})
                    dets.append(dr["line"])
                stored = {"stored": False}
                try:
                    from . import memory as _mem
                    stored = _mem.bridge().record(uid, rec["line"], platform="hud-vision")
                except Exception as e:
                    stored = {"stored": False, "error": f"{type(e).__name__}: {e}"}
                try:   # salience training dataset — the pairs the future net learns from
                    dd = os.path.join(_HERE, "data"); os.makedirs(dd, exist_ok=True)
                    with open(os.path.join(dd, "perception_pairs.jsonl"), "a") as f:
                        f.write(json.dumps({"ts": int(_t.time()), "uid": uid, "sigil": rec["line"],
                                            "gloss": rec["gloss"], "care_weight": care,
                                            "stored": bool(stored.get("stored")),
                                            "n_det": len(dets)}) + "\n")
                except Exception:
                    pass
                return self._json(200, {"sigil": rec["line"], "gloss": rec["gloss"],
                                        "detections": dets, "receipt": rec["receipt"],
                                        "remembered": bool(stored.get("stored")),
                                        "saw": saw,
                                        "vision_model": (os.environ.get("MEOK_VISION_MODEL", "moondream") if img else None)})
            if path == "/api/copilot/act":
                # AI CO-PILOT (gated): see the screen → propose the SINGLE next action → classify it
                # through the Tool Gateway → return it for the user to approve. meok-one is the BRAIN;
                # it NEVER executes — an approved action goes to the user's local Open Computer Use MCP
                # (the HANDS, which the user enables on their device). prohibited = refused outright.
                from . import sigil as _sig, router as _r
                goal = (str(b.get("goal") or "")).strip()[:300]
                cid = b.get("character", "aria")
                scene = (str(b.get("scene") or "")).strip()[:200]
                img = b.get("image")
                if img:
                    if isinstance(img, str) and img.startswith("data:"):
                        img = img.split(",", 1)[-1]
                    vs, _o = _vision_describe(img, b.get("vision_model"))
                    if vs:
                        scene = vs
                scene = scene or "screen"
                prompt = ("You are a co-pilot helping the user reach a goal on their own screen. "
                          f"GOAL: {goal}\nSCREEN: {scene}\n"
                          "Propose the SINGLE next UI action. Reply ONLY compact JSON: "
                          '{"action":"click|type|scroll|key|observe|done","target":"<plain words>",'
                          '"text":"<text to type if any>","reason":"<<=8 words>"}')
                action = {"action": "observe", "target": "", "text": "", "reason": ""}
                try:
                    rr = _r.ask(prompt, model=b.get("model", "turbo-llama8"), tier="pro", max_tokens=140)
                    raw = (rr or {}).get("reply", "") if isinstance(rr, dict) else str(rr or "")
                    import re as _re
                    m = _re.search(r"\{.*\}", raw, _re.S)
                    if m:
                        j = json.loads(m.group(0))
                        for k in ("action", "target", "text", "reason"):
                            if j.get(k) is not None:
                                action[k] = str(j[k])[:120]
                except Exception:
                    pass
                tier = _classify_action(action["action"], action.get("target", ""),
                                        action.get("text", ""), context=f"{goal} {scene}")
                refused = (tier == "prohibited")
                try:
                    _sig.record({"op": "H", "frm": cid, "to": "desktop",
                                 "task": f'{action["action"]}:{action.get("target","")[:50]} [{tier}]'})
                except Exception:
                    pass
                return self._json(200, {
                    "goal": goal, "scene": scene,
                    "action": (None if refused else action["action"]),
                    "target": action.get("target"), "text": action.get("text"),
                    "reason": action.get("reason"), "tier": tier,
                    "needs_confirm": (tier == "write"), "refused": refused,
                    "execute_via": "your local Open Computer Use MCP (meok-one never executes — it gates + audits)",
                })
            if path == "/api/think":
                cid = b.get("character", "aria")
                out = think(cid, b.get("message", ""),
                            brain=b.get("brain", "left"), tier=b.get("tier", "pro"),
                            user_id=uid)
                # SOVEREIGN GATE — the mandatory last filter. Whatever engine ran (incl. a
                # user-swapped model), re-filter the reply so the user is always protected.
                from .sovereign_gate import gate as _gate
                _g = _gate(out.get("reply", ""), character=cid, user_id=uid,
                           engine=out.get("engine", out.get("brain", "?")),
                           user_message=b.get("message", ""), tier=b.get("tier", "pro"))
                out["reply"] = _g["reply"]
                out["sovereign_gate"] = {k: _g[k] for k in ("gate", "care_flagged", "held", "swappable_engine")}
                # Stage 1 Tamagotchi: grow the bond + update mood from this interaction (per user)
                try:
                    from . import vitals as _v
                    out["vitals"] = _v.on_interaction(cid, b.get("message", ""), name=b.get("name"), user_id=uid)
                except Exception as e:
                    out["vitals_error"] = str(e)
                return self._json(200, out)
            if path == "/api/sovereign":
                # The FULL 12-around-1 BFT council powers the reply (vs /api/think's 2-node).
                # DEADLINE so chat never hangs: reviews that miss it are dropped, Sovereign
                # reconciles whatever returned. Smaller council for snappy interactive chat.
                cid = b.get("character", "aria")
                from .sovereign import sovereign_council
                _roster = b.get("roster") or _COUNCIL_ROSTER
                out = sovereign_council(cid, b.get("message", ""),
                                        tier=b.get("tier", "pro"),
                                        user_id=uid,
                                        reconcile=b.get("reconcile", "llm"),     # llm-synthesis: the mode that actually error-corrects
                                        orchestrator=b.get("orchestrator", "opus"),
                                        roster=_roster,                          # turbo cloud lenses (Groq/Cerebras)
                                        provider=b.get("provider") or _COUNCIL_PROVIDER,  # ultra-fast inference
                                        quorum=int(b.get("quorum", len(_roster))),
                                        deadline_s=float(b.get("deadline_s", 60)))
                from .sovereign_gate import gate as _gate
                _g = _gate(out.get("reply", ""), character=cid, user_id=uid,
                           engine=out.get("engine", "council"),
                           user_message=b.get("message", ""), tier=b.get("tier", "pro"))
                out["reply"] = _g["reply"]
                out["sovereign_gate"] = {k: _g[k] for k in ("gate", "care_flagged", "held", "swappable_engine")}
                try:
                    from . import vitals as _v
                    out["vitals"] = _v.on_interaction(cid, b.get("message", ""), name=b.get("name"), user_id=uid)
                except Exception as e:
                    out["vitals_error"] = str(e)
                try:   # EMIT SIGIL — every council run becomes a hash-chained audit record
                    from . import sigil as _sigil
                    _sigil.emit_council(cid, b.get("message", ""), out.get("council", {}))
                    _sigil.record({"op": "S", "fields": {"char": cid, "gate": _g.get("gate", "pass"),
                                                         "care": _g.get("care_flagged", False)}})
                except Exception:
                    pass
                return self._json(200, out)
            if path == "/api/siri":
                # SIRI / Apple Shortcuts bridge. A spoken query → a MEOK character's reply,
                # routed through the SAME Sovereign gate as everything else, so Siri inherits
                # MEOK's safety membrane (crisis→Samaritans, unsafe veto) + OpenRouter model
                # routing. Fast (cloud) brain by default = snappy for voice. Returns voice-clean
                # plain text in `speech` (Shortcuts: Get Dictionary Value → Speak Text).
                cid = b.get("character", "aria")
                msg = b.get("q") or b.get("message") or ""
                out = think(cid, msg, brain=b.get("brain", "right"),
                            tier=b.get("tier", "pro"), user_id=(uid if uid != "web" else "siri"))
                from .sovereign_gate import gate as _gate
                _g = _gate(out.get("reply", ""), character=cid, user_id=(uid if uid != "web" else "siri"),
                           engine=out.get("engine", "right"), user_message=msg,
                           tier=b.get("tier", "pro"))
                return self._json(200, {"speech": _voiceify(_g["reply"]),
                                        "character": out.get("character", cid),
                                        "engine": out.get("engine", "right"),
                                        "held": bool(_g.get("held", False)),
                                        "care_flagged": bool(_g.get("care_flagged", False))})
            if path == "/api/ask":
                # Generic gated model ask — powers the TUI coding REPL (per-window model selector).
                # Any allowed model alias; still passes the Sovereign gate like everything else.
                from .router import ask as _ask
                prompt = b.get("prompt") or b.get("message") or ""
                out = _ask(prompt, model=b.get("model", "deepseek-v4"),
                           tier=b.get("tier", "pro"), max_tokens=b.get("max_tokens"))
                from .sovereign_gate import gate as _gate
                _g = _gate(out.get("reply") or "", character=b.get("character", "aria"), user_id=uid,
                           engine=out.get("model") or "?", user_message=prompt, tier="pro")
                return self._json(200, {"reply": _g["reply"], "model": out.get("model"),
                                        "backend": out.get("backend"),
                                        "note": out.get("note"),
                                        "care_flagged": bool(_g.get("care_flagged", False))})
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


def _voiceify(text, limit=600):
    """Turn a chat reply into clean speech for Siri's 'Speak Text': drop code/markdown/URLs,
    collapse whitespace, and cut at a sentence boundary so it never reads a half-word aloud."""
    import re
    t = text or ""
    t = re.sub(r"```.*?```", " ", t, flags=re.S)            # code blocks
    t = re.sub(r"`([^`]*)`", r"\1", t)                       # inline code
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)           # md links -> label
    t = re.sub(r"https?://\S+", "", t)                       # bare URLs (don't read aloud)
    t = re.sub(r"\*\*([^*]*)\*\*", r"\1", t)                 # bold
    t = re.sub(r"[*_#>`|]", "", t)                            # leftover md punctuation
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) > limit:
        cut = t[:limit]
        m = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
        t = (cut[:m + 1] if m > 200 else cut).strip()
    return t or "I'm here."


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
