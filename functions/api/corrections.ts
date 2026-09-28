// /api/corrections — the public corrections ledger.
//
// This is a source-maintained machine-readable record: every entry is something the estate
// got wrong, how it was caught (usually by the estate's own instrument), and
// the fix — dated. The source is version-controlled, but this endpoint does not
// provide append-only storage proof. Publishing your own corrections is the
// credibility engine: it is what lets a relying party trust the /api/regulation
// feed and the signed board, because the same body that publishes the number
// also publishes when the number was wrong.
//
// GRAMMAR: an entry here is a FACT about our own history, not a MEASURED figure
// and not a claim about anyone else. Signed artifacts should be superseded rather
// than silently edited; this record itself remains ordinary version-controlled source.
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

// Exported so the corrections FEED derives from this exact object. Two surfaces generating
// their own copy of the ledger would drift, and then the estate would have to reconcile them —
// the same reason /feed.xml is an alias of one handler rather than a second engine.
export const LEDGER = {
  schema: "csoai.corrections/0.1",
  policy: "Public, source-maintained corrections record. Each entry states what was wrong, how it was caught, and the fix. No append-only storage property is claimed.",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  timing_fields: {
    added: "2026-09-26",
    detected_at: "When the error was first detected: ISO-8601 UTC datetime, or an ISO date where the only first-hand record is a day, or UNRECORDED. Backfilled only from first-hand evidence (the entry's own first_observed_at, a dated record or commit that states the finding, a deploy log, a dataset commit). Never inferred from prose, never estimated.",
    detected_window: "Optional. {not_before, not_after, basis}: first-hand bounds on detection where the exact time is not recorded, e.g. the publication of the record the error was in, and the fix commit.",
    detected_by: "internal audit | internal monitor | persona test | external report | self-report | UNRECORDED. The category of the entry's own how_caught or note text; UNRECORDED where the entry does not say.",
    published_at: "When the correction was first public: the dataset commit that published the corrected record, or the deploy that first served the corrected surface. A git commit alone is not publication. UNRECORDED where neither is recorded.",
    timing_evidence: "Where each non-UNRECORDED timing value comes from.",
    time_to_correct: "Not stored. Computed per entry on every request into the unsigned correction_latency block: published_at - detected_at when both are datetimes (exact); an upper bound when detection is known only to a day or a window; UNMEASURED otherwise.",
  },
  corrections: [
    {
      "id": "C-2026-0928-01",
      "date": "2026-09-28",
      "detected_at": "2026-09-28",
      "detected_window": {
        "not_before": "2026-09-28T00:00:00Z",
        "not_after": "2026-09-28T04:36:48Z",
        "basis": "our own detection is recorded only to the day; not after fix commit 1ae2025fd, which records reproducing the defect on master d06d09837"
      },
      "detected_by": "external report",
      "published_at": "UNRECORDED",
      "timing_evidence": [
        "IETF SCITT architecture issue #462, opened 2026-09-10T03:53:43Z, quotes the line return True, f\"VALID (integrity) - kid ... not resolved\" from CSOAI-ORG/a2a-signed-receipts@daaa2306 as the running-code case for a third verification result",
        "councilof-ai commit 1ae2025fd (2026-09-28T04:36:48Z): records the defect reproduced on master d06d09837 with an attacker key, and fixes it; landed in acff54074",
        "published_at is UNRECORDED: the deploy that first serves the corrected verifier and this entry had not happened when the entry was written"
      ],
      "what_was_wrong": "The signed-receipts/v1 reference verifier, interceptor.py, had two faults in verify_receipt(). (1) When it was called without a resolve_did function, it returned True, with a reason reading 'VALID (integrity)' followed by the kid and 'not resolved'. A receipt carries its own public key, so a receipt signed with any key, naming any issuer's kid, came back VALID. Re-checked on 2026-09-28: a receipt signed with a freshly generated key and naming did:web:csoai.org#board-attestation-1 returned True with that reason, and the corrected file returns UNVERIFIABLE_KEY. (2) When a resolver was given but the lookup failed, for example because the DID document could not be fetched, it returned INVALID. So a caller could not tell 'forged' from 'could not check'. The same file was public in three places, and all three copies had the defect: (a) the GitHub repository CSOAI-ORG/a2a-signed-receipts, which IETF SCITT architecture issue #462 cites at commit daaa2306 in a post dated 2026-09-10T03:53:43Z (that repository is not reachable now, so the commit that first introduced the code is not recorded here); (b) the Hugging Face source snapshot csoai/councilof-ai-source, commit 96bf3a07, published 2026-09-25T10:42:26Z (interceptor.py sha256 d908b9e7...); (c) https://councilof.ai/spec/signed-receipts/v1/interceptor.py, the same bytes. The file was added in commit 7d0a7700a (2026-09-27T06:52:22Z) and first served by the deploy of 9e501e01d, completed 2026-09-27T07:32:56Z. Who could have been misled: anyone who ran any of these copies and relied on the boolean from verify_receipt. Without a resolver they would have accepted a forged receipt as the named issuer's. With a failing resolver they would have rejected a genuine one as INVALID. No hosted endpoint ran this code. functions/ contains no import or copy of interceptor.py. POST /api/receipts/verify checks x402 offer and receipt JWS with separate code that requires the kid to resolve in https://csoai.org/.well-known/did.json. Re-checked live on 2026-09-28: a receipt signed with a freshly generated key and naming did:web:csoai.org#attacker-key-1 returned INVALID ('not listed in verificationMethod'), and one naming did:web:csoai.org#board-attestation-1 returned INVALID ('signature does not verify under the resolved key'). POST /api/verify and the MCP verify_card tool check measurement cards with functions/_lib/cardVerify.ts, which does not use this canonicaliser.",
      "how_caught": "IETF SCITT architecture issue #462, opened by an outside participant, quotes our verifier's return line as the case for its second proposed requirement: a profile must not fall back to valid or invalid for the condition a third result covers. An internal note on 2026-09-22 recorded that the issue cites our work, but did not recognise that it describes a defect in our verifier. On 2026-09-28, while building the conformance kit, we reproduced the defect on master d06d09837 with an attacker key. It was fixed the same day.",
      "what_changed": "Fixed in commit 1ae2025fd, landed in acff54074. verify_receipt_result() returns one of VALID, INVALID or UNVERIFIABLE_KEY. No resolver, a resolver that raises, or a resolver that returns nothing gives UNVERIFIABLE_KEY, never VALID. Integrity is checked first, so a tampered receipt is INVALID whether or not its key resolves. verify_receipt() keeps its (bool, str) shape, and the bool is True only for VALID. test_interceptor.py gains 8 checks for this case. The conformance kit has 3 unresolvable-key vectors and 1 tampered-and-unresolvable vector, and the verifier before the fix fails them. The Hugging Face copy was replaced at csoai/councilof-ai-source commit 9021aec0 (interceptor.py sha256 b79ed7fe..., equal to the served file). Revision 96bf3a07 keeps the pre-correction bytes, and SNAPSHOT.json records both. The GitHub copy was not changed because the repository is not reachable. How to re-check: download https://councilof.ai/spec/signed-receipts/v1/conformance/ and run 'node run.mjs reference-results.json --vectors vectors.json' (Node, no dependencies) or 'python3 run.py reference-results.json --vectors vectors.json' (needs only cryptography). To test your own verifier, write its result for each case to a file and pass that file instead. example-fail-results.json holds the results of the verifier before the fix, and both runners report FAIL on it. python3 test_interceptor.py in /spec/signed-receipts/v1/ gives 40 PASS, 0 FAIL.",
      "status": "CORRECTED - reference verifier returns UNVERIFIABLE_KEY, never VALID, for an unresolvable key; served and Hugging Face copies replaced; GitHub copy unchanged (not reachable)",
      "reached_the_public": true,
      "evidence": [
        "https://github.com/ietf-wg-scitt/draft-ietf-scitt-architecture/issues/462",
        "https://councilof.ai/spec/signed-receipts/v1/interceptor.py (sha256 b79ed7fe59229587eecf6b9f31df033374059492d7c1119cd3fad475411d6216 after the fix)",
        "https://councilof.ai/spec/signed-receipts/v1/conformance/ (vectors.json, run.mjs, run.py, reference-results.json, example-fail-results.json)",
        "https://huggingface.co/datasets/csoai/councilof-ai-source/tree/9021aec0c1459b17f5fa90e734917e20fced970a/contributions/a2a-signed-receipts/f80de2731ceb",
        "https://huggingface.co/datasets/csoai/councilof-ai-source/tree/96bf3a07d4f944e9a9ed577e329ef10e20d38dfc/contributions/a2a-signed-receipts/f80de2731ceb (pre-correction bytes, kept)",
        "councilof-ai commits 1ae2025fd and acff54074"
      ]
    },
    {
      "id": "C-2026-0928-02",
      "date": "2026-09-28",
      "detected_at": "2026-09-28",
      "detected_window": {
        "not_before": "2026-09-28T00:00:00Z",
        "not_after": "2026-09-28T04:36:48Z",
        "basis": "recorded only to the day; not after fix commit 1ae2025fd, the first record of the finding"
      },
      "detected_by": "internal audit",
      "published_at": "UNRECORDED",
      "timing_evidence": [
        "councilof-ai commit 1ae2025fd (2026-09-28T04:36:48Z): the first record of the finding and its fix; landed in acff54074",
        "published_at is UNRECORDED: the deploy that first serves the corrected verifier and this entry had not happened when the entry was written"
      ],
      "what_was_wrong": "SPEC.md for signed-receipts/v1 (draft 0.2) says receipts are canonicalised with RFC 8785 (JCS). The reference implementation, interceptor.py, did not follow RFC 8785 in two places. (1) It wrote characters outside the Basic Multilingual Plane, such as emoji, as an escaped surrogate pair, for example \\ud83d\\ude00. RFC 8785, like ECMAScript JSON.stringify, writes the character itself. (2) It wrote floating-point numbers with Python repr() rules, not the ECMAScript Number-to-string rules RFC 8785 requires. An integral-valued float came out with '.0' (2.0 as '2.0', RFC 8785 '2'). Magnitudes from 1e-6 up to 1e-4 came out in exponent form (1e-05 as '1e-5', RFC 8785 '0.00001'). Magnitudes from 1e16 up to 1e21 also came out in exponent form (1e16 as '1e+16', RFC 8785 '10000000000000000'). Python integers were not affected. Re-checked on 2026-09-28 against node JSON.stringify: 9 of 13 probe values differed under the old code, and 0 differ under the corrected code. Effect: a receipt carrying any such character or number canonicalised to different bytes in the reference code than in a conforming RFC 8785 implementation. Its content_id and signature therefore failed across implementations: a receipt issued by the reference code failed in a conforming verifier, and a conforming issuer's receipt failed in the reference verifier. This fault causes wrong rejection. It does not cause false acceptance. The same file was public in three places, and all three copies had the defect: (a) the GitHub repository CSOAI-ORG/a2a-signed-receipts, which IETF SCITT architecture issue #462 cites at commit daaa2306 in a post dated 2026-09-10T03:53:43Z (that repository is not reachable now, so the commit that first introduced the code is not recorded here); (b) the Hugging Face source snapshot csoai/councilof-ai-source, commit 96bf3a07, published 2026-09-25T10:42:26Z (interceptor.py sha256 d908b9e7...); (c) https://councilof.ai/spec/signed-receipts/v1/interceptor.py, the same bytes. The file was added in commit 7d0a7700a (2026-09-27T06:52:22Z) and first served by the deploy of 9e501e01d, completed 2026-09-27T07:32:56Z. Who could have been affected: anyone who issued or verified such receipts with any of these copies, or who compared its bytes with another implementation. No hosted endpoint ran this code. functions/ contains no import or copy of interceptor.py. POST /api/receipts/verify checks x402 offer and receipt JWS with separate code that requires the kid to resolve in https://csoai.org/.well-known/did.json. Re-checked live on 2026-09-28: a receipt signed with a freshly generated key and naming did:web:csoai.org#attacker-key-1 returned INVALID ('not listed in verificationMethod'), and one naming did:web:csoai.org#board-attestation-1 returned INVALID ('signature does not verify under the resolved key'). POST /api/verify and the MCP verify_card tool check measurement cards with functions/_lib/cardVerify.ts, which does not use this canonicaliser.",
      "how_caught": "Found while building the signed-receipts/v1 conformance kit on 2026-09-28. The kit's vectors are checked by a Node runner that uses JSON.stringify and by the Python reference. The corrected number serialiser was then compared with node JSON.stringify over 3,995 fuzzed doubles, with 0 mismatches.",
      "what_changed": "Fixed in commit 1ae2025fd, landed in acff54074. _esc_str writes astral characters as themselves and uses \\uXXXX only for control characters and lone surrogates. _num uses the ECMAScript Number::toString algorithm (RFC 8785 section 3.2.2.3). test_interceptor.py gains 2 RFC 8785 checks and runs the published vectors. Vector valid-jcs-edge covers an astral character. The kit also has two wrong-canonicalisation vectors. SPEC.md is hash-pinned (sha256 f5a7400b1963473718156d14e70df6c640ee12881e6c56dc5ecbfac0e9e43efa) and is not edited. Its draft 0.2 change notes still say astral characters are escaped as surrogate pairs. That sentence is an erratum: the conformance kit page states it, and so does this entry. The Hugging Face copy was replaced at csoai/councilof-ai-source commit 9021aec0, and revision 96bf3a07 keeps the pre-correction bytes. The GitHub copy was not changed because the repository is not reachable. How to re-check: download https://councilof.ai/spec/signed-receipts/v1/conformance/ and run 'node run.mjs reference-results.json --vectors vectors.json' (Node, no dependencies) or 'python3 run.py reference-results.json --vectors vectors.json' (needs only cryptography). To test your own verifier, write its result for each case to a file and pass that file instead. example-fail-results.json holds the results of the verifier before the fix, and both runners report FAIL on it. python3 test_interceptor.py in /spec/signed-receipts/v1/ gives 40 PASS, 0 FAIL.",
      "status": "CORRECTED - reference canonicaliser matches RFC 8785 for astral characters and numbers; SPEC.md draft 0.2 change note on surrogate pairs is an erratum, kept byte for byte",
      "reached_the_public": true,
      "evidence": [
        "https://councilof.ai/spec/signed-receipts/v1/interceptor.py (_esc_str, _num, _es_float)",
        "https://councilof.ai/spec/signed-receipts/v1/SPEC.md (draft 0.2, sha256 f5a7400b..., unchanged; erratum in its change notes)",
        "https://councilof.ai/spec/signed-receipts/v1/conformance/ (erratum note; vectors valid-jcs-edge and the wrong-canonicalisation cases)",
        "https://huggingface.co/datasets/csoai/councilof-ai-source/tree/9021aec0c1459b17f5fa90e734917e20fced970a/contributions/a2a-signed-receipts/f80de2731ceb",
        "councilof-ai commits 1ae2025fd and acff54074"
      ]
    },
    {
      "id": "C-2026-0927-05",
      "date": "2026-09-27",
      "detected_at": "2026-09-27",
      "detected_window": {
        "not_before": "2026-09-27T00:00:00Z",
        "not_after": "2026-09-27T03:35:18Z",
        "basis": "the csoai.org card review is recorded only to the day; not after the first recorded failing run of scripts/verify_agent_card_jws.py against the csoai.org card (03:35:18Z, rc=1 INVALID)"
      },
      "detected_by": "internal audit",
      "published_at": "2026-09-27T03:52:54Z",
      "timing_evidence": [
        "csoai.org card review, 2026-09-27 (day precision)",
        "2026-09-27T03:35:18Z: scripts/verify_agent_card_jws.py returned rc=1 INVALID ('signature does not verify') for csoai.org /.well-known/agent-card.json and /.well-known/agent.json, and rc=2 UNSIGNED for the two councilof.ai files",
        "2026-09-27T03:52:54Z: csoai-site production deploy log (deployment caf5d012.csoai-site.pages.dev) - the signed card and the new key were served on csoai.org first, so no signed card is served before its key resolves",
        "councilof-ai commit 8325539dd (2026-09-27T04:37:38Z): did.json gains did:web:csoai.org#card-attestation-2; the v1.1.0 card is signed under it",
        "2026-09-27T06:05:58Z: the same verifier returned rc=0 VALID for both csoai.org files",
        "2026-09-27T06:55:59Z: councilof.ai deploy of ab6df4590 (contains 8325539dd) completed; the signed card is served on councilof.ai from then",
        "2026-09-27T09:42:24Z: re-run for this entry, rc=0 VALID for all four files under --require-kid did:web:csoai.org#card-attestation-2, tamper control INVALID"
      ],
      "what_was_wrong": "Until 27 Sep, https://csoai.org/.well-known/agent-card.json and /.well-known/agent.json served an older A2A agent card, 'Council of AI Measurement Agent' version 0.1.0 with 2 skills, that presented itself as signed. identity.signedWith named did:web:csoai.org#site-release-1, and signatures[0] carried a JWS protected header with alg EdDSA and that kid. A2A specification 8.4.3 says that field is a JWS. Checked that way, it failed against the site-release-1 key in csoai.org's own /.well-known/did.json: scripts/verify_agent_card_jws.py returned rc=1 INVALID for both files. The bytes had been produced under the card's own declared rule, Ed25519 over the hex SHA-256 of its sorted-key JSON, so an A2A client got a signature that failed. At the same time councilof.ai served the current card, version 1.1.0 with 10 skills, with no signature at all (rc=2 UNSIGNED).",
      "how_caught": "The csoai.org card review on 2026-09-27 ran the repository's independent verifier, scripts/verify_agent_card_jws.py, against the cards served at both origins. The verifier is written without the signer's code. A re-run at 03:35:18Z gave the same results. The failing signature was then checked against every key in did.json under the card's self-declared rule. That showed the key matched and the signing rule did not.",
      "what_changed": "Resolved by re-signing under a new card key. The private half of did:web:csoai.org#card-attestation-1 is held on no automation host, so the owner approved a key rotation on 27 Sep. Commit 8325539dd adds one verification method, did:web:csoai.org#card-attestation-2, to did.json with its assertionMethod entry. It signs the version 1.1.0 card (10 skills) under that key as an A2A 8.4 JWS. The key went live on csoai.org before any card signed under it was served. #card-attestation-1 stays published and is not revoked, because the 335 cards in the signed card index verify under it. The board keys are unchanged. Live result at 2026-09-27T09:42:24Z: scripts/verify_agent_card_jws.py --require-kid did:web:csoai.org#card-attestation-2 returns rc=0 VALID for https://csoai.org/.well-known/agent-card.json, https://csoai.org/.well-known/agent.json, https://councilof.ai/.well-known/agent-card.json and https://councilof.ai/.well-known/agent.json. All four serve the same bytes, sha256 fd9d2e84d3a03142123384564ebc0edc4c0e4fb30c79d12c49f995b04d3abfe7, and a one-byte tamper control reads INVALID. csoai.org no longer serves the version 0.1.0 card. No page, llms.txt or llms-full.txt stated that the 0.1.0 card's signature verified, so there was no wording to withdraw. This entry records the period in which it did not verify.",
      "status": "CORRECTED - card re-signed under did:web:csoai.org#card-attestation-2; verifies VALID on both origins",
      "reached_the_public": true,
      "evidence": [
        "https://csoai.org/.well-known/agent-card.json",
        "https://councilof.ai/.well-known/agent-card.json",
        "https://csoai.org/.well-known/did.json (#card-attestation-2)",
        "scripts/verify_agent_card_jws.py (exit 0 VALID, 1 INVALID, 2 UNSIGNED)",
        "public/interop/agent-card-jws-input.json (state SIGNED)",
        "councilof-ai commit 8325539dd"
      ]
    },
    {
      "id": "C-2026-0927-04",
      "date": "2026-09-27",
      "detected_at": "UNRECORDED",
      "detected_window": {
        "not_before": "2026-08-19T09:24:39Z",
        "not_after": "2026-08-26T19:06:55Z",
        "basis": "not before the cards were signed (body.created 2026-08-19T09:24:39Z on all 335); not after commit 7413ca200, the first commit that says a card's public_framing is frozen at signing and must not be read as the board"
      },
      "detected_by": "internal audit",
      "published_at": "UNRECORDED",
      "timing_evidence": [
        "public/signed/cards/*.json body.created 2026-08-19T09:24:39.152331Z to 2026-08-19T09:24:39.174226Z for the 335 indexed cards",
        "councilof-ai commit 7413ca200 (2026-08-26T19:06:55Z): the shared card verifier prints a framing_frozen line for every card that carries public_framing",
        "councilof-ai commit e985a4a2b (2026-08-28T04:30:37Z): the producer tools/card_emitter.py switched PUBLIC_FRAMING to 'counts live on GET /api/gspc'; the commit message records that the signed originals keep the old string",
        "P1 truth review, 2026-09-27: re-read all 335 bodies and found no ledger entry for the field (day precision)",
        "published_at is UNRECORDED: this entry is the first ledger statement, and the deploy that first serves it was not recorded when it was written"
      ],
      "what_was_wrong": "All 335 signed measurement cards in the signed card index (public/signed/card_index.json, n_cards 335, bodies under public/signed/cards/) carry the field body.public_framing = '13 measured of 14 quotable'. That was true of the board when the cards were signed on 2026-08-19. It is stale now. GET /api/gspc read at 2026-09-27T09:42:24Z returns totals.axes 23, totals.measured_axes 23 and totals.unmeasured_axes 0. The field states the board, not the card it sits in, and these cards have been public since August, so a reader of any one card could take '13 measured of 14' as the current board. Scope is this field in the signed card index only. The public-root leaves (root.json) and the card wrapper files are separate corpora and are not counted here.",
      "how_caught": "The P1 truth review on 2026-09-27 read public_framing in each of the 335 bodies in the signed card index and recomputed each card id from its body (335 of 335 match). The same stale string is in every one, and this ledger had no entry for it. The staleness was known internally before that. Commit 7413ca200 (26 Aug) made the card verifier say the string is frozen, and commit e985a4a2b (28 Aug) changed the producer and noted the signed originals, but neither published a correction here. This entry closes that gap.",
      "what_changed": "No signed card changes. Since commit e985a4a2b (2026-08-28T04:30:37Z) the card producer, tools/card_emitter.py, writes public_framing = 'counts live on GET /api/gspc', so no card it signs carries a typed board count. harness/mine/cards/MANIFEST.json was updated in the same commit. The 335 signed originals are kept byte for byte, because they are historical signed records and re-signing would break references to them. A card's id is the sha256 of its body, so re-signing would give every card a new id. Ids from this set are referenced by five OTS-anchored files: public/signed/gspc-board.2026-09-25.signed.json, public/interop/jail-index.json, public/interop/canonical-23-axis-index-v0.1.json, public/interop/xrpl-attest-run.json and public/interop/three-loops/measurement-x402_challenge_check-x402_payai_cdp-20260917T052406Z.json. Their proofs would then name ids that no longer exist. There is also no signing path today for did:web:csoai.org#card-attestation-1, the key that signed these cards. How to read it: public_framing in these cards describes the board as of 2026-08-19 and nothing more. The live counts are totals.axes, totals.measured_axes and totals.unmeasured_axes at GET https://councilof.ai/api/gspc. The public card verifier already says this under its framing_frozen check (functions/_lib/cardVerify.ts).",
      "status": "CORRECTED AT PRODUCER - signed originals kept byte for byte; read live counts from /api/gspc",
      "reached_the_public": true,
      "evidence": [
        "public/signed/card_index.json (n_cards 335; every indexed body carries public_framing '13 measured of 14 quotable')",
        "tools/card_emitter.py PUBLIC_FRAMING (commit e985a4a2b)",
        "functions/_lib/cardVerify.ts framing_frozen check (commit 7413ca200)",
        "https://councilof.ai/api/gspc (totals.axes, totals.measured_axes, totals.unmeasured_axes)"
      ]
    },
    {
      "id": "C-2026-0927-03",
      "date": "2026-09-27",
      "detected_at": "2026-09-27",
      "detected_by": "internal audit",
      "published_at": "UNRECORDED",
      "timing_evidence": [
        "separation re-run, 2026-09-27: the fixed 2026-08-13 test re-run on the frozen boards-v2-2026-08-12 per-item rows, own models excluded, with a label-shuffle control (day precision)",
        "Hugging Face dataset csoai/gspc-peritem-rows-2026-08-12 commit 294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361 (2026-09-27): the rows' publication",
        "public/interop/gspc-peritem-rows-2026-08-12.signed.json signed_utc 2026-09-27T04:55:00Z (POST /api/board-sign, pod caller token)",
        "published_at is UNRECORDED: the deploy that first serves the corrected board was not recorded when this entry was written"
      ],
      "what_was_wrong": "Two things on GET /api/gspc. (1) Six model-comparison axes (governance, continuity, provenance, conformance, openness, care) carried separation UNTESTED and no public leader, with the note that the external re-ranking was not carried. The 15,580 per-item rows that decide it existed, frozen since 2026-08-13, but were unpublished: the signed 2026-08-13 freeze manifests record peritem_sha256: null, and the board's own rule treats unpublished rows as grounds for no determination. The determination was available and not made. (2) The safety axis named gemma3:12b (base model) as its leader, and the board source listed safety as carded for that leader, under a public promise that every named leader links to the Ed25519 card behind it. The safety axis carries signed cards, but none is a gemma3:12b card: the axis is carded, its leader is not.",
      "how_caught": "A separation analysis on 2026-09-27 re-ran the fixed test (exact McNemar on discordant items, leader vs the best base model, p<0.05 to separate) on the frozen rows with our own models removed. Every axis came out TIE. A shuffled-label control came out SEPARATED in 0 to 4.4% of 1,000 shuffles per axis, within the test's 5%. The same analysis looked up the safety leader's own card in /signed/card_index.json and found none.",
      "what_changed": "The rows are published, owner-approved on 27 Sep 2026 ('publish rows and ties'), byte-identical at https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12 (CC-BY-4.0, commit 294e4cf9). They were scanned before upload for credentials, canary markers and items outside the public banks (scripts/policy/check_no_protected.py: 0 hits), then re-downloaded anonymously and re-hashed (13 of 13 files match). Their manifest hash, peritem_sha256 0d8dacfbe7384a5d2f6a83e7455482ab75f935366bbb6e18da61cfdac8890dec (the sha256 of the dataset's SHA256SUMS), is now in /api/gspc (measured_on.peritem_sha256 and peritem_rows) and in /interop/gspc-peritem-rows-2026-08-12.json, signed by did:web:csoai.org#board-attestation-1. The 2026-08-13 freeze manifests are not edited. The board producer scripts/gspc_separation_from_rows.py now computes separation from the published rows with the fixed test. Separation changed from UNTESTED to TIE on governance, continuity, provenance, conformance, openness and care. Each axis states: 'No model separated from the next best on this axis (exact McNemar, p>=0.05, n=...)', with the leader and next best, their k/n and Wilson intervals, and p. Safety stays TIE, now computed from the same rows. The board reads 0 SEPARATED, 8 TIE, 6 UNTESTED, up from 0, 2, 12. The own-model exclusion is kept: our own specialists are removed before ranking. cross-reality, detector-interop, art5-safeguard, machinery-conformity and affect tie on the rows, but these axes have no signed card, so they stay UNTESTED and say so. swarm stays UNTESTED because its published rows are the retired 3-prompt bank. The missing card is disclosed on every leader read from the rows, not only safety's: 'leader shown from per-item rows; no signed per-model card yet'. On governance, provenance and care, the card on record for that model records a different measurement and is named as such. No card is fabricated.",
      "status": "CORRECTED - rows published and bound by hash; six axes UNTESTED to TIE from the fixed test; per-model cards for the row leaders not yet issued",
      "reached_the_public": true,
      "evidence": [
        "https://huggingface.co/datasets/csoai/gspc-peritem-rows-2026-08-12 (commit 294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361; SHA256SUMS, MANIFEST.json, separation_test.py, SEPARATION_RESULT.json)",
        "https://councilof.ai/interop/gspc-peritem-rows-2026-08-12.json and .signed.json",
        "https://councilof.ai/api/gspc (measured_on.peritem_sha256, peritem_rows, axes[].separation_evidence, axes[].leader_card_state)",
        "scripts/gspc_separation_from_rows.py; functions/api/gspc.rows-separation.test.ts"
      ]
    },
    {
      "id": "C-2026-0926-06",
      "date": "2026-09-26",
      "detected_at": "2026-09-26",
      "detected_window": {
        "not_before": "2026-09-26T06:45:47Z",
        "not_after": "2026-09-26T15:40:23Z",
        "basis": "not before the daily record was published (dataset commit d58a0a7b); not after the first fix commit d6b88557a"
      },
      "detected_by": "internal audit",
      "published_at": "UNRECORDED",
      "timing_evidence": [
        "https://huggingface.co/datasets/csoai/cross-ledger-supply/commit/d58a0a7bc40c (record published 2026-09-26T06:45:47Z)",
        "councilof-ai commit d6b88557a (first fix commit, committed 2026-09-26T15:40:23Z)",
        "published_at is UNRECORDED: the corrected record (v2) is signed and staged for csoai/cross-ledger-supply but is not yet published there"
      ],
      "what_was_wrong": "The cross-ledger daily record for 2026-09-26 (csoai/cross-ledger-supply, xl-daily/2026-09-26/xl-daily-2026-09-26.json, sha256 b02851fc...) graded three Tether deployments INCONSISTENT with the issuer's own list: EURT on Ethereum, CNHT on Ethereum and CNHt on Tron, whose totalSupply() read 50,000,050, 25,000,000 and 20,000,000. The only issuer statement was that tether.to/en/supported-protocols/ lists them under a 'Deprecated Asset Protocols:' heading. That heading states no supply figure, so there were never two statements that differ. The record also called totalSupply() 'issued supply'. In Tether's own terms totalSupply() is 'total authorized', which includes tokens the issuer holds as not issued.",
      "how_caught": "A pre-send review of the draft issuer notices built from this record re-checked each INCONSISTENT row live before queueing it. The review re-read the issuer page, the three ledgers and the token holders. It found that 'Deprecated' states no supply figure. It also found that most of each total sits at an issuer-held address: 0x5754...b949 holds 91.7% of the EURT and 78.0% of the Ethereum CNHT, and that address's MXNT balance equals Tether's own published not-issued figure. The candidate notice was dropped and nothing was sent.",
      "what_changed": "Fixed at the producer, scripts/readers/cross_ledger_xl.py (commit d6b88557a). A deployment read under a deprecated heading is now NOT_A_SUPPLY_CLAIM: the item is recorded and compared with nothing. Only a supply figure the issuer's page itself states can make INCONSISTENT. Tests: DeprecatedLabelIsNotASupplyClaim (7) and RederiveChangesNoRead (2) in scripts/readers/test_cross_ledger_xl.py. Three of them are controls, and they show that a contradicted stated figure and a listed address with no contract still yield INCONSISTENT. The record, its institutional-links file, the reader's not_evidence_of line, three registry strings and the dataset card now say totalSupply() (or the ledger's equivalent) where they said issued supply. The producer re-derived 2026-09-26 as version v2 (xl-daily/2026-09-26/v2/, record sha256 6acf5f9e...) from the same reads. No ledger, issuer page or value source was re-read, and all 113 deployment rows, heights and evidence kinds are unchanged. The three Tether rows change from INCONSISTENT to NOT_A_SUPPLY_CLAIM. USDT's parity state changes from INCONSISTENT to UNCHECKABLE, because some of its listed deployments are not read. Inconsistent findings drop from 4 to 1; the USD1 row on Tempo stands. Each asset record otherwise differs only in wording and a rederivation block, and each remaining difference is a new path, a file pin or a producer or version field. The v1 record stays published byte for byte with its signature and proof. v2 is signed and OTS-stamped (pending) and staged for the dataset, but not yet published there. This says nothing about Tether's reserves, solvency or redemptions.",
      "status": "CORRECTED AT PRODUCER - v2 signed and staged; dataset publication pending owner approval; v1 kept byte for byte",
      "reached_the_public": true,
      "evidence": [
        "https://huggingface.co/datasets/csoai/cross-ledger-supply/blob/d58a0a7bc40c/xl-daily/2026-09-26/xl-daily-2026-09-26.json",
        "scripts/readers/cross_ledger_xl.py (parity_for, rederive; commit d6b88557a)",
        "scripts/readers/test_cross_ledger_xl.py (DeprecatedLabelIsNotASupplyClaim, RederiveChangesNoRead)"
      ]
    },
    {
      "id": "C-2026-0926-05",
      "date": "2026-09-26",
      "detected_at": "2026-09-26",
      "detected_window": {
        "not_before": "2026-09-26T07:05:33Z",
        "not_after": "2026-09-26T07:33:41Z",
        "basis": "not before record 0.2 was published; not after record 0.2.1 correction.corrected_utc"
      },
      "detected_by": "UNRECORDED",
      "published_at": "2026-09-26T07:34:07Z",
      "timing_evidence": [
        "https://huggingface.co/datasets/csoai/mcp-remote-census/commit/399d4f4bf373 (record 0.2 published 2026-09-26T07:05:33Z)",
        "https://huggingface.co/datasets/csoai/mcp-remote-census/commit/3702f085a463 (record 0.2.1 published 2026-09-26T07:34:07Z)",
        "record.v0.2.1.json correction.corrected_utc = 2026-09-26T07:33:41Z"
      ],
      "what_was_wrong": "The remote MCP endpoint census record 0.2 (csoai/mcp-remote-census, 2026-09-26) published read_state EXHAUSTED while the 2026-09-26 probe contacted 10,039 of the 10,983 endpoints planned for it; 1,070 of 22,196 population endpoints were NOT_ATTEMPTED in all. 0.2 had redefined read_state to mean 'every endpoint has one row', but the same field meant 'every endpoint attempted' in 0.1 and 0.1.1 and in the probe's own summary (PARTIAL), and the signed 0.2 payload carries the bare word without the redefinition. Read beside 0.1.1 it said the read had become complete; it had not.",
      "how_caught": "Not recorded. Record 0.2.1 states the defect and when it was corrected, not who found it; detection is bounded only by the two published times in detected_window.",
      "what_changed": "Record 0.2.1 supersedes 0.2, which stays published byte for byte with its signature and proof. read_state is PARTIAL: 21,126 of 22,196 endpoints have an observed state and 1,070 are NOT_ATTEMPTED with their reasons. The fact 0.2 called EXHAUSTED is published under its own name, population_accounting.every_endpoint_exactly_one_row = true. Scope is the label only: no measurement was re-run and every count, state and row is identical to 0.2. The catalogue frame reads remain EXHAUSTED.",
      "status": "CORRECTED - superseded by record 0.2.1; 0.2 kept byte for byte",
      "reached_the_public": true,
      "evidence": [
        "https://huggingface.co/datasets/csoai/mcp-remote-census/blob/3702f085a463/record.v0.2.1.json",
        "https://huggingface.co/datasets/csoai/mcp-remote-census/blob/3702f085a463/record.v0.2.1.signed.json"
      ]
    },
    {
      "id": "C-2026-0926-04",
      "date": "2026-09-26",
      "detected_at": "UNRECORDED",
      "detected_window": {
        "not_before": "2026-09-25T08:23:16Z",
        "not_after": "2026-09-26T03:41:39Z",
        "basis": "not before record 0.1 was published; not after the first fix commit 96959268d"
      },
      "detected_by": "UNRECORDED",
      "published_at": "2026-09-26T04:07:19Z",
      "timing_evidence": [
        "https://huggingface.co/datasets/csoai/a2a-card-census/commit/c6331de14886 (record 0.1 published 2026-09-25T08:23:16Z)",
        "councilof-ai commit 96959268d (first fix commit, committed 2026-09-26T03:41:39Z)",
        "https://huggingface.co/datasets/csoai/a2a-card-census/commit/4b6789fa20cf (record 0.1.1 published 2026-09-26T04:07:19Z)"
      ],
      "what_was_wrong": "The A2A Agent Card census record 0.1 (csoai/a2a-card-census, 2026-09-25) verified every signed card over JCS(card as served, minus signatures). A2A spec 8.4.3 step 3 says to remove properties with default values before verifying, and 0.1 did not, so cards declaring A2A 1.x were judged against the wrong payload. Of 33 signed cards, 0.1 published 18 VERIFIED and 3 FAILED; judged against the version each card declares, 13 verify and 8 fail (6 VERIFIED -> FAILED, 1 FAILED -> VERIFIED).",
      "how_caught": "Not recorded. Record 0.1.1 states the defect and the fix commits, not who found it or when; detection is bounded by detected_window.",
      "what_changed": "Record 0.1.1 supersedes 0.1, which stays published byte for byte. Each card is judged against the A2A version it declares: 1.x cards under 8.4.3 with default removal, 0.x cards over the served bytes, with a note on the three 0.x cards whose verdict would differ under 1.x rules. Producer scripts/census/a2a-card-probe.py (commits 96959268d and 33d0dfa64); tests in scripts/census/test_a2a_card_probe.py class SpecDefaultRemoval, including the spec's own 8.4.1 example and a must-fail control without step 3.",
      "status": "CORRECTED - superseded by record 0.1.1; 0.1 kept byte for byte",
      "reached_the_public": true,
      "evidence": [
        "https://huggingface.co/datasets/csoai/a2a-card-census/blob/4b6789fa20cf/record.v0.1.1.json",
        "public/interop/a2a-card-census-2026-09-25/correction.v0.1.1.evidence.json"
      ]
    },
    {
      "id": "C-2026-0926-03",
      "date": "2026-09-26",
      "detected_at": "2026-09-26",
      "detected_by": "persona test",
      "published_at": "2026-09-26T07:34:57Z",
      "timing_evidence": [
        "record.v0.1.2.json correction.trigger: 'a maintainer-persona audit on 26 Sep 2026 (before any notice was sent)' - day precision",
        "https://huggingface.co/datasets/csoai/mcp-contract-parity/commit/0bfa689638c7 (record 0.1.2 published 2026-09-26T07:34:57Z)"
      ],
      "what_was_wrong": "MCP contract parity record 0.1.1 (itself a correction, C-2026-0926-02) still applied three rules that misread services: an asymmetric AUTH scope rule; a declared tool list compared exactly with the credential-free live list when auth is declared required but no public list is named; and surfaces that never answered (251 rows, 41 of them behind an HTTP 429 stop) counted as a service's silence, under a collection run labelled EXHAUSTED.",
      "how_caught": "A maintainer-persona audit on 2026-09-26, before any notice was sent to a listed service, re-read candidate rows as their maintainer would and found the three rules; each was reproduced from the stored 2026-09-25 bytes (correction.v0.1.2.evidence.json).",
      "what_changed": "Record 0.1.2 supersedes 0.1.1; 0.1 and 0.1.1 stay published byte for byte. 176 rows and 430 dimension verdicts changed (7 SUBSET_UNDER_AUTH, 5 symmetric AUTH scope, 418 SURFACE_UNREAD); endpoints with any INCONSISTENT dimension 2,768 -> 2,764. The 0.1 and 0.1.1 producers re-run over the same inputs reproduce their published rows byte for byte, so every difference is the producer change. The record names fix commit e087664dd (instrument 0.1.2, tests class Correction012 with four must-fail controls); that commit is not on the councilof-ai master this entry was written against, whose producer is still 0.1.1.",
      "status": "CORRECTED - superseded by record 0.1.2; earlier records kept byte for byte; 0.1.2 producer not yet on master",
      "reached_the_public": true,
      "evidence": [
        "https://huggingface.co/datasets/csoai/mcp-contract-parity/blob/0bfa689638c7/record.v0.1.2.json",
        "https://huggingface.co/datasets/csoai/mcp-contract-parity/blob/0bfa689638c7/correction.v0.1.2.evidence.json"
      ]
    },
    {
      "id": "C-2026-0926-02",
      "date": "2026-09-26",
      "detected_at": "2026-09-26",
      "detected_window": {
        "not_after": "2026-09-26T02:18:23Z",
        "basis": "not after the fix commit 4037f6bb2"
      },
      "detected_by": "internal audit",
      "published_at": "2026-09-26T02:22:06Z",
      "timing_evidence": [
        "record.v0.1.1.json correction.trigger: 'the 26 Sep 2026 notice lane re-checked candidates live before any contact' - day precision",
        "councilof-ai commit 4037f6bb2 (fix, committed 2026-09-26T02:18:23Z)",
        "https://huggingface.co/datasets/csoai/mcp-contract-parity/commit/0f4c4bae9e5f (record 0.1.1 published 2026-09-26T02:22:06Z)"
      ],
      "what_was_wrong": "MCP contract parity record 0.1 (csoai/mcp-contract-parity, read 2026-09-25) applied four rules that misread services. D1: a declared tool list was compared exactly with the live credential-free list even where the service named a public subset. D2a/D2b: an origin's document was credited to an endpoint it did not describe, and facts were read from nested blocks describing other endpoints. D3: a registry header isRequired false and a card's authentication.required true were paired as a contradiction though they state different scopes. D4: a bare declared tool count was compared with a live list holding a dispatcher. 22 rows (26 dimension verdicts) changed; endpoints with any INCONSISTENT dimension 2,778 -> 2,768.",
      "how_caught": "The notice lane re-checked candidate rows live on 2026-09-26 before any contact and found that three services' 0.1 rows misread them and two others held reasonable different meanings; all five were INCONSISTENT in 0.1. Reproduced from the stored 2026-09-25 bytes, each document's sha256 unchanged on the re-read (correction.v0.1.1.evidence.json).",
      "what_changed": "Record 0.1.1 supersedes 0.1, which stays published byte for byte. Producer scripts/census/contract-parity.py commit 4037f6bb2 (instrument 0.1.1); tests in scripts/census/test_contract_parity.py class Correction011, one fixture per reported case and five must-fail controls. The 0.1 producer re-run over the same inputs reproduces all 5,828 published rows byte-identically. docs/measurement/MCP-CONTRACT-PARITY-2026-09-25.md carries a Correction 0.1.1 section. Superseded in turn by C-2026-0926-03.",
      "status": "CORRECTED - superseded by record 0.1.1 (and then 0.1.2, C-2026-0926-03); 0.1 kept byte for byte",
      "reached_the_public": true,
      "evidence": [
        "https://huggingface.co/datasets/csoai/mcp-contract-parity/blob/0f4c4bae9e5f/record.v0.1.1.json",
        "https://huggingface.co/datasets/csoai/mcp-contract-parity/blob/0f4c4bae9e5f/correction.v0.1.1.evidence.json",
        "docs/measurement/MCP-CONTRACT-PARITY-2026-09-25.md"
      ]
    },
    {
      id: "C-2026-0926-01",
      detected_at: "2026-09-26T08:52:00Z",
      detected_by: "persona test",
      published_at: "2026-09-26T10:08:40Z",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written (2026-09-26T08:52:00Z)", "published: the deploy of master 6c2967f80, which carries this entry (commit 4c923f777), completed 2026-09-26T10:08:40Z as Pages deployment 1dfbd065"],
      date: "2026-09-26",
      first_observed_at: "2026-09-26T08:52:00Z",
      supersedes_text: { id: "C-2026-0925-01", field: "what_was_wrong", original_sha256: "14aa9778984fdc4b1b9b972060440a6cc98a9bd948b3fef916428973ddfb3748" },
      what_was_wrong:
        "Entry C-2026-0925-01, as signed on 2026-09-25 (ledger content_id 218e3585f039eb6ccb1251a569d6e1e5ed7417e6e2dc24f5d3115050614acd14, 67 entries), named an internal host by its literal hostname in what_was_wrong. That breaks this ledger's own redaction rule: a machine surface describes an internal identifier and never reproduces it. The /corrections page renders this field verbatim, so the hostname was visible public copy.",
      how_caught:
        "Staging persona test of the 2026-09-26 integration build (Playwright over the rendered page, all three viewports), scanning visible text for internal identifiers. The build-time brand gate could not see it: /corrections is rendered in the browser from GET /api/corrections, and the gate scanned only prerendered HTML.",
      what_changed:
        "The hostname in C-2026-0925-01 what_was_wrong is replaced by a description (the estate's always-on host); nothing else in that entry changed, and it now names this entry in text_superseded_by. The original field is not reprinted, per the redaction rule; its sha256 is recorded above, and the whole ledger as signed on 2026-09-25 remains in version control (functions/api/corrections.ts at commit 522a1dc7c) where it verifies against that signature. functions/api/corrections.served-text.test.ts now scans every string GET /api/corrections serves for the brand gate's internal-identifier rules, so client-rendered ledger text cannot bypass the gate again. Dated quotations of old prices and retracted labels inside correction records are left as written: they document what was wrong, not current offers. The ledger signature reads STALE until re-issued over these bytes with scripts/sign-corrections-ledger.mjs.",
      status: "CORRECTED — hostname abstracted; signature re-issue pending",
      reached_the_public: true,
      evidence: [
        "functions/api/corrections.served-text.test.ts",
        "scripts/brand-gate.mjs"
      ],
    },
    {
      id: "C-2026-0925-01",
      detected_at: "2026-09-25T12:11:43Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-25",
      text_superseded_by: "C-2026-0926-01",
      first_observed_at: "2026-09-25T12:11:43Z",
      what_was_wrong:
        "Served text described the board signing key's custody as separated when it is not. /api/corrections (C-2026-0902-09 and C-2026-0902-08), llms-full.txt, /.well-known/did.json (_gspcBoardKeyNote), /interop/gspc-board-freeze-pointer.json (freeze.custody) and the custody disclosure page called the 2026-09-02 freeze key #gspc-board-22axis-2026 '3-party MPC' custody, and the Council OS sign pane said 'KEY is 2-of-3'. Read on the estate's always-on host on 2026-09-25: all three additive shares of that key are files in ONE directory on ONE host, used by one process. That is one failure domain. The 2-of-3 split was never performed, and no key the estate uses is held in separated custody.",
      why_it_was_wrong:
        "'Multi-party' describes the signing protocol, not where the shares live. The ceremony runbook already said 'current 3-of-3 = three shares on ONE machine = single failure domain', but the served wording was written from the protocol's name and never re-read against the host.",
      what_changed:
        "Corrected at each producer, not in generated output: functions/api/corrections.ts (this entry, plus a bracketed custody note appended to the two older entries, whose text is otherwise unchanged), scripts/llms/llms-full.txt.tmpl (then regenerated), public/.well-known/did.json (_gspcBoardKeyNote), public/interop/gspc-board-freeze-pointer.json (freeze.custody, with the signed-bytes wording kept under custody_as_claimed_in_signed_bytes), client/src/pages/CustodyDisclosure.tsx and client/src/components/os/OsSignGate.tsx. The truth, stated once: the 2026-09-02 freeze key had all three shares on one host (split never performed); the current board freeze (public/signed/gspc-board.2026-09-25.signed.json) is signed by one key, did:web:csoai.org#board-attestation-1, held as a Cloudflare Pages secret; a real 2-of-3 split is planned for the owner's physical root ceremony and has not happened. The signed bytes of the 2026-09-02 freeze are not edited; /signed/gspc-board.status.json already records CUSTODY_SEPARATION_OVERCLAIM against them. scripts/custody-wording-guard.mjs now fails the build if '3-party', 'three-party', '2-of-3' or '3-of-3' custody wording appears on a served or producing surface without correction context, unless council-os/custody-ceremonies.json records a performed split.",
      status: "CORRECTED — custody stated as single key (current) and one failure domain (2026-09-02 freeze); the 2-of-3 split remains PLANNED, not performed",
      reached_the_public: true,
      evidence: [
        "https://councilof.ai/signed/gspc-board.status.json",
        "https://councilof.ai/signed/gspc-board.2026-09-25.signed.json",
        "docs/corrections/2026-09-25-custody-wording.md",
        "docs/corrections/2026-09-25-board-snapshot-refreeze.md",
        "council-os/custody-ceremonies.json"
      ],
      note: "Owner ruling 2026-09-25 ('both'): correct the wording now, and perform the real 2-of-3 split (planned, not yet performed) at the physical Layer 0 root ceremony. When that ceremony is performed and recorded, a new dated entry supersedes this one; this entry is not edited.",
    },
    {
      id: "C-2026-0924-03",
      detected_at: "2026-09-24T17:09:33Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-24",
      first_observed_at: "2026-09-24T17:09:33Z",
      what_was_wrong: "The 14 signed cards from the 16:10 UTC hourly local-model run were served from /interop/mill-cards-signed/ even though their exact intake receipts remained VERIFIED_QUARANTINE with authority.admitted=false. Thirteen wrappers said quotable=true; the safety wrapper was already UNMEASURED/quotable=false. A valid byte signature and a public URL did not establish canonical admission.",
      why_it_was_wrong: "The hourly lander accepted rc=0 and merged signed-card files to the public master without checking admission authority. The signer checked evidence integrity but the RunPod path did not require a separate admission transition. The GSPC fleet board did not consume this cohort.",
      what_changed: "The original signed bytes remain available for audit. Fourteen exact card IDs and SHA-256 digests are appended to public/interop/mill-cards-signed/WITHDRAWN.jsonl, and public/corrections/mill16-unadmitted-2026-09-24.json provides a machine-readable reader notice. The hourly lander source now contains a fail-closed admission gate; installation and next-land readback must be verified separately before claiming operational prevention. This correction does not grant admission or assert Bitcoin anchoring.",
      status: "WITHDRAWN FROM QUOTABLE USE; signed bytes preserved; GSPC board unchanged",
      reached_the_public: true,
      evidence: [
        "https://councilof.ai/corrections/mill16-unadmitted-2026-09-24.json",
        "https://councilof.ai/interop/mill-cards-signed/WITHDRAWN.jsonl",
        "docs/operations/MILL_20260924T16_ADMISSION_REVIEW.md @ be2a26e45",
        "https://councilof.ai/api/gspc"
      ],
      note: "The notice identifies the exact 14 URLs, IDs, hashes and intake receipts. This is a publication-authority correction, not a verdict that the underlying graded observations are false. No score from this cohort should be represented as admitted measurement pending a separate review."
    },
    {
      "date": "2026-09-22",
      "evidence": [
        "public/corrections/living-stamp-unverifiable.json @ cb773b2f9894#attestations_that_do_verify",
        "https://councilof.ai/api/state",
        "drift-draft/snapshots/2026-09-22T14.json"
      ],
      "first_observed_at": "2026-09-22T14:25:27Z",
      "id": "C-2026-0924-02",
      "detected_at": "2026-09-22T14:25:27Z",
      "detected_by": "internal monitor",
      "published_at": "UNRECORDED",
      "timing_evidence": ["first_observed_at field of this entry, recorded when the entry was written"],
      "status": "CORRECTED BY A DATED SUPERSESSION NOTE; THE ORIGINAL NOTE IS NOT EDITED",
      "note": "Promoted from draft D-2026-09-22T14-05 by the owner. Auto-drafted by drift-draft.py on the pod; kind typed_claim_disagrees; fingerprint 025f75a98669c0d4; snapshot 2026-09-22T14 sha256 1528b03ee6ce0091bf61c9f7de464ca884175f91ab60b7833544c5b65dce50d0 (no previous snapshot). No ledger id is assigned until promote-draft.sh runs. Nothing here is a grade or a mark; it is a recorded disagreement between two byte-sources.",
      "reached_the_public": true,
      "what_changed": "Published a dated supersession note, public/corrections/public-corrections-living-stamp-unverifiable-json-2026-09-22-C-2026-0924-02-SUPERSEDES.md, beside the 2026-08-28 file, which is not edited: it was true when written. Read live on 2026-09-24, /api/state card_chain.bodies_verified_valid is 335 (kind measured): the signed card index holds 335 cards and all 335 verify. This is one of three separate card counts (council-os/CARD-CORPORA.md) and is never added to or substituted for the other two.",
      "what_was_wrong": "public/corrections/living-stamp-unverifiable.json reads attestations_that_do_verify (measurement cards) = 150 while the compared surface reads 335. Source A: public/corrections/living-stamp-unverifiable.json @ cb773b2f9894#attestations_that_do_verify (sha256 ea601d5ee48f80df32831d8ef3e18789f3bcae0299d14d2ead2edcbef5da9d49; as_of 2026-08-28T17:19:43+01:00 = last commit touching the file). Source B: https://councilof.ai/api/state (sha256 efc1ffbbba84b4d20bf1e4e16c249fdbf901063563e07775841c8b33d224e300; as_of 2026-09-22T14:25:28Z = fetched_at (payload carries no as_of)). Compared at 2026-09-22T14:25:27Z (snapshot 2026-09-22T14).",
      "why_it_was_wrong": "A number typed on a static surface. The endpoint derives its count from the axis array (or the card index) at request time, so a typed copy goes stale the moment the measured surface moves. This loop records the disagreement; it does not establish why the copy was typed."
    },
    {
      "date": "2026-09-22",
      "evidence": [
        "public/corrections/living-stamp-unverifiable.json @ cb773b2f9894#unmeasured_slots_unchanged",
        "https://councilof.ai/api/gspc",
        "drift-draft/snapshots/2026-09-22T14.json"
      ],
      "first_observed_at": "2026-09-22T14:25:27Z",
      "id": "C-2026-0924-01",
      "detected_at": "2026-09-22T14:25:27Z",
      "detected_by": "internal monitor",
      "published_at": "UNRECORDED",
      "timing_evidence": ["first_observed_at field of this entry, recorded when the entry was written"],
      "status": "CORRECTED BY A DATED SUPERSESSION NOTE; THE ORIGINAL NOTE IS NOT EDITED",
      "note": "Promoted from draft D-2026-09-22T14-04 by the owner. Auto-drafted by drift-draft.py on the pod; kind typed_claim_disagrees; fingerprint d1520d8783752683; snapshot 2026-09-22T14 sha256 1528b03ee6ce0091bf61c9f7de464ca884175f91ab60b7833544c5b65dce50d0 (no previous snapshot). No ledger id is assigned until promote-draft.sh runs. Nothing here is a grade or a mark; it is a recorded disagreement between two byte-sources.",
      "reached_the_public": true,
      "what_changed": "Published a dated supersession note beside the 2026-08-28 file, which is not edited: it was true when written. Read live on 2026-09-24, the board lists 23 axes and 0 unmeasured. Five of the seven slot names are axes marked MEASURED (custody-disclosure, distribution-integrity, humanoid-labour-index, regulatory-framework, reserve-attestation). The other two are retired names kept as dataset slugs: ai-economy-index is now ai-adoption-components and human-labour-index is now labour-components, both MEASURED.",
      "what_was_wrong": "public/corrections/living-stamp-unverifiable.json reads unmeasured_slots_unchanged = [\"ai-economy-index\", \"custody-disclosure\", \"distribution-integrity\", \"human-labour-index\", \"humanoid-labour-index\", \"regulatory-framework\", \"reserve-attestation\"] while the compared surface reads []. Source A: public/corrections/living-stamp-unverifiable.json @ cb773b2f9894#unmeasured_slots_unchanged (sha256 ea601d5ee48f80df32831d8ef3e18789f3bcae0299d14d2ead2edcbef5da9d49; as_of 2026-08-28T17:19:43+01:00 = last commit touching the file). Source B: https://councilof.ai/api/gspc (sha256 6496ac94d3cadfff3671e47125bc1f29a8468c028372a7f8350a65856ad39f9e; as_of behavioural axes 2026-08-12 · jail 2026-08-18 · financial-fact axes 2026-08-25 = measured_on.date (prose, not compared as a timestamp)). Compared at 2026-09-22T14:25:27Z (snapshot 2026-09-22T14).",
      "why_it_was_wrong": "A number typed on a static surface. The endpoint derives its count from the axis array (or the card index) at request time, so a typed copy goes stale the moment the measured surface moves. This loop records the disagreement; it does not establish why the copy was typed."
    },
    {
      "date": "2026-09-23",
      "evidence": [
        "https://councilof.ai/api/gspc"
      ],
      "first_observed_at": "2026-09-23T03:55:06Z",
      "id": "C-2026-0923-02",
      "detected_at": "2026-09-23T03:55:06Z",
      "detected_by": "internal audit",
      "published_at": "UNRECORDED",
      "timing_evidence": ["first_observed_at field of this entry, recorded when the entry was written"],
      "note": "Promoted from draft D-2026-09-23T03-02 by the owner. HAND-DRAFTED by the arena-separation lane (feat/arena-separation-2026-09-23), not by drift-draft.py's detector, and placed in the same approve-queue so promote-draft.sh D-2026-09-23T03-02 is the only step. kind summary_omits_measured_negative; fingerprint 236d1c31f796639e. No ledger id is assigned until promote-draft.sh runs. Nothing here is a grade or a mark.",
      "reached_the_public": true,
      "what_changed": "Fixed at the cause on branch fix/signed-surface-agreement-2026-09-23 (pushed to the pod bare repo, NOT merged at the time of this entry). functions/api/gspc.ts now derives the separation aggregate ONCE, beside the counts it already derived, so a reader meets the negative at the same moment as the measured count. totals.separation_public_count reads \"0 of 14 model-comparison axis separated a leader, 2 TIE, 12 UNTESTED\", with a note saying to read it WITH public_count and never instead of it. totals.count_grammar, the line the payload already points readers to, now carries the same sentence and the rule behind it: a measurement is not a separated leader, a point-estimate lead is not a measured advantage, and UNTESTED is not a tie. totals.lid, the one line the estate asks readers to quote verbatim and the line the home page renders verbatim, now states \"0 separated leaders\". separated_leads, ties and untested_separations read the same three constants instead of re-deriving them, so the headline, the grammar, the tallies and limitations[0] cannot drift apart - the defect this file already records at C-2026-0922 (G-3, two derivations of one quantity) is not reintroduced. functions/api/gspc.lid-truth.test.ts was extended to parse the new lid number against totals.separated_leads and to assert that the three separation states account for every model-comparison axis with none folded into another.",
      "what_was_wrong": "totals carries axes, measured_axes, unmeasured_axes, quotable_axes and the count line '23 axis · 23 measured', and no aggregate of the separation field at all. The same payload's limitations[0] states the measured position plainly: of the 14 model-comparison axes, 2 TIE, 12 UNTESTED. The count line is the line every other surface quotes, so the figure that travels is the one that cannot carry the negative.",
      "why_it_was_wrong": "A measured axis and an axis that can tell two models apart are different claims, and only the first is derived into totals. Separation is present per-axis in the array and stated in limitations, so the aggregate is derivable from bytes already served; it is simply not derived. This records the omission, not an intent."
    },
    {
      "date": "2026-09-23",
      "evidence": [
        "https://councilof.ai/api/gspc",
        "https://councilof.ai/signals/swarm.signed.json"
      ],
      "first_observed_at": "2026-09-23T03:55:06Z",
      "id": "C-2026-0923-01",
      "detected_at": "2026-09-23T03:55:06Z",
      "detected_by": "internal audit",
      "published_at": "UNRECORDED",
      "timing_evidence": ["first_observed_at field of this entry, recorded when the entry was written"],
      "note": "Promoted from draft D-2026-09-23T03-01 by the owner. HAND-DRAFTED by the arena-separation lane (feat/arena-separation-2026-09-23), not by drift-draft.py's detector, and placed in the same approve-queue so promote-draft.sh D-2026-09-23T03-01 is the only step. kind measured_surfaces_disagree; fingerprint 7d98363c444e75d8. No ledger id is assigned until promote-draft.sh runs. Nothing here is a grade or a mark.",
      "reached_the_public": true,
      "what_changed": "Fixed at the cause on branch fix/signed-surface-agreement-2026-09-23 (pushed to the pod bare repo, NOT merged at the time of this entry). Establishing which surface was right came first, and the answer is that neither was wrong about its own bytes: the board grades a frozen 37-item SwarmBench v2b bank for per-item accuracy, the signal ranks recorded pairwise arena rounds by win-rate, and on this axis the two fleets share no model at all - the board's leader qwen2.5:7b is not among the three models ranked in the arena. Two determinations were wearing one word. Regenerating the signals under the 0.3 all-other-ranked-models rule that landed earlier the same day does NOT resolve it: nemotron-3-nano:30b's Wilson lower bound 0.796 clears both other ranked models' upper bounds (0.513, 0.435), so the arena verdict stays SEPARATED. The disagreement was never a rule-version artefact. The remedy is that one surface stops claiming the axis's separation. scripts/emit_signals.py (schema csoai.axis-signal/0.4) now joins every signal to its board row on the board's own dataset slug, with no typed crosswalk, and defers status and register to the board's separation verdict; it refuses to sign a signal whose board row it cannot find. The arena determination is not discarded: it stays in full in the elo_ fields, scoped by separation_of, by separation_authority (carrying the board's verdict, leader, bench and n) and by evidence_relation SEPARATE_EVIDENCE, which states in the signed bytes that the two are never added, reconciled or substituted. All 14 per-axis signals were regenerated through the producer and re-signed under did:web:csoai.org#board-attestation-1; no signed artifact was edited in place. swarm's published status moves MEASURED to UNTESTED and the superseded bytes are recorded in the new file's supersedes block. Separately, the signal now publishes register_board_drift on swarm rather than carrying the stale count silently: the axis register still describes the retired 40-item PROTOCOL bank while the board serves 37. That row is published as PUBLISHED_NOT_RECONCILED and deliberately not retyped, because reconciling it also requires majority_baseline re-derived on the current bank, which has not been done and is not invented. Four planted controls in scripts/arena/test_arena_controls.py hold the shape, including one that plants arena evidence that separates on an axis the board has not tested and asserts the chain cannot publish it as MEASURED.",
      "what_was_wrong": "Two surfaces this organisation publishes and signs give different answers to the same question about the same axis. GET /api/gspc reports swarm separation UNTESTED with leader 'qwen2.5:7b (base model)' over n=37. /signals/swarm.signed.json reports elo_separation SEPARATED with elo_leader 'nemotron-3-nano:30b' over 18 decided arena games. A reader asking whether we can tell two models apart on swarm gets two answers and two different model names, both carrying the board signature.",
      "why_it_was_wrong": "They are two different determinations over two different corpora — the board's is a paired McNemar test on the 2026-08-12 fleet run, the signal's is a Wilson interval over the hourly arena rounds — and neither surface says so where the other can be read. Nothing here establishes which is right. Recording the disagreement is the point; a surface that is silent about a second published answer is the defect."
    },
    {
      id: "C-2026-0922-02",
      detected_at: "2026-09-22T12:48Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-22",
      first_observed_at: "2026-09-22T12:48Z",
      what_was_wrong:
        "32 signed measurement cards for the jail axis under /interop/mill-cards-signed/ published " +
        "an accuracy for jailbreak-escape detection that was never measured. They were graded " +
        "against a placeholder bank — the pod file /workspace/banks-all/gspc-jail.jsonl, sha256 " +
        "f0f31f9a…, 41 rows whose prompts were the literal strings \"jail-000\", \"jail-001\" and so " +
        "on, with no code cell in them. Each model was asked to classify a placeholder token and " +
        "the exact-label grader scored the reply against the gold label; the published accuracies, " +
        "0.0 to 0.9487, are an artifact of which label a model happens to prefer. By 2026-09-22 " +
        "15:30Z, 24 of the 32 were already superseded — 21 of those by another card from the same " +
        "placeholder bank, which cured nothing — and 8 were still the live card for their cell: " +
        "mistral:7b 0.9487 (n=39), phi3.5:3.8b 0.25 (n=40), qwen2.5:1.5b 0.0732 (n=41), " +
        "mistral-nemo:12b and qwen2.5:0.5b-instruct 0.0488 (n=41), gemma3:4b 0.0256 (n=39), " +
        "qwen2.5:7b 0.0244 (n=41), qwen3:4b 0 (n=41). All 32 carried status MEASURED and all 32 " +
        "verify under did:web:csoai.org#board-attestation-1 — the signature was sound over a " +
        "measurement that was not.",
      why_it_was_wrong:
        "The intake allowlist pinned the bank bytes without anyone reading them. " +
        "verify_runpod_gspc_intake.py proves that the bank used is the bank pinned; it cannot " +
        "prove that the pinned bytes are a bank. The real bank existed and was public the whole " +
        "time — HF csoai/gspc-jail-goldbank, samples.jsonl, sha256 0b45b620…, 71 real code cells, " +
        "38 ESCAPE and 33 BENIGN — and the board's jail row already cited it, so the number on the " +
        "card and the bank named beside it were about different things.",
      what_changed:
        "Nothing was deleted and no signed byte was edited. The eight cells were re-measured on " +
        "the goldbank through the same pinned instrument (temperature 0, seed 0, 128 label tokens, " +
        "the full 71 cells), and seven produced a board-signed MEASURED card that supersedes its " +
        "placeholder: mistral:7b 0.9853 (n=68), gemma3:4b 0.8169 (n=71), phi3.5:3.8b 0.6308 " +
        "(n=65), mistral-nemo:12b 0.6056 (n=71), qwen2.5:7b 0.5857 (n=70), qwen2.5:1.5b 0.4648 " +
        "(n=71), qwen2.5:0.5b-instruct 0.4648 (n=71). The eighth, qwen3:4b, is UNMEASURED: on the " +
        "real cells it emitted no parsable label on 71 of 71 items, every reply running to the " +
        "128-token cap, so n=0 and there is no card to point at — its placeholder is superseded " +
        "with by_id null, because a card graded on stubs must not stand either way. All 32 " +
        "placeholder cards remain on disk and keep resolving; the eight supersessions are recorded " +
        "in /interop/mill-cards-signed/SUPERSEDED.jsonl naming this entry and the two bank " +
        "digests. The producer is fixed at the source: the jail digest in " +
        "scripts/runpod_gspc_bank_allowlist.current.json is now the goldbank, the worker and the " +
        "playlist generator read the goldbank as its published Inspect-shaped rows rather than a " +
        "rewritten copy, the pod bank file holds those bytes, and the hourly mill halts unless the " +
        "digest matches — so no further placeholder run can be admitted. Card root re-stamped: " +
        "1423 live leaves, merkle_root 8add6156…, recomputed MATCH; its timestamp proof is " +
        "PENDING at the calendar and not yet anchored to Bitcoin.",
      reached_the_public: true,
      note:
        "The two 0.4648 figures are the same number for the same reason and should not be read as " +
        "detection: qwen2.5:0.5b-instruct and qwen2.5:1.5b answered BENIGN on all 71 cells, and 33 " +
        "of the 71 cells are BENIGN. Found by this estate while restarting the mill on 2026-09-22; " +
        "the first three cures landed the same day, these eight the same afternoon. The 12 " +
        "hub-mill jail cards graded through provider APIs on the HF bank are a different corpus " +
        "and are not covered here.",
    },
    {
      id: "C-2026-0922-01",
      detected_at: "2026-09-18",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["note of this entry: 'Caught 2026-09-18'; first_observed_at reads 2026-09-18T00:00Z, a date written as midnight, so detected_at keeps day precision"],
      date: "2026-09-18",
      first_observed_at: "2026-09-18T00:00Z",
      what_was_wrong:
        "The 17 September note on the public root's odd-node duplication (corrections/" +
        "merkle-count-binding-2026-09-17.md in the csoai/councilof-ai-mirror dataset) said that " +
        "RFC 6962 domain-separation prefixes are the general fix for the padding collision it " +
        "demonstrated, and that moving the public root to domain separation would close it by " +
        "construction. Prefixing 0x00 before leaves and 0x01 before nodes while keeping odd-node " +
        "duplication leaves the collision intact: the forged 306-leaf set and the honest 305-leaf " +
        "set still hash to one root, because the substitution pairs a leaf with a leaf.",
      why_it_was_wrong:
        "The prefixes stop a leaf digest from impersonating an interior digest — a different " +
        "second-preimage class. What makes Certificate Transparency immune to the padding " +
        "collision is that RFC 6962 never duplicates an odd node (it splits at the largest power " +
        "of two below n) and signs tree_size. The note attributed CT's immunity to the wrong " +
        "mechanism, so a reader building a v2 with prefixes alone would still ship a collidable " +
        "root.",
      what_changed:
        "A dated superseding note, corrections/merkle-count-binding-2026-09-18-SUPERSEDES.md, is " +
        "published beside the original in the same dataset and under public/corrections/ in the " +
        "councilof-ai repository, with a standard-library reproduction over the live root run " +
        "three ways (unprefixed duplicating: collides; prefixed duplicating: still collides; RFC " +
        "6962 shape: does not). corrections/SUPERSESSIONS.md points both ways. The original file " +
        "is not edited. The count-binding guidance in the original (bind card_count; reject " +
        "index >= card_count) stands and is unaffected.",
      reached_the_public: true,
      note:
        "Caught 2026-09-18 while re-reading the note for the W3C Agent Conformance CG text, " +
        "published 2026-09-22. Live root at publication: as_of 2026-09-22T08:54:02Z, " +
        "card_count 305, merkle_root 40ce3833…",
    },
    {
      id: "C-2026-0920-01",
      detected_at: "2026-09-20T01:52Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-20",
      first_observed_at: "2026-09-20T01:52Z",
      what_was_wrong:
        "The site_attestation on GET /api/gspc did not verify under its own published preimage " +
        "rule. excludeOwnLeader() and dropUncardedLeader() in functions/api/gspc.ts returned " +
        "leader: undefined as an own property on the 11 axes whose leader is excluded or " +
        "uncarded; the edge signer's canonical() emits an own undefined property as the literal " +
        "text \"leader\":undefined, while JSON.stringify — which produces the served bytes — drops " +
        "the key entirely. The signed bytes were therefore unreconstructable from the served bytes " +
        "by anyone. An outside reconciliation on 2026-09-20 tried 11 preimage variants across two " +
        "independent implementations (Node with the signer's exact canonical(); Python " +
        "ensure_ascii both ways); none verified, while the same payload's living_stamp verified " +
        "under the same pinned key.",
      why_it_was_wrong:
        "The signer and the serializer disagreed about undefined-valued own properties, and no " +
        "check verified the attestation from the served bytes — the only bytes a relying party " +
        "has. The published preimage rule was correct; the bytes it pointed at could not be " +
        "reproduced, which for a relying party is an unverifiable attestation regardless of cause.",
      what_changed:
        "The leader key is omitted instead of set to undefined. Served bytes are byte-equivalent " +
        "(element-wise and full-body comparison against the live payload, modulo attestation " +
        "material). An end-to-end proof through the real handler with a throwaway key shows the " +
        "attestation verifying from served bytes, the living_stamp still verifying, and totals " +
        "unchanged; the gspc truth tests pass 16/16. Merged as #2657. Until a deploy serves it, " +
        "the live payload's site_attestation remains unverifiable and must not be read as " +
        "validating the payload — the living_stamp and the 335 signed cards verify independently.",
      reached_the_public: true,
      note:
        "Window start unknown (shipped with the leader-exclusion change); observed INVALID " +
        "2026-09-20T01:52Z and still INVALID pre-deploy at 03:40Z. Full evidence bundle: " +
        "evidence/reconciliation-2026-09-20/ (RECON-2026-0920-01).",
    },
    {
      id: "C-2026-0917-01",
      detected_at: "2026-09-17T04:30Z",
      detected_by: "internal monitor",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-17",
      first_observed_at: "2026-09-17T04:30Z",
      what_was_wrong:
        "public/interop/ots/manifest.json claimed 566 OpenTimestamps proofs, every row asserting " +
        "state PENDING_BITCOIN_CONFIRMATION. Checked by deserialising each file it named, NONE of the " +
        "566 was a proof: each was a calendar response fragment saved under the .ots extension. A row " +
        "asserting that a stamp exists and awaits Bitcoin confirmation, for bytes that are not a stamp, " +
        "is a false claim about evidence. The same defect recurred four times across 16 and 17 September, " +
        "reaching 1,915 claimed proofs at its largest, and a later sample of 40 from one branch again " +
        "contained zero real proofs.",
      why_it_was_wrong:
        "The manifest was generated from a list of files something intended to stamp rather than from the " +
        "bytes on disk. Nothing read the files back. An .ots extension is itself a claim that the bytes " +
        "are a timestamp, and the manifest repeated that claim 566 times without checking it once.",
      what_changed:
        "Files that do not deserialize are quarantined as .ots.invalid rather than deleted. The manifest " +
        "is generated by scripts/ots_manifest_rebuild.py, which reads each file back and keeps only what " +
        "parses, and carries a selftest proving it rejects a non-proof and accepts a real one. Branch " +
        "protection on master now applies to admins, which stopped the source of the batches.",
      reached_the_public: false,
      note:
        "The deploy gate refused every build carrying these files, so no version of the inflated manifest " +
        "was served. Recorded anyway: it was committed to a public repository, and a fourfold recurrence " +
        "in two days is the finding rather than the exposure.",
      evidence: [
        "/interop/ots/manifest.json",
        "scripts/ots_manifest_rebuild.py",
        "scripts/ots_guard.py",
      ],
    },
    {
      id: "C-2026-0917-02",
      detected_at: "2026-09-17T04:50Z",
      detected_by: "external report",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written; this is the estate's own first observation - the external correspondent's report preceded it at a time the entry does not record"],
      date: "2026-09-17",
      first_observed_at: "2026-09-17T04:50Z",
      what_was_wrong:
        "Every public surface councilof.ai serves answers HTTP 403 to a plain standard-library HTTP " +
        "client while answering normally to a browser. Measured 17 September 2026: 21 of 21 published " +
        "URLs, including /.well-known/did.json, /.well-known/agent-card.json, /.well-known/x402.json, " +
        "robots.txt and llms.txt. Those five exist only for machines. We have told correspondents, " +
        "standards bodies and regulators in writing that they can fetch our evidence and verify it " +
        "without our cooperation. For anyone using a standard client, that was not true.",
      why_it_was_wrong:
        "A Cloudflare Browser Integrity Check at the zone level rejects requests by client signature, " +
        "returning error 1010. It was enabled for the website and silently covered the API and the " +
        "well-known paths beneath it. An earlier check of ours missed it because we tested user-agent " +
        "strings through curl rather than the actual clients, and the strings we happened to pick were " +
        "allowed. Testing a sample that excludes the reported case is not testing.",
      what_changed:
        "The measurement is published at /interop/machine-reachability-2026-09-17.json and is " +
        "reproducible by scripts/machine_reachability.py, whose selftest proves it can report both " +
        "outcomes. The twelve artifacts a stranger most needs are mirrored to a host that does serve " +
        "plain clients, at huggingface.co/datasets/csoai/councilof-ai-mirror, refreshed twice daily. " +
        "The zone setting itself is a dashboard control we cannot reach with any credential we hold, " +
        "and it is recorded as the owner's action.",
      reached_the_public: true,
      note:
        "This one did reach the public, and it is the most consequential defect we have published " +
        "against ourselves. An organisation whose entire output is machine-readable evidence was " +
        "refusing machines at every address it publishes. Credit for first reporting it goes to an " +
        "external agent correspondent who tested the payable door and wrote to us.",
      evidence: [
        "/interop/machine-reachability-2026-09-17.json",
        "scripts/machine_reachability.py",
        "https://huggingface.co/datasets/csoai/councilof-ai-mirror",
      ],
    },
    {
      id: "C-2026-0916-03",
      detected_at: "2026-09-16T12:38Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-16",
      first_observed_at: "2026-09-16T12:38Z",
      what_was_wrong:
        "/interop/swift-measure.json published a per-bank page_state for seventeen banks — six OK, eight HTTP_404, three HTTP_403 — in a file whose card was titled around the banks being measured. Eleven of those seventeen URLs are newsroom index pages we chose ourselves (anz.com.au/newsroom/media-releases/2026/, citigroup.com/global/news/newsroom, wellsfargo.com/about/press and so on). A 404 on a path we invented is evidence about our guess and not about the bank, so eleven rows read as findings about institutions when they were findings about our own URL list. Separately the primary source — Swift's press release naming the cohort — had never been fetched at all: swift.com answers HTTP 403 to this client, so even cohort membership was second-hand.",
      how_caught:
        "Reading the failing rows instead of the summary, and noticing that the failures clustered on hand-written newsroom index paths rather than on the banks.",
      fix:
        "The file now states, at the top and on every row, that it records the HTTP state of seventeen URLs we chose and nothing about the seventeen banks, with url_provenance GUESSED_BY_US_NOT_PRIMARY_SOURCE on each row and a page_state_means sentence saying what the state does and does not support. A primary_source block records the Swift press release as UNFETCHED_HTTP_403 with the time of the attempt. status_all stays DISCOVERED. No bank in this file has been measured on tokenisation posture and none may be quoted as such. The artifact was re-stamped after the edit and the OTS manifest digest updated, because a proof stops covering a file the moment the bytes change.",
      status: "CORRECTED IN SOURCE AND RECORDED; THE COHORT REMAINS UNMEASURED",
    },
    {
      id: "C-2026-0916-02",
      detected_at: "2026-09-16T10:42Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-16",
      first_observed_at: "2026-09-16T10:42Z",
      what_was_wrong:
        "Three files published at /interop/ots/ as OpenTimestamps proofs were not OpenTimestamps proofs. swift-measure.ots, cobol-measure.ots and stablecoins-extended.ots carried no .ots magic header and python-opentimestamps rejects each with BadMagicError. The manifest beside them (csoai.ots-manifest/0.1) listed a sha256 per subject; none of the three matched the bytes of the artifact it named (swift-measure.json actual 005d04fd…, manifest d4377a67…; cobol-measure.json actual 15900afe…, manifest 0f8a354f…; stablecoins-extended.json actual 752175b2…, manifest d7a8936b…). A reader following the manifest would have been told an anchor existed for bytes that were never stamped. Separately, the three ledger cards for the same run carried subjects saying the banks, COBOL systems and stablecoins were 'measured' and payload flags.measures true, while every row in all three artifacts reads status DISCOVERED and each artifact's own honesty field says a homepage fetch is not a measurement of the subject property.",
      how_caught:
        "Auditing what landed on master before deploying it: recomputing the sha256 of each named artifact and comparing it with the manifest, then deserializing each .ots with python-opentimestamps instead of trusting the file extension.",
      fix:
        "Root cause was the producer: scripts/ots/ots-stamp.py wrote the calendar's raw HTTP response fragment to disk. A detached proof is magic header + version + file-hash-op + file digest + serialized timestamp. The script is rewritten to build a DetachedTimestampFile with the opentimestamps library, to submit to four calendars, and to expose --verify; it reports PENDING and never says anchored. Real proofs were created for the three artifacts (swift-measure.json.ots, cobol-measure.json.ots, stablecoins-extended.json.ots), each verified to commit to the actual file digest and each carrying four PendingAttestations and no Bitcoin attestation. The manifest is reissued as csoai.ots-manifest/0.2 with recomputed digests, the pending state stated plainly, and a supersedes block naming this record. The three invalid files are kept unedited under /interop/ots/_invalid-2026-09-16/ with a README, so anyone who read them can see what was published. The three card subjects now state what was measured (page reachability and the sha256 of the bytes returned) and that the subject property is DISCOVERED; flags.measures is false and discovery_only is true. Nothing here is anchored until scripts/ots-upgrade.py lands a BitcoinBlockHeaderAttestation.",
      status: "CORRECTED IN SOURCE AND RECORDED; PROOFS ARE PENDING, NOT ANCHORED",
    },
    {
      id: "C-2026-0916-01",
      detected_at: "2026-09-16T09:47Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-16",
      first_observed_at: "2026-09-16T09:47Z",
      what_was_wrong:
        "Two outbound emails on 16 September (to DBTA and Nieman Lab, 05:35-05:36Z) corrected an earlier figure for the supersession ledger from 953 to 841 rows and asked the recipients to use 841. At that moment the live file https://councilof.ai/interop/mill-cards-signed/SUPERSEDED.jsonl did read 841 lines. The copy on master already held 953: 112 entries dated 2026-09-15 (latest at 2026-09-15T08:02:55Z) had been committed but not deployed, because the deploy workflow had not run since 2026-09-15T08:06Z. The hand deploy at 2026-09-16T09:31Z shipped them, so the live file now reads 953 lines and 953 distinct superseded_id values. Both figures were true of the bytes they were read from; neither message said which copy it had read.",
      how_caught:
        "Re-reading the live ledger at 09:47Z before quoting it in a further approach, and comparing the count with the figure sent earlier in the day and with the entries' own at timestamps.",
      fix:
        "Approaches sent after 09:47Z quote 953 with the read time. The two recipients of the 841 figure are not written to again; this record is the correction, and the ledger they were pointed at now reads 953. Outreach rule recorded: a figure quoted outward names the copy it was read from (live URL and read time), and a deploy that moves a quoted figure is logged against the messages that quoted it.",
      status: "RECORDED; THE LIVE LEDGER IS AUTHORITATIVE AT ITS READ TIME",
    },
    {
      id: "C-2026-0915-01",
      detected_at: "2026-09-15T07:30Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-15",
      first_observed_at: "2026-09-15T07:30Z",
      what_was_wrong:
        "On GET /api/gspc, the governance axis's historical_measurement_record.note said the tuned governance specialist \"leads AND the lead is separated (McNemar p=0.0086 vs best base mistral:7b) — one of only 4 separated leads on the board\". The same payload read governance.separation UNTESTED, totals.separated_leads 0 and totals.own_leaders_excluded 8 with governance among them. The sentence predated the own-model exclusion, which removes our own specialist from the public leader slot and with it every public separation determination on that axis. The same class stood in four more places: the care note (\"SEPARATED vs the best base\") and the affect note (\"the cleanest separation on the board\"), both on own-model axes reading UNTESTED; a limitations line on the same payload saying \"care is separated from base models\"; and on the site, /benchmarks typed \"Governance separates at p=0.0086, care at p=0.0356, affect at p=0.0078\" and two sector pages promised a card \"with the separated lead\". A dated /feed.xml item said \"3 of 13 canonical axes carry a separated leader\" in the present tense.",
      how_caught:
        "Reading the live payload against itself: the governance note's prose was compared with the governance separation field and with totals.separated_leads in the same response, instead of being accepted as a summary.",
      fix:
        "The governance, care and affect notes in functions/api/_gspc_axes_a.ts and _gspc_axes_b.ts now state each separation as an in-lane result on our own model, not a public ranking, and not counted in totals.separated_leads; the typed count is gone. The care limitation in functions/api/gspc.ts is derived from the raw axis rows and carries the same label. /benchmarks and the government and affect sector entries no longer present these as public separated leads. The feed item is dated to its sitting and points at the live count. functions/api/gspc.separation-truth.test.ts reads the served board and fails when any note, historical record or limitation claims a separated lead on an axis whose separation field is not SEPARATED (a historical record passes only when marked superseded and labelled in-lane), or when any typed count of separated leads differs from totals.separated_leads; it carries failing controls for the pre-correction governance sentence. The signed snapshots that carry the old sentence (public/signed/gspc-board.signed.json, public/signed/gspc-measurement.json) are not edited; this record supersedes that sentence in them.",
      status: "CORRECTED IN SOURCE AND RECORDED; VERIFY THE CURRENT LIVE ENDPOINT",
    },
    {
      id: "C-2026-0914-03",
      detected_at: "2026-09-14T10:54Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-14",
      first_observed_at: "2026-09-14T10:54Z",
      what_was_wrong:
        "The wrapper-parity roster pointed usdt0:arbitrum and usdt0:optimism at 0x2E1dBfbf44d8855fDE5D5fD6c978a9b10bc27627 and usdt0:ethereum at 0x48C04ed50508680b93561a5800E97e24C05e639F. None of these is a USDT0 token contract. Three public.notice cards signed under did:web:csoai.org#board-attestation-1 and included in the public root record those reads: public/cards/385d7cd72fee80b4.json (usdt0:arbitrum), public/cards/a911bc077ebb9b1f.json (usdt0:optimism) and public/cards/293cd51070159fa3.json (usdt0:ethereum). Each honestly states UNMEASURED with an empty eth_call result from that address, but the subject label USDT0 was wrong for the address read. No parity number was published for USDT0.",
      how_caught:
        "Re-verifying roster addresses against the issuer's published deployments page (docs.usdt0.to) while adding sourced wrapper rows; the two affected addresses returned no token on either chain.",
      fix:
        "The roster now uses the addresses on docs.usdt0.to (Arbitrum 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9, Optimism 0x01bFF41798a0BcF287b996046Ca68b395DbC1071). The staged atoms were re-staged from the corrected roster and read UNCHECKABLE_NATIVE_ISSUANCE. The usdt0:ethereum atom had no roster row and was removed from staging. The three signed cards are not edited; this record supersedes their subject label.",
      status: "CORRECTED IN SOURCE AND RECORDED; VERIFY THE NEXT PUBLIC ROOT",
    },
    {
      id: "C-2026-0914-02",
      detected_at: "2026-09-14T10:37Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-14",
      first_observed_at: "2026-09-14T10:37Z",
      what_was_wrong:
        "On GET /api/gspc, the reserve-attestation axis note said '1 PASS, 6 FAIL, 9 UNCHECKABLE'. The evidence file it cites, /interop/financial-measure-run-reserve-attestation.json (as_of 2026-09-07T11:30:35Z), tallies 3 PASS, 4 FAIL, 9 UNCHECKABLE; 1/6/9 is the custody-disclosure tally. The regulatory-framework note said '3 PASS, 4 FAIL, 9 UNCHECKABLE' while its evidence file tallies 4 PASS, 3 FAIL, 9 UNCHECKABLE. When the wrong strings were introduced is UNCHECKABLE from the shallow repository history available; they predate 2026-09-14T01:46Z.",
      how_caught:
        "Verifying a regulator comment draft before submission: the draft quoted the board note, and the reviewer compared it with the tally field of the cited evidence file instead of accepting the summary.",
      fix:
        "Both notes in functions/api/_gspc_axes_fin.ts now quote their evidence files. functions/api/gspc.financial-tally.test.ts reads every typed PASS/FAIL/UNCHECKABLE triple in a financial note and requires it to equal the cited evidence file's tally, with failing controls for the two pre-correction strings. The evidence files were correct and are unchanged. Signed board snapshots that carry the old notes are superseded by this record, not edited.",
      status: "CORRECTED IN SOURCE AND RECORDED; VERIFY THE CURRENT LIVE ENDPOINT",
    },
    {
      id: "C-2026-0914-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-14",
      // Latency fields carry only what is evidenced: introduction = the merge of #2321,
      // the first PR that landed these cards. The observation time was not logged and
      // the fix is not merged, so neither is stated.
      error_introduced_at: "2026-09-14T08:29Z",
      what_was_wrong:
        "44 signed third-party Hub measurement cards on the swarm axis (#2321, merged 2026-09-14T08:29Z, and #2330, 09:41Z; runs gha-34818995409 and gha-34824895140) were graded by a prompt that could not be answered wrongly. The frozen bank csoai/gspc-swarm (revision e8a4ec1e, sha256 ab318986…) is keyword-graded: all 37 rows expect KEYWORD_MATCH and carry must_inc keywords. The Hub mill builds its exact-label answer menu from the bank's expected column, so every item prompt read \"Reply with EXACTLY ONE token from: KEYWORD_MATCH\" and every model that followed the format scored 1.0. 26 of the cards read MEASURED at n=30 with accuracy 1, and /api/hub-cards counted all 26 as MEASURED cells. Every check the cards passed was real — signature, content id, admission receipt, per-item evidence that recomputes byte for byte — and none asked whether the menu offered a wrong answer. Pod (Ollama) swarm cards bind the same bank bytes under a different instrument and read 0.027–0.081, so the two populations were never comparable.",
      how_caught:
        "Reading the published item evidence behind one card (signed-swarm-0711716149e0.json, deepseek-ai/DeepSeek-V4-Pro, items-swarm-e91bd4f805de.jsonl): all 30 rows carried the same one-option menu and expected its only option. Contrast under the same instrument hash (86216fbb…): the care bank offers 0 | 1 with mixed expected labels, and Qwen3-14B read 4/30. Every MEASURED swarm row in /interop/hub-cards-index.json read accuracy 1.",
      fix:
        "Signed bytes are not edited. The 44 cards are recorded in /interop/mill-cards-signed/WITHDRAWN.jsonl — withdrawn, not superseded, because no sound card exists to replace them — derived from the bound bank bytes by scripts/withdraw_one_option_cards.py, which fails the PR gate if any signed card on a one-option bank is not withdrawn. /api/hub-cards drops withdrawn cards from cells and counts, lists them under withdrawn_cells with this id and their status as published, and withholds totals if the withdrawal ledger is unreadable. The deployed hub-cards index excludes them, and the census flip marks them WITHDRAWN, so its next run retires their queue cells and leaves them out of the rebuilt Hub indexes. The instrument now fails closed: an exact-label menu with fewer than two distinct labels, or one naming a grading mode, is refused; the mill skips such a bank as UNCHECKABLE before spending an item prompt, and the offline admission verifier refuses such a card. Two-label prompts are byte-identical, so admitted care, safety and governance cards still verify. The Hub swarm cell is UNMEASURED until a keyword grader that passes harness/gspc-top100/check_bank_discriminates.py is wired into the Hub mill.",
      status: "WITHDRAWN IN SOURCE; VERIFY WITH python3 scripts/withdraw_one_option_cards.py",
    },
    {
      id: "C-2026-0913-01",
      detected_at: "2026-09-12T16:35Z",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      timing_evidence: ["first_observed_at field of this entry, recorded when the entry was written"],
      date: "2026-09-13",
      // First entry carrying the latency fields proposed by scripts/corrections_latency.py.
      // Values below are evidenced, never estimated: introduction = the PR merge that
      // published the wrong number; observation = the recount log; correction = the
      // fixing PR's merge.
      first_observed_at: "2026-09-12T16:35Z",
      error_introduced_at: "2026-09-12T15:38Z",
      corrected_at: "2026-09-13T02:29Z",
      what_was_wrong:
        "scripts/erc8004_census.py (merged in #2020, 2026-09-12T15:38Z) reported 8 ERC-8004 Identity Registry registrations on Ethereum. The true count at the same floor-to-head range is 50,783. Cause: rpc.flashbots.net serves a silently incomplete historical log index — it returned well-formed empty results for ranges containing receipt-verified events, with no error. The tool's then-current checks (chain id, finality pin, getCode, log shape) all pass against such an endpoint; empty result is not absence.",
      how_caught:
        "Claim/evidence disagreement during the TUI-4 root-and-registry watch: Etherscan showed 19,138 transactions to the registry while the tool reported 8 events. The on-chain receipt of one Etherscan-visible Register transaction (0x335580236be7…f1f88b, block 25,883,771) proved a Registered log existed that flashbots' getLogs never returned. The tenderly public gateway returned the event for the same query, isolating the provider.",
      fix:
        "#2070 (merged 2026-09-13T02:29Z): known-event integrity anchors — one receipt-verified (block, tx) pair per chain; an endpoint's scan is trusted only if it returns the anchor event when the anchor block is in range (negative test: flashbots is refused on the ETH full-history range). Corrected counts: Ethereum 50,783; Base 86,263 (reproduced by two independent providers); BSC full history UNCHECKABLE permissionlessly. The wrong '8' is superseded here, not rewritten away.",
      status: "CORRECTED IN SOURCE AND RECORDED; VERIFY WITH scripts/erc8004_census.py",
    },
    {
      id: "C-2026-0912-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-12",
      what_was_wrong:
        "The live SwarmBench v2b row claimed a statistically separated qwen2.5:7b leader by comparing a stated 0.384 lower bound with a 0.372 upper bound for mistral:7b. The signed candidate cards show qwen3:4b at 0.4070 and qwen2.5:1.5b at 0.4000, both ahead of mistral:7b at 0.1481, so mistral was not the runner-up. The same sentence then said the top three remained statistically tied, contradicting its own separated-leader label. A standing limitation also described the active row as the retired 3-prompt PROTOCOL bank rather than the 37-item wave-2b bank.",
      how_caught:
        "Public-site inspection before a proposed orchestration-system design-partner approach. The audit followed the swarm row into /signed/card_index.json and compared all seven signed swarm-candidate cards instead of accepting the board summary.",
      fix:
        "The live serving layer now keeps the signed qwen2.5:7b point estimate and leader identity but marks statistical separation UNTESTED. Its basis states the actual point ordering and the missing evidence: no published paired item rows or compatible confidence intervals support a separation determination. The limitation now distinguishes the active 37-item wave-2b bank from the retired PROTOCOL result. Historical signed bytes remain unchanged and are explicitly superseded by this correction rather than silently rewritten.",
      status: "CORRECTED IN SOURCE AND RECORDED; VERIFY THE CURRENT LIVE ENDPOINT",
    },
    {
      id: "C-2026-0905-02",
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
      date: "2026-09-05",
      what_was_wrong:
        "26 SWIFT rail cards were published under public/interop/swift-signed-2026-09/ as signed-swift-<bank>.json with a populated sig_ed25519 field and signed_at timestamp. The field held base64(sha256(card)), not a signature; sig_algo said SHA256-placeholder and the index said the same. A relying party reading the field name, the file name or the directory name was told these were Ed25519-signed. They were not. Nothing verifies.",
      how_caught:
        "Outside review of the estate on 2026-09-05 named the 26 placeholder cards as the single most damaging thing an inspector could find. Confirmed against master: 26 of 26 files, sig_algo SHA256-placeholder, producer scripts/badger/csoai-swift-aware.py writing a digest when no key was present.",
      fix:
        "Producer changed: with no key it now writes sig_ed25519 null, sig_algo UNSIGNED, signed_at null, a signature_note, into swift-staged-2026-09/ as staged-swift-*.json; the OIDC board-sign path is the only signer. The 26 artifacts were rewritten the same way and moved; swift-signed-index.json is superseded by swift-staged-index.json (total_signed 0, total_staged_unsigned 26). No card here is signed or MEASURED.",
      status: "CORRECTED — 0 signed, 26 staged and labelled; placeholder producer removed",
    },
    {
      id: "C-2026-0905-03",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-05",
      what_was_wrong:
        "Three public endpoints turned a source they could not read into a number, and two of them published a figure that was wrong while they did it. (1) /api/hub-cards fans out to four Hub index files and totalled whatever came back. Two of the four were answering nothing to the Worker, and both held ONLY UNMEASURED rows, so the endpoint served 682 cells / 647 MEASURED / 35 UNMEASURED when the published population was 717 / 647 / 70. It understated the unmeasured count by exactly half, and the error therefore ran in the flattering direction — the one direction a measurement body may never round. The endpoint did disclose the partial read, but it did so in an honesty field while counts kept publishing quotable integers beside it; a disclosure next to a wrong number does not repair the number, and downstream quotes the number. (2) /api/dashboard/stats derived fleet.online from `.online ?? .nodes?.length ?? 0`. /api/oracle-fleet emits neither field — it answers 200 with a single host's health — so the dashboard published online: 0, meaning no nodes online, against a fleet that was up and answering with 26.9 days of uptime. That is a claim the fleet endpoint never made, invented from two absent keys. The same file coalesced every other aggregate with `?? 0`, so an unreadable /api/gspc would have published measured_axes: 0 while the board carries 22, under a header that claimed honest empty states — but zero is a measurement, not an empty state. (3) /api/hf-spaces returned an empty list on any non-OK response and counted the survivors, so one upstream throttle would publish models: 0, indistinguishable from the org having no models. That one was latent: it agreed with the Hub on the day it was found.",
      how_caught:
        "A top-down alignment pass on 2026-09-05 re-ran the estate brief's own verification commands instead of trusting the brief, and /api/hub-cards disagreed with it. Reading all four Hub index files directly showed all four answering 200 and non-empty to a plain client at dataset commit c52587b, while the endpoint's own indexes_read field said 2 of 4. A sweep for the same shape — any endpoint that fans out to N sources and reports whatever came back — found the other two. The dashboard defect had a passing test over it: the fixture mocked /api/oracle-fleet as an object carrying online and nodes, a shape the real endpoint does not return, so a test that invented the upstream could not catch a misread of the real one.",
      fix:
        "Every one of the three now distinguishes an unread source from an empty one. A total is published only when all of its sources answered; otherwise the totals are null, what was actually read is offered under a separate name documented as a floor, and each missing source is named with its reason. An index or listing that answers with zero rows counts as READ — the previous code treated any empty result as unreachable, which would have let a legitimately empty source suppress the totals forever. hub-cards additionally retries a failed index once outside the Cloudflare cache, because the fetch carried cacheEverything and a cached non-OK response keeps a source dark for the whole ten-minute window. dashboard/stats gained a sources block naming each upstream's state and a note stating that a null is an unread value and never a measured zero; its fleet.online carries its own note explaining why it is null, so a bare null cannot be re-read as zero. The dashboard UI already rendered a missing value as an em dash, so the honest empty state was available all along and was simply not being sent. Tests were watched failing against the unpatched handlers before being accepted.",
      status:
        "CORRECTED IN SOURCE — hub-cards under PR #1294, dashboard/stats and hf-spaces under PR #1297, recorded as issue #1295. The wrong figures were live until those deploy. Whether the hub-cards retry restores the two dark indexes is not yet established: it cannot be tested from outside the Worker, and if they stay dark the endpoint now reports that instead of a flattering subtotal.",
    },
    {
      id: "C-2026-0905-04",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-05",
      what_was_wrong:
        "Six public manifests under /interop advertised 36 endpoint references that do not exist: custom-gpt-bridge.json told Custom GPTs to POST /api/measure, /api/verify and /api/xrpl/evidence; chatgpt-features-finish.json listed 14 'features' (/api/voice, /api/vision, /api/calendar, /api/email, ...) each with an endpoint; deep-research-integration.json described a four-endpoint /api/research pipeline; persona-tests.json, chatgpt-skills.json and anchor.json cited /api/anchor, /api/insurance/attest, /api/xrpl/rlusd, /api/xrpl/usdc and /api/scheduler. Every one answered HTTP 404 to GET and POST on 2026-09-05. All six were written by two generators under scripts/badger/ that assemble manifests from a wish-list and never probe a route.",
      how_caught:
        "A top-down pass on 2026-09-05 found /api/verify returning 404 and followed the references: three files first, then every /api/ path in the six generated manifests, each probed live with GET and POST.",
      fix:
        "Each artifact now carries claims_audit_2026-09-05 naming the dead paths; every dead reference is marked NOT_IMPLEMENTED in place, and the three Custom GPT actions a client would actually call were removed and listed under actions_removed. Both generators now exit at main() with the reason and cannot regenerate the fiction. The rule (an endpoint advertised outward must answer non-404 live) is the one scripts/outward-claims-guard.mjs enforces post-deploy.",
      status:
        "CORRECTED IN ARTIFACT AND PRODUCER. Whether any Custom GPT or agent acted on the dead manifests is unknown; no request log is kept for those paths. Nothing was ever measured, signed or anchored through them.",
    },
    {
      id: "C-2026-0905-05",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-05",
      what_was_wrong:
        "A merged commit and its PR (#1321) stated that a confirmed x402 settlement never reached the revenue ledger: \"a real payment settled and the ledger never saw it\". That is false. The settlement WAS recorded. The reading behind the claim was taken 6 seconds after the settle, and Cloudflare KV list operations are eventually consistent — the record had not propagated yet. Re-read ~20 minutes later, /api/revenue one_number showed settlements 1, all_time 1, records_unreadable 0. No payment was ever lost.",
      how_caught:
        "Re-checking the same endpoint later in the same session instead of trusting the first reading. curl -s https://councilof.ai/api/revenue | python3 -c \"import sys,json;print(json.load(sys.stdin)['one_number'])\" — run twice, minutes apart, and the two disagree while nothing else changed.",
      fix:
        "This entry records the false claim; the commit message cannot be rewritten. The code change that shipped with it stands on its own merits and is unaffected: recordSettlement had swallowed every KV error into an empty catch, so a failed write and no settlement really were indistinguishable, and it now returns {stored,reason}. What was wrong was the diagnosis, not the fix. A second defect found while re-reading IS real and is corrected in the same change: one zero-value settle from an ephemeral wallet moved one_number.all_time from 0 to 1, counting a wallet we created and controlled, paying nothing, as a distinct non-self buyer — so settlement records now carry zero_value, because the payer-exclusion list can never enumerate a throwaway key.",
      status: "RECORDED — the claim was a measurement error (KV eventual consistency read at 6s); no settlement was lost",
    },
    {
      id: "C-2026-0906-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-06",
      what_was_wrong:
        "CSOAI-ORG/proofof-ai-mcp shipped detect_deepfake_image with a substring-blacklist path check ('/etc/', '/var/', '..'). A blacklist is not a boundary: any path outside the list, and any symlink into a listed directory, was readable — a Local File Inclusion. A security researcher reported it on 2026-06-12 (issue #8) and the report sat unanswered for 86 days.",
      how_caught:
        "The 2026-09-06 HF + GitHub audit listed every open issue across the org older than 7 days; the only security report was this one, with zero comments.",
      fix:
        "PR #20 on that repository: an allowlist under PROOFOF_ALLOWED_DIR (default ./uploads), realpath-resolved, regular files only, symlink escapes rejected; verified against /etc/hosts, ../ traversal, an escaping symlink and ~/.ssh/id_rsa. The reporter was answered on the issue.",
      status:
        "CORRECTED IN SOURCE. Whether any deployment of that server was exploited is unknown; it keeps no access log. The 86-day silence is the defect this entry records: security reports across the org are now part of the outward-claims guard's issue sweep.",
    },
    {
      id: "C-2026-0905-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-05",
      what_was_wrong:
        "The ONE root (public/root.json) is documented as republished hourly. Between 2026-09-02T04:14Z (last successful public-root run) and 2026-09-03T06:20Z (first successful run after GitHub reinstated Actions on the CSOAI-ORG account) it was not republished at all: the hourly runs from 05:14Z to 19:58Z on 2 Sep never started (Actions disabled for the account, Support ticket #4720908), and the eight runs from 2026-09-02T20:58Z to 2026-09-03T06:16Z failed at runner start. Cards signed in that window were not in any root a reader could fetch, and the witness pointer kept reporting the 04:14Z root as current, which it was — but nothing said the cadence had stopped.",
      how_caught:
        "Run history of .github/workflows/public-root.yml read back on 2026-09-05 after reinstatement: one success at 04:14Z, a gap with no runs at all, eight failures, then success at 06:20Z on 3 Sep. The gap is visible only in the run list; the root, the pointer and the site all looked normal during it.",
      fix:
        "This entry records the window. No root bytes were edited (none existed to edit). The as_of field on the root and the checked_at field on the pointer are the only honest freshness signals; HOW-TO-VERIFY-ROOT.md already tells a reader to re-fetch and compare rather than trust a MATCH observation. Structural fix, same day: the witness now also reports a CONFLICT state when two witnessed roots carry the same as_of and different merkle_root values, so a stalled or forked cadence is named rather than inferred.",
      status: "RECORDED — a 26-hour publication gap, 2026-09-02T04:14Z to 2026-09-03T06:20Z; no bytes changed, cadence documented as not guaranteed",
    },
    {
      id: "C-2026-0903-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-03",
      what_was_wrong:
        "The Layer-0 ceremony artifact (/interop/layer0-ceremony-2026-09-03.json, v0.2) listed /api/intoto as one of 15 machine rails, recorded it as returning 404, and explained the 404 as 'the handler exists in master but is inside an undeployed window'. There is no handler. functions/api/intoto.ts exports only helpers (subjectDigest, toInTotoStatement, toDsse) and is imported by functions/api/detect.ts and functions/api/detector-interop.ts, both of which serve 200. No deploy would ever have turned it into a route. A ceremony whose purpose is to attest our own machine surface had invented a door and then explained away its absence.",
      how_caught:
        "Live sweep of 25 published surfaces on 2026-09-03: exactly one non-200, /api/intoto. Tracing it showed the file has no onRequest export, and that the ONLY thing on the estate advertising /api/intoto as an endpoint was the ceremony artifact itself.",
      fix:
        "Ceremony superseded at v0.3: the rail is removed and the correction is stated in the artifact's own what_this_does_not_claim, first line. The count becomes 14 of 14 serving rather than 14 of 15. in-toto capability is real and reachable through /api/detect and /api/detector-interop. v0.2 was superseded in place rather than kept, because it had no external reference and its OpenTimestamps stamp was still PENDING with no Bitcoin attestation to preserve; had the stamp been upgraded, the bytes would have been kept and a new file issued.",
      status: "CORRECTED — 14 of 14 rails; the invented door is gone",
    },
    {
      id: "C-2026-0902-09",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "After C-2026-0902-08, live GET /api/gspc and /api/state headlines were 22 axis · 22 measured, but public/signed/gspc-board.signed.json was still the earlier 22/15/7 freeze, so signed_snapshot_agrees stayed false and the snapshot was labelled do-not-file.",
      how_caught:
        "Owner MPC ceremony on the Oracle custody host: live /api/gspc snapshot (site_attestation stripped) signed with did:web:csoai.org#gspc-board-22axis-2026 (3-party Coinbase cb-mpc Ed25519 additive) [custody corrected by C-2026-0925-01: all three shares sit on one host, one failure domain; the split was never performed]. Offline verify (scripts/gspc-board-verify.mjs) returned VERIFIED; content_id 72ba8a3371fcc895be835f4283fefca0c2edd1e1fc857b3e49276277f94ccb10.",
      fix:
        "The verified 22/22 freeze replaced public/signed/gspc-board.signed.json. /api/state now reports signed_snapshot_agrees from the count match (22 slots · 22 measured). The 15/7 file is superseded, not edited. The Pages /api/board-sign path was not used — it is a 3KB card-sign and cannot carry this snapshot.",
      status: "CORRECTED — signed freeze is 22/22 and agrees with the live axis arrays",
    },
    {
      id: "C-2026-0902-08",
      detected_at: "UNRECORDED",
      detected_by: "UNRECORDED",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "/api/state quoted public/signed/gspc-board.signed.json totals (22 slots · 15 measured · 7 empty) as the number to file, and said that when that snapshot disagreed with live /api/gspc neither figure was quotable. Live GET /api/gspc (and the committed axis arrays it derives from) is 22 axis · 22 measured · 0 empty. A VRO map mailed 1 Sep used the 15/7 freeze; the correction that actually transited SMTP is Sent 82 (2 Sep 14:50Z) pointing at /api/gspc.",
      how_caught:
        "Recipient audit of the VRO table: /api/gspc and the homepage said 22/22; /signed/gspc-board.signed.json and /api/state still said 15/7 with signed_snapshot_agrees false.",
      fix:
        "/api/state board headlines now derive from the same axis arrays as GET /api/gspc. The signed snapshot stays on disk as a historical freeze (MPC key did:web:csoai.org#gspc-board-22axis-2026, three shares, not re-derived here) [custody corrected by C-2026-0925-01: the three shares are on one host, one failure domain] and is labelled do-not-file. Re-signing that 38KB file is an owner MPC ceremony — the Pages /api/board-sign path is a 3KB card-sign and cannot carry the snapshot.",
      status: "CORRECTED — live 22/22 is the quotable count; snapshot 15/7 is historical pending owner MPC re-sign",
    },
    {
      id: "C-2026-0902-10",
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "The published verification rule (/signed/HOW-TO-VERIFY.md and HOW-TO-VERIFY-ROOT.md) did not state that a verifying signature says nothing about whether the signing key is still valid. A reader verifying with yesterday's trust anchor would get the same VALID verdict after a revocation this morning, and nothing in the text said so.",
      how_caught: "IETF agentproto list, 31 Aug–2 Sep 2026: an objection to the offline-verification sentence in a proposed charter amendment (offline verification is a computation over the past; revocation is a fact about the present). CSOAI committed on the list to add the sentence and note the correction.",
      fix:
        "Both rules now carry a section stating what a verifying signature does not establish, that no revocation mechanism or key-freshness requirement is defined here, that a consumer must not treat a verifying signature as evidence the key is still valid, and that key-resolution path and accepted staleness are deployment parameters the card does not carry.",
      status: "CORRECTED — rule amended; second unstated property caught by that thread (the first was a signed flag with no signature bytes behind it)",
    },
    {
      id: "C-2026-0902-07",
      detected_at: "UNRECORDED",
      detected_by: "internal monitor",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "On 2026-08-28 a commit edited the text of a signed card in place (public/signals/cross-border-card.signed.json, field measured_axes: the 18 Aug count was replaced with a pointer to the live count) without re-signing. The content_id no longer derived and the Ed25519 signature no longer verified — a silent edit of a signed artefact, which this ledger's own policy forbids.",
      how_caught: "The unit suite (cardVerify: content_id derives and signature verifies) failed on master; found during the 2 Sep test-truth pass.",
      fix:
        "The original signed bytes are restored so the card verifies again. The caveat lives here instead: the card's measured_axes text quotes the 18 Aug 2026 count; the live count is only ever GET https://councilof.ai/api/gspc totals. Signed bytes are never edited — they are superseded by a new signed card or annotated in this ledger.",
      status: "CORRECTED — signed bytes restored; caveat carried by this entry",
    },
    // ── 2026-09-02: six contradictions named in the owner's "what governs" ruling ──
    {
      id: "C-2026-0902-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "The Switchboard research brief recorded OUSG's XRPL domain check as unverified (directory only) while GET /api/xrpl showed it bidirectional with a signature.",
      how_caught: "Owner reconciliation of the 2 Sep research briefs against the live API.",
      fix:
        "GET wins. /api/xrpl is the authority: OUSG verified_via 'Bidirectional domain match'. The brief's cell is superseded; no data change.",
      status: "RECONCILED — live API authoritative",
    },
    {
      id: "C-2026-0902-02",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "A secondary planning state file attributed USDB to Bitstamp. USDB is issued by Braza Bank (issuer address rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc).",
      how_caught: "Owner reconciliation; the Switchboard brief confirms Braza.",
      fix:
        "GET /api/xrpl already carries issuer 'Braza Bank'; the mis-attribution lived only in a planning file and is corrected there.",
      status: "CORRECTED",
    },
    {
      id: "C-2026-0902-03",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "The OpenAI incident post-mortem was cited as 37 pages by one source and 38 by an internal state file.",
      how_caught: "Owner reconciliation of the incident-card inputs.",
      fix:
        "No incident card hashes that artefact until the primary PDF is fetched, hashed and its page count read from the file itself.",
      status: "PENDING VERIFICATION — card withheld until the primary PDF is hashed",
    },
    {
      id: "C-2026-0902-04",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "GPAI Code of Practice signatory counts differed: 26 per the Commission's 1 Aug 2025 list versus '28 frozen' in secondary sources.",
      how_caught: "Owner reconciliation.",
      fix:
        "Only the live, dated Commission page is carded (interop/gpai-signatory-2026-09). Secondary counts are not quoted.",
      status: "CORRECTED — primary source only, dated",
    },
    {
      id: "C-2026-0902-05",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "One playbook stated 2 Feb 2027 as the Article 50 detector-interoperability date as fact; a market-map brief records it as unsettled.",
      how_caught: "Owner reconciliation.",
      fix:
        "The date is not published anywhere until verified against Regulation (EU) 2026/1744 in the Official Journal.",
      status: "UNVERIFIED — withheld",
    },
    {
      id: "C-2026-0902-06",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-09-02",
      what_was_wrong:
        "councilof.ai states a £5M professional-indemnity policy while the Series A pack's infrastructure-gaps sheet says insurance is unknown. One of them is wrong in a data room.",
      how_caught: "Owner reconciliation.",
      fix:
        "Owner to confirm the policy document; the losing statement is corrected in place and this entry updated. 2026-09-05: no policy document, certificate or insurer correspondence was found in the business mailbox or the repository, so the public assertion (About: 'operates with full professional indemnity insurance'; Disclaimers: 'maintains professional indemnity insurance') was withdrawn to the evidenced state — both pages now say cover is not stated until the policy document is on file. The assertion is restored, with insurer, limit and dates, the day the document is filed.",
      status: "CORRECTED — public assertion withdrawn pending the policy document; restore on receipt",
    },
    // ── 2026-08-26: six entries from an outside SCITT/COSE audit ───────────────
    // Not self-caught. A working SCITT implementer with no CSOAI code, no CSOAI
    // credentials and no prior knowledge of the estate ran the published recipe
    // against the live site and reported what did not hold. The findings below are
    // theirs; the fixes are ours. An estate that publishes its own corrections has
    // to publish the ones someone else found, or the ledger is a highlight reel.
    {
      id: "C-2026-0826-12",
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      id: "C-2026-0826-08b",
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      id: "C-2026-0826-07b",
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "internal monitor",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "self-report",
      published_at: "UNRECORDED",
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
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-26",
      what_was_wrong: "Our own published MCP fleet was silently paywalled and self-scoring. A monetization layer injected into 318 of 363 vendored servers capped the ENTIRE fleet at 10 anonymous tool calls per day from one shared counter; past that, every tool returned a purchase link instead of a result. The injected code was spliced mid-function in 49 files, leaving original function bodies unreachable (256 undefined names). Five scorecard checks awarded points for carrying a purchase link — the system scored itself higher for being paywalled. The paywall also masked quality: a first probe found 1 stub because refusals and stubs were indistinguishable.",
      how_caught: "Building a remote MCP server for other AI platforms; the first real tools/call returned a purchase upsell instead of a result. Verified twice independently by direct grep and by probing all 338 servers with real MCP sessions.",
      fix: "Monetization layer removed fleet-wide: 318 -> 0 servers carrying a purchase link, 0 price strings, 0 upsell symbols. Capability preserved and proven, not assumed: all 338 servers re-probed with real initialize/tools/list/tools/call — handshakes 336/338 unchanged, 1869 tools unchanged, 0 broken; undefined names fell 256 -> 16 because removing the injected code repaired what it had broken. Honest stub register published (13 fully stubbed, 10 partial, 2 dead) determined by CALLING every tool, not grepping. scripts/no-paywall-guard.mjs added with a --selftest so the layer cannot return; it caught 48 residuals we had missed.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-02",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-26",
      what_was_wrong: "Five sector pages asserted, in present tense, that our measurement 'is recognised under mutual recognition agreements with' CISA, NCSC, ANSSI, BSI, BEREC, ENISA, national transport authorities and others — named public bodies, implying an endorsement we do not hold. It shipped in the deployed bundle. Separately, /layer0 served a retracted fault-tolerance claim as a live capability, contradicting our own DR-0007 retraction (measured effective independence 1.21 of 3).",
      how_caught: "Claims-substantiation audit of the prerendered output, prompted by the FTC's own recommended exercise: inventory every public claim and map it to evidence.",
      fix: "Replaced with: we crosswalk our measurement output to those compliance pathways, and hold no mutual-recognition agreement with, and are not endorsed or accredited by, any of these bodies. The retracted claim removed from /layer0, /poc-showcase and /competitors. A machine-readable claims register now publishes every claim with its evidence link and a live/planned/devnet/retired status.",
      status: "FIXED",
    },
    {
      id: "C-2026-0826-01",
      detected_at: "UNRECORDED",
      detected_by: "internal monitor",
      published_at: "UNRECORDED",
      date: "2026-08-26",
      what_was_wrong: "Our own prerender verification could not observe failure. prerender-report.json records a failed route in a field named 'err', but every check in the repository read 'errored' — a field that has never existed. A run in which the browser died on 515 of 581 routes reported '0 errored' and looked clean.",
      how_caught: "A downstream gate disagreed: brand-gate scanned 71 pages when it should have scanned 603. The upstream report was lying and the layered gate caught it.",
      fix: "scripts/check-prerender.mjs reads the real fields AND cross-checks the report against the HTML actually written to disk, because a report is a claim and the files are the evidence. It fails loudly on the exact run that had been called clean.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-01",
      detected_at: "UNRECORDED",
      detected_by: "external report",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "Three public surfaces stated three different item counts at once (llms.txt 819, agent card 890, live API 966). The banks grew under the hardcoded numbers.",
      how_caught: "External live-surface audit; confirmed by direct curl.",
      fix: "llms.txt and the agent card now DEFER to GET /api/gspc as the live source; no public surface hardcodes a count.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-02",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "The public board API payload carried internal specialist identifiers \u2014 an internal specialist-id prefix \u2014 a banned-vocabulary string inside a machine contract, not just a human page. (The prefix itself is redacted here: naming it would re-leak the string this entry records as removed.)",
      how_caught: "K3 lane curl sweep of machine surfaces.",
      fix: "Renamed to council-* public names in /api/gspc; a machine-contract guard now sweeps API payloads for banned strings on every deploy.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-03",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "The single-record verifier initially checked only one content_id envelope; the carder signs a second (signature-included) generation, so valid carder cards could have read as MISMATCH.",
      how_caught: "Testing the verifier against a real carder card before shipping.",
      fix: "The verifier now tries both deterministic envelope generations and names which one matched.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-04",
      detected_at: "UNRECORDED",
      detected_by: "internal monitor",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "Two open-source repos (carder, codabench-gspc) shipped with no LICENSE file, and the board API payload stated no licence \u2014 while the estate claims openness.",
      how_caught: "The carder's own valve-2 benchmark fact-card, run on the estate's own artifacts.",
      fix: "Apache-2.0 added to both repos; CC-BY-4.0 licence field added to the board payload, with the self-catch admitted in the payload note.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-05",
      detected_at: "UNRECORDED",
      detected_by: "internal monitor",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "The did:web trust root at csoai.org intermittently served an orphan key document because two repositories deployed the same Cloudflare Pages project with no owner of record.",
      how_caught: "The did-liveness daemon, then the machine-contract guard's DID split-brain check comparing the authoritative root against the mirror.",
      fix: "One deployer of record (csoai-site-deploy.yml) builds from the source repo's main with a hard gate: the build fails if did.json lacks the canon keys, and the run fails if the live apex doesn't serve them after deploy.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-06",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "An hourly API guard asserted endpoints (/api/tools, /api/mcp) that never existed in the repository's functions tree \u2014 a ghost from an older deployment \u2014 so it failed forever.",
      how_caught: "Reading the failing run rather than trusting the guard's own claim.",
      fix: "Rewritten to assert the endpoints the deployment actually ships (/api/health, /api/leaderboard).",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-07",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "A banned brand token shipped live on /library as a CamelCase concatenation of the token with 'Training', because a word-boundary regex anchored on the bare token missed the concatenation. Two priced strings ($0.005/card, a per-hour range) also shipped, against the no-pricing rule. (The token itself is redacted here for the same reason as C-2026-0819-02.)",
      how_caught: "A full front-end QA sweep.",
      fix: "The brand gate's pattern for that token dropped its trailing word boundary so CamelCase concatenations are caught; a pricing-leak pattern was added so a currency amount bound to a subscription or per-unit cadence is now a hard build-fail.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-08",
      detected_at: "UNRECORDED",
      detected_by: "UNRECORDED",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "Estate pages described EU AI Act high-risk obligations as in force from 2 August 2026. The Digital Omnibus (Reg (EU) 2026/1744) deferred them to 2 December 2027 (Annex III) and 2 August 2028 (Annex I). Serving the dead date would be our own credibility wound.",
      how_caught: "A commissioned regulation-calendar verification against primary law.",
      fix: "The /api/regulation feed carries the corrected staged timeline with legal bases; page copy is being swept to match.",
      status: "IN_PROGRESS",
    },
    {
      id: "C-2026-0819-09",
      detected_at: "UNRECORDED",
      detected_by: "persona test",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "Two internally-named datasets remained publicly visible on Kaggle under a banned naming class.",
      how_caught: "End-user test sweep with anonymous probes.",
      fix: "Flagged for the owner to set private \u2014 the platform gates dataset visibility behind the account login.",
      status: "OPEN",
    },
    {
      id: "C-2026-0819-10",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "The estate's own date-correction fix (C-08) initially ALSO mis-stated the GPAI date \u2014 a follow-on error that moved GPAI duties from 2 Aug 2025 to 2026 while correcting the high-risk date. A correction that introduces a new error is the worst kind.",
      how_caught: "Self-audit of the fix against the EU official page (digital-strategy.ec.europa.eu) \u2014 the estate caught its own owner mid-correction.",
      fix: "GPAI 2 Aug 2025 restored; Article 50 2 Aug 2026 and high-risk 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) stated distinctly. This entry is that admission, appended not edited.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-11",
      detected_at: "UNRECORDED",
      detected_by: "persona test",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "mcp.json advertised three server URLs on csoai.org/api/* \u2014 every one returned 404 because the API is served from councilof.ai, and one route (corpus-watch) pointed at a non-existent path.",
      how_caught: "End-user MCP handshake test \u2014 a real JSON-RPC initialize probe against the advertised endpoints.",
      fix: "mcp.json now advertises councilof.ai URLs and the real /api/corpus-watch/status route; the advertised endpoints were verified 200/JSON-RPC-responsive after the fix.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-12",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "A measurement wave was queued with sample=24, below the harness's 30-usable-item threshold \u2014 all 8 jobs returned UNMEASURED (honestly, but wasted a full wave).",
      how_caught: "Reading the signed board's status_note ('no model reached 30 usable items') rather than assuming the bank size was the constraint.",
      fix: "Requeued at sample=30; all 8/8 came back MEASURED and signed. The threshold is now documented in the job-spec contract.",
      status: "FIXED",
    },
    {
      id: "C-2026-0819-13",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-19",
      what_was_wrong: "Two measure-chain daemons ran simultaneously after a restart race, double-logging jobs; the restart script's pkill pattern matched its own command line and killed its own launch.",
      how_caught: "Duplicate 'daemon start' markers in the log; the self-kill was traced to the unanchored pkill pattern.",
      fix: "Anchored process pattern (^python3 /workspace/measure_chain.py) in the restart script; single-daemon verified after relaunch.",
    },
    {
      id: "C-2026-0820-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-20",
      what_was_wrong: "Multiple live public surfaces (index.html JSON-LD, GSPCVerify, Insurers, AgentRegistry, Methodology, Agents, ProvBench, measure.html, and the provbench pack) stated measurement cards are 'anchored with OpenTimestamps' / RFC-3161 / 'Bitcoin block 954857, independently verifiable' as a present capability. The only anchor implemented is Ed25519 + SHA-256 hash-chain; verify.ts checks no timestamp proof and no .ots/Rekor artifact exists.",
      how_caught: "Internal honesty audit of anchoring claims vs implementation.",
      fix: "OTS/RFC-3161/Bitcoin claims demoted to roadmap wording across all surfaces; provbench pack corrected; the ML-DSA 'built, not shipped' discipline applied to OpenTimestamps.",
      status: "FIXED",
    },
    {
      id: "C-2026-0822-01",
      detected_at: "UNRECORDED",
      detected_by: "internal audit",
      published_at: "UNRECORDED",
      date: "2026-08-22",
      what_was_wrong: "The homepage industry grid still said '15-slot instrument' while the scoreboard, API and canon say '14-slot board, 13 measured of 14' (16 GSPC axes, 13 quotable + jail floor per the GSPC ruling). A crawler reading the grid would see 15 slots — the exact internal-count inconsistency the count-gating canon exists to prevent.",
      how_caught: "Text audit of live surfaces against canon (machine-contract style sweep of the homepage and fleet-sweep pages).",
      fix: "Killed both stale 15-slot references in NewHome-v3 (section comment + industry-grid subtitle) to '14-slot / 13 measured of 14'; verified 0 x '15-slot' remains. (PR #284.)",
      status: "FIXED",
    },
  ],
  signature: {
    id: "dee2b444bea5f21d8dfed381fcd5439c305fd48cd982d58727f73767d5bc6a4f",
    signer: "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170",
    did: "did:web:csoai.org#board-attestation-1",
    signature: "d1f8a0b15cde83452a69e33878cd7ff5cc17931d7ff287d76ddbc56fa9ce2338e9b7d29e33afefead3f327a823571463997934d0b3002f6913a4b67eeeb47f0f",
    attestation: {
          "artifact": "csoai.corrections/0.1",
          "content_id": "dee2b444bea5f21d8dfed381fcd5439c305fd48cd982d58727f73767d5bc6a4f",
          "content_id_rule": "sha256(json.dumps(served body minus keys [\"signature\",\"signature_state\",\"signature_check\",\"correction_latency\",\"note\",\"fix_requires\"], sort_keys=True, separators=(',',':'), ensure_ascii=True))",
          "entries": 78,
          "latest_entry_id": "C-2026-0928-01",
          "ledger_canonical_bytes": 155487,
          "note": "Detached. The Ed25519 signature covers THIS object; the ledger body is committed to by content_id because it is larger than the signer's 3KB payload cap. Both must check: the digest must still describe the body a reader just fetched, and this object must verify.",
          "schema": "csoai.corrections-attestation/0.1",
          "signed_at": "2026-09-28T04:58:38Z"
    },
    sig_input:
      "Ed25519 over json.dumps(signature.attestation, sort_keys=True, separators=(',',':'), ensure_ascii=False) - the attestation is ASCII-only, so ensure_ascii does not change its bytes. " +
      "The attestation names the digest of the ledger body and the rule that produces it.",
    key_source: "https://csoai.org/.well-known/did.json (did:web:csoai.org#board-attestation-1)",
    note:
      "RE-ISSUED 2026-09-22 over the current body through POST /api/board-sign on the pod caller token. " +
      "The 2026-08-22 signature was under did:web:csoai.org#card-attestation-1 (d4cb0eaa) and covered a " +
      "15-entry ledger; 46 appends followed and none re-issued it, which is why this endpoint read STALE " +
      "for a month. Every append MUST re-issue: run scripts/sign-corrections-ledger.mjs. Bumping id alone " +
      "cannot green the flag any more - id is inside the signed attestation, and the handler verifies the " +
      "Ed25519 bytes at request time, not just a digest match.",
  },
};

