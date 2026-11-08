# Published-surface master checklist

**Owner:** CSOAI Ltd (Council of AI) · **Applies to:** every surface a reader, a crawler or an agent can reach
**Written:** 2026-11-06 · **Lane:** `published-surface-alignment-20261106`

This is the checklist for the whole public estate. It is written to be *run*, not
read once: every rule below names the thing that checks it, so a rule with no
checker is visible as a gap rather than as a promise.

Scope: `councilof.ai` (the measurement surface), `csoai.org` (its mirror and the
DID apex), `meok.ai` (the product), the GitHub profile and the 949-repository
GitHub account, Hugging Face, PyPI, npm, the MCP registries, Wikidata and the
public JSON under `public/`.

---

## 0. The one rule that everything else follows from

> **Nothing about the board is typed. It is read.**

The board publishes several counts and they are not interchangeable:

| Number | Meaning | Where it comes from |
|---|---|---|
| axes | axes the board serves | `totals.axes` |
| measured axes | axes with a run behind them | `totals.measured_axes` |
| model fleets | axes answered by a fleet of models | `totals.model_fleets` |
| separated / tie / untested | three states, never folded together | `totals.separation_public_count` |

A **measured** axis is not a **separated** axis: 34 axes are measured and 0 of
the 14 model-comparison axes separated a leader — 7 are TIE, 7 are UNTESTED. A
TIE is not a win and an UNTESTED axis is not a tie. Growth is published;
shrinkage is drift.

**The consequence:** a number that appears in prose, a page, a README, a badge
or a profile must be read from the payload at the moment it is written, or it
must be linked to the endpoint that serves it. A number typed by hand goes
stale, and the reader cannot tell.

This rule has already cost twice. `CLAUDE.md` carried `board LIVE 22·22·0`
from 2026-09-01 until 2026-11-06; the GitHub profile carried `Slots 22 /
Measured 22` and a dead Merkle root `d438fb12`; and the homepage's axis links
were built from a hand-typed list of slugs that the board outgrew.

---

## 1. Wording

### 1.1 Plain language

The register below is the estate's plain-language vocabulary. If a word is not
on this list and a reader outside the organisation would not use it, rewrite it.

| Instead of | Write | Why |
|---|---|---|
| `permissless`, `permissionless` | "no permission needed", "open to anyone" | internal coinage; reads as a bug to a searcher |
| `black swan` | "an event nobody planned for" | internal codename, and it has leaked into published JSON |
| `sovos`, `sov6`, `SOV-*`, `OWEM`, `SIGIL`, `crown jewels` | the thing itself | internal codenames; never in public output |
| `revolutionary`, `game-changing`, `world-changing`, `unprecedented` | say what it does | unverifiable superlatives |
| `cutting-edge`, `state-of-the-art`, `best-in-class`, `next-gen` | say what is measured | marketing words carry no information |
| `AI-powered`, `AI-driven` | say what the model is asked to do | says nothing |
| `seamless`, `effortless`, `foolproof`, `robust`, `powerful` | say what happens | adjectives are not evidence |
| `leverage`, `synergy`, `supercharge`, `unlock` | the plain verb | corporate register |
| `certified`, `accredited`, `approved`, `endorsed` | **never** — see 1.2 | the doctrine |
| `guarantees compliance`, `ensures compliance` | "does not certify; it publishes evidence" | the doctrine |

### 1.2 The doctrine — what may and may not be said

The estate measures. It does not certify, accredit, notify, approve, endorse or
issue legal-compliance determinations. It is not a notified body, not a
standards body, not a regulator. Every public surface says so, in the same
words, because the whole value of the organisation rests on a reader being able
to trust the difference.

**Never:** `we are certified` · `holds accreditation` · `notified body` ·
`standards body` · `guarantees/ensures compliance` · `the global leader` ·
`world's first`.

**Always:** measurement, not certification · verification is free · a TIE is a
TIE · an UNTESTED axis is not a tie · paid work has a defined scope and does
not purchase a favourable result · corrections are published, never silently
edited · our own models are disclosed apart from public rankings.

A **negated** form is the doctrine, not a claim: "a signed card does not
guarantee compliance" is correct and must not be flagged. Checkers must require
a positive assertion.

### 1.3 The counts grammar in prose

| Write | Do not write |
|---|---|
| "34 axes, 34 measured" | "34/34 grades" |
| "0 of 14 model-comparison axes separated a leader; 7 TIE, 7 UNTESTED" | "14 compared, 7 won" |
| "34 axes" | "22 axes" (stale) |
| "14 model-comparison axes" | "14 axes" (that is a family count, not the total) |

A per-axis *n* ("Lab Practice, 37 measured") is a count of bank items and is
not a board count. Never compare one with the other.

---

## 2. Hygiene

