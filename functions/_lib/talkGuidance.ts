/**
 * Published product/navigation help for ordinary first-use questions.
 * This is authored guidance, not a measurement, model reply or execution grant.
 * Source pages: /, /him/, /watchdog/, /academy/ and their existing workspace panes.
 */
export type GuidanceTopic = "getting-started" | "council" | "meok" | "watchdog" | "academy" | "incident-reporting";

/** Only explicit explanatory/navigation questions reach guidance; concrete tool rules run first. */
export function guidanceTopic(raw: string): GuidanceTopic | null {
  const text = raw.toLowerCase().trim().replace(/\s+/g, " ");
  const topic: GuidanceTopic | null =
    (/\b(meok|h\.i\.m\.?|human[- ]in[- ]the[- ]loop)\b/.test(text) || /\bHIM\b/.test(raw)) ? "meok" :
    /\bwatchdog\b/.test(text) ? "watchdog" :
    /\b(academy|lessons?|learning tracks?)\b/.test(text) ? "academy" :
    /\b(council of ai|council ?os|csoai)\b/.test(text) ? "council" : null;
  const explanatory = /^(?:what(?:'s| is| are| does| can)|who (?:is|are)|how (?:do|can|does|to)|where (?:do|can|is)|tell me about|explain|show me|help me (?:use|understand|get started))\b/.test(text);
  if (explanatory && /\b(?:report|reporting|submit)\b/.test(text) && /\b(?:ai|artificial intelligence)\b/.test(text) && /\bincidents?\b/.test(text)) return "incident-reporting";
  const bareTopic = /^(?:meok|h\.?i\.?m\.?|public watchdog|watchdog|academy|council of ai|council ?os|csoai)[?!.]*$/.test(text);
  if (topic && (explanatory || bareTopic)) return topic;
  if (/^(?:where do i start|how do i (?:start|get started)|how can i get started|help me get started|i(?:'m| am) new here|what can i do here)(?: (?:here|with this site|on this site))?[?!.]*$/.test(text)) return "getting-started";
  return null;
}

const FOOTER = "\n\nThis is guidance to published pages. No tool was called and no action was approved or executed.";

export function guidanceAnswer(topic: GuidanceTopic): string {
  if (topic === "incident-reporting") return [
    "**This public Ask does not provide a staffed AI incident-reporting service.** Do not enter private incident details here; this answer does not open a case or notify a reviewer.",
    "You can use the [Public Watchdog](https://councilof.ai/watchdog/) to inspect existing public claims, their sources and correction history. That evidence-reading service is separate from private incident intake or a promise of a response.",
  ].join("\n\n") + FOOTER;
  if (topic === "meok") return [
    "**Start with MEOK H.I.M., the human-in-the-loop layer in Council OS.** It connects an AI proposal with the reading check, operator gate and decision receipt described on the [H.I.M. page](https://councilof.ai/him/).",
    "1. Open [Staff & human review](https://councilof.ai/dashboard?tab=staff) to inspect the proposal and its supporting record.",
    "2. Check which decision-recording, signing and persistence gates are available. A recorded decision is separate from the person's identity, authority and permission to execute.",
    "3. Use [H.I.M.](https://councilof.ai/dashboard?tab=him) to follow the published review workflow.",
    "This public Ask answers by fixed rules and published records; this reply is not a live MEOK model response or evidence that a proposed action ran.",
  ].join("\n\n") + FOOTER;
  if (topic === "watchdog") return [
    "**Use the [Public Watchdog](https://councilof.ai/watchdog/) to follow a public claim to its evidence.**",
    "1. Pick a subject, then a claim. Read the source, recorded date and history.",
    "2. Open the evidence and inspect the separate verification results; a valid signature does not establish that the underlying claim is true.",
    "3. Keep the claim's link to reopen that published record, or read the [corrections](https://councilof.ai/dashboard?tab=corrections) and [research library](https://councilof.ai/watchdog/?view=library).",
    "This is a public evidence-reading journey, not a staffed incident-response service. Do not put private incident details in public Ask.",
  ].join("\n\n") + FOOTER;
  if (topic === "academy") return [
    "**Open the [Council Academy](https://councilof.ai/academy/) for the foundations, or [learning tracks](https://councilof.ai/dashboard?tab=learn) for a guided route through the published results.**",
    "Read a result, follow its source and method, then practise evaluating the evidence. The [Academy workspace](https://councilof.ai/dashboard?tab=academy) keeps the lessons in Council OS.",
    "Reading marks and practice scores do not grant a professional qualification or permission to act, and do not by themselves train a deployed AI model. The Academy explains its completion-record requirements separately.",
  ].join("\n\n") + FOOTER;
  return [
    topic === "council"
      ? "**Council of AI publishes AI measurement results and evidence that readers can inspect and re-check.** Council OS is the workspace for those results, tools, lessons and review workflows. See the [Council of AI homepage](https://councilof.ai/)."
      : "**Start with what you want to check:**",
    "- **Compare published results:** open the [measurement board](https://councilof.ai/board/), or ask “What does the leaderboard show?”",
    "- **Investigate a public claim:** open the [Public Watchdog](https://councilof.ai/watchdog/) and follow a claim to its source and history.",
    "- **Check a signed record:** use the [record verifier](https://councilof.ai/gspc-verify/).",
    "- **Learn the method:** start in the [Academy](https://councilof.ai/academy/).",
    "- **Understand human review:** read [MEOK H.I.M.](https://councilof.ai/him/) before opening the review console.",
    "Published measurements have a stated scope and date; they are not certifications. This Ask reads published records using fixed rules. It is not a general-purpose AI conversation.",
  ].join("\n\n") + FOOTER;
}
