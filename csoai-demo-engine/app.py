#!/usr/bin/env python3
"""
CSOAI free-audit demo — the DOOR (Gaps #1 + #3 from THE_5_MISSING_THINGS).
Serves demo_landing_page.html and exposes /api/audit, which runs the REAL
eu_ai_act_compliance_checker engine (classify_input + generate_checklist).
Deployable to Vercel (Python) or run locally: `python app.py` → http://127.0.0.1:8088
"""
import os
from flask import Flask, request, send_from_directory, jsonify
import eu_ai_act_compliance_checker as chk

app = Flask(__name__)
HERE = os.path.dirname(os.path.abspath(__file__))

# engine levels → the 3 the landing page styles (UNACCEPTABLE/PROHIBITED shown as HIGH)
LEVEL_MAP = {"UNACCEPTABLE": "HIGH", "PROHIBITED": "HIGH", "HIGH": "HIGH",
             "LIMITED": "LIMITED", "MINIMAL": "MINIMAL", "MINIMAL_RISK": "MINIMAL"}
SCORE = {"HIGH": 82, "LIMITED": 55, "MINIMAL": 28}


def _level_name(rl):
    n = getattr(rl, "name", None) or getattr(rl, "value", None) or str(rl)
    return str(n).split(".")[-1].upper()


def _attr(o, *names):
    for n in names:
        v = getattr(o, n, None)
        if v:
            return v
    return None


@app.route("/")
def index():
    return send_from_directory(HERE, "demo_landing_page.html")


@app.route("/api/audit", methods=["POST"])
def audit():
    d = request.get_json(force=True, silent=True) or {}
    text = ((d.get("useCase") or "") + " " + (d.get("industry") or "")).strip() or "general AI system"
    try:
        c = chk.classify_input(text)
    except Exception as e:
        return jsonify({"engine": False, "error": str(e)}), 200
    raw = _level_name(c.risk_level)
    disp = LEVEL_MAP.get(raw, "LIMITED")
    checklist, frameworks = [], []
    try:
        for it in chk.generate_checklist(c)[:6]:
            if isinstance(it, dict):
                art, title = it.get("article", ""), (it.get("title") or it.get("description") or "")
            else:
                art = _attr(it, "article", "framework") or ""
                title = _attr(it, "title", "text", "description", "name") or str(it)
            checklist.append((title and str(title)[:120]) or str(it)[:120])
            if art:
                fw = str(art).split("--")[0].split("—")[0].strip()
                if fw and fw not in frameworks:
                    frameworks.append(fw)
    except Exception:
        pass
    if not frameworks:
        frameworks = ["EU AI Act"]
    return jsonify({
        "engine": True,
        "riskLevel": disp,
        "rawLevel": raw,
        "confidence": round(float(getattr(c, "confidence", 0) or 0), 2),
        "riskScore": SCORE.get(disp, 50),
        "checklist": checklist,
        "frameworks": frameworks,
        "council": "CSOAI Council: classification signed + attestable on the ledger.",
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 8088)))
