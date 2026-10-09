# CSOAI operations handoff — 12 September 2026

Codex installed the private business observer and daily complete index reader on existing mill fpowppss5ngtkw. Source PR https://github.com/CSOAI-ORG/councilof-ai/pull/2015, head 4d2fb562783e3c4777b06fea3d01183bf92ebe98. Installed revision a0af893791df8c69 under /workspace/csoai-operations/releases; receipt at /workspace/csoai-operations/install-receipt.json. Seven tests passed on Mac and pod. No new GPU, restart, signing, paid request, publication, merge or deployment.

Cron adds one 15-minute observer and hourly :23 due-check for a daily index census. The two previously audited Mac-path business jobs are commented out, with backups saved under /workspace/csoai-operations. Other operators' source files are untouched. Existing /workspace/gspc-worker/pod-watchdog.sh invocation now inherits OLLAMA_MODELS=/workspace/ollama-models; its file is untouched. This preserves model visibility for later restarts without altering the current worker.

Current main worker remains DEGRADED after 70 model-not-local failures at 12:14. Model-path repair exposed all five existing local models. The isolated recovery run is complete but unsigned and unadmitted. Daily intervals mean the main process has not retried yet. Do not reset its history or mislabel the recovery run as public board refresh.

Existing legacy scheduler/supervisor absent at this audit; private intake token file absent; latest private upload FAILED at 09:44. Public upload queue also lacked its credential. The observer now exposes these gaps. Do not revive an old scheduler blindly: it includes settlement and upload jobs with separate authority/credentials. Restore only the intended verified lanes and preserve private/public admission boundaries.

TUI1 still owns shared EXECUTION-LEDGER and root-witness deployment failures. Both untouched. PRs 2010/2011/2012 remain separate previously verified work for human merge.

Full dated brief, contribution drafts and investor facts: /Users/nicholas/Documents/CSOAI-14-Day-Operations-2026-09-12/OPERATING_BRIEF.md. EU consultation September 15 23:59 CEST; NIST input September 16, cutoff time unspecified. Drafts UNSENT. Current reported non-self revenue 0.02 USDC, one payer; repeat demand unproven. Codex follow-through every six hours through September 26, quiet unless actionable changes.
