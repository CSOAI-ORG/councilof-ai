/**
 * GET /api/distribution-ledger — one deduplicated list of every outward
 * surface CSOAI has shipped to, with canonical URL, state, checked_at,
 * and proof for each entry.
 *
 * Aggregates the three existing ledgers into a single typed record:
 * - public/interop/platforms-registered.json  (GitHub, npm, HF, Kaggle, etc.)
 * - public/interop/mcp-directories.json       (MCP registries/directories)
 * - public/interop/a2a-directories.json       (A2A registries)
 *
 * Each aggregated entry carries:
 *   id            stable identifier (e.g. "github:councilof-ai")
 *   platform      human-readable name
 *   category      {registry, marketplace, channel, capability-directory}
 *   canonical_url the canonical surface URL
 *   resource      the CSOAI resource the entry names (when applicable)
 *   state         one of {live, planned, stale, absent}
 *   checked_at    ISO timestamp from the source ledger's as_of
 *   proof         evidence URL or quoted text
 *   proof_note    what the proof demonstrates
 *   source_file   which ledger this entry was derived from
 *   source_id     the entry's identifier in the source ledger
 *
 * Dedup: the same (platform, canonical_url) pair is collapsed into one
 * record. Records with no canonical URL are skipped (an entry whose
 * "proof is the URL" doesn't exist is not a listing).
 */

import platforms from "../../public/interop/platforms-registered.json";
import mcpDirs from "../../public/interop/mcp-directories.json";
import a2aDirs from "../../public/interop/a2a-directories.json";

type Category = "registry" | "marketplace" | "channel" | "capability-directory";

interface DistributionEntry {
  id: string;
  platform: string;
  category: Category;
  canonical_url: string | null;
  resource: string | null;
  state: "live" | "planned" | "stale" | "absent" | "unknown";
  checked_at: string | null;
  proof: string | null;
  proof_note: string | null;
  source_file: string;
  source_id: string;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Map a source ledger's own status word onto the served states.
 *
 * An unrecognised or UNKNOWN source state is served as "unknown", never as "planned":
 * mcp-directories.json records UNKNOWN (the probe could not decide) and a2a-directories.json
 * records NOT_A_DIRECTORY (the target is not a directory at all). The first version of this
 * route defaulted both to "planned", which publishes an intent no ledger recorded.
 */
export function normalizeStatus(s: string | null | undefined): DistributionEntry["state"] {
  const v = (s ?? "").toLowerCase();
  if (v === "live" || v === "listed") return "live";
  if (v === "planned" || v === "staged") return "planned";
  if (v === "stale" || v === "live+stale") return "stale";
  if (v === "absent" || v === "not_listed" || v === "removed" || v === "not_a_directory") return "absent";
  return "unknown";
}

function pickOne<T>(...vals: (T | null | undefined)[]): T | null {
  for (const v of vals) if (v != null) return v;
  return null;
}

export function buildLedger(): DistributionEntry[] {
  const entries: DistributionEntry[] = [];
  const seen = new Set<string>();

  // 1. platforms-registered.json — GitHub, npm, HuggingFace, Kaggle, etc.
  const pr = platforms as { registrations: Array<Record<string, unknown>>; as_of?: string };
  for (const r of pr.registrations ?? []) {
    const platform = String(r.platform ?? "");
    const canonical_url = pickOne<string>(r.url as string, r.proof_url as string);
    if (!platform || !canonical_url) continue;
    const state = normalizeStatus(r.status as string);
    const key = `${slugify(platform)}::${canonical_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      id: key,
      platform,
      category: "channel",
      canonical_url,
      resource: (r.manifest as string) ?? null,
      state,
      checked_at: pr.as_of ?? null,
      proof: (r.proof_url as string) ?? (r.proof as string) ?? null,
      proof_note: (r.status_note as string) ?? (r.proof as string) ?? null,
      source_file: "public/interop/platforms-registered.json",
      source_id: String(r.platform ?? ""),
    });
  }

  // 2. mcp-directories.json — MCP-capable directories (registry, smithery, glama, etc.)
  const mc = mcpDirs as { directories: Array<Record<string, unknown>>; as_of?: string };
  for (const d of mc.directories ?? []) {
    const platform = String(d.name ?? d.id ?? "");
    const canonical_url = (d.url as string) ?? null;
    if (!platform || !canonical_url) continue;
    const key = `mcp::${canonical_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      id: key,
      platform,
      category: "capability-directory",
      canonical_url,
      resource: null,
      state: normalizeStatus(d.state as string),
      checked_at: mc.as_of ?? null,
      proof: (d.evidence as string) ?? (d.probe as string) ?? null,
      proof_note: (d.evidence as string) ?? null,
      source_file: "public/interop/mcp-directories.json",
      source_id: String(d.id ?? ""),
    });
  }

  // 3. a2a-directories.json — A2A registries
  const a2 = a2aDirs as { directories: Array<Record<string, unknown>>; as_of?: string };
  for (const d of a2.directories ?? []) {
    const platform = String(d.name ?? d.id ?? "");
    const canonical_url = (d.url as string) ?? null;
    if (!platform || !canonical_url) continue;
    const key = `a2a::${canonical_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      id: key,
      platform,
      category: "registry",
      canonical_url,
      resource: null,
      state: normalizeStatus(d.state as string),
      checked_at: a2.as_of ?? null,
      proof: (d.evidence as string) ?? (d.probe as string) ?? null,
      proof_note: (d.evidence as string) ?? null,
      source_file: "public/interop/a2a-directories.json",
      source_id: String(d.id ?? ""),
    });
  }

  // Sort: live first, then planned, stale, unknown, absent; then by platform name.
  const order: Record<DistributionEntry["state"], number> = { live: 0, planned: 1, stale: 2, unknown: 3, absent: 4 };
  return entries.sort((a, b) => order[a.state] - order[b.state] || a.platform.localeCompare(b.platform));
}

export const onRequestGet: PagesFunction = async () => {
  const entries = buildLedger();
  const byState = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.state] = (acc[e.state] ?? 0) + 1;
    return acc;
  }, {});
  const body = {
    schema: "csoai.distribution-ledger/0.1",
    title: "CSOAI outward distribution ledger — deduplicated destinations",
    endpoint: "/api/distribution-ledger",
    contract:
      "One deduplicated list of every outward surface CSOAI has shipped to. " +
      "Each entry carries canonical_url, state, checked_at, and proof. " +
      "Dedup key is (platform, canonical_url). Entries without canonical_url are skipped. " +
      "A platform's homepage is not proof of a CSOAI listing — proof is the resource or the directory's held entry. " +
      "A source state this route does not recognise is served as unknown, never as planned.",
    summary: {
      total: entries.length,
      by_state: byState,
      checked_at_earliest: entries.reduce<string | null>((min, e) => {
        if (!e.checked_at) return min;
        if (!min) return e.checked_at;
        return e.checked_at < min ? e.checked_at : min;
      }, null),
      checked_at_latest: entries.reduce<string | null>((max, e) => {
        if (!e.checked_at) return max;
        if (!max) return e.checked_at;
        return e.checked_at > max ? e.checked_at : max;
      }, null),
    },
    entries,
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
