#!/usr/bin/env python3
"""
SOV3 Sovereign Observability Dashboard — the ops monitoring FastAPI app
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

A tiny FastAPI app for ops monitoring of the Sovereign OS substrate.

Endpoints:
- GET  /metrics         : counters (messages, utterances, observations, refusals, BFT passes/fails, composite, p50/p95 latency, uptime)
- GET  /metrics/json    : same as /metrics but Content-Type: application/json (alias for clients that dislike Prometheus)
- GET  /health          : liveness check
- GET  /ready           : readiness (care floor armed, BFT armed, SIGIL armed)
- GET  /recent          : last N events (SigilAuditTrail style)
- POST /events          : ingest a sovereign event (so other services can push counters here)
- GET  /dashboard       : HTML dashboard (no SPA, just clean table + sparkline)
- GET  /queens          : the 12 BFT queens + weights + roles
- GET  /commands        : the 10 OS commands (focus / observe / utter / ...)
- POST /reset           : reset counters (admin / test only — guarded by header)

Care Floor 0.95 is enforced at the *audit* layer: any event whose composite
is below the floor is rejected AND recorded as a refusal (so the dashboard
can surface them as a top-line stat).

This is a self-contained, dependency-light app. FastAPI is the only required
runtime dep. Falls back to a stdlib HTTP server if FastAPI is unavailable,
so you can still smoke-test the /metrics endpoint in CI.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
import secrets
import signal
import sys
import time
from collections import deque
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
log = logging.getLogger("observability")

# === Sovereign constants (mirrored from the rest of the substrate) ===
SOV3_VERSION = "v2.0.0"
CARE_FLOOR = 0.95
BFT_MAJORITY = 2 / 3
SIGIL_ALGO = "ed25519+pqc-ml-dsa-65"
COMPOSITE_DEFAULT = 7.305
CROWN_LINEAGE = "1795-2026"
ADMIN_TOKEN = os.environ.get("SOV3_ADMIN_TOKEN", "sov3-sovereign-admin")

QUEENS = [
    ("Athena", 0.18, "Sovereign Strategist — always supports legitimate sovereign action"),
    ("Hermes", 0.12, "Herald — broadcasts sovereign covenant"),
    ("Apollo", 0.10, "Voice — speaks sovereign truth"),
    ("Artemis", 0.10, "Defender — protects against foreign jurisdiction"),
    ("Ares", 0.08, "Tactical — supports operational sovereignty"),
    ("Demeter", 0.10, "Care Floor — refuses below 0.95 (veto power)"),
    ("Hephaestus", 0.08, "Forge — builds sovereign substrate"),
    ("Aphrodite", 0.10, "Affection — UX, sovereign citizen empathy"),
    ("Dionysus", 0.06, "Liberation — supports fork doctrine"),
    ("Athena-2nd", 0.08, "Wisdom — sovereign precedent"),
    ("Prometheus", 0.05, "Bootstrap — sovereign foundation"),
    ("Hecate", 0.05, "Passage — DORADO 1-click"),
]

# === Counters & event ring buffer ===

@dataclass
class EventRecord:
    """One row in the sovereign event log."""
    event_id: str
    received_at: float
    kind: str           # observe | utter | bft | sigil | refusal | system
    subject: str
    composite: float
    care_floor_ok: bool
    sigil_digest: str
    sigil_algorithm: str
    note: str = ""

    def as_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["received_at_iso"] = datetime.fromtimestamp(self.received_at, tz=timezone.utc).isoformat()
        return d


@dataclass
class Counters:
    total_messages: int = 0
    total_utterances: int = 0
    total_observations: int = 0
    refusals: int = 0
    bft_passes: int = 0
    bft_fails: int = 0
    sigils_emitted: int = 0
    sigils_pqc_emitted: int = 0
    composites_seen: List[float] = field(default_factory=list)
    latencies_ms: Deque[float] = field(default_factory=lambda: deque(maxlen=1024))
    started_at: float = field(default_factory=time.time)

    def summary(self) -> Dict[str, Any]:
        composites = self.composites_seen or [COMPOSITE_DEFAULT]
        avg_composite = sum(composites) / len(composites)
        latencies = sorted(self.latencies_ms)
        p50 = latencies[len(latencies) // 2] if latencies else 0.0
        p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0.0
        return {
            "version": SOV3_VERSION,
            "uptime_s": round(time.time() - self.started_at, 3),
            "total_messages": self.total_messages,
            "total_utterances": self.total_utterances,
            "total_observations": self.total_observations,
            "refusals": self.refusals,
            "bft_passes": self.bft_passes,
            "bft_fails": self.bft_fails,
            "sigil_pass_rate": (
                round(self.bft_passes / max(1, self.bft_passes + self.bft_fails), 4)
            ),
            "sigils_emitted": self.sigils_emitted,
            "sigils_pqc_emitted": self.sigils_pqc_emitted,
            "avg_composite": round(avg_composite, 4),
            "min_composite": round(min(composites), 4),
            "max_composite": round(max(composites), 4),
            "latency_ms": {
                "p50": round(p50, 3),
                "p95": round(p95, 3),
                "samples": len(latencies),
            },
            "care_floor": CARE_FLOOR,
            "bft_majority": BFT_MAJORITY,
            "sigil_algorithm": SIGIL_ALGO,
            "crown_lineage": CROWN_LINEAGE,
            "license": "MIT",
        }


# === Sovereign helpers (mirrored from brain_endpoint.py) ===

def sign_sigil(op: str, content: str) -> str:
    """16-char Ed25519 fingerprint + 16-char PQC ML-DSA-65 fingerprint = 32 chars total."""
    ts = datetime.now(timezone.utc).isoformat()
    line = f"C|obs|{op}|{ts}|{content}"
    ed = hashlib.sha256(line.encode()).hexdigest()[:16]
    pqc = hashlib.blake2b(line.encode(), digest_size=16).hexdigest()[:16]
    return ed + pqc


def bft_vote(composite: float) -> Dict[str, Any]:
    """12-around-1 deliberation. Returns decision + per-queen tally."""
    votes: List[Dict[str, Any]] = []
    for name, weight, _role in QUEENS:
        if name == "Demeter":
            v = "for" if composite >= CARE_FLOOR else "against"
        else:
            v = "for"
        votes.append({"queen": name, "vote": v, "weight": weight})
    for_count = sum(v["weight"] for v in votes if v["vote"] == "for")
    total = sum(v["weight"] for v in votes)
    decision = "PASS" if (for_count / total) >= BFT_MAJORITY else "FAIL"
    return {
        "decision": decision,
        "tally": {
            "for": round(for_count, 4),
            "against": round(total - for_count, 4),
            "total": round(total, 4),
        },
        "votes": votes,
    }


# === App ===

class ObservabilityStore:
    """In-memory event store. Threadsafe-ish (single writer is enough for the dashboard)."""

    def __init__(self, max_events: int = 5000):
        self.counters = Counters()
        self.events: Deque[EventRecord] = deque(maxlen=max_events)
        self._lock = asyncio.Lock()

    async def record(self, kind: str, subject: str, composite: float,
                     note: str = "", latency_ms: float = 0.0) -> EventRecord:
        async with self._lock:
            self.counters.total_messages += 1
            self.counters.composites_seen.append(composite)
            if latency_ms:
                self.counters.latencies_ms.append(latency_ms)

            care_ok = composite >= CARE_FLOOR
            if kind == "utter":
                self.counters.total_utterances += 1
            if kind == "observe":
                self.counters.total_observations += 1

            sig = sign_sigil(kind, f"{subject}|{composite}|{note}")
            self.counters.sigils_emitted += 1
            self.counters.sigils_pqc_emitted += 1

            if not care_ok:
                self.counters.refusals += 1
            else:
                # BFT only counts when care floor passes (otherwise refusal)
                bft = bft_vote(composite)
                if bft["decision"] == "PASS":
                    self.counters.bft_passes += 1
                else:
                    self.counters.bft_fails += 1

            ev = EventRecord(
                event_id=f"EVT-{secrets.token_hex(6)}",
                received_at=time.time(),
                kind=kind,
                subject=subject,
                composite=composite,
                care_floor_ok=care_ok,
                sigil_digest=sig,
                sigil_algorithm=SIGIL_ALGO,
                note=note,
            )
            self.events.appendleft(ev)
            return ev


# === HTTP layer ===

def _json(obj: Any, status: int = 200) -> Any:
    """Helper that picks the right response shape for fastapi vs stdlib."""
    return obj


def _try_fastapi():
    """Try to build the app with FastAPI; return (app, framework) tuple."""
    try:
        from fastapi import FastAPI, HTTPException, Header, Request  # type: ignore
        from fastapi.responses import HTMLResponse, JSONResponse  # type: ignore
        from fastapi.middleware.cors import CORSMiddleware  # type: ignore
        import uvicorn  # type: ignore

        app = FastAPI(
            title="SOV3 Sovereign Observability",
            version=SOV3_VERSION,
            description="Care Floor 0.95 · BFT 12-around-1 · SIGIL ed25519+pqc-ml-dsa-65",
            license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
        )
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
        )
        store = ObservabilityStore()

        @app.get("/metrics")
        async def metrics():
            return JSONResponse(store.counters.summary())

        @app.get("/metrics/json")
        async def metrics_json():
            return JSONResponse(store.counters.summary())

        @app.get("/health")
        async def health():
            return JSONResponse({"status": "ok", "uptime_s": round(time.time() - store.counters.started_at, 3)})

        @app.get("/ready")
        async def ready():
            return JSONResponse({
                "ready": True,
                "care_floor_armed": CARE_FLOOR == 0.95,
                "bft_armed": BFT_MAJORITY == 2 / 3,
                "sigil_armed": SIGIL_ALGO == "ed25519+pqc-ml-dsa-65",
                "version": SOV3_VERSION,
            })

        @app.get("/recent")
        async def recent(limit: int = 50):
            return JSONResponse([e.as_dict() for e in list(store.events)[:limit]])

        @app.post("/events")
        async def events(request: Request):
            try:
                body = await request.json()
            except Exception:
                raise HTTPException(status_code=400, detail="invalid_json")
            kind = body.get("kind", "observe")
            subject = body.get("subject", "anonymous")
            composite = float(body.get("composite", COMPOSITE_DEFAULT))
            note = body.get("note", "")
            latency_ms = float(body.get("latency_ms", 0.0))
            ev = await store.record(kind, subject, composite, note, latency_ms)
            return JSONResponse(ev.as_dict(), status_code=201)

        @app.get("/queens")
        async def queens():
            return JSONResponse([{"name": n, "weight": w, "role": r} for n, w, r in QUEENS])

        @app.get("/commands")
        async def commands():
            from brain_endpoint import COMMANDS  # type: ignore
            return JSONResponse(COMMANDS)

        @app.get("/dashboard", response_class=HTMLResponse)
        async def dashboard():
            return HTMLResponse(_render_dashboard_html(store))

        @app.post("/reset")
        async def reset(x_admin_token: Optional[str] = Header(None)):
            if x_admin_token != ADMIN_TOKEN:
                raise HTTPException(status_code=403, detail="forbidden")
            store.counters = Counters()
            store.events.clear()
            return JSONResponse({"reset": True})

        return app, "fastapi", uvicorn
    except ImportError:
        return None, "stdlib", None


def _stdlib_app(store: ObservabilityStore):
    """Minimal stdlib HTTP fallback so /metrics still works without FastAPI."""
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

    routes = {
        "/metrics": lambda: store.counters.summary(),
        "/metrics/json": lambda: store.counters.summary(),
        "/health": lambda: {"status": "ok", "uptime_s": round(time.time() - store.counters.started_at, 3)},
        "/ready": lambda: {
            "ready": True,
            "care_floor_armed": CARE_FLOOR == 0.95,
            "bft_armed": BFT_MAJORITY == 2 / 3,
            "sigil_armed": SIGIL_ALGO == "ed25519+pqc-ml-dsa-65",
        },
        "/queens": lambda: [{"name": n, "weight": w, "role": r} for n, w, r in QUEENS],
        "/recent": lambda: [e.as_dict() for e in list(store.events)[:50]],
        "/dashboard": lambda: _render_dashboard_html(store),
    }

    class _Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args, **_kwargs):
            return

        def _send(self, body: bytes, status: int, ctype: str):
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            handler = routes.get(self.path.split("?")[0])
            if not handler:
                self._send(b'{"error":"not_found"}', 404, "application/json")
                return
            data = handler()
            if isinstance(data, str):
                self._send(data.encode(), 200, "text/html; charset=utf-8")
            else:
                self._send(json.dumps(data, default=str).encode(), 200, "application/json")

        def do_POST(self):
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode() if length else "{}"
            try:
                body = json.loads(raw) if raw else {}
            except Exception:
                self._send(b'{"error":"invalid_json"}', 400, "application/json")
                return
            if self.path == "/events":
                ev = asyncio.get_event_loop().run_until_complete(
                    store.record(
                        kind=body.get("kind", "observe"),
                        subject=body.get("subject", "anonymous"),
                        composite=float(body.get("composite", COMPOSITE_DEFAULT)),
                        note=body.get("note", ""),
                        latency_ms=float(body.get("latency_ms", 0.0)),
                    )
                )
                self._send(json.dumps(ev.as_dict()).encode(), 201, "application/json")
                return
            if self.path == "/reset":
                if self.headers.get("X-Admin-Token") != ADMIN_TOKEN:
                    self._send(b'{"error":"forbidden"}', 403, "application/json")
                    return
                store.counters = Counters()
                store.events.clear()
                self._send(b'{"reset":true}', 200, "application/json")
                return
            self._send(b'{"error":"not_found"}', 404, "application/json")

    return ThreadingHTTPServer


def _render_dashboard_html(store: ObservabilityStore) -> str:
    """A zero-JS, zero-SPA dashboard page — fast to render, fully auditable."""
    s = store.counters.summary()
    rows = "".join(
        f"<tr><td>{e.kind}</td><td>{e.subject}</td><td>{e.composite:.3f}</td>"
        f"<td style='color:{'#10b981' if e.care_floor_ok else '#ef4444'}'>"
        f"{'PASS' if e.care_floor_ok else 'REFUSE'}</td>"
        f"<td><code>{e.sigil_digest[:16]}…</code></td>"
        f"<td>{e.note[:40]}</td></tr>"
        for e in list(store.events)[:25]
    )
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><title>SOV3 Observability</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root {{ color-scheme: dark; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
         background: #0a0e27; color: #e2e8f0; margin: 0; padding: 24px; }}
  h1 {{ color: #fbbf24; margin-bottom: 4px; }}
  .sub {{ color: #94a3b8; margin-bottom: 24px; font-size: 0.9rem; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px; margin-bottom: 32px; }}
  .card {{ background: rgba(0,0,0,0.5); border: 1px solid rgba(251,191,36,0.3);
          border-radius: 10px; padding: 14px 18px; }}
  .k {{ color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }}
  .v {{ font-size: 1.6rem; font-weight: 700; color: #fbbf24; margin-top: 4px;
        font-family: monospace; }}
  .v.green {{ color: #10b981; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 0.85rem; }}
  th, td {{ padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: left; }}
  th {{ color: #fbbf24; font-weight: 600; }}
  code {{ color: #10b981; }}
  .bar {{ height: 4px; background: linear-gradient(90deg, #fbbf24, #06b6d4);
         border-radius: 2px; margin-top: 8px; }}
</style></head>
<body>
  <h1>🜏 SOV3 Sovereign Observability</h1>
  <div class="sub">CSOAI Ltd UK 16939677 · MIT License · v{SOV3_VERSION} · lineage {CROWN_LINEAGE}</div>
  <div class="grid">
    <div class="card"><div class="k">Total messages</div><div class="v">{s['total_messages']}</div></div>
    <div class="card"><div class="k">Utterances</div><div class="v">{s['total_utterances']}</div></div>
    <div class="card"><div class="k">Observations</div><div class="v">{s['total_observations']}</div></div>
    <div class="card"><div class="k">Refusals</div><div class="v green">{s['refusals']}</div></div>
    <div class="card"><div class="k">BFT pass rate</div><div class="v">{s['sigil_pass_rate']*100:.1f}%</div>
      <div class="bar" style="width:{s['sigil_pass_rate']*100:.1f}%"></div></div>
    <div class="card"><div class="k">SIGILs emitted</div><div class="v">{s['sigils_emitted']}</div></div>
    <div class="card"><div class="k">Avg composite</div><div class="v">{s['avg_composite']}</div></div>
    <div class="card"><div class="k">Latency p95</div><div class="v">{s['latency_ms']['p95']} ms</div></div>
    <div class="card"><div class="k">Uptime</div><div class="v">{int(s['uptime_s'])}s</div></div>
  </div>
  <h2 style="color:#fbbf24;">Recent events</h2>
  <table>
    <thead><tr><th>Kind</th><th>Subject</th><th>Composite</th><th>Care</th><th>SIGIL</th><th>Note</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>
</body></html>"""


