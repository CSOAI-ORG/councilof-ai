#!/usr/bin/env python3
"""
compliance_attest.py — the £750 readiness-check DELIVERABLE engine.

Turn a 20-minute client call into a finished, client-ready report + a real Ed25519-signed compliance
attestation (verifiable by anyone at proofof.ai/passport) — in minutes, not a week. This is what makes
the service real and deliverable: you ask the questions, fill answers.json, run this, hand over the PDF.

  python3 compliance_attest.py                 # demo with a sample client
  python3 compliance_attest.py answers.json    # real client (see ANSWERS_TEMPLATE printed at top)

Writes: <client>_readiness_report.md  +  <client>_attestation.json
"""
import json, os, sys, time
sys.path.insert(0, os.path.expanduser("~/clawd/sovereign-town/p0_aqua"))
import sign_lib   # reuse the same Ed25519 we built — the differentiator

ATTESTOR = "CSOAI — Nicholas Templeman"
VERIFY_URL = "https://proofof.ai/passport"

# EU AI Act Article 50 (transparency) readiness — plain-English. (key, question, why_it_matters)
QUESTIONS = [
    ("uses_ai",        "Does the business use or deploy any AI (chatbot, AI-generated content, AI in hiring/screening/credit/biometrics)?", "Determines if Article 50 applies at all."),
    ("chatbot_notice", "Are users clearly told when they're interacting with an AI rather than a human?", "Art 50(1): AI systems interacting with people must disclose it."),
    ("content_label",  "Is AI-generated or AI-edited content (text/image/audio/video) clearly marked as AI-generated?", "Art 50(2): synthetic content must be machine-readable + disclosed."),
    ("deepfake",       "If you publish deepfakes / synthetic media of real people or events, is it disclosed?", "Art 50(4): deepfakes must be labelled."),
    ("emotion_bio",    "If you use emotion-recognition or biometric categorisation, are affected people informed?", "Art 50(3): subjects must be notified."),
    ("records",        "Do you keep a record of your AI systems and the disclosures you make?", "Evidence of compliance (record-keeping)."),
    ("owner",          "Is there a named person accountable for AI compliance?", "Governance / accountability."),
]
ANSWERS_TEMPLATE = {"client": "Acme Ltd", "contact": "Jane", "answers": {k: True for k, _, _ in QUESTIONS}}

def assess(data):
    ans = data["answers"]
    if not ans.get("uses_ai", False):
        return {"in_scope": False, "score": 100, "gaps": [], "summary": "No AI in use — Article 50 does not currently apply. Re-check if you adopt AI."}
    gaps = [{"item": q, "why": why, "key": k} for (k, q, why) in QUESTIONS
            if k != "uses_ai" and not ans.get(k, False)]
    total = len(QUESTIONS) - 1
    score = round(100 * (total - len(gaps)) / total)
    return {"in_scope": True, "score": score, "gaps": gaps,
            "summary": f"In scope for EU AI Act Article 50. Readiness {score}% — {len(gaps)} gap(s) to close before 2 Aug 2026."}

def deliver(data):
    a = assess(data)
    client = data["client"]; now = time.strftime("%Y-%m-%d")
    priv, pub = sign_lib.load_or_create_key()
    attestation = {"type": "csoai_compliance_attestation", "framework": "EU AI Act — Article 50 (transparency)",
                   "client": client, "assessed_by": ATTESTOR, "assessed_on": now,
                   "in_scope": a["in_scope"], "readiness_score": a["score"], "open_gaps": len(a["gaps"]),
                   "statement": "This is an independent point-in-time readiness assessment (not a regulatory determination).",
                   "pubkey": pub, "verify_at": VERIFY_URL}
    attestation["sig"] = sign_lib.sign(priv, json.dumps(attestation, sort_keys=True))
    attestation["alg"] = "ed25519"

    safe = client.lower().replace(" ", "_").replace("/", "")
    json.dump(attestation, open(f"{safe}_attestation.json", "w"), indent=2)
    rep = f"""# EU AI Act — Readiness Check
### {client} · {now} · prepared by {ATTESTOR}

**Result:** {a['summary']}

## What we assessed (Article 50 — transparency obligations, in force 2 Aug 2026)
""" + "\n".join(f"- {'✅' if not any(g['key']==k for g in a['gaps']) else '⚠️ GAP'} — {q}"
                for k, q, _ in QUESTIONS if k != "uses_ai") + "\n"
    if a["gaps"]:
        rep += "\n## Gaps to close (prioritised)\n" + "\n".join(
            f"{i+1}. **{g['item']}**\n   *Why:* {g['why']}" for i, g in enumerate(a["gaps"])) + "\n"
        rep += "\n## Recommended next step\nClose the gaps above before 2 Aug 2026. We can keep you continuously covered with the **AI Compliance Monitoring** retainer (£299/mo) — deadline tracking, change alerts, and quarterly re-attestation.\n"
    rep += f"""
## Your signed attestation
This assessment is backed by a cryptographically-signed attestation — independently verifiable by anyone,
offline, with no account, at **{VERIFY_URL}**. That is what makes this more than an opinion: it is
tamper-evident proof of your compliance state on {now}.

`attestation: {attestation['sig'][:32]}…`  ·  file: `{safe}_attestation.json`

---
*Independent readiness assessment by CSOAI. Not legal advice; not a regulatory determination.*
"""
    open(f"{safe}_readiness_report.md", "w").write(rep)
    return a, safe

def main():
    if len(sys.argv) > 1:
        data = json.load(open(sys.argv[1]))
    else:
        print("  (no answers.json given — running DEMO. Template for a real client:)")
        print("  " + json.dumps(ANSWERS_TEMPLATE))
        data = {"client": "Acme Recruitment Ltd", "contact": "Jane",
                "answers": {"uses_ai": True, "chatbot_notice": True, "content_label": False,
                            "deepfake": True, "emotion_bio": True, "records": False, "owner": False}}
    a, safe = deliver(data)
    print(f"\n  READINESS CHECK delivered for {data['client']}")
    print("  " + "-" * 56)
    print(f"  in scope: {a['in_scope']}   readiness: {a['score']}%   gaps: {len(a['gaps'])}")
    print(f"  report:      {safe}_readiness_report.md")
    print(f"  attestation: {safe}_attestation.json  (verify at {VERIFY_URL})")
    print("  " + "-" * 56)
    print("  → PDF the report, send it, then offer the £299/mo monitoring. That's the £750 + the MRR.\n")

if __name__ == "__main__":
    main()
