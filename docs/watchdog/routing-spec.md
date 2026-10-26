# Public Watchdog: evidence and verifier routing (Measure), 14 Oct 2026
We measure; we do not certify. Code: functions/_lib/watchdogRoute.ts (+ test). Reuses existing verifiers only. No new signer, key or scheduler.

## Routing table
| artifact_type | verifier | source |
|---|---|---|
| signed_mill_card | verifyCard (verifyCardV0 for v0; MCP verify_card) | functions/_lib/cardVerify.ts, cardV0Verify.ts |
| card_root | verifyPublicRoot (merkle rule = scripts/publish_public_root.py) | functions/_lib/publicRootVerify.ts |
| capsule_index | verifySidecar + merkle (RFC6962) | functions/_lib/measurementCapsule.ts |
| capsule_batch | verifyCapsule / rootFromProof (MCP verify_capsule, verify_inclusion) | functions/_lib/measurementCapsule.ts |
| signed_interop_artifact | verify() | scripts/sign_interop_artifact.py |
| did_key | anchorsFromDid checked against PINNED_ANCHORS | functions/_lib/cardVerify.ts |
| ots_proof | ots verify (existing workflow) | scripts/maintain_card_root_ots.py, .github/workflows/card-root-ots-upgrade.yml |
| rekor_entry | --verify-root | scripts/rekor_inclusion_verify.py |
| evidence_link (Zenodo/HF) | HTTP HEAD + zenodoStatus | functions/_lib/zenodoStatus.ts |

## States (each field set on its own; never combined)
VERIFIED = the check ran and passed. FAILED = the check ran and failed. UNMEASURED = no data to check. UNCHECKABLE = retrieval failed (4xx, 5xx or timeout) or the existing verifier returned UNCHECKABLE.
Existing verdicts map as VALID→VERIFIED, INVALID→FAILED, UNCHECKABLE→UNCHECKABLE. UNCHECKABLE is never shown as FAILED.
An evidence link has no signature or root, so those two fields are always UNMEASURED. A reachable link reports a conclusion of UNMEASURED with code REACHABLE, never VERIFIED.

## JSON contract for Surface (one object per artifact)
{ "artifact_type": "...", "artifact_url": "...|null", "verifier": "...",
  "signature_valid": {"state": "VERIFIED|FAILED|UNMEASURED|UNCHECKABLE", "code": "..."},
  "root_inclusion": {"state": "...", "code": "...", "root_id": "hex|null"},
  "conclusion": {"state": "...", "code": "..."},
  "http_status": 410, "checked_at": "2026-10-14T03:12:02Z" }
Naming aligns with NLM-crosswalk-20261013.md (UNCHECKABLE for tombstoned DOIs; Zenodo IDs are record numbers). Display copy: "measured" or "checked", never "certified", "validated" or "endorsed". NLM indexing is not NLM/NIH validation.

## Zenodo live HEAD check, 14 Oct 2026, 04:11 BST (zenodo.org/records/<id> and /api/records/<id>)
26 records return 410 → UNCHECKABLE: 22013147 22070693 22070699 22070703 22070706 22070711 22070713 22070715 22070718 22070721 22070723 22070725 22076930 22293341 22307626 22347020 22635196 22646341 22710072 22741559 22760259 22811459 22987453 23020634 23030509 23031112.
21991104 returns 302 → /api/records/21991105 (newer version). Not verified as the same content, so it renders UNMEASURED/REACHABLE until the target is checked.
Raw output: zenodo-head-20261014.txt.
