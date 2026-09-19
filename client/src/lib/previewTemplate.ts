/** Bounded first-party preview substitution. No fetching, payment or destination validation. */
export type PreviewField = { key: string; hint: string };
export const PREVIEW_VALUE_LIMIT = 2048;
const ORIGIN = "https://councilof.ai";
const CONTROLS = /[\x00-\x1f\x7f]/;
const UNPAIRED_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

/** Only complete query-value <hints> are substitutable; ambiguous links stay unavailable. */
export function inspectPreviewTemplate(template: string): { fields: PreviewField[] } | null {
  if (typeof template !== "string" || !template || template.length > 4096 ||
      /[\s\\]/u.test(template) || CONTROLS.test(template) || UNPAIRED_SURROGATE.test(template) ||
      /%(?![0-9a-f]{2})/i.test(template) || template.includes("#")) return null;
  if (!(template.startsWith("/") || /^https:\/\//i.test(template)) || template.startsWith("//")) return null;
  try {
    const url = new URL(template, ORIGIN);
    if (url.origin !== ORIGIN || url.protocol !== "https:" || url.username || url.password || url.hash) return null;
    const path = decodeURIComponent(url.pathname);
    if (/[<>]/.test(path) || CONTROLS.test(path)) return null;
    const entries = [...url.searchParams.entries()];
    if (entries.length > 50) return null;
    const keys = new Set<string>();
    const fields: PreviewField[] = [];
    for (const [key, value] of entries) {
      if (!/^[a-z][a-z0-9_.-]{0,99}$/i.test(key) || keys.has(key) || CONTROLS.test(value) || value.includes("\uFFFD")) return null;
      keys.add(key);
      if (key === "preview" && value !== "1") return null;
      const placeholder = /^<([^<>\x00-\x20\x7f]{1,128})>$/.exec(value);
      if (placeholder) fields.push({ key, hint: placeholder[1] });
      else if (/[<>]/.test(value)) return null;
    }
    return fields.length <= 20 ? { fields } : null;
  } catch { return null; }
}

/** Legacy field-list API; use inspectPreviewTemplate to distinguish invalid from concrete. */
export function previewFields(template: string): PreviewField[] {
  return inspectPreviewTemplate(template)?.fields ?? [];
}

/** Fixed query values retain their decoded meaning. Concrete templates retain exact bytes. */
export function resolvePreview(template: string, values: Record<string, string>): string | null {
  const inspected = inspectPreviewTemplate(template);
  if (!inspected) return null;
  if (!inspected.fields.length) return template;
  if (!values || typeof values !== "object" || Array.isArray(values)) return null;
  const url = new URL(template, ORIGIN);
  for (const { key, hint } of inspected.fields) {
    if (!Object.prototype.hasOwnProperty.call(values, key) || typeof values[key] !== "string") return null;
    const raw = values[key];
    if (CONTROLS.test(raw) || UNPAIRED_SURROGATE.test(raw)) return null;
    const value = raw.trim();
    if (!value || value.length > PREVIEW_VALUE_LIMIT || /[<>]/.test(value)) return null;
    if (/^https:\/\//i.test(hint)) {
      try {
        const nested = new URL(value);
        if (nested.protocol !== "https:" || nested.username || nested.password || /[\s\\]/u.test(value)) return null;
      } catch { return null; }
    }
    url.searchParams.set(key, value);
  }
  return url.href.length <= 8192 ? url.href : null;
}
