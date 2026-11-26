Offline operating view for CouncilOS/MEOK research consumers. Import summarizeReactionCases and renderOperatingView from operating-view.mjs. Input is an array of exact csoai.reaction-experiment/0.1 episodes from existing owners. Output is a deterministic report of missing stages and one owner-role dependency. A reported receipt is never authenticated or independently accepted. Simulations stay separate. No network, schedule, payment, agent call, signing, write, or authority. Tests: node --test measurement/experiments/reaction-bridge/*.test.mjs. Existing business observer, GSPC grader, signing, HITL authority, buyer verification and daily reporting owners remain unchanged.
## Candidate HITL profile v0.2 — manual read-only import

This adapter is a projection, not a replacement for the existing canonical authority-effect v0.2 schema, signer validation, current revocation check, authentic human identity, executor eligibility or receiving-party effect verification.

An authorized operator can prepare a non-sensitive local JSON wrapper with these keys:

    {
      "record": { "profile": "csoai.hitl-authority-effect/0.2", "...": "retained candidate record" },
      "experiment_id": "bounded-public-study",
      "case_id": "case-1",
      "realm": "SIMULATED",
      "condition": "HUMAN_APPROVAL",
      "input_sha256": "<actual SHA256 of original record bytes>",
      "method_sha256": "<actual SHA256 of applicable frozen method bytes>"
    }

Use actual, separately checked pins; never manufacture digests. Never put private principal/recipient records into a public branch. Optional executor_authority_receipt_sha256 and receiver_receipt_sha256 are reported pointers ONLY: the adapter does not validate issuer, actor, signatures, reviewer independence, real-world effect or recipient acceptance.

The existing candidate's verification.state=VERIFIED cannot by itself populate an independent receiver stage. Even a complete reported chain remains REPORTED_CHAIN_NEEDS_EXTERNAL_QUALIFICATION. Returned data omits raw principal_ref, request_id and source claims. User-supplied study/case IDs must themselves be non-sensitive.

Manual invocation (NO send, schedule, effect or output write):

    node measurement/experiments/reaction-bridge/reaction-review-cli.mjs --candidate-hitl < candidate-public.json

The default CLI mode continues to take an array of csoai.reaction-experiment/0.1 episodes. The local CouncilOS preview accepts that episode array only and does not automatically ingest or approve candidate HITL records. Any further production adapter remains under the existing authority, privacy and release owners.
