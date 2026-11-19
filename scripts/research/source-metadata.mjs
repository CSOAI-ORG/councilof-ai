// Public research metadata only. Keep this module free of Node APIs so the research
// UI and watcher use the same validation without bundling any executor capability.
const text = (value, limit) => typeof value === "string" && value.trim().length > 0 && value.length <= limit
  ? value.trim()
  : undefined;

function reviewedDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}

function rightsUrl(value) {
  if (!text(value, 2048)) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function researchSourceMetadata(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  const result = {};
  if (typeof source.watch === "boolean") result.watch = source.watch;
  const values = {
    reviewed_on: reviewedDate(source.reviewed_on),
    boundary: text(source.boundary, 2048),
    rights_url: rightsUrl(source.rights_url),
    version: text(source.version, 128),
    license: text(source.license, 256),
  };
  for (const [key, value] of Object.entries(values)) if (value !== undefined) result[key] = value;
  return result;
}
