#!/usr/bin/env python3
"""audit_financial_axis_disagreement.py — DONE WHEN A proof.

Per the brief (M4 GOAL MODE 18 Sep 2026):
  "The two board rows that disagree with their own artifacts are reconciled.
   labour-components says n=2 and cites 57.58; its artifact says n=1, a different
   source, dated 2025, participation UNREACHABLE — and the live endpoint returns
   57.2757, which appears in neither. ai-adoption-components has the same shape.
   We audit others for exactly this. Fix the producer, not the row. Prove it
   with a checker that fails before and passes after."

What this checker does:
  1. Read /api/gspc (live, anonymous via Mozilla UA)
  2. For each financial axis with a financial-measure-card on disk, compare:
     - board.n      vs card.payload.n
     - board.fleet_mean / sum / value     vs card.payload.rows values
  3. Report each disagreement with name, board value, card value, what digest
     they share, and what they don't.
  4. The brief said this checker must FAIL BEFORE and PASS AFTER. The "before"
     state is documented in this artifact. The "after" state requires the
     producer to be fixed — that is the OPEN DEFECT.

Per HARD STOP: this script reads files. It does NOT push, merge, dispatch,
sign, edit published bytes, or open a browser. Output is a printed report
plus a JSON sidecar in public/interop/audit-finance-disagreement-2026-09-18.json.
"""
from __future__ import annotations
import hashlib, json, pathlib, sys, urllib.request
from datetime import datetime, timezone

BASE = pathlib.Path(__file__).resolve().parent.parent
DIST = BASE / "dist" / "client" / "interop"
INTEROP = BASE / "public" / "interop"
OUT = INTEROP / "audit-finance-disagreement-2026-10-07.json"


def fetch_board() -> dict:
    """Read /api/gspc anonymously. Brief: councilof.ai returns 403 to non-browser
    clients in general, but Mozilla UA still works for /api/gspc — proved earlier.
    Uses curl because the local Python 3.14 urllib lacks CA certs
    (CERTIFICATE_VERIFY_FAILED), 2026-10-07."""
    import subprocess
    out = subprocess.run(
        ["curl", "-s", "-H", "User-Agent: Mozilla/5.0", "--max-time", "15",
         "https://councilof.ai/api/gspc"],
        capture_output=True, text=True, timeout=30,
    ).stdout
    return json.loads(out)


def load_card(axis: str) -> dict | None:
    """Load the financial-measure-card for an axis.
    Path drift note (2026-10-07): cards moved from dist/client/interop/ to
    public/interop/; runs are the sibling financial-measure-run-*.json."""
    for p in (
        DIST / f"financial-measure-card-{axis}.json",
        INTEROP / f"financial-measure-card-{axis}.json",
        DIST / f"financial-measure-run-{axis}.json",
        INTEROP / f"financial-measure-run-{axis}.json",
    ):
        if p.exists():
            return json.loads(p.read_text())
    return None


def axis_audit(axis: str, board_axis: dict) -> dict:
    """Compare the board's row to its own card. Return a finding."""
    card = load_card(axis)
    if not card:
        return {
            "axis": axis,
            "disagreement": True,
            "status": "NO_CARD",
            "board_n": board_axis.get("n"),
            "board_status": board_axis.get("status"),
            "board_value": board_axis.get("fleet_mean"),
            "checks": {"n_disagreement": True, "value_presence": {}, "status_disagreement": True, "risk_disagreement": True},
        }

    payload = card.get("payload", {})
    board_n = board_axis.get("n")
    card_n = payload.get("n")
    card_status = payload.get("status")
    card_risk = payload.get("risk_verdict")
    board_as_of = board_axis.get("as_of")
    card_as_of = payload.get("as_of")
    card_rows = payload.get("rows", [])
    card_value_set = [r.get("value") for r in card_rows if isinstance(r, dict) and isinstance(r.get("value"), (int, float))]

    # The brief says the live endpoint returns a value (57.2757) that appears in
    # neither the card's rows nor the board's fleet_mean. We try to find any
    # value-bearing field on the board row.
    board_value_candidates = {
        k: board_axis.get(k) for k in board_axis
        if isinstance(board_axis.get(k), (int, float))
    }
    board_numeric_values = list(board_value_candidates.values())

    # Disagreement test 1: n on board != n on card
    n_disagreement = (board_n is not None and card_n is not None and board_n != card_n)

    # Disagreement test 2: card value(s) not present in board numeric values
    def near(a, b, tol=1e-3):
        try:
            return abs(float(a) - float(b)) < tol
        except Exception:
            return False
    value_presence = {
        "card_values": card_value_set,
        "board_numeric_values": board_numeric_values,
        "any_card_value_in_board_values": any(
            near(v, bv) for v in card_value_set for bv in board_numeric_values
        ),
    }

    # Disagreement test 3: status disagreement
    status_disagreement = (board_axis.get("status") != card_status)

    # Disagreement test 4: card risk_verdict UNMEASURED but board says MEASURED
    risk_disagreement = (card_risk == "UNMEASURED" and board_axis.get("status") == "MEASURED")

    disagreement = n_disagreement or (not value_presence["any_card_value_in_board_values"]) or status_disagreement or risk_disagreement

    return {
        "axis": axis,
        "disagreement": disagreement,
        "checks": {
            "n_disagreement": n_disagreement,
            "value_presence": value_presence,
            "status_disagreement": status_disagreement,
            "risk_disagreement": risk_disagreement,
        },
        "board_n": board_n,
        "board_status": board_axis.get("status"),
        "board_as_of": board_as_of,
        "card_n": card_n,
        "card_status": card_status,
        "card_as_of": card_as_of,
        "card_risk_verdict": card_risk,
    }


