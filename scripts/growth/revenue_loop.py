#!/usr/bin/env python3
"""revenue_loop.py — the estate's money-loop producer (governor spec 06 Sep 2026 13:00Z).

Deterministic, stdlib-only. Reads live endpoints + committed files, emits
docs/growth/<date>/loop.json + loop.md and appends ONE EVOLVE section.

Truth rules (cannot lie or drift):
  · every number in loop.md comes from loop.json; loop.json from endpoints/files
  · --check is an offline, read-only consistency check of today's retained pair
    (not an authenticity, freshness or historical-byte-integrity assertion)
  · self-settlements shown as "self", never in growth lines; one_number printed as-is
  · no prices/tiers/processor names; new-door proposals name the measurement only
  · no outbound sends; owner-gated moves become OWNER-ASKS lines

Usage:
  python3 scripts/growth/revenue_loop.py            # emit today's run
  python3 scripts/growth/revenue_loop.py --check    # compare retained Markdown with its JSON; no fetches or writes
"""
from __future__ import annotations

import argparse, json, pathlib, sys, time, urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "growth"

def getjson(url: str, timeout: int = 20):
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-growth-loop/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())

def probe(url: str, timeout: int = 12):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-growth-loop/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0

def repeat_payer_evidence(one: dict) -> dict:
    """Read explicit repeat-wallet telemetry; never infer repeats from new wallets."""
    raw = one.get("repeat_nonself_payers")
    raw = raw if isinstance(raw, dict) else {}
    def count(field):
        value = raw.get(field)
        # bool is an int subclass; neither it nor a numeric string is a count.
        return value if one.get("status") == "MEASURED" and type(value) is int and value >= 0 else None
    all_time, last_30d = count("all_time"), count("last_30d")
    exceeds_payers = any(
        value is not None and type(one.get(field)) is int and value > one[field]
        for field, value in (("all_time", all_time), ("last_30d", last_30d))
    )
    if exceeds_payers or (all_time is not None and last_30d is not None and last_30d > all_time):
        all_time = last_30d = None
    return {
        "all_time": all_time,
        "last_30d": last_30d,
        "status": "MEASURED" if all_time is not None and last_30d is not None else "UNMEASURED",
        "source": "/api/revenue one_number.repeat_nonself_payers",
        "boundary": "Repeated wallets and transaction IDs do not prove buyer receipt, acceptance or an independent customer, and do not authorize another product.",
    }

def render_markdown(loop: dict) -> str:
    """Render only the retained record; do not fetch inputs or refresh timestamps."""
    one, funnel, signals = loop["one_number"], loop["funnel_per_door"], loop["signals"]
    repeat = one["repeat_nonself_payers"]
    md = [f"# Growth loop — {loop['date']}", "",
          f"- one_number: {one['value']} (last_30d {one.get('last_30d')}) · self {one.get('self_settlements')} · zero-value {one.get('zero_value_settlements')}",
          f"- repeat non-self wallets: {repeat['all_time']} all time; {repeat['last_30d']} in 30 days · {repeat['status']} (not buyer acceptance)",
          f"- receipts listed: {funnel['settlements_listed']} · distinct non-self payers: {funnel.get('distinct_nonself_payers')}",
          f"- board lid: {signals.get('board_lid')}", "", "## Gates (verbatim)", ""]
    gates = one.get("gate")
    if isinstance(gates, dict):
        md.extend(f"- {k}: {v}" for k, v in gates.items())
    md += ["", "## Next moves (≤5, ranked)", ""]
    for move in loop["next_moves"]:
        md.append(f"- [{move['rank']}] {move['move']} — PROOF: {move['proof']}" + (" · owner" if move["owner"] else ""))
    md += ["", "## Retro", ""]
    for retro in loop["retro"]:
        md.append(f"- one_number {retro['one_number_before']} → {retro['one_number_after']} · moved={retro['moved']}")
    return "\n".join(md + [""])


