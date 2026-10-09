# Claim Maintenance public delta — 23 September 2026

Anonymous readback of https://councilof.ai/api/claims/register at 06:43 UTC: HTTP 200, 62,283 bytes, SHA-256 `f0de7c9249c2e5b4ef84f74c9fac6597a0fb6d5d67bbf5b0a49661f3e0e74955`, register `as_of=2026-09-23T06:07:15Z`. The page at https://councilof.ai/claim-maintenance/ renders the matching subject table.

The current register has **47 subjects and 94 claims** across three live registry files; one older file is superseded. States: 22 CLAIM_CAPTURED, 26 CLAIM_MEASURED, 34 UNMEASURED, 12 UNCHECKABLE. 86 claims conform to the claim-artifact schema. These are register states, not 94 verified measurements. Forty-five subjects have a scheduled next read in the public register.

This is newer than the 04:36 UTC readback of 23 subjects and 70 claims. The first RunPod claim-watch runs at 06:27 and 06:29 covered only those 70 claims. The registry-discovery repair was then installed in the existing guarded wrapper. Two later real runs exited 0 at 06:51 and 06:54 UTC and reread all **94 claims across three active registries**, including the 24-claim `osaia-membership-2026-09-23` registry. The current installed wrapper hash, exact readbacks, scheduler cadence and review-only exceptions are in [the runtime receipt](CLAIM_WATCH_RUNTIME_2026-09-23.md). The public register labels the OSAIA sidecar signature and SHA pin verified; this update independently checked its SHA pin, not the Ed25519 signature.

The public site has a contact email and reference implementation but no evidenced buyer conversion from this delta. The revenue API still reports one non-self payer and a single 0.02 USDC settlement; no repeat payer was observed.
