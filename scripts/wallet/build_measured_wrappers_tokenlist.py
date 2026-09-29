#!/usr/bin/env python3
"""Build the wallet token list of measured wrappers from the PUBLISHED wrapped-asset ledger.

  public/wallet/measured-wrappers.tokenlist.json  tokenlists.org schema (Uniswap token-lists), for wallets
  public/wallet/measured-wrappers.json            the same entries at full fidelity, with the text the
                                                  token-list schema has no field for

Every state and date here is copied from public/interop/wrapped-asset-parity-latest.json, the free
public ledger. This script reads no chain and makes no new determination: it re-expresses an existing
public record in a format wallets import. A listing is not an endorsement or a recommendation.

Rules
  * one token per (chainId, address). Two ledger records on one contract are merged only when their
    states agree; otherwise the build fails rather than choose between them;
  * decimals come from the ledger's own reads, else from public/wallet/decimals-reads-*.json (a pinned,
    two-operator read). A record with no readable decimals is NOT listed and is named in not_listed[]
    with the reason; nothing is filled in;
  * addresses are EIP-55 checksummed (scripts/wallet/_keccak.py);
  * the token-list schema caps extension strings at 42 characters, so extensions.caip19 carries the
    three CAIP-19 parts and extensions.evidence is the short link /w/<ledger id>;
  * version: unchanged entries keep the file's version and timestamp (byte-identical rebuild);
    a removal bumps major, an addition minor, any other change patch (tokenlists.org semantics).

  uv run --python 3.12 scripts/wallet/build_measured_wrappers_tokenlist.py [--check]
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _keccak import checksum  # noqa: E402

REPO = pathlib.Path(__file__).resolve().parents[2]
ORIGIN = "https://councilof.ai"
LEDGER = REPO / "public/interop/wrapped-asset-parity-latest.json"
OUT_LIST = REPO / "public/wallet/measured-wrappers.tokenlist.json"
OUT_FULL = REPO / "public/wallet/measured-wrappers.json"
SCHEMA = REPO / "scripts/wallet/tokenlist.schema.json"
SCHEMA_SOURCE = "npm @uniswap/token-lists@1.0.0-beta.35 dist/tokenlist.schema.json (MIT)"

LIST_NAME = "SovX measured wrappers"
KEYWORDS = ["measured wrappers", "measurement state", "wrapped assets", "not an endorsement", "not a recommendation"]
STATE_TAG = {
    "ESCROW_PARITY_READ": "parity",
    "UNCHECKABLE_NATIVE_ISSUANCE": "native",
    "INDEXED_CUSTODIAL": "custodial",
    "UNMEASURED": "unmeasured",
}
TAGS = {
    "listed": {
        "name": "Measured wrapper",
        "description": "Listed with its current measurement state and the date of that state, from SovX wrapped asset measurements. A listing is not an endorsement or a recommendation. A state is not a rating.",
    },
    "parity": {
        "name": "Escrow parity read",
        "description": "ESCROW_PARITY_READ: the wrapped supply and the origin chain escrow balance were both read at pinned blocks. A read, not a rating.",
    },
    "native": {
        "name": "Native issuance",
        "description": "UNCHECKABLE_NATIVE_ISSUANCE: issued natively on this chain, so no escrow exists to read. Supply read, no ratio claimed.",
    },
    "custodial": {
        "name": "Indexed custodial",
        "description": "INDEXED_CUSTODIAL: reserve held by a custodian off this chain and not readable here. Supply read, no ratio claimed.",
    },
    "unmeasured": {
        "name": "Unmeasured",
        "description": "UNMEASURED: a read failed. The error is recorded and nothing is inferred.",
    },
}
DESCRIPTION = (
    "Wrapped and bridged tokens that SovX wrapped-asset measurements have read, each with its current "
    "measurement state and the date of that state. A listing is not an endorsement or a recommendation. "
    "A state is not a rating, an attestation or a statement about reserves: it records what was read at a pinned block."
)


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def caip19(chain_id: int, address: str) -> str:
    return f"eip155:{chain_id}/erc20:{address}"


def decimals_of(rec: dict) -> int | None:
    reads = rec.get("reads") or {}
    for k in ("wrapped_total_supply", "escrow_balance"):
        v = (reads.get(k) or {}).get("decimals")
        if v is not None:
            return int(v)
    return None


def latest_decimals_reads() -> tuple[dict, pathlib.Path | None]:
    files = sorted((REPO / "public/wallet").glob("decimals-reads-*.json"))
    if not files:
        return {}, None
    doc = json.loads(files[-1].read_text())
    return {r["id"]: r for r in doc["reads"]}, files[-1]


def build() -> tuple[dict, dict]:
    ledger_bytes = LEDGER.read_bytes()
    ledger = json.loads(ledger_bytes)
    dated = REPO / f"public/interop/wrapped-asset-parity-{ledger['as_of'][:10]}.json"
    if not dated.exists() or dated.read_bytes() != ledger_bytes:
        raise SystemExit(f"{dated.relative_to(REPO)} must exist with the same bytes as the latest ledger")
    dated_url = f"{ORIGIN}/{dated.relative_to(REPO / 'public').as_posix()}"
    reads, reads_path = latest_decimals_reads()
    reads_url = f"{ORIGIN}/{reads_path.relative_to(REPO / 'public').as_posix()}" if reads_path else None

    groups: dict[tuple[int, str], list[dict]] = {}
    not_listed = []
    for rec in ledger["records"]:
        w = rec["wrapped"]
        key = (int(w["chainId"]), w["address"].lower())
        dec = decimals_of(rec)
        extra = reads.get(rec["id"], {})
        if dec is None and "read" in extra:
            dec = int(extra["read"]["value"])
        if dec is None:
            not_listed.append({
                "id": rec["id"],
                "caip19": caip19(key[0], checksum(w["address"])),
                "ledger_state": rec["state"],
                "reason": extra.get("finding") or extra.get("error") or "decimals not read; a token list cannot name a token without them",
                "evidence": reads_url,
            })
            continue
        groups.setdefault(key, []).append({**rec, "_decimals": dec})

    tokens, full = [], []
    for (chain_id, _), recs in sorted(groups.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        states = {r["state"] for r in recs}
        if len(states) != 1:
            raise SystemExit(f"records {[r['id'] for r in recs]} share a contract but disagree on state {sorted(states)}")
        decs = {r["_decimals"] for r in recs}
        if len(decs) != 1:
            raise SystemExit(f"records {[r['id'] for r in recs]} share a contract but disagree on decimals {sorted(decs)}")
        state = states.pop()
        address = checksum(recs[0]["wrapped"]["address"])
        ids = [r["id"] for r in recs]
        symbols = list(dict.fromkeys(r["wrapped"]["symbol"] for r in recs))
        symbol = "/".join(symbols)
        chain = recs[0]["wrapped"]["chain"]
        records = " ".join(ids)
        evidence = f"{ORIGIN}/w/{ids[0]}"
        for s in (records, evidence, state, ledger["as_of"]):
            if len(s) > 42:
                raise SystemExit(f"extension value over the schema's 42-character cap: {s}")
        tokens.append({
            "chainId": chain_id,
            "address": address,
            "name": f"{symbol} on {chain}",
            "symbol": symbol,
            "decimals": decs.pop(),
            "tags": ["listed", STATE_TAG[state]],
            "extensions": {
                "state": state,
                "as_of": ledger["as_of"],
                "evidence": evidence,
                "caip19": {"chain_id": f"eip155:{chain_id}", "asset_namespace": "erc20", "asset_reference": address},
                "records": records,
            },
        })
        c19 = caip19(chain_id, address)
        full.append({
            "caip19": c19,
            "chainId": chain_id,
            "chain": chain,
            "address": address,
            "symbol": symbol,
            "decimals": tokens[-1]["decimals"],
            "state": state,
            "as_of": ledger["as_of"],
            "records": ids,
            "evidence": evidence,
            "ledger": dated_url,
            "live_preview": f"{ORIGIN}/api/wrapper/caip19/{c19}",
        })

    token_list = {
        "name": LIST_NAME,
        "timestamp": None,  # set by main(): kept when entries are unchanged
        "version": None,
        "keywords": KEYWORDS,
        "tags": TAGS,
        "tokens": tokens,
    }
    companion = {
        "schema": "csoai.wallet-measured-wrappers/0.1",
        "name": "SovX wrapped-asset measurements: measured wrappers",
        "description": DESCRIPTION,
        "token_list": f"{ORIGIN}/wallet/measured-wrappers.tokenlist.json",
        "token_list_sha256": None,
        "token_list_schema": {"source": SCHEMA_SOURCE, "sha256": sha256_bytes(SCHEMA.read_bytes())},
        "extension_note": "The token-list schema caps extension strings at 42 characters, so extensions.caip19 carries the three CAIP-19 parts (chain_id, asset_namespace, asset_reference) and extensions.evidence is a short link to the ledger record. The full CAIP-19 strings and URLs are here.",
        "source_ledger": {"url": dated_url, "latest": f"{ORIGIN}/interop/wrapped-asset-parity-latest.json", "as_of": ledger["as_of"], "sha256": sha256_bytes(ledger_bytes), "license": ledger.get("license")},
        "state_definitions": ledger["states"],
        "counts": {"listed": len(tokens), "ledger_records": len(ledger["records"]), "not_listed": len(not_listed)},
        "tokens": full,
        "not_listed": not_listed,
        "producer": "scripts/wallet/build_measured_wrappers_tokenlist.py",
        "license": ledger.get("license"),
    }
    return token_list, companion


def next_version(old: dict | None, new_tokens: list) -> tuple[dict, bool]:
    if not old:
        return {"major": 1, "minor": 0, "patch": 0}, True
    if old["tokens"] == new_tokens and old.get("tags") == TAGS and old.get("keywords") == KEYWORDS and old.get("name") == LIST_NAME:
        return old["version"], False
    v = dict(old["version"])
    key = lambda t: (t["chainId"], t["address"].lower())  # noqa: E731
    before, after = {key(t) for t in old["tokens"]}, {key(t) for t in new_tokens}
    if before - after:
        v = {"major": v["major"] + 1, "minor": 0, "patch": 0}
    elif after - before:
        v = {"major": v["major"], "minor": v["minor"] + 1, "patch": 0}
    else:
        v = {**v, "patch": v["patch"] + 1}
    return v, True


def render(obj: dict) -> bytes:
    return (json.dumps(obj, indent=2, ensure_ascii=False) + "\n").encode()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="fail if the committed files differ from a rebuild")
    a = ap.parse_args()
    token_list, companion = build()
    old = json.loads(OUT_LIST.read_text()) if OUT_LIST.exists() else None
    version, changed = next_version(old, token_list["tokens"])
    token_list["version"] = version
    token_list["timestamp"] = old["timestamp"] if (old and not changed) else dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    list_bytes = render(token_list)
    companion["token_list_sha256"] = sha256_bytes(list_bytes)
    companion["token_list_version"] = f"{version['major']}.{version['minor']}.{version['patch']}"
    companion["timestamp"] = token_list["timestamp"]
    full_bytes = render(companion)
    if a.check:
        bad = [p.relative_to(REPO).as_posix() for p, b in ((OUT_LIST, list_bytes), (OUT_FULL, full_bytes)) if not p.exists() or p.read_bytes() != b]
        if bad:
            print("stale, rebuild with scripts/wallet/build_measured_wrappers_tokenlist.py:", bad)
            return 1
        print("token list up to date:", companion["token_list_version"], companion["counts"])
        return 0
    OUT_LIST.parent.mkdir(parents=True, exist_ok=True)
    OUT_LIST.write_bytes(list_bytes)
    OUT_FULL.write_bytes(full_bytes)
    print(OUT_LIST.relative_to(REPO), companion["token_list_version"], companion["counts"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
