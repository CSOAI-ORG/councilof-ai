#!/usr/bin/env python3
"""xrpl_issuer_prep.py — XLS-70 issuer-prep: devnet dry-run + mainnet checklist.

WHY THIS FILE EXISTS (2026-09-11, TUI-4 V2 / J24)
-------------------------------------------------
EP5 wants a mainnet XRPL issuer able to attach an XLS-70 Credential that POINTS
AT the signed GSPC card index. The brakes that bind are explicit and this tool
is built inside them:

  * docs/operations/TUI4_REJECT_2026-08-29.md — "XLS-70 is not a grade": a
    CredentialCreate on devnet is a pointer; the type string is not a score;
    NO mainnet mint.
  * docs/operations/BRAKE-LOG.md lane `xrpl-hash-labels` — devnet Payment vs
    CredentialCreate are labelled, never blurred into a mainnet claim.
  * client/src/lib/emptySlots.ts never-list — "Mainnet CredentialCreate this
    week. On-chain MEASURED. Invented issuer account." are banned claims.
  * harness/rwa-attest/README.md — counsel / DSS sandbox gate before anything
    beyond synthetic.

So this tool does exactly two things and no more:
  --dry-run-devnet   fund two THROWAWAY faucet wallets on XRPL DEVNET and
                     submit ONE CredentialCreate pointing at the live signed
                     card index; write the run record; fail closed.
  --checklist        print the mainnet ceremony steps. It executes NOTHING.
                     Mainnet is Nick-only.

REGISTER. An XLS-70 credential is a signed pointer to a measurement card —
never a grade, never certification, and an UNACCEPTED credential authorizes
nothing.

A NOTE ON THE CREDENTIAL TYPE BYTES. The prep plan doc carried
`0x4753504301` as the CredentialType. That is a 5-byte shorthand ("GSPC" plus
a version byte 0x01); it does NOT spell "GSPC-MEASURED". This tool computes
the real thing in code — the full ASCII hex of "GSPC-MEASURED" — and the
mismatch is flagged in docs/operations/XRPL-MAINNET-ISSUER-PREP-2026-09-11.md
so the mainnet ceremony uses the derived bytes, not the shorthand.

Run (never against system python):
  uv run --with xrpl-py python3 scripts/xrpl_issuer_prep.py --dry-run-devnet
  python3 scripts/xrpl_issuer_prep.py --checklist
"""

from __future__ import annotations

import argparse
import binascii
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RECORD_PATH = ROOT / "docs/operations/xrpl-issuer-prep/DEVNET-DRYRUN-2026-09-11.json"

DEVNET_WSS = "wss://s.devnet.rippletest.net:51234"
# The 2026-08-25 PoC (RUN-RECORD.json) used the JSON-RPC endpoint on the same
# host. If wss is refused we fall back to it and record which one answered —
# the network is the same devnet either way and the record says what happened.
DEVNET_JSONRPC = "https://s.devnet.rippletest.net:51234"
CARD_INDEX_URL = "https://councilof.ai/signed/card_index.json"
CREDENTIAL_TYPE_ASCII = "GSPC-MEASURED"
# Derived in code, never typed: ASCII hex of "GSPC-MEASURED".
# The plan doc's 0x4753504301 is a 5-byte shorthand ("GSPC" + 0x01) and does
# NOT spell this string — see the module docstring and the prep pack doc.
CREDENTIAL_TYPE_HEX = binascii.hexlify(CREDENTIAL_TYPE_ASCII.encode("ascii")).decode().upper()

STANDING_LABEL = (
    "DEVNET pointer. An unaccepted credential authorizes nothing. This is not "
    "a mainnet claim, not a grade, not certification. The URI points at the "
    "signed measurement-card index; the credential is evidence of a pointer, "
    "not of a verdict."
)

