# Evidence log — monetisation map, 06 Sep 2026 (read-only probes; written as gathered)

Rule: every row is a probe actually run on 06 Sep 2026 with the URL/command and what came back. Nothing typed from memory.

| # | Probe | Result |
|---|---|---|
| E1 | `https://gitcoin.co/` (WebFetch) | Only "campaigns" shown as ongoing: Protocol Guild (since May 2022) and TheDAO Security Fund (Jan 2026–). No GG25/GG26 round. Programs listed: Grants Stack, Allo Protocol, 120+ mechanisms directory incl. `/mechanisms/attestation-based-funding` (a taxonomy page, not a round). "AutoPGF" — 0 hits on the site or web search. |
| E2 | `https://atlas.optimism.io/` (WebFetch) | JS shell; banner not in server HTML. Web search confirms banner text "Atlas will be discontinued on September 18, 2026". |
| E3 | `https://gov.optimism.io/latest.json` | Latest: t/10845 "[Builder Grant Proposal] OP Security Proxy…" 2026-09-04; t/10817 2026-08-20; t/10797 "Re-designating the User Airdrop Allocation as the Strategic Ecosystem Fund" 2026-08-06; t/10732 "Council Dissolution Proposal: Dissolve the Grants Council" 2026-06-25. No Retro Funding 2026 / Atlas-successor thread. |
| E4 | `https://www.optimism.io/blog` | Latest posts 17 Aug, 31 Aug, 4 Sep 2026 — enterprise/privacy; nothing on Atlas or Retro Funding. |
| E5 | `https://docs.hypercerts.org/getting-started/quickstart` | Hypercerts are now AT-Protocol records (`org.hypercerts.claim.activity`) on a PDS; sign up at `https://certified.app` or use any ATProto/Bluesky account; scaffold UI `https://hypercerts-scaffold.vercel.app`; **no on-chain component, no fee**. |
| E6 | `https://docs.hypercerts.org/core-concepts/hypercerts-core-data-model` | Records: activity claim, contributorInformation, contribution, context.attachment (URLs/IPFS), context.measurement, context.evaluation, collection; strong refs (AT-URI+CID); immutable. |
| E7 | `raw.githubusercontent.com/hypercerts-org/hypercerts/main/sdk/src/resources/schema/metadata.json` | Legacy ERC-1155 metadata schema still published: required name/description/image; `hypercert` → claimdata.json (impact_scope, work_scope, work_timeframe, impact_timeframe, contributors, rights). |
| E8 | `https://deepfunding.org/` | Pilot: submissions 10 Feb–10 May 2025, $220k ($170k repos / $50k models); entry = allocation-model contest on cryptopond.xyz/modelfactory/detail/2564617; repos enter via the Ethereum dependency graph (34 seed repos → 5000+ child nodes), not by application. research.allo.capital/c/deep-funding/5 — no 2026 threads. |
| E9 | deps.dev `npm/csoai-gspc-mcp/0.2.1:dependents` | `dependentCount 0, direct 0, indirect 0`. |
| E10 | GitHub code search `csoai-gspc -org:CSOAI-ORG` | 2 hits (to identify); `"csoai/gspc"` 1 hit; `"csoai-gspc-mcp" in:file` 0. |
| E11 | npm downloads csoai-gspc-mcp | last-week 138 (23–29 Aug), last-month 138 — same number: all downloads fell in one week. PyPI csoai-gspc: last_day 87, last_week 198, last_month 198 (pypistats). Downloads ≠ dependents. |
| E12 | OSO `opensource-observer/oss-directory` code search `csoai`, `councilof` | 0 and 0 — **CSOAI-ORG is not indexed by OSO**. Contribution = PR to their repo (doctrine: never push to others' repos without an owner ruling). |
| E13 | Karma GAP `gapapi.karmahq.xyz/search?q=council of ai` | `{"communities":[],"projects":[]}` — no project. |
| E14 | Drips `drips.network/app/projects/github/CSOAI-ORG/councilof-ai/__data.json` | Project auto-exists on MAINNET as `UnClaimedProjectData`, RepoDriver accountId `80907536076136564502780732476729843181200132672668347181333351497728`, support `[]`, withdrawableBalances `[]`. Nobody has dripped to it. Claiming needs GitHub verification + a wallet tx (owner). |
| E15 | Giveth GraphQL `allProjects(searchTerm:"council of ai")` | 27 unrelated results (Safernet Brasil…); no CSOAI project. |
| E16 | Web search Base Builder Rewards | Eligibility: Basename + Builder Score ≥ 40 + Human Checkmark; weekly, rewards to Farcaster primary wallet; builderscore.xyz → 301 → talent.app. |
| E17 | Web search Octant | v1 sunset; Golem Foundation rounds on Octant v2 (docs.octant.app/en-EN/propose-a-project.html → 403 to fetch). |
| E18 | Web search EF ESP | Aggregators cite rolling + a "July 2, 2026 deadline"; esp.ethereum.foundation home fetched, status not stated on home; /applicants to check. |
| E19 | Web search Sovereign Tech | Standards network closed 19 May 2026; Fellowship closed 6 Apr 2026; Fund = rolling (prior pack 05 Sep: OPEN, min €50k). sovereign.tech/programs/fund → 403 to fetch today. |
| E20 | `docs/product/SETTLED-DOORS-2026-09-06.md` | exists on origin/master: tx 0xac49241b…1c91, 0.02 USDC, self. `/api/revenue` one_number rule: null-never-0 until a non-self payer settles. |
| E21 | `https://councilof.ai/root.json` | as_of 2026-09-06T04:29:27Z, card_count 166. |
| E22 | `sovereign.tech/programs/fund` via curl (WebFetch 403) | "Applications are accepted exclusively through our application platform"; ">€50,000 (current minimum)"; no deadline text → OPEN rolling. |
| E23 | `gov.gitcoin.co/latest.json` | Newest: t/25366 "Social contract of the gitcoin public goods treasury [2020–2026]" 2026-08-31; t/25365 "TEMP CHECK — where does legitimacy come from" 2026-08-25; t/25358 Governor upgrade 2026-08-08; t/25353 2026 budget second tranche 2026-08-04. No round. |
| E24 | `esp.ethereum.foundation/applicants` | process Browse→Apply→Review→Decision; "free, open-source, non-commercial"; "3–6 weeks"; "paid on-chain in ETH". `/applicants/project-grants`, `/applicants/small-grants`, `/wishlist` → 404. |
| E25 | `alpha-omega.dev/grants/how-to-apply/` | windows "January, April, July, October", 1st→last day; $50k–$100k typical; OSI licence; Google Form. |
| E26 | `coinbase.com/developer-platform/discover/launches` (via r.jina.ai) | no 2026 entries; last builder-grant items are Summer 2025. |
| E27 | `docs.giveth.io/projectverification` | GIVbacks criteria: Action and Impact / Reputation / Public Good ("not personal gain"). |
| E28 | `github.com/open-source/github-secure-open-source-fund` | "open on a rolling basis"; $10,000 ($6k/$2k/$2k); solo or ≤3; Sponsors region; 15 h over 3 weeks; Microsoft Form. |
| E29 | `manifund.org/ais-funder-bulletin` | "Last updated September 1, 2026": Coefficient Giving, SFF (speculation rolling; main round closed 22 Apr 2026), Lightcone Commons (closed 23 Aug; rolling; ~23 Jan 2027), BlueDot (rapid ≤$10k), TAIF ($10k–150k), Manifund ($0–500k rolling). |
| E30 | `funds.effectivealtruism.org/funds/transformative-ai` | "We are always open to applications." "$10k-$150k … rarely exceed $300k"; funds infrastructure, demonstration projects; apply `https://av20jp3z.paperform.co/?fund=Transformative%20AI%20Fund`. |
| E31 | Web search Builder Rewards 2026 | "Summer League" 20 ETH/week to 22 Sep, 1 ETH cap — year unverifiable; `talent.app/~/ecosystems/base` 404; `docs.talentprotocol.com` NXDOMAIN; `builderscore.xyz` 301 → talent.app. |
| E32 | `docs.base.org/get-started/get-funded` | lists Base Ecosystem Fund (pre-seed/seed **investment**, `base.org/ecosystem-fund/apply`) and Base Batches ("$100K investment"); Builder Grants not on that page; `gitcoin.co/apps/base-builder-grants`: retroactive 1–5 ETH, "Anyone can nominate a builder via a public form" — form URL not located. |
| E33 | `docs.octant.app/…` | 403 / JS-gated on every path tried (en-EN/propose-a-project.html, /docs/projects/, root via r.jina.ai → 404). Unverified today. |
| E34 | Web search Arbitrum Questbook | `arbitrum.questbook.app` domain allocators, up to $50k, Dev Tooling domain — requires building on Arbitrum. |
| E35 | `voteagora/op-atlas` PR #1518 (2026-08-21) | Banner: "Atlas will be discontinued on September 18, 2026. Please save any information you need before then." Body: "banner by end of August → disable login → shut down Sept 18". No successor URL anywhere in the repo (code search "September 18"). `ethereum-optimism/Retro-Funding` last push 2026-02-11. |
| E36 | `gov.optimism.io/t/10797.json` | Strategic Ecosystem Fund = "deploying tokens to grow OP Mainnet and OP Enterprise"; zero mentions of Atlas / Retro / builder. |
| E37 | producer run | `python3 scripts/grants/hypercert_metadata_from_cards.py` → "5 hypercerts, 10 files written"; second run `--check` → "0 files would change". |
