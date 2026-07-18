"""
MEOK // LAW — Global Jurisdictional Mapping Engine.
==================================================
The "Legal Router" for Sovereign Agents. This module maps 
Sovereign Intents (Sigils) to Global Compliance Frameworks
based on the agent's physical/digital location (IP/Topology).

Jurisdictions:
  - EU: EU AI Act (High-Risk/Transparency)
  - CN: TC260 (Security/Social Alignment)
  - US: NIST AI RMF / Executive Orders
  - UK: CDEI / Pro-Innovation Framework
"""

class MeokLaw:
    """The Jurisdictional Oracle for the Sovereign OS."""

    COMPLIANCE_MAP = {
        "EU": {
            "regulator": "AI Office",
            "framework": "EU AI Act",
            "requirements": ["Art 12: Logging", "Art 14: Oversight", "Art 15: Accuracy"],
            "sigil_anchors": ["V", "C", "A"] # Vote, Care, Alert must be logged
        },
        "CN": {
            "regulator": "CAC",
            "framework": "TC260 / Generative AI Measures",
            "requirements": ["Security Assessment", "Content Truthfulness", "Algorithm Filing"],
            "sigil_anchors": ["M", "S", "P"] # Memory, State, Propose must be audited
        },
        "US": {
            "regulator": "FTC / NIST",
            "framework": "AI RMF",
            "requirements": ["Bias Mitigation", "Safety Testing", "Accountability"],
            "sigil_anchors": ["V", "H", "Q"] # Vote, Handoff, Query
        }
    }

    @staticmethod
    def get_jurisdiction(ip_address: str) -> str:
        """
        Mock IP-to-Jurisdiction mapping. 
        In production, this queries the MEOK MAPS / GeoIP DB.
        """
        if ip_address.startswith("2.0"): return "EU"
        if ip_address.startswith("1.0"): return "CN"
        return "US" # Default

    @classmethod
    def apply_law(cls, line: str, ip_address: str) -> dict:
        """
        Maps a Sigil line to the required compliance anchors 
        for a specific jurisdiction.
        """
        from . import parse
        
        intent = parse(line)
        op = intent["op"]
        region = cls.get_jurisdiction(ip_address)
        law = cls.COMPLIANCE_MAP.get(region)
        
        needs_audit = op in law["sigil_anchors"]
        
        return {
            "sigil": line,
            "region": region,
            "framework": law["framework"],
            "requirements": law["requirements"],
            "compliance_status": "LOCKED" if needs_audit else "PASSIVE",
            "audit_note": f"Required by {law['regulator']} for OpCode {op}" if needs_audit else "Informational"
        }

if __name__ == "__main__":
    TEST_CASES = [
        ("V|jarvis|ad6d|+|0.82", "2.0.0.1"), # EU Vote
        ("M|user/dna|fact-01|0.99", "1.0.0.1"), # CN Memory
        ("P|expansion|usa-hq|A,B", "8.8.8.8"), # US Proposal
    ]
    
    print("MEOK // LAW — GLOBAL COMPLIANCE ROUTER")
    print("-" * 50)
    
    for line, ip in TEST_CASES:
        result = MeokLaw.apply_law(line, ip)
        print(f"\nSIGIL: {result['sigil']}")
        print(f"JURISDICTION: {result['region']} ({result['framework']})")
        print(f"COMPLIANCE: {result['compliance_status']}")
        print(f"AUDIT NOTE: {result['audit_note']}")
        for req in result['requirements']:
            print(f"  [REQ] {req}")
