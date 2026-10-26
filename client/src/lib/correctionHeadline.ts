/**
 * The one-line headline of a published correction, for a "What's new" strip: the first sentence
 * of `what_was_wrong`, cut before the first numbered item " (1)" or at the first ". ".
 *
 * The strip used to print the whole entry (and repeat it in a hover title), so the first screen of
 * Council OS showed several hundred words of correction detail, including withdrawn wording quoted
 * for the record. The full entry stays published, unedited, on /corrections/#<id>.
 */
export function correctionHeadline(whatWasWrong: string | undefined | null): string {
  const text = (whatWasWrong ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  let end = text.length;
  const numbered = text.indexOf(" (1)");
  if (numbered > 0) end = Math.min(end, numbered);
  const stop = text.indexOf(". ");
  if (stop > 0) end = Math.min(end, stop + 1);
  return text.slice(0, end).trim();
}

/** The anchor for one entry on the prerendered corrections ledger page. */
export const correctionHref = (id: string | undefined | null) =>
  id ? `/corrections/#${encodeURIComponent(id)}` : "/corrections/";
