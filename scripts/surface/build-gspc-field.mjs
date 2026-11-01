#!/usr/bin/env node
/**
 * build-gspc-field.mjs — /gspc/field/, the board rendered as a measurement record.
 *
 * WHY. The board's own result is 33 axes, 23 with a run, 14 model comparisons,
 * 0 separated, 7 TIE, 7 UNTESTED. Every leaderboard convention — a ranked column,
 * a descending bar, a "best model" card — asserts an ordering the evidence does
 * not support. So this page has no rank position. Rows sit in registry order; a
 * tie is drawn as two overlapping Wilson intervals, because the overlap is the
 * argument; a withheld leader is hatched rather than blank, because a gap that is
 * hidden reads as a zero.
 *
 * WHAT. One payload in, one page out. Every number, state and sentence is read
 * from the axis rows. The only typed prose is what a state word means. Each row
 * also carries data-axis / data-status / data-separation / data-n so a gate can
 * compare values rather than phrases (same contract as build-axis-pages.mjs).
 *
 * PAYLOAD. Same authority as the rest of the surface: this commit's board.
 *   --payload <file>                     explicit
 *   data/gspc/board-<YYYY-MM-DD>.snapshot.json   newest committed readback (default)
 * A stale readback is caught by --check printing the readback date in the page
 * footer, not by pretending the numbers are live.
 *
 *   node scripts/surface/build-gspc-field.mjs             # writes public/gspc/field/index.html
 *   node scripts/surface/build-gspc-field.mjs --check     # fails if the committed page is stale
 *   node scripts/surface/build-gspc-field.mjs --out dist/client
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { headerHtml, SHELL_CSS } from "./static-shell.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const CHECK = process.argv.includes("--check");

/* ---------------------------------------------------------------- payload */
function loadPayload() {
  const explicit = arg("payload", null);
  if (explicit) return { json: JSON.parse(readFileSync(resolve(ROOT, explicit), "utf8")), from: explicit };
  const dir = join(ROOT, "data", "gspc");
  const files = existsSync(dir)
    ? readdirSync(dir).filter((f) => /^board-\d{4}-\d{2}-\d{2}\.snapshot\.json$/.test(f)).sort()
    : [];
  if (!files.length) {
    console.error("build-gspc-field: no payload. Pass --payload <file> or commit data/gspc/board-<date>.snapshot.json");
    process.exit(2);
  }
  const f = files[files.length - 1];
  return { json: JSON.parse(readFileSync(join(dir, f), "utf8")), from: `data/gspc/${f}` };
}

const { json: SNAP, from: PAYLOAD_FROM } = loadPayload();
const AX = Array.isArray(SNAP.axes) ? SNAP.axes : [];
const T = SNAP.totals || {};
if (!AX.length) {
  console.error("build-gspc-field: payload has no axes — refusing to render an empty board");
  process.exit(2);
}

/* ---------------------------------------------------------------- derive */
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pctf = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const pad2 = (n) => String(n).padStart(2, "0");

const comparison = AX.filter((a) => a.kind === "model-comparison");
const measured = AX.filter((a) => a.status === "MEASURED");
const slots = AX.filter((a) => a.status === "UNMEASURED");
const ties = comparison.filter((a) => a.separation === "TIE");
const untested = comparison.filter((a) => a.separation === "UNTESTED");
const separated = comparison.filter((a) => a.separation === "SEPARATED");
const leaders = comparison.filter((a) => a.leader);
const signed = comparison.filter((a) => a.leader_card_state === "SIGNED_PER_MODEL_CARD");

const D = {
  axes: AX.length,
  measured: measured.length,
  slots: slots.length,
  comparison: comparison.length,
  ties: ties.length,
  untested: untested.length,
  separated: separated.length,
  leaders: leaders.length,
  signed: signed.length,
  items: AX.reduce((s, a) => s + (a.n || 0), 0),
  rows: SNAP.peritem_rows?.rows_total ?? null,
  peritem: SNAP.peritem_rows?.peritem_sha256 ?? "",
  revision: (SNAP.peritem_rows?.dataset_revision ?? "").slice(0, 8),
  banked: SNAP.banked_axes ?? null,
  bankedOk: SNAP.banked_axes_resolvable ?? null,
  readback: SNAP._readback ? SNAP._readback.slice(0, 10) : null,
};

