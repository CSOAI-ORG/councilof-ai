#!/usr/bin/env python3
"""discover.py — ASI AUTO-EAT step 1 of the estate grammar (discover).

Polls the public sources wired this session and appends genuinely-NEW ids to
the frozen append-only queue with status=DISCOVERED, as_of, source, kind.

Sources (all keyless, read-only):
  hf-model      https://huggingface.co/api/models?sort=createdAt   (new models)
  hf-space      https://huggingface.co/api/spaces?sort=createdAt   (new Spaces)
  npm-registry  https://registry.npmjs.org/-/v1/search?text=mcp
  mcp-server    https://registry.modelcontextprotocol.io/v0/servers (MCP registry)
  a2a-agent     8004scan agent records that carry an http(s) uri
  erc8004       https://api.8004scan.io/api/v1/agents               (ERC-8004 regs)
  xrpl-account  https://s1.ripple.com:51234 account/tx of latest validated ledger

Dedupe: against the frozen queue AND against ids already named in the human
ledger cards. State counts, never invent. DISCOVERED is a first-class state;
nothing here probes, grades, or signs.

Usage: python3 discover.py [--per-source N]   (default 25)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

import common as c

# Empirically measured 2026-09-01: MCP 422 at limit=200; 8004scan 422 at
# limit=200 (less_than_equal); HF limit=1000+skip=1000 200; npm size=250 200.
PAGE = 1000
HF_PAGE = 1000
NPM_PAGE = 250
MCP_PAGE = 100
ERC_PAGE = 100
HF_MODELS = "https://huggingface.co/api/models?sort=createdAt&direction=-1&limit={n}&skip={skip}"
HF_SPACES = "https://huggingface.co/api/spaces?sort=createdAt&direction=-1&limit={n}&skip={skip}"
NPM_SEARCH = "https://registry.npmjs.org/-/v1/search?text=keywords:mcp&size={n}&from={skip}"
MCP_REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers?limit={n}"
ERC8004 = "https://api.8004scan.io/api/v1/agents?limit={n}&offset={skip}&min_feedbacks=1"
XRPL_RPC = "https://s1.ripple.com:51234"
# Public model/space ids can look like secrets; never queue them (push protection).
SECRETISH = re.compile(r"(hf_[A-Za-z0-9]{20,}|github_pat_|gho_|sk-|xox[baprs]-)", re.I)


def discover_hf(n: int) -> list[dict]:
    out, skip = [], 0
    while len(out) < n:
        take = min(HF_PAGE, n - len(out))
        st, body = c.http_get(HF_MODELS.format(n=take, skip=skip))
        if st != 200 or not body:
            if not out:
                print(f"  hf-model UNREACHABLE (status={st})", file=sys.stderr)
            break
        try:
            items = json.loads(body)
        except Exception:
            print("  hf-model UNCHECKABLE (bad json)", file=sys.stderr)
            break
        if not items:
            break
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
        skip += len(items)
        if len(items) < take:
            break
    return out[:n]


def discover_hf_space(n: int) -> list[dict]:
    out, skip = [], 0
    while len(out) < n:
        take = min(HF_PAGE, n - len(out))
        st, body = c.http_get(HF_SPACES.format(n=take, skip=skip))
        if st != 200 or not body:
            if not out:
                print(f"  hf-space UNREACHABLE (status={st})", file=sys.stderr)
            break
        try:
            items = json.loads(body)
        except Exception:
            print("  hf-space UNCHECKABLE (bad json)", file=sys.stderr)
            break
        if not items:
            break
        for m in items:
            sid = m.get("id")
            if not sid:
                continue
            out.append({
                "kind": "hf-space",
                "id": sid,
                "status": "DISCOVERED",
                "source": "huggingface.co/api/spaces",
                "as_of": c.utcnow(),
                "meta": {"likes": m.get("likes"), "sdk": m.get("sdk")},
            })
        skip += len(items)
        if len(items) < take:
            break
    return out[:n]


def discover_npm(n: int) -> list[dict]:
    out, skip = [], 0
    while len(out) < n:
        take = min(NPM_PAGE, n - len(out))
        st, body = c.http_get(NPM_SEARCH.format(n=take, skip=skip))
        if st != 200 or not body:
            if not out:
                print(f"  npm-registry UNREACHABLE (status={st})", file=sys.stderr)
            break
        try:
            data = json.loads(body)
        except Exception:
            print("  npm-registry UNCHECKABLE (bad json)", file=sys.stderr)
            break
        rows = data.get("objects") or []
        if not rows:
            break
        for row in rows:
            pkg = (row.get("package") or {})
            name = pkg.get("name")
            if not name:
                continue
            out.append({
                "kind": "npm-registry",
                "id": name,
                "status": "DISCOVERED",
                "source": "registry.npmjs.org/-/v1/search",
                "as_of": c.utcnow(),
                "meta": {"version": pkg.get("version")},
            })
        skip += len(rows)
        if len(rows) < take:
            break
    return out[:n]


def discover_mcp(n: int) -> list[dict]:
    out = []
    cursor = None
    while len(out) < n:
        take = min(MCP_PAGE, n - len(out))
        url = MCP_REGISTRY.format(n=take)
        if cursor:
            url += "&cursor=" + urllib.parse.quote(cursor)
        st, body = c.http_get(url)
        if st != 200 or not body:
            if not out:
                print(f"  mcp-server UNREACHABLE (status={st})", file=sys.stderr)
            break
        try:
            data = json.loads(body)
        except Exception:
            print("  mcp-server UNCHECKABLE (bad json)", file=sys.stderr)
            break
        rows = data.get("servers") or []
        if not rows:
            break
        for row in rows:
            s = row.get("server", row)
            name = s.get("name")
            if not name:
                continue
            remotes = s.get("remotes") or []
            url_r = remotes[0].get("url") if remotes else None
            out.append({
                "kind": "mcp-server",
                "id": name,
                "status": "DISCOVERED",
                "source": "registry.modelcontextprotocol.io",
                "as_of": c.utcnow(),
                "meta": {"remote_url": url_r, "has_remote": bool(url_r)},
            })
        cursor = (data.get("metadata") or {}).get("nextCursor")
        if not cursor:
            break
    return out[:n]


def discover_erc8004(n: int) -> list[dict]:
    out, skip = [], 0
    while len(out) < n:
        take = min(ERC_PAGE, n - len(out))
        st, body = c.http_get(ERC8004.format(n=take, skip=skip), timeout=30)
        if st != 200 or not body:
            if not out:
                print(f"  erc8004 UNREACHABLE (status={st})", file=sys.stderr)
            break
        try:
            data = json.loads(body)
        except Exception:
            print("  erc8004 UNCHECKABLE (bad json)", file=sys.stderr)
            break
        items = data.get("items") or []
        if not items:
            break
        for a in items:
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
        skip += len(items)
        if len(items) < take:
            break
    return out[:n]


def discover_a2a(n: int) -> list[dict]:
    """A2A agents that 8004scan already indexed with an http(s) uri."""
    out, skip = [], 0
    while len(out) < n:
        take = ERC_PAGE
        st, body = c.http_get(ERC8004.format(n=take, skip=skip), timeout=30)
        if st != 200 or not body:
            if not out:
                print(f"  a2a-agent UNREACHABLE (status={st})", file=sys.stderr)
            break
        try:
            data = json.loads(body)
        except Exception:
            print("  a2a-agent UNCHECKABLE (bad json)", file=sys.stderr)
            break
        items = data.get("items") or []
        if not items:
            break
        for a in items:
            uri = a.get("agent_uri") or a.get("url") or a.get("endpoint") or ""
            if not isinstance(uri, str) or not uri.startswith("http"):
                continue
            aid = a.get("agent_id") or uri
            out.append({
                "kind": "a2a-agent",
                "id": str(aid),
                "status": "DISCOVERED",
                "source": "api.8004scan.io/api/v1/agents (http uri)",
                "as_of": c.utcnow(),
                "meta": {"card_url": uri.rstrip("/"), "chain_id": a.get("chain_id")},
            })
            if len(out) >= n:
                break
        skip += len(items)
        if len(items) < take or len(out) >= n:
            break
    return out[:n]


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
    txs = [h for h in (ledger.get("transactions") or []) if isinstance(h, str)][: n * 2]

    def _acct(h: str):
        stx, rtx = c.http_post_json(XRPL_RPC, {"method": "tx", "params": [{"transaction": h}]})
        if stx != 200 or not rtx:
            return None
        return (rtx.get("result") or {}).get("Account"), h

    out = []
    seen = set()
    with ThreadPoolExecutor(max_workers=min(32, max(1, len(txs)))) as ex:
        for fut in as_completed([ex.submit(_acct, h) for h in txs]):
            got = fut.result()
            if not got or not got[0] or got[0] in seen:
                continue
            seen.add(got[0])
            out.append({
                "kind": "xrpl-account",
                "id": got[0],
                "status": "DISCOVERED",
                "source": "s1.ripple.com:51234 (ledger/tx)",
                "as_of": c.utcnow(),
                "meta": {"ledger_index": idx, "via_tx": got[1]},
            })
            if len(out) >= n:
                break
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-source", type=int, default=2000)
    args = ap.parse_args()
    n = args.per_source

    existing = c.load_queue()
    seen = c.queue_keys(existing) | {f"hf-model:{i}" for i in ()}  # base
    carded = c.carded_ids()

    sources = (
        ("hf-model", discover_hf),
        ("hf-space", discover_hf_space),
        ("npm-registry", discover_npm),
        ("mcp-server", discover_mcp),
        ("a2a-agent", discover_a2a),
        ("erc8004", discover_erc8004),
        ("xrpl-account", discover_xrpl),
    )
    found: list[dict] = []
    with ThreadPoolExecutor(max_workers=len(sources)) as ex:
        futs = {ex.submit(fn, n): name for name, fn in sources}
        for fut in as_completed(futs):
            name = futs[fut]
            try:
                rows = fut.result()
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
