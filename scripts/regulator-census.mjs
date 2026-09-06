#!/usr/bin/env node
/**
 * regulator-census.mjs — which regulator doors are machine-readable, measured at run time.
 *
 * WHY. The obligations ledger points at regulators. A row that names a regulator is worth what
 * its door is worth: if the register behind it cannot be read by a machine, the row is a
 * citation, not evidence. Nothing was measuring which is which.
 *
 * WHAT IT WRITES: public/interop/regulator-census.json — one row per target with the exact URL
 * probed, the HTTP status, the content type, and where the door is readable, a COUNT derived
 * from the response itself. No count is typed here.
 *
 * A 200 IS NOT A DOOR. https://digital-strategy.ec.europa.eu/en/policies/ai-act answers HTTP 200
 * and serves a 404 PAGE — the status line and the body disagree, and only the body is the truth.
 * Every row therefore records a `body_check`: a string the real resource must contain, or a
 * parse that must succeed. A target whose body fails its check is UNRESOLVED, never READABLE.
 *
 * UNRESOLVED IS A RESULT. Three of six targets have no machine-readable door I could find. That
 * is the finding, not a gap in the file: an obligations row citing them cannot be backed by a
 * fetch today, and saying so is the whole point of measuring.
 *
 * Run:  node scripts/regulator-census.mjs [--out public/interop/regulator-census.json]
 * Exit: 0 always — this is a census, not a gate. The guard reads its output.
 */
const UA = {
  "user-agent": "csoai-regulator-census/0.1 (+https://councilof.ai; measurement, not scraping)",
  accept: "application/json, text/csv, text/xml;q=0.9, */*;q=0.5",
};

/**
 * Each target names the door, and how to tell a real response from a polite error page.
 * `count` runs only when `ok` passed; it derives the number from the body and never guesses.
 */
const TARGETS = [
  {
    id: "gleif-lei",
    regulator: "GLEIF (Global LEI Foundation)",
    what: "Legal Entity Identifiers — the register that maps a legal entity to an LEI",
    url: "https://api.gleif.org/api/v1/lei-records?page%5Bsize%5D=1",
    kind: "json-api",
    ok: (b) => !!b?.meta?.pagination?.total,
    count: (b) => ({ unit: "lei_records", value: b.meta.pagination.total }),
  },
  {
    id: "sec-edgar-companies",
    regulator: "US SEC (EDGAR)",
    what: "Every company with a ticker and a CIK",
    url: "https://www.sec.gov/files/company_tickers.json",
    kind: "json-file",
    ok: (b) => b && typeof b === "object" && Object.keys(b).length > 100,
    count: (b) => ({ unit: "companies_with_tickers", value: Object.keys(b).length }),
  },
  {
    id: "ofac-sdn",
    regulator: "US Treasury OFAC",
    what: "Specially Designated Nationals list",
    url: "https://www.treasury.gov/ofac/downloads/sdn.csv",
    kind: "csv",
    ok: (t) => typeof t === "string" && t.length > 100000,
    count: (t) => ({ unit: "sdn_rows", value: t.split("\n").filter((l) => l.trim()).length }),
  },
  {
    id: "eu-ai-act-art71-db",
    regulator: "European Commission",
    what: "Article 71 public database of high-risk AI systems",
    url: "https://digital-strategy.ec.europa.eu/en/policies/ai-act",
    kind: "html",
    // The page answers 200 and serves a 404 body. Recorded as the worked example of why a
    // status code is not a door.
    ok: (t) => typeof t === "string" && !/page not found|404/i.test(t.slice(0, 4000)),
    count: () => null,
    note: "Answers HTTP 200 and REDIRECTS to /en/page-not-found. No machine-readable Article 71 register found from outside.",
  },
  {
    id: "esma-mica-register",
    regulator: "ESMA",
    what: "MiCA registers (CASPs, white papers, Art. 59)",
    url: "https://registers.esma.europa.eu/publication/searchRegister?core=esma_registers_mica",
    kind: "html",
    ok: (t) => typeof t === "string" && /json|\"numFound\"/i.test(t.slice(0, 4000)),
    count: () => null,
    note: "Search UI only; no public JSON/solr endpoint found from outside the UI.",
  },
  {
    id: "ico-register",
    regulator: "UK ICO",
    what: "Register of data protection fee payers",
    url: "https://ico.org.uk/",
    kind: "html",
    ok: (t) => typeof t === "string" && /"total"|numFound/i.test(t.slice(0, 4000)),
    count: () => null,
    note: "Register search timed out on the entry endpoint; no bulk download URL confirmed.",
  },
];

