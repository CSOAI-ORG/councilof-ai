# Council OS dashboard destination audit — 24 September 2026

Scope: the 29 grouped dashboard destinations and the All Tools shortcut in the reviewed source branch 2b9e08f7566836e92077ca9ebe08dd11c1abb575. This is a source and selective end-user audit, not a claim that the new branch is served. Existing public City and GSPC Quests views were opened inside the live dashboard; the rest of the new branch awaits the guarded release.

| Group | Destination | Current contract and end-user finding | Reviewed change or next gate |
| --- | --- | --- | --- |
| Start | Ask | Chat-first home in the shared shell. A question must not be mistaken for a navigation request. | Existing explicit-command test retained; no new server claim. |
| Start | Requests | Scoped measurement intake; submitted text does not become a measurement by itself. | Clearer source-versus-request boundary; verify intake after release. |
| Start | Verify | Browser card verification is distinct from subject safety or certification. | Pinned Ed25519 key, negative tamper and signer checks. |
| Measure | GSPC board | Current published axes and withheld states, not a score for every indexed subject. | Existing canonical board retained; check served dates after release. |
| Measure | Model registry | Model/axis grid comes from the board. | Reviewed route ownership; no new model-evaluation claim. |
| Measure | Evidence index | Coverage and worker fields have different units and may be unknown. | Subject selection now explicitly says BOARD_AXIS_SELECTION, not subject-specific measurement. |
| Measure | XRPL instruments | Catalogue state and signature fields differ from a measured security verdict. | Dated source copy; fixed broken “open XRPL instruments” chat cue. |
| Measure | SWIFT · x402 | SWIFT source is a dated census; x402 0-amount challenge may still need a wallet-capable client. | Date and client-requirement copy corrected. |
| Measure | Estate state | Published counts require named source and as-of time. | Reviewed; no invented aggregate total. |
| Evidence & proof | Signed cards | A listed card still needs independent hash/signature validation. | All card consumers now use the pinned verifier; do not equate index presence with validity. |
| Evidence & proof | Attestations | Root, witness, OTS and corrections are separate states. | Reviewed; current root and sidecars must be preserved by release. |
| Evidence & proof | Provable archive | Archive rows are dated; a fetched history is not automatically “hourly signed.” | Copy now shows source as_of and age. |
| Evidence & proof | Evidence pack | Axis evidence does not establish a user-entered subject. | Scope, subject-match and measurement states made explicit. |
| Evidence & proof | Article 50 marking | Output-marking checks have required inputs and uncertain adapters. | Tool validates inputs; practice game reduced to a bounded role exercise. |
| Evidence & proof | Embed kit | Badges/cards must carry only supported evidence. | Reviewed; no new certification claim. |
| Operate | MCP tools | Nine free methods and four paid doors in the advertised tool set. | All 13 calls exercised in the local audit; fetch time separated from source time, missing root verification no longer called VALID. |
| Operate | Measurement harness | Explains run-to-card machinery, not a promise every proposed adapter runs. | Reviewed route; verify build and served copy before changing availability language. |
| Operate | Connections | Capability map, not proof every named integration is live. | Existing native pane retained; missing adapters stay explicit. |
| Operate | Council Space | Arena rounds and dated traces, separate from the City observatory. | City link routes into dashboard; no general ranking inferred from smoke rounds. |
| Operate | City observatory | Dated city design/simulation snapshot, read-only. | Exact source JSON matched live; new direct dashboard tab and chrome-free embed await release; local embed and standalone views passed. No live multiplayer claim. |
| Operate | Learning | Dated lesson set versus current board axes. | Shows 22 snapshot paths and current axis count separately. |
| Operate | Play gallery | Launch points for real exercises/previews. | Stale all-axis/admission copy removed; GSPC Quests exercised inside live dashboard. |
| Operate | Watchdog | Evidence/correction inspection; no public incident submission. | Native read-only pane replaces redirecting hub and labels the limitation. |
| Govern | Standards | Pinned mappings are not live conformance results. | Legacy content-ID timestamp error separated from dated public-root OTS witness. |
| Govern | Regulation matrix | Industry relevance map is not a measured cell or legal verdict. | Dated-map and live-axis states separated. |
| Govern | Honesty gate | Public account of lost or withdrawn claims. | Reviewed route; preserve correction records during release. |
| Explore | Products | Published product family, not speculative capabilities. | Reviewed route; require served-byte check after release. |
| Explore | Library | Dated published pages, not a live measurement stream. | Reviewed route and discovery ownership. |
| Explore | Workbench · sign in | Account-required analyst workspace. | Nav warns before opening. |
| Footer | All Tools | Searchable master catalogue beyond the grouped rail. | Defaults to All and keeps empty-filter and mobile-drawer behavior. |

Known release gate: current RunPod publisher is stopped. The review branch is older than served card-root, correction, OTS and sitemap files; never upload its whole tree. Apply reviewed hunks onto current RunPod bare master, run same-ref gates, guarded deploy and anonymous apex/alias readback as detailed in CSOAI_DASHBOARD_UX_RELEASE_HANDOFF_20260924.md.
