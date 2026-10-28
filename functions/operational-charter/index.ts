/**
 * GET /operational-charter/ — the canonical Pages charter asset.
 *
 * The original public charter paths can be served by a separate Worker. This
 * Pages route reuses the same asset without a second charter source or changes
 * to the pinned machine charter, amendment history, or publishing authority.
 */
import { headFromGet } from "../api/_head";

type Context = {
  request: Request;
  env?: { ASSETS?: { fetch: (input: Request) => Promise<Response> } };
};

export async function onRequestGet(context: Context): Promise<Response> {
  const assets = context.env?.ASSETS;
  if (!assets) {
    return new Response("Charter asset temporarily unavailable", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
  const url = new URL(context.request.url);
  url.pathname = "/constitutional-harness/";
  url.search = "";
  url.hash = "";
  return assets.fetch(new Request(url, { method: "GET" }));
}

export const onRequestHead = headFromGet(onRequestGet);
