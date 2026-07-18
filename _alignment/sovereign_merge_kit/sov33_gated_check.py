#!/usr/bin/env python3
"""sov33_gated_check.py — the anti-relapse gate for the CHECK_EXISTING stage (stage 2).

THE ANTI-PATTERN (Nick named it): the agent gets "lazy" and marks work BLOCKED / GATED / owner-required
to offload it — when the capability is actually LIVE (keys connected, endpoint reachable, write working).
Evidence it's real: this session's sibling lane listed "grant GitHub write to CSOAI-ORG/clawd" as a
Tier-A BLOCKER while this lane had been pushing to that repo all session (token present, write working).

THE RULE (enforced here): a claim of "blocked/gated" is INVALID until PROBED LIVE. You may only report a
resource gated AFTER an actual test fails. Never from memory, never from "yesterday", never by assumption.

probe_gate(name) runs the cheapest real test for a known resource and returns:
  {'resource', 'claim', 'probed': True, 'live': bool, 'evidence': str}
If live=True, the 'gated' claim is FALSE and work must proceed. If live=False, evidence is the real error.
"""
import os, subprocess, json, urllib.request

def _probe_github_write():
    # cheapest real test: do we have a token AND can we reach the remote? (push already proven by commits)
    tok = bool(os.environ.get("GITHUB_TOKEN"))
    try:
        r = subprocess.run(["git", "ls-remote", "--heads", "origin"], capture_output=True, text=True, timeout=15,
                           cwd=os.path.expanduser("~/clawd"))
        reach = r.returncode == 0
    except Exception as e:
        reach = False
    live = tok and reach
    return live, f"token={tok}, remote_reachable={reach} (push proven by session commits)"

def _probe_compute():
    # A real self-probe: can this process reach ANY compute? Test for a local GPU (torch.cuda),
    # an MPS device, or a SOV33_COMPUTE_ENDPOINT env. This module CANNOT call the harness `list_compute`
    # tool (that lives outside the kernel) — so it probes what it CAN see and says so honestly.
    signals = []
    try:
        import torch
        if torch.cuda.is_available(): signals.append("cuda")
        if getattr(torch.backends,"mps",None) and torch.backends.mps.is_available(): signals.append("mps")
    except Exception: pass
    if os.environ.get("SOV33_COMPUTE_ENDPOINT"): signals.append("endpoint-env")
    live = bool(signals)
    if live:
        return True, f"local compute visible: {signals} (claim would be FALSE — usable)"
    return False, ("no local GPU/MPS/endpoint visible to this process; the harness `list_compute` is the "
                   "authoritative check and CANNOT be called from here — report gated ONLY after that tool "
                   "returns empty, not from this probe alone")

def _probe_endpoint(url):
    try:
        urllib.request.urlopen(url, timeout=4)
        return True, f"{url} reachable"
    except Exception as e:
        return False, f"{url}: {str(e)[:60]}"

PROBES = {
    "github_write":  _probe_github_write,
    "compute":       _probe_compute,
    "sov3_mcp":      lambda: _probe_endpoint("http://localhost:3101/health"),
}

def probe_gate(resource):
    """Verify a 'gated/blocked' claim by LIVE PROBE before it may be reported. Returns evidence."""
    fn = PROBES.get(resource)
    if not fn:
        return {"resource": resource, "probed": False,
                "note": "no probe defined — you MUST write one and test live before claiming gated"}
    live, evidence = fn()
    return {"resource": resource, "claim": "gated/blocked", "probed": True,
            "live": live, "verdict": "CLAIM FALSE — resource is LIVE, proceed" if live
                     else "confirmed gated (probe failed)", "evidence": evidence}

def check_all():
    return {r: probe_gate(r) for r in PROBES}

if __name__ == "__main__":
    out = check_all()
    print("ANTI-RELAPSE GATE — every 'blocked' claim probed live:\n")
    for r, v in out.items():
        flag = "LIVE (claim would be FALSE)" if v.get("live") else "gated (probe-confirmed)"
        print(f"  {r:14} {flag}\n     {v['evidence']}")
    json.dump(out, open("gated_check_results.json", "w"), indent=2)
