import { useEffect, useState } from "react";
import { Link } from "wouter";

/**
 * RegulatorFindings — the white-label regulator tooling front-end (the pivot surface).
 * Fetches /api/regulator-findings and renders an evidence-aware regulatory crosswalk.
 * A deployment description is context only. Scores appear only when an exact published
 * model id or signed-card digest resolves; mappings remain candidate findings requiring
 * replay and legal review. Measurement, not certification.
 */

interface Finding {
  axis?: string;
  article?: string;
  title?: string;
  obligation?: string;
  measured?: number | null;
  worst_measured?: number | null;
  n?: number | null;
  grade: string;
  note?: string;
  penalty_exposure?: string;
  axes?: string[];
}
type Payload = {
  schema?: string;
  deployment?: string;
  findings?: Finding[];
  articles?: Finding[];
  penalty_tiers?: Record<string, string>;
  verify_path?: string;
  note?: string;
  source_evidence_state?: "SIGNED" | "UNMEASURED";
  derived_findings_state?: "CANDIDATE_FINDING" | "UNMEASURED";
  deployment_binding_state?: "UNCHECKABLE" | "UNMEASURED";
  legal_review_required?: boolean;
  writes_board?: boolean;
  limitations?: string[];
};

const GRADE_COLOR: Record<string, string> = {
  CRITICAL: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  HIGH: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  MEDIUM: "text-yellow-300 border-yellow-500/40 bg-yellow-500/10",
  LOW: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  UNMEASURED: "text-slate-400 border-slate-600/40 bg-slate-600/10",
};

export default function RegulatorFindings() {
  const [mode, setMode] = useState<
    "axis" | "article" | "insurance" | "bond" | "cobol"
  >("axis");
  const [deployment, setDeployment] = useState("high-risk resume-screening");
  const [subject, setSubject] = useState("");
  const [card, setCard] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const query = new URLSearchParams({ deployment });
      if (subject.trim()) query.set("subject", subject.trim());
      if (card.trim()) query.set("card", card.trim());
      if (mode === "article") query.set("by", "article");
      else if (mode !== "axis") query.set("sector", mode);
      const url = `/api/regulator-findings?${query.toString()}`;
      const r = await fetch(url, { headers: { accept: "application/json" } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || d.error || `${r.status}`);
      setData(d);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const rows = data?.findings || data?.articles || [];
  const isArticle = mode === "article";

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/60">
        Council OS · white-label regulator tooling
      </p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">
        Sort every AI-compliance problem,{" "}
        <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
          before anyone is contacted.
        </span>
      </h1>
      <p className="mt-3 max-w-2xl text-emerald-100/80">
        Describe a deployment to map relevant obligations. Add an{" "}
        <b>exact published model id</b> or signed-card digest to attach existing
        GSPC evidence. The crosswalk never turns a description into a score or a
        legal conclusion.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(["axis", "article", "insurance", "bond", "cobol"] as const).map(
          (m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-full px-4 py-1.5 text-sm ${mode === m ? "bg-emerald-500 font-bold text-[#03110b]" : "border border-emerald-500/25 text-emerald-200/80"}`}
            >
              {m}
            </button>
          ),
        )}
        <input
          value={deployment}
          onChange={(e) => setDeployment(e.target.value)}
          aria-label="Deployment context"
          placeholder="deployment context"
          className="ml-auto w-64 rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-2 text-sm text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-label="Exact published model id"
          placeholder="exact model id (optional)"
          className="w-64 rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-2 text-sm text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none"
        />
        <input
          value={card}
          onChange={(e) => setCard(e.target.value)}
          aria-label="Exact signed card digest"
          placeholder="64-hex card digest (optional)"
          className="w-64 rounded-xl border border-emerald-500/30 bg-black/40 px-4 py-2 font-mono text-xs text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none"
        />
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Crosswalking…" : "Crosswalk evidence"}
        </button>
      </div>

      {err && <p className="mt-4 text-sm text-rose-400">{err}</p>}

      {!data && !err && (
        <div className="py-24 text-center text-emerald-200/60">
          Loading the signed findings…
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 font-mono text-sm">
              deployment:{" "}
              <b className="text-emerald-100">
                {data.deployment || deployment}
              </b>
            </span>
            <Link
              to={data.verify_path || "/gspc-verify"}
              className="ml-auto rounded-xl border border-emerald-500/25 px-4 py-2 text-sm text-emerald-200/80 hover:bg-emerald-500/10"
            >
              verify the signed data →
            </Link>
          </div>

          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <span className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
              source evidence:{" "}
              <b>{data.source_evidence_state || "UNMEASURED"}</b>
            </span>
            <span className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
              crosswalk: <b>{data.derived_findings_state || "UNMEASURED"}</b>
            </span>
            <span className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
              deployment binding:{" "}
              <b>{data.deployment_binding_state || "UNMEASURED"}</b>
            </span>
          </div>

          {data.limitations && data.limitations.length > 0 && (
            <details className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-100/80">
              <summary className="cursor-pointer font-bold">
                Evidence limits and legal-review boundary
              </summary>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                {data.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </details>
          )}

          {rows.length === 0 && (
            <p className="mt-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-6 text-center text-sm text-emerald-200/60">
              No obligations returned for this deployment. Try a broader
              description, or verify the signed data.
            </p>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {rows.map((f, i) => {
              const gradeColor = GRADE_COLOR[f.grade] || GRADE_COLOR.UNMEASURED;
              const label = isArticle ? f.article : f.axis;
              const measured = isArticle ? f.worst_measured : f.measured;
              const sub = isArticle ? f.title : f.obligation;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-emerald-500/15 bg-[#05140d] p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-mono text-lg font-bold text-emerald-100">
                      {label}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${gradeColor}`}
                    >
                      {f.grade}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-emerald-200/70">{sub}</p>
                  <p className="mt-3 font-mono text-2xl text-emerald-100">
                    {measured != null ? `${Math.round(measured * 100)}%` : "—"}
                  </p>
                  <p className="mt-2 text-xs text-emerald-300/60">
                    {f.note || "insufficient data — not a ranking"}
                  </p>
                  <p className="mt-2 text-xs text-emerald-300/50">
                    {f.penalty_exposure || f.axes
                      ? `exposure: ${f.penalty_exposure || "see /api/regulation"}${f.axes ? ` · ${f.axes.join(", ")}` : ""}`
                      : ""}
                  </p>
                </div>
              );
            })}
          </div>

          {data.penalty_tiers && (
            <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-xs text-emerald-300/60">
              <b className="text-emerald-200">Penalty tiers (EU AI Act):</b>{" "}
              {Object.entries(data.penalty_tiers)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </div>
          )}
          <p className="mt-6 text-center text-xs text-emerald-300/60">
            Read-only crosswalk. It never writes the GSPC board. Candidate
            findings require independent replay and legal review.{" "}
            <Link to="/challenge" className="underline hover:text-emerald-200">
              Challenge a measurement
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
