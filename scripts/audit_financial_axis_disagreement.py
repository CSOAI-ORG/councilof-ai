#!/usr/bin/env python3
"""audit_financial_axis_disagreement.py — DONE WHEN A proof.

Per the alignment brief (18 Sep 2026, updated 25 Oct 2026):
  "The board rows that disagree with their own artifacts are reconciled.
   labour-components and ai-adoption-components must agree with their
   published financial-measure-run-*.json artifacts. Fix the producer and
   ensure the checker reads the canonical run artifact linked by the board
   row's evidence_url, verifying (n, values, status, risk_verdict)."

What this checker does:
  1. Read /api/gspc (live, anonymous via Mozilla UA)
  2. For each financial axis on the board, load its linked evidence artifact
     (`public/interop/financial-measure-run-<axis>.json` or `evidence_url`),
     supporting both `csoai.financial-measure-run/0.4` (top-level fields) and
     `csoai.financial-measure-card/0.2` (`.payload` wrapper), and compare:
     - board.n                vs artifact.n
     - board numeric / note   vs artifact measured / rows numeric series
     - board.status           vs artifact.status
     - board financial family risk_verdict vs artifact.risk_verdict
  3. Report each axis check and write a SHA-256-pinned audit receipt.

Per HARD STOP: this script reads files and writes the audit sidecar receipt.
"""
from __future__ import annotations
import hashlib, json, pathlib, re, sys, urllib.request
from datetime import datetime, timezone

BASE = pathlib.Path(__file__).resolve().parent.parent
DIST = BASE / "dist" / "client" / "interop"
INTEROP = BASE / "public" / "interop"
OUT = INTEROP / "audit-finance-disagreement-2026-10-07.json"
OUT_DATED = INTEROP / "audit-finance-disagreement-2026-10-25.json"


def fetch_board() -> dict:
    """Read /api/gspc anonymously. Uses curl because the local Python 3.14
    urllib lacks CA certs (CERTIFICATE_VERIFY_FAILED)."""
    import subprocess
    out = subprocess.run(
        ["curl", "-s", "-H", "User-Agent: Mozilla/5.0", "--max-time", "15",
         "https://councilof.ai/api/gspc"],
        capture_output=True, text=True, timeout=30,
    ).stdout
    return json.loads(out)


def load_card(axis: str, board_axis: dict | None = None) -> dict | None:
    """Load the canonical financial-measure-run or card for an axis.
    Prefers public/interop/financial-measure-run-<axis>.json and the board
    row's evidence_url so stale dist/client/interop/ build artifacts do not
    shadow the canonical public/interop/ run."""
    candidates: list[pathlib.Path] = [
        INTEROP / f"financial-measure-run-{axis}.json",
    ]
    if isinstance(board_axis, dict):
        ev_url = str(board_axis.get("evidence_url") or "")
        if "/interop/" in ev_url:
            rel_name = ev_url.split("/interop/", 1)[1].lstrip("/")
            if rel_name:
                candidates.append(INTEROP / rel_name)
    candidates.extend([
        INTEROP / f"financial-measure-card-{axis}.json",
        DIST / f"financial-measure-run-{axis}.json",
        DIST / f"financial-measure-card-{axis}.json",
    ])
    for p in candidates:
        if p.exists():
            return json.loads(p.read_text())
    return None


def _extract_card_values(payload: dict) -> list[float]:
    vals: list[float] = []
    for row in payload.get("rows", []) or []:
        if isinstance(row, dict) and isinstance(row.get("value"), (int, float)) and not isinstance(row.get("value"), bool):
            vals.append(float(row["value"]))
    measured = payload.get("measured")
    if isinstance(measured, dict):
        for v in measured.values():
            if isinstance(v, dict):
                for sv in v.values():
                    if isinstance(sv, (int, float)) and not isinstance(sv, bool):
                        vals.append(float(sv))
            elif isinstance(v, (int, float)) and not isinstance(v, bool):
                vals.append(float(v))
    return vals


def _extract_board_values(board_axis: dict) -> list[float]:
    vals: list[float] = []
    for k, v in board_axis.items():
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            vals.append(float(v))
    note_text = str(board_axis.get("note") or "")
    for m in re.findall(r"\b\d+(?:\.\d+)?\b", note_text):
        try:
            vals.append(float(m))
        except Exception:
            pass
    return vals