MAINNET_CHECKLIST = """\
MAINNET ISSUER CEREMONY — NICK-ONLY. This tool executed nothing for this list.
Register: an XLS-70 credential is a signed pointer to a measurement card —
never a grade, never certification.

  1. GATE — counsel/DSS sandbox sign-off per harness/rwa-attest/README.md, and
     owner go. The emptySlots never-list stands: no "on-chain MEASURED" claim.
  2. ISSUER ACCOUNT — create the mainnet issuer account inside GHA/HSM-class
     custody per the published custody policy. NEVER a laptop key. Fund the
     reserve (base + owner reserve for the credential object).
  3. PAYLOAD — CredentialCreate:
       CredentialType = {ctype_hex}   (ASCII "{ctype_ascii}" — derived, not the
                                       5-byte plan-doc shorthand 0x4753504301)
       URI = hex("{uri}")
       Subject = the subject account (subject != issuer)
       Expiration = none
  4. SUBMIT — from the custodied signer only; confirm engine_result tesSUCCESS.
  5. RECORD — tx hash, ledger, accounts, engine_result into
     docs/operations/xrpl-issuer-prep/ with the standing label:
     "{label}"
  6. SUBJECT SIDE — CredentialAccept by the subject is the SUBJECT's act; an
     unaccepted credential authorizes nothing. CredentialDelete is the unwind
     path; document it in the same record.
  7. COPY — every public mention: "a signed pointer to a measurement card".
     The brakes (TUI4_REJECT_2026-08-29, BRAKE-LOG xrpl-hash-labels) bind the
     mainnet pass exactly as they bound devnet.
"""


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_record(record: dict) -> None:
    RECORD_PATH.parent.mkdir(parents=True, exist_ok=True)
    RECORD_PATH.write_text(json.dumps(record, indent=2) + "\n")
    print(f"run record: {RECORD_PATH.relative_to(ROOT)}")