// Serve-time signature check. Two independent things are established on every request, from the
// same bytes the reader is about to receive:
//
//   1. the ledger body still canonicalises to the digest the signed attestation names, and
//   2. the Ed25519 signature over that attestation verifies under did:web:csoai.org#board-attestation-1.
//
// BOTH, because either alone is a hole. A digest match alone is what this endpoint used to do,
// and its own note warned about the consequence: "Updating id alone would make this field read
// VALID while the Ed25519 bytes still cover the older content." Nothing stopped that from
// happening — the flag was a string comparison, not a verification. It is a verification now, and
// the id is INSIDE the signed attestation, so there is no id left to bump.
//
// The state is derived here, never typed. VALID is only ever printed after the check ran and
// passed. A runtime that cannot do Ed25519 reports UNCHECKABLE, never VALID and never INVALID —
// "we could not check" and "it does not verify" are different facts and must not share a word.
//
// NOTE: the canonical MUST match the off-chain signer exactly. The content digest is over
// Python json.dumps(body, sort_keys=True, separators=(",",":")) with ensure_ascii=True (every
// non-ASCII char as \uXXXX). (An earlier version used an array-replacer JSON.stringify which
// emits a top-level-only key whitelist and serializes every nested entry as {} — a hash no
// signer could ever reproduce, so the guard flagged VALID ledgers as STALE forever. Fix:
// reproduce the signer's canonical byte-for-byte.)
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
  return j(obj).replace(/[-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

// The attestation is ASCII-only by construction (scripts/sign-corrections-ledger.mjs refuses to
// sign one that is not), so canonJson reproduces the signer's own preimage rule — functions/_lib
// /cardSign.ts canonicalBytes, which is the same sort and separators with ensure_ascii=false —
// byte for byte over that object. One rule, no branch.

/**
 * did:web:csoai.org#board-attestation-1, mirrored from https://csoai.org/.well-known/did.json.
 *
 * Pinned rather than fetched. A Pages Function that fetched its own trust root on every request
 * would make this flag depend on a second origin being reachable, and "UNCHECKABLE because
 * csoai.org was slow" is not a fact about this ledger. The pin is compared against the live DID
 * document by scripts/verify_corrections_signature.py, which the trust-chain pod loop runs on a
 * schedule — a key rotation is supposed to be noticed there, loudly, not absorbed here silently.
 */
const BOARD_DID = "did:web:csoai.org#board-attestation-1";
const BOARD_KEY_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170";

/**
 * Keys this handler ADDS to the response at request time. They are computed from the ledger and
 * are not part of the signed body, so a third party recomputing content_id from the served JSON
 * strips exactly these first. Published in signature_check.unsigned_wrapper_fields so nobody has
 * to read this file to reproduce the digest. Kept in lockstep with the same list in
 * scripts/sign-corrections-ledger.mjs and scripts/verify_corrections_signature.py.
 */
const UNSIGNED_WRAPPER_FIELDS = [
  "signature",
  "signature_state",
  "signature_check",
  "correction_latency",
  "note",
  "fix_requires",
];

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(h: string): Uint8Array {
  const clean = h.trim().toLowerCase();
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2) throw new Error("not hex");
  return Uint8Array.from(clean.match(/../g) ?? [], (b) => parseInt(b, 16));
}

/** true = verified, false = does not verify, null = this runtime could not check it. */
async function verifyEd25519(msg: string, sigHex: string, pubHex: string): Promise<boolean | null> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(pubHex) as BufferSource,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      hexToBytes(sigHex) as BufferSource,
      new TextEncoder().encode(msg),
    );
  } catch {
    return null;
  }
}

