// /api/corrections — the public corrections ledger.
//
// The estate's doctrine is "corrections appended, never edited". This is that
// doctrine made a machine-readable surface: every entry is something the estate
// got wrong, how it was caught (usually by the estate's own instrument), and
// the fix — dated, never deleted. Publishing your own corrections is the
// credibility engine: it is what lets a relying party trust the /api/regulation
// feed and the signed board, because the same body that publishes the number
// also publishes when the number was wrong.
//
// GRAMMAR: an entry here is a FACT about our own history, not a MEASURED figure
// and not a claim about anyone else. New entries are appended in place; the
// array is never reordered or trimmed.
//
// REDACTION RULE: this ledger is itself a machine surface, so it obeys the
// no-banned-vocabulary invariant the machine-contract guard enforces on every
// public JSON surface. When a correction is ABOUT a leaked internal identifier
// or brand token, describe the token — do NOT reproduce it literally. Printing
// the specialist-id prefix or the brand token here would re-leak the exact
// string the correction says was removed (and a crawler would still find it
// live on /api/corrections — even a source comment is best kept clean). The
// fact is preserved; only the toxic token is abstracted. Do not "restore" the
// literal strings in the name of candour — the abstraction IS the honest form.
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

const LEDGER = {
  schema: "csoai.corrections/0.1",
  policy: "Appended, never edited or deleted. Each entry: what was wrong, how it was caught, the fix. The instrument that catches its own owner is the instrument you can rely on.",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections: [
    // ── 2026-08-26: six entries from an outside SCITT/COSE audit ───────────────
    // Not self-caught. A working SCITT implementer with no CSOAI code, no CSOAI
    // credentials and no prior knowledge of the estate ran the published recipe
    // against the live site and reported what did not hold. The findings below are
    // theirs; the fixes are ours. An estate that publishes its own corrections has
    // to publish the ones someone else found, or the ledger is a highlight reel.
    {
      id: "C-2026-0826-12",
      date: "2026-08-26",
      what_was_wrong:
        "The board attestation's sig_input was ambiguous, and the ambiguity was live rather than theoretical. It read \"canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed\" — six words that do not pin a preimage. The natural first reading in a Python-flavoured estate is json.dumps(sort_keys=True, separators=(',',':')), whose default is ensure_ascii=True, and that FAILS: the signer emits non-ASCII literally, i.e. ensure_ascii=False. The signed payload carries 81 non-ASCII code points (middle dot, multiplication sign, en dash, em dash, right arrow, greater-than-or-equal), and the two readings differ by about 256 bytes. Two implementers reading the same sentence get two different preimages and one of them reports a bad signature on a good artefact. The sentence also never said whether the signature is over the raw bytes or over a digest of them.",
      how_caught:
        "Outside audit of the live site, 2026-08-26 (finding A2). The auditor's first and more natural reading failed; the signature verified on the second attempt, after guessing.",
      fix:
        "sig_input now states the rule as bytes: Ed25519 over the RAW UTF-8 bytes (not a digest) of canonical JSON with keys sorted by code point recursively, no whitespace, non-ASCII emitted literally as UTF-8 and never as \\\\uXXXX escapes (ensure_ascii=False, with ensure_ascii=True named explicitly as the wrong reading), and numbers serialised by ECMAScript Number::toString so an integral float renders 0 and not 0.0. Two machine-readable fields, sig_input_ensure_ascii: false and sig_input_is_digest: false, carry the same facts for a parser. CRITICALLY, THE CARDS ARE THE OPPOSITE AND STAY THAT WAY: the 150 measurement cards were minted with ensure_ascii=TRUE and CPython float repr, and each card states so in its own preimage field. Neither rule can be migrated to the other without invalidating signatures over bytes that already exist, so nothing was harmonised — both rules are now stated explicitly wherever each is published, and /signed/HOW-TO-VERIFY.md carries a table putting them side by side so a reader who verifies both is not burnt by the difference.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-11",
      date: "2026-08-26",
      what_was_wrong:
        "The public MCP `measure` tool returned ok:true for every subject, including subjects that do not exist. Passing a nonsense model name produced {\"ok\":true,\"claim\":\"measurement\",\"subject\":\"<the nonsense name>\"} with a note explaining that nothing had actually been measured. No measurement ran, no axes came back, no credential was issued, and the tool's own description promised \"a signed measurement credential\". A measurement tool that succeeds on a nonexistent subject cannot distinguish MEASURED from DID NOTHING — which is exactly what our own /api/mcp honesty_contract forbids: unknown is null or unmeasured, never a plausible-looking value. We applied that doctrine to the registry and not to the tool.",
      how_caught:
        "Outside audit of the live site, 2026-08-26 (finding P1). The auditor called the tool with THIS-MODEL-DOES-NOT-EXIST-xyz and got the same ok:true as for gpt-4o. Nothing on our side was checking; the tool was listed as `probed` because tools/list returned its name, and `probed` was reading as `works`.",
      fix:
        "`measure` now returns ok:false with a named state on every call, because no call to it ever succeeds: INVALID_ARGUMENT when no subject is given, NOT_MEASURED otherwise, each with the reason and a pointer to where published measurements actually live (/signed/card_index.json and /api/gspc). It also states plainly that it did NOT check whether the subject exists rather than implying it did. The tool description in tools/list is rewritten to what the endpoint does — return the contract — so an honest result no longer sits behind a description that over-promises. PARTIAL, AND SAID SO: the upstream worker's source is not in this repository, so the correction is applied at councilof.ai/mcp, the address published in .well-known/mcp.json and agent-card.json. The worker's own workers.dev origin still returns ok:true and needs an owner-side deploy to close.",
      status: "FIXED AT THE PUBLISHED ENDPOINT; UPSTREAM WORKER FIX PENDING (owner)",
    },
    {
      id: "C-2026-0826-10",
      date: "2026-08-26",
      what_was_wrong:
        "The jail axis published a dataset_url that is not a URL, directly beneath a note asserting that every such URL is fetchable. The axis's `dataset` field — an identifier field, resolved to a link by string concatenation against https://huggingface.co/datasets/ — held a prose sentence: \"published: csoai/gspc-jail-goldbank (frozen 71-cell gold bank, HF 2026-08-25)\". The resulting dataset_url contained a colon, spaces and parentheses and was rejected by curl as malformed. Twelve other banked axes resolved fine, and the bank itself was always fine and always public. The bank_note above it read \"Every axis WITH a frozen bank carries dataset_url — the bank resolved to a fetchable URL\": a blanket assertion with nothing deriving it, false for as long as it stood.",
      how_caught:
        "Outside audit of the live site, 2026-08-26 (finding D10). The auditor fetched all fourteen; thirteen returned HTTP 200 and one would not parse.",
      fix:
        "`dataset` now holds the bare slug csoai/gspc-jail-goldbank and the prose moved to dataset_note. The resolver no longer concatenates blind: a value that is not a bare <owner>/<name> slug now publishes dataset_url: null with dataset_url_state UNRESOLVABLE and the raw value, so the fault is visible on the surface that carries it instead of shipping a string that looks like a link. bank_note is now derived from that same predicate and reports counted totals (banked_axes, banked_axes_resolvable, banked_axes_unresolvable), so the sentence and the bytes cannot disagree again. The same correction is applied to the packaged /signed/gspc-measurement.json, which carried the identical prose.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-09",
      date: "2026-08-26",
      what_was_wrong:
        "We published recall: null for council-inhouse-ft on the jail axis where the measured value is 0.0. That model has tp=0 and fn=38, so recall = tp/(tp+fn) = 0/38 = 0.0 — defined, measured, and the single most damaging number on the axis: our own fine-tune detected zero of 38 escapes. null reads as NOT MEASURED. Publishing it in place of a real zero is this estate's own defect class inverted: instead of inventing a number where none exists, we erased a number that did. It sat on a row whose note says \"published, not hidden\". precision on the same row is legitimately null (0/0 is undefined, nothing was predicted positive), so two fields carrying the identical value meant opposite things with nothing distinguishing them.",
      how_caught:
        "Outside audit of the live site, 2026-08-26 (finding D11). Every other cell of the jail axis reproduced to the item — seven confusion matrices, precision, recall, accuracy and the fleet mean — and this was the one arithmetic exception the auditor found.",
      fix:
        "recall is 0.0 on /api/gspc and in /signed/gspc-measurement.json. The axis now carries a null_grammar field stating which null means UNDEFINED and which zero means MEASURED, so the distinction is published rather than left to be inferred. The frozen /signed/gspc-board.signed.json still contains recall: null and is NOT edited: its MPC custody signature is over those exact bytes, so correcting it at source is an owner-supervised re-sign. Until then this ledger and the live board carry the correction where a reader will meet it.",
      status: "FIXED ON THE LIVE BOARD; FROZEN SIGNED SNAPSHOT AWAITS RE-SIGN (owner)",
    },
    {
      id: "C-2026-0826-08",
      date: "2026-08-26",
      what_was_wrong:
        "The living_stamp was presented as a valid attestation and cannot be checked by anyone. It shipped signed: true and a sig_input recipe, rendering exactly like the two attestations on this site that do verify. It does not verify. Three faults compound: TWO different signatures are published for one stamp, with the same signer and the same `updated` — one in /signed/board_living.json, a different one in /api/gspc measured_on.living_stamp, and at most one can be over the bytes the other is over; the signer is in NONE of the four verification methods in our own did.json, so even a reproducing preimage would prove only self-consistency, the unfalsifiable shape our own HOW-TO-VERIFY tells strangers to refuse; and board_living.json states in its own note that its axes were re-snapshotted from the live board at package time, six days after the signature date, so the signed bytes are not the published bytes.",
      how_caught:
        "Outside audit of the live site, 2026-08-26 (finding A3): roughly fifty readings attempted, none verified. Re-run in this lane the same day at wider scope — both published signatures, all five published keys, nine candidate payloads, raw/sha256-digest/sha256-hex message forms, both ensure_ascii settings, every drop-set of up to three fields: 58,184 attempts, 0 verified.",
      fix:
        "The stamp is marked UNVERIFIABLE wherever it is published — /api/gspc, /signed/board_living.json and /signed/gspc-measurement.json — carrying verification_state UNVERIFIABLE, verifiable: false, signer_anchored: false, the attempt count, and a note stating that it must not be treated as a valid attestation and pointing at the two attestations that do verify. It is NOT withdrawn and its bytes are NOT altered: a row saying \"we published this and nobody can check it\" is worth more than a quietly deleted one, and if a preimage rule is ever recovered it must still verify against these bytes. We do not claim the stamp is invalid — only that it is uncheckable, which for a relying party is the same outcome. To close: anchor the signer in did.json, publish the exact preimage (which fields are signature fields, raw bytes versus digest, encoding), and publish ONE signature. Owner-gated; this lane does not hold the key.",
      status: "MARKED UNVERIFIABLE; REPRODUCIBLE SIGNATURE PENDING (owner)",
    },
    {
      id: "C-2026-0826-07",
      date: "2026-08-26",
      what_was_wrong:
        "The claims register described bytes that do not exist. CR-002 gave as its evidence \"Cards declare timestamp_authority: 'none'\". Zero of the 150 published cards contain that field; the string \"timestamp\" appears in no card, not in card_index.json and not in the cross-border card. The substance was honest — there genuinely is no timestamp authority behind any card — but the register asserted a positive declaration as its evidence for an absence, and the claims register is the one page whose entire purpose is claim-to-evidence fidelity. A correction that misdescribes the thing it corrects is worse than the original gap.",
      how_caught:
        "Outside audit of the live site, 2026-08-26 (finding D8). One grep over the published cards.",
      fix:
        "CR-002 now describes what the cards actually declare: nine body fields, none of them a timestamp authority; the only time a card carries is `created`, an instant the issuer asserted from its own clock and then signed, which attests assertion and not independent observation; and `prev` gives ordering, not time. The superseded wording is kept on the row under a dated `amended` note and rendered on /claims-register — a published claim is amended in the open, never rewritten in silence. Adding an explicit timestamp_authority: \"none\" to the card schema would be the stronger answer and is recorded as a change for the NEXT card format, not as a thing already done: each card id is the SHA-256 of its own body, so a new field re-mints every id and invalidates every published signature.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-06b",
      date: "2026-08-26",
      what_was_wrong:
        "/claims-register announced \"20 claims\" and rendered 19, immediately beneath its own sentence \"This page renders that exact file — there is no second copy to drift.\" The header printed claims.length while the sections were built from a hardcoded four-status order — live, devnet, planned, retired — and claims-register.json declares five. The fifth is `unmeasured`, and the one claim carrying it (CR-020) had no case in the renderer, so it was silently filtered out of the page and out of the legend. On a site whose banner is \"UNMEASURED shown honestly\", the register dropped the only unmeasured row. The wrong count was the visible defect; the dropped row was the worse one.",
      how_caught:
        "Outside audit of the live site, 2026-08-26 (finding D9). The auditor diffed the rendered ids against the JSON. Nothing on our side compared the two — the drift the sentence rules out was never checked.",
      fix:
        "The page now derives its status order from the file's own statuses[] and appends any status that appears on a claim but was not declared, so a row can never be dropped for wearing an unexpected label; `unmeasured` has a real chip and a real legend entry. The header count is the length of the rows actually rendered, not claims.length — a number on that page is now derived from what a reader can scroll to. If a row ever does fall out, the page says so in a visible RENDER DEFECT banner naming the id. scripts/claims-register-lint.mjs re-derives the grouping at build time and fails the build on any drift between the file and the page, including a declared status with no legend entry or a typed number back in the header.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-08",
      date: "2026-08-26",
      what_was_wrong:
        "For twelve days the verify page told strangers to pin a signing key that does not exist. The page's authorship note named a published key by an eight-character fingerprint beginning f4b4278d. That fingerprint matches none of the four keys in our DID document, not the card-attestation key the 150 board cards are actually signed with, not the board key, not the living-stamp key. It appears in exactly one place in the entire estate — that sentence — and in no signed artifact, no key file and no commit that produced key material. It was introduced on 2026-08-14 in a bulk copy reconciliation, alongside an OpenTimestamps anchoring claim that was itself later walked back. We cannot establish what it was, so we are not going to invent a story for it: it was a fabricated fingerprint, and a fingerprint is the one string on a page telling people which key to trust that has to be right. The real card-attestation key, beginning d4cb0eaa, appeared nowhere on that page.",
      how_caught:
        "An outside auditor with no CSOAI code and no CSOAI credentials grepped the fingerprint across every page, the DID document and the card index, and found one occurrence and no key. Not self-caught. The estate had published a key-pinning instruction it had never once executed against its own page.",
      fix:
        "The fabricated fingerprint is removed from both surfaces that carried it, the verify page and the agent registry. Both now name the anchor by its DID identifier, link the DID document so a reader can read the key out for themselves, and print the real key prefix. No provenance has been invented for the removed string, because none could be established.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-07",
      date: "2026-08-26",
      what_was_wrong:
        "Our own published verifiers rejected our own genuine cards, and our tamper detector rendered its failure in green. Three separate defects on the one surface whose entire purpose is that a stranger does not have to take our word for anything. First, the single-record verifier on the verify page hashed the whole card envelope minus the signature instead of the body sub-object the signature actually covers, so it could never verify any card, ever — and it reported that preimage bug as no published key verifies this signature, which is a statement about key publication and was false, sending readers to hunt for a key that was published all along. Second, the same form fed its verdict to a public opt-in tally, so every honest visitor who verified a real card and clicked the button filed a false failure into a public counter. Third, the MCP verify tool answered unrecognized card family to every card family we publish, including the cross-border card that verifies fine under our own recipe, because it looked for a content_id field on cards that carry id. Fourth, the client-side chain verifier's headline label was a constant string reading chain intact regardless of outcome; only the tick flipped to a cross, so a successfully detected tamper announced that the chain was intact, in the success colour, on the page that promises a broken row is reported as BROKEN, visibly.",
      how_caught:
        "An outside SCITT implementer followed our post to the IETF list, verified a card in Python against our published recipe, then clicked our own verify button to cross-check and was told our card was invalid. Every one of these was reachable from the public site with a browser and curl. None was caught by us.",
      fix:
        "There is now one verification implementation, shared by the browser form and the MCP endpoint, so the two surfaces cannot disagree again. It implements the published rule exactly, including the CPython number representation that renders an integral accuracy as 0.0 rather than 0 — 56 of the 150 cards carry such a value, and a verifier without that rule reports a false failure on 37 percent of a corpus that is sound. It recognises both published card families rather than rejecting both. Critically, it reports three failures as three different failures: the bytes do not hash to the declared id, the signature does not verify over those bytes, and the signer is not a key published in our DID document mean different things and are never collapsed into each other. The signer is pinned against the live DID document, so a card carrying an attacker's own key is reported as an untrusted signer even when its signature is internally valid. The tamper label now states the outcome in words and a failure no longer renders in the success colour. All 150 published cards verify through the fixed path, a tampered card fails as a hash mismatch, and a re-signed forgery fails as an untrusted signer. Regression tests read the real published bytes so these cannot silently return.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-06",
      date: "2026-08-26",
      what_was_wrong:
        "We repeated a human-versus-machine benchmark contrast without checking whether both sides were scored under the same rule. The metrology deck cites the ARC Prize project's ARC-AGI-3 result — a human panel solving essentially all environments while frontier systems average well under one percent. The attribution was correct and careful: labelled reported-not-measured, never placed on the board. The number is not the defect. The defect is that we published a comparison between a human figure and a machine figure without asking the question our own first rating-the-raters result exists to ask, which is whether the two figures were produced under the same scoring rule. Having now recomputed ARC's published participant rows for ARC-AGI-2, we know that on that benchmark the human figure is computed under unlimited submissions while machines are scored at two trials, and that the rule-matched human figure is about eleven points lower. We had no basis to assume ARC-AGI-3 was free of the same gap, and no basis to assume it had it.",
      how_caught:
        "Self-caught, by our own instrument, on its first run. Building the RTR-A1 human-reference rule-match measurement against ARC-AGI-2 meant asking of another organisation a question we had not asked of our own published page. Sweeping our surfaces for prior statements about the same publisher is what surfaced it. This is the intended failure mode of a rating-the-raters programme: the first thing a new instrument should catch is its owner.",
      fix:
        "The deck passage now carries the caveat, stated as a limit rather than a finding: a human-versus-machine contrast only means what it appears to mean if both sides were scored under the same rule; on ARC-AGI-2 we measured that gap; whether ARC-AGI-3 shares it is UNMEASURED because its scoring formula is not published, so we cannot check and will not assume either way. The general rule this establishes for every surface: CSOAI does not republish a human-versus-machine comparison without either verifying rule-match or marking it unverified. Nothing was removed and no third-party number was restated as ours.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-05",
      date: "2026-08-26",
      what_was_wrong:
        "Two published index artifacts claimed a measurement they did not have. /interop/ai-economy-index.v0.1.json and /interop/human-labour-index.v0.1.json each carry a status label of MEASURED-INDEX-v0.1, while each also states in its own body that half its input components are bank gaps and that no index value is computed. The axis register had already been reverted to UNMEASURED for both; the artifacts were not, so a live surface kept asserting the retracted status. Existing reference components are not a measured index.",
      how_caught:
        "Reading the evidence behind every financial axis before wiring it into the board, rather than trusting the axis register's summary of it. The register said UNMEASURED; the artifact it pointed at said MEASURED-INDEX-v0.1. Following the pointer is what surfaced the disagreement.",
      fix:
        "Both axes are wired into the signed board as UNMEASURED, and the board — which is the authority — states on each axis and in its limitations that the v0.1 artifacts' status label was an over-claim and is superseded. Neither index contributes to any measured count. The artifacts themselves are signed under a key this lane deliberately does not hold, so correcting them at source is a separate owner-supervised re-sign; until then the board carries the correction where a reader will meet it.",
      status: "FIXED ON THE BOARD; ARTIFACT RE-SIGN PENDING (owner)",
    },
    {
      id: "C-2026-0826-04",
      date: "2026-08-26",
      what_was_wrong:
        "The public board contradicted the estate's own ruling for two days. An owner ruling of 2026-08-24 set the canonical axis count at 22 (14 behavioural + 8 financial/domain), but GET /api/gspc kept reporting '14 measured of 14 quotable' because the 8 financial axes existed only in the ruling and in a side register — never in the signed board payload the count is derived from. Downstream, the estate's own claims register recorded '22' as an internal figure that was 'not corroborated by any live surface', and a source comment instructed authors to 'not invent 22 axes'. The estate simultaneously ruled the number, forbade the number, and published a different one.",
      how_caught:
        "Self-reported, not discovered. The ruling document itself recorded that the sweep was authorized but unexecuted, and named the reason. The delay was deliberate and is the point of this entry: a public count must be backed by the signed artifact it summarises, so the fix could not be a copy edit on the pages. Editing the number without the data behind it would have put a figure on a public surface that the signed payload could not support — the same defect class as a score published without its measurement. The board was behind the ruling, never ahead of it.",
      fix:
        "The 8 financial/domain axes were wired into the board DATA and the payload re-signed. The board now derives '22 axes · 15 measured' from the axis array: 22 slots, 15 with a real run behind them, 7 declared slots with none. The ruling's own wording applied the word 'measured' to the full slot count, and the evidence does not support that word — only one of the eight financial axes (provenance-controls, a deterministic mainnet read of 6 issuer accounts) carries a measurement. Per this ledger's redaction rule the exact phrase is described rather than reproduced: it is now the forbidden form the build gate catches, and reprinting it here would republish the sentence this correction exists to retire. No axis was marked MEASURED to make the two numbers agree; the grammar changed instead, and both numbers now travel together. Separation statistics and every mean are scoped to model-comparison axes, so a financial axis can neither enter a sentence about statistical separation nor drag an absent value into an average as a zero. The claims register was re-authored from 'internal, not corroborated' to a live claim with the endpoint as its authority, and now names the forbidden form '22 measured axes' explicitly.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-03",
      date: "2026-08-26",
      what_was_wrong: "Our own published MCP fleet was silently paywalled and self-scoring. A monetization layer injected into 318 of 363 vendored servers capped the ENTIRE fleet at 10 anonymous tool calls per day from one shared counter; past that, every tool returned a purchase link instead of a result. The injected code was spliced mid-function in 49 files, leaving original function bodies unreachable (256 undefined names). Five scorecard checks awarded points for carrying a purchase link — the system scored itself higher for being paywalled. The paywall also masked quality: a first probe found 1 stub because refusals and stubs were indistinguishable.",
      how_caught: "Building a remote MCP server for other AI platforms; the first real tools/call returned a purchase upsell instead of a result. Verified twice independently by direct grep and by probing all 338 servers with real MCP sessions.",
      fix: "Monetization layer removed fleet-wide: 318 -> 0 servers carrying a purchase link, 0 price strings, 0 upsell symbols. Capability preserved and proven, not assumed: all 338 servers re-probed with real initialize/tools/list/tools/call — handshakes 336/338 unchanged, 1869 tools unchanged, 0 broken; undefined names fell 256 -> 16 because removing the injected code repaired what it had broken. Honest stub register published (13 fully stubbed, 10 partial, 2 dead) determined by CALLING every tool, not grepping. scripts/no-paywall-guard.mjs added with a --selftest so the layer cannot return; it caught 48 residuals we had missed.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-02",
      date: "2026-08-26",
      what_was_wrong: "Five sector pages asserted, in present tense, that our measurement 'is recognised under mutual recognition agreements with' CISA, NCSC, ANSSI, BSI, BEREC, ENISA, national transport authorities and others — named public bodies, implying an endorsement we do not hold. It shipped in the deployed bundle. Separately, /layer0 served a retracted fault-tolerance claim as a live capability, contradicting our own DR-0007 retraction (measured effective independence 1.21 of 3).",
      how_caught: "Claims-substantiation audit of the prerendered output, prompted by the FTC's own recommended exercise: inventory every public claim and map it to evidence.",
      fix: "Replaced with: we crosswalk our measurement output to those compliance pathways, and hold no mutual-recognition agreement with, and are not endorsed or accredited by, any of these bodies. The retracted claim removed from /layer0, /poc-showcase and /competitors. A machine-readable claims register now publishes every claim with its evidence link and a live/planned/devnet/retired status.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-01",
      date: "2026-08-26",
      what_was_wrong: "Our own prerender verification could not observe failure. prerender-report.json records a failed route in a field named 'err', but every check in the repository read 'errored' — a field that has never existed. A run in which the browser died on 515 of 581 routes reported '0 errored' and looked clean.",
      how_caught: "A downstream gate disagreed: brand-gate scanned 71 pages when it should have scanned 603. The upstream report was lying and the layered gate caught it.",
      fix: "scripts/check-prerender.mjs reads the real fields AND cross-checks the report against the HTML actually written to disk, because a report is a claim and the files are the evidence. It fails loudly on the exact run that had been called clean.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-01",
      date: "2026-08-19",
      what_was_wrong: "Three public surfaces stated three different item counts at once (llms.txt 819, agent card 890, live API 966). The banks grew under the hardcoded numbers.",
      how_caught: "External live-surface audit; confirmed by direct curl.",
      fix: "llms.txt and the agent card now DEFER to GET /api/gspc as the live source; no public surface hardcodes a count.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-02",
      date: "2026-08-19",
      what_was_wrong: "The public board API payload carried internal specialist identifiers \u2014 an internal specialist-id prefix \u2014 a banned-vocabulary string inside a machine contract, not just a human page. (The prefix itself is redacted here: naming it would re-leak the string this entry records as removed.)",
      how_caught: "K3 lane curl sweep of machine surfaces.",
      fix: "Renamed to council-* public names in /api/gspc; a machine-contract guard now sweeps API payloads for banned strings on every deploy.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-03",
      date: "2026-08-19",
      what_was_wrong: "The single-record verifier initially checked only one content_id envelope; the carder signs a second (signature-included) generation, so valid carder cards could have read as MISMATCH.",
      how_caught: "Testing the verifier against a real carder card before shipping.",
      fix: "The verifier now tries both deterministic envelope generations and names which one matched.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-04",
      date: "2026-08-19",
      what_was_wrong: "Two open-source repos (carder, codabench-gspc) shipped with no LICENSE file, and the board API payload stated no licence \u2014 while the estate claims openness.",
      how_caught: "The carder's own valve-2 benchmark fact-card, run on the estate's own artifacts.",
      fix: "Apache-2.0 added to both repos; CC-BY-4.0 licence field added to the board payload, with the self-catch admitted in the payload note.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-05",
      date: "2026-08-19",
      what_was_wrong: "The did:web trust root at csoai.org intermittently served an orphan key document because two repositories deployed the same Cloudflare Pages project with no owner of record.",
      how_caught: "The did-liveness daemon, then the machine-contract guard's DID split-brain check comparing the authoritative root against the mirror.",
      fix: "One deployer of record (csoai-site-deploy.yml) builds from the source repo's main with a hard gate: the build fails if did.json lacks the canon keys, and the run fails if the live apex doesn't serve them after deploy.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-06",
      date: "2026-08-19",
      what_was_wrong: "An hourly API guard asserted endpoints (/api/tools, /api/mcp) that never existed in the repository's functions tree \u2014 a ghost from an older deployment \u2014 so it failed forever.",
      how_caught: "Reading the failing run rather than trusting the guard's own claim.",
      fix: "Rewritten to assert the endpoints the deployment actually ships (/api/health, /api/leaderboard).",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-07",
      date: "2026-08-19",
      what_was_wrong: "A banned brand token shipped live on /library as a CamelCase concatenation of the token with 'Training', because a word-boundary regex anchored on the bare token missed the concatenation. Two priced strings ($0.005/card, a per-hour range) also shipped, against the no-pricing rule. (The token itself is redacted here for the same reason as C-2026-0819-02.)",
      how_caught: "A full front-end QA sweep.",
      fix: "The brand gate's pattern for that token dropped its trailing word boundary so CamelCase concatenations are caught; a pricing-leak pattern was added so a currency amount bound to a subscription or per-unit cadence is now a hard build-fail.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-08",
      date: "2026-08-19",
      what_was_wrong: "Estate pages described EU AI Act high-risk obligations as in force from 2 August 2026. The Digital Omnibus (Reg (EU) 2026/1744) deferred them to 2 December 2027 (Annex III) and 2 August 2028 (Annex I). Serving the dead date would be our own credibility wound.",
      how_caught: "A commissioned regulation-calendar verification against primary law.",
      fix: "The /api/regulation feed carries the corrected staged timeline with legal bases; page copy is being swept to match.",
      status: "IN_PROGRESS",
    },
    {
      id: "C-2026-0819-09",
      date: "2026-08-19",
      what_was_wrong: "Two internally-named datasets remained publicly visible on Kaggle under a banned naming class.",
      how_caught: "End-user test sweep with anonymous probes.",
      fix: "Flagged for the owner to set private \u2014 the platform gates dataset visibility behind the account login.",
      status: "OPEN",
    },
    {
      id: "C-2026-0819-10",
      date: "2026-08-19",
      what_was_wrong: "The estate's own date-correction fix (C-08) initially ALSO mis-stated the GPAI date \u2014 a follow-on error that moved GPAI duties from 2 Aug 2025 to 2026 while correcting the high-risk date. A correction that introduces a new error is the worst kind.",
      how_caught: "Self-audit of the fix against the EU official page (digital-strategy.ec.europa.eu) \u2014 the estate caught its own owner mid-correction.",
      fix: "GPAI 2 Aug 2025 restored; Article 50 2 Aug 2026 and high-risk 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) stated distinctly. This entry is that admission, appended not edited.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-11",
      date: "2026-08-19",
      what_was_wrong: "mcp.json advertised three server URLs on csoai.org/api/* \u2014 every one returned 404 because the API is served from councilof.ai, and one route (corpus-watch) pointed at a non-existent path.",
      how_caught: "End-user MCP handshake test \u2014 a real JSON-RPC initialize probe against the advertised endpoints.",
      fix: "mcp.json now advertises councilof.ai URLs and the real /api/corpus-watch/status route; the advertised endpoints were verified 200/JSON-RPC-responsive after the fix.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-12",
      date: "2026-08-19",
      what_was_wrong: "A measurement wave was queued with sample=24, below the harness's 30-usable-item threshold \u2014 all 8 jobs returned UNMEASURED (honestly, but wasted a full wave).",
      how_caught: "Reading the signed board's status_note ('no model reached 30 usable items') rather than assuming the bank size was the constraint.",
      fix: "Requeued at sample=30; all 8/8 came back MEASURED and signed. The threshold is now documented in the job-spec contract.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-13",
      date: "2026-08-19",
      what_was_wrong: "Two measure-chain daemons ran simultaneously after a restart race, double-logging jobs; the restart script's pkill pattern matched its own command line and killed its own launch.",
      how_caught: "Duplicate 'daemon start' markers in the log; the self-kill was traced to the unanchored pkill pattern.",
      fix: "Anchored process pattern (^python3 /workspace/measure_chain.py) in the restart script; single-daemon verified after relaunch.",
    },
    {
      id: "C-2026-0820-01",
      date: "2026-08-20",
      what_was_wrong: "Multiple live public surfaces (index.html JSON-LD, GSPCVerify, Insurers, AgentRegistry, Methodology, Agents, ProvBench, measure.html, and the provbench pack) stated measurement cards are 'anchored with OpenTimestamps' / RFC-3161 / 'Bitcoin block 954857, independently verifiable' as a present capability. The only anchor implemented is Ed25519 + SHA-256 hash-chain; verify.ts checks no timestamp proof and no .ots/Rekor artifact exists.",
      how_caught: "Internal honesty audit of anchoring claims vs implementation.",
      fix: "OTS/RFC-3161/Bitcoin claims demoted to roadmap wording across all surfaces; provbench pack corrected; the ML-DSA 'built, not shipped' discipline applied to OpenTimestamps.",
      status: "FIXED",
    },
    {
      id: "C-2026-0822-01",
      date: "2026-08-22",
      what_was_wrong: "The homepage industry grid still said '15-slot instrument' while the scoreboard, API and canon say '14-slot board, 13 measured of 14' (16 GSPC axes, 13 quotable + jail floor per the GSPC ruling). A crawler reading the grid would see 15 slots — the exact internal-count inconsistency the count-gating canon exists to prevent.",
      how_caught: "Text audit of live surfaces against canon (machine-contract style sweep of the homepage and fleet-sweep pages).",
      fix: "Killed both stale 15-slot references in NewHome-v3 (section comment + industry-grid subtitle) to '14-slot / 13 measured of 14'; verified 0 x '15-slot' remains. (PR #284.)",
      status: "FIXED",
    },
  ],
  signature: {
    id: "aa7a8211d3671330e0dcacf1a719125f9cb09dd4ba80272fc1fac617e652f367",
    signer: "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38",
    signature: "dff4ab2c4e1c8d80c9022330343f43145af4673a0a214cf24c9e2964d204f917aa8bdcbf6bc76fec8db0ff828524f057078e087fa53d4281b448bbce44e5ac00",
    sig_input: "sha256(Python json.dumps(canonical LEDGER minus signature fields, sort_keys=True, separators=(',',':')) — ensure_ascii escapes non-ASCII as \\uXXXX)",
    key_source: "did:web:csoai.org (estate signing key d4cb0eaa)",
    note: "SIGNED 2026-08-22 (re-issue: 15th entry — 15-slot canon fix) - verify by recomputing canonical JSON and checking Ed25519 against did.json. Every append re-issues the signature; a stale signature is a published defect, never a silent edit.",
  },
};

