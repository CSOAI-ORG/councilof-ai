/**
 * one-cycle-decide.mjs — the ONE next action for landing a pull request on a moving base.
 *
 * WHY THIS EXISTS. On 2026-11-07 this repository could not land pull requests, and the cause was
 * measured rather than suspected. Master moves every 6.0 minutes at the median (99 gaps over the
 * last 100 commits: p50 6.0 min, p75 10.7, p90 13.6, p95 17.0, max 368.9), while the four
 * required contexts need 1-7 minutes and the `pr-gates` WORKFLOW that produces them needs 11-14.
 * Branch protection requires the head to contain the base (`strict: true`), so a merge is only
 * permitted while the head is up to date — and a base that moves faster than a check cycle
 * guarantees that a re-publish cancels the gate it is waiting for:
 *
 *   MEASURED on `catalogue-live-state/pending`: 8 of the last 10 `pr-gates` runs finished
 *   `cancelled`. The single `success` (head `daf21a642`, 11:13Z -> 11:24Z) survived because
 *   master was quiet for those eleven minutes.
 *
 * The arithmetic of that, over the same 99 gaps:
 *
 *   cycle needed                        P(a random arrival finds a quiet window)
 *   1 min                               89 %
 *   5 min                               56 %
 *   7 min  (the four required contexts) 47 %
 *   12 min (the whole `pr-gates` run)   ~17 %
 *   14 min                               9 %
 *
 * The model predicts the observation: 2 of 10 runs succeeded (20 %) against a predicted ~17 % for
 * a whole-workflow cycle. The estate's success rate was not bad luck and not a broken gate. It is
 * what a moving base does to a workflow that needs twelve minutes to finish.
 *
 * THE RULE THIS MODULE ENCODES, in one cycle at a time:
 *
 *   1. Never push a new head while a required check is in flight. A push supersedes the in-flight
 *      gate of the branch it pushes to (`pr-gates.yml` declares
 *      `concurrency: { group: pr-gates-${{ github.head_ref || github.ref }}, cancel-in-progress: true }`,
 *      keyed on the BRANCH NAME), so a loop that pushes while it waits cancels the very gate it is
 *      waiting for. A loop that guarantees its own failure cannot converge.
 *   2. When the base has moved, catch the branch up with ONE
 *      `PUT /repos/{owner}/{repo}/pulls/{n}/update-branch` — measured on #4060 at ~2 s, a clean
 *      merge commit (`Merge branch 'master' into ...`, parents `7008e1fa1` + `92c77ca00`),
 *      `behind_by: 0`. It preserves the reviewed commits. A rebase rewrites them, which
 *      invalidates any approval tied to them.
 *   3. Wait for the gates on THAT new head, then let the armed auto-merge land it. Nothing here
 *      merges by hand, and nothing here uses `--admin`: the required contexts keep their meaning.
 *
 * WHAT THIS IS NOT. It is not a merge queue, and it does not pretend to be one. The merge queue is
 * the only mechanism that removes the race outright — a queued pull request is tested against the
 * LATEST base as a combined commit, so up-to-dateness holds by construction instead of by winning
 * a quiet window that is usually not there (47 % of the time for the required set, ~17 % for the
 * whole workflow). The estate's workflows already declare the `merge_group:` trigger it needs
 * (`pr-gates.yml`, `ci.yml`, added 2026-10-29) and every job in both is audited `merge_group`-safe;
 * only the queue itself was never switched on, and switching it on is a repository-settings action
 * that the classic branch-protection REST API cannot perform (rust-lang/team#1735) — it needs a
 * repository ruleset carrying a `merge_queue` rule, which is rejected until the repository-level
 * capability is enabled. See issue #4079.
 *
 * THIS MODULE IS PURE. It reads no network and touches no clock: it takes a state and returns one
 * action. The network reads live in `one-cycle-sync.mjs`, so the decision can be proved against
 * fixtures — a rule that has never fired proves nothing about the tree it passes.
 */

import { pathToFileURL } from "node:url";

/**
 * The four contexts branch protection requires on `master`, all GitHub Actions (app_id 15368).
 * The order here is the order they are named in the protection rule and carries no meaning.
 */
export const REQUIRED_CONTEXTS = Object.freeze(["build", "gates", "hold-guard", "stamped-bytes"]);

