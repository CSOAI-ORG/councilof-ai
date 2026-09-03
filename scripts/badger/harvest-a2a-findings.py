#!/usr/bin/env python3
"""harvest-a2a-findings.py — A2A capability-honesty finding cards.

Lane-doable: reads /.well-known/agent-card.json from a curated set of
known agent domains. For each card: emit a finding card (claimed
capability vs what we can probe honestly). UNMEASURED unless the
caller actually probes the endpoint.

Usage:
  ./harvest-a2a-findings.py --dry-run
  ./harvest-a2a-findings.py
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "a2a-findings"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

# A curated set of well-known A2A-publishing domains.
# Each entry: (domain, expected_card_url)
A2A_TARGETS = [
    ("https://councilof.ai", "https://councilof.ai/.well-known/agent-card.json"),
    ("https://csoai.org", "https://csoai.org/.well-known/agent-card.json"),
    # Add more as they publish
]


def curl_json(url: str) -> object:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", "15", url],
            capture_output=True, text=True, timeout=20,
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


def card(domain: str, agent: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    name = agent.get("name", "?")
    version = agent.get("version", "?")
    skills = agent.get("skills", [])
    interfaces = agent.get("supportedInterfaces", [])
    streaming = agent.get("capabilities", {}).get("streaming", False)
    push = agent.get("capabilities", {}).get("pushNotifications", False)
    return {
        "schema": SCHEMA,
        "kind": "gspc.a2a-finding",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "agent",
            "url": f"{domain}/.well-known/agent-card.json",
            "name": name,
            "version": version,
        },
        "scope": {
            "axis": "a2a-capability-honesty",
            "kind": "agent-card-discovered",
        },
        "measurement": {
            "status": "DISCOVERED",
            "skills_n": len(skills),
            "interfaces_n": len(interfaces),
            "claims_streaming": streaming,
            "claims_push": push,
            "version": version,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "study": "Public study: 92% capability-honesty failure rate. Cite, don't invent.",
        },
        "notes": [
            f"Auto-derived by harvest-a2a-findings.py at {now}",
            "A2A v1.0 frozen March 2026, Agentic AI Foundation.",
            "Cap probe would prove or disprove the claim — we stage the discovery first.",
        ],
    }


def main():
    ap = argparse.ArgumentParser(description="A2A finding harvester.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"=== A2A CAPABILITY-HONESTY FINDING ===")
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"a2a-findings-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    n_unreachable = 0

    for domain, card_url in A2A_TARGETS:
        agent = curl_json(card_url)
        if not agent or not isinstance(agent, dict):
            print(f"  {domain}  UNREACHABLE — {card_url}")
            n_unreachable += 1
            continue
        body = card(domain, agent)
        blob = json.dumps(body, separators=(",", ":"))
        if args.dry_run:
            print(f"  {domain}  card exists (dry-run) — {len(blob)}B")
            continue
        if len(blob) > MAX_PAYLOAD:
            n_oversized += 1
            continue
        with open(path, "a") as f:
            f.write(blob + "\n")
        n_written += 1
        print(f"  {domain}  → {agent.get('name')} v{agent.get('version')}")

    if not args.dry_run:
        print()
        print(f"  written:   {n_written}")
        print(f"  oversized: {n_oversized}")
        print(f"  unreachable: {n_unreachable}")
        print(f"  queue:     {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
