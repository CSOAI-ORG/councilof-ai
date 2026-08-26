#!/usr/bin/env node
/**
 * generate-signed-index.mjs — build the human-readable index for the /signed/ evidence tree.
 *
 * WHY: /signed/ and /signed/cards/ returned 404. Every artifact under them was reachable
 * only if you already knew its exact filename, which is fine for a machine and useless for
 * the IETF implementers we are actively inviting to read this directory. A verifier who
 * lands on /signed/ and gets a 404 concludes there is nothing to verify.
 *
 * DESIGN RULES for this page, because it sits ON the evidence surface:
 *   - Every number is READ FROM THE BYTES at generate time. Nothing is typed in by hand.
 *   - Where the artifacts disagree with each other, SAY SO on the page. Do not pick a
 *     number and present it as settled. (They currently do disagree: HOW-TO-VERIFY.md
 *     says 313 cards published, card_index.json lists 150, and there are N files on disk.)
 *   - No JS, no external fetches, no fonts. It must render for someone reading over a
 *     hostile network with scripting off.
 *   - It links the bytes; it never restates a claim the bytes do not carry.
 *
 * Run by build:client, alongside generate-redirects.mjs. Output is committed.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIGNED = join(ROOT, "public/signed");
const CARDS = join(SIGNED, "cards");

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kb = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);
const sizeOf = (p) => { try { return statSync(p).size; } catch { return null; } };

// One line each, describing what the FILE is — not what we would like it to prove.
const BLURB = {
  "card_index.json": "Index of published measurement cards. Each row carries card id, axis, timestamp, signed flag and key id — the full payload (pubkey, signature, preimage) lives in the per-card file.",
  "chain.json": "The card chain manifest: every position listed head to genesis, in order. A card whose body is not published appears as a position with body_published:false — visible and counted — rather than as an absence. Each LINK carries a signature; the manifest itself carries none, so it is not proof that no position was removed.",
  "chain-facts.json": "Counts re-derived from these bytes by scripts/derive-chain-facts.mjs — card bodies published, how many actually verify, and how much of the withheld set is attested by a signature rather than only by the manifest. Regenerated, never typed.",
  "gspc-board.signed.json": "The signed board snapshot.",
  "gspc-measurement.json": "Measurement output behind the board.",
  "board_living.json": "The living board state.",
  "arena_scoreboard.json": "Arena scoreboard artifact.",
  "eat_compliance_board.json": "Compliance board artifact.",
  "verify-card.mjs": "Standalone verifier. Runs on plain Node with no dependencies and no network beyond fetching the card and the DID document.",
  "HOW-TO-VERIFY.md": "Step-by-step verification, starting with pinning the key against /.well-known/did.json. Served as text/plain so it renders in a browser instead of downloading.",
};

const STYLE = `
:root{--bg:#fff;--fg:#111;--dim:#5a5a5a;--line:#e3e3e3;--accent:#12467b;--code:#f5f6f8}
@media (prefers-color-scheme:dark){:root{--bg:#12141a;--fg:#e8e8ea;--dim:#a0a4ad;--line:#2a2e37;--accent:#8ab4f8;--code:#1b1e26}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{max-width:56rem;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-size:1.6rem;margin:0 0 .25rem}
h2{font-size:1.05rem;margin:2.25rem 0 .6rem;padding-bottom:.3rem;border-bottom:1px solid var(--line)}
p{margin:.6rem 0}
a{color:var(--accent)}
.lede{color:var(--dim);margin-bottom:1.5rem}
table{width:100%;border-collapse:collapse;font-size:.92rem}
th,td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--dim);font-weight:600;white-space:nowrap}
td.n{white-space:nowrap;color:var(--dim);font-variant-numeric:tabular-nums}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86rem}
pre{background:var(--code);padding:.9rem;border-radius:6px;overflow-x:auto;border:1px solid var(--line)}
.note{background:var(--code);border-left:3px solid var(--accent);padding:.8rem 1rem;border-radius:0 6px 6px 0;margin:1.25rem 0}
.mono-list{columns:3 14rem;column-gap:1.5rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;list-style:none;padding:0;margin:0}
.mono-list li{break-inside:avoid;margin:0 0 .2rem}
footer{margin-top:3rem;color:var(--dim);font-size:.85rem;border-top:1px solid var(--line);padding-top:1rem}
`;

const page = (title, body) =>
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="robots" content="index,follow">
<style>${STYLE}</style>
</head>
<body><main>
${body}
<footer>Generated from the published bytes by <code>scripts/generate-signed-index.mjs</code>. Every count on this page was read from the files in this directory at build time.</footer>
</main></body>
</html>
`;

if (!existsSync(SIGNED)) { console.error("generate-signed-index: no public/signed — nothing to index"); process.exit(0); }

// ── read the bytes ───────────────────────────────────────────────────────────
const cardFiles = existsSync(CARDS) ? readdirSync(CARDS).filter((f) => f.endsWith(".json")).sort() : [];

let idx = null;
try { idx = JSON.parse(readFileSync(join(SIGNED, "card_index.json"), "utf8")); } catch { /* reported below */ }
const idxRows = idx ? (Array.isArray(idx) ? idx : idx.cards ?? idx.items ?? []) : [];
const byId = new Map(idxRows.map((r) => [r.card, r]));

// Any count HOW-TO-VERIFY.md states about itself, so the page can show the disagreement
// instead of quietly choosing a side.
let docCount = null;
try {
  const m = readFileSync(join(SIGNED, "HOW-TO-VERIFY.md"), "utf8").match(/Cards published:\*\*\s*(\d+)/);
  if (m) docCount = Number(m[1]);
} catch { /* optional */ }