/**
 * The actions. Exactly one is returned per decision.
 *
 *   DONE              the pull request is merged or closed — nothing to do.
 *   READY             it is a draft; a draft cannot carry an auto-merge and never merges.
 *   WAIT_FOR_CHECKS   a required check is in flight. DO NOT PUSH. This is the rule that matters.
 *   BLOCKED           a required check failed, or a required context never reported.
 *   SYNC              the head is behind the base and no check is in flight: ONE update-branch.
 *   ARM               everything is green and up to date but no auto-merge is armed.
 *   AWAIT_AUTO_MERGE  everything is green, up to date and armed: the auto-merge will land it.
 *   RETRY_READ        a read did not complete. Absence is a state, never a verdict.
 */
/**
 * How long a freshly pushed head is given to produce its check-runs before the absence of those
 * check-runs is treated as a state rather than a wait. MEASURED 2026-11-07: 15 seconds after a
 * push, the four required contexts had not appeared and no run was visible — GitHub had not
 * finished reacting to the push. Two minutes is generous against that measurement and short
 * enough that a genuinely dead context is reported as blocked on the next cycle.
 */
export const HEAD_GRACE_SECONDS = 120;

export const ACTIONS = Object.freeze({
  DONE: "DONE",
  READY: "READY",
  WAIT_FOR_CHECKS: "WAIT_FOR_CHECKS",
  BLOCKED: "BLOCKED",
  SYNC: "SYNC",
  ARM: "ARM",
  AWAIT_AUTO_MERGE: "AWAIT_AUTO_MERGE",
  RETRY_READ: "RETRY_READ",
});

/**
 * Decide the one next action.
 *
 * @param {object} state
 * @param {"open"|"closed"|"merged"} state.prState   the pull request's own state.
 * @param {boolean}  state.draft                    is it a draft?
 * @param {boolean}  state.armed                    is an auto-merge armed on it?
 * @param {number}   state.behind                   commits the head is behind the base.
 * @param {boolean}  state.readComplete             did every read this decision needs succeed?
 * @param {object}   state.required
 * @param {string[]} state.required.passed          required contexts completed successfully.
 * @param {string[]} state.required.failed          required contexts completed unsuccessfully.
 * @param {string[]} state.required.inFlight        required contexts queued or running.
 * @param {string[]} state.required.unreported      required contexts that have not reported at all.
 * @param {boolean}  state.anyRunInFlight          is any workflow run on this head still going?
 * @param {string[]} state.runsAwaitingApproval    workflow runs on this head held for approval.
 * @returns {{action: string, reason: string, detail: object}}
 */
