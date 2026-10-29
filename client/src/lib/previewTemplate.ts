/**
 * Preserve the manifest URL; substitute only complete query-value placeholders.
 *
 * A TEMPLATE IS NEVER A LINK. /.well-known/x402.json publishes some free previews as templates:
 * `?asset=<symbol>`, `?id=<wrapped-symbol:chain>`. Until 2026-10-13 a slot was recognised only when
 * its name was letters, digits, "_" and "-", so `<wrapped-symbol:chain>` (a colon) was read as a
 * concrete value and the template went out verbatim as the page's href. The outward gate followed
 * it and got HTTP 400. Two rules now, and the second is the one that holds when the first is wrong:
 *
 *   1. a slot is ANY whole query value written `<…>`, whatever is inside the brackets;
 *   2. whatever is left after substitution, a URL that still carries a slot resolves to null.
 *      The caller shows a null as code text, never as an anchor.
 */

/** A template slot left in a URL: angle brackets or braces, raw or percent-encoded. */
const SLOT = /[<>{}]|%3C|%3E|%7B|%7D/i;

/** True when the published address is a pattern to fill in, not an address that answers. */
export function hasSlot(template: string): boolean {
  return SLOT.test(template);
}

export function previewFields(template: string): Array<{ key: string; hint: string }> {
  const url = new URL(template, "https://councilof.ai");
  return [...url.searchParams.entries()].flatMap(([key, value]) => {
    const match = /^<([^<>]+)>$/.exec(value);
    return match ? [{ key, hint: match[1] }] : [];
  });
}

export function resolvePreview(template: string, values: Record<string, string>): string | null {
  const fields = previewFields(template);
  // No slot anywhere: a concrete manifest preview, returned byte for byte.
  if (!fields.length) return hasSlot(template) ? null : template;
  const url = new URL(template, "https://councilof.ai");
  for (const { key } of fields) {
    const value = values[key]?.trim();
    if (!value || /[<>]/.test(value)) return null;
    url.searchParams.set(key, value);
  }
  // A slot the loop could not fill (in the path, or inside a longer value) is still a slot.
  // Only the parts the template wrote are tested; what the reader typed was checked above.
  const filled = new Set(fields.map((f) => f.key));
  const rest = url.pathname + [...url.searchParams.entries()].filter(([key]) => !filled.has(key)).map(([key, value]) => `${key}=${value}`).join("&");
  return hasSlot(rest) ? null : url.href;
}
