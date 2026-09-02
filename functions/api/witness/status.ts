/**
 * GET /api/witness/status?sha256=<64hex> — free, always. The state of one witnessed digest:
 *
 *   unknown    404  never queued here (how to queue it)
 *   queued     200  settled + timestamped, waiting for the next hourly public root
 *   witnessed  200  the root as_of + merkle root that first carried it, the leaf's card sha256,
 *                   the /api/proof inclusion path, the RFC-3161 reply, and the ONE root's anchors
 *                   (Rekor logIndex / OTS path) from interop/root-witness-latest.json when that
 *                   sidecar is for the same root — plus a live check that the card sha is in the
 *                   root served right now (bytes adjudicate, never the queue's word alone).
 *   NOT_YET    503  WITNESS_KV not bound
 *
 * Existence of a digest only. Never the bytes, never the URL, never a verdict.
 */
import { ENTRY_SCHEMA, PRESUMPTION, SHA_RE, WITNESS_SCHEMA, json, kvKey, publicView, type WitnessEntry } from "../_witness";

type Env = { WITNESS_KV?: KVNamespace };

type RootWitness = {
  as_of?: string;
  artifact?: { merkle_root?: string; sha256?: string; as_of?: string };
  witnesses?: { rekor?: Record<string, unknown>; ots?: Record<string, unknown>; eas_base?: Record<string, unknown> };
};

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const sha256 = (url.searchParams.get("sha256") || "").trim().toLowerCase();
  if (!SHA_RE.test(sha256)) return json({ schema: WITNESS_SCHEMA, error: "bad_request", reason: "sha256: 64 lowercase hex chars" }, 400);
  if (!env.WITNESS_KV) return json({ schema: WITNESS_SCHEMA, status: "NOT_YET", reason: "WITNESS_KV not bound", sha256 }, 503);

  let entry: WitnessEntry | null = null;
  try {
    entry = (await env.WITNESS_KV.get(kvKey(sha256), "json")) as WitnessEntry | null;
  } catch (e) {
    return json({ schema: WITNESS_SCHEMA, status: "UNCHECKABLE", reason: `queue read failed: ${(e as Error).message}`, sha256 }, 503);
  }
  if (!entry || entry.schema !== ENTRY_SCHEMA) {
    return json({ schema: WITNESS_SCHEMA, status: "unknown", sha256, queue: `${origin}/api/witness?sha256=${sha256}`, note: "Never queued on this rail. Anyone may queue it; verification stays free." }, 404);
  }

  const view = publicView(entry);
  const base = { schema: WITNESS_SCHEMA, ...view, presumption: PRESUMPTION, verify_hints: [`${origin}/signed/HOW-TO-VERIFY-ROOT.md`, "openssl ts -reply -in <rfc3161 reply, base64-decoded> -text", `openssl ts -verify -digest ${sha256} -in <reply> -CAfile <the TSA's published chain>`] };
  if (entry.status !== "witnessed" || !entry.witnessed) {
    return json({ ...base, next_root: "hourly (public-root workflow, minute 7); the writer signs the leaf and marks this entry with the root's as_of + merkle root" });
  }

  // Bytes adjudicate: is the leaf's card sha in the root served right now?
  const w = entry.witnessed;
  const root = await readJson<{ as_of?: string; merkle_root?: string; card_sha256?: string[] }>(`${origin}/root.json`);
  const inLiveRoot = root ? (root.card_sha256 || []).includes(w.card_sha256) : null;
  const side = await readJson<RootWitness>(`${origin}/interop/root-witness-latest.json`);
  const sideMerkle = side?.artifact?.merkle_root || null;
  const anchors =
    w.anchors && Object.keys(w.anchors).length
      ? { source: "recorded at first inclusion", ...w.anchors }
      : side && sideMerkle && root && sideMerkle === root.merkle_root
        ? { source: `${origin}/interop/root-witness-latest.json (current root)`, merkle_root: sideMerkle, rekor: side.witnesses?.rekor || null, ots: side.witnesses?.ots || null, eas_base: side.witnesses?.eas_base || null }
        : { status: "PENDING", reason: "the root-witness sidecar is for another root; anchors are recorded when the writer marks the entry", pointer: `${origin}/interop/root-witness-pointer.json` };

  return json({
    ...base,
    root: { first_as_of: w.root_as_of, first_merkle_root: w.merkle_root, live_as_of: root?.as_of || null, live_merkle_root: root?.merkle_root || null, card_in_live_root: inLiveRoot },
    card: { sha256: w.card_sha256, url: w.card_url.startsWith("http") ? w.card_url : `${origin}${w.card_url}`, proof: w.proof_url.startsWith("http") ? w.proof_url : `${origin}${w.proof_url}`, inclusion_free: `${origin}/api/proof?sha=${w.card_sha256}` },
    anchors,
  });
};
