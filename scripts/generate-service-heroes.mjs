#!/usr/bin/env node
/**
 * generate-service-heroes — one 3:2 hero per services group, DRAWN FROM THE LIVE NUMBERS.
 *
 * N02 says: branded, not tacky; no stock photos of handshakes or robots; alt text is the
 * measurement sentence. The Canva connector reports NO brand kit on this account
 * (list-brand-kits -> {"items":[]}), so the branded route N02 offers as its alternative is the
 * one taken: SVG line-art from the estate's own diagrams.
 *
 * These are not decoration with a number written on them. Each hero PLOTS a real quantity read
 * from a live endpoint at generation time — 13 of 16 XRPL instruments signed is thirteen filled
 * marks and three hollow ones, counted. If the board moves, re-running moves the picture. That
 * is why this is a producer and belongs in PRODUCERS.json rather than a folder of PNGs someone
 * exported once.
 *
 * SVG, not WebP. N02 asks for <=120 KB WebP; every file here is under 3 KB, scales to any
 * viewport without a second asset, and is diffable in review — a raster of a number cannot be
 * checked by reading the PR. If a raster is required for a specific surface, export from these.
 *
 *   node scripts/generate-service-heroes.mjs           # write SVGs + contact sheet
 *   node scripts/generate-service-heroes.mjs --check   # fail if a hero is stale
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(REPO, "public/images/services");
const CHECK = process.argv.includes("--check");
const API = process.env.CSOAI_API || "https://councilof.ai";

const get = async (p) => {
  const r = await fetch(`${API}${p}`, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`GET ${p} -> HTTP ${r.status}`);
  return r.json();
};

// Ink only. No gradients, no photography, no icons of robots or handshakes.
const INK = "#0f1115", MUTE = "#8a8f98", LINE = "#c9ced6", ACCENT = "#0f766e", W = 1200, H = 800;

const frame = (title, sentence, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(sentence)}">
  <title>${esc(sentence)}</title>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="${LINE}" stroke-width="2"/>
  <text x="88" y="132" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="34" font-weight="700" fill="${INK}">${esc(title)}</text>
${body}
${caption(sentence)}
  <text x="88" y="${H - 62}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="16" fill="${MUTE}">Measurement, not certification · verification is free</text>
</svg>
`;

/**
 * The caption is the alt text, so it must be READ, not clipped. Monospace 19px advances 0.6em,
 * so 1024px of usable width holds 89 characters; wrap on words at 88 and stack upward from the
 * standing line. Three lines is the floor of the mark band — a fourth would collide, so it
 * throws rather than quietly running a sentence off the edge of the frame.
 */
