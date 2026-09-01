#!/usr/bin/env python3
"""probe.py — ASI AUTO-EAT step 2 (probe). Read-only, three-state, rate-limited.

For DISCOVERED queue entries not yet probed, run the ONE controlled verifiable
read-only probe appropriate to each kind. NO tools/call, NO tasks, NO tx, no
mint, no payment. Then stage a card-v0 atom PER SOURCE (batched) for the LIVE
results only. Counts are always three-state and never invented.

Probes:
  hf-model     GET huggingface.co/api/models/{id}      200=LIVE 404=DEAD 401/403=HELD
  hf-space     GET huggingface.co/api/spaces/{id}      200=LIVE 404=DEAD 401/403=HELD
  npm-registry GET registry.npmjs.org/{name}           200=LIVE 404=DEAD
  mcp-server   GET remote url (reachability)           2xx/4xx=LIVE conn-fail=DEAD none=PLACEHOLDER
  a2a-agent    GET /.well-known/agent-card.json        200 json=LIVE 404=DEAD none=PLACEHOLDER
  erc8004      eth_call tokenURI(token_id) on chain RPC non-empty=LIVE 0x=PLACEHOLDER err=DEAD
  xrpl-account account_info                            exists=LIVE not_found=DEAD

Nothing here signs. Atoms carry sig_ed25519=null, state=queued. Signing is the
existing OIDC GHA path (see scripts/auto-eat/README.md).

Usage: python3 probe.py [--max N]   (default 40 total this pass)
"""
from __future__ import annotations

import argparse
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import common as c

CHAIN_RPC = {
    1: "https://ethereum-rpc.publicnode.com",
    10: "https://optimism-rpc.publicnode.com",
    25: "https://cronos-rpc.publicnode.com",
    56: "https://bsc-rpc.publicnode.com",
    100: "https://gnosis-rpc.publicnode.com",
    130: "https://unichain-rpc.publicnode.com",
    137: "https://polygon-bor-rpc.publicnode.com",
    169: "https://manta-pacific-rpc.publicnode.com",
    204: "https://opbnb-rpc.publicnode.com",
    250: "https://fantom-rpc.publicnode.com",
    288: "https://boba-rpc.publicnode.com",
    324: "https://zksync-era-rpc.publicnode.com",
    480: "https://worldchain-rpc.publicnode.com",
    1088: "https://metis-rpc.publicnode.com",
    1101: "https://polygon-zkevm-rpc.publicnode.com",
    1284: "https://moonbeam-rpc.publicnode.com",
    1329: "https://sei-rpc.publicnode.com",
    1868: "https://soneium-rpc.publicnode.com",
    2222: "https://kava-rpc.publicnode.com",
    5000: "https://mantle-rpc.publicnode.com",
    8217: "https://kaia-rpc.publicnode.com",
    8453: "https://base-rpc.publicnode.com",
    1135: "https://lisk-rpc.publicnode.com",
    34443: "https://mode-rpc.publicnode.com",
    42161: "https://arbitrum-one-rpc.publicnode.com",
    42220: "https://celo-rpc.publicnode.com",
    43114: "https://avalanche-c-chain-rpc.publicnode.com",
    57073: "https://ink-rpc.publicnode.com",
    59144: "https://linea-rpc.publicnode.com",
    81457: "https://blast-rpc.publicnode.com",
    167000: "https://taiko-rpc.publicnode.com",
    534352: "https://scroll-rpc.publicnode.com",
    7777777: "https://zora-rpc.publicnode.com",
    80094: "https://berachain-rpc.publicnode.com",
    11155111: "https://ethereum-sepolia-rpc.publicnode.com",
    84532: "https://base-sepolia-rpc.publicnode.com",
}
TOKENURI_SELECTOR = "0xc87b56dd"  # tokenURI(uint256)
XRPL_RPC = "https://s1.ripple.com:51234"
WORKERS = max(1, int(os.environ.get("EAT_PROBE_WORKERS", "64")))


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


