# OPEN-SOURCE ROLLOUT PLAN 2026-07-09 — the 30/60/90-day execution
## Substrate → tools → SEAL. Aggressive timeline. Series A is the prize.
### CSOAI Ltd · Hermes/JEEVES lane

> The 30/60/90 plan to ship the open-source play. **The 3-tier licensing decision
> is in `OS_LICENSING_PLAY_2026-07-09.md`.** This is the *when* and the *who*.
> The plan is aggressive because the **Series A window is the only window** —
> if we don't have the open-source substrate + the defoneos competitor benchmark
> + the sovereign merge proof by Sept 30, the round closes at 10x lower than
> the "we own the standard" narrative.
>
> Honesty register: this plan assumes 2 full-time engineers + 1 part-time
> Sir-Nick on calls. If that's wrong, slip the dates, not the architecture.
> All dates owner-gated. No self-firing.

---

## DAY 0 (today, 2026-07-09) — the methodology goes public

- ✅ Runbook §6 first-move done this session (GATE 0 + STEP 1 + 65-task real benchmark + base-model v2 + rejected-items register + session report)
- 🔄 The 5 alignment docs this session: licensing play (this one), rollout plan, competitor benchmark methodology, 33T reality check, MEOK OS overlay vision
- **Total this session:** 9 docs + 1 script + 1 benchmark battery = **~70KB of artifacts**

## DAY 0 → DAY 7 (today → Mon 14 Jul) — the first open-source announcement

| Day | Action | Owner | Status |
|---|---|---|---|
| 0 | Runbook §6 first-move complete | Hermes/JEEVES | ✅ done |
| 0 | 5 alignment docs | Hermes/JEEVES | ✅ this session |
| 0 | AGPL-3.0 + BSL + MIT licence headers added to existing assets | Hermes/JEEVES | pending (this session) |
| 1 | Sovereign-OS repo moved to public GitHub | Nick-gated on `CSOAI-ORG` org access | owner-gated |
| 1 | `meok-sovereign-aiact-passport-mcp` (CJ1) PyPI publish (already built, 88 tests pass) | Nick-gated on PyPI 2FA | owner-gated |
| 2 | `meok-sovereign-aiact-passport-mcp` GitHub release v0.1.0 | after PyPI | owner-gated |
| 3 | defoneos competitor benchmark methodology published | Hermes/JEEVES | pending (this session) |
| 4 | defoneos competitor benchmark runs against 5 targets | Hermes/JEEVES | pending |
| 5 | defoneos benchmark report public | Hermes/JEEVES | pending |
| 6 | README + getting-started for the substrate | Hermes/JEEVES | pending |
| 7 | First blog post: "Why we're open-sourcing sovereign AI" | Nick | owner-gated |

## DAY 7 → DAY 30 (14 Jul → 8 Aug) — the adoption wedge

