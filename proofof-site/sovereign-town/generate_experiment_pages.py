#!/usr/bin/env python3
"""Generate static regulator-view HTML pages for each Sovereign Town experiment.

Reads experiment JSONs from ../../sovereign-town/p0_aqua/experiments/ and writes
experiments/{id}.html pages that match the gallery links in experiments.html.
"""
import json
import os
from pathlib import Path

HERE = Path(__file__).parent
SRC_DIR = HERE.parent.parent / "sovereign-town" / "p0_aqua" / "experiments"
OUT_DIR = HERE / "experiments"


def pct_fmt(x):
    if x is None:
        return "—"
    return f"{x * 100:.1f}%"


def num_fmt(x):
    if x is None:
        return "—"
    if isinstance(x, float):
        return f"{x:.2f}"
    return str(x)


def escape_html(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def render_experiment(data: dict) -> str:
    exp_id = data["id"]
    name = data["name"]
    status = data.get("status", "proposed")
    hypothesis = data.get("hypothesis", "")
    regulation = data.get("regulation", "")
    industry = data.get("industry", "general")
    civilization = data.get("civilization", "Sovereign Town")
    duration = data.get("duration_sim_days", 14)
    treatment = data.get("towns", {}).get("treatment", {})
    control = data.get("towns", {}).get("control", {})
    vote = data.get("vote", {})
    report = data.get("report", {})
    improvement = report.get("improvement", {}) if report else {}
    t_rep = report.get("treatment", {}) if report else {}
    c_rep = report.get("control", {}) if report else {}

    articles = data.get("regulation_articles", [])
    articles_html = ""
    if articles:
        articles_html = "<ul>" + "".join(f"<li>{escape_html(a)}</li>" for a in articles) + "</ul>"

    vote_rows = ""
    if vote and "votes" in vote:
        vote_rows = "".join(
            f"<tr><td>{escape_html(v['member'])}</td><td>{escape_html(v['vote'])}</td><td>{escape_html(v.get('reason',''))}</td></tr>"
            for v in vote["votes"]
        )

    results_rows = ""
    if t_rep and c_rep:
        results_rows = f"""
        <tr><td>Total incidents</td><td>{num_fmt(t_rep.get('total_incidents'))}</td><td>{num_fmt(c_rep.get('total_incidents'))}</td></tr>
        <tr><td>Detected</td><td>{num_fmt(t_rep.get('detected'))}</td><td>{num_fmt(c_rep.get('detected'))}</td></tr>
        <tr><td>Missed</td><td>{num_fmt(t_rep.get('missed'))}</td><td>{num_fmt(c_rep.get('missed'))}</td></tr>
        <tr><td>Detection rate</td><td>{pct_fmt(t_rep.get('detection_rate'))}</td><td>{pct_fmt(c_rep.get('detection_rate'))}</td></tr>
        <tr><td>Mean detection time</td><td>{num_fmt(t_rep.get('mean_detection_hours'))} h</td><td>{num_fmt(c_rep.get('mean_detection_hours'))} h</td></tr>
        <tr><td>False positive rate</td><td>{pct_fmt(t_rep.get('false_positive_rate'))}</td><td>{pct_fmt(c_rep.get('false_positive_rate'))}</td></tr>
        <tr><td>Cost index (sim units)</td><td>{num_fmt(t_rep.get('cost_index'))}</td><td>{num_fmt(c_rep.get('cost_index'))}</td></tr>
        <tr><td>Final trust</td><td>{num_fmt(t_rep.get('summary', {}).get('final_trust'))}</td><td>{num_fmt(c_rep.get('summary', {}).get('final_trust'))}</td></tr>
        """

    improvement_rows = ""
    if improvement:
        improvement_rows = "".join(
            f"<tr><td>{escape_html(k.replace('_', ' ').title())}</td><td>{num_fmt(v)}</td></tr>"
            for k, v in improvement.items()
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape_html(name)} — Regulator View | CSOAI</title>
  <meta name="description" content="Public regulator view of the Sovereign Town {escape_html(data.get('regulation',''))} experiment.">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none';">
  <style>
    :root {{ --bg:#0b1020; --panel:#111a30; --text:#e6e9f0; --muted:#8b92a8; --accent:#2dd4bf; --warn:#f59e0b; --danger:#ef4444; --ok:#22c55e; }}
    * {{ box-sizing: border-box; }}
    body {{ margin:0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:var(--bg); color:var(--text); line-height:1.55; }}
    main {{ max-width: 880px; margin: 0 auto; padding: 2rem 1rem; }}
    header {{ border-bottom: 1px solid #1f2a44; padding-bottom: 1rem; margin-bottom: 1.5rem; }}
    h1 {{ font-size: 1.55rem; margin: 0 0 .25rem; }}
    .subtitle {{ color: var(--muted); font-size: .95rem; }}
    .badge {{ display:inline-block; padding:.2rem .55rem; border-radius:999px; font-size:.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.03em; background:#1f2a44; color:var(--muted); }}
    .badge.proposed {{ color: var(--warn); }}
    .badge.running {{ color: var(--accent); }}
    .badge.proven {{ color: var(--ok); }}
    .panel {{ background: var(--panel); border: 1px solid #1f2a44; border-radius: .75rem; padding: 1.25rem; margin-bottom: 1rem; }}
    h2 {{ font-size: 1.15rem; margin: 0 0 .75rem; color: var(--accent); }}
    dl {{ display: grid; grid-template-columns: 10rem 1fr; gap: .35rem 1rem; margin: 0; }}
    dt {{ color: var(--muted); }}
    dd {{ margin: 0; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }}
    .metric {{ text-align: center; padding: 1rem; background: #0b1020; border: 1px solid #1f2a44; border-radius: .5rem; }}
    .metric .value {{ font-size: 1.75rem; font-weight: 700; color: var(--text); }}
    .metric .label {{ font-size: .8rem; color: var(--muted); margin-top: .25rem; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: .75rem; }}
    th, td {{ text-align: left; padding: .55rem .5rem; border-bottom: 1px solid #1f2a44; }}
    th {{ color: var(--muted); font-weight: 600; }}
    .disclaimer {{ background: #1a1020; border-left: 4px solid var(--warn); padding: .75rem 1rem; border-radius: 0 .5rem .5rem 0; color: #f3e8ff; font-size: .9rem; }}
    footer {{ margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #1f2a44; color: var(--muted); font-size: .85rem; }}
    a {{ color: var(--accent); }}
    a:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
    .skip-link {{ position:absolute; left:-9999px; z-index:1000; background:var(--bg); color:var(--text); padding:.5rem 1rem; }}
    .skip-link:focus {{ left:1rem; top:1rem; }}
  </style>
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>
  <main id="main">
    <header>
      <span class="badge {escape_html(status)}" id="status-badge">{escape_html(status)}</span>
      <h1>{escape_html(name)}</h1>
      <p class="subtitle">{escape_html(treatment.get('name','Treatment'))} vs {escape_html(control.get('name','Control'))} under {escape_html(regulation)}</p>
    </header>

    <section class="panel" aria-labelledby="design-heading">
      <h2 id="design-heading">Experiment design</h2>
      <dl>
        <dt>Hypothesis</dt>
        <dd>{escape_html(hypothesis)}</dd>
        <dt>Regulation</dt>
        <dd>{escape_html(regulation)}</dd>
        <dt>Articles</dt>
        <dd>{articles_html or '—'}</dd>
        <dt>Industry</dt>
        <dd>{escape_html(industry)} — {escape_html(civilization)}</dd>
        <dt>Duration</dt>
        <dd>{escape_html(duration)} simulated days</dd>
        <dt>Treatment</dt>
        <dd>{escape_html(treatment.get('name',''))} — {escape_html(treatment.get('note',''))}</dd>
        <dt>Control</dt>
        <dd>{escape_html(control.get('name',''))} — {escape_html(control.get('note',''))}</dd>
      </dl>
    </section>

    <section class="panel" aria-labelledby="results-heading">
      <h2 id="results-heading">Aggregate simulation results</h2>
      <p style="color:var(--muted); font-size:.9rem;">No individual agent identities or raw ledger entries are published.</p>
      <table>
        <thead>
          <tr><th>Metric</th><th>Automated (treatment)</th><th>Manual (control)</th></tr>
        </thead>
        <tbody>
          {results_rows or '<tr><td colspan="3">Results pending.</td></tr>'}
        </tbody>
      </table>
    </section>

    {('<section class="panel" aria-labelledby="improvement-heading"><h2 id="improvement-heading">Improvement summary</h2><table><tbody>' + improvement_rows + '</tbody></table></section>') if improvement_rows else ''}

    {('<section class="panel" aria-labelledby="vote-heading"><h2 id="vote-heading">Council vote</h2><table><thead><tr><th>Member</th><th>Vote</th><th>Reason</th></tr></thead><tbody>' + vote_rows + '</tbody></table></section>') if vote_rows else ''}

    <div class="disclaimer" role="note">
      <strong>Simulation disclaimer.</strong> All outputs are prediction from a governed-vs-ungoverned multi-agent simulation. No real firms are asserted non-compliant. Use as research input, not legal advice.
    </div>

    <footer>
      <p><a href="/sovereign-town/experiments.html">← Policy Lab gallery</a> · <a href="/sovereign-town/">Sovereign Town</a> · <a href="/sovereign-town/fleet-status.html">Fleet status</a></p>
    </footer>
  </main>
</body>
</html>
"""


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generated = []
    for path in sorted(SRC_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        exp_id = data.get("id")
        if not exp_id:
            print(f"Skipping {path.name}: no id")
            continue
        html = render_experiment(data)
        out_path = OUT_DIR / f"{exp_id}.html"
        out_path.write_text(html, encoding="utf-8")
        generated.append(out_path.name)
        print(f"Wrote {out_path}")
    if not generated:
        print("No experiment JSONs found.")


if __name__ == "__main__":
    main()
