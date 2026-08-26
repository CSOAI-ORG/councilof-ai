/**
 * EVM catalog cluster loader — read-only REPORTED stubs (#303–308).
 * Never MEASURED. Never signs. Never invents contract addresses.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type CatalogEntry = {
  slug: string;
  ticker?: string;
  name: string;
  chain: "ethereum" | "solana" | "bnb";
  public_id: string | null;
  public_artifact: string;
  source_url: string;
  as_of: string;
  signing_state: "unsigned";
  measured_score: null;
  play: "clean";
  notes?: string;
};

export type CatalogManifest = {
  schema: "csoai.evm-catalog-cluster/0.1";
  cluster: string;
  batch: string;
  move: string;
  status: "REPORTED";
  measured_score: null;
  as_of: string;
  entries: CatalogEntry[];
};

const dir = dirname(fileURLToPath(import.meta.url));

export function loadCatalog(batchFile: string): CatalogManifest {
  const path = join(dir, batchFile.endsWith(".json") ? batchFile : `${batchFile}.json`);
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as CatalogManifest;
}

export async function fetchCatalogFacts(batchFile: string) {
  const manifest = loadCatalog(batchFile);
  return {
    ...manifest,
    entry_count: manifest.entries.length,
    all_unsigned: manifest.entries.every((e) => e.signing_state === "unsigned"),
    all_unmeasured: manifest.entries.every((e) => e.measured_score === null),
  };
}

const batch = process.argv[2];
if (batch) {
  fetchCatalogFacts(batch).then((f) => console.log(JSON.stringify(f, null, 2)));
}
