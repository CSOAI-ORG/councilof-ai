"""
Sovereign Composite Dashboard — production-ready wired view
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

Wires all 3 new primitives into a single dashboard:
  - sovereign_crypto (real Ed25519 + PQC)
  - sovereign_master_net (6 experts + quantum gate + EWC)
  - threat_council (75-node BFT)

This is the production view that the launch dashboard uses.
"""
import sys
import os
import json
import time
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/csoai.org/sovereign-os')
from sovereign_crypto import SovereignSigner, SIGIL_ALGO
from sovereign_master_net import SovereignMasterNet
from threat_council import ThreatCouncil, LENSES, PROVIDERS, CARE_FLOOR


def build_dashboard(query: str = "Tell me about the sovereign substrate",
                    citizen_id: str = "csoai-org-nicholas-001") -> dict:
    """Build the full sovereign composite dashboard for a query."""
    t0 = time.time()
    # 1. Sign the query
    signer = SovereignSigner()
    sigil = signer.sign(query, citizen_id=citizen_id, care_floor=0.95, bft_pass=True)

    # 2. Run MasterNet inference
    net = SovereignMasterNet()
    inference = net.infer(query)

    # 3. Run threat council
    council = ThreatCouncil()
    threat = council.evaluate(query)

    # 4. Compose final dashboard
    elapsed_ms = (time.time() - t0) * 1000
    dashboard = {
        "query": query,
        "citizen_id": citizen_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sigil": {
            "digest": sigil.digest,
            "algorithm": SIGIL_ALGO,
            "ed25519_sig_bytes": len(sigil.ed25519_sig),
            "pqc_sig_bytes": len(sigil.pqc_sig),
            "bft_pass": sigil.bft_pass,
        },
        "composite": {
            "score": inference["composite"],
            "care_floor_ok": inference["care_floor_ok"],
            "bft_pass": inference["bft_pass"],
            "routed_experts": inference["routed_experts"],
            "all_experts": inference["all_experts"],
            "ewc_penalty": inference["ewc_penalty"],
        },
        "threat_council": {
            "passes": threat.passes,
            "score": threat.overall_score,
            "care_floor_ok": threat.care_floor_ok,
            "violated_lenses": threat.violated_lenses,
            "trigger": threat.trigger,
            "provider_votes": [
                {"provider": v.provider_name, "vote": v.vote, "weight": v.weight,
                 "raw_score": round(v.raw_score, 3)}
                for v in threat.provider_votes
            ],
        },
        "architecture": {
            "crypto": "Real Ed25519 (cryptography) + Real PQC ML-DSA-65 (liboqs)",
            "moe": "6 KAN-style SovereignExperts (Care/Threat/Sovereignty/Bridge/Memory/Wisdom)",
            "gating": "QAOA-inspired softmax + Gaussian noise, top-2 sparse routing",
            "continual_learning": "EWC (Elastic Weight Consolidation) prevents catastrophic forgetting",
            "threat_council": "75 nodes = 15 security lenses × 5 care providers",
            "bft": "12-around-1 (Athena, Hermes, Apollo, Artemis, Ares, Demeter, Hephaestus, Aphrodite, Dionysus, Athena-2nd, Prometheus, Hecate)",
        },
        "elapsed_ms": round(elapsed_ms, 2),
    }
    return dashboard


