# Council of AI · MEOK companion

A native MCP Apps view over the **existing** Council tools and AG-UI event stream. The same generated HTML also runs as a standalone browser workspace. This is an interface and observation projection, not a replacement router, evidence ledger, charter or authority service.

## What is implemented

- A `ui://council/live-panel/2` resource with the standard `text/html;profile=mcp-app` MIME type, attached to existing `board_totals`, `get_axis`, `verify_card` and `server_evidence` tools. Tool names, arguments, handlers and count remain unchanged. `board_totals` advertises OpenAI thread and global sidebar entrypoints with the Council/MEOK title; opening it reads the public board, not a private conversation.
- Activity, Evidence, Benchmarks, Academy and Connections views. Explicit user questions go to the fixed public `/api/agui/run` endpoint. The existing `aguiTalk` stream/parser/reducer is reused. Per-request run/thread identity is checked; missing terminal events, changed identities and malformed streams are not presented as completed. No automatic retry, page-execution consent, paid-tool confirmation or payment is sent.
- The installed MCP Apps SDK provides the host bridge, user-requested follow-up explanation and file download. A connected host receives only the selected observation when the user asks for an explanation. No hidden reasoning, unrelated conversations, keystrokes, private platform Academy database or other host tools are read.
- A local correction draft bound to the observed thread, run and revision. The user stages it, then reviews and explicitly sends that text, task identity, observed question and a bounded result excerpt through the current host’s text-message bridge. The expanded preview shows the exact staged payload; excerpts over 2,000 characters are marked truncated and the source/status remain explicit. Editing, a new task or host lifecycle change invalidates the stage. Duplicate clicks cannot send twice; a refusal or unknown delivery never retries automatically. A late acknowledgement cannot mark a new task or host session delivered. This is a conversation handoff, not an authenticated private MEOK graph update or execution approval.
- Local-only imports for Inspect and lm-evaluation-harness JSON summaries. Model/task labels, versions, original metric values and sample counts remain separate. Imported values are labelled unverified. No benchmark runs, combined safety percentage or proof of training is invented.
- Task-triggered learning suggestions over three **existing** Council Academy exercise IDs. Short practice is session-local and distinct from the Academy's reproduction-plus-negative-control completion rule. The exact published inventory can be checked on demand: changed bytes mean review due, not automatic policy adoption. Correct practice creates no certificate, XP entitlement, human identity or execution permission.
- A privacy-minimised **unsent local review note**: task state and tool labels only. It is not the canonical Watchdog daily index, evidence-event record, case store or authority receipt. Submission to Council, an AI vendor, a regulator or WG-SAFE remains a separate authorised human process.
- An opt-in standalone second window that receives only task status and tool names through a random, same-origin BroadcastChannel. It can be moved to an extended monitor/TV. It has no control authority, no prompt or reply content, and clears on revocation. Native smart-TV pairing, Cast, device control and background surveillance are not implemented or claimed.

## Build and reproduce

```sh
node scripts/build-council-native-panel.mjs
node scripts/build-council-native-panel.mjs --check
node scripts/test-council-native-panel.mjs
node scripts/test-council-panel-controls.mjs
node packages/council-panel/browser.test.cjs
# One explicit public question against the deployed AG-UI service:
node packages/council-panel/live-check.cjs --live
```

The build uses the repository's existing esbuild. The self-contained MCP Apps SDK `2.0.4` is vendored from its npm distribution and SHA-256 checked before bundling. Its upstream license and package metadata are retained in `vendor/`. There are no runtime CDN scripts or new root dependency installs. The generated HTML and JSON resource are checked in; the mandatory producer check and protected production build check regeneration before deployment. No private credential, paid provider or model download is required for these tests.

Correction tests cover task/revision changes, duplicate dispatch, refusal, malformed acknowledgement and delayed replies after invalidation. Host controls are disabled without advertised text-message capability; teardown disables them and late initialization cannot reopen an obsolete connection.

The browser test uses the real bundled SDK with an **owned protocol host fixture**, not a signed-in ChatGPT/Claude account. SDK registration tests use the actual installed MCP server SDK. The explicit live test runs the real staged panel against the deployed Council read-only AG-UI path. These are different acceptance scopes.

## Platform connection and release

This change adds presentation metadata to the existing `/mcp` and `/mcp/free` doors, not another public MCP server. After the protected master/GitHub Actions release, a supporting host must refresh its connection and discover the UI resource. OpenAI's `thread` and `global` entrypoints and portable MCP Apps rendering are host-dependent. Global metadata requests sidebar presentation; it does not establish that a signed-in host installed or displayed this candidate. No vendor directory submission, native ChatGPT/Claude installation, accreditation or all-platform interception is established by source tests.

For a text-only client, existing tool results remain unchanged. In a UI host without follow-up messaging or downloads, the request fails visibly rather than claiming delivery. A native sandbox cannot use the local second-screen channel; the view directs the user to the standalone workspace.

The native panel at `/native-panel/` is public after deployment. Its fixed evidence queries do not attach any private MEOK runtime, user memory or agent credential. Connecting private Hives, bot accounts, ACP/agent providers and genuine human approvals needs authenticated adapters and end-to-end acceptance at the actual executor. No arbitrary agent URL or key is accepted in this first view.

## Evidence and authority boundaries

The displayed trace referee is deterministic stream validation, **not** a separate human, a model consensus, proven BFT or a new GSPC grade. A public board measurement is not the user's current task's safety score. Source labels are rendered as reported. Downloaded panel observations and practice notes are unsigned UI exports, not replacements for `csoai.evidence-event/0.1` or `csoai.hitl-authority-effect/0.1`.

Stopping observation closes the client read; it does not prove cancellation of a remote effect. Consequential actions, enrolment, spend, publication and repair retain their existing independent gates. The public tools' endpoint behavior and source freshness are observed on each explicit request; the panel does not assert continuous coverage.

Source-rights, applicability, jurisdiction, competent review and policy adoption remain separate. Indexed reference clauses are not an array of live legal controls. Existing Watchdog drafts and the operating controls were read; no case intake, public report submission, source scraping, legal text change or automatic regulatory determination was added. Council/OSAIA/Linux Foundation participation is not endorsement, and external course links are not access to provider-private training data.

## Official implementation references

- OpenAI plugin extensions: https://developers.openai.com/plugins/build/extensions
- MCP Apps: https://apps.extensions.modelcontextprotocol.io/api/documents/overview.html
- OpenAI MCP extension protocol: https://github.com/openai/mcp-extensions/blob/main/docs/spec.md
- Inspect evaluation log schema: https://inspect.aisi.org.uk/reference/inspect_ai.log.html
- Existing Academy source: `public/academy/exercises/exercises.json`, pinned in `academy.ts`.

## Next native acceptance

After protected deployment, open the thread entrypoint in a supported signed-in host, run a public evidence question, explain the selected result in that conversation, download it, import a benchmark locally and follow its Academy suggestion. Stage and explicitly send a correction, then repeat with a declined message, interrupted host connection, truncated stream and unavailable source. Confirm that old acknowledgements cannot change the current task or connection. Record that host/version separately. Do not infer a host installation, a staffed human review service or an external repair from a successful browser fixture.
