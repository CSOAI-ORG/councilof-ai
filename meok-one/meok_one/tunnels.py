"""
MEOK ONE — TUNNELS: wire all 3 tool worlds into the one safe gateway.

Nick: "MCP tunnels to all" (steps 1, 2, 3). This is the single entry point that connects:
  1. SOV3 inner tools        (live on the VM)            — auto-seeded by tool_gateway
  2. Published MEOK MCPs      (~316 PyPI packages)        — via published_bridge
  3. Session/business MCPs    (Stripe/Gmail/Vercel/...)   — registered read-or-confirm here

Everything routes through tool_gateway's 3-tier safety policy (read=auto, write=confirm,
prohibited=never). A character — even on a tiny local model — gets ONE safe surface to all
tools, and physically cannot fire a money/credential/delete tool on its own.

    open_all_tunnels()  -> connect all 3 worlds, return the unified catalog + counts
    safe_call(tool, args, confirm=None) -> the one call a character uses (read-only default)
"""

from . import tool_gateway as gw
from . import published_bridge as pub

# The session/business MCPs available in the MCP host (Stripe, Gmail, Vercel, Slack, etc.).
# These run in the HOST, not the character process — by design (keeps high-power tools out
# of the character runtime). We register representative tools so they appear in the catalog
# with the correct tier; the host proxies actual execution after human confirm.
_SESSION_MCPS = {
    "stripe": ["retrieve_balance", "list_subscriptions", "fetch_stripe_resources",   # read
               "create_payment_link", "create_invoice", "create_refund",             # write
               "cancel_subscription"],
    "gmail": ["search_threads", "list_labels", "get_thread",                          # read
              "create_draft", "label_thread"],                                        # write
    "calendar": ["list_events", "get_event", "suggest_time",                          # read
                 "create_event", "update_event", "delete_event"],                     # write
    "vercel": ["list_deployments", "get_deployment", "get_runtime_logs",              # read
               "deploy_to_vercel"],                                                   # write
    "drive": ["search_files", "read_file_content", "get_file_metadata",              # read
              "create_file", "copy_file"],                                            # write
    "slack": ["search", "list_channels", "get_thread",                                # read
              "send_message", "post_message"],                                        # write
}


def _register_session():
    n = 0
    for server, tools in _SESSION_MCPS.items():
        for t in tools:
            # endpoint marks it as host-proxied; tier left to the classifier (fail-safe)
            gw.register("session_mcp", f"{server}.{t}", endpoint="host-proxy", auth=True)
            n += 1
    return n


def open_all_tunnels() -> dict:
    """Connect all three worlds into the gateway. Returns counts + the safety breakdown."""
    sov3_n = len(gw._REGISTRY.get("sov3", {}))      # already auto-seeded on gateway import
    pub_res = pub.bridge_all()                       # tunnel 2
    sess_n = _register_session()                     # tunnel 3
    cat = gw.catalog()
    tier_totals = {"read": 0, "write": 0, "prohibited": 0}
    for world, tiers in cat.items():
        for tier, names in tiers.items():
            tier_totals[tier] += len(names)
    return {
        "worlds": {
            "sov3": {"tools": sov3_n, "status": "live" if sov3_n else "unreachable"},
            "published_mcp": {"packages": pub_res["packages"], "tools": pub_res["tools"],
                              "status": "bridged (lazy start)"},
            "session_mcp": {"tools": sess_n, "status": "registered (host-proxied)"},
        },
        "total_tools": sum(tier_totals.values()),
        "safety_tiers": tier_totals,
        "guarantee": "read=auto · write=human-confirm · prohibited=never (money/creds/"
                     "access/delete refused even on request)",
    }


def safe_call(tool: str, args: dict = None, confirm: str = None) -> dict:
    """The ONE call a character makes. Read-only by default; writes need a human confirm
    token; prohibited always refused. Thin wrapper over the gateway choke point."""
    return gw.invoke(tool, args or {}, confirm=confirm, allow=("read",))


if __name__ == "__main__":
    import json
    res = open_all_tunnels()
    print("=== MEOK TUNNELS — all 3 worlds wired into one safe gateway ===\n")
    for world, info in res["worlds"].items():
        print(f"  {world:14s} {info}")
    print(f"\n  TOTAL tools tunneled: {res['total_tools']}")
    print(f"  safety tiers: {json.dumps(res['safety_tiers'])}")
    print(f"  guarantee: {res['guarantee']}")
    print("\n=== live safety demo (real calls through the gateway) ===")
    # a READ tool actually executes on the live VM:
    r = safe_call("get_consciousness_state")
    cs = (r.get("result") or {})
    lvl = cs.get("consciousness_level") if isinstance(cs, dict) else None
    print(f"  safe_call('get_consciousness_state') -> executed={r.get('executed')} "
          f"tier={r.get('tier')} consciousness_level={lvl}")
    # a WRITE tool returns CONFIRM, does NOT execute:
    r = safe_call("create_payment_link", {"amount": 9999})
    print(f"  safe_call('create_payment_link')     -> executed={r.get('executed')} "
          f"tier={r.get('tier')} confirm_required={r.get('confirm_required')}")
    # a PROHIBITED tool is refused even though we ask:
    r = safe_call("transfer_funds", {"to": "x", "amount": 1000000}, confirm="YES")
    print(f"  safe_call('transfer_funds', confirm=YES) -> executed={r.get('executed')} "
          f"tier={r.get('tier')} (refused regardless)")
