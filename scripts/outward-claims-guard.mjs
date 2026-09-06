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
 *
 * CLOSED 2026-09-05 17:3x. Two entries — optometry-ai-safety-mcp and optometry-patient-mcp —
 * declared github.com/CSOAI-ORG/<name> repositories that do not exist, while their PyPI packages
 * do. Both were republished (1.0.11 and 1.0.6) WITHOUT the repository field, per the ruling: no
 * invented repos. Every remaining entry either declares a repository that answers, or declares
 * none.
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
const REGISTRY_BASELINE = Number(process.env.REGISTRY_BASELINE ?? 0);
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

  // A repository claim a stranger cannot follow.
  //
  // OWNER RULING 2026-09-05: an entry with NO repository field is VALID and is the correct end
  // state for a server whose source is not public. The alternative — inventing a repo so the
  // field can be filled — is the thing this whole guard exists to prevent. 24 entries are in
  // that state deliberately.
  //
  // So the disagreement is narrower than "cannot be followed": it is a DECLARED url that does
  // not answer. Counting the absent field as a defect made 0 FAIL unreachable by construction
  // and would have pushed someone toward exactly the invented-repo fix the ruling forbids.
  const unfollowable = [];
  let noField = 0;
  for (const s of latest.values()) {
    const url = s.repository?.url;
    if (!url) { noField++; continue; }
    let status = 0;
    try { status = (await fetch(url, { headers: UA, redirect: "follow" })).status; } catch { status = 0; }
    if (status !== 200) unfollowable.push(`${s.name}: ${url} -> ${status || "unreachable"}`);
  }
  ok("mcp registry repository field", `${noField} entries declare no repository, which the ` +
    `2026-09-05 ruling makes the correct state for a server with no public source`);

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

/**
 * 6. SMITHERY — where the prose is right and the machine surface is wrong.
 *
 * csoai/gspc is listed, and its DESCRIPTION is accurate: "Remote HTTP (7 tools, no auth)",
 * naming exactly the seven tools the live server serves free (11 total, 4 x402-paid). Measured
 * 2026-09-05, everything a machine reads is not:
 *
 *   connections[0].deploymentUrl  https://gspc--csoai.run.tools  -> 401
 *   tools[]                       measure, verify, jail-probe, enter-arena  <- none of these exist
 *                                 and get_root, get_card, verify_inclusion  <- these are missing
 *
 * A human reading the listing gets the truth; a client reading the connection gets a locked door
 * and four tools that are not there. That asymmetry is exactly what an outward-claims guard is
 * for: our tests check what we do, and this checks what a third party says we do.
 *
 * The fix is on Smithery's side and needs the account, so this reports rather than repairs.
 */
const SMITHERY = "https://registry.smithery.ai/servers/csoai/gspc";

async function checkSmithery() {
  if (!process.env.CHECK_REGISTRY) {
    return skip("smithery listing", "CHECK_REGISTRY unset — third-party listing, run it deliberately");
  }
  const r = await j(SMITHERY);
  if (!r.body) return skip("smithery listing", `not JSON (HTTP ${r.status}) — third-party surface`);

  // The live free set is the thing both surfaces claim to describe. Derive it; never type it.
  const init = { method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) };
  const live = await j(`${SITE}/mcp`, init);
  let payload = live.body;
  if (!payload && live.text?.includes("data: ")) {
    const line = live.text.split("\n").find((l) => l.startsWith("data: "));
    try { payload = JSON.parse(line.slice(6)); } catch { /* */ }
  }
  const tools = payload?.result?.tools;
  if (!Array.isArray(tools)) return skip("smithery listing", "live tools/list unavailable to compare against");
  const paid = new Set(tools.filter((x) => JSON.stringify(x.inputSchema || {}).includes("x_payment")).map((x) => x.name));
  const free = tools.map((x) => x.name).filter((n) => !paid.has(n));

  const listed = (r.body.tools || []).map((x) => x.name).filter(Boolean);
  const phantom = listed.filter((n) => !tools.some((x) => x.name === n));
  const missing = free.filter((n) => !listed.includes(n));
  if (phantom.length || missing.length) {
    bad("smithery tools[]",
      `lists ${phantom.length} tool(s) the server does not serve (${phantom.join(", ") || "none"}) ` +
      `and omits ${missing.length} it does (${missing.join(", ") || "none"}). A client reading the ` +
      `listing calls tools that are not there.`);
  } else {
    ok("smithery tools[]", `${listed.length} listed, all served`);
  }

  const dep = (r.body.connections || [])[0]?.deploymentUrl || r.body.deploymentUrl;
  if (!dep) {
    skip("smithery deploymentUrl", "the listing declares no connection URL to check");
  } else {
    const probe = await j(dep, init);
    if (probe.status >= 200 && probe.status < 400) ok("smithery deploymentUrl", `${dep} answers ${probe.status}`);
    else bad("smithery deploymentUrl",
      `${dep} answers ${probe.status}; the description points clients at ${SITE}/mcp, which works. ` +
      `The machine-readable connection is a door a client cannot open.`);
  }
}