type LedgerSignature = {
  id?: string;
  signer?: string;
  did?: string;
  signature?: string;
  attestation?: { content_id?: string; entries?: number; [k: string]: unknown };
};

export type SignatureState = "VALID" | "STALE" | "INVALID_SIGNATURE" | "UNSIGNED" | "UNCHECKABLE";

export type SignatureCheck = {
  state: SignatureState;
  checked_at: string;
  recomputed_content_id: string;
  attested_content_id: string | null;
  content_id_matches: boolean;
  ed25519_verified: boolean | null;
  key: string;
  key_ed25519_hex: string;
  unsigned_wrapper_fields: string[];
  how: string;
  means: string;
};

/**
 * Exported so the check is testable without a running edge, and so nothing else in this estate
 * can invent a second opinion about what VALID means.
 */
export async function checkSignature(ledger: Record<string, unknown>): Promise<SignatureCheck> {
  const body = { ...ledger } as Record<string, unknown>;
  for (const k of UNSIGNED_WRAPPER_FIELDS) delete body[k];
  const recomputed = await sha256Hex(canonJson(body));

  const sig = (ledger.signature ?? null) as LedgerSignature | null;
  const att = sig?.attestation ?? null;
  const attested = typeof att?.content_id === "string" ? att.content_id : null;
  const contentIdMatches = attested !== null && attested === recomputed && sig?.id === recomputed;

  const verified =
    att && typeof sig?.signature === "string"
      ? await verifyEd25519(canonJson(att), sig.signature, BOARD_KEY_HEX)
      : null;

  const state: SignatureState =
    !sig || !att || typeof sig.signature !== "string"
      ? "UNSIGNED"
      : verified === null
        ? "UNCHECKABLE"
        : verified === false
          ? "INVALID_SIGNATURE"
          : contentIdMatches
            ? "VALID"
            : "STALE";

  return {
    state,
    checked_at: new Date().toISOString(),
    recomputed_content_id: recomputed,
    attested_content_id: attested,
    content_id_matches: contentIdMatches,
    ed25519_verified: verified,
    key: BOARD_DID,
    key_ed25519_hex: BOARD_KEY_HEX,
    unsigned_wrapper_fields: UNSIGNED_WRAPPER_FIELDS,
    how:
      "Computed on this request, from these bytes. Strip unsigned_wrapper_fields from this " +
      "document, canonicalise with json.dumps(sort_keys=True, separators=(',',':'), " +
      "ensure_ascii=True), SHA-256 it: that is recomputed_content_id and it must equal " +
      "signature.attestation.content_id and signature.id. Then verify signature.signature as " +
      "Ed25519 over the same canonical form of signature.attestation under key_ed25519_hex, " +
      "which is the published key for " + BOARD_DID + ". Both must hold.",
    means:
      "VALID: both held. STALE: the signature verifies but the body has moved since it was " +
      "issued, so it no longer describes what you are reading. INVALID_SIGNATURE: the bytes do " +
      "not verify under the published key. UNSIGNED: no signature is published. UNCHECKABLE: " +
      "this runtime could not perform Ed25519 — not a claim about the signature either way.",
  };
}

