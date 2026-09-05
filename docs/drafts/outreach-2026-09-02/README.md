# Outreach drafts — 2 Sep 2026 — SEND CHECKLIST

**Lane:** outreach-drafts (docs only; branch `lane/outreach-drafts-2026-09-02`). Nothing in this
directory has been sent, posted, submitted or filled by any agent. The owner sends, one at a time,
from nicholas@csoai.org, after the checklist below passes. Not legal advice.

**Business facts every draft carries:** CSOAI LTD · Companies House 16939677 · 3rd Floor 86-90 Paul
Street, London EC2A 4NE · nicholas@csoai.org · https://councilof.ai · board `GET https://councilof.ai/api/gspc`
· verify free forever (`/gspc-verify`, `/api/proof?sha=`, `/interop/root-witness-latest.json`).

**Rules the drafts obey (from the two stress-test briefs and the estate doctrine):** buyer-led — a
measured party is never charged to be measured or ranked; a vendor commissioning evidence about its
*own* outputs is fine · measurement, never certification · hash-only where content is touched (we
attest what we are shown; we never republish bytes) · x402 is distribution, not the revenue plan; the
revenue plan is one GBP invoice from one design partner · no price appears in prose anywhere (amounts
live only inside a 402 `accepts[]` or on the owner-issued invoice) · outputs are point-in-time, not a
benchmark, not a rating.

---

## The checklist — do not send until every line is true

**(a) Endpoint gate.** For every draft, run the probe on the draft's `Artefact` line before sending.
Prod is behind master (GitHub Actions limited for the deploying actor, ticket #4720908); on
2026-09-02 ~10:30Z these all returned **404**:

```
curl -s -o /dev/null -w '%{http_code}\n' 'https://councilof.ai/api/art50/marking-evidence?preview=1&url=https://example.com/x.jpg'
curl -s -o /dev/null -w '%{http_code}\n' 'https://councilof.ai/api/witness/status'
curl -s -o /dev/null -w '%{http_code}\n' 'https://councilof.ai/api/archive'
curl -s -o /dev/null -w '%{http_code}\n' 'https://councilof.ai/api/evidence-bundle?obligation=article-50'
curl -s -o /dev/null -w '%{http_code}\n' 'https://councilof.ai/api/x402'
```

Send only when the line(s) the draft references return **200** (the Art 50 preview; the witness
status; the archive index; the evidence-bundle preview). `/api/x402` must say `rail.mode: "live"`
before any draft that mentions the agent rail is sent. A draft that links a 404 is a broken promise
and burns the counterparty; hold it.

Branch map for the endpoints (merge order is the owner's call, never this lane's):
`/api/art50/marking-evidence` → PR #1162 (`lane/art50-marking-pack`) · `/api/witness` →
`lane/witness-my-hash` (PR pending) · `/archive/*` → `lane/provable-archive-evm` (PR pending) ·
`/api/evidence-bundle`, `/api/x402`, `/api/request-attestation` → already on master, undeployed.

**(b) Cadence.** One email per day per segment (segments in `SEGMENTS.md`). Personal, plain text,
written by the owner from the draft, no bulk tool, no merge fields, no tracking pixel, no link
shortener, no HTML. If two drafts sit in the same segment, the second waits a day.

**(c) Reply-to.** From and Reply-To are both nicholas@csoai.org. No alias, no shared inbox, no CRM.

**(d) Never attach the pack.** Link the free preview (`?preview=1`) or the free public page. The
signed pack is issued on request against an invoice or a settle tx — it is never an attachment, and
never sent unasked.

**(e) Log every send.** Append one row to `LOG.md` (date · who · artefact · reply). The owner keeps
the log; agents do not write to it. A counterparty that replies "no" or "remove me" is logged and
never contacted again.

**(f) The NEVER words.** Before sending, search the final text for each of these; if one is
present, rewrite:

| Never | Why |
|---|---|
| certif* (certify, certified, certification, certificate) | measurement, never certification |
| compliant / compliance opinion / non-compliant | we quote the obligation; we never say it is met or missed |
| safe / unsafe / safety verdict | verdict-shaped |
| guarantee / warranty / assurance (as a promise) | point-in-time detection, never a guarantee |
| legal evidence / admissible / court-ready | a self-signed card carries no legal presumption |
| oracle / risk score / rating / grade / rank for sale | CRA/BMR perimeter; a rank is never sold, a grade is never sold |
| any £ / $ / € figure | no price in prose; amounts live only in a 402 `accepts[]` or on the invoice |
| "absent" / "missing" / "non-compliant" for a mark | say "not detected by method Z" |
| "verified by Council of AI" | it is *verifiable*, by anyone, free |
| "partner" / "client" naming a measured party | Franklin, Mistral, etc. are subjects or buyers, never clients of the measurement |
| proof of reserves | an attestation product with a legal meaning we do not perform |

Also never: attach files; send to a personal address that is not published on the counterparty's
own site; send to more than one person at one organisation; follow up more than once (one follow-up
after 10 working days, then stop); mention another counterparty by name; quote x402 volumes or
agent counts; describe the XRPL reader as institutional-RWA coverage; claim the rail is live before
`/api/x402` says so.

---

## What each draft file contains

`To` (role, or a published address with the page it was read on) · `Subject` (≤60 chars) · `Body`
(≤140 words: sentence 1 = the thing they get free today; sentence 2 = what is measured and what is
not; sentence 3 = the GBP-invoiced form if useful; close on one question) · `Artefact` (the link(s)
to probe) · `Signal` (the public page and date this responds to) · `status: DRAFT — HOLD until
endpoint 200`. Form doors carry the form answers instead of a body.

## Gates run on this directory

`node scripts/brand-gate.mjs` scans `.html`/`.txt` only, so the drafts were copied to `.txt` in a
scratch dir and the gate run there, plus a direct grep for the NEVER words (see the PR body). Any
quotation of a third party's own words (e.g. a vendor's "Content Credentials" definition) is a
quotation, not our framing.

## Files

- `SEGMENTS.md` — which artefact for which segment, one-paragraph offer each
- `LOG.md` — the owner's send log (empty until the first send)
- `01-armilla.md` … `10-epoch-ai.md` — the ten named counterparties
- `11-*` … `18-*` — EU-facing generative-AI providers (Article 50(2), buyer-led)
- `20-*` … `26-*` — programme doors that are forms, not emails (answers drafted, nothing submitted)
