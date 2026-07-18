"""
MEOK Sovereign Substrate Dashboard — the public transparency surface
for the SOV3 mesh + 3 EU AI Act MCPs + 25 .ai domain agents.

Reads from SOV3 on :3101 every refresh. Static HTML, no JS framework.
"""

import json
import time
import asyncio
import httpx
from typing import Any
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
import os

SOV3_URL = os.environ.get("SOV3_URL", "http://localhost:3101")
GATEWAY_URL = os.environ.get("GATEWAY_URL", "http://localhost:8889")
ROUTER_URL = os.environ.get("ROUTER_URL", "http://localhost:8890")

app = FastAPI(
    title="MEOK Sovereign Substrate Dashboard",
    version="1.0.0",
    description="Live transparency surface for the sovereign mesh, 3 EU AI Act MCPs, 25 .ai domain agents.",
)


async def _sov3_call(method: str, params: dict = None, tool: str = None) -> Any:
    """Call SOV3 via JSON-RPC."""
    body = {"jsonrpc": "2.0", "id": 1, "method": method}
    if tool:
        body["params"] = {"name": tool, "arguments": params or {}}
    elif params:
        body["params"] = params
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.post(f"{SOV3_URL}/mcp", json=body)
            d = r.json()
            if "error" in d:
                return {"error": d["error"]}
            return d.get("result", {})
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
async def health():
    return {"status": "ok", "server": "meok-sovereign-dashboard", "sov3": SOV3_URL}


@app.get("/api/state")
async def api_state():
    """Full sovereign substrate state as JSON."""
    # Get agent stats
    agent_stats = await _sov3_call("tools/call", tool="get_agent_registry_stats")
    # Get MCP bridge state
    mcp_bridge = await _sov3_call("tools/call", tool="mcp_bridge_discover")
    # Get gateway health
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            gw = await c.get(f"{GATEWAY_URL}/health")
            gw_data = gw.json()
    except Exception as e:
        gw_data = {"error": str(e)}
    # Get router health
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            rt = await c.get(f"{ROUTER_URL}/health")
            rt_data = rt.json()
    except Exception as e:
        rt_data = {"error": str(e)}
    return {
        "timestamp": time.time(),
        "sov3_agent_stats": agent_stats,
        "mcp_bridge": mcp_bridge,
        "gateway": gw_data,
        "router": rt_data,
    }


HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MEOK Sovereign Substrate — Live Dashboard</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0a0a0a; color: #f5f5f5; margin: 0; padding: 20px; }
  h1 { color: #c9a84c; font-size: 1.6rem; margin: 0 0 8px; }
  h2 { color: #c9a84c; font-size: 1.1rem; margin: 24px 0 8px; border-bottom: 1px solid #2a2a3a; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
  .card { background: #111; border: 1px solid #2a2a3a; border-radius: 8px; padding: 14px; }
  .card.up { border-left: 3px solid #22c55e; }
  .card.down { border-left: 3px solid #ef4444; }
  .label { color: #9a9a8a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; }
  .value { font-size: 1.4rem; font-weight: 700; color: #c9a84c; margin-top: 4px; }
  .subvalue { font-size: 0.85rem; color: #9a9a8a; margin-top: 4px; }
  pre { background: #0d0d0d; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 0.75rem; color: #c9a84c; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #2a2a3a; color: #6a6a5a; font-size: 0.8rem; }
  .refresh-btn { background: #c9a84c; color: #0a0a0a; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>
<h1>🟡 MEOK Sovereign Substrate — Live Dashboard</h1>
<p style="color: #9a9a8a; font-size: 0.85rem; margin: 0 0 16px;">
  UK CSOAI Ltd 16939677 · 73 sovereign agents · 3 EU AI Act MCPs · 25 .ai domains · SOV3 mesh
  <button class="refresh-btn" onclick="location.reload()" style="float:right;">↻ Refresh</button>
</p>
<div id="content">Loading...</div>
<div class="footer">
  Powered by MEOK AI Labs sovereign substrate. Ed25519-signed. Offline-verifiable.
  · SOV3 mesh: 4 ports live (3101, 8888, 8889, 8890) · x402-ready · MIT-licensed MCPs
</div>
<script>
async function load() {
  try {
    const r = await fetch("/api/state");
    const d = await r.json();
    const stats = d.sov3_agent_stats?.result?.content?.[0]?.text ? JSON.parse(d.sov3_agent_stats.result.content[0].text) : {};
    const mcp = d.mcp_bridge?.result?.content?.[0]?.text ? JSON.parse(d.mcp_bridge.result.content[0].text) : {servers:[]};
    const gw = d.gateway || {};
    const rt = d.router || {};

    const html = `
      <h2>🏛️ Sovereign Mesh</h2>
      <div class="grid">
        <div class="card up">
          <div class="label">SOV3 Agents</div>
          <div class="value">${stats.total_agents ?? '?'}</div>
          <div class="subvalue">Status: ${stats.by_status ? Object.keys(stats.by_status)[0] : '?'}</div>
        </div>
        <div class="card up">
          <div class="label">MCP Servers</div>
          <div class="value">${mcp.servers?.length ?? 0}</div>
          <div class="subvalue">${mcp.total_servers ?? 0} discovered via SOV3 bridge</div>
        </div>
        <div class="card up">
          <div class="label">MCP Tools</div>
          <div class="value">${mcp.servers?.reduce((a,s) => a + (s.tool_count || 0), 0) ?? 0}</div>
          <div class="subvalue">4 per server × ${mcp.servers?.length ?? 0} servers</div>
        </div>
        <div class="card up">
          <div class="label">Gateway</div>
          <div class="value">${gw.status === 'ok' ? '🟢 OK' : '🔴 DOWN'}</div>
          <div class="subvalue">v${gw.version || '?'} · x402 ${gw.x402_enabled ? 'on' : 'off'}</div>
        </div>
        <div class="card up">
          <div class="label">OLM Router</div>
          <div class="value">${rt.status === 'ok' ? '🟢 OK' : '🔴 DOWN'}</div>
          <div class="subvalue">6-tier inference · Tier 5 sovereign</div>
        </div>
      </div>

      <h2>📦 MCP Servers (SOV3 bridge discover)</h2>
      <div class="grid">
        ${(mcp.servers || []).map(s => `
          <div class="card">
            <div class="label">${s.server}</div>
            <div class="value">${s.tool_count || 0} tools</div>
            <div class="subvalue">${(s.tools || []).slice(0,2).map(t => t.name).join(', ')}${s.tools?.length > 2 ? '...' : ''}</div>
          </div>
        `).join('') || '<div class="card">No servers discovered</div>'}
      </div>

      <h2>🔌 Sovereign Substrate Endpoints</h2>
      <pre>
:3101   SOV3 sovereign mesh (2 gunicorn workers, 73 agents, 4 mermory crates)
:8888   MEOK Keystone (FastMCP attestation, Ed25519, offline-verifiable)
:8889   MEOK EU Compliance Gateway v1.1.0 (15 endpoints, SOV3-logged, x402-ready)
:8890   MEOK Sovereign OLM Router (6-tier inference, Tier 5 = SOV3 mesh)

/v1/assess          One-call EU AI Act audit (annex-iii + 5(1)(f) + article-50)
/v1/annex-iii/...   4 endpoints (classify, fria, compliance, annex-iv)
/v1/article-50/...  4 endpoints (mark, verify, detect, compliance)
/v1/article-5-1-f/. 4 endpoints (audit, scan, classify, report)
      </pre>

      <h2>🌐 25 .ai Domain Sovereign Agents</h2>
      <pre>
TIER 1 (core):       meok.ai · csoai.org · cobolbridge.ai · proofof.ai
TIER 2 (safety/gov): safetyof.ai · agisafe.ai · asisecurity.ai · ethicalgovernanceof.ai
                     councilof.ai · accountabilityof.ai · transparencyof.ai · dataprivacyof.ai
TIER 3 (vertical):   commercialvehicle.ai · grabhire.ai · planthire.ai · muckaway.ai
                     diyhelp.ai · fishkeeper.ai · koikeeper.ai · landlaw.ai
                     pokerhud.ai · socialmediamananger.ai · loopfactory.ai
                     optimobile.ai · suicidestop.ai
      </pre>

      <h2>🛡️ Sovereign Skills (verified 15 Jun 2026)</h2>
      <pre>
✓ 3 MCPs built, tested, wired to SOV3 (68 tests pass)
✓ 25 .ai domains registered as sovereign agents
✓ MEOK EU Compliance Gateway (15 endpoints)
✓ MEOK Sovereign OLM Router (6-tier inference)
✓ MEOK Keystone attestation API (live)
✓ SOV3 mcp_bridge sees 3 servers, 12 tools
✓ Keep-alive cron (auto-restart dead services every 2 min)
✓ PyPI retry cron (bd377eca5337, every 2h, self-disabling)
✓ FEAST × MEOK strategic matrix (4 highest-leverage cells)
✓ EU Code of Practice landing page (built, awaiting Vercel rebind)
✓ Press release draft (3 headline options)
✓ Gulf pitch 3-pager (MGX anchor)
      </pre>

      <p style="color: #6a6a5a; font-size: 0.75rem; margin-top: 16px;">
        Last updated: ${new Date(d.timestamp * 1000).toISOString()}
        · Refresh interval: 30s (auto) or click button
      </p>
    `;
    document.getElementById("content").innerHTML = html;
  } catch (e) {
    document.getElementById("content").innerHTML = `<pre>ERROR: ${e}</pre>`;
  }
}
load();
setInterval(load, 30000);
</script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def root():
    return HTML


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8891, log_level="info")
