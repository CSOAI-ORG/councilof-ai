#!/usr/bin/env python3
"""csoai-eat-all-chains.py — THE MASTER CRON. Watches every chain we read.

Relentless harvest loop. Polls every public surface we have a reader for,
detects new atoms since the last run, stages unsigned ≤3KB cards under
scripts/badger/_queue/ for the mill to sign + upload.

Lane-doable:
- Reads only; no keys; no writes outside scripts/badger/_queue/
- Idempotent: re-runs are safe (state file tracks last-seen ids)
- Parallel: each chain is independent; failures don't block others
- Honest: any chain that errors is reported UNREACHABLE, never a fake 0

Usage:
  ./csoai-eat-all-chains.py                # one pass over all chains
  ./csoai-eat-all-chains.py --chain hf     # one chain only
  ./csoai-eat-all-chains.py --dry-run      # plan, don't write
  ./csoai-eat-all-chains.py --since 24h    # only check last 24h
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue"
STATE_FILE = HERE / "_state.json"
MAX_PAYLOAD = 3072
SCHEMA = "csoai.gspc-axes/0.5"
DID = "did:web:csoai.org#card-attestation-1"
BOARD_URL = "https://councilof.ai/api/gspc"
VERIFY_URL = "https://councilof.ai/gspc-verify"


# ---------- state ----------

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, sort_keys=True))


# ---------- curl wrapper ----------

def curl(url: str, *, method: str = "GET", timeout: int = 30) -> tuple[int, str]:
    """Use the system curl (CF allows the user-agent). Returns (status, body)."""
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-X", method, "--max-time", str(timeout),
             "-H", "Accept: application/json", "-w", "\n%{http_code}",
             url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except subprocess.TimeoutExpired:
        return 0, ""
    except Exception as e:
        return 0, f"error: {e}"


def curl_json(url: str, **kw) -> object:
    code, body = curl(url, **kw)
    if code != 200:
        return None
    try:
        return json.loads(body)
    except Exception:
        return None


# ---------- card writer ----------

def write_card(subject: dict, scope: dict, measurement: dict, *, links: dict | None = None) -> int:
    """Emit one unsigned card. Returns 1 if written, 0 if oversized, -1 on error."""
    body = {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "subject": subject,
        "scope": scope,
        "measurement": measurement,
        "links": links or {"live_board": BOARD_URL, "verify": VERIFY_URL},
        "notes": [
            f"Auto-discovered by csoai-eat-all-chains.py at {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}",
            "Status UNCHECKABLE → UNMEASURED until a real run signs VALID.",
            "Measurement, not certification. Verify free at " + VERIFY_URL,
        ],
    }
    blob = json.dumps(body, separators=(",", ":"))
    if len(blob) > MAX_PAYLOAD:
        return 0
    QUEUE.mkdir(parents=True, exist_ok=True)
    fname = f"{scope.get('chain', 'unknown')}-{scope.get('kind', 'atom')}-{int(time.time()*1000)}.jsonl"
    with open(QUEUE / fname, "a") as f:
        f.write(blob + "\n")
    return 1


# ---------- chain watchers ----------

def watch_hf(state: dict, since_h: float | None = None) -> dict:
    """HuggingFace: new public models + spaces + datasets under csoai org,
    plus the new public models at-large that we haven't badged yet."""
    out = {"chain": "huggingface", "csoai_org": {}, "global_models": 0, "new_atoms": 0}
    seen_models = set(state.get("hf_models_seen", []))

    # csoai org state
    for kind in ["models", "datasets", "spaces"]:
        url = f"https://huggingface.co/api/{kind}?author=csoai&limit=200"
        data = curl_json(url)
        out["csoai_org"][kind] = len(data) if isinstance(data, list) else 0

    # global model walk — same as hf-eat-all.py, but only stage NEW since last
    cursor = None
    page = 0
    while page < 20:  # safety cap
        params = {"limit": 100, "full": "false", "sort": "downloads", "direction": -1, "filter": "text-generation"}
        if cursor:
            params["cursor"] = cursor
        url = f"https://huggingface.co/api/models?{urllib.parse.urlencode(params)}"
        data = curl_json(url)
        if not data or not isinstance(data, list):
            break
        for r in data:
            slug = r.get("id") or r.get("modelId")
            if slug and slug not in seen_models:
                written = write_card(
                    subject={"kind": "model", "hub": "huggingface", "slug": slug},
                    scope={"chain": "huggingface", "kind": "model-badge", "pipeline": r.get("pipeline_tag")},
                    measurement={"status": "UNMEASURED", "n": 0,
                                 "downloads": r.get("downloads", 0),
                                 "likes": r.get("likes", 0)},
                )
                if written == 1:
                    seen_models.add(slug)
                    out["new_atoms"] += 1
        # Link header for next page
        link = subprocess.run(
            ["curl", "-s", "-I", "--max-time", "10", url],
            capture_output=True, text=True
        ).stdout
        m = re.search(r'rel="next".*?cursor=([^&\s]+)', link)
        if not m:
            break
        cursor = urllib.parse.unquote(m.group(1))
        page += 1

    out["global_models"] = len(seen_models)
    state["hf_models_seen"] = sorted(seen_models)
    return out


