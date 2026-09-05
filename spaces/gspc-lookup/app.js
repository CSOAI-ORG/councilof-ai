/* GSPC lookup — printer of public files. No build step. No inference. Nothing here is a rank.
 *
 * Sources (all public, read at load time):
 *   GET https://councilof.ai/api/gspc                                   → totals.lid, quoted verbatim
 *   csoai/hub-queue          queue.jsonl                                → census rows + per-axis MEASURED cells
 *   csoai/gspc-hub-cards     mill-cards/INDEX*.jsonl                    → signed (model, axis) cards (every index file, deduped)
 *   csoai/gspc-hub-cards     staged-unsigned/<date>/MANIFEST.json       → UNSIGNED staged cards + dead slugs
 *   https://csoai.org/.well-known/did.json                              → Ed25519 public keys (verify in-browser)
 */
"use strict";

const API_GSPC = "https://councilof.ai/api/gspc";
const HQ = "https://huggingface.co/datasets/csoai/hub-queue/resolve/main/";
const HC = "https://huggingface.co/datasets/csoai/gspc-hub-cards/resolve/main/";
const DID_DOC = "https://csoai.org/.well-known/did.json";
const STAGED_DAYS = ["2026-09-02"]; // newest first; a manifest that fails to load is simply absent
const ALT_STAGED_LATEST = HC + "staged-unsigned/LATEST.json"; // optional pointer {day:"YYYY-MM-DD"}

// The 14 model-comparison axes the mill can grade (mirrors MODEL_AXES in harness/gspc-top100/mill_hub_queue.py).
const MODEL_AXES = [
  "governance", "safety", "provenance", "continuity", "conformance", "openness",
  "machinery-conformity", "care", "cross-reality", "detector-interop", "art5-safeguard",
  "swarm", "affect", "jail",
];

const $ = (s) => document.querySelector(s);
const files = { queue: null, index: null, staged: null, did: null, lid: null, errors: [] };

async function getText(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
  return r.text();
}
function jsonl(txt) {
  const out = [];
  for (const ln of txt.split("\n")) {
    const s = ln.trim();
    if (!s) continue;
    try { out.push(JSON.parse(s)); } catch (e) { /* skip bad row */ }
  }
  return out;
}

async function loadAll() {
  files.errors = [];
  const lidEl = $("#lid");
  lidEl.className = "lid";
  lidEl.textContent = "Lid: loading live GET https://councilof.ai/api/gspc …";
  try {
    const d = JSON.parse(await getText(API_GSPC));
    files.lid = (d.totals && d.totals.lid) || null;
    if (files.lid) lidEl.textContent = "Lid (GET /api/gspc totals.lid, verbatim): " + files.lid;
    else { lidEl.className = "lid bad"; lidEl.textContent = "UNCHECKABLE — GET /api/gspc answered without totals.lid. Nothing is guessed."; }
  } catch (e) {
    lidEl.className = "lid bad";
    lidEl.textContent = "UNCHECKABLE — live GET https://councilof.ai/api/gspc failed (" + e.message + "). No lid is printed from memory.";
  }
  const jobs = [
    ["queue", HQ + "queue.jsonl", (t) => jsonl(t)],
    ["did", DID_DOC, (t) => JSON.parse(t)],
  ];
  await Promise.all(jobs.map(async ([k, url, parse]) => {
    try { files[k] = parse(await getText(url)); }
    catch (e) { files[k] = null; files.errors.push(url + " → " + e.message); }
  }));
  // signed index: every mill-cards/INDEX*.jsonl (the tree API lists them; a fixed list is the fallback), deduped by card sha256
  let indexNames = ["INDEX.jsonl", "INDEX-safety.jsonl", "INDEX-art5-affect.jsonl", "INDEX-empty3.jsonl"];
  try {
    const tree = JSON.parse(await getText("https://huggingface.co/api/datasets/csoai/gspc-hub-cards/tree/main/mill-cards"));
    const found = tree.map((x) => x.path.split("/").pop()).filter((n) => /^INDEX.*\.jsonl$/.test(n));
    if (found.length) indexNames = found;
  } catch (e) { files.errors.push("mill-cards tree listing → " + e.message + " (using the fixed INDEX list)"); }
  files.index = []; files.indexFiles = [];
  const seen = new Set();
  await Promise.all(indexNames.map(async (n) => {
    try {
      for (const r of jsonl(await getText(HC + "mill-cards/" + n))) {
        const k = r.card_sha256 || (r.model + "|" + r.axis);
        if (seen.has(k)) continue; seen.add(k); r._index = n; files.index.push(r);
      }
      files.indexFiles.push(n);
    } catch (e) { files.errors.push("mill-cards/" + n + " → " + e.message); }
  }));
  if (!files.indexFiles.length) files.index = null;
  // staged-unsigned manifest: newest day that resolves
  files.staged = null;
  let days = STAGED_DAYS.slice();
  try { const p = JSON.parse(await getText(ALT_STAGED_LATEST)); if (p && p.day && !days.includes(p.day)) days.unshift(p.day); } catch (e) { /* optional */ }
  for (const day of days) {
    try { files.staged = JSON.parse(await getText(HC + "staged-unsigned/" + day + "/MANIFEST.json")); files.staged._day = day; break; }
    catch (e) { files.errors.push("staged-unsigned/" + day + "/MANIFEST.json → " + e.message); }
  }
  renderSources();
}

