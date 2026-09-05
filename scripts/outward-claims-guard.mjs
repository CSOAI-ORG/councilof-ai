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
  // The census's axis claim lives in the ROWS, not in a summary. manifest.jsonl used to open
  // with a summary object carrying `axis_count`; on 2026-09-05 it became a per-file listing
  // (file/bytes/sha256/url), and this check read `undefined` off line 1 and called it a wrong
  // number. It was an ABSENT field, and absent is not zero and not wrong — the published claim
  // was correct throughout (README: "22-axis canon"; every row: unmeasured_axes 22).
  //
  // So it now reads the claim a consumer actually consumes: the first row of models.jsonl,
  // fetched with a Range header because the file is 14.7 MB and no check needs all of it. A
  // shape it cannot parse is a SKIP with the reason, never a FAIL.
  const CENSUS = "https://huggingface.co/datasets/csoai/gspc-hf-model-census/resolve/main/models.jsonl";
  const census = await fetch(CENSUS, { headers: { ...UA, Range: "bytes=0-4000" } });
  if (!census.ok && census.status !== 206) return skip("hf census", `HTTP ${census.status}`);
  let row;
  try { row = JSON.parse((await census.text()).split("\n")[0]); } catch { row = null; }
  const claimed = row && (row.measured_axes ?? 0) + (row.unmeasured_axes ?? NaN);
  if (!row || !Number.isFinite(claimed)) {
    skip("hf census axes", "models.jsonl row carries no measured/unmeasured axis counts to compare");
  } else if (claimed === axes) {
    ok("hf census axes", `${row.measured_axes} measured + ${row.unmeasured_axes} unmeasured = ${axes}, matches the board`);
  } else {
    bad("hf census axes", `rows account for ${claimed} axes (${row.measured_axes} measured + ${row.unmeasured_axes} unmeasured); the board has ${axes}`);
  }
}

/**
 * 4. THE OFFICIAL MCP REGISTRY — the outward surface with the widest reach and no watcher.
 *
 * registry.modelcontextprotocol.io is where a stranger discovers this estate. Every entry
 * carries a `repository.url`, and a client that wants to read the source before running a server
 * follows it. Measured 2026-09-05 across all 330 distinct `io.github.CSOAI-ORG/*` servers:
 *
 *   248/248 PyPI packages sampled exist, at the EXACT advertised version.  <- packages are sound
 *    37/330 repository claims a stranger cannot follow, of a 248-server sample triaged by hand:
 *           11 repointable — CSOAI-ORG/<name> exists and is public
 *               · 5 declare github.com/CSAO-ORG/... — a typo for CSOAI-ORG
 *               · 6 declare no repository field at all
 *           23 have no public repo under either name
 *
 * The first walk of this said 248 servers and 34 unfollowable. It stopped at ten pages and never
 * checked whether the cursor was exhausted, so it measured a prefix and reported it as a total.
 * The walk below refuses to report a count at all if pagination has not terminated.
 *
 * A 404 on github.com also means PRIVATE, so every verdict here was taken with an authenticated
 * API call, not an anonymous fetch. Treating a private repo as an absent one would have
 * condemned working entries.
 *
 * WHAT THIS CAN AND CANNOT FIX. The entries are published from 248 separate server repositories,
 * not from this one, so their producer is out of reach here and the repoints need the owner's
 * publishing token. This check makes the disagreement VISIBLE and non-ignorable, which is the
 * whole job of an outward-claims guard: the estate's own tests check what we do, not what we say
 * about ourselves somewhere else.
 *
 * BASELINE, not a target. It fails when the count goes UP, so a new bad entry cannot arrive
 * unnoticed, and it fails when the count goes DOWN without this number being lowered, so a fix
 * cannot be quietly un-recorded. Set REGISTRY_BASELINE=n to move it deliberately.
 */
const REGISTRY_BASELINE = Number(process.env.REGISTRY_BASELINE ?? 37);
const REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers";

