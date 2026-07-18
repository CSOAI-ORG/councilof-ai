# Sovereign Governance Extension — a proposal to contribute upstream (AGNTCY / A2A / OASF)

**One line:** the agent-package standards (AGNTCY OASF, A2A Agent Card) sign identity **keyless via a CA/OIDC trust root (Sigstore/Fulcio)** — which needs the network and a central authority. This extension adds a **sovereign, self-owned, OFFLINE-verifiable** identity + **embedded governance**, so an agent can be trusted **air-gapped, forever, with no CA.**

_Draft, 2026-07-01. Strategy: be IN the standard, not a competing protocol. Extension is emitted live at `os.meok.ai/api/sap?format=oasf` (in `extensions[]`)._

## Why (the gap)
- OASF/AGNTCY: agents as OCI artifacts, **Sigstore/cosign** signed → verifying needs Fulcio/Rekor (online, CA-rooted, CI-identity).
- A2A: card signing being added (sigstore-a2a, issue #1672) → same keyless/CA model.
- **Neither gives a defence/CNI/air-gapped verifier what it needs:** verify an agent's identity + that it's governed, **offline, with only a public key, no phone-home.**

## The extension: `meok.sovereign-governance.v1`
Attach to an OASF record's `extensions[]` (or an A2A card extension):
```json
{
  "name": "meok.sovereign-governance.v1",
  "data": {
    "signing": "ed25519",
    "trust_model": "sovereign-self-owned (NOT keyless/CA) — verify offline with publicKey alone",
    "fingerprint": "SOV:XXXX-XXXX-…",
    "canonical": "<the exact signed bytes>",
    "signature": "<ed25519 hex>",
    "publicKey": "<spki hex>",
    "governance": { "careFloor": 0.95, "hardStops": ["no harm","no unvoted autonomy","no covert surveillance"], "frameworks": ["EU AI Act","ISO 42001","JSP 936"] },
    "verify": "https://os.meok.ai/api/verify"
  }
}
```
**Verify (any Ed25519 lib, offline):** `verify(publicKey, canonical, signature)` → true/false. No CA, no network, no expiry.

## How it composes (not competes)
- **Complements Sigstore/OASF:** keep keyless CI-provenance for supply chain; ADD sovereign-offline for runtime/air-gapped trust. Both signatures can coexist on one record.
- **Complements A2A:** it's a card `extensions` entry; A2A hosts that don't understand it ignore it; sovereign hosts verify it offline.
- **Governance is first-class:** the same signature covers the care-floor + hard-stops, so "is this agent governed?" is answerable offline too — unique.

## Proof it's real (shipped, not a paper)
- `os.meok.ai/api/sap?format=oasf` — OASF-shaped record carrying this extension.
- `os.meok.ai/api/verify` — offline verification (Node/openssl snippet on `/systemcard.html`).
- `runner/meok-sap-runner.mjs` — verifies the sovereign signature **offline** before trusting the agent.

## Contribution plan (honest, low-ego)
1. **Verify the exact OASF/A2A field names** against `spec.dir.agntcy.org` + the A2A extension mechanism (our `format=oasf` field-mapping is a *draft* until confirmed).
2. Open a discussion/issue on **A2A (#1672 thread)** and **AGNTCY** proposing an *offline/sovereign* signing profile alongside the keyless one, citing the air-gapped-defence use case (JSP 936).
3. Publish a tiny **verifier reference** (the ~10-line Ed25519 check) so anyone can validate without our infra.

**Bottom line:** don't fork the ecosystem — contribute the one primitive it's missing (sovereign, offline, governed trust), and be the reference implementation of it.
