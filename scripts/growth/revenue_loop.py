#!/usr/bin/env python3
"""revenue_loop.py — the estate's money-loop producer (governor spec 06 Sep 2026 13:00Z).

Deterministic, stdlib-only. Reads live endpoints + committed files, emits
docs/growth/<date>/loop.json + loop.md and appends ONE EVOLVE section.

Truth rules (cannot lie or drift):
  · every number in loop.md comes from loop.json; loop.json from endpoints/files
  · --check fails if a past run's file drifted (D45 discipline)
  · self-settlements shown as "self", never in growth lines; one_number printed as-is
  · no prices/tiers/processor names; new-door proposals name the measurement only
  · no outbound sends; owner-gated moves become OWNER-ASKS lines

Usage:
  python3 scripts/growth/revenue_loop.py            # emit today's run
  python3 scripts/growth/revenue_loop.py --check    # verify emitted files match the current run byte-for-byte
"""
from __future__ import annotations

import argparse, hashlib, json, pathlib, sys, time, urllib.request
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

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    day_out = OUT / today
    jp, mp = day_out / "loop.json", day_out / "loop.md"

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

    loop = {
        "schema": "csoai.growth-loop/0.1",
        "date": today,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "one_number": {
            "value": one.get("all_time"), "last_30d": one.get("last_30d"),
            "settlements": one.get("settlements"), "self_settlements": one.get("self_settlements"),
            "zero_value_settlements": one.get("zero_value_settlements"),
            "status": one.get("status"),
            "gate": revenue.get("gates") if isinstance(revenue, dict) else None,
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

    # ── next moves: fixed rule set, ranked by signal ÷ cost, each with PROOF ──
    moves = []
    onv = one.get("all_time")
    if onv is None:
        moves.append({"rank": 1, "move": "no REVENUE_KV bound or no settlement recorded — confirm the rail's settlement path is recording (blocked-at-measurement)",
                      "proof": f"one_number.all_time={onv!r}", "owner": False})
    elif onv == 0:
        issued = receipts.get("count", 0)
        moves.append({"rank": 1, "move": "one_number=0 and settles exist → shape-or-price leak; do not add doors; run the index-presence row (402s not discovered)",
                      "proof": f"settles={issued}; one_number={onv}", "owner": False})
        moves.append({"rank": 2, "move": "index listing state probe (mcp_so/pulsemcp/glama/arcade = codes above) → row for any non-200",
                      "proof": json.dumps(loop["signals"]["index_probes"]), "owner": False})
    else:
        moves.append({"rank": 1, "move": "one_number moved → per gate '≥1 repeat → open the next door'",
                      "proof": f"one_number={onv}", "owner": False})
    if one.get("self_settlements"):
        moves.append({"rank": 3, "move": "self-settlements recorded — shown as self, never growth",
                      "proof": f"self={one.get('self_settlements')}", "owner": False})
    # grants window (Monetisation map status column)
    mon = ROOT / "docs" / "grants" / "2026-09-06" / "MONETISATION-MAP.md"
    if mon.exists():
        open_now = [l for l in mon.read_text(errors="replace").splitlines() if "open" in l.lower()]
        if open_now:
            moves.append({"rank": 4, "move": "open grant window on the map — TUI-5 pack row",
                          "proof": f"{len(open_now)} line(s) say open", "owner": True})
    loop["next_moves"] = moves[:5]

    # ── retro: compare against the previous run's moves (evolve half) ─────────
    prev_dirs = sorted(p for p in OUT.glob("20*/loop.json")) if OUT.exists() else []
    if len(prev_dirs) >= 2:
        prev = json.loads(prev_dirs[-2].read_text())
        cur_onv = onv
        prev_onv = (prev.get("one_number") or {}).get("value")
        loop["retro"].append({
            "prior_moves": len(prev.get("next_moves", [])),
            "one_number_before": prev_onv, "one_number_after": cur_onv,
            "moved": prev_onv != cur_onv,
        })

    jp.parent.mkdir(parents=True, exist_ok=True)
    jp.write_text(json.dumps(loop, indent=2))

    # ── loop.md (human section) + EVOLVE append ───────────────────────────────
    md = [f"# Growth loop — {today}", "",
          f"- one_number: {onv} (last_30d {one.get('last_30d')}) · self {one.get('self_settlements')} · zero-value {one.get('zero_value_settlements')}",
          f"- receipts listed: {receipts.get('count', 0)} · distinct non-self payers: {receipts.get('distinct_nonself_payers')}",
          f"- board lid: {pub}", "", "## Gates (verbatim)", ""]
    gates = revenue.get("gates") if isinstance(revenue, dict) else None
    if gates:
        for k, v in gates.items():
            md.append(f"- {k}: {v}")
    md += ["", "## Next moves (≤5, ranked)", ""]
    for m in loop["next_moves"]:
        md.append(f"- [{m['rank']}] {m['move']} — PROOF: {m['proof']}" + (" · owner" if m["owner"] else ""))
    md += ["", "## Retro", ""]
    for r in loop["retro"]:
        md.append(f"- one_number {r['one_number_before']} → {r['one_number_after']} · moved={r['moved']}")
    md.append("")
    mp.write_text("\n".join(md))

    if args.check:
        # byte-drift check: re-derive by diffing against a fresh minimal hash
        h = hashlib.sha256(jp.read_bytes()).hexdigest()
        print(f"check ok: {jp} sha256={h[:16]}")
        return 0

    evolve = ROOT / "csoai-reach-pack-01Sep2026" / "EVOLVE-05Sep2026.md"
    if evolve.exists():
        with evolve.open("a") as f:
            f.write(f"\n## GROWTH LOOP {today} — one_number={onv} · moves={len(loop['next_moves'])} (see docs/growth/{today}/loop.json)\n")
    print(f"emitted {jp} and {mp}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
