# Council of AI — brand guidelines

Status: v1, 17 November 2026. Single source for how we name things, how we write, what the identity looks like as shipped, and which claims we may make. Where this file and a page disagree, the page is wrong. Where it disagrees with a live endpoint about a number, the endpoint is right.

Related: [docs/DOCTRINE.md](DOCTRINE.md) (the eight rules), `public/llms.txt` (the claim boundary answer engines read), `client/src/components/brand/CouncilBrand.tsx` (the lockup), `client/src/styles/index.css` (the tokens).

---

## 1. The one line

Use this line whenever someone needs one sentence: an answer engine, a directory listing, a bio, a slide.

> **Council of AI publishes signed, re-checkable measurements of AI models and agents. Verification is free. We measure; we do not certify.**

The long form, for an About box:

> Council of AI is the public name of CSOAI Ltd (England and Wales, Companies House 16939677). It runs published test instruments for AI systems and agents and publishes signed measurement records. Anyone can re-check a signed record for free. It keeps a public, dated corrections ledger, and it publishes UNMEASURED where it has not measured. It measures; it does not certify, accredit or issue conformity assessments.

Both lines carry no count, no superlative and no status. Keep them that way.

---

## 2. Names, and how to write them

| Name | What it is | Write it | Never |
|---|---|---|---|
| **Council of AI** | The public name of the organisation. | "Council of AI" in full on first mention. After that, "Council of AI" or "we". | "The Council" on its own in outward copy (it suggests a voting body of people or AIs). "CoAI", "Council-of-AI". |
| **CSOAI Ltd** | The legal entity, Companies House 16939677. Written "CSOAI LTD" in the register. | In legal text, footers, contact pages, contracts and JSON-LD `legalName`. "Council of AI (CSOAI Ltd)" where legal identity matters. | As the page-title brand. Titles end "\| Council of AI", not "\| CSOAI". |
| **CSOAI** | Short form. JSON-LD `alternateName`. | In code, package names, the HF/GitHub org names, and after the full name has appeared. | As the only name on a public page. |
| **Council OS** | The workspace product: ask, get results, check a result, connect. Served at `/dashboard/`. | As secondary context in the lockup ("Council of AI · Council OS"). The header CTA reads "Council OS". | As if it were a separate company or brand. "CouncilOS". |
| **GSPC** | The measurement board and its banks. Live at `GET /api/gspc`; the human page is `/board/`. | "the GSPC board". Quote its counts only from the live endpoint (§5). | With a typed count ("the 23-axis GSPC"). |
| **Council Space** | The interactive scenario page at `/gspc-arena/`: console, globe, towns and demos. It claims no signed run. | "Council Space". | "the arena", "GSPC Arena". |
| **head-to-head** | Two recorded models compared on one axis (the Council OS tab, the scoreboard, the signed Elo reference). | "Head-to-head" as a label; "head-to-head comparisons" in prose. | "arena" for our own comparison. Keep "arena" only in other people's names (LMArena, arena.ai, Chatbot Arena), for the general term "arena-style ranking", and in published paths, schema names and signed records. |
| **Practice** | The Council OS learning group. | "Practice" (noun); "practise" (verb). | "Learning arena". |
| **SovX** | The public name for the wrapped-asset (wrapper) measurements: the wrapper door, the CAIP-19 ledger, the token list and the wallet Snap (owner ruling, 28 Sep 2026). | "SovX". | The internal codename for the wrapper work. Do not publish it. |
| **SovSpace** | The sandbox where simulated reactions run. | "SovSpace", S-O-V. | "Soft Space", "Soft Signal" (voice transcripts get this wrong). |
| **SOVOS / sov34** | MEOK-side names. SOVOS is the system; `sov34` is one 0.5B-family operator model. | "the sov34 operator" in any measurement sentence. | "SOVOS scored …". Any framing of a MEOK model as "our model" or "the winner" on a CSOAI instrument. |
| **MEOK** | A separate sister brand: free training and gamification. It hosts SOVOS and sov34. | A separate product line, linked as such. | As a Council of AI product, or as the measured party's sponsor. CSOAI measures MEOK models only at arm's length. |
| **csoai.org** | A domain that redirects to councilof.ai. `did:web:csoai.org` is the machine identity that signs records. | `did:web:csoai.org` in verification text. | As a second public website. |

Product lines on their own domains (asisecurity.ai, proofof.ai and others) each carry their own name. Do not merge them into "Council of AI".

---

