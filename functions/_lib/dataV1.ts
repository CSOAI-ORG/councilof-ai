/**
 * data/v1 dataset versions — the read side of the MCP tool quote_dataset_version.
 *
 * Reads the STATIC files scripts/publish_public_root.py writes under /data/v1 (latest.json, the
 * add-only CHANGELOG.json, snapshots/<version>/manifest.json and citation.json) and quotes one
 * version as published: card_count, the snapshot file URLs with their sha256, the manifest's
 * sha256 recomputed here over the served bytes, the citation (doi exactly as published — null
 * today) and the data licence. It never writes, prices or grades anything. Measured, not certified.
 */
import { fetchStatic, type Fetched } from "./measurementCapsule";

export const DATA_V1_ROOT = "/data/v1";
export const DATA_V1_LATEST = `${DATA_V1_ROOT}/latest.json`;
export const DATA_V1_CHANGELOG = `${DATA_V1_ROOT}/CHANGELOG.json`;
const VERSION_RE = /^\d{4}-\d{2}-\d{2}$/;
const DOCTRINE = "measurement, not endorsement";

type Json = Record<string, unknown>;
const rec = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);

async function sha256Hex(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const miss = (f: Exclude<Fetched, { state: "OK" }>, reason: string): Json => ({
  state: f.state,
  doctrine: DOCTRINE,
  reason: `${reason} (${f.url}: ${f.reason})`,
});

export async function quoteDatasetVersion(origin: string, versionArg: unknown): Promise<Json> {
  const asked = versionArg === undefined || versionArg === null || versionArg === "" ? "latest" : String(versionArg);
  if (asked !== "latest" && !VERSION_RE.test(asked))
    return { state: "INVALID_VERSION", doctrine: DOCTRINE, reason: `version must be "latest" or YYYY-MM-DD; got ${JSON.stringify(asked).slice(0, 40)}` };

  const latestF = await fetchStatic(origin, DATA_V1_LATEST);
  if (latestF.state !== "OK") return miss(latestF, "no data/v1 latest.json is published on this origin");
  const latest = rec(latestF.json);
  const latestVersion = typeof latest?.version === "string" ? latest.version : null;
  if (!latestVersion || !VERSION_RE.test(latestVersion))
    return { state: "UNCHECKABLE", doctrine: DOCTRINE, reason: "latest.json names no YYYY-MM-DD version" };

  const changelogF = await fetchStatic(origin, DATA_V1_CHANGELOG);
  const entries = changelogF.state === "OK" && Array.isArray(rec(changelogF.json)?.entries)
    ? ((rec(changelogF.json)!.entries as unknown[]).map(rec).filter(Boolean) as Json[])
    : [];
  const versionsPublished = [...new Set([...entries.map((e) => String(e.version)), latestVersion])].sort();

  const version = asked === "latest" ? latestVersion : asked;
  if (!versionsPublished.includes(version))
    return { state: "NOT_PUBLISHED", doctrine: DOCTRINE, version, versions_published: versionsPublished, reason: `version ${version} is not in latest.json or CHANGELOG.json` };

  const snapBase = `${DATA_V1_ROOT}/snapshots/${version}`;
  const manF = await fetchStatic(origin, `${snapBase}/manifest.json`);
  if (manF.state !== "OK") return { ...miss(manF, `snapshot ${version} manifest could not be read`), version };
  const manifest = rec(manF.json) ?? {};
  const citF = await fetchStatic(origin, `${snapBase}/citation.json`);
  const citation = citF.state === "OK" ? rec(citF.json) : null;

  const entry = entries.find((e) => e.version === version) ?? null;
  const published = version === latestVersion ? latest!.manifest_sha256 : entry?.manifest_sha256;
  const recomputed = await sha256Hex(manF.text);
  const files = Array.isArray(manifest.files)
    ? (manifest.files as unknown[]).map(rec).filter(Boolean).map((f) => ({
        name: f!.name ?? null, url: f!.url ?? null, sha256: f!.sha256 ?? null, bytes: f!.bytes ?? null,
      }))
    : [];

  return {
    state: "PUBLISHED",
    doctrine: DOCTRINE,
    version,
    is_latest: version === latestVersion,
    latest_version: latestVersion,
    versions_published: versionsPublished,
    as_of: manifest.as_of ?? null,
    card_count: typeof manifest.card_count === "number" ? manifest.card_count : null,
    merkle_root: manifest.merkle_root ?? null,
    manifest_url: manF.url,
    manifest_sha256: {
      published: typeof published === "string" ? published : null,
      recomputed,
      match: typeof published === "string" ? published === recomputed : null,
    },
    files,
    citation_url: `${origin}${snapBase}/citation.json`,
    citation: citation
      ? { doi: citation.doi ?? null, preferred_citation: citation.preferred_citation ?? null, title: citation.title ?? null, author: citation.author ?? null }
      : null,
    license: citation?.license_data ?? null,
    changelog_url: `${origin}${DATA_V1_CHANGELOG}`,
    what_this_is_not: "A version quote of published bytes. Not a grade, ranking, approval or certification of anything.",
  };
}
