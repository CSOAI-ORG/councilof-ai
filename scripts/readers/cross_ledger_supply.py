#!/usr/bin/env python3
"""Cross-ledger supply reader — "is USDC the same thing on every ledger its issuer says it lives on?"

PILOT, unsigned, not on the board. Schema `csoai.cross-ledger-supply/0.1`.

What it does. The deployment map is taken ONLY from the issuer's own page (Circle, "USDC contract
addresses"); the bytes are fetched, sha256'd and timestamped, and every identifier used below is
parsed out of those bytes — nothing is typed from memory. Each listed deployment on a pilot ledger is
then read from that ledger's own public endpoint, and each read is labelled by the strength of the
evidence behind it:

  STATE_PROOF_VERIFIED  a Merkle proof returned by the node was checked HERE, in this file, against a
                        state commitment in a block header (Ethereum: EIP-1186 account + storage proof
                        against stateRoot; Noble: ICS-23 IAVL + multistore proof against app_hash), and
                        the proven value equals the plain API answer. The header itself is NOT checked
                        against consensus (no light client); a second operator's copy of the same
                        header is compared and recorded.
  STATE_PROOF_RECORDED  a proof was returned and its bytes are kept (sha256), but it was not verified here.
  OPERATOR_API          the number is one operator's API answer. Not a proof. Where a second,
                        independent operator exists it is read too and `two_operators_agree` recorded;
                        agreement between two operators is still not a proof.
  UNCHECKABLE           the read failed; the HTTP status / error is kept. Never a zero, never "absent".
  REJECTED              the read answered but the on-chain identity (symbol()) is not USDC; no supply
                        is recorded against USDC (convention from scripts/stablecoin_universe_supply.py).

What it is NOT: not a reserve attestation, not a proof of backing, not evidence of redeemability,
issuer solvency or the value of anything. Not a rate, not a grade. No token is issued, wrapped,
custodied or traded; we attest, we never tokenize.

Stdlib only. keccak-256 is the repo's pure-python one (scripts/adapters/evm_permission_events.py).
Never raises out of a reader: a failure becomes an UNCHECKABLE row carrying its error.

Usage (from the repo root):
  python3 scripts/readers/cross_ledger_supply.py --out public/interop/cross-ledger-usdc-2026-09-25.json \
      [--proof-dir public/interop/cross-ledger-usdc-2026-09-25]
  From a checkout that does not hold the published tree (the pod loop scripts/pod-loops/cross-ledger.sh
  writes to /workspace/lanes/out and publishes a copy), name the URL the proofs will be served at, so
  the artifact never records a machine-local path:
      --out OUT/usdc-D.json --proof-dir OUT/usdc-D --proof-url-prefix /interop/cross-ledger-usdc-D
"""
from __future__ import annotations

import base64
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal, getcontext
from pathlib import Path
from typing import Any, Callable

REPO = Path(__file__).resolve().parents[2]
if str(REPO) not in sys.path:
    sys.path.insert(0, str(REPO))
from scripts.adapters.evm_permission_events import keccak256  # noqa: E402  pure-python keccak-256

getcontext().prec = 80

SCHEMA = "csoai.cross-ledger-supply/0.1"
UA = "csoai-gspc/1.4 (cross-ledger-supply pilot; +https://councilof.ai)"
ISSUER_PAGE = "https://developers.circle.com/stablecoins/usdc-contract-addresses"
ISSUER_PAGE_MD = ISSUER_PAGE + ".md"   # the same Mintlify page served as text/markdown
SPACING_S = 0.2

EVIDENCE_KINDS = {
    "STATE_PROOF_VERIFIED": (
        "A Merkle proof returned by the node was verified by this reader against the state commitment "
        "in a block header (Ethereum stateRoot via EIP-1186; Noble app_hash via ICS-23), and the proven "
        "value equals the plain API answer. The header is not checked against consensus (no light "
        "client); a second operator's copy of the header is compared and recorded."),
    "STATE_PROOF_RECORDED": (
        "A proof was returned and its bytes kept (sha256, height, header commitment), but it was not "
        "verified by this reader."),
    "OPERATOR_API": (
        "One operator's API answer. Not a proof. Where a second independent operator exists it is read "
        "too and two_operators_agree is recorded — agreement between operators is still not a proof."),
    "UNCHECKABLE": (
        "The read failed; the HTTP status or error is recorded. Never a zero, never 'absent'."),
    "REJECTED": (
        "The endpoint answered but the on-chain identity check (symbol()) did not return USDC; no supply "
        "is recorded against USDC."),
}
AGREE_VALUES = {
    "true": "an independent second operator returned the same supply (at the same pinned height where the ledger allows pinning)",
    "false": "an independent second operator returned a different supply at the same pinned height",
    "NOT_COMPARABLE": "the second read differed but the ledger/API cannot pin a height, so the two reads are at different heights",
    "NOT_TRIED": "no keyless second operator was found or the second read failed (reason in the row)",
}
NOT_EVIDENCE_OF = [
    "reserves", "backing", "redeemability", "issuer solvency", "the value of anything",
    "circulating supply (issued supply only; no holder is excluded)",
    "that a ledger's USDC is interchangeable with another's — only what each ledger's state says",
]

# Pilot ledgers: Circle's row label -> our ledger id. Extra EVM chains are read with eth_call only.
CORE = {"Ethereum": "ethereum", "Solana": "solana", "Stellar": "stellar", "Hedera": "hedera",
        "Sui": "sui", "Noble": "noble", "XRPL": "xrpl"}
EXTRA_EVM = {  # Circle row label -> (ledger id, keyless RPC)
    "Arbitrum": ("arbitrum", "https://arb1.arbitrum.io/rpc"),
    "Avalanche C-Chain": ("avalanche", "https://avalanche-c-chain-rpc.publicnode.com"),
    "Base": ("base", "https://mainnet.base.org"),
    "Celo": ("celo", "https://forno.celo.org"),
    "HyperEVM": ("hyperevm", "https://rpc.hyperliquid.xyz/evm"),
    "Linea": ("linea", "https://rpc.linea.build"),
    "OP Mainnet": ("optimism", "https://mainnet.optimism.io"),
    "Polygon PoS": ("polygon", "https://polygon-bor-rpc.publicnode.com"),
    "Sonic": ("sonic", "https://rpc.soniclabs.com"),
    "Unichain": ("unichain", "https://mainnet.unichain.org"),
    "ZKsync Era": ("zksync", "https://mainnet.era.zksync.io"),
}

EP = {
    "eth": ("https://eth.drpc.org", "dRPC"),
    "eth2": [("https://rpc.mevblocker.io", "MEV Blocker"), ("https://eth-mainnet.public.blastapi.io", "Blast API"),
             ("https://ethereum-rpc.publicnode.com", "PublicNode (Allnodes)")],
    "sol": ("https://api.mainnet-beta.solana.com", "Solana Foundation (api.mainnet-beta)"),
    "sol2": ("https://solana.leorpc.com/?api_key=FREE", "LeoRPC (published free key 'FREE')"),
    "xlm": ("https://horizon.stellar.org", "Stellar Development Foundation (Horizon)"),
    "xlm2": ("https://horizon.stellar.lobstr.co", "LOBSTR (Horizon)"),
    "hbar": ("https://mainnet-public.mirrornode.hedera.com", "Hedera (public mirror node)"),
    "hbar_same": ("https://mainnet.mirrornode.hedera.com", "Hedera (second mirror host, same operator)"),
    "sui": ("https://graphql.mainnet.sui.io/graphql", "Mysten Labs (GraphQL)"),
    "sui2": [("https://sui-mainnet-endpoint.blockvision.org", "BlockVision (JSON-RPC)"),
             ("https://rpc-mainnet.suiscan.xyz", "Suiscan / Blockberry (JSON-RPC)"),
             ("https://sui-mainnet.nodeinfra.com", "Nodeinfra (JSON-RPC)")],
    "noble_lcd": ("https://noble-api.polkachu.com", "Polkachu (LCD)"),
    "noble_rpc": ("https://noble-rpc.polkachu.com", "Polkachu (CometBFT RPC)"),
    "noble_lcd2": ("https://rest.lavenderfive.com:443/noble", "Lavender.Five (LCD)"),
    "noble_rpc2": ("https://rpc.lavenderfive.com:443/noble", "Lavender.Five (CometBFT RPC)"),
    "xrpl": ("https://s1.ripple.com:51234/", "Ripple (s1)"),
    "xrpl2": ("https://xrplcluster.com/", "XRPL Labs (xrplcluster)"),
}