## 3. Voice

We write like a measurement lab writing for a busy reader. Plain English first, then the detail.

1. **The first screen says three things:** what this page is, what you can do here, and what is new. A reader with no context should be able to answer "what is this for?" in ten seconds.
2. **Name tasks, not systems.** Navigation reads Get results · My results · Check a result · Leaderboard · Connect · Learn. Jargon (axis, corpus, fleet, separation, attestation, chain head) goes in tooltips, expanders and the glossary. It does not go in headings.
3. **Measurement, not certification.** We say what we measured, against what, when, and what it does not establish. The phrase "measurement, not certification" belongs in footers, methodology and per-card lines. It is not a header badge.
4. **States are words, not colours.** UNMEASURED, TIE, UNTESTED, UNCHECKABLE are first-class. An empty cell stays empty. A tie is a tie.
5. **Results as a service.** Verification is free, always. Paid work is a named, delivered job: run, sign, attach, report. Agents pay per call over x402. There are no subscription tiers, no plans and no "Pro".
6. **Short sentences, active voice, British spelling** (organisation, measurement, licence for the noun).
7. **Link the evidence.** Every factual sentence about us or about someone else should be one click from its source: a signed card, an endpoint, a third party's own page.

---

## 4. Visual identity, as shipped

These are the values in the repository on 17 November 2026. Change them in the source files named here, never in a page.

### Mark and lockup

- **Mark:** `public/csoai-icon.svg`. A flat green shield (`#04624a`) with a white inner field and a four-column temple. It is flat on purpose: no gradient, no glow. The geometry holds at a 16 px favicon (four columns, 3 px minimum stroke, solid pediment). Do not redraw it, outline it, add effects or put it on a busy photo.
- **Other files:** `public/apple-touch-icon.png` (180×180), `public/og-image.png` (social card), and `public/manifest.json`, which references the SVG mark.
- **Lockup:** `CouncilBrand` (`client/src/components/brand/CouncilBrand.tsx`). It sets the mark beside the wordmark **Council of AI** (bold, tight tracking, institutional green). An optional context label follows, such as `COUNCIL OS` (uppercase, 0.14em tracking, muted), and an optional strapline sits beneath. The institution's name is always primary; a product name is always secondary context.
- **Clear space:** at least the width of one temple column around the mark. Minimum size: 16 px for the mark alone, 32 px mark height in the lockup.

### Colour (`client/src/styles/index.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand-institutional` | `#04624a` | `#6ee7b7` | Mark, wordmark, institutional headings |
| `--brand-action` / `--primary` / `--ring` | `#047857` | `#34d399` | Primary buttons, links, focus ring |
| `--brand-bright` | `#10b981` | `#6ee7b7` | Accents, chart series 1 |
| `--brand-ink` | `#04120c` | `#04120c` | Text on bright fills |
| `--surface-canvas` / `--background` | `#fafaf7` | `#050f0a` | Page ground |
| `--foreground` | `#0c1a12` | `#e9f4ee` | Body text |
| `--card` | `#ffffff` | `#0a1a13` | Cards |
| `--muted-foreground` | `#5a6b5e` | n/a | Secondary text |
| `--border` | `#e8e8e3` | n/a | Hairlines |
| `--surface-selection` / `--accent` | `#ecfdf5` | `#0f2e21` | Selected rows, soft highlights |
| `--destructive`, `--chart-5` | `oklch(0.55 0.2 25)` | n/a | Errors, INVALID |

Rules: dark mode is **green-black, never blue-black**. Green is the identity, so use it with restraint: light grounds, colour as accent. A state is always written as a word next to its colour, never as colour alone (accessibility, and §3.4).

### Type

- **Archivo** (`--font-primary`): headings and interface.
- **Inter** (`--font-sans`): body text, at least 14 px with a 12 px floor.
- **Source Serif 4** (`--font-serif`): editorial headlines and long-form reading.
- All three load from Google Fonts with `display=optional`, so the first paint is never repainted in a different font.

### Layout

8 px spacing grid; base radius `0.75rem`. Cards: a compact header with a state chip, 2–4 stat tiles, one verification line with a "verify yourself" link, and details behind an expander.

---

## 5. Claim rules

These rules are enforced in part by the repository's gates: the brand gate, facts gate, price gate and claimguard. A rule here does not stop applying because no gate catches it.