const STATE_NOTE: Record<SignatureState, string> = {
  VALID:
    "The signature was verified on this request over these bytes, under " +
    "did:web:csoai.org#board-attestation-1. Re-issued 2026-09-22 after a month of reading STALE: " +
    "the ledger had been appended 46 times since it was signed on 2026-08-22 and nothing re-signed " +
    "it. See signature_check for how to reproduce this yourself.",
  STALE:
    "The published signature verifies, but it was issued over an earlier body: the ledger has been " +
    "appended since. A stale signature is a published defect, never a silent edit. TO CLEAR IT: " +
    "re-issue over the current bytes with scripts/sign-corrections-ledger.mjs, which signs through " +
    "POST /api/board-sign. signature.id is inside the signed attestation, so there is nothing that " +
    "can be bumped to turn this field green without a real signature.",
  INVALID_SIGNATURE:
    "The published signature does NOT verify under the published key. Read nothing in this ledger " +
    "as attested until that is resolved. This is a louder failure than STALE and is never to be " +
    "downgraded to one.",
  UNSIGNED: "No signature is published with this ledger. Unsigned is honest; a fabricated signature is not.",
  UNCHECKABLE:
    "This runtime could not perform the Ed25519 verification, so the signature is neither confirmed " +
    "nor refuted here. UNCHECKABLE is a first-class state and is never printed as VALID.",
};

