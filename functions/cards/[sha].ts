/**
 * /cards/<sha>.json — the card-bytes door.
 *
 * Cloudflare Pages Functions take precedence over _redirects, so this route now owns
 * every /cards/<segment> request the splat used to serve. It keeps the old contract
 * byte-for-byte for the canonical 16-hex form (302 to the same HF resolve URL the
 * splat emitted) and adds the one grammar the splat could not express: a client that
 * asks with the FULL 64-hex digest from root.json gets the same card instead of a
 * mirror 404.
 *
 * Unknown shapes keep the splat's exact behavior: the raw segment passes through,
 * so nothing that resolved before stops resolving.
 *
 * 302 (not 308) matches the replaced _redirects rule: card bytes are
 * content-addressed and the hop is idempotent, so no client is expected to carry
 * method semantics across it. The redirect is short-cached: a digest is stable but
 * the mirror's path is not a contract.
 */
import { headFromGet } from "../api/_head";
import { normalizeCardSha } from "./_sha";

const MIRROR_BASE =
  "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/cards";

/** Build the mirror URL for a /cards/<segment> request, or null for unknown shapes. */
export function cardMirrorUrl(segment: string): string | null {
  const norm = normalizeCardSha(segment);
  if (norm) return `${MIRROR_BASE}/${norm.sha16}.json`;
  const cleaned = segment.replace(/\.json$/, "");
  return cleaned ? `${MIRROR_BASE}/${cleaned}.json` : null;
}

export const onRequestGet: PagesFunction = async ({ params }) => {
  const segment = Array.isArray(params.sha) ? String(params.sha[0]) : String(params.sha ?? "");
  const target = cardMirrorUrl(segment);
  if (!target) return new Response("Not Found", { status: 404 });
  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "public, max-age=300" },
  });
};

export const onRequestHead = headFromGet(onRequestGet);
