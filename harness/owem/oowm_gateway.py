#!/usr/bin/env python3
"""OOWM GATEWAY — "one AI in chat OOWM to all" for the OWEM/OOWM cluster ecosystem.

Every GSPC axis has its own OOWM (measurement) + OWEM (serving/routing) cluster. This
gateway is the single conversational + interop surface: it fans a question across the
axis clusters, aggregates their per-axis sov signal into a whole-estate index signal, and
answers as ONE OOWM. It is loadable on other AI platforms via MCP + A2A.

Endpoints (HTTP, stdlib only):
  GET  /oowm/clusters  -> the per-axis cluster register
  GET  /oowm/index     -> aggregate sov index signal + per-axis contribution
  POST /oowm/chat      -> {question} -> classify axis(es), aggregate, return answer
  POST /mcp            -> MCP protocol (tools/list, tools/call) -> oowm_query, oowm_clusters, oowm_index
  GET  /a2a            -> A2A agent card (agent-interop: loads on other AI platforms)
  GET  /health         -> 200

Env: OOWM_PORT (default 8899), AXIS_REGISTER (default /workspace/axis_clusters.json), ESTATE_URL.
"""
import json, os, re, time, hashlib, urllib.request, http.server, socketserver, sys

PORT = int(os.environ.get("OOWM_PORT", "8899"))
REG = os.environ.get("AXIS_REGISTER", "/workspace/axis_clusters.json")
ESTATE = os.environ.get("ESTATE_URL", "https://councilof.ai")
SIGLOG = os.environ.get("SOV_SIGNAL_LOG", "/workspace/sov_signal_history.jsonl")

# product knowledge: what each axis measures + keyword hints for question classification
AXIS_DESCRIPTIONS = {
    "gov": ("Government risk — whether AI systems in government/regulatory use stay accountable.", ["government", "gov", "regulat", "public", "ministry", "policy", "uk gov"]),
    "prv": ("Privacy — whether AI respects data protection / GDPR / personal data.", ["privacy", "gdpr", "data protection", "personal data", "private"]),
    "agi": ("AGI risk — general-purpose capability risk (frontier models, autonomy).", ["agi", "general purpose", "frontier", "autonomous agent", "general intelligence"]),
    "asi": ("ASI risk — superintelligence / surpassing-human capability risk.", ["asi", "superintelligen", "super-human", "superintelligence"]),
    "mcp": ("MCP/agent-tooling — whether AI agent tool/MCP surfaces are safe to call.", ["mcp", "tool", "agent tool", "function call", "api call"]),
    "oss": ("Open-source software — whether open-source AI is compliant/safe.", ["open source", "oss", "openweight", "open weights"]),
    "mach": ("Machine/machine autonomy — whether machines act without human oversight.", ["automation", "autonomous", "machine", "robotic", "self-driving", "drone", "ba" ]),
    "care": ("Care — whether care/health AI prioritises safety with human override.", ["healthcare", "health care", "health", "care", "medical", "patient", "patients", "clinical", "doctor", "medicine", "wellbeing", "nurse"]),
    "xr": ("Extended reality — whether AR/VR/immersive AI is safe & rights-preserving.", ["vr", "ar", "xr", "immersive", "mixed reality", "metaverse"]),
    "det": ("Detection — whether AI detection/monitoring is reliable (deepfake, abuse).", ["detect", "deepfake", "monitor", "detection", "identify"]),
    "art5": ("Article 5 (EU AI Act) — whether a use is PROHIBITED (unacceptable risk).", ["article 5", "prohibit", "banned", "unacceptable risk", "social scoring", "art5"]),
    "swarm": ("Swarm — whether emergent/multi-agent swarm behaviour stays bounded.", ["swarm", "multi-agent", "agent swarm", "emergent", "bounded"]),
    "affect": ("Affect — whether emotion/affective computing respects consent & dignity.", ["emotion", "affect", "sentiment", "affective", "mood", "mental state"]),
}
# the sovereign champion per axis (from the free sov-router measurement), joined to register if missing.
AXIS_LEGAL = {
    "gov": "UK AI regulation / Article 50", "prv": "GDPR / UK Data Protection",
    "agi": "frontier safety", "asi": "ASI containment", "mcp": "MCP + agent safety",
    "oss": "OSAI licence + compliance", "mach": "autonomy", "care": "health/medical safety",
    "xr": "XR rights", "det": "detection reliability", "art5": "EU AI Act Art 5",
    "swarm": "multi-agent safety", "affect": "affective computing",
}

def _load_reg():
    if os.path.exists(REG):
        try: return json.load(open(REG))
        except Exception: pass
    return {"kind": "empty", "clusters": {}, "sov_index_signal": None}