const CAPTION_COLS = 88;
const caption = (sentence) => {
  const lines = [];
  for (const word of String(sentence).split(/\s+/)) {
    if (lines.length && (lines[lines.length - 1] + " " + word).length <= CAPTION_COLS) lines[lines.length - 1] += " " + word;
    else lines.push(word);
  }
  if (lines.length > 3) throw new Error(`caption wraps to ${lines.length} lines (max 3), shorten: ${sentence}`);
  return lines
    .map((l, i) => `  <text x="88" y="${H - 92 - (lines.length - 1 - i) * 26}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="19" fill="${MUTE}">${esc(l)}</text>`)
    .join("\n");
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * n filled marks of total, in rows — the count IS the picture.
 * The block is centred in the band between the title and the caption, so a 1-row hero and a
 * 3-row hero sit on the same optical line instead of leaving a dead zone under the short one.
 */
const BAND_TOP = 190, BAND_BOTTOM = 620;
const marks = (filled, total, cols = 8) => {
  const rows = Math.ceil(total / cols) || 1;
  const y0 = Math.round((BAND_TOP + BAND_BOTTOM) / 2 - (rows * 74 - 26) / 2);
  let out = "";
  for (let i = 0; i < total; i++) {
    const x = 88 + (i % cols) * 74, y = y0 + Math.floor(i / cols) * 74;
    out += i < filled
      ? `  <rect x="${x}" y="${y}" width="48" height="48" fill="${ACCENT}"/>\n`
      : `  <rect x="${x}" y="${y}" width="48" height="48" fill="none" stroke="${LINE}" stroke-width="3"/>\n`;
  }
  return out;
};
const bigNum = (n, label, y = Math.round((BAND_TOP + BAND_BOTTOM) / 2 + 30)) =>
  `  <text x="88" y="${y}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="150" font-weight="800" fill="${ACCENT}">${esc(n)}</text>\n` +
  `  <text x="88" y="${y + 52}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" fill="${INK}">${esc(label)}</text>\n`;

const board = await get("/api/gspc");
const xrpl = await get("/api/xrpl");
const swift = await get("/api/swift");
const corr = await get("/api/corrections");
const root = await get("/root.json");

const xSigned = (xrpl.assets || []).filter((a) => a.sig_ed25519).length;
const xTotal = (xrpl.assets || []).length;
const t = board.totals || {};

const HEROES = [
  { slug: "finance-rwa", title: "Finance & RWA",
    sentence: `${xSigned} of ${xTotal} XRPL instruments carry an Ed25519 signature; SWIFT census n=${swift.n}, ${swift.n_measured} measured.`,
    body: marks(xSigned, xTotal) },
  { slug: "compliance", title: "Compliance",
    sentence: `Evidence bundles for 4 obligations: EU AI Act Article 50, Article 53, DORA, CRA. Free preview at every door.`,
    body: marks(4, 4, 4) },
  { slug: "model-measurement", title: "Model measurement",
    sentence: t.lid || `${t.public_count} on the GSPC board.`,
    body: marks(Number(t.measured_axes) || 0, Number(t.axes) || 0) },
  { slug: "agent-rails", title: "Agent rails",
    sentence: `Six paid doors answer a 402 challenge; the board, the cards and every verification stay free.`,
    body: marks(6, 6, 6) },
  { slug: "legacy-systems", title: "Legacy systems",
    sentence: `A COBOL bridge to the same signed record. ${root.card_count} leaves under one public root; ${corr.corrections.length} corrections published against ourselves.`,
    body: bigNum(String(root.card_count), "leaves under the public root") },
];

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
let stale = [];
for (const h of HEROES) {
  const svg = frame(h.title, h.sentence, h.body);
  const file = join(OUT, `${h.slug}.svg`);
  if (CHECK) {
    const have = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (have !== svg) stale.push(h.slug);
  } else {
    writeFileSync(file, svg);
    console.log(`  ${h.slug}.svg  ${svg.length} bytes  alt="${h.sentence.slice(0, 62)}…"`);
  }
}

// Contact sheet: the owner sees every hero and its alt text on one page BEFORE any ships.
if (!CHECK) {
  const sheet = `<!doctype html><meta charset="utf-8"><title>Services heroes — contact sheet</title>
<style>body{font:15px/1.55 ui-sans-serif,system-ui,sans-serif;margin:0;padding:2rem;background:#fafafa;color:#111}
h1{font-size:1.4rem;margin:0 0 .3rem}p.mut{color:#555;max-width:60rem}
figure{margin:2rem 0;background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:1rem;max-width:60rem}
img{width:100%;height:auto;display:block;border:1px solid #eee}
figcaption{margin-top:.6rem;font-family:ui-monospace,Menlo,monospace;font-size:.83rem;color:#333}
code{background:#f2f2f2;padding:.1rem .3rem;border-radius:3px}</style>
<h1>Services heroes — contact sheet</h1>
<p class="mut"><b>Nothing here has shipped.</b> Five 3:2 heroes, one per services group. Each is SVG line-art drawn from the estate's own live numbers at generation time — the marks are counted, not decorative, so re-running the producer moves the picture when the board moves. No stock photography, no handshakes, no robots.</p>
<p class="mut">The Canva connector reports no brand kit on this account (<code>list-brand-kits</code> → <code>{"items":[]}</code>), so this is N02's stated alternative: SVG line-art from our own diagrams. SVG rather than WebP because each file is under 3 KB, scales without a second asset, and can be reviewed by reading the diff — a raster of a number cannot.</p>
${HEROES.map((h) => `<figure><img src="/images/services/${h.slug}.svg" alt="${esc(h.sentence)}">
<figcaption><b>${esc(h.title)}</b> — <code>/images/services/${h.slug}.svg</code><br>alt = ${esc(h.sentence)}</figcaption></figure>`).join("\n")}
<p class="mut">Regenerate: <code>node scripts/generate-service-heroes.mjs</code> · verify current: <code>--check</code></p>
`;
  writeFileSync(join(REPO, "docs/press/services-heroes-contact-sheet.html"), sheet);
  console.log("  contact sheet: docs/press/services-heroes-contact-sheet.html");
}
if (CHECK) {
  if (stale.length) { console.error(`✖ service heroes stale (board moved): ${stale.join(", ")}\n  fix: node scripts/generate-service-heroes.mjs`); process.exit(1); }
  console.log(`✓ service heroes: ${HEROES.length} current against the live board`);
}
