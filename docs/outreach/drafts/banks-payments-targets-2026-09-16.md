# Banks, Payments, Stablecoins, Insurance, Legacy Systems — Ten Targets
## 2026-09-16

**Lane:** Banks, payments, stablecoins, insurance, legacy systems (TUI 4)
**Prepared by:** Claude (cross-lane execution)
**Rule:** each target has one concrete measurement wedge, tied to a
fetchable artifact. No certification, no pricing in the outreach.

---

## 1. Circle (USDC issuer)

**Sector:** Stablecoin issuer
**Measurement wedge:** Per-chain USDC contract measurement — reserve
attestation verification against on-chain state, not issuer reports.
**Artifact:** `GET https://councilof.ai/interop/stablecoin-universe-2026-09/index.json`
→ USDC indexed on Base, Ethereum, Arbitrum, Polygon.
**Reach:** mailto:nicholas@csoai.org → CSOAI measurement team

---

## 2. Tether (USDT issuer)

**Sector:** Stablecoin issuer
**Measurement wedge:** Same as #1 but for USDT across Tron (primary),
Ethereum, and other chains. Standardised contract measurement regardless
of issuer's attestation form.
**Artifact:** same as #1 → USDT rows across deployments.
**Reach:** mailto:nicholas@csoai.org

---

## 3. PayPal (PYUSD issuer)

**Sector:** Stablecoin issuer, payments
**Measurement wedge:** PYUSD attestation verification on Solana. Plus:
agent-mode measurement of PayPal's MCP integration (if any).
**Artifact:** `GET https://councilof.ai/interop/mcp-trust/latest.json`
+ PYUSD rows in stablecoin universe.
**Reach:** mailto:nicholas@csoai.org

---

## 4. Stripe (payments)

**Sector:** Payments
**Measurement wedge:** x402 payment-door conformance. Stripe's agent
payment primitives (if exposed) measured for conformance to x402 v2
challenge schema.
**Artifact:** `GET https://councilof.ai/interop/x402-trust/latest.json`
**Reach:** mailto:nicholas@csoai.org

---

## 5. Coinbase (exchange + USDC)

**Sector:** Exchange + USDC issuer
**Measurement wedge:** Base mainnet USDC reserve attestation at the
contract level. Plus: agent-mode wallet flow measurement.
**Artifact:** `GET https://councilof.ai/interop/stablecoin-universe-2026-09/index.json`
**Reach:** mailto:nicholas@csoai.org

---

## 6. HSBC (bank, UK sovereign stablecoin work)

**Sector:** UK bank with interest in systematic stablecoin issuance
**Measurement wedge:** AI-driven compliance measurement (regulatory
adherence, model governance). Plus: cross-asset measurement under MiCA.
**Artifact:** `GET https://councilof.ai/api/gspc` → 22 governance axes
**Reach:** mailto:nicholas@csoai.org

---

## 7. Lloyd's of London

**Sector:** Insurance / reinsurance
**Measurement wedge:** Insurance model governance — measurement of the
22 axes most relevant to insurance risk (continuity, care, governance).
**Artifact:** `GET https://councilof.ai/api/gspc`
**Reach:** mailto:nicholas@csoai.org

---

## 8. Munich Re

**Sector:** Reinsurance
**Measurement wedge:** AI vendor evaluation under the AI insurance
risk framework. Independent signed evidence on AI vendor claim about
governance.
**Artifact:** `GET https://councilof.ai/api/gspc`
**Reach:** mailto:nicholas@csoai.org

---

## 9. SWIFT (legacy interbank messaging)

**Sector:** Interbank messaging
**Measurement wedge:** AI-driven compliance messaging — measuring
when AI generates SWIFT-like messages, whether they conform to SWIFT
format and field semantics.
**Artifact:** `GET https://councilof.ai/api/state` → board section
**Reach:** mailto:nicholas@csoai.org

---

## 10. Federal Reserve Bank of NY (research division)

**Sector:** Central bank research
**Measurement wedge:** Stablecoin ecosystem measurement under the
NYDFS 23 NYCRR 202 consultation. CSOAI evidence is independent of
issuer's attestation — useful for regulatory cross-validation.
**Artifact:** `GET https://councilof.ai/interop/x402-trust/latest.json`
+ `GET https://councilof.ai/interop/mcp-trust/latest.json`
**Reach:** mailto:nicholas@csoai.org

---

*Ten targets, each with one concrete measurement wedge. Every artifact
is fetchable. No pricing in the outreach.*
