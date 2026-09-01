# CloudFront × x402 USDC — request-attestation (design) — 1 Sep 2026

**Status:** DESIGN DRAFT. Document/cite lock only. **Do NOT implement CloudFront billing live.**  
**Locks:** Board **22 · 15 · 7**. Never certify. No `/proof` claim until owner cut-off paste. No custom payment-code claim beyond this design. No wrangler. No Cloud Agents. No laptop key.

---

## Thesis

Put **request-attestation** (pay-to-recompute / re-attest challenge) **behind CloudFront + WAF**, with **x402** challenge headers and **USDC** as the settlement asset class for agent measure calls. This is an **edge design**, not a live cashier.

| Piece | Intent | Sit |
|---|---|---|
| CloudFront + WAF | Edge gate in front of attestation challenge | Design only — do not wire billing live |
| x402 | Agent payment rail; challenge header | Header **≠ settlement** until facilitator receipt exists |
| USDC | Settlement asset class | Invent no price; Nick names agent SKU later |
| Master plugin `request_attestation` | Tool name for the challenge path | Track; do not claim `/proof` live |

Existing eunomia-class `?x402=1` → 402 challenge remains **header-only honesty**.

---

## Flow (conceptual)

```
agent / stranger
   → CloudFront (+ WAF)
   → x402 challenge (402 + payment required headers)
   → facilitator receipt (when live)
   → request-attestation / recompute on frozen bank
   → new card-v0 leaf → ONE writer advances root
```

Payment never stamps MEASURED. Empty stays empty. Board authority remains GET `/api/gspc`.

---

## Honesty / copy

**Do write:** "Design for request-attestation behind CloudFront x402 USDC." · "Header ≠ settlement." · "Track `/proof-on-x402`."

**Do not write:** "Live `/proof`." · "We shipped a custom payment stack" (beyond design). · "Paid = certified." · Endorsement of any card network / facilitator.

## Hard stops

1. Do not deploy CloudFront billing / WAF paywall from this leftover.  
2. Do not claim `/proof` on x402.  
3. Do not paywall `/root.json`.  
4. No second root writer.  
5. No MEASURED fill of the 7 empty from payment volume.

Companions: fire-playbook `10-…` §A · `12-master-plugin.md` (`request_attestation`) · denser-roots wedge.

*End. Design only. Europe/London. 1 Sep 2026.*
