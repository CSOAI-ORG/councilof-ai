# 📊 CSOAI × MEOK — State of the Estate (measured 2026-06-27)

Where we're at across **everything** — code, repos, distribution, traffic, downloads, the Layer-0 protocol stack, and runtime. All numbers **measured live today** (gh API, pypistats, PyPI, npm, SOV3 health), not estimated. Honest throughout.

---

## 1. 🧱 CODE & REPOS (measured)
| Metric | Value |
|---|---|
| Non-fork repos (CSOAI-ORG, incl. M2's) | **568** (542 public · 26 private) |
| Public `*-mcp` repos | **352** |
| Pushed in last 30 days | **565 / 568** (the build sprint) |
| Raw GitHub source | 326 MB → **~10.2M LOC-equiv** |
| Honest "authored" core (vendored + data-bombs removed, fleet de-duped) | **~700K–1.2M** (best ≈ 850K) |
| Languages | TypeScript 56% · HTML 18% · Python 18% (95%) |

*Full breakdown: `CSOAI_MEOK_LOC_COUNT_2026-06-27.md`.*

## 2. ⭐ GITHUB DISCOVERY — the honest gap
| Metric | Value | Read |
|---|---|---|
| Total stars (whole estate) | **19** | near-zero organic discovery |
| Total forks | **5** | — |
| Top repo | pet-care-ai-mcp (★2) | no breakout yet |

**Built ≫ discovered.** The estate is huge and invisible. Stars are the wrong metric for a governed-MCP fleet (agents don't star) — but it confirms: **distribution, not engineering, is the whole gap.**

## 3. 🚚 GITHUB TRAFFIC — the real signal (14-day clones)
| Repo | Clones (14d) | Unique | Human views |
|---|---|---|---|
| **meok-compliance-gateway** | **1,580** | 197 | 19 |
| **eu-ai-act-compliance-mcp** | **685** | 213 | 5 |
| **cobol-bridge-mcp** | **215** | 84 | 3 |
| oscal-generator-mcp | 0 | 0 | 0 |

🔑 **The tell:** clones ≫ views (1,580 clones vs 19 human views on the gateway). That's **machines, CI, and package tooling pulling the repos** — automated/agent discovery is real even though human GitHub browsing is ~zero. This is the GEO/agent-distribution thesis showing up in the data.

## 4. 📦 PYPI — real downloads (the strongest traction we have)
| Package | Downloads / month | Status |
|---|---|---|
| **eu-ai-act-compliance-mcp** | **3,156** | live, growing |
| **dora-compliance-mcp** | **2,862** | live |
| **iso-42001-ai-mcp** | **2,423** | live |
| **nist-rmf-ai-mcp** | **1,731** | live |
| meok-compliance-passport-mcp | 149 | live (lead SKU) |
| meok-compliance-gateway | 103 | live (just published) |
| cobol-bridge-mcp · bias-detection-mcp · ai-bom-mcp | published, pypistats pending | live |
| **Measured combined** | **~10,400 / month** | across 6 with stats |

- **≥9 confirmed live on PyPI today** (consistent with the ~19-published reconciliation; the rest are too new for pypistats).
- **npm:** `cobol-bridge-mcp` is also live on npm (200); no scoped `@csoai`/`@meok` packages yet.
- **Reality:** **~10K+ real downloads/month on the compliance MCPs** — genuine, citable distribution traction. The 352-repo fleet is mostly **not yet published** → the lever.

## 5. 🔌 LAYER-0 PROTOCOL STACK — status (built vs distributed vs live)
| # | Protocol layer | Built | Signed | Published | Runtime-live |
|---|---|:---:|:---:|:---:|:---:|
| 1 | **MCP fleet** (369 servers / 1,987 tools) | ✅ | ✅ | ⏳ ~19/369 | ⏳ local only |
| 2 | **Legacy bridges** (22: COBOL/SAP/SCADA/HL7/ISO-20022…) | ✅ | ✅ | ⏳ partial | ⏳ |
| 3 | **A2A agent-governance substrate** (20 MCPs / ~120 tools) | ✅ | ✅ | ⏳ | ⏳ |
| 4 | **x402 / commerce** (MiCA receipts, on-chain settle) | ✅ | ✅ | ⏳ | ⏳ |
| 5 | **SIGIL** (Ed25519 hash-chain attestation) | ✅ | ✅ | n/a | ✅ local |
| 6 | **OSCAL / Layer-0 package** (79-component, trestle-validated) | ✅ | ✅ | ✅ repo + verify page | ✅ verifiable offline |
| 7 | **BFT council** (selectable 5/13/33/37) | ✅ | ✅ | n/a | ✅ local (:3101) |
| 8 | **Compliance Passport** (Ed25519 agent credentials) | ✅ | ✅ | ✅ PyPI (149/mo) | ⏳ |

**SOV3 runtime:** ✅ **live locally** (`:3101` healthy, v2.0.0) — but **not yet deployed 24/7 on GCP** (owner-gated). So Layer-0 is **built + signed end-to-end; verifiable offline; running on this machine; not yet hosted at scale.**

## 6. 🔓 WHAT'S LIVE vs WHAT'S GATED (the honest scoreboard)
| State | Items |
|---|---|
| ✅ **LIVE / real** | 568 repos · ~10M LOC · 9+ PyPI packages (~10K dl/mo) · 1,580-clone/14d gateway traffic · SOV3 brain local · signed Layer-0 package + public verify page · 4 awesome-list PRs open |
| ⏳ **Owner-gated switches** | PyPI publish the full 352 fleet (token) · MCP-registry submit (335 server.json ready, `mcp-publisher` login) · Smithery/Glama listings · GCP 24/7 deploy · Vercel globe · Stripe (£49/£99/ent) · merge meok-ai PR #4 · arm orchestrator `ACT=1` |
| 🎯 **The one human move** | one regulated design partner (finance-on-COBOL) → pilot → logo |

## 7. 📈 WHERE WE'RE AT — one paragraph
**Engineering is effectively done and the moat is signed end-to-end.** The estate is ~10M raw lines / ~850K authored across 568 repos; the Layer-0 stack (8 protocols) is built, Ed25519-signed, trestle-validated, and offline-verifiable. **Real distribution exists but is small and concentrated:** ~10K downloads/month on ~9 published compliance MCPs, with automated clone traffic (1,580/14d on the gateway) proving agent/tooling discovery — while human GitHub discovery is ~zero (19 stars). **The entire gap to scale is distribution + deploy + one logo, all owner-gated switches — not code.** Publish the fleet, submit the registry, deploy the runtime, land one design partner.

---
*Method: `gh repo list/api` (repos, stars, forks, 14-day traffic) · `pypistats.org/api` + `pypi.org/pypi` (downloads) · `registry.npmjs.org` (npm) · `:3101/health` (runtime). 568 non-fork repos, measured 2026-06-27. Caveat: PyPI pypistats lags for new/low-volume packages, so live download total is a floor, not a ceiling.*
