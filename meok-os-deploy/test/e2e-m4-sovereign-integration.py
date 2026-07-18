#!/usr/bin/env python3
"""
e2e-m4-sovereign-integration.py — E2E test for the M4 sovereign-governance PROFILE
integration with the MEOKOS stack.

Now runs against the HTTP API so it works with the deployed / local serverless functions
(no import of a sibling .py module required).

Tests:
1. The M4 sovereign-governance PROFILE issues correctly over HTTP.
2. The 8 protocols + 8 guarantees + 6 care dimensions are present.
3. The Care Floor calculator works (pass + fail + Article 9 4-eyes lethal).
4. The BFT tally works (22-of-33 approved, 21-of-33 rejected).
5. The layer-0 extension validates.
6. The M4 PROFILE can be added to a SAP query without breaking it.
7. The fingerprint is consistent across all calls.

Run:
  BASE=http://127.0.0.1:3000 python3 test/e2e-m4-sovereign-integration.py
  BASE=https://os.meok.ai python3 test/e2e-m4-sovereign-integration.py

Author: M4 lane. MIT. 2 Jul 2026.
"""
import json
import sys
import urllib.request
import urllib.error

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000").rstrip("/")

failed = []
passed = []


def t(name, ok, detail=""):
    marker = "✅" if ok else "❌"
    print(f"  {marker} {name}" + (f"  {detail}" if detail else ""))
    if ok:
        passed.append(name)
    else:
        failed.append(name)


def get(path):
    try:
        with urllib.request.urlopen(BASE + path, timeout=20) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8")) if e.read() else {}
    except Exception as e:
        return 0, {"error": str(e)}


def post(path, body):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        BASE + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8")) if e.read() else {}
    except Exception as e:
        return 0, {"error": str(e)}


# === Test 1: PROFILE issues ===
print("\n=== 1. PROFILE ISSUANCE ===")
status, r = get("/api/m4_sovereign_profile?action=profile&agent_did=did:csoai:sarah-001")
profile = r.get("profile", {})
t("PROFILE endpoint returns 200", status == 200)
t("PROFILE has @context", profile.get("@context") == "https://csoai.org/ns/sovereign-governance/v1")
t("PROFILE has @type=SovereignGovernanceProfile", profile.get("@type") == "SovereignGovernanceProfile")
t("PROFILE has issuer=did:csoai:csoai-org-001", profile.get("issuer") == "did:csoai:csoai-org-001")
t("PROFILE has issued_to=did:csoai:sarah-001", profile.get("issued_to") == "did:csoai:sarah-001")
t("PROFILE has fingerprint=SOV:*", bool(profile.get("fingerprint", "").startswith("SOV:")))
t("PROFILE has care_floor=0.95", profile.get("care_floor") == 0.95)
t("PROFILE has bft_quorum=22-of-33", profile.get("bft_quorum") == "22-of-33")
t("PROFILE has issued_at (ISO 8601)", "T" in profile.get("issued_at", ""))
t("PROFILE has vote_weight=1", profile.get("vote_weight") == 1)

# === Test 2: 8 protocols + 8 guarantees + 6 care dimensions ===
print("\n=== 2. THE 8 PROTOCOLS + 8 GUARANTEES + 6 CARE DIMENSIONS ===")
t("PROFILE has 8 protocols", len(profile.get("protocols", {})) == 8)
t("PROFILE has p1_mcp_federation", "p1_mcp_federation" in profile.get("protocols", {}))
t("PROFILE has p8_compliance_passport", "p8_compliance_passport" in profile.get("protocols", {}))
t("PROFILE has 8 guarantees", len(profile.get("guarantees", {})) == 8)
t("PROFILE has g1_public", "g1_public" in profile.get("guarantees", {}))
t("PROFILE has g8_article_9", "g8_article_9" in profile.get("guarantees", {}))
t("PROFILE has 6 care_dimensions", len(profile.get("care_dimensions", {})) == 6)
t("PROFILE has c1_safety", "c1_safety" in profile.get("care_dimensions", {}))
t("PROFILE has c6_audit", "c6_audit" in profile.get("care_dimensions", {}))

# === Test 3: Care Floor calculator ===
print("\n=== 3. CARE FLOOR CALCULATOR ===")
_, r = get("/api/m4_sovereign_profile?action=care_floor_check&care_floor=0.95&actual=0.97")
d = r.get("decision", {})
t("Care Floor: 0.97 >= 0.95 passes", d.get("ok") is True)

_, r = get("/api/m4_sovereign_profile?action=care_floor_check&care_floor=0.95&actual=0.90")
d = r.get("decision", {})
t("Care Floor: 0.90 < 0.95 fails", d.get("ok") is False)

_, r = get("/api/m4_sovereign_profile?action=care_floor_check&care_floor=0.95&actual=1.0&article_9=true")
d = r.get("decision", {})
t("Care Floor: Article 9 requires 1.0, 1.0 passes", d.get("ok") is True and d.get("required") == 1.0)

_, r = get("/api/m4_sovereign_profile?action=care_floor_check&care_floor=0.95&actual=0.95&article_9=true")
d = r.get("decision", {})
t("Care Floor: Article 9 requires 1.0, 0.95 fails", d.get("ok") is False)

