#!/usr/bin/env python3
"""Build one card-v0 per x402 settlement from the census jsonl.

WHAT A CARD HERE IS. One purchase, at one moment, from one host. It records what the door asked,
what we sent, what came back, and the settlement transaction the host reported. Nothing is graded and
nothing is ranked: a card says what happened, and the chain says whether it happened.

WHY EVERY CARD IS UNMEASURED. n=1. A single purchase cannot establish reliability, availability or
good faith — a host that refused once may deliver every other time, and a host that delivered once
may never do so again. The `unmeasured` array names precisely what one observation cannot support, so
a reader never has to infer the limit from silence. Under the 3 Sep ruling a card reaches MEASURED at
n>=30; these are at n=1 and say so.

SIZE. Cards are capped at 3 KB. A settlement card is a receipt, not an archive: the body it bought is
hashed, never embedded, so the card stays small and the artefact stays verifiable.

TWO MODES.
  legacy  --census <jsonl>            one card per row that reported a settlement transaction, flat
                                      into --out. This is what produced the 104 cards under
                                      public/interop/x402-census-cards/ and its bytes are frozen:
                                      those cards are already published and a signature over an
                                      edited body is worthless. Nothing below changes them.
  round   --round-id <YYYY-MM-DD>     W1. One card per PAID row of a census ROUND — DELIVERED,
                                      REFUSED and MISMATCH alike, because a purchase attempt that
                                      was refused is still an observation, and a series that only
                                      records successes is not a measurement. Cards land in
                                      public/interop/x402-census/leaves/<round_id>/ where the
                                      public-root writer picks them up.

THE LADDER, AND WHY IT IS IN THE CARD. Each round card carries `payload.series.observations`: how
many paid observations this host has across every round up to AND INCLUDING this one. It is never
"as of now" — a card written for round 1 must still say 1 after round 30 exists, or every earlier
signature breaks. The state is UNMEASURED until observations reaches n>=30, and the card says which
of the two numbers it is at rather than leaving a reader to infer it.

Usage:  python3 harness/x402-census/build_cards.py --census <jsonl> --out <dir>
        python3 harness/x402-census/build_cards.py --round-id 2026-09-06
        python3 harness/x402-census/build_cards.py --round-id 2026-09-06 --check
        python3 harness/x402-census/build_cards.py --selftest
"""
from __future__ import annotations
import argparse, hashlib, json, pathlib, shutil, sys, tempfile
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "grants"))

SCHEMA = "https://councilof.ai/schema/card-v0.json"
SURFACE = "x402.settlement"
MAX_BYTES = 3072

# What one purchase cannot tell you. Stated per card, never left to inference.
UNMEASURED_AT_N1 = [
    "one purchase at one moment",
    "reliability: n=1 cannot establish whether this host delivers repeatedly",
    "availability: not observed over time",
    "good_faith: a refusal may be rate-limiting, an account requirement, or changed terms — indistinguishable from outside",
    "price_stability: the amount asked was read once and may move",
]


def card_for(row: dict, census_url: str) -> dict | None:
    """A card is made for a settlement. No transaction, no card."""
    tx = row.get("settle_tx")
    if not tx:
        return None
    body_sha = row.get("body_sha256")
    payload = {
        "host": row["host"],
        "resource": row.get("url"),
        "status": row.get("status"),
        "asked_units": row.get("challenge_units"),
        "asset": "USDC",
        "network": row.get("network") or "eip155:8453",
        "pay_to": row.get("pay_to"),
        "payer": row.get("payer"),
        "settle_tx": tx if tx != "unparseable" else None,
        "settle_tx_state": "parsed" if tx != "unparseable" else "host reported a settlement but its PAYMENT-RESPONSE did not parse into a tx reference",
        "x402_version": row.get("x402_version"),
        "latency_s": {"challenge": row.get("probe_s"), "paid": row.get("paid_s")},
        "delivered_bytes": row.get("bytes"),
        "delivered_content_type": row.get("content_type"),
        "advertised_mime": row.get("mime"),
        "observed_at": row.get("observed_at"),
        "n": 1,
    }
    if body_sha:
        payload["delivered_sha256"] = body_sha
    # the sharp case, named in the card itself rather than left for a reader to compute
    if row.get("status") == "REFUSED":
        payload["note"] = ("a settlement transaction was reported and the retried request was still "
                           "refused: money moved, nothing was delivered")
    elif row.get("status") == "MISMATCH":
        payload["note"] = ("paid, answered 2xx, but the body was not the advertised type")
    canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return {
        "schema": SCHEMA,
        "surface": SURFACE,
        "subject": row["host"],
        "as_of": row.get("observed_at"),
        "source_urls": [row.get("url"), census_url],
        "payload": payload,
        "sha256": hashlib.sha256(canon.encode()).hexdigest(),
        "unmeasured": list(UNMEASURED_AT_N1),
        "tags": ["x402", "settlement", "census", "n=1"],
    }


