# Public signal watch — evidence boundary (22 November 2026)

This **unqualified read-only research workflow** checks public Hugging Face, GSPC, GitHub/W3C and outside listing pages once daily. It does not post to the Council website, change the reviewed external-use feed, submit directories, request payment, download private datasets, or interpret links as customers.

## Decision boundaries

- Hugging Face dataset downloads are platform-counted events, never unique users, people, organisations, installs or verified adoption.
- The existing `/api/footprint` stages are different populations. A missing measured execution counter is **unknown**, not zero.
- `/api/institutions` and `/investors` are checked as HTTP surfaces. A response is **not** a working lead funnel or buyer acceptance.
- W3C Community Group fixture PR #25 is an outside code event, not an adopted W3C Recommendation.
- An external MCP monitor can observe uptime and tools, not real paying customers.
- An MCP directory alleges self-issued trust badges and mass listings: see https://themcpindex.com/flagged . This requires a separate, sampled repository/code review, correction where supported, and a proportionate right-of-reply. Never publish the directory's allegation as an established fact about all repositories.
- Capture includes raw response hashes only, not body content. The scheduled Actions artifact is unsigned, **not GSPC-admitted**, and may fail to fetch a source. It must not become a marketing number without human source review.
- Page markup may change. No presence/absence signal is sufficient for a trust or security conclusion.

## Acceptance

`node --test scripts/visibility/public-signal-watch.test.mjs` tests fail-closed stages and no fabricated adoption. `node scripts/visibility/public-signal-watch.mjs --out /tmp/public-signals.json` captures live (when reachable). The deployment merge owner decides whether to land the workflow after review. Manual dispatch first; only then rely on its daily schedule.

## Next evidence-gated integrations

1. Resolve production deploy parity PR #4704; verify `/api/institutions` and `/investors` from an anonymous client.
2. Review whether the open verification execution counter PR #4493 can run without personal identifiers or public tracking before promoting a count.
3. Extend the **owner-reviewed** external-use register only after evidence and role checks. These artifacts are discoveries, not an institution census.
4. Review self-issued scorecard issuer disclosures and any unsolicited metering/network behaviour in sampled MCP repositories. Document corrections with immutable commit links.
5. Deliver one paid artefact to a consenting outside recipient and record explicit acceptance and a repeat-use receipt before claiming customers.
