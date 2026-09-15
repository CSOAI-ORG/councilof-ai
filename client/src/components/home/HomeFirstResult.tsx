import { useEffect, useState } from "react";
import { Link } from "wouter";
import { learningScenarioUrl } from "@/components/DashboardLearningPane";
import { boardAxisLabel } from "@/components/home/HomeGspcBoard";
import { loadGspcBoard, orderedRows, type GspcAxis } from "@/components/board/useGspcBoard";

/**
 * HomeFirstResult — ONE concrete, inspectable result on the first screen.
 *
 * EVERY FIELD IS READ AT RENDER TIME. The row comes off GET /api/gspc (the first
 * ordered row whose status is MEASURED); the record comes off
 * GET /api/learning-scenarios?axis=… (the first published measurement whose
 * signature verified). Nothing here is typed: no subject, no date, no figure.
 * If either read fails the panel says so and stands empty — UNAVAILABLE is a
 * state, not a failure to render.
 *
 * WHAT THE PANEL SAYS. Subject, the question the frozen bank asked, the date the
 * run was observed, the scope (one model, one bank, n items, one date) and the
 * evidence links. "Signature verified" is named as exactly that: an integrity
 * check under the published key, not a truth, safety or conformity verdict.
 */

type Measurement = {
  subject?: { kind?: string; id?: string };
  accuracy?: number;
  measured_on?: string;
  card?: string;
  card_url?: string;
  signature_verified?: boolean;
};

type ScenarioReply = {
  schema?: string;
  scenarios?: Array<{ axis?: string; evidence?: { published_measurements?: Measurement[] } }>;
};

type Loaded =
  | { state: "READING" }
  | { state: "UNAVAILABLE"; why: string }
  | { state: "READY"; row: GspcAxis; record: Measurement };

export function firstMeasuredRow(rows: GspcAxis[]): GspcAxis | null {
  return rows.find((r) => String(r.status || "").trim() === "MEASURED") ?? null;
}

export function firstVerifiedRecord(list: Measurement[] | undefined): Measurement | null {
  if (!Array.isArray(list)) return null;
  return (
    list.find(
      (m) => m.signature_verified === true && typeof m.card_url === "string" && typeof m.measured_on === "string",
    ) ?? null
  );
}

function readableDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) + " (UTC)";
}

export default function HomeFirstResult() {
  const [loaded, setLoaded] = useState<Loaded>({ state: "READING" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const board = await loadGspcBoard();
        const row = firstMeasuredRow(orderedRows(board));
        if (!row) throw new Error("GET /api/gspc published no MEASURED row");
        const url = learningScenarioUrl(row.axis, typeof window === "undefined" ? undefined : window.location.hostname);
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
        const body = (await res.json()) as ScenarioReply;
        const scenario = body.scenarios?.find((s) => s.axis === row.axis);
        const record = firstVerifiedRecord(scenario?.evidence?.published_measurements);
        if (!record) throw new Error(`no signature-verified published measurement for ${row.axis}`);
        if (!cancelled) setLoaded({ state: "READY", row, record });
      } catch (error) {
        if (!cancelled) setLoaded({ state: "UNAVAILABLE", why: error instanceof Error ? error.message : String(error) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-labelledby="home-first-result-h"
      data-testid="home-first-result"
      data-state={loaded.state}
      className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_44px_-32px_rgba(4,18,12,.45)] sm:p-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">One result you can inspect</p>
      <h2 id="home-first-result-h" className="mt-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
        {loaded.state === "READY"
          ? `${loaded.record.subject?.id ?? "subject not published"} on ${loaded.row.bench || boardAxisLabel(loaded.row.axis)}`
          : loaded.state === "READING"
            ? "Reading the live board…"
            : "No result could be read live"}
      </h2>

      {loaded.state === "READY" ? (
        <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-500">Subject</dt>
            <dd className="mt-0.5 font-mono text-slate-900">
              {loaded.record.subject?.id ?? "not published"}
              <span className="ml-2 font-sans text-xs text-slate-500">{loaded.record.subject?.kind ?? ""}</span>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Question tested</dt>
            <dd className="mt-0.5 text-slate-900">
              {loaded.row.task || "task not published"}
              <span className="ml-2 text-xs text-slate-500">frozen bank: {loaded.row.bench || "not published"}</span>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Observed</dt>
            <dd className="mt-0.5 text-slate-900">
              <time dateTime={loaded.record.measured_on}>{readableDate(loaded.record.measured_on as string)}</time>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Scope</dt>
            <dd className="mt-0.5 text-slate-900">
              One model, one dated run on the {boardAxisLabel(loaded.row.axis)} axis
              {typeof loaded.row.n === "number" ? ` · bank of ${loaded.row.n} items` : " · n not published"}
              {typeof loaded.record.accuracy === "number" ? ` · accuracy ${(loaded.record.accuracy * 100).toFixed(1)}%` : ""}
              . Not a ranking, not a certificate.
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-slate-500">Evidence</dt>
            <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <a href={loaded.record.card_url} className="font-semibold text-emerald-800 underline underline-offset-4">
                Signed card (JSON)
              </a>
              <Link href="/gspc-verify" className="font-semibold text-emerald-800 underline underline-offset-4">
                Verify it in your browser
              </Link>
              <Link href={`/dashboard?tab=learn`} className="font-semibold text-emerald-800 underline underline-offset-4">
                Read the axis context
              </Link>
            </dd>
          </div>
          <div className="sm:col-span-2 text-xs leading-relaxed text-slate-500">
            Signature verified for this record — an integrity check under the published key. It does not establish
            measurement validity, root inclusion, a timestamp, safety, factual accuracy or legal conformity; each of
            those is a separate check with its own outcome.
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          {loaded.state === "READING"
            ? "GET /api/gspc, then the first signature-verified published measurement on its first MEASURED row."
            : `UNAVAILABLE — ${loaded.why}. No figure on this page stands in for the board.`}
        </p>
      )}
    </section>
  );
}