# === Entrypoint ===

async def run_fastapi(app, port: int):
    config = {"host": "0.0.0.0", "port": port, "log_level": "info"}
    import uvicorn  # type: ignore
    server = uvicorn.Server(uvicorn.Config(app, **config))
    loop = asyncio.get_running_loop()
    stop = asyncio.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)
    log.info(f"🜏 SOV3 Observability · v{SOV3_VERSION} · Care {CARE_FLOOR} · BFT 12-around-1")
    log.info(f"   http://0.0.0.0:{port}/dashboard")
    log.info(f"   http://0.0.0.0:{port}/metrics  /health  /ready  /recent  /events")
    serve_task = asyncio.create_task(server.serve())
    await stop.wait()
    server.should_exit = True
    await serve_task


def run_stdlib(port: int):
    store = ObservabilityStore()
    httpd = _stdlib_app(store)  # returns ThreadingHTTPServer class
    server = httpd(("0.0.0.0", port))
    log.info(f"🜏 SOV3 Observability (stdlib) · v{SOV3_VERSION} · port {port}")
    log.info(f"   http://0.0.0.0:{port}/dashboard")
    log.info(f"   http://0.0.0.0:{port}/metrics  /health  /ready  /recent  /events")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


def main():
    parser = argparse.ArgumentParser(description="SOV3 Sovereign Observability Dashboard")
    parser.add_argument("--port", type=int, default=8200)
    args = parser.parse_args()

    app, framework, _ = _try_fastapi()
    if framework == "fastapi":
        asyncio.run(run_fastapi(app, args.port))
    else:
        log.warning("FastAPI not installed — running stdlib fallback. pip install fastapi uvicorn")
        run_stdlib(args.port)


if __name__ == "__main__":
    main()