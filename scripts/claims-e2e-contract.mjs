// Probes for the two backend claims Claims E2E still makes, each measured where the site serves it.
//
// RETIRED 2026-11-21: the historical brain contract. Five rows asked https://os.meok.ai/api for a
// `sovereign-backend` health response, an MCP tool list, `meok_govern` and a `/sign` seal. Since
// 11 Nov that host has answered as the MEOK HIM public read plane ({"ok": true, "him":
// "MEOK-HIM-001", "scope": "public-read-plane"}), so every run reported the same five UNCHECKABLE
// rows and exited 1. None of those rows measured a claim this site makes:
//   - the client calls its own /api (VITE_KNOWLEDGE_BASE is unset, so every page uses "/api");
//   - the live MCP door is SITE/mcp, the endpoint the registry entry and the tool runner name;
//   - "Ed25519 · Layer 0 signing" is register claim CR-001 (/claims-register.json): the cards in
//     /signed/card_index.json are Ed25519-signed under did:web:csoai.org#card-attestation-1;
//   - no page calls meok_govern, and no page claims brain health.
// So the tool-list row now reads SITE/mcp, the signing row verifies the published cards, and the
// meok_govern and brain-health rows are gone. An unmeasurable dependency is still UNCHECKABLE, and
// UNCHECKABLE still fails the run.

// /sov3-system-card redirects to the current canonical /council-system-card page.
// Keep this specific: the generic application title must still fail the check.
export const SYSTEM_CARD_TITLE = /^Council system card \| Council of AI$/i;

/** The JSON-RPC message in an MCP response body, whether it came as JSON or as an SSE stream. */
export function parseJsonRpc(text, contentType = "") {
  const type = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (type !== "text/event-stream") return JSON.parse(text);
  // One event per blank-line-separated block; an event's data may span several data: lines.
  const messages = String(text)
    .split(/\r?\n\r?\n/)
    .map((block) => block.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).replace(/^ /, "")).join("\n"))
    .filter(Boolean)
    .map((data) => JSON.parse(data));
  const answer = messages.find((message) => message && typeof message === "object" && ("result" in message || "error" in message));
  if (!answer) throw new Error("the event stream carried no JSON-RPC result");
  return answer;
}

/** How many tools an MCP door lists. Throws, with the reason, when it does not answer the call. */
export async function mcpToolCount(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
  const message = parseJsonRpc(await response.text(), response.headers.get("content-type"));
  if (message.error) throw new Error(`${url} tools/list error: ${message.error.message || JSON.stringify(message.error)}`);
  const tools = message.result && message.result.tools;
  if (!Array.isArray(tools)) throw new Error(`${url} tools/list returned no tools array`);
  return tools.length;
}

/** Hex of the Ed25519 key a DID document publishes under `#fragment`, or null when it publishes none. */
export function didKeyHex(didDocument, fragment) {
  const methods = (didDocument && Array.isArray(didDocument.verificationMethod)) ? didDocument.verificationMethod : [];
  const method = methods.find((m) => m && typeof m.id === "string" && m.id.endsWith(fragment));
  const x = method && method.publicKeyJwk && method.publicKeyJwk.crv === "Ed25519" && method.publicKeyJwk.x;
  if (typeof x !== "string" || !x) return null;
  return Buffer.from(x, "base64url").toString("hex");
}

/**
 * Register claim CR-001, checked from the outside: every card /signed/card_index.json lists must
 * verify under the card-attestation key that /.well-known/did.json publishes. The key comes from
 * the DID document, never from the cards, because a card that carries its own key proves only
 * that it is self-consistent.
 *
 * Returns { state: "VALID" | "INVALID" | "UNCHECKABLE", detail }. INVALID is a claim the site's
 * bytes refute; UNCHECKABLE is a claim nobody could measure (a document did not load, or the
 * verifier could not finish), and the caller still reports it as a failed run.
 */
export async function verifyPublishedCards(site, fetchImpl, verifyCard, { fragment = "#card-attestation-1", concurrency = 8 } = {}) {
  const getJson = async (path) => {
    const response = await fetchImpl(site + path, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`${path} answered HTTP ${response.status}`);
    return response.json();
  };
  let did;
  let index;
  try {
    did = await getJson("/.well-known/did.json");
    index = await getJson("/signed/card_index.json");
  } catch (error) {
    return { state: "UNCHECKABLE", detail: `could not read the key or the index: ${error.message}` };
  }
  const key = didKeyHex(did, fragment);
  if (!key) return { state: "INVALID", detail: `/.well-known/did.json publishes no Ed25519 key ${fragment}` };
  const rows = Array.isArray(index && index.cards) ? index.cards : [];
  if (!rows.length) return { state: "INVALID", detail: "/signed/card_index.json lists no cards" };
  if (typeof index.n_cards === "number" && index.n_cards !== rows.length) {
    return { state: "INVALID", detail: `/signed/card_index.json declares ${index.n_cards} cards and lists ${rows.length}` };
  }

  const invalid = [];
  const unchecked = [];
  let valid = 0;
  let next = 0;
  async function worker() {
    while (next < rows.length) {
      const row = rows[next++];
      const id = String((row && row.card) || "");
      const path = typeof row?.card_url === "string" && row.card_url.startsWith("/signed/") ? row.card_url : `/signed/cards/${id}.json`;
      let card;
      try {
        card = await getJson(path);
      } catch (error) {
        unchecked.push(`${id.slice(0, 12)}: ${error.message}`);
        continue;
      }
      if (card.id !== id) { invalid.push(`${id.slice(0, 12)}: ${path} holds card ${String(card.id).slice(0, 12)}`); continue; }
      if (card.pubkey !== key) { invalid.push(`${id.slice(0, 12)}: carries a key other than ${fragment}`); continue; }
      let result;
      try {
        result = await verifyCard(card);
      } catch (error) {
        result = { state: "UNCHECKABLE", reason: error.message };
      }
      if (result.state === "VALID") valid += 1;
      else if (result.state === "INVALID") invalid.push(`${id.slice(0, 12)}: ${result.reason}`);
      else unchecked.push(`${id.slice(0, 12)}: ${result.reason}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));

  const tally = `VALID ${valid} · INVALID ${invalid.length} · UNCHECKABLE ${unchecked.length} of ${rows.length} cards in /signed/card_index.json`;
  const under = `under did:web:csoai.org${fragment} (${key.slice(0, 8)}…), the key /.well-known/did.json publishes`;
  if (invalid.length) return { state: "INVALID", detail: `${tally} ${under}; first: ${invalid[0]}` };
  if (unchecked.length) return { state: "UNCHECKABLE", detail: `${tally}; first: ${unchecked[0]}` };
  return { state: "VALID", detail: `${tally} ${under}` };
}
