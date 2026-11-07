/** Task preferences restrict the existing router; they never authorize another executor. */
export type AIExecutionSelection = {
  version: 1;
  host: "cloud";
  provider: "council-tools";
  connectivity: "online";
  /** null means the router's published tools; [] means no tools. */
  enabledTools: string[] | null;
};
export const DEFAULT_AI_EXECUTION: AIExecutionSelection = {
  version: 1, host: "cloud", provider: "council-tools", connectivity: "online", enabledTools: null,
};

export function parseAIExecution(
  raw: unknown,
  knownTools?: ReadonlySet<string>,
): AIExecutionSelection {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid AI and tools selection.");
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).some(key => !["version", "host", "provider", "connectivity", "enabledTools"].includes(key))) {
    throw new Error("Unsupported AI and tools setting.");
  }
  if (value.version !== 1 || value.host !== "cloud" || value.provider !== "council-tools" || value.connectivity !== "online") {
    throw new Error("This conversation supports online Council tools only. Local models, other providers and offline execution are not connected.");
  }
  const tools = value.enabledTools;
  if (tools !== null && (!Array.isArray(tools) || tools.length > 256 ||
    tools.some(tool => typeof tool !== "string" || !/^[a-zA-Z0-9_.-]{1,128}$/.test(tool)) ||
    new Set(tools).size !== tools.length)) throw new Error("Invalid enabled tools.");
  if (Array.isArray(tools) && knownTools && tools.some(tool => !knownTools.has(tool))) {
    throw new Error("A selected tool is no longer published. Refresh AI and tools before trying again.");
  }
  return { version: 1, host: "cloud", provider: "council-tools", connectivity: "online", enabledTools: Array.isArray(tools) ? [...tools] as string[] : null };
}

export function blockedAITools(selection: AIExecutionSelection | null, planned: readonly string[]): string[] {
  if (!selection || selection.enabledTools === null) return [];
  const enabled = new Set(selection.enabledTools);
  return [...new Set(planned.filter(tool => !enabled.has(tool)))];
}

/** A confirmation cannot expand either the original task selection or the current restrictions. */
export function restrictAITools(original: AIExecutionSelection, current: AIExecutionSelection): AIExecutionSelection {
  const before = original.enabledTools;
  const now = current.enabledTools;
  return { ...DEFAULT_AI_EXECUTION, enabledTools: before === null ? (now === null ? null : [...now])
    : now === null ? [...before] : before.filter(tool => now.includes(tool)) };
}
