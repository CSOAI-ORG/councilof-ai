// GET /api/gspc/axis/:axis — a path alias of GET /api/gspc?axis=:axis.
//
// It serves the SAME bytes as the query form: the request is rewritten to /api/gspc?axis=:axis
// and handed to the board handler in-process, so both forms share one edge-cache key and one
// set of bytes. That is what lets GET /api/gspc?axis=:axis&format=cite name this path as its
// `url` and publish a sha256 that `curl -s <url> | shasum -a 256` reproduces.
// ?format=cite is passed through, so /api/gspc/axis/:axis?format=cite works too.
// An unknown axis answers the board's own 404 (with the list of known axes).
import { onRequestGet as gspcGet } from "../../gspc";

export const onRequestGet: PagesFunction = async (context) => {
  const axis = String((context.params as Record<string, unknown>).axis ?? "");
  const incoming = new URL(context.request.url);
  const target = new URL("/api/gspc", incoming.origin);
  target.searchParams.set("axis", axis);
  const fmt = incoming.searchParams.get("format");
  if (fmt) target.searchParams.set("format", fmt);
  return (gspcGet as unknown as (c: typeof context) => Promise<Response>)({
    ...context,
    request: new Request(target.toString(), { method: "GET", headers: context.request.headers }),
  });
};
