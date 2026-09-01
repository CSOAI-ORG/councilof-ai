#!/usr/bin/env python3
"""probe.py — ASI AUTO-EAT step 2 (probe). Read-only, three-state, rate-limited.

For DISCOVERED queue entries not yet probed, run the ONE controlled verifiable
read-only probe appropriate to each kind. NO tools/call, NO tasks, NO tx, no
mint, no payment. Then stage a card-v0 atom PER SOURCE (batched) for the LIVE
results only. Counts are always three-state and never invented.

Probes:
  hf-model     GET huggingface.co/api/models/{id}      200=LIVE 404=DEAD 401/403=HELD
  mcp-server   GET remote url (reachability)           2xx/4xx=LIVE conn-fail=DEAD none=PLACEHOLDER
  erc8004      eth_call tokenURI(token_id) on chain RPC non-empty=LIVE 0x=PLACEHOLDER err=DEAD
  xrpl-account account_info                            exists=LIVE not_found=DEAD

Nothing here signs. Atoms carry sig_ed25519=null, state=queued. Signing is the
existing OIDC GHA path (see scripts/auto-eat/README.md).

Usage: python3 probe.py [--max N]   (default 40 total this pass)
"""
from __future__ import annotations

import argparse
import sys
import time

import common as c

CHAIN_RPC = {
    1: "https://ethereum-rpc.publicnode.com",
    10: "https://optimism-rpc.publicnode.com",
    56: "https://bsc-rpc.publicnode.com",
    137: "https://polygon-bor-rpc.publicnode.com",
    8453: "https://base-rpc.publicnode.com",
    42161: "https://arbitrum-one-rpc.publicnode.com",
}
TOKENURI_SELECTOR = "0xc87b56dd"  # tokenURI(uint256)
XRPL_RPC = "https://s1.ripple.com:51234"
RATE_SLEEP = 0.4  # seconds between network probes


def probe_hf(entry: dict) -> tuple[str, str]:
    mid = entry["id"]
    st, _ = c.http_get(f"https://huggingface.co/api/models/{mid}", timeout=12)
    if st == 200:
        return "LIVE", f"{mid} (200)"
    if st in (401, 403):
        return "HELD", f"{mid} (gated {st})"
    if st == 404:
        return "DEAD", f"{mid} (404)"
    return "UNCHECKABLE", f"{mid} (status={st})"


def probe_mcp(entry: dict) -> tuple[str, str]:
    meta = entry.get("meta") or {}
    url = meta.get("remote_url")
    name = entry["id"]
    if not url:
        return "PLACEHOLDER", f"{name} (stdio-only, no remote endpoint)"
    st, _ = c.http_get(url, timeout=12, headers={"Accept": "text/event-stream, application/json"})
    if st >= 0:  # any HTTP response = reachable endpoint (2xx/4xx/405 all count)
        return "LIVE", f"{name} ({st})"
    return "DEAD", f"{name} (unreachable)"


def probe_erc8004(entry: dict) -> tuple[str, str]:
    meta = entry.get("meta") or {}
    chain = meta.get("chain_id")
    contract = meta.get("contract_address")
    token_id = meta.get("token_id")
    name = str(entry["id"])
    rpc = CHAIN_RPC.get(chain)
    if not rpc or not contract or token_id is None:
        return "UNCHECKABLE", f"{name} (chain {chain} not resolvable / missing fields)"
    try:
        data = TOKENURI_SELECTOR + f"{int(token_id):064x}"
    except Exception:
        return "UNCHECKABLE", f"{name} (bad token_id)"
    st, res = c.http_post_json(rpc, {
        "jsonrpc": "2.0", "id": 1, "method": "eth_call",
        "params": [{"to": contract, "data": data}, "latest"],
    }, timeout=15)
    if st != 200 or not res:
        return "DEAD", f"{name} (rpc status={st})"
    if res.get("error"):
        return "PLACEHOLDER", f"{name} (revert/no tokenURI)"
    out = res.get("result") or "0x"
    if isinstance(out, str) and len(out) > 2:
        return "LIVE", f"{name} (tokenURI resolvable)"
    return "PLACEHOLDER", f"{name} (empty tokenURI)"


def probe_xrpl(entry: dict) -> tuple[str, str]:
    acct = entry["id"]
    st, res = c.http_post_json(XRPL_RPC, {
        "method": "account_info",
        "params": [{"account": acct, "ledger_index": "validated", "strict": True}],
    }, timeout=12)
    if st != 200 or not res:
        return "UNREACHABLE", f"{acct} (status={st})"
    result = res.get("result") or {}
    if result.get("account_data"):
        return "LIVE", f"{acct} (exists)"
    if result.get("error") == "actNotFound":
        return "DEAD", f"{acct} (actNotFound)"
    return "UNCHECKABLE", f"{acct} ({result.get('error')})"


PROBERS = {
    "hf-model": probe_hf,
    "mcp-server": probe_mcp,
    "erc8004": probe_erc8004,
    "xrpl-account": probe_xrpl,
}