| # | Rule | Checked by |
|---|---|---|
| H1 | Every axis the board serves has exactly one published route, and every link to it resolves | `scripts/surface/axis-route-gate.mjs` |
| H2 | No component builds an axis route itself — `axisHref()` owns the rule | `axis-route-gate.mjs` (source lint) |
| H3 | An owner-held axis (`public_pages: HIDDEN_PENDING_OWNER_GO`) has no page, no row and no link | `axis-route-gate.mjs`, `build-axis-pages.mjs` |
| H4 | A 404 is not a page: it says `noindex` and carries no self-canonical | `published-surface-audit.py` |
| H5 | Every URL in the sitemap answers | `scripts/generate-sitemap.mjs`, sitemap truth gate |
| H6 | Every same-origin URL in a machine surface resolves | `scripts/link-gate.mjs` (JSON only — see §6) |
| H7 | Every same-origin URL in an HTML page resolves | `axis-route-gate.mjs` (axis routes), `published-surface-audit.py` (all routes) |
| H8 | A repo has a licence file; a description says what the code does | `scripts/github/repo-metadata.py` |
| H9 | Repo topics are the ones that describe the repo — fewer than nine | `repo-metadata.py` |
| H10 | No internal codename reaches a public surface | `scripts/brand-gate.mjs`, `canary-leak-gate.mjs` |
| H11 | `robots.txt` names every agent it addresses and declares its sitemaps | `published-surface-audit.py` |
| H12 | `llms.txt`, `sitemap.xml` and `catalog.json` describe the site as it is now | `scripts/llms-txt.mjs`, `generate-sitemap.mjs` |

---

## 3. Security

| # | Rule | State |
|---|---|---|
| S1 | HTML surface sends HSTS, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options | ✅ `public/_headers` |
| S2 | The HTML surface sends a Content-Security-Policy | ⚠️ **Report-Only** since 2026-11-06 — enforce after a traffic window |
| S3 | `/api/*` sends the same headers | ✅ `functions/_middleware.ts` (added 2026-11-06) |
| S4 | `/.well-known/security.txt` exists on every public origin | ⚠️ councilof.ai ✅ · **meok.ai ✗** (open) |
| S5 | The DID document is well-formed and names the keys that actually sign | ✅ `csoai.org/.well-known/did.json` |
| S6 | No credential material in a public surface or a tracked file | ✅ `wallet-credential-gate.mjs`, `canary-leak-gate.mjs` |
| S7 | CORS is not `*` on a sensitive route | ✅ checked by `published-surface-audit.py` |
| S8 | The dashboard may be framed by exactly the Hugging Face Space and nowhere else | ✅ `_headers` `/dashboard/*` frame-ancestors |

**On S2.** The CSP ships as `Content-Security-Policy-Report-Only` on purpose.
This repo has already had a white-screen incident (2026-08-11), and a policy
guessed from a source list is exactly the kind of thing that causes one.
Report-only cannot break a page. The policy is modelled on the one `meok.ai`
already runs, so the sources are known-good for this component library, with
`'unsafe-eval'` deliberately left out so the report shows anything that would
need it. **Next step:** read the report over a week of production traffic, fix
what it names, then promote it to `Content-Security-Policy`.

---

## 4. Search and branding

The surfaces a searcher meets, and what each must achieve.

| Surface | Must | Not |
|---|---|---|
| `councilof.ai/` | name the body, say what it measures, link the live board, link the verifier, link the corrections | type a board count; say "certified"; open with a superlative |
| `councilof.ai/about/` | name the legal entity, the company number, the founder, what it is not | present participation as endorsement |
| `councilof.ai/memberships/` | one row per body, each with its evidence URL and its state | list a membership with no evidence; list "contributor" as "member" |
| GitHub profile (`csoai-org`) | link the live board, the methodology, the verifier, the corrections, the traction record | type a board count; quote a Merkle root that has moved |
| GitHub repo descriptions | say what the code does, in one line | describe a verifier as a signer; describe a repo as something it is not |
| `llms.txt` | describe the site as it is now | freeze a count that the board has moved past |
| `robots.txt` | address every agent, declare the sitemaps, say what AI training is allowed | a malformed `User-agent` token (a crawler ignores the whole block) |

**The international-body proof.** The estate's participation is real and
evidenced — 35 recorded participations in `public/interop/memberships.json`,
each with a public URL or a dated mailbox record, a state, and an explicit
"what this does not prove". The GitHub profile should carry that list. A
searcher looking for "is this a real international body doing real measuring"
should find the answer on the first screen, not three clicks deep.

---

## 5. The GitHub estate

949 repositories, 767 public, one account (`CSOAI-ORG`, a **user** account, not
an organisation). Every description, topic and README in it is a search
surface.

| # | Rule | Checked by |
|---|---|---|
| G1 | One description per repo, generated by `scripts/github/repo-metadata.py` from the repo's own kind | `repo-metadata.py --check` |
| G2 | The verb matches the work — a **verifier** verifies; it does not "Sign" | `repo-metadata.py` (`verb_for`) |
| G3 | No description claims certification, accreditation or regulatory status | `brand-gate` + `repo-metadata.py` |
| G4 | No description contains an internal codename | `brand-gate` |
| G5 | Topics describe the repo; the count stays under nine | `repo-metadata.py` (`topics_for` must prune, not only add) |
| G6 | Every public repo carries a licence | `repo-metadata.py` (`licence_for`) |
| G7 | The `.github` profile README and the rendered profile agree with the live board | `scripts/github/org-readme.py` |

