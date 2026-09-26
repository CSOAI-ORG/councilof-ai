#!/usr/bin/env python3
"""Cross-ledger supply for tokenised funds and deposit tokens — the USDC pilot generalised.

Schema `csoai.cross-ledger-supply/0.2` (same family as the USDC pilot's 0.1: evidence ladder,
sums per evidence kind only, camt.053-shaped rows). What changed from 0.1:
  * asset -> {issuer list, per-ledger adapter} is DATA (scripts/readers/cross_ledger_assets.json),
    not code. Every deployment identifier is parsed out of the issuer page's bytes at run time.
  * rows carry a `product`: one issuer page can list several instruments (Franklin's page lists
    BENJI, iBENJI, gBENJI, sgBENJI, grBENJI). Sums are per product AND per evidence kind; products
    are never added together.
  * every EVM deployment gets the Ethereum treatment: the totalSupply storage slot is found
    empirically over a declared candidate set, proven with eth_getProof and verified here against
    the stateRoot of the pinned block; the block hash is recomputed from the header fields. A proof
    that verifies against a stateRoot whose header hash cannot be recomputed here (chain-specific
    header format) is STATE_PROOF_RECORDED, not VERIFIED.
  * an `issuer_reported` block holds the issuer's own figure (e.g. the fund's SEC N-MFP3) beside —
    never merged with — the measured supply, and a `reconciliation` block says which record
    controls and that it has not been reconciled.
  * issuer-list states: READ, ISSUER_LIST_UNAVAILABLE (no issuer-published list found; nothing
    read, explorers are not issuer lists), PERMISSIONED_NOT_READABLE (the issuer itself says the
    token lives on a private/permissioned ledger), UNCHECKABLE (the page could not be fetched).

What an on-chain supply read is NOT: AUM, NAV, ownership, redeemability, fund compliance,
settlement finality, reserves or backing. It must be reconciled against the controlling
fund/transfer-agent (or bank) record, and until that exists the record says
UNRECONCILED_WITH_TRANSFER_AGENT (or the bank-ledger equivalent).

Stdlib only (+ the pilot reader's helpers). Never raises out of a reader: a failure is an
UNCHECKABLE row carrying its error.

Usage (repo root):
  python3 scripts/readers/cross_ledger_funds.py --asset benji --date 2026-09-25 \
      --out public/interop/cross-ledger-benji-2026-09-25.json \
      --proof-dir public/interop/cross-ledger-benji-2026-09-25
"""
from __future__ import annotations

import html as htmllib
import json
import re
import sys
import urllib.error
import urllib.request
from decimal import Decimal
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))
from scripts.readers import cross_ledger_supply as base  # noqa: E402  the USDC pilot's adapters/verifiers
from scripts.adapters.evm_permission_events import keccak256  # noqa: E402

SCHEMA = "csoai.cross-ledger-supply/0.2"
REGISTRY = HERE / "cross_ledger_assets.json"
PAGE_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 "
           "csoai-cross-ledger (+https://councilof.ai)")
SEC_UA = "CSOAI measurement nicholas@csoai.org"

EVIDENCE_KINDS = dict(base.EVIDENCE_KINDS)
EVIDENCE_KINDS["STATE_PROOF_VERIFIED"] = (
    "A Merkle proof returned by the node was verified by this reader against the stateRoot of a block "
    "header whose hash this reader recomputed from the header fields (EIP-1186), and the proven value "
    "equals the plain eth_call answer. The header itself is not checked against consensus (no light "
    "client); on an L2 it is the L2's header and nothing here checks it against L1 settlement. A "
    "second operator's copy of the same block is compared and recorded.")
EVIDENCE_KINDS["STATE_PROOF_RECORDED"] = (
    "A proof was returned and its bytes kept, but it was not fully verified here — either it failed, or "
    "it verified against a stateRoot whose block hash could not be recomputed from the returned header "
    "fields (chain-specific header format), so the stateRoot is not bound to the block hash here. "
    "The reason is in the row.")
EVIDENCE_KINDS["REJECTED"] = (
    "The endpoint answered but the on-ledger identity (symbol / asset code / metadata symbol) is not the "
    "product ticker the issuer page names for that deployment; no supply is recorded against the product.")

NOT_EVIDENCE_OF = [
    "AUM, NAV, ownership, redeemability, fund compliance",
    "settlement finality, reserves, backing, or the value of anything",
    "the fund's or bank's controlling record (transfer-agent register / deposit ledger) — not read, not reconciled",
    "circulating or investor-held supply (issued supply only; no holder, treasury or module balance is excluded)",
    "that one ledger's token is interchangeable with another's — only what each ledger's state says",
    "any relationship between CSOAI and the issuer: target is not client, public evidence is not private connectivity",
]


# ----------------------------------------------------------------------------- page fetch
def fetch_page(url: str, ua: str = PAGE_UA, timeout: int = 40) -> dict:
    """GET a public page. Returns status, final URL, bytes, sha256. Never raises."""
    out: dict[str, Any] = {"url": url, "fetched_at": base.now_iso()}
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "text/html,application/xhtml+xml,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read()
            out.update({"http_status": r.status, "final_url": r.geturl()})
    except urllib.error.HTTPError as e:
        b = e.read() if hasattr(e, "read") else b""
        out.update({"http_status": e.code, "final_url": url})
    except Exception as e:  # DNS, TLS, timeout
        b = b""
        out.update({"http_status": None, "error": f"{type(e).__name__}: {str(e)[:160]}"})
    out.update({"sha256": base.sha256_hex(b), "bytes": len(b), "_body": b})
    return out


