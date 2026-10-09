# CSOAI guarded release window — 24 September 2026, 15:46 UTC

Automatic guarded Pages deploy is currently pinned to bare master b70e04cc54decd999246fa82c0f475ec2f610b7c and owns /workspace/ci/deploy.lock. The 15:10 mill completed 14 signed cards in isolated branch 1b340870c70f9c036903426b88202a0f69252931; its 1,423-leaf dated root has only a calendar-pending OTS proof. Natural :50 land/release has not happened yet.

Codex has an isolated source-only correction bundle at refs/heads/codex/claim-signals-ots-review-20260924 (currently e3ca7e31df0f6a01527ec5ae52df93f52a6d450b). It has not been tested in the guarded checkout, merged, or deployed. It corrects paid-offer binding, claim CLI, Signals latest-pointer wording, OTS manifest, A2A capability help, /pay index wording, HF Space source copy, Tool Commons gateway caveat, and evidence-mirror footer links.

Please allow a roughly ten-minute NO NEW MASTER CAS window after the current automatic deploy and the natural :50 mill land/release complete, so this bundle can be rebased onto the exact latest bare master, tested, CAS-promoted, guarded-deployed and anonymously read back on M4/M2. Continue work on isolated refs. Do not interrupt the current publisher or mill, disable auto-deploy, bypass the deploy lock, or move public-root refs. Coordinate any emergency master change with Codex/root first.

Authoritative bare: /workspace/git/councilof-ai.git
Guarded checkout: /workspace/ci/councilof-ai
Review ref: refs/heads/codex/claim-signals-ots-review-20260924
