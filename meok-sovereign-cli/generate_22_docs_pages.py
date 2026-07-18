#!/usr/bin/env python3.11
"""generate_22_docs_pages.py — Convert 22 MCP READMEs into a docs site."""
import os
import re
from pathlib import Path

MCP_ROOT = Path("/Users/nicholas/clawd/mcp-marketplace")
OUT_ROOT = Path("/Users/nicholas/clawd/proofof-site/docs")

MCP_LIST = [
    ("passport", "🛂", "Ed25519 Agent Identity"),
    ("guardrails", "🛡️", "Prompt Injection Defense"),
    ("receipt", "📜", "Hash-Chained Audit Receipts"),
    ("governance", "⚖️", "5-Element Zero Trust"),
    ("x402-payment", "💎", "HTTP 402 Micropayments"),
    ("globe", "🌍", "33-Hive Geo Registry"),
    ("council", "🏛️", "12-Around-1 BFT Voting"),
    ("memory", "🧠", "Episodic + Graph Memory"),
    ("avatar", "🐉", "VRM Embodied Avatar"),
    ("skills", "⚙️", "Skill Lifecycle"),
    ("eu-ai-act-kit", "🇪🇺", "EU AI Act Survival Kit"),
    ("worm", "🐛", "Morris-II Defensive Guard"),
    ("defence", "🛡️", "Defensive Doctrine"),
    ("satellite", "🛰️", "Free Satellite Sources"),
    ("honour", "🪖", "19 Sovereign Factors"),
    ("immortal", "∞", "Eternal Memory Ledger"),
    ("dora", "📋", "EU DORA 5-Pillar Audit"),
    ("iso42001", "📚", "ISO/IEC 42001 AIMS"),
    ("iot", "📡", "iOK Farm IoT"),
    ("pond", "🐟", "Koi Pond Care"),
    ("intuition", "🔮", "16-dim Mamba-2 Hunch"),
    ("supply-chain", "📦", "SBOM + SLSA + Bitcoin"),
]


