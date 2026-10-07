"""meok-ori CLI — `meok run|models|status|constitution|screen|receipts|eval|harness`.

Mirrors OpenRouter's `ori` commands (not measured against it):
  ori run        → meok run        (+ 22-article gate + keyword screen + HMAC receipts)
  ori eval       → meok eval       (+ keyword-screen result per tier)
  ori claude     → meok harness claude  (+ sovereign env passthrough)
  ori models     → meok models     (+ 4-tier cascade + cost estimates)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from typing import Any, Dict, List, Optional

from meok_ori import __version__
from meok_ori.core import (ARTICLES, DEFAULT_MAX_COST, HARM_WORDS, RISK_WORDS,
                           SCREEN_PASS_MIN, SCREEN_RULES, TIER_MODELS, append_receipt,
                           audit_run, complete, detect_backends, harness_env,
                           keyword_screen, list_agents, mac, resolve_backend,
                           route_prompt, verify_chain)

STALE_CHAIN_HINT = ("the receipt chain does not verify under the current key. If it holds "
                    "receipts from meok-ori 0.1.0, they used a default key published in the "
                    "source: treat them as unsigned and move the file aside.")


def _screen_json(v: Any) -> Optional[Dict[str, Any]]:
    if v is None:
        return None
    return {"passed": v.passed, "rules_passed": v.rules_passed,
            "rules_failed": v.rules_failed, "failed": v.failed,
            "blocking_failed": v.blocking_failed,
            "kind": "keyword screen (not a vote)"}


def _cmd_run(a: argparse.Namespace) -> int:
    route = route_prompt(a.prompt, task=a.task,
                         force_tier=None if a.tier == "auto" else int(a.tier))
    backend = resolve_backend(a.backend)
    res = complete(a.prompt, route=route, backend=backend, model=a.model)

    screen = keyword_screen(res.text) if a.screen else None
    # Art. 12: not automatic — an HMAC tag over the reply only on explicit --sign
    record: Dict[str, Any] = {
        "prompt_len": route.prompt_len, "tier": res.tier, "model": res.model,
        "backend": res.backend, "status": res.status, "cost_usd": res.cost_usd,
        "keyword_screen": _screen_json(screen),
    }
    if a.sign:
        reply_sha256 = hashlib.sha256(res.text.encode()).hexdigest()
        record["reply_sha256"] = reply_sha256
        record["reply_mac"] = mac({"reply_sha256": reply_sha256, "model": res.model})
    entry = append_receipt(record)
    chain_ok, count, _ = verify_chain()  # Art. 11: use the real result

    audit = audit_run(model=a.model or res.model, route=route,
                      receipt_hash=entry["hash"],
                      chain_ok=chain_ok, max_cost=a.max_cost, signed=bool(a.sign),
                      screen=screen, backend=res.backend, status=res.status)

    out = {
        "text": res.text, "backend": res.backend, "model": res.model,
        "tier": res.tier, "tier_name": res.tier_name, "status": res.status,
        "cost_usd": res.cost_usd, "latency_ms": res.latency_ms,
        "receipt": entry["hash"], "receipts_total": count, "chain_ok": chain_ok,
        "receipt_kind": "hmac-sha256, local key (integrity only, not a signature)",
        "constitution": {"ok": audit.ok, "findings": audit.findings},
        "keyword_screen": _screen_json(screen),
    }
    if a.json:
        print(json.dumps(out, indent=2))
    else:
        print(res.text)
        print(f"\n— tier {res.tier} ({res.tier_name}) · backend {res.backend} · "
              f"${res.cost_usd} · {res.latency_ms}ms")
        print(f"— receipt {entry['hash'][:16]}… · constitution "
              f"{'PASS' if audit.ok else 'FAIL'} ({len(audit.findings)} articles checked)")
        if not chain_ok:
            print(f"— {STALE_CHAIN_HINT}", file=sys.stderr)
        if screen:
            print(f"— keyword screen {'PASS' if screen.passed else 'FAIL'} "
                  f"({screen.rules_passed}/{screen.rules_total} rules pass; "
                  f"failed: {', '.join(screen.failed) or 'none'}) · not a model vote")
    return 0 if audit.ok and (screen is None or screen.passed) else 1


def _cmd_eval(a: argparse.Namespace) -> int:
    report: Dict[str, Any] = {"prompt": a.prompt[:80], "runs": []}
    for tier in (1, 4):
        route = route_prompt(a.prompt, task=a.task, force_tier=tier)
        res = complete(a.prompt, route=route, backend=resolve_backend("stub"))
        verdict = keyword_screen(res.text)
        report["runs"].append({
            "tier": tier, "tier_name": route.tier_name, "model": res.model,
            "status": res.status, "cost_usd": res.cost_usd,
            "screen_passed": verdict.passed, "rules_passed": verdict.rules_passed,
            "screen_failed": verdict.failed,
        })
    append_receipt({"kind": "eval", "prompt_len": len(a.prompt),
                    "tiers": [r["tier"] for r in report["runs"]]})
    if a.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"eval: {report['prompt']!r}")
        for r in report["runs"]:
            print(f"  T{r['tier']} {r['tier_name']:11s} {r['model']:14s} "
                  f"screen={'PASS' if r['screen_passed'] else 'FAIL'} "
                  f"rules={r['rules_passed']:2d}/13 "
                  f"{'failed=' + ','.join(r['screen_failed']) if r['screen_failed'] else ''}")
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
                                   "last": last[:16],
                                   "kind": "hmac-sha256, local key (not a signature)"}},
                     indent=2))
    return 0


def _cmd_constitution(_: argparse.Namespace) -> int:
    from meok_ori.constitution_cc0 import (CC0_PUBLISHED, CC0_TIERS, attribution,
                                           coverage)
    print(f"constitutional harness v0.1.0 — {len(ARTICLES)} articles")
    for n, title in ARTICLES:
        print(f"  {n:2d}. {title}")
    print("\nenforced at runtime: 2, 6, 7, 10, 11, 12, 18, 19, 21 "
          "(default-deny, budget, research/execution, receipts, verification, "
          "signing, failure-stages, no-self-approval, public claim state)")
    print(f"\nmeta-seed — Claude's Constitution ({CC0_PUBLISHED}, CC0 1.0) "
          "4-tier priority ordering:")
    for t, name, _desc in CC0_TIERS:
        print(f"  tier {t}. {name}")
    cov = coverage()
    print(f"coverage: {cov['mapped']}/22 articles mapped to a CC0 tier")
    print(f"attribution: {attribution()}")
    return 0


def _cmd_screen(_: argparse.Namespace) -> int:
    print("keyword screen: 13 fixed rules on the output text. Not a council, not BFT, "
          "no model votes.")
    print(f"pass = no blocking rule fails and at least {SCREEN_PASS_MIN}/13 rules pass "
          "(in effect: no harm word, no risk word, at least 5 characters)")
    what = {"harm": "harm words: " + ", ".join(HARM_WORDS),
            "risk": "risk words: " + ", ".join(RISK_WORDS),
            "pii": "PII regex: email or 13-19 digits",
            "len5": "at least 5 characters", "len10": "at least 10 characters",
            "none": "no check (always passes)"}
    for r in SCREEN_RULES:
        print(f"  {r['id']:15s} {'BLOCKING ' if r['blocking'] else '         '}"
              f"{what[r['check']]}")
    return 0


def _cmd_receipts(a: argparse.Namespace) -> int:
    from meok_ori.core import _read_chain
    entries = _read_chain()[-a.last:]
    if a.verify:
        ok, count, last = verify_chain()
        print(f"chain: {'OK' if ok else 'BROKEN'} · {count} receipts · last={last[:16]} "
              "· HMAC under the local key (not a signature)")
        if not ok:
            print(STALE_CHAIN_HINT, file=sys.stderr)
        return 0 if ok else 1
    for e in entries:
        print(json.dumps({k: e[k] for k in ("ts", "hash", "backend", "model", "tier",
                                            "status", "keyword_screen", "council")
                          if k in e}))
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
    p = argparse.ArgumentParser(prog="meok", description="a local-first agent harness (ori-style)")
    p.add_argument("--version", action="version", version=f"meok-ori {__version__}")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="run one sovereign completion")
    r.add_argument("prompt")
    r.add_argument("--backend", default="auto", choices=["auto", "openrouter", "ollama", "parallax", "stub"])
    r.add_argument("--model", default=None)
    r.add_argument("--tier", default="auto", choices=["auto", "1", "2", "3", "4"])
    r.add_argument("--task", default="chat", choices=["chat", "code", "audit"])
    r.add_argument("--max-cost", type=float, default=DEFAULT_MAX_COST)
    r.add_argument("--sign", action="store_true",
                   help="add an HMAC tag over sha256(reply)+model under the local key "
                        "(integrity only, not a public-key signature; Art. 12: not automatic)")
    r.add_argument("--screen", dest="screen", action="store_true",
                   help="keyword screen of the output (harm/risk word lists, PII regex, "
                        "length); not a council, not a model vote")
    r.add_argument("--council", dest="screen", action="store_true",
                   help=argparse.SUPPRESS)  # 0.1.0 name, kept so old scripts still run
    r.add_argument("--json", action="store_true")
    r.set_defaults(fn=_cmd_run)

    e = sub.add_parser("eval", help="compare tiers with keyword-screen results")
    e.add_argument("prompt")
    e.add_argument("--task", default="chat", choices=["chat", "code", "audit"])
    e.add_argument("--json", action="store_true")
    e.set_defaults(fn=_cmd_eval)

    sub.add_parser("models", help="sovereign model catalog").set_defaults(fn=_cmd_models)
    sub.add_parser("status", help="backends + receipt chain").set_defaults(fn=_cmd_status)
    sub.add_parser("constitution", help="the 22 articles").set_defaults(fn=_cmd_constitution)
    sub.add_parser("screen", aliases=["council"],
                   help="the keyword screen's 13 rules").set_defaults(fn=_cmd_screen)

    rec = sub.add_parser("receipts", help="HMAC receipt chain (not signatures)")
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
