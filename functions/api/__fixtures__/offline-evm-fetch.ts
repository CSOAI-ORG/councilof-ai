/**
 * A test network: a readable empty cards corpus at the canonical corpus URL, well-formed EVM
 * JSON-RPC answers (one finalized block every operator agrees on, a 32-byte word for eth_call),
 * and `{}` for other fetches.
 *
 * The wrapper doors (/api/wrapper, /api/wrapper/asset/*) read the chain BEFORE they offer anything:
 * an unreadable pair answers 200 preview-only, never 402 (plan item #19, 2026-09-28). A test network
 * that answers `{}` to everything would therefore make them — correctly — decline to sell. Tests that
 * call every advertised door for its 402 use this instead of a bare `{}` stub.
 */
export async function offlineEvmFetch(_u: string | URL | Request, init?: RequestInit): Promise<Response> {
  let body: { jsonrpc?: string; method?: string } | null = null;
  try {
    body = init?.body ? JSON.parse(String(init.body)) : null;
  } catch {
    body = null;
  }
  const ok = (result: unknown) =>
    new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200, headers: { "content-type": "application/json" } });
  if (body?.jsonrpc === "2.0" && body.method === "eth_getBlockByNumber") return ok({ number: "0x100", hash: "0x" + "ab".repeat(32), timestamp: "0x68c4f000" });
  if (body?.jsonrpc === "2.0" && body.method === "eth_call") return ok("0x" + (6).toString(16).padStart(64, "0"));
  // Available-door parity needs an explicit empty corpus; `{}` means the source is unreadable.
  const url = typeof _u === "string" ? _u : _u instanceof URL ? _u.href : _u.url;
  if (url === "https://councilof.ai/cards-bundle.json") {
    return new Response(JSON.stringify({ cards: {} }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
}

