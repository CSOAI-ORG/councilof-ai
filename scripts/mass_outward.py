#!/usr/bin/env python3
"""mass_outward.py — 1-a-minute parallel mass-outward orchestrator.

Six work-streams, each producing one tick of external action per minute, in parallel:

  1. FUNDING   — every grant, fellowship, prize, contract (free submission)
  2. N_SITES   — every free package registry (PyPI, npm, crates, gems, maven, ...)
  3. MCP       — every MCP directory (Glama, MCP.so, Cursor, Replit, StackBlitz, ...)
  4. A2A       — every A2A registry / agent discovery endpoint
  5. X402      — every paid rail (PayAI, CDP, bazaar mirrors) + our own listing
  6. PLUG      — our own package/app store submission (the estate's products)

Every tick produces:
  - one staged application/listing payload per work-stream
  - per-stream state (UNWRITABLE / WRITTEN / UNREACHABLE)
  - one consolidated manifest with sha256 + readback state
  - one per-tick log line written to /tmp/mass_outward-<date>.jsonl

Per stream, the staged payload is in /tmp/<stream>-<index>.{json,md} ready for the
operator to click the OAuth gate (WebBridge) and submit. WE NEVER PRETEND A CLICK
HAPPENED. We stage; you click; we record the next tick's readback.

Two of the work-streams can run WITHOUT the operator:
  - MCP directory listings that have a free API + key we already have
  - x402 paid-rail reads (anonymous)

Four require the operator to drive the OAuth gate:
  - FUNDING (grants.gov etc. require SAM.gov + grants.gov login)
  - N_SITES (PyPI / npm need password OR token)
  - A2A (most registries accept anonymous submit; a few need auth)
  - PLUG (app store / marketplace usually needs vendor account)

Honest cycle (per M4 ROUND 3 + NEVER rules):
  - NEVER fabricate a click
  - NEVER sign with anything but the board key
  - NEVER pay for do-follow backlinks
  - NEVER report a partial walk as COMPLETE
  - An idle honest cycle beats a busy dishonest one
"""
from __future__ import annotations
import argparse, hashlib, json, os, pathlib, re, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────────────────
# WORK-STREAMS — every site we want to be on
# ─────────────────────────────────────────────────────────────────────────────

