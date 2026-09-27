/** Resolve declared preview inputs without exposing placeholders or foreign links. */
const ORIGIN = "https://councilof.ai";
const PLACEHOLDER = /^<([a-z][a-z0-9_:|/-]*)>$/i;
function parsePreview(template: string): URL | null {
  try {
    const url = new URL(template, ORIGIN);
    if (url.origin !== ORIGIN || !url.pathname.startsWith("/api/") || url.username || url.password || url.hash) return null;
    if (/[<>]/.test(decodeURIComponent(url.pathname))) return null;
    const keys = [...url.searchParams.keys()];
    if (new Set(keys).size !== keys.length) return null;
    for (const value of url.searchParams.values()) {
      if (/[<>]/.test(value) && !PLACEHOLDER.test(value)) return null;
    }
    return url;
  } catch { return null; }
}
export function previewFields(template: string): Array<{ key: string; hint: string }> {
  const url = parsePreview(template);
  if (!url) return [];
  return [...url.searchParams.entries()].flatMap(([key, value]) => {
    const match = PLACEHOLDER.exec(value);
    return match ? [{ key, hint: match[1] }] : [];
  });
}
export function resolvePreview(template: string, values: Record<string, string>): string | null {
  const url = parsePreview(template);
  if (!url) return null;
  const fields = previewFields(template);
  if (!fields.length) return template;
  for (const { key } of fields) {
    const value = values[key]?.trim();
    if (!value || value.length > 512 || /[<>\u0000-\u001f]/.test(value)) return null;
    url.searchParams.set(key, value);
  }
  return url.href;
}