/** Semver-ish compare. Version parts are NUMBERS: "1.0.9" must lose to "1.0.10". */
function cmpVersion(a, b) {
  const pa = String(a ?? "0").split(/[.\-]/).map((x) => (/^\d+$/.test(x) ? Number(x) : 0));
  const pb = String(b ?? "0").split(/[.\-]/).map((x) => (/^\d+$/.test(x) ? Number(x) : 0));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/**
 * ONE walk, used by every registry check.
 *
 * It exists as a helper because the two checks that need it were written separately and drifted
 * immediately: the second one collected every row instead of the latest per name and reported the
 * SAME server twice, once per published version. Two copies of a subtle rule is two chances to
 * get it wrong, and this rule has already been got wrong twice —
 *
 *   · "last page wins" is not "latest version": pages are not version-ordered, and some later
 *     rows are OLDER entries carrying less metadata. That reported 57 unfollowable against 37.
 *   · stopping at a fixed page count reports a PREFIX as a total. That reported 330 as 248.
 *
 * Returns null when the walk did not terminate, so a caller cannot accidentally report a
 * partial count as a whole one.
 */
async function walkRegistry() {
  const latest = new Map();
  let cursor = null;
  for (let page = 0; page < 40; page++) {
    const u = `${REGISTRY}?search=csoai&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const r = await j(u);
    if (!r.body?.servers) return { error: `no server list (HTTP ${r.status})` };
    for (const row of r.body.servers) {
      const s = row.server ?? row;
      if (!String(s.name || "").startsWith("io.github.CSOAI-ORG/")) continue;
      const held = latest.get(s.name);
      if (!held || cmpVersion(s.version, held.version) > 0) latest.set(s.name, s);
    }
    cursor = r.body.metadata?.nextCursor;
    if (!cursor) return { latest };
  }
  return { error: "pagination did not terminate after 40 pages — any count from it would be a prefix" };
}

async function checkRegistry() {
  if (!process.env.CHECK_REGISTRY) {
    return skip("mcp registry", "CHECK_REGISTRY unset — ~330 servers is ~330 requests, run it deliberately");
  }
  const walk = await walkRegistry();
  if (walk.error) return bad("mcp registry", walk.error);
  const { latest } = walk;
  if (latest.size === 0) return bad("mcp registry", "the search returned no CSOAI servers at all");
  ok("mcp registry", `${latest.size} distinct servers listed`);

  // A repository claim a stranger cannot follow. Anonymous GET is enough to detect it;
  // distinguishing "private" from "absent" needs a token and is a triage step, not a gate.
  const unfollowable = [];
  for (const s of latest.values()) {
    const url = s.repository?.url;
    if (!url) { unfollowable.push(`${s.name}: no repository field`); continue; }
    let status = 0;
    try { status = (await fetch(url, { headers: UA, redirect: "follow" })).status; } catch { status = 0; }
    if (status !== 200) unfollowable.push(`${s.name}: ${url} -> ${status || "unreachable"}`);
  }

  const n = unfollowable.length;
  if (n > REGISTRY_BASELINE) {
    bad("mcp registry repository claims",
      `${n} entries advertise a repository a stranger cannot follow, up from ${REGISTRY_BASELINE}. ` +
      `New: ${unfollowable.slice(0, 6).join("; ")}${n > 6 ? ` (+${n - 6} more)` : ""}`);
  } else if (n < REGISTRY_BASELINE) {
    bad("mcp registry repository claims",
      `${n} unfollowable, DOWN from ${REGISTRY_BASELINE} — good, but lower REGISTRY_BASELINE to ` +
      `${n} in the same change, or the next regression hides inside the old allowance.`);
  } else {
    ok("mcp registry repository claims", `${n} unfollowable, unchanged from the recorded baseline`);
  }
}

/**
 * 5. A PUBLISHED TOOL COUNT vs THE TOOLS ACTUALLY SERVED.
 *
 * This is the defect that started the guard, in its original form: an MCP server's description
 * told every client it had "59 compliance tools" and tools/list returned 6. It is checked here
 * for the entries that CAN be checked — the ones publishing a streamable-http remote, which is
 * the only kind whose tools/list a stranger can call without installing anything.
 *
 * FAILING RIGHT NOW, 2026-09-05, and it is ours:
 *
 *   registry io.github.CSOAI-ORG/gspc @ 1.2.0   "12 tools (7 free, 5 x402)"
 *   live https://councilof.ai/mcp               11 tools, 4 of them paid
 *   repo mcp/gspc-server/server.json @ 1.3.0    "11 HTTP tools (7 free, 4 x402)"   <- correct
 *
 * The repository is right and the published entry is a version behind, so nothing needs editing
 * in the server: 1.3.0 needs PUBLISHING. That is an owner-token action, drafted rather than done.
 *
 * A stdio/pypi entry cannot be checked this way and is not guessed at — it is counted and
 * reported, so the limit of this check is visible instead of being mistaken for a clean result.
 */
async function checkPublishedToolCounts() {
  if (!process.env.CHECK_REGISTRY) {
    return skip("published tool counts", "CHECK_REGISTRY unset — needs the registry listing");
  }
  const walk = await walkRegistry();
  if (walk.error) return bad("published tool counts", walk.error);
  // LATEST per name, not every row. A client reads the current listing; reporting a superseded
  // version's count is noise that hides the one that matters.
  const seen = [...walk.latest.values()];
  const stated = seen.filter((s) => /\b\d+\s+(?:compliance\s+|governance\s+)?tools?\b/i.test(s.description || ""));
  const callable = stated.filter((s) => (s.remotes || []).some((r) => /http/i.test(r.type || "")));
  const uncheckable = stated.length - callable.length;

  if (stated.length === 0) return skip("published tool counts", "no listed entry states a tool count");
  ok("published tool counts", `${stated.length} entries state a count; ${callable.length} expose an HTTP remote` +
     (uncheckable ? `; ${uncheckable} are stdio-only and cannot be checked without installing them` : ""));

  for (const s of callable) {
    const remote = (s.remotes || []).find((r) => /http/i.test(r.type || ""));
    const claimed = Number(/\b(\d+)\s+(?:compliance\s+|governance\s+)?tools?\b/i.exec(s.description)[1]);
    const init = { method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) };
    const r = await j(remote.url, init);
    let payload = r.body;
    if (!payload && r.text?.includes("data: ")) {
      const line = r.text.split("\n").find((l) => l.startsWith("data: "));
      try { payload = JSON.parse(line.slice(6)); } catch { /* */ }
    }
    const tools = payload?.result?.tools;
    if (!Array.isArray(tools)) {
      skip(`${s.name} tool count`, `${remote.url} returned no tool array (HTTP ${r.status}) — cannot compare`);
      continue;
    }
    if (tools.length === claimed) {
      ok(`${s.name} tool count`, `states ${claimed}, serves ${tools.length}`);
    } else {
      bad(`${s.name} tool count`,
        `the registry entry (v${s.version}) states ${claimed} tools; ${remote.url} serves ${tools.length}. ` +
        `A client that reads the listing budgets for tools that are not there.`);
    }
  }
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
    // The registry baseline rule, in both directions. A known-failures number that only ever
    // gets compared upward lets a FIXED entry keep its allowance, and the next regression hides
    // inside it. Both drift directions are a FAIL; only equality is OK.
    const baselineVerdict = (n, base) => (n === base ? "OK" : "FAIL");
    const baseCases = [
      { name: "unchanged count passes",        n: 37, base: 37, want: "OK"   },
      { name: "a new bad entry fails",         n: 38, base: 37, want: "FAIL" },
      { name: "a fix without lowering fails",  n: 30, base: 37, want: "FAIL" },
    ];
    for (const c of baseCases) {
      const got = baselineVerdict(c.n, c.base);
      if (got !== c.want) { console.error(`selftest FAIL: registry ${c.name} -> ${got}, wanted ${c.want}`); bad++; }
    }

    // An incomplete walk must never produce a count. The first version of checkRegistry stopped
    // at ten pages and reported the prefix as a total: 248 servers when there were 330.
    const walkVerdict = (cursorLeft) => (cursorLeft ? "FAIL" : "REPORT");
    if (walkVerdict("io.github.CSOAI-ORG/x:1.0.0") !== "FAIL") { console.error("selftest FAIL: an unterminated walk must not report"); bad++; }
    if (walkVerdict(null) !== "REPORT") { console.error("selftest FAIL: a completed walk must report"); bad++; }

    // Latest-version selection. Pages are NOT version-ordered; last-wins reported 57
    // unfollowable against a true 37, because some later rows are OLDER entries with less
    // metadata.
    const cmpV = (a, b) => {
      const pa = String(a ?? "0").split(/[.\-]/).map((x) => (/^\d+$/.test(x) ? Number(x) : 0));
      const pb = String(b ?? "0").split(/[.\-]/).map((x) => (/^\d+$/.test(x) ? Number(x) : 0));
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] ?? 0) - (pb[i] ?? 0); if (d) return d; }
      return 0;
    };
    if (!(cmpV("1.1.14", "1.0.15") > 0)) { console.error("selftest FAIL: 1.1.14 must beat 1.0.15"); bad++; }
    if (!(cmpV("1.2.0", "1.3.0") < 0))   { console.error("selftest FAIL: 1.2.0 must lose to 1.3.0"); bad++; }
    if (!(cmpV("1.0.9", "1.0.10") < 0))  { console.error("selftest FAIL: version parts are numbers, not strings"); bad++; }

    console.log(bad ? `selftest: ${bad} case(s) wrong` : "selftest OK — 13 decision cases, all correct");
    process.exit(bad ? 1 : 0);
  }
  await checkManifest();
  await checkToolCounts();
  await checkAxisCounts();
  await checkRegistry();
  await checkPublishedToolCounts();
  const fails = results.filter((r) => r.state === "FAIL");
  for (const r of results) {
    const mark = r.state === "OK" ? "  ok  " : r.state === "SKIP" ? " skip " : " FAIL ";
    console.log(`${mark} ${r.claim} — ${r.detail}`);
  }
  console.log(`\n${results.filter(r=>r.state==="OK").length} ok · ${fails.length} FAIL · ${results.filter(r=>r.state==="SKIP").length} skip`);
  process.exit(fails.length ? 1 : 0);
}
main();