SEL = {"name": "0x06fdde03", "symbol": "0x95d89b41", "decimals": "0x313ce567", "totalSupply": "0x18160ddd"}


# ----------------------------------------------------------------------------- transport
class ReadError(Exception):
    def __init__(self, msg: str, status: Any = None):
        super().__init__(msg)
        self.status = status


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_hex(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


Transport = Callable[[str, "bytes | None", dict], tuple]  # -> (status, body_bytes)


def http_transport(url: str, body: bytes | None, headers: dict) -> tuple:
    h = {"User-Agent": UA, "Accept": "application/json"}
    h.update(headers)
    if body is not None:
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=body, headers=h, method="POST" if body is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read() if hasattr(e, "read") else b""
    except Exception as e:  # DNS, TLS, timeout
        return None, f"{type(e).__name__}: {e}".encode()


class Client:
    """Thin wrapper: every response is sha256'd and logged so a row can cite its bytes."""

    def __init__(self, transport: Transport = http_transport, spacing: float = SPACING_S):
        self.t = transport
        self.spacing = spacing
        self.log: list[dict] = []

    def raw(self, url: str, body: Any = None, headers: dict | None = None) -> bytes:
        data = json.dumps(body, separators=(",", ":")).encode() if body is not None else None
        status, b = self.t(url, data, headers or {})
        self.log.append({"url": url, "status": status, "sha256": sha256_hex(b or b""), "bytes": len(b or b"")})
        if self.spacing:
            time.sleep(self.spacing)
        if status != 200:
            raise ReadError(f"HTTP {status}: {(b or b'')[:160].decode('utf-8', 'replace')}", status)
        return b

    def json(self, url: str, body: Any = None, headers: dict | None = None) -> tuple[Any, str]:
        b = self.raw(url, body, headers)
        try:
            return json.loads(b), sha256_hex(b)
        except ValueError as e:
            raise ReadError(f"non-JSON response: {e}", 200)

    def rpc(self, url: str, method: str, params: Any) -> tuple[Any, str]:
        j, h = self.json(url, {"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
        if isinstance(j, dict) and j.get("error"):
            raise ReadError(f"RPC error: {str(j['error'])[:160]}", 200)
        return j.get("result"), h


# ----------------------------------------------------------------------------- RLP + Merkle-Patricia
class ProofError(Exception):
    pass


def rlp_decode(b: bytes) -> Any:
    def item(i: int):
        if i >= len(b):
            raise ProofError("rlp: truncated")
        p = b[i]
        if p < 0x80:
            return b[i:i + 1], i + 1
        if p < 0xB8:
            n = p - 0x80
            return b[i + 1:i + 1 + n], i + 1 + n
        if p < 0xC0:
            ll = p - 0xB7
            n = int.from_bytes(b[i + 1:i + 1 + ll], "big")
            s = i + 1 + ll
            return b[s:s + n], s + n
        if p < 0xF8:
            n, s = p - 0xC0, i + 1
        else:
            ll = p - 0xF7
            n = int.from_bytes(b[i + 1:i + 1 + ll], "big")
            s = i + 1 + ll
        out, j = [], s
        while j < s + n:
            v, j = item(j)
            out.append(v)
        if j != s + n:
            raise ProofError("rlp: list length mismatch")
        return out, s + n

    v, end = item(0)
    if end != len(b):
        raise ProofError("rlp: trailing bytes")
    return v


def _rlp_len(n: int, off: int) -> bytes:
    if n < 56:
        return bytes([off + n])
    bl = n.to_bytes((n.bit_length() + 7) // 8, "big")
    return bytes([off + 55 + len(bl)]) + bl


def rlp_encode(x: Any) -> bytes:
    if isinstance(x, (bytes, bytearray)):
        x = bytes(x)
        if len(x) == 1 and x[0] < 0x80:
            return x
        return _rlp_len(len(x), 0x80) + x
    body = b"".join(rlp_encode(i) for i in x)
    return _rlp_len(len(body), 0xC0) + body


def _nibbles(b: bytes) -> list[int]:
    out: list[int] = []
    for c in b:
        out += [c >> 4, c & 15]
    return out


def mpt_get(root: bytes, key: bytes, proof: list[bytes]) -> bytes | None:
    """Walk a Merkle-Patricia proof. Returns the leaf value, None if the proof shows absence.
    Raises ProofError if the proof is inconsistent with `root` (a node is missing or mis-hashed)."""
    db = {keccak256(n): n for n in proof}
    nib = _nibbles(key)
    ref: Any = root
    for _ in range(200):
        if isinstance(ref, list):
            node = ref                           # inline node (< 32 bytes encoded)
        else:
            if ref == b"":
                return None
            if len(ref) != 32 or ref not in db:
                raise ProofError(f"node {ref.hex()[:16]}… not in proof")
            node = rlp_decode(db[ref])
        if len(node) == 17:
            if not nib:
                return node[16] or None
            ref, nib = node[nib[0]], nib[1:]
            if ref == b"":
                return None
        elif len(node) == 2:
            path = node[0]
            if not path:
                raise ProofError("empty hex-prefix path")
            flag = path[0] >> 4
            pn = ([path[0] & 15] if flag & 1 else []) + _nibbles(path[1:])
            if flag >= 2:                         # leaf
                return node[1] if pn == nib else None
            if nib[:len(pn)] != pn:               # extension diverges
                return None
            nib, ref = nib[len(pn):], node[1]
        else:
            raise ProofError(f"node with {len(node)} items")
    raise ProofError("proof too deep")


HEADER_FIELDS = [  # (json key, is_int) in RLP order, London → Prague
    ("parentHash", 0), ("sha3Uncles", 0), ("miner", 0), ("stateRoot", 0), ("transactionsRoot", 0),
    ("receiptsRoot", 0), ("logsBloom", 0), ("difficulty", 1), ("number", 1), ("gasLimit", 1),
    ("gasUsed", 1), ("timestamp", 1), ("extraData", 0), ("mixHash", 0), ("nonce", 0),
    ("baseFeePerGas", 1), ("withdrawalsRoot", 0), ("blobGasUsed", 1), ("excessBlobGas", 1),
    ("parentBeaconBlockRoot", 0), ("requestsHash", 0),
]


def _hb(h: str) -> bytes:
    h = h[2:] if h.startswith("0x") else h
    return bytes.fromhex(h if len(h) % 2 == 0 else "0" + h)


def header_hash(block: dict) -> bytes:
    items = []
    for k, is_int in HEADER_FIELDS:
        if k not in block or block[k] is None:
            continue
        if is_int:
            v = int(block[k], 16)
            items.append(v.to_bytes((v.bit_length() + 7) // 8, "big") if v else b"")
        else:
            items.append(_hb(block[k]))
    return keccak256(rlp_encode(items))


def verify_eip1186(state_root: str, address: str, proof: dict, slot: int) -> dict:
    """Verify account proof against stateRoot and storage proof against the account's storageRoot."""
    out: dict[str, Any] = {"account_proof_verified": False, "storage_proof_verified": False,
                           "proven_value": None, "error": None}
    try:
        acct_raw = mpt_get(_hb(state_root), keccak256(_hb(address)), [_hb(x) for x in proof["accountProof"]])
        if acct_raw is None:
            raise ProofError("account proven ABSENT at this stateRoot")
        nonce, balance, storage_root, code_hash = rlp_decode(acct_raw)
        if "0x" + storage_root.hex() != proof["storageHash"].lower():
            raise ProofError("account storageRoot in proven leaf != storageHash in response")
        out["account_proof_verified"] = True
        out["proven_storage_root"] = "0x" + storage_root.hex()
        out["proven_code_hash"] = "0x" + code_hash.hex()
        sp = [s for s in proof["storageProof"] if int(s["key"], 16) == slot]
        if not sp:
            raise ProofError(f"no storage proof for slot {slot}")
        leaf = mpt_get(storage_root, keccak256(slot.to_bytes(32, "big")), [_hb(x) for x in sp[0]["proof"]])
        val = 0 if leaf is None else int.from_bytes(rlp_decode(leaf), "big")
        if val != int(sp[0]["value"], 16):
            raise ProofError("proven slot value != value field in response")
        out["storage_proof_verified"] = True
        out["proven_value"] = val
    except (ProofError, ValueError, KeyError, TypeError) as e:
        out["error"] = f"{type(e).__name__}: {e}"
    return out


# ----------------------------------------------------------------------------- ICS-23 (Cosmos)
def _varint(b: bytes, i: int) -> tuple[int, int]:
    shift = v = 0
    while True:
        if i >= len(b):
            raise ProofError("varint truncated")
        c = b[i]
        v |= (c & 0x7F) << shift
        i += 1
        if not c & 0x80:
            return v, i
        shift += 7


def pb_fields(b: bytes) -> list[tuple[int, Any]]:
    out, i = [], 0
    while i < len(b):
        k, i = _varint(b, i)
        f, wt = k >> 3, k & 7
        if wt == 0:
            v, i = _varint(b, i)
        elif wt == 2:
            n, i = _varint(b, i)
            v, i = b[i:i + n], i + n
        elif wt == 1:
            v, i = b[i:i + 8], i + 8
        elif wt == 5:
            v, i = b[i:i + 4], i + 4
        else:
            raise ProofError(f"protobuf wire type {wt}")
        out.append((f, v))
    return out


def _one(fields, n, default=None):
    for f, v in fields:
        if f == n:
            return v
    return default


def parse_existence_proof(commitment_proof: bytes) -> dict:
    exist = _one(pb_fields(commitment_proof), 1)
    if exist is None:
        raise ProofError("CommitmentProof is not an ExistenceProof")
    f = pb_fields(exist)
    leaf = pb_fields(_one(f, 3, b""))
    path = [pb_fields(v) for n, v in f if n == 4]
    return {"key": _one(f, 1, b""), "value": _one(f, 2, b""),
            "leaf": {"hash": _one(leaf, 1, 0), "prehash_key": _one(leaf, 2, 0), "prehash_value": _one(leaf, 3, 0),
                     "length": _one(leaf, 4, 0), "prefix": _one(leaf, 5, b"")},
            "path": [{"hash": _one(p, 1, 0), "prefix": _one(p, 2, b""), "suffix": _one(p, 3, b"")} for p in path]}


def _ics_hash(op: int, data: bytes) -> bytes:
    if op == 0:
        return data
    if op == 1:
        return hashlib.sha256(data).digest()
    raise ProofError(f"unsupported HashOp {op}")


def _ics_len(op: int, data: bytes) -> bytes:
    if op == 0:
        return data
    if op == 1:  # VAR_PROTO
        n, enc = len(data), b""
        while True:
            c = n & 0x7F
            n >>= 7
            enc += bytes([c | (0x80 if n else 0)])
            if not n:
                return enc + data
    raise ProofError(f"unsupported LengthOp {op}")


# The two specs Cosmos SDK stores use (cosmos/ics23 go/proof.go: IavlSpec, TendermintSpec).
ICS23_SPECS = {
    "ics23:iavl": {"leaf_prefix": b"\x00", "leaf_prefix_exact": False, "min_prefix": 4, "max_prefix": 12, "child": 33},
    "ics23:simple": {"leaf_prefix": b"\x00", "leaf_prefix_exact": True, "min_prefix": 1, "max_prefix": 1, "child": 32},
}


def ics23_root(ep: dict, spec: dict) -> bytes:
    lf = ep["leaf"]
    if (lf["hash"], lf["prehash_key"], lf["prehash_value"], lf["length"]) != (1, 0, 1, 1):
        raise ProofError("leaf op does not match spec (SHA256 / NO_HASH / SHA256 / VAR_PROTO)")
    if spec["leaf_prefix_exact"] and lf["prefix"] != spec["leaf_prefix"]:
        raise ProofError("leaf prefix does not match spec")
    if not lf["prefix"].startswith(spec["leaf_prefix"]):
        raise ProofError("leaf prefix does not start with spec prefix")
    cur = _ics_hash(lf["hash"], lf["prefix"] + _ics_len(lf["length"], _ics_hash(lf["prehash_key"], ep["key"]))
                    + _ics_len(lf["length"], _ics_hash(lf["prehash_value"], ep["value"])))
    for inner in ep["path"]:
        if inner["hash"] != 1:
            raise ProofError("inner op hash is not SHA256")
        if inner["prefix"].startswith(spec["leaf_prefix"]):
            raise ProofError("inner prefix collides with leaf prefix")
        if not spec["min_prefix"] <= len(inner["prefix"]) <= spec["max_prefix"] + spec["child"]:
            raise ProofError("inner prefix length outside spec")
        cur = hashlib.sha256(inner["prefix"] + cur + inner["suffix"]).digest()
    return cur


def verify_ics23_chain(ops: list[dict], key: bytes, value: bytes, store: bytes, app_hash_hex: str) -> dict:
    """ops: CometBFT proofOps (type, key(b64), data(b64)). Verifies key/value → IAVL root → multistore root == app_hash."""
    out: dict[str, Any] = {"verified": False, "error": None}
    try:
        if [o["type"] for o in ops] != ["ics23:iavl", "ics23:simple"]:
            raise ProofError(f"unexpected op chain {[o['type'] for o in ops]}")
        e1 = parse_existence_proof(base64.b64decode(ops[0]["data"]))
        if e1["key"] != key or e1["value"] != value:
            raise ProofError("IAVL existence proof is for a different key/value than the query answer")
        iavl_root = ics23_root(e1, ICS23_SPECS["ics23:iavl"])
        e2 = parse_existence_proof(base64.b64decode(ops[1]["data"]))
        if e2["key"] != store or e2["value"] != iavl_root:
            raise ProofError("multistore proof does not commit this store's IAVL root")
        app = ics23_root(e2, ICS23_SPECS["ics23:simple"])
        out.update({"iavl_root": iavl_root.hex(), "computed_app_hash": app.hex().upper(),
                    "iavl_path_len": len(e1["path"]), "multistore_path_len": len(e2["path"])})
        if app.hex().upper() != app_hash_hex.upper():
            raise ProofError("computed multistore root != header app_hash")
        out["verified"] = True
    except (ProofError, ValueError, KeyError, TypeError) as e:
        out["error"] = f"{type(e).__name__}: {e}"
    return out


# ----------------------------------------------------------------------------- issuer list
ROW_RE = re.compile(r"^\|\s*([^|]+?)\s*\|\s*\[?`([^`]+)`\]?(?:\(([^)]*)\))?\s*\|\s*$")


def parse_issuer_md(md: str) -> dict:
    """Parse the Mainnet table of Circle's page. Returns {label: {identifier, explorer_url}} + notes."""
    sec = md.split("## Mainnet", 1)[1] if "## Mainnet" in md else ""
    sec = sec.split("## Testnet", 1)[0]
    rows: dict[str, dict] = {}
    for line in sec.splitlines():
        m = ROW_RE.match(line.strip())
        if m and m.group(1) not in ("Blockchain",) and not m.group(1).startswith(":"):
            rows[m.group(1)] = {"identifier": m.group(2), "explorer_url": m.group(3)}
    notes = [re.sub(r"\s+", " ", n).strip() for n in re.findall(r"<Note>(.*?)</Note>", sec, re.S)]
    return {"rows": rows, "notes": notes}


def read_issuer_list(c: Client) -> dict:
    ev: dict[str, Any] = {"page": ISSUER_PAGE, "fetched": ISSUER_PAGE_MD, "fetched_at": now_iso()}
    try:
        md_b = c.raw(ISSUER_PAGE_MD, headers={"Accept": "text/markdown"})
        ev.update({"md_sha256": sha256_hex(md_b), "md_bytes": len(md_b)})
        parsed = parse_issuer_md(md_b.decode("utf-8", "replace"))
    except ReadError as e:
        ev.update({"state": "UNCHECKABLE", "error": str(e)})
        return {"evidence": ev, "rows": {}, "notes": []}
    ev["mainnet_rows_parsed"] = len(parsed["rows"])
    try:  # the rendered HTML page, to confirm each identifier is on the page a human sees
        html_b = c.raw(ISSUER_PAGE, headers={"Accept": "text/html"})
        ev.update({"html_sha256": sha256_hex(html_b), "html_bytes": len(html_b)})
        html = html_b.decode("utf-8", "replace")
        for r in parsed["rows"].values():
            r["in_rendered_html"] = r["identifier"] in html
        ev["identifiers_confirmed_in_html"] = sum(1 for r in parsed["rows"].values() if r["in_rendered_html"])
    except ReadError as e:
        ev["html_error"] = str(e)
    ev["state"] = "READ" if parsed["rows"] else "UNCHECKABLE"
    ev["method"] = ("Mintlify serves the page as server-rendered HTML and as text/markdown (same path + .md). "
                    "The table is parsed from the markdown bytes; each identifier is then searched for in the "
                    "rendered HTML bytes. Both sha256s are recorded. Not JS-rendered: no data file needed.")
    return {"evidence": ev, **parsed}


# ----------------------------------------------------------------------------- row helpers
def dec_str(base_units: int, decimals: int) -> str:
    q = Decimal(base_units) / (Decimal(10) ** decimals)
    return format(q.quantize(Decimal(1) / (Decimal(10) ** decimals)), "f")


def new_row(ledger: str, label: str, ident: str, scope: str) -> dict:
    return {"ledger": ledger, "circle_label": label, "deployment_id": ident, "scope": scope,
            "supply_base_units": None, "decimals": None, "supply_decimal": None, "observed_at": now_iso(),
            "height": None, "endpoint": None, "operator": None, "response_sha256": None,
            "evidence_kind": "UNCHECKABLE", "two_operators_agree": "NOT_TRIED", "second_read": None,
            "identity": {}, "proof": None, "notes": []}


def fail(row: dict, e: Exception, where: str) -> dict:
    row["evidence_kind"] = "UNCHECKABLE"
    row["error"] = {"where": where, "status": getattr(e, "status", None), "message": str(e)[:240]}
    row["notes"].append("read failed; recorded as UNCHECKABLE — not zero, not absent")
    return row


def set_supply(row: dict, base: int | None, decimals: int | None, dec: str | None = None) -> None:
    row["supply_base_units"] = str(base) if base is not None else None
    row["decimals"] = decimals
    row["supply_decimal"] = dec if dec is not None else (dec_str(base, decimals) if base is not None and decimals is not None else None)


def _abi_str(hx: str) -> str:
    b = _hb(hx) if hx and hx != "0x" else b""
    if len(b) < 64:
        return b.rstrip(b"\x00").decode("ascii", "ignore").strip()
    n = int.from_bytes(b[32:64], "big")
    return b[64:64 + n].decode("utf-8", "ignore").strip()


# ----------------------------------------------------------------------------- Ethereum
def read_ethereum(c: Client, label: str, addr: str, max_slot: int = 24) -> tuple[dict, dict | None]:
    row = new_row("ethereum", label, addr, "core")
    url, op = EP["eth"]
    row.update({"endpoint": url, "operator": op})
    proof_blob = None
    try:
        blk, _ = c.rpc(url, "eth_getBlockByNumber", ["finalized", False])
        n_hex, bhash = blk["number"], blk["hash"]
        row["height"] = {"kind": "block (finalized tag)", "number": int(n_hex, 16), "hash": bhash,
                         "state_root": blk["stateRoot"], "timestamp": int(blk["timestamp"], 16)}
        try:
            row["height"]["header_hash_recomputed"] = ("0x" + header_hash(blk).hex()) == bhash.lower()
        except Exception as e:  # unknown header shape — recorded, not fatal
            row["height"]["header_hash_recomputed"] = False
            row["height"]["header_hash_error"] = str(e)[:120]
        ident = {}
        for k in ("symbol", "name", "decimals"):
            r, _ = c.rpc(url, "eth_call", [{"to": addr, "data": SEL[k]}, n_hex])
            ident[k] = int(r, 16) if k == "decimals" else _abi_str(r)
        row["identity"] = ident
        ts_hex, ts_sha = c.rpc(url, "eth_call", [{"to": addr, "data": SEL["totalSupply"]}, n_hex])
        supply = int(ts_hex, 16)
        row["response_sha256"] = ts_sha
        set_supply(row, supply, ident["decimals"])
        if ident["symbol"] != "USDC":
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"symbol() returned {ident['symbol']!r}, not 'USDC'")
            return row, None
        row["evidence_kind"] = "OPERATOR_API"
        # find the slot empirically: which low slot holds exactly totalSupply() at this block
        cands = []
        for s in range(max_slot + 1):
            v, _ = c.rpc(url, "eth_getStorageAt", [addr, hex(s), n_hex])
            if int(v, 16) == supply:
                cands.append(s)
        row["slot_search"] = {"slots_scanned": f"0..{max_slot}", "matching_slots": cands,
                              "method": "eth_getStorageAt at the pinned block, compared to eth_call totalSupply()"}
        if len(cands) != 1:
            row["notes"].append(f"slot search found {len(cands)} matching slots; no proof attempted → OPERATOR_API")
        else:
            slot = cands[0]
            pr, pr_sha = c.rpc(url, "eth_getProof", [addr, [hex(slot)], n_hex])
            v = verify_eip1186(blk["stateRoot"], addr, pr, slot)
            proof_blob = {"kind": "csoai.eip1186-proof/0.1", "address": addr, "slot": slot, "block_number": int(n_hex, 16),
                          "block_hash": bhash, "state_root": blk["stateRoot"], "endpoint": url,
                          "header": {k: blk[k] for k, _ in HEADER_FIELDS if k in blk} | {"hash": bhash},
                          "how_to_check": ("keccak(rlp(header fields)) must equal block_hash; walk accountProof from "
                                           "state_root along keccak(address); the account's storageRoot must equal "
                                           "storageHash; walk storageProof along keccak(uint256(slot)); the leaf is "
                                           "rlp(totalSupply)."),
                          "response": pr}
            row["proof"] = {"type": "EIP-1186 eth_getProof", "slot": slot, "response_sha256": pr_sha,
                            "account_proof_nodes": len(pr["accountProof"]),
                            "storage_proof_nodes": len(pr["storageProof"][0]["proof"]) if pr.get("storageProof") else 0,
                            **v, "eth_call_value": supply}
            if v["account_proof_verified"] and v["storage_proof_verified"] and v["proven_value"] == supply:
                row["evidence_kind"] = "STATE_PROOF_VERIFIED"
                row["notes"].append(f"slot {slot} found empirically (only slot 0..{max_slot} equal to totalSupply()); "
                                    "account proof verified against stateRoot, storage proof against storageRoot, "
                                    "proven value == eth_call totalSupply()")
            else:
                row["notes"].append("proof did not verify or value differs from eth_call → OPERATOR_API; "
                                    f"reason: {v.get('error') or 'proven value != eth_call'}")
        # second operator: same block number — hash and totalSupply()
        tried = []
        for url2, op2 in EP["eth2"]:   # second operator: same block number — hash and totalSupply()
            try:
                b2, _ = c.rpc(url2, "eth_getBlockByNumber", [n_hex, False])
                t2, t2sha = c.rpc(url2, "eth_call", [{"to": addr, "data": SEL["totalSupply"]}, n_hex])
            except (ReadError, KeyError, TypeError, ValueError) as e:
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
    except (ReadError, KeyError, TypeError, ValueError) as e:
        return fail(row, e, "ethereum"), None
    return row, proof_blob


# ----------------------------------------------------------------------------- extra EVM (eth_call only)
def read_evm_extra(c: Client, ledger: str, rpc_url: str, label: str, addr: str) -> dict:
    row = new_row(ledger, label, addr, "extra_evm")
    row.update({"endpoint": rpc_url, "operator": rpc_url.split("/")[2]})
    try:
        n_hex, _ = c.rpc(rpc_url, "eth_blockNumber", [])
        blk, _ = c.rpc(rpc_url, "eth_getBlockByNumber", [n_hex, False])
        row["height"] = {"kind": "block (latest at read time, then pinned)", "number": int(n_hex, 16),
                         "hash": blk.get("hash"), "timestamp": int(blk["timestamp"], 16)}
        ident = {}
        for k in ("symbol", "decimals"):
            r, _ = c.rpc(rpc_url, "eth_call", [{"to": addr, "data": SEL[k]}, n_hex])
            ident[k] = int(r, 16) if k == "decimals" else _abi_str(r)
        row["identity"] = ident
        ts, sha = c.rpc(rpc_url, "eth_call", [{"to": addr, "data": SEL["totalSupply"]}, n_hex])
        row["response_sha256"] = sha
        set_supply(row, int(ts, 16), ident["decimals"])
        if ident["symbol"] != "USDC":
            row["evidence_kind"] = "REJECTED"
            row["notes"].append(f"symbol() returned {ident['symbol']!r}, not 'USDC'; supply not counted as USDC")
        else:
            row["evidence_kind"] = "OPERATOR_API"
            row["two_operators_agree"] = "NOT_TRIED"
            row["notes"].append("extra EVM chain on Circle's list, outside the seven-ledger pilot core; one keyless RPC, eth_call only")
    except (ReadError, KeyError, TypeError, ValueError) as e:
        return fail(row, e, ledger)
    return row


# ----------------------------------------------------------------------------- Noble (Cosmos SDK)
def read_noble(c: Client, label: str, denom: str) -> tuple[dict, dict | None]:
    row = new_row("noble", label, denom, "core")
    lcd, lop = EP["noble_lcd"]
    rpc, rop = EP["noble_rpc"]
    row.update({"endpoint": lcd, "operator": lop})
    blob = None
    try:
        st, _ = c.json(rpc + "/status")
        node_id = st["result"]["node_info"]["id"]
        h = int(st["result"]["sync_info"]["latest_block_height"]) - 2   # h+1 must exist for app_hash
        meta, _ = c.json(f"{lcd}/cosmos/bank/v1beta1/denoms_metadata/{denom}")
        units = meta.get("metadata", {}).get("denom_units", [])
        decimals = max((u.get("exponent", 0) for u in units), default=None)
        row["identity"] = {"denom": denom, "display": meta.get("metadata", {}).get("display"),
                           "symbol": meta.get("metadata", {}).get("symbol"), "decimals_from_denom_metadata": decimals}
        j, sha = c.json(f"{lcd}/cosmos/bank/v1beta1/supply/by_denom?denom={denom}", headers={"x-cosmos-block-height": str(h)})
        amt = int(j["amount"]["amount"])
        row["response_sha256"] = sha
        set_supply(row, amt, decimals)
        row["evidence_kind"] = "OPERATOR_API"
        hdr_j, _ = c.json(f"{rpc}/block?height={h + 1}")
        hdr = hdr_j["result"]["block"]["header"]
        row["height"] = {"kind": "block height (LCD pinned via x-cosmos-block-height)", "number": h,
                         "app_hash_in_header_h_plus_1": hdr["app_hash"], "header_h_plus_1_block_id": hdr_j["result"]["block_id"]["hash"],
                         "chain_id": hdr["chain_id"], "time_h_plus_1": hdr["time"], "rpc_node_id": node_id}
        key = b"\x00" + denom.encode()   # x/bank SupplyKey prefix 0x00 || denom
        q, qsha = c.json(f'{rpc}/abci_query?path=%22/store/bank/key%22&data=0x{key.hex()}&height={h}&prove=true')
        resp = q["result"]["response"]
        ops = (resp.get("proofOps") or {}).get("ops") or []
        value = base64.b64decode(resp.get("value") or "")
        proof_bytes = json.dumps(ops, sort_keys=True, separators=(",", ":")).encode()
        row["proof"] = {"type": "CometBFT abci_query prove=true (ICS-23 iavl + simple)", "store_key_hex": key.hex(),
                        "query_height": int(resp.get("height", h)), "abci_response_sha256": qsha,
                        "proof_ops_sha256": sha256_hex(proof_bytes), "op_types": [o["type"] for o in ops],
                        "raw_value": value.decode("ascii", "replace")}
        if value.decode("ascii", "replace") != str(amt):
            row["notes"].append("abci raw store value differs from LCD amount; not verified")
        else:
            v = verify_ics23_chain(ops, key, value, b"bank", hdr["app_hash"])
            row["proof"].update(v)
            if v["verified"]:
                row["evidence_kind"] = "STATE_PROOF_VERIFIED"
                row["notes"].append("ICS-23 verified here: bank store key 0x00||uusdc → IAVL root → multistore root "
                                    "== app_hash in header h+1; value == LCD amount. Header not checked against "
                                    "validator signatures (no light client).")
            else:
                row["evidence_kind"] = "STATE_PROOF_RECORDED"
                row["notes"].append(f"proof recorded but did not verify here: {v['error']}")
        blob = {"kind": "csoai.ics23-proof/0.1", "chain_id": hdr["chain_id"], "height": h, "store": "bank",
                "key_hex": key.hex(), "value": value.decode("ascii", "replace"), "app_hash_h_plus_1": hdr["app_hash"],
                "endpoint": rpc, "how_to_check": ("ops[0] (ics23:iavl) proves key 0x00||uusdc -> value in the bank IAVL "
                                                  "tree; ops[1] (ics23:simple) proves store 'bank' -> that IAVL root in the "
                                                  "multistore; the multistore root must equal app_hash of header h+1."),
                "proof_ops": ops}
        # second operator: same height — LCD amount and header h+1
        lcd2, op2 = EP["noble_lcd2"]
        rpc2, _ = EP["noble_rpc2"]
        try:
            st2, _ = c.json(rpc2 + "/status")
            id2 = st2["result"]["node_info"]["id"]
            j2, sha2 = c.json(f"{lcd2}/cosmos/bank/v1beta1/supply/by_denom?denom={denom}", headers={"x-cosmos-block-height": str(h)})
            h2, _ = c.json(f"{rpc2}/block?height={h + 1}")
            a2 = int(j2["amount"]["amount"])
            same_app = h2["result"]["block"]["header"]["app_hash"] == hdr["app_hash"]
            indep = id2 != node_id
            row["second_read"] = {"endpoint": lcd2, "operator": op2, "rpc_node_id": id2, "independent": indep,
                                  "supply_base_units": str(a2), "response_sha256": sha2,
                                  "same_app_hash_h_plus_1": same_app,
                                  "same_block_id_h_plus_1": h2["result"]["block_id"]["hash"] == hdr_j["result"]["block_id"]["hash"]}
            if not indep:
                row["two_operators_agree"] = "NOT_TRIED"
                row["notes"].append("second endpoint answered from the same CometBFT node id; not independent")
            else:
                row["two_operators_agree"] = "true" if (a2 == amt and same_app) else "false"
        except (ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": lcd2, "operator": op2, "error": str(e)[:160]}
    except (ReadError, KeyError, TypeError, ValueError) as e:
        return fail(row, e, "noble"), None
    return row, blob


# ----------------------------------------------------------------------------- Solana
def _sol_supply(c: Client, url: str, mint: str) -> tuple[int, int, int, str]:
    r, sha = c.rpc(url, "getTokenSupply", [mint, {"commitment": "finalized"}])
    return int(r["value"]["amount"]), int(r["value"]["decimals"]), int(r["context"]["slot"]), sha


def read_solana(c: Client, label: str, mint: str) -> dict:
    row = new_row("solana", label, mint, "core")
    url, op = EP["sol"]
    row.update({"endpoint": url, "operator": op})
    try:
        amt, dec, slot, sha = _sol_supply(c, url, mint)
        set_supply(row, amt, dec)
        row.update({"response_sha256": sha, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "slot (context.slot, commitment=finalized)", "number": slot}})
        row["identity"] = {"decimals": dec, "note": "an SPL mint carries no symbol() to call; identification rests on Circle's list"}
        url2, op2 = EP["sol2"]
        try:
            a2, d2, s2, sha2 = _sol_supply(c, url2, mint)
            row["second_read"] = {"endpoint": url2.split("?")[0], "operator": op2, "independent": True,
                                  "supply_base_units": str(a2), "slot": s2, "response_sha256": sha2}
            row["two_operators_agree"] = "true" if a2 == amt else ("false" if s2 == slot else "NOT_COMPARABLE")
            if a2 != amt and s2 != slot:
                row["notes"].append(f"second operator answered at slot {s2} vs {slot}; getTokenSupply cannot be pinned to a past slot")
        except (ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": url2.split("?")[0], "operator": op2, "error": str(e)[:160]}
    except (ReadError, KeyError, TypeError, ValueError) as e:
        return fail(row, e, "solana")
    return row


# ----------------------------------------------------------------------------- Stellar
STELLAR_PARTS = ["balances.authorized", "balances.authorized_to_maintain_liabilities", "balances.unauthorized",
                 "claimable_balances_amount", "liquidity_pools_amount", "contracts_amount"]


def stellar_total(rec: dict) -> tuple[Decimal, dict]:
    parts = {}
    for p in STELLAR_PARTS:
        v: Any = rec
        for k in p.split("."):
            v = (v or {}).get(k)
        parts[p] = v if v is not None else "0"
    return sum((Decimal(v) for v in parts.values()), Decimal(0)), parts


def _stellar_read(c: Client, base: str, code: str, issuer: str) -> dict:
    root, _ = c.json(base + "/")
    j, sha = c.json(f"{base}/assets?asset_code={code}&asset_issuer={issuer}")
    recs = j["_embedded"]["records"]
    if len(recs) != 1:
        raise ReadError(f"expected exactly one asset record, got {len(recs)}", 200)
    total, parts = stellar_total(recs[0])
    return {"total": total, "parts": parts, "sha": sha, "ledger": int(root["history_latest_ledger"]),
            "ledger_closed_at": root.get("history_latest_ledger_closed_at"),
            "accounts_authorized": (recs[0].get("accounts") or {}).get("authorized")}


def read_stellar(c: Client, label: str, ident: str) -> dict:
    row = new_row("stellar", label, ident, "core")
    code, issuer = ident.split("-", 1)
    url, op = EP["xlm"]
    row.update({"endpoint": url, "operator": op})
    try:
        r = _stellar_read(c, url, code, issuer)
        base = int(r["total"] * (10 ** 7))
        if Decimal(base) != r["total"] * (10 ** 7):
            raise ReadError("Stellar amount has more than 7 decimal places", 200)
        set_supply(row, base, 7)
        row.update({"response_sha256": r["sha"], "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "ledger (Horizon history_latest_ledger read just before /assets)",
                               "number": r["ledger"], "closed_at": r["ledger_closed_at"]},
                    "supply_components": r["parts"]})
        row["identity"] = {"asset_code": code, "asset_issuer": issuer, "decimals": "7 (Stellar protocol fixed precision)"}
        row["notes"].append("supply = sum of Horizon balances (authorized + authorized_to_maintain_liabilities + unauthorized) "
                            "+ claimable balances + liquidity pools + Soroban contract balances; components kept")
        url2, op2 = EP["xlm2"]
        try:
            r2 = _stellar_read(c, url2, code, issuer)
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "ledger": r2["ledger"],
                                  "supply_decimal": format(r2["total"], "f"), "response_sha256": r2["sha"]}
            row["two_operators_agree"] = ("true" if r2["total"] == r["total"] else
                                          ("false" if r2["ledger"] == r["ledger"] else "NOT_COMPARABLE"))
        except (ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (ReadError, KeyError, TypeError, ValueError) as e:
        return fail(row, e, "stellar")
    return row


# ----------------------------------------------------------------------------- Hedera
def read_hedera(c: Client, label: str, token_id: str) -> dict:
    row = new_row("hedera", label, token_id, "core")
    url, op = EP["hbar"]
    row.update({"endpoint": url, "operator": op})
    try:
        blk, _ = c.json(f"{url}/api/v1/blocks?limit=1&order=desc")
        b = blk["blocks"][0]
        j, sha = c.json(f"{url}/api/v1/tokens/{token_id}")
        dec = int(j["decimals"])
        set_supply(row, int(j["total_supply"]), dec)
        row.update({"response_sha256": sha, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "mirror-node record file (latest block before the token read)", "number": b["number"],
                               "hash": b.get("hash"), "timestamp_to": (b.get("timestamp") or {}).get("to"),
                               "token_modified_timestamp": j.get("modified_timestamp")}})
        row["identity"] = {"symbol": j.get("symbol"), "name": j.get("name"), "decimals": dec, "type": j.get("type"),
                           "supply_type": j.get("supply_type")}
        url2, op2 = EP["hbar_same"]
        try:
            j2, sha2 = c.json(f"{url2}/api/v1/tokens/{token_id}")
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": False,
                                  "supply_base_units": str(j2.get("total_supply")), "response_sha256": sha2,
                                  "same_operator_host_agrees": str(j2.get("total_supply")) == str(j["total_supply"])}
        except (ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
        row["two_operators_agree"] = "NOT_TRIED"
        row["notes"].append("no keyless mirror node from a second operator was found; the second host is Hedera's own, "
                            "so its agreement is recorded as same_operator_host_agrees, not two_operators_agree. "
                            "Hedera block proofs (HIP-1200) are not yet available.")
    except (ReadError, KeyError, TypeError, ValueError, IndexError) as e:
        return fail(row, e, "hedera")
    return row


# ----------------------------------------------------------------------------- Sui
def read_sui(c: Client, label: str, coin_type: str) -> dict:
    row = new_row("sui", label, coin_type, "core")
    url, op = EP["sui"]
    row.update({"endpoint": url, "operator": op})
    q = ('{ coinMetadata(coinType:"%s"){ symbol name decimals supply } '
         'checkpoint { sequenceNumber digest timestamp } }' % coin_type)
    try:
        j, sha = c.json(url, {"query": q})
        if j.get("errors"):
            raise ReadError(f"GraphQL errors: {str(j['errors'])[:160]}", 200)
        m, cp = j["data"]["coinMetadata"], j["data"]["checkpoint"]
        dec = int(m["decimals"])
        set_supply(row, int(m["supply"]), dec)
        row.update({"response_sha256": sha, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "checkpoint (same GraphQL response)", "number": cp["sequenceNumber"],
                               "digest": cp["digest"], "timestamp": cp.get("timestamp")}})
        row["identity"] = {"symbol": m.get("symbol"), "name": m.get("name"), "decimals": dec}
        tried = []
        for url2, op2 in EP["sui2"]:
            try:
                r2, sha2 = c.rpc(url2, "suix_getTotalSupply", [coin_type])
                cp2, _ = c.rpc(url2, "sui_getLatestCheckpointSequenceNumber", [])
                a2 = int(r2["value"])
            except (ReadError, KeyError, TypeError, ValueError) as e:
                tried.append({"endpoint": url2, "operator": op2, "error": str(e)[:160]})
                continue
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "supply_base_units": str(a2),
                                  "latest_checkpoint_after_read": cp2, "response_sha256": sha2, "failed_before": tried}
            row["two_operators_agree"] = "true" if a2 == int(m["supply"]) else "NOT_COMPARABLE"
            if a2 != int(m["supply"]):
                row["notes"].append("suix_getTotalSupply cannot be pinned to the GraphQL checkpoint; reads are at different checkpoints")
            break
        else:
            row["second_read"] = {"all_failed": tried}
        if row["identity"].get("symbol") != "USDC":
            row["notes"].append(f"coin metadata symbol is {row['identity'].get('symbol')!r}")
    except (ReadError, KeyError, TypeError, ValueError) as e:
        return fail(row, e, "sui")
    return row


# ----------------------------------------------------------------------------- XRPL
def _xrpl_gb(c: Client, url: str, account: str, ledger: Any) -> tuple[dict, str]:
    j, sha = c.json(url, {"method": "gateway_balances", "params": [{"account": account, "ledger_index": ledger}]})
    r = j.get("result") or {}
    if r.get("status") != "success":
        raise ReadError(f"gateway_balances status {r.get('status')}: {r.get('error_message') or r.get('error')}", 200)
    return r, sha


def read_xrpl(c: Client, label: str, ident: str) -> dict:
    row = new_row("xrpl", label, ident, "core")
    cur_hex, issuer = ident.split(".", 1)
    url, op = EP["xrpl"]
    row.update({"endpoint": url, "operator": op})
    try:
        r, sha = _xrpl_gb(c, url, issuer, "validated")
        ob = (r.get("obligations") or {}).get(cur_hex)
        if ob is None:
            raise ReadError(f"no obligations in currency {cur_hex} at this ledger", 200)
        set_supply(row, None, None, dec=format(Decimal(ob), "f"))
        row.update({"response_sha256": sha, "evidence_kind": "OPERATOR_API",
                    "height": {"kind": "validated ledger", "number": r.get("ledger_index"), "hash": r.get("ledger_hash"),
                               "requested": "ledger_index=validated"}})
        row["identity"] = {"currency_hex": cur_hex, "currency_ascii": bytes.fromhex(cur_hex).rstrip(b"\x00").decode("ascii", "replace"),
                           "issuer": issuer, "decimals": None}
        row["notes"].append("XRPL issued currencies are decimal floating point (≤16 significant digits) with no integer "
                            "base unit; supply_base_units is null and supply_decimal is gateway_balances.obligations verbatim")
        url2, op2 = EP["xrpl2"]
        try:
            r2, sha2 = _xrpl_gb(c, url2, issuer, r.get("ledger_index"))
            ob2 = (r2.get("obligations") or {}).get(cur_hex)
            same_hash = r2.get("ledger_hash") == r.get("ledger_hash")
            row["second_read"] = {"endpoint": url2, "operator": op2, "independent": True, "ledger_index": r2.get("ledger_index"),
                                  "ledger_hash": r2.get("ledger_hash"), "same_ledger_hash": same_hash,
                                  "supply_decimal": ob2, "response_sha256": sha2}
            row["two_operators_agree"] = "true" if (same_hash and ob2 is not None and Decimal(ob2) == Decimal(ob)) else "false"
        except (ReadError, KeyError, TypeError, ValueError) as e:
            row["second_read"] = {"endpoint": url2, "operator": op2, "error": str(e)[:160]}
    except (ReadError, KeyError, TypeError, ValueError) as e:
        return fail(row, e, "xrpl")
    return row


# ----------------------------------------------------------------------------- assembly
def sum_by_kind(rows: list[dict]) -> dict:
    out: dict[str, dict] = {}
    for r in rows:
        k = r["evidence_kind"]
        e = out.setdefault(k, {"n_rows": 0, "ledgers": [], "sum_usdc_decimal": None})
        e["n_rows"] += 1
        e["ledgers"].append(r["ledger"])
        if k in ("UNCHECKABLE", "REJECTED") or r.get("supply_decimal") is None:
            continue
        e["sum_usdc_decimal"] = format(Decimal(e["sum_usdc_decimal"] or 0) + Decimal(r["supply_decimal"]), "f")
    for k, e in out.items():
        if k in ("UNCHECKABLE", "REJECTED"):
            e["sum_usdc_decimal"] = None
            e["why_no_sum"] = "no supply recorded against USDC for these rows"
    return out


def camt053_shape(rows: list[dict], date: str) -> dict:
    return {
        "what_this_is": ("A field mapping only: each per-ledger read laid out in the shape of an ISO 20022 camt.053 "
                         "(BankToCustomerStatement) closing-balance row, which is what a bank reconciliation reads. "
                         "BIS Project Agorá names pacs.008 / pacs.009 / camt.053 as its message set "
                         "(https://www.bis.org/about/bisih/topics/fmis/agora/rvt.htm). No conformance is claimed; "
                         "no message is produced or validated against the XSD."),
        "field_map": {
            "Stmt/Acct/Id/Othr/Id": "deployment_id (the ledger's token identifier as Circle lists it)",
            "Stmt/Acct/Svcr": "ledger (the ledger is the 'servicer' in this mapping — an analogy, not a role)",
            "Stmt/Bal/Tp/CdOrPrtry/Cd": "CLBD (closing booked) — here: supply at the recorded height",
            "Stmt/Bal/Amt": "supply_decimal",
            "Stmt/Bal/Amt/@Ccy": ("UNMAPPED — USDC has no ISO 4217 code; camt.053 requires one. We do not choose a "
                                  "proprietary convention."),
            "Stmt/Bal/Dt/DtTm": "observed_at",
            "Stmt/ElctrncSeqNb": "height.number (block / ledger / slot / checkpoint)",
            "Stmt/AddtlStmtInf": "evidence_kind + response_sha256",
            "Stmt/Ntry": "UNMAPPED — no entries are read; this is a balance-only snapshot",
        },
        "rows": [{"Acct.Id": r["deployment_id"], "Acct.Svcr": r["ledger"], "Bal.Tp": "CLBD", "Bal.Amt": r["supply_decimal"],
                  "Bal.Ccy": None, "Bal.DtTm": r["observed_at"], "ElctrncSeqNb": (r.get("height") or {}).get("number"),
                  "AddtlStmtInf": r["evidence_kind"]} for r in rows if r.get("supply_decimal") is not None],
        "statement_date": date,
    }


def proof_path(p: Path, proof_url_prefix: str | None = None) -> str:
    """Where the artifact says a proof file lives. With a URL prefix: prefix + "/" + file name (the
    served location). Without one: the path under this repo's public/ as a site path, else the local
    path as written (the pre-existing behaviour, unchanged)."""
    if proof_url_prefix:
        return proof_url_prefix.rstrip("/") + "/" + p.name
    if str(p).startswith(str(REPO / "public")):
        return "/" + str(p.relative_to(REPO / "public"))
    return str(p)


def build(c: Client, proof_dir: Path | None = None, proof_url_prefix: str | None = None) -> dict:
    started = now_iso()
    issuer = read_issuer_list(c)
    rows: list[dict] = []
    proofs: dict[str, dict] = {}
    lst = issuer["rows"]
    readers = {
        "ethereum": lambda lab, i: read_ethereum(c, lab, i),
        "noble": lambda lab, i: read_noble(c, lab, i),
        "solana": lambda lab, i: (read_solana(c, lab, i), None),
        "stellar": lambda lab, i: (read_stellar(c, lab, i), None),
        "hedera": lambda lab, i: (read_hedera(c, lab, i), None),
        "sui": lambda lab, i: (read_sui(c, lab, i), None),
        "xrpl": lambda lab, i: (read_xrpl(c, lab, i), None),
    }
    missing_core = []
    for label, ledger in CORE.items():
        if label not in lst:
            missing_core.append(label)
            continue
        ident = lst[label]["identifier"]
        try:
            row, blob = readers[ledger](label, ident)
        except Exception as e:  # never raise out of a reader
            row, blob = fail(new_row(ledger, label, ident, "core"), e, ledger), None
        row["issuer_listed"] = {"identifier": ident, "in_rendered_html": lst[label].get("in_rendered_html")}
        rows.append(row)
        if blob:
            proofs[ledger] = blob
    for label, (ledger, url) in EXTRA_EVM.items():
        if label not in lst:
            continue
        ident = lst[label]["identifier"]
        try:
            row = read_evm_extra(c, ledger, url, label, ident)
        except Exception as e:
            row = fail(new_row(ledger, label, ident, "extra_evm"), e, ledger)
        row["issuer_listed"] = {"identifier": ident, "in_rendered_html": lst[label].get("in_rendered_html")}
        rows.append(row)
    listed_not_read = [{"circle_label": k, "identifier": v["identifier"],
                        "reason": "outside this pilot's scope (no reader wired); not read — not zero, not absent"}
                       for k, v in lst.items() if k not in CORE and k not in EXTRA_EVM]

    proof_files = {}
    if proof_dir is not None and proofs:
        proof_dir.mkdir(parents=True, exist_ok=True)
        for k, blob in proofs.items():
            b = (json.dumps(blob, indent=1, sort_keys=True) + "\n").encode()
            p = proof_dir / f"{k}-proof.json"
            p.write_bytes(b)
            proof_files[k] = {"path": proof_path(p, proof_url_prefix),
                              "sha256": sha256_hex(b)}
        for r in rows:
            if r["ledger"] in proof_files and r.get("proof"):
                r["proof"]["file"] = proof_files[r["ledger"]]

    core = [r for r in rows if r["scope"] == "core"]
    decimals_seen = sorted({f"{r['ledger']}={r['decimals']}" for r in core})
    per_ledger = [{"ledger": r["ledger"], "scope": r["scope"], "supply_decimal": r["supply_decimal"],
                   "decimals": r["decimals"], "evidence_kind": r["evidence_kind"],
                   "two_operators_agree": r["two_operators_agree"],
                   "height": (r.get("height") or {}).get("number")} for r in rows]
    mixed_sum = sum((Decimal(r["supply_decimal"]) for r in rows
                     if r["evidence_kind"] not in ("UNCHECKABLE", "REJECTED") and r.get("supply_decimal")), Decimal(0))
    finished = now_iso()
    return {
        "schema": SCHEMA,
        "status": "PILOT — unsigned, not on the board",
        "signed": False,
        "writes_board": False,
        "kind": "deterministic-facts (per-read evidence labelled; see evidence_kind_legend)",
        "question": "Is USDC the same thing on every ledger its issuer says it lives on?",
        "asset": "USDC", "issuer": "Circle",
        "started_at": started, "finished_at": finished,
        "reader": "scripts/readers/cross_ledger_supply.py",
        "issuer_list_evidence": issuer["evidence"],
        "issuer_list_notes_verbatim": issuer["notes"],
        "evidence_kind_legend": EVIDENCE_KINDS,
        "two_operators_agree_legend": AGREE_VALUES,
        "per_ledger": per_ledger,
        "rows": rows,
        "listed_not_read": listed_not_read,
        "missing_core_ledgers_on_issuer_list": missing_core,
        "sum_by_evidence_kind": sum_by_kind(rows),
        "sum_by_evidence_kind_core_seven_only": sum_by_kind(core),
        "arithmetic_sum_of_mixed_evidence_reads": {
            "label": "arithmetic sum of mixed-evidence reads, not a measured total",
            "usdc_decimal": format(mixed_sum, "f"),
            "why_it_is_not_a_total": ("rows are at different heights on different ledgers (never simultaneous); "
                                      "evidence strength differs per row; a CCTP burn on one ledger and its mint on "
                                      "another can fall on either side of two reads; ledgers listed by Circle but not "
                                      "read here are excluded; this is not Circle's outstanding USDC."),
        },
        "same_thing_findings": {
            "decimals_by_core_ledger": decimals_seen,
            "note": ("'Same thing' is tested only on what each ledger's own state exposes: the identifier Circle "
                     "lists resolves on that ledger, the on-ledger symbol/metadata where one exists, the decimals, "
                     "and a readable supply. Base-unit precision is not uniform (see decimals); XRPL has no integer "
                     "base unit. Nothing here tests fungibility, redemption or backing."),
        },
        "canonical_vs_bridged": {
            "rule": "Only what Circle's page labels. Nothing is inferred.",
            "every_row_is": "listed in Circle's 'USDC Mainnet Address' table",
            "explicit_labels_on_page": issuer["notes"],
            "unlabelled": ("apart from the note(s) above, the page carries no per-row native/bridged label; "
                           "no row here is called native or bridged on our own inference."),
        },
        "not_evidence_of": NOT_EVIDENCE_OF,
        "honesty": ("Not a reserve attestation, not a proof of backing. A number labelled OPERATOR_API is one "
                    "operator's API answer and is not a proof; two operators agreeing is still not a proof. "
                    "STATE_PROOF_VERIFIED means a Merkle proof was checked here against a header's state "
                    "commitment — the header itself was not checked against consensus. We measure and sign; we "
                    "never tokenize, mint, custody or sell an instrument. No investment advice or price view."),
        "iso20022_camt053_shape": camt053_shape(rows, started[:10]),
        "request_log": c.log,
    }


def main(argv: list[str]) -> int:
    out = Path(argv[argv.index("--out") + 1]) if "--out" in argv else REPO / "public/interop/cross-ledger-usdc.json"
    pdir = Path(argv[argv.index("--proof-dir") + 1]) if "--proof-dir" in argv else None
    if pdir is not None and not pdir.is_absolute():
        pdir = (Path.cwd() / pdir).resolve()
    prefix = argv[argv.index("--proof-url-prefix") + 1] if "--proof-url-prefix" in argv else None
    if prefix is not None and not re.fullmatch(r"/[A-Za-z0-9._/-]+", prefix):
        print(f"--proof-url-prefix must be a site path like /interop/name, got {prefix!r}", file=sys.stderr)
        return 2
    doc = build(Client(), pdir, prefix)
    out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    print(f"issuer list: {doc['issuer_list_evidence'].get('state')} rows={doc['issuer_list_evidence'].get('mainnet_rows_parsed')} "
          f"md_sha256={str(doc['issuer_list_evidence'].get('md_sha256'))[:16]}")
    for r in doc["per_ledger"]:
        print(f"  {r['ledger']:10s} {r['scope']:9s} {str(r['supply_decimal']):>26s}  {r['evidence_kind']:21s} agree={r['two_operators_agree']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
