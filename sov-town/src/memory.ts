import type { MemoryEntry } from "./types.js";

export interface MemorySummary {
  recent: MemoryEntry[];
  highlights: MemoryEntry[];
}

export function importance(entry: MemoryEntry): number {
  let score = 1;
  if (entry.riskTier === "high" || entry.riskTier === "unacceptable") score += 3;
  if (entry.framework) score += 2;
  if (entry.outcome.toLowerCase().includes("violation")) score += 3;
  if (entry.outcome.toLowerCase().includes("escalated")) score += 2;
  return score;
}

export function summarize(memory: MemoryEntry[], keep = 10): MemorySummary {
  const sorted = [...memory].sort((a, b) => importance(b) - importance(a));
  return {
    recent: memory.slice(-keep),
    highlights: sorted.slice(0, keep),
  };
}
