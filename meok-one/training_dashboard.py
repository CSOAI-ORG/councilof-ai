#!/usr/bin/env python3
"""Training dashboard — HTML view of training progress."""
import json
from pathlib import Path
from datetime import datetime

PLANETS = Path("/tmp/owem-planets/planets.json")


def render_training_dashboard() -> str:
    """Render training dashboard as HTML."""
    if not PLANETS.exists():
        return "<html><body><h1>No training data yet</h1></body></html>"
    
    d = json.loads(PLANETS.read_text())
    planets = d.get("planets", {})
    cycles = d.get("cycles", 0)
    total_examples = sum(len(p) for p in planets.values() if isinstance(p, list))
    
    # Build planet rows
    rows = []
    for name, examples in planets.items():
        if isinstance(examples, list) and examples:
            scores = [e.get("score", 0) for e in examples]
            avg_score = sum(scores) / len(scores)
            lift = scores[-1] - scores[0] if len(scores) > 1 else 0
            rows.append(f"""
            <tr>
                <td>{name}</td>
                <td>{len(examples)}</td>
                <td>{avg_score:.3f}</td>
                <td>{scores[0]:.3f}</td>
                <td>{scores[-1]:.3f}</td>
                <td>{lift:+.3f}</td>
            </tr>""")
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Training Dashboard</title>
    <style>
        body {{ font-family: monospace; background: #0a0e14; color: #d4d4d4; padding: 2rem; }}
        h1 {{ color: #e8b339; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #2c3540; padding: 0.5rem; text-align: left; }}
        th {{ background: #232b36; color: #e8b339; }}
        .stats {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0; }}
        .stat {{ background: #1a1f29; padding: 1rem; border-radius: 4px; }}
        .stat-value {{ color: #e8b339; font-size: 1.5rem; }}
    </style>
</head>
<body>
    <h1>🐉 Training Dashboard</h1>
    <div class="stats">
        <div class="stat">
            <div class="stat-value">{cycles}</div>
            <div>Training Cycles</div>
        </div>
        <div class="stat">
            <div class="stat-value">{total_examples}</div>
            <div>Total Examples</div>
        </div>
        <div class="stat">
            <div class="stat-value">{len(planets)}</div>
            <div>Planets</div>
        </div>
    </div>
    <table>
        <tr>
            <th>Planet</th>
            <th>Examples</th>
            <th>Avg Score</th>
            <th>First</th>
            <th>Last</th>
            <th>Lift</th>
        </tr>
        {''.join(rows)}
    </table>
</body>
</html>"""
    return html


if __name__ == "__main__":
    html = render_training_dashboard()
    print(f"Dashboard HTML: {len(html)} bytes")
    # Save to file
    Path("/tmp/training-dashboard.html").write_text(html)
    print("Saved to /tmp/training-dashboard.html")
