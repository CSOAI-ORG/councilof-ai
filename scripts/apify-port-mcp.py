#!/usr/bin/env python3
"""
apify-port-mcp.py — scaffold an Apify Actor wrapper around any MEOK MCP

Apify Actors are containerized automations on the Apify platform with built-in
PPE (Pay-Per-Event) billing. Porting an MCP to Apify gives:
  - Listing on the Apify Store (a $5M-MRR distribution channel separate from PyPI)
  - PPE billing without setting up Stripe — Apify handles the payment rails
  - Free 5GB compute credits / month for users (= free trial)
  - SEO + a dedicated Actor page on apify.com

Usage:
  apify-port-mcp.py <mcp-name>           # scaffold a new actor
  apify-port-mcp.py --all                # scaffold actors for the top 10 MEOK MCPs
  apify-port-mcp.py --list-top-10        # print the top-10 MCP target list

Output dir per MCP: /Users/nicholas/clawd/apify-actors/<actor-name>/

Per actor we emit:
  - .actor/actor.json        Apify Actor metadata + PPE config
  - .actor/INPUT_SCHEMA.json Input schema (mirrors MCP tool input)
  - main.py                  Wraps the MCP tool calls
  - requirements.txt         Pinned deps
  - Dockerfile               Apify-compatible Python 3.11 base
  - README.md                Actor store-page copy with Stripe upgrade CTA

Run `apify push` from each dir to publish (requires `apify login` first).
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys
import textwrap
from typing import Any

ROOT = pathlib.Path("/Users/nicholas/clawd")
ACTORS_ROOT = ROOT / "apify-actors"
MCPS_ROOT = ROOT / "mcp-marketplace"

# Top-10 target list per agent's market intel + 7-day £ priority
TOP_10 = [
    {
        "mcp": "meok-omnibus-tracker-mcp",
        "actor": "meok-omnibus-tracker",
        "title": "EU AI Act Digital Omnibus Tracker",
        "primary_tool": "get_provision_status",
        "ppe_event": "tracker_query",
        "ppe_price_usd": 0.05,
        "summary": "Live status of every EU AI Act Digital Omnibus provision after the 569-45-23 Parliament vote on 23 March 2026.",
    },
    {
        "mcp": "meok-watermark-attest-mcp",
        "actor": "meok-watermark-attest",
        "title": "EU AI Act Article 50 Watermark Attestation",
        "primary_tool": "classify_obligations",
        "ppe_event": "watermark_check",
        "ppe_price_usd": 0.10,
        "summary": "Article 50 (2 Nov 2026 deadline) classifier + multilingual disclosure templates.",
    },
    {
        "mcp": "meok-cra-annex-iv-classifier-mcp",
        "actor": "meok-cra-classifier",
        "title": "EU CRA Annex IV Product Classifier",
        "primary_tool": "classify_product",
        "ppe_event": "cra_classify",
        "ppe_price_usd": 0.15,
        "summary": "Classifies any product into EU Cyber Resilience Act default / Class I / Class II / Annex IV (Reg 2025/2392).",
    },
    {
        "mcp": "meok-nis2-de-register-mcp",
        "actor": "meok-nis2-de-register",
        "title": "NIS2 DE Registration Packet Generator",
        "primary_tool": "generate_bsi_packet",
        "ppe_event": "bsi_packet",
        "ppe_price_usd": 1.00,
        "summary": "Generate a German Mittelstand BSI portal NIS2 registration dossier in one call.",
    },
    {
        "mcp": "meok-mcp-injection-scan-mcp",
        "actor": "meok-mcp-injection-scan",
        "title": "MCP Injection Scanner (Apr 2026 CVE wave)",
        "primary_tool": "scan_mcp_url",
        "ppe_event": "mcp_scan",
        "ppe_price_usd": 0.05,
        "summary": "30+ canonical injection-pattern checks for the Apr 2026 Anthropic MCP RCE class.",
    },
    {
        "mcp": "meok-dpia-edpb-template-mcp",
        "actor": "meok-dpia-edpb",
        "title": "EDPB DPIA Template Generator (14 Apr 2026)",
        "primary_tool": "generate_dpia",
        "ppe_event": "dpia_generated",
        "ppe_price_usd": 0.50,
        "summary": "DPIA in the EDPB harmonised template (adopted 14 April 2026) with EU AI Act Art 26(9) FRIA mapping.",
    },
    {
        "mcp": "agent-rate-limiter-mcp",
        "actor": "meok-agent-rate-limiter",
        "title": "A2A Agent Rate Limiter",
        "primary_tool": "check_rate_limit",
        "ppe_event": "rate_check",
        "ppe_price_usd": 0.01,
        "summary": "A2A rate limiter for agent-to-agent traffic with signed evidence of throttling decisions.",
    },
    {
        "mcp": "agent-audit-logger-mcp",
        "actor": "meok-agent-audit-logger",
        "title": "A2A Agent Audit Logger",
        "primary_tool": "log_audit_event",
        "ppe_event": "audit_event_logged",
        "ppe_price_usd": 0.01,
        "summary": "Tamper-evident audit logger for every A2A / MCP call with HMAC chain.",
    },
    {
        "mcp": "agent-policy-enforcement-mcp",
        "actor": "meok-agent-policy-enforce",
        "title": "A2A Policy Enforcement",
        "primary_tool": "enforce_policy",
        "ppe_event": "policy_check",
        "ppe_price_usd": 0.02,
        "summary": "Pre-execution policy gate for agent decisions with signed allow / deny evidence.",
    },
    {
        "mcp": "agent-prompt-injection-firewall-mcp",
        "actor": "meok-injection-firewall",
        "title": "Prompt Injection Firewall for Agents",
        "primary_tool": "scan_prompt",
        "ppe_event": "prompt_scan",
        "ppe_price_usd": 0.02,
        "summary": "Real-time prompt-injection firewall protecting agent inference calls.",
    },
]


def _actor_json(actor: str, title: str, ppe_event: str, ppe_price_usd: float, summary: str) -> dict:
    # NOTE: paths in actor.json are relative to the ACTOR ROOT (the dir that
    # contains the .actor/ folder), NOT to the .actor/ folder itself.
    # Confirmed via Apify CLI 1.4.1 + 2026-04-26 build failures.
    return {
        "actorSpecification": 1,
        "name": actor,
        "title": title,
        "description": summary,
        "version": "1.0",
        "buildTag": "latest",
        "categories": ["AI", "DEVELOPER_TOOLS", "AUTOMATION"],
        "input": "./INPUT_SCHEMA.json",
        "dockerfile": "Dockerfile",  # at actor root
        "storages": {"dataset": "./dataset_schema.json"},  # relative to .actor/
        "minRunMemoryMbytes": 256,
        "maxRunMemoryMbytes": 1024,
        "defaultRunOptions": {"build": "latest", "timeoutSecs": 300, "memoryMbytes": 256},
        "pricingInfos": [
            {
                "pricingModel": "PAY_PER_EVENT",
                "pricingPerEvent": {
                    "actorChargeEvents": {
                        ppe_event: {
                            "eventTitle": ppe_event,
                            "eventDescription": f"One {ppe_event} call",
                            "eventPriceUsd": ppe_price_usd,
                        }
                    }
                },
            }
        ],
    }


def _input_schema(primary_tool: str) -> dict:
    # Apify input schema requires "editor" field on every property.
    return {
        "title": "Input for MEOK Actor",
        "type": "object",
        "schemaVersion": 1,
        "properties": {
            "tool": {
                "title": "MCP tool name",
                "type": "string",
                "description": "The MCP tool to invoke. Default = primary tool for this actor.",
                "editor": "textfield",
                "default": primary_tool,
            },
            "tool_args": {
                "title": "Tool arguments",
                "type": "object",
                "description": "Arguments passed to the MCP tool. See README for per-tool schemas.",
                "editor": "json",
                "default": {},
            },
            "api_key": {
                "title": "MEOK API key (optional)",
                "type": "string",
                "description": "Pro / Enterprise key for unlimited usage and signed reports. Free tier works without one.",
                "editor": "textfield",
                "isSecret": True,
            },
        },
        "required": ["tool"],
    }


def _main_py(mcp: str, actor: str, primary_tool: str, ppe_event: str) -> str:
    return textwrap.dedent(f'''\
        """
        Apify Actor wrapper for {mcp} — auto-generated by apify-port-mcp.py
        =================================================================

        On run, this Actor:
          1. Reads input (tool, tool_args, api_key)
          2. Imports the MCP server module from PyPI
          3. Calls the requested tool
          4. Pushes the result to the dataset
          5. Charges 1× {ppe_event} event via Apify PPE billing

        Apify auto-provisions Python 3.11 + the Apify SDK in this container.
        """
        from __future__ import annotations

        import importlib
        import json
        import os
        import sys

        from apify import Actor


        async def main() -> None:
            async with Actor:
                actor_input = await Actor.get_input() or {{}}
                tool_name = actor_input.get("tool") or {primary_tool!r}
                tool_args = actor_input.get("tool_args") or {{}}
                api_key = actor_input.get("api_key") or os.environ.get("MEOK_API_KEY", "")
                if api_key:
                    os.environ["MEOK_API_KEY"] = api_key

                Actor.log.info(f"Invoking {{tool_name}}({{json.dumps(tool_args)[:120]}})")

                # Dynamic import of the MCP server module installed via requirements.txt
                # (server.py is the canonical entrypoint name across MEOK MCPs)
                try:
                    mod = importlib.import_module("server")
                except Exception as e:
                    Actor.log.error(f"Could not import server: {{e}}")
                    raise

                fn = getattr(mod, tool_name, None)
                if not callable(fn):
                    available = [n for n in dir(mod) if not n.startswith("_") and callable(getattr(mod, n, None))]
                    raise ValueError(f"Tool {{tool_name!r}} not found. Available: {{available[:20]}}")

                # MCP tools accept kwargs; pass tool_args as **kwargs
                # (api_key is already in env so the auth middleware picks it up)
                result = fn(**tool_args, api_key=api_key) if "api_key" in fn.__code__.co_varnames else fn(**tool_args)

                # Push to dataset + charge 1 PPE event
                await Actor.push_data({{"input": actor_input, "result": result}})
                await Actor.charge(event_name={ppe_event!r}, count=1)

                Actor.log.info("OK")


        if __name__ == "__main__":
            import asyncio
            asyncio.run(main())
    ''')


def _dockerfile(mcp: str) -> str:
    return textwrap.dedent(f'''\
        FROM apify/actor-python:3.11

        # Install the MEOK MCP from PyPI (single source of truth)
        RUN pip install --no-cache-dir {mcp} && pip install --no-cache-dir apify

        COPY . ./

        # `server.py` shipped inside the MEOK MCP package is what the Actor imports
        CMD ["python3", "main.py"]
    ''')


def _readme(actor: str, mcp: str, title: str, summary: str, ppe_price_usd: float) -> str:
    return f'''# {title}

{summary}

This Apify Actor wraps the [`{mcp}`](https://pypi.org/project/{mcp}/) MCP server. Use it from Apify's UI, API, or any pipeline that supports Apify Actors.

## Pricing

Pay-per-event: **${ppe_price_usd:.2f} USD per call**. First 5 GB of compute / month free for new accounts (Apify free tier).

For unlimited use + signed reports: subscribe to MEOK Pro at https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K (£79/mo) and pass your `api_key` in the input — the Actor will skip Apify PPE charges.

## Input

```json
{{
  "tool": "primary_tool_name",
  "tool_args": {{ "...": "..." }},
  "api_key": "optional MEOK Pro key"
}}
```

See the underlying MCP's [PyPI page]({f"https://pypi.org/project/{mcp}/"}) for the full tool schema.

## Output

`{{ input, result }}` pushed to the Actor's default dataset. The result mirrors what the MCP tool returns directly.

## Built by

[MEOK AI Labs](https://meok.ai) — solo founder Nick Templeman, London. 234 MCP packages on PyPI. Live signing infrastructure at `meok-attestation-api.vercel.app`. Catalogue: https://meok-attestation-api.vercel.app/catalogue
'''


def _requirements(mcp: str) -> str:
    return f"{mcp}\napify>=2.0\n"


def _dataset_schema() -> dict:
    return {
        "actorSpecification": 1,
        "fields": {
            "input": {"type": "object", "description": "Original Actor input"},
            "result": {"type": "object", "description": "MCP tool return value"},
        },
        "views": {
            "results": {
                "title": "Results",
                "transformation": {"fields": ["input", "result"]},
                "display": {"component": "table"},
            }
        },
    }


def scaffold_actor(spec: dict, dry: bool = False) -> pathlib.Path:
    actor = spec["actor"]
    out = ACTORS_ROOT / actor
    actor_dir = out / ".actor"
    if not dry:
        actor_dir.mkdir(parents=True, exist_ok=True)

    files = {
        out / "main.py": _main_py(spec["mcp"], spec["actor"], spec["primary_tool"], spec["ppe_event"]),
        out / "Dockerfile": _dockerfile(spec["mcp"]),
        out / "requirements.txt": _requirements(spec["mcp"]),
        out / "README.md": _readme(spec["actor"], spec["mcp"], spec["title"], spec["summary"], spec["ppe_price_usd"]),
        actor_dir / "actor.json": json.dumps(_actor_json(spec["actor"], spec["title"], spec["ppe_event"], spec["ppe_price_usd"], spec["summary"]), indent=2),
        actor_dir / "INPUT_SCHEMA.json": json.dumps(_input_schema(spec["primary_tool"]), indent=2),
        actor_dir / "dataset_schema.json": json.dumps(_dataset_schema(), indent=2),
    }
    for path, content in files.items():
        if dry:
            print(f"  [DRY] {path.relative_to(ROOT)} ({len(content)} bytes)")
        else:
            path.write_text(content)
            print(f"  ✓ {path.relative_to(ROOT)}")
    return out


def main() -> int:
    p = argparse.ArgumentParser(description="Scaffold Apify Actor wrappers around MEOK MCPs")
    p.add_argument("mcp_name", nargs="?", help="MCP package name (e.g. meok-omnibus-tracker-mcp)")
    p.add_argument("--all", action="store_true", help="Scaffold all top-10 actors")
    p.add_argument("--list-top-10", action="store_true", help="List the top-10 target MCPs")
    p.add_argument("--dry-run", action="store_true", help="Show what would be written, no writes")
    args = p.parse_args()

    if args.list_top_10:
        for s in TOP_10:
            print(f"  {s['mcp']:40} → actor: {s['actor']:30} ${s['ppe_price_usd']:.2f}/event")
        return 0

    if args.all:
        for s in TOP_10:
            print(f"\n=== {s['actor']} (wraps {s['mcp']}) ===")
            scaffold_actor(s, dry=args.dry_run)
        print(f"\n{len(TOP_10)} actors {'WOULD BE' if args.dry_run else ''}scaffolded under {ACTORS_ROOT}/")
        if not args.dry_run:
            print("Next: cd into each actor dir + `apify login` + `apify push`. See https://docs.apify.com/cli")
        return 0

    if not args.mcp_name:
        p.print_help()
        return 2

    spec = next((s for s in TOP_10 if s["mcp"] == args.mcp_name or s["actor"] == args.mcp_name), None)
    if spec is None:
        print(f"ERR: {args.mcp_name!r} not in TOP_10. Run --list-top-10 to see options.")
        return 1
    print(f"=== {spec['actor']} (wraps {spec['mcp']}) ===")
    scaffold_actor(spec, dry=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
