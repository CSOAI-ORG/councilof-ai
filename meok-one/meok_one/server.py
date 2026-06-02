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
