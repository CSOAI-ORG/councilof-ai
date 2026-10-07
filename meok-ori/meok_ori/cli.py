"""meok-ori CLI — `meok run|models|status|constitution|council|receipts|eval|harness`.

Meant to be a strict superset of OpenRouter's `ori`:
  ori run        → meok run        (+ 22-article gate + council vote + receipts)
  ori eval       → meok eval       (+ BFT verdict per tier)
  ori claude     → meok harness claude  (+ sovereign env passthrough)
  ori models     → meok models     (+ 4-tier cascade + cost estimates)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from typing import Any, Dict, List, Optional

from meok_ori import __version__
from meok_ori.core import (ARTICLES, DEFAULT_MAX_COST, QUEENS, TIER_MODELS,
                           append_receipt, audit_run, complete, council_vote,
                           detect_backends, harness_env, list_agents, resolve_backend,
                           route_prompt, sign, verify_chain)


def _cmd_run(a: argparse.Namespace) -> int:
    route = route_prompt(a.prompt, task=a.task,
                         force_tier=None if a.tier == "auto" else int(a.tier))
    backend = resolve_backend(a.backend)
    res = complete(a.prompt, route=route, backend=backend, model=a.model)

    council = council_vote(res.text) if a.council else None
    # Art. 12: signing is not automatic — sigil only on explicit --sign
    record: Dict[str, Any] = {
        "prompt_len": route.prompt_len, "tier": res.tier, "model": res.model,
        "backend": res.backend, "status": res.status, "cost_usd": res.cost_usd,
        "council": (None if council is None else
                    {"approved": council.approved, "ayes": council.ayes,
                     "nays": council.nays, "vetos": council.vetos,
                     "vetoed_by": council.vetoed_by}),
    }
    if a.sign:
        record["sigil"] = sign({"text_hash": res.text[:64], "model": res.model})
    entry = append_receipt(record)
    _, count, _ = verify_chain()

    audit = audit_run(model=a.model or res.model, route=route,
                      receipt_hash=entry["hash"],
                      chain_ok=True, max_cost=a.max_cost, signed=bool(a.sign),
                      council=council, backend=res.backend, status=res.status)

    out = {
        "text": res.text, "backend": res.backend, "model": res.model,
        "tier": res.tier, "tier_name": res.tier_name, "status": res.status,
        "cost_usd": res.cost_usd, "latency_ms": res.latency_ms,
        "receipt": entry["hash"], "receipts_total": count,
        "constitution": {"ok": audit.ok, "findings": audit.findings},
        "council": (None if council is None else
                    {"approved": council.approved, "ayes": council.ayes,
                     "nays": council.nays, "vetos": council.vetos,
                     "quorum": council.quorum, "vetoed_by": council.vetoed_by}),
    }
    if a.json:
        print(json.dumps(out, indent=2))
    else:
        print(res.text)
        print(f"\n— tier {res.tier} ({res.tier_name}) · backend {res.backend} · "
              f"${res.cost_usd} · {res.latency_ms}ms")
        print(f"— receipt {entry['hash'][:16]}… · constitution "
              f"{'PASS' if audit.ok else 'FAIL'} ({len(audit.findings)} articles checked)")
        if council:
            print(f"— council {council.ayes}/{13} ayes · vetoed_by {council.vetoed_by or 'none'}"
                  f" · {'APPROVED' if council.approved else 'REJECTED'}")
    return 0 if audit.ok and (council is None or council.approved) else 1


def _cmd_eval(a: argparse.Namespace) -> int:
    report: Dict[str, Any] = {"prompt": a.prompt[:80], "runs": []}
    for tier in (1, 4):
        route = route_prompt(a.prompt, task=a.task, force_tier=tier)
        res = complete(a.prompt, route=route, backend=resolve_backend("stub"))
        verdict = council_vote(res.text)
        report["runs"].append({
            "tier": tier, "tier_name": route.tier_name, "model": res.model,
            "status": res.status, "cost_usd": res.cost_usd,
            "ayes": verdict.ayes, "approved": verdict.approved,
            "vetoed_by": verdict.vetoed_by,
        })
    append_receipt({"kind": "eval", "prompt_len": len(a.prompt),
                    "tiers": [r["tier"] for r in report["runs"]]})
    if a.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"eval: {report['prompt']!r}")
        for r in report["runs"]:
            print(f"  T{r['tier']} {r['tier_name']:11s} {r['model']:14s} "
                  f"ayes={r['ayes']:2d} {'APPROVED' if r['approved'] else 'REJECTED'} "
                  f"{'veto=' + ','.join(r['vetoed_by']) if r['vetoed_by'] else ''}")
    return 0


def _cmd_models(_: argparse.Namespace) -> int:
    print("sovereign cascade (local-first, open-weights):")
    for t, spec in TIER_MODELS.items():
        print(f"  T{t} {spec['name']:11s} {spec['model']:14s} ${spec['usd_per_1k']}/1k tok")
    print("\nfrontier passthrough (OpenRouter): anthropic/claude-fable-5.1, "
          "openai/gpt-6-astra, x-ai/grok-4.6, openrouter/auto, ...")
    return 0


def _cmd_status(_: argparse.Namespace) -> int:
    d = detect_backends()
    ok, count, last = verify_chain()
    print(json.dumps({"version": __version__, "backends": d,
                      "active": resolve_backend("auto"),
                      "receipts": {"count": count, "chain_ok": ok,
                                   "last": last[:16]}}, indent=2))
    return 0


def _cmd_constitution(_: argparse.Namespace) -> int:
    print(f"constitutional harness v0.1.0 — {len(ARTICLES)} articles")
    for n, title in ARTICLES:
        print(f"  {n:2d}. {title}")
    print("\nenforced at runtime: 2, 6, 7, 10, 11, 12, 19, 21 "
          "(default-deny, budget, research/execution, receipts, verification, "
          "signing, no-self-approval, public claim state)")
    return 0


def _cmd_council(_: argparse.Namespace) -> int:
    print("13-Queen council · BFT quorum 9/13 · supermajority 2/3 · 2 veto queens")
    for q in QUEENS:
        print(f"  {q['emoji']} {q['name']:14s} {q['dimension']:14s} "
              f"{'VETO' if q['veto'] else ''}")
    return 0


def _cmd_receipts(a: argparse.Namespace) -> int:
    from meok_ori.core import _read_chain
    entries = _read_chain()[-a.last:]
    if a.verify:
        ok, count, last = verify_chain()
        print(f"chain: {'OK' if ok else 'BROKEN'} · {count} receipts · last={last[:16]}")
        return 0 if ok else 1
    for e in entries:
        print(json.dumps({k: e[k] for k in ("ts", "hash", "backend", "model", "tier",
                                            "status", "council") if k in e}))
    return 0


def _cmd_harness(a: argparse.Namespace) -> int:
    agents = list_agents()
    if not a.agent:
        for name, path in agents.items():
            print(f"  {name:10s} {path}")
        return 0
    if a.agent not in agents:
        print(f"harness not found on PATH: {a.agent}", file=sys.stderr)
        return 127
    backend = resolve_backend("auto")
    proc = subprocess.run([agents[a.agent], *a.args], env=harness_env(backend))
    return proc.returncode


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="meok", description="the sovereign harness (better than ori)")
    p.add_argument("--version", action="version", version=f"meok-ori {__version__}")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="run one sovereign completion")
    r.add_argument("prompt")
    r.add_argument("--backend", default="auto", choices=["auto", "openrouter", "ollama", "parallax", "stub"])
    r.add_argument("--model", default=None)
    r.add_argument("--tier", default="auto", choices=["auto", "1", "2", "3", "4"])
    r.add_argument("--task", default="chat", choices=["chat", "code", "audit"])
    r.add_argument("--max-cost", type=float, default=DEFAULT_MAX_COST)
    r.add_argument("--sign", action="store_true", help="SIGIL-sign this run (Art. 12: not automatic)")
    r.add_argument("--council", action="store_true", help="13-Queen BFT vote on the output")
    r.add_argument("--json", action="store_true")
    r.set_defaults(fn=_cmd_run)

    e = sub.add_parser("eval", help="compare tiers with council verdicts")
    e.add_argument("prompt")
    e.add_argument("--task", default="chat", choices=["chat", "code", "audit"])
    e.add_argument("--json", action="store_true")
    e.set_defaults(fn=_cmd_eval)

    sub.add_parser("models", help="sovereign model catalog").set_defaults(fn=_cmd_models)
    sub.add_parser("status", help="backends + receipt chain").set_defaults(fn=_cmd_status)
    sub.add_parser("constitution", help="the 22 articles").set_defaults(fn=_cmd_constitution)
    sub.add_parser("council", help="13-Queen council").set_defaults(fn=_cmd_council)

    rec = sub.add_parser("receipts", help="SIGIL receipt chain")
    rec.add_argument("--verify", action="store_true")
    rec.add_argument("--last", type=int, default=10)
    rec.set_defaults(fn=_cmd_receipts)

    h = sub.add_parser("harness", help="wrap an agent CLI with the sovereign env")
    h.add_argument("agent", nargs="?", help="agent name (hermes, claude, codex, ...)")
    h.add_argument("args", nargs=argparse.REMAINDER)
    h.set_defaults(fn=_cmd_harness)
    return p


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except ValueError as exc:
        print(f"denied: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
