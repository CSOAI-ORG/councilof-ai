# Five Design-Partner Approaches — 2026-09-16

**Prepared by:** Editorial conversion lane (Claude)
**Rule:** each approach names one artifact the partner can verify, one
concrete problem it solves, and one proof command. No certification
claims, no pricing in the outreach (pricing is at the 402 door).

---

## Approach 1 — AI safety benchmark organisation

**Target:** MLCommons (AILuminate benchmark)

**Problem:** Benchmark results are published but not independently verifiable.
No third party can re-derive the score from the frozen instrument.

**Artifact:** CSOAI's benchmarker scorecard for AILuminate v1.1.
`GET https://councilof.ai/interop/benchmarker-trust/scorecards-2026-09-13.json`
→ the AILuminate entry carries provenance, contamination disclosure,
and signature availability ratings.

**Approach:**

> We published a provenance scorecard for AILuminate v1.1 — the same
> grid we use to grade our own instruments. The scorecard names what
> AILuminate does well (versioned releases, published methodology) and
> where the provenance gap is (no signed reports, no content addressing).
>
> We're not asking you to change anything. We're offering to run the
> same measurement against your next release and publish the result —
> signed, verifiable, append-only. If the scorecard improves, the
> improvement is public. If it doesn't, the gap stays visible.
>
> Scorecard: https://councilof.ai/interop/benchmarker-trust/scorecards-2026-09-13.json
> Our board: https://councilof.ai/api/gspc
>
> This is measurement, not endorsement. We measure ourselves on the
> same grid.

---

## Approach 2 — MCP hosting platform

**Target:** Smithery (MCP server directory)

**Problem:** Directory listings show tool counts that don't match the
server's actual tools/list response. Stale listings mislead callers.

**Artifact:** `POST https://councilof.ai/mcp` → `tools/list` returns 13 tools.
Smithery's listing for `csoai/gspc-mcp` shows7 tools (stale).

**Approach:**

> Your listing for csoai/gspc-mcp shows7 tools. Our live tools/list
> returns 13. The discrepancy is documented:
> https://councilof.ai/interop/mcp-directories.json → smithery entry.
>
> We're not asking for special treatment. We're offering to be the
> first server that publishes a machine-readable reconciliation between
> its directory listing and its actual tools/list — so your platform
> can show a "verified tools" badge for servers that opt in.
>
> The reconciliation: https://councilof.ai/interop/mcp-directories.json
> Our tools/list: `curl -s -X POST https://councilof.ai/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`
>
> Measurement, not promotion. The badge is derived, not asserted.

---

## Approach 3 — Stablecoin issuer

**Target:** Circle (USDC issuer)

**Problem:** Stablecoin reserve attestations are published but not
independently verifiable at the contract level. No third party can
re-derive the attestation from on-chain data.

**Artifact:** CSOAI's stablecoin universe measurement — 425 assets indexed,
deep measurements for USDC across Base, Ethereum, Arbitrum, Polygon.
`GET https://councilof.ai/interop/stablecoin-universe-2026-09/index.json`

**Approach:**

> We measure stablecoin reserve attestations at the contract level —
> not from issuer reports, but from on-chain data. For USDC, we've
> measured the Base, Ethereum, Arbitrum and Polygon deployments.
>
> We're offering to publish a signed, independently verifiable
> measurement of USDC's reserve composition — updated weekly, signed
> under our public key, and anchored to a Merkle root. The measurement
> is what we observed, not a compliance verdict.
>
> Our stablecoin universe: https://councilof.ai/interop/stablecoin-universe-2026-09/index.json
> Our board: https://councilof.ai/api/gspc
>
> This is measurement, not certification. We publish what we found,
> including the gaps.

---

## Approach 4 — Enterprise AI governance team

**Target:** Fortune 500 AI governance lead (unnamed until qualified)

**Problem:** Internal AI governance teams need independent, machine-readable
evidence that their AI systems behave as claimed. Current tools produce
reports, not signed artifacts.

**Artifact:** CSOAI's signed measurement cards — 305 cards across 22 axes,
each Ed25519-signed and Merkle-anchored. `GET https://councilof.ai/root.json`

**Approach:**

> Your AI governance team needs evidence that's machine-readable,
> independently verifiable, and append-only. We produce signed
> measurement cards — 305 so far, across 22 governance axes drawn
> from statute.
>
> Each card is: a frozen instrument, a model run, a signed result.
> The signature is Ed25519 under a published DID. The root is
> Merkle-anchored. Verification is free and loginless.
>
> We're offering to run the same measurement against your AI systems
> and publish the result — signed, verifiable, and corrections-only.
> If the result is good, the card says so. If it's not, the card
> says that too.
>
> Our board: https://councilof.ai/api/gspc
> Verify a card: `python3 tools/verify/csoai_verify.py <card-url>`
>
> This is measurement, not certification. We never sell a grade.

---

## Approach 5 — Regulatory technology platform

**Target:** Ascent RegTech (regulatory compliance automation)

**Problem:** Regulatory change detection is manual and reactive. No
machine-readable, independently verified record of what changed and when.

**Artifact:** CSOAI's regulatory calendar — 15 jurisdictions, comment
deadlines, official source URLs, verification timestamps.
`measurement/calendar/regulator-doors.json`

**Approach:**

> We track regulatory comment deadlines across 15 jurisdictions —
> each entry carries the official source URL, the date we read it,
> and a verification timestamp. The NYDFS 23 NYCRR 202 comment
> period closes September 21. The Bank of England's stablecoin
> consultation closes September 22.
>
> We're offering to be the independent verification layer for your
> regulatory change detection — not replacing your tracking, but
> providing a signed, machine-readable record of what changed and
> when, derived from the official sources.
>
> Our calendar: https://councilof.ai/dashboard (regulatory doors pane)
> Our measurement: https://councilof.ai/api/state
>
> This is measurement, not legal advice. We record what we read,
> not what it means.

---

*Each approach names one fetchable artifact, one concrete problem, and one proof command. No pricing in the outreach.*
