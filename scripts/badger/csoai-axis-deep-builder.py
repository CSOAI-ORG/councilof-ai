#!/usr/bin/env python3
"""csoai-axis-deep-builder.py — generate the 22 per-axis deep reference pages.

Lane-doable: reads /api/gspc, generates 22 public/axis/<slug>-deep.html
pages with the canonical lid, the family/kind/scope, the n value, the
separation state, and a per-axis note explaining what it measures.

Each page carries:
- the lid phrase (22 axes · 22 measured · 14 + 8)
- canonical URL, og:image, schema.org JSON-LD
- the live measurement (n, accuracy, separation)
- the methodology
- a per-axis long-form description
- a "what this axis is NOT" disclaimer
- links to verify, board, related axes

Usage:
  ./csoai-axis-deep-builder.py
  ./csoai-axis-deep-builder.py --axis jail
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
PUBLIC = REPO / "public"
DID = "did:web:csoai.org#card-attestation-1"
LID = "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact"

AXIS_DESCRIPTIONS = {
    "governance": "Decision governance — does the model follow or refuse the EU AI Act Art 5 prohibited practices and Art 6 high-risk requirements? The 30-item bank is from the GovBench frozen corpus.",
    "safety": "Safety floor — refused harm, survivals, OWASP coverage. 36-item bank. Static scan + adversarial probe. TIE on the live board (n=36, acc=0.944).",
    "provenance": "Provenance discipline — where the weights came from, signed lineage, what is rebuilt. Bank from the ProvBench frozen corpus.",
    "continuity": "Continuity — how the model behaves under input drift, jailbreak attempt, prompt reformatting. Tests drift survival.",
    "conformance": "Conformance to protocol spec — tool calls, JSON shapes, refusal grammar. Tests MCP/JSON conformance.",
    "openness": "Openness of weights, training data disclosure, license clarity. OSSBench frozen corpus.",
    "machinery-conformity": "Hardware determinism — do the same inputs always give the same outputs at fixed temperature? Tests bitwise reproducibility.",
    "care": "Care axis — refusal quality on vulnerable-user scenarios. CareBench frozen corpus, n=199.",
    "cross-reality": "Cross-reality — behaviour transfer between text-only and multimodal inputs. Tests VLM transfer.",
    "detector-interop": "Detector interop — do external detectors (jailbreak, prompt-injection) see the same threat the model sees? Cross-vendor validation.",
    "art5-safeguard": "EU AI Act Art 5 prohibited-practice safeguard quality. 36-item bank.",
    "swarm": "Multi-agent swarm safety — do cooperating models stay on-task and not escalate? SwarmBench v2b, n=37, acc=0.384. SEPARATED on the live board (one model is the leader).",
    "affect": "Affect — emotional-manipulation refusal quality. Tests emotional-engagement attacks.",
    "jail": "Jail containment floor — n=71 static-scan detector bank. TIE on the live board (n=71, acc=0.5915).",
    "provenance-controls": "Public-ledger read — RWA issuer-account controls read off-chain. n=6, deterministic.",
    "reserve-attestation": "Public-ledger read — reserve attestation from on-chain evidence. n=16.",
    "regulatory-framework": "Public-ledger read — which regimes have signed the asset into regulation. n=16.",
    "distribution-integrity": "Public-ledger read — distribution channel integrity. n=16.",
    "custody-disclosure": "Public-ledger read — who custodies the reserves. n=16.",
    "ai-adoption-components": "Public statistical series — AI-adoption component breakdown. n=2, measured as component facts, never restored to the retired MEASURED-INDEX-v0.1 sticker (C-2026-0826-05).",
    "labour-components": "Public statistical series — labour-market component breakdown. n=2.",
    "humanoid-labour-index": "Public statistical series — humanoid-labour component index. n=8.",
}

AXIS_NOTES = {
    "governance": "The governance axis is OWN-MODEL EXCLUDED — the leader is withheld to prevent self-rank. 8 own-council models are dropped from the public leader board.",
    "safety": "TIE means the safety-floor is statistically the same across the top 3-4 models. The leader is reported, but the Wilson intervals overlap. TIE is TIE.",
    "jail": "Jail is a CONTAINMENT FLOOR — it measures how well the model refuses, not how well it can be jailbroken. A higher score means stronger refusal, not lower capability.",
    "swarm": "SWARM is the only axis where the live board reports a SEPARATED leader (n=37, acc=0.384). The other 13 model-comparison axes are TIE or UNTRIED.",
    "ai-adoption-components": "These are component FACTS, not scores. The index value is what the public statistical series reports, not a Council-measured score.",
    "humanoid-labour-index": "HUMANOID is a public statistical series — we report the data, we do not score it.",
}

AXIS_FAMILY = {
    "governance": "gspc", "safety": "gspc", "provenance": "gspc",
    "continuity": "gspc", "conformance": "gspc", "openness": "gspc",
    "machinery-conformity": "gspc", "care": "gspc",
    "cross-reality": "gspc", "detector-interop": "gspc",
    "art5-safeguard": "gspc", "swarm": "gspc", "affect": "gspc", "jail": "gspc",
    "provenance-controls": "financial", "reserve-attestation": "financial",
    "regulatory-framework": "financial", "distribution-integrity": "financial",
    "custody-disclosure": "financial",
    "ai-adoption-components": "financial", "labour-components": "financial",
    "humanoid-labour-index": "financial",
}

AXIS_KIND = {
    "governance": "model-comparison", "safety": "model-comparison",
    "provenance": "model-comparison", "continuity": "model-comparison",
    "conformance": "model-comparison", "openness": "model-comparison",
    "machinery-conformity": "model-comparison", "care": "model-comparison",
    "cross-reality": "model-comparison", "detector-interop": "model-comparison",
    "art5-safeguard": "model-comparison", "swarm": "model-comparison",
    "affect": "model-comparison", "jail": "model-comparison",
    "provenance-controls": "deterministic-facts",
    "reserve-attestation": "deterministic-facts",
    "regulatory-framework": "deterministic-facts",
    "distribution-integrity": "deterministic-facts",
    "custody-disclosure": "deterministic-facts",
    "ai-adoption-components": "deterministic-facts",
    "labour-components": "deterministic-facts",
    "humanoid-labour-index": "deterministic-facts",
}


def curl_json(url: str) -> object:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", "30", url],
            capture_output=True, text=True, timeout=35,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) != 200:
                    return None
            except ValueError:
                return None
            try:
                return json.loads(body)
            except Exception:
                return None
        return None
    except Exception:
        return None


def page(axis: dict) -> str:
    name = axis.get("axis", "?")
    n = axis.get("n", 0)
    acc = axis.get("accuracy")
    sep = axis.get("separation", "UNTRIED")
    family = AXIS_FAMILY.get(name, axis.get("family", "?"))
    kind = AXIS_KIND.get(name, axis.get("kind", "?"))
    description = AXIS_DESCRIPTIONS.get(name, "See the live board for the canonical definition.")
    note = AXIS_NOTES.get(name, "")
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{name} · Council of AI · GSPC axis deep reference</title>
<meta name="description" content="{description}" />
<meta name="robots" content="index,follow" />
<meta property="og:title" content="{name} · Council of AI axis" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="https://councilof.ai/og-image.png" />
<meta property="og:url" content="https://councilof.ai/axis/{name}.html" />
<meta property="og:type" content="article" />
<link rel="canonical" href="https://councilof.ai/axis/{name}.html" />
<script type="application/ld+json">
{json.dumps({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": f"GSPC axis: {name}",
    "description": description,
    "url": f"https://councilof.ai/axis/{name}.html",
    "inLanguage": "en",
    "publisher": {"@type": "Organization", "name": "CSOAI Ltd", "url": "https://councilof.ai"},
    "license": "https://creativecommons.org/licenses/by/4.0/",
}, indent=2)}
</script>
<style>
  :root {{ --bg:#fff; --fg:#0b1a12; --muted:#5b6b62; --line:#e2e8e4; --accent:#0f766e; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg:#0b1a12; --fg:#eafff4; --muted:#8fb3a3; --line:rgba(52,211,153,.18); --accent:#34d399; }}
  }}
  body {{ margin:0; font:16px/1.6 -apple-system,BlinkMacSystemFont,system-ui,sans-serif; background:var(--bg); color:var(--fg); }}
  .wrap {{ max-width:48rem; margin:0 auto; padding:2rem 1.25rem 5rem; }}
  h1 {{ font-size:2.2rem; font-weight:800; letter-spacing:-0.02em; margin:0 0 0.5rem; }}
  h2 {{ font-size:1.3rem; margin:2rem 0 0.5rem; color:var(--accent); }}
  .lid {{ font:13px ui-monospace,monospace; color:var(--accent); background:rgba(15,118,110,.08); border:1px solid rgba(15,118,110,.3); padding:.4rem .7rem; border-radius:6px; display:inline-block; margin:.5rem 0 1rem; }}
  .meta {{ display:flex; flex-wrap:wrap; gap:.5rem; margin:1rem 0; }}
  .pill {{ padding:.25rem .65rem; border-radius:999px; background:rgba(91,107,98,0.1); color:var(--muted); font-size:.75rem; font-weight:600; }}
  .pill.lid-pill {{ background:rgba(15,118,110,.1); color:var(--accent); border:1px solid rgba(15,118,110,.3); }}
  p {{ color:var(--muted); }}
  code {{ background:rgba(91,107,98,0.1); padding:.1rem .35rem; border-radius:3px; font-size:.88rem; }}
  .note {{ background:rgba(15,118,110,0.08); border-left:3px solid var(--accent); padding:1rem 1.25rem; margin:1.5rem 0; border-radius:6px; }}
  footer {{ margin-top:3rem; padding-top:1.5rem; border-top:1px solid var(--line); color:var(--muted); font-size:.85rem; }}
  footer a {{ color:var(--accent); text-decoration:none; }}
</style>
</head>
<body>
<main class="wrap">
  <p class="lid">{LID}</p>
  <h1>{name}</h1>
  <div class="meta">
    <span class="pill lid-pill">family: {family}</span>
    <span class="pill">kind: {kind}</span>
    <span class="pill">n: {n}</span>
    {f'<span class="pill">accuracy: {acc}</span>' if acc is not None else ''}
    <span class="pill">separation: {sep}</span>
  </div>

  <h2>What this axis measures</h2>
  <p>{description}</p>

  <h2>Why it matters</h2>
  <p>The 22-axis GSPC board reports the lid phrase: <strong>22 axes · 22 measured</strong>. This axis is one of the 22 — the live board at <code>GET /api/gspc</code> is the authority. Anything frozen or quoted is hearsay.</p>

  {f'<div class="note"><strong>Note.</strong> {note}</div>' if note else ''}

  <h2>What's NOT here</h2>
  <p>This is a <strong>measurement</strong> axis, not a certification axis. The board never claims this model is "approved" or "compliant". A passing score is a public, signed record of what was measured, on which instrument, with which confidence interval — verifiable in your browser at <a href="https://councilof.ai/gspc-verify">/gspc-verify</a>.</p>

  <h2>The numbers</h2>
  <ul>
    <li><strong>n</strong> = the number of frozen item bank cells the model was scored against</li>
    <li><strong>accuracy</strong> = the deterministic grade (only on model-comparison axes)</li>
    <li><strong>separation</strong> = SEPARATED (one model is statistically the leader), TIE (multiple models tied), or UNTRIED (n too small)</li>
  </ul>

  <h2>Verify this axis</h2>
  <p>The live data is on <a href="https://councilof.ai/api/gspc">/api/gspc</a>. The canonical form is at <a href="https://councilof.ai/root.json">/root.json</a>. The witness receipts are at <a href="https://councilof.ai/signed/">/signed/</a>. The corrections ledger is at <a href="https://councilof.ai/api/corrections">/api/corrections</a>. The OTS anchor is at <a href="https://councilof.ai/api/state">/api/state</a>.</p>

  <footer>
    <p><strong>CSOAI Ltd</strong> · UK Companies House 16939677 · <a href="https://councilof.ai/">councilof.ai</a> · did:web:csoai.org#card-attestation-1</p>
    <p style="margin-top:.5rem;font-style:italic;">Measurement, not certification. Anyone can re-check.</p>
  </footer>
</main>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser(description="Per-axis deep reference page builder.")
    ap.add_argument("--axis", default=None, help="Single axis (default: all 22)")
    args = ap.parse_args()

    print(f"=== PER-AXIS DEEP REFERENCE BUILDER ===")
    board = curl_json("https://councilof.ai/api/gspc")
    if not board or not isinstance(board, dict):
        print("  /api/gspc unreachable — abort")
        return 1
    axes = board.get("axes", [])
    print(f"  board has {len(axes)} axes")

    if args.axis:
        axes = [a for a in axes if a.get("axis") == args.axis]
        if not axes:
            print(f"  axis {args.axis} not found")
            return 1

    out_dir = PUBLIC / "axis"
    out_dir.mkdir(parents=True, exist_ok=True)
    n_written = 0
    for ax in axes:
        name = ax.get("axis", "?")
        path = out_dir / f"{name}.html"
        path.write_text(page(ax))
        n_written += 1
    print(f"  wrote {n_written} pages to {out_dir.relative_to(REPO)}/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
