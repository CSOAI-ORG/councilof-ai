/**
 * hub.mjs — look a Hugging Face model id up in the PUBLIC hub-cards index.
 *
 * Source: the public dataset csoai/gspc-hub-cards (CC-BY-4.0). Two files carry rows:
 *   mill-cards/INDEX.jsonl  — model ids are Hub ids (org/model), signed under
 *                              did:web:csoai.org#board-attestation-1
 *   cards.jsonl             — model ids are local runner tags (qwen3:0.6b …), signed
 *                              under did:web:csoai.org#card-attestation-1
 * A page's model id is matched EXACTLY (case-insensitively) against the `model`
 * column. No fuzzy matching: a near-miss is absence, and absence is UNMEASURED.
 *
 * The index is a convenience listing, not evidence — it is unsigned. The badge
 * therefore links to the signed card and offers to verify it; it never shows a
 * number the card does not carry.
 */
export const HUB_DATASET = "csoai/gspc-hub-cards";
export const INDEX_FILES = Object.freeze([
  `https://huggingface.co/datasets/${HUB_DATASET}/resolve/main/mill-cards/INDEX.jsonl`,
  `https://huggingface.co/datasets/${HUB_DATASET}/resolve/main/cards.jsonl`,
]);

/** Parse JSONL leniently: a bad line is skipped, never fatal. */
export function parseJsonl(text) {
  const out = [];
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    try {
      const o = JSON.parse(t);
      if (o && typeof o === "object") out.push(o);
    } catch {
      /* skip */
    }
  }
  return out;
}

/** Hub model id from a huggingface.co pathname, or null when the path is not a model page. */
const RESERVED = new Set([
  "datasets", "spaces", "models", "collections", "docs", "blog", "papers", "tasks", "pricing",
  "settings", "login", "join", "organizations", "api", "search", "new", "learn", "posts",
  "enterprise", "inference-endpoints", "chat", "terms-of-service", "privacy", "huggingface",
  "front", "static-proxy", "brand", "welcome", "notifications", "spaces-launch", "changelog",
]);
export function modelIdFromPath(pathname) {
  const m = /^\/([^\/?#]+)\/([^\/?#]+)\/?/.exec(pathname || "");
  if (!m) return null;
  const [, org, name] = m;
  if (RESERVED.has(org.toLowerCase())) return null;
  return `${org}/${name}`;
}

/** Rows whose `model` equals the id (case-insensitive). Returns [] for absence. */
export function lookup(rows, modelId) {
  if (!modelId) return [];
  const want = modelId.toLowerCase();
  return rows.filter((r) => typeof r.model === "string" && r.model.toLowerCase() === want);
}

/** A one-line, honest badge label for a set of rows. Absence is UNMEASURED. */
export function badgeLabel(rows) {
  if (!rows.length) return "UNMEASURED — no signed card";
  const statuses = new Set(rows.map((r) => String(r.status ?? "UNMEASURED")));
  const axes = [...new Set(rows.map((r) => String(r.axis ?? "?")))];
  const status = statuses.size === 1 ? [...statuses][0] : [...statuses].sort().join("/");
  return `${status} — ${rows.length} signed card${rows.length === 1 ? "" : "s"} · ${axes.join(", ")}`;
}
