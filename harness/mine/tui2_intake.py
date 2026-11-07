#!/usr/bin/env python3
"""tui2_intake.py — TUI-2 stablecoin/financial-rail intake atoms.

Emits unsigned intake atoms for stablecoin + XRPL + SWIFT subjects.
Identity resolution is the first step. Deep observation is a separate cycle.
"""
from __future__ import annotations
import json, os, sys, hashlib, urllib.request
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
INTAKE_LOG = MEAS_DIR / "intake_atoms_tui2.jsonl"
COVERAGE = MEAS_DIR / "intake_atoms_tui2_coverage.json"
STATE = Path("/tmp/tui2_intake_state.json")


def emit_atom(subject, family, version, method, scorer_version, denominator, source_revision=None, state="INDEXED"):
    atom = {
        "atom_schema": "csoai.intake-atom/0.1",
        "atom_kind": "intake-atom",
        "lane": "TUI-2",
        "subject": subject,
        "family": family,
        "version": version,
        "method": method,
        "scorer_version": scorer_version,
        "denominator": denominator,
        "source_revision": source_revision or NOW(),
        "state": state,
        "emitted_at": NOW(),
        "emitted_by": "TUI-2",
        "unsigned": True,
        "notes": "Identity-level intake. Deep observation (supply, holders, attestation) is a separate cycle.",
    }
    atom["content_hash"] = hashlib.sha256(json.dumps(atom, sort_keys=True).encode()).hexdigest()[:16]
    with open(INTAKE_LOG, "a") as f:
        f.write(json.dumps(atom) + "\n")
    return atom


def discover_stablecoins_from_local():
    """Pull from already-mined measurement corpus instead of new API calls."""
    stablecoin_dir = MEAS_DIR
    found = []
    for fname in os.listdir(stablecoin_dir):
        if "stablecoin" in fname.lower() and fname.endswith(".json"):
            try:
                with open(os.path.join(stablecoin_dir, fname)) as f:
                    card = json.load(f)
                    found.append(card)
            except Exception:
                pass
    return found


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-2 intake atoms: {metrics.get('atoms_emitted', 0)} atoms emitted.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "intake_atom_layer": True,
    }
    fname = MEAS_DIR / f"tui2-intake-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui2_intake starting")
    # Emit atoms for the universe we know exists (per charter):
    # 425 stablecoins, 16 XRPL, 26 SWIFT
    atoms = []
    # Sample 50 stablecoins (representative slice, full universe requires deeper cycle)
    sample_stablecoins = ["USDC", "USDT", "DAI", "FRAX", "USDP", "GUSD", "BUSD", "TUSD",
                          "USDD", "SUSD", "MIM", "FEI", "LUSD", "SDAI", "PYUSD",
                          "FDUSD", "USDJ", "USDE", "SUSDS", "USDX", "KUSD", "USDV",
                          "OUSD", "XUSD", "USD+", "USDK", "USDQ", "DUSD", "USDSB",
                          "USDP", "USD1", "USDM", "USTC", "USX", "CUSD", "CEUSD",
                          "XAUT", "PAXG", "TBTC", "WBTC", "EURT", "EURe", "CEUR",
                          "EURCV", "EURS", "agEUR", "jEUR", "VCHF", "VEUR", "XSGD"]
    for sc in sample_stablecoins:
        atoms.append(emit_atom(
            subject=sc, family="stablecoin", version="TBD",
            method="identity_resolution_pending",
            scorer_version="gspc-axis-stablecoin-resolve",
            denominator="TBD", state="INDEXED",
        ))
    # XRPL-16
    for xrpl in ["XRP", "RLUSD", "CSC", "USD", "MCO", "BITCNY", "CNY",
                 "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "BRL", "INR", "KRW"]:
        atoms.append(emit_atom(
            subject=xrpl, family="xrpl", version="ledger-current",
            method="identity_resolution_pending",
            scorer_version="gspc-axis-xrpl-resolve",
            denominator="TBD", state="INDEXED",
        ))
    # SWIFT-26
    swift_banks = ["JPMC", "Citi", "BofA", "Wells Fargo", "HSBC", "Standard Chartered",
                   "BNP Paribas", "Deutsche Bank", "Santander", "UBS", "Mizuho", "SMFG",
                   "MUFG", "Barclays", "Lloyds", "NatWest", "SocGen", "Intesa", "BBVA",
                   "CaixaBank", "ING", "Rabobank", "Commerzbank", "Danske", "Nordea",
                   "SEB"]
    for b in swift_banks:
        atoms.append(emit_atom(
            subject=b, family="swift-bank", version="public-claim-current",
            method="identity_resolution_pending",
            scorer_version="gspc-axis-swift-resolve",
            denominator="TBD", state="INDEXED",
        ))
    by_family = Counter(a["family"] for a in atoms)
    by_state = Counter(a["state"] for a in atoms)
    write_card(f"emitted-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.intake_atom.tui2_emission",
               {
                   "atoms_emitted": len(atoms),
                   "by_family": dict(by_family.most_common()),
                   "by_state": dict(by_state.most_common()),
                   "charter_note": "TUI-2 emits INDEXED identity atoms. Deep observation (supply, holders, attestation) is a separate cycle.",
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui2_intake done: {len(atoms)} atoms, by_family={dict(by_family)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
