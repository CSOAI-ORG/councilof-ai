#!/usr/bin/env bash
# generate-axis-pages.sh — produce a single static HTML page per GSPC axis.
# Reads from the live /api/gspc, falls back to a baked-in default bank.
# Lane-executable: pure static file output, no server needed.

set -euo pipefail
cd "$(dirname "$0")/.."

OUT=public/axis
mkdir -p "$OUT"

# Pull the live board once and cache
curl -fsS --max-time 15 https://councilof.ai/api/gspc -o /tmp/board.json || {
  echo "could not fetch live board; aborting"
  exit 2
}

python3 <<'PY'
import json, os, html
from pathlib import Path

board = json.load(open('/tmp/board.json'))
axes = board.get('axes', [])
fact_names = {
    'provenance-controls','reserve-attestation','regulatory-framework',
    'distribution-integrity','custody-disclosure','ai-adoption-components',
    'labour-components','humanoid-labour-index','effect-binding'
}

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{axis_title} · GSPC axis · Council of AI</title>
<meta name="description" content="{axis_desc}" />
<meta name="robots" content="index,follow" />
<link rel="canonical" href="https://councilof.ai/axis/{slug}" />
<style>
  :root {{ --bg:#fff; --fg:#0b1a12; --muted:#5b6b62; --line:#e2e8e4; --accent:#0f766e; --ok:#16a34a; --wait:#ca8a04; --bad:#dc2626; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg:#05140d; --fg:#eafff4; --muted:#8fb3a3; --line:rgba(52,211,153,.18); --accent:#34d399; --ok:#34d399; --wait:#fbbf24; --bad:#f87171; }}
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:0; background:var(--bg); color:var(--fg); font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }}
  .wrap {{ max-width:48rem; margin:0 auto; padding:2.5rem 1.25rem 5rem; }}
  h1 {{ font-size:clamp(1.8rem,4vw,2.5rem); font-weight:800; letter-spacing:-0.02em; margin:0 0 0.5rem; line-height:1.15; }}
  h2 {{ font-size:1.25rem; margin:2rem 0 0.5rem; }}
  .lede {{ color:var(--muted); font-size:1.05rem; margin-bottom:1.5rem; }}
  .meta {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:1rem; margin:1.5rem 0; }}
  .stat {{ padding:0.85rem 1rem; border:1px solid var(--line); border-radius:10px; background:rgba(91,107,98,0.05); }}
  .stat .l {{ font-size:0.78rem; color:var(--muted); letter-spacing:0.04em; text-transform:uppercase; }}
  .stat .v {{ font-size:1.4rem; font-weight:700; margin-top:0.25rem; }}
  .pill {{ display:inline-flex; align-items:center; gap:0.4rem; padding:0.18rem 0.55rem; border-radius:999px; border:1px solid var(--line); font-size:0.78rem; font-weight:600; }}
  .pill.measured {{ background:rgba(22,163,74,0.10); color:var(--ok); border-color:rgba(22,163,74,0.4); }}
  .pill.separated {{ background:rgba(15,118,110,0.10); color:var(--accent); border-color:rgba(15,118,110,0.4); }}
  .pill.tie {{ background:rgba(148,163,184,0.10); color:var(--muted); border-color:rgba(148,163,184,0.4); }}
  .pill.untested {{ background:rgba(148,163,184,0.10); color:var(--muted); border-color:rgba(148,163,184,0.4); }}
  .pill.fact {{ background:rgba(37,99,235,0.10); color:#2563eb; border-color:rgba(37,99,235,0.4); }}
  pre {{ background:rgba(91,107,98,0.05); padding:0.85rem; border-radius:6px; overflow-x:auto; font-size:0.85rem; }}
  .readfirst {{ background:rgba(220,38,38,0.06); border:1px solid rgba(220,38,38,0.28); border-radius:10px; padding:1rem 1.15rem; margin:1.25rem 0; }}
  .readfirst h2 {{ margin-top:0; font-size:0.82rem; letter-spacing:0.06em; text-transform:uppercase; color:var(--bad); }}
  .readfirst ul {{ margin:0.5rem 0 0; padding-left:1.15rem; }}
  .readfirst li {{ margin:0.3rem 0; }}
  .prov {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:0.8rem; margin:1rem 0 1.5rem; }}
  .prov .row {{ border:1px solid var(--line); border-radius:10px; padding:0.7rem 0.85rem; }}
  .prov .k {{ font-size:0.7rem; color:var(--muted); letter-spacing:0.06em; text-transform:uppercase; }}
  .prov .v {{ margin-top:0.22rem; font-size:0.92rem; word-break:break-word; }}
  .prov .v small {{ color:var(--muted); }}
  .mono {{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:0.78rem; }}
  footer {{ margin-top:4rem; padding-top:2rem; border-top:1px solid var(--line); color:var(--muted); font-size:0.85rem; }}
  footer a {{ color:var(--accent); text-decoration:none; }}
</style>
</head>
<body>
<main class="wrap">
  <h1>{axis}</h1>
  <p class="lede">
    <span class="pill measured">MEASURED</span>
    {sep_pill}
    {fact_pill}
    {note}
  </p>
  <div class="meta">
    <div class="stat"><div class="l">status</div><div class="v">{status}</div></div>
    <div class="stat"><div class="l">n</div><div class="v">{n}</div></div>
    <div class="stat"><div class="l">accuracy</div><div class="v">{acc}</div></div>
    <div class="stat"><div class="l">separation</div><div class="v">{sep}</div></div>
    <div class="stat"><div class="l">leader</div><div class="v" style="font-size:0.95rem">{leader}</div></div>
  </div>

  <h2>What this axis measures</h2>
  <p>{what_this_is}</p>

  <h2>Bank</h2>
  <p>{bank}</p>

  <h2>How the verdict is reached</h2>
  <p>{verdict}</p>

  <div class="readfirst">
    <h2>Read this first</h2>
    <ul>
      {readfirst}
    </ul>
  </div>

  <h2>How this number was made</h2>
  <div class="prov">
    <div class="row"><div class="k">resolution</div><div class="v">{mde}</div></div>
    <div class="row"><div class="k">interval (annotation only)</div><div class="v">{interval}</div></div>
    <div class="row"><div class="k">separation test</div><div class="v">{sep_method}</div></div>
    <div class="row"><div class="k">separation p</div><div class="v">{sep_p}</div></div>
    <div class="row"><div class="k">fleet context</div><div class="v">{fleet}</div></div>
    <div class="row"><div class="k">measured on</div><div class="v">{measured_on}</div></div>
    <div class="row"><div class="k">per-item rows</div><div class="v mono">{peritem_sha}</div></div>
    <div class="row"><div class="k">dataset</div><div class="v">{dataset}</div></div>
    <div class="row"><div class="k">leader card</div><div class="v">{leader_card}</div></div>
  </div>

  <h2>Doctrine</h2>
  <p>This axis is a measurement, not a certificate. An empty result is labelled UNMEASURED, never 0, never "passed". TIE means indistinguishable on this axis. SEPARATED means the leader's lead is statistically real. None of this is a stamp of approval.</p>

  <footer>
    <p><strong>CSOAI Ltd</strong> · UK 16939677 · <a href="/visual-board.html">Current board</a> · <a href="https://councilof.ai/gspc-verify">/gspc-verify</a> · <a href="https://councilof.ai/api/gspc?axis={slug}">/api/gspc?axis={slug}</a></p>
    <p>Measurement, not certification. Anyone can re-check.</p>
  </footer>
</main>
</body>
</html>
"""

# Per-axis prose (lane-authored from the doctrine).
DESCRIPTIONS = {
    'governance': ("Whether models can answer a frozen set of governance questions "
        "with the right legal citation and the right disposition. The bank is "
        "statute-derived: every item is anchored to a published provision."),
    'safety': ("Whether models refuse / disclose / fail on a frozen set of "
        "Art 5(1)(a)–(f) self-classification probes. n=36. TIE on this axis "
        "means the fleet is uniformly either correct or uniformly over-blocks "
        "lawful self-audit requests — see the live legal-axis measurement_note "
        "for the full finding."),
    'provenance': ("Whether a model can answer provenance questions about its "
        "own training-data lineage given a frozen scenario set. The bank is "
        "static: items do not move."),
    'continuity': ("Whether models know the post-quantum status of a cryptographic "
        "assumption. PQCBench, n=33. The axis measures MODEL awareness of PQC — "
        "it does NOT make the estate quantum-safe (the estate is Ed25519, see "
        "/api/pqc)."),
    'conformance': ("Whether models comply with a frozen set of format / schema "
        "requirements on a fixed input set."),
    'openness': ("Whether models disclose the limits of their own knowledge on a "
        "frozen set of probes."),
    'machinery-conformity': ("Whether models conform to a frozen machinery "
        "interface (tool-call format, JSON shape, etc.). The external leader "
        "on this axis has no signed per-model card in the public card index, "
        "so the leader claim is dropped (uncarded) — the axis stays MEASURED."),
    'care': ("Whether models behave with the discipline the council requires "
        "on a frozen care set. The fleet aggregate (fleet_mean) is the real "
        "measurement."),
    'cross-reality': ("Whether models can correctly identify cross-reality probes "
        "(real vs synthetic, etc.). Uncarded leader dropped, axis MEASURED."),
    'detector-interop': ("Whether models interoperate with the published detector "
        "schema. Uncarded leader dropped, axis MEASURED."),
    'art5-safeguard': ("Whether models correctly invoke Art 5(1) safeguards on a "
        "frozen set of probes."),
    'swarm': ("How a swarm of agents behaves on a deterministic multi-agent "
        "scenario. n=37. SEPARATED means one base model outperforms the "
        "others on this scenario."),
    'affect': ("Whether models can correctly identify and reason about affect / "
        "emotional content on a frozen scenario set."),
    'jail': ("Whether models refuse / comply / partially comply on the frozen "
        "jail-probe set. n=71. TIE on this axis — the fleet is uniformly "
        "either refusing or partially complying."),
    'provenance-controls': ("Deterministic fact. Counts which XRPL / EVM issuers "
        "publish provenance controls on their public ledger pages. n=6. "
        "Not a model comparison, no leader, no accuracy."),
    'reserve-attestation': ("Deterministic fact. Reads public attestor pages for "
        "n=6 issuers. UNMEASURED inside the card if no named attestor PDF. "
        "Not a model comparison."),
    'regulatory-framework': ("Deterministic fact. Issuer self-declaration of "
        "compliance with their named framework. n=6. Declaration only."),
    'distribution-integrity': ("Deterministic fact. Compares a public issuer's "
        "represented supply against the on-chain distributed supply. n=6. "
        "UNMEASURED inside the card when these numbers don't reconcile."),
    'custody-disclosure': ("Deterministic fact. Counts public custody disclosure "
        "URLs. n=6. Disclosure only."),
    'ai-adoption-components': ("Deterministic fact. Eurostat series, n=2 "
        "components. Not an index — was renamed from ai-economy-index per "
        "C-2026-0826-05."),
    'labour-components': ("Deterministic fact. n=2 components. Not an index — "
        "renamed from human-labour-index per C-2026-0826-05."),
    'humanoid-labour-index': ("Deterministic fact. Public disclosure URLs from "
        "robotics deployers (Figure/BMW, Agility/GXO, Unitree). n=8. "
        "Fleet/hours/incidents are UNMEASURED inside the card."),
}

VERDICT = (
    "The verdict is the model's accuracy on n items of a frozen, published "
    "bank, signed Ed25519 under the Council's pinned DID key. Empty cells "
    "stay empty. UNMEASURED is a first-class answer. Re-fetch the live axis "
    "via GET /api/gspc?axis={slug}."
)

BANK_GENERIC = (
    "Bank: a frozen, published JSONL of items, every item hashable, the bank "
    "itself sha256-checked against the live ledger. The bank does not move."
)

def main():
    out = Path('public/axis')
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for a in axes:
        name = a.get('axis') or a.get('name') or '?'
        slug = name.replace('_', '-')
        is_fact = name in fact_names
        status = (a.get('status') or '?').upper()
        sep = (a.get('separation') or '—').upper()
        n = a.get('n')
        acc = a.get('accuracy')
        leader = a.get('leader') or '—'
        note = a.get('note') or ''

        sep_pill = ''
        if not is_fact:
            if 'SEPARATED' in sep:
                sep_pill = '<span class="pill separated">SEPARATED</span>'
            elif 'TIE' in sep:
                sep_pill = '<span class="pill tie">TIE</span>'
            elif 'UNTESTED' in sep or '—' == sep:
                sep_pill = '<span class="pill untested">UNTESTED</span>'
        fact_pill = '<span class="pill fact">deterministic-fact</span>' if is_fact else ''

        title = name.replace('-', ' ').title()
        desc = DESCRIPTIONS.get(name, "Measurement axis. See /api/gspc for the live row.")
        bank = BANK_GENERIC

        # ---- how much to trust the number, read from the live board ----
        mde = a.get('mde') or {}
        interval = a.get('interval')
        sep_method = a.get('separation_method')
        sep_p = a.get('separation_p')
        sep_evidence = a.get('separation_evidence') or {}
        peritem_sha = a.get('peritem_file_sha256')
        dataset = a.get('dataset')
        dataset_url = a.get('dataset_url')
        mtime = a.get('measurement_time') or {}
        leader_card_url = a.get('leader_card_url')
        leader_card_state = a.get('leader_card_state')
        leader_card_note = a.get('leader_card_note')
        fleet_mean = a.get('fleet_mean')
        mean_harm = a.get('mean_harm')
        cvar = a.get('cvar05_harm')
        hist = a.get('historical_measurement_record') or {}

        caveats = []
        if leader_card_state == 'CARD_RECORDS_A_DIFFERENT_MEASUREMENT':
            caveats.append(
                "The signed card for this leader records a DIFFERENT measurement, so it does not "
                "back the number above. The number is read from the per-item rows; the card is not "
                "its receipt.")
        if 'TIE' in sep:
            caveats.append(
                "Nothing separated on this axis. The point-estimate lead is not a measured "
                "advantage \u2014 TIE is TIE, and TIE is not a win.")
        if mde.get('value') is not None:
            caveats.append(
                "This axis can only detect a difference of about {v} or larger "
                "(\u03b1={a}, power={pw}). A smaller gap between two models would not be visible "
                "here at all.".format(v=mde.get('value'), a=mde.get('alpha'),
                                      pw=mde.get('power')))
        if status == 'UNMEASURED':
            caveats.append("No run sits behind this slot yet. UNMEASURED is an answer, never 0.")
        if hist.get('state'):
            caveats.append(
                "This axis carries a historical measurement record ({s}). It is kept for the record "
                "and is not the number above.".format(s=hist.get('state')))
        caveats.append(
            "The interval is annotation only. Separation is a separate determination and is never "
            "folded into it.")
        readfirst = "\n".join(
            "      <li>{}</li>".format(html.escape(c)) for c in caveats) or \
            "      <li>No caveat is recorded against this axis.</li>"

        def stat(value, suffix="", small=""):
            if value is None:
                return "&mdash;<br /><small>not recorded</small>"
            text = "{} {}".format(value, suffix).strip()
            return "{}{}".format(html.escape(str(text)),
                                 "".join("<br /><small>{}</small>".format(html.escape(str(s)))
                                         for s in small))

        mde_html = stat(mde.get('value'), mde.get('unit') or '',
                        [f for f in (mde.get('alpha'), mde.get('power'), mde.get('test')) if f])
        interval_html = ("[{}, {}]".format(interval[0], interval[1]) if isinstance(interval, list)
                         and len(interval) == 2 else "&mdash;")
        sep_method_html = stat(sep_method)
        sep_p_html = stat(sep_p)
        fleet_bits = []
        if fleet_mean is not None:
            fleet_bits.append("fleet mean accuracy {}".format(fleet_mean))
        if mean_harm is not None:
            fleet_bits.append("mean harm {}".format(mean_harm))
        if cvar is not None:
            fleet_bits.append("CVaR(5%) harm {}".format(cvar))
        fleet_html = ("; ".join(html.escape(b) for b in fleet_bits) or "&mdash;")
        measured_on_html = stat(mtime.get('observed_on'), "",
                                [mtime.get('precision'), mtime.get('source')])
        peritem_html = html.escape(peritem_sha) if peritem_sha else "&mdash;"
        dataset_html = ("<a href=\"{}\">{}</a>".format(html.escape(dataset_url), html.escape(dataset))
                        if dataset and dataset_url else html.escape(dataset or ""))
        if leader_card_url:
            leader_card_html = ("<a href=\"{}\">{}</a>".format(
                html.escape(leader_card_url),
                html.escape(leader_card_state or "card")))
            if leader_card_note:
                leader_card_html += "<br /><small>{}</small>".format(html.escape(leader_card_note))
        else:
            leader_card_html = "&mdash;<br /><small>no card carries this axis</small>"

        page = TEMPLATE.format(
            axis=name,
            axis_title=title,
            axis_desc=f"The {name} axis on the Council of AI GSPC board.",
            slug=slug,
            status=status,
            sep_pill=sep_pill,
            fact_pill=fact_pill,
            note=html.escape(note),
            n='—' if n is None else str(n),
            acc='—' if acc is None else f'{float(acc):.3f}',
            sep=html.escape(sep),
            leader=html.escape(str(leader)),
            what_this_is=html.escape(desc),
            bank=html.escape(bank),
            verdict=html.escape(VERDICT).replace('{slug}', slug),
            readfirst=readfirst,
            mde=mde_html,
            interval=interval_html,
            sep_method=sep_method_html,
            sep_p=sep_p_html,
            fleet=fleet_html,
            measured_on=measured_on_html,
            peritem_sha=peritem_html,
            dataset=dataset_html,
            leader_card=leader_card_html,
        )
        (out / f'{slug}.html').write_text(page)
        written.append(slug)

    print(f'wrote {len(written)} axis pages:')
    for w in written:
        print(f'  public/axis/{w}.html')

main()
PY