SURFACE = {
    "hf-model": "autoeat.hf.newmodels",
    "mcp-server": "autoeat.mcp.registry",
    "erc8004": "autoeat.erc8004.newagents",
    "xrpl-account": "autoeat.xrpl.accounts",
}

SOURCE_URLS = {
    "hf-model": ["https://huggingface.co/api/models"],
    "mcp-server": ["https://registry.modelcontextprotocol.io/v0/servers"],
    "erc8004": ["https://api.8004scan.io/api/v1/agents", "https://base-rpc.publicnode.com"],
    "xrpl-account": ["https://s1.ripple.com:51234"],
}

METHOD = {
    "hf-model": "keyless HTTPS GET huggingface.co/api/models/{id}; three-state LIVE/HELD/DEAD",
    "mcp-server": "keyless HTTPS reachability of registry remote endpoint; three-state LIVE/PLACEHOLDER/DEAD",
    "erc8004": "keyless eth_call tokenURI(uint256) per-chain publicnode RPC; three-state LIVE/PLACEHOLDER/DEAD",
    "xrpl-account": "keyless XRPL account_info (validated); three-state LIVE/DEAD",
}

UNMEASURED = {
    "hf-model": ["gspc_score", "weights_integrity", "lineage", "runtime_variant"],
    "mcp-server": ["tool_behavior", "capability_claims", "auth_scope", "service_quality"],
    "erc8004": ["reputation_validity", "validation_registry_mainnet", "service_quality"],
    "xrpl-account": ["issuer_identity", "reserve_attestation", "off_ledger_backing"],
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, default=40)
    args = ap.parse_args()

    rows = c.load_queue()
    probed = c.load_probed()

    todo = [r for r in rows if r.get("status") == "DISCOVERED" and f"{r.get('kind')}:{r.get('id')}" not in probed]
    todo = todo[: args.max]

    # group results by kind
    by_kind: dict[str, dict] = {}
    for r in todo:
        kind = r.get("kind")
        prober = PROBERS.get(kind)
        if not prober:
            continue
        try:
            state, note = prober(r)
        except Exception as e:
            state, note = "UNCHECKABLE", f"{r.get('id')} (exception {str(e)[:40]})"
        agg = by_kind.setdefault(kind, {"n": 0, "LIVE": 0, "PLACEHOLDER": 0, "HELD": 0, "DEAD": 0, "UNCHECKABLE": 0, "UNREACHABLE": 0, "live_examples": []})
        agg["n"] += 1
        agg[state] = agg.get(state, 0) + 1
        if state == "LIVE" and len(agg["live_examples"]) < 6:
            agg["live_examples"].append(note[:90])
        probed.add(f"{kind}:{r.get('id')}")
        time.sleep(RATE_SLEEP)

    staged = 0
    per_kind_summary = {}
    for kind, agg in by_kind.items():
        live = agg["LIVE"]
        n = agg["n"]
        per_kind_summary[kind] = {k: agg.get(k, 0) for k in ("n", "LIVE", "PLACEHOLDER", "HELD", "DEAD", "UNCHECKABLE", "UNREACHABLE")}
        if live <= 0:
            print(f"  {kind}: probed={n} live=0 -> no card (nothing measurable this pass)")
            continue
        payload = {
            "kind": "csoai.auto-eat-probe/0.1",
            "flags": {
                "read_only": True,
                "no_tx": True,
                "nothing_minted": True,
                "no_payment_made": True,
                "auto_measured": False,
                "cited_not_endorsed": True,
            },
            "method": METHOD[kind],
            "sample": {
                "n_probed": n,
                "live": live,
                "placeholder": agg.get("PLACEHOLDER", 0),
                "held": agg.get("HELD", 0),
                "dead": agg.get("DEAD", 0),
                "uncheckable": agg.get("UNCHECKABLE", 0) + agg.get("UNREACHABLE", 0),
                "live_fraction_of_probed": round(live / n, 4) if n else 0,
                "live_examples": agg["live_examples"],
            },
            "story": "auto-eat probed newly-DISCOVERED ids read-only; LIVE = reachable/resolvable only, NOT graded",
            "verified_via": "keyless three-state probe; DISCOVERED->LIVE means reachable, never MEASURED",
            "as_of": c.utcnow(),
            "unmeasured": UNMEASURED[kind],
        }
        ok, msg = c.write_atom(
            surface=SURFACE[kind],
            subject=f"auto-eat {kind}: {live} LIVE of {n} probed (read-only, ungraded)",
            source_urls=SOURCE_URLS[kind],
            payload=payload,
            unmeasured=UNMEASURED[kind],
        )
        print(f"  {kind}: probed={n} live={live} atom={msg}")
        if ok:
            staged += 1

    c.save_probed(probed)
    print(f"PROBE probed={len(todo)} atoms_staged={staged}")
    # emit compact summary for the loop/status to read
    import json
    print("PROBE_SUMMARY " + json.dumps(per_kind_summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