def md_to_html(md):
    """Minimal markdown to HTML for the docs."""
    html = []
    in_code = False
    for line in md.split("\n"):
        if line.startswith("```"):
            if not in_code:
                lang = line[3:].strip() or "text"
                html.append(f'<pre><code class="language-{lang}">')
                in_code = True
            else:
                html.append("</code></pre>")
                in_code = False
        elif in_code:
            html.append(line.replace("<", "&lt;").replace(">", "&gt;"))
        elif line.startswith("# "):
            html.append(f"<h1>{line[2:]}</h1>")
        elif line.startswith("## "):
            html.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("### "):
            html.append(f"<h3>{line[4:]}</h3>")
        elif line.startswith("- "):
            html.append(f"<li>{line[2:]}</li>")
        elif line.startswith("|"):
            html.append(f"</p><p>{line}</p>")
        elif line.strip() == "":
            html.append("")
        else:
            html.append(f"<p>{line}</p>")
    return "\n".join(html)


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{emoji} {name} — meok-sovereign-{mcp}-mcp docs</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    background: #020202; color: #f8fafc; min-height: 100vh;
    display: grid; grid-template-columns: 280px 1fr;
  }}
  nav {{
    background: rgba(10,20,15,0.7); padding: 20px; height: 100vh;
    overflow-y: auto; border-right: 1px solid rgba(74,222,128,0.2);
  }}
  nav h1 {{ color: #fbbf24; font-size: 1.1rem; margin-bottom: 16px; }}
  nav h2 {{ color: #4ade80; font-size: 0.75rem; text-transform: uppercase;
    margin: 16px 0 6px; letter-spacing: 1px; }}
  nav a {{
    display: block; color: #cbd5e1; text-decoration: none;
    padding: 4px 8px; font-size: 0.85rem; border-radius: 4px;
  }}
  nav a:hover {{ background: rgba(74,222,128,0.15); color: #4ade80; }}
  main {{ padding: 40px; max-width: 900px; }}
  h1 {{ color: #fbbf24; font-size: 2rem; margin-bottom: 12px; border-bottom: 1px solid rgba(74,222,128,0.2); padding-bottom: 12px; }}
  h2 {{ color: #4ade80; margin: 30px 0 12px; font-size: 1.4rem; }}
  h3 {{ color: #c9a84c; margin: 20px 0 10px; font-size: 1.1rem; }}
  p, li {{ color: #cbd5e1; line-height: 1.7; margin: 8px 0; }}
  pre {{
    background: #000; color: #4ade80; padding: 16px;
    border-radius: 8px; overflow-x: auto; font-size: 0.85rem;
    border: 1px solid rgba(74,222,128,0.3); margin: 12px 0;
  }}
  code {{ background: rgba(74,222,128,0.1); padding: 2px 6px;
    border-radius: 3px; color: #4ade80; font-family: 'JetBrains Mono', monospace; }}
  pre code {{ background: none; padding: 0; }}
  li {{ margin-left: 24px; }}
  .breadcrumb {{ color: #94a3b8; font-size: 0.85rem; margin-bottom: 16px; }}
  .breadcrumb a {{ color: #4ade80; text-decoration: none; }}
</style>
</head>
<body>
<nav>
  <h1>🜏 Sovereign MCP Docs</h1>
  {nav}
  <hr style="border-color: rgba(74,222,128,0.2); margin: 20px 0;">
  <a href="../sovereign-mcps/" style="color: #fbbf24; font-weight: 700;">← All 22 MCPs</a>
  <a href="../dashboards/" style="color: #4ade80;">📊 5 Dashboards</a>
  <a href="../whitepapers/" style="color: #4ade80;">📚 5 White Papers</a>
</nav>
<main>
  <div class="breadcrumb"><a href="./">← all 22 sovereign MCPs</a></div>
  {content}
</main>
</body>
</html>
"""


def build_nav(current_mcp):
    """Build the sidebar nav grouped by category."""
    categories = {
        "Identity": ["passport"],
        "Safety": ["guardrails", "worm"],
        "Audit": ["receipt", "supply-chain", "immortal"],
        "Governance": ["governance", "council", "honour"],
        "Compliance": ["eu-ai-act-kit", "defence", "dora", "iso42001"],
        "Commerce": ["x402-payment"],
        "Visualization": ["globe", "satellite"],
        "Embodiment": ["avatar"],
        "Memory": ["memory"],
        "Lifecycle": ["skills"],
        "Physical (iOK Farm)": ["iot", "pond"],
        "Intuition": ["intuition"],
    }
    nav_html = ""
    for cat, mcps in categories.items():
        nav_html += f"<h2>{cat}</h2>"
        for m in mcps:
            if m != current_mcp:
                _, emoji, name = next(x for x in MCP_LIST if x[0] == m)
                nav_html += f'<a href="./{m}.html">{emoji} {name}</a>'
            else:
                _, emoji, name = next(x for x in MCP_LIST if x[0] == m)
                nav_html += f'<a href="./{m}.html" style="background: rgba(74,222,128,0.25); color: #4ade80; font-weight: 700;">{emoji} {name}</a>'
    return nav_html


def main():
    out_count = 0
    # Build the index first
    index_html = TEMPLATE.format(
        emoji="🜏",
        name="Index",
        mcp="",
        nav=build_nav(""),
        content="""
<h1>🜏 Sovereign MCP Docs — 22 MCPs, 302 tests</h1>

<p>This is the full documentation site for all 22 sovereign MCPs. Each
page is generated from the canonical README in
<code>~/clawd/mcp-marketplace/meok-sovereign-&lt;mcp&gt;-mcp/README.md</code>.</p>

<p>All MCPs are <strong>MIT-licensed</strong>, <strong>Ed25519-signed</strong>, and <strong>verifiable at
<a href="https://proofof.ai">proofof.ai</a></strong>.</p>

<h2>The 22 sovereign MCPs</h2>

<ul>
"""
    )
    for mcp, emoji, name in MCP_LIST:
        index_html += f'<li><a href="./{mcp}.html">{emoji} <strong>{name}</strong> ({mcp})</a></li>\n'
    index_html += "</ul>\n"
    (OUT_ROOT / "index.html").write_text(index_html)
    out_count += 1

    # Build each MCP page
    for mcp, emoji, name in MCP_LIST:
        readme_path = MCP_ROOT / f"meok-sovereign-{mcp}-mcp" / "README.md"
        if not readme_path.exists():
            print(f"  WARN: {mcp}: README missing")
            continue
        md = readme_path.read_text()
        body = md_to_html(md)
        page = TEMPLATE.format(
            emoji=emoji, name=name, mcp=mcp, nav=build_nav(mcp), content=body
        )
        (OUT_ROOT / f"{mcp}.html").write_text(page)
        out_count += 1
        print(f"  OK {mcp}: {name}")
    print()
    print(f"Built {out_count} docs pages in {OUT_ROOT}/")


if __name__ == "__main__":
    main()
