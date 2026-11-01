import registry from "../../../council-os/working-groups.json";

/** A dated organisational proposal; never a board-count or measurement authority. */
export const WORKING_GROUPS = registry.groups;
export const WORKING_GROUPS_AS_OF = registry.asOf;
export const WORKING_GROUPS_CHARTER = "https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/governance/public-watchdog-working-groups.md";
export const REVOCATION_REVIEW_COMMIT = "19ccbd406714f6c2b9e11e9f25fb14aafc478fba";
export const REVOCATION_REVIEW_PROTOCOL = `https://github.com/CSOAI-ORG/councilof-ai/blob/${REVOCATION_REVIEW_COMMIT}/docs/governance/revocation-latency-trial.md`;

export function workingGroup(id: string | null) {
  return WORKING_GROUPS.find(group => group.id === id) ?? null;
}

export function workingGroupEnquiryHref(id: string, stage?: "review"): string {
  const group = workingGroup(id);
  if (!group) return "/contact/";
  const params = new URLSearchParams({ arm: "working-group", group: group.id });
  if (stage) params.set("stage", stage);
  return `/contact/?${params}`;
}

/** Local download: canonical public scope only, no submitted data or membership action. */
export function workingGroupBrief(id: string) {
  const group = workingGroup(id);
  if (!group) return null;
  const text = [
    `# Council of AI — ${group.name}`,
    `Task brief dated ${WORKING_GROUPS_AS_OF}. Status: forming; no appointment implied.`,
    "",
    "## First task",
    group.firstTask,
    `Axes in the dated scope: ${group.axes.join(", ")}.`,
    "",
    "## Before starting",
    "Agree one bounded task, time, attribution, conflicts and any funding with the coordinator.",
    "Independent researchers and affected-user perspectives are welcome. Ask for participation adjustments if needed.",
    "Use public or synthetic evidence. Do not include credentials, confidential cases or other people's personal data.",
    "",
    "## What to return",
    ...group.reviewOutputs.map((item, i) => `${i + 1}. ${item}`),
    ...(group.id === "agent-control" ? [
      "",
      "## Runnable local review packet",
      `Pinned protocol: ${REVOCATION_REVIEW_PROTOCOL}`,
      `Source commit: ${REVOCATION_REVIEW_COMMIT}`,
      "Expected controls: cooperative PASS; non-cancellable FAIL; disabled-enforcement FAIL; unknown-effect INCONCLUSIVE.",
      "The fixture command exits 0 when those expected outcomes occur. Checking the full record exits 1 because it includes negative controls.",
      "These are one-process synthetic controls, not production halt latency or a recommended SLA.",
    ] : []),
    "",
    "## Review notes",
    "Reviewer / public work:",
    "Relevant competence and conflicts:",
    "Scope agreed / date:",
    "Source URLs, versions and capture dates:",
    "Method, commands and environment:",
    "Observed result and raw evidence:",
    "Missing evidence or unknown effects:",
    "Disagreement / proposed correction / reasoned no-change:",
    "What this result does not establish:",
    "Attribution and public-listing permissions (separate agreement):",
    "",
    "## Return and follow-up",
    `Prepare a contribution email: https://councilof.ai${workingGroupEnquiryHref(group.id, "review")}`,
    "Review and send it yourself. Attach only the agreed public evidence, or include a public link.",
    "Keep your own copy. A draft or a sent email is not an accepted role, review decision or permission to execute.",
    "The coordinator must acknowledge receipt and agree the next step; no response time is promised.",
    "If a conclusion needs independent review, a separate competent, unconflicted person must accept that task.",
    "",
    `Draft charter: ${WORKING_GROUPS_CHARTER}`,
    "Challenge a finding: https://councilof.ai/dispute/",
    "Corrections: https://councilof.ai/corrections/",
    "",
  ].join("\n");
  return { text, filename: `council-${group.id}-task-brief.md`, href: `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}` };
}

/** Query parameters select a canonical group and stage, never names or recipients. */
export function workingGroupEnquiry(id: string | null, stage: string | null = null) {
  const group = workingGroup(id);
  if (!group || (stage !== null && stage !== "review")) return null;
  if (stage === "review") return {
    subject: `Working group contribution — ${group.name}`,
    message: [
      `Proposed group: ${group.name}`,
      `First task: ${group.firstTask}`,
      `Task brief date: ${WORKING_GROUPS_AS_OF}`,
      "Agreed scope / coordinator reference:",
      "Public evidence or reproducible result link:",
      "Source revision and observation date:",
      "Method and observed outcome:",
      "Missing evidence, unknown effects or disagreement:",
      "Proposed correction or reasoned no-change:",
      "Relevant competence and conflicts:",
      "Attribution permission:",
      "",
      "Please acknowledge receipt and agree the next review step.",
      "This contribution is not an accepted appointment, independent approval or permission to execute.",
      "I will attach only agreed public evidence; no credentials or private case material.",
    ].join("\n"),
  };
  return {
    subject: `Working group enquiry — ${group.name}`,
    message: [
      `Proposed group: ${group.name}`,
      `First task: ${group.firstTask}`,
      "My public work / reproducible example:",
      "Relevant experience and axis interests:",
      "Independent researcher or organisation (optional):",
      "Conflicts of interest or limits on independence:",
      "Time available and funding requirements:",
      "Accessibility or participation needs (optional):",
      "",
      "Please reply with a bounded scope and participation terms.",
      "This is an enquiry. Membership and permission to publish my name require separate agreement.",
      "I will not include confidential case evidence or personal data about other people.",
    ].join("\n"),
  };
}
