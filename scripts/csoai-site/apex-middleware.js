// csoai.org (Cloudflare Pages project csoai-site): the only Function that host ships.
//
// One public website is councilof.ai (owner ruling, 1 Sep 2026). csoai.org exists for
// did:web:csoai.org, so it serves the files under /.well-known/ and redirects everything else.
//
// This file is a template. scripts/csoai-site/build-apex-functions.mjs copies it to
// functions/_middleware.js and replaces the list below with the files the build really holds.
// Left as it is, the list is empty and every /.well-known/ path answers 404: it fails closed.
//
// Why a list (13 Oct 2026). The middleware used to hand every /.well-known/* path to the Pages
// asset server. Pages has no file for most of them, and with no top-level 404.html it answers
// such a path with /index.html and status 200. So https://csoai.org/.well-known/<anything>
// returned an old landing page as if it were the document asked for. A path that is not on the
// list now gets 404 from here and never reaches the asset server. A listed path is passed
// through untouched: this code never reads or rewrites the bytes of did.json or any other file.
const WELL_KNOWN_FILES = [/*@WELL_KNOWN_FILES@*/];

const LISTED = new Set(WELL_KNOWN_FILES);
const CANONICAL = "https://councilof.ai/";
const PREFIX = "/.well-known/";

// Decide what one request gets. Pure, so a test can read it without a Pages runtime.
//   { kind: "asset" }                    a listed file: the asset server answers
//   { kind: "not_found" }                under /.well-known/ and not listed
//   { kind: "redirect", location }       everything else: 308 to the same path on councilof.ai
// The match is exact and case-sensitive. A trailing slash, a doubled slash or a percent-encoded
// spelling of a listed name is a different path, and is not found.
export function decide(pathname, search, listed = LISTED) {
  if (pathname.startsWith(PREFIX)) {
    return listed.has(pathname) ? { kind: "asset" } : { kind: "not_found" };
  }
  // String concatenation after stripping leading slashes and backslashes. Resolving the path
  // against a base (new URL("//host/x", base)) lands on another host: an open redirect, found
  // on 28 Sep 2026. The "/" that ends CANONICAL closes the authority, so nothing in the path
  // can name a different host.
  let start = 0;
  while (pathname[start] === "/" || pathname[start] === "\\") start += 1;
  return { kind: "redirect", location: CANONICAL + pathname.slice(start) + (search || "") };
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const d = decide(url.pathname, url.search);
  if (d.kind === "asset") return context.next();
  if (d.kind === "not_found") {
    return new Response("Not found\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
  return new Response(null, { status: 308, headers: { location: d.location } });
}