export function decide(state) {
  const required = (state && state.required) || {};
  const passed = list(required.passed);
  const failed = list(required.failed);
  const inFlight = list(required.inFlight);
  const unreported = list(required.unreported);
  const awaitingApproval = list(state?.runsAwaitingApproval);
  const behind = Number.isFinite(state?.behind) ? Math.max(0, Math.trunc(state.behind)) : 0;

  // A read that did not complete is not a reading. Reporting `behind = 0` from a failed compare
  // would be the same class of lie as a typed number: a zero that passes because the thing it
  // measures was absent.
  if (state?.readComplete === false) {
    return {
      action: ACTIONS.RETRY_READ,
      reason: "a read did not complete — absence is a state, not a reading; nothing was decided",
      detail: { behind, passed, failed, inFlight, unreported },
    };
  }

  if (state?.prState === "merged" || state?.prState === "closed") {
    return {
      action: ACTIONS.DONE,
      reason: `the pull request is ${state.prState}`,
      detail: { behind },
    };
  }

  if (state?.draft) {
    return {
      action: ACTIONS.READY,
      reason: "the pull request is a draft; a draft cannot carry an auto-merge and never merges",
      detail: { behind },
    };
  }

  // A check in flight means the verdict is not in yet. WAIT is checked BEFORE SYNC on purpose:
  // this is the whole point of the module. A sync is a push, and a push supersedes the in-flight
  // gate of the branch it pushes to, so a decision that returned SYNC while a check was running
  // would guarantee its own failure. The invariant is asserted in the fixtures below and in
  // `one-cycle-decide.test.mjs`: SYNC is never returned while a required check is in flight.
  if (inFlight.length > 0) {
    return {
      action: ACTIONS.WAIT_FOR_CHECKS,
      reason: `${inFlight.length} required check(s) in flight (${inFlight.join(", ")}) — do not push; a push supersedes the gate it is waiting for`,
      detail: { behind, inFlight },
    };
  }

  // A failure is reported before a sync is proposed: a failing check is the lane's to fix, and
  // catching the branch up to the base does not fix it.
  if (failed.length > 0) {
    return {
      action: ACTIONS.BLOCKED,
      reason: `${failed.length} required check(s) failed (${failed.join(", ")}) — a sync does not fix a failure`,
      detail: { behind, failed },
    };
  }

  // A required context that has not reported, with no run in flight to produce it, will never
  // report. Naming it is the honest state; reporting "not green" would be a claim about a check
  // that did not run. When a run IS still in flight on this head, the context may yet report, so
  // the verdict is not in yet and the answer is to wait rather than to declare it blocked.
  //
  // AND A HEAD THAT WAS JUST PUSHED HAS NO CHECKS YET. MEASURED 2026-11-07, 15 seconds after
  // this pull request's head was pushed: 4 required contexts unreported, no run visible, and the
  // decision said BLOCKED — about a head that GitHub had not finished reacting to. Absence on a
  // fresh head is not a verdict, so a head younger than the grace period waits. The grace period
  // is a constant of the question ("how long does it take GitHub to create the check-runs?"), not
  // a hope: measured on this repository the check-runs appear within seconds of the push.
  if (unreported.length > 0) {
    const age = Number(state?.headAgeSeconds);
    if (state?.anyRunInFlight) {
      return {
        action: ACTIONS.WAIT_FOR_CHECKS,
        reason: `${unreported.length} required context(s) have not reported yet (${unreported.join(", ")}) and a run is still in flight on this head`,
        detail: { behind, unreported },
      };
    }
    if (awaitingApproval.length > 0) {
      // A RUN HELD FOR APPROVAL IS A STATE, AND IT NAMES ITS REMEDY. MEASURED 2026-11-08 on the
      // catalogue's own edition: the schedule pushes its branch with the workflow's GITHUB_TOKEN,
      // so GitHub does not start the runs it triggers — it holds them as `action_required`. The
      // required contexts therefore never report, no run is in flight, and a reader that only
      // knows "unreported and nothing running" would call this BROKEN. It is not broken: it is
      // waiting for an approval, and the approval is a POST to
      // /repos/{owner}/{repo}/actions/runs/{id}/approve. So the verdict is WAIT, and the reason
      // says what is holding it and what releases it.
      return {
        action: ACTIONS.WAIT_FOR_CHECKS,
        reason: `${unreported.length} required context(s) have not reported because ${awaitingApproval.length} workflow run(s) on this head are held for approval (${awaitingApproval.join(", ")}) — a workflow that pushes with GITHUB_TOKEN does not start the runs it triggers`,
        detail: { behind, unreported, runsAwaitingApproval: awaitingApproval },
      };
    }
    if (Number.isFinite(age) && age < HEAD_GRACE_SECONDS) {
      return {
        action: ACTIONS.WAIT_FOR_CHECKS,
        reason: `the head is ${Math.round(age)}s old and ${unreported.length} required context(s) have not appeared yet (${unreported.join(", ")}) — a fresh head has no checks yet`,
        detail: { behind, unreported, headAgeSeconds: age },
      };
    }
    return {
      action: ACTIONS.BLOCKED,
      reason: `${unreported.length} required context(s) never reported (${unreported.join(", ")}) and no run is in flight`,
      detail: { behind, unreported },
    };
  }

  if (behind > 0) {
    return {
      action: ACTIONS.SYNC,
      reason: `the head is ${behind} commit(s) behind the base and no check is in flight — one update-branch, then wait for the gates on the new head`,
      detail: { behind },
    };
  }

  if (!state?.armed) {
    return {
      action: ACTIONS.ARM,
      reason: "the head is up to date and every required check is green, but no auto-merge is armed",
      detail: { behind },
    };
  }

  return {
    action: ACTIONS.AWAIT_AUTO_MERGE,
    reason: "the head is up to date, every required check is green and an auto-merge is armed — the auto-merge lands it; nothing to do",
    detail: { behind },
  };
}

function list(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.length > 0) : [];
}

/**
 * The fixtures. Every case is a state that has actually been observed on this repository, and
 * the assertions include the two invariants that make the rule work.
 *
 * @returns {Array<{name: string, state: object, action: string, reason?: RegExp}>}
 */
