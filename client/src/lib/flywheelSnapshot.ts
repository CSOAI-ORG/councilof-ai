import type { FlywheelPlanet } from "../components/CouncilGalaxy";

type SnapshotView = { generatedAt: string; planets: FlywheelPlanet[] };
const axes = new Set(["care", "continuity", "provenance", "safety", "governance"]);
const sourceStates = new Set(["AVAILABLE", "MISSING", "INVALID_JSON", "INVALID_SHAPE", "UNREADABLE", "OUTSIDE_ROOT", "TOO_LARGE"]);
const freshnessStates = new Set(["WITHIN_WINDOW", "STALE", "UNKNOWN_TIME", "FUTURE_DATED", "UNAVAILABLE"]);
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 600;
const dated = (v: unknown): v is string => typeof v === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));

// Narrow the presentation contract. Legacy snapshots contain unsupported
// labels and per-user rows; they are not an unavailable-source fallback.
export function readFlywheelSnapshot(value: unknown): SnapshotView | null {
  if (!record(value) || value.schema !== "csoai.flywheel-snapshot/0.2" || !dated(value.generated_at) ||
      !Array.isArray(value.planets) || value.planets.length > 100 || value.n_planets !== value.planets.length) return null;
  const seen = new Set<string>();
  const planets: FlywheelPlanet[] = [];
  for (const row of value.planets) {
    if (!record(row) || !text(row.id) || seen.has(row.id) || !text(row.name) ||
        !axes.has(String(row.axis)) || !text(row.metric) || !text(row.description) ||
        !sourceStates.has(String(row.source_status)) || !freshnessStates.has(String(row.freshness)) ||
        row.signature_verified !== false || row.admitted !== false ||
        (row.last_run_iso !== undefined && !dated(row.last_run_iso))) return null;
    seen.add(row.id);
    planets.push({
      id: row.id, name: row.name, axis: row.axis as FlywheelPlanet["axis"], phase: "water",
      metric: row.source_status + " · " + row.freshness + " · " + row.metric,
      description: row.description,
      ...(typeof row.last_run_iso === "string" ? { last_run_iso: row.last_run_iso } : {}),
    });
  }
  // Deliberately do not return citizens or accept source-provided phases.
  return { generatedAt: value.generated_at, planets };
}
