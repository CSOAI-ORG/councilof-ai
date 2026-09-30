/**
 * Signed records on the public Hugging Face datasets, read at request time.
 *
 * Every record is accepted only if its csoai.signed-run/0.1 sidecar verifies under the pinned board
 * key (functions/_lib/measurementCapsule.ts verifySidecar — the same check /verify-server and the MCP
 * verify_capsule tool run) AND the data file's sha256 equals the one the signed record pins. A source
 * that fails either check is a SourceError: the page answers 503, it is never rendered from bytes
 * nobody signed.
 */
import { verifySidecar } from "../measurementCapsule";
import { type Ctx, type Json, SourceError, fetchSource, gunzip, jsonl, sha256Hex, utf8 } from "./core";

export const HF = "https://huggingface.co";
export const resolveUrl = (ds: string, path: string) => `${HF}/datasets/${ds}/resolve/main/${path}`;
export const blobUrl = (ds: string, path: string) => `${HF}/datasets/${ds}/blob/main/${path}`;

export interface TreeItem { type: string; path: string; size?: number }

export async function hfTree(ctx: Ctx, ds: string, path = ""): Promise<TreeItem[]> {
  const url = `${HF}/api/datasets/${ds}/tree/main${path ? `/${path}` : ""}`;
  const b = await fetchSource(ctx, url, `${ds} file listing`);
  try {
    const j = JSON.parse(utf8(b));
    if (!Array.isArray(j)) throw new Error("not a list");
    return j as TreeItem[];
  } catch {
    throw new SourceError(`${ds} file listing`, "not a JSON list");
  }
}

export interface SignedRecord {
  dataset: string;
  path: string;
  signedPath: string;
  url: string;
  signedUrl: string;
  sha256: string;
  as_of: string | null;
  json: Json;
  signature: { state: string; signed_at?: string | null; payload_sha256?: string | null };
}

export async function signedRecord(ctx: Ctx, ds: string, path: string, signedPath: string): Promise<SignedRecord> {
  const [recB, sigB] = await Promise.all([fetchSource(ctx, resolveUrl(ds, path), `${ds}/${path}`), fetchSource(ctx, resolveUrl(ds, signedPath), `${ds}/${signedPath}`)]);
  const text = utf8(recB);
  let sidecarJson: unknown;
  let json: Json;
  try {
    sidecarJson = JSON.parse(utf8(sigB));
    json = JSON.parse(text) as Json;
  } catch {
    throw new SourceError(`${ds}/${path}`, "record or signed wrapper is not JSON");
  }
  const sig = await verifySidecar({ state: "OK", url: resolveUrl(ds, signedPath), text: utf8(sigB), json: sidecarJson }, text);
  if (sig.state !== "VERIFIES") throw new SourceError(`${ds}/${path}`, `signature ${sig.state}${sig.reason ? `: ${sig.reason}` : ""}`);
  return {
    dataset: ds, path, signedPath, url: blobUrl(ds, path), signedUrl: blobUrl(ds, signedPath),
    sha256: await sha256Hex(recB), as_of: typeof json.as_of === "string" ? json.as_of : null, json,
    signature: { state: sig.state, signed_at: sig.signed_at ?? null, payload_sha256: sig.payload_sha256 ?? null },
  };
}

/** A data file the signed record pins (published_files[path].sha256, or an explicit pin). */
export async function pinnedFile(ctx: Ctx, rec: SignedRecord, path: string, pin?: string): Promise<Uint8Array> {
  const want = pin ?? ((rec.json.published_files as Record<string, { sha256?: string }> | undefined)?.[path]?.sha256);
  if (!want) throw new SourceError(`${rec.dataset}/${path}`, "the signed record does not pin this file");
  const b = await fetchSource(ctx, resolveUrl(rec.dataset, path), `${rec.dataset}/${path}`);
  const got = await sha256Hex(b);
  if (got !== want) throw new SourceError(`${rec.dataset}/${path}`, `sha256 ${got.slice(0, 12)}… is not the pinned ${want.slice(0, 12)}…`);
  return b;
}

export async function pinnedJsonl(ctx: Ctx, rec: SignedRecord, path: string): Promise<Json[]> {
  const b = await pinnedFile(ctx, rec, path);
  try {
    return jsonl(utf8(path.endsWith(".gz") ? await gunzip(b) : b));
  } catch {
    throw new SourceError(`${rec.dataset}/${path}`, "not JSON lines");
  }
}

/** Newest record.YYYY-MM-DD.json in a dataset root. */
export async function newestDaily(ctx: Ctx, ds: string): Promise<string> {
  const dates = (await hfTree(ctx, ds)).map((x) => x.path.match(/^record\.(\d{4}-\d{2}-\d{2})\.json$/)?.[1]).filter((x): x is string => !!x).sort();
  if (!dates.length) throw new SourceError(`${ds} file listing`, "no dated daily record");
  return dates[dates.length - 1];
}