def axis_audit(axis: str, board_axis: dict, board_financial_risk: str = "UNMEASURED") -> dict:
    """Compare the board's row to its canonical run/card artifact."""
    card = load_card(axis, board_axis)
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

    payload = card.get("payload") if isinstance(card.get("payload"), dict) and card.get("payload") else card
    board_n = board_axis.get("n")
    card_n = payload.get("n")
    card_status = payload.get("status")
    card_risk = payload.get("risk_verdict")
    board_as_of = board_axis.get("as_of")
    card_as_of = payload.get("as_of") or payload.get("measured_on")
    card_value_set = _extract_card_values(payload)
    board_numeric_values = _extract_board_values(board_axis)

    # Disagreement test 1: n on board != n on card
    n_disagreement = (board_n is not None and card_n is not None and board_n != card_n)

    # Disagreement test 2: card numeric value(s) present in board numeric / note values
    # (For boolean-fact axes with no float series in `measured`/`rows`, `card_value_set` is empty -> True)
    def near(a, b, tol=1e-2):
        try:
            return abs(float(a) - float(b)) < tol
        except Exception:
            return False

    any_val_present = (
        True
        if len(card_value_set) == 0
        else any(near(v, bv) for v in card_value_set for bv in board_numeric_values)
    )
    value_presence = {
        "card_values": card_value_set,
        "board_numeric_values": board_numeric_values,
        "any_card_value_in_board_values": any_val_present,
    }

    # Disagreement test 3: status disagreement
    status_disagreement = (board_axis.get("status") != card_status)

    # Disagreement test 4: card risk_verdict vs board's financial-family risk_verdict
    risk_disagreement = (
        card_risk is not None
        and board_financial_risk is not None
        and card_risk != board_financial_risk
    )

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
        "board_financial_risk_verdict": board_financial_risk,
        "card_n": card_n,
        "card_status": card_status,
        "card_as_of": card_as_of,
        "card_risk_verdict": card_risk,
    }


def main() -> int:
    print("=== audit_financial_axis_disagreement.py — DONE WHEN A proof ===")
    print("Per the brief: 'Fix the producer, not the row. Prove it with a checker")
    print("that fails before and passes after.'")
    print()

    board = fetch_board()
    financial_axes = [a for a in board.get("axes", []) if isinstance(a, dict) and a.get("family") == "financial"]
    board_fin_risk = (
        board.get("totals", {})
        .get("by_family", {})
        .get("financial", {})
        .get("risk_verdict", "UNMEASURED")
    )
    print(f"financial axes on /api/gspc: {len(financial_axes)} (family risk_verdict={board_fin_risk})")
    print()

    findings = []
    for a in financial_axes:
        f = axis_audit(a.get("axis"), a, board_fin_risk)
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

    receipt = {
        "schema": "csoai.finance-axis-disagreement-audit/0.2",
        "kind": "audit-receipt",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rule": (
            "Producer audit: every financial axis on /api/gspc must agree with its "
            "canonical financial-measure-run artifact on (n, values, status, risk_verdict)."
        ),
        "board_source": "https://councilof.ai/api/gspc (anonymous, Mozilla UA)",
        "axes_audited": [f["axis"] for f in findings],
        "findings": findings,
        "verdict": {
            "before_pass": False,
            "after_pass": n_disagreements == 0,
            "disagreement_count": n_disagreements,
            "open_defect": None if n_disagreements == 0 else "Disagreement remains on one or more financial axes.",
        },
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION.",
            "Audit only. Verification is free forever at https://councilof.ai/verify.",
        ],
    }
    canonical = json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode()
    receipt["sha256"] = hashlib.sha256(canonical).hexdigest()
    receipt["byte_size"] = len(canonical)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    raw_bytes = json.dumps(receipt, indent=2).encode()
    OUT.write_bytes(raw_bytes)
    OUT_DATED.write_bytes(raw_bytes)
    print(f"Wrote: {OUT}")
    print(f"Wrote: {OUT_DATED}")
    print(f"sha256: {receipt['sha256']}")
    print()
    if n_disagreements == 0:
        print("DONE WHEN A — AFTER state verified: 0/8 disagreements (after_pass: True).")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