def page_lines(b: bytes) -> list[str]:
    t = b.decode("utf-8", "replace")
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", t, flags=re.S | re.I)
    t = htmllib.unescape(re.sub(r"<[^>]+>", "\n", t))
    return [re.sub(r"\s+", " ", ln).strip() for ln in t.splitlines() if ln.strip()]


def page_text(b: bytes) -> str:
    return " ".join(page_lines(b))


def public(ev: dict) -> dict:
    return {k: v for k, v in ev.items() if not k.startswith("_")}


# ----------------------------------------------------------------------------- issuer-list parsers
def parse_labelled_role_blocks(lines: list[str], header_regex: str, token_role: str) -> list[dict]:
    """Franklin-style page: a header 'BENJI (Polygon)' followed by role/identifier pairs
    ('Fund Token' / '0x…', 'Registry Module' / '0x…', …) until the next header."""
    hre = re.compile(header_regex)
    out: list[dict] = []
    cur = None
    i = 0
    while i < len(lines):
        m = hre.match(lines[i])
        if m:
            cur = {"product": m.group("product"), "label": m.group("label"), "header_line": lines[i],
                   "identifier": None, "modules": {}}
            out.append(cur)
            i += 1
            continue
        if cur is not None and i + 1 < len(lines) and re.fullmatch(r"[A-Za-z0-9]{20,70}", lines[i + 1]) \
                and not hre.match(lines[i + 1]):
            role, ident = lines[i], lines[i + 1]
            if role == token_role and cur["identifier"] is None:
                cur["identifier"] = ident
            else:
                cur["modules"][role] = ident
            i += 2
            continue
        if cur is not None and cur["identifier"] is not None and not re.fullmatch(r"[A-Za-z0-9 ]{3,60}", lines[i]):
            cur = None  # prose: the block ended
        i += 1
    return [r for r in out if r["identifier"]]


def parse_html_regex(b: bytes, regex: str, product: str) -> list[dict]:
    t = b.decode("utf-8", "replace")
    return [{"product": product, "label": m.group("label"), "identifier": m.group("identifier"),
             "matched_markup_sha256": base.sha256_hex(m.group(0).encode()), "modules": {}}
            for m in re.finditer(regex, t)]


def read_issuer_list(spec: dict) -> dict:
    il = spec["issuer_list"]
    p = il["parser"]
    if p == "none_found":
        tried = []
        for t in il["tried"]:
            ev = fetch_page(t["url"])
            body = ev.pop("_body")
            found = sorted(set(re.findall(r"0x[0-9a-fA-F]{40}", body.decode("utf-8", "replace"))))
            ev.update({"expected": t["expect"], "evm_addresses_in_bytes": len(found)})
            if body and b'<div id="root"></div>' in body:
                ev["note"] = "client-rendered shell: the served HTML has an empty #root and no data"
            tried.append(ev)
        return {"state": il["state_if_nothing"], "tried": tried, "note": il.get("note"), "rows": []}
    ev = fetch_page(il["url"])
    body = ev.pop("_body")
    out: dict[str, Any] = {"page": il["url"], **ev, "parser": p}
    if ev.get("http_status") != 200 or not body:
        out.update({"state": "UNCHECKABLE", "rows": []})
        return out
    if p == "permissioned_statement":
        txt = page_text(body)
        hit = il["must_contain"] in txt
        out.update({"state": "PERMISSIONED_NOT_READABLE" if hit else "UNCHECKABLE",
                    "issuer_sentence_found": hit, "issuer_sentence": il["must_contain"], "rows": []})
        if hit:
            i = txt.find(il["must_contain"])
            out["issuer_sentence_context"] = txt[max(0, txt.rfind(".", 0, i) + 1):txt.find(".", i + len(il["must_contain"])) + 1].strip()
        else:
            out["note"] = "the sentence the registry expects was not found in the page bytes; state is UNCHECKABLE, not permissioned"
        return out
    if p == "labelled_role_blocks":
        rows = parse_labelled_role_blocks(page_lines(body), il["header_regex"], il["token_role"])
        out["method"] = ("server-rendered HTML; tags stripped to lines; each '<PRODUCT> (<Ledger>)' header "
                         f"followed by role/identifier pairs; the '{il['token_role']}' identifier is the deployment")
    elif p == "html_regex":
        rows = parse_html_regex(body, il["regex"], il["product"])
        out["method"] = "regex over the raw HTML bytes (named groups label, identifier); the pattern is in the registry"
    else:
        raise ValueError(f"unknown parser {p}")
    txt = body.decode("utf-8", "replace")
    for r in rows:
        r["in_page_bytes"] = r["identifier"] in txt
    if il.get("ticker_confirmation"):
        tc = il["ticker_confirmation"]
        e2 = fetch_page(tc["url"])
        b2 = e2.pop("_body")
        e2.update({"must_contain": tc["must_contain"], "found": tc["must_contain"].encode() in b2})
        out["ticker_confirmation"] = e2
    out.update({"state": "READ" if rows else "UNCHECKABLE", "deployments_parsed": len(rows), "rows": rows})
    return out


