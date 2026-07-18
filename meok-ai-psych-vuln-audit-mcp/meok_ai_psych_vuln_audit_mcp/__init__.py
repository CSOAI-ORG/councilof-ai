"""meok-ai-psych-vuln-audit-mcp — EU AI Act Article 5(1)(f) gambling-vertical compliance audit engine.

Detects AI systems and player interventions that exploit psychological
vulnerabilities of specific groups (children, loss-chasing players,
self-excluded individuals, etc.) in the gambling vertical.

Added to the EU AI Act prohibited list by the Digital Omnibus amendments
in May 2026. This is the first gambling-vertical compliance tool for this
specific article.

This package exposes the 4 audit tools:
  - audit_player_intervention(player_action)
  - scan_marketing_copy(copy, target_segment)
  - classify_ai_system(ai_system)
  - generate_audit_report(operator_id, audit_period, interventions)
"""

__version__ = "0.1.0"
__all__ = [
    "audit_player_intervention",
    "scan_marketing_copy",
    "classify_ai_system",
    "generate_audit_report",
    "GAMBLING_RISK_PATTERNS",
    "ISSUER_PUBLIC_KEY_HEX",
]