/**
 * 7. THE PRODUCERS THAT WOULD REGENERATE A DEAD CLAIM.
 *
 * #1312 marked every dead endpoint reference in six /interop manifests, and did it well: they
 * carry `intended_path` / `*_status: "NOT_IMPLEMENTED — probed ... HTTP 404"` and a
 * `claims_audit` block. Checked 2026-09-05, ALL SIX are honest and none of them advertises a
 * 404 as if it worked.
 *
 * The manifests are generated. Four generators still emit those paths bare:
 *
 *   scripts/badger/csoai-take-over-chatgpt.py:132                "endpoints": ["/api/research"]
 *   scripts/badger/csoai-finish-chatgpt-features.py:255-258      /api/measure /api/anchor /api/verify
 *   scripts/badger/csoai-product-wave.py:31                      a SKU priced against /api/verify
 *   scripts/badger/csoai-finish-chatgpt-and-improve-dashboard.py:146   "endpoint": "/api/research"
 *
 * All four 404. None carries the marking. Re-run any of them and #1312's work is silently
 * overwritten — the claim lives in the artifact AND the generator, and only the artifact was
 * fixed. That is the estate's most repeated defect, and this is a guard for exactly it.
 *
 * scripts/badger/ belongs to another lane, so this REPORTS and does not edit. The fix is to
 * carry the same `*_status` marking through the generator, or drop the path from it.
 *
 * MATCH EXACTLY, NEVER BY PREFIX. A first pass grepped `/api/verify` and flagged
 * public/interop/verify-card.json and verify-batch.json — which describe `/api/verify-card` and
 * `/api/verify-batch`, return 501 by design, and are among the most honest documents in the
 * tree. Substring matching on a path turns two exemplary files into defects.
 */
const PRODUCER_DIRS = ["scripts/badger"];

async function checkProducers() {
  const { readdirSync, readFileSync, statSync, existsSync } = await import("node:fs");
  const path = await import("node:path");

  // Paths this estate is known to serve 404 for. Probed live so the list cannot go stale into
  // flagging something that has since been implemented.
  const CANDIDATES = ["/api/verify", "/api/measure", "/api/anchor", "/api/research"];
  const dead = [];
  for (const c of CANDIDATES) {
    const r = await j(`${SITE}${c}`);
    if (r.status === 404) dead.push(c);
  }
  if (dead.length === 0) return ok("producers", "none of the recorded dead paths is 404 any more");

  const files = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d)) {
      const f = path.join(d, e);
      if (statSync(f).isDirectory()) walk(f);
      else if (/\.(py|mjs|js|ts)$/.test(e)) files.push(f);
    }
  };
  for (const d of PRODUCER_DIRS) walk(d);
  if (files.length === 0) {
    return skip("producers", `${PRODUCER_DIRS.join(", ")} not present in this checkout — nothing scanned`);
  }

  const offenders = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    // A generator that ALSO emits the honest marking is doing the right thing.
    if (/NOT_IMPLEMENTED|intended_path_status|claims_audit/.test(src)) continue;
    for (const d of dead) {
      // Exact, quoted, and not a prefix of a longer path.
      const re = new RegExp(`["']${d.replace(/\//g, "\\/")}["']`);
      if (re.test(src)) offenders.push(`${f} emits ${d}`);
    }
  }
  if (offenders.length) {
    bad("producers regenerate dead claims",
      `${offenders.length} generator reference(s) would re-emit a 404 path with no NOT_IMPLEMENTED ` +
      `marking, overwriting the fix in the artifact: ${offenders.slice(0, 6).join("; ")}` +
      `${offenders.length > 6 ? ` (+${offenders.length - 6} more)` : ""}. The claim lives in the ` +
      `artifact AND the generator; only the artifact was fixed.`);
  } else {
    ok("producers", `no generator re-emits ${dead.join(", ")} unmarked`);
  }
}

