#!/usr/bin/env python3
"""article_findings.py — EU AI Act ARTICLE-level findings (the user's explicit ask: "all
eu articles and fines", "findings of article 6 etc"). Extends eu_ai_act_findings.py to
report at ARTICLE granularity, not just axis granularity: for every Article in the map,
it states the obligation, the GSPC axes that measure it, the worst measured gap across
those axes, and the exact fine exposure. Deterministic, no model consulted.

Usage:
  python3 article_findings.py [--json] [--article "Article 6"]
"""
import argparse, json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board import get, load_board_or_die, guard_axis_keys  # noqa: E402

MAP = json.loads(Path(__file__).with_name("eu_ai_act_article_map.json").read_text())

def grade(rate):
    if rate is None: return ("UNMEASURED", "insufficient data — not a ranking")
    if rate >= 0.75: return ("LOW", "measured compliant")
    if rate >= 0.5:  return ("MEDIUM", "measured partial compliance")
    if rate >= 0.25: return ("HIGH", "measured material gap")
    return ("CRITICAL", "measured non-compliance risk")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--article", default=None)
    args = ap.parse_args()

    # The board must load, and every axis this map names must exist on it. An
    # unresolvable axis name would silently become UNMEASURED - a false negative in a
    # compliance tool - so it aborts the run instead.
    axis_idx = load_board_or_die("article_findings")
    articles = MAP["articles"]
    guard_axis_keys({ax for a in articles.values() for ax in a["measured_axes"]},
                    axis_idx, "eu_ai_act_article_map.json:articles[].measured_axes",
                    "article_findings")
    acc = {k: v.get("accuracy") for k, v in axis_idx.items()}
    status = {k: v.get("status") for k, v in axis_idx.items()}

    reg = get("/api/regulation")
    penalties = MAP.get("penalty_tiers", {}) or reg.get("penalty_tiers_eu_ai_act", {})
    order = {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3,"UNMEASURED":4}

    rep = []
    for art, a in articles.items():
        axes_for_art = a["measured_axes"]
        # worst measured gap across this article's axes
        measured = [(ax, acc.get(ax)) for ax in axes_for_art]
        rates = [m for _, m in measured if m is not None]
        worst_rate = min(rates) if rates else None
        g, note = grade(worst_rate)
        tier = penalties.get(a["penalty_tier"], "see /api/regulation")
        rep.append({
            "article": art,
            "title": a["title"],
            "obligation": a["obligation"],
            "measured_axes": axes_for_art,
            "axis_rates": {ax: acc.get(ax) for ax in axes_for_art},
            "axis_board_status": {ax: status.get(ax) for ax in axes_for_art},
            "worst_measured_rate": worst_rate,
            "grade": g,
            "note": note,
            "penalty_exposure": tier,
            "status": a.get("status"),
        })

    if args.article:
        rep = [r for r in rep if r["article"].lower() == args.article.lower()]
    rep.sort(key=lambda x: order.get(x["grade"], 9))

    out = {
        "schema": "csoai.white-label-article-findings/0.1",
        "basis": MAP["source"],
        "penalty_tiers": penalties,
        "verify_path": MAP["verify_path"],
        "articles": rep,
    }

    if args.json:
        print(json.dumps(out, indent=2, default=str))
    else:
        print(f"EU AI ACT ARTICLE-LEVEL FINDINGS  (basis: {MAP['source']})")
        print(f"  verify: {out['verify_path']}")
        print(f"  axis-map check: PASS (every measured_axes key resolves against /api/gspc)\n")
        for r in rep:
            print(f"  [{r['grade']:8s}] {r['article']:12s} {r['title'][:32]:34s} worst={r['worst_measured_rate']}")
            print(f"             {r['obligation'][:70]}")
            print(f"             axes: {r['measured_axes']}  | exposure: {r['penalty_exposure']}")
        print("\n  NOTE: measurement, not certification. UNMEASURED articles are honest, never ranked.")

if __name__ == "__main__":
    main()