def probe_hf_space(entry: dict) -> tuple[str, str]:
    sid = entry["id"]
    st, _ = c.http_get(f"https://huggingface.co/api/spaces/{sid}", timeout=12)
    if st == 200:
        return "LIVE", f"{sid} (200)"
    if st in (401, 403):
        return "HELD", f"{sid} (gated {st})"
    if st == 404:
        return "DEAD", f"{sid} (404)"
    return "UNCHECKABLE", f"{sid} (status={st})"


def probe_npm(entry: dict) -> tuple[str, str]:
    name = entry["id"]
    # scoped packages: @org/pkg → %40org%2Fpkg
    enc = name.replace("/", "%2F").replace("@", "%40")
    st, _ = c.http_get(f"https://registry.npmjs.org/{enc}", timeout=12)
    if st == 200:
        return "LIVE", f"{name} (200)"
    if st == 404:
        return "DEAD", f"{name} (404)"
    return "UNCHECKABLE", f"{name} (status={st})"


def probe_a2a(entry: dict) -> tuple[str, str]:
    meta = entry.get("meta") or {}
    base = (meta.get("card_url") or entry.get("id") or "").rstrip("/")
    name = str(entry["id"])
    if not base.startswith("http"):
        return "PLACEHOLDER", f"{name} (no agent-card URL)"
    for path in ("/.well-known/agent-card.json", "/.well-known/agent.json", "/agent-card.json"):
        st, body = c.http_get(base + path, timeout=12)
        if st == 200 and body:
            return "LIVE", f"{name} ({path} 200)"
        if st in (401, 403):
            return "HELD", f"{name} (gated {st})"
    st, _ = c.http_get(base, timeout=12)
    if st >= 0:
        return "PLACEHOLDER", f"{name} (host {st}, no agent-card)"
    return "DEAD", f"{name} (unreachable)"


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
    try:
        cid = int(chain)
    except (TypeError, ValueError):
        return "UNCHECKABLE", f"{name} (chain {chain} not resolvable / missing fields)"
    rpc = CHAIN_RPC.get(cid)
    if not rpc:
        return "UNCHECKABLE", f"{name} (chain {chain} not resolvable / missing fields)"
    if not contract or token_id is None:
        return "UNCHECKABLE", f"{name} (missing contract/token_id)"
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
    "hf-space": probe_hf_space,
    "npm-registry": probe_npm,
    "mcp-server": probe_mcp,
    "a2a-agent": probe_a2a,
    "erc8004": probe_erc8004,
    "xrpl-account": probe_xrpl,
}

SURFACE = {
    "hf-model": "autoeat.hf.newmodels",
    "hf-space": "autoeat.hf.spaces",
    "npm-registry": "autoeat.npm.registry",
    "mcp-server": "autoeat.mcp.registry",
    "a2a-agent": "autoeat.a2a.agents",
    "erc8004": "autoeat.erc8004.newagents",
    "xrpl-account": "autoeat.xrpl.accounts",
}

SOURCE_URLS = {
    "hf-model": ["https://huggingface.co/api/models"],
    "hf-space": ["https://huggingface.co/api/spaces"],
    "npm-registry": ["https://registry.npmjs.org/-/v1/search"],
    "mcp-server": ["https://registry.modelcontextprotocol.io/v0/servers"],
    "a2a-agent": ["https://api.8004scan.io/api/v1/agents"],
    "erc8004": ["https://api.8004scan.io/api/v1/agents", "https://base-rpc.publicnode.com"],
    "xrpl-account": ["https://s1.ripple.com:51234"],
}

METHOD = {
    "hf-model": "keyless HTTPS GET huggingface.co/api/models/{id}; three-state LIVE/HELD/DEAD",
    "hf-space": "keyless HTTPS GET huggingface.co/api/spaces/{id}; three-state LIVE/HELD/DEAD",
    "npm-registry": "keyless HTTPS GET registry.npmjs.org/{name}; three-state LIVE/DEAD",
    "mcp-server": "keyless HTTPS reachability of registry remote endpoint; three-state LIVE/PLACEHOLDER/DEAD",
    "a2a-agent": "keyless HTTPS GET /.well-known/agent-card.json; three-state LIVE/PLACEHOLDER/DEAD",
    "erc8004": "keyless eth_call tokenURI(uint256) per-chain publicnode RPC; three-state LIVE/PLACEHOLDER/DEAD",
    "xrpl-account": "keyless XRPL account_info (validated); three-state LIVE/DEAD",
}