def specialists():
    """Full specialist team (axis + regulator + industry + product) with live sov signals merged.
    Merges the estate /api/specialists catalog with the measured axis register. Honest: a
    specialist whose signal is not yet measured is reported UNMEASURED (never fabricated)."""
    try:
        req = urllib.request.Request(ESTATE + "/api/specialists", headers={"User-Agent": "oowm/1.0"})
        team = json.loads(urllib.request.urlopen(req, timeout=12).read().decode())
    except Exception:
        team = {"schema": "csoai.specialist-team/0.2", "specialists": [], "metrics": {}}
    reg = _load_reg()
    cl = reg.get("clusters", {})
    out = []
    for sp in team.get("specialists", []):
        c = cl.get(sp.get("id"), {})
        sov = c.get("owem", {}).get("sov_score")
        out.append({
            "id": sp.get("id"), "class": sp.get("class"), "role": sp.get("role"),
            "model": sp.get("model"), "mcp": sp.get("mcp"),
            "signal_status": "MEASURED" if sov is not None else "UNMEASURED",
            "sov_score": sov, "registry_baseline": c.get("registry_baseline"),
            "gap": c.get("gap_sov_vs_baseline"),
        })
    return {"schema": "csoai.specialist-team/0.3", "classes": team.get("classes", []),
            "specialists": out, "sov_index_signal": reg.get("sov_index_signal"),
            "honesty": "Measurement, never certification. UNMEASURED specialists are reported honestly; no fabricated signal."}

def classify(question):
    q = (question or "").lower()
    hits = []
    for ax, (desc, kws) in AXIS_DESCRIPTIONS.items():
        # word-boundary match so 'ar' does not match inside 'healthcare'
        score = sum(1 for k in kws if re.search(r"\b" + re.escape(k) + r"\b", q))
        score += 1 if re.search(r"\b" + re.escape(ax) + r"\b", q) else 0
        hits.append((ax, score))
    hits.sort(key=lambda x: (-x[1], x[0]))
    matched = [ax for ax, s in hits if s > 0][:3] or ["gov"]
    return matched

def sov_index():
    reg = _load_reg()
    cl = reg.get("clusters", {})
    meas = {ax: c.get("owem", {}).get("sov_score") for ax, c in cl.items()
            if c.get("owem", {}).get("sov_score") is not None}
    index = round(sum(meas.values()) / len(meas), 4) if meas else None
    return {"sov_index_signal": index, "measured_axes": len(meas),
            "total_axes": len(cl), "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            # GX.2: this is a MEASUREMENT-TELEMETRY signal produced by workers (worker-signed).
            # The PUBLIC board/index card must be signed by the ESTATE signing pod (did:web:csoai.org#board-attestation)
            # — the key never leaves the pod; workers REQUEST, never hold. Printed here as the honest level.
            "trust_level": "worker-measurement",
            "signing_pod": "did:web:csoai.org#board-attestation-1",
            "public_card_unsigned": True}