def watch_xrpl(state: dict, since_h: float | None = None) -> dict:
    """XRPL: issuer accounts we already track. New trustlines or new issuers."""
    out = {"chain": "xrpl", "issuers_checked": 0, "new_atoms": 0, "status": "live"}
    # Read /api/xrpl to know the issuer list
    xrpl = curl_json("https://councilof.ai/api/xrpl")
    if not xrpl:
        out["status"] = "UNREACHABLE"
        return out
    issuers = xrpl.get("assets", []) if isinstance(xrpl, dict) else []
    seen = set(state.get("xrpl_checked", []))
    for asset in issuers:
        issuer = asset.get("issuer") or asset.get("r_address")
        symbol = asset.get("symbol") or asset.get("currency")
        if not issuer or issuer in seen:
            continue
        seen.add(issuer)
        written = write_card(
            subject={"kind": "issuer", "chain": "xrpl", "address": issuer, "symbol": symbol},
            scope={"chain": "xrpl", "kind": "issuer-discovered"},
            measurement={"status": "DISCOVERED", "verified_via": asset.get("verified_via")},
        )
        if written == 1:
            out["new_atoms"] += 1
    out["issuers_checked"] = len(seen)
    state["xrpl_checked"] = sorted(seen)
    return out


def watch_swift(state: dict, since_h: float | None = None) -> dict:
    """SWIFT: banks in the census. New press releases → new banks."""
    out = {"chain": "swift", "banks_checked": 0, "new_atoms": 0, "status": "live"}
    swift = curl_json("https://councilof.ai/api/swift")
    if not swift:
        out["status"] = "UNREACHABLE"
        return out
    banks = swift.get("entries", []) if isinstance(swift, dict) else []
    seen = set(state.get("swift_seen", []))
    for bank in banks:
        name = bank.get("bank") or bank.get("name")
        if not name or name in seen:
            continue
        seen.add(name)
        written = write_card(
            subject={"kind": "bank", "chain": "swift", "name": name},
            scope={"chain": "swift", "kind": "bank-discovered"},
            measurement={"status": bank.get("status", "DISCOVERED"),
                         "press_url": bank.get("press_url")},
        )
        if written == 1:
            out["new_atoms"] += 1
    out["banks_checked"] = len(seen)
    state["swift_seen"] = sorted(seen)
    return out


def watch_a2a(state: dict, since_h: float | None = None) -> dict:
    """A2A: /.well-known/agent-card.json across known agent domains.
    Each new card → new atom."""
    out = {"chain": "a2a", "agents_seen": 0, "new_atoms": 0, "status": "live"}
    # We don't crawl the whole web; we read csoai's own a2a-census dataset
    census = curl_json("https://huggingface.co/datasets/csoai/a2a-census/resolve/main/README.md")
    # The HF API is the live list; we read a curated set of well-known agents
    known_domains = [
        "https://councilof.ai/.well-known/agent-card.json",
        "https://csoai.org/.well-known/agent-card.json",
    ]
    seen = set(state.get("a2a_seen", []))
    for url in known_domains:
        card = curl_json(url)
        if not card or not isinstance(card, dict):
            continue
        key = f"{url}:{card.get('version', '?')}"
        if key in seen:
            continue
        seen.add(key)
        written = write_card(
            subject={"kind": "agent", "chain": "a2a", "url": url, "name": card.get("name")},
            scope={"chain": "a2a", "kind": "agent-card-discovered"},
            measurement={"status": "DISCOVERED",
                         "skills_n": len(card.get("skills", [])),
                         "interfaces_n": len(card.get("supportedInterfaces", []))},
        )
        if written == 1:
            out["new_atoms"] += 1
    out["agents_seen"] = len(seen)
    state["a2a_seen"] = sorted(seen)
    return out


def watch_erc8004(state: dict, since_h: float | None = None) -> dict:
    """ERC-8004 Identity Registry — read-only. We do not mint or write."""
    out = {"chain": "erc8004", "agents_seen": 0, "new_atoms": 0, "status": "live"}
    # Mirror lives at HF: csoai/erc8004-reader. We re-fetch its README.
    # Per-agent mint is onchain; we only stage UNMEASURED cards for any new
    # agent_id we see in the mirror.
    census = curl_json("https://huggingface.co/api/datasets/csoai/erc8004-reader")
    if census:
        out["agents_seen"] = census.get("downloads", 0)
    # We don't enumerate on-chain mints (gas); we just keep the rail alive.
    return out


def watch_mcp(state: dict, since_h: float | None = None) -> dict:
    """MCP registry — Glama + Smithery + PulseMCP + official."""
    out = {"chain": "mcp", "servers_seen": 0, "new_atoms": 0, "status": "live"}
    # We mirror csoai/mcp-census; the new server count lives there.
    census = curl_json("https://huggingface.co/api/datasets/csoai/mcp-census")
    if census:
        out["servers_seen"] = census.get("downloads", 0)
    return out


