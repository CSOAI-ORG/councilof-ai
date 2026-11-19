# draft-templeman-audit-usecase-scope-00 — RECONSTRUCTED, READY FOR REVIEW

`Scoping the AUDIT Use Case for Transparent Measurement Evidence of AI Systems`

## What this is

The XML2rfc v2 source for one of the three sibling Internet-Drafts of 2026-09-12, together
with the verifier that proves the reconstruction is faithful.

## Why a reconstruction and not a revision

The three sibling drafts were **never submitted** (measured: the IETF archive holds
`draft-templeman-scitt-framing-space-00` and `draft-templeman-scitt-measurement-capsule-00`,
and **no** document under our three docNames). So there is no posted `-00` XML to build a
`-01` from, and no `make_skeleton.py` input to fetch. Only their rendered text survives, and
that text is **hand-set**: its page footers, page numbers and table of contents were written
by hand, which is why it corresponds to no xml2rfc output. The content is recovered from it;
the structure is rebuilt; and the parts the hand-written original lacked are now generated
properly — the table of contents, the page footers, *Status of This Memo* and *Copyright
Notice* all come from xml2rfc.

**The `-00` suffix is correct**, not a leftover: this is the first submission of this
document, so it is a `-00`.

## How it is checked

```bash
python3 verify_reconstruction.py
```

It does three things:

1. renders the XML with xml2rfc and fails on any error, or any warning other than the date
   warning (a document dated in the past is expected to warn; anything else is a defect);
2. **nothing invented** — every term, section name and reference the reconstruction claims
   must exist in the recovered text;
3. **nothing omitted** — every section and reference in the recovered text must appear in the
   render.

Current result: **OK — nothing invented, nothing omitted. xml2rfc 3.34.1: 0 errors, 0
warnings other than the expected date.** 16 sections, 17 defined terms and states, 8
references checked.

The recovered text (the source of truth for the check) is a keeper file at
`~/clawd/_alignment/ietf-drafts-20260912/draft-templeman-audit-usecase-scope-00.txt`.

## THE ONE EDITORIAL CHANGE, stated plainly

The author's reference list names **RFC 8949 (CBOR)** but the prose never cites it, and
xml2rfc says so: *"Unused reference: There seems to be no reference to [RFC8949] in the
document"*. The document discusses CBOR objects, so the citation is added where CBOR is first
named:

> The framing hazards for digest-based identifiers over CBOR [RFC8949] objects are measured in
> the sibling document [I-D.templeman-scitt-framing-space], which this document cites rather
> than repeats.

**That is the only change in meaning.** Everything else is the recovered text.

## The two things to set on the day of posting

Both are the estate's own convention from the capsule draft
(`docs/ietf/measurement-capsule-01/`): *no number is carried over from the previous revision*.

1. **The date.** The file carries the recovered date, 12 September 2026, and xml2rfc warns
   that it is more than three days away from today — correctly, because this document has
   been waiting to be posted. Set `<date year="YYYY" month="Month" day="D"/>` to the posting
   day.
2. **The expiry follows the date.** xml2rfc derives it from the date and the `-00` suffix:
   12 September 2026 + 185 days = **16 March 2027**, which is the expiry the recovered text
   carries. Move the date and the expiry moves with it; nothing is typed twice.

## What is NOT committed here

The rendered `.txt` and `.html` are build artefacts, exactly as in the capsule draft's
directory. `verify_reconstruction.py` regenerates the text render itself, so nothing needs to
be kept.

## The other two drafts

`draft-templeman-agent-log-tampering-00` (13 pp.) and
`draft-templeman-agentproto-delegation-evidence-00` (12 pp.) are the same shape and the same
method: recover the content from the hand-set text, rebuild the structure, and check it two
ways. Their recovered texts are beside this one in
`~/clawd/_alignment/ietf-drafts-20260912/`.