1. **Numbers come from live sources.** A count, a score or a date about the board is read from `GET /api/gspc`, `GET /api/corrections` or `GET /api/state`, and is rendered from that response. In prose, write "see the live board" or quote the number with its source and timestamp. Never type a count into copy, a template, a listing or a deck.
2. **No superlative stated as fact.** "Most advanced", "leading", "first", "only", "best", "world-class", "#1", "the standard for" are not used about ourselves unless a third party says it, we quote them with attribution, and we link their page.
3. **Show it; do not say it.** To show that we measure more openly or more rigorously than others, publish a side-by-side table of checkable properties against established bodies. Use properties such as: signed measurement records, free re-verification, public corrections ledger, deterministic grading with no model-as-judge, publishes UNMEASURED, machine-readable doors (MCP, A2A, llms.txt). Link the evidence for every cell, ours and theirs, and let the reader conclude.
4. **No regulated or statutory status.** We are not certified, accredited, approved, notified, registered, licensed or designated under any AI-verification or AI-audit scheme. We have not applied for any. When a page discusses such a scheme (for example independent verification organisations in state law), say so explicitly: the scheme exists, we are an independent measurement organisation, and we hold no status under it.
5. **"Measured" means third-party evidence.** A claim about someone else, or a "used by" or adoption claim about us, is measured only where the evidence is held by someone other than the claimant. Downloads are distribution, not adoption. A listing is not an endorsement.
6. **Memberships and partners:** name only those with a public third-party record we can link. A pending application is not a membership.
7. **Licences, per artifact:** site repository MIT; packages Apache-2.0; board data CC-BY-4.0. Never "everything is Apache-2.0".
8. **Prices:** do not publish a price that is not the live price of a real delivered job or a live x402 challenge. A 402 challenge is an offer. It is not settlement, delivery or revenue.

---

## 6. Do and don't

| Don't | Do |
|---|---|
| "The world's most advanced AI measurement body." | "Our measurement records are signed and free to re-check. Here is how we compare, property by property, with sources." |
| "CSOAI-certified model." / "Council of AI approved." | "Measured by Council of AI on 12 Aug 2026 against the GSPC governance bank. Signed card: …" |
| "Leading independent AI auditor." | "Council of AI is an independent AI measurement organisation. It holds no status under any AI-audit scheme." |
| "23 axes, 14 fleets, 335 signed cards" typed into a page or listing. | "See the live board" with a link to `GET /api/gspc`, or the number rendered from that response. |
| "SOVOS scored 89." | "The sov34 operator scored … on …" (and only as an arm's-length subject). |
| "Soft Space." | "SovSpace." |
| "Enter the arena", "Model arena", "Learning arena". | "Open Council Space", "Head-to-head", "Practice". Bench pages link "Back to the measures". |
| Title: "Measure once. Show the signed card. \| CSOAI" | Title: "Measure once. Show the signed card. \| Council of AI" |
| A blue "measurement · not certification" pill in the header. | That line in the footer, the methodology and each card's verification line. |
| "Pro plan £79/month." | "Verification is free. Paid work is a named job; agents pay per call over x402." |
| "Used by thousands of developers." | "Package downloads (distribution, not adoption): see the live footprint record." |
| A gradient or outlined version of the shield. | `public/csoai-icon.svg`, as is. |

---

## 7. Discoverability (search and answer engines)

- **Titles:** `<page name> | Council of AI`, at most 60 characters. Descriptions are 110–160 characters, specific to the page, with no counts. `client/src/lib/seoHead.ts` and `client/src/data/seo-head.json` produce both. A page must not write a second `<title>` or description.
- **Canonical:** the URL the edge serves, which is the trailing-slash form for prerendered routes. The sitemap lists only canonical, indexable URLs (`scripts/generate-sitemap.mjs`).
- **Structured data:** one Organization (`@id https://councilof.ai/#org`), referenced by every other node. The board is a Dataset whose `url` is `/board/`. The free MCP door is a WebAPI. Use FAQPage only where the page shows those questions.
- **Crawlers:** answer-engine and user agents are allowed, and training crawlers are refused (`public/robots.txt`, `Content-Signal: ai-train=no`). Edge settings are the owner's, in the Cloudflare dashboard. Keep `robots.txt` and the edge saying the same thing.
- **llms.txt** carries the claim boundary in §1 and §5, and it must name Council OS and how to connect.

---

## 8. Changing these guidelines

Open a pull request against this file. A change to names, claims or the one line needs the owner's approval. A change to tokens or assets needs the matching change in `client/src/styles/index.css` or `public/` in the same pull request.
