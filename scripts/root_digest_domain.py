"""Versioned digest-domain contract for public-root leaves.

The root's Merkle leaves changed from a payload-only digest in v0 to a digest
of the whole card (except its self digest and signature) in v1.  Consumers must
never guess between those domains from a matching-looking 64-hex value.
"""
from __future__ import annotations

from typing import Any

LEAF_DIGEST_DOMAIN_FIELD = "leaf_digest_domain"
PAYLOAD_ONLY_V0 = "csoai.card-digest/payload-only/v0"
WHOLE_CARD_V1 = "csoai.card-digest/whole-card-except-sha256-and-sig_ed25519/v1"

DOMAIN_BY_ROOT_KIND = {
    "csoai.public-root/v0": PAYLOAD_ONLY_V0,
    "csoai.public-root/v1": WHOLE_CARD_V1,
}
KNOWN_DOMAINS = frozenset(DOMAIN_BY_ROOT_KIND.values())


class DigestDomainError(ValueError):
    """The root does not make one unambiguous, supported digest claim."""


def resolve_leaf_digest_domain(root: Any) -> tuple[str, str]:
    """Return ``(domain, source)`` or fail closed.

    New roots declare ``leaf_digest_domain`` explicitly.  A fieldless v0/v1
    root remains readable because its versioned ``kind`` has exactly one
    historical digest rule; callers must still reproduce every candidate leaf
    under that rule before trusting it.  Missing/unknown kinds, unknown domains,
    and kind/domain disagreement are ambiguous and rejected.
    """
    if not isinstance(root, dict):
        raise DigestDomainError("public root is not an object")

    kind = root.get("kind")
    expected = DOMAIN_BY_ROOT_KIND.get(kind)
    declared = root.get(LEAF_DIGEST_DOMAIN_FIELD)

    if declared is not None:
        if not isinstance(declared, str) or declared not in KNOWN_DOMAINS:
            raise DigestDomainError(f"unsupported {LEAF_DIGEST_DOMAIN_FIELD} {declared!r}")
        if expected is None:
            raise DigestDomainError(f"cannot bind digest domain to unknown root kind {kind!r}")
        if declared != expected:
            raise DigestDomainError(
                f"root kind {kind!r} requires {expected!r}, not declared {declared!r}"
            )
        return declared, "declared"

    if expected is None:
        raise DigestDomainError(
            f"legacy root has no {LEAF_DIGEST_DOMAIN_FIELD} and no recognised versioned kind"
        )
    return expected, "legacy-kind"
