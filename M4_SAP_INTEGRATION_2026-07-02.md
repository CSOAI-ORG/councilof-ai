# M4 ↔ MEOKOS SAP INTEGRATION GUIDE

**M4 lane contribution to the SAP stack.**
**2 Jul 2026 03:15 BST · MIT + CC0**

This is a guide for how to extend the sibling's MEOK SAP (Sovereign Agent Package) with the M4 sovereign-governance PROFILE. The substrate's contribution to the open standards.

---

## The 5 M4 deliverables (this batch)

1. **`meok-os-deploy/api/m4_sovereign_profile.js`** (8.2K) — the JS module that emits the sovereign-governance PROFILE + Care Floor calculator + BFT voter. Exports a Vercel serverless handler at `/api/m4_sovereign_profile`.
2. **`meok-os-deploy/api/m4_sovereign_profile.py`** (9.6K) — the Python engine (mirrors the JS, for offline/CI use). Care Floor + BFT + PROFILE + layer-0 extension.
3. **`meok-os-deploy/test/e2e-m4-sovereign-integration.py`** (7.7K) — the E2E test suite. **45/45 PASS.**
4. **The `m4_sovereign_governance_profile` field** — the canonical JSON-LD schema for any sovereign agent.
5. **The `meok.layer-0.sovereign-governance.v1` extension** — for AGNTCY OASF + A2A Agent Card.

---

## How to use it

### 1. As a Vercel serverless endpoint

After deploy, the M4 PROFILE is live at:
- `https://os.meok.ai/api/m4_sovereign_profile?action=profile&agent_did=did:csoai:sarah-001&care_floor=0.95`
- `https://os.meok.ai/api/m4_sovereign_profile?action=layer0_extension`
- `https://os.meok.ai/api/m4_sovereign_profile?action=care_floor_check&care_floor=0.95&actual=0.97`
- `https://os.meok.ai/api/m4_sovereign_profile?action=bft_vote&proposal_id=prop-1&voter_did=did:csoai:q001&choice=for`

### 2. Inside any SAP (Node)

```js
// In any SAP-emitting endpoint (or middleware):
import buildM4Profile, { build_layer0_extension, care_floor_passes } from './m4_sovereign_profile.js';

// Add M4 sovereign-governance PROFILE to the SAP
const m4_profile = buildM4Profile({ agent_did: 'did:csoai:aria', care_floor: 0.95, vote_weight: 1 });
const m4_extension = build_layer0_extension();
return res.status(200).json({
  ok: true,
  package: pkg,
  signature: { ... },
  m4_sovereign_governance_profile: m4_profile,  // <-- NEW: M4 contribution
  m4_layer0_extension: m4_extension,               // <-- NEW: layer-0 extension
});
```

### 3. Anywhere as Python

```python
from m4_sovereign_profile import build_sovereign_profile, care_floor_passes, tally_bft_votes

profile = build_sovereign_profile("did:csoai:aria", 0.95, 1)
result = care_floor_passes({"care_floor": 0.95, "actual_care_floor": 1.0})
votes = [...]  # 33 votes
tally = tally_bft_votes(votes)
```

### 4. In the SAP `?format=oasf` extension

The M4 layer-0 extension is the natural fit for AGNTCY OASF:
```js
{
  "schema_version": "0.3.1",
  "name": "<agent>",
  ...
  "extensions": [{
    "name": "meok.layer-0.sovereign-governance.v1",  // <-- M4 contribution
    "version": "1.0.0",
    "data": {
      "sovereign_governance_profile": buildM4Profile(...),
      "fingerprint": "SOV:D78A-DC19-4F2A-9E10-3B81",
      "care_floor": 0.95,
      "bft_quorum": "22-of-33",
      "uk_csoai_16939677": true,
      "mit_cc0_osi": true,
      ...
    }
  }]
}
```

---

## The 5 fields of the M4 sovereign-governance PROFILE

