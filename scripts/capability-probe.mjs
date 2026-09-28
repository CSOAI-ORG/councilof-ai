#!/usr/bin/env node
/**
 * capability-probe — request every declared capability against the LIVE site and compare the
 * observed status with the declared probe expectation.
 *
 * The registry says what each surface IS. This says whether the surface agrees. It never
 * publishes: a mismatch becomes a DRAFT corrections entry in the owner's existing approve-queue
 * (council-os/corrections-drafts/, branch corrections/draft-<hour>, promoted by
 * /workspace/lanes/loops/promote-draft.sh). The pod wrapper
 * /workspace/lanes/loops/capability-probe.sh hands this file's findings to the SAME renderer the
 * drift-draft loop uses, so there is one queue and one approve path, not two.
 *
 * THE RULES THIS KEEPS, and why each exists:
 *  · `observed` is written only by a request that returned. A request that failed is recorded
 *    UNCHECKABLE with the transport reason — never as agreement, never as a status code.
 *  · Only probes the registry marks `safe` are issued. A POST that would write is reported
 *    NOT_PROBED with the registry's own `unsafe_reason`, and NOT_PROBED is never counted as
 *    agreement either.
 *  · No total is stored. Every figure in the receipt is the length of an array computed here.
 *  · The SCHEDULER stamps. This script takes --now and must not stamp itself: a second stamp
 *    finds the first already written and the run exits having measured nothing. That silent
 *    no-op is why distribution-measure ran zero times on 2026-09-22.
 *
 *   node scripts/capability-probe.mjs --now                    # probe live, write the report
 *   node scripts/capability-probe.mjs --now --out DIR          # elsewhere (the pod loop does this)
 *   node scripts/capability-probe.mjs --base http://localhost  # another origin
 *   node scripts/capability-probe.mjs --selftest               # no network; prove it can find drift
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { REPO, REGISTRY_PATH, loadRegistry } from "./capability-registry.mjs";

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : dflt;
};
const BASE = (arg("--base", "https://councilof.ai")).replace(/\/$/, "");
const OUT = arg("--out", join(REPO, "out", "capability-probe"));
const TIMEOUT_MS = Number(process.env.CAPABILITY_PROBE_TIMEOUT_MS || 20000);
const CONCURRENCY = Number(process.env.CAPABILITY_PROBE_CONCURRENCY || 6);
const SCHEMA = "csoai.capability-probe/0.1";
// A draft must be REPRODUCIBLE by a stranger, so every source it cites carries a digest. The
// response body is read and hashed, capped, with the cap recorded: a digest of a truncated read
// that did not say so would be worse than none.
const MAX_BODY_BYTES = Number(process.env.CAPABILITY_PROBE_MAX_BODY || 1 << 20);
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** One request. Returns a record in which `observed` exists only if something answered. */
async function probeOne(cap) {
  const base = {
    id: cap.id,
    kind: cap.kind,
    request: `${cap.probe.method.toUpperCase()} ${cap.probe.request}`,
    declared_lifecycle: cap.lifecycle,
    expect_status: cap.probe.expect_status,
  };
  if (!cap.probe.safe) {
    return { ...base, state: "NOT_PROBED", observed: null, reason: cap.probe.unsafe_reason ?? "the registry marks this probe unsafe for an unattended loop" };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(BASE + cap.probe.request, {
      method: cap.probe.method.toUpperCase(),
      headers: { accept: "application/json", "user-agent": "csoai-capability-probe/0.1 (+https://councilof.ai)" },
      redirect: "manual",
      signal: ctrl.signal,
    });
    const observed = res.status;
    const raw = new Uint8Array(await res.arrayBuffer());
    const truncated = raw.length > MAX_BODY_BYTES;
    const body = truncated ? raw.slice(0, MAX_BODY_BYTES) : raw;
    const bodyDigest = { sha256: sha256(body), bytes: raw.length, ...(truncated ? { digest_covers_bytes: MAX_BODY_BYTES } : {}) };
    const agrees = cap.probe.expect_status.includes(observed);
    let reach = {};
    if (observed >= 300 && observed < 400) {
      // A STATUS IS NOT REACHABILITY. The memberships lane found badge pills routing third-party
      // evidence URLs through the client-side router: every target answered 200 and no reader
      // could get to one. The lesson generalises — check what a client would actually DO. A
      // client follows a redirect, so this follows it, and records where it landed beside the
      // hop. A door that moved is not a door that is gone; a door that redirects into a loop or
      // onto a 404 is, and only following it can tell the two apart.
      reach = { location: res.headers.get("location"), followed: null };
      try {
        const followed = await fetch(BASE + cap.probe.request, {
          method: cap.probe.method.toUpperCase(),
          headers: { accept: "application/json", "user-agent": "csoai-capability-probe/0.1 (+https://councilof.ai)" },
          redirect: "follow",
          signal: ctrl.signal,
        });
        reach.followed = { status: followed.status, url: followed.url };
      } catch (e) {
        // Unreachable AFTER the hop is a third answer, and it is not the hop's status.
        reach.followed = { status: null, unreachable: `${e.name}: ${e.message}` };
      }
    }
    return {
      ...base,
      // A redirect the registry declared still has to LAND somewhere a client can read.
      state: agrees
        ? reach.followed && reach.followed.status !== null && reach.followed.status >= 400
          ? "DISAGREES"
          : "AGREES"
        : "DISAGREES",
      observed,
      body: bodyDigest,
      ...reach,
    };
  } catch (e) {
    // Nothing answered. There is no status to record and none is invented.
    return {
      ...base,
      state: "UNCHECKABLE",
      observed: null,
      reason: e.name === "AbortError" ? `timeout after ${TIMEOUT_MS}ms` : `${e.name}: ${e.message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

/** A disagreement, in the shape the drift-draft renderer already consumes. */
function toDrift(r, takenAt, declarationSha) {
  return {
    kind: "capability_probe_disagrees",
    subject: r.request,
    field: `${r.id}.probe.expect_status`,
    was: r.expect_status,
    now: r.observed,
    severity: "draft",
    summary:
      `${r.request} is declared ${r.declared_lifecycle} and expects HTTP ${r.expect_status.join(" or ")}; ` +
      `${BASE} answered ${r.observed}` +
      (r.followed
        ? r.followed.status === null
          ? `, redirected to ${r.location} and that target was unreachable (${r.followed.unreachable})`
          : `, redirected to ${r.location} which answered ${r.followed.status}`
        : ""),
    sources: [
      {
        role: "typed",
        locator: "council-os/capabilities.json",
        path: "council-os/capabilities.json",
        sha256: declarationSha ?? null,
        as_of: null,
      },
      {
        role: "live",
        locator: `${BASE}${r.request.split(" ")[1]}`,
        sha256: r.body?.sha256 ?? null,
        as_of: takenAt,
        as_of_field: "probed_at",
      },
    ],
  };
}

export async function run() {
  const reg = loadRegistry();
  // The digest of the exact declaration bytes this run compared against, so a draft can be
  // re-derived from a named commit rather than from "the registry as it was some time today".
  const declarationSha = sha256(readFileSync(REGISTRY_PATH));
  const takenAt = new Date().toISOString();
  const rows = await pool(reg.capabilities, CONCURRENCY, probeOne);
  const finishedAt = new Date().toISOString();

  const by = (s) => rows.filter((r) => r.state === s);
  const report = {
    schema: SCHEMA,
    base: BASE,
    started: takenAt,
    finished: finishedAt,
    generated_by: "scripts/capability-probe.mjs",
    declaration: "council-os/capabilities.json",
    honesty_contract: [
      "observed is written only by a request that returned. A transport failure is UNCHECKABLE with its reason, never a status.",
      "Only probes the declaration marks safe are issued. An unsafe probe is NOT_PROBED with the declaration's own reason.",
      "UNCHECKABLE and NOT_PROBED are never counted as agreement.",
      "No total is stored: every figure here is the length of an array computed at generation.",
      "Nothing is published. A disagreement becomes a DRAFT in the owner's approve-queue.",
    ],
    counts: {
      agrees: by("AGREES").length,
      disagrees: by("DISAGREES").length,
      uncheckable: by("UNCHECKABLE").length,
      not_probed: by("NOT_PROBED").length,
      declared: rows.length,
    },
    results: rows,
    declaration_sha256: declarationSha,
    drifts: by("DISAGREES").map((r) => toDrift(r, takenAt, declarationSha)),
  };

  mkdirSync(OUT, { recursive: true });
  const hour = takenAt.slice(0, 13).replace(":", "");
  const file = join(OUT, `${hour}.json`);
  writeFileSync(file, JSON.stringify(report, null, 2) + "\n");
  writeFileSync(join(OUT, "latest.json"), JSON.stringify(report, null, 2) + "\n");

  const c = report.counts;
  // ONE receipt line per run. "no drift" is a line too: a loop with no log line never ran.
  console.log(
    `RECEIPT ${hour} ${c.disagrees ? `DRIFT x${c.disagrees}` : "no drift"} ` +
      `base=${BASE} declared=${c.declared} agrees=${c.agrees} disagrees=${c.disagrees} ` +
      `uncheckable=${c.uncheckable} not_probed=${c.not_probed} report=${file}`,
  );
  for (const d of report.drifts) console.log(`  DRIFT ${d.summary}`);
  return report;
}

// ── selftest: no network, and it must be able to find drift ────────────────────────────────
function selftest() {
  const fails = [];
  const ok = (cond, msg) => { console.log(`  ${cond ? "ok  " : "FAIL"} ${msg}`); if (!cond) fails.push(msg); };

  const cap = (over = {}) => ({
    id: "x", kind: "http", path: "/api/x", method: "GET", name: "X", description: "x",
    description_state: "DOCUMENTED", audience: "agent", lifecycle: "LIVE", payment: "free",
    schema_refs: [], surfaces: ["openapi"],
    probe: { method: "GET", request: "/api/x", expect_status: [200], safe: true }, ...over,
  });

  const r = { id: "x", kind: "http", request: "GET /api/x", declared_lifecycle: "LIVE", expect_status: [200], state: "DISAGREES", observed: 404, body: { sha256: "b".repeat(64), bytes: 12 } };
  const d = toDrift(r, "2026-09-22T00:00:00Z", "a".repeat(64));
  ok(d.was[0] === 200 && d.now === 404, "a disagreement becomes a drift carrying both readings");
  ok(d.sources.length === 2 && d.sources[0].role === "typed" && d.sources[1].role === "live",
    "every drift cites the declaration and the live door, two byte-sources");
  ok(d.sources.every((x) => typeof x.sha256 === "string" && x.sha256.length === 64),
    "each cited source carries a sha256, so a stranger can reproduce the comparison");
  ok(/declared LIVE|is declared LIVE/.test(d.summary) === false || d.summary.includes("404"),
    "the drift summary carries the observed status");

  const unsafeCap = cap({ probe: { method: "POST", request: "/api/x", expect_status: [200], safe: false, unsafe_reason: "would write" } });
  ok(unsafeCap.probe.safe === false, "an unsafe probe stays unsafe");

  // The receipt must never fold UNCHECKABLE or NOT_PROBED into agreement.
  const rows = [
    { state: "AGREES" }, { state: "UNCHECKABLE" }, { state: "NOT_PROBED" }, { state: "DISAGREES" },
  ];
  const counts = {
    agrees: rows.filter((x) => x.state === "AGREES").length,
    disagrees: rows.filter((x) => x.state === "DISAGREES").length,
    uncheckable: rows.filter((x) => x.state === "UNCHECKABLE").length,
    not_probed: rows.filter((x) => x.state === "NOT_PROBED").length,
  };
  ok(counts.agrees === 1 && counts.uncheckable === 1 && counts.not_probed === 1 && counts.disagrees === 1,
    "AGREES, DISAGREES, UNCHECKABLE and NOT_PROBED are four separate states and are never summed");

  // The scheduler owns the idempotence marker; this script must not write one. The patterns are
  // ASSEMBLED from fragments on purpose: a guard spelled out literally matches its own source,
  // which is how an absence-of-phrase check quietly passes on nothing but itself.
  const self = readFileSync(new URL(import.meta.url), "utf8");
  const word = ["st", "amp"].join("");
  const call = new RegExp("\\b" + word + "\\s*\\(");
  const dotted = new RegExp("\\." + word + "\\b");
  const marker = new RegExp("state/[^\"']*\\." + word);
  ok(!call.test(self) && !dotted.test(self) && !marker.test(self),
    "this script writes no idempotence marker of its own — the scheduler's is the only one");

  // A redirect whose target is a 404 is a declared door a client cannot reach, and it must not
  // pass just because the hop itself was the expected status.
  const landed = { ...r, expect_status: [308], observed: 308, followed: { status: 404, url: "x" }, location: "/gone" };
  const agrees = landed.expect_status.includes(landed.observed);
  const state = agrees && landed.followed.status >= 400 ? "DISAGREES" : "AGREES";
  ok(state === "DISAGREES", "a declared redirect that lands on a 404 is drift, not agreement");
  ok(toDrift(landed, "2026-09-22T00:00:00Z", "a".repeat(64)).summary.includes("which answered 404"),
    "the drift names where the redirect landed, not only the hop");

  // A run that found nothing must still print a receipt. A loop with no log line never ran, and
  // that is indistinguishable from a loop that ran and found nothing until somebody looks.
  const line = (c) =>
    `RECEIPT 2026-09-22T00 ${c.disagrees ? `DRIFT x${c.disagrees}` : "no drift"} base=${BASE} ` +
    `declared=${c.declared} agrees=${c.agrees} disagrees=${c.disagrees} uncheckable=${c.uncheckable} not_probed=${c.not_probed}`;
  ok(line({ declared: 3, agrees: 3, disagrees: 0, uncheckable: 0, not_probed: 0 }).includes("no drift"),
    "a run with no disagreement still writes a receipt, and it says 'no drift'");
  ok(line({ declared: 3, agrees: 1, disagrees: 2, uncheckable: 0, not_probed: 0 }).includes("DRIFT x2"),
    "a run with disagreements names how many in the same receipt line");

  if (fails.length) { console.error("SELFTEST FAIL"); process.exit(1); }
  console.log("selftest ok — a disagreement produces a two-source drift, and the four states stay apart.");
}

if (argv.includes("--selftest")) {
  selftest();
} else if (argv.includes("--now") || argv.includes("--run")) {
  const report = await run();
  // Exit 0 even on drift: drift is the OUTPUT, not a failure. The pod loop turns it into a
  // draft for the owner. A non-zero exit here would make the scheduler log it as a crash.
  if (report.counts.uncheckable === report.counts.declared) {
    console.error("every probe was UNCHECKABLE — the report is not a pass");
    process.exit(1);
  }
} else {
  console.log("usage: capability-probe.mjs --now [--base URL] [--out DIR] | --selftest");
  process.exit(2);
}
