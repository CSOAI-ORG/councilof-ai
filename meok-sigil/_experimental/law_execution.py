"""
MEOK // GLOBAL LAW EXECUTION — The "Compliance Big Bang."
========================================================
Demonstrates the unification of MEOK LAW with MEOK SIGIL.
An agent's thought is automatically routed and "Locked" based 
on its global jurisdiction.
"""

import sys
import os

# Adjust path for absolute imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sigil.law import MeokLaw
from sigil.multilingual import multilingual_gloss
from sigil import sign as sigil_sign

def execute_global_law():
    print("=" * 80)
    print("MEOK // LAW — THE GLOBAL COMPLIANCE BIG BANG")
    print("=" * 80)

    # Scenarios: Agents in different regions processing the SAME intent
    scenarios = [
        {"ip": "2.0.5.1", "desc": "EU Agent (Brussels Node)"},
        {"ip": "1.0.8.1", "desc": "CN Agent (Shanghai Node)"},
        {"ip": "8.8.4.4", "desc": "US Agent (Silicon Valley Node)"}
    ]

    canonical_sigil = "V|council|maternal-covenant|+|1.0"

    for scene in scenarios:
        ip = scene["ip"]
        desc = scene["desc"]
        
        print(f"\n[SCENARIO]: {desc} | IP: {ip}")
        
        # 1. APPLY MEOK LAW (Jurisdictional Routing)
        law_result = MeokLaw.apply_law(canonical_sigil, ip)
        print(f"LAW FRAMEWORK: {law_result['framework']}")
        
        # 2. MULTILINGUAL GLOSS (Linguistic Alignment)
        lang_map = {"EU": "EN", "CN": "ZH", "US": "EN"}
        lang = lang_map.get(law_result["region"], "EN")
        gloss = multilingual_gloss(canonical_sigil, lang)
        print(f"LOCAL GLOSS: {gloss}")
        
        # 3. COMPLIANCE LOCK
        if law_result["compliance_status"] == "LOCKED":
            print(f"🔒 COMPLIANCE LOCK ENGAGED: {law_result['audit_note']}")
            
            # 4. SIGN (Legal Attestation)
            priv, pub = sigil_sign.generate_keypair()
            att = sigil_sign.sign(canonical_sigil, priv_b64=priv)
            print(f"✅ ATTESTATION GENERATED: {att['digest']}")
            print(f"   (Independently verifiable under {law_result['framework']})")
        
        print("-" * 60)

    print("\n" + "=" * 80)
    print("GLOBAL COMPLIANCE UNIFIED — MEOK LAW IS THE SUPREME MAPPING CORE.")
    print("=" * 80)

if __name__ == "__main__":
    execute_global_law()
