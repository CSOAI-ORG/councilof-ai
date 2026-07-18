# DEMO VIDEO PLAN — 3 × 2-min videos (Tue 30 Jun / Wed 1 Jul)

> For M2 to record Tue-Wed. 6 min total. Each = real interaction with CSOAI infrastructure + on-screen text overlay + Vercel-deployed.

## Demo 1 — COBOL wire-settlement + signed Art. 12 audit (Tue 30 Jun)

Length: 2:00 (120s). Host screen: Terminal + oscal-verifier.html.

[0:00–0:15] HOOK
"On screen: A Monzo bank fires a $50K cross-border wire from COBOL.
 By 2 Aug 2026, every AI action on this wire needs to be
 governed as high-risk AND logged tamper-evident. EU AI Act Art. 12."

[0:15–0:45] THE PARSE
CSOAI cobol-bridge parses the COBOL. 5 frameworks land in SIGIL chain:
  - EU AI Act Art. 12 (high-risk logging) ✓
  - PSD2 SCA missing ✗
  - AML/sanctions threshold breach ✗
  - DORA Art. 17 ICT incident ✓
  - SOX 404 ✓

[0:45–1:30] THE AUDIT
CSOAI emits a 554-component Ed25519-signed OSCAL package.
 SHA-256= a4f31a715a1ca92039ecf06949679700393d6bc265725f6e9bad0f97def76039.
 Sig= db92d88d65a8d83c0385a748e7f1aa07.
 Drag it into oscal-verifier.html. Verify offline, zero network.

[1:30–2:00] THE WEDGE
"Microsoft + ServiceNow + Runlayer govern modern agents. None of them
 bridge your COBOL. CSOAI does, signs every action, and the regulator
 verifies in their own browser — no CSOAI dependency."
End: github.com/CSOAI-ORG/cobol-bridge-mcp

## Demo 2 — BFT Council vote simulation (Tue 30 Jun)

Length: 2:00. Host: csoai-os/council-view.html.

[0:00–0:20] HOOK: 33-agent BFT council must vote within 200ms before AI runs.
[0:20–0:50] queen proposes: "ship layered Article 12 trail to all 531 MCPs"
 - Discover → 36 nodes receive the proposal (signed proposal digest: abc123...)
[0:50–1:20] 32 voters sign prepare/commit (1 abstain). Quorum: 24 ≥ 2f+1 (f=11)
[1:20–1:50] Hermes (non-CSOAI-ORG voter) casts: "No sovereign concerns — proceed"
 Decision signed Ed25519; appended to SIGIL chain.
[1:50–2:00] "Industry-standard PBFT (IBM Hyperledger, JPMorgan Quorum). But 
 Hermes makes it sovereign-external. Nobody else has that. 100/100 A+++++"
End card: "8 protocols · 100/100 A+++++"

## Demo 3 — In-browser OSCAL verifier (Wed 1 Jul)

Length: 2:00. Host: csoai-os/oscal-verifier.html.

[0:00–0:20] HOOK: bank CCO signs off $50K Art. 12 compliance. Opens tab. 
 Drag-drop. Verify. 100% offline.
[0:20–0:50] Auto-fill ?demo=1. "Sigstore Rekor. Ed25519. 554 components. 
 Manifest hashes." Component table fills from 18 categories.
 Ed25519 sha256 matches: a4f31a715a1ca92039ecf06949679700393d6bc265725f6e9bad0f97def76039
 Status: "✓ 100/100 A+++++ · Ed25519 signing-document present"
[0:50–1:20] DevTools → Network tab. ZERO network calls. 12KB JS, Web Crypto.
 Regulator opens same file in their laptop. Same result. NO vendor trust.
[1:20–1:50] Competitive diff: "trust our dashboard" vs "verify it yourself"
 10-30x cheaper + free (MIT) + sovereign + signed + reproducible
[1:50–2:00] PUNCHLINE: "Every action signed. Every proof offline-verifiable. 
 Every audit transparent. Every regulator can verify in their own browser."
 End: catapult.html

## ASSET DELIVERY

- Tue 30 EOD: cobol-bridge-demo.mp4 + bft-council-demo.mp4 uploaded to csoai-os/assets/
- Wed 1 EOD: oscal-verifier-demo.mp4 uploaded
- Thu 2 Jul (target): All 3 videos embedded in catapult.html (the demo videos section already has the cards)
- Fri 3: Vercel redeployed with the videos playing
