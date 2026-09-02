/**
 * Where it's published — distribution reach, not measurement authority.
 *
 * Authority stays GET /api/gspc + lid + signed cards + free verify.
 * These hosts are printers of the live board: mirrors, registries, archives.
 * Never invent download counters here. Optional live HF rolling downloads are
 * fetched in ReachStrip only when Hugging Face answers; otherwise links alone.
 */

export type ReachSurface = {
  id: string;
  label: string;
  href: string;
  kind: string;
  note: string;
};

export const REACH_RULING =
  "Printers of the live board. Reach is distribution — not a grade, not a certificate, not measurement authority. Cite GET /api/gspc.";

/** Fallback lid if /api/gspc has not answered yet. Matches live totals.lid grammar. */
export const REACH_LID_FALLBACK =
  "22 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.";

export const REACH_SURFACES: ReachSurface[] = [
  {
    id: "hf",
    label: "Hugging Face · csoai",
    href: "https://huggingface.co/csoai",
    kind: "Hub org",
    note: "Signed record + banks. A Hub repo is not a grade.",
  },
  {
    id: "mcp",
    label: "MCP · councilof.ai/mcp",
    href: "https://councilof.ai/mcp",
    kind: "Flagship MCP",
    note: "Official registry io.github.CSOAI-ORG/gspc 1.1.1 → this URL.",
  },
  {
    id: "npm",
    label: "npm · csoai-gspc-mcp",
    href: "https://www.npmjs.com/package/csoai-gspc-mcp",
    kind: "stdio package",
    note: "Local stdio MCP. Same board tools; no invented download count.",
  },
  {
    id: "glama",
    label: "Glama · gspc",
    href: "https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc",
    kind: "MCP directory",
    note: "Claimed connector listing. Directory reach, not a score.",
  },
  {
    id: "kaggle",
    label: "Kaggle · twins",
    href: "https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board",
    kind: "Dataset twin",
    note: "Living-board twin (and siblings under nicktempleman). Mirror, not authority.",
  },
  {
    id: "zenodo",
    label: "Zenodo DOI",
    href: "https://doi.org/10.5281/zenodo.21991104",
    kind: "Archive",
    note: "doi from live GET /api/gspc. External archival anchor we do not control.",
  },
];

/** Hugging Face Hub datasets API — author=csoai. CORS allows councilof.ai. */
export const HF_DATASETS_API =
  "https://huggingface.co/api/datasets?author=csoai&limit=100&full=true";

export type HfReachSnapshot = {
  downloads: number;
  datasets: number;
  asOf: string; // ISO
  source: string;
};

/**
 * Sum rolling downloads across Hub datasets for org csoai.
 * Returns null on any failure — never invent a counter.
 */
export async function fetchHfOrgDownloads(
  signal?: AbortSignal,
): Promise<HfReachSnapshot | null> {
  try {
    const r = await fetch(HF_DATASETS_API, {
      signal,
      headers: { accept: "application/json" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    const items: unknown[] = Array.isArray(data) ? data : [];
    if (items.length === 0) return null;
    let downloads = 0;
    let datasets = 0;
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const it = raw as { downloads?: unknown; downloadsAllTime?: unknown };
      const n =
        typeof it.downloads === "number"
          ? it.downloads
          : typeof it.downloadsAllTime === "number"
            ? it.downloadsAllTime
            : null;
      if (n == null || !Number.isFinite(n) || n < 0) continue;
      downloads += n;
      datasets += 1;
    }
    if (datasets === 0) return null;
    return {
      downloads,
      datasets,
      asOf: new Date().toISOString(),
      source: "https://huggingface.co/csoai",
    };
  } catch {
    return null;
  }
}

export function formatDownloads(n: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.round(n));
}