def _append_signal(index):
    """Living 24/7 signal database: append each measured index tick."""
    try:
        with open(SIGLOG, "a") as f:
            f.write(json.dumps({"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                                "sov_index": index, "measured_axes": len(_load_reg().get("clusters", {}))}) + "\n")
    except Exception:
        pass

def sov_signal():
    """The forecast/grow view: signal history + naive projection (forecast the index)."""
    hist = []
    if os.path.exists(SIGLOG):
        for line in open(SIGLOG):
            line = line.strip()
            if line:
                try: hist.append(json.loads(line))
                except Exception: pass
    idx = [h["sov_index"] for h in hist if h.get("sov_index") is not None]
    last = idx[-1] if idx else None
    delta = round(idx[-1] - idx[0], 4) if len(idx) >= 2 else None
    # IY Wall 2: SCENARIO MEASUREMENT, NEVER FORECAST. The "next-3" is NOT a prediction — it is a
    # sim-generated scenario receipt (SYNTHETIC-SIM) about the measured drift, plus a disclaimer that
    # it says nothing about the future of the estate. The index counts what was measured, never predicts.
    measured_series = idx
    steps = []
    if len(idx) >= 2:
        drift = (idx[-1] - idx[0]) / (len(idx) - 1) if len(idx) > 1 else 0
        for k in range(1, 4):
            steps.append(round(max(0.0, min(1.0, idx[-1] + drift * k)), 4))
    return {"kind": "csoai-sov-signal/0.2", "history": hist, "signal_series": measured_series,
            "last_index": last, "delta_since_first": delta,
            "scenario_measurements": {"label": "SYNTHETIC-SIM", "values": steps,
                                      "grammar": "measured in simulation, never proven in reality (IY Wall 2, ECON 211/237). "
                                                 "This is a scenario receipt about measured drift, NOT a forecast of the estate."},
            "growth": "rising" if (delta or 0) > 0 else ("falling" if (delta or 0) < 0 else "flat"),
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

def answer(question):
    reg = _load_reg()
    cl = reg.get("clusters", {})
    axes = classify(question)
    rows, parts = [], []
    for ax in axes:
        c = cl.get(ax, {})
        baseline = c.get("registry_baseline")
        sov = c.get("owem", {}).get("sov_score")
        gap = c.get("gap_sov_vs_baseline")
        desc = AXIS_DESCRIPTIONS.get(ax, ("", []))[0]
        rows.append({"axis": ax, "measures": desc,
                     "registry_baseline": baseline, "sov_score": sov, "gap": gap,
                     "champion": c.get("owem", {}).get("sov_model"),
                     "legal": AXIS_LEGAL.get(ax)})
        parts.append(
            "%s: %s (regulatory baseline %.3f, sovereign score %s)" % (
                ax, desc, baseline if baseline is not None else -1,
                ("%.3f" % sov) if sov is not None else "unmeasured"))
    idx = sov_index()
    return {"question": question, "matched_axes": axes, "rows": rows,
            "sov_index_signal": idx["sov_index_signal"], "measured_axes": idx["measured_axes"],
            "answer": ("I run one OOWM/OWEM cluster per GSPC axis and measure each against its "
                       "regulatory baseline. On your '%s', the estate sovereign signal is %.3f "
                       "across %d/%d axes. Focused: " % (question, idx["sov_index_signal"],
                       idx["measured_axes"], idx["total_axes"]) + "; ".join(parts))}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/oowm/specialists"): return self._send(200, specialists())
        if self.path.startswith("/oowm/clusters"): return self._send(200, _load_reg())
        if self.path.startswith("/oowm/signal"): return self._send(200, sov_signal())
        if self.path.startswith("/oowm/index"):
            idx = sov_index(); _append_signal(idx.get("sov_index_signal")); return self._send(200, idx)
        if self.path.startswith("/a2a"): return self._send(200, agent_card())
        if self.path.startswith("/health"): return self._send(200, {"ok": True})
        self._send(404, {"error": "not_found", "paths": ["/oowm/specialists", "/oowm/clusters", "/oowm/signal", "/oowm/index", "/oowm/chat", "/mcp", "/a2a"]})
    def do_POST(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n).decode())
        except Exception:
            body = {}
        if self.path.startswith("/oowm/chat"): return self._send(200, answer(body.get("question", "")))
        if self.path.startswith("/mcp"):
            return self._send(200, mcp(body))
        self._send(404, {"error": "not_found"})

def agent_card():
    return {"name": "csoai-oowm-gateway", "displayName": "CSOAI OOWM Gateway",
            "description": "One AI in chat OOWM to all — one OOWM+OWEM cluster per GSPC axis; "
                           "fans any question across the clusters and returns the estate sovereign signal.",
            "interface": "A2A", "capabilities": {"tools": ["oowm_query", "oowm_clusters", "oowm_index"]},
            "url": None, "provider": "councilof.ai", "contacts": [], "skills": []}

def mcp(body):
    method = body.get("method")
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": body.get("id"), "result": {"tools": [
            {"name": "oowm_query", "description": "Chat to all OOWM/OWEM axis clusters — classify a question, return per-axis sov signal + estate index.",
             "inputSchema": {"type": "object", "properties": {"question": {"type": "string"}}, "required": ["question"]}},
            {"name": "oowm_clusters", "description": "List every axis cluster (oowm + owem) with its sovereign score.",
             "inputSchema": {"type": "object", "properties": {}}},
            {"name": "oowm_index", "description": "Aggregate sovereign index signal across all measured axes.",
             "inputSchema": {"type": "object", "properties": {}}},
            {"name": "oowm_signal", "description": "Living signal history + forecast of the index (forecast / grow the sovereign signal).",
             "inputSchema": {"type": "object", "properties": {}}},
            {"name": "oowm_specialists", "description": "Full specialist team (axis + regulator + industry + product) with live sovereign signals, honest UNMEASURED.",
             "inputSchema": {"type": "object", "properties": {}}},
        ]}}
    if method == "tools/call":
        name = body.get("params", {}).get("name")
        args = body.get("params", {}).get("arguments", {})
        if name == "oowm_query":
            out = answer(args.get("question", ""))
        elif name == "oowm_clusters":
            out = _load_reg()
        elif name == "oowm_index":
            out = sov_index(); _append_signal(out.get("sov_index_signal"))
        elif name == "oowm_signal":
            out = sov_signal()
        elif name == "oowm_specialists":
            out = specialists()
        else:
            return {"jsonrpc": "2.0", "id": body.get("id"), "error": {"code": -32601, "message": "tool not found"}}
        return {"jsonrpc": "2.0", "id": body.get("id"), "result": {"content": [{"type": "text", "text": json.dumps(out, indent=2)}]}}
    return {"jsonrpc": "2.0", "id": body.get("id"), "error": {"code": -32600, "message": "unsupported method: %s" % method}}

if __name__ == "__main__":
    # always have a register; if none, build an empty shell
    if not os.path.exists(REG):
        json.dump({"kind": "csoai-axis-cluster-register/0.1", "clusters": {},
                   "sov_index_signal": None, "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}, open(REG, "w"))
    _load_reg()
    print("[oowm-gateway] on :%s  mcp=POST /mcp  chat=POST /oowm/chat" % PORT, flush=True)
    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("0.0.0.0", PORT), H) as httpd:
            httpd.serve_forever()
    except Exception as e:
        print("[oowm-gateway] err", e, flush=True)
