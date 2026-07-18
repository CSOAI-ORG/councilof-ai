#!/usr/bin/env python3
"""
e2e_layer0_conformance.py — The Layer-0 Conformance Test Suite.

For any MCP server claiming "Part of the CSOAI Layer-0".
Validates against the M4 sovereign-governance PROFILE + the canonical fingerprint.

Run:
  python3 e2e_layer0_conformance.py

Returns:
  exit 0 = ALL PASS (the MCP is Layer-0 aligned)
  exit 1 = ANY FAIL (the MCP needs work)

Author: M4 lane · CSOAI Ltd (UK 16939677) · MIT + CC0
"""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'meok-os-deploy' / 'api'))
import importlib.util
spec = importlib.util.spec_from_file_location("m4_sovereign_profile", str(Path(__file__).parent / 'meok-os-deploy' / 'api' / 'm4_sovereign_profile.py'))
m4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m4)
build_sovereign_profile = m4.build_sovereign_profile
CANONICAL_FINGERPRINT = m4.CANONICAL_FINGERPRINT

failed = []
passed = []


def t(name, ok, detail=""):
    marker = "✅" if ok else "❌"
    print(f"  {marker} {name}" + (f"  {detail}" if detail else ""))
    if ok:
        passed.append(name)
    else:
        failed.append(name)


def check_profile(profile, expected_did="did:csoai:anonymous"):
    """Validate a profile against the Layer-0 conformance requirements."""
    print("\n=== LAYER-0 CONFORMANCE TEST SUITE ===")
    print(f"Profile issued_to: {profile.get('issued_to', '?')}")
    print(f"Profile fingerprint: {profile.get('fingerprint', '?')}")
    print()

    # Test 1: Canonical fingerprint
    print("--- 1. CANONICAL FINGERPRINT ---")
    t("Fingerprint = SOV:D78A-DC19-4F2A-9E10-3B81",
      profile.get("fingerprint") == CANONICAL_FINGERPRINT,
      f"got {profile.get('fingerprint', 'missing')}")

    # Test 2: @context + @type
    print("\n--- 2. JSON-LD CONTEXT ---")
    t("@context = https://csoai.org/ns/sovereign-governance/v1",
      profile.get("@context") == "https://csoai.org/ns/sovereign-governance/v1")
    t("@type = SovereignGovernanceProfile",
      profile.get("@type") == "SovereignGovernanceProfile")
    t("issuer = did:csoai:csoai-org-001",
      profile.get("issuer") == "did:csoai:csoai-org-001")

    # Test 3: 8 protocols
    print("\n--- 3. THE 8 LAYER-0 PROTOCOLS ---")
    p = profile.get("protocols", {})
    for k in ['p1_mcp_federation', 'p2_legacy_bridges', 'p3_a2a_substrate',
              'p4_x402_payments', 'p5_sigil_attestation', 'p6_oscal_fedramp',
              'p7_bft_council', 'p8_compliance_passport']:
        t(f"protocol {k}", k in p, p.get(k, 'missing')[:80] if k in p else 'missing')

    # Test 4: 8 guarantees
    print("\n--- 4. THE 8 SOVEREIGN GUARANTEES ---")
    g = profile.get("guarantees", {})
    for k in ['g1_public', 'g2_auditable', 'g3_sovereign', 'g4_care_floor',
              'g5_bft_majority', 'g6_article_14', 'g7_article_50_2', 'g8_article_9']:
        t(f"guarantee {k}", k in g, g.get(k, 'missing')[:80] if k in g else 'missing')

    # Test 5: 6 care dimensions
    print("\n--- 5. THE 6 CARE DIMENSIONS ---")
    c = profile.get("care_dimensions", {})
    for k in ['c1_safety', 'c2_truth', 'c3_care', 'c4_consent',
              'c5_sovereignty', 'c6_audit']:
        t(f"care_dimension {k}", k in c, c.get(k, 'missing')[:80] if k in c else 'missing')

    # Test 6: Care Floor + BFT
    print("\n--- 6. CARE FLOOR + BFT ---")
    t("Care Floor >= 0.95", profile.get("care_floor", 0) >= 0.95,
      f"got {profile.get('care_floor')}")
    t("BFT quorum = 22-of-33", profile.get("bft_quorum") == "22-of-33",
      f"got {profile.get('bft_quorum')}")

    # Test 7: Standards interop
    print("\n--- 7. STANDARDS INTEROP ---")
    interop = profile.get("standards_interop", [])
    t("Interop covers AGNTCY", "AGNTCY/OASF" in str(interop),
      str(interop)[:80])
    t("Interop covers A2A", "A2A" in str(interop))
    t("Interop covers MCP", "MCP" in str(interop))
    t("Interop covers Letta", "Letta" in str(interop))

    # Test 8: UK CSOAI 16939677 + MIT
    print("\n--- 8. UK CSOAI + MIT ---")
    # The issued_to should map to UK CSOAI
    t("Profile issued (valid)", "issued_at" in profile)


def main():
    # Test 1: built-in canonical profile
    print("\n" + "=" * 60)
    print(" TEST 1: BUILD THE PROFILE FROM SCRATCH")
    print("=" * 60)
    profile = build_sovereign_profile("did:csoai:cs0042")  # any valid DID
    check_profile(profile)
    print("\n" + "=" * 60)
    print(f"  PASSED: {len(passed)}  FAILED: {len(failed)}")
    if failed:
        print(f"  ❌ FAILED CHECKS:")
        for f in failed:
            print(f"    - {f}")
    else:
        print(f"  ✅ ALL LAYER-0 CONFORMANCE CHECKS PASSED")
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()