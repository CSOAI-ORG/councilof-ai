# AI Incident Database — request for a public machine-readable export path

**Status:** DRAFT, ready to send. Nothing has been sent. The owner sends it.
**Date:** 2026-10-30
**Lane:** `watchdog-ingest` (the 34th GSPC axis, declared slot, UNMEASURED)

## Why this request exists

We measure the public watchdog and incident layer every day. The AI Incident Database (AIID) is
the most directly relevant source in that layer — it is the corpus of real, dated AI incidents —
and it is the one source in our pinned registry we cannot ingest.

What we probed, live, on 2026-10-30:

| Probe | Result |
|---|---|
| `https://incidentdatabase.ai/api/graphql` (your documented endpoint) | **403** `{"error":"Forbidden - Invalid origin"}` — unauthenticated read refused |
| `https://incidentdatabase.ai/api/incidents?limit=1` | **404** — returns the Gatsby SPA HTML, not JSON |
| `https://incidentdatabase.ai/graphql` | **404** — same SPA shell |
| `https://incidentdatabase.ai/{download,dataset,excel}` | **404** — same SPA shell |
| `https://incidentdatabase.ai/{robots.txt,sitemap.xml}` | **404** — same 322,936-byte SPA shell (a catch-all route) |
| `https://api.incidentdatabase.ai/incidents` | no DNS resolution |
| `github.com/responsible-ai-collaborative/aiid` | reachable — `site/` only, **no `data/` directory** |
| `site/excel-export-pipeline` | present; its output is uploaded by CI to a **Cloudflare R2 bucket**, not to a public URL |

**Your own documentation agrees with our probe.** `site/docs/API_ACCESS.md` and the repository
README state that the endpoint answers a session-less request with **HTTP 401 and
`extensions.code: "API_LOGIN_REQUIRED"`**, that the endpoint requires a logged-in account as a
response to automated traffic, and that the site's incident pages are statically generated and
remain readable without an account — "the requirement applies to the API, not to browsing the
database."

So the gap is precise, and it is not a bug on our side: **there is no public, unauthenticated,
machine-readable path to the incident corpus.** Your README also names the route for exactly our
case — *"if you maintain a research or product integration and need a higher volume than a normal
account, please get in touch rather than working around the requirement."*

Today the estate's position is: **AIID is probed and recorded as a published gap**, not
ingested. It appears in `public/interop/watchdog-intake/` under `unpinned_findings` with the
reason stated and quoted, and it is named in the axis's own gap list. It is not counted as
measured, and it is not counted as zero. It is a visible hole.

We are not asking AIID to change its architecture. We are asking for one of three small things.

## The request (send as written, or adapt)

> **Subject:** Request for a public machine-readable incident export path (AI Incident Database)
>
> Hello AIID maintainers,
>
> We run a daily measurement of public watchdog and incident sources — advisory feeds, vulnerability
> databases, AI incident corpora — and we record, for each source, whether it answered, what shape
> the answer had, and the sha256 of the bytes we read. Your incident corpus is the most directly
> relevant source in that set for us, and it is the one we currently cannot read.
>
> What we found today (2026-10-30): `https://incidentdatabase.ai/api/graphql` refuses an
> unauthenticated read (403 from an origin check; your own `site/docs/API_ACCESS.md` says a
> session-less request gets 401 `API_LOGIN_REQUIRED`), and the incident pages themselves are
> static pages rather than a feed. The repository carries `site/excel-export-pipeline`, whose
> output CI uploads to an R2 bucket.
>
> Would any of these be possible?
>
> 1. **An integration account** for a public, read-only research integration — your README names
>    this route for exactly our case. We would fetch on a daily cadence, record only the HTTP
>    status, the byte count and the sha256 of the response, and the number of incident records
>    the response carries.
> 2. **A documented public JSON (or JSONL / CSV) export URL** for the incident corpus — even a
>    static file at a stable path, regenerated on your release cadence.
> 3. **A stable public URL for the Excel export you already produce**, if one is or could be
>    published — we can parse it on a slower cadence than our other feeds.
>
> What we would do with it, precisely:
>
> - Fetch it on a daily cadence, record the HTTP status, the byte count and the sha256 of the
>   response, and the number of incident records the response carries.
> - Publish our own run artifact containing **counts and per-record digests** — the incident id, the
>   date, the severity, and the hash of the fields we read — so a reader can recompute the row
>   from the same bytes.
> - Cite AIID as the source with a link, and attribute every incident to AIID.
>
> What we would **not** do:
>
> - We would not score, rate, rank or judge any incident, any system, any vendor, any model or any
>   person. Our published record is a count and a digest, not an opinion.
> - We would not republish your full corpus; we would publish our derived rows and link back to you.
> - We would not present anything we measure as a certification or a compliance determination.
> - We would not send any of it to any third party without your say-so.
>
> If a public export is not possible, a short note telling us so is genuinely useful: we will keep
> AIID recorded as a published gap rather than silently dropping it, and we will say plainly that
> the corpus is not machine-readable.
>
> Thank you — we appreciate the work that goes into the corpus.
>
> — CSOAI (Council of AI), https://councilof.ai

## Where to send it

The repository carries no single maintained contact address we could verify, so the owner picks the
channel. In rough order of what we would try first:

1. **The project's GitHub Discussions or an issue on the AIID repository** — the fastest route that
   is public, and it leaves a public record of the request.
2. **The project's documented contact address**, if one is published in the repository README.
3. **The project's community chat / Discord**, if it has a public support channel — with a copy of
   the text above.

## If nothing comes back

The gap stays visible and honest, and the fallback is already decided:

- `aiid` remains in the `unpinned_findings` of every watchdog intake run, with the probe URL and
  the observed reason.
- The estate does **not** substitute a web scrape of the rendered page for a corpus. A scraped
  listing is not the corpus, and presenting it as one would be the same silent-zero error the
  pinned registry exists to prevent.
- If AIID later publishes the Excel export at a stable URL, the fallback ingest is a slower-cadence
  parser of that export — added as a new pinned source with its own probe, never as a silent
  addition to an existing one.

## What this request must not become

The request is for **access**, not for a partnership, not for an endorsement and not for a mirror
we control. Until AIID says yes in writing, the estate's published position on AIID is
`unpinned_findings` — probed, not ingested, gap visible.
