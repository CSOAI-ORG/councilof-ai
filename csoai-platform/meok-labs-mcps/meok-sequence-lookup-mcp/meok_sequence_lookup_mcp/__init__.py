"""meok-sequence-lookup-mcp package."""

from .server import (
    ISSUER_PUBLIC_KEY_HEX,
    ISSUER_PUBLIC_KEY_BYTES,
    KID,
    VERSION,
    canonical_json,
    cross_link_uniprot_pdb,
    get_tool_definitions,
    pdb_fetch,
    pdb_search,
    sign_envelope,
    uniprot_fetch,
    uniprot_search,
    verify_envelope,
)

__all__ = [
    "ISSUER_PUBLIC_KEY_HEX",
    "ISSUER_PUBLIC_KEY_BYTES",
    "KID",
    "VERSION",
    "canonical_json",
    "cross_link_uniprot_pdb",
    "get_tool_definitions",
    "pdb_fetch",
    "pdb_search",
    "sign_envelope",
    "uniprot_fetch",
    "uniprot_search",
    "verify_envelope",
]

__version__ = VERSION