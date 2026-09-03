#!/usr/bin/env python3
"""One writer: adapters → cards → merkle → root → proofs → publisher-health.

Canonical form: UTF-8 JSON, sorted keys, separators (',', ':'), ensure_ascii=false.
SHA-256 of the canonical payload object is the card id. 3KB cap on that payload.
Do not mix with the GSPC ensure_ascii=true signer.

Halt-on-split: live apex merkle is newer than committed.
Halt-on-unsigned-leaf: any leaf not in the 07:38Z unsigned set must be signed.
Halt-on-missing-key: exit 3. Never publish unsigned NEW leaves.
Never print BOARD_SIGN_KEY. Never stamp MEASURED. Never certify.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from adapters import (  # noqa: E402
    # NOTE 2026-09-03: `_coverage` and `fin` were listed here but no such modules
    # exist and never have (no delete in git history). Neither name was used —
    # only fin7_coverage.collect() is called. The dead names raised
    # ImportError at module load, so this publisher could not run AT ALL.
    benji,
    evm_permission_events,
    evm_permissions,
    fin7_coverage,
    genai_mil_notices,
    hub_cite,
    provider_diff,
    staged_leaves,
    swift_notices,
    witness_queue,
    xrpl,
)

CARD_SCHEMA = "https://councilof.ai/schema/card-v1.json"
ENVELOPE_SCHEMA = "https://councilof.ai/schema/public-root-v0.json"
DID = "did:web:csoai.org#board-attestation-1"
SURFACES = {
    "xrpl.asset.state",
    "xrpl.basket.root",
    "public.notice",
    "benji.onchain.supply",
}
PAYLOAD_CAP = 3072
LIVE_ROOT = "https://councilof.ai/root.json"
UA = "csoai-public-root-writer/0 (+https://councilof.ai/root.json)"

# 2026-08-31T07:38:20Z snapshot is the last unsigned set.
LAST_UNSIGNED_AS_OF = "2026-08-31T07:38:20Z"
LAST_UNSIGNED_SHAS = (
    "3295a9a825ae77c1252792a01f9b4e0c934806ab01947c8f40481df18b0742b5",
    "db0b73be80fe42fa21a678a66390de94618b969d36584698e3076185dd7b663e",
    "97b47c182deca6027a1c7cf4248545bc4e92f9927779b5386d32c9318a3f3d3c",
    "f5076aba9902504024e38abb6e2a7f5ed60312e87ffd05ee4695bee505e57b5c",
    "422bcf74d1f1cc1de50038c2f79cea1619afe5cd14119d8de2bc972b75c94b72",
    "d2e20313f3aa6949a9fa38438a640865bf82d7f5cdad39a4b0f1ab034155b386",
    "812f76fcf1c93032edacab744de61b70e3044fa5e74fa125638d8d3f0f00c90b",
    "0d1dcb7884e6d428692f10fceb80f519b5c72e2f5d89d28d602a00382b7c6bbd",
    "f786d52859f8b777c9f76c3ec7e136fd598ac6d6eb689187b2ff3972179427f2",
    "14bd33b898ffce786cfe961adddd88d14aa14bec1f62b2f820763aa5610ec2ee",
    "0b9e11b5eb4a1a5a8b82bc89d7456319dbf4003c428d5d44fa5738bb742a7804",
    "2be0db70cac319a091ecb2806336f357954206b6c0cc887e77debfca08cfc9c3",
    "1104301c7291fee009ccb2530475883672d9917c2591f7fc3fb700f6fbd18123",
    "6a62c35ee6fc2921475deb671130910c50f3fec92381a185eba563bbd9d06144",
    "61d2e24b4dda9cd9ff4b4e5e7d8b3e66b5a3d83cbba98fa3199a557163597f49",
    "dfd2c79af1c7f02aee9a10b7e2d51a015b293197b00dc58f2182dce96a71ff97",
    "d600ef9d53e2deb5bd0ee15be845c2b3ed82ad5be6fb3ded36264887d5c40e77",
    "04d1988c4d1c197083d935cb35d4b420a9f5804fcb9c41d1d097185610f186bd",
    "f5e272f24a7c695739495ebaa2cd9f3ac625f80ed5032a623987046d61b13009",
    "3ea1788781ed6d74743fa367542bb5d51e1fd7551b41dbb48e2e3d10bb4ce35e",
    "249a93638af9db2ad802c72d2ce589e4ade0ec944300df8c15f6df249a994475",
    "96619dbe61d88080e6f14e2cc4bcb1ac30aaa0de7b1cbcd2cc58e0024711cab7",
)
LAST_UNSIGNED_SET = frozenset(LAST_UNSIGNED_SHAS)

EXIT_OK = 0
EXIT_SPLIT = 2
EXIT_MISSING_KEY = 3
EXIT_UNSIGNED = 4
EXIT_BAD = 1


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


# Compact envelope preimage — board-sign cap is 3KB; the full root with card_sha256[]
# does not fit. merkle_root binds the leaf list. Never laptop-sign.
ENVELOPE_PREIMAGE_KEYS = (
    "kind",
    "schema",
    "as_of",
    "merkle_root",
    "card_count",
    "did_intended",
)


def envelope_preimage(root_body: dict) -> dict:
    return {k: root_body[k] for k in ENVELOPE_PREIMAGE_KEYS}


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def payload_sha256(payload: dict) -> str:
    """card-v0 leaf digest: the PAYLOAD ONLY.

    Retained so v0 cards already in a published root stay checkable. Do not use
    it for new cards — see card_sha256() and the note there.
    """
    raw = canonical_bytes(payload)
    if len(raw) > PAYLOAD_CAP:
        raise ValueError(f"payload {len(raw)} bytes exceeds {PAYLOAD_CAP} cap")
    return sha256_hex(raw)


# Fields that cannot be inside their own digest.
DIGEST_EXCLUDES = ("sha256", "sig_ed25519")


def card_sha256(card: dict) -> str:
    """card-v1 leaf digest: THE WHOLE CARD except its own digest and signature.

    Why this exists (2026-09-03). v0 hashed `payload` alone, so `subject`,
    `source_urls`, `as_of`, `did`, `surface`, `tags` and `unmeasured` all sat
    OUTSIDE the merkle tree. Demonstrated on the real code:

        subject honest   : "Qwen/Qwen3-30B governance run"
        subject tampered : "TOTALLY DIFFERENT CLAIM"
        source  tampered : "https://evil.example/fake"
        leaf digest      : e52f814957f02a0aef7de67ca93250f9…  (IDENTICAL)

    A card's claim text and its evidence URL could both be rewritten and the
    leaf, the merkle root and the inclusion proof would all still verify. For a
    measurement body whose product is "follow the link and check", that is the
    worst possible hole: the link was not covered.

    v1 binds every field a relying party reads. The payload cap still applies to
    the payload, not to the card.
    """
    raw = canonical_bytes(payload_of(card))
    if len(canonical_bytes(card.get("payload") or {})) > PAYLOAD_CAP:
        raise ValueError("payload exceeds cap")
    return sha256_hex(raw)


def payload_of(card: dict) -> dict:
    return {k: v for k, v in card.items() if k not in DIGEST_EXCLUDES}


def merkle_root(leaf_hexes: list[str]) -> str:
    level = [bytes.fromhex(h) for h in leaf_hexes]
    if not level:
        return sha256_hex(b"")
    while len(level) > 1:
        nxt: list[bytes] = []
        for i in range(0, len(level), 2):
            a = level[i]
            b = level[i + 1] if i + 1 < len(level) else level[i]
            nxt.append(hashlib.sha256(a + b).digest())
        level = nxt
    return level[0].hex()


def merkle_proof(leaf_hexes: list[str], target: str) -> list[str]:
    level = [bytes.fromhex(h) for h in leaf_hexes]
    idx = leaf_hexes.index(target)
    proof: list[str] = []
    while len(level) > 1:
        if idx % 2 == 0:
            sib = idx + 1 if idx + 1 < len(level) else idx
        else:
            sib = idx - 1
        proof.append(level[sib].hex())
        nxt = []
        for i in range(0, len(level), 2):
            a = level[i]
            b = level[i + 1] if i + 1 < len(level) else level[i]
            nxt.append(hashlib.sha256(a + b).digest())
        idx //= 2
        level = nxt
    return proof


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_json(url: str, timeout: int = 20) -> tuple[int, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return int(resp.status), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return int(e.code), None
    except Exception:
        return 0, None


def key_present() -> bool:
    v = os.environ.get("BOARD_SIGN_KEY_PKCS8_B64", "")
    return bool(v.strip())


def oidc_available() -> bool:
    return bool(os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL") and os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN"))


def signer_available() -> bool:
    """GHA PKCS8 or Pages OIDC relay. Never a laptop key."""
    return key_present() or oidc_available()


def sign_via_oidc(payload: dict) -> str | None:
    """Ask Pages /api/board-sign using the job's GitHub OIDC token. Key stays on Pages."""
    req_url = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL") or ""
    req_tok = os.environ.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN") or ""
    sign_url = os.environ.get("BOARD_SIGN_URL") or "https://councilof.ai/api/board-sign"
    if not req_url or not req_tok:
        return None
    sep = "&" if "?" in req_url else "?"
    aud = "https://councilof.ai/api/board-sign"
    token_req = urllib.request.Request(
        req_url + sep + "audience=" + urllib.parse.quote(aud, safe=""),
        headers={"Authorization": f"Bearer {req_tok}", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(token_req, timeout=20) as resp:
            oidc = json.loads(resp.read().decode("utf-8")).get("value")
    except Exception as e:
        print(f"oidc token request failed: {type(e).__name__}", file=sys.stderr)
        return None
    if not isinstance(oidc, str) or not oidc:
        return None
    body = json.dumps({"payload": payload}, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    sign_req = urllib.request.Request(
        sign_url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {oidc}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": UA,
        },
    )
    try:
        with urllib.request.urlopen(sign_req, timeout=30) as resp:
            out = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read()[:240].decode("utf-8", "replace") if e.fp else ""
        print(f"board-sign HTTP {e.code} {err}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"board-sign failed: {type(e).__name__}", file=sys.stderr)
        return None
    sig = out.get("sig_ed25519") if isinstance(out, dict) else None
    return sig if isinstance(sig, str) and len(sig) >= 64 else None


def load_key():
    raw = os.environ.get("BOARD_SIGN_KEY_PKCS8_B64", "").strip()
    if not raw:
        return None
    try:
        from cryptography.hazmat.primitives.serialization import load_der_private_key
    except ImportError:
        print("cryptography not installed; cannot sign", file=sys.stderr)
        return None
    der = base64.b64decode(raw)
    return load_der_private_key(der, password=None)


def sign_payload(payload: dict, key) -> str:
    if key is not None:
        return key.sign(canonical_bytes(payload)).hex()
    remote = sign_via_oidc(payload)
    if remote:
        return remote
    raise RuntimeError("no PKCS8 and OIDC board-sign unavailable")


def sign_card(card: dict, key) -> str:
    """Sign the SAME bytes the leaf digest covers.

    Signing leaf["payload"] (as this did before 2026-09-03) left `subject` and
    `source_urls` outside the signature as well as outside the merkle tree — so
    the claim text and the evidence link were attested by nothing. payload_of()
    excludes sig_ed25519, so attaching the signature afterwards does not disturb
    either the preimage or card["sha256"].
    """
    return sign_payload(payload_of(card), key)


def make_card(leaf: dict, sig: str | None, will_sign: bool | None = None) -> dict:
    """Build a card. `will_sign` lets the caller state that a signature is coming.

    The signature is produced OVER this card (see sign_card), so the card must be
    finished before it can be signed. Passing will_sign=True keeps the
    NO_LAPTOP_SIGN tag off a card we are about to sign, without ever claiming a
    signature that does not arrive — the caller rebuilds with will_sign=False if
    signing fails.
    """
    surface = leaf["surface"]
    if surface not in SURFACES:
        raise ValueError(f"unknown surface {surface}")
    payload = leaf["payload"]
    missing = list(leaf.get("unmeasured") or [])
    signed = (sig is not None) if will_sign is None else will_sign
    if not signed:
        tag = "sig_ed25519 against #board-attestation-1 (NO_LAPTOP_SIGN)"
        if not any("sig_ed25519" in x for x in missing):
            missing.append(tag)
    card = {
        "as_of": leaf["as_of"] or now_iso(),
        "did": DID,
        "digest_covers": "whole-card-except-sha256-and-sig_ed25519",
        "sig_covers": "whole-card-except-sha256-and-sig_ed25519",
        "payload": payload,
        "schema": CARD_SCHEMA,
        "sha256": None,
        "sig_ed25519": sig,
        "source_urls": list(leaf["source_urls"]),
        "subject": leaf["subject"],
        "surface": surface,
        "tags": list(leaf.get("tags") or []),
        "unmeasured": missing,
    }
    # digest LAST, over the finished card — so subject and source_urls are bound
    card["sha256"] = card_sha256(card)
    return card


def load_committed() -> dict:
    path = ROOT / "public" / "root.json"
    return json.loads(path.read_text(encoding="utf-8"))


def halt_on_split(committed: dict) -> int | None:
    code, live = fetch_json(LIVE_ROOT)
    if code != 200 or not isinstance(live, dict) or not live.get("merkle_root"):
        print(f"split-check: live apex root HTTP {code} — continuing against committed")
        return None
    live_as_of = str(live.get("as_of") or "")
    comm_as_of = str(committed.get("as_of") or "")
    live_m = live.get("merkle_root")
    comm_m = committed.get("merkle_root")
    print(f"split-check: live as_of={live_as_of} merkle={live_m}")
    print(f"split-check: committed as_of={comm_as_of} merkle={comm_m}")
    if live_m != comm_m and live_as_of > comm_as_of:
        print(
            "HALT-ON-SPLIT: live apex merkle is newer than committed. "
            "Refusing to overwrite a newer published root.",
            file=sys.stderr,
        )
        return EXIT_SPLIT
    return None


def validate_committed(committed: dict) -> None:
    shas = list(committed.get("card_sha256") or [])
    cards_dir = ROOT / "public" / "cards"
    for sha in shas:
        path = cards_dir / f"{sha[:16]}.json"
        if not path.is_file():
            raise SystemExit(f"committed card missing: {path}")
        wrapped = json.loads(path.read_text(encoding="utf-8"))
        card = wrapped.get("card") or wrapped
        if card.get("sha256") != sha:
            raise SystemExit(f"sha mismatch in {path}")
        # v1 leaves cover the whole card; v0 leaves already in a published root
        # cover the payload only. Both must stay checkable.
        if sha not in (card_sha256(card), payload_sha256(card["payload"])):
            raise SystemExit(f"leaf digest\u2260id in {path}: {sha}")
        if len(canonical_bytes(card["payload"])) > PAYLOAD_CAP:
            raise SystemExit(f"payload cap in {path}")
    got_m = merkle_root(shas)
    if got_m != committed.get("merkle_root"):
        raise SystemExit(f"committed merkle mismatch {got_m}")
    print(f"committed tree ok: n={len(shas)} merkle={got_m}")


def write_pretty(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_halt_health(
    committed: dict,
    *,
    reason: str,
    have_key: bool,
    split: bool = False,
    unsigned_new: int = 0,
    extra: dict | None = None,
    dry_run: bool = False,
) -> None:
    """Honest sidecar before first signed hour. Does not rewrite the tree."""
    health = {
        "kind": "csoai.publisher-health/v0",
        "as_of": now_iso(),
        "last_success": "unsigned-snapshot",
        "last_success_as_of": LAST_UNSIGNED_AS_OF,
        "writer": "scripts/publish_public_root.py",
        "dry_run": dry_run,
        "key": "present" if have_key else "absent",
        "halt": {
            "split": split,
            "unsigned_new_leaves": unsigned_new,
            "missing_key": reason == "missing-key",
            "reason": reason,
        },
        "merkle_root": committed.get("merkle_root"),
        "card_count": committed.get("card_count"),
        "xrpl_asset_state_count": 16,
        "adapters": extra.get("adapters") if extra and "adapters" in extra else None,
        "note": (
            "Halt health. Tree not rewritten. Last success is the 07:38Z unsigned snapshot. "
            "Fail-closed. Not MEASURED. Not a certificate."
        ),
    }
    if extra:
        for k, v in extra.items():
            if k != "adapters":
                health[k] = v
    if health["adapters"] is None:
        health.pop("adapters", None)
    print(f"halt health: reason={reason} dry_run={dry_run} write={not dry_run}", flush=True)
    if dry_run:
        return
    write_pretty(ROOT / "public" / "publisher-health.json", health)


def main() -> int:
    ap = argparse.ArgumentParser(description="One writer for csoai.public-root/v0")
    ap.add_argument("--dry-run", action="store_true", help="run adapters + halts; do not write")
    ap.add_argument(
        "--validate-committed",
        action="store_true",
        help="only verify the committed tree + split check",
    )
    args = ap.parse_args()

    # Never print the secret. Presence only.
    print(
        f"BOARD_SIGN_KEY_PKCS8_B64: {'present' if key_present() else 'absent'}; "
        f"oidc: {'yes' if oidc_available() else 'no'}",
        flush=True,
    )

    committed = load_committed()
    validate_committed(committed)
    split = halt_on_split(committed)
    if split is not None:
        write_halt_health(committed, reason="split", have_key=key_present(), split=True, dry_run=args.dry_run)
        return split
    if args.validate_committed:
        return EXIT_OK

    xrpl_out = xrpl.collect()
    notices_out = swift_notices.collect()
    benji_out = benji.collect()
    fin7_out = fin7_coverage.collect()
    genai_mil_out = genai_mil_notices.collect()
    staged_out = staged_leaves.collect(ROOT)
    provider_diff_out = provider_diff.collect(ROOT)
    hub_out = hub_cite.collect(ROOT)
    witness_out = witness_queue.collect(ROOT)
    # EVM permission state (+ EIP-1186 proofs) and permission-event history for
    # the tokenised-RWA roster. Public RPCs only; never raise; dark RPC = fewer
    # leaves. See scripts/adapters/evm_permissions.py / evm_permission_events.py
    # and docs/PROVABLE-ARCHIVE-METHOD.md.
    evm_out = evm_permissions.collect()
    evm_events_out = evm_permission_events.collect(ROOT)

    leaves: list[dict] = []
    leaves.extend(xrpl_out["leaves"])
    leaves.extend(benji_out["leaves"])
    leaves.extend(notices_out["leaves"])
    leaves.extend(fin7_out["leaves"])
    # GenAI.mil public-notice leaves (war.gov 31 Aug, FedRAMP gap, vendor
    # claim-vs-card x4, NIST crosswalk). Facts, not measurements. New leaves stay
    # UNSIGNED until the GHA OIDC job signs them; deployments UNCHECKABLE.
    leaves.extend(genai_mil_out["leaves"])
    # Staged UNSIGNED atoms from the XRPL/SWIFT eater (file reader, no network,
    # never raises). public.notice only; PROBED/DISCOVERED/UNMEASURED on the
    # payload; signed here or not at all. See scripts/adapters/staged_leaves.py.
    leaves.extend(staged_out["leaves"])
    # Witnessed digests from the x402 rail (/api/witness → WITNESS_KV, read over the
    # Cloudflare KV REST API; mirrors under public/interop/witness/ keep a landed leaf
    # landing). Hash only — never the bytes, never the URL. public.notice, PROBED,
    # kind csoai.witness.hash/0.1. Absent config → no leaves, never a halt.
    leaves.extend(witness_out["leaves"])
    # Provider-diff leaves (hash-only document change notices + daily capture
    # summary) staged by scripts/watch/provider_watch.py. File reader, no
    # network, never raises. See scripts/adapters/provider_diff.py.
    leaves.extend(provider_diff_out["leaves"])
    leaves.extend(evm_out["leaves"])
    leaves.extend(evm_events_out["leaves"])

    have_pkcs8 = key_present()
    have_key = signer_available()
    key = load_key() if have_pkcs8 else None
    if have_pkcs8 and key is None:
        print("HALT-ON-MISSING-KEY: secret present but key did not load", file=sys.stderr)
        write_halt_health(committed, reason="missing-key", have_key=True, dry_run=args.dry_run)
        return EXIT_MISSING_KEY

    cards: list[dict] = []
    new_unsigned: list[str] = []
    legacy_digests: list[str] = []
    for leaf in leaves:
        # The 07:38Z unsigned snapshot is keyed by the v0 payload digest, so
        # membership in it must still be tested with the v0 digest. It is an
        # identity for that historical set only — never the leaf.
        legacy_digest = payload_sha256(leaf["payload"])
        legacy_digests.append(legacy_digest)
        is_new = legacy_digest not in LAST_UNSIGNED_SET
        will_sign = is_new and have_key

        card = make_card(leaf, None, will_sign=will_sign)
        sig = None
        if will_sign:
            try:
                sig = sign_card(card, key)
            except Exception as e:
                print(f"sign failed: {type(e).__name__}", file=sys.stderr)
                # rebuild so the card declares NO_LAPTOP_SIGN rather than implying a sig
                card = make_card(leaf, None, will_sign=False)
        card["sig_ed25519"] = sig
        # attaching the signature must not move the leaf: sig_ed25519 is excluded
        if card["sha256"] != card_sha256(card):
            raise SystemExit("sha256=id invariant broken")
        if is_new and not card["sig_ed25519"]:
            if card["sha256"] not in new_unsigned:
                new_unsigned.append(card["sha256"])
        cards.append(card)

    asset_cards = [c for c in cards if c["surface"] == "xrpl.asset.state"]
    if len(asset_cards) != 16:
        print(f"HALT: locked 16 produced {len(asset_cards)} xrpl.asset.state leaves", file=sys.stderr)
        write_halt_health(
            committed,
            reason="locked-16",
            have_key=have_key,
            extra={"xrpl_asset_state_count": len(asset_cards)},
            dry_run=args.dry_run,
        )
        return EXIT_BAD
    basket_hex = merkle_root([c["sha256"] for c in asset_cards])

    # Optional signed basket card — only when we can sign, so we never add a
    # 23rd unsigned leaf. Health/root always carry the merkle.
    if key is not None:
        basket_leaf = {
            "surface": "xrpl.basket.root",
            "subject": "XRPL locked-16 basket merkle",
            "as_of": (xrpl_out["sidecar"] or {}).get("xrpl_fi_updatedAt") or now_iso(),
            "source_urls": ["https://xrpl.fi/api/metrics"],
            "payload": {
                "n": 16,
                "merkle": basket_hex,
                "leaf_sha256": [c["sha256"] for c in asset_cards],
                "note": "Merkle over the locked 16 xrpl.asset.state card ids (whole-card digests). Represented TVL is separate. Not a grade.",
            },
            "unmeasured": [],
            "tags": ["framework:xrpl", "coverage:locked-16"],
        }
        basket_card = make_card(basket_leaf, None, will_sign=True)
        basket_card["sig_ed25519"] = sign_card(basket_card, key)
        if basket_card["sha256"] != card_sha256(basket_card):
            raise SystemExit("basket sha256=id invariant broken")
        cards = asset_cards + [basket_card] + [c for c in cards if c["surface"] != "xrpl.asset.state"]

    if new_unsigned:
        print(
            f"HALT-ON-UNSIGNED-LEAF: {len(new_unsigned)} NEW cards not in the "
            f"{LAST_UNSIGNED_AS_OF} unsigned set.",
            file=sys.stderr,
        )
        extra = {
            "cites": hub_out.get("sidecar") or {},
            "swift": notices_out.get("sidecar") or {},
            "benji": benji_out.get("sidecar") or {},
            "watchlist": (xrpl_out.get("sidecar") or {}).get("watchlist"),
            "represented_tvl": (xrpl_out.get("sidecar") or {}).get("represented_tvl"),
            "adapters": {
                "xrpl": {"status": "halt-before-write", "n": len(asset_cards), "note": "adapters ran; tree not rewritten"},
                "swift_notices": {"status": "halt-before-write", "note": "TARGETS not clients"},
                "benji": {"status": "halt-before-write", "note": "GraphQL dark. Not issuer 7"},
                "hub_cite": {"status": "cite-only", "note": "Health sidecar only. Not a card-v0 leaf."},
                "staged_leaves": {"status": "halt-before-write", **staged_out["sidecar"]},
                "witness_queue": {"status": "halt-before-write", **witness_out["sidecar"]},
                "provider_diff": {"status": "halt-before-write", **provider_diff_out["sidecar"]},
                "evm_permissions": {"status": "halt-before-write", **evm_out["sidecar"]},
                "evm_permission_events": {"status": "halt-before-write", **evm_events_out["sidecar"]},
            },
        }
        if not have_key:
            print("HALT-ON-MISSING-KEY: no PKCS8 and no GHA OIDC board-sign; fail closed.", file=sys.stderr)
            write_halt_health(
                committed,
                reason="missing-key",
                have_key=False,
                unsigned_new=len(new_unsigned),
                extra=extra,
                dry_run=args.dry_run,
            )
            return EXIT_MISSING_KEY
        print("key was present but leaves stayed unsigned", file=sys.stderr)
        write_halt_health(
            committed,
            reason="unsigned-leaf",
            have_key=True,
            unsigned_new=len(new_unsigned),
            extra=extra,
            dry_run=args.dry_run,
        )
        return EXIT_UNSIGNED

    shas = [c["sha256"] for c in cards]
    root_merkle = merkle_root(shas)
    as_of = now_iso()
    sidecar = xrpl_out.get("sidecar") or {}

    root_body = {
        "as_of": as_of,
        "card_count": len(shas),
        "card_sha256": shas,
        "did_intended": DID,
        "kind": "csoai.public-root/v0",
        "language": (
            "coverage of public XRPL instruments + public notices. "
            "No bank names as clients. Not a certification."
        ),
        "merkle_root": root_merkle,
        "note": (
            "Envelope schema is public-root-v0, not card-v0. Leaves stay card-v0. "
            "Unsigned until GHA signs this envelope (sig_ed25519). "
            "did_intended names the intended leaf attestation identity only. "
            "Leaves MAY carry attestations — coverage harvest, not grades. "
            "Not MEASURED. Not a certificate. Free; not paywalled."
        ),
        "schema": ENVELOPE_SCHEMA,
        "sources": ["https://xrpl.fi/api/metrics"],
        "xrpl_asset_count_attempted": 16,
        "xrpl_basket_merkle": basket_hex,
        "xrpl_fi_assetCount": sidecar.get("xrpl_fi_assetCount"),
        "xrpl_fi_updatedAt": sidecar.get("xrpl_fi_updatedAt"),
    }

    envelope_sig = None
    pre = envelope_preimage(root_body)
    pre_len = len(canonical_bytes(pre))
    if pre_len > PAYLOAD_CAP:
        print(f"envelope preimage {pre_len} exceeds {PAYLOAD_CAP}; leaving unsigned", file=sys.stderr)
    elif have_key:
        try:
            envelope_sig = sign_payload(pre, key)
        except Exception as e:
            print(f"envelope sign failed ({type(e).__name__}); leaving unsigned", file=sys.stderr)
    if envelope_sig:
        root_body["sig_ed25519"] = envelope_sig
        root_body["sig_preimage"] = (
            "Ed25519 over canonical JSON of {kind, schema, as_of, merkle_root, "
            "card_count, did_intended} only. card_sha256[] is bound by merkle_root. "
            "PKCS8 stays on Pages (OIDC). Not a certificate."
        )
        root_body["note"] = (
            "Envelope schema is public-root-v0, not card-v0. This root.json envelope "
            "is Ed25519-signed over the compact preimage under "
            "did:web:csoai.org#board-attestation-1. Leaves MAY carry attestations "
            "— coverage harvest, not grades. Not MEASURED. Not a certificate. Free; not paywalled."
        )

    proofs = []
    for i, sha in enumerate(shas):
        proofs.append(
            {
                "sha256": sha,
                "index": i,
                "proof": merkle_proof(shas, sha),
                "merkle_root": root_merkle,
            }
        )

    health = {
        "kind": "csoai.publisher-health/v0",
        "as_of": as_of,
        "writer": "scripts/publish_public_root.py",
        "dry_run": bool(args.dry_run),
        "key": "present" if have_key else "absent",
        "envelope": "signed" if envelope_sig else "unsigned",
        "halt": {"split": False, "unsigned_new_leaves": 0, "missing_key": not have_key},
        "xrpl_basket_merkle": basket_hex,
        "represented_tvl": sidecar.get("represented_tvl"),
        "watchlist": sidecar.get("watchlist"),
        "cites": hub_out.get("sidecar") or {},
        "swift": notices_out.get("sidecar") or {},
        "benji": benji_out.get("sidecar") or {},
        "staged_leaves": staged_out.get("sidecar") or {},
        "witness_queue": witness_out.get("sidecar") or {},
        "provider_diff": provider_diff_out.get("sidecar") or {},
        "evm_permissions": evm_out.get("sidecar") or {},
        "evm_permission_events": evm_events_out.get("sidecar") or {},
        "card_count": len(shas),
        "xrpl_asset_state_count": len(asset_cards),
        "note": (
            "hub.census.digest and gspc.board.cite live here, not on card-v0. "
            "Never MEASURED. Never certify. Never partnered with SWIFT. "
            "Never 17-banks-on-our-feed."
        ),
    }

    print(
        json.dumps(
            {
                "dry_run": bool(args.dry_run),
                "as_of": as_of,
                "card_count": len(shas),
                "merkle_root": root_merkle,
                "xrpl_basket_merkle": basket_hex,
                "new_vs_unsigned_set": sum(
                    1 for d in legacy_digests if d not in LAST_UNSIGNED_SET
                ),
                "surfaces": {
                    s: sum(1 for c in cards if c["surface"] == s)
                    for s in sorted({c["surface"] for c in cards})
                },
            },
            sort_keys=True,
            ensure_ascii=False,
        )
    )

    if args.dry_run:
        print("dry-run: no files written")
        return EXIT_OK

    cards_dir = ROOT / "public" / "cards"
    proofs_dir = ROOT / "public" / "proofs"
    cards_dir.mkdir(parents=True, exist_ok=True)
    proofs_dir.mkdir(parents=True, exist_ok=True)
    for card, pr in zip(cards, proofs):
        sha = card["sha256"]
        write_pretty(cards_dir / f"{sha[:16]}.json", {"card": card, "proof": pr["proof"]})
        write_pretty(proofs_dir / f"{sha[:16]}.json", pr)
    write_pretty(ROOT / "public" / "root.json", root_body)
    write_pretty(ROOT / "public" / "publisher-health.json", health)
    # Provable-archive bytes that travel with this root: the full EIP-1186 proofs
    # the leaves point at (content-addressed) and the event-indexer cursor, which
    # advances ONLY once the root carrying its leaves is on disk.
    n_proofs = len(evm_permissions.write_proof_blobs(ROOT, evm_out.get("proof_blobs") or {}))
    state_path = evm_permission_events.save_state(ROOT, evm_events_out["state"]) if evm_events_out.get("state") else None
    print(
        "wrote public/root.json public/cards/ public/proofs/ public/publisher-health.json "
        f"public/archive/proofs/eip1186/ (+{n_proofs}) {state_path or 'no evm-events state'}"
    )
    return EXIT_OK


if __name__ == "__main__":
    try:
        sys.exit(main())
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(EXIT_BAD)