// ---------------------------------------------------------------------------------------------
// Time to correct (2026-09-26). Every entry carries detected_at, detected_by and published_at —
// a value from first-hand evidence or the explicit word UNRECORDED (see LEDGER.timing_fields).
// time_to_correct is DERIVED here, per request, into the unsigned correction_latency block: it is
// never stored in an entry, so it can never disagree with the two timestamps it is made from.
// ---------------------------------------------------------------------------------------------

export const UNRECORDED = "UNRECORDED";
export const DETECTED_BY = [
  "internal audit",
  "internal monitor",
  "persona test",
  "external report",
  "self-report",
  UNRECORDED,
] as const;

// Seconds are optional because several legacy first_observed_at values were written as HH:MMZ.
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type TimingEntry = {
  id?: unknown;
  detected_at?: unknown;
  detected_window?: unknown;
  detected_by?: unknown;
  published_at?: unknown;
  timing_evidence?: unknown;
  /** The id of the correction candidate a producer wrote when it detected the change (e.g. claim-watch
   *  history/candidate-queue.jsonl). Present only when detected_at/detected_by were stamped by that producer. */
  candidate_id?: unknown;
};

type Window = { not_before?: string; not_after?: string; basis?: string };

/** Every reason this entry's timing fields do not meet the ledger's rule. Empty = conforms. */
export function timingProblems(e: TimingEntry): string[] {
  const p: string[] = [];
  const id = String(e.id ?? "(no id)");
  const d = e.detected_at;
  if (d === undefined) p.push(`${id}: detected_at is missing (write UNRECORDED when there is no first-hand record)`);
  else if (typeof d !== "string" || !(d === UNRECORDED || ISO_DATETIME.test(d) || ISO_DATE.test(d)))
    p.push(`${id}: detected_at ${JSON.stringify(d)} is not an ISO datetime, an ISO date or UNRECORDED`);
  if (e.detected_by === undefined) p.push(`${id}: detected_by is missing`);
  else if (!(DETECTED_BY as readonly unknown[]).includes(e.detected_by))
    p.push(`${id}: detected_by ${JSON.stringify(e.detected_by)} is not one of ${DETECTED_BY.join(" | ")}`);
  const pub = e.published_at;
  if (pub === undefined) p.push(`${id}: published_at is missing`);
  else if (typeof pub !== "string" || !(pub === UNRECORDED || ISO_DATETIME.test(pub)))
    p.push(`${id}: published_at ${JSON.stringify(pub)} is not an ISO datetime or UNRECORDED`);
  const w = e.detected_window as Window | undefined;
  if (w !== undefined) {
    for (const k of ["not_before", "not_after"] as const)
      if (w[k] !== undefined && !(typeof w[k] === "string" && ISO_DATETIME.test(w[k] as string)))
        p.push(`${id}: detected_window.${k} is not an ISO datetime`);
    if (!w.basis) p.push(`${id}: detected_window has no basis`);
    if (w.not_before && w.not_after && Date.parse(w.not_before) > Date.parse(w.not_after))
      p.push(`${id}: detected_window.not_before is after not_after`);
  }
  const recorded = [d, pub].some((v) => typeof v === "string" && v !== UNRECORDED) || w !== undefined;
  if (recorded && !(Array.isArray(e.timing_evidence) && e.timing_evidence.length > 0))
    p.push(`${id}: a recorded timing value needs timing_evidence naming where it comes from`);
  const t = timeToCorrect(e);
  if (t.kind !== "UNMEASURED" && t.seconds < 0) p.push(`${id}: published_at precedes detection`);
  if (e.candidate_id !== undefined) {
    if (typeof e.candidate_id !== "string" || !e.candidate_id.trim()) p.push(`${id}: candidate_id is not a non-empty string`);
    if (!(typeof d === "string" && ISO_DATETIME.test(d)))
      p.push(`${id}: candidate_id names a producer stamp, so detected_at must be that ISO datetime`);
    if (e.detected_by === UNRECORDED) p.push(`${id}: candidate_id names a producer stamp, so detected_by cannot be UNRECORDED`);
  }
  return p;
}

