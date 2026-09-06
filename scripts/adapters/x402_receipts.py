"""Signed x402 receipts -> public-root leaves (Cloudflare KV REST reader; never raises).

Every settled payment writes a `receipt:tx:*` record to REVENUE_KV (functions/api/_x402_receipt.ts,
schema csoai.x402.receipt-record/0.1) wrapping the x402 Offer & Receipt extension's signed receipt.
This adapter runs inside publish_public_root.py (GHA public-root.yml, hourly) and turns each record
into ONE canonical leaf on the `receipts.v1` surface, kind csoai.x402.receipt/0.1.

WHAT A LEAF ATTESTS, and nothing beyond it: that at the root's as_of this estate held a receipt it
had signed for a settlement of that resource. It does not attest that the payment was honest, that
the buyer got value, or that the estate earned revenue — `self` and `zero_value` are carried on the
leaf precisely so nobody can read a settlement count as a revenue count.

WHAT IS DELIBERATELY NOT PUBLISHED: the payer address, and the compact JWS itself.

  The JWS contains the payer. Folding it into a public Merkle tree would publish every buyer's
  wallet to anyone who reads root.json, forever. The extension calls receipts "privacy-minimal by
  default" and warns about correlation risk (§11); a seller who then publishes every payer has
  taken the privacy the format offered and thrown it away on the buyer's behalf. The receipt is
  the BUYER's artefact to disclose. So the leaf carries `receipt_jws_sha256` — a commitment to
  the exact bytes — and `payer_hash`, sha256 of the lowercased address. A buyer holding their own
  receipt can prove inclusion by hashing it; nobody else can enumerate payers from the root.

  This is a real trade and worth naming: it means a stranger reading root.json alone CANNOT verify
  the receipt's signature, only that we committed to bytes with that digest. Verifying the
  signature needs the receipt, which needs the buyer. That is the correct place for it to need.

Config (all three needed for KV; without them the adapter reads mirrors only and never raises):
    CLOUDFLARE_API_TOKEN     (Workers KV Storage: Read)
    CLOUDFLARE_ACCOUNT_ID
    REVENUE_KV_NAMESPACE_ID  (GitHub Actions variable, set by the owner)

Mirrors under public/interop/x402-receipts/<receipt_jws_sha256>.json keep a landed leaf landing
when KV is unreachable — the same two-machines rule the witness queue follows.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

KIND = "csoai.x402.receipt/0.1"
RECORD_SCHEMA = "csoai.x402.receipt-record/0.1"
MIRROR_SCHEMA = "csoai.x402-receipt-mirror/0.1"
SURFACE = "receipts.v1"
STATE = "PROBED"
CAP = 3072
KV_PREFIX = "receipt:tx:"
API = "https://api.cloudflare.com/client/v4"
UA = "csoai-x402-receipts/0.1 (+https://councilof.ai/api/receipts)"
MIRROR_REL = Path("public") / "interop" / "x402-receipts"
SPEC_SHA = "69652a69798f0b08f95bef33318896e36e210f7e"
ATTESTS = (
    "that this estate held a receipt it had signed for a settlement of this resource at the root's "
    "as_of — not that the payment was revenue, not that the buyer received value"
)
TAGS = ["rail:x402", "offer-receipt", "receipt"]

SHA_RE = re.compile(r"^[0-9a-f]{64}$")
TX_RE = re.compile(r"^0x[0-9a-fA-F]{64}$")
ADDR_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")
JWS_RE = re.compile(r"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$")
# Same verdict guard the witness queue uses — a leaf must never carry a judgement word.
VERDICT_RE = re.compile(
    r"\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b"
    r"|(?<!UN)MEASURED",
    re.I,
)

Transport = Callable[[str, str, bytes | None, dict[str, str]], tuple[int, bytes]]


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(b: bytes | str) -> str:
    return hashlib.sha256(b.encode("utf-8") if isinstance(b, str) else b).hexdigest()


def _http(method: str, url: str, body: bytes | None, headers: dict[str, str]) -> tuple[int, bytes]:
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception:  # noqa: BLE001 — a dark KV means fewer leaves, never a halt
        return 0, b""


def _kv_config() -> tuple[str, str, str] | None:
    tok = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    acct = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    ns = os.environ.get("REVENUE_KV_NAMESPACE_ID", "").strip()
    return (tok, acct, ns) if tok and acct and ns else None


def read_kv(transport: Transport | None = None) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Every receipt record in REVENUE_KV, or ([], why-not). Never raises."""
    cfg = _kv_config()
    if not cfg:
        return [], {"kv": "unconfigured", "detail": "CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / REVENUE_KV_NAMESPACE_ID not all set"}
    tok, acct, ns = cfg
    t = transport or _http
    h = {"authorization": f"Bearer {tok}", "user-agent": UA, "accept": "application/json"}
    base = f"{API}/accounts/{acct}/storage/kv/namespaces/{ns}"
    names: list[str] = []
    cursor = ""
    for _ in range(50):  # a hard ceiling: a runaway pager must not stall the hourly root
        q = {"prefix": KV_PREFIX, "limit": "1000"}
        if cursor:
            q["cursor"] = cursor
        code, raw = t("GET", f"{base}/keys?{urllib.parse.urlencode(q)}", None, h)
        if code != 200:
            return [], {"kv": "unreadable", "detail": f"keys HTTP {code}"}
        try:
            page = json.loads(raw)
        except Exception:  # noqa: BLE001
            return [], {"kv": "unreadable", "detail": "keys response was not JSON"}
        names.extend(str(k.get("name")) for k in (page.get("result") or []))
        cursor = ((page.get("result_info") or {}).get("cursor")) or ""
        if not cursor:
            break
    out: list[dict[str, Any]] = []
    unreadable = 0
    for name in names:
        code, raw = t("GET", f"{base}/values/{urllib.parse.quote(name, safe='')}", None, h)
        if code != 200:
            unreadable += 1
            continue
        try:
            out.append(json.loads(raw))
        except Exception:  # noqa: BLE001 — an unreadable row is skipped, never invented
            unreadable += 1
    return out, {"kv": "read", "n_keys": len(names), "n_unreadable": unreadable}