def check_retained_report(jp: pathlib.Path, mp: pathlib.Path, today: str) -> int:
    """Check this renderer's retained pair without modifying either artifact."""
    try:
        loop = json.loads(jp.read_text(encoding="utf-8"))
        if not isinstance(loop, dict) or loop.get("schema") != "csoai.growth-loop/0.1" or loop.get("date") != today:
            raise ValueError("unexpected retained schema or date")
        expected = render_markdown(loop).encode("utf-8")
        if mp.read_bytes() != expected:
            raise ValueError("retained Markdown differs from the current rendering of its JSON")
    except (OSError, UnicodeError, ValueError, KeyError, TypeError, AttributeError) as exc:
        print(f"check failed: {exc}", file=sys.stderr)
        return 1
    print(f"check ok: retained JSON/Markdown are consistent: {jp}; not freshness or authenticity verification")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    day_out = OUT / today
    jp, mp = day_out / "loop.json", day_out / "loop.md"

    if args.check:
        return check_retained_report(jp, mp, today)

    # ── inputs ────────────────────────────────────────────────────────────────
    revenue = getjson("https://councilof.ai/api/revenue")
    try:
        receipts = getjson("https://councilof.ai/api/receipts?preview=1")
    except Exception as e:
        receipts = {"err": str(e)[:80]}
    try:
        state = getjson("https://councilof.ai/api/state")
        pub = (state.get("public_count") or {}).get("value")
    except Exception:
        pub = None

    # census: latest analysis files (committed)
    census = {}
    for p in sorted(ROOT.glob("docs/product/x402-settlement-census-*-2026-09-06.summary.json")):
        try:
            census[p.name] = json.loads(p.read_text())
        except Exception:
            pass

    one = revenue.get("one_number", {}) if isinstance(revenue, dict) else {}
    one = one if isinstance(one, dict) else {}
    repeat = repeat_payer_evidence(one)

    loop = {
        "schema": "csoai.growth-loop/0.1",
        "date": today,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "one_number": {
            "value": one.get("all_time"), "last_30d": one.get("last_30d"),
            "settlements": one.get("settlements"), "self_settlements": one.get("self_settlements"),
            "zero_value_settlements": one.get("zero_value_settlements"),
            "status": one.get("status"),
            "gate": one.get("gates"),
            "repeat_nonself_payers": repeat,
        },
        "funnel_per_door": {
            "receipts_lookup_available": not receipts.get("err"),
            "distinct_nonself_payers": receipts.get("distinct_nonself_payers", "?"),
            "settlements_listed": receipts.get("count", 0),
            "note": "402s-issued counter lands with TUI-1's builder change; until then this reads settles only",
        },
        "signals": {
            "board_lid": pub,
            "census_files": {k: v.get("usdc_spent") for k, v in census.items()},
            "index_probes": {
                "mcp_so": probe("https://mcp.so/"),
                "mcpservers": probe("https://mcpservers.org/"),
                "pulsemcp": probe("https://www.pulsemcp.com/submit"),
                "glama": probe("https://glama.ai/mcp/servers/submit"),
                "arcade": probe("https://arcade.dev/"),
                "hf_dataset": probe("https://huggingface.co/api/datasets/csoai/x402-settlement-census"),
            },
            "hf_downloads": {},
            "pypi_downloads": {},
        },
        "costs": {
            "census_usdc_spent": next((v.get("usdc_spent") for v in census.values() if v.get("usdc_spent")), None),
        },
        "next_moves": [],
        "retro": [],
    }

    # HF + PyPI downloads (public APIs, 7-day deltas where available)
    try:
        hf = getjson("https://huggingface.co/api/datasets/csoai/x402-settlement-census")
        loop["signals"]["hf_downloads"] = {"x402-settlement-census": hf.get("downloads")}
    except Exception:
        pass
    for pkg in ("meok-watermark-attest-mcp", "csoai-axis-engine"):
        try:
            p = getjson(f"https://pypistats.org/api/packages/{pkg}/recent")
            loop["signals"]["pypi_downloads"][pkg] = p.get("data", {}).get("last_week")
        except Exception:
            loop["signals"]["pypi_downloads"][pkg] = None

    # Compare distinct payer counts for context and the retrospective. A new wallet
    # is not a repeat purchase and does not authorize another product.
    prior_runs = sorted(p for p in OUT.glob("20*/loop.json") if p.parent.name < today) if OUT.exists() else []
    previous_one = None
    previous = None
    if prior_runs:
        try:
            candidate = json.loads(prior_runs[-1].read_text())
            if isinstance(candidate, dict) and isinstance(candidate.get("one_number"), dict):
                previous = candidate
                previous_one = previous["one_number"].get("value")
        except Exception:
            previous_one = None

    # ── next moves: fixed rule set, ranked by signal ÷ cost, each with PROOF ──
    moves = []
    onv = one.get("all_time")
    if type(onv) is not int or onv < 0 or one.get("status") != "MEASURED":
        moves.append({"rank": 1, "move": "payer telemetry is unavailable or malformed — confirm settlement records before drawing a demand conclusion",
                      "proof": f"one_number.all_time={onv!r}", "owner": False})
    elif onv == 0:
        issued = receipts.get("count", 0)
        moves.append({"rank": 1, "move": "no qualifying non-self payer is recorded — inspect existing delivery and discovery evidence before diagnosing the cause",
                      "proof": f"settles={issued}; one_number={onv}", "owner": False})
        moves.append({"rank": 2, "move": "directory reachability probes do not establish listing — inspect an actual resource record before claiming discovery",
                      "proof": json.dumps(loop["signals"]["index_probes"]), "owner": False})
    else:
        proof = (f"distinct wallets {previous_one!r} → {onv}; "
                 f"repeat_nonself_payers.all_time={repeat['all_time']!r}; "
                 f"last_30d={repeat['last_30d']!r}; status={repeat['status']}")
        if repeat["status"] != "MEASURED":
            move = "repeat-wallet evidence is unknown — recover explicit repeat telemetry; distinct-wallet growth is not a repeat"
            owner = False
        elif repeat["last_30d"] > 0:
            move = "recent repeat-wallet evidence is recorded — review delivered bytes and buyer acceptance; this signal does not authorize another product"
            owner = True
        elif repeat["all_time"] > 0:
            move = "historical repeat-wallet evidence only — seek accepted repeat delivery in the current 30-day window"
            owner = False
        else:
            move = "no repeat-wallet evidence recorded — seek accepted repeat delivery; distinct-wallet growth is not a repeat"
            owner = False
        moves.append({"rank": 1, "move": move, "proof": proof, "owner": owner})
    if one.get("self_settlements"):
        moves.append({"rank": 3, "move": "self-settlements recorded — shown as self, never growth",
                      "proof": f"self={one.get('self_settlements')}", "owner": False})
    # Historical map wording is a research lead, not proof a grant is open today.
    mon = ROOT / "docs" / "grants" / "2026-09-06" / "MONETISATION-MAP.md"
    if mon.exists():
        open_now = [l for l in mon.read_text(errors="replace").splitlines() if "open" in l.lower()]
        if open_now:
            moves.append({"rank": 4, "move": "historical grant-map wording needs current primary-source verification before any application decision",
                          "proof": f"2026-09-06 map: {len(open_now)} line(s) contain 'open'; current status unverified", "owner": True})
    loop["next_moves"] = moves[:5]

    # ── retro: compare against the previous run's moves (evolve half) ─────────
    if previous is not None:
        prev = previous
        cur_onv = onv
        prev_onv = (prev.get("one_number") or {}).get("value")
        loop["retro"].append({
            "prior_moves": len(prev.get("next_moves", [])),
            "one_number_before": prev_onv, "one_number_after": cur_onv,
            "moved": prev_onv != cur_onv,
        })

    jp.parent.mkdir(parents=True, exist_ok=True)
    jp.write_text(json.dumps(loop, indent=2), encoding="utf-8")

    mp.write_text(render_markdown(loop), encoding="utf-8")

    evolve = ROOT / "csoai-reach-pack-01Sep2026" / "EVOLVE-05Sep2026.md"
    if evolve.exists() and f"## GROWTH LOOP {today} —" not in evolve.read_text(encoding="utf-8"):
        with evolve.open("a", encoding="utf-8") as f:
            f.write(f"\n## GROWTH LOOP {today} — one_number={onv} · moves={len(loop['next_moves'])} (see docs/growth/{today}/loop.json)\n")
    print(f"emitted {jp} and {mp}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
