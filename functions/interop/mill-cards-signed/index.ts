/**
 * GET /interop/mill-cards-signed/ — an index of the signed mill cards, read from the real files.
 *
 * DERIVED, NEVER TYPED. The list is the leaves of the current mill card root: the unsigned pointer
 * /interop/card-root-latest.json names the root file, and the root file names each card file under
 * /interop/mill-cards-signed/. Both are read through the asset binding at request time, so this page
 * cannot outlive the files it lists, and it types no count of its own. If either read fails, it says
 * which and lists nothing.
 *
 * WHAT IT IS NOT. Not a certification, a rating or a ranking. Listing a card here is not a verify
 * result: each row links the verifier, which reports VALID, INVALID or UNCHECKABLE on its own. The
 * root's count is separate from /signed/card_index.json, /root.json and /api/gspc.
 */
import { headFromGet } from "../../api/_head";

const SITE = "https://councilof.ai";
const DIR = "/interop/mill-cards-signed/";
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface Pointer { root_url?: string; root_sha256?: string; as_of?: string; n_leaves?: number; ots_url?: string; scope?: string }
export interface Leaf { card?: string; model?: string; axis?: string; index?: number }
export interface Root { as_of?: string; n_leaves?: number; merkle_root?: string; n_skipped?: number; leaves?: Leaf[]; skipped?: unknown[] }

const SAFE_CARD = /^signed-[a-z0-9-]+-[0-9a-f]{12}\.json$/;

function shell(title: string, description: string, body: string, ld: object | null): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Council of AI</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow">
<link rel="canonical" href="${SITE}${DIR}">${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:72rem;margin:0 auto;padding:1.5rem;color:#0f172a}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-top:1px solid #e2e8f0;padding:.35rem .5rem;text-align:left;vertical-align:top}code{word-break:break-all}a{color:#065f46}</style></head>
<body><main id="main-content">${body}</main><footer><p><a href="/">Council of AI</a> · <a href="/gspc-verify/">Verify a card</a> · <a href="/feed.xml">Feed</a> · Measurement, not certification.</p></footer></body></html>`;
}

export function render(pointer: Pointer | null, root: Root | null, problem?: string): { status: number; html: string } {
  const title = "Signed mill cards";
  if (!pointer || !root || !Array.isArray(root.leaves)) {
    const why = problem ?? "the card root could not be read";
    return { status: 503, html: shell(title, "Index of signed mill cards (temporarily unreadable).", `<h1>${title}</h1><p role="status">UNCHECKABLE: ${esc(why)}. Nothing is listed in its place. The pointer is <a href="/interop/card-root-latest.json">/interop/card-root-latest.json</a>.</p>`, null) };
  }
  const leaves = root.leaves.filter((l) => typeof l.card === "string" && SAFE_CARD.test(l.card));
  const n = leaves.length;
  const asOf = root.as_of ?? pointer.as_of ?? "not stated";
  const description = `Index of the ${n} signed mill cards committed in the mill card root as of ${asOf}, each linked to its file and to the verifier. Measurement, not certification.`;
  const rows = leaves
    .map((l) => {
      const href = `${DIR}${l.card}`;
      return `<tr><td>${esc(l.index)}</td><td><a href="${esc(href)}"><code>${esc(l.card)}</code></a></td><td>${esc(l.axis ?? "")}</td><td><code>${esc(l.model ?? "")}</code></td><td><a href="/gspc-verify/?card=${encodeURIComponent(href)}">Verify</a></td></tr>`;
    })
    .join("");
  const skipped = typeof root.n_skipped === "number" ? `<p>The root records ${esc(root.n_skipped)} files in this folder that it did not commit (superseded or withdrawn); see <a href="${DIR}SUPERSEDED.jsonl">SUPERSEDED.jsonl</a> and <a href="${DIR}WITHDRAWN.jsonl">WITHDRAWN.jsonl</a>.</p>` : "";
  const body = `<h1>${title}</h1>
<p>${n} cards, read from the mill card root as of <time datetime="${esc(asOf)}">${esc(asOf)}</time>: <a href="${esc(pointer.root_url)}"><code>${esc(pointer.root_url)}</code></a> (sha256 <code>${esc(pointer.root_sha256 ?? "not stated")}</code>, Merkle root <code>${esc(root.merkle_root ?? "not stated")}</code>). The pointer is <a href="/interop/card-root-latest.json">/interop/card-root-latest.json</a>; its timestamp proof is <a href="${esc(pointer.ots_url ?? "")}">${esc(pointer.ots_url ?? "not stated")}</a>, and that file existing is not proof of a Bitcoin anchor.</p>
<p>Being listed here is not a verify result. Open a card in the verifier to see VALID, INVALID or UNCHECKABLE. This count is separate from /signed/card_index.json, /root.json and /api/gspc.</p>
${skipped}
<table><thead><tr><th>Leaf</th><th>Card file</th><th>Axis</th><th>Model</th><th>Check</th></tr></thead><tbody>${rows}</tbody></table>`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: `${SITE}${DIR}`,
    description,
    isPartOf: { "@type": "WebSite", name: "Council of AI", url: SITE },
    publisher: { "@type": "Organization", name: "CSOAI Ltd", url: SITE },
  };
  return { status: 200, html: shell(title, description, body, ld) };
}

type Env = { ASSETS?: { fetch(req: Request | string): Promise<Response> } };

async function readJson<T>(env: Env, origin: string, path: string): Promise<T> {
  if (!env.ASSETS) throw new Error("no asset binding on this deployment");
  const r = await env.ASSETS.fetch(new URL(path, origin).toString());
  if (!r.ok) throw new Error(`${path} answered HTTP ${r.status}`);
  return (await r.json()) as T;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = new URL(request.url).origin;
  let pointer: Pointer | null = null;
  let root: Root | null = null;
  let problem: string | undefined;
  try {
    pointer = await readJson<Pointer>(env, origin, "/interop/card-root-latest.json");
    if (!pointer.root_url || !/^\/interop\/card-root-[0-9-]+\.json$/.test(pointer.root_url)) throw new Error("the pointer names no card-root file");
    root = await readJson<Root>(env, origin, pointer.root_url);
  } catch (e) {
    problem = String((e as Error)?.message ?? e);
  }
  const { status, html } = render(pointer, root, problem);
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
};

export const onRequestHead = headFromGet(onRequestGet);
