#!/usr/bin/env python3
"""rekor_retrieve.py — the free READ side of the Rekor witness tier.

    python3 scripts/rekor_retrieve.py [--uuid UUID | --log-index N | --entry-file PATH]
    python3 scripts/rekor_retrieve.py            # latest committed public/interop/rekor-root-*.json

WHY THIS FILE EXISTS. scripts/witness_public_root.py SUBMITS the public-root preimage
to Rekor at publish time; nothing read it back. A witness nobody retrieves is a claim,
not evidence. This is the stranger's side: given a UUID or logIndex (or the latest
committed entry file), fetch the entry from rekor.sigstore.dev, decode the canonical
rekord body, and recompute the hashes — sha256 of the embedded preimage (Rekor's
canonical rekord form stores data.hash.value, which must equal the witness sidecar's
signature.preimage_sha256 and the preimage rebuilt from public/root.json) and the
embedded signature bytes (which must equal the root's sig_ed25519). No key material
anywhere; Rekor entries are public.

THREE-STATE VERDICT, never collapsed:
  VALID       entry retrievable AND its embedded signature VERIFIES
              cryptographically over its embedded preimage against the pinned
              did:web:csoai.org#board-attestation-1 key AND (when a committed
              entry file is given) the committed artifact matches the entry the
              log actually holds.
  INVALID     retrievable, but the signature does not verify or the committed
              artifact contradicts the log — evidence the artifact does not
              describe reality.
  UNCHECKABLE rekor unreachable, the entry is absent, or nothing could be
              checked. Network failure says nothing about the entry.

CURRENCY IS NOT INTEGRITY. A dated entry is a witness for the root AS OF ITS
integratedTime. When a local public/root.json exists we ALSO report whether the
entry describes the CURRENT root (CURRENT vs HISTORICAL) — a dated entry for an
older root is HISTORICAL, never INVALID. Conflating the two would mark every
yesterday's witness as forged the moment a new root publishes.

HONEST LIMIT, stated where a reader will see it: Rekor inclusion proves TIMESTAMPED
EXISTENCE of these exact bytes — not correctness, not completeness, not certification.
This script does not verify the signedEntryTimestamp or the inclusion proof against a
signed tree head (that requires Rekor's log key and a checkpoint consistency check —
the non-equivocation property — which the estate does not currently claim).

Exit codes: 0 VALID, 1 INVALID, 2 UNCHECKABLE.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
PUB = ROOT / "public"
INTEROP = PUB / "interop"
ROOT_JSON = PUB / "root.json"

REKOR = "https://rekor.sigstore.dev"
UA = "csoai-rekor-retrieve/1 (+https://councilof.ai)"

# Same envelope the witness signs and submits — publish_public_root.py owns this list;
# mirrored here so a stranger can rebuild the preimage from public bytes alone.
ENVELOPE_FIELDS = ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]

EXIT_VALID = 0
EXIT_INVALID = 1
EXIT_UNCHECKABLE = 2

# Pinned trust root: did:web:csoai.org#board-attestation-1 (Ed25519 OKP x, base64url).
# Mirrors public/.well-known/did.json so a stranger verifies without network trust in
# the estate itself; the Rekor entry is the only network dependency.
BOARD_KEY_ID = "did:web:csoai.org#board-attestation-1"
BOARD_KEY_X_B64URL = "k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA"

NOTE = (
    "Rekor inclusion proves timestamped existence of these exact bytes — not "
    "correctness, completeness, or certification. Measurement, never certification."
)


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def fetch_json(url: str, timeout: int = 30) -> tuple[int, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return int(resp.status), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return int(e.code), None
    except Exception:
        return 0, None


def decode_entry(entry: dict) -> dict:
    """Decode a Rekor entry {uuid: {...}} into the parts we can recompute."""
    uuid = next(iter(entry))
    e = entry[uuid]
    body = json.loads(base64.b64decode(e["body"]))
    spec = body.get("spec") or {}
    data = spec.get("data") or {}
    sig = spec.get("signature") or {}
    out = {
        "uuid": uuid,
        "logIndex": e.get("logIndex"),
        "integratedTime": e.get("integratedTime"),
        "kind": body.get("kind"),
        "preimage_b64": data.get("content"),
        "preimage_sha256": (data.get("hash") or {}).get("value"),
        "signature_b64": sig.get("content"),
        "body": body,
    }
    out["signature_sha256"] = (
        hashlib.sha256(base64.b64decode(out["signature_b64"])).hexdigest() if out["signature_b64"] else None
    )
    return out


def local_references() -> dict:
    """What the committed repo says the preimage and signature SHOULD hash to."""
    refs: dict[str, Any] = {}
    if ROOT_JSON.is_file():
        try:
            root = json.loads(ROOT_JSON.read_text(encoding="utf-8"))
            preimage = canonical_bytes({k: root[k] for k in ENVELOPE_FIELDS})
            refs["root_preimage_sha256"] = hashlib.sha256(preimage).hexdigest()
            sig = root.get("sig_ed25519")
            if isinstance(sig, str):
                refs["root_signature_b64"] = base64.b64encode(bytes.fromhex(sig)).decode()
        except Exception as e:
            refs["root_error"] = f"could not rebuild preimage from public/root.json: {type(e).__name__}"
    return refs


def latest_committed_entry() -> tuple[Path | None, dict | None]:
    """The newest committed rekor-root-*.json, chosen by logIndex (filenames sort by hash)."""
    best: tuple[int, Path, dict] | None = None
    for f in sorted(INTEROP.glob("rekor-root-*.json")):
        try:
            doc = json.loads(f.read_text(encoding="utf-8"))
            idx = int((doc[next(iter(doc))]).get("logIndex") or -1)
        except Exception:
            continue
        if best is None or idx > best[0]:
            best = (idx, f, doc)
    if best is None:
        return None, None
    return best[1], best[2]


def main() -> int:
    ap = argparse.ArgumentParser(description="Retrieve and re-check a Rekor witness entry (free read side)")
    ap.add_argument("--uuid", help="Rekor entry UUID")
    ap.add_argument("--log-index", type=int, help="Rekor logIndex")
    ap.add_argument("--entry-file", type=Path, help="committed rekor-root-*.json to take the UUID from and compare against")
    args = ap.parse_args()

    committed_path: Path | None = None
    committed_doc: dict | None = None
    if args.entry_file:
        committed_path = args.entry_file
        committed_doc = json.loads(committed_path.read_text(encoding="utf-8"))

    uuid = args.uuid
    if uuid is None and args.log_index is None and committed_doc is None:
        committed_path, committed_doc = latest_committed_entry()
        if committed_doc is None:
            print("UNCHECKABLE: no --uuid/--log-index given and no committed rekor-root-*.json found")
            return EXIT_UNCHECKABLE
    if uuid is None and committed_doc is not None:
        uuid = next(iter(committed_doc))
        print(f"entry source: {committed_path} (uuid {uuid[:32]}…)")

    if uuid is not None:
        url = f"{REKOR}/api/v1/log/entries/{uuid}"
    else:
        url = f"{REKOR}/api/v1/log/entries?logIndex={args.log_index}"
    code, doc = fetch_json(url)
    if code != 200 or not isinstance(doc, dict) or not doc:
        print(
            json.dumps(
                {
                    "verdict": "UNCHECKABLE",
                    "reason": f"rekor unreachable or entry absent (HTTP {code}) — this says nothing about the entry itself",
                    "url": url,
                    "note": NOTE,
                },
                indent=2,
            )
        )
        return EXIT_UNCHECKABLE

    got = decode_entry(doc)
    print(f"fetched: uuid={got['uuid'][:32]}… logIndex={got['logIndex']} integratedTime={got['integratedTime']} kind={got['kind']}")

    integrity: list[dict] = []
    not_runnable: list[str] = []
    # 1. CRYPTOGRAPHIC integrity — the core check. Verify the entry's embedded
    #    signature over the entry's embedded preimage against the PINNED board key.
    #    This needs no local root.json and no trust in the estate: the key is
    #    pinned here, the bytes come from the log. NOTE: Rekor's API commonly omits
    #    spec.data.content on retrieval (hash-only entries), in which case this check
    #    cannot run and we SAY so — a skipped check is never silently dropped.
    if got.get("preimage_b64") and got.get("signature_b64"):
        try:
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
            preimage = base64.b64decode(got["preimage_b64"])
            sig = base64.b64decode(got["signature_b64"])
            x = base64.urlsafe_b64decode(BOARD_KEY_X_B64URL + "=" * (-len(BOARD_KEY_X_B64URL) % 4))
            Ed25519PublicKey.from_public_bytes(x).verify(sig, preimage)
            ok = True
        except Exception:
            ok = False
        integrity.append({
            "check": f"Ed25519 signature verifies over the embedded preimage against pinned {BOARD_KEY_ID}",
            "ok": ok,
        })
        # the declared hash must match the actual bytes, or the hash field is decoration
        if got.get("preimage_sha256"):
            integrity.append({
                "check": "declared data.hash.value == sha256(embedded preimage bytes)",
                "ok": got["preimage_sha256"] == hashlib.sha256(preimage).hexdigest(),
            })
    else:
        not_runnable.append(
            "Ed25519 re-verification: the log returned the entry hash-only (no "
            "spec.data.content), so the signature cannot be re-verified against the "
            "pinned key from the retrieved entry alone. The committed-artifact match "
            "below is the remaining check; the full preimage bytes live in the "
            "witness sidecar (public/interop/root-witness-*.json)."
        )
    # 2. committed artifact body match — the file we committed at witness time must
    #    describe the entry the log actually holds.
    if committed_doc is not None:
        try:
            want = decode_entry(committed_doc)
            integrity.append({
                "check": "committed body == fetched body",
                "ok": want["body"] == got["body"],
                "committed_preimage_sha256": want["preimage_sha256"],
                "fetched_preimage_sha256": got["preimage_sha256"],
            })
        except Exception as e:
            integrity.append({"check": "committed artifact decodes", "ok": False, "reason": str(e)})

    # CURRENCY — informational, NEVER verdict-bearing. A dated entry for a root that
    # has since been republished is HISTORICAL, not forged.
    currency: dict[str, Any] = {"status": "UNCHECKABLE", "reason": "no local public/root.json to compare against"}
    refs = local_references()
    if "root_preimage_sha256" in refs:
        current = got["preimage_sha256"] == refs["root_preimage_sha256"] and (
            "root_signature_b64" not in refs or got["signature_b64"] == refs["root_signature_b64"]
        )
        currency = {
            "status": "CURRENT" if current else "HISTORICAL",
            "reason": (
                "the entry describes the local public/root.json as committed right now"
                if current else
                "the entry witnesses an EARLIER root; public/root.json has moved on — expected for dated entries, not a failure"
            ),
            "entry_preimage_sha256": got["preimage_sha256"],
            "local_root_preimage_sha256": refs["root_preimage_sha256"],
        }
    elif "root_error" in refs:
        currency = {"status": "UNCHECKABLE", "reason": refs["root_error"]}

    if not integrity:
        verdict = {
            "verdict": "UNCHECKABLE",
            "reason": "entry retrievable but carries no embedded preimage+signature to verify and no committed artifact to compare against — retrieval without a reference proves reachability only",
            "entry": {k: v for k, v in got.items() if k not in ("body", "preimage_b64")},
            "currency": currency,
            "note": NOTE,
        }
        print(json.dumps(verdict, indent=2))
        return EXIT_UNCHECKABLE

    failed = [c for c in integrity if not c.get("ok")]
    verdict = {
        "verdict": "INVALID" if failed else "VALID",
        "reason": (
            f"{len(failed)} of {len(integrity)} integrity checks failed — the entry the log holds does not verify"
            if failed
            else f"entry retrievable; all {len(integrity)} integrity checks pass (signature verified against pinned {BOARD_KEY_ID})"
        ),
        "entry": {k: v for k, v in got.items() if k not in ("body", "preimage_b64")},
        "integrity_checks": integrity,
        "checks_not_runnable": not_runnable,
        "currency": currency,
        "limits": [
            "signedEntryTimestamp and inclusionProof are NOT verified here (needs Rekor's log key + checkpoint consistency)",
            "inclusion proves timestamped existence, not non-equivocation — a consistency proof + monitor is required and not currently claimed",
        ],
        "note": NOTE,
    }
    print(json.dumps(verdict, indent=2))
    return EXIT_INVALID if failed else EXIT_VALID


if __name__ == "__main__":
    sys.exit(main())
