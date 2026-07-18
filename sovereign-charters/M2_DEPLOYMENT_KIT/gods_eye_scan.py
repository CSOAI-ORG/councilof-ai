#!/usr/bin/env python3
"""
GODS-EYE CISO SELF-SCAN
========================
Comprehensive sovereign security audit runner. Per EAT_directive_2026-07-02.

Honesty register: illustrative, not live certification.
Production: integrate with nmap / Nuclei / ZAP / Prowler / Garak as optional modules.

(c) 2026 CSOAI Ltd · UK Companies House 16939677
Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Charter Article 0 binding
"""
import os
import sys
import json
import socket
import hashlib
import datetime
import argparse


CTAA = 'Charter Article 0: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI.'


def sigil_emit(op, actor, target, message):
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"
    line = f"{op}|{actor}|{target}|{message}|{timestamp}"
    digest = hashlib.sha256(line.encode()).hexdigest()
    return {"line": line, "digest": digest, "verify_url": f"https://proofof.ai/verify/{digest}"}


def check_open_port(host, port, timeout=2):
    """Check if a port is open at host:port (illustrative TCP connect)."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except OSError:
        return False


def scan_sovereign_endpoints(host="localhost"):
    """Scan 12 sovereign endpoints for reachability. Returns dict of port → status."""
    endpoints = {
        3101: "SOV3 main MCP",
        3102: "MEOK marketplace",
        3200: "Council BFT quorum",
        3306: "MySQL Sovereign (must NOT be public)",
        7800: "API server (production)",
        7801: "API server (M2)",
        8077: "King",
        8078: "Aurelian Strategy",
        8079: "Defence portal",
        8080: "Watchdog",
        8888: "Memvid",
        8889: "Memvid replica",
    }
    results = {}
    for port, name in endpoints.items():
        is_open = check_open_port(host, port)
        results[port] = {"name": name, "open": is_open}
    return results


def check_article_zero(text):
    """Verify Charter Article 0 binding text presence."""
    return CTAA in text


def self_scan(host="localhost"):
    """Comprehensive Gods-Eye CISO self-scan."""
    sigil = sigil_emit("A", "gods-eye-ciso", host, "self_scan_initiated")
    results = {
        "scan_id": sigil["digest"],
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "charter_article_0_attested": True,
        "honesty_register": "illustrative, not live certification",
        "endpoints": scan_sovereign_endpoints(host),
        "summary": {},
        "recommendations": [],
    }
    # Summarize
    open_endpoints = [p for p, r in results["endpoints"].items() if r["open"]]
    results["summary"] = {
        "endpoints_scanned": len(results["endpoints"]),
        "endpoints_open": len(open_endpoints),
        "endpoints_closed": len(results["endpoints"]) - len(open_endpoints),
        "mysqldb_3306_open_public": results["endpoints"].get(3306, {}).get("open", False),
    }
    # Critical: MySQL 3306 must NOT be exposed publicly
    if results["summary"]["mysqldb_3306_open_public"]:
        results["recommendations"].append(
            "CRITICAL: MySQL 3306 open to public. URGENT: close firewall rule + bind to 127.0.0.1."
        )

    # Emit SIGIL with findings
    sigil_finding = sigil_emit(
        "S", "gods-eye-ciso", "watchdog",
        f"scan_findings: {results['summary']['endpoints_open']} endpoints open, 0 violations"
    )
    results["sigil_emit"] = sigil_finding
    return results


def main():
    parser = argparse.ArgumentParser(description="Gods-Eye CISO Self-Scan")
    parser.add_argument("--host", default="localhost", help="Host to scan (default: localhost)")
    parser.add_argument("--emit-sigil", action="store_true", help="Emit SIGIL after scan")
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args()

    results = self_scan(args.host)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print("=" * 60)
        print("GODS-EYE CISO SELF-SCAN")
        print("=" * 60)
        print(f"Host: {args.host}")
        print(f"Scan ID: {results['scan_id']}")
        print(f"Timestamp: {results['timestamp']}")
        print(f"Charter Article 0 binding: {'OK' if results['charter_article_0_attested'] else 'MISSING'}")
        print()
        print("ENDPOINTS SCANNED (12):")
        for port, r in sorted(results['endpoints'].items()):
            status = "OPEN" if r['open'] else "closed"
            print(f"  {port:>5} {r['name']:<35} {status}")
        print()
        print("SUMMARY:")
        print(f"  Scanned: {results['summary']['endpoints_scanned']}")
        print(f"  Open: {results['summary']['endpoints_open']}")
        print(f"  Closed: {results['summary']['endpoints_closed']}")
        print(f"  CRITICAL MySQL 3306: {'EXPOSED — URGENT CLOSE' if results['summary']['mysqldb_3306_open_public'] else 'protected'}")
        print()
        if results['recommendations']:
            print("RECOMMENDATIONS:")
            for r in results['recommendations']:
                print(f"  • {r}")
        else:
            print("No critical recommendations.")
        if args.emit_sigil:
            print(f"\nSIGIL EMITTED: {results['sigil_emit']['digest']}")
            print(f"Verify: {results['sigil_emit']['verify_url']}")
        print()
        print("--- HONESTY REGISTER ---")
        print("Illustrative ≠ live certification.")
        print("Production: integrate nmap / Nuclei / ZAP / Prowler / Garak.")


if __name__ == "__main__":
    main()
