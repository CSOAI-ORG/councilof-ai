"""meok-annex-iii-impact-mcp — Automated EU AI Act Annex III risk classification engine.

This package exposes the `classify_system`, `generate_fria`,
`check_article_compliance`, and `generate_annex_iv_documentation` functions
that classify AI systems against the 8 Annex III high-risk categories and
produce the Article 27 FRIA + Annex IV technical documentation.
"""

__version__ = "0.1.0"
__all__ = [
    "classify_system",
    "generate_fria",
    "check_article_compliance",
    "generate_annex_iv_documentation",
]