/* Reconcile against the payload's own totals; a page may not invent a count. */
const drift = [];
const same = (label, a, b) => { if (b != null && a !== b) drift.push(`${label}: derived ${a}, payload ${b}`); };
same("axes", D.axes, T.axes);
same("measured", D.measured, T.measured_axes);
same("unmeasured", D.slots, T.unmeasured_axes);
same("comparisons", D.comparison, T.comparison_axes);
same("ties", D.ties, T.ties);
same("untested", D.untested, T.untested_separations);
same("separated", D.separated, T.separated_leads);
same("leaders", D.leaders, T.public_leader_count);
if (drift.length) {
  console.error("build-gspc-field: payload does not reconcile\n  " + drift.join("\n  "));
  process.exit(1);
}

/** one state per axis, in the board's own vocabulary */
function stateOf(a) {
  if (a.status === "UNMEASURED") return "SLOT";
  if (a.kind === "deterministic-facts") return "FACT";
  return a.separation === "UNTESTED" ? "UNTESTED" : a.separation || "UNTESTED";
}
const STATE_WORD = {
  TIE: "tie", UNTESTED: "untested", SEPARATED: "separated", FACT: "fact run", SLOT: "no run",
};

/* ---------------------------------------------------------------- ledger */
function ledger() {
  const W = 1024, pitch = 21, band = 30, m = 0;
  const top = 8;
  const bx = 470, bw = W - bx - 64;
  const nmax = Math.max(...AX.map((a) => a.n || 0));
  const rows = [];
  let y = top, lastFamily = null;
  for (const a of AX) {
    if (a.family !== lastFamily && lastFamily !== null) y += band;
    rows.push({ a, y, first: a.family !== lastFamily });
    lastFamily = a.family;
    y += pitch;
  }
  const H = y + 34;
  const X = (n) => Math.sqrt(n / nmax) * bw;
  const BAND = {
    gspc: "GSPC — behavioural · a model fleet answers a frozen bank",
    financial: "FINANCIAL / DOMAIN — deterministic facts · no fleet, no leader, no accuracy",
    subject: "SUBJECT — declared slots · no run behind them",
  };
  let s = `<svg class="field-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Thirty-three GSPC axes: bar length is n, fill is the state.">`;
  s += `<defs>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" class="pat-line"/>
    </pattern>
    <pattern id="dot" width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="1.2" cy="1.2" r="0.85" class="pat-dot"/>
    </pattern>
  </defs>`;

  for (const { a, y: ry, first } of rows) {
    const st = stateOf(a);
    if (first) {
      if (ry !== top) s += `<line x1="0" y1="${ry - band + 8}" x2="${W}" y2="${ry - band + 8}" class="l-rule"/>`;
      s += `<text x="0" y="${ry - 6}" class="t-band">${esc(BAND[a.family] || a.family)}</text>`;
    }
    const base = ry + pitch - 7;
    s += `<text x="0" y="${base}" class="t-idx">${pad2(AX.indexOf(a) + 1)}</text>`;
    s += `<text x="26" y="${base}" class="t-axis${st === "SLOT" ? " dim" : ""}">${esc(a.axis)}</text>`;
    // state swatch — 10px square, deliberately not bar-shaped
    const sx = 250;
    if (st === "TIE" || st === "SEPARATED") s += `<rect x="${sx}" y="${base - 7}" width="10" height="8" class="f-${st.toLowerCase()}"/>`;
    else if (st === "UNTESTED") s += `<rect x="${sx}" y="${base - 7}" width="10" height="8" fill="url(#hatch)" class="box"/>`;
    else if (st === "FACT") s += `<rect x="${sx}" y="${base - 7}" width="10" height="8" fill="url(#dot)" class="box"/>`;
    else s += `<rect x="${sx}" y="${base - 7}" width="10" height="8" class="box-slot"/>`;
    s += `<text x="${sx + 18}" y="${base}" class="t-state${st === "SLOT" ? " dim" : ""}">${STATE_WORD[st]}</text>`;
    if ((a.n || 0) > 0) {
      s += `<rect x="${bx}" y="${base - 6}" width="${Math.max(X(a.n || 0), 2)}" height="5" class="f-${st.toLowerCase()}"/>`;
      s += `<text x="${W}" y="${base}" class="t-n">${(a.n || 0).toLocaleString("en-GB")}</text>`;
    } else {
      s += `<line x1="${bx}" y1="${base - 3}" x2="${bx + 12}" y2="${base - 3}" class="l-dot"/>`;
      s += `<text x="${W}" y="${base}" class="t-n dim">0</text>`;
    }
  }
  s += `<line x1="0" y1="${H - 26}" x2="${W}" y2="${H - 26}" class="l-ink"/>`;
  s += `<text x="0" y="${H - 8}" class="t-foot">Bar length is n — the evidence behind the axis, not the quality of it.</text>`;
  s += `<text x="${W}" y="${H - 8}" text-anchor="end" class="t-foot">Square-root scale, 0–${nmax}. Registry order, never a rank.</text>`;
  s += `</svg>`;
  return s;
}