**Known defects in the generator, not yet fixed (see §7).**

---

## 6. The gates, and the gaps between them

| Gate | Reads | Blind to |
|---|---|---|
| `link-gate.mjs` | links in **machine surfaces** — it walks `.json` files only | an `href` in an HTML page. **This is why nine dead homepage links survived every green build.** |
| `facts-gate.mjs` | claims against `facts.json` | whether a link resolves |
| `brand-gate.mjs` | forbidden display strings | links, counts, headers |
| `canary-leak-gate.mjs` | private canaries | — |
| `price-gate.mjs` | published prices | — |
| `axis-state-gate.mjs` | static axis pages against the board | — |
| `axis-route-gate.mjs` **(new)** | axis routes: coverage, link integrity, source lint | routes that are not axis routes |
| `published-surface-audit.py` **(new)** | the LIVE surfaces, as a reader and an agent meet them | — (it is an operator tool, not a CI gate: it touches the network) |

**The shape of the gap.** Every gate reads one thing. None of them read *a
link in a page*. The estate has been green for months with nine dead links on
its landing page, because nine dead links are invisible to every gate that
exists. `axis-route-gate.mjs` closes that gap for axis routes; the audit tool
closes it for everything else, by running against the live site rather than a
tree.

---

## 7. Open items

Ordered by what a reader or a searcher is most likely to hit.

| # | Item | Surface | Owner | Note |
|---|---|---|---|---|
| O1 | `meok.ai` has no `/.well-known/security.txt` | meok.ai | meok.ai lane | a security contact is expected on every public origin |
| O2 | `councilof.ai/pricing/` canonicalises to `/dashboard/` | councilof.ai | site lane | a page that canonicalises elsewhere is not indexed as itself |
| O3 | Promote the CSP from Report-Only to enforced | councilof.ai | site lane | needs a traffic window, not a guess |
| O4 | `meok.ai` sends no HSTS, no Permissions-Policy, no X-Frame-Options | meok.ai | meok.ai lane | it has a CSP; the rest of the posture is missing |
| O5 | 216 public repos carry no GitHub licence metadata | GitHub | repo-metadata lane | `licence_for()` returns null for a declared non-MIT licence |
| O6 | `topics_for()` only ever adds topics, never prunes | GitHub | repo-metadata lane | 229 repos carry more than eight topics |
| O7 | `verb_for()` maps `verif` to "Signs" | GitHub | repo-metadata lane | a verifier is described as a signer |
| O8 | `STRIP` rewrites "Sovereign" to "SOV", creating a new internal codename | GitHub | repo-metadata lane | the scrubber manufactures the leak it exists to prevent |
| O9 | 24 public READMEs carry a stale "22 Axes, Signed" H1 | GitHub | content lane | the board is 34 |
| O10 | `public/interop/*.json` references `BLACK-SWAN-LOOPS-2026-09-02.md` | public JSON | content lane | an internal document name in a published index |
| O11 | The estate's `CLAUDE.md` still records `board LIVE 22·22·0` | repo | context lane | the root cause of O9 |
| O12 | The GitHub profile does not carry the participation list | GitHub | — | fixed in this lane's branch; needs the rendered profile |

---

## 8. What this lane changed

Every item below is in branch `lane/published-surface-alignment-20261106`.

| Change | Effect |
|---|---|
| `client/src/lib/axisHref.ts` (new) | one board-derived rule for an axis's route |
| `client/src/lib/axisRoutes.ts` (new) | the build-time route map, for surfaces that must not fetch |
| `public/interop/axis-routes.json` (new, generated) | the route map the axis-page generator publishes from the same payload it renders from |
| `build-axis-pages.mjs` | publishes the route map next to the pages it describes |
| 10 components | every axis link now comes from the one rule; no template-literal routes remain |
| `scripts/surface/axis-route-gate.mjs` (new) | coverage + link integrity + source lint, with a selftest that reproduces the historical defect |
| `scripts/pre-push-gates.sh` | runs the new gate in one second, before a 12-minute deploy |
| `deploy.yml` | runs the new gate on the tree that actually ships |
| `public/404.html` | `noindex,nofollow`, no self-canonical |
| `public/_headers` | a CSP, Report-Only, with the dashboard's frame exception honoured |
| `functions/_middleware.ts` | security headers on `/api/*`, which `_headers` never reaches |
| `scripts/audit/published-surface-audit.py` (new) | one command that audits every live surface |
| tests | `axisHref.test.ts` (new) and two existing tests corrected — both had encoded the defect |

**The nine broken links.** The homepage's board rows linked every axis to
`/gspc/<axis>/`. That route is prerendered, and the prerender list was a
hand-typed subset of the board: nine measured-subject axes were on the board
and on the homepage and absent from that list. Their pages existed the whole
time at `/axis/<axis>/`, canonical to themselves, with nothing linking to them.
Measured against the live site, all 32 non-owner-held axes now answer 200 at
the route the shared rule returns.
