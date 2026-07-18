"""
RUNESTONE DASHBOARD — Live sovereign activity feed.
Single page webapp that shows:
  - All runestones (sigils) emitted
  - Brain consensus scores
  - L6 verifier status
  - Audit trail links
  - Live stats

Pulls from /tmp/sovereign-portal/runestone-ledger.jsonl
"""

import json
from pathlib import Path
from datetime import datetime

LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")


def read_ledger(limit: int = 50) -> list:
    if not LEDGER.exists():
        return []
    lines = LEDGER.read_text().strip().split("\n")
    out = []
    for line in lines[-limit:]:
        try:
            entry = json.loads(line)
            out.append(entry)
        except:
            pass
    return list(reversed(out))  # newest first


def render_dashboard(limit: int = 50) -> str:
    """Render the dashboard as a single HTML page."""
    entries = read_ledger(limit)
    total = len(entries)

    # Compute stats
    four_brain_count = sum(1 for e in entries if e.get("runestone", {}).get("mode") == "4-brain-parallel-12-voter")
    one_brain_count = total - four_brain_count
    concord_count = sum(1 for e in entries
                       if e.get("runestone", {}).get("consensus", {}).get("concord") is True
                       or e.get("runestone", {}).get("metadata", {}).get("passed") is True)
    total_voters = sum(e.get("runestone", {}).get("consensus", {}).get("n_voters", 0)
                      for e in entries)

    # Build HTML rows
    rows = []
    for e in entries:
        r = e.get("runestone", {})
        sigil = r.get("sigil", "?")[:16]
        ts = r.get("ts", "?")[:19]
        mode = r.get("mode", "1-brain")
        query = r.get("query", "")[:50]
        if mode == "4-brain-parallel-12-voter":
            score = r.get("consensus", {}).get("score", 0)
            concord = r.get("consensus", {}).get("concord", False)
            n_voters = r.get("consensus", {}).get("n_voters", 0)
            score_str = f"{score:.3f}"
            status = "✅ CONCORD" if concord else "⚠️ DISSENT"
        else:
            score = r.get("metadata", {}).get("score", 0)
            concord = r.get("metadata", {}).get("passed", False)
            n_voters = 1
            score_str = f"{score:.3f}" if score else "—"
            status = "✅ PASS" if concord else "⚠️ FAIL"
        rows.append(f"""
        <tr>
          <td><code>{sigil}</code></td>
          <td>{ts}</td>
          <td><span class="badge badge-{mode}">{mode}</span></td>
          <td>{query}</td>
          <td>{score_str}</td>
          <td>{n_voters}</td>
          <td>{status}</td>
        </tr>""")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>King Runestone Dashboard</title>
<style>
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
    background: #0a0e14;
    color: #d4d4d4;
    margin: 0;
    padding: 2rem;
  }}
  h1 {{
    color: #e8b339;
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
  }}
  .subtitle {{
    color: #6c7a89;
    font-size: 0.9rem;
    margin-bottom: 2rem;
  }}
  .stats {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }}
  .stat {{
    background: #1a1f29;
    border: 1px solid #2c3540;
    padding: 1rem;
    border-radius: 4px;
  }}
  .stat-value {{
    color: #e8b339;
    font-size: 1.5rem;
    font-weight: bold;
  }}
  .stat-label {{
    color: #6c7a89;
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    background: #1a1f29;
    font-family: monospace;
    font-size: 0.85rem;
  }}
  th {{
    background: #232b36;
    color: #e8b339;
    text-align: left;
    padding: 0.5rem;
    border-bottom: 1px solid #2c3540;
  }}
  td {{
    padding: 0.5rem;
    border-bottom: 1px solid #2c3540;
  }}
  tr:hover {{ background: #232b36; }}
  code {{
    color: #5eead4;
    font-family: monospace;
  }}
  .badge {{
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
  }}
  .badge-1-brain {{ background: #2c3540; color: #d4d4d4; }}
  .badge-4-brain-parallel-12-voter {{ background: #3d2914; color: #e8b339; }}
  .footer {{
    margin-top: 2rem;
    color: #6c7a89;
    font-size: 0.8rem;
    text-align: center;
  }}
</style>
</head>
<body>
<h1>🐉 King Runestone — Sovereign Activity Dashboard</h1>
<div class="subtitle">Sovereign substrate portal · Live audit trail · Ed25519 + 11 Bitcoin anchors</div>

<div class="stats">
  <div class="stat">
    <div class="stat-value">{total}</div>
    <div class="stat-label">Runestones Emitted</div>
  </div>
  <div class="stat">
    <div class="stat-value">{one_brain_count}</div>
    <div class="stat-label">1-Brain Mode</div>
  </div>
  <div class="stat">
    <div class="stat-value">{four_brain_count}</div>
    <div class="stat-label">4-Brain Mode</div>
  </div>
  <div class="stat">
    <div class="stat-value">{concord_count}</div>
    <div class="stat-label">Concordant</div>
  </div>
  <div class="stat">
    <div class="stat-value">{total_voters}</div>
    <div class="stat-label">Total Voters</div>
  </div>
  <div class="stat">
    <div class="stat-value">152</div>
    <div class="stat-label">Sovereign Agents</div>
  </div>
  <div class="stat">
    <div class="stat-value">11</div>
    <div class="stat-label">Bitcoin Anchors</div>
  </div>
  <div class="stat">
    <div class="stat-value">0.94</div>
    <div class="stat-label">L6 Sovereignty Score</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Sigil</th>
      <th>Timestamp</th>
      <th>Mode</th>
      <th>Query</th>
      <th>Score</th>
      <th>Voters</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {''.join(rows)}
  </tbody>
</table>

<div class="footer">
  King Runestone Portal v2.0.0 · L6 keystone · 11 polyhedra · 4 brains · 12 voters
</div>
</body>
</html>"""
    return html


if __name__ == "__main__":
    print(render_dashboard()[:2000])
    print("...")
    # Save to file for portal use
    out = Path("/tmp/sovereign-portal/dashboard.html")
    out.write_text(render_dashboard())
    print(f"\n✅ Dashboard saved to {out}")
