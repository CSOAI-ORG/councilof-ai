#!/usr/bin/env python3
"""
MEOK E2E Audit — visual backend + frontend health dashboard.

Runs health checks across Mac + VM services, bridge integrations, frontend routes,
and data freshness. Produces JSON + HTML reports.

Usage:
  python3 meok-e2e-audit.py [--preview-url https://ui-xxx.vercel.app]
"""
import argparse
import json
import subprocess
import sys
import urllib.parse
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

OUT_DIR = Path("/Users/nicholas/clawd/_findings")
OUT_JSON = OUT_DIR / f"MEOK_E2E_AUDIT_{datetime.now(timezone.utc).strftime('%Y-%m-%d_%H%M%S')}.json"
OUT_HTML = OUT_DIR / f"MEOK_E2E_AUDIT_{datetime.now(timezone.utc).strftime('%Y-%m-%d_%H%M%S')}.html"


@dataclass
class Check:
    category: str
    name: str
    url: str
    expected: str
    status: str = "pending"
    code: str = ""
    latency_ms: float = 0.0
    detail: str = ""
    body_snippet: str = ""


def curl(url: str, method: str = "GET", headers: Optional[dict] = None, data: Optional[str] = None, timeout: int = 10) -> tuple:
    tmp = f"/tmp/meok_audit_body_{datetime.now(timezone.utc).timestamp()}"
    cmd = ["curl", "-s", "-o", tmp, "-w", "%{http_code}|%{time_total}", "-L", "--max-time", str(timeout)]
    if headers:
        for k, v in headers.items():
            cmd += ["-H", f"{k}: {v}"]
    if data:
        cmd += ["-d", data]
    cmd += ["-X", method, url]
    try:
        start = datetime.now(timezone.utc)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 2)
        elapsed = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        out = result.stdout.strip()
        parts = out.split("|")
        code = parts[0] if parts else "000"
        latency = float(parts[1]) * 1000 if len(parts) > 1 else elapsed
        body = Path(tmp).read_text(errors="ignore")[:300] if Path(tmp).exists() else ""
        return code, latency, body
    except Exception as e:
        return "000", 0.0, str(e)


def ssh_cmd(command: str, timeout: int = 20) -> tuple:
    try:
        start = datetime.now(timezone.utc)
        result = subprocess.run(["ssh", "meok-backend", command], capture_output=True, text=True, timeout=timeout)
        elapsed = (datetime.now(timezone.utc) - start).total_seconds() * 1000
        return result.returncode, elapsed, result.stdout.strip()[:500], result.stderr.strip()[:200]
    except Exception as e:
        return -1, 0.0, "", str(e)