_, r = get("/api/m4_sovereign_profile?action=care_floor_check&care_floor=0.95&actual=1.0&harm_category=lethal")
d = r.get("decision", {})
t("Care Floor: lethal requires 1.0, 1.0 passes", d.get("ok") is True)

# === Test 4: BFT tally ===
print("\n=== 4. BFT TALLY (22-of-33 QUORUM) ===")
votes_15 = [{"proposal_id": "prop-1", "voter": f"did:csoai:q{i}", "choice": "for"} for i in range(15)]
_, r = post("/api/m4_sovereign_profile?action=bft_tally", {"votes": votes_15})
tally = r.get("tally", {})
t("BFT: 15 votes (no quorum), not approved", tally.get("approved") is False)
t("BFT: 15 votes, no quorum", tally.get("quorum") is False)

votes_22 = [{"proposal_id": "prop-1", "voter": f"did:csoai:q{i}", "choice": "for"} for i in range(22)]
_, r = post("/api/m4_sovereign_profile?action=bft_tally", {"votes": votes_22})
tally = r.get("tally", {})
t("BFT: 22 votes (22-for), approved (22 >= 22)", tally.get("approved") is True)
t("BFT: 22 votes, no full quorum yet", tally.get("quorum") is False)

votes_33 = votes_22 + [{"proposal_id": "prop-1", "voter": f"did:csoai:q{i}", "choice": "against"} for i in range(22, 33)]
_, r = post("/api/m4_sovereign_profile?action=bft_tally", {"votes": votes_33})
tally = r.get("tally", {})
t("BFT: 33 votes (22-for, 11-against), approved (22 >= 22)", tally.get("approved") is True)
t("BFT: 33 votes, full 33 quorum", tally.get("quorum") is True)

votes_21 = [{"proposal_id": "prop-1", "voter": f"did:csoai:q{i}", "choice": "for"} for i in range(21)]
_, r = post("/api/m4_sovereign_profile?action=bft_tally", {"votes": votes_21})
tally = r.get("tally", {})
t("BFT: 21 votes (21-for, 0-against), NOT approved (21 < 22)", tally.get("approved") is False)

# === Test 5: Layer-0 extension ===
print("\n=== 5. LAYER-0 EXTENSION ===")
_, r = get("/api/m4_sovereign_profile?action=layer0_extension")
ext = r.get("extension", {})
t("Extension has name=meok.layer-0.sovereign-governance.v1", ext.get("name") == "meok.layer-0.sovereign-governance.v1")
t("Extension has data block", "data" in ext)
t("Extension data has sovereign_governance_profile", "sovereign_governance_profile" in ext.get("data", {}))
t("Extension data has fingerprint", ext.get("data", {}).get("fingerprint", "").startswith("SOV:"))
t("Extension data has care_floor=0.95", ext.get("data", {}).get("care_floor") == 0.95)
t("Extension data has bft_quorum=22-of-33", ext.get("data", {}).get("bft_quorum") == "22-of-33")
t("Extension data has uk_csoai_16939677=True", ext.get("data", {}).get("uk_csoai_16939677") is True)
t("Extension data has mit_cc0_osi=True", ext.get("data", {}).get("mit_cc0_osi") is True)
t("Extension data has forked_into with 5 standards", len(ext.get("data", {}).get("forked_into", [])) == 5)

# === Test 6: Fingerprint consistency ===
print("\n=== 6. FINGERPRINT CONSISTENCY ===")
_, r1 = get("/api/m4_sovereign_profile?action=profile")
_, r2 = get("/api/m4_sovereign_profile?action=profile")
fp1 = r1.get("profile", {}).get("fingerprint")
fp2 = r2.get("profile", {}).get("fingerprint")
t("Fingerprint consistent across calls", fp1 == fp2 and fp1.startswith("SOV:"))

_, e1 = get("/api/m4_sovereign_profile?action=layer0_extension")
_, e2 = get("/api/m4_sovereign_profile?action=layer0_extension")
efp1 = e1.get("extension", {}).get("data", {}).get("fingerprint")
efp2 = e2.get("extension", {}).get("data", {}).get("fingerprint")
t("Layer-0 extension fingerprint consistent", efp1 == efp2 and efp1.startswith("SOV:"))

# === Test 7: Integration with MEOKOS SAP (simulated) ===
print("\n=== 7. INTEGRATION WITH MEOKOS SAP ===")
_, sap = get("/api/hatch?name=Aria&archetype=dragon")
hatch = sap.get("hatch", {})
t("Hatch carries M4-aligned care_floor", hatch.get("governance", {}).get("careFloor") == 0.95)
t("Hatch carries M4-aligned BFT quorum", hatch.get("governance", {}).get("council", {}).get("size") == 33)
t("Hatch voteThreshold is 22", hatch.get("governance", {}).get("council", {}).get("voteThreshold") == 22)

# === SUMMARY ===
print("\n" + "=" * 60)
print(f"  PASSED: {len(passed)}")
print(f"  FAILED: {len(failed)}")
print(f"  TOTAL:  {len(passed) + len(failed)}")
if failed:
    print("\n  ❌ FAILURES:")
    for f in failed:
        print(f"    - {f}")
    sys.exit(1)
else:
    print("\n  ✅ ALL M4 SOVEREIGN-GOVERNANCE INTEGRATION TESTS PASSED")
    sys.exit(0)