export function fixtures() {
  const green = { passed: [...REQUIRED_CONTEXTS], failed: [], inFlight: [], unreported: [] };
  return [
    {
      name: "a merged pull request is done",
      state: { prState: "merged", draft: false, armed: true, behind: 0, readComplete: true, required: green },
      action: ACTIONS.DONE,
    },
    {
      name: "a closed pull request is done",
      state: { prState: "closed", draft: false, armed: false, behind: 4, readComplete: true, required: green },
      action: ACTIONS.DONE,
    },
    {
      name: "a draft must be made ready before anything else",
      state: { prState: "open", draft: true, armed: false, behind: 0, readComplete: true, required: green },
      action: ACTIONS.READY,
    },
    {
      name: "a check in flight waits, even with nothing else wrong",
      state: {
        prState: "open", draft: false, armed: false, behind: 0, readComplete: true,
        required: { passed: ["build", "hold-guard"], failed: [], inFlight: ["gates"], unreported: ["stamped-bytes"] },
      },
      action: ACTIONS.WAIT_FOR_CHECKS,
    },
    {
      name: "a check in flight waits EVEN THOUGH the head is behind — the invariant that stopped the estate",
      state: {
        prState: "open", draft: false, armed: true, behind: 7, readComplete: true,
        required: { passed: ["build"], failed: [], inFlight: ["gates", "stamped-bytes"], unreported: [] },
      },
      action: ACTIONS.WAIT_FOR_CHECKS,
      reason: /do not push/,
    },
    {
      name: "a failed check blocks, and a sync is not proposed",
      state: {
        prState: "open", draft: false, armed: true, behind: 3, readComplete: true,
        required: { passed: ["build"], failed: ["gates"], inFlight: [], unreported: [] },
      },
      action: ACTIONS.BLOCKED,
      reason: /a sync does not fix a failure/,
    },
    {
      name: "runs HELD FOR APPROVAL wait, and name the remedy",
      state: {
        prState: "open", draft: false, armed: false, behind: 0, readComplete: true, headAgeSeconds: 200,
        runsAwaitingApproval: ["pr-gates", "CI"],
        required: { passed: [], failed: [], inFlight: [], unreported: [...REQUIRED_CONTEXTS] },
      },
      action: ACTIONS.WAIT_FOR_CHECKS,
      reason: /held for approval/,
    },
    {
      name: "a FRESH head with no checks yet waits, it does not block",
      state: {
        prState: "open", draft: false, armed: false, behind: 0, readComplete: true, headAgeSeconds: 15,
        required: { passed: [], failed: [], inFlight: [], unreported: [...REQUIRED_CONTEXTS] },
      },
      action: ACTIONS.WAIT_FOR_CHECKS,
      reason: /fresh head has no checks yet/,
    },
    {
      name: "an OLD head with no checks at all blocks, and is named",
      state: {
        prState: "open", draft: false, armed: false, behind: 0, readComplete: true,
        required: { passed: ["build", "gates", "hold-guard"], failed: [], inFlight: [], unreported: ["stamped-bytes"] },
      },
      action: ACTIONS.BLOCKED,
      reason: /never reported/,
    },
    {
      name: "a required context that has not reported YET, with a run still in flight, waits",
      state: {
        prState: "open", draft: false, armed: false, behind: 0, readComplete: true, anyRunInFlight: true,
        required: { passed: ["build", "gates", "hold-guard"], failed: [], inFlight: [], unreported: ["stamped-bytes"] },
      },
      action: ACTIONS.WAIT_FOR_CHECKS,
      reason: /have not reported yet/,
    },
    {
      name: "behind with everything green proposes exactly one sync",
      state: { prState: "open", draft: false, armed: false, behind: 1, readComplete: true, required: green },
      action: ACTIONS.SYNC,
      reason: /one update-branch/,
    },
    {
      name: "behind and already armed still proposes the sync, not a second arm",
      state: { prState: "open", draft: false, armed: true, behind: 12, readComplete: true, required: green },
      action: ACTIONS.SYNC,
    },
    {
      name: "up to date, green, not armed: arm it",
      state: { prState: "open", draft: false, armed: false, behind: 0, readComplete: true, required: green },
      action: ACTIONS.ARM,
    },
    {
      name: "up to date, green and armed: wait for the auto-merge",
      state: { prState: "open", draft: false, armed: true, behind: 0, readComplete: true, required: green },
      action: ACTIONS.AWAIT_AUTO_MERGE,
    },
    {
      name: "a read that did not complete decides nothing",
      state: { prState: "open", draft: false, armed: false, behind: 0, readComplete: false, required: green },
      action: ACTIONS.RETRY_READ,
      reason: /absence is a state/,
    },
  ];
}

/**
 * The sweep: every combination of the state this function can see, checked against the two
 * invariants that make the rule work. This is stronger than the fixture list, because a fixture
 * only proves the cases somebody thought to write down.
 *
 * @returns {{swept: number, failed: Array<{name: string, expected: string, got: string}>}}
 */