# ============================================================================ round mode (W1)
# A round card is the leaf of a time series, not a one-off receipt. Everything below is derived
# from the committed round rows: no clock is read, no network is touched, nothing is signed here.

ROUNDS_REL = "docs/product/x402-census/rounds"
LEAVES_REL = "public/interop/x402-census/leaves"
PAID = ("DELIVERED", "REFUSED", "MISMATCH")   # a signed payment was sent; NO_CHALLENGE and DRY were not
N_REQUIRED = 30                               # 3 Sep ruling: the signer writes no higher state below this
SITE = "https://councilof.ai"
HF = "https://huggingface.co/datasets/csoai/x402-settlement-census"
GH_BLOB = "https://github.com/CSOAI-ORG/councilof-ai/blob/master"
ONE_PURCHASE = "one purchase from this host at one moment"

UNMEASURED_IN_A_ROUND = [
    ONE_PURCHASE,
    "reliability: this card is one observation and cannot establish whether the host delivers repeatedly",
    "availability: not observed between rounds",
    "good_faith: a refusal may be rate-limiting, an account requirement, or changed terms \u2014 indistinguishable from outside",
    "price_stability: the amount asked was read once, in this round",
    "delivery_quality: bytes and content-type were recorded; the artefact bought was not evaluated",
]