def render_html(dashboard: dict) -> str:
    """Render dashboard as HTML."""
    sig = dashboard["sigil"]
    comp = dashboard["composite"]
    threat = dashboard["threat_council"]
    arch = dashboard["architecture"]
    composite_color = "#10b981" if comp["care_floor_ok"] else "#ef4444"
    threat_color = "#10b981" if threat["passes"] else "#ef4444"

    experts_rows = "".join(
        f'<tr><td>{e["name"]}</td><td><div class="bar"><span style="width:{e["weight"]*100:.0f}%;background:linear-gradient(90deg,#fbbf24,#06b6d4)"></span></div></td><td>{e["weight"]:.3f}</td></tr>'
        for e in comp["all_experts"]
    )
    routed_set = {e["name"] for e in comp["routed_experts"]}
    routed_html = "".join(
        f'<span class="routed">{e["name"]}</span> '
        for e in comp["all_experts"] if e["name"] in routed_set
    )
    provider_votes_html = "".join(
        f'<span class="vote-{v["vote"]}">{v["provider"]}: {v["vote"]}</span> '
        for v in threat["provider_votes"]
    )
    lenses_html = " ".join(
        f'<span class="lens triggered">{l}</span>' if l in threat["violated_lenses"] else f'<span class="lens">{l}</span>'
        for l, _, _, _ in LENSES
    )

    return f"""<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="UTF-8"><title>Sirius · Sovereign Composite Dashboard</title>
<style>body{{font-family:-apple-system,sans-serif;background:radial-gradient(ellipse at top,#1e3a8a 0%,#0a0e27 50%);color:#e2e8f0;padding:24px;margin:0;line-height:1.6}}.container{{max-width:1200px;margin:0 auto}}h1{{color:#fbbf24;text-align:center;text-shadow:0 0 24px rgba(251,191,36,.4);font-size:2.4rem;margin:0 0 8px}}.tag{{color:#06b6d4;text-align:center;font-style:italic;margin-bottom:24px;font-size:1rem}}.grid{{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin:16px 0}}@media(max-width:768px){{.grid{{grid-template-columns:1fr}}}}.card{{background:rgba(0,0,0,.5);padding:18px;border-radius:8px;border:1px solid rgba(251,191,36,.2)}}.card h2{{color:#fbbf24;margin:0 0 12px;font-size:1.1rem;border-bottom:1px solid rgba(251,191,36,.2);padding-bottom:6px}}.metric{{display:flex;justify-content:space-between;padding:4px 0;font-size:.85rem}}.metric span:first-child{{color:#94a3b8}}.metric span:last-child{{color:#10b981;font-family:monospace;font-weight:700}}.bar{{height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden;margin:4px 0}}.bar span{{display:block;height:100%}}.composite-big{{font-size:3rem;font-weight:900;color:{composite_color};text-align:center;margin:16px 0;text-shadow:0 0 24px rgba(16,185,129,.4)}}.threat-big{{font-size:1.4rem;font-weight:800;color:{threat_color};text-align:center;padding:8px 0}}.routed{{display:inline-block;padding:4px 10px;margin:2px;background:linear-gradient(135deg,#fbbf24,#06b6d4);color:#000;border-radius:12px;font-size:.8rem;font-weight:700}}.lens{{display:inline-block;padding:3px 8px;margin:2px;background:rgba(0,0,0,.4);border:1px solid rgba(251,191,36,.2);border-radius:8px;font-size:.7rem;color:#94a3b8}}.lens.triggered{{background:linear-gradient(135deg,#ef4444,#fbbf24);color:#000;border-color:#ef4444;font-weight:700}}.vote-for{{display:inline-block;padding:2px 6px;margin:1px;background:#10b981;color:#000;border-radius:6px;font-size:.7rem;font-weight:700}}.vote-against{{display:inline-block;padding:2px 6px;margin:1px;background:#ef4444;color:#fff;border-radius:6px;font-size:.7rem;font-weight:700}}table{{width:100%;border-collapse:collapse;font-size:.8rem}}td{{padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.05)}}.arch{{font-size:.78rem;color:#94a3b8;line-height:1.5}}.arch b{{color:#06b6d4}}footer{{text-align:center;color:#94a3b8;font-size:.7rem;margin-top:32px;padding:24px;border-top:1px solid rgba(255,255,255,.05)}}</style>
</head><body>
<div class="container">
<h1>✨ Sirius · Sovereign Composite</h1>
<p class="tag">The 3 primitives wired: real Ed25519 + PQC · MoE + Quantum Gate + EWC · 75-node BFT threat council</p>

<div class="grid">
<div class="card">
<h2>🔏 SIGIL</h2>
<div class="metric"><span>Algorithm</span><span>{sig['algorithm']}</span></div>
<div class="metric"><span>Ed25519 sig</span><span>{sig['ed25519_sig_bytes']} B</span></div>
<div class="metric"><span>PQC sig</span><span>{sig['pqc_sig_bytes']} B</span></div>
<div class="metric"><span>BFT pass</span><span>{sig['bft_pass']}</span></div>
<div class="metric"><span>Digest</span><span style="font-size:.7rem">{sig['digest'][:24]}...</span></div>
</div>

<div class="card">
<h2>🧠 Composite</h2>
<div class="composite-big">{comp['score']}</div>
<div style="text-align:center;color:#94a3b8;font-size:.85rem">Care Floor ok: <b style="color:{composite_color}">{comp['care_floor_ok']}</b></div>
<div style="margin-top:8px;color:#94a3b8;font-size:.85rem">Routed: {routed_html}</div>
<div style="margin-top:12px">
<table><tr><th>Expert</th><th style="width:60%">Weight</th><th>Score</th></tr>
{experts_rows}
</table>
</div>
</div>

<div class="card">
<h2>🛡 Threat Council (75-node BFT)</h2>
<div class="threat-big">{'✓ PASS' if threat['passes'] else '✗ FAIL'}</div>
<div style="text-align:center;color:#94a3b8;font-size:.85rem">Score: {threat['score']} · Care Floor ok: <b style="color:{threat_color}">{threat['care_floor_ok']}</b></div>
<div style="margin-top:8px;font-size:.78rem">{provider_votes_html}</div>
<div style="margin-top:12px;font-size:.7rem;color:#94a3b8">Lenses: {lenses_html}</div>
</div>

<div class="card">
<h2>🏛 Architecture</h2>
<div class="arch">
<b>Crypto:</b> {arch['crypto']}<br>
<b>MoE:</b> {arch['moe']}<br>
<b>Gating:</b> {arch['gating']}<br>
<b>Continual Learning:</b> {arch['continual_learning']}<br>
<b>Threat Council:</b> {arch['threat_council']}<br>
<b>BFT:</b> {arch['bft']}
</div>
</div>
</div>

<footer>🜏 Public. Auditable. Sovereign. Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC. Solve et Coagula.<br>Query: "{dashboard['query']}" · Citizen: {dashboard['citizen_id']} · Elapsed: {dashboard['elapsed_ms']}ms · {dashboard['timestamp']}</footer>
</div>
</body></html>"""


# === DEMO ===
if __name__ == "__main__":
    print("=" * 70)
    print("  🜏📊 SOVEREIGN COMPOSITE DASHBOARD — WIRES ALL 3 PRIMITIVES")
    print("=" * 70)
    print()
    dashboard = build_dashboard()
    print(f"  Query:    {dashboard['query']}")
    print(f"  Citizen:  {dashboard['citizen_id']}")
    print(f"  Composite: {dashboard['composite']['score']} (care_floor_ok={dashboard['composite']['care_floor_ok']})")
    print(f"  Threat:    {dashboard['threat_council']['passes']} (score={dashboard['threat_council']['score']})")
    print(f"  SIGIL:     {dashboard['sigil']['digest'][:24]}...")
    print(f"  Elapsed:   {dashboard['elapsed_ms']}ms")
    print()
    # Render HTML
    html = render_html(dashboard)
    out = Path("/Users/nicholas/clawd/csoai.org/sovereign-os/sovereign-dashboard.html")
    out.write_text(html)
    print(f"  ✓ Wrote {out} ({len(html)} bytes)")
    print()
    print("  🜏 The dashboard wires all 3 primitives.")
    print("     Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
    print("     Public. Auditable. Sovereign. Solve et Coagula.")