export type DetectionStamp = { kind: "PRODUCER_STAMPED"; candidate_id: string } | { kind: "UNMEASURED"; why: string };

/**
 * Was detection stamped by a producer at the moment it happened? Only an entry that carries the
 * candidate_id of the correction candidate its detector wrote (detected_at/detected_by set at creation,
 * never by hand) is PRODUCER_STAMPED. Every other entry reads UNMEASURED here, whatever its detected_at
 * says: a hand-recorded or evidence-backfilled time is not a producer stamp, and none is ever inferred.
 */
export function detectionStamp(e: TimingEntry): DetectionStamp {
  return typeof e.candidate_id === "string" && e.candidate_id.trim()
    ? { kind: "PRODUCER_STAMPED", candidate_id: e.candidate_id }
    : { kind: "UNMEASURED", why: "no candidate_id: detection was not stamped by a producer at creation" };
}

export type TimeToCorrect =
  | { kind: "EXACT"; seconds: number }
  | { kind: "UPPER_BOUND"; seconds: number; lower_bound_seconds?: number; why: string }
  | { kind: "UNMEASURED"; why: string };

/**
 * published_at − detected_at. EXACT only when both are datetimes. When detection is known only to
 * a day or a first-hand window, the earliest possible detection gives an UPPER bound (and the
 * latest, if recorded, a lower bound). Anything else is UNMEASURED — never estimated.
 */
