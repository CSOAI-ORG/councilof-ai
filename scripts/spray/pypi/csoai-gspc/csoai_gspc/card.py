"""Signed measurement cards: the preimage rule, and a three-state verdict."""
from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from dataclasses import dataclass

from .board import PINNED_KEY_ID, _UA, pinned_key

VALID = "VALID"
INVALID = "INVALID"
UNCHECKABLE = "UNCHECKABLE"

CARD_URL = "https://councilof.ai/signed/cards/{card_id}.json"


@dataclass(frozen=True)
class Verdict:
    """One of exactly three states, with the reason that produced it.

    ``UNCHECKABLE`` is not a soft failure and not a soft pass. It says the check could not be
    completed — no Ed25519 backend, an unfetchable card, a malformed file. Reporting it as
    either VALID or INVALID would be a claim the evidence does not support.
    """

    state: str
    reason: str
    card_id: str | None = None

    def __bool__(self) -> bool:  # only VALID is truthy; UNCHECKABLE is never a pass
        return self.state == VALID

    def __str__(self) -> str:
        head = f"{self.state} — {self.card_id[:16]}" if self.card_id else self.state
        return f"{head} · {self.reason}"


def preimage(body: dict) -> bytes:
    """The exact bytes that were signed.

    ``json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True)`` — CPython's
    renderer, which spells a float of integral value ``0.0``. Do not re-canonicalise a
    published card with RFC 8785 / JCS: that is a different rule and produces a false failure.
    """
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def card_id(body: dict) -> str:
    """sha256 of the preimage — the card's own id, recomputed."""
    return hashlib.sha256(preimage(body)).hexdigest()


def _ed25519_verify(pub_hex: str, msg: bytes, sig_hex: str) -> bool | None:
    """True, False, or None when no backend is available (which means UNCHECKABLE)."""
    try:
        from cryptography.exceptions import InvalidSignature
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    except ImportError:
        pass
    else:
        try:
            Ed25519PublicKey.from_public_bytes(bytes.fromhex(pub_hex)).verify(
                bytes.fromhex(sig_hex), msg
            )
            return True
        except InvalidSignature:
            return False
    try:
        from nacl.exceptions import BadSignatureError
        from nacl.signing import VerifyKey
    except ImportError:
        return None
    try:
        VerifyKey(bytes.fromhex(pub_hex)).verify(msg, bytes.fromhex(sig_hex))
        return True
    except BadSignatureError:
        return False


def verify_card_id(card: dict) -> bool:
    """Does the body reproduce the id it ships with?"""
    return card_id(card["body"]) == card.get("id")


def verify_card(card: dict, pinned: str | None = None) -> Verdict:
    """Verify one card against the published card-attestation key.

    ``pinned`` is the key in hex. Omit it and the key is fetched from the DID document; pass
    it to avoid a network call, or to pin a key you obtained out of band.
    """
    cid = card.get("id")
    try:
        key = pinned if pinned is not None else pinned_key(PINNED_KEY_ID)
    except Exception as exc:  # network, DNS, malformed DID — could not check, did not fail
        return Verdict(UNCHECKABLE, f"could not read the pinned key: {exc}", cid)

    if card.get("pubkey") != key:
        return Verdict(INVALID, "card key is not the published card-attestation key", cid)
    if card.get("alg") not in (None, "Ed25519"):
        return Verdict(UNCHECKABLE, f"unsupported algorithm {card.get('alg')!r}", cid)
    try:
        body = card["body"]
        sig = card["signature"]
    except KeyError as exc:
        return Verdict(UNCHECKABLE, f"card is missing {exc.args[0]}", cid)

    pre = preimage(body)
    if hashlib.sha256(pre).hexdigest() != cid:
        return Verdict(INVALID, "id does not match its body", cid)

    ok = _ed25519_verify(key, pre, sig)
    if ok is None:
        return Verdict(
            UNCHECKABLE,
            "no Ed25519 backend — install csoai-gspc[verify] or PyNaCl",
            cid,
        )
    return Verdict(VALID, "id and signature check under the pinned key", cid) if ok else Verdict(
        INVALID, "signature does not verify under the pinned key", cid
    )


_CARD_ID = re.compile(r"^[0-9a-f]{64}$")


def fetch_card(card_id_hex: str, timeout: float = 30.0) -> dict:
    """Fetch one published card by its full id: 64 lowercase hex characters (sha256 of the body).

    Raises ``ValueError`` for anything else, before any network call. An abbreviated id such as
    ``"acf6bf03…65133a4"`` used to reach urllib and die with ``UnicodeEncodeError: 'ascii' codec
    can't encode character '…'`` — the README's own quickstart did exactly that until 0.2.20260926.
    """
    if not isinstance(card_id_hex, str):
        raise ValueError(f"card id must be a string of 64 hex characters, got {type(card_id_hex).__name__}")
    cid = card_id_hex.strip().lower()
    if not _CARD_ID.match(cid):
        hint = " (it looks abbreviated — use the full id, not a …-shortened one)" if "…" in cid or "..." in cid else ""
        raise ValueError(
            f"card id must be 64 hex characters (the card's sha256); got {len(cid)} characters{hint}: {card_id_hex!r}"
        )
    req = urllib.request.Request(
        CARD_URL.format(card_id=cid),
        headers={"User-Agent": _UA, "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))