def dry_run_devnet() -> int:
    """One CredentialCreate on devnet between throwaway wallets. Fail closed."""
    record = {
        "schema": "csoai.xrpl-issuer-prep-dryrun/0.1",
        "status": "UNCHECKABLE",
        "as_of": now(),
        "network": "XRPL DEVNET",
        "network_url": DEVNET_WSS,
        "label": STANDING_LABEL,
        "credential": {
            "transaction_type": "CredentialCreate",
            "credential_type_ascii": CREDENTIAL_TYPE_ASCII,
            "credential_type_hex": CREDENTIAL_TYPE_HEX,
            "credential_type_note": (
                "Full ASCII hex of 'GSPC-MEASURED', computed in code. The prep "
                "plan doc's 0x4753504301 is a 5-byte shorthand ('GSPC' + 0x01) "
                "that does NOT spell GSPC-MEASURED; mismatch flagged in "
                "docs/operations/XRPL-MAINNET-ISSUER-PREP-2026-09-11.md."
            ),
            "uri": CARD_INDEX_URL,
            "expiration": None,
        },
        "brakes": [
            "docs/operations/TUI4_REJECT_2026-08-29.md",
            "docs/operations/BRAKE-LOG.md (lane xrpl-hash-labels)",
            "client/src/lib/emptySlots.ts (never: mainnet CredentialCreate / on-chain MEASURED / invented issuer)",
            "harness/rwa-attest/README.md (counsel/DSS sandbox gate)",
        ],
        "prior_devnet_poc": {
            "credential_attach_tx": "958BA25801A068AEA1507FC1649A862C33D59A1D715924794D98D2C66254DC4B",
            "credential_type_ascii": "CSOAI.GSPC.CARD/0.1",
            "date": "2026-08-25",
            "source": "~/clawd/council-os-lanes/bindings-lockfile/economy/xrpl-attest/RUN-RECORD.json",
        },
        "mainnet": "NOT_TOUCHED — mainnet ceremony is Nick-only; see --checklist",
        "same_day_prior_attempts": [
            {
                "tx_hash": "FF2B02B4855D0377242FF361ACD9F28BDC82D97DBD856A65422E171528D4C63B",
                "ledger_index": 5220186,
                "transaction_result": "tesSUCCESS",
                "note": (
                    "First run of this tool, 2026-09-11: the CredentialCreate "
                    "LANDED tesSUCCESS but the run record was written FAILED "
                    "because the success criterion wrongly required a "
                    "submit-style engine_result that tx-style responses do not "
                    "carry. Criterion fixed to judge on validated-ledger meta "
                    "TransactionResult only. Recorded here so no attempt is "
                    "hidden."
                ),
            }
        ],
    }

    try:
        from xrpl.clients import JsonRpcClient, WebsocketClient
        from xrpl.models.transactions import CredentialCreate
        from xrpl.transaction import submit_and_wait
        from xrpl.utils import str_to_hex
        from xrpl.wallet import generate_faucet_wallet
    except ImportError as exc:
        record["status"] = "UNCHECKABLE"
        record["reason"] = f"xrpl-py not importable: {exc}. Run via: uv run --with xrpl-py python3 scripts/xrpl_issuer_prep.py --dry-run-devnet"
        write_record(record)
        return 3

    def attempt(client_factory, label):
        # WebsocketClient is a context manager; JsonRpcClient is not. Treat both
        # uniformly: enter if possible, close afterwards if we entered.
        client = client_factory()
        entered = hasattr(client, "__enter__")
        if entered:
            client = client.__enter__()
        try:
            return _run_on_client(client, label)
        finally:
            if entered:
                client.__exit__(None, None, None)

    def _run_on_client(client, label):
            print("funding THROWAWAY issuer wallet from the devnet faucet...")
            issuer = generate_faucet_wallet(client, debug=False)
            print("funding THROWAWAY subject wallet from the devnet faucet...")
            subject = generate_faucet_wallet(client, debug=False)
            if issuer.address == subject.address:
                raise RuntimeError("faucet returned the same account twice — subject must != issuer")
            print(f"  issuer:  {issuer.address}\n  subject: {subject.address}")

            tx = CredentialCreate(
                account=issuer.address,
                subject=subject.address,
                credential_type=CREDENTIAL_TYPE_HEX,
                uri=str_to_hex(CARD_INDEX_URL),
            )
            print("submitting CredentialCreate (devnet)...")
            response = submit_and_wait(tx, client, issuer)
            result = response.result
            meta = result.get("meta", {})
            # The validated-ledger metadata is authoritative. submit responses
            # may carry engine_result; tx-style responses often do not — record
            # it verbatim and judge ONLY on meta.TransactionResult.
            engine_result = result.get("engine_result", "NOT_PRESENT_IN_RESPONSE")
            tx_result = meta.get("TransactionResult", "NOT_PRESENT_IN_RESPONSE")

            record["accounts"] = {
                "issuer": {"address": issuer.address, "seed": issuer.seed, "label": "THROWAWAY-DEVNET — faucet wallet, holds no value, seed published only because the account is disposable"},
                "subject": {"address": subject.address, "seed": subject.seed, "label": "THROWAWAY-DEVNET — faucet wallet, holds no value, seed published only because the account is disposable"},
            }
            record["engine_result"] = engine_result
            record["transaction_result"] = tx_result
            record["tx_hash"] = result.get("hash")
            record["ledger_index"] = result.get("ledger_index")
            record["explorer"] = (
                f"https://devnet.xrpl.org/transactions/{result.get('hash')}"
                if result.get("hash") else None
            )

            # Fail closed: anything that is not tesSUCCESS is a FAILED dry-run.
            if tx_result != "tesSUCCESS":
                record["status"] = "FAILED"
                record["reason"] = f"engine_result={engine_result} TransactionResult={tx_result} — fail closed, nothing claimed"
                write_record(record)
                return 1

            record["status"] = "tesSUCCESS"
            record["endpoint"] = DEVNET_WSS if label == "wss" else DEVNET_JSONRPC
            record["acceptance"] = "UNACCEPTED — an unaccepted credential authorizes nothing; CredentialAccept is the subject's act"
            write_record(record)
            print(f"tesSUCCESS — tx {record['tx_hash']} in ledger {record['ledger_index']}")
            return 0

    try:
        return attempt(lambda: WebsocketClient(DEVNET_WSS), "wss")
    except Exception as wss_exc:
        print(f"wss endpoint refused ({type(wss_exc).__name__}: {wss_exc}) — "
              f"falling back to JSON-RPC on the same devnet host...", file=sys.stderr)
        record.setdefault("endpoint_attempts", []).append(
            {"endpoint": DEVNET_WSS, "error": f"{type(wss_exc).__name__}: {wss_exc}"})
    try:
        record["endpoint_used"] = DEVNET_JSONRPC
        return attempt(lambda: JsonRpcClient(DEVNET_JSONRPC), "jsonrpc")
    except Exception as exc:  # network down, faucet dry, connection refused...
        record["status"] = "UNCHECKABLE"
        record["reason"] = f"{type(exc).__name__}: {exc}"
        write_record(record)
        print(f"UNCHECKABLE — devnet/faucet unreachable: {exc}", file=sys.stderr)
        return 3


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run-devnet", action="store_true",
                    help="run ONE CredentialCreate on XRPL devnet (throwaway faucet wallets)")
    ap.add_argument("--checklist", action="store_true",
                    help="print the mainnet ceremony checklist; executes nothing")
    args = ap.parse_args()

    if args.checklist:
        print(MAINNET_CHECKLIST.format(
            ctype_hex=CREDENTIAL_TYPE_HEX, ctype_ascii=CREDENTIAL_TYPE_ASCII,
            uri=CARD_INDEX_URL, label=STANDING_LABEL))
        return 0
    if args.dry_run_devnet:
        return dry_run_devnet()
    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