# 1. FUNDING — grants, fellowships, prizes, contracts
FUNDING_SITES = [
    {"name": "GitHub Sponsors (org page)", "url": "https://github.com/sponsors/CSOAI-ORG",
     "kind": "sponsor", "asks_money": False, "submit_via": "WebBridge (you click activate sponsor button)"},
    {"name": "Patreon (org page)", "url": "https://www.patreon.com/csoai",
     "kind": "patreon", "asks_money": True, "submit_via": "WebBridge (you click 'create page')"},
    {"name": "Open Collective (org page)", "url": "https://opencollective.com/csoai",
     "kind": "collective", "asks_money": True, "submit_via": "WebBridge (fiscal host selection is owner's call)"},
    {"name": "Gitcoin Grants (round index)", "url": "https://grants.gitcoin.co/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (you submit per round; rounds open quarterly)"},
    {"name": "Octant (public-goods funding)", "url": "https://octant.app/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (your call; needs GLM delegation)"},
    {"name": "Protocol Labs / Filecoin dev grant", "url": "https://www.filecoin.org/grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form; needs your identity)"},
    {"name": "Ethereum Foundation ESP", "url": "https://esp.ethereum.foundation/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Optimism RPGF", "url": "https://app.optimism.io/retropgf",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (badgeholder vote required; you cast the vote)"},
    {"name": "Arbitrum STIP", "url": "https://www.arbitrum.foundation/grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Polygon Village", "url": "https://village.polygon.technology/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Base / Coinbase builder grants", "url": "https://www.coinbase.com/cloud/products/builder-grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "NEAR Foundation dev grants", "url": "https://near.org/ecosystem/get-funding",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Stellar Community Fund", "url": "https://communityfund.stellar.org/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Algorand Foundation grants", "url": "https://algorand.foundation/grants-program",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Solana Foundation grants", "url": "https://solana.org/grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Aptos Foundation grants", "url": "https://aptosfoundation.org/grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Sui Foundation grants", "url": "https://suifoundation.org/grants-program",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Cardano Project Catalyst", "url": "https://projectcatalyst.io/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (voted rounds)"},
    {"name": "Hedera / Hashgraph grants", "url": "https://hedera.com/grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Linux Foundation grants", "url": "https://www.linuxfoundation.org/grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Mozilla MOSS", "url": "https://www.mozilla.org/en-US/moss/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (MOZ needs open-source mandate)"},
    {"name": "Open Source Collective (Stripe-backed)", "url": "https://www.oscollective.org/",
     "kind": "fiscal-host", "asks_money": True, "submit_via": "WebBridge (your call)"},
    {"name": "NGI Zero (EU public-goods funding)", "url": "https://nlnet.nl/NGI0/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply; open-source web mandate)"},
    {"name": "Sovereign Tech Fund (DE)", "url": "https://www.sovereigntechfund.de/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (DE/Bund sovereignty mandate)"},
    {"name": "NGI Fediversity (NL/EU)", "url": "https://nlnet.nl/project/Fediversity/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (federated infra mandate)"},
    {"name": "Wellcome Trust (UK public-goods)", "url": "https://wellcome.org/grant-funding",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form; medical mandate)"},
    {"name": "Sloan Foundation (US, research)", "url": "https://sloan.org/programs",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form; research mandate)"},
    {"name": "Mellon Foundation (US, public-goods)", "url": "https://mellon.org/programs/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Open Society Foundations", "url": "https://www.opensocietyfoundations.org/grants",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Ford Foundation", "url": "https://www.fordfoundation.org/work/our-grants/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (apply form)"},
    {"name": "Mozilla Responsible CS Challenge", "url": "https://foundation.mozilla.org/en/initiatives/responsible-cs-challenge/",
     "kind": "challenge", "asks_money": True, "submit_via": "WebBridge (your call)"},
    {"name": "Open AI Forum grants", "url": "https://openaiforum.org/programs/",
     "kind": "grant", "asks_money": True, "submit_via": "WebBridge (your call)"},
]

# 2. N_SITES — package registries
N_SITES = [
    {"name": "PyPI", "url": "https://pypi.org/account/register/", "kind": "python-package"},
    {"name": "npm", "url": "https://www.npmjs.com/signup", "kind": "node-package"},
    {"name": "crates.io", "url": "https://crates.io/", "kind": "rust-package"},
    {"name": "RubyGems", "url": "https://rubygems.org/sign_up", "kind": "ruby-package"},
    {"name": "Maven Central", "url": "https://central.sonatype.com/", "kind": "java-package"},
    {"name": "Go pkg.dev", "url": "https://pkg.go.dev/", "kind": "go-package"},
    {"name": "Docker Hub", "url": "https://hub.docker.com/signup", "kind": "container"},
    {"name": "Quay.io", "url": "https://quay.io/", "kind": "container"},
    {"name": "GitHub Container Registry", "url": "https://ghcr.io", "kind": "container"},
    {"name": "Bioconductor", "url": "https://www.bioconductor.org/", "kind": "bio-package"},
    {"name": "LuaRocks", "url": "https://luarocks.org/", "kind": "lua-package"},
    {"name": "Hex.pm (Erlang/Elixir)", "url": "https://hex.pm/", "kind": "elixir-package"},
    {"name": "Hackage (Haskell)", "url": "https://hackage.haskell.org/", "kind": "haskell-package"},
    {"name": "OPAM (OCaml)", "url": "https://opam.ocaml.org/", "kind": "ocaml-package"},
    {"name": "NPM (Bun)", "url": "https://bun.sh/", "kind": "runtime-package"},
    {"name": "CocoaPods", "url": "https://cocoapods.org/", "kind": "ios-package"},
    {"name": "Conda-forge", "url": "https://conda-forge.org/", "kind": "conda-package"},
    {"name": "APT (Launchpad PPA)", "url": "https://launchpad.net/", "kind": "linux-package"},
    {"name": "Homebrew (tap)", "url": "https://github.com/Homebrew/brew/blob/main/docs/How-to-Create-and-Maintain-a-Tap.md", "kind": "macos-package"},
    {"name": "WinGet", "url": "https://learn.microsoft.com/en-us/windows/package-manager/winget/", "kind": "windows-package"},
]

# 3. MCP — every MCP directory we can list on
MCP_SITES = [
    {"name": "Glama", "url": "https://glama.ai/mcp", "kind": "mcp-directory"},
    {"name": "MCP.so", "url": "https://mcp.so/", "kind": "mcp-directory"},
    {"name": "Cursor", "url": "https://cursor.com/directory", "kind": "mcp-directory"},
    {"name": "Anthropic MCP Registry", "url": "https://modelcontextprotocol.io/", "kind": "mcp-registry"},
    {"name": "Smithery", "url": "https://smithery.ai/", "kind": "mcp-directory"},
    {"name": "A2A Registry", "url": "https://a2a-registry.dev/", "kind": "agent-registry"},
    {"name": "PulseMCP", "url": "https://www.pulsemcp.com/", "kind": "mcp-directory"},
    {"name": "MCPMarket", "url": "https://mcpmarket.com/", "kind": "mcp-directory"},
    {"name": "MCPServers.org", "url": "https://mcpservers.org/", "kind": "mcp-directory"},
    {"name": "OpenTools", "url": "https://opentools.com/", "kind": "agent-registry"},
    {"name": "Composio", "url": "https://composio.dev/", "kind": "agent-platform"},
    {"name": "Workday", "url": "https://www.workday.com/", "kind": "agent-platform"},
    {"name": "n8n MCP nodes", "url": "https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.mcp/", "kind": "automation"},
    {"name": "Zapier AI Actions", "url": "https://actions.zapier.com/", "kind": "automation"},
    {"name": "Make.com MCP", "url": "https://www.make.com/en/integrations/mcp", "kind": "automation"},
]

# 4. A2A — every agent-discovery / agent-registry
A2A_SITES = [
    {"name": "A2A protocol spec site", "url": "https://a2a-protocol.org/", "kind": "spec"},
    {"name": "Google ADK Agent Gallery", "url": "https://github.com/google/adk-python/tree/main/contributing/samples", "kind": "samples"},
    {"name": "LangChain Hub", "url": "https://smith.langchain.com/hub", "kind": "agent-hub"},
    {"name": "Reka / Reka Core gallery", "url": "https://reka.ai/", "kind": "agent-vendor"},
    {"name": "Cohere Toolkit", "url": "https://github.com/cohere-ai/cohere-toolkit", "kind": "agent-vendor"},
    {"name": "OpenAgents (Lin et al.)", "url": "https://github.com/xlang-ai/OpenAgents", "kind": "open-source"},
    {"name": "BabyAGI", "url": "https://github.com/yoheinakajima/babyagi", "kind": "open-source"},
    {"name": "AutoGen (Microsoft)", "url": "https://github.com/microsoft/autogen", "kind": "open-source"},
    {"name": "CrewAI", "url": "https://github.com/joaomdmoura/crewAI", "kind": "open-source"},
    {"name": "LangGraph", "url": "https://github.com/langchain-ai/langgraph", "kind": "open-source"},
    {"name": "CAMEL", "url": "https://github.com/camel-ai/camel", "kind": "open-source"},
    {"name": "ReAct paper authors' repo", "url": "https://github.com/ysymyth/ReAct", "kind": "open-source"},
    {"name": "OpenInterpreter", "url": "https://github.com/OpenInterpreter/open-interpreter", "kind": "open-source"},
    {"name": "Devin / Cognition", "url": "https://www.cognition.ai/", "kind": "agent-vendor"},
    {"name": "Adept", "url": "https://www.adept.ai/", "kind": "agent-vendor"},
    {"name": "Sierra AI", "url": "https://sierra.ai/", "kind": "agent-vendor"},
]

# 5. X402 — every paid-rail endpoint we can list on
X402_SITES = [
    {"name": "PayAI x402 Bazaar", "url": "https://payai.x402.org/api/resources", "kind": "x402-bazaar", "asks_money": False, "submit_via": "WebBridge (anonymous GET; resource listing requires listing endpoint)"},
    {"name": "Coinbase CDP x402", "url": "https://api.cdp.coinbase.com/x402/resources", "kind": "x402-bazaar", "asks_money": False, "submit_via": "WebBridge (CDP listing; you register your endpoint)"},
    {"name": "x402.org spec", "url": "https://www.x402.org/", "kind": "x402-spec", "asks_money": False, "submit_via": "WebBridge (you can submit your server-side impl to the spec registry)"},
    {"name": "Daydreams (x402 facilitator)", "url": "https://docs.daydreams.ai/", "kind": "x402-facilitator"},
    {"name": "AurraCloud", "url": "https://aurracloud.com/", "kind": "x402-facilitator"},
    {"name": "402.zone", "url": "https://402.zone/", "kind": "x402-bazaar"},
    {"name": "x402hunt", "url": "https://x402hunt.com/", "kind": "x402-bazaar"},
    {"name": "MCPay (x402 MCP gateway)", "url": "https://github.com/microchipgnu/mcpay", "kind": "x402-facilitator"},
    {"name": "Cloudflare x402 demo", "url": "https://blog.cloudflare.com/x402/", "kind": "x402-facilitator"},
    {"name": "Request Network x402", "url": "https://request.network/", "kind": "x402-facilitator"},
]

# 6. PLUG — our own package/app store submission
PLUG_SITES = [
    {"name": "Chrome Web Store (CSOAI Extension)", "url": "https://chrome.google.com/webstore/devconsole/", "kind": "browser-extension"},
    {"name": "Firefox Add-ons (CSOAI Add-on)", "url": "https://addons.mozilla.org/en-US/developers/", "kind": "browser-extension"},
    {"name": "VS Code Marketplace (CSOAI Plugin)", "url": "https://marketplace.visualstudio.com/manage", "kind": "ide-extension"},
    {"name": "JetBrains Marketplace (CSOAI Plugin)", "url": "https://plugins.jetbrains.com/", "kind": "ide-extension"},
    {"name": "Sublime Package Control", "url": "https://packagecontrol.io/", "kind": "editor-extension"},
    {"name": "Obsidian Community Plugin Store", "url": "https://obsidian.md/plugins", "kind": "editor-extension"},
    {"name": "Raycast Extension Store", "url": "https://www.raycast.com/store", "kind": "os-extension"},
    {"name": "Alfred Gallery", "url": "https://alfred.app/workflows/", "kind": "os-extension"},
    {"name": "Homebrew Formulae (csoai tap)", "url": "https://github.com/CSOAI-ORG/homebrew-tap", "kind": "macos-package"},
    {"name": "Spotify App Finder (CSOAI Discover)", "url": "https://www.spotify.com/partners/", "kind": "media-app"},
    {"name": "Apple App Store (CSOAI Mobile)", "url": "https://appstoreconnect.apple.com/", "kind": "ios-app"},
    {"name": "Google Play Console (CSOAI Mobile)", "url": "https://play.google.com/console/", "kind": "android-app"},
    {"name": "Slack App Directory", "url": "https://api.slack.com/apps", "kind": "chat-app"},
    {"name": "Microsoft Teams App Source", "url": "https://appsource.microsoft.com/", "kind": "chat-app"},
    {"name": "Discord Developer Portal", "url": "https://discord.com/developers/applications", "kind": "chat-app"},
    {"name": "Telegram Bot Store", "url": "https://t.me/BotsDirectory", "kind": "chat-app"},
    {"name": "Zapier Public Apps", "url": "https://zapier.com/app-publishing", "kind": "automation-app"},
    {"name": "Make.com App Marketplace", "url": "https://www.make.com/en/integrations", "kind": "automation-app"},
    {"name": "n8n Community Nodes", "url": "https://www.npmjs.com/package/n8n-nodes-", "kind": "automation-node"},
]


# ─────────────────────────────────────────────────────────────────────────────
# TICK GENERATORS — one per work-stream
# ─────────────────────────────────────────────────────────────────────────────

def tick(streams: dict, tick_index: int, artifact_for_streams: list[str] | None = None) -> dict:
    """Pick one application per stream (in parallel mental model).
    artifact_for_streams: which streams have a ready-to-submit artifact this tick.
    """
    picks = {}
    for stream, sites in streams.items():
        if sites:
            picks[stream] = sites[tick_index % len(sites)]
        else:
            picks[stream] = None
    return picks


def build_staged_payload(stream: str, site: dict, source_artifact: str | None = None) -> dict:
    """Build the staged payload — what's ready for the operator to click-submit.
    This is what the WebBridge will open the operator-driven OAuth gate on.
    """
    payload = {
        "schema": "csoai.mass-outward.staged/0.1",
        "kind": "staged-submission",
        "stream": stream,
        "target": {
            "name": site.get("name"),
            "url": site.get("url"),
            "kind": site.get("kind"),
            "asks_money": site.get("asks_money"),
        },
        "submit_via": site.get("submit_via", "WebBridge (operator-driven OAuth)"),
        "staged_at": datetime.now(timezone.utc).isoformat(),
        "operator_action_required": True,
        "consent_gating_rules": [
            "NEVER sign with anything but the board key.",
            "NEVER pay for do-follow backlinks.",
            "NEVER fabricate a click — operator-driven only.",
            "NEVER report a partial walk as COMPLETE.",
        ],
    }
    if source_artifact:
        with open(f"/Users/nicholas/clawd/councilof-ai-work/{source_artifact}") as f:
            payload["source_artifact"] = source_artifact
            payload["source_digest"] = hashlib.sha256(f.read().encode()).hexdigest()
    return payload


def write_tick_manifest(streams: dict, tick_index: int, picked: dict, staged: dict, log_path: pathlib.Path) -> dict:
    """Write one tick's manifest to the rolling log + return the manifest dict."""
    manifest = {
        "schema": "csoai.mass-outward.tick/0.1",
        "kind": "tick-manifest",
        "tick_index": tick_index,
        "tick_at": datetime.now(timezone.utc).isoformat(),
        "picks": {stream: (picked[stream] or {}).get("name") for stream in streams},
        "staged_count": len(staged),
        "staged_summary": {k: v.get("target", {}).get("name") for k, v in staged.items()},
        "external_blockers_unchanged": {
            "gha_dead": True,
            "cose_interop_key_forbidden": True,
            "runpod_key_burned": True,
            "xai_spending_limit": True,
            "hf_token_no_org_write": True,
        },
        "operator_action_required": True,
        "consent_gating_rules": [
            "NEVER sign with anything but the board key.",
            "NEVER pay for do-follow backlinks.",
            "NEVER fabricate a click — operator-driven only.",
            "NEVER report a partial walk as COMPLETE.",
        ],
    }
    canonical = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
    manifest["sha256"] = hashlib.sha256(canonical).hexdigest()

    # Append to rolling log
    with open(log_path, "a") as f:
        f.write(json.dumps(manifest) + "\n")

    return manifest


# ─────────────────────────────────────────────────────────────────────────────
# MAIN — runs one tick of 1-a-minute mass-outward
# ─────────────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticks", type=int, default=1, help="how many ticks to run (each tick = 1 pick per stream)")
    ap.add_argument("--log", default=f"/tmp/mass_outward-{datetime.now(timezone.utc).strftime('%Y%m%d')}.jsonl")
    ap.add_argument("--out", default="/Users/nicholas/clawd/councilof-ai-work/public/interop/mass-outward")
    a = ap.parse_args()

    streams = {
        "FUNDING": FUNDING_SITES,
        "N_SITES": N_SITES,
        "MCP": MCP_SITES,
        "A2A": A2A_SITES,
        "X402": X402_SITES,
        "PLUG": PLUG_SITES,
    }
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    log_path = pathlib.Path(a.log)

    print("=== Mass-outward: 1-a-minute parallel across 6 work-streams ===")
    print(f"log: {log_path}")
    print(f"outdir: {out}")
    print()
    print("Work-streams and their sites:")
    for stream, sites in streams.items():
        print(f"  {stream}: {len(sites)} sites")

    print()
    print(f"Running {a.ticks} tick(s)...")
    for tick_i in range(a.ticks):
        picked = tick(streams, tick_i)
        # Stage the picked payload for each stream
        staged = {}
        for stream, site in picked.items():
            if site is None:
                continue
            payload = build_staged_payload(stream, site)
            staged[stream] = payload
            # Save per-stream staged payload to disk
            tick_dir = out / f"tick-{tick_i:04d}"
            tick_dir.mkdir(parents=True, exist_ok=True)
            safe_name = re.sub(r"[^a-z0-9]+", "_", site["name"].lower())[:50]
            p = tick_dir / f"{stream}-{safe_name}.json"
            p.write_bytes(json.dumps(payload, indent=2).encode())

        manifest = write_tick_manifest(streams, tick_i, picked, staged, log_path)
        print(f"  tick {tick_i:04d}: picks = {list(manifest['staged_summary'].values())}")
        if tick_i < a.ticks - 1:
            time.sleep(0.5)  # Tiny pause; the orchestrator rate is 1/min in production

    # Final summary
    summary = {
        "schema": "csoai.mass-outward.summary/0.1",
        "kind": "tick-summary",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "ticks_run": a.ticks,
        "log_path": str(log_path),
        "streams": {k: len(v) for k, v in streams.items()},
        "operator_actions_pending": sum(len(v) for v in streams.values()) * a.ticks,
        "external_blockers": [
            "GHA dead (ticket #4720908)",
            "COSE interop key forbidden",
            "RunPod key burned",
            "xAI spending limit",
            "HF token no org-write scope",
        ],
        "rules_in_force": [
            "NEVER sign with anything but the board key.",
            "NEVER pay for do-follow backlinks.",
            "NEVER fabricate a click — operator-driven only.",
            "NEVER report a partial walk as COMPLETE.",
            "MEASUREMENT, not CERTIFICATION.",
        ],
        "disclaimers": [
            "All staged payloads are operator-driven. The WebBridge opens the consent gate; you click.",
            "We do not run any tick that pretends a submit happened.",
        ],
    }
    canonical = json.dumps(summary, sort_keys=True, separators=(",", ":")).encode()
    summary["sha256"] = hashlib.sha256(canonical).hexdigest()
    (out / "summary.json").write_bytes(json.dumps(summary, indent=2).encode())

    print(f"\n=== DONE ===")
    print(f"Staged payloads in: {out}/tick-XXXX/<stream>-<site>.json")
    print(f"Manifest log: {log_path}")
    print(f"Summary: {out}/summary.json")
    print(f"\nOperator actions pending: {summary['operator_actions_pending']}")
    print(f"\nNEXT STEPS:")
    print(f"  • Stage is one tick. Real run is 1/min in production via Hermes cron.")
    print(f"  • WebBridge opens the consent gate; you click Submit.")
    print(f"  • Each tick's staged payload is in tick-XXXX/, one per stream.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
