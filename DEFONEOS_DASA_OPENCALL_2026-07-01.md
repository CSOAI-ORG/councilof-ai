# DEFONEOS — DASA Open Call for Innovation (DRAFT · Nick submits)

_Draft for the UK Defence & Security Accelerator (DASA) Open Call — the standard SME funded-proof route. Lead every assessor to the live, self-verifying demo. Draft only; personalise to the current call wording before submitting._

**Live proof (put in the first line of every field):**
- Signed System Card — https://os.meok.ai/systemcard.html (Verify offline · Tamper test · Download signed PDF)
- Signed Model Card — https://os.meok.ai/api/systemcard?type=model
- Signed Card Registry — https://os.meok.ai/registry.html
- Independent verifier — https://os.meok.ai/verify.html

---

## Title
**DEFONEOS — signed, independently-verifiable AI assurance for JSP 936.**

## The problem we're solving (for Defence)
JSP 936 mandates AI assurance across the lifecycle, but — in the MOD's own words (Defence AI Centre / Alan Turing Institute) — there is **no formal way to independently validate a supplier's "deployment-ready" claim**, and **no central store** for the assurance records (teams keep system cards locally). So assurance today is un-checkable, un-shareable, and un-portable.

## Our innovation
A **cryptographically-signed assurance layer** that turns an assurance *claim* into an assurance *proof*:
1. **Signed System & Model Cards** built 1:1 to the DAIC/Turing template, **Ed25519-signed** and **offline-verifiable** by anyone with the public key — tampering invalidates the signature.
2. **Signed Card Registry** — the shareable, searchable store MOD lacks; the index itself is signed.
3. **Sovereign key identity** — every artifact carries a sovereign-key fingerprint (SOV:…), pinnable to the issuing authority.
4. **Governed substrate** — care-floor + immutable hard-stops (no kinetic targeting / no individual surveillance / no unvoted autonomy), every action signed; post-quantum (ML-DSA-65) for archival integrity.

It sits **on top of** existing capability (Anduril/Helsing/Palantir/in-house) — it is **not** a weapon and has no export-control blocker.

## Why it's innovative / not already done
Incumbents (Advai, Frazer-Nash, Faculty) deliver assurance **as consulting services**. Nobody ships the **primitive**: a signed, offline-verifiable assurance artifact + registry that any party can check without trusting a vendor or dashboard. That primitive is the innovation, and it's **live and checkable today**.

## Benefit to defence
- **Closes the JSP 936 validation gap** — MOD can independently verify a supplier's assurance, offline.
- **Portable & vendor-neutral** — works across programmes, suppliers and (later) coalition partners.
- **Auditable forever** — signed records remain verifiable years later, supporting incident review and accountability.
- **Faster safe adoption** — assurance stops being a bottleneck and becomes a one-click check.

## Technical maturity (TRL)
Assurance primitive at **TRL ~5–6**: signing, verification, System/Model Cards, signed registry, and a public verifier are **deployed and independently checkable now**. Sovereign substrate: 531 MCP hives (313 live on PyPI), Ed25519 signing proven. **Honest gaps:** not security-cleared; no defence pilot yet (this is what we seek).

## What we'd do with DASA funding
1. Harden to a defence-grade pilot (accreditation prep + security review).
2. Design-partner pilot issuing signed cards against a real/realistic MOD AI use case (e.g. with a DAIC or Turing-type partner).
3. Independent validation of the signed-card primitive.

## Cost / duration
Phase 1 feasibility (indicative): a short, low-cost design-partner pilot — scope to the call's funding band. (Fill exact £ + months to the current Open Call terms.)

## Team
Solo founder (Companies House **16939677**) + a governed AI substrate; seeking DASA's network for defence access, a design partner, and independent validation.

## Assessor quick-check (say this)
> "Before you read further — open https://os.meok.ai/systemcard.html, click **Verify offline** (green), then **Tamper test** (one changed byte → red). That 15-second check is the whole innovation."

## Send discipline
Nick submits; I draft only. Map fields to the exact current Open Call form; keep the live-demo link first.
