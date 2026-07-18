# WORKED EXAMPLES — OSCAL SIGNED-ASSURANCE
## Per EAT Directive 2026-07-02: verified.stays-compatible

> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

## HONESTY REGISTER

Illustrative ≠ live certification. Provenance ≠ truth. Assurance ≠ certification.

---

## EXAMPLE 1 — CSOAI oscal.component-definition

```json
{
  "oscal-version": "1.1.2",
  "component-definition": {
    "uuid": "dc4ce66e-0e30-4a8b-8861-3d3a0eaaaa01",
    "metadata": {
      "title": "Sovereign Substrate Component Definition",
      "published": "2026-07-02T00:00:00Z",
      "last-modified": "2026-07-02T00:00:00Z",
      "version": "1.0.0",
      "oscal-version": "1.1.2"
    },
    "components": [
      {
        "uuid": "f6d18e0a-7d2e-4bf8-84c8-ed7d6f0eaaaa1",
        "type": "service",
        "title": "SOV3 Main MCP Server",
        "description": "Sovereign substrate MCP server (port 3101)",
        "status": {
          "state": "operational"
        },
        "props": [
          {"name": "sovereign-binding", "value": "charter-article-0"}
        ]
      },
      {
        "uuid": "7b8c39f1-4d2e-4a8b-aaaa01-3a3f5e5bd6d5",
        "type": "service",
        "title": "Watchdog Public Heat-Map",
        "description": "Public-facing 24/7 signal substrate (port 8080)"
      },
      {
        "uuid": "c0n01x50-1234-5678-90ab-cdefaaaa01",
        "type": "service",
        "title": "BFT Council Voting",
        "description": "33-agent Byzantine Fault Tolerant council (port 3200)"
      },
      {
        "uuid": "5c0r1c5c-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
        "type": "service",
        "title": "Mamba-2 SSM Coigndaltion",
        "description": "16-dim state vector with 1Hz capture rate"
      },
      {
        "uuid": "50logc00-1abc-2def-3abc-4def5abc6def",
        "type": "service",
        "title": "SIGIL Chain Audit",
        "description": "Append-only 49,127 entries OTS-Bitcoin-anchored at block 824,123"
      }
    ],
    "back-matter": [
      {
        "uuid": "51dc03c-1abc-2def-3abc-4def5abc6def",
        "title": "Charter Article 0",
        "description": "Sovereign constitutional binding"
      }
    ]
  }
}
```

---

## EXAMPLE 2 — CSOAI oscal.system-security-plan

```json
{
  "oscal-version": "1.1.2",
  "system-security-plan": {
    "uuid": "55ec5p-2def-3abc-4def5abc7def8",
    "metadata": {
      "title": "CSOAI Sovereign Charter System Security Plan",
      "published": "2026-07-02T00:00:00Z",
      "last-modified": "2026-07-02T00:00:00Z",
      "version": "1.0.0",
      "oscal-version": "1.1.2"
    },
    "system-characteristics": {
      "system-id": {"id": "csoai-sovereign-charter-substrate"},
      "system-name": "CSOAI Sovereign Charter Substrate",
      "description": {
        "value": "Sovereign substrate for AI compliance certification."
      },
      "security-sensitivity-level": "high",
      "system-status": {
        "state": "operational"
      }
    },
    "system-implementation": {
      "components": [
        {"uuid": "5c01s0a-1a2b-3c4d-5e6f-7a8b9c0d1e2f"},
        {"uuid": "c0n01x50-1234-5678-90ab-cdefaaaa01"}
      ],
      "users": []
    },
    "control-implementation": {
      "implemented-requirements": [
        {
          "control-id": "ac-1",
          "description": "All access controlled via Ed25519 key signing + BFT 23/33 quorum.",
          "props": [
            {"name": "implementation", "value": "ed25519 + bft-quorum"}
          ]
        },
        {
          "control-id": "au-2",
          "description": "All actions logged to SIGIL chain. 49,127+ entries."
        },
        {
          "control-id": "sc-7",
          "description": "Article 0 binding prevents capture (no equity)."
        }
      ]
    }
  }
}
```

