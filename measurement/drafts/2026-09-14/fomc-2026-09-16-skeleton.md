# UNSIGNED DRAFT — owner signs after public result; dead branches deleted

**Subject:** FOMC meeting 2026-09-15/16: the decision class as stated in the official statement
**Surface (on promotion):** `public.notice` · **Engine:** none (record-from-official-source) · **Corpus:** federalreserve.gov FOMC statement + implementation note · **Drafted:** 2026-09-14T10:40Z
**Framing:** Measurement, not certification. This records what the Committee's official statement says. It is **not a prediction**, not a rates view, and not investment information.

## Premise check

| Premise | Primary source | Retrieved (UTC) | State |
|---|---|---|---|
| The September 2026 FOMC meeting is on **15–16 September 2026**, with a Summary of Economic Projections | https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm lists "September 15-16*" for 2026. The asterisk marks a meeting with a Summary of Economic Projections. | 2026-09-14T10:32Z | **VERIFIED (primary)** |
| The statement release time | Not stated on the calendar page | 2026-09-14T10:32Z | **UNMEASURED.** Use the timestamp on the statement page itself. |

No market-probability source (for example Polymarket or CME FedWatch) is cited in this draft. If one is ever added, it needs a retrieval timestamp and the label `market signal, not prediction`, and it goes outside `payload`.

## Decision-class vocabulary (closed; copied from statement text, never inferred)

`class` is exactly one of:
- `HOLD`: the statement maintains the target range for the federal funds rate
- `CUT`: the statement lowers the target range. Record `size_bp` from the range.
- `RAISE`: the statement raises the target range. Record `size_bp`.
- `OTHER`: anything else (for example an inter-meeting action). Quote the text verbatim.

## Skeleton

```json
{
  "schema": "https://councilof.ai/schema/card-v1.json",
  "surface": "public.notice",
  "subject": "FOMC 2026-09-16 statement — decision class",
  "as_of": "<statement release timestamp, UTC>",
  "source_urls": ["<federalreserve.gov/newsevents/pressreleases/monetaryYYYYMMDDa.htm>", "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm"],
  "payload": {
    "kind": "central-bank.decision-record/0.1",
    "body": "Federal Open Market Committee",
    "meeting": "2026-09-15/16",
    "class": "HOLD | CUT | RAISE | OTHER",
    "target_range_verbatim": "<quoted sentence>",
    "size_bp": "<int | null>",
    "voting_for": "<int as listed>",
    "voting_against": "<int as listed>",
    "dissent_text_verbatim": "<quoted | null>",
    "sep_released": "<true | false | UNMEASURED>"
  },
  "unmeasured": ["rationale beyond statement text", "market reaction", "future path"],
  "tags": ["UNSIGNED-DRAFT", "record-not-prediction"],
  "sha256": null,
  "sig_ed25519": null
}
```

Promotion: after the statement is published, fill in the payload from the statement page only, delete the unused class values, and hand the card to the GHA signer. This draft is not signed locally.