UNMEASURED = {
    "hf-model": ["gspc_score", "weights_integrity", "lineage", "runtime_variant"],
    "hf-space": ["runtime_behavior", "hardware_claim", "lineage"],
    "npm-registry": ["install_integrity", "malware", "maintainer_identity"],
    "mcp-server": ["tool_behavior", "capability_claims", "auth_scope", "service_quality"],
    "a2a-agent": ["skill_execution_correctness", "auth_gated_agents", "streaming_actual"],
    "erc8004": ["reputation_validity", "validation_registry_mainnet", "service_quality"],
    "xrpl-account": ["issuer_identity", "reserve_attestation", "off_ledger_backing"],
}


def stage_live_atom(kind: str, agg: dict) -> tuple[bool, str]:
    """Stage one unsigned card-v0 for a kind that had LIVE probes.

    LIVE = reachable/resolvable only. auto_measured is always False. sig is
    always null (write_atom). This function cannot mark MEASURED.
    """
    live = agg["LIVE"]
    n = agg["n"]
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
    return c.write_atom(
        surface=SURFACE[kind],
        subject=f"auto-eat {kind}: {live} LIVE of {n} probed (read-only, ungraded)",
        source_urls=SOURCE_URLS[kind],
        payload=payload,
        unmeasured=UNMEASURED[kind],
    )


def _probe_one(r: dict) -> tuple[str, str, str]:
    kind = r.get("kind")
    prober = PROBERS.get(kind)
    if not prober:
        return str(kind), "UNCHECKABLE", f"{r.get('id')} (no prober)"
    try:
        state, note = prober(r)
    except Exception as e:
        state, note = "UNCHECKABLE", f"{r.get('id')} (exception {str(e)[:40]})"
    return kind, state, note


def run_probes(todo: list) -> dict:
    """Probe todo concurrently. Returns by_kind aggregates. Does not sign."""
    by_kind: dict[str, dict] = {}
    workers = min(WORKERS, max(1, len(todo)))
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(_probe_one, r): r for r in todo}
        for fut in as_completed(futs):
            kind, state, note = fut.result()
            agg = by_kind.setdefault(
                kind,
                {"n": 0, "LIVE": 0, "PLACEHOLDER": 0, "HELD": 0, "DEAD": 0, "UNCHECKABLE": 0, "UNREACHABLE": 0, "live_examples": []},
            )
            agg["n"] += 1
            agg[state] = agg.get(state, 0) + 1
            if state == "LIVE" and len(agg["live_examples"]) < 6:
                agg["live_examples"].append(note[:90])
    return by_kind


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max", type=int, default=5000)
    args = ap.parse_args()

    rows = c.load_queue()
    probed = c.load_probed()

    pending = [r for r in rows if r.get("status") == "DISCOVERED" and f"{r.get('kind')}:{r.get('id')}" not in probed]
    # round-robin across kinds so every source is exercised each pass (a flat
    # slice would let one prolific source starve the others).
    buckets: dict[str, list] = {}
    for r in pending:
        buckets.setdefault(r.get("kind"), []).append(r)
    todo = []
    while len(todo) < args.max and any(buckets.values()):
        for kind in list(buckets.keys()):
            if not buckets[kind]:
                continue
            todo.append(buckets[kind].pop(0))
            if len(todo) >= args.max:
                break

    by_kind = run_probes(todo)
    for r in todo:
        probed.add(f"{r.get('kind')}:{r.get('id')}")

    staged = 0
    per_kind_summary = {}
    for kind, agg in by_kind.items():
        live = agg["LIVE"]
        n = agg["n"]
        per_kind_summary[kind] = {k: agg.get(k, 0) for k in ("n", "LIVE", "PLACEHOLDER", "HELD", "DEAD", "UNCHECKABLE", "UNREACHABLE")}
        if live <= 0:
            print(f"  {kind}: probed={n} live=0 -> no card (nothing measurable this pass)")
            continue
        ok, msg = stage_live_atom(kind, agg)
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
