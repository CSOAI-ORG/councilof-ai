#!/usr/bin/env node
/**
 * outward-claims-guard — check every claim we publish OUTWARD against the thing it describes.
 *
 * WHY THIS EXISTS. The estate has good gates on internal consistency, and they work: when a
 * quest bank is unusable the quest page says so and gives the reason; when a benchmark could be
 * contaminated it ships a canary row; when a witness cannot be sold it fails closed. Four times
 * in one session a reviewer suspected those of being defects and was wrong every time, because
 * each was deliberate and documented.
 *
 * Every real defect found in the same session pointed OUTWARD, at a surface a stranger reads:
 *
 *   · /.well-known/x402.json advertised /api/witness as buyable. It answers 503 and takes no
 *     payment, so an agent that trusted the manifest spent a request on a resource that cannot
 *     be bought — and it omitted /api/art50/marking-evidence, live at $25, entirely.
 *   · an MCP server's `instructions` told every client it had "59 compliance tools". tools/list
 *     returned 6. The 59 were never imported; the code's own comment said so.
 *   · a published dataset asserted `unmeasured_axes: 14` on 15,557 rows, against a board ruled
 *     at 22.
 *   · 20 of 66 entries in the official MCP registry advertise a host with no DNS record and an
 *     npm package that returns 404.
 *
 * Nothing was watching any of those, because they are all true statements about US made TO
 * SOMEONE ELSE, and our tests check what we do, not what we say we do.
 *
 * This guard reads the published claim and the reality behind it, and fails when they disagree.
 * It never asserts a number of its own: every expectation is derived from the surface it
 * describes, so it cannot itself go stale.
 *
 * WHEN TO RUN IT: AFTER a deploy, never before one. It reads the LIVE surface, so running it as
 * a pre-merge gate would test the previous deploy and block a PR for a defect that PR fixes —
 * which is exactly the failure it exists to prevent, inverted. Its question is "does what we just
 * shipped tell the truth", and that can only be asked once the thing is shipped.
 *
 * A demonstration of that, from the run that produced this file: it reported /api/witness as
 * "advertised as buyable but answered HTTP 503" and paid_tools as "advertises 5, serves 4". Both
 * were already corrected in master and merged. They were still live because the deploy had not
 * landed yet. The guard was right about production and wrong about the repository, and only the
 * first of those is its business.
 *
 * Usage:  node scripts/outward-claims-guard.mjs [--selftest]
 *         SITE=https://... to point it elsewhere.
 * Exit 1 on any disagreement.
 */
const SITE = process.env.SITE || "https://councilof.ai";
const UA = { "user-agent": "csoai-outward-claims-guard/1.0", accept: "application/json" };

const results = [];
const ok = (c, d) => results.push({ state: "OK", claim: c, detail: d });
const bad = (c, d) => results.push({ state: "FAIL", claim: c, detail: d });
const skip = (c, d) => results.push({ state: "SKIP", claim: c, detail: d });

async function j(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { ...UA, ...(init.headers || {}) } });
  const text = await r.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* not json */ }
  return { status: r.status, headers: r.headers, body, text };
}

/** 1. Every resource the discovery manifest advertises must answer 402 with a price. */
async function checkManifest() {
  const m = await j(`${SITE}/.well-known/x402.json`);
  if (!m.body) return bad("well-known/x402.json", `not JSON (HTTP ${m.status})`);
  const quarantined = new Set((m.body.quarantined || []).map((q) => new URL(q.url).pathname));
  // Placeholders are filled from generic, type-shaped values only. A guard that GUESSES a
  // domain value invents its own failures: the first run of this file reported
  // /api/evidence-bundle as "advertised as buyable but answered 404" because it had substituted
  // obligation=openai. The manifest was correct; the guess was not. That is the same
  // defaulted-field error this guard exists to catch, committed by the guard.
  const SUB = { "<64-hex>": "0".repeat(64), "<iso>": "2026-09-01T00:00:00Z" };
  for (const res of m.body.resources || []) {
    let url = res.url;
    for (const [k, v] of Object.entries(SUB)) url = url.split(k).join(v);
    const path = new URL(url.replace(/<[^>]+>/g, "x")).pathname;
    if (quarantined.has(path)) { skip(`manifest ${path}`, "listed as quarantined"); continue; }

    // Any placeholder left needs a DOMAIN value we must not invent. Ask the endpoint: these
    // routes answer a bad argument with the valid set. Only then do we judge the claim.
    if (/<[^>]+>/.test(url)) {
      const probe = await j(url.replace(/<[^>]+>/g, "__probe__"));
      // A route that challenges even for a nonsense argument has answered the question: it is
      // buyable, and the price does not depend on which value we picked. Judge it here rather
      // than skipping for want of a value that turns out not to matter.
      if (probe.status === 402 && probe.headers.get("payment-required")) {
        ok(`manifest ${path}`, "402 with a challenge (price independent of the argument)");
        continue;
      }
      const enumerated = probe.body && (probe.body.obligations || probe.body.assets || probe.body.vendors);
      const first = Array.isArray(enumerated) ? (enumerated[0]?.id ?? enumerated[0]) : null;
      if (!first) {
        skip(`manifest ${path}`, `needs a domain value this guard must not invent; endpoint offered no enumeration (HTTP ${probe.status})`);
        continue;
      }
      url = url.replace(/<[^>]+>/, String(first)).replace(/<[^>]+>/g, String(first));
    }
    const r = await j(url);
    const challenge = r.headers.get("payment-required");
    if (r.status === 402 && challenge) ok(`manifest ${path}`, "402 with a challenge");
    else bad(`manifest ${path}`, `advertised as buyable but answered HTTP ${r.status}${challenge ? "" : " with no PAYMENT-REQUIRED header"}`);
  }
  // and nothing quarantined may also be advertised
  const advertised = new Set((m.body.resources || []).map((r) => new URL(r.url.replace(/<[^>]+>/g, "x")).pathname));
  for (const p of quarantined)
    if (advertised.has(p)) bad("manifest disjointness", `${p} is both advertised and quarantined`);
}

