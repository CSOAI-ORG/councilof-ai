/**
 * Axis-name resolution for every MCP surface — one alias table (./axis-aliases.json), one rule.
 *
 * Found 2026-09-26: `list_cards {"axis":"governance"}` returned [] because the signed card index
 * spells that axis "gov" / "gspc-governance", while get_axis only knew the board's "governance".
 * A caller should not need to know which surface it is talking to in order to name an axis.
 */
import ALIASES from "./axis-aliases.json";

const TABLE = (ALIASES as { axes: Record<string, string[]> }).axes;
const CANON = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(TABLE)) {
  CANON.set(canonical.toLowerCase(), canonical);
  for (const a of aliases) CANON.set(a.toLowerCase(), canonical);
}

/** Canonical board axis id for a name or alias (case-insensitive); an unknown name comes back trimmed and lowercased. */
export function canonicalAxis(name: unknown): string {
  const k = String(name ?? "").trim().toLowerCase();
  return CANON.get(k) ?? k;
}

/** Every spelling that resolves to the same axis as `name` — the canonical id first. */
export function axisSpellings(name: unknown): string[] {
  const c = canonicalAxis(name);
  return TABLE[c] ? [c, ...TABLE[c]] : [c];
}

/** True when two names denote the same axis under the alias table. */
export function sameAxis(a: unknown, b: unknown): boolean {
  return canonicalAxis(a) === canonicalAxis(b);
}
