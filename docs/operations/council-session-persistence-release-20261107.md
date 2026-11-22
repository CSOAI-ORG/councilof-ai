# Council sign-in persistence correction

Codex. autoMerge:false. Source preparation for the existing protected release; no manual deployment or production request.

The session controller previously turned unavailable storage and failed token persistence into AbortError. Login intentionally ignores cancellation, so these failures could be silent. The controller now reports a specific local persistence error and checks that the verified candidate token was actually stored before publishing an authenticated identity. Login presents only that class's fixed safe explanation. Other errors retain the generic message; superseded operations remain cancelled.

The same-origin /api/auth/me verification, requested-subject match and current-operation/live-token guards are preserved. This does not grant Company membership or bypass account verification.

The underlying controller change was exercised in seven synthetic cases as part of the retained 44/0 buyer/backend run at 2026-11-07T02:24:01Z, stdout SHA-256 5ee38717523f773e4c01b2cb0cf4008eba91a7dbdf0654b663e604bc09c4769b. That receipt is historical and does not qualify this new release head or rendered UI. This PR adds seven collected controller tests and three rendered Login handler tests to the existing blanket Vitest gate. Current-head hosted results must be reviewed separately.

The source baseline is master dafbeed3b22d77e8755f1d790b8729e1a98cea68. Pending all-pages #3991 at 549d74274eee6bc6072c87e9bba36ea7c7b21bb3 is preserved. Its adopter explicitly handed off only this narrow Login integration; carry forward the added councilSession import and known-error toast branch when reconciling that packet. No App, Header, return-helper, ToolRunner, sovTools, workflow or package source is changed here.

A successful source check or release does not establish that this defect caused the observed live in-app sign-in symptom. The existing release owner must verify the normal deploy.yml run and Cloudflare artifact revision, then the existing browser owner must verify the same Company tab. The one real case/result/receipt/refresh proof remains outstanding. The original business store and all gateway/account/reviewer gates remain intact.

The first hosted run on bb26104a failed with 9 failures, 9,646 passes and 17 skips: seven new controller cases passed, eight existing storage-denial cases still expected AbortError, and the rendered native DOMException cancellation case reached the generic toast. The successor preserves those real tests, updates only storage-specific error classifications in the existing contract, and recognises native DOMException cancellation. Other cancellation assertions and all identity/no-overwrite safeguards remain. The failed run is retained; no rerun or green result is inferred.
