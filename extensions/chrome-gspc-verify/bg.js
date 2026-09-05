/**
 * bg.js — MV3 service worker. Two jobs, both read-only:
 *   1. fetchJson: fetch a JSON/JSONL URL on behalf of the popup or the content script.
 *      Only two origins are ever allowed (the board authority and the public Hub); any
 *      other URL is refused here regardless of who asks.
 *   2. hubIndex: the public hub-cards index, cached in chrome.storage.local for an hour
 *      so a model page does not re-download ~200 KB on every visit. A cache miss or a
 *      fetch failure yields { rows: null } — the badge then says UNCHECKABLE, never
 *      UNMEASURED: "could not read the index" is not "no card exists".
 * Nothing is written anywhere but the local cache. No identity, no telemetry.
 */
import { INDEX_FILES, parseJsonl } from "./lib/hub.mjs";

const ALLOWED_ORIGINS = new Set(["https://councilof.ai", "https://huggingface.co"]);
const HUB_TTL_MS = 60 * 60 * 1000;
const HUB_KEY = "hubIndex.v1";

async function fetchJson(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return { status: 0, body: null, error: "bad url" };
  }
  if (!ALLOWED_ORIGINS.has(u.origin)) return { status: 0, body: null, error: `origin not allowed: ${u.origin}` };
  try {
    const r = await fetch(u.toString(), { headers: { accept: "application/json" }, cache: "no-store" });
    const text = await r.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    return { status: r.status, body, text: body === null ? text : undefined };
  } catch (e) {
    return { status: 0, body: null, error: String(e?.message ?? e) };
  }
}

async function hubIndex({ force = false } = {}) {
  const now = Date.now();
  if (!force) {
    try {
      const got = await chrome.storage.local.get(HUB_KEY);
      const c = got?.[HUB_KEY];
      if (c && Array.isArray(c.rows) && now - c.fetchedAt < HUB_TTL_MS) return { rows: c.rows, fetchedAt: c.fetchedAt, cached: true };
    } catch {
      /* storage unavailable — fall through to fetch */
    }
  }
  const rows = [];
  const sources = [];
  for (const url of INDEX_FILES) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        sources.push({ url, ok: false, status: r.status });
        continue;
      }
      const part = parseJsonl(await r.text());
      for (const row of part) rows.push({ ...row, _source: url });
      sources.push({ url, ok: true, rows: part.length });
    } catch (e) {
      sources.push({ url, ok: false, error: String(e?.message ?? e) });
    }
  }
  if (!sources.some((s) => s.ok)) return { rows: null, fetchedAt: now, sources };
  try {
    await chrome.storage.local.set({ [HUB_KEY]: { rows, fetchedAt: now, sources } });
  } catch {
    /* cache is a convenience */
  }
  return { rows, fetchedAt: now, sources, cached: false };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (!msg || typeof msg !== "object") return sendResponse({ error: "bad message" });
    if (msg.type === "fetchJson") return sendResponse(await fetchJson(msg.url));
    if (msg.type === "hubIndex") return sendResponse(await hubIndex({ force: !!msg.force }));
    sendResponse({ error: `unknown message type ${msg.type}` });
  })().catch((e) => sendResponse({ error: String(e?.message ?? e) }));
  return true; // async sendResponse
});
