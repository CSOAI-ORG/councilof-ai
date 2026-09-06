/**
 * GET /feeds — the index of every feed this estate publishes.
 *
 * WHY. /feeds was a 404. Four derived feeds live underneath it — corrections, cards, the public
 * root, and an Atom mirror of corrections — and the only way to find any of them was to already
 * know the path. That is the same defect functions/feed.xml.ts records about its own predecessor:
 * "a return path that cannot be discovered is the same as no return path."
 *
 * WHAT IT RENDERS. public/interop/feed.json, the machine-readable capability descriptor, plus the
 * live entry count of each derived feed read from the feed modules themselves. The counts are not
 * typed here: entries() is the same function the feeds serve from, so this page cannot claim a
 * feed has items it does not.
 *
 * The descriptor is produced by scripts/badger/csoai-monorepo-fill.py and describes only the
 * legacy /api/feed.xml handler. It is rendered as-is and NOT edited here — it belongs to that
 * producer. Where it is silent about the four derived feeds, this page says so rather than
 * quietly filling the gap.
 */
import descriptor from "../../public/interop/feed.json";
import { entries as corrections } from "./corrections.xml";
import { entries as cards } from "./cards.xml";
import { entries as roots } from "./roots.xml";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Desc { name?: string; state?: string; description?: string; as_of?: string; output?: { format?: string; mutability?: string }; transport?: { path?: string } }

function feeds() {
  const safe = (f: () => { iso: string }[]) => { try { return f(); } catch { return null; } };
  const c = safe(corrections), k = safe(cards), r = safe(roots);
  return [
    { path: "/feeds/corrections.xml", type: "application/rss+xml", title: "Corrections ledger",
      n: c?.length ?? null, newest: c?.[0]?.iso ?? null,
      what: "Every entry is something we got wrong, how it was caught — usually by our own instrument — and the fix. Derived from the ledger, so it cannot lag it." },
    { path: "/feeds/corrections.atom", type: "application/atom+xml", title: "Corrections ledger (Atom)",
      n: c?.length ?? null, newest: c?.[0]?.iso ?? null,
      what: "The same entries in Atom. One source, two syntaxes." },
    { path: "/feeds/cards.xml", type: "application/rss+xml", title: "Newly signed measurement cards",
      n: k?.length ?? null, newest: k?.[0]?.iso ?? null,
      what: "The newest entries in the SIGNED CARD INDEX, each with the id a stranger can verify. Not the public-root leaf set and not the on-disk wrapper count — three corpora, zero overlap." },
    { path: "/feeds/roots.xml", type: "application/rss+xml", title: "The public root",
      n: r?.length ?? null, newest: r?.[0]?.iso ?? null,
      what: "One item by design: there is no root-history artifact, and a back-history invented from one snapshot would be fabricated dates. The guid is the merkle_root, so a poll that finds the same bytes is not a change." },
  ];
}

export const onRequestGet: PagesFunction = async (ctx) => {
  const d = descriptor as unknown as Desc;
  const rows = feeds();
  const wantsJson = (ctx.request.headers.get("accept") || "").includes("application/json");
  if (wantsJson) {
    return new Response(JSON.stringify({
      schema: "csoai.feeds-index/0.1",
      derived_feeds: rows.map(({ path, type, title, n, newest }) => ({ path, type, title, entries: n, newest })),
      legacy_feed: { path: d.transport?.path ?? "/api/feed.xml", aliases: ["/feed.xml", "/rss.xml"],
        note: "Hand-maintained item list. Its historical titles freeze counts the live board has moved past — quote the board, not a feed title." },
      descriptor: descriptor,
      descriptor_note: "public/interop/feed.json is produced by scripts/badger/csoai-monorepo-fill.py and describes only the legacy handler. It is rendered here unchanged; it does not yet describe the four derived feeds.",
    }, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" } });
  }

  const alt = rows.map((f) => `<link rel="alternate" type="${f.type}" title="${esc(f.title)}" href="https://councilof.ai${f.path}">`).join("\n");
  const cards_ = rows.map((f) => `<article>
  <h3><a href="${f.path}">${esc(f.title)}</a></h3>
  <p class="mut"><code>${f.path}</code> · ${esc(f.type)} · ${f.n === null ? '<span class="u">entry count UNAVAILABLE — the module did not load</span>' : `${f.n} item${f.n === 1 ? "" : "s"}`}${f.newest ? ` · newest ${esc(String(f.newest).slice(0, 10))}` : ""}</p>
  <p>${esc(f.what)}</p></article>`).join("\n");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Feeds — Council of AI</title>
<meta name="description" content="Every feed the Council of AI publishes: the corrections ledger, newly signed measurement cards, and the public root. Derived from the artifacts, free, no account.">
<link rel="canonical" href="https://councilof.ai/feeds">
${alt}
<style>
:root{color-scheme:light dark;--fg:#111;--bg:#fff;--mut:#555;--line:#e5e5e5;--pre:#f6f6f6;--u:#b45309}
@media(prefers-color-scheme:dark){:root{--fg:#e9e9e9;--bg:#0f1115;--mut:#a2a2a2;--line:#262a31;--pre:#171a20;--u:#f59e0b}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:50rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
h1{font-size:1.7rem;margin:0 0 .3rem}h2{margin:2rem 0 .5rem;font-size:1.05rem;border-bottom:1px solid var(--line);padding-bottom:.3rem}
h3{margin:0 0 .2rem;font-size:1rem}
.mut{color:var(--mut);font-size:.9rem;margin:.15rem 0 .4rem}.u{color:var(--u)}
article{border-left:2px solid var(--line);padding-left:1rem;margin:1.1rem 0}
pre{background:var(--pre);border:1px solid var(--line);border-radius:6px;padding:.6rem .7rem;overflow-x:auto;font-size:.82rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
a{color:inherit}
</style></head><body><main>
<h1>Feeds</h1>
<p class="mut">Watch what changes here, without an account and without telling us who you are. Every feed below is DERIVED from the artifact it reports on, so none can lag behind what it describes.</p>

<h2>Derived feeds</h2>
${cards_}

<h2>The older feed, kept for its subscribers</h2>
<article><h3><a href="${esc(d.transport?.path ?? "/api/feed.xml")}">${esc(d.name ?? "State-change RSS feed")}</a></h3>
<p class="mut"><code>${esc(d.transport?.path ?? "/api/feed.xml")}</code> · aliases <code>/feed.xml</code>, <code>/rss.xml</code> · state ${esc(d.state ?? "unknown")} · as_of ${esc(d.as_of ?? "unstated")}</p>
<p>${esc(d.description ?? "")}</p>
<p class="mut">It is a hand-maintained item list: its historical titles freeze counts the live board has moved past. Quote the board, not a feed title.</p></article>

<h2>What this page is rendering</h2>
<p class="mut">The capability descriptor at <a href="/interop/feed.json">/interop/feed.json</a> is produced by another lane and describes only the legacy handler — it does not yet describe the four derived feeds. It is rendered here unchanged rather than edited.</p>
<pre><code>curl -s https://councilof.ai/feeds -H 'accept: application/json' | jq .
curl -sI https://councilof.ai/feeds/corrections.xml</code></pre>

<p class="mut">Machine-readable: this page with <code>accept: application/json</code>. Measurement, not certification — we do not certify. Verification is free and needs no account.</p>
</main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
};