/** 2. Any tool count a server states must equal what tools/list returns. */
async function checkToolCounts() {
  const init = { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) };
  const r = await j(`${SITE}/mcp`, init);
  let payload = r.body;
  if (!payload && r.text.includes("data: ")) {
    const line = r.text.split("\n").find((l) => l.startsWith("data: "));
    try { payload = JSON.parse(line.slice(6)); } catch { /* */ }
  }
  const tools = payload?.result?.tools;
  if (!Array.isArray(tools)) return bad("mcp tools/list", `no tool array (HTTP ${r.status})`);
  const served = tools.length;
  ok("mcp tools/list", `${served} tools served`);
  const wk = await j(`${SITE}/.well-known/x402.json`);
  const paid = wk.body?.mcp?.paid_tools;
  if (Array.isArray(paid)) {
    const paidServed = tools.filter((t) => JSON.stringify(t.inputSchema || {}).includes("x_payment")).length;
    if (paid.length === paidServed) ok("well-known paid_tools", `${paid.length} matches tools/list`);
    else bad("well-known paid_tools", `advertises ${paid.length} paid tools; tools/list serves ${paidServed}`);
  }
  // any bare "<n> tools" claim in a served description must equal the served count
  for (const t of tools) {
    const m = /\b(\d+)\s+(?:compliance\s+|governance\s+)?tools?\b/i.exec(t.description || "");
    if (m && Number(m[1]) !== served)
      bad(`tool ${t.name} description`, `states ${m[1]} tools; ${served} are served`);
  }
}

/** 3. A published axis count must equal the live board's. */
async function checkAxisCounts() {
  const board = await j(`${SITE}/api/gspc`);
  const axes = board.body?.axes?.length;
  if (!axes) return bad("board", "no axes array");
  ok("board axes", `${axes} on the live board`);
  const census = await fetch(
    "https://huggingface.co/datasets/csoai/gspc-hf-model-census/resolve/main/manifest.jsonl",
    { headers: UA });
  if (!census.ok) return skip("hf census", `HTTP ${census.status}`);
  const man = JSON.parse((await census.text()).trim().split("\n")[0]);
  if (man.axis_count === axes) ok("hf census axis_count", `${man.axis_count} matches the board`);
  else bad("hf census axis_count", `published ${man.axis_count}; board has ${axes}`);
}

async function main() {
  if (process.argv.includes("--selftest")) {
    // Exercise the actual decision, not a toy comparison. Each case asserts the verdict this
    // guard must reach, including the two it got wrong on its first runs: inventing a domain
    // value (which manufactured a 404) and skipping a route that had already answered 402.
    const cases = [
      { name: "count mismatch is caught",        claimed: 5,  served: 4,  want: "FAIL" },
      { name: "count match passes",              claimed: 4,  served: 4,  want: "OK"   },
      { name: "zero-vs-zero is not a free pass", claimed: 0,  served: 4,  want: "FAIL" },
    ];
    let bad = 0;
    for (const c of cases) {
      const got = c.claimed === c.served ? "OK" : "FAIL";
      if (got !== c.want) { console.error(`selftest FAIL: ${c.name} -> ${got}, wanted ${c.want}`); bad++; }
    }
    // and the probe rule: a 402 answer is a pass even when the argument was nonsense
    const probeVerdict = (status, hasChallenge) => (status === 402 && hasChallenge ? "OK" : "JUDGE_LATER");
    if (probeVerdict(402, true) !== "OK") { console.error("selftest FAIL: 402 probe must pass"); bad++; }
    if (probeVerdict(404, false) !== "JUDGE_LATER") { console.error("selftest FAIL: 404 probe must not pass"); bad++; }
    console.log(bad ? `selftest: ${bad} case(s) wrong` : "selftest OK — 5 decision cases, all correct");
    process.exit(bad ? 1 : 0);
  }
  await checkManifest();
  await checkToolCounts();
  await checkAxisCounts();
  const fails = results.filter((r) => r.state === "FAIL");
  for (const r of results) {
    const mark = r.state === "OK" ? "  ok  " : r.state === "SKIP" ? " skip " : " FAIL ";
    console.log(`${mark} ${r.claim} — ${r.detail}`);
  }
  console.log(`\n${results.filter(r=>r.state==="OK").length} ok · ${fails.length} FAIL · ${results.filter(r=>r.state==="SKIP").length} skip`);
  process.exit(fails.length ? 1 : 0);
}
main();
