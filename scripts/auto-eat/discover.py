#!/usr/bin/env python3
"""discover.py — ASI AUTO-EAT step 1 of the estate grammar (discover).

Polls the public sources wired this session and appends genuinely-NEW ids to
the frozen append-only queue with status=DISCOVERED, as_of, source, kind.

Sources (all keyless, read-only):
  hf-model     https://huggingface.co/api/models?sort=createdAt   (new models)
  mcp-server   https://registry.modelcontextprotocol.io/v0/servers (MCP registry)
  erc8004      https://api.8004scan.io/api/v1/agents               (ERC-8004 regs)
  xrpl-account https://s1.ripple.com:51234 account/tx of latest validated ledger

Dedupe: against the frozen queue AND against ids already named in the human
ledger cards. State counts, never invent. DISCOVERED is a first-class state;
nothing here probes, grades, or signs.

Usage: python3 discover.py [--per-source N]   (default 25)
"""
from __future__ import annotations

import argparse
import json
import sys

import common as c

HF_MODELS = "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit={n}"
MCP_REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers?limit={n}"
ERC8004 = "https://api.8004scan.io/api/v1/agents?limit={n}&min_feedbacks=1"
XRPL_RPC = "https://s1.ripple.com:51234"


def discover_hf(n: int) -> list[dict]:
    st, body = c.http_get(HF_MODELS.format(n=n))
    if st != 200 or not body:
        print(f"  hf-model UNREACHABLE (status={st})", file=sys.stderr)
        return []
    try:
        items = json.loads(body)
    except Exception:
        print("  hf-model UNCHECKABLE (bad json)", file=sys.stderr)
        return []
    out = []
    for m in items:
        mid = m.get("id") or m.get("modelId")
        if not mid:
            continue
        out.append({
            "kind": "hf-model",
            "id": mid,
            "status": "DISCOVERED",
            "source": "huggingface.co/api/models",
            "as_of": c.utcnow(),
            "meta": {"pipeline_tag": m.get("pipeline_tag"), "sha": m.get("sha")},
        })
    return out


def discover_mcp(n: int) -> list[dict]:
    st, body = c.http_get(MCP_REGISTRY.format(n=n))
    if st != 200 or not body:
        print(f"  mcp-server UNREACHABLE (status={st})", file=sys.stderr)
        return []
    try:
        data = json.loads(body)
    except Exception:
        print("  mcp-server UNCHECKABLE (bad json)", file=sys.stderr)
        return []
    out = []
    for row in data.get("servers", []):
        s = row.get("server", row)
        name = s.get("name")
        if not name:
            continue
        remotes = s.get("remotes") or []
        url = remotes[0].get("url") if remotes else None
        out.append({
            "kind": "mcp-server",
            "id": name,
            "status": "DISCOVERED",
            "source": "registry.modelcontextprotocol.io",
            "as_of": c.utcnow(),
            "meta": {"remote_url": url, "has_remote": bool(url)},
        })
    return out


def discover_erc8004(n: int) -> list[dict]:
    st, body = c.http_get(ERC8004.format(n=n), timeout=30)
    if st != 200 or not body:
        print(f"  erc8004 UNREACHABLE (status={st})", file=sys.stderr)
        return []
    try:
        data = json.loads(body)
    except Exception:
        print("  erc8004 UNCHECKABLE (bad json)", file=sys.stderr)
        return []
    out = []
    for a in data.get("items", []):
        aid = a.get("agent_id")
        if not aid:
            continue
        out.append({
            "kind": "erc8004",
            "id": aid,
            "status": "DISCOVERED",
            "source": "api.8004scan.io/api/v1/agents",
            "as_of": c.utcnow(),
            "meta": {
                "chain_id": a.get("chain_id"),
                "contract_address": a.get("contract_address"),
                "token_id": a.get("token_id"),
            },
        })
    return out


def discover_xrpl(n: int) -> list[dict]:
    # Latest validated ledger -> distinct accounts touched by its transactions.
    st, res = c.http_post_json(XRPL_RPC, {
        "method": "ledger",
        "params": [{"ledger_index": "validated", "transactions": True, "expand": False}],
    })
    if st != 200 or not res:
        print(f"  xrpl-account UNREACHABLE (status={st})", file=sys.stderr)
        return []
    result = res.get("result") or {}
    ledger = result.get("ledger") or {}
    idx = result.get("ledger_index") or ledger.get("ledger_index")
    txs = ledger.get("transactions") or []
    # transactions here are tx hashes; fetch a bounded few and pull the Account.
    out = []
    for h in txs[: n * 2]:
        if len(out) >= n:
            break
        if not isinstance(h, str):
            continue
        stx, rtx = c.http_post_json(XRPL_RPC, {"method": "tx", "params": [{"transaction": h}]})
        if stx != 200 or not rtx:
            continue
        acct = (rtx.get("result") or {}).get("Account")
        if not acct:
            continue
        out.append({
            "kind": "xrpl-account",
            "id": acct,
            "status": "DISCOVERED",
            "source": "s1.ripple.com:51234 (ledger/tx)",
            "as_of": c.utcnow(),
            "meta": {"ledger_index": idx, "via_tx": h},
        })
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-source", type=int, default=25)
    args = ap.parse_args()
    n = args.per_source

    existing = c.load_queue()
    seen = c.queue_keys(existing) | {f"hf-model:{i}" for i in ()}  # base
    carded = c.carded_ids()

    found: list[dict] = []
    for name, fn in (
        ("hf-model", discover_hf),
        ("mcp-server", discover_mcp),
        ("erc8004", discover_erc8004),
        ("xrpl-account", discover_xrpl),
    ):
        try:
            rows = fn(n)
        except Exception as e:  # a source failing never kills the pass
            print(f"  {name} UNREACHABLE (exception {str(e)[:60]})", file=sys.stderr)
            rows = []
        fresh = []
        for r in rows:
            key = f"{r['kind']}:{r['id']}"
            if key in seen:
                continue
            if str(r["id"]) in carded:
                continue
            seen.add(key)
            fresh.append(r)
        found.extend(fresh)
        print(f"  {name}: polled={len(rows)} new={len(fresh)}")

    if found:
        c.append_queue(found)
    print(f"DISCOVER new={len(found)} queue_total={len(existing) + len(found)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