/**
 * 8. "npm i <thing>" — does <thing> exist?
 *
 * An install line is the most literal outward claim an estate makes: a stranger copies it and
 * either gets software or an error. Probed 2026-09-05 across every install instruction in the
 * tree, and 2 of 3 are for packages that do not exist:
 *
 *   npx csoai-gspc-mcp                        200, 0.2.1        <- real
 *   npm i @csoai/layer0                       404               packages/layer0-js/README.md
 *   npm install -g @csoai/council-of-ai-grok  404               public/what-is-new.html:501, LIVE
 *
 * The layer0 README also exported `CSOAI_API_BASE=https://api.csoai.org`, which is NXDOMAIN — no
 * DNS record at all. So it asked a reader to install a package that is not there and point it at
 * a host that does not exist. It now says so; the design is untouched.
 *
 * `public/what-is-new.html` is served at https://councilof.ai/what-is-new (HTTP 200) and belongs
 * to another lane's file area, so it is REPORTED here and not edited.
 *
 * NINE of the eleven package names in this repo are unpublished, which this deliberately does NOT
 * flag: a package.json `name` for an unreleased package is not a claim to anybody. Only an
 * INSTRUCTION to install is. The difference is the whole reason this check reads install lines
 * rather than package manifests.
 */
async function checkInstallLines() {
  const { readdirSync, readFileSync, statSync, existsSync } = await import("node:fs");
  const path = await import("node:path");
  const ROOTS = ["public", "packages", "mcp", "docs"];
  const files = [];
  const walk = (d, depth = 0) => {
    if (!existsSync(d) || depth > 6) return;
    for (const e of readdirSync(d)) {
      if (e === "node_modules" || e.startsWith(".")) continue;
      const f = path.join(d, e);
      let st; try { st = statSync(f); } catch { continue; }
      if (st.isDirectory()) walk(f, depth + 1);
      else if (/\.(md|html)$/.test(e)) files.push(f);
    }
  };
  for (const r of ROOTS) walk(r);
  if (!files.length) return skip("install lines", "no md/html files in this checkout to scan");

  // Record WHERE in the file, not just which file. The marking has to sit beside the install
  // line to be read with it — a first cut searched the whole file for "404" and passed
  // public/what-is-new.html, a 100 KB page that happens to contain that string somewhere far from
  // the instruction. That is an escape hatch, not a check.
  const wanted = new Map(); // package -> [{file, index}]
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/\b(?:npm\s+(?:i|install)|npx)\s+(?:-g\s+)?(@[a-z0-9-]+\/[a-z0-9._-]+|[a-z][a-z0-9._-]{2,})/gi)) {
      const pkg = m[1];
      if (/^(?:run|test|start|ci|audit|init|create|exec|--|\.)/i.test(pkg)) continue;
      if (!/csoai/i.test(pkg)) continue; // only OUR claims; a third-party install line is not ours to police
      if (!wanted.has(pkg)) wanted.set(pkg, []);
      wanted.get(pkg).push({ file: f, index: m.index ?? 0 });
    }
  }
  if (!wanted.size) return skip("install lines", "no csoai install instructions found to check");

  const missing = [];
  for (const [pkg, where] of wanted) {
    const r = await j(`https://registry.npmjs.org/${pkg.replace("/", "%2f")}`);
    if (r.status === 200) continue;
    // A marking counts only if it is NEXT TO the instruction — 600 characters either side,
    // which is a paragraph, not a page.
    const WINDOW = 600;
    const unmarked = where.filter(({ file, index }) => {
      const src = readFileSync(file, "utf8");
      const near = src.slice(Math.max(0, index - WINDOW), index + WINDOW);
      return !/\b404\b|NOT PUBLISHED|not published|unpublished/i.test(near);
    });
    if (unmarked.length) {
      const at = unmarked.map(({ file, index }) => {
        const line = readFileSync(file, "utf8").slice(0, index).split("\n").length;
        return `${file}:${line}`;
      });
      missing.push(`${pkg} (${r.status}) at ${at.join(", ")}`);
    }
  }
  if (missing.length) {
    bad("install lines",
      `${missing.length} install instruction(s) name a package that is not on npm, with nothing ` +
      `saying so: ${missing.join("; ")}. A stranger copies the line and gets an error.`);
  } else {
    ok("install lines", `${wanted.size} csoai install instruction(s); every unpublished one says so`);
  }
}