| Day | Action | Owner | Status |
|---|---|---|---|
| 7-10 | Crown / DAF / DIU / AUKUS-prime pilot outreach (sibling already has 100 tailored emails staged, owner-gated) | Nick | owner-gated |
| 7-10 | Series A VC outreach starts (sibling already has VC list, owner-gated) | Nick | owner-gated |
| 10-15 | First 100 sovereign-os installs target (community adoption) | Hermes/JEEVES + Nick | target |
| 15 | Sovereign merge proof-of-pipeline runs (after Nick's £10-20 GPU rental) | Hermes/JEEVES | owner-gated on money |
| 15-20 | Sovereign merge v0.1 published (Qwen3.6-35B-A3B base, 4 fine-tuned experts, mergekit merge) | Hermes/JEEVES | pending |
| 20-25 | Sovereign merge v0.1 benchmarked on the 65-task real held-out battery | Hermes/JEEVES | pending |
| 25 | Sovereign merge v0.1 GitHub release + HuggingFace Open LLM Leaderboard submission | Hermes/JEEVES + Nick | pending |
| 30 | Goal: 1,000 sovereign-os installs, 100 sovereign-merge downloads, 1 Crown pilot in negotiation | All | target |

## DAY 30 → DAY 60 (8 Aug → 7 Sep) — the moat

| Day | Action | Owner | Status |
|---|---|---|---|
| 30-40 | Sovereign merge v0.2 with sovereign-labelled-data fine-tune (after Gate 1 passes) | Hermes/JEEVES | pending |
| 40-45 | Sovereign merge v0.2 on MiMo-V2.5-Pro (1M context, if Gate 1 holds) | Hermes/JEEVES | pending |
| 45-50 | Sovereign merge v0.3 with care-floor + BFT-33 + SIGIL-signed-reasoning (the architectural wedge) | Hermes/JEEVES | pending |
| 50 | MEOK OS app overlay v0.1 — the user-facing piece, MIT licensed, on Mac/Win/Linux/iOS/Android | Hermes/JEEVES + Nick | pending |
| 55-60 | defoneos competitor benchmark v2 — re-run against the same 5 targets with the sovereign substrate in the comparison | Hermes/JEEVES | pending |
| 60 | Goal: 5,000 sovereign-os installs, 1,000 sovereign-merge downloads, 3 Crown pilots in negotiation, 1 SEAL certificate pre-order | All | target |

## DAY 60 → DAY 90 (7 Sep → 6 Oct) — the Series A close

| Day | Action | Owner | Status |
|---|---|---|---|
| 60-75 | Sovereign SEAL certificate v0.1 — BSL licensed, the highest-value tier | Hermes/JEEVES | pending |
| 75-80 | "We Are The Standard" report — 30+ pages, public, the methodology, the merge results, the adoption metrics, the competitor benchmark | Hermes/JEEVES + Nick | pending |
| 80-85 | Series A deck v3 — updated with sovereign merge + SEAL + substrate traction | Hermes/JEEVES | pending |
| 85-90 | Series A close — target £1.5M-£3M at £15M-£30M pre-money valuation | Nick | owner-gated |
| 90 | Goal: 25,000 sovereign-os installs, 10,000 sovereign-merge downloads, 5+ Crown pilots signed, 1+ SEAL certificate sold, Series A round closed | All | target |

## The honest risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sovereign merge proof-of-pipeline FAILS Gate 1 (merged does not beat base) | MEDIUM | HIGH | The runbook's 2-gate structure is exactly the protection: stop at Gate 1 with £15 spent, not at Gate 2 with £300 spent |
| Open-source adoption is too slow (1,000 installs takes 6 months, not 6 weeks) | MEDIUM | MEDIUM | Crown / DAF / DIU outreach is the anchor — community adoption is the wedge, but enterprise pilots are the funding |
| defoneos competitor benchmark backfires (a competitor beats us on a published methodology) | LOW | MEDIUM | The methodology is the moat — competitors cannot fake the methodology. The result either way is "the standard is the test" |
| Hyperscaler clones sovereign-os (the AGPL-3.0 test) | LOW | HIGH | The AGPL-3.0 licence is the protection. If a hyperscaler forks, they have to publish their service stack. We've seen this play out with MongoDB |
| Nick doesn't fire the owner-gated actions (the £10-20 GPU, the PyPI publish, the Vercel deploy, the first outreach email) | MEDIUM | HIGH | Every owner-gated action is documented. The plan can be re-aimed but the human-gate steps are the bottleneck |

## The honest one-line

**This is a 90-day plan to ship an open-source sovereign AI substrate + a verifiable sovereign merge + a competitor benchmark + a Series A close. Every step is documented. Every gate is honest. The only failure mode is the owner-gated actions not firing.**

---

*Authored for Sir Nicholas Templeman. The 30/60/90-day plan. Aggressive but defensible. The 3-tier licensing decision + the defoneos methodology + the sovereign merge proof + the MEOK OS overlay = the wedge to £1M MRR by year 1 and Series A close at £15-30M pre-money.*
