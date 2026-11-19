/** Additive, explicit selection from this door's canonical definitions. */
export const TOOLS_LIST_SELECTION = "csoai.org/tools-list";

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function toolsListResult<T extends { name: string }>(definitions: T[], params?: unknown) {
  const meta = object(params) && object(params._meta) ? params._meta : null;
  if (!meta || !Object.prototype.hasOwnProperty.call(meta, TOOLS_LIST_SELECTION)) {
    return { tools: definitions };
  }
  const selector = meta[TOOLS_LIST_SELECTION];
  const invalid = () => ({
    tools: [] as T[],
    _meta: { [TOOLS_LIST_SELECTION]: { version: 1, complete: false, matches: 0, error: "invalid_selector" } },
  });
  if (!object(selector) || selector.version !== 1 || typeof selector.name !== "string" ||
      !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(selector.name) ||
      Object.keys(selector).some((key) => key !== "version" && key !== "name") ||
      (object(params) && params.cursor !== undefined)) return invalid();
  const matches = definitions.filter((tool) => tool.name === selector.name);
  const selection = { version: 1, name: selector.name, complete: false, matches: matches.length };
  // Never serve an ambiguous descriptor, or a tool absent from this door.
  return {
    tools: matches.length === 1 ? matches : [],
    _meta: { [TOOLS_LIST_SELECTION]: {
      ...selection,
      ...(matches.length !== 1 ? { error: matches.length === 0 ? "unknown_tool" : "ambiguous_tool" } : {}),
    } },
  };
}