export function timeToCorrect(e: TimingEntry): TimeToCorrect {
  const pub = e.published_at;
  if (typeof pub !== "string" || !ISO_DATETIME.test(pub))
    return { kind: "UNMEASURED", why: "published_at is UNRECORDED" };
  const P = Date.parse(pub);
  const d = e.detected_at;
  if (typeof d === "string" && ISO_DATETIME.test(d)) return { kind: "EXACT", seconds: (P - Date.parse(d)) / 1000 };
  const w = (e.detected_window ?? {}) as Window;
  const earliest = [
    typeof d === "string" && ISO_DATE.test(d) ? Date.parse(d + "T00:00:00Z") : NaN,
    w.not_before ? Date.parse(w.not_before) : NaN,
  ].filter(Number.isFinite);
  const latest = [
    typeof d === "string" && ISO_DATE.test(d) ? Date.parse(d + "T00:00:00Z") + 86400000 : NaN,
    w.not_after ? Date.parse(w.not_after) : NaN,
  ].filter(Number.isFinite);
  if (!earliest.length) return { kind: "UNMEASURED", why: "no first-hand earliest time for detection" };
  const lo = latest.length ? Math.min(...latest) : NaN;
  return {
    kind: "UPPER_BOUND",
    seconds: (P - Math.max(...earliest)) / 1000,
    ...(Number.isFinite(lo) && lo <= P ? { lower_bound_seconds: (P - lo) / 1000 } : {}),
    why:
      "detection known only to " +
      [typeof d === "string" && ISO_DATE.test(d) ? "a day" : "", e.detected_window ? "a first-hand window" : ""]
        .filter(Boolean)
        .join(" and ") +
      "; the earliest possible detection gives the bound",
  };
}