def read_jsonl(path: pathlib.Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def rounds_upto(rounds_dir: pathlib.Path, rid: str) -> list[str]:
    """Round ids up to and including rid. Ordering is the id, which is a UTC date."""
    if not rounds_dir.is_dir():
        return []
    return sorted(p.name for p in rounds_dir.iterdir()
                  if p.is_dir() and (p / "settle.jsonl").is_file() and p.name <= rid)


def observations_upto(rounds_dir: pathlib.Path, rid: str) -> Counter:
    """Paid observations per host through rid INCLUSIVE.

    Inclusive-and-frozen is the whole point: a card written for the first round must still read
    `observations: 1` after thirty rounds exist. Counting "every round on disk" would rewrite the
    body of every earlier card on every new round and invalidate every signature over it.
    """
    obs: Counter = Counter()
    for r in rounds_upto(rounds_dir, rid):
        for row in read_jsonl(rounds_dir / r / "settle.jsonl"):
            if row.get("status") in PAID:
                obs[row["host"]] += 1
    return obs


def evidence_urls(row: dict, rid: str) -> list[str]:
    """Where a stranger goes to check this card, in the order they would go there."""
    urls = [
        row.get("url"),                                              # the door itself
        f"{SITE}/interop/x402-census/rounds/{rid}.json",              # the round this leaf belongs to
        f"{GH_BLOB}/{ROUNDS_REL}/{rid}/settle.jsonl",                 # the row, in the repo
        f"{HF}/resolve/main/rounds/{rid}/settle.jsonl",               # the row, on the hub
    ]
    tx = row.get("settle_tx")
    if tx and tx != "unparseable":
        urls.append(f"https://basescan.org/tx/{tx}")                  # the host's own settlement claim
    urls.append(f"{SITE}/root.json")                                  # the root this leaf is listed under
    return [u for u in urls if u]


def round_card(row: dict, rid: str, observations: int) -> dict:
    """One card-v0 per PAID row. Refusals included \u2014 a series of successes only is not a series."""
    tx = row.get("settle_tx")
    payload = {
        "round_id": rid,
        "host": row["host"],
        "resource": row.get("url"),
        "status": row.get("status"),
        "asked_units": row.get("challenge_units"),
        "asset": "USDC",
        "network": "eip155:8453",
        "pay_to": row.get("pay_to"),
        "payer": row.get("payer"),
        "settle_tx": tx if tx and tx != "unparseable" else None,
        "settle_tx_state": ("parsed" if tx and tx != "unparseable"
                            else "unparseable: the host reported a settlement its PAYMENT-RESPONSE did not resolve into a tx reference"
                            if tx == "unparseable" else "none reported"),
        "x402_version": row.get("x402_version"),
        "paid_status": row.get("paid_status"),
        "latency_s": {"challenge": row.get("probe_s"), "paid": row.get("paid_s")},
        "delivered_bytes": row.get("bytes"),
        "delivered_content_type": row.get("content_type"),
        "advertised_mime": row.get("mime"),
        "observed_at": row.get("observed_at"),
        "series": {
            "observations": observations,
            "observations_required": N_REQUIRED,
            "state": "UNMEASURED",
            "rule": (f"{ONE_PURCHASE}. This host has {observations} paid observation(s) of the "
                     f"{N_REQUIRED} the signer requires before it writes any higher state; one accrues per "
                     "weekly round, so the count is the ladder and this card is one rung of it."),
        },
        "not_a_verdict": "measurement, not certification: this host was not contacted, ranked or recommended",
    }
    if row.get("status") == "REFUSED" and tx and tx != "unparseable":
        payload["note"] = ("a settlement transaction was reported and the retried request was still refused: "
                           "money moved, nothing was delivered")
    elif row.get("status") == "MISMATCH":
        payload["note"] = "paid, answered 2xx, but the body was not the advertised type"
    canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return {
        "schema": SCHEMA,
        "surface": SURFACE,
        "subject": row["host"],
        "as_of": row.get("observed_at"),
        "source_urls": evidence_urls(row, rid),
        "payload": payload,
        "sha256": hashlib.sha256(canon.encode()).hexdigest(),
        "unmeasured": list(UNMEASURED_IN_A_ROUND),
        "tags": ["x402", "settlement", "census", f"round={rid}", f"n={observations}"],
    }


def render_round_leaves(rounds_dir: pathlib.Path, leaves_dir: pathlib.Path, rid: str) -> dict[pathlib.Path, str]:
    """{path: text} for every PAID row of a round. Pure; writes nothing."""
    rows = read_jsonl(rounds_dir / rid / "settle.jsonl")
    obs = observations_upto(rounds_dir, rid)
    out: dict[pathlib.Path, str] = {}
    oversize: list[str] = []
    for r in rows:
        if r.get("status") not in PAID:
            continue
        c = round_card(r, rid, obs.get(r["host"], 0))
        text = json.dumps(c, indent=1, ensure_ascii=True) + "\n"
        if len(text.encode()) > MAX_BYTES:
            oversize.append(f"{r['host']}: {len(text.encode())} B > {MAX_BYTES}")
            continue
        out[leaves_dir / rid / f"card-{c['sha256']}-unsigned.json"] = text
    if oversize:
        # Never silently truncate a receipt: name the row and let the caller decide.
        raise SystemExit("OVERSIZE leaves (would exceed the 3 KB card cap):\n  " + "\n  ".join(oversize))
    return out


def write_all(files: dict[pathlib.Path, str]) -> list[pathlib.Path]:
    changed = []
    for p, text in files.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        if not p.exists() or p.read_text(encoding="utf-8") != text:
            p.write_text(text, encoding="utf-8")
            changed.append(p)
    return changed


def check_all(files: dict[pathlib.Path, str], leaves_dir: pathlib.Path, rid: str) -> list[str]:
    bad = [f"{p.name}: missing" if not p.exists() else f"{p.name}: differs from recomputation"
           for p, t in files.items() if not p.exists() or p.read_text(encoding="utf-8") != t]
    on_disk = set((leaves_dir / rid).glob("card-*-unsigned.json")) if (leaves_dir / rid).is_dir() else set()
    # A leaf nobody can recompute is worse than a missing one: it is a claim with no producer.
    bad += [f"{p.name}: on disk but not produced by these rows" for p in sorted(on_disk - set(files))]
    return bad


def round_mode(a: argparse.Namespace) -> int:
    rounds_dir = pathlib.Path(a.rounds_dir)
    leaves_dir = pathlib.Path(a.leaves_dir)
    rids = [a.round_id] if a.round_id else rounds_upto(rounds_dir, "9999")
    if not rids:
        print("no rounds on disk", file=sys.stderr)
        return 1
    files: dict[pathlib.Path, str] = {}
    for rid in rids:
        if not (rounds_dir / rid / "settle.jsonl").is_file():
            print(f"round {rid}: no settle.jsonl", file=sys.stderr)
            return 1
        files.update(render_round_leaves(rounds_dir, leaves_dir, rid))
    if a.check:
        bad: list[str] = []
        for rid in rids:
            bad += check_all({p: t for p, t in files.items() if f"/{rid}/" in str(p)}, leaves_dir, rid)
        if bad:
            print("CHECK FAILED\n  " + "\n  ".join(bad), file=sys.stderr)
            return 1
        print(f"CHECK OK: {len(files)} unsigned leaves match the committed rows ({len(rids)} round(s))")
        return 0
    changed = write_all(files)
    print(f"  {len(files)} leaves for {len(rids)} round(s); {len(changed)} written")
    print(f"  every leaf is UNMEASURED and carries its own observation count against n>={N_REQUIRED}")
    return 0


def selftest() -> int:
    """Determinism, the frozen ladder, PAID-only, and that one planted byte fails --check."""
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="w1-cards-"))
    rounds_dir, leaves_dir = tmp / ROUNDS_REL, tmp / LEAVES_REL
    bad = 0

    def put(rid: str, rows: list[dict]) -> None:
        (rounds_dir / rid).mkdir(parents=True, exist_ok=True)
        (rounds_dir / rid / "settle.jsonl").write_text(
            "".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")

    def row(host: str, status: str, units: int, tx: str | None, at: str) -> dict:
        r = {"host": host, "url": f"https://{host}/api/x", "challenge_units": units, "x402_version": 2,
             "pay_to": "0x" + "ab" * 20, "payer": "0x" + "cd" * 20, "mime": "application/json",
             "probe_s": 0.2, "observed_at": at, "mode": "SETTLE", "status": status}
        if status != "NO_CHALLENGE":
            r.update(paid_status=200 if status == "DELIVERED" else 402, paid_s=1.0, bytes=100,
                     content_type="application/json", body_json=True, settle_tx=tx)
        return r

    put("2026-09-06", [row("a.example", "DELIVERED", 1000, "0x" + "11" * 32, "2026-09-06T06:00:00Z"),
                       row("b.example", "REFUSED", 2000, None, "2026-09-06T06:00:01Z"),
                       row("z.example", "NO_CHALLENGE", 0, None, "2026-09-06T06:00:02Z")])
    put("2026-09-13", [row("a.example", "REFUSED", 1000, None, "2026-09-13T06:00:00Z"),
                       row("b.example", "DELIVERED", 2000, "0x" + "22" * 32, "2026-09-13T06:00:01Z")])

    f1 = render_round_leaves(rounds_dir, leaves_dir, "2026-09-06")
    write_all(f1)
    write_all(render_round_leaves(rounds_dir, leaves_dir, "2026-09-13"))

    # PAID only: NO_CHALLENGE never becomes a leaf, so round 1 has exactly 2.
    if len(f1) != 2:
        print(f"FAIL: round 1 produced {len(f1)} leaves, expected 2 (NO_CHALLENGE must not become one)", file=sys.stderr); bad += 1
    # Determinism: re-rendering round 1 after round 2 exists must not move a byte.
    if check_all(render_round_leaves(rounds_dir, leaves_dir, "2026-09-06"), leaves_dir, "2026-09-06"):
        print("FAIL: round 1 leaves changed once round 2 existed \u2014 every earlier signature would break", file=sys.stderr); bad += 1
    r1 = [json.loads(p.read_text()) for p in sorted((leaves_dir / "2026-09-06").glob("*.json"))]
    r2 = [json.loads(p.read_text()) for p in sorted((leaves_dir / "2026-09-13").glob("*.json"))]
    if sorted(c["payload"]["series"]["observations"] for c in r1) != [1, 1]:
        print("FAIL: round 1 observations are not all 1", file=sys.stderr); bad += 1
    if sorted(c["payload"]["series"]["observations"] for c in r2) != [2, 2]:
        print("FAIL: round 2 observations did not accrue to 2", file=sys.stderr); bad += 1
    for c in r1 + r2:
        if c["payload"]["series"]["state"] != "UNMEASURED" or ONE_PURCHASE not in c["unmeasured"][0]:
            print("FAIL: a leaf is not UNMEASURED or lost the one-purchase sentence", file=sys.stderr); bad += 1
        if len((json.dumps(c, indent=1, ensure_ascii=True) + "\n").encode()) > MAX_BYTES:
            print("FAIL: a leaf exceeds the 3 KB cap", file=sys.stderr); bad += 1
        if "MEASURED" in json.dumps(c).replace("UNMEASURED", ""):
            print("FAIL: the bare word MEASURED appeared in a leaf", file=sys.stderr); bad += 1

    # plant one byte in round 1's rows: its leaves must stop recomputing
    p = rounds_dir / "2026-09-06" / "settle.jsonl"
    p.write_text(p.read_text().replace('"challenge_units": 1000', '"challenge_units": 1001', 1), encoding="utf-8")
    if not check_all(render_round_leaves(rounds_dir, leaves_dir, "2026-09-06"), leaves_dir, "2026-09-06"):
        print("FAIL: a planted byte change in the rows passed --check", file=sys.stderr); bad += 1

    shutil.rmtree(tmp, ignore_errors=True)
    print("selftest %s: PAID-only, frozen ladder (1 then 2), UNMEASURED with the one-purchase sentence, "
          "3 KB cap, planted change fails --check" % ("FAILED" if bad else "OK"))
    return 1 if bad else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--census", default=None, help="legacy mode: the census jsonl to read")
    ap.add_argument("--out", default="public/interop/x402-census-cards")
    ap.add_argument("--round-id", default=None, metavar="YYYY-MM-DD",
                    help="round mode: build the unsigned leaves for this round (omit with --check for all)")
    ap.add_argument("--rounds-dir", default=str(ROOT / ROUNDS_REL))
    ap.add_argument("--leaves-dir", default=str(ROOT / LEAVES_REL))
    ap.add_argument("--check", action="store_true", help="round mode: recompute and exit 1 on drift")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--atom", default=None,
                    help="also write the surface-level unsigned atom for scripts/sign_ledger_cards.py")
    ap.add_argument("--per-host-cap-note", dest="per_host_cap_note", default=50000)
    ap.add_argument("--total-cap-note", dest="total_cap_note", default=5.5)
    ap.add_argument("--census-url",
                    default="https://huggingface.co/datasets/csoai/x402-settlement-census")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if a.round_id or a.check or not a.census:
        return round_mode(a)

    rows = [json.loads(l) for l in open(a.census) if l.strip()]
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    made = skipped = oversize = 0
    for r in rows:
        c = card_for(r, a.census_url)
        if c is None:
            skipped += 1
            continue
        blob = json.dumps(c, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        if len(blob.encode()) > MAX_BYTES:
            # never silently truncate a receipt: say which one and why
            print(f"  OVERSIZE {r['host']}: {len(blob.encode())} B > {MAX_BYTES}", file=sys.stderr)
            oversize += 1
            continue
        (out / f"{c['sha256']}.json").write_text(json.dumps(c, indent=1))
        made += 1
    print(f"  cards {made} · skipped (no settlement tx) {skipped} · oversize {oversize} · from {len(rows)} rows")
    print(f"  every card is UNMEASURED at n=1 and names the four things one purchase cannot show")

    # The signer (scripts/sign_ledger_cards.py) signs ONE atom per surface, not one per row, so the
    # per-settlement cards above are the artefact set and this is what gets signed. Derived from the
    # same rows — nothing here is typed.
    if a.atom:
        import collections
        st = collections.Counter(r.get("status") for r in rows)
        tx_ok = [r for r in rows if r.get("settle_tx") not in (None, "unparseable")]
        refused_paid = [r for r in tx_ok if r.get("status") == "REFUSED"]
        pay = collections.Counter(r.get("pay_to") for r in rows if r.get("pay_to"))
        spent = max([r.get("spent_units_running") or 0 for r in rows] or [0])
        total = sum(st.values())
        atom = {
            "schema": SCHEMA,
            "surface": SURFACE,
            "subject": (f"x402 settlement census — {total} conformant hosts paid as a buyer, "
                        f"{st.get('DELIVERED', 0)} delivered, {st.get('REFUSED', 0)} refused"),
            "as_of": max((r.get("observed_at") or "") for r in rows),
            "source_urls": [a.census_url, "https://councilof.ai/api/x402"],
            "payload": {
                "kind": "csoai.x402-settlement/0.1",
                "flags": {"self_settlement": False, "revenue": False, "ranking": False,
                          "hosts_contacted": False},
                "method": ("GET the resource, sign EIP-3009 for accepts[0] with the EIP-712 domain "
                           "taken from the challenge itself, GET again with PAYMENT-SIGNATURE; the "
                           "host's facilitator submits and pays gas"),
                "population": total,
                "outcome": {k: v for k, v in st.most_common()},
                "usdc_spent": round(spent / 1e6, 4),
                "caps": {"per_host_units": a.per_host_cap_note, "total_usdc": a.total_cap_note},
                "settlement_txs": len(tx_ok),
                "took_settlement_and_refused": len(refused_paid),
                "distinct_pay_to": len(pay),
                "top_pay_to_share": [{"pay_to": k, "hosts": v} for k, v in pay.most_common(3)],
                "cards_emitted": made,
                "story": ("Two in three conformant x402 hosts refused a correctly-signed payment. "
                          "Thirteen reported a settlement transaction and refused anyway. Being "
                          "listed and conformant is not the same as taking money and answering."),
                "verified_via": "each row carries its settlement tx; the chain is the check",
            },
            "unmeasured": [
                "reliability_per_host: n=1 per host, one purchase at one moment",
                "good_faith: a refusal may be rate-limiting, an account requirement, or changed terms",
                "delivery_quality: bytes and content-type were recorded, the artefact was not evaluated",
                "population_drift: a single round cannot show who changes, a second round would",
            ],
            "note": ("Measurement, not certification. No host was contacted and none is ranked. "
                     "Every USDC left our own wallet, so none of this is revenue."),
        }
        canon = json.dumps(atom["payload"], sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        atom["sha256"] = hashlib.sha256(canon.encode()).hexdigest()
        blob = json.dumps(atom, indent=1)
        if len(blob.encode()) > MAX_BYTES:
            print(f"  ATOM OVERSIZE: {len(blob.encode())} B > {MAX_BYTES} — the signer will HALT",
                  file=sys.stderr)
            return 1
        pathlib.Path(a.atom).write_text(blob)
        print(f"  atom: {a.atom} ({len(blob.encode())} B, cap {MAX_BYTES})")
    return 1 if oversize else 0


if __name__ == "__main__":
    raise SystemExit(main())