def read_mirrors(repo_root: Path) -> list[dict[str, Any]]:
    """Records previously folded into a root, kept on disk so a landed leaf keeps landing."""
    base = repo_root / MIRROR_REL
    rows: list[dict[str, Any]] = []
    if not base.is_dir():
        return rows
    for p in sorted(base.glob("*.json")):
        try:
            row = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        # The marker is a SEPARATE key. Writing {"schema": MIRROR_SCHEMA, **rec} looked right and
        # was silently wrong: the record carries its own `schema`, so the spread overwrote the
        # marker and every mirror this adapter wrote was invisible to the adapter that read it.
        # Caught by test_collect_reads_mirrors_when_kv_is_dark, which is why that test exists.
        if isinstance(row, dict) and row.get("mirror_schema") == MIRROR_SCHEMA:
            rows.append(row)
    return rows


def leaf_from_record(rec: dict[str, Any]) -> tuple[dict[str, Any] | None, str]:
    """One receipt record -> one canonical leaf, or (None, why not). Never raises."""
    if not isinstance(rec, dict):
        return None, "not an object"
    if rec.get("schema") != RECORD_SCHEMA:
        return None, f"schema {rec.get('schema')!r} is not {RECORD_SCHEMA}"
    receipt = rec.get("receipt") or {}
    sig = receipt.get("signature")
    if receipt.get("format") != "jws" or not isinstance(sig, str) or not JWS_RE.match(sig):
        return None, "receipt is not a compact JWS in the wire shape {format:'jws', signature}"
    payload = rec.get("payload") or {}
    payer = str(payload.get("payer") or "")
    resource = str(payload.get("resourceUrl") or "")
    if not ADDR_RE.match(payer):
        return None, "payload.payer is not an EVM address"
    if not resource.startswith("https://"):
        return None, "payload.resourceUrl is not an https URL"
    issued = payload.get("issuedAt")
    if not isinstance(issued, int) or issued <= 0:
        return None, "payload.issuedAt is not a positive integer"
    tx = payload.get("transaction")
    if tx is not None and not TX_RE.match(str(tx)):
        return None, "payload.transaction is present and is not a 32-byte hex hash"

    body: dict[str, Any] = {
        "kind": KIND,
        "state": STATE,
        # The commitment to the buyer's artefact. A buyer holding their receipt can hash it and
        # find this leaf; nobody else can recover the receipt, or the payer, from the root.
        "receipt_jws_sha256": sha256_hex(sig),
        "payer_hash": sha256_hex(payer.lower()),
        "resource": resource,
        "network": str(payload.get("network") or ""),
        "issued_at": issued,
        "kid": str(rec.get("kid") or ""),
        "alg": str(rec.get("alg") or ""),
        "spec_commit": SPEC_SHA,
        # Carried so a reader cannot mistake a settlement count for a revenue count.
        "zero_value": bool(rec.get("zero_value")),
        "self": rec.get("self") if isinstance(rec.get("self"), bool) else None,
        "settlement_recorded": bool(rec.get("settlement_recorded")),
        "attests": ATTESTS,
        "not_attested": [
            "that money moved — check `transaction` against Base yourself",
            "that the payment was revenue — see `self` and `zero_value`",
            "that the buyer received anything of value",
        ],
    }
    if tx:
        body["transaction"] = str(tx)

    payload_obj = {
        "surface": SURFACE,
        "subject": f"x402-receipt:{body['receipt_jws_sha256'][:16]}",
        "as_of": rec.get("issued_at") or "",
        "source_urls": [
            "https://councilof.ai/api/receipts/verify",
            f"https://github.com/x402-foundation/x402/blob/{SPEC_SHA}/specs/extensions/extension-offer-and-receipt.md",
        ],
        "payload": body,
        "unmeasured": [
            "whether the buyer found the artefact useful — a settlement says nothing about it"
        ],
        "tags": list(TAGS),
    }
    blob = json.dumps(payload_obj, ensure_ascii=False)
    if VERDICT_RE.search(blob):
        return None, "a verdict word reached the leaf"
    n = len(canonical_bytes(body))
    if n > CAP:
        return None, f"payload is {n} bytes, over the {CAP}-byte card cap"
    return payload_obj, ""


