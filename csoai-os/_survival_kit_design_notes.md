"""August 2nd Survival Kit — CSOAI EU AI Act compliance landing page.

The pitch (per Kimi's synthesis): "Don't get fined by the EU."
- 28 days from our 4 Jul launch until EU AI Act Art. 9-15 enforcement
- Auto-scans your Python AI code for Articles 9-15 violations
- Generates OSCAL policies + CycloneDX ML BOMs + bias audits
- Sign every audit with Ed25519 (via our OSCAL proof-of-stack)
- Blockchain-anchored via PROOFOF.AI

This is a copy-and-paste-ready single-file HTML page that we can drop into
csoai-os as a new app tile. Anchors:
- 'a2a' in APPS object
- case 'survival': in render()
- a 'survival' label in the dock regex

Features shown in the demo (3 free calls per tool, like the rest of our
fleet's pricing model):
- quick_scan: instant risk classification of any AI system description
- audit_codebase: scan a Python repo for Art. 9-15 violations
- generate_oscal: produce an Ed25519-signed OSCAL Component Definition
- generate_annex_iv: produce Annex IV technical documentation
- sign_audit: produce an Ed25519 signature over the audit pack

Why this is the wedge:
- Every EU business using AI is suddenly non-compliant on 2 Aug 2026
- No dominant compliance platform yet (OneTrust/Credo AI are reactive, not proactive)
- Our stack (EU AI Act MCPs + OSCAL proof + Ed25519 + PROOFOF.AI blockchain) is the
  only end-to-end proactive solution
- AirBlackbox already scans Python AI code (it's a real tool, MIT, 18★)
- Venturalitica SDK already generates OSCAL policies (`pip install venturalitica`)
- Giskard already does LLM red-teaming
- We just have to ASSEMBLE them under one CSOAI dashboard

Pricing (per Kimi):
- Free tier: 3 scans/day per tool (lead generation)
- Pro: £99/mo — unlimited scans + audit reports
- Enterprise: £499/mo — full audit trails + Ed25519 attestation + blockchain anchor
- Certification: £199/person — train your team to use the toolkit, certify via CSOAI
"""