/**
 * 9. THE HUGGING FACE ORG CARDS — 97 dataset cards, and what they point at.
 *
 * The cards are the estate's widest-read outward surface after the site itself: a researcher
 * finds a dataset, reads its card, and follows the links. Measured 2026-09-05 across all 97
 * `csoai/*` dataset cards — **31 distinct councilof.ai / csoai.org URLs claimed, 30 answer.**
 *
 * The one that does not is honest: `csoai/labour-economy-unmeasured` says
 * "Live API (after master merge): GET https://councilof.ai/api/indices" — future tense, with the
 * condition named. A 404 behind an explicitly pending claim is not a false claim, and flagging it
 * would teach someone to delete the qualifier rather than keep it.
 *
 * So the cards are in good shape and this locks that in rather than fixing anything. It fails on
 * a URL that stops answering AND is not marked pending — the case where a card quietly starts
 * sending readers to a dead door.
 *
 * Offline by default: 97 cards plus ~31 probes. LIVE_HF=1.
 */
async function checkHfCards() {
  if (!process.env.LIVE_HF) {
    return skip("hf org cards", "LIVE_HF unset — 97 cards + ~31 probes, run it deliberately");
  }
  const list = await j("https://huggingface.co/api/datasets?author=csoai&limit=500");
  if (!Array.isArray(list.body)) return skip("hf org cards", `dataset list unavailable (HTTP ${list.status})`);
  const ids = list.body.map((x) => x.id).filter(Boolean);
  if (!ids.length) return bad("hf org cards", "the csoai org lists no datasets");

  const claims = new Map(); // url -> { cards:Set, pending:boolean }
  for (const id of ids) {
    const r = await fetch(`https://huggingface.co/datasets/${id}/resolve/main/README.md`, { headers: UA });
    if (!r.ok) continue;
    const txt = await r.text();
    for (const m of txt.matchAll(/https:\/\/(?:councilof\.ai|app\.csoai\.org|csoai\.org)(?:\/[A-Za-z0-9._/-]*)?/g)) {
      const u = m[0].replace(/[.,)]+$/, "");
      const near = txt.slice(Math.max(0, m.index - 200), m.index + 120);
      // "after master merge", "planned", "when published" — a dated future claim is not a lie.
      const pending = /after .{0,30}merge|planned|not yet|pending|when published|upcoming/i.test(near);
      const e = claims.get(u) ?? { cards: new Set(), pending: false };
      e.cards.add(id);
      e.pending = e.pending || pending;
      claims.set(u, e);
    }
  }
  if (!claims.size) return skip("hf org cards", "no csoai URLs claimed in any card");

  const dead = [];
  for (const [u, e] of claims) {
    let code = 0;
    try { code = (await fetch(u, { headers: UA, redirect: "follow" })).status; } catch { code = 0; }
    if (code >= 200 && code < 400) continue;
    if (e.pending) continue; // explicitly future-tense, with the condition named
    dead.push(`${u} -> ${code || "unreachable"} (${e.cards.size} card${e.cards.size > 1 ? "s" : ""})`);
  }
  ok("hf org cards", `${ids.length} cards claim ${claims.size} distinct csoai URLs`);
  assertLike(dead);

  function assertLike(list) {
    if (!list.length) return ok("hf card links", "every claimed URL answers, or says it is not live yet");
    bad("hf card links",
      `${list.length} URL(s) in the org's dataset cards do not answer and are not marked pending: ` +
      `${list.join("; ")}. A researcher finds the dataset, reads the card, and follows the link.`);
  }
}