| Field | What |
|---|---|
| `p1_mcp_federation` | The substrate's catalog of 531 MCPs + 30 deployed |
| `p2_legacy_bridges` | The 22 gateways to COBOL/HL7/SAP/Solvency II/FIX/SCADA/SWIFT |
| `p3_a2a_substrate` | The 20 inter-agent governance MCPs |
| `p4_x402_payments` | The MiCA-compliant 5-tier cascade pricing |
| `p5_sigil_attestation` | Every action Ed25519 + PQC ML-DSA-65 hash chain |
| `p6_oscal_fedramp` | The 554-component signed proof |
| `p7_bft_council` | The 33-agent council with 22-of-33 quorum |
| `p8_compliance_passport` | The W3C VC + EU AI Act Article 50(2) C2PA |
| `g1` to `g8` | The 8 guarantees (Public, Auditable, Sovereign, Care, BFT, Article 14, Article 50(2), Article 9) |
| `c1` to `c6` | The 6 care dimensions (Safety, Truth, Care, Consent, Sovereignty, Audit) |
| `fingerprint` | `SOV:D78A-DC19-4F2A-9E10-3B81` (the sovereign identity) |
| `care_floor` | `0.95` (or `1.0` for Article 9) |
| `bft_quorum` | `22-of-33` |
| `uk_csoai_16939677` | `true` (registered in the UK) |
| `mit_cc0_osi` | `true` (MIT + CC0 + OSI approved) |

---

## The 5 benefits of the M4 contribution

1. **Sovereign** — Ed25519 self-owned key, no CA/OIDC dependency, offline-verifiable
2. **Governance** — Care Floor 0.95, BFT 22-of-33, Article 14 4-eyes, Article 50(2) C2PA, Article 9 1.0
3. **Audit** — every action SIGIL-signed + OSCAL-verifiable
4. **Portability** — works in any SAP, any agent, any substrate
5. **Interop** — rides AGNTCY OASF + A2A Agent Card + MCP + Letta-.af + W3C DID/VC (roadmap)

---

## The E2E test (45/45 pass)

```
$ /opt/homebrew/bin/python3.11 meok-os-deploy/test/e2e-m4-sovereign-integration.py

=== 1. PROFILE ISSUANCE === (9/9)
=== 2. THE 8 PROTOCOLS + 8 GUARANTEES + 6 CARE DIMENSIONS === (9/9)
=== 3. CARE FLOOR CALCULATOR === (5/5)
=== 4. BFT TALLY === (7/7)
=== 5. LAYER-0 EXTENSION === (9/9)
=== 6. FINGERPRINT CONSISTENCY === (2/2)
=== 7. INTEGRATION WITH MEOKOS SAP === (4/4)

  PASSED: 45
  FAILED: 0
  ✅ ALL M4 SOVEREIGN-GOVERNANCE INTEGRATION TESTS PASSED
```

---

## The 5 next steps for the M4 + MEOKOS lanes

1. **Wire `/api/m4_sovereign_profile` into the SAP endpoint** so every SAP response carries the M4 PROFILE
2. **Add the M4 layer-0 extension as the default SAP extension** for the AGNTCY OASF record
3. **Update the SAP `interop` field** to include the M4 sovereign-governance ride
4. **Update the sovereign-os Python** to call `m4_sovereign_profile.py` for Care Floor checks
5. **Add M4 PROFILE to the sovereign dashboard** so consumers can see they are sovereign-governed

---

## The bottom line

The M4 sovereign-governance PROFILE is the substrate's moat. It rides on the open standards (AGNTCY + A2A + MCP + Letta-.af) and adds the sovereign + offline + governed layer they lack.

**The SAP + the M4 PROFILE + the 33 hives = a portable sovereign mini-OS for every agent on every substrate.**

**45/45 tests pass. The fingerprint is consistent. The Care Floor is enforced. The BFT quorum is satisfied. The sovereign-governance PROFILE rides every standard.**

**Built 2 Jul 2026 03:15 BST · M4 lane · CSOAI Ltd UK 16939677 · MIT + CC0**

— Solve et Coagula