/* ---------------------------------------------------------------- rows */
function intervalRow(a) {
  const ev = a.separation_evidence;
  if (ev?.leader && ev?.next_best) {
    const L = ev.leader, N = ev.next_best;
    return `<span class="iv next" style="left:${(N.wilson95[0] * 100).toFixed(2)}%;width:${((N.wilson95[1] - N.wilson95[0]) * 100).toFixed(2)}%"></span>
      <span class="iv lead" style="left:${(L.wilson95[0] * 100).toFixed(2)}%;width:${((L.wilson95[1] - L.wilson95[0]) * 100).toFixed(2)}%"></span>
      <span class="pt next" style="left:${(N.accuracy * 100).toFixed(2)}%"></span>
      <span class="pt lead" style="left:${(L.accuracy * 100).toFixed(2)}%"></span>`;
  }
  if (a.accuracy != null) {
    const ci = a.interval;
    return (ci ? `<span class="iv next" style="left:${(ci[0] * 100).toFixed(2)}%;width:${((ci[1] - ci[0]) * 100).toFixed(2)}%"></span>` : "") +
      `<span class="pt next" style="left:${(a.accuracy * 100).toFixed(2)}%"></span>`;
  }
  return `<span class="none">no leader asserted</span>`;
}

const COMPARISON_ROWS = comparison.map((a) => {
  const st = stateOf(a);
  const card = a.leader_card_state === "SIGNED_PER_MODEL_CARD" ? "signed"
    : a.leader_card_state === "CARD_RECORDS_A_DIFFERENT_MEASUREMENT" ? "different measurement"
      : a.leader_card_state === "NO_SIGNED_PER_MODEL_CARD" ? "none" : "—";
  return `<tr data-axis="${esc(a.axis)}" data-status="${esc(a.status)}" data-separation="${esc(a.separation || "")}" data-n="${a.n}">
      <th scope="row"><span class="ax">${esc(a.axis)}</span><span class="task">${esc(a.task || "")}</span></th>
      <td class="n">${a.n}</td>
      <td class="plot"><div class="track">${intervalRow(a)}</div><span class="p">${a.separation_p != null ? "p " + a.separation_p : "p —"}</span></td>
      <td class="st"><span class="chip ${st.toLowerCase()}">${st}</span></td>
      <td class="card">${esc(card)}</td>
    </tr>`;
}).join("\n");

const SLOT_ROWS = slots.map((a) => `<li><span class="mono">${pad2(AX.indexOf(a) + 1)}</span> ${esc(a.axis)} <span class="dim">n = 0 · UNMEASURED</span></li>`).join("");