function renderSources() {
  const ul = $("#sources");
  const li = [];
  li.push("<li>queue.jsonl: " + (files.queue ? files.queue.length + " rows (a listing count, never a MEASURED count)" : "<span class='st UNCHECKABLE'>UNCHECKABLE</span>") + " · <a href='" + HQ + "queue.jsonl'>file</a></li>");
  li.push("<li>mill-cards/INDEX*.jsonl: " + (files.index ? files.index.length + " signed rows across " + files.indexFiles.join(", ") : "<span class='st UNCHECKABLE'>UNCHECKABLE</span>") + " · <a href='https://huggingface.co/datasets/csoai/gspc-hub-cards/tree/main/mill-cards'>folder</a></li>");
  if (files.staged) {
    const n = (files.staged.cards || []).length;
    li.push("<li>staged-unsigned/" + files.staged._day + "/MANIFEST.json: " + n + " UNSIGNED staged cards, " + ((files.staged.dead_slugs || []).length) + " dead slugs · <a href='" + HC + "staged-unsigned/" + files.staged._day + "/MANIFEST.json'>file</a></li>");
  } else li.push("<li>staged-unsigned manifest: none resolved (no staged cards are shown)</li>");
  li.push("<li>did.json: " + (files.did ? "loaded (in-browser Ed25519 verify available if this browser supports WebCrypto Ed25519)" : "<span class='st UNCHECKABLE'>UNCHECKABLE</span> (signature checks fall back to councilof.ai/gspc-verify)") + "</li>");
  for (const e of files.errors) li.push("<li class='st UNCHECKABLE'>fetch failed: " + esc(e) + "</li>");
  ul.innerHTML = li.join("");
}

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