// Top-level artifacts, excluding dotfiles (Cloudflare Pages does not upload them anyway)
// and the index pages this script writes.
const top = readdirSync(SIGNED)
  .filter((f) => !f.startsWith(".") && f !== "index.html" && f !== "cards")
  .filter((f) => { try { return statSync(join(SIGNED, f)).isFile(); } catch { return false; } })
  .sort();

// ── /signed/index.html ───────────────────────────────────────────────────────
const counts = [
  ["files in <code>cards/</code>", cardFiles.length],
  ["rows in <code>card_index.json</code>", idx ? idxRows.length : "unreadable"],
  ...(idx && typeof idx.n_cards === "number" ? [["<code>n_cards</code> declared in <code>card_index.json</code>", idx.n_cards]] : []),
  ...(docCount !== null ? [["cards claimed by <code>HOW-TO-VERIFY.md</code>", docCount]] : []),
];
const distinct = new Set(counts.map(([, v]) => v)).size > 1;

const rows = top.map((f) => {
  const s = sizeOf(join(SIGNED, f));
  return `<tr><td><a href="/signed/${esc(f)}"><code>${esc(f)}</code></a></td><td class="n">${s === null ? "?" : kb(s)}</td><td>${BLURB[f] ? esc(BLURB[f]) : ""}</td></tr>`;
}).join("\n");

const indexBody = `
<h1>Published evidence — <code>/signed/</code></h1>
<p class="lede">Every artifact this directory serves, with its size and what it is. Nothing here asks you to trust us: the verification procedure runs against these bytes with a pinned key.</p>

<div class="note">
<strong>Start here:</strong> <a href="/signed/HOW-TO-VERIFY.md">HOW-TO-VERIFY.md</a> — pin the signing key against
<a href="/.well-known/did.json"><code>/.well-known/did.json</code></a> <em>first</em>. A card that verifies against the key it
ships with proves only that the file is self-consistent, which is not authenticity.
</div>

<h2>What the counts actually say</h2>
<table>
<tr><th>Source</th><th>Count</th></tr>
${counts.map(([k, v]) => `<tr><td>${k}</td><td class="n">${esc(v)}</td></tr>`).join("\n")}
</table>
${distinct ? `<p><strong>These numbers do not agree.</strong> They are printed as read, from the files named. Reconciling them is a change to the artifacts, not to this index, so this page reports the disagreement rather than hiding it behind whichever number reads best.</p>` : ""}

<h2>Artifacts</h2>
<table>
<tr><th>File</th><th>Size</th><th>What it is</th></tr>
${rows}
<tr><td><a href="/signed/cards/"><code>cards/</code></a></td><td class="n">${cardFiles.length} files</td><td>One JSON per measurement card, named by its own content id. <a href="/signed/cards/">Browse the index</a>.</td></tr>
</table>

<h2>Verify one card, end to end</h2>
<pre><code># 1. pin the key
curl -s https://councilof.ai/.well-known/did.json

# 2. fetch a card and check it against the pinned key
curl -s https://councilof.ai/signed/verify-card.mjs -o verify-card.mjs
node verify-card.mjs ${cardFiles[0] ? cardFiles[0].replace(/\.json$/, "") : "&lt;card-id&gt;"}</code></pre>
<p>The rule the whole tree rests on: <code>id == sha256(preimage)</code>, where <code>preimage</code> is the body
serialised with sorted keys and no whitespace, and <code>signature</code> is Ed25519 over that preimage under the pinned key.
<a href="/signed/HOW-TO-VERIFY.md">The full procedure, with the exact serialisation, is here.</a></p>
`;

writeFileSync(join(SIGNED, "index.html"), page("Published evidence · /signed/ · Council of AI", indexBody));

// ── /signed/cards/index.html ─────────────────────────────────────────────────
if (existsSync(CARDS)) {
  const items = cardFiles.map((f) => {
    const id = f.replace(/\.json$/, "");
    const row = byId.get(id);
    const meta = row ? ` <span style="color:var(--dim)">${esc(row.axis || "")}</span>` : "";
    return `<li><a href="/signed/cards/${esc(f)}">${esc(id.slice(0, 16))}…</a>${meta}</li>`;
  }).join("\n");

  const inIndex = cardFiles.filter((f) => byId.has(f.replace(/\.json$/, ""))).length;

  const cardsBody = `
<h1>Measurement cards — <code>/signed/cards/</code></h1>
<p class="lede">${cardFiles.length} card files. Each is named by its own content id, so the filename is itself the
first half of the check: <code>sha256(preimage)</code> must equal the name.</p>
<p><a href="/signed/">← back to /signed/</a> · <a href="/signed/HOW-TO-VERIFY.md">how to verify</a> ·
<a href="/signed/card_index.json">card_index.json</a></p>
<div class="note">${inIndex} of these ${cardFiles.length} files appear in <code>card_index.json</code>${inIndex === cardFiles.length ? "." : `; the other ${cardFiles.length - inIndex} are served but not indexed. Both facts are read from the bytes at build time.`}</div>
<h2>All cards</h2>
<ul class="mono-list">
${items}
</ul>
`;
  writeFileSync(join(CARDS, "index.html"), page("Measurement cards · /signed/cards/ · Council of AI", cardsBody));
}

console.log(`[signed-index] /signed/index.html — ${top.length} artifacts, ${cardFiles.length} card files`);
console.log(`[signed-index] /signed/cards/index.html — ${cardFiles.length} listed, ${idxRows.length} rows in card_index.json`);
if (distinct) console.log(`[signed-index] NOTE: card counts disagree across artifacts; the page states each source rather than picking one.`);