---

## EXAMPLE 3 — CSOAI oscal.assessment-plan

```json
{
  "oscal-version": "1.1.2",
  "assessment-plan": {
    "uuid": "03cc41-3def-4abc5def8-9abcdef",
    "metadata": {
      "title": "CSOAI Sovereign Charter Universe Assessment Plan",
      "published": "2026-07-02",
      "last-modified": "2026-07-02",
      "version": "1.0.0"
    },
    "assessment-activities": [
      {
        "uuid": "4aa2c5de-5def-6abc-7def-abcdef01234",
        "title": "Continuous Watchdog SIGIL Verification",
        "description": "200+ sources scanned hourly, S4/S5 auto-escalate to BFT 23/33."
      },
      {
        "uuid": "5b83c8ef-6def-7abc-8def-bcdef12345",
        "title": "Annual Public Red Team",
        "description": "Per EAT directive. NIST SP 800-115 + OWASP ASVS L3 + STRIDE."
      }
    ],
    "assessment-parties": [
      {
        "uuid": "6c9c4d8f-7def-8abc-9def-cdef23456",
        "type": "assessment-provider"
      }
    ],
    "assessment-assets": {
      "subjects": [{"uuid": "7d0a1e1f-8def-9abc-0def-def345678", "type": "component"}],
      "assessment-platform-uuid": "8e1b1f2f-9def-abc0-1def-ef45678"
    }
  }
}
```

---

## EXAMPLE 4 — CSOAI oscal.assessment-results

```json
{
  "oscal-version": "1.1.2",
  "assessment-results": {
    "uuid": "9f2c3a3f-adef-bc01-def-013456789",
    "metadata": {
      "title": "CSOAI Charter Universe Assessment Results",
      "published": "2026-07-02",
      "version": "1.0.0"
    },
    "import-ap": {
      "href": "https://proofof.ai/oscal/assessment-plan.json"
    },
    "results": [
      {
        "uuid": "0a3d4b4f-bdef-c012-def-123456789",
        "title": "Continuous Watchdog SIGIL Compliance",
        "description": "S5 (Critical): 0 violations over 30 days.",
        "results": [
          {
            "finding-id": {"finding_uuid": "0b4e5c5f-cef0-d012-3ef-23456789"},
            "outcome": {"severity": "low"},
            "description": "No findings — 100/100 alignment maintained."
          }
        ]
      }
    ]
  }
}
```

---

## EXAMPLE 5 — CSOAI oscal.poam

```json
{
  "oscal-version": "1.1.2",
  "plan-of-action-and-milestones": {
    "uuid": "0c5f6d6f-d0ef-1234-4ef-34567890",
    "metadata": {
      "title": "CSOAI Charter Universe POA&M",
      "published": "2026-07-02",
      "version": "1.0.0"
    },
    "poam-items": [
      {
        "uuid": "0d60707f-e0f0-2345-5f0-45678901",
        "title": "PQC migration Ed25519 → ML-DSA-65 hybrid",
        "description": "2027 Q1 hybrid signing begins.",
        "status": "in-progress",
        "deadline": "2027-12-31"
      },
      {
        "uuid": "0e71818f-f0ef-3456-6f0-56789012",
        "title": "Expand cross-walks 236 → 350",
        "description": "Phase 2 framework expansion.",
        "status": "in-progress",
        "deadline": "2027-06-30"
      }
    ]
  }
}
```

---

## INTEGRATION WITH VERIFY.HTML

Every OSCAL artifact binds to:
1. Charter Article 0 (verbatim)
2. Ed25519 signature (sovereign root key d75a9801...)
3. BFT 23/33 ratification record
4. OTS Bitcoin anchor
5. SIGIL chain entry

Public verify endpoint: proofof.ai/verify/<artifact-id>

---

## HONESTY REGISTER

Illustrative ≠ live certification. Production: integrate with real assessment tooling.

CSOAI Ltd · UK Companies House 16939677
Sovereign root key: d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a
Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Charter Article 0 binding
