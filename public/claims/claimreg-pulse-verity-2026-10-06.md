# Claim maintained: Pulse Verity Index signatures

**Status: STAGED, NOT PUBLISHED. Pulse gave a written OK on 30 September, conditional on the same outcome at the final re-check and five wording changes; this version carries both. It publishes only after Pulse's last look at this exact wording, if Pulse wants one, and the owner's yes.**

Maintainer: CSOAI Ltd (Council of AI), UK Companies House 16939677.  
Subject: Pulse Labs OpCo LLC, `thepulse.markets`. The signing API is at `mcp.thepulse.markets`.  
Follows: [Claim Maintenance v0.2](https://councilof.ai/spec/claim-maintenance/v0.2/).  
Record of reference: `claimreg-pulse-verity-2026-10-06.json` (registry digest `30d119566ae1d30ddb34c93570b6ea42294900a532b890b36f068df27eaa91ca`). This page is a readable rendering of it; where the two disagree, the JSON governs.

## In one paragraph

On 23 September 2026 we told Pulse privately that its v1 signature covered four fields: symbol, quoted value text, timestamp and grade. The venue count, dispersion, interval and cadence fields in each print sat outside it, so they could be changed without the signature noticing. Pulse added a second signature, `pulse-index-v2`, covering the full record, to its REST index prints (live 2026-09-25 00:29:58 UTC, by Pulse's deployment records), and published its key ring on a separately hosted file with a rotation note (live 2026-09-26 04:39 UTC, by Pulse's records). At the final re-check, from 2026-10-06T07:40:41Z to 2026-10-06T07:40:42Z, we checked three fresh prints against that separately hosted key. All three v2 signatures verified, and every signed line matched the field it names. A one-byte change to the signed text made each one INVALID. The same checks gave the same outcome at every earlier read (26 September, 28 September, 30 September, 1 October), and the key-ring bytes have not changed since 26 September.

**This is not an endorsement, certification, listing or partnership.** It says nothing about whether any quoted value, venue count or dispersion figure is accurate: a valid signature shows who committed to the bytes, not that the numbers are right.

## History

All times UTC, converted from message headers. "private" means the entry comes from email between us and Pulse; Pulse agreed to publication of a dated record. No private statement is used as a claim (spec §1.3).

| When (UTC) | Who | What | Source |
|---|---|---|---|
| 2026-09-19T23:09Z | Pulse | Unsolicited email to the maintainer describing the Pulse Verity MCP server; states that each observation is signed ECDSA P-256 over symbol, quoted value, timestamp and grade, and that each print also carries a venue count and dispersion. | private |
| 2026-09-20T01:29Z | CSOAI | Reply: a valid publisher signature establishes integrity and origin, not truth; asked for the signing specification, key rotation and revocation, and whether venue count and spread can be reproduced; asked Pulse not to write an adapter. | private |
| 2026-09-22T03:44Z | CSOAI | Classified contributor count and dispersion as UNMEASURED (publisher assertions that no outside party can reproduce). This message called them 'signed Pulse assertions'. That wording was inaccurate for the v1 signature, which does not cover them; see the next CSOAI entry. | private |
| 2026-09-23T05:56Z | CSOAI | ORIGINAL OBSERVATION AND PRIVATE NOTICE. Reported that a fresh BTC sample verified against Pulse's published P-256 key, that the v1 signature binds symbol, quoted value text, timestamp and grade, and that changing sources, dispersionBps, interval or cadence in the downloaded JSON leaves the signature valid. Suggested a versioned signature over the complete print. The working files of that 23 September run are not held with this record; the observation is stated here as reported in that message. | private |
| 2026-09-24T21:53Z | Pulse | Acknowledged that the signature covered symbol, quoted value, timestamp and grade but not venue count or spread; said the signature would be extended to the full record. | private |
| 2026-09-25T00:29:58Z | Pulse | FIX 1: pulse-index-v2 went live when backend release r1305 finished deploying. Time supplied by Pulse on 2026-09-27 and confirmed by Pulse on 2026-09-28 as matching its deployment records; not independently established from the current public URLs. The second, versioned signature, pulse-index-v2, over the full record, was added to the REST index prints, not to every print: Pulse's correction of 30 September says streaming frames, webhooks, history rows and meme tape still carry v1 only. v1 unchanged. | private |
| 2026-09-26T01:19Z | CSOAI | First re-verification (reported privately): v2 canonical rebuilt from the record's fields matched Pulse's, the v2 signature verified, and changing one field (source count) made it stop verifying. Noted that the key was published only on the signing API's own endpoint and suggested a separately hosted copy with a rotation note. | private |
| 2026-09-26T04:39Z | Pulse | FIX 2: the separately hosted key-ring file went live at https://thepulse.markets/.well-known/pulse-verity-keys.json. Time supplied by Pulse on 2026-09-27 and confirmed on 2026-09-28; Pulse says the file's 'updated' field reads 2026-09-25 because that field records the date in Pacific time. The current public file does not independently establish its first publication time. | private |
| 2026-09-26T13:51:30Z to 13:52:08Z | CSOAI | Second re-verification (draft record of 26 September) using the separately hosted key ring and three fresh prints; all tamper controls came back INVALID, as they should. Evidence: pulse-verity/evidence-2026-09-26/. | public |
| 2026-09-27T17:20Z | Pulse | Reviewed the draft; supplied the two UTC times above; agreed to publication on 1 October after a final re-check. In Pulse's words (the wording Pulse asked us to quote, 30 September): "Everything else about our actions reads correctly to us." | private |
| 2026-09-28T03:28:06Z to 03:32:51Z | CSOAI | Maintenance re-read: key-ring bytes unchanged from 26 September; fresh BTC, ETH and SOL v2 and v1 signatures verified; tamper controls INVALID. Evidence: pulse-verity/evidence-2026-09-28/ (RECHECK.json). | public |
| 2026-09-28T16:02Z | Pulse | Confirmed the corrected times match its deployment records. Pulse's note: "these sample tests demonstrate verification of the signed fields, not price accuracy, independent key control, or a tested rotation." Asked to see the final re-check results and any changed wording before publication. | private |
| 2026-09-30T03:53:11Z to 03:53:12Z | CSOAI | Pre-publication re-read: 3 of 3 v2 and v1 signatures verified under the separately hosted key ring; tamper controls INVALID; key-ring bytes unchanged. Evidence: pulse-verity/evidence-2026-09-30/. | public |
| 2026-09-30T21:16Z | Pulse | Corrected its /pubkey note, which had said every print carries a v2 block: the v2 block is carried by its REST price responses (price, sample, batch and archived prints), while streaming frames, webhooks, history rows and meme tape still carry v1 only. Gave a written OK to publish this record and the account of its own actions, on two conditions: the final re-check gives the same outcome, and five wording changes are made (all five are made in this version). Pulse said its OK is not an endorsement of CSOAI or of the Claim Maintenance specification, and that it keeps its right of reply. | private |
| 2026-10-01T07:50:04Z to 07:50:07Z | CSOAI | Scheduled daily re-read by the maintainer's claim watch, with the same checker (verify_pulse.py, same sha256): 3 of 3 v2 and v1 signatures verified under the separately hosted key ring; tamper controls INVALID; key-ring bytes unchanged. The PV-1 source wording had changed, as Pulse said on 30 September it would; the wording quoted under PV-1 is the corrected one. Evidence: pulse-verity/evidence-2026-10-01/. | public |
| 2026-10-06T07:40:41Z to 07:40:42Z | CSOAI | FINAL RE-CHECK recorded in this file (PV-1, PV-2, PV-4): 3 of 3 v2 signatures VALID under the separately hosted key ring; all tamper controls INVALID; key-ring bytes unchanged since 26 September. Evidence: pulse-verity/evidence-2026-10-06/. | public |

## The claims and what was measured

Each claim is Pulse's own public wording, captured verbatim. **CLAIM_MEASURED** means only that a measurement sits beside the claim. It is not a verdict.

### PV-1: CLAIM_MEASURED
> "Price, sample and batch responses also carry a v2 block that signs the WHOLE record (sources, tier, confidence, dispersionBps, interval, cadence and engine as well as the price), with the same key. A print recorded from 1 Oct 2026 also stores a v2 signature made when it was recorded, over the archived fields (the cadence band, not the cadence ages); /v1/print, /v1/sample-print and /v1/record serve it with qualityRecorded:true. An older print has no recorded quality and says qualityRecorded:false. Customer stream frames, data webhooks, /v1/history rows and meme tape blocks still carry v1 only."

Source: `https://mcp.thepulse.markets/api/index/v1/pubkey`, read 2026-10-06T07:40:41Z.

- **Window.** 2026-10-06T07:40:41Z to 2026-10-06T07:40:42Z.
- **Denominator.** 3: Keyless sample prints read in the window, one per symbol. The keyless sample is limited to BTC, ETH and SOL, so this is every symbol a stranger can read without a key, one print each.
- **Method.** For each print: (1) select the key in the separately hosted key ring whose kid equals v2.kid; (2) ECDSA P-256/SHA-256 verify v2.signature (IEEE-P1363 r||s, base64) over the UTF-8 bytes of v2.canonical as given; (3) check the first line is 'pulse-index-v2' and the field paths equal canonicalV2Fields.index in the published order; (4) JSON-parse each line's value and compare it with the field it names in the print (absent = null); (5) independently rebuild the canonical text from the print's own fields and compare it with v2.canonical; (6) controls: flip one bit of one byte inside the 'sources=' value of v2.canonical and re-verify; flip one bit of the signature and re-verify; change 'sources' in the parsed print and re-run step 4. Script: pulse-verity/verify_pulse.py beside this record (Python 3, library 'cryptography' 49.0.0).
- **Result.** 3 of 3 v2 signatures VALID under the key-ring key with every canonical line equal to its field; 3 of 3 one-byte tamper controls INVALID; 3 of 3 signature bit-flips INVALID; 3 of 3 source-count changes caught by the line check.
- **Artifact digest.** `34bc032a4822861b1ff5f6e4fac2ac90224e3a8fddff33747a8c2b6adb5c2abd`

### PV-2: CLAIM_MEASURED
> "This file is served by the thepulse.markets website, which is hosted separately from the API that signs prices. The two must list the same keys. If they ever disagree, trust neither and write to support@thepulse.markets."

Source: `https://thepulse.markets/.well-known/pulse-verity-keys.json`, read 2026-10-06T07:40:41Z.

- **Window.** 2026-10-06T07:40:41Z to 2026-10-06T07:40:41Z.
- **Denominator.** 1: Keys listed in the key ring file and in the API key ring (verificationKeys), compared by kid and by PEM text
- **Method.** GET both surfaces with User-Agent CSOAI-verify/0.1. Compare the set of kids, the PEM text of each key and activeKid. Record the host and resolved address of each response (see fetch_times.txt and the *.headers files).
- **Result.** kid sets identical (1 key); PEM identical; activeKid identical; served from two hostnames on two hosting providers; key-ring bytes identical to the 2026-09-26 read.
- **Artifact digest.** `78c37b2950fb076036e47eda0a3782524ff2688aaced8541f87536fd676fa732`

### PV-3: UNMEASURED
> "When the signing key changes, this file and the API key ring are updated the same day. A retired key stays listed here with active set to false for as long as prints it signed are served, so older prints keep verifying."

Source: `https://thepulse.markets/.well-known/pulse-verity-keys.json`, read 2026-10-06T07:40:41Z.

- **Plan.** Settleable only when a rotation occurs. Re-read both key rings weekly. When activeKid changes: check that both surfaces list the same kids on the same UTC day, that the previous kid remains listed with active=false, and that a print signed under the previous kid, held from an earlier read, still verifies against the ring. Until a rotation is observed there is nothing to measure. Observed at this read, recorded without comment: one key is listed, it is active and equals activeKid; the file carries a file-level 'updated' date (2026-09-25) and no per-key created, not-before, not-after or retired dates.
- **Artifact digest.** `929fbf0f817a689aefd11b1f86aedef93c25786ab507f0814d8e81dcfebbddc4`

### PV-4: CLAIM_MEASURED
> "v1 is unchanged and still verifies."

Source: `https://mcp.thepulse.markets/api/index/v1/pubkey`, read 2026-10-06T07:40:41Z.

- **Window.** 2026-10-06T07:40:41Z to 2026-10-06T07:40:42Z.
- **Denominator.** 3: Keyless sample prints read in the window, one per symbol (BTC, ETH, SOL)
- **Method.** Build 'pulse-index-v1\n{symbol}\n{priceText}\n{at}\n{grade}' from the print, verify the top-level signature with the key-ring key named by the print's kid; control: flip one bit in the last byte of priceText and re-verify. Script: pulse-verity/verify_pulse.py.
- **Result.** 3 of 3 v1 signatures VALID; 3 of 3 one-byte tamper controls INVALID.
- **Artifact digest.** `af5e3b9ad1d3cb1222f8326cb230bb8bae18486c9dd88b8cec53338496a7c8cf`

PV-2 limit, stated plainly: both copies of the key ring sit under one domain and one DNS operator. Whoever controls that domain controls both copies. The separation is in hosting, not in control.

## What this record does NOT establish

- It is not an endorsement, certification, listing or partnership, and not a recommendation or approval of the Pulse Verity Index. It says nothing about whether any quoted value, contributor count, dispersion, interval or cadence value is accurate: a valid signature shows who committed to the bytes, not that the numbers are right (spec 9.5). Those values remain publisher-asserted values that no outside party can reproduce, because the contributor-level inputs, weights and selection rules are not published.
- It does not show that every print is signed this way: three prints were read, from the keyless sample, in one 1-second window.
- It does not show independent control of the key: both copies of the key ring sit under one domain.
- It does not test key rotation or revocation: no rotation has happened.
- It is not a mark, grade, rating or audit of any kind, and none may be derived from it.
- Nothing here says or implies that any Pulse claim was or is false, misleading or exaggerated.

## Conflicts

No commercial relationship, membership, investment, employment or standards-body co-participation exists between CSOAI Ltd and Pulse Labs OpCo LLC. Pulse offered to write an integration on 19 September; the maintainer declined on 20 September. No payment has passed in either direction.

## Subject review

Pulse reviewed the 26 September draft and on 27 September supplied two corrected UTC times for its own actions, confirming on 28 September that they match its deployment records. In Pulse's words (the wording Pulse asked us to quote, 30 September): "Everything else about our actions reads correctly to us." On 30 September Pulse also corrected its own /pubkey note (see PV-1 and the 25 September entry) and asked for five wording changes, all made in this version. Pulse's OK covers publishing the record and the account of its own actions; it is not an endorsement of CSOAI or of the Claim Maintenance specification, and Pulse keeps its right of reply. The deployment times remain attributed to Pulse. States, measurements, limits and the publication decision remain the maintainer's (spec 1.2).

## Evidence (sha256 of the exact bytes read at the final re-check)

| URL | Read (UTC) | sha256 |
|---|---|---|
| https://thepulse.markets/.well-known/pulse-verity-keys.json | 2026-10-06T07:40:41Z | `a96d6c5c29368caa3279ecf2be9d870e7335ee514cec6b1975a5fecd32c9ddb6` |
| https://mcp.thepulse.markets/api/index/v1/pubkey | 2026-10-06T07:40:41Z | `3cccd80b0949b5495b14c66fc7a0ac4aa0751292f9c347c10e809fd43b4b2243` |
| https://mcp.thepulse.markets/api/index/v1/sample?symbol=BTC | 2026-10-06T07:40:42Z | `ed6da9afe963cac7373ec27f1180262074c0937d6647121a7a1e45f00a30283d` |
| https://mcp.thepulse.markets/api/index/v1/sample?symbol=ETH | 2026-10-06T07:40:42Z | `001bc85a375c5ba9dff8ded3ad46ceb9fe8aeba9332e6988acb89e52923e17b0` |
| https://mcp.thepulse.markets/api/index/v1/sample?symbol=SOL | 2026-10-06T07:40:42Z | `9782a5347d01ba3ce0bf04294eca6ed39959e892d25a4e380035be1c855a8268` |

Checker: `pulse-verity/verify_pulse.py` sha256 `f34e289d642baa848a27e7ebe6149847ec33cafe3d3f0b3a0e986936ad5adaaa`. To re-run from the repository root: `python3 public/claims/pulse-verity/verify_pulse.py public/claims/pulse-verity/evidence-2026-10-06`. The earlier reads are kept beside this record in `pulse-verity/evidence-2026-09-26/`, `pulse-verity/evidence-2026-09-28/`, `pulse-verity/evidence-2026-09-30/`, `pulse-verity/evidence-2026-10-01/`.

**Signature and timestamp:** UNSIGNED UNTIL PUBLICATION. On publication it is signed by sidecar under did:web:csoai.org#board-attestation-1, as the existing registries are.  
**Next scheduled read:** 2026-10-13T14:00:00Z.  
**Right of reply:** Report any defect in this record to nicholas@csoai.org. Corrections are published at https://councilof.ai/api/corrections.
