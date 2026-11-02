/** Local wayfinding: it offers a page and never asserts verification or page movement. */
export function isVerificationNavigationQuestion(question: string): boolean {
  return /\b(?:where|how)\b/i.test(question) &&
    /\b(?:verify|check)\b/i.test(question) &&
    /\b(?:card|record|signature)\b/i.test(question) &&
    !question.trim().startsWith("{") &&
    !/\bhow\s+many\b|\b(?:count|total)\b/i.test(question) &&
    !/\bhttps?:\/\/\S+|\b(?:card|record)[_-]?id\s*[:=]|\b(?:card|sha256):\S+|\b[a-f0-9]{32,}\b/i.test(question);
}

export const verificationNavigationReply =
  "You can [open Verify](/dashboard?tab=verify) and paste the signed card there. " +
  "It checks the card's hash and signature in your browser and reports VALID, INVALID or UNCHECKABLE. " +
  "This reply only shows you where to go; no card has been checked.";

export function plannedPageReply(steps: number): string {
  return `${steps} page step${steps === 1 ? "" : "s"} prepared. Open Steps to see whether each step ran, failed, or was stopped. A prepared step does not establish that the page moved.`;
}