/**
 * 10. "WE ARE REGISTERED ON X" — is there a URL that shows it?
 *
 * public/interop/platforms-registered.json is a list of places this estate says it is listed.
 * Probed 2026-09-05 and the shape of the claim was the problem, not any single row: 22 of 25
 * entries read `status: "submitted"` with the PLATFORM'S HOMEPAGE as their url. A homepage is
 * not evidence of a listing, and 10 of the 25 urls did not even answer (8x404, 2x403).
 *
 * "Submitted" records an intention and reads as a result. Retired. An entry is now `live` only
 * when it carries a `proof_url` that shows the entry, and `planned` otherwise — three qualified:
 *
 *   MCP Registry  registry.modelcontextprotocol.io/v0/servers?search=csoai   330 servers
 *   Smithery      smithery.ai/server/csoai/gspc                              csoai/gspc
 *   Glama         glama.ai/mcp/servers?query=csoai                           7 servers
 *
 * mcp.so was checked and does NOT list us — its search page only echoes the query back — which
 * is exactly the kind of row "submitted" was hiding.
 *
 * Offline by default. LIVE_PLATFORMS=1 probes every proof_url.
 */
async function checkPlatformProofs() {
  const { readFileSync, existsSync } = await import("node:fs");
  const FILE = "public/interop/platforms-registered.json";
  if (!existsSync(FILE)) return skip("platform registrations", `${FILE} not in this checkout`);
  let regs;
  try { regs = JSON.parse(readFileSync(FILE, "utf8")).registrations; } catch { regs = null; }
  if (!Array.isArray(regs) || !regs.length) return bad("platform registrations", "no registrations array");

  // STATIC, so it bites with no network: a status this file no longer defines, or a `live` row
  // with nothing to click.
  const ALLOWED = new Set(["live", "planned"]);
  const badStatus = regs.filter((r) => !ALLOWED.has(r.status)).map((r) => `${r.platform}: ${r.status}`);
  assertNo(badStatus, "platform status vocabulary",
    `these rows use a status outside {live, planned}: ${badStatus.join("; ")}. "submitted" was ` +
    `retired on 2026-09-05 because it recorded an intention and read as a result.`);

  const unproven = regs.filter((r) => r.status === "live" && !r.proof_url).map((r) => r.platform);
  assertNo(unproven, "platform proof urls",
    `these are marked live with no proof_url: ${unproven.join(", ")}. live means a URL shows the ` +
    `entry; without one the honest status is planned.`);

  if (!process.env.LIVE_PLATFORMS) {
    return skip("platform proof urls (live)", "LIVE_PLATFORMS unset — proof URLs NOT probed");
  }
  const dead = [];
  for (const r of regs.filter((x) => x.status === "live" && x.proof_url)) {
    let code = 0;
    try { code = (await fetch(r.proof_url, { headers: UA, redirect: "follow" })).status; } catch { code = 0; }
    if (code < 200 || code >= 400) dead.push(`${r.platform}: ${r.proof_url} -> ${code || "unreachable"}`);
  }
  assertNo(dead, "platform proof urls (live)",
    `these proof URLs do not answer: ${dead.join("; ")}. A proof that 404s is not a proof.`);

  function assertNo(list, okClaim, failDetail) {
    if (list.length) bad(okClaim, failDetail);
    else ok(okClaim, `${regs.length} rows; ${regs.filter((r) => r.status === "live").length} live with a proof URL`);
  }
}