# ----------------------------------------------------------------------------- EVM (generalised)
def erc7201_slot(namespace: str) -> int:
    h = int.from_bytes(keccak256(namespace.encode()), "big") - 1
    return int.from_bytes(keccak256(h.to_bytes(32, "big")), "big") & ~0xFF


def slot_candidates(cfg: dict) -> list[tuple[int, str]]:
    lo, hi = cfg["linear"]
    out = [(s, str(s)) for s in range(lo, hi + 1)]
    for ns, offs in cfg.get("erc7201_namespaces", {}).items():
        b = erc7201_slot(ns)
        out += [(b + o, f"erc7201({ns})+{o}") for o in offs]
    return out


def new_row(ledger: str, product: str, label: str, ident: str) -> dict:
    return {"ledger": ledger, "product": product, "issuer_label": label, "deployment_id": ident,
            "supply_base_units": None, "decimals": None, "supply_decimal": None, "observed_at": base.now_iso(),
            "height": None, "endpoint": None, "operator": None, "response_sha256": None,
            "evidence_kind": "UNCHECKABLE", "two_operators_agree": "NOT_TRIED", "second_read": None,
            "identity": {}, "proof": None, "notes": []}


def _pin_block(c: base.Client, url: str, lcfg: dict) -> tuple[dict, str]:
    if lcfg.get("pin") == "finalized":
        blk, _ = c.rpc(url, "eth_getBlockByNumber", ["finalized", False])
        return blk, "block (finalized tag)"
    latest, _ = c.rpc(url, "eth_blockNumber", [])
    blk, _ = c.rpc(url, "eth_getBlockByNumber", [hex(int(latest, 16) - lcfg.get("pin_lag", 6)), False])
    return blk, f"block (latest minus {lcfg.get('pin_lag', 6)} at read time, then pinned)"