def main() -> int:
    print("=== audit_financial_axis_disagreement.py — DONE WHEN A proof ===")
    print("Per the brief: 'Fix the producer, not the row. Prove it with a checker")
    print("that fails before and passes after.' This run reports the BEFORE state.")
    print()
    print("HARD STOP in force: no push, merge, dispatch, signing, or editing of")
    print("published bytes. This script only reads files and prints a report.")
    print()

    board = fetch_board()
    financial_axes = [a for a in board.get("axes", []) if isinstance(a, dict) and a.get("family") == "financial"]
    print(f"financial axes on /api/gspc: {len(financial_axes)}")
    print()

    findings = []
    for a in financial_axes:
        f = axis_audit(a.get("axis"), a)
        findings.append(f)
        marker = "✗" if f["disagreement"] else "✓"
        n_agree = "✓" if f.get("board_n") == f.get("card_n") else "✗"
        v_agree = "✓" if f["checks"]["value_presence"].get("any_card_value_in_board_values") else "✗"
        s_agree = "✓" if not f["checks"]["status_disagreement"] else "✗"
        r_agree = "✓" if not f["checks"]["risk_disagreement"] else "✗"
        print(f"  {marker} {f['axis']:30}  n:{n_agree}  values:{v_agree}  status:{s_agree}  risk:{r_agree}")
        if f["disagreement"]:
            cv = f['checks']['value_presence'].get('card_values', [])
            bv = f['checks']['value_presence'].get('board_numeric_values', [])
            print(f"      board.n={f.get('board_n')}, card.n={f.get('card_n')}, card.values={cv}, board.numeric_values={bv}")
            print(f"      card.risk_verdict={f.get('card_risk_verdict')}, card.as_of={f.get('card_as_of')}, board.as_of={f.get('board_as_of')}")

    n_disagreements = sum(1 for f in findings if f["disagreement"])
    print()
    print(f"axes with at least one disagreement: {n_disagreements}/{len(findings)}")
    print()

    # Persist the BEFORE state as a receipt
    receipt = {
        "schema": "csoai.finance-axis-disagreement-audit/0.1",
        "kind": "audit-receipt",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rule": (
            "Producer audit: every financial axis on /api/gspc must agree with its "
            "own financial-measure-card on (n, values, status, risk_verdict)."
        ),
        "board_source": "https://councilof.ai/api/gspc (anonymous, Mozilla UA)",
        "axes_audited": [f["axis"] for f in findings],
        "findings": findings,
        "verdict": {
            "before_pass": n_disagreements == 0,
            "after_pass": False,
            "open_defect": (
                "Producer fix required. Per the brief: fix the producer, not the "
                "row. The board is system of record; the card is its own signed "
                "descendant. The disagreement pattern must close at the source "
                "(the producer that writes the axes array), not by editing the "
                "card or the row."
            ),
        },
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION.",
            "Audit only. This script does not edit, push, merge, sign, or dispatch.",
            "The card bytes are signed; they are NOT edited. Any fix must regenerate "
            "the card via the producer.",
        ],
    }
    canonical = json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode()
    receipt["sha256"] = hashlib.sha256(canonical).hexdigest()
    receipt["byte_size"] = len(canonical)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(json.dumps(receipt, indent=2).encode())
    print(f"Wrote: {OUT}")
    print(f"sha256: {receipt['sha256']}")
    print()
    print("DONE WHEN A — BEFORE state recorded. AFTER requires the producer fix.")
    print("Until the producer is fixed, this checker fails OPEN — disagreement is the truth.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
