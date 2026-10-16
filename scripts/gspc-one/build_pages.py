#!/usr/bin/env python3
"""Build per-class GSPC leaderboard pages from public/interop/gspc-one.json.
Rules (Measure, 16 Oct 2026): never ranked or pooled across groups; unsigned rows labelled
UNSIGNED; census grids show state, evidence URL and date with no totals and no ordering."""
import json, html, os, sys, collections
root = sys.argv[1] if len(sys.argv) > 1 else "."
d = json.load(open(os.path.join(root, "public/interop/gspc-one.json"), encoding="utf-8"))
NOTE = {
 "ai-lab": "Unsigned state grid. Not a ranking: no score, no totals, no ordering.",
 "measurer-harness-org": "Unsigned state grid of organisations that publish AI evaluation results. Not a ranking: no score, no totals, no ordering.",
 "mcp-server": "Unsigned outcome table per hashed endpoint. Not a ranking. One probe per endpoint; a group with fewer than 30 attempts shows 'insufficient n'.",
 "agent": "Unsigned. Not a ranking.",
 "model": "Signed cards. Rows are grouped by comparison group and never ranked across groups. Listed alphabetically.",
 "board-axis": "One row per board axis. Each row carries its own lane and group.",
}
esc = lambda s: html.escape(str(s))
def page(title, body):
    return f"<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><title>{esc(title)} · GSPC · Council of AI</title><style>body{{font:15px system-ui;max-width:1100px;margin:2em auto;padding:0 1em;color:#111}}table{{border-collapse:collapse;width:100%}}td,th{{border:1px solid #ddd;padding:4px 6px;text-align:left;font-size:13px}}.u{{color:#a15c00;font-weight:600}}.s{{color:#036b2e;font-weight:600}}</style><h1>{esc(title)}</h1>{body}<p><small>Source: <a href=/interop/gspc-one.json>/interop/gspc-one.json</a> ({esc(d['schema'])}). Measurement, not certification. CC-BY-4.0, Council of AI (CSOAI Ltd 16939677).</small></p>"
by = collections.defaultdict(list)
for r in d["rows"]: by[r["subject_class"]].append(r)
out = os.path.join(root, "public/leaderboards"); os.makedirs(out, exist_ok=True)
links = []
for cls, rows in sorted(by.items()):
    groups = collections.defaultdict(list)
    for r in rows: groups[r["group"]].append(r)
    body = f"<p>{esc(NOTE.get(cls,''))}</p>"
    if cls == "mcp-server": body += f"<p>Endpoint key scheme: {esc(d['mcp_endpoint_key_scheme'])}</p>"
    for g, gr in sorted(groups.items()):
        gr = sorted(gr, key=lambda r: (r["subject"].lower(), r["axis"]))  # alphabetical, never by result
        nnote = " — insufficient n" if cls == "mcp-server" and len(gr) < 30 else ""
        body += f"<h2>Group: {esc(g)}{esc(nnote)}</h2><table><tr><th>Subject</th><th>Axis / check</th><th>Result / state</th><th>Lane</th><th>Evidence</th><th>As of</th></tr>"
        for r in gr:
            lane = "<span class=s>signed</span>" if r["lane"] == "signed" else "<span class=u>UNSIGNED</span>"
            body += f"<tr><td>{esc(r['subject'])}</td><td>{esc(r['axis'])}</td><td>{esc(r['result'])}</td><td>{lane}</td><td><a href='{esc(r['evidence_url'])}'>evidence</a></td><td>{esc(r['as_of'])}</td></tr>"
        body += "</table>"
    os.makedirs(os.path.join(out, cls), exist_ok=True)
    open(os.path.join(out, cls, "index.html"), "w", encoding="utf-8").write(page(f"GSPC leaderboard: {cls}", body))
    links.append(f"<li><a href=/leaderboards/{cls}/>{esc(cls)}</a></li>")
for cls, state in d["planned_classes"].items():
    os.makedirs(os.path.join(out, cls), exist_ok=True)
    open(os.path.join(out, cls, "index.html"), "w", encoding="utf-8").write(page(f"GSPC: {cls}", f"<p><b>{esc(state)}</b></p><p>No rows. Shown as not yet measured, never as zero.</p>"))
    links.append(f"<li><a href=/leaderboards/{cls}/>{esc(cls)}</a>: {esc(state)}</li>")
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page("GSPC leaderboards by subject class", "<p>One page per class. Nothing is ranked or pooled across comparison groups.</p><ul>" + "".join(links) + "</ul>"))
print("built", len(links), "pages")