def read_evm(c: base.Client, lcfg: dict, slots: list[tuple[int, str]], ledger: str, product: str,
             label: str, addr: str) -> tuple[dict, dict | None]:
    """Two blocks. Block A (discovery): identity + the empirical slot search over the declared
    candidate set. Block B (the reading, pinned fresh so it is inside every operator's proof window):
    totalSupply(), the found slot re-read, eth_getProof (primary, then the other operators — a proof
    from any operator is verified against block B's stateRoot), second-operator comparison."""
    row = new_row(ledger, product, label, addr)
    ops = lcfg["rpc"]
    (url, op) = ops[0]
    row.update({"endpoint": url, "operator": op})
    blob = None
    try:
        cid, _ = c.rpc(url, "eth_chainId", [])
        if int(cid, 16) != lcfg["chain_id"]:
            raise base.ReadError(f"eth_chainId {int(cid, 16)} != expected {lcfg['chain_id']}", 200)
        blk_a, _ = _pin_block(c, url, lcfg)
        a_hex = blk_a["number"]
        ident = {}
        for k in ("symbol", "name", "decimals"):
            r, _ = c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL[k]}, a_hex])
            ident[k] = int(r, 16) if k == "decimals" else base._abi_str(r)
        row["identity"] = ident
        sup_a = int(c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["totalSupply"]}, a_hex])[0], 16)
        if ident["symbol"] != product:
            base.set_supply(row, sup_a, ident["decimals"])
            row["height"] = {"kind": "discovery block", "number": int(a_hex, 16), "hash": blk_a["hash"]}
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"symbol() returned {ident['symbol']!r}, not {product!r} as the issuer page labels it")
            return row, None
        matches = []
        for s, name in slots:
            v, _ = c.rpc(url, "eth_getStorageAt", [addr, hex(s), a_hex])
            if int(v, 16) == sup_a:
                matches.append((s, name))
        linear = [n for _, n in slots if n.isdigit()]
        row["slot_search"] = {"block": int(a_hex, 16), "n_candidates": len(slots),
                              "candidate_set": [f"{linear[0]}..{linear[-1]}"] + [n for _, n in slots if not n.isdigit()],
                              "matching": [n for _, n in matches],
                              "method": "eth_getStorageAt at the discovery block for every candidate, compared to eth_call totalSupply() at that block"}
        # block B: the reading
        blk, kind = _pin_block(c, url, lcfg)
        n_hex, bhash = blk["number"], blk["hash"]
        row["height"] = {"kind": kind, "number": int(n_hex, 16), "hash": bhash, "state_root": blk["stateRoot"],
                         "timestamp": int(blk["timestamp"], 16), "chain_id": lcfg["chain_id"]}
        try:
            row["height"]["header_hash_recomputed"] = ("0x" + base.header_hash(blk).hex()) == bhash.lower()
        except Exception as e:
            row["height"]["header_hash_recomputed"] = False
            row["height"]["header_hash_error"] = str(e)[:120]
        ts_hex, ts_sha = c.rpc(url, "eth_call", [{"to": addr, "data": base.SEL["totalSupply"]}, n_hex])
        supply = int(ts_hex, 16)
        row["response_sha256"] = ts_sha
        base.set_supply(row, supply, ident["decimals"])
        row["evidence_kind"] = "OPERATOR_API"
        if len(matches) != 1:
            row["notes"].append(f"slot search found {len(matches)} matching candidates; no proof attempted -> OPERATOR_API")
        else:
            slot, sname = matches[0]
            sv, _ = c.rpc(url, "eth_getStorageAt", [addr, hex(slot), n_hex])
            pr, pr_sha, pop, perr = None, None, None, []
            if int(sv, 16) != supply:
                row["notes"].append(f"slot {sname} at the reading block != totalSupply(); no proof attempted -> OPERATOR_API")
            else:
                for purl, pname in ops:
                    try:
                        pr, pr_sha = c.rpc(purl, "eth_getProof", [addr, [hex(slot)], n_hex])
                        pop = (purl, pname)
                        break
                    except base.ReadError as e:
                        perr.append({"endpoint": purl, "operator": pname, "error": str(e)[:160]})
            if pr is None and perr:
                row["notes"].append(f"eth_getProof failed at every operator tried -> OPERATOR_API: {perr}")
            if pr is not None:
                v = base.verify_eip1186(blk["stateRoot"], addr, pr, slot)
                blob = {"kind": "csoai.eip1186-proof/0.1", "ledger": ledger, "chain_id": lcfg["chain_id"], "product": product,
                        "address": addr, "slot": hex(slot), "slot_name": sname, "block_number": int(n_hex, 16),
                        "block_hash": bhash, "state_root": blk["stateRoot"], "header_endpoint": url, "proof_endpoint": pop[0],
                        "header": {k: blk[k] for k, _ in base.HEADER_FIELDS if k in blk} | {"hash": bhash},
                        "header_hash_recomputed_by_reader": row["height"]["header_hash_recomputed"],
                        "how_to_check": ("keccak(rlp(header fields)) must equal block_hash; walk accountProof from "
                                         "state_root along keccak(address); the account's storageRoot must equal "
                                         "storageHash; walk storageProof along keccak(uint256(slot)); the leaf is "
                                         "rlp(totalSupply)."),
                        "response": pr}
                row["proof"] = {"type": "EIP-1186 eth_getProof", "slot": hex(slot), "slot_name": sname,
                                "proof_endpoint": pop[0], "proof_operator": pop[1], "failed_before": perr,
                                "response_sha256": pr_sha, "account_proof_nodes": len(pr.get("accountProof") or []),
                                "storage_proof_nodes": len(pr["storageProof"][0]["proof"]) if pr.get("storageProof") else 0,
                                **v, "eth_call_value": supply}
                ok = v["account_proof_verified"] and v["storage_proof_verified"] and v["proven_value"] == supply
                if ok and row["height"]["header_hash_recomputed"]:
                    row["evidence_kind"] = "STATE_PROOF_VERIFIED"
                    row["notes"].append(f"slot {sname} found empirically (the only one of {len(slots)} candidates equal to "
                                        "totalSupply()); account proof verified against stateRoot, storage proof against "
                                        "storageRoot, proven value == eth_call totalSupply(); block hash recomputed from header")
                elif ok:
                    row["evidence_kind"] = "STATE_PROOF_RECORDED"
                    row["notes"].append("proof verifies against the returned stateRoot, but the block hash could not be "
                                        "recomputed from the returned header fields (chain-specific header format), so "
                                        "the stateRoot is not bound to the block hash here -> not VERIFIED")
                else:
                    row["evidence_kind"] = "STATE_PROOF_RECORDED"
                    row["notes"].append(f"proof did not verify: {v.get('error') or 'proven value != eth_call'}")
        if lcfg.get("observed"):
            row["notes"].append("ledger note from the registry: " + lcfg["observed"])
        if lcfg.get("l2"):
            row["notes"].append("L2: the header is the L2's own; nothing here checks it against L1 settlement or a fault/validity proof")
        tried = []
        for url2, op2 in ops[1:]:
            try:
                b2, _ = c.rpc(url2, "eth_getBlockByNumber", [n_hex, False])
                t2, t2sha = c.rpc(url2, "eth_call", [{"to": addr, "data": base.SEL["totalSupply"]}, n_hex])
                if b2 is None:
                    raise base.ReadError("block not served", 200)
            except (base.ReadError, KeyError, TypeError, ValueError) as e:
                tried.append({"endpoint": url2, "operator": op2, "error": str(e)[:160]})
                continue
            same_hash = b2["hash"].lower() == bhash.lower()
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "block_hash": b2["hash"],
                                  "same_block_hash": same_hash, "state_root_matches": b2["stateRoot"] == blk["stateRoot"],
                                  "supply_base_units": str(int(t2, 16)), "response_sha256": t2sha, "failed_before": tried}
            row["two_operators_agree"] = "true" if (same_hash and int(t2, 16) == supply) else "false"
            break
        else:
            row["second_read"] = {"all_failed": tried}
    except (base.ReadError, KeyError, TypeError, ValueError) as e:
        return base.fail(row, e, ledger), None
    return row, blob


# ----------------------------------------------------------------------------- Stellar (issuer account)
def _stellar_issuer_assets(c: base.Client, url: str, issuer: str) -> dict:
    root, _ = c.json(url + "/")
    j, sha = c.json(f"{url}/assets?asset_issuer={issuer}&limit=200")
    recs = j["_embedded"]["records"]
    return {"root": root, "records": recs, "sha": sha}