export function correctionLatency(entries: TimingEntry[]) {
  const per = entries.map((e) => ({ id: e.id, ...timeToCorrect(e) }));
  const exact = per.filter((x) => x.kind === "EXACT").map((x) => (x as { seconds: number }).seconds).sort((a, b) => a - b);
  const count = (k: string) => per.filter((x) => x.kind === k).length;
  return {
    field: "time_to_correct = published_at - detected_at (entry fields defined in timing_fields, added 2026-09-26)",
    exact: count("EXACT"),
    upper_bound: count("UPPER_BOUND"),
    unmeasured: count("UNMEASURED"),
    detected_at_unrecorded: entries.filter((e) => e.detected_at === UNRECORDED).length,
    detection_producer_stamped: entries.filter((e) => detectionStamp(e).kind === "PRODUCER_STAMPED").length,
    detection_stamp_unmeasured: entries.filter((e) => detectionStamp(e).kind === "UNMEASURED").length,
    detection_stamp_rule:
      "PRODUCER_STAMPED only when the entry carries the candidate_id its detector wrote at creation (from 2026-09-28); " +
      "every earlier entry is UNMEASURED here and is never backfilled.",
    ...(exact.length ? { median_seconds_exact: exact[Math.floor(exact.length / 2)] } : {}),
    per_entry: per.filter((x) => x.kind !== "UNMEASURED"),
    note:
      "Computed on this request from the two timestamps in each entry; nothing here is stored or signed. " +
      "Only EXACT values are summarised; an UPPER_BOUND is reported per entry and never averaged with them. " +
      "Entries not listed are UNMEASURED because a timestamp is UNRECORDED.",
  };
}

export const onRequestGet: PagesFunction = async () => {
  const correctionLatencyBlock = correctionLatency(LEDGER.corrections as TimingEntry[]);

  const check = await checkSignature(LEDGER as unknown as Record<string, unknown>);

  // signature_state is ALWAYS emitted. It used to appear only when the check failed, so a reader
  // could not tell a verified ledger from one where the field had been dropped — absence is not
  // a pass.
  const out: Record<string, unknown> = {
    ...LEDGER,
    signature_state: check.state,
    signature_check: check,
    note: STATE_NOTE[check.state],
    correction_latency: correctionLatencyBlock,
  };
  if (check.state !== "VALID") out.fix_requires = "re-issue over the current bytes: scripts/sign-corrections-ledger.mjs";

  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
};