def run_checks(preview_url: Optional[str]) -> list:
    checks: list[Check] = []

    # ── Mac services ──────────────────────────────────────────────────────────
    mac_services = [
        ("Mac Services", "MEOK_UI", "http://127.0.0.1:3000/", "200"),
        ("Mac Services", "SOV3", "http://127.0.0.1:3101/health", "200"),
        ("Mac Services", "MEOK_MCP", "http://127.0.0.1:3102/health", "200"),
        ("Mac Services", "MEOK_API", "http://127.0.0.1:3200/health", "200"),
        ("Mac Services", "Farm_Vision", "http://127.0.0.1:8888/", "200"),
        ("Mac Services", "Sovereign Town", "http://127.0.0.1:3940/", "200"),
        ("Mac Services", "FreeLLMAPI", "http://127.0.0.1:3001/v1/models", "401"),
    ]
    for cat, name, url, expected in mac_services:
        code, latency, body = curl(url)
        status = "pass" if code == expected else "fail"
        checks.append(Check(cat, name, url, expected, status, code, latency, "", body[:120]))

    # ── VM services ───────────────────────────────────────────────────────────
    vm_services = [
        ("VM Services", "SOV3 VM", "http://127.0.0.1:3101/health", "200"),
        ("VM Services", "King Hive", "http://127.0.0.1:8077/api/health", "200"),
        ("VM Services", "Keystone", "http://127.0.0.1:8888/", "200"),
        ("VM Services", "EU Gateway", "http://127.0.0.1:8889/health", "200"),
        ("VM Services", "OLM Router", "http://127.0.0.1:8890/health", "200"),
        ("VM Services", "Dashboard", "http://127.0.0.1:8891/health", "200"),
    ]
    for cat, name, url, expected in vm_services:
        code, latency, body = curl(url)
        status = "pass" if code == expected else "fail"
        # Some services may not have /health but serve /
        if status == "fail" and expected == "200":
            alt_url = url.replace("/health", "") if "/health" in url else url
            code2, latency2, body2 = curl(alt_url)
            if code2 == "200":
                code, latency, body = code2, latency2, body2
                status = "pass"
        checks.append(Check(cat, name, url, expected, status, code, latency, "", body[:120]))

    # ── Bridge integrations ───────────────────────────────────────────────────
    bridge_payload = json.dumps({
        "jsonrpc": "2.0", "id": "audit", "method": "tools/call",
        "params": {"name": "bridge_think", "arguments": {"message": "audit check", "profile": "local_only", "character": "aria", "tier": "pro", "user_id": "audit"}}
    })
    code, latency, body = curl("http://127.0.0.1:3101/mcp", method="POST", headers={"Content-Type": "application/json"}, data=bridge_payload, timeout=120)
    status = "pass" if code == "200" and "reply" in body else "fail"
    checks.append(Check("Bridges", "SOV3 bridge_think", "http://127.0.0.1:3101/mcp", "200 reply", status, code, latency, f"{latency:.0f} ms", body[:120]))

    # King Hive → town feed freshness
    feed_path = Path("/Users/nicholas/clawd/policy-lab/town_feed.json")
    if feed_path.exists():
        feed = json.loads(feed_path.read_text())
        generated = feed.get("generated_at", "unknown")
        rounds = feed.get("summary", {}).get("king_hive", {}).get("total_rounds", 0)
        attestable = feed.get("summary", {}).get("king_hive", {}).get("attestable", 0)
        detail = f"{rounds} rounds, {attestable} attestable, generated {generated}"
        status = "pass" if rounds > 0 else "fail"
    else:
        detail = "town_feed.json not found"
        status = "fail"
    checks.append(Check("Data", "Town Feed Freshness", str(feed_path), "present", status, "", 0.0, detail, ""))

    # ── Frontend routes ───────────────────────────────────────────────────────
    front_url = preview_url or "https://try.meok.ai"
    front_routes = [
        ("Frontend", "Home", f"{front_url}/", "200"),
        ("Frontend", "/town-3d", f"{front_url}/town-3d", "200"),
        ("Frontend", "/apps", f"{front_url}/apps", "200"),
        ("Frontend", "/api/health", f"{front_url}/api/health", "200"),
        ("Frontend", "/api/sov3/think", f"{front_url}/api/sov3/think", "405"),
    ]
    for cat, name, url, expected in front_routes:
        code, latency, body = curl(url, timeout=15)
        status = "pass" if code == expected else "fail"
        checks.append(Check(cat, name, url, expected, status, code, latency, "", body[:120]))

    # ── Env checks (non-sensitive) ────────────────────────────────────────────
    rc, _, out, err = ssh_cmd("source /home/nicholas/sov3/.env 2>/dev/null; echo MEOK_MASTER_API_KEY=${MEOK_MASTER_API_KEY:+set}; echo SOV3_MCP_URL=${SOV3_MCP_URL:-missing}")
    status = "pass" if rc == 0 and "set" in out else "warn"
    checks.append(Check("Env", "VM MEOK_MASTER_API_KEY", "ssh meok-backend env", "set", status, str(rc), 0.0, out, err))

    return checks


