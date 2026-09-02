# 24 — FedRAMP RFC-0032 public comment (GitHub Discussion, not email)

segment: E / D — machine-readable minimum information; signed OSCAL observations; free witness half
status: DRAFT — HOLD until endpoint 200 · deadline **8 Sep 2026** · nothing posted

**Door:** https://www.fedramp.gov/rfcs/ (read 2026-09-02): RFC-0032 "Offerings By Government", opened 6 Aug 2026, closes 8 Sep 2026, comments via GitHub Discussions in the rfcs repository. https://www.fedramp.gov/rfcs/0032/ (read 2026-09-02): agency-operated cloud offerings obtain FedRAMP status under the agency's own authorisation while "preserving minimum government-wide information requirements to support reuse"; the Agency Certification Package "MUST" include at least the ATO letter with FIPS-199 level, SSP, POA&M, privacy assessment, security assessment; marketplace listings "MUST supply the necessary information required by [CDS-CSO-PUB]". The discussions index https://github.com/FedRAMP/rfcs/discussions returned 403/empty to this lane — the exact RFC-0032 thread URL is UNVERIFIED; the owner opens it in a browser.
**Owner gate:** the comment links a live example. If `/api/evidence-bundle` is still 404 on 8 Sep, post the comment WITHOUT the example link (strike the bracketed sentence) — a comment linking a 404 is worse than none.

## Comment text (drafted; plain text; ≤ 250 words)

Comment from CSOAI LTD (UK 16939677), an independent measurement body that publishes signed, recomputable observations over public AI components.

On the "minimum government-wide information requirements" in RFC-0032: we suggest the minimum set be expressed as machine-readable OSCAL 1.1.0 (system-security-plan, plan-of-action-and-milestones, assessment-results) rather than as document names, so that an agency-operated offering's package can be reused by a customer agency's tooling without re-keying — the same direction RFC-0024 sets for private offerings from 30 September 2026.

Two specifics: (1) `assessment-results` should carry observations with an explicit `determination` field, so third-party observations (e.g. over an AI or LLM component the offering depends on) can be imported as evidence without being mistaken for findings; (2) each observation should carry a content hash and, where the source is external, a signature, so reuse across agencies preserves provenance. [Example of the shape, free to inspect: https://councilof.ai/api/evidence-bundle?obligation=article-50 — signed observations, `determination: NONE`; verifier at https://councilof.ai/gspc-verify.]

We make no claim about any offering's control status; the example is a format, not a finding.

— Nicholas Templeman, CSOAI LTD, nicholas@csoai.org