def read_stellar_issuer(c: base.Client, lcfg: dict, product: str, label: str, issuer: str) -> dict:
    row = new_row("stellar", product, label, issuer)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})
    try:
        r = _stellar_issuer_assets(c, url, issuer)
        mine = [x for x in r["records"] if x["asset_code"] == product]
        others = [{"asset_code": x["asset_code"], "supply_decimal": format(base.stellar_total(x)[0], "f"),
                   "accounts_authorized": (x.get("accounts") or {}).get("authorized")}
                  for x in r["records"] if x["asset_code"] != product]
        row["other_asset_codes_under_issuer"] = others
        if len(mine) != 1:
            row["evidence_kind"] = "REJECTED" if not mine else "UNCHECKABLE"
            row["notes"].append(f"{len(mine)} Horizon asset records with code == {product!r} under this issuer")
            return row
        total, parts = base.stellar_total(mine[0])
        units = total * (10 ** 7)
        if units != int(units):
            raise base.ReadError("Stellar amount has more than 7 decimal places", 200)
        base.set_supply(row, int(units), 7)
        row.update({"response_sha256": r["sha"], "evidence_kind": "OPERATOR_API", "supply_components": parts,
                    "height": {"kind": "ledger (Horizon history_latest_ledger read just before /assets)",
                               "number": int(r["root"]["history_latest_ledger"]),
                               "closed_at": r["root"].get("history_latest_ledger_closed_at")}})
        row["identity"] = {"asset_code": product, "asset_issuer": issuer, "decimals": "7 (Stellar protocol fixed precision)",
                           "contract_id": mine[0].get("contract_id"),
                           "accounts_authorized": (mine[0].get("accounts") or {}).get("authorized"),
                           "rule": "the asset code is the product ticker in the issuer page's header for this deployment; "
                                   "the page lists the issuer account, not the code"}
        row["notes"].append("supply = Horizon balances (authorized + authorized_to_maintain_liabilities + unauthorized) + "
                            "claimable balances + liquidity pools + Soroban contract balances; components kept")
        try:
            r2 = _stellar_issuer_assets(c, url2, issuer)
            m2 = [x for x in r2["records"] if x["asset_code"] == product]
            t2 = base.stellar_total(m2[0])[0] if len(m2) == 1 else None
            l1, l2 = int(r["root"]["history_latest_ledger"]), int(r2["root"]["history_latest_ledger"])
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "ledger": l2,
                                  "supply_decimal": format(t2, "f") if t2 is not None else None, "response_sha256": r2["sha"]}
            row["two_operators_agree"] = ("true" if t2 == total else ("false" if l1 == l2 else "NOT_COMPARABLE"))
        except (base.ReadError, KeyError, TypeError, ValueError, IndexError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (base.ReadError, KeyError, TypeError, ValueError) as e:
        return base.fail(row, e, "stellar")
    return row


# ----------------------------------------------------------------------------- Solana (SPL / Token-2022 mint)
def read_solana_mint(c: base.Client, lcfg: dict, product: str, label: str, mint: str) -> dict:
    row = new_row("solana", product, label, mint)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})
    try:
        amt, dec, slot, sha = base._sol_supply(c, url, mint)
        base.set_supply(row, amt, dec)
        row.update({"response_sha256": sha, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "slot (context.slot, commitment=finalized)", "number": slot}})
        acct, _ = c.rpc(url, "getAccountInfo", [mint, {"encoding": "jsonParsed", "commitment": "finalized"}])
        v = (acct or {}).get("value") or {}
        info = ((v.get("data") or {}).get("parsed") or {}).get("info") or {}
        md = next((e.get("state") for e in info.get("extensions", []) if e.get("extension") == "tokenMetadata"), None) or {}
        row["identity"] = {"program": (v.get("data") or {}).get("program"), "decimals": info.get("decimals"),
                           "metadata_symbol": md.get("symbol"), "metadata_name": md.get("name"),
                           "extensions": [e.get("extension") for e in info.get("extensions", [])]}
        if md and md.get("symbol") != product:
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"Token-2022 metadata symbol {md.get('symbol')!r} != {product!r}")
            return row
        if not md:
            row["notes"].append("no on-mint metadata; identification rests on the issuer page")
        try:
            a2, d2, s2, sha2 = base._sol_supply(c, url2, mint)
            row["second_read"] = {"endpoint": url2.split("?")[0], "operator": op2, "independent": True,
                                  "supply_base_units": str(a2), "slot": s2, "response_sha256": sha2}
            row["two_operators_agree"] = "true" if a2 == amt else ("false" if s2 == slot else "NOT_COMPARABLE")
        except (base.ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": url2.split("?")[0], "operator": op2, "error": str(e)[:160]}
    except (base.ReadError, KeyError, TypeError, ValueError) as e:
        return base.fail(row, e, "solana")
    return row


# ----------------------------------------------------------------------------- Aptos (fungible asset)
def _aptos_supply(c: base.Client, url: str, meta: str, version: int) -> tuple[int, str]:
    j, sha = c.json(f"{url}/view?ledger_version={version}",
                    {"function": "0x1::fungible_asset::supply", "type_arguments": ["0x1::fungible_asset::Metadata"],
                     "arguments": [meta]})
    vec = j[0]["vec"]
    if len(vec) != 1:
        raise base.ReadError("supply is Option::none (unlimited, untracked)", 200)
    return int(vec[0]), sha


def read_aptos_fa(c: base.Client, lcfg: dict, product: str, label: str, meta: str) -> dict:
    row = new_row("aptos", product, label, meta)
    (url, op), (url2, op2) = lcfg["rpc"][0], lcfg["rpc"][1]
    row.update({"endpoint": url, "operator": op})
    try:
        info, _ = c.json(url + "/")
        ver = int(info["ledger_version"])
        md, _ = c.json(f"{url}/accounts/{meta}/resource/0x1::fungible_asset::Metadata?ledger_version={ver}")
        d = md["data"]
        row["identity"] = {"symbol": d.get("symbol"), "name": d.get("name"), "decimals": int(d["decimals"]),
                           "resource": "0x1::fungible_asset::Metadata"}
        amt, sha = _aptos_supply(c, url, meta, ver)
        base.set_supply(row, amt, int(d["decimals"]))
        row.update({"response_sha256": sha, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "ledger_version (pinned via ?ledger_version=)", "number": ver,
                               "chain_id": info.get("chain_id"), "ledger_timestamp_us": info.get("ledger_timestamp"),
                               "block_height": info.get("block_height")}})
        if d.get("symbol") != product:
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"Metadata.symbol {d.get('symbol')!r} != {product!r}")
            return row
        row["notes"].append("0x1::fungible_asset::supply view at a pinned ledger_version. Aptos fullnodes can serve "
                            "state proofs against a signed ledger info; this reader does not verify them -> OPERATOR_API")
        try:
            a2, sha2 = _aptos_supply(c, url2, meta, ver)
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "ledger_version": ver,
                                  "supply_base_units": str(a2), "response_sha256": sha2}
            row["two_operators_agree"] = "true" if a2 == amt else "false"
        except (base.ReadError, KeyError, TypeError, ValueError, IndexError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (base.ReadError, KeyError, TypeError, ValueError, IndexError) as e:
        return base.fail(row, e, "aptos")
    return row


# ----------------------------------------------------------------------------- issuer-reported (SEC N-MFP3)
def read_nmfp3(ir: dict) -> dict:
    out: dict[str, Any] = {"kind": ir["kind"], "why": ir["why"], "applies_to_product": ir["applies_to_product"],
                           "is": "the issuer's own statement (a claim), kept apart from measured supply; never summed with it"}
    cik = ir["cik"].zfill(10)
    sub = fetch_page(f"https://data.sec.gov/submissions/CIK{cik}.json", ua=SEC_UA)
    b = sub.pop("_body")
    out["submissions_index"] = sub
    try:
        j = json.loads(b)
        rec = j["filings"]["recent"]
        i = next(k for k, f in enumerate(rec["form"]) if f in ("N-MFP3", "N-MFP3/A"))
        acc = rec["accessionNumber"][i]
        doc = f"https://www.sec.gov/Archives/edgar/data/{int(ir['cik'])}/{acc.replace('-', '')}/primary_doc.xml"
        f = fetch_page(doc, ua=SEC_UA)
        xb = f.pop("_body")
        x = xb.decode("utf-8", "replace")

        def g(tag: str) -> str | None:
            m = re.search(r"<%s>([^<]*)</%s>" % (tag, tag), x)
            return m.group(1) if m else None
        ta = re.search(r"<transferAgent>\s*<name>([^<]*)</name>", x)
        if g("seriesId") != ir["series_id"]:
            raise ValueError(f"series {g('seriesId')} != {ir['series_id']}")
        out.update({"state": "READ", "registrant": j.get("name"), "form": rec["form"][i], "accession": acc,
                    "filing_date": rec["filingDate"][i], "report_date": g("reportDate"), "document": f,
                    "series_id": g("seriesId"), "series_name": g("nameOfSeries"),
                    "net_assets_of_series_usd": g("netAssetOfSeries"),
                    "shares_outstanding": g("numberOfSharesOutstanding"),
                    "total_share_classes": g("totalShareClassesInSeries"),
                    "transfer_agent_named_in_filing": ta.group(1) if ta else None,
                    "note": ("Month-end figures the fund reports to the SEC. A share count is not a ledger supply; "
                             "the report date is not the on-chain read date. Not compared: see comparison.")})
    except (ValueError, KeyError, StopIteration, TypeError) as e:
        out.update({"state": "UNCHECKABLE", "error": f"{type(e).__name__}: {str(e)[:160]}"})
    return out


# ----------------------------------------------------------------------------- assembly
def sum_by_product_kind(rows: list[dict]) -> dict:
    out: dict[str, dict] = {}
    for r in rows:
        p = out.setdefault(r["product"], {})
        e = p.setdefault(r["evidence_kind"], {"n_rows": 0, "ledgers": [], "sum_decimal": None})
        e["n_rows"] += 1
        e["ledgers"].append(r["ledger"])
        if r["evidence_kind"] in ("UNCHECKABLE", "REJECTED") or r.get("supply_decimal") is None:
            e["why_no_sum"] = "no supply recorded against the product for these rows"
            continue
        e["sum_decimal"] = format(Decimal(e["sum_decimal"] or 0) + Decimal(r["supply_decimal"]), "f")
    return out


def camt053_shape(rows: list[dict], date: str) -> dict:
    return {
        "what_this_is": ("A field mapping only: each per-ledger read laid out in the shape of an ISO 20022 camt.053 "
                         "(BankToCustomerStatement) closing-balance row, the shape a reconciliation reads. No "
                         "conformance is claimed; no message is produced or validated against the XSD."),
        "field_map": {
            "Stmt/Acct/Id/Othr/Id": "deployment_id (as the issuer page lists it)",
            "Stmt/Acct/Svcr": "ledger (an analogy, not a role)",
            "Stmt/Bal/Tp/CdOrPrtry/Cd": "CLBD (closing booked) — here: issued supply at the recorded height",
            "Stmt/Bal/Amt": "supply_decimal (token units, not currency; not NAV)",
            "Stmt/Bal/Amt/@Ccy": "UNMAPPED — a fund share or deposit token has no ISO 4217 code here; none is chosen",
            "Stmt/Bal/Dt/DtTm": "observed_at",
            "Stmt/ElctrncSeqNb": "height.number",
            "Stmt/AddtlStmtInf": "product + evidence_kind",
            "Stmt/Ntry": "UNMAPPED — no entries are read; balance-only snapshot",
        },
        "rows": [{"Acct.Id": r["deployment_id"], "Acct.Svcr": r["ledger"], "Bal.Tp": "CLBD", "Bal.Amt": r["supply_decimal"],
                  "Bal.Ccy": None, "Bal.DtTm": r["observed_at"], "ElctrncSeqNb": (r.get("height") or {}).get("number"),
                  "AddtlStmtInf": f"{r['product']} {r['evidence_kind']}"} for r in rows if r.get("supply_decimal") is not None],
        "statement_date": date,
    }


def compare_prior(prior: dict, rows: list[dict], label_to_ledger: dict) -> dict:
    """Per-ledger differences vs the prior 9-chain BENJI pack, by name."""
    now = {r["ledger"]: r for r in rows if r["product"] == "BENJI"}
    out = []
    seen = set()
    for card in prior.get("cards", []):
        led = label_to_ledger.get(card["chain"]) or {"bnb": "bsc"}.get(card["slug"], card["slug"])
        seen.add(led)
        r = now.get(led)
        d = {"ledger": led, "prior_chain_name": card["chain"], "prior_status": card["status"],
             "prior_contract": card.get("contract"), "prior_total_supply": card.get("total_supply_benji")}
        if r is None:
            d["now"] = "NOT_ON_ISSUER_PAGE_AS_BENJI"
            if led == "bsc":
                d["now_note"] = ("the issuer page lists iBENJI (a different fund) on BNB Smart Chain, not BENJI; iBENJI is read "
                                 "as its own product in this record, never as BENJI")
        else:
            d.update({"now_contract": r["deployment_id"], "same_contract": (card.get("contract") or "").lower() == r["deployment_id"].lower(),
                      "now_supply_decimal": r["supply_decimal"], "now_evidence_kind": r["evidence_kind"],
                      "now_two_operators_agree": r["two_operators_agree"]})
            if card.get("total_supply_benji") and r.get("supply_decimal"):
                d["change_decimal"] = format(Decimal(r["supply_decimal"]) - Decimal(card["total_supply_benji"]), "f")
            d["difference_in_method"] = ("prior: one public read labelled DISCOVERED, unsigned; now: evidence-kind "
                                         "labelled read" + (" with an EIP-1186 proof" if r["evidence_kind"].startswith("STATE_PROOF") else "")
                                         + ", second operator recorded")
        out.append(d)
    for led, r in now.items():
        if led not in seen:
            out.append({"ledger": led, "prior": "ABSENT_FROM_PRIOR_PACK", "now_supply_decimal": r["supply_decimal"],
                        "now_evidence_kind": r["evidence_kind"]})
    return {"prior_as_of": prior.get("as_of"), "prior_pack": prior.get("pack"), "per_ledger": out,
            "products_on_issuer_page_not_in_prior_pack": sorted({r["product"] for r in rows if r["product"] != "BENJI"}),
            "note": "Supply changes between two dates are subscriptions/redemptions/moves on each ledger; nothing here says which."}


def build(asset_key: str, date: str, c: base.Client, proof_dir: Path | None = None,
          proof_url_prefix: str | None = None, registry: dict | None = None) -> dict:
    reg = registry or json.loads(REGISTRY.read_text())
    spec = reg["assets"][asset_key]
    started = base.now_iso()
    il = read_issuer_list(spec)
    rows: list[dict] = []
    proofs: dict[str, dict] = {}
    listed_not_read = []
    slots = slot_candidates(reg["evm_slot_candidates"])
    for d in il.get("rows", []):
        ledger = (spec.get("label_to_ledger") or {}).get(d["label"])
        lcfg = reg["ledgers"].get(ledger) if ledger else None
        if lcfg is None:
            listed_not_read.append({**d, "reason": "no adapter for this ledger label; not read — not zero, not absent"})
            continue
        a = lcfg["adapter"]
        try:
            if a == "evm":
                row, blob = read_evm(c, lcfg, slots, ledger, d["product"], d["label"], d["identifier"])
            elif a == "stellar_issuer":
                row, blob = read_stellar_issuer(c, lcfg, d["product"], d["label"], d["identifier"]), None
            elif a == "solana_mint":
                row, blob = read_solana_mint(c, lcfg, d["product"], d["label"], d["identifier"]), None
            elif a == "aptos_fa":
                row, blob = read_aptos_fa(c, lcfg, d["product"], d["label"], d["identifier"]), None
            else:
                raise ValueError(f"unknown adapter {a}")
        except Exception as e:  # never raise out of a reader
            row, blob = base.fail(new_row(ledger, d["product"], d["label"], d["identifier"]), e, ledger), None
        row["issuer_listed"] = {"identifier": d["identifier"], "in_page_bytes": d.get("in_page_bytes"),
                                "modules_listed_not_read": d.get("modules") or {}}
        rows.append(row)
        if blob:
            proofs[f"{ledger}-{d['product']}"] = blob
    proof_files = {}
    if proof_dir is not None and proofs:
        proof_dir.mkdir(parents=True, exist_ok=True)
        for k, blob in proofs.items():
            b = (json.dumps(blob, indent=1, sort_keys=True) + "\n").encode()
            p = proof_dir / f"{k}-proof.json"
            p.write_bytes(b)
            proof_files[k] = {"path": base.proof_path(p, proof_url_prefix), "sha256": base.sha256_hex(b)}
        for r in rows:
            k = f"{r['ledger']}-{r['product']}"
            if k in proof_files and r.get("proof"):
                r["proof"]["file"] = proof_files[k]
    issuer_reported = []
    for ir in spec.get("issuer_reported", []):
        if ir["kind"] == "sec_edgar_nmfp3":
            issuer_reported.append(read_nmfp3(ir))
    for ir in issuer_reported:
        ir["comparison"] = {"state": "NOT_COMPARED",
                            "why": ("the filing is a month-end share count from the issuer; the ledger reads are issued token "
                                    "supply on a later date, at different heights on each ledger. A comparison that means "
                                    "anything needs same-instant ledger reads and the transfer agent's register for that "
                                    "instant. Neither number is evidence for the other.")}
    rec = spec.get("reconciliation", {})
    ta = next((ir.get("transfer_agent_named_in_filing") for ir in issuer_reported if ir.get("transfer_agent_named_in_filing")), None)
    reconciliation = {**rec, "transfer_agent_named_by_issuer_filing": ta,
                      "public_transfer_agent_record_found": False,
                      "meaning": ("the on-chain supply below has not been reconciled against the controlling record; "
                                  "until it is, no statement of ownership, AUM or NAV follows from it")}
    per_ledger = [{"ledger": r["ledger"], "product": r["product"], "supply_decimal": r["supply_decimal"],
                   "decimals": r["decimals"], "evidence_kind": r["evidence_kind"],
                   "two_operators_agree": r["two_operators_agree"], "height": (r.get("height") or {}).get("number")}
                  for r in rows]
    doc = {
        "schema": SCHEMA,
        "family": "csoai.cross-ledger-supply (0.1 = USDC pilot; 0.2 adds products, issuer_reported, reconciliation)",
        "status": "measured read; signature and timestamp are sidecar files",
        "writes_board": False,
        "kind": "deterministic-facts (per-read evidence labelled; see evidence_kind_legend)",
        "asset_key": asset_key, "asset": spec["asset"], "issuer": spec["issuer"],
        "question": spec.get("question"),
        "as_of": started, "started_at": started, "finished_at": base.now_iso(),
        "reader": "scripts/readers/cross_ledger_funds.py", "registry": "scripts/readers/cross_ledger_assets.json",
        "registry_sha256": base.sha256_hex(REGISTRY.read_bytes()) if registry is None else None,
        "issuer_list_evidence": {k: v for k, v in il.items() if k != "rows"},
        "issuer_list_rows": [{k: v for k, v in d.items()} for d in il.get("rows", [])],
        "evidence_kind_legend": EVIDENCE_KINDS,
        "two_operators_agree_legend": base.AGREE_VALUES,
        "per_ledger": per_ledger,
        "rows": rows,
        "listed_not_read": listed_not_read,
        "sum_by_evidence_kind": sum_by_product_kind(rows),
        "sum_rule": "per product and per evidence kind only. No cross-product, cross-kind or cross-issuer total is given.",
        "issuer_reported": issuer_reported,
        "reconciliation_state": reconciliation["state"],
        "reconciliation": reconciliation,
        "not_evidence_of": NOT_EVIDENCE_OF,
        "relationship": "PUBLIC_EVIDENCE_TARGET_NOT_CLIENT — no client, partner or Alliance relationship is stated or implied",
        "honesty": ("An on-chain supply read is not AUM, NAV, ownership, settlement or compliance. OPERATOR_API is one "
                    "operator's answer; two operators agreeing is still not a proof. STATE_PROOF_VERIFIED means a Merkle "
                    "proof was checked here against a header's stateRoot — the header was not checked against consensus. "
                    "We measure and sign; we never tokenize, custody or sell an instrument. No investment advice."),
        "iso20022_camt053_shape": camt053_shape(rows, started[:10]),
        "request_log": c.log,
    }
    if spec.get("prior_pack"):
        pp = REPO / spec["prior_pack"]
        if pp.exists():
            doc["prior_pack_comparison"] = compare_prior(json.loads(pp.read_text()), rows, spec.get("label_to_ledger", {}))
    return doc


def main(argv: list[str]) -> int:
    def arg(k, d=None):
        return argv[argv.index(k) + 1] if k in argv else d
    asset = arg("--asset")
    date = arg("--date", base.now_iso()[:10])
    out = Path(arg("--out", str(REPO / f"public/interop/cross-ledger-{asset}-{date}.json")))
    pdir = Path(arg("--proof-dir")) if arg("--proof-dir") else None
    prefix = arg("--proof-url-prefix")
    doc = build(asset, date, base.Client(), pdir, prefix)
    out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    ev = doc["issuer_list_evidence"]
    print(f"{asset}: issuer list {ev.get('state')} sha256={str(ev.get('sha256'))[:16]} rows={len(doc['issuer_list_rows'])}")
    for r in doc["per_ledger"]:
        print(f"  {r['product']:8s} {r['ledger']:10s} {str(r['supply_decimal']):>32s}  {r['evidence_kind']:21s} agree={r['two_operators_agree']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
