// functions/api/report.ts — GET /api/report: one derived axis report, or the index.
//
//   GET /api/report                          -> /reports/index.json (every slot × subject pair that exists)
//   GET /api/report?subject=<slug|id>&axis=<slot> -> /reports/<slug>/<axis>.json
//
// The bytes are built at deploy time by scripts/build-axis-reports.mjs from the signed card
// corpus, the board slots and the regulator crosswalk; this handler only serves them. A pair
// that is not in the tree gets a 404 with an honest body: absence of a report is absence of a
// signed card for that pair, not a measurement of anything. Measurement, not certification.
//
// POST stays a 501 capability-state facade: nothing here persists a correction report.
// @openapi-post-not-implemented
import { unavailable } from "./_unavailable";
import { headFromGet } from "./_head";

type Env = { ASSETS?: { fetch: (r: Request) => Promise<Response> } };

const SAFE = /^[a-z0-9._-]{1,120}$/;
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
  "x-csoai-doctrine": "measurement, not certification; UNMEASURED is first-class",
};

// Same one-way rule as scripts/build-axis-reports.mjs slugify(): a caller may pass the
// subject id (qwen2.5:7b) or its slug (qwen2.5-7b) and reach the same file.
export const slugify = (id: string) => id.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");

async function readAsset(env: Env, request: Request, path: string): Promise<Response> {
  const req = new Request(new URL(path, request.url).toString(), { headers: { accept: "application/json" } });
  try {
    return env.ASSETS ? await env.ASSETS.fetch(req) : await fetch(req);
  } catch {
    return new Response(null, { status: 503 });
  }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const subjectRaw = url.searchParams.get("subject");
  const axis = url.searchParams.get("axis");

  if (!subjectRaw && !axis) {
    const r = await readAsset(env, request, "/reports/index.json");
    if (!r.ok) {
      return json({
        schema: "csoai.capability-state/0.1", endpoint: "/api/report", state: "INDEX_UNAVAILABLE",
        note: "The reports index was not served by this deployment. No report is implied by its absence.",
      }, 503);
    }
    return new Response(await r.text(), { status: 200, headers: HEADERS });
  }

  if (!subjectRaw || !axis) {
    return json({
      schema: "csoai.axis-report-error/0.1", endpoint: "/api/report", state: "BAD_REQUEST",
      note: "Pass both subject and axis, or neither for the index.",
      example: "/api/report?subject=qwen2.5-7b&axis=governance",
    }, 400);
  }

  const slug = slugify(subjectRaw);
  if (!SAFE.test(slug) || !SAFE.test(axis) || slug.includes("..") || axis.includes("..")) {
    return json({
      schema: "csoai.axis-report-error/0.1", endpoint: "/api/report", state: "BAD_REQUEST",
      note: "subject and axis must be short identifiers (a-z, 0-9, . _ -).",
    }, 400);
  }

  const r = await readAsset(env, request, `/reports/${slug}/${axis}.json`);
  if (!r.ok) {
    return json({
      schema: "csoai.axis-report-error/0.1", endpoint: "/api/report", state: "NOT_FOUND",
      subject: subjectRaw, subject_slug: slug, axis,
      note: "No report exists for this subject × axis pair. A missing report means the signed card corpus holds no card for the pair (or the axis is not a board slot); it is not a measurement, a zero, or a verdict. The index at /api/report lists every pair that exists.",
    }, 404);
  }
  return new Response(await r.text(), { status: 200, headers: HEADERS });
};

export const onRequestPost: PagesFunction = async () =>
  unavailable("/api/report", "Persist a correction report and return its durable reference");

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