export function sweep() {
  const behinds = [0, 1, 7];
  const inFlights = [[], ["gates"], ["gates", "build"], [...REQUIRED_CONTEXTS]];
  const armedStates = [false, true];
  const failures = [[], ["gates"], ["hold-guard"]];
  const drafts = [false, true];
  const prStates = ["open", "closed", "merged"];
  const readCompletes = [true, false];
  const failed = [];
  let swept = 0;

  for (const prState of prStates) {
    for (const draft of drafts) {
      for (const behind of behinds) {
        for (const inFlight of inFlights) {
          for (const fail of failures) {
            for (const isArmed of armedStates) {
              for (const readComplete of readCompletes) {
                const state = {
                  prState,
                  draft,
                  armed: isArmed,
                  behind,
                  readComplete,
                  required: {
                    passed: REQUIRED_CONTEXTS.filter((c) => !inFlight.includes(c) && !fail.includes(c)),
                    failed: fail,
                    inFlight,
                    unreported: [],
                  },
                };
                const got = decide(state);
                swept++;
                if (inFlight.length === 0) continue;
                const where = `prState=${prState} draft=${draft} behind=${behind} inFlight=${inFlight.join("+")} failed=${fail.join("+")} armed=${isArmed} readComplete=${readComplete}`;
                if (got.action === ACTIONS.SYNC) {
                  failed.push({
                    name: `INVARIANT (never SYNC while a check is in flight): ${where}`,
                    expected: "not SYNC",
                    got: `SYNC — ${got.reason}`,
                  });
                }
                // A read that did not complete yields NO verdict, which is not the same as a
                // verdict that says "wait": RETRY_READ is the honest answer there, and it must
                // never become a sync either. So the "behind AND in flight => WAIT" invariant is
                // stated over the states where a verdict was possible at all. (This sweep caught
                // the over-strong version of the invariant, which is the reason it is a sweep
                // and not a list of cases: an invariant that is wrong in the strong direction
                // teaches the next editor to distrust it.)
                if (readComplete && behind > 0 && prState === "open" && !draft) {
                  if (got.action !== ACTIONS.WAIT_FOR_CHECKS) {
                    failed.push({
                      name: `INVARIANT (behind AND in flight => WAIT_FOR_CHECKS): ${where}`,
                      expected: ACTIONS.WAIT_FOR_CHECKS,
                      got: `${got.action} — ${got.reason}`,
                    });
                  }
                }
                if (!readComplete && got.action !== ACTIONS.RETRY_READ) {
                  failed.push({
                    name: `INVARIANT (an incomplete read decides nothing): ${where}`,
                    expected: ACTIONS.RETRY_READ,
                    got: `${got.action} — ${got.reason}`,
                  });
                }
              }
            }
          }
        }
      }
    }
  }
  return { swept, failed };
}

/**
 * Run the fixtures. Used by `--selftest` (the estate's own idiom) and by the vitest file, so
 * both runners prove the same cases from one source.
 *
 * @returns {{passed: number, failed: Array<{name: string, expected: string, got: string}>}}
 */
export function runFixtures() {
  const failures = [];
  let passed = 0;
  for (const fixture of fixtures()) {
    const got = decide(fixture.state);
    const ok = got.action === fixture.action && (!fixture.reason || fixture.reason.test(got.reason));
    if (ok) {
      passed++;
    } else {
      failures.push({
        name: fixture.name,
        expected: `${fixture.action}${fixture.reason ? ` ${fixture.reason}` : ""}`,
        got: `${got.action} ${got.reason}`,
      });
    }
  }

  // THE INVARIANTS. These are the assertions that matter more than the cases above: they hold
  // for every state, not for the fixtures that happen to be written down.
  for (const fixture of fixtures()) {
    const inFlight = list(fixture.state.required?.inFlight);
    if (inFlight.length === 0) continue;
    const got = decide(fixture.state);
    if (got.action === ACTIONS.SYNC) {
      failures.push({
        name: `INVARIANT: ${fixture.name}`,
        expected: "never SYNC while a required check is in flight",
        got: `SYNC (in flight: ${inFlight.join(", ")})`,
      });
    }
    if (Number(fixture.state.behind) > 0 && got.action !== ACTIONS.WAIT_FOR_CHECKS) {
      failures.push({
        name: `INVARIANT: ${fixture.name}`,
        expected: "behind AND in flight => WAIT_FOR_CHECKS",
        got: got.action,
      });
    }
  }

  return { passed, failed: [...failures, ...sweep().failed] };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain && process.argv.includes("--selftest")) {
  const { passed, failed } = runFixtures();
  for (const failure of failed) {
    console.error(`FAIL  ${failure.name}\n      expected ${failure.expected}\n      got      ${failure.got}`);
  }
  console.log(`one-cycle-decide selftest: ${passed} passed, ${failed.length} failed`);
  process.exit(failed.length === 0 ? 0 : 1);
}
