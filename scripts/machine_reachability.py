#!/usr/bin/env python3
"""Measure whether our own public surfaces are reachable by a machine, which is our whole audience.

WHAT THIS MEASURES
For each published URL, the HTTP status returned to a plain standard-library client, and to the
same request carrying a browser user-agent. A difference between the two is not a curiosity: it
means the surface is up for people and down for programs.

WHY IT MATTERS HERE MORE THAN ELSEWHERE
Everything CSOAI publishes is addressed to machines. The DID document exists so a verifier can
fetch a key. The agent card exists so an agent can find our skills. robots.txt and llms.txt exist
so a crawler can read our rules. x402 exists so a buying agent can receive a payment challenge. If
those answer 403 to a standard client, the product does not work, no matter what a browser shows.

WHAT THIS IS NOT
Not a claim about any vendor's intentions, and not a security finding. It is a reachability
measurement of our own estate, taken from one network at one time, and it says so.
"""
import argparse, json, sys, urllib.request, urllib.error, datetime

ORIGIN = "https://councilof.ai"
PATHS = ["/", "/estate/", "/verify", "/gspc-verify", "/board", "/press",
         "/api/gspc", "/api/state", "/api/corrections", "/api/cards", "/api/root",
         "/api/revenue", "/api/x402", "/api/free-door", "/api/learning-scenarios",
         "/.well-known/agent-card.json", "/.well-known/x402.json", "/.well-known/did.json",
         "/layer0-drive-through.json", "/eat-flywheel.json", "/layer0-distribution.json", "/progress-index.json",
         "/sitemap.xml", "/robots.txt", "/llms.txt"]
# 402 is a correct answer from a payable door, not a failure.
OK = {200, 402}


def status(url, ua=None):
    h = {"User-Agent": ua} if ua else {}
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=30)
        return r.status, ""
    except urllib.error.HTTPError as e:
        body = b""
        try:
            body = e.read()[:60]
        except Exception:
            pass
        return e.code, body.decode("utf8", "replace").strip()
    except Exception as e:
        return 0, str(e)[:60]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        # The check must be able to report both outcomes, or its green means nothing.
        good, _ = status("https://huggingface.co/api/models?author=csoai&limit=1")
        bad, _ = status("https://councilof.ai/definitely-not-a-real-path-" + "z" * 12)
        assert good in OK, "a host known to serve plain clients was not reported as reachable"
        assert bad not in OK, "a path that cannot exist was reported as reachable"
        print(f"selftest OK: a reachable host reads {good}, an impossible path reads {bad}")
        return 0

    rows = []
    for p in PATHS:
        u = ORIGIN + p
        plain, plain_body = status(u)
        browser, _ = status(u, "Mozilla/5.0")
        rows.append({
            "path": p,
            "plain_client_status": plain,
            "plain_client_body": plain_body,
            "browser_ua_status": browser,
            "state": ("REACHABLE_BY_MACHINE" if plain in OK else
                      "HUMAN_ONLY" if browser in OK else "DOWN_FOR_BOTH"),
        })

    from collections import Counter
    c = Counter(r["state"] for r in rows)
    art = {
        "schema": "csoai.machine-reachability/0.1",
        "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "origin": ORIGIN,
        "method": ("Two requests per URL from one network: a Python standard-library client with no "
                   "User-Agent override, and the same request carrying a browser User-Agent. "
                   "HTTP 402 counts as reachable, because a payable door answering 402 is working."),
        "what_this_is_not": [
            "Not a claim about any vendor's intentions.",
            "Not a security finding.",
            "One network, one moment. A different network may see different results.",
        ],
        "why_this_matters": ("Everything published here is addressed to machines. The DID document "
                             "exists so a verifier can fetch a key; the agent card so an agent can find "
                             "our skills; robots.txt and llms.txt so a crawler can read our rules; x402 "
                             "so a buying agent can receive a payment challenge. HUMAN_ONLY on those "
                             "surfaces means the product does not work, whatever a browser shows."),
        "totals": {"urls": len(rows), **{k: v for k, v in sorted(c.items())}},
        "rows": rows,
    }
    out = a.out or f"public/interop/machine-reachability-{datetime.date.today().isoformat()}.json"
    open(out, "w").write(json.dumps(art, indent=2) + "\n")
    print(f"urls {len(rows)}  " + "  ".join(f"{k} {v}" for k, v in sorted(c.items())))
    print(f"written {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