// Serve-time staleness guard: recompute content_id of the committed body; if it
// does not match the embedded signature's id, serve with a VISIBLE flag rather
// than silently serving a broken signature. Doctrine: a stale signature is a
// published defect, never a silent edit.
// NOTE: the canonical MUST match the off-chain signer exactly. The estate signs
// with Python json.dumps(body, sort_keys=True, separators=(",",":")) — recursive
// key sort, compact separators, and ensure_ascii=True (every non-ASCII char as
// \uXXXX). (An earlier version used an array-replacer JSON.stringify which emits
// a top-level-only key whitelist and serializes every nested entry as {} — a
// hash no signer could ever reproduce, so the guard flagged VALID ledgers as
// STALE forever. Fix: reproduce the signer's canonical byte-for-byte.)
function canonJson(obj: unknown): string {
  const j = (o: unknown): string => {
    if (Array.isArray(o)) return "[" + o.map(j).join(",") + "]";
    if (o !== null && typeof o === "object") {
      const r: Record<string, unknown> = {};
      for (const k of Object.keys(o as Record<string, unknown>).sort()) r[k] = (o as Record<string, unknown>)[k];
      return "{" + Object.keys(r).map((k) => JSON.stringify(k) + ":" + j(r[k])).join(",") + "}";
    }
    return JSON.stringify(o);
  };
  // ensure_ascii=True: escape every non-ASCII char as \uXXXX (4-digit lowercase hex)
  return j(obj).replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction = async () => {
  const body = { ...LEDGER } as Record<string, unknown>;
  delete body.signature;
  const canonical = canonJson(body);
  const cid = await sha256Hex(canonical);
  const embeddedId = (LEDGER.signature as { id?: string } | undefined)?.id ?? null;
  const signatureState = embeddedId && cid === embeddedId ? "VALID" : "STALE";
  const out = signatureState === "VALID"
    ? LEDGER
    : { ...LEDGER, signature_state: "STALE", note: "Signature is stale because the ledger was appended after signing. Re-issue the signature (gen-reg-feed.mjs) - a stale signature is a published defect, never a silent edit." };
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