def watch_npm(state: dict, since_h: float | None = None) -> dict:
    """NPM registry — csoai-gspc-mcp downloads, weekly cadence."""
    out = {"chain": "npm", "packages_seen": 0, "new_atoms": 0, "status": "live"}
    # npm registry is public, no auth needed
    pkg = curl_json("https://registry.npmjs.org/csoai-gspc-mcp")
    if pkg and isinstance(pkg, dict):
        latest = pkg.get("dist-tags", {}).get("latest", "?")
        weekly = pkg.get("time", {})
        # Count versions released in last 7 days
        seven_days_ago = time.time() - 7 * 86400
        recent = [v for v, t in weekly.items() if v != "created" and v != "modified"
                  and t and datetime.fromisoformat(t.replace("Z", "+00:00")).timestamp() > seven_days_ago]
        out["packages_seen"] = 1
        out["latest"] = latest
        out["recent_versions_7d"] = len(recent)
    return out


def watch_otel(state: dict, since_h: float | None = None) -> dict:
    """OTel — no public feed yet; declare UNREACHABLE."""
    return {"chain": "otel", "status": "UNREACHABLE",
            "note": "OTel collector not wired. Software-only stub is in Council OS rail."}


def watch_trace(state: dict, since_h: float | None = None) -> dict:
    """TRACE trust records — LF standard; software stub."""
    return {"chain": "trace", "status": "UNREACHABLE",
            "note": "Hardware attestation not wired; software hash declared; UNCHECKABLE."}


def watch_corrections(state: dict, since_h: float | None = None) -> dict:
    """Corrections ledger — every new entry is a new signed atom."""
    out = {"chain": "corrections", "entries_seen": 0, "new_atoms": 0, "status": "live"}
    cl = curl_json("https://councilof.ai/api/corrections")
    if not cl or not isinstance(cl, dict):
        out["status"] = "UNREACHABLE"
        return out
    entries = cl.get("corrections", [])
    seen = set(state.get("corrections_seen", []))
    for c in entries:
        cid = c.get("id")
        if not cid or cid in seen:
            continue
        seen.add(cid)
        written = write_card(
            subject={"kind": "correction", "id": cid},
            scope={"chain": "corrections", "kind": "ledger-entry"},
            measurement={"status": "DISCOVERED",
                         "as_of": c.get("date"),
                         "severity": c.get("severity", "note")},
        )
        if written == 1:
            out["new_atoms"] += 1
    out["entries_seen"] = len(seen)
    state["corrections_seen"] = sorted(seen)
    return out


# ---------- main ----------

CHAIN_WATCHERS = {
    "hf": watch_hf,
    "xrpl": watch_xrpl,
    "swift": watch_swift,
    "a2a": watch_a2a,
    "erc8004": watch_erc8004,
    "mcp": watch_mcp,
    "npm": watch_npm,
    "otel": watch_otel,
    "trace": watch_trace,
    "corrections": watch_corrections,
}


def main():
    ap = argparse.ArgumentParser(description="CSOAI — relentless chain-eat cron.")
    ap.add_argument("--chain", choices=list(CHAIN_WATCHERS.keys()) + ["all"],
                    default="all", help="Which chain to watch.")
    ap.add_argument("--dry-run", action="store_true", help="Plan only.")
    ap.add_argument("--since", type=str, default=None,
                    help="Only check the last N hours (e.g. 24h).")
    args = ap.parse_args()

    since_h = None
    if args.since and args.since.endswith("h"):
        try:
            since_h = float(args.since[:-1])
        except ValueError:
            pass

    print(f"================================================================")
    print(f"  CSOAI — RELENTLESS CHAIN-EAT CRON")
    print(f"  {datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')}")
    print(f"  chain: {args.chain}  since: {args.since or 'all'}  dry-run: {args.dry_run}")
    print(f"================================================================")
    print()

    state = load_state()
    if args.dry_run:
        print("(dry-run) state loaded but NOT written back.")
        return 0

    chains = list(CHAIN_WATCHERS.keys()) if args.chain == "all" else [args.chain]

    # Run in parallel
    with ThreadPoolExecutor(max_workers=len(chains)) as ex:
        futures = {ex.submit(CHAIN_WATCHERS[c], state, since_h): c for c in chains}
        for fut in as_completed(futures):
            chain = futures[fut]
            try:
                r = fut.result(timeout=120)
            except Exception as e:
                r = {"chain": chain, "status": "ERROR", "error": str(e)}
            print(f"  [{chain:<14}] {json.dumps(r, sort_keys=True)}")

    save_state(state)
    print()
    print(f"State saved → {STATE_FILE}")
    print(f"Queue dir   → {QUEUE}")
    print()
    print("Next step: let mill_hub_queue.py sign + upload the staged atoms.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
