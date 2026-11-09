# Re-read, 13 Oct 2026: MAS consultation P015-2026 (stablecoin amendments to the Payment Services Act)

This note records a re-read of the source and strikes the 16 Sep draft text for this consultation: "Variant 2" in [docs/outreach/drafts/regulator-variants-2026-09-16.md](../../../docs/outreach/drafts/regulator-variants-2026-09-16.md). That file is listed by digest in two indexes (`public/interop/master-consolidation-2026-09-16.json` and `public/interop/white-paper-index-v0.1.json`), so its bytes are left as they are. Nothing was submitted. No form was filled in.

Not legal advice. Listing a consultation here is not a statement that CSOAI will respond to it.

## What it is

- A public consultation by the Monetary Authority of Singapore (MAS): "Consultation on Proposed Amendments to the Payment Services Act 2019 for Stablecoins Regulation", number P015-2026.
- Start date 1 September 2026. The page says: "This consultation closes at 11.59 PM on 16 October 2026." No time zone is printed. Singapore time (UTC+8) is implied, which is 15:59 UTC.
- The paper is 32 pages and asks 30 questions (Annex B). Annex C is the draft amendments, published as a second file.
- The date has not moved since the calendar entry was read on 14 Sep 2026.

## How a response is made

- Through a web form. Paragraph 1.6 of the paper links `https://go.gov.sg/stablecoin-legis-consult-2026`, which forwards to `https://form.gov.sg/6a91272d85631d22bcaf2e2f`. There is no email route. The form names `payment_services@mas.gov.sg` for technical difficulties only.
- The form (definition read, nothing entered): one answer box per question, 30 in all. 29 are optional. The box for Question 18 is marked required. Name or organisation and an email address are required. A CAPTCHA is on. There is no login.
- Responses are public by default. Paragraph 1.5: "all submissions received will be published and attributed to the respective respondent unless they expressly request MAS not to do so."
- Paragraph 1.5 also says MAS may decline to publish a submission that "appears to be libelous or offensive, or to have been submitted without human input". The form's own instruction text repeats the first two grounds and leaves out the third.

## Sources read on 13 Oct 2026 (UTC)

| Source | Read | Result |
|---|---|---|
| `https://www.mas.gov.sg/publications/consultations/2026/consultation-on-proposed-amendments-to-the-payment-services-act-for-stablecoin-regulation` | 08:14:37Z | 200 with a full browser user-agent and Accept headers. Seconds earlier, a request with a bare `Mozilla/5.0` user-agent and no Accept headers got a "service is currently unavailable" page, also with status 200. A watcher that trusts the status alone would read that as fresh |
| Consultation paper PDF linked from that page (`…consultation-paper-on-proposed-amendments-to-ps-act-for-stablecoins-regulation_vfinal.pdf`) | 08:14:43Z | 200, 32 pages, sha256 `8dbe9b625a070563…` |
| `https://go.gov.sg/stablecoin-legis-consult-2026` | 08:14:57Z | 200, forwards to the form address above |
| Form definition, `https://form.gov.sg/api/v3/forms/6a91272d85631d22bcaf2e2f` (GET only) | 08:15:09Z | 200, status PUBLIC, 38 fields, sha256 `670c19dd46965310…` |
| Companies House, company 16939677 | 08:18:10Z | CSOAI LTD, active, incorporated 2 January 2026 |

## The 16 Sep draft, checked against the live site

Each line of "Variant 2" was read against councilof.ai between 08:16Z and 08:24Z on 13 Oct 2026.

| The draft says | What the live site says | Result |
|---|---|---|
| "CSOAI Ltd (UK Companies House 16939677)" | Companies House: CSOAI LTD, 16939677, active | Supported |
| "We maintain weekly measurement of USDC, USDT, DAI across chains" | `/stablecoins/` lists USDT and DAI as unmeasured. It reports 4 of 425 indexed assets with asset-level evidence. The supply read was made "once on 2026-09-16 and not refreshed since" | Not supported |
| "including EVM chains used in Singapore's settlement corridors" | No record of ours measures use in Singapore | Not supported |
| "The MCP trust census (500 servers probed weekly)" | `/interop/mcp-trust/latest.json`: one snapshot dated 7 Oct 2026, 500 hosts, marked partial because a cap was reached. Its own text says what it does not measure. It has no stablecoin content | Off the subject of the consultation; "weekly" is not shown by the file |
| "Live, signed, free for research" with `stablecoin-universe-2026-09/index.json` and `.asset_count` | The file returns 425. It is a frozen copy of a third-party list, observed on 15 Sep 2026. The readiness ledger carries a signed commitment to its sha256, which matched the file (the signature was not re-checked here). Free to read | "Live" is not supported |
| "measurable at the contract level, weekly, by an independent third party" | The cited file's own note: "an index observation, not deep on-chain measurement" | Not supported by the file cited |
| A letter addressed to "MAS Team" | The route is a form with one box per question. The text answers none of the 30 questions | Does not fit the route |

Result: the 16 Sep text is struck. It should not be sent.

The outward word gate (`scripts/outward-gate/gate_draft.py`, master `8c89bfcc`) scores the struck text at 100%. That gate reads wording. It does not compare a claim with the live site. The table above is the check that found the problems.

## What our records can say on this consultation

Question 20 asks which factors and which data to track before a stablecoin is designated as systemic. Paragraph 4.10 of the paper names size in circulation as one factor.

One record of ours bears on that: the signed cross-ledger record dated 8 October 2026 (`csoai/cross-ledger-supply`, `xl-daily/2026-10-08/`, sha256 `c636516f49f66925…`, also served at `/api/xl`). On 13 Oct at 08:19Z its sha256 matched the signed wrapper, the Ed25519 signature verified against the `#board-attestation-1` key, and an altered copy was rejected. Counted from its bytes:

- 23 instruments covered. The issuer's own deployment list was read for 16. Three are bank services on private ledgers that an outside reader cannot read. For four, no list could be read.
- The 16 lists named 140 deployments. A supply figure was obtained for 122, on 39 ledgers.
- Of the 122: 46 verified against a state proof, 11 with a proof that was not fully verified, 65 from operators' answers (a second operator agreed for 53).
- No block was checked against validator signatures.
- Against the 7 Oct record, 29 deployments changed by more than 1%.
- The figure read is each ledger's own total (`totalSupply()` or its equivalent). It includes units the issuer holds. It is not issued, circulating or outstanding supply.

What the record does not say:

- Nothing about use in Singapore. No Singapore dollar stablecoin is among the 23.
- Nothing about reserves, redemption or who holds the units.
- It is not complete. The selection for that day named 58 instruments; the reader covers 19 of them and four bank or infrastructure services outside the selection. The other 39 are not covered.
- The newest record is dated 8 October. Dated folders exist for 11 days between 26 September and 8 October 2026.
- Correction C-2026-0926-06 (the 26 Sep record) is still pending publication. The per-deployment pages withhold the affected readings. They match on asset and ledger names in the correction text, so they also withhold some readings the correction does not change. None of the counts above depends on a withheld finding.

## Status

- A short answer to Question 20 only, built from the counts above, was prepared for the owner's decision. It is not in this repository.
- Nothing was submitted to MAS. No form was filled in. No email was sent.
- The calendar entry `mas-psa-stablecoin-amendments` in `measurement/calendar/regulator-doors.json` still carries its 14 Sep read time. The date and the quoted sentence are unchanged, so it was left alone here.
