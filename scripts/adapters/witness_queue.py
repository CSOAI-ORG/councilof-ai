"""Witness queue -> public-root leaves (Cloudflare KV REST reader; never raises).

/api/witness settles an x402 receipt, asks a public RFC-3161 TSA for a timestamp
over a SHA-256 digest, and queues {sha256, label, url?, fetched_at, http_status?,
payment_ref, rfc3161_*} in the KV namespace bound as WITNESS_KV. This adapter
runs inside publish_public_root.py (GHA public-root.yml, hourly) and turns every
entry into ONE canonical public.notice leaf, kind csoai.witness.hash/0.1:

    {sha256, label, url_hash?, fetched_at, http_status?, rfc3161_tsa,
     rfc3161_status, rfc3161_token_sha256, payment_ref, state: PROBED,
     attests: "existence of this digest at the root's as_of — nothing about
               its content, legality, or provenance"}

The writer signs it (did:web:csoai.org#board-attestation-1), folds it into
public/root.json, and witness_public_root.py anchors the ONE root (Rekor + OTS).
After the tree is written, `mark()` stamps each included entry in KV with the
root as_of + merkle root + card sha256 + proof path (idempotent: witnessed once),
and mirrors the PUBLIC fields to public/interop/witness/<sha256>.json so a leaf
that landed in a root keeps landing even if KV is unreachable (two machines).

Never the bytes. Never the URL (url_hash only). Never the timestamp reply bytes
in the leaf (its sha256; the reply itself is served by /api/witness/status).
Never MEASURED, never a verdict word on a leaf, never a label over the cap.

Config (all three needed for KV; absent -> mirror leaves only, never raise):
    CLOUDFLARE_API_TOKEN     (needs Workers KV Storage: Edit)
    CLOUDFLARE_ACCOUNT_ID
    WITNESS_KV_NAMESPACE_ID  (GitHub Actions variable, set by the owner)
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

SCRIPTS = Path(__file__).resolve().parent.parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from root_digest_domain import (
    KNOWN_DOMAINS,
    PAYLOAD_ONLY_V0,
    WHOLE_CARD_V1,
    DigestDomainError,
    resolve_leaf_digest_domain,
)

KIND = "csoai.witness.hash/0.1"
ENTRY_SCHEMA = "csoai.witness-entry/0.1"
MIRROR_SCHEMA = "csoai.witness-mirror/0.1"
SURFACE = "public.notice"
STATE = "PROBED"
CAP = 3072
KV_PREFIX = "witness:"
API = "https://api.cloudflare.com/client/v4"
UA = "csoai-witness-queue/0.1 (+https://councilof.ai/api/witness)"
STATUS_URL = "https://councilof.ai/api/witness/status?sha256={sha}"
MIRROR_REL = Path("public") / "interop" / "witness"
ATTESTS = "existence of this digest at the root's as_of — nothing about its content, legality, or provenance"
TAGS = ["rail:x402", "sku:witness_hash", "witness"]

SHA_RE = re.compile(r"^[0-9a-f]{64}$")
LABEL_RE = re.compile(r"^[A-Za-z0-9 ._:/@+#()-]{0,120}$")
VERDICT_RE = re.compile(
    r"\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b"
    r"|(?<!UN)MEASURED",
    re.I,
)
# Fields a leaf and a mirror may carry. The URL, the reply bytes, payer/network stay in KV.
PUBLIC_FIELDS = (
    "sha256", "label", "url_hash", "fetched_at", "http_status", "payment_ref",
    "rfc3161_tsa", "rfc3161_status", "rfc3161_token_sha256", "queued_at", "status", "witnessed",
)

Transport = Callable[[str, str, bytes | None, dict[str, str]], tuple[int, bytes]]


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def payload_sha256(payload: dict) -> str:
    return hashlib.sha256(canonical_bytes(payload)).hexdigest()


CARD_DIGEST_EXCLUDES = ("sha256", "sig_ed25519")


def whole_card_sha256(card: dict) -> str:
    preimage = {k: v for k, v in card.items() if k not in CARD_DIGEST_EXCLUDES}
    return hashlib.sha256(canonical_bytes(preimage)).hexdigest()


def card_digest_for_domain(card: dict, domain: str) -> str:
    if domain == WHOLE_CARD_V1:
        return whole_card_sha256(card)
    if domain == PAYLOAD_ONLY_V0:
        payload = card.get("payload")
        if not isinstance(payload, dict):
            raise ValueError("card payload is not an object")
        return payload_sha256(payload)
    raise ValueError(f"unsupported leaf digest domain {domain!r}")


def merkle_root(leaf_hexes: list[str]) -> str:
    level = [bytes.fromhex(value) for value in leaf_hexes]
    if not level:
        return hashlib.sha256(b"").hexdigest()
    while len(level) > 1:
        nxt: list[bytes] = []
        for index in range(0, len(level), 2):
            left = level[index]
            right = level[index + 1] if index + 1 < len(level) else left
            nxt.append(hashlib.sha256(left + right).digest())
        level = nxt
    return level[0].hex()


def env_config(env: dict[str, str] | None = None) -> dict[str, str] | None:
    e = os.environ if env is None else env
    token = (e.get("CLOUDFLARE_API_TOKEN") or "").strip()
    account = (e.get("CLOUDFLARE_ACCOUNT_ID") or "").strip()
    ns = (e.get("WITNESS_KV_NAMESPACE_ID") or "").strip()
    if not (token and account and ns):
        return None
    return {"token": token, "account": account, "ns": ns}


def _http(method: str, url: str, body: bytes | None, headers: dict[str, str]) -> tuple[int, bytes]:
    req = urllib.request.Request(url, data=body, headers={"User-Agent": UA, **headers}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()


class KV:
    """Thin Cloudflare KV REST client. Every method returns a value or None; nothing raises past it."""

    def __init__(self, cfg: dict[str, str], transport: Transport | None = None) -> None:
        self.cfg = cfg
        self.transport = transport or _http
        self.base = f"{API}/accounts/{cfg['account']}/storage/kv/namespaces/{cfg['ns']}"
        self.errors: list[str] = []

    def _call(self, method: str, path: str, body: bytes | None = None, ctype: str | None = None) -> tuple[int, bytes]:
        headers = {"Authorization": f"Bearer {self.cfg['token']}"}
        if ctype:
            headers["Content-Type"] = ctype
        try:
            return self.transport(method, self.base + path, body, headers)
        except Exception as e:  # network, DNS, timeout — recorded, never raised
            self.errors.append(f"{method} {path}: {type(e).__name__}")
            return 0, b""

    def list_keys(self, prefix: str = KV_PREFIX) -> list[str] | None:
        names: list[str] = []
        cursor = ""
        for _ in range(50):  # 50 pages × 1000 keys is far beyond any honest queue
            q = {"prefix": prefix, "limit": "1000"}
            if cursor:
                q["cursor"] = cursor
            st, raw = self._call("GET", "/keys?" + urllib.parse.urlencode(q))
            if st != 200:
                self.errors.append(f"list_keys HTTP {st}")
                return None
            try:
                d = json.loads(raw)
            except Exception:
                self.errors.append("list_keys: not json")
                return None
            names.extend(str(k.get("name")) for k in d.get("result") or [] if k.get("name"))
            cursor = str((d.get("result_info") or {}).get("cursor") or "")
            if not cursor:
                break
        return names

    def get(self, key: str) -> dict | None:
        st, raw = self._call("GET", "/values/" + urllib.parse.quote(key, safe=""))
        if st != 200:
            if st != 404:
                self.errors.append(f"get {key[:24]}: HTTP {st}")
            return None
        try:
            v = json.loads(raw)
        except Exception:
            self.errors.append(f"get {key[:24]}: not json")
            return None
        return v if isinstance(v, dict) else None

    def put(self, key: str, obj: dict) -> bool:
        st, _ = self._call("PUT", "/values/" + urllib.parse.quote(key, safe=""), json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json")
        if st != 200:
            self.errors.append(f"put {key[:24]}: HTTP {st}")
        return st == 200


def check_entry(entry: Any) -> str | None:
    """Return a skip reason, or None when the entry can become a leaf."""
    if not isinstance(entry, dict):
        return "not an object"
    if entry.get("schema") != ENTRY_SCHEMA:
        return f"schema {entry.get('schema')!r} is not {ENTRY_SCHEMA}"
    sha = entry.get("sha256")
    if not isinstance(sha, str) or not SHA_RE.match(sha):
        return "sha256 malformed"
    label = entry.get("label") or ""
    if not isinstance(label, str) or not LABEL_RE.match(label):
        return "label malformed or over 120 chars"
    if VERDICT_RE.search(label):
        return f"label carries a verdict word {VERDICT_RE.search(label).group(0)!r}"
    if not isinstance(entry.get("fetched_at"), str) or not entry["fetched_at"]:
        return "fetched_at missing"
    if not isinstance(entry.get("payment_ref"), str) or not entry["payment_ref"]:
        return "payment_ref missing"
    if entry.get("rfc3161_status") not in ("TIMESTAMPED", "UNCHECKABLE"):
        return f"rfc3161_status {entry.get('rfc3161_status')!r}"
    return None


def leaf_payload(entry: dict) -> dict:
    """Pure function of the entry: the same entry yields the same payload (and card sha) every hour."""
    p: dict[str, Any] = {
        "kind": KIND,
        "state": STATE,
        "sha256": entry["sha256"],
        "label": entry.get("label") or "",
        "fetched_at": entry["fetched_at"],
        "http_status": entry.get("http_status"),
        "rfc3161_tsa": entry.get("rfc3161_tsa"),
        "rfc3161_status": entry.get("rfc3161_status"),
        "rfc3161_token_sha256": entry.get("rfc3161_token_sha256"),
        "payment_ref": entry["payment_ref"],
        "attests": ATTESTS,
    }
    if entry.get("url_hash"):
        p["url_hash"] = entry["url_hash"]
    return p


def leaf_from_entry(entry: dict) -> dict:
    sha = entry["sha256"]
    label = (entry.get("label") or "").strip()
    subject = f"witness sha256:{sha[:16]}" + (f" {label}" if label else "")
    source_urls = [STATUS_URL.format(sha=sha)]
    tsa = entry.get("rfc3161_tsa")
    if isinstance(tsa, str) and tsa.startswith("https://") and tsa not in source_urls:
        source_urls.append(tsa)
    unmeasured = ["content (hash only; the bytes are never fetched into the root)"]
    if entry.get("rfc3161_status") != "TIMESTAMPED":
        unmeasured.append(f"rfc3161 (UNCHECKABLE: {entry.get('rfc3161_reason') or 'TSA did not answer'})"[:200])
    return {
        "surface": SURFACE,
        "subject": subject[:120],
        "as_of": entry["fetched_at"],
        "source_urls": source_urls,
        "payload": leaf_payload(entry),
        "unmeasured": unmeasured,
        "tags": list(TAGS),
    }


def public_entry(entry: dict) -> dict:
    return {k: entry.get(k) for k in PUBLIC_FIELDS if k in entry}


def mirror_dir(repo_root: Path) -> Path:
    return repo_root / MIRROR_REL


def read_mirrors(repo_root: Path) -> dict[str, dict]:
    out: dict[str, dict] = {}
    d = mirror_dir(repo_root)
    if not d.is_dir():
        return out
    for path in sorted(d.glob("*.json")):
        try:
            m = json.loads(path.read_text(encoding="utf-8"))
            e = m.get("entry") if isinstance(m, dict) else None
            if isinstance(e, dict) and e.get("schema") == ENTRY_SCHEMA and path.stem == e.get("sha256"):
                out[e["sha256"]] = e
        except Exception:
            continue
    return out


def write_mirror(repo_root: Path, entry: dict) -> bool:
    """Public fields only. Idempotent: rewrites only when the bytes would change."""
    d = mirror_dir(repo_root)
    d.mkdir(parents=True, exist_ok=True)
    path = d / f"{entry['sha256']}.json"
    body = json.dumps({"schema": MIRROR_SCHEMA, "note": "Public fields of a witnessed digest; the leaf payload is derived from these. Never the bytes, never the URL, never the timestamp reply.", "entry": {"schema": ENTRY_SCHEMA, **public_entry(entry)}}, indent=1, ensure_ascii=False, sort_keys=True) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == body:
        return False
    path.write_text(body, encoding="utf-8")
    return True


def _open_kv(env: dict[str, str] | None, transport: Transport | None) -> tuple[KV | None, str]:
    cfg = env_config(env)
    if not cfg:
        return None, "NOT_YET: CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID / WITNESS_KV_NAMESPACE_ID not all set"
    return KV(cfg, transport), "bound"


def _kv_entries(kv: KV) -> dict[str, dict]:
    out: dict[str, dict] = {}
    keys = kv.list_keys()
    if keys is None:
        return out
    for key in keys:
        if not key.startswith(KV_PREFIX):
            continue
        e = kv.get(key)
        if isinstance(e, dict) and e.get("sha256") == key[len(KV_PREFIX):]:
            out[e["sha256"]] = e
    return out


def collect(repo_root: Path | None = None, env: dict[str, str] | None = None, transport: Transport | None = None) -> dict[str, Any]:
    root = repo_root or Path(__file__).resolve().parents[2]
    kv, kv_state = _open_kv(env, transport)
    mirrors = read_mirrors(root)
    entries: dict[str, dict] = dict(mirrors)
    n_kv = 0
    if kv is not None:
        live = _kv_entries(kv)
        n_kv = len(live)
        entries.update(live)  # KV wins over a mirror for the same digest
        if kv.errors:
            kv_state = "bound; errors: " + "; ".join(kv.errors[:5])
    leaves: list[dict] = []
    skipped: list[dict[str, str]] = []
    for sha in sorted(entries):
        e = entries[sha]
        reason = check_entry(e)
        if reason:
            skipped.append({"sha256": sha[:16], "reason": reason})
            continue
        leaf = leaf_from_entry(e)
        if len(canonical_bytes(leaf["payload"])) > CAP:
            skipped.append({"sha256": sha[:16], "reason": f"payload > {CAP}B"})
            continue
        if VERDICT_RE.search(canonical_bytes(leaf).decode("utf-8")):
            skipped.append({"sha256": sha[:16], "reason": "verdict word on the leaf"})
            continue
        leaves.append(leaf)
    return {
        "leaves": leaves,
        "sidecar": {
            "kv": kv_state,
            "n_kv": n_kv,
            "n_mirror": len(mirrors),
            "n_leaves": len(leaves),
            "n_skipped": len(skipped),
            "skipped": skipped[:20],
            "note": (
                "Witnessed digests: existence of a sha256 at the root's as_of. Hash only; "
                "never the bytes, never the URL. RFC-3161 reply sha256 on the leaf; the reply "
                "itself at /api/witness/status. Signed only by the public-root writer. Never MEASURED. Not a grade."
            ),
        },
    }


def _root_payload_index(repo_root: Path, root_json: dict, domain: str) -> dict[str, list[tuple[str, bytes]]]:
    """Verify the root's exact digest domain and index its cards by payload.

    A witness entry identifies the payload that the publisher turns into a
    card. For whole-card roots the payload hash is not the Merkle leaf, so mark
    must locate the actual included card and reproduce its whole-card digest.
    Multiple included cards with the same payload are deliberately retained as
    multiple candidates; the caller rejects that ambiguity rather than picking.
    """
    shas = root_json.get("card_sha256")
    if not isinstance(shas, list) or any(not isinstance(value, str) or not SHA_RE.match(value) for value in shas):
        raise ValueError("root card_sha256 is not an array of 64-hex digests")
    if len(shas) != len(set(shas)):
        raise ValueError("root contains duplicate leaf digests")
    if root_json.get("card_count") is not None and root_json.get("card_count") != len(shas):
        raise ValueError("root card_count does not equal card_sha256 length")
    if root_json.get("merkle_root") != merkle_root(shas):
        raise ValueError("root merkle_root does not reproduce from card_sha256")

    index: dict[str, list[tuple[str, bytes]]] = {}
    for sha in shas:
        path = repo_root / "public" / "cards" / f"{sha[:16]}.json"
        if not path.is_file():
            raise ValueError(f"root card missing: {path.name}")
        try:
            wrapped = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise ValueError(f"root card unreadable: {path.name}") from exc
        card = wrapped.get("card") if isinstance(wrapped, dict) else None
        if not isinstance(card, dict):
            card = wrapped if isinstance(wrapped, dict) else None
        if not isinstance(card, dict) or card.get("sha256") != sha:
            raise ValueError(f"root card id mismatch: {path.name}")
        if card_digest_for_domain(card, domain) != sha:
            raise ValueError(f"root card does not verify under {domain}: {path.name}")
        payload = card.get("payload")
        if not isinstance(payload, dict):
            raise ValueError(f"root card payload is not an object: {path.name}")
        raw = canonical_bytes(payload)
        index.setdefault(payload_sha256(payload), []).append((sha, raw))
    return index


def _matching_root_cards(index: dict[str, list[tuple[str, bytes]]], entry: dict) -> list[str]:
    payload = leaf_payload(entry)
    raw = canonical_bytes(payload)
    return [sha for sha, candidate in index.get(payload_sha256(payload), []) if candidate == raw]


def mark(repo_root: Path | None = None, env: dict[str, str] | None = None, transport: Transport | None = None) -> dict[str, Any]:
    """After the tree is written: stamp included entries witnessed (once) and mirror them. Never raises."""
    root = repo_root or Path(__file__).resolve().parents[2]
    summary: dict[str, Any] = {
        "status": "ok",
        "marked": [],
        "upgraded_legacy": [],
        "mirrored": 0,
        "skipped": [],
        "errors": [],
    }
    try:
        root_json = json.loads((root / "public" / "root.json").read_text(encoding="utf-8"))
    except Exception as e:
        summary.update(status="UNCHECKABLE", errors=[f"root.json unreadable: {type(e).__name__}"])
        return summary
    merkle = root_json.get("merkle_root")
    as_of = root_json.get("as_of")
    anchors: dict[str, Any] = {}
    try:
        side = json.loads((root / "public" / "interop" / "root-witness-latest.json").read_text(encoding="utf-8"))
        if (side.get("artifact") or {}).get("merkle_root") == merkle:
            w = side.get("witnesses") or {}
            rk = w.get("rekor") or {}
            ots = w.get("ots") or {}
            anchors = {
                "merkle_root": merkle,
                "rekor": {k: rk.get(k) for k in ("status", "logIndex", "uuid", "url", "entry_file") if rk.get(k) is not None},
                "ots": {k: ots.get(k) for k in ("status", "path", "url") if ots.get(k) is not None},
                "sidecar": "https://councilof.ai/interop/root-witness-latest.json",
            }
    except Exception:
        anchors = {}
    kv, kv_state = _open_kv(env, transport)
    if kv is None:
        summary.update(status="NOT_YET", errors=[kv_state])
        return summary

    try:
        digest_domain, domain_source = resolve_leaf_digest_domain(root_json)
        root_index = _root_payload_index(root, root_json, digest_domain)
    except (DigestDomainError, ValueError) as exc:
        summary.update(status="UNCHECKABLE", errors=[f"root digest domain: {exc}"])
        return summary
    summary["root_digest_domain"] = digest_domain
    summary["root_digest_domain_source"] = domain_source

    for sha, entry in _kv_entries(kv).items():
        reason = check_entry(entry)
        if reason:
            summary["skipped"].append({"sha256": sha[:16], "reason": reason})
            continue

        witnessed = entry.get("witnessed") if entry.get("status") == "witnessed" else None
        if isinstance(witnessed, dict):
            recorded_domain = witnessed.get("card_digest_domain")
            if recorded_domain in KNOWN_DOMAINS:
                # New-format witness stamps carry their original root's exact
                # domain, so they remain idempotent even after that root ages out.
                recorded_kind = witnessed.get("root_kind")
                if recorded_kind is not None:
                    try:
                        resolved, _ = resolve_leaf_digest_domain(
                            {"kind": recorded_kind, "leaf_digest_domain": recorded_domain}
                        )
                    except DigestDomainError as exc:
                        summary["skipped"].append({"sha256": sha[:16], "reason": f"witnessed digest domain: {exc}"})
                        continue
                    if resolved != recorded_domain:
                        summary["skipped"].append({"sha256": sha[:16], "reason": "witnessed digest domain mismatch"})
                        continue
                if write_mirror(root, entry):
                    summary["mirrored"] += 1
                continue
            if recorded_domain is not None:
                summary["skipped"].append(
                    {"sha256": sha[:16], "reason": f"unsupported witnessed card_digest_domain {recorded_domain!r}"}
                )
                continue

            # A historical stamp without a domain is upgraded only if its
            # original claim is provable against the CURRENT verified root and
            # resolves to exactly one card. Otherwise preserve KV and emit no
            # mirror: choosing payload vs whole-card here would be a guess.
            matches = _matching_root_cards(root_index, entry)
            if (
                len(matches) == 1
                and witnessed.get("merkle_root") == merkle
                and witnessed.get("card_sha256") == matches[0]
            ):
                witnessed["card_digest_domain"] = digest_domain
                witnessed["root_kind"] = root_json.get("kind")
                witnessed["root_digest_domain_source"] = domain_source
                if kv.put(KV_PREFIX + sha, entry):
                    summary["upgraded_legacy"].append(sha[:16])
                if write_mirror(root, entry):
                    summary["mirrored"] += 1
                continue
            summary["skipped"].append(
                {
                    "sha256": sha[:16],
                    "reason": "legacy witnessed record has no digest domain and cannot be uniquely proved against current root",
                }
            )
            continue

        matches = _matching_root_cards(root_index, entry)
        if len(matches) > 1:
            summary["skipped"].append(
                {"sha256": sha[:16], "reason": "multiple root cards carry this witness payload; digest identity is ambiguous"}
            )
            continue
        if not matches:
            continue  # not in this root (yet)
        card_sha = matches[0]
        entry["status"] = "witnessed"
        entry["witnessed"] = {
            "root_as_of": as_of,
            "merkle_root": merkle,
            "card_sha256": card_sha,
            "card_digest_domain": digest_domain,
            "root_kind": root_json.get("kind"),
            "root_digest_domain_source": domain_source,
            "card_url": f"/cards/{card_sha[:16]}.json",
            "proof_url": f"/api/proof?sha={card_sha}",
            **({"anchors": anchors} if anchors else {}),
        }
        if kv.put(KV_PREFIX + sha, entry):
            summary["marked"].append(sha[:16])
        if write_mirror(root, entry):
            summary["mirrored"] += 1
    if kv.errors:
        summary["errors"].extend(kv.errors[:10])
    return summary


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="witness queue adapter (collect | --mark)")
    ap.add_argument("--mark", action="store_true", help="after publish: stamp included entries witnessed in KV + mirror")
    args = ap.parse_args()
    if args.mark:
        out = mark()
        print(json.dumps(out, indent=1, ensure_ascii=False))
        sys.exit(0)  # marking never fails the publish
    out = collect()
    print(json.dumps({"n_leaves": len(out["leaves"]), "sidecar": out["sidecar"]}, indent=1, ensure_ascii=False))
    sys.exit(0)
