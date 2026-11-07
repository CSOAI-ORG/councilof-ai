# Estate roadmap — from next year to today (consolidated 2026-11-04)

The build-and-finish plan: what the estate is, what "finished" means for each surface,
and the work needed — year-scale first, then quarters, then weeks, then what executes
today. Grounded entirely in what the 2026-11-02→04 passes measured. Every item carries
its owner: lane / owner-decision / both.

## 0. What the estate is (the compound base)

CSOAI measures AI behaviour and publishes signed evidence. The trust surface
(councilof.ai + the board + signed cards + free verification) is the product; the
mirrors (GitHub, HF datasets/Spaces, Kaggle) are distribution; the automation
(sweeper, cron-watch, drift-guard, brand-gate, completion-audit) is the immune
system. Everything that follows compounds one thing: **a trust surface nobody has to
believe, because they can check it.**

## 1. Next year (by 2027-01): the four compounds

**A. The immune system runs itself (compounding: integrity).**
Every scheduled workflow fires or gets flagged within a day (cron-watch — live).
Every automation family lands or closes by rule (sweeper — live). Every surface
drift gets caught in minutes (drift-guard — live). Remaining to finish: the four
dead schedules recovered (#3887), org-profile hourly derivation live (#3880), and
quarterly: audit the immune system itself (cron-watch's own budget, sweeper family
list) — an immune system needs its own checkups.

**B. HF is the substrate (compounding: reach + cost).**
Board mirrors on HF datasets/Spaces verified (34/34, EXTERNALLY_VERIFIED); HF CPU
free tier takes measurement batches; private HF datasets hold lane scratch. Remaining
to finish: mill decision (owner-gated — re-enable or retire formally), HF model-card
polish (the 7 fleet models state plain provenance), and one workflow that publishes
every new measurement batch to HF as a first-class dataset at land time, not as a
follow-up mirror pass.

**C. The distribution fleet is curated (compounding: commercial reach).**
~130 "MEOK AI Labs" tool repos are distribution infrastructure — but uncurated
distribution is noise, not reach. Year target: every fleet repo passes the README
contract (S8–S11), the registry listings it backs are verified live, and the fleet
shrinks by the ones that back nothing (privatize with the zero-consumer evidence
rule). Measure quarterly: registry-listing liveness, per-repo stars/forks/downloads.

**D. The owner queue is empty.**
The six standing decisions (mill, DC authorize, defoneos successor, @csgaglobal,
charter rename, B14/B15 disk) each get a dated resolution — they are the only rows
that cannot move without the owner, and every one of them blocks something real.

## 2. Next quarter (by 2027-02)

- **Packaging**: PyPI/npm metadata lint at publish time (S12); the defoneos pair
  yanked and superseded (S13 — needs the successor name); every package's README
  carries the measurement-not-certification line and the verification link (S11).
- **Standards enforcement**: the org-wide README linter workflow (S8–S11 check,
  named in PUBLIC-SURFACE-STANDARDS.md §5 as the gap) — one workflow, one report
  issue, quarterly.
- **Journey coverage**: the deploy e2e suite is the journey gate today; add the
  crawler-view daily live check (once #3887 lands) as the second, and the HF mirror
  parity check (the Antigravity lane's verify script) as the third — three
  independent journeys, one issue each when they break.
- **The mill**: re-enabled with green-mill auto-merge (the sweeper lands every run),
  or formally retired with the staging dataset archived read-only. No third state.

## 3. Next weeks (rolling)

- Land #3870 / #3880 / #3887 (armed).
- Dispatch-verify chains post-merge: completion-audit (measure → PR → gates),
  crawler-view (live-surface gate), cron-watch issue #3854 self-update cycle.
- HF fleet-model cards: 7 models, plain provenance, the disclosure line.
- Weekly lane report on #3746; the tick's status lines continue daily.

## 4. Today (this run)

1. Land the three armed PRs.
2. Post-merge dispatches to verify the recovered chains.
3. This roadmap document, published.
4. HF fleet-model cards (polish pass).
5. Status + report.

## 5. The finish line (what "complete to 100%" means here)

- Every public surface passes the 14 standards — machine-checked where a check
  exists, quarterly-audited where one doesn't.
- Every automation the estate depends on fires reliably or is flagged within a day.
- Every lane works from cloud storage; the Mac holds one sparse checkout.
- The owner queue is empty; everything else is the machines' job.
- The trust surface compound: published evidence, free verification, honest states
  (UNMEASURED is a finding, not a zero) — unchanged, because that is the product.
