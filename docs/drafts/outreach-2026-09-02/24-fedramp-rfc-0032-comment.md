# 24 — FedRAMP RFC-0032 public comment (GitHub Discussion, not email)

segment: E / D — machine-readable minimum information; signed OSCAL observations; free witness half
status: DRAFT — HOLD until endpoint 200 · deadline **8 Sep 2026** · nothing posted

**Door:** https://www.fedramp.gov/rfcs/ (read 2026-09-02): RFC-0032 "Offerings By Government", opened 6 Aug 2026, closes 8 Sep 2026, comments via GitHub Discussions in the rfcs repository. https://www.fedramp.gov/rfcs/0032/ (read 2026-09-02): agency-operated cloud offerings obtain FedRAMP status under the agency's own authorisation while "preserving minimum government-wide information requirements to support reuse"; the Agency Certification Package "MUST" include at least the ATO letter with FIPS-199 level, SSP, POA&M, privacy assessment, security assessment; marketplace listings "MUST supply the necessary information required by [CDS-CSO-PUB]". The discussions index https://github.com/FedRAMP/rfcs/discussions returned 403/empty to this lane — the exact RFC-0032 thread URL is UNVERIFIED; the owner opens it in a browser.
**Owner gate:** the comment links a live example. If `/api/evidence-bundle` is still 404 on 8 Sep, post the comment WITHOUT the example link (strike the bracketed sentence) — a comment linking a 404 is worse than none.

## Comment text (drafted; plain text; ≤ 250 words)

Comment from CSOAI LTD (UK 16939677), an independent measurement body that publishes signed, recomputable observations over public AI components.

On the "minimum government-wide information requirements" in RFC-0032: we suggest the minimum set be expressed as machine-readable OSCAL 1.1.0 (system-security-plan, plan-of-action-and-milestones, assessment-results) rather than as document names, so that an agency-operated offering's package can be reused by a customer agency's tooling without re-keying — the same direction RFC-0024 sets for private offerings from 30 September 2026.

Two specifics: (1) `assessment-results` should carry observations with an explicit `determination` field, so third-party observations (e.g. over an AI or LLM component the offering depends on) can be imported as evidence without being mistaken for findings; (2) each observation should carry a content hash and, where the source is external, a signature, so reuse across agencies preserves provenance. ~~[Example of the shape, free to inspect: https://councilof.ai/api/evidence-bundle?obligation=article-50 — signed observations, `determination: NONE`; verifier at https://councilof.ai/gspc-verify.]~~

**STRUCK 2026-09-04, before posting — the sentence was false.** The owner gate tested HTTP 200
and the endpoint passes it 12/12. But the gate never checked the CONTENT, and the content does
not support the claim: `/api/evidence-bundle?obligation=article-50` returns `kind: "preview"`
with `cards: []` — zero cards — and the string "determination" appears in it exactly once, as
`"relation": "relevant-to — never a determination"`, which is the opposite of "determination:
NONE". There is no OSCAL in the payload at all. A federal reviewer would have found an empty
preview one click after reading a sentence promising signed observations.

The rest of the comment stands without it: it is a suggestion about how FedRAMP should express
its minimum information set, and it does not depend on our having an example to show. Post the
example only once the bundle actually renders signed cards with a determination field.

We make no claim about any offering's control status.

— Nicholas Templeman, CSOAI LTD, nicholas@csoai.org