/** Visible text only. A body check that reads raw HTML reads <head> boilerplate. */
function visible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Redirected to an error page? The FINAL url is often the plainest evidence there is. */
const ERROR_PATH = /page-not-found|\/404|\/error|not-?found/i;

async function probe(t) {
  const started = Date.now();
  let status = 0, contentType = "", body = null, text = "", error = null, finalUrl = t.url;
  try {
    const r = await fetch(t.url, { headers: UA, redirect: "follow" });
    status = r.status;
    finalUrl = r.url || t.url;
    contentType = (r.headers.get("content-type") || "").split(";")[0];
    text = await r.text();
    if (/json/.test(contentType)) { try { body = JSON.parse(text); } catch { body = null; } }
  } catch (e) {
    error = `${e.name}: ${e.message}`.slice(0, 120);
  }
  // THE CHECK THAT CAUGHT ME. My first cut scanned the first 4000 characters of raw HTML for
  // "404" or "page not found". The EC page carries neither there — it is <head> boilerplate —
  // so a 404 page was recorded READABLE, which is the exact defect this census exists to find,
  // committed by the census. Two cheap signals fix it and both are recorded in the output:
  // the FINAL url after redirects, and the VISIBLE text.
  const redirectedToError = ERROR_PATH.test(finalUrl);
  const vis = /html/.test(contentType) ? visible(text) : "";
  const looksLikeErrorPage = /^\s*(page not found|not found|error)/i.test(vis);
  const payload = body ?? (/html/.test(contentType) ? vis : text);
  const bodyOk = !error && status >= 200 && status < 400 && !redirectedToError && !looksLikeErrorPage
    && (() => { try { return !!t.ok(payload); } catch { return false; } })();
  let count = null;
  if (bodyOk) { try { count = t.count(payload); } catch { count = null; } }

  return {
    id: t.id,
    regulator: t.regulator,
    what: t.what,
    url: t.url,
    kind: t.kind,
    http_status: status || null,
    final_url: finalUrl !== t.url ? finalUrl : null,
    redirected_to_error_page: redirectedToError || looksLikeErrorPage || null,
    content_type: contentType || null,
    bytes: text.length || 0,
    // READABLE only when the BODY passed its own check. A 200 with an error page is UNRESOLVED.
    state: bodyOk ? "READABLE" : "UNRESOLVED",
    count,
    error,
    note: t.note ?? null,
    probed_ms: Date.now() - started,
  };
}

const out = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "public/interop/regulator-census.json";

const rows = [];
for (const t of TARGETS) rows.push(await probe(t));

const readable = rows.filter((r) => r.state === "READABLE");
const doc = {
  schema: "csoai.regulator-census/0.1",
  as_of: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  producer: "scripts/regulator-census.mjs",
  principle:
    "An obligations row that names a regulator is worth what its door is worth. This records " +
    "which registers a machine can actually read, and says UNRESOLVED where none was found.",
  method:
    "Each row is fetched at run time and its BODY is checked, not just its status line. " +
    "https://digital-strategy.ec.europa.eu/en/policies/ai-act answers HTTP 200 and serves a 404 " +
    "page; a census that trusted the status code would have recorded it as a working door.",
  not_claimed:
    "This measures reachability and record counts. It is not an assessment of any regulator, " +
    "not legal advice, and not a claim that a readable register is a complete one.",
  totals: {
    targets: rows.length,
    readable: readable.length,
    unresolved: rows.length - readable.length,
  },
  targets: rows,
};

const { writeFileSync, mkdirSync } = await import("node:fs");
const { dirname } = await import("node:path");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");

console.log(`${doc.totals.readable}/${doc.totals.targets} READABLE -> ${out}`);
for (const r of rows) {
  const c = r.count ? `${r.count.value.toLocaleString()} ${r.count.unit}` : (r.error ?? r.note ?? "");
  console.log(`  ${r.state.padEnd(10)} ${String(r.http_status ?? "-").padEnd(4)} ${r.id.padEnd(24)} ${c}`);
}
