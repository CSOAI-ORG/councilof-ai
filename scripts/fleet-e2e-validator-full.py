#!/usr/bin/env python3
"""Fleet-wide E2E validator for ALL MCP ensemble services."""

import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
COMPOSE_FILE = BASE_DIR / "docker-compose.mcp-ensemble.yml"
REPORT_PATH = BASE_DIR / "FLEET_E2E_REPORT_FULL.json"


def run(cmd, cwd=None, timeout=300):
    return subprocess.run(
        cmd, cwd=cwd or BASE_DIR, capture_output=True, text=True, timeout=timeout
    )


def get_services():
    r = run(["docker", "compose", "-f", str(COMPOSE_FILE), "--profile", "mcp", "config", "--services"])
    if r.returncode != 0:
        print(f"Failed to list services: {r.stderr}")
        sys.exit(1)
    return [s.strip() for s in r.stdout.strip().splitlines() if s.strip()]


def get_service_port(service: str) -> int:
    import yaml
    with open(COMPOSE_FILE) as f:
        cfg = yaml.safe_load(f)
    port_str = cfg["services"][service]["ports"][0]
    return int(port_str.split(":")[0])


def health_check(port: int, timeout: int = 30) -> dict:
    url = f"http://localhost:{port}/health"
    well_known = f"http://localhost:{port}/.well-known/mcp"
    start = time.time()
    for _ in range(timeout):
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                health_body = resp.read().decode()
                health_status = resp.status
            with urllib.request.urlopen(well_known, timeout=2) as resp:
                well_known_status = resp.status
            latency = round(time.time() - start, 3)
            return {
                "healthy": True,
                "health_status": health_status,
                "well_known_status": well_known_status,
                "latency_seconds": latency,
                "health_body": health_body[:200],
            }
        except Exception:
            time.sleep(1)
    return {
        "healthy": False,
        "health_status": None,
        "well_known_status": None,
        "latency_seconds": None,
        "error": "Health check timed out",
    }


def main() -> int:
    services = get_services()
    print(f"Validating {len(services)} services...", flush=True)

    results = []
    for idx, svc in enumerate(services, 1):
        port = get_service_port(svc)
        print(f"\n[{idx}/{len(services)}] {svc} port={port}", flush=True)

        run(["docker", "compose", "-f", str(COMPOSE_FILE), "--profile", "mcp", "rm", "-sf", svc])

        build_start = time.time()
        up = run(
            ["docker", "compose", "-f", str(COMPOSE_FILE), "--profile", "mcp", "up", "-d", "--build", svc],
            timeout=300,
        )
        build_time = round(time.time() - build_start, 3)

        if up.returncode != 0:
            results.append({
                "service": svc,
                "port": port,
                "build_success": False,
                "build_error": up.stderr[-500:],
                "build_time_seconds": build_time,
                "health": {"healthy": False, "error": "Build failed"},
            })
            print(f"  BUILD FAILED", flush=True)
            continue

        health = health_check(port, timeout=60)
        results.append({
            "service": svc,
            "port": port,
            "build_success": True,
            "build_time_seconds": build_time,
            "health": health,
        })
        status = "HEALTHY" if health["healthy"] else "UNHEALTHY"
        print(f"  {status} latency={health.get('latency_seconds')}", flush=True)

        run(["docker", "compose", "-f", str(COMPOSE_FILE), "--profile", "mcp", "rm", "-sf", svc])

    report = {
        "validated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": "full",
        "total_services_validated": len(services),
        "build_successes": sum(1 for r in results if r["build_success"]),
        "health_successes": sum(1 for r in results if r["health"]["healthy"]),
        "results": results,
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"\n\nReport saved to {REPORT_PATH}", flush=True)
    print(f"Build successes: {report['build_successes']}/{report['total_services_validated']}", flush=True)
    print(f"Health successes: {report['health_successes']}/{report['total_services_validated']}", flush=True)
    return 0 if report["health_successes"] == report["total_services_validated"] else 1


if __name__ == "__main__":
    sys.exit(main())
