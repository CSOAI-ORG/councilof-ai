"""
RUNESTONE CLI — Command-line client for end users.
Usage:
  python runestone_cli.py submit "What is Article 50?"
  python runestone_cli.py submit-4brain "Audit my AI system"
  python runestone_cli.py read <sigil>
  python runestone_cli.py audit <sigil>
  python runestone_cli.py stats
  python runestone_cli.py health
"""

import sys, json, urllib.request, urllib.parse, urllib.error

BASE = "http://localhost:7777"


def call(path: str, method: str = "GET", body: dict = None) -> dict:
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    if body: req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": str(e), "body": e.read().decode()[:200] if e.fp else ""}
    except Exception as e:
        return {"error": str(e)}


def cmd_submit(query: str):
    """Submit a 1-brain query."""
    r = call("/portal/submit", "POST", {"query": query})
    print(json.dumps(r, indent=2))


def cmd_submit_4brain(query: str):
    """Submit a 4-brain parallel query."""
    r = call("/portal/submit/4brain", "POST", {"query": query})
    if "error" in r:
        print(json.dumps(r, indent=2))
        return
    # Pretty print 4-brain output
    print(f"\n  Mode: {r['mode']}")
    print(f"  Concord: {r['consensus']['concord']} (consensus: {r['consensus']['score']})")
    print(f"  Voters: {r['consensus']['n_voters']} ({r['consensus']['n_brains']} brains)")
    print(f"  Sigil: {r['sigil'][:32]}...")
    print(f"  Audit: {r['audit_url']}")
    print(f"\n  Brain responses:")
    for brain, br in r['brains'].items():
        status = "✅" if br['brain_passed'] else "⚠️"
        print(f"    {status} {brain:<11} ({br['polyhedron']:<14}) score={br['brain_score']}")
        print(f"         {br['primary_response'][:120]}...")


def cmd_read(sigil: str):
    """Read a runestone by sigil."""
    r = call(f"/portal/read/{sigil}")
    print(json.dumps(r, indent=2))


def cmd_audit(sigil: str):
    """Audit a runestone's provenance."""
    r = call(f"/portal/audit/{sigil}")
    print(json.dumps(r, indent=2))


def cmd_stats():
    """Show portal statistics."""
    r = call("/portal/stats")
    print(json.dumps(r, indent=2))


def cmd_health():
    """Health check."""
    r = call("/portal/health")
    print(json.dumps(r, indent=2))


def cmd_brains():
    """List the 4 brains."""
    r = call("/portal/brains")
    print(json.dumps(r, indent=2))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "submit" and len(sys.argv) >= 3:
        cmd_submit(" ".join(sys.argv[2:]))
    elif cmd == "submit-4brain" and len(sys.argv) >= 3:
        cmd_submit_4brain(" ".join(sys.argv[2:]))
    elif cmd == "read" and len(sys.argv) >= 3:
        cmd_read(sys.argv[2])
    elif cmd == "audit" and len(sys.argv) >= 3:
        cmd_audit(sys.argv[2])
    elif cmd == "stats":
        cmd_stats()
    elif cmd == "health":
        cmd_health()
    elif cmd == "brains":
        cmd_brains()
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
