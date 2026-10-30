import registry from "../../../council-os/working-groups.json";

/** A dated organisational proposal; never a board-count or measurement authority. */
export const WORKING_GROUPS = registry.groups;
export const WORKING_GROUPS_AS_OF = registry.asOf;
export const WORKING_GROUPS_CHARTER = "https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/governance/public-watchdog-working-groups.md";

export function workingGroup(id: string | null) {
  return WORKING_GROUPS.find(group => group.id === id) ?? null;
}

export function workingGroupEnquiryHref(id: string): string {
  const group = workingGroup(id);
  return group ? `/contact/?${new URLSearchParams({ arm: "working-group", group: group.id })}` : "/contact/";
}

/** Query parameters may select an existing group, never supply names or recipients. */
export function workingGroupEnquiry(id: string | null) {
  const group = workingGroup(id);
  if (!group) return null;
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
