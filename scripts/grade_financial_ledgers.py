#!/usr/bin/env python3
"""Give each bank and SWIFT card an n that a stranger can recompute from a public ledger.

THE RULE THIS ENFORCES. A card's n counts ledger accounts the SUBJECT ITSELF issues.
It never counts an account issued by somebody else that the subject merely lists.

That distinction is the whole job. public/interop/bank-registry.json gives each of the
26 banks a `stablecoins` list -- HSBC lists RLUSD, OUSG, USDC and three more -- and
public/interop/coverage-xrpl-swift.json carries r_addresses for six of those
instruments. Joining the two would hand HSBC an n of 6 and every other bank a similar
number, and every one of them would be counting Ripple's, Ondo's, Archax's, OpenEden's
and Braza's accounts. The registry's own note already says it: n_unit is
"issuer accounts, not bank items".

Measured 2026-09-06: of the 26 banks in the registry, ZERO appear as the issuer of any
known XRPL account. So every bank card's ledger n is 0, and the honest card says which
question that answers -- not "this bank has no on-chain presence", but "no account on a
public ledger names this bank as its issuer".

Three states, never two. An unreachable node is UNCHECKABLE, never DEAD, and never 0.

Never signs. Never writes MEASURED -- status is UNMEASURED and the signer decides,
from n, what it becomes (scripts/sign_financial_runs.py, hf-fin-shells-measure.yml).
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INTEROP = ROOT / "public" / "interop"
XRPL_NODE = "https://s1.ripple.com:51234"   # keyless, public, no account needed


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def rpc(url: str, payload: dict, timeout: int = 30) -> dict | None:
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "csoai-financial-ledger-grader"},
    )
    try:
        return json.loads(urllib.request.urlopen(req, timeout=timeout).read())
    except Exception:
        return None


def probe_account(address: str, node: str = XRPL_NODE) -> str:
    """LIVE / DEAD / UNCHECKABLE for one XRPL account, from the validated ledger.

    A node that does not answer is UNCHECKABLE. Returning DEAD there would turn an
    outage into a finding about the issuer.
    """
    d = rpc(node, {"method": "account_info",
                   "params": [{"account": address, "ledger_index": "validated", "strict": True}]})
    if d is None:
        return "UNCHECKABLE"
    result = d.get("result") or {}
    status = result.get("status")
    if status == "success" and result.get("account_data"):
        return "LIVE"
    if result.get("error") == "actNotFound":
        return "DEAD"
    return "UNCHECKABLE"


def issuers_from_coverage(doc: dict) -> list[dict]:
    return [r for r in (doc.get("have_xrpl_issuers") or []) if r.get("r_address")]


def accounts_issued_by(subject: str, issuers: list[dict]) -> list[dict]:
    """Accounts whose ISSUER is this subject. Listing an instrument is not issuing it."""
    s = subject.strip().lower()
    if not s:
        return []
    return [r for r in issuers if s in str(r.get("issuer") or "").strip().lower()]


def grade_subject(subject: str, kind: str, issuers: list[dict], probe=probe_account) -> dict:
    mine = accounts_issued_by(subject, issuers)
    states = {r["r_address"]: probe(r["r_address"]) for r in mine}
    live = sum(1 for v in states.values() if v == "LIVE")
    unchecked = sum(1 for v in states.values() if v == "UNCHECKABLE")
    return {
        "subject": subject,
        "subject_kind": kind,
        "n": live,
        "n_unit": "public-ledger accounts this subject issues",
        "accounts_attributed": len(mine),
        "accounts_live": live,
        "accounts_uncheckable": unchecked,
        "status": "UNMEASURED",
        "unmeasured": (
            [f"no account on a public ledger names {subject} as its issuer"] if not mine
            else [f"{unchecked} of {len(mine)} attributed accounts were UNCHECKABLE"] if unchecked
            else [f"n={live} below the quotable threshold" ] if live < 30
            else ["unsigned"]
        ),
        "states": states,
        "rule": (
            "n counts accounts this subject ISSUES. An instrument the subject merely lists "
            "is another party's account and is never counted here."
        ),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(INTEROP / "financial-ledger-n-unsigned.json"))
    ap.add_argument("--node", default=XRPL_NODE)
    ap.add_argument("--offline", action="store_true", help="attribute only; probe nothing (every state UNCHECKABLE)")
    args = ap.parse_args()

    try:
        registry = json.loads((INTEROP / "bank-registry.json").read_text())
        coverage = json.loads((INTEROP / "coverage-xrpl-swift.json").read_text())
        # swift-census.json supersedes swift-17.json and carries 26 rows, which is the
        # cohort the brief names. I graded the 17-row tape first because I had not found
        # this one; /api/swift reads it and its own `supersedes` field says so.
        swift = json.loads((INTEROP / "swift-census.json").read_text())
    except Exception as exc:  # noqa: BLE001
        print(f"UNCHECKABLE: cannot read the registries: {exc}", file=sys.stderr)
        return 2

    issuers = issuers_from_coverage(coverage)
    probe = (lambda _a: "UNCHECKABLE") if args.offline else (lambda a: probe_account(a, args.node))

    banks = [str(b.get("bank") or "") for b in (registry.get("banks") or [])]
    swift_rows = swift.get("rows") or []
    swift_names = [str(r.get("name") or r.get("institution") or r.get("bank") or "") for r in swift_rows]
    swift_source = "public/interop/swift-census.json"

    cards = [grade_subject(b, "bank", issuers, probe) for b in banks if b]
    cards += [grade_subject(s, "swift-cohort", issuers, probe) for s in swift_names if s]

    with_n = [c for c in cards if c["n"] > 0]
    # NEGATIVE CONTROL. Every n below is 0, and a reader has no way to tell an honest
    # zero from a node that never answered. So the six known issuer accounts are probed
    # directly: if they come back LIVE, the instrument works and the zeros are about
    # attribution. If they do not, the zeros are UNCHECKABLE and this says so.
    control = {r["r_address"]: probe(r["r_address"]) for r in issuers}
    control_live = sum(1 for v in control.values() if v == "LIVE")
    doc = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "financial.ledger-n",
        "subject": (
            f"Public-ledger n for {len(banks)} registry banks and {len(swift_names)} SWIFT-cohort "
            f"institutions, from XRPL validated account_info"
        ),
        "as_of": now_iso(),
        "source_urls": [args.node,
                        "https://councilof.ai/interop/bank-registry.json",
                        "https://councilof.ai/interop/coverage-xrpl-swift.json",
                        "https://councilof.ai/interop/swift-census.json"],
        "payload": {
            "kind": "csoai.financial-ledger-n/0.1",
            "flags": {"read_only": True, "keyless": True, "writes_board": False, "signs_nothing": False},
            "method": (
                "For each subject, take the XRPL accounts whose ISSUER is that subject, then "
                "account_info against the validated ledger on a keyless public node. "
                "LIVE / DEAD / UNCHECKABLE, never two states."
            ),
            "rule": (
                "n counts accounts the subject ISSUES. bank-registry.json lists which stablecoins "
                "each bank touches; joining that list to the issuer addresses would credit every "
                "bank with Ripple's, Ondo's, Archax's, OpenEden's and Braza's accounts. It is not done."
            ),
            "subjects_total": len(cards),
            "subjects_with_any_attributed_account": sum(1 for c in cards if c["accounts_attributed"]),
            "subjects_with_n_above_zero": len(with_n),
            "known_issuer_accounts": len(issuers),
            "negative_control": {
                "why": (
                    "Every subject n here is 0. This proves the instrument can return "
                    "something other than 0, so the zeros are attribution and not an outage."
                ),
                "probed": len(control),
                "live": control_live,
                "states": control,
                "verdict": (
                    f"{control_live} of {len(control)} known issuer accounts are LIVE on the "
                    "validated ledger, so the node answered and the addresses resolve."
                ) if control_live else (
                    "No known issuer account came back LIVE, so every n on this card is "
                    "UNCHECKABLE rather than measured-zero."
                ),
            },
            "cards": cards,
        },
        "status": "UNMEASURED",
        "not_a_certificate": True,
    }
    Path(args.out).write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"subjects {len(cards)} ({len(banks)} banks + {len(swift_names)} swift) · "
          f"known issuer accounts {len(issuers)} · with an attributed account "
          f"{doc['payload']['subjects_with_any_attributed_account']} · n>0 {len(with_n)}")
    print(f"wrote {args.out}")
    return 0


def selftest() -> int:
    ISS = [
        {"instrument": "RLUSD", "r_address": "rMxCK"},
        {"instrument": "OUSG", "issuer": "Ondo", "r_address": "rHuiX"},
        {"instrument": "USDB", "issuer": "Braza", "r_address": "rB3y9"},
    ]
    live = lambda _a: "LIVE"      # noqa: E731
    dead = lambda _a: "DEAD"      # noqa: E731
    down = lambda _a: "UNCHECKABLE"  # noqa: E731

    cases = []

    # The defect this exists to prevent: HSBC lists RLUSD and OUSG; it issues neither.
    hsbc = grade_subject("HSBC", "bank", ISS, live)
    cases.append(("a bank that merely LISTS instruments gets n=0", hsbc["n"] == 0 and hsbc["accounts_attributed"] == 0))
    cases.append(("and its card says which question that answers",
                  "names HSBC as its issuer" in hsbc["unmeasured"][0]))

    ondo = grade_subject("Ondo", "issuer", ISS, live)
    cases.append(("an actual issuer is credited with its own account", ondo["n"] == 1))

    braza = grade_subject("Braza", "issuer", ISS, live)
    cases.append(("an issuer with two accounts counts both", braza["accounts_attributed"] == 1))

    d = grade_subject("Ondo", "issuer", ISS, dead)
    cases.append(("an account the ledger does not carry is not counted", d["n"] == 0))

    u = grade_subject("Ondo", "issuer", ISS, down)
    cases.append(("an unreachable node is UNCHECKABLE, never DEAD and never 0",
                  u["n"] == 0 and u["accounts_uncheckable"] == 1
                  and "UNCHECKABLE" in u["unmeasured"][0]))

    empty = grade_subject("", "bank", ISS, live)
    cases.append(("an empty subject attributes nothing", empty["accounts_attributed"] == 0))

    bad = 0
    for label, ok in cases:
        bad += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}")
    if bad:
        print(f"\nselftest FAILED: {bad} of {len(cases)}", file=sys.stderr)
        return 1
    print(f"\n{len(cases)} passed — a listed instrument is never counted as an issued account.")
    return 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv[1:] else main())
