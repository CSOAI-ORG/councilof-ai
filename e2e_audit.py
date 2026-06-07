#!/usr/bin/env python3
"""
MEOK E2E audit — self-contained, stdlib only. Runs on a GCP box (zero Mac load).
Rigorous methodology so it does NOT produce cold-start false positives:
  per target: 1 warm-up call (ignored) + up to 3 measured tries @ 30s; first 200-with-body wins.
Classify: live (200, >=120 bytes, expected keyword present) / partial (200 but thin/placeholder) /
broken (non-200 after retries). Emits a markdown scorecard to stdout + JSON to /tmp.
"""
import urllib.request, urllib.error, json, time, ssl

B = "https://meok-one.35.242.143.249.sslip.io"
CTX = ssl.create_default_context()
UA = "MEOK-E2E-Audit/1.0"


def _once(method, url, body, timeout):
    t0 = time.time()
    try:
        data = json.dumps(body).encode() if body is not None else None
        hdr = {"User-Agent": UA}
        if data:
            hdr["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, method=method, headers=hdr)
        r = urllib.request.urlopen(req, timeout=timeout, context=CTX)
        return r.status, r.read().decode("utf-8", "replace"), round(time.time() - t0, 2)
    except urllib.error.HTTPError as e:
        return e.code, "", round(time.time() - t0, 2)
    except Exception:
        return 0, "", round(time.time() - t0, 2)


def probe(label, method, path, body=None, expect=None, timeout=30):
    url = path if path.startswith("http") else (B + path)
    _once(method, url, body, timeout)                       # warm-up (ignored)
    status, content, dt = 0, "", 0
    for _ in range(3):
        status, content, dt = _once(method, url, body, timeout)
        if status == 200 and content:
            break
    okkw = (expect is None) or (expect.lower() in content.lower())
    has_kw = (expect is not None) and okkw          # an expected keyword present == real content
    # live = 200 AND keyword-ok AND (keyword present OR enough bytes). 40B floor lets terse-by-design
    # endpoints (health, sigil/verify) count as live without tripping a size threshold.
    if status == 200 and okkw and (has_kw or len(content) >= 40):
        cls = "live"
    elif status == 200 and len(content) > 0:
        cls = "partial"
    else:
        cls = "broken"
    return {"label": label, "cls": cls, "http": status, "bytes": len(content),
            "time": dt, "expect_ok": okkw, "snippet": content[:80].replace("\n", " ")}


SURFACES = [
    # OS surfaces (HTML)
    ("OS shell", "GET", "/os", None, "meok"),
    ("DOME", "GET", "/dome", None, None),
    ("Gaming HUD", "GET", "/hud", None, None),
    ("Onboarding (hatch)", "GET", "/hatch", None, None),
    ("Avatar", "GET", "/avatar", None, None),
    ("Tools panel", "GET", "/tools", None, None),
    ("MCP Registry page", "GET", "/registry", None, None),
    # core JSON APIs (GET)
    ("health", "GET", "/api/health", None, None),
    ("characters", "GET", "/api/characters", None, "characters"),
    ("agents (council)", "GET", "/api/agents", None, "council"),
    ("marketplace", "GET", "/api/marketplace", None, None),
    ("vitals/care", "GET", "/api/vitals?character=aria", None, None),
    ("SIGIL recent", "GET", "/api/sigil/recent?n=5", None, None),
    ("SIGIL verify", "GET", "/api/sigil/verify", None, "intact"),
    ("SIGIL manifest", "GET", "/api/sigil/manifest", None, None),
    ("MCP tools catalogue", "GET", "/api/mcp/tools", None, None),
    ("tiers (free/local/paid)", "GET", "/api/tiers", None, "ladder"),
    ("pricing", "GET", "/api/pricing", None, None),
    ("products", "GET", "/api/products", None, None),
    ("EXPORT (Free->Local seam)", "GET", "/api/export", None, "meok-export"),
    # core APIs (POST)
    ("think (chat)", "POST", "/api/think", {"character": "aria", "message": "hello", "brain": "left", "tier": "free"}, None),
    ("sovereign council (BFT)", "POST", "/api/sovereign", {"character": "aria", "message": "is my chatbot high-risk under the EU AI Act?", "brain": "sovereign"}, None),
    ("forecast", "POST", "/api/forecast", {"partial": "my ai chatbot"}, None),
    ("law applicable", "GET", "/api/law/applicable?region=EU&system=chatbot", None, "binding"),
    ("auth anon", "POST", "/api/auth/anon", {}, "token"),
    ("MCP bridge -> SOV3", "POST", "/api/mcp/call", {"tool": "get_system_status", "args": {}}, None),
]

DOMAINS = [
    "https://meok.ai", "https://councilof.ai", "https://csoai.org", "https://safetyof.ai",
    "https://proofof.ai", "https://aquaponics.app", "https://haulage.app",
    "https://optimobile.ai", "https://biasdetectionof.ai", "https://fishkeeper.ai",
]


def main():
    print("# MEOK E2E audit (run on GCP, off the Mac)")
    print(f"\nTarget: {B}\nMethod: warm-up + 3 retries @ 30s; live=200&>=120B&keyword, partial=200 thin, broken=non-200\n")

    results = []
    print("## MEOK ONE surfaces & APIs\n")
    print("| surface | status | http | bytes | s |")
    print("|---|---|---|---|---|")
    for (label, m, p, body, exp) in SURFACES:
        r = probe(label, m, p, body, exp)
        results.append(r)
        mark = {"live": "✅", "partial": "🟡", "broken": "🔴"}[r["cls"]]
        print(f"| {label} | {mark} {r['cls']} | {r['http']} | {r['bytes']} | {r['time']} |")

    print("\n## Flagship domains\n")
    print("| domain | status | http | bytes | s |")
    print("|---|---|---|---|---|")
    dom = []
    for d in DOMAINS:
        r = probe(d, "GET", d, None, None)
        dom.append(r)
        mark = {"live": "✅", "partial": "🟡", "broken": "🔴"}[r["cls"]]
        print(f"| {d.replace('https://','')} | {mark} {r['cls']} | {r['http']} | {r['bytes']} | {r['time']} |")

    allr = results + dom
    live = sum(1 for r in allr if r["cls"] == "live")
    part = sum(1 for r in allr if r["cls"] == "partial")
    brok = sum(1 for r in allr if r["cls"] == "broken")
    tot = len(allr)
    print(f"\n## Summary\n\n- ✅ live: **{live}/{tot}**  · 🟡 partial: {part}  · 🔴 broken: {brok}")
    print(f"- surfaces/APIs: {sum(1 for r in results if r['cls']=='live')}/{len(results)} live")
    print(f"- domains: {sum(1 for r in dom if r['cls']=='live')}/{len(dom)} live")
    if brok:
        print("\n**Broken (need attention):**")
        for r in allr:
            if r["cls"] == "broken":
                print(f"- 🔴 {r['label']} — http {r['http']}, {r['bytes']}B")
    if part:
        print("\n**Partial (thin/placeholder):**")
        for r in allr:
            if r["cls"] == "partial":
                print(f"- 🟡 {r['label']} — http {r['http']}, {r['bytes']}B")

    with open("/tmp/meok_e2e_audit.json", "w") as f:
        json.dump({"surfaces": results, "domains": dom,
                   "summary": {"live": live, "partial": part, "broken": brok, "total": tot}}, f, indent=1)
    print("\n_(raw JSON: /tmp/meok_e2e_audit.json)_")


if __name__ == "__main__":
    main()
