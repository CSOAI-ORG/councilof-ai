# Council SAFE export companion

A Council-owned, offline-capable reader for the **project-defined** SAFE Starter Kit catalog and disclosure export formats. It is a local inspection tool, not an official Alliance implementation or an authority service.

The original reader was implemented 6 November 2026 against Council monorepo base `94e0fc68bb9888a6f70e7bdfa14e7897496d27fc`; that work was checked against the later `659bf44ac07415af5a90a1832c08028ea963c214` base with no changed preimages or canonical dependencies. Upstream schemas, examples, README and Apache-2.0 licence are retained byte-for-byte from [Theseus Guard commit 80605915dccf98b9b07e91a621170306d0a4ac58](https://github.com/Theseus-Guard/osaa-safe-starter-kit/tree/80605915dccf98b9b07e91a621170306d0a4ac58). `vendor/retrieved-inputs.json` records original Git blob identities, SHA-256 and source URLs. No upstream files were changed.

The browser component and embed adapter are now **0.2.1**: they add task-based navigation, a clearer result summary and a relocatable host adapter. Version 0.2.1 also invalidates digest feedback when its input changes, retains failed saved-summary results across task switches, avoids inventing catalog-family relationships and gives completed tasks focus only while the user remains in that task. Bundled schemas and their hash metadata are recursively immutable. The inspection engine remains **0.1.0**, supported Starter Kit export schema version remains **0.1.0**, and the evidence-fabric event stays **`csoai.evidence-event/0.1`**. A component version change does not introduce a new evidence schema or approval capability.

## What you can do

1. Open the standalone reader or expand **Review a SAFE export** in Council OS Evidence & Learning. The standalone link remains available even if the embedded reader cannot load.
2. Choose a task: **Inspect**, **Reopen** or **Compare**. Each shows its required files in order. **Try an example instead** contains clearly labelled synthetic exports; selecting one replaces the current file.
3. For **Inspect**, select an authorised local JSON export. Read the outcome, any refusal and recovery guidance, and the always-visible authority, effect and freshness limits. Expand **Inspect all checks and recorded outcomes** for individual checks and source-declared pass/fail/inconclusive counts.
4. Use **Save check summary** for the unsigned assessment, or **Save exact original** for the original bytes. Filenames appear locally to distinguish selections and are omitted from saved summaries. A requested download does not establish that the browser saved it successfully.
5. For **Reopen**, select the original export first, then its saved check summary. The reader recomputes the result and rejects changed assertions; the saved summary cannot replace the original.
6. For **Compare**, select the later candidate first, then the earlier export. Their order is the user's selection, not proof of live freshness. Results distinguish byte identity, representation changes, contradictory records, plausible visibility projections and changes requiring reassessment; no permission is carried forward.
7. Expand the optional practice exercise to run a real local positive case and duplicate-entry negative control. The result grants no authority or professional credential.
8. Clear the selected file and results, or close the host component. Disconnecting clears its memory state; this does not remove files already downloaded.

The reader does not upload, track or persist selected files. A containing Council OS page can run other scripts: use the reviewed standalone copy in a trusted browser for restricted files. Downloaded originals retain their sharing restrictions. Even a minimised diagnostic contains correlatable digests and counts; keep it private unless authorised to disclose it.

## Run locally

The core and CLI have **zero runtime dependencies** and use Node 22/24 WebCrypto. The browser needs a modern secure-context browser (localhost or HTTPS); the portable file was designed for local-file use.

```sh
node scripts/build-safe-companion.mjs
python3 -m http.server 8765 --bind 127.0.0.1 --directory public
# Open http://127.0.0.1:8765/safe-companion/
# Host integration example: http://127.0.0.1:8765/safe-companion/integration.html
```

```sh
node packages/safe-companion/cli.mjs inspect ORIGINAL.json
node packages/safe-companion/cli.mjs compare EARLIER.json LATER.json
node packages/safe-companion/cli.mjs verify-saved ORIGINAL.json ASSESSMENT.json
python3 packages/safe-companion/fabric_event.py ORIGINAL.json
```

CLI inputs are bounded regular files; FIFOs are refused without waiting for a writer. Outputs go to stdout. Exit 2 means a refusal, an unsuitable/conflicting comparison, an unmatched saved report, or an uncheckable evidence projection; exit 1 means local execution failed; exit 64 means incorrect invocation. The commands do not send, publish or write output files. Redirecting stdout is an explicit local save.

`fabric_event.py` re-inspects the original through the same CLI and reuses `packages/evidence-fabric/event.py`. It emits canonical unsigned `csoai.evidence-event/0.1` with `PARTIAL` for an accepted inspection and `UNCHECKABLE` for refusal/unavailable input. Value stays null, negative control is `NOT_RUN`, and permission remains false. Its method pin hashes the actual adapter, reader, schema and canonical-builder bytes. It does not create a case, appointment, authority record or scheduled report.

## Self-hosted integration and LFX boundaries

[`INTEGRATION.md`](./INTEGRATION.md) contains the installation contract and current platform-specific boundaries. Copy the complete generated asset directory to a site you control. [`embed.mjs`](./embed.mjs) provides `mountSafeCompanion(host, { compact, styleNonce })`, resolving sibling modules relative to itself, and returns an idempotent `destroy()`. Version/protocol checks reuse compatible registrations and refuse older or unversioned ones without overwriting them. They check compatibility inside a trusted host, not code authenticity. No host context, file, credentials, callbacks or remote URL are accepted by this API.

[`integration.html`](./integration.html) is an independent reference host with mount/clear controls and nonce-restricted styles. It is not an LFX installation. Its fixed nonce is a test fixture; production servers using nonces must generate an unpredictable value per response. Strict host policies must authorise the modules and the component's style nonce. Shadow DOM does not isolate selected data from other host scripts; restricted exports should use the reviewed standalone copy in a trusted browser.

LFX's documented **Documents → Add Link** flow is a real way for an authorised project or group writer to make an approved reader URL discoverable. The integration guide gives the manual steps; this package creates no link and does not establish a public deployment. LFX's official MCP service is a separate authenticated data connection requiring an enabled LFID and applicable permissions. This reader neither connects to it nor supplies an LFX widget, private-data bridge or approval mechanism.

## Build and test

```sh
node --test packages/safe-companion/reader.node-test.mjs scripts/safe-companion-integration.node-test.mjs
node scripts/build-safe-companion.mjs --check
python3 packages/safe-companion/fabric_event_test.py
node scripts/safe-companion.browser-test.mjs qualification/safe-companion
node scripts/safe-companion-os.browser-test.mjs qualification/safe-companion
node scripts/safe-companion-embed.browser-test.mjs qualification/safe-companion
node scripts/safe-companion-integrity.browser-test.mjs qualification/safe-companion
node scripts/build-safe-companion-portable.mjs qualification/Council-SAFE-Companion.html
```

Python tests use `jsonschema==4.25.1`; production Python adapter uses standard library only. Browser checks use the monorepo’s existing Playwright and a locally installed Chrome (`CHROMIUM_PATH` override). Portable building uses the existing esbuild dependency. Public runtime files are generated mirrors: edit this package, regenerate, and run `--check`. CI configuration covers Node 22/24 core tests, mirror drift and canonical event compatibility; configuring a workflow does not mean it has run on GitHub.

The host browser checks cover relocation beneath a nested path, compatible and conflicting registrations, strict CSP nonce handling, repeated mounts and teardown. Passing the local reference-host checks does not establish acceptance by another site's operator or a successful external deployment.

## Reader contract and limitations

- Only exact export schema version `0.1.0` is supported. Unknown fields, versions and unsupported bundled-schema constructs fail closed. This evaluator deliberately implements only the bundled schemas’ finite vocabulary; it is not a general JSON Schema library.
- Limits: 1 MiB, 48 nesting levels, 50,000 parsed nodes, 16,384 code points per string, exact safe integer values. Invalid UTF-8, ambiguous duplicate keys, forbidden prototype members, precision-changing numbers and lone surrogates are refused.
- Catalog histories must be complete and contiguous from version 1/create, obey operation/status relationships and preserve terminal states. Wall-clock reversal is a limitation requiring review, not proof that version causality is invalid.
- The local reader is intentionally stricter than the upstream JSON schema. A refusal is a reader-profile result; it does not establish that the upstream producer is faulty.
- Disclosure approval/package digest equality is only **internal consistency**. Canonical package hashing also uses internal fields absent from the export. No export permits this reader to recompute that digest. Derivative evidence bytes are also absent.
- Producer identity and installation origin are not authenticated. UUID equality is an asserted relationship. Identical bytes establish neither latest-version freshness nor permission.
- Same-version shared visible data or immutable-header mutation conflicts. Visibility-only variations can be legitimate; where slot counts make them plausible, reassessment is required and hidden linkage remains unknown.
- Underlying evidence authenticity, measurements, reviewer identity, live expiry/revocation, authority scope and observed external effects remain unproven.
- Imported content is data. No URLs or remote schemas are fetched; no imported instruction is executed. UI dynamic values use text nodes. Diagnostics omit original paths, body text, titles, UUIDs, recipient and purpose. Input errors use fixed messages.
- Saved diagnostics are unsigned. Recomputing them proves agreement with this reader and original bytes, not producer authentication. Comparison and practice downloads are explicitly unsigned local notes and do not impersonate canonical process events.
- There is no global certification, legal determination, score, professional qualification or working-group adoption claim.

## Product connections and the next proof

| Existing Council layer | Connection supplied here | Still required |
|---|---|---|
| Council OS | Lazy reader inside the existing Evidence & Learning pane; standalone fallback | Whole-shell production build, deployed readback and host acceptance |
| Self-hosted sites | Relocatable mount/destroy adapter, compact layout and reference host | Site-owner acceptance, target CSP configuration and deployment qualification |
| LFX | Documented manual link-discovery route; authenticated MCP boundary identified | Actual permitted account/project context, reviewed hosted destination and authorised link creation; no widget acceptance inferred |
| Evidence fabric / future reports | Original export → canonical unsigned bounded inspection event | Qualified intake, freshness policy, rights/retention review and staffed report ownership |
| Charters | New learning drafts reference `csoai.hitl-authority-effect/0.2`; draft remains HOLD | Named review and adopted amendment; no automatic charter edits |
| Academy / MOOC | Real local positive/negative-control exercise | Curriculum review and competence assessment, separate from authority |
| GSPC | Declared results stay visibly separate from measurements | Independent evidence, comparator and observation; no grader or axis change |
| Human approval-to-effect | Authority/effect gaps are explicitly retained | Authenticated person approves an exact harmless action; executor checks scope, expiry and revocation; independent observer and second reader reproduce outcome |
| Regulation | No new coverage or compliance claim | Source-versioned, jurisdiction-specific obligations and applicability review |
| WG SAFE / partners | Reproducible Council-owned companion with attribution | Upstream review and acknowledgement; no maintainer acceptance inferred |

For the next controlled two-release experiment, change a genuine approval dependency (for example deployment policy plus observation window) while keeping older signed records intact. An acting executor must refuse reuse of the old approval, then allow only a newly authenticated, narrowly scoped approval. Observe the harmless effect independently; test expiry, revocation, payload/scope changes, replay and observer failure. This reader provides inspection evidence; it cannot substitute for that executor or human. Any synthetic fixture must stay labelled synthetic.

A future daily digest should deduplicate by original digest + reader version, retain changed dependencies, separate mentions/adoption/accepted execution/commercial partnership/paid revenue, and leave unknowns visible. Re-reading identical bytes is not new measurement or renewed approval. No daily scheduler or public ingestion was enabled by this contribution.