def render_html(checks: list) -> str:
    passed = sum(1 for c in checks if c.status == "pass")
    failed = sum(1 for c in checks if c.status == "fail")
    warned = sum(1 for c in checks if c.status == "warn")
    total = len(checks)

    categories = sorted(set(c.category for c in checks))
    rows = ""
    for c in checks:
        icon = "✅" if c.status == "pass" else "⚠️" if c.status == "warn" else "❌"
        rows += f"""
        <tr class="{c.status}">
          <td>{icon}</td>
          <td>{c.category}</td>
          <td>{c.name}</td>
          <td>{c.code}</td>
          <td>{c.latency_ms:.0f} ms</td>
          <td>{c.detail}</td>
          <td><code>{c.body_snippet[:80]}</code></td>
        </tr>
        """

    category_cards = ""
    for cat in categories:
        cat_checks = [c for c in checks if c.category == cat]
        cat_pass = sum(1 for c in cat_checks if c.status == "pass")
        cat_total = len(cat_checks)
        pct = int(100 * cat_pass / cat_total) if cat_total else 0
        color = "#22c55e" if pct == 100 else "#eab308" if pct >= 50 else "#ef4444"
        category_cards += f"""
        <div class="card">
          <h3>{cat}</h3>
          <div class="score" style="color:{color}">{cat_pass}/{cat_total}</div>
          <div class="bar"><div class="fill" style="width:{pct}%;background:{color}"></div></div>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MEOK E2E Audit — {datetime.now(timezone.utc).isoformat()}</title>
  <style>
    body {{ font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }}
    h1 {{ margin-bottom: .25rem; }}
    .subtitle {{ color: #94a3b8; margin-bottom: 2rem; }}
    .summary {{ display: flex; gap: 1rem; margin-bottom: 2rem; }}
    .summary-box {{ background: #1e293b; padding: 1rem 1.5rem; border-radius: .75rem; min-width: 120px; text-align: center; }}
    .summary-box .num {{ font-size: 2rem; font-weight: bold; }}
    .summary-box .label {{ color: #94a3b8; font-size: .875rem; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
    .card {{ background: #1e293b; padding: 1rem; border-radius: .75rem; }}
    .card h3 {{ margin: 0 0 .5rem; font-size: 1rem; }}
    .score {{ font-size: 1.75rem; font-weight: bold; }}
    .bar {{ height: 6px; background: #334155; border-radius: 3px; margin-top: .5rem; overflow: hidden; }}
    .fill {{ height: 100%; border-radius: 3px; }}
    table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: .75rem; overflow: hidden; }}
    th, td {{ padding: .75rem 1rem; text-align: left; border-bottom: 1px solid #334155; font-size: .875rem; }}
    th {{ background: #0f172a; color: #94a3b8; font-weight: 600; }}
    tr.pass {{ border-left: 4px solid #22c55e; }}
    tr.warn {{ border-left: 4px solid #eab308; }}
    tr.fail {{ border-left: 4px solid #ef4444; }}
    code {{ background: #0f172a; padding: .15rem .35rem; border-radius: .25rem; font-size: .75rem; }}
  </style>
</head>
<body>
  <h1>MEOK E2E Audit</h1>
  <div class="subtitle">Generated {datetime.now(timezone.utc).isoformat()} UTC</div>

  <div class="summary">
    <div class="summary-box"><div class="num" style="color:#22c55e">{passed}</div><div class="label">Pass</div></div>
    <div class="summary-box"><div class="num" style="color:#ef4444">{failed}</div><div class="label">Fail</div></div>
    <div class="summary-box"><div class="num" style="color:#eab308">{warned}</div><div class="label">Warn</div></div>
    <div class="summary-box"><div class="num">{total}</div><div class="label">Total</div></div>
  </div>

  <div class="grid">
    {category_cards}
  </div>

  <table>
    <thead>
      <tr><th>Status</th><th>Category</th><th>Check</th><th>HTTP</th><th>Latency</th><th>Detail</th><th>Body Snippet</th></tr>
    </thead>
    <tbody>
      {rows}
    </tbody>
  </table>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview-url", default=None, help="Frontend preview URL to test")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    checks = run_checks(args.preview_url)

    # JSON report
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "preview_url": args.preview_url,
        "summary": {
            "pass": sum(1 for c in checks if c.status == "pass"),
            "fail": sum(1 for c in checks if c.status == "fail"),
            "warn": sum(1 for c in checks if c.status == "warn"),
            "total": len(checks),
        },
        "checks": [c.__dict__ for c in checks],
    }
    OUT_JSON.write_text(json.dumps(report, indent=2, default=str))

    # HTML report
    OUT_HTML.write_text(render_html(checks))

    print(f"Audit complete: {report['summary']['pass']} pass, {report['summary']['fail']} fail, {report['summary']['warn']} warn")
    print(f"JSON: {OUT_JSON}")
    print(f"HTML: {OUT_HTML}")
    sys.exit(0 if report['summary']['fail'] == 0 else 1)


if __name__ == "__main__":
    main()