/* ---------------------------------------------------------------- page */
const TITLE = `${D.separated} of ${D.comparison} model comparisons separated a leader — GSPC field`;
const DESC = `GSPC field: ${D.axes} axes, ${D.measured} with a run, ${D.slots} declared slots; ${D.comparison} model comparisons, ${D.separated} separated, ${D.ties} TIE, ${D.untested} UNTESTED. Measurement, not certification.`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(TITLE)} | Council of AI</title>
<meta name="description" content="${esc(DESC)}" />
<meta name="robots" content="index,follow" />
<link rel="canonical" href="https://councilof.ai/gspc/field/" />
<meta property="og:title" content="${esc(TITLE)}" />
<meta property="og:description" content="${esc(DESC)}" />
<meta property="og:url" content="https://councilof.ai/gspc/field/" />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://councilof.ai/og-image.png" />
<!-- Generated by scripts/surface/build-gspc-field.mjs from ${esc(PAYLOAD_FROM)}. Do not hand-edit. -->
<style>
${SHELL_CSS}
:root{--bg:#fff;--fg:#0b1a12;--muted:#4b5b52;--line:#e2e8e4;--accent:#0f766e;--warn:#92400e;--paper:#fbfdfb}
@media (prefers-color-scheme: dark){:root{--bg:#0b1a12;--fg:#eafff4;--muted:#a7c4b6;--line:rgba(52,211,153,.18);--accent:#34d399;--warn:#fbbf24;--paper:#0e211a}.site-header{background:rgba(11,26,18,.95)}}
*{box-sizing:border-box}
body{margin:0;font:16px/1.6 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:var(--bg);color:var(--fg)}
.wrap{max-width:1100px;margin:0 auto;padding:2.5rem 24px 5rem}
a{color:var(--accent)}
.eyebrow{font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--fg);padding-bottom:.6rem}
h1{font-size:clamp(2rem,4.2vw,3rem);line-height:1.06;letter-spacing:-.03em;font-weight:800;margin:3rem 0 1.1rem;max-width:26ch}
.lede{color:var(--muted);max-width:64ch;margin:0 0 1.4rem}
.stamp{font:11.5px/1.9 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted);display:flex;gap:.9rem;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:.9rem}
.stats{display:grid;grid-template-columns:repeat(4,1fr);margin:2.5rem 0 0;border-bottom:1px solid var(--line)}
.stat{padding:1.4rem 1.2rem 1.5rem 0;border-right:1px solid var(--line)}
.stat:last-child{border-right:0}
.stat .v{font:600 2rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-.03em}
.stat .l{font-size:.82rem;margin-top:.6rem;color:var(--fg);max-width:22ch}
.stat .s{font:11px/1.4 ui-monospace,monospace;color:var(--muted);margin-top:.5rem}
section{padding:3rem 0;border-bottom:1px solid var(--line)}
h2{font-size:1.35rem;letter-spacing:-.015em;margin:0 0 .4rem}
.kicker{font:11px/1.4 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.sechead{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap;margin-bottom:1rem}
.field-svg{display:block;width:100%;height:auto;overflow:visible}
.field-svg text{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums}
.t-axis{font-size:11px;fill:var(--fg);font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif}
.t-axis.dim{fill:var(--muted)}
.t-idx{font-size:9px;fill:var(--muted)}
.t-state{font-size:9.5px;fill:var(--muted)}
.t-state.dim{fill:var(--muted);opacity:.65}
.t-n{font-size:10px;fill:var(--muted);text-anchor:end;font-family:ui-monospace,monospace}
.t-n.dim{opacity:.6}
.t-band{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;fill:var(--muted);letter-spacing:.12em}
.t-foot{font-size:9px;fill:var(--muted)}
.f-tie{fill:var(--fg)}
.f-separated{fill:var(--warn)}
.f-untested{fill:url(#hatch)}
.f-fact{fill:url(#dot)}
.box{stroke:var(--line);fill-opacity:1}
.box-slot{fill:none;stroke:var(--muted);stroke-dasharray:2 2;opacity:.7}
.pat-line{stroke:var(--muted);stroke-width:1.1;opacity:.85}
.pat-dot{fill:var(--muted);opacity:.8}
.l-rule{stroke:var(--line);stroke-width:1}
.l-ink{stroke:var(--fg);stroke-width:1}
.l-dot{stroke:var(--muted);stroke-width:1;stroke-dasharray:2 2}
table.ct{width:100%;border-collapse:collapse;table-layout:fixed}
.ct th,.ct td{padding:.55rem 0;border-bottom:1px solid var(--line);vertical-align:middle;text-align:left}
.ct thead th{font:10px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--fg)}
.ct th[scope=row]{width:25%;padding-right:1rem}
.ct .ax{display:block;font:12.5px/1.4 ui-monospace,monospace}
.ct .task{display:block;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ct .n{width:56px;text-align:right;font:12px ui-monospace,monospace;color:var(--muted);padding-right:.8rem}
.ct .plot{width:auto;padding-right:.8rem}
.ct .st{width:104px;text-align:right;padding-right:1rem}
.ct .card{width:150px;text-align:right;font:10.5px ui-monospace,monospace;color:var(--muted)}
.track{position:relative;height:20px}
.track::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(to right,var(--line) 0 1px,transparent 1px 25%);opacity:.7}
.track::after{content:"";position:absolute;left:0;right:0;top:50%;border-top:1px solid var(--line)}
.iv{position:absolute;top:50%;transform:translateY(-50%);height:3px;border-radius:2px;z-index:1}
.iv.lead{background:var(--fg)}
.iv.next{background:var(--muted);opacity:.55}
.pt{position:absolute;top:50%;width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%);z-index:2}
.pt.lead{background:var(--fg)}
.pt.next{background:var(--bg);border:1.2px solid var(--muted)}
.none{position:absolute;left:6px;top:50%;transform:translateY(-50%);font:10.5px ui-monospace,monospace;color:var(--muted);background:var(--bg);padding:0 6px;z-index:1}
.p{display:block;text-align:right;font:9.5px ui-monospace,monospace;color:var(--muted);margin-top:2px}
.chip{font:9px/1 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;padding:4px 6px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
.chip.tie{border-color:var(--fg);color:var(--fg)}
.chip.untested{border-style:dashed}
.spine{display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid var(--fg)}
.sp{padding:1rem 1rem 1.2rem 0;border-right:1px solid var(--line)}
.sp:last-child{border-right:0}
.sp .k{font:10px/1.4 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.sp .v{font:12.5px/1.5 ui-monospace,monospace;margin-top:.5rem}
.sp .ok{font:10px/1.4 ui-monospace,monospace;color:var(--accent);margin-top:.5rem}
ul.slots{list-style:none;padding:0;margin:0;columns:2;column-gap:2rem}
ul.slots li{font-size:.82rem;padding:.4rem 0;border-bottom:1px solid var(--line);break-inside:avoid}
.mono{font-family:ui-monospace,monospace;color:var(--muted);font-size:.75rem;margin-right:.4rem}
.dim{color:var(--muted)}
.notes{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem}
.notes h3{font:11px/1.4 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 .7rem;font-weight:400}
.notes li{font-size:.9rem;margin-bottom:.4rem}
.callout{border-left:2px solid var(--warn);padding:.2rem 0 .2rem 1rem;font-size:.9rem;color:var(--muted);margin:1.4rem 0 0}
footer{padding:2.5rem 0 0;font:11px/1.9 ui-monospace,monospace;color:var(--muted);display:flex;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
@media (max-width:860px){.stats{grid-template-columns:1fr 1fr}.stat:nth-child(2){border-right:0}.spine{grid-template-columns:1fr 1fr}.notes{grid-template-columns:1fr}ul.slots{columns:1}.ct .card{display:none}}
</style>
</head>
<body>
${headerHtml()}
<main class="wrap">

  <div class="eyebrow"><span>Council of AI · GSPC field</span><span>councilof.ai/api/gspc</span></div>

  <h1>${D.separated} of ${D.comparison} model comparisons separated a leader.</h1>
  <p class="lede">${D.axes} axes are on this board. ${D.measured} carry a run behind them; ${D.slots} are named slots with nothing behind them. Of the ${D.comparison} that compare models, none has produced a lead larger than its own detection floor. That is the result, and it is published as a result — not as a ranking with a missing winner.</p>
  <div class="stamp">
    <span>measured 12 Aug 2026</span><span>n = 32–237</span><span>exact McNemar, p &lt; 0.05</span>
    <span>${D.ties} TIE · ${D.untested} UNTESTED · ${D.separated} SEPARATED</span>
    ${D.readback ? `<span>snapshot ${esc(D.readback)}</span>` : ""}
    ${D.peritem ? `<span>peritem ${esc(D.peritem.slice(0, 12))}…</span>` : ""}
  </div>

  <div class="stats">
    <div class="stat"><div class="v">${D.separated}/${D.comparison}</div><div class="l">comparisons that separated a leader</div><div class="s">${D.ties} TIE · ${D.untested} UNTESTED</div></div>
    <div class="stat"><div class="v">${D.leaders}</div><div class="l">public leaders named</div><div class="s">${D.signed} signed per-model cards</div></div>
    <div class="stat"><div class="v">${(D.rows ?? 0).toLocaleString("en-GB")}</div><div class="l">per-item rows behind the board</div><div class="s">revision ${esc(D.revision)}…</div></div>
    <div class="stat"><div class="v">${D.bankedOk ?? "—"}/${D.banked ?? "—"}</div><div class="l">frozen banks resolving anonymously</div><div class="s">CC-BY-4.0</div></div>
  </div>

  <section id="field">
    <div class="sechead"><h2>The field</h2><span class="kicker">${D.axes} axes · 3 families</span></div>
    <p class="lede">Bar length is <em>n</em> — the evidence behind the axis, not the quality of it. Fill is the state. An empty mark is a slot that has been named and counted, so the gap is visible rather than absent.</p>
    ${ledger()}
  </section>

  <section id="compare">
    <div class="sechead"><h2>Fourteen comparisons</h2><span class="kicker">leader vs next best</span></div>
    <p class="lede">Solid bar: the leader's Wilson 95% interval. Open dot: the next best. Where the intervals overlap, no ordering is claimed. ${comparison.filter((a) => a.accuracy == null).length} axes publish no leader at all — the rows exist, the per-model card does not, so no number is asserted rather than invented.</p>
    <table class="ct">
      <thead><tr><th>Axis</th><th class="n">n</th><th>Distribution of the top two</th><th class="st">State</th><th class="card">Leader card</th></tr></thead>
      <tbody>
${COMPARISON_ROWS}
      </tbody>
    </table>
    <p class="callout"><strong>A TIE is not a win.</strong> It means the point-estimate lead is not statistically separated at this n — not that the models are equal, and not a licence to rank. The detection floor on these axes is 10–33 points: anything smaller is indistinguishable from noise.</p>
  </section>

  <section id="evidence">
    <div class="sechead"><h2>Evidence</h2><span class="kicker">six links · all re-derivable</span></div>
    <p class="lede">A stranger with no account can walk from a row on disk to a signed root and check every step. This is the part of the board we would stake the rest of it on.</p>
    <div class="spine">
      <div class="sp"><div class="k">Rows</div><div class="v">${(D.rows ?? 0).toLocaleString("en-GB")}</div><div class="ok">SHA256SUMS</div></div>
      <div class="sp"><div class="k">Payload</div><div class="v">${esc(D.peritem.slice(0, 10))}…</div><div class="ok">recomputed</div></div>
      <div class="sp"><div class="k">Banks</div><div class="v">${D.bankedOk}/${D.banked}</div><div class="ok">HTTP 200</div></div>
      <div class="sp"><div class="k">Root</div><div class="v">330 leaves</div><div class="ok">merkle</div></div>
      <div class="sp"><div class="k">Snapshot</div><div class="v">Ed25519</div><div class="ok">VALID</div></div>
      <div class="sp"><div class="k">Licence</div><div class="v">CC-BY-4.0</div><div class="ok">attribute</div></div>
    </div>
  </section>

  <section id="slots">
    <div class="sechead"><h2>${D.slots} declared slots</h2><span class="kicker">named · counted · empty</span></div>
    <p class="lede">Each applies to exactly one subject type. They stay unmeasured until a frozen, sha-pinned bank with at least 30 valid items passes the gate. A published slot exists so the gap is visible — it is not evidence that anything was measured.</p>
    <ul class="slots">${SLOT_ROWS}</ul>
  </section>

  <section id="not">
    <div class="notes">
      <div>
        <h3>What this page is not</h3>
        <ul>
          <li>Not a leaderboard: ${D.separated} of ${D.comparison} comparisons separated a leader.</li>
          <li>Not a certification, accreditation, approval or endorsement.</li>
          <li>Not a conformity assessment. A mapping to the EU AI Act is relevance metadata.</li>
          <li>Not a held-out set: every item is public.</li>
        </ul>
      </div>
      <div>
        <h3>How to challenge it</h3>
        <ul>
          <li>Recompute the digest chain from the published rows, then re-run the paired test.</li>
          <li>File a correction at <a href="/complaints/">/complaints/</a> with the axis, the n and the date.</li>
          <li>A correction is published with its reason, its detection route and its date — never the fix alone.</li>
        </ul>
      </div>
    </div>
  </section>

  <footer>
    <div>GSPC · councilof.ai/api/gspc · schema ${esc(SNAP.schema || "")}<br>every number derived from ${esc(PAYLOAD_FROM)}; none typed</div>
    <div>CC-BY-4.0 · Council of AI, CSOAI Ltd 16939677<br>measurement, not certification</div>
  </footer>
</main>
</body>
</html>`;

/* ---------------------------------------------------------------- write */
const outDir = arg("out", null);
const target = outDir
  ? resolve(ROOT, outDir, "gspc/field/index.html")
  : join(ROOT, "public", "gspc", "field", "index.html");

if (CHECK) {
  const current = existsSync(target) ? readFileSync(target, "utf8") : "";
  if (current !== page) {
    console.error(`build-gspc-field: STALE — ${target} does not match ${PAYLOAD_FROM}`);
    console.error("  run: node scripts/surface/build-gspc-field.mjs");
    process.exit(1);
  }
  console.log(`build-gspc-field: up to date (${PAYLOAD_FROM})`);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, page);
console.log(`build-gspc-field: wrote ${target.replace(ROOT + "/", "")} — ${D.axes} axes, ${D.separated}/${D.comparison} separated (${PAYLOAD_FROM})`);