// --- canonical body + Ed25519 verify, mirroring harness/gspc-top100/verify_card.py ---
function canonical(v) {
  // json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
  const sortKeys = (x) => {
    if (Array.isArray(x)) return x.map(sortKeys);
    if (x && typeof x === "object") { const o = {}; for (const k of Object.keys(x).sort()) o[k] = sortKeys(x[k]); return o; }
    return x;
  };
  return JSON.stringify(sortKeys(v)).replace(/[^\x20-\x7E]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}
async function sha256hex(bytes) {
  const h = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
}
function hexToBytes(h) { const out = new Uint8Array(h.length / 2); for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16); return out; }
function didKey(did) {
  if (!files.did) return null;
  const frag = did.includes("#") ? did.split("#").pop() : "card-attestation-1";
  for (const vm of files.did.verificationMethod || []) {
    if (String(vm.id || "").endsWith("#" + frag)) { const x = vm.publicKeyJwk && vm.publicKeyJwk.x; return x ? b64urlToBytes(x) : null; }
  }
  return null;
}
async function verifyCard(url) {
  // returns {state: VALID|INVALID|UNCHECKABLE, reason}
  let wrap;
  try { wrap = JSON.parse(await getText(url)); } catch (e) { return { state: "UNCHECKABLE", reason: "card fetch " + e.message }; }
  const body = wrap.body, cid = wrap.id || wrap.sha256, sig = wrap.signature || wrap.sig_ed25519 || wrap.sig;
  if (!body || !cid) return { state: "INVALID", reason: "no body or id" };
  const pre = new TextEncoder().encode(canonical(body));
  let h; try { h = await sha256hex(pre); } catch (e) { return { state: "UNCHECKABLE", reason: "no WebCrypto" }; }
  if (h !== cid) return { state: "UNCHECKABLE", reason: "sha256(canonical body) != id in this browser's canonicalisation — use gspc-verify" };
  if (!sig) return { state: "UNCHECKABLE", reason: "no signature (UNSIGNED)" };
  const did = String(wrap.did || wrap.did_intended || "did:web:csoai.org#card-attestation-1");
  const pub = didKey(did);
  if (!pub) return { state: "UNCHECKABLE", reason: "did.json has no key for " + did };
  try {
    const key = await crypto.subtle.importKey("raw", pub, { name: "Ed25519" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("Ed25519", key, /^[0-9a-fA-F]+$/.test(sig) ? hexToBytes(sig) : b64urlToBytes(sig), pre);
    return ok ? { state: "VALID", reason: did } : { state: "INVALID", reason: "Ed25519 verify failed under " + did };
  } catch (e) { return { state: "UNCHECKABLE", reason: "this browser cannot verify Ed25519 (" + e.message + ") — use gspc-verify" }; }
}

// --- lookup ---
function normId(s) {
  s = String(s || "").trim();
  s = s.replace(/^https?:\/\/huggingface\.co\//, "").replace(/^\/+|\/+$/g, "");
  return s;
}

async function lookup(id) {
  const st = $("#status"), tb = $("#t tbody"), t = $("#t");
  id = normId(id);
  if (!id) { st.textContent = "Type a Hub model id (owner/name)."; t.hidden = true; return; }
  history.replaceState(null, "", "?model=" + encodeURIComponent(id));
  const lc = id.toLowerCase();
  const qrow = files.queue ? files.queue.find((r) => String(r.id || "").toLowerCase() === lc) : null;
  const idx = files.index ? files.index.filter((r) => String(r.model || "").toLowerCase() === lc) : [];
  const stagedCards = files.staged ? (files.staged.cards || []).filter((c) => String(c.model || c.id || "").toLowerCase() === lc) : [];
  const deadRow = files.staged ? (files.staged.dead_slugs || []).find((d) => String(d.id || "").toLowerCase() === lc) : null;

  const head = [];
  head.push("model: " + id);
  head.push(files.queue ? (qrow ? "hub-queue: rank " + qrow.rank + " · status " + qrow.status + " · pipeline_tag " + (qrow.pipeline_tag || "—") + " · as_of " + qrow.as_of : "hub-queue: not on the census list (UNMEASURED — a name absent from the list is not a verdict)") : "hub-queue: UNCHECKABLE");
  head.push(files.index ? "signed cards (mill-cards/INDEX*.jsonl): " + idx.length : "signed cards: UNCHECKABLE");
  head.push(files.staged ? "staged UNSIGNED cards (" + files.staged._day + "): " + stagedCards.length : "staged UNSIGNED cards: no manifest resolved");
  if (deadRow) head.push("dead slug: " + deadRow.reason + " (as_of " + deadRow.as_of + ")");
  st.textContent = head.join("\n");

  tb.innerHTML = "";
  const rows = [];
  for (const ax of MODEL_AXES) {
    const cell = (qrow && qrow.measured_axes && qrow.measured_axes[ax]) || null;
    const signed = idx.filter((r) => r.axis === ax);
    const staged = stagedCards.filter((c) => c.axis === ax);
    if (signed.length) {
      for (const r of signed) {
        const tr = document.createElement("tr");
        const vcell = document.createElement("td");
        tr.innerHTML = "<td class='mono'>" + esc(ax) + "</td><td class='st MEASURED'>MEASURED</td>" +
          "<td>status " + esc(r.status) + " · n " + esc(r.n) + " · accuracy " + esc(r.accuracy) + " · signed " + esc(r.signed) + " · did " + esc(r.did || "") +
          " · card <a href='" + esc(r.card_url) + "'>" + esc((r.card_sha256 || "").slice(0, 12)) + "…</a> · created " + esc(r.created || "") + "<br><span class='sig'>signature check: …</span></td>" +
          "<td><a href='" + HC + "mill-cards/" + esc(r._index || "INDEX.jsonl") + "'>" + esc(r._index || "INDEX.jsonl") + "</a>" + (cell ? " · queue cell " + esc(cell.status) : "") + "</td>";
        tb.appendChild(tr);
        verifyCard(r.card_url).then((v) => {
          const s = tr.querySelector(".sig");
          s.innerHTML = "signature check (this browser): <span class='st " + (v.state === "VALID" ? "MEASURED" : v.state === "INVALID" ? "DEAD" : "UNCHECKABLE") + "'>" + esc(v.state) + "</span> — " + esc(v.reason) +
            " · <a href='https://councilof.ai/gspc-verify'>re-verify free</a>" + (v.state !== "VALID" ? " · <strong>only VALID is MEASURED</strong>" : "");
        });
      }
      continue;
    }
    if (cell && String(cell.status).toUpperCase() === "MEASURED" && cell.card_id) {
      rows.push([ax, "MEASURED", "queue cell says MEASURED · card_id " + esc(cell.card_id) + " — no INDEX*.jsonl row found here; verify the card at <a href='https://councilof.ai/gspc-verify'>gspc-verify</a> before quoting", "queue.jsonl"]);
      continue;
    }
    if (staged.length) {
      for (const c of staged) {
        const href = HC + "staged-unsigned/" + files.staged._day + "/" + esc(ax) + "/" + esc(c.card);
        rows.push([ax, "STAGED-UNSIGNED", "hits " + c.hits + " / n " + c.n + " (card bytes, not a score) · route " + (c.route || "—") + " · signature null · UNSIGNED — becomes MEASURED only after a VALID signature; nothing here is a rank · <a href='" + href + "'>" + esc(c.card) + "</a>", "staged-unsigned/" + files.staged._day + "/MANIFEST.json"]);
      }
      continue;
    }
    if (deadRow) { rows.push([ax, "DEAD", esc(deadRow.reason) + " — the mill cannot grade this id; not a judgement of the model", "staged-unsigned dead_slugs"]); continue; }
    if (!files.queue) { rows.push([ax, "UNCHECKABLE", "queue.jsonl failed to load", "—"]); continue; }
    if (qrow) { rows.push([ax, "QUEUED", "on the census, no card for this axis · a listing is not a grade", "queue.jsonl"]); continue; }
    rows.push([ax, "UNMEASURED", "not on the census list · empty is not zero", "—"]);
  }
  for (const [ax, state, detail, src] of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td class='mono'>" + esc(ax) + "</td><td class='st " + state + "'>" + state + "</td><td>" + detail + "</td><td>" + esc(src) + "</td>";
    tb.appendChild(tr);
  }
  t.hidden = false;
}

$("#f").addEventListener("submit", (e) => { e.preventDefault(); lookup($("#model").value); });
$("#refresh").addEventListener("click", async () => { $("#status").textContent = "Re-fetching public files …"; await loadAll(); lookup($("#model").value); });

(async () => {
  await loadAll();
  const q = new URLSearchParams(location.search).get("model");
  if (q) { $("#model").value = q; lookup(q); }
  else $("#status").textContent = "Files loaded. Type a Hub model id (owner/name) and press Look up.";
})();
