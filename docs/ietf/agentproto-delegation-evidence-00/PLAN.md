# draft-templeman-agentproto-delegation-evidence-00 — RECONSTRUCTED, READY FOR REVIEW

`Delegation Chains in Agent Protocols: Binding Authority and Action into Verifiable Evidence`

## What this is

The XML2rfc v2 source for the second of the three sibling Internet-Drafts of 2026-09-12,
together with the verifier that proves the reconstruction is faithful.

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

It does four things:

1. renders the XML with xml2rfc and fails on any error, or any warning other than the date
   warning (a document dated in the past is expected to warn; anything else is a defect);
2. **nothing invented** — every term, section name and reference the reconstruction claims
   must exist in the recovered text;
3. **nothing omitted** — every sentence of the recovered text must appear in the render, and
   every sentence of the render must appear in the recovered text;
4. **the references agree** — every reference in the author's list must be present in the
   render with the same bibliographic content, and no URL may be lost.

**Current result: OK — nothing invented, nothing omitted.** xml2rfc 3.34.1: 0 errors, 1 warning
(the expected date). **16 sections, 148 sentences each way, 13 references, 7 defined terms**
checked.

### Why the check is made at sentence level

The recovered text is hand-set and the render is generated, and **they do not agree on where a
paragraph ends**: the hand-set text runs a heading onto the end of the paragraph before it,
runs two list items into one block, splits a paragraph across a page break, and puts the
author's address in two blocks where the render puts it in one. The *content* is the same. So
the check is made at the granularity that does not move — the sentence. A dropped sentence is
still caught; a paragraph that is merely re-divided is not reported as an omission.

Three things the verifier has to get right, each learned by being wrong first:

- the hand-set page furniture **splits** a paragraph, so the furniture is removed *and the two
  sides are joined with a space* — otherwise one paragraph reads as two;
- xml2rfc **wraps lines at hyphens** (`agent-` / `to-tool`), so both texts are de-hyphenated
  before whitespace is collapsed — otherwise a correct word reads as `agent- to-tool`;
- a definition-list term, an identifier list (`A1.`, `G1.`, `R1.`) and a bullet are each cut
  out of the block that carries them, in both texts.

The recovered text — the source of truth for the check — is a keeper file at
`~/clawd/_alignment/ietf-drafts-20260912/draft-templeman-agentproto-delegation-evidence-00.txt`.

## THE RECORDED DIFFERENCES

**Six reference URLs differ in FORM, and the verifier says so rather than tolerating them
silently.** A reference's URL is *generated* by xml2rfc from its `seriesInfo`:

| reference | the recovered text's URL | what xml2rfc derives |
|---|---|---|
| `[RFC6962]` | `https://www.rfc-editor.org/info/rfc6962` | `https://www.rfc-editor.org/rfc/rfc6962` |
| `[RFC9052]` | `https://www.rfc-editor.org/info/rfc9052` | `https://www.rfc-editor.org/rfc/rfc9052` |
| `[RFC9943]` | `https://www.rfc-editor.org/info/rfc9943` | `https://www.rfc-editor.org/rfc/rfc9943` |
| `[I-D.templeman-scitt-framing-space]` | `…/doc/draft-templeman-scitt-framing-space/` | `…/doc/html/draft-templeman-scitt-framing-space-00` |
| `[I-D.templeman-agent-log-tampering]` | `…/doc/draft-templeman-agent-log-tampering/` | `…/doc/html/draft-templeman-agent-log-tampering-00` |
| `[I-D.templeman-audit-usecase-scope]` | `…/doc/draft-templeman-audit-usecase-scope/` | `…/doc/html/draft-templeman-audit-usecase-scope-00` |

Both forms resolve to the same document. The difference is the **generator's choice**, not
authored content — and XML2rfc v2 gives a reference **no URL element at all** (`<reference>`
accepts only `seriesInfo`, `format` and `annotation`), so the form cannot be set by hand.

The verifier holds these six in a table, prints them, and **fails on any URL difference that
is not in it**. So the table is the whole of the permitted difference, and it is visible in
the file rather than hidden in a tolerance.

## THE FOUR URLS THAT WOULD OTHERWISE BE LOST

Four references have no `seriesInfo` — `[A2A]`, `[MCP]`, `[SIGSTORE]` and `[OTI]` — so xml2rfc
has nothing to derive a URL from, and the recovered text's URL would be **dropped from the
bibliography**. Measured: the first render lost `[A2A]`'s URL and `[SIGSTORE]`'s and `[OTI]`'s
entirely.

The fix is `<annotation>`, which is what carries them:

```xml
<reference anchor="A2A">
  <front>…</front>
  <annotation>https://a2a-protocol.org/latest/specification/</annotation>
</reference>
```

It renders on its own line under the entry, so the URL is in the bibliography. **That is a
change in the reconstruction's form, not in its content** — the recovered text has the URL
inline after the title; the render puts it below. The content is identical and the verifier
now agrees on every reference's bibliographic content.

## THE TWO THINGS TO SET ON THE DAY OF POSTING

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
directory. `verify_reconstruction.py` renders into a **temporary directory**, so no artefact
can be committed by accident, and a `.gitignore` says so too.

## The sibling drafts

`draft-templeman-audit-usecase-scope-00` (16 sections) is reconstructed and verified in the
same way, in `docs/ietf/audit-usecase-scope-00/`.

`draft-templeman-agent-log-tampering-00` is **not** in this branch. Its reconstruction was
started and its rendering behaviour mapped, but the worker ran out of the estate's token
allowance before writing the source. It is the remaining one, and it is the same method.
