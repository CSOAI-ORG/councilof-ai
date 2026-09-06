#!/usr/bin/env python3
"""Diff two rounds of the x402 settlement census: what changed between one purchase and the next (W1).

A round says what 316 hosts did at one moment. Two rounds say what CHANGED, and the change is the
part nobody else can publish: the Bazaar indexes list who exists, and a listing does not move when a
host stops answering paid requests. This producer turns a pair of rounds into the artefact a reader
subscribes to.

WHAT IT COMPARES, and only this:
  transition      the outcome of the paid purchase per host, FROM -> TO (DELIVERED/REFUSED/
                  MISMATCH/NO_CHALLENGE). A host in only one round is `added` or `dropped`, never a
                  flip: a host that left the population did not change its mind, it left.
  price drift     challenge_units asked at the moment of purchase, TO minus FROM. Units of the
                  asset, never a currency figure of ours and never a tier.
  payTo           the address the challenge names. A changed payee is a fact about the door, not an
                  accusation.
  take-and-refuse a host that reported a settlement transaction in its own PAYMENT-RESPONSE and
                  refused the retried request anyway. persisted / new / cleared across the pair.
  receipts        whether the host returned a parseable settlement reference at all.

WHAT IT REFUSES TO SAY. No host is ranked, scored, recommended or accused. REFUSED is not proof of
bad faith: a host may rate-limit, require an account, or have changed its terms between the two
purchases, and from outside those are indistinguishable. A flip observed once is one flip; the word
MEASURED belongs to the OIDC signer at n>=30 paid observations per host and is never written here.
Every delta therefore carries the ladder: how many observations each side of the flip actually has.

DETERMINISM. Same rows in, same bytes out: no clock is read, no network is touched, every list is
sorted, and `--check` recomputes each committed artefact from the rows and exits 1 on any drift.
`--selftest` proves both halves of that claim, including that a single planted byte fails --check.

Layout, all derived:
  docs/product/x402-census/deltas/<from>-vs-<to>.json    the delta
  docs/product/x402-census/deltas/<from>-vs-<to>.md      the same numbers, rendered, never typed
  docs/product/x402-census/deltas/<from>-vs-<to>.jsonl   one row per host, for the HF viewer
  public/interop/x402-census/deltas/<from>-vs-<to>.json  the delta plus the URLs a stranger needs

Usage
  python3 scripts/grants/x402_census_delta.py --all              every consecutive pair on disk
  python3 scripts/grants/x402_census_delta.py --from A --to B
  python3 scripts/grants/x402_census_delta.py --check            recompute; exit 1 on drift
  python3 scripts/grants/x402_census_delta.py --selftest         determinism + planted-byte proof

stdlib only.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import tempfile
from collections import Counter, OrderedDict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
import x402_census_round as R  # noqa: E402  (round layout, PAID set, caveats, n threshold)

SCHEMA = "csoai.x402-census.delta/0.1"
SITE = R.SITE
PAID = R.PAID
N_REQUIRED = R.N_REQUIRED

WHAT_THIS_IS_NOT = [
    "Not a ranking, a recommendation or an accusation. A transition is what two purchases returned, nothing more.",
    "REFUSED is not proof of bad faith: rate limits, account requirements and changed terms all look identical from outside.",
    "A flip seen once is one flip. No host reaches a published state below "
    f"{N_REQUIRED} paid observations, and every row carries the count it actually has.",
    "Hosts that appear in only one round are added or dropped, never flipped: leaving the population is not a change of behaviour.",
    "Every unit spent is our cost. Nothing in this file is revenue and no host was contacted.",
]


# ----------------------------------------------------------------------------- helpers
def dumps(obj) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def days_between(a: str | None, b: str | None) -> float | None:
    if not (a and b):
        return None
    fmt = "%Y-%m-%dT%H:%M:%SZ"
    try:
        da = datetime.strptime(a, fmt).replace(tzinfo=timezone.utc)
        db = datetime.strptime(b, fmt).replace(tzinfo=timezone.utc)
    except ValueError:
        return None
    return round((db - da).total_seconds() / 86400.0, 2)


def paid_by_host(rows: list[dict]) -> dict[str, dict]:
    """One row per host. A host probed twice in one round is a bug in the round, not a series."""
    return {r["host"]: r for r in rows}


def load_round(rounds_dir: Path, rid: str) -> tuple[list[dict], dict]:
    rdir = rounds_dir / rid
    rows = R.read_jsonl(rdir / "settle.jsonl")
    manifest = json.loads((rdir / "round.json").read_text(encoding="utf-8"))
    return rows, manifest


def took_and_refused(row: dict) -> bool:
    return row.get("status") == "REFUSED" and R.analysis.has_settle_hash(row)


def receipt_kind(row: dict) -> str:
    return R.analysis.settle_receipt_kind(row) if row.get("status") in PAID else "not_paid"


# ----------------------------------------------------------------------------- the diff
def host_rows(a_rows: list[dict], b_rows: list[dict], obs: Counter) -> list[OrderedDict]:
    """One row per host present in either round — the HF-viewer shape and the source of every count."""
    A, B = paid_by_host(a_rows), paid_by_host(b_rows)
    out = []
    for host in sorted(set(A) | set(B)):
        a, b = A.get(host), B.get(host)
        pa = a.get("status") if a else None
        pb = b.get("status") if b else None
        if a and b:
            presence = "common"
        elif b:
            presence = "added"
        else:
            presence = "dropped"
        ua = a.get("challenge_units") if a else None
        ub = b.get("challenge_units") if b else None
        row = OrderedDict(
            host=host,
            presence=presence,
            from_status=pa,
            to_status=pb,
            transition=(f"{pa}->{pb}" if presence == "common" else presence),
            flipped=bool(presence == "common" and pa != pb),
            from_units=ua,
            to_units=ub,
            units_delta=(ub - ua) if (isinstance(ua, int) and isinstance(ub, int)) else None,
            from_pay_to=R.analysis.norm_addr(a.get("pay_to")) if a else None,
            to_pay_to=R.analysis.norm_addr(b.get("pay_to")) if b else None,
            pay_to_changed=bool(a and b and a.get("pay_to") and b.get("pay_to")
                                and R.analysis.norm_addr(a["pay_to"]) != R.analysis.norm_addr(b["pay_to"])),
            from_took_and_refused=bool(a and took_and_refused(a)),
            to_took_and_refused=bool(b and took_and_refused(b)),
            from_receipt=receipt_kind(a) if a else None,
            to_receipt=receipt_kind(b) if b else None,
            observations=obs.get(host, 0),
            observations_required=N_REQUIRED,
            state="UNMEASURED",
            state_reason=(f"{obs.get(host, 0)} paid observation(s) of {N_REQUIRED}; "
                          "one purchase per host per round, and the signer writes no higher state below the threshold"),
        )
        out.append(row)
    return out


def diff(a_rid: str, b_rid: str, a_rows: list[dict], b_rows: list[dict],
         a_man: dict, b_man: dict, obs: Counter) -> OrderedDict:
    rows = host_rows(a_rows, b_rows, obs)
    common = [r for r in rows if r["presence"] == "common"]
    flipped = [r for r in common if r["flipped"]]
    d2r = sorted(r["host"] for r in flipped if r["from_status"] == "DELIVERED" and r["to_status"] == "REFUSED")
    r2d = sorted(r["host"] for r in flipped if r["from_status"] == "REFUSED" and r["to_status"] == "DELIVERED")
    other = sorted(r["host"] for r in flipped if r["host"] not in set(d2r) | set(r2d))
    drift = [r for r in common if r["units_delta"] not in (None, 0)]
    transitions = Counter(r["transition"] for r in common)
    return OrderedDict(
        schema=SCHEMA,
        delta_id=f"{a_rid}-vs-{b_rid}",
        what_this_is=("What changed between two buyer's-eye rounds of the same population: who flipped, "
                      "what the doors asked, who was paid, and who took a settlement and refused anyway."),
        **{"from": OrderedDict(round_id=a_rid, as_of=a_man.get("as_of"), probed=a_man["population"]["probed"],
                               hosts_sha256=a_man["population"]["hosts_sha256"],
                               rows_sha256=a_man["rows"]["settle"]["sha256"])},
        to=OrderedDict(round_id=b_rid, as_of=b_man.get("as_of"), probed=b_man["population"]["probed"],
                       hosts_sha256=b_man["population"]["hosts_sha256"],
                       rows_sha256=b_man["rows"]["settle"]["sha256"]),
        days_between=days_between(a_man.get("as_of"), b_man.get("as_of")),
        population_identical=bool(a_man["population"]["hosts_sha256"] == b_man["population"]["hosts_sha256"]),
        hosts=OrderedDict(
            common=len(common),
            added=sorted(r["host"] for r in rows if r["presence"] == "added"),
            dropped=sorted(r["host"] for r in rows if r["presence"] == "dropped"),
        ),
        flipped=OrderedDict(
            count=len(flipped),
            share_of_common_pct=R.analysis.pct(len(flipped), len(common)),
            delivered_to_refused=d2r,
            refused_to_delivered=r2d,
            other=other,
            transitions=OrderedDict(sorted(transitions.items())),
        ),
        held=OrderedDict(
            delivered_both=sorted(r["host"] for r in common if r["from_status"] == r["to_status"] == "DELIVERED"),
            refused_both_count=sum(1 for r in common if r["from_status"] == r["to_status"] == "REFUSED"),
        ),
        price_drift=OrderedDict(
            hosts_changed=len(drift),
            up=sorted((r["host"] for r in drift if r["units_delta"] > 0)),
            down=sorted((r["host"] for r in drift if r["units_delta"] < 0)),
            rows=[OrderedDict(host=r["host"], from_units=r["from_units"], to_units=r["to_units"],
                              units_delta=r["units_delta"]) for r in sorted(drift, key=lambda r: r["host"])],
            unit_note="asset units as the challenge asked for them; no price of ours appears anywhere in this file",
        ),
        pay_to_changed=[OrderedDict(host=r["host"], from_pay_to=r["from_pay_to"], to_pay_to=r["to_pay_to"])
                        for r in common if r["pay_to_changed"]],
        take_and_refuse=OrderedDict(
            definition=a_man["take_and_refuse"]["definition"],
            persisted=sorted(r["host"] for r in common if r["from_took_and_refused"] and r["to_took_and_refused"]),
            new=sorted(r["host"] for r in common if not r["from_took_and_refused"] and r["to_took_and_refused"]),
            cleared=sorted(r["host"] for r in common if r["from_took_and_refused"] and not r["to_took_and_refused"]),
        ),
        receipts=OrderedDict(
            from_=OrderedDict(sorted(Counter(r["from_receipt"] for r in common if r["from_receipt"]).items())),
            to=OrderedDict(sorted(Counter(r["to_receipt"] for r in common if r["to_receipt"]).items())),
        ),
        ladder=OrderedDict(
            n_required=N_REQUIRED,
            hosts_by_observations=OrderedDict((str(k), v) for k, v in sorted(Counter(r["observations"] for r in rows).items())),
            hosts_at_or_above_n_required=sum(1 for r in rows if r["observations"] >= N_REQUIRED),
            state_of_every_host="UNMEASURED" if all(r["observations"] < N_REQUIRED for r in rows) else "mixed",
            note=("Observations are paid rows across every round on disk, not just this pair. At one round a "
                  f"week a host needs ~{N_REQUIRED} weeks to reach the threshold, and this file says so on every row "
                  "rather than letting a flip read as a verdict."),
        ),
        caveats=R.CAVEATS,
        what_this_is_not=WHAT_THIS_IS_NOT,
        rows_path=f"docs/product/x402-census/deltas/{a_rid}-vs-{b_rid}.jsonl",
        reproduce=f"python3 scripts/grants/x402_census_delta.py --from {a_rid} --to {b_rid} --check",
    )


def public_delta(d: OrderedDict) -> OrderedDict:
    out = OrderedDict(d)
    a, b = d["from"]["round_id"], d["to"]["round_id"]
    out["urls"] = OrderedDict(
        rows=f"{SITE}/interop/x402-census/deltas/{d['delta_id']}.json",
        host_rows=f"{R.HF_DATASET}/resolve/main/deltas/{d['delta_id']}.jsonl",
        from_round=f"{SITE}/interop/x402-census/rounds/{a}.json",
        to_round=f"{SITE}/interop/x402-census/rounds/{b}.json",
        index=f"{SITE}/interop/x402-census/index.json",
        feed=f"{SITE}/feeds/x402-census.xml",
        root=f"{SITE}/root.json",
        witness_pointer=f"{SITE}/interop/root-witness-pointer.json",
    )
    return out


# ----------------------------------------------------------------------------- render
def render_md(d: OrderedDict, rows: list[OrderedDict]) -> str:
    f_, t = d["from"], d["to"]
    fl, pd_, tar = d["flipped"], d["price_drift"], d["take_and_refuse"]
    L = [f"# x402 settlement census — what changed, {f_['round_id']} → {t['round_id']}", "",
         d["what_this_is"], "",
         f"Rendered from `{d['rows_path']}` by `scripts/grants/x402_census_delta.py`. Nothing here is typed; "
         f"`--check` recomputes every number below and fails on a single changed byte.", "",
         "## The pair", "",
         "| | from | to |", "|---|---|---|",
         f"| round | `{f_['round_id']}` | `{t['round_id']}` |",
         f"| as_of | {f_['as_of']} | {t['as_of']} |",
         f"| hosts probed | {f_['probed']} | {t['probed']} |",
         f"| rows sha256 | `{f_['rows_sha256'][:16]}…` | `{t['rows_sha256'][:16]}…` |",
         "",
         f"{d['days_between']} days apart. Population identical: **{'yes' if d['population_identical'] else 'no'}** "
         f"({d['hosts']['common']} hosts in both, {len(d['hosts']['added'])} added, {len(d['hosts']['dropped'])} dropped).", "",
         "## Flips", "",
         f"**{fl['count']}** of {d['hosts']['common']} common hosts returned a different outcome "
         f"({fl['share_of_common_pct']}%).", "",
         "| transition | hosts |", "|---|---|"]
    for k, v in fl["transitions"].items():
        L.append(f"| `{k}` | {v} |")
    L += ["",
          f"- DELIVERED → REFUSED ({len(fl['delivered_to_refused'])}): " +
          (", ".join(f"`{h}`" for h in fl["delivered_to_refused"]) or "none"),
          f"- REFUSED → DELIVERED ({len(fl['refused_to_delivered'])}): " +
          (", ".join(f"`{h}`" for h in fl["refused_to_delivered"]) or "none"),
          f"- other transitions ({len(fl['other'])}): " + (", ".join(f"`{h}`" for h in fl["other"]) or "none"),
          "",
          "## What the doors asked", "",
          f"**{pd_['hosts_changed']}** hosts changed the amount they asked for "
          f"({len(pd_['up'])} up, {len(pd_['down'])} down). {pd_['unit_note']}.", ""]
    if pd_["rows"]:
        L += ["| host | from units | to units | delta |", "|---|---|---|---|"]
        L += [f"| `{r['host']}` | {r['from_units']} | {r['to_units']} | {r['units_delta']:+d} |" for r in pd_["rows"][:40]]
        if len(pd_["rows"]) > 40:
            L.append(f"| … | | | {len(pd_['rows']) - 40} more in the JSON |")
        L.append("")
    L += [f"**{len(d['pay_to_changed'])}** hosts changed the address their challenge names as the payee.", "",
          "## Took a settlement and refused anyway", "",
          f"Definition: {tar['definition']}.", "",
          f"- persisted across both rounds: **{len(tar['persisted'])}**",
          f"- new this round: **{len(tar['new'])}**",
          f"- cleared: **{len(tar['cleared'])}**", "",
          "## The ladder", "",
          f"Every host on this surface is UNMEASURED. The signer writes no higher state below "
          f"**n={d['ladder']['n_required']}** paid observations, and today the maximum on disk is "
          f"{max((int(k) for k in d['ladder']['hosts_by_observations']), default=0)}. "
          f"{d['ladder']['note']}", "",
          "## What this is not", ""] + [f"- {c}" for c in d["what_this_is_not"]]
    L += ["", "## Reproduce", "", "```", d["reproduce"], "```", ""]
    return "\n".join(L)


def render_delta(root: Path, a_rid: str, b_rid: str, rounds_dir: Path, deltas_dir: Path,
                 public_dir: Path) -> dict[Path, str]:
    a_rows, a_man = load_round(rounds_dir, a_rid)
    b_rows, b_man = load_round(rounds_dir, b_rid)
    obs = R.observations(rounds_dir, R.list_rounds(rounds_dir))
    d = diff(a_rid, b_rid, a_rows, b_rows, a_man, b_man, obs)
    rows = host_rows(a_rows, b_rows, obs)
    did = d["delta_id"]
    return {
        deltas_dir / f"{did}.json": dumps(d),
        deltas_dir / f"{did}.jsonl": "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows),
        deltas_dir / f"{did}.md": render_md(d, rows) + "",
        public_dir / "deltas" / f"{did}.json": dumps(public_delta(d)),
    }


def pairs_on_disk(rounds_dir: Path) -> list[tuple[str, str]]:
    rids = R.list_rounds(rounds_dir)
    return list(zip(rids, rids[1:]))


# ----------------------------------------------------------------------------- selftest
def _write_round(rounds_dir: Path, rid: str, hosts: list[tuple[str, str, int, str | None]], root: Path,
                 deltas_dir: Path, leaves_dir: Path, public_dir: Path) -> None:
    settle, dry = R._synthetic_rows(rid, hosts)
    rdir = rounds_dir / rid
    rdir.mkdir(parents=True, exist_ok=True)
    (rdir / "settle.jsonl").write_text("".join(json.dumps(r) + "\n" for r in settle), encoding="utf-8")
    (rdir / "dry.jsonl").write_text("".join(json.dumps(r) + "\n" for r in dry), encoding="utf-8")
    R.write_all(R.render_round(root, rid, rounds_dir, deltas_dir, leaves_dir, public_dir,
                               {"per_host_units": 50000, "total_usdc": 5.5, "network": "eip155:8453"}))


def selftest() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="w1-delta-"))
    root = tmp
    rounds_dir, deltas_dir, leaves_dir, public_dir = tmp / R.ROUNDS_REL, tmp / R.DELTAS_REL, tmp / R.LEAVES_REL, tmp / R.PUBLIC_REL
    a_rid, b_rid = "2026-09-06", "2026-09-13"
    _write_round(rounds_dir, a_rid, [
        ("a.example", "DELIVERED", 1000, "0x" + "11" * 32),
        ("b.example", "REFUSED", 2000, None),
        ("c.example", "REFUSED", 3000, "0x" + "22" * 32),   # took-and-refused in round A
        ("d.example", "DELIVERED", 4000, "0x" + "33" * 32),
    ], root, deltas_dir, leaves_dir, public_dir)
    _write_round(rounds_dir, b_rid, [
        ("a.example", "REFUSED", 1000, None),               # DELIVERED -> REFUSED
        ("b.example", "DELIVERED", 2500, "0x" + "44" * 32),  # REFUSED -> DELIVERED, price up
        ("c.example", "REFUSED", 3000, "0x" + "55" * 32),   # take-and-refuse persisted
        ("e.example", "DELIVERED", 9000, "0x" + "66" * 32),  # added; d.example dropped
    ], root, deltas_dir, leaves_dir, public_dir)

    bad = 0
    files = render_delta(root, a_rid, b_rid, rounds_dir, deltas_dir, public_dir)
    R.write_all(files)
    if R.check_all(render_delta(root, a_rid, b_rid, rounds_dir, deltas_dir, public_dir), root):
        print("FAIL: second render differs from the first (non-deterministic)", file=sys.stderr); bad += 1

    d = json.loads((deltas_dir / f"{a_rid}-vs-{b_rid}.json").read_text(encoding="utf-8"))
    expect = {
        "common": 3, "added": ["e.example"], "dropped": ["d.example"],
        "flipped": 2, "d2r": ["a.example"], "r2d": ["b.example"],
        "drift": 1, "tar_persisted": ["c.example"], "population_identical": False,
    }
    got = {
        "common": d["hosts"]["common"], "added": d["hosts"]["added"], "dropped": d["hosts"]["dropped"],
        "flipped": d["flipped"]["count"], "d2r": d["flipped"]["delivered_to_refused"],
        "r2d": d["flipped"]["refused_to_delivered"], "drift": d["price_drift"]["hosts_changed"],
        "tar_persisted": d["take_and_refuse"]["persisted"], "population_identical": d["population_identical"],
    }
    if got != expect:
        print(f"FAIL: diff counts wrong\n  expected {expect}\n  got      {got}", file=sys.stderr); bad += 1
    # every host is UNMEASURED at n<30, and the ladder says so numerically
    if d["ladder"]["hosts_at_or_above_n_required"] != 0 or d["ladder"]["state_of_every_host"] != "UNMEASURED":
        print("FAIL: the ladder claimed a host above the threshold at n<30", file=sys.stderr); bad += 1
    for p in (deltas_dir / f"{a_rid}-vs-{b_rid}.json", deltas_dir / f"{a_rid}-vs-{b_rid}.md"):
        if "MEASURED" in p.read_text(encoding="utf-8").replace("UNMEASURED", ""):
            print(f"FAIL: the bare word MEASURED appeared in {p.name}", file=sys.stderr); bad += 1

    # the published schema must bind, and must be seen failing
    if R.validate_file(d, R.SCHEMA_DELTA_FILE):
        print(f"FAIL: a freshly produced delta does not validate against {R.SCHEMA_DELTA_FILE}:\n  " +
              "\n  ".join(R.validate_file(d, R.SCHEMA_DELTA_FILE)), file=sys.stderr); bad += 1
    if not R.validate_file({k: v for k, v in d.items() if k != "flipped"}, R.SCHEMA_DELTA_FILE):
        print("FAIL: schema validation passed a delta with a required field removed", file=sys.stderr); bad += 1
    # plant one byte in the round-B rows: every derived delta artefact must now fail --check
    p = rounds_dir / b_rid / "settle.jsonl"
    p.write_text(p.read_text().replace('"status": "REFUSED"', '"status": "DELIVERED"', 1), encoding="utf-8")
    if not R.check_all(render_delta(root, a_rid, b_rid, rounds_dir, deltas_dir, public_dir), root):
        print("FAIL: a planted byte change in the rows passed --check", file=sys.stderr); bad += 1

    shutil.rmtree(tmp, ignore_errors=True)
    print("selftest %s: deterministic render, transition/drift/take-and-refuse counts, "
          "ladder UNMEASURED, schema binds (and can fail), planted change fails --check" % ("FAILED" if bad else "OK"))
    return 1 if bad else 0


# ----------------------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--from", dest="a", default=None, metavar="ROUND_ID")
    ap.add_argument("--to", dest="b", default=None, metavar="ROUND_ID")
    ap.add_argument("--all", action="store_true", help="every consecutive pair of rounds on disk")
    ap.add_argument("--rounds-dir", default=str(ROOT / R.ROUNDS_REL))
    ap.add_argument("--deltas-dir", default=str(ROOT / R.DELTAS_REL))
    ap.add_argument("--public-dir", default=str(ROOT / R.PUBLIC_REL))
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()

    rounds_dir, deltas_dir, public_dir = Path(a.rounds_dir), Path(a.deltas_dir), Path(a.public_dir)
    if a.a and a.b:
        pairs = [(a.a, a.b)]
    else:
        pairs = pairs_on_disk(rounds_dir)
    if not pairs:
        rids = R.list_rounds(rounds_dir)
        # Absence is the finding, and it is stated rather than rendered as an empty table.
        msg = (f"{len(rids)} round(s) on disk ({', '.join(rids) or 'none'}): a delta needs two. "
               "Nothing written — an empty delta would read as 'nothing changed', which is a different claim.")
        print(msg)
        return 0

    files: dict[Path, str] = {}
    for x, y in pairs:
        for rid in (x, y):
            if not (rounds_dir / rid / "round.json").is_file():
                sys.exit(f"round {rid} has no round.json — run x402_census_round.py for it first")
        files.update(render_delta(ROOT, x, y, rounds_dir, deltas_dir, public_dir))

    if a.check:
        bad = R.check_all(files, ROOT)
        for x, y in pairs:
            dp = deltas_dir / f"{x}-vs-{y}.json"
            if dp.is_file():
                bad += [f"{dp.name} {e}" for e in
                        R.validate_file(json.loads(dp.read_text(encoding="utf-8")), R.SCHEMA_DELTA_FILE)]
        if bad:
            print("CHECK FAILED\n  " + "\n  ".join(bad), file=sys.stderr)
            return 1
        print(f"CHECK OK: {len(files)} delta artefacts match the committed rows and validate against "
              f"{R.SCHEMA_DELTA_FILE} ({len(pairs)} pair(s))")
        return 0
    changed = R.write_all(files)
    for p in changed:
        print(f"wrote {R.rel(p, ROOT)}")
    if not changed:
        print("nothing changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
