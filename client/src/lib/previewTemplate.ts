/** Preserve the manifest URL; substitute only complete query-value placeholders. */
export function previewFields(template: string): Array<{ key: string; hint: string }> {
  const url = new URL(template, "https://councilof.ai");
  return [...url.searchParams.entries()].flatMap(([key, value]) => {
    const match = /^<([a-z][a-z0-9_-]*)>$/i.exec(value);
    return match ? [{ key, hint: match[1] }] : [];
  });
}

export function resolvePreview(template: string, values: Record<string, string>): string | null {
  const fields = previewFields(template);
  if (!fields.length) return template;
  const url = new URL(template, "https://councilof.ai");
  for (const { key } of fields) {
    const value = values[key]?.trim();
    if (!value || /[<>]/.test(value)) return null;
    url.searchParams.set(key, value);
  }
  return url.href;
}