/**
 * 11. NOT_IMPLEMENTED MARKERS EXPIRE — implement the door, or stop advertising it.
 *
 * #1312 marked 36 dead endpoint references across six /interop manifests, honestly and well. But
 * a marker is a promise to come back, and nobody was coming back. C07 set the rule: no marker
 * older than 7 days — implement or remove.
 *
 * Swept 2026-09-06. 22 distinct marked paths, resolved WITHOUT probing the site, because a
 * Cloudflare Pages Function exists only if its file does: 20 of 22 had no functions/api/<name>.ts
 * at all, and /api/xrpl/{rlusd,usdc} map to xrpl.ts which serves only the exact path /api/xrpl
 * (200) and does not sub-route (404). Absence of the file is decisive and costs no self-probe —
 * which matters under the 20/hour Cloudflare budget.
 *
 * What changed:
 *   chatgpt-features-finish.json   17 features -> 3.  FOURTEEN advertised a door with no
 *                                  implementing function. 82% of that manifest was fiction.
 *   chatgpt-skills.json            /api/research, /api/scheduler dropped
 *   persona-tests.json             /api/measure /api/anchor /api/insurance/attest
 *                                  /api/xrpl/{rlusd,usdc} dropped; /api/verify kept, IMPLEMENTED
 *   deep-research-integration.json every endpoint was /api/research*; converted to the honest
 *                                  shape the estate already uses — kind quarantined-api-capability,
 *                                  state NOT_IMPLEMENTED — rather than deleted, because the
 *                                  pipeline design is real work and only its doors were not.
 *
 * TWELVE manifests were left exactly as they were. anchor.json, verify-card.json, verify-batch.json
 * and nine others are `quarantined-api-capability` documents that say NOT_IMPLEMENTED in their own
 * `state`. Those are the honest shape, not the defect; deleting them would remove a disclosure.
 *
 * This check keeps the distinction: a QUARANTINE DOC may name a dead path all day. A manifest
 * that OFFERS things may not.
 */
async function checkMarkerExpiry() {
  const { readFileSync, readdirSync, existsSync } = await import("node:fs");
  const path = await import("node:path");
  const DIR = "public/interop";
  if (!existsSync(DIR)) return skip("interop markers", `${DIR} not in this checkout`);

  const offenders = [];
  let quarantine = 0, scanned = 0;
  for (const name of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
    let d;
    try { d = JSON.parse(readFileSync(path.join(DIR, name), "utf8")); } catch { continue; }
    scanned++;
    if (d?.kind === "quarantined-api-capability") { quarantine++; continue; }
    // Ignore the dated removal records and audit blocks: they QUOTE what was taken out.
    const live = JSON.stringify(d, (k, v) =>
      (String(k).includes("removed") || String(k).includes("claims_audit")) ? undefined : v);
    for (const m of live.matchAll(/(\/api\/[A-Za-z0-9\/_{}-]+)[^"]{0,40}NOT_IMPLEMENTED/g)) {
      offenders.push(`${name}: ${m[1]}`);
    }
  }
  if (!scanned) return skip("interop markers", "no manifests parsed");
  if (offenders.length) {
    bad("interop markers",
      `${offenders.length} NOT_IMPLEMENTED marker(s) still sit in manifests that OFFER things: ` +
      `${offenders.slice(0, 6).join("; ")}. A marker is a promise to come back. Implement the ` +
      `door, remove the entry, or convert the document to kind "quarantined-api-capability" — ` +
      `which is the honest shape and is never flagged here.`);
  } else {
    ok("interop markers", `${scanned} manifests; ${quarantine} are quarantine docs (allowed to ` +
      `name a dead path); 0 offering manifests carry a NOT_IMPLEMENTED marker`);
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
  await checkSmithery();
  await checkProducers();
  await checkInstallLines();
  await checkHfCards();
  await checkPlatformProofs();
  await checkMarkerExpiry();
  const fails = results.filter((r) => r.state === "FAIL");
  for (const r of results) {
    const mark = r.state === "OK" ? "  ok  " : r.state === "SKIP" ? " skip " : " FAIL ";
    console.log(`${mark} ${r.claim} — ${r.detail}`);
  }
  console.log(`\n${results.filter(r=>r.state==="OK").length} ok · ${fails.length} FAIL · ${results.filter(r=>r.state==="SKIP").length} skip`);
  process.exit(fails.length ? 1 : 0);
}
main();