def collect(repo_root: Path | None = None, transport: Transport | None = None) -> dict[str, Any]:
    root = repo_root or Path(__file__).resolve().parents[2]
    records, kv_note = read_kv(transport)
    mirrors = read_mirrors(root)
    # Mirrors first so a landed leaf keeps landing; KV records overwrite by digest.
    merged: dict[str, dict[str, Any]] = {}
    for src in (mirrors, records):
        for rec in src:
            sig = ((rec.get("receipt") or {}).get("signature")) if isinstance(rec, dict) else None
            if isinstance(sig, str):
                merged[sha256_hex(sig)] = rec

    leaves: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    for digest, rec in sorted(merged.items()):
        leaf, why = leaf_from_record(rec)
        if leaf is None:
            skipped.append({"receipt": digest[:16], "reason": why})
            continue
        leaves.append(leaf)

    n_self = sum(1 for l in leaves if l["payload"].get("self") is True)
    n_zero = sum(1 for l in leaves if l["payload"].get("zero_value") is True)
    return {
        "leaves": leaves,
        "sidecar": {
            "surface": SURFACE,
            "n_records_kv": len(records),
            "n_mirrors": len(mirrors),
            "n_leaves": len(leaves),
            "n_skipped": len(skipped),
            "n_self": n_self,
            "n_zero_value": n_zero,
            "n_outside_non_zero": len(leaves) - max(n_self, n_zero) if leaves else 0,
            "skipped": skipped[:20],
            **kv_note,
            "note": (
                "One leaf per signed x402 receipt. The compact JWS and the payer address are NOT "
                "published — the leaf commits to sha256 of the receipt and sha256 of the lowercased "
                "payer, so a buyer can prove inclusion of their own receipt and nobody can enumerate "
                "buyers from the root. n_self and n_zero_value are here so a settlement count is never "
                "read as a buyer count; the One Number stays /api/revenue one_number."
            ),
        },
    }


def mirror(repo_root: Path, records: list[dict[str, Any]]) -> int:
    """Write the PUBLIC fields of each record to disk so a landed leaf keeps landing."""
    base = repo_root / MIRROR_REL
    base.mkdir(parents=True, exist_ok=True)
    n = 0
    for rec in records:
        sig = (rec.get("receipt") or {}).get("signature")
        if not isinstance(sig, str):
            continue
        digest = sha256_hex(sig)
        path = base / f"{digest}.json"
        if path.exists():
            continue
        path.write_text(
            json.dumps({**rec, "mirror_schema": MIRROR_SCHEMA}, ensure_ascii=False, indent=1, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        n += 1
    return n


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--mirror", action="store_true", help="write KV records to public/interop/x402-receipts/")
    args = ap.parse_args()
    repo = Path(__file__).resolve().parents[2]
    out = collect(repo)
    if args.mirror:
        recs, _ = read_kv()
        out["sidecar"]["n_mirrored"] = mirror(repo, recs)
    print(json.dumps({"n_leaves": len(out["leaves"]), "sidecar": out["sidecar"]}, indent=1, ensure_ascii=False))
    sys.exit(1 if out["sidecar"]["n_skipped"] else 0)
