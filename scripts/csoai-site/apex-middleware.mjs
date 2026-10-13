// csoai.org redirect middleware (Pages project csoai-site).
//
// csoai-site-deploy.yml copies this file, byte for byte, to functions/_middleware.js in the
// deploy folder. It is kept here as a file, not as a heredoc in the workflow, so that
// scripts/csoai-site/apex-gate.mjs and apex-gate.test.mjs run the exact bytes that ship.
//
// The rule (owner ruling 1 Sep 2026, one public website):
//   /.well-known/*   is served from this host (did:web:csoai.org and key discovery).
//   everything else  is a 308 to the same path and query on https://councilof.ai.
//
// The Location is the literal origin plus the path. It is never built with
// new URL(path, base): that call reads "//host/x" and "/\host/x" as another host. The
// middleware this file replaces did exactly that, and https://csoai.org//example.com/x
// left for example.com (found 28 Sep 2026; still true of the Actions build on 13 Oct 2026).
//
// Runs of "/" are collapsed before anything else, as Cloudflare Pages itself does for the
// deployment that served csoai.org on 13 Oct 2026: "//example.com/x" goes to
// https://councilof.ai/example.com/x, and "//.well-known/did.json" is still the DID document.
const TARGET = 'https://councilof.ai';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/[\\/]+/g, '/');
  if (path.startsWith('/.well-known/')) {
    return context.next();
  }
  const rest = path.startsWith('/') ? path : '/' + path;
  return new Response(null, { status: 308, headers: { Location: TARGET + rest + url.search } });
}
