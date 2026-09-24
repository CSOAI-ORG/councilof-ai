/**
 * 410 Gone for artifacts the owner withdrew. The deployment no longer contains them, but the
 * Pages asset cache kept serving the old bytes on the exact URL (verified 2026-09-24: production
 * deployment 404, alias 200 with age 74335 s), and no available credential can purge. A Function
 * runs before static assets, so this answers first. The bytes, signature and OTS proofs are
 * archived off-site with a withdrawal receipt; this route is not a claim that they never existed.
 */
export function withdrawn(note: string) {
  return () =>
    new Response(`410 Gone. ${note}\nOur own membership record: https://councilof.ai/memberships\n`, {
      status: 410,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